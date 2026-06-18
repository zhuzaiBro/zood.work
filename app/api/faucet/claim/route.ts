import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { ethers } from 'ethers'
import { RELAYER_CONFIG } from '@/lib/faucet/relayer'
import type { FaucetNetworkId } from '@/lib/faucet/networks'

const FAUCET_ABI = [
  'function claim(address recipient) external',
  'function remainingWeeklyAllowance(address user) view returns (uint256)',
  'function claimAmount() view returns (uint256)',
]

const RATE_LIMIT_SECONDS = 60

export async function POST(request: Request) {
  try {
    const { walletAddress, network = 'sepolia' } = await request.json()

    if (!walletAddress || !ethers.isAddress(walletAddress)) {
      return NextResponse.json({ error: '无效的钱包地址' }, { status: 400 })
    }

    if (!(network in RELAYER_CONFIG)) {
      return NextResponse.json({ error: '不支持的区块链网络' }, { status: 400 })
    }

    const config = RELAYER_CONFIG[network as FaucetNetworkId]
    const privateKey = process.env[config.privateKeyEnv]

    if (!privateKey) {
      console.error(`Missing ${config.privateKeyEnv}`)
      return NextResponse.json({ error: '服务器配置错误' }, { status: 500 })
    }

    const normalizedAddress = ethers.getAddress(walletAddress)
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'unknown'

    let supabase
    try {
      supabase = createAdminClient()
    } catch (adminError) {
      console.error('Admin client init error:', adminError)
      return NextResponse.json({ error: '服务器配置错误' }, { status: 500 })
    }

    const rateLimitTime = new Date(Date.now() - RATE_LIMIT_SECONDS * 1000).toISOString()
    const { data: recentRequests, error: rateLimitError } = await supabase
      .from('faucet_claims')
      .select('id')
      .eq('wallet_address', normalizedAddress.toLowerCase())
      .gte('created_at', rateLimitTime)

    if (rateLimitError) {
      console.error('Rate limit check error:', rateLimitError)
      return NextResponse.json({ error: '数据库查询错误' }, { status: 500 })
    }

    // if (recentRequests && recentRequests.length > 0) {
    //   return NextResponse.json({ error: `请求过于频繁，请 ${RATE_LIMIT_SECONDS} 秒后再试` }, { status: 429 })
    // }

    const provider = new ethers.JsonRpcProvider(config.rpcUrl)
    const relayer = new ethers.Wallet(privateKey, provider)
    const contract = new ethers.Contract(config.contractAddress, FAUCET_ABI, relayer)

    const remaining: bigint = await contract.remainingWeeklyAllowance(normalizedAddress)
    if (remaining === BigInt(0)) {
      return NextResponse.json({ error: '本周领取额度已用完，请 7 天后再试' }, { status: 400 })
    }

    const claimAmount: bigint = await contract.claimAmount()

    const tempTxHash = `pending_${network}_${Date.now()}_${Math.random().toString(36).slice(2)}`
    const { data: insertedRecord, error: insertError } = await supabase
      .from('faucet_claims')
      .insert({
        wallet_address: normalizedAddress.toLowerCase(),
        ip_address: ip,
        amount: Number(ethers.formatEther(claimAmount)),
        tx_hash: tempTxHash,
      })
      .select('id')
      .single()

    // if (insertError) {
    //   if (insertError.code === '23505') {
    //     return NextResponse.json({ error: '请勿重复请求' }, { status: 400 })
    //   }
    //   console.error('Insert pending record error:', insertError)
    //   return NextResponse.json(
    //     {
    //       error: '数据库写入错误',
    //       details: insertError.message,
    //       hint: insertError.hint ?? undefined,
    //     },
    //     { status: 500 }
    //   )
    // }

    const recordId = insertedRecord?.id

    try {
      const tx = await contract.claim(normalizedAddress, {
        ...(config.chainId ? { chainId: config.chainId } : {}),
      })
      const receipt = await tx.wait()

      if (recordId) {
        await supabase
          .from('faucet_claims')
          .update({ tx_hash: receipt.hash })
          .eq('id', recordId)
      }

      return NextResponse.json({
        success: true,
        tx_hash: receipt.hash,
        amount: ethers.formatEther(claimAmount),
        recipient: normalizedAddress,
        network,
      })
    } catch (txError) {
      if (recordId) {
        await supabase.from('faucet_claims').delete().eq('id', recordId)
      }
      throw txError
    }
  } catch (error: unknown) {
    console.error('Faucet relay claim error:', error)

    let message = '领取失败，请稍后重试'
    if (error instanceof Error) {
      if (error.message.includes('WeeklyLimitExceeded')) {
        message = '本周领取额度已用完，请 7 天后再试'
      } else if (error.message.includes('InsufficientBalance')) {
        message = '水龙头余额不足，请稍后再试'
      } else {
        message = error.message
      }
    }

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
