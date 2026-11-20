import { NextResponse } from 'next/server'
import { ethers } from 'ethers'
import { platformServer, PlatformError } from '@/lib/platform/server'
import { RELAYER_CONFIG } from '@/lib/faucet/relayer'
import type { FaucetNetworkId } from '@/lib/faucet/networks'

const FAUCET_ABI = [
  'function claim(address recipient) external',
  'function remainingWeeklyAllowance(address user) view returns (uint256)',
  'function claimAmount() view returns (uint256)',
]

async function releaseReservation(id: string) {
  await platformServer(`/api/platform/faucet/reservations/${id}`, { method: 'DELETE' })
}

export async function POST(request: Request) {
  let reservationId: string | null = null

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

    const provider = new ethers.JsonRpcProvider(config.rpcUrl)
    const relayer = new ethers.Wallet(privateKey, provider)
    const contract = new ethers.Contract(config.contractAddress, FAUCET_ABI, relayer)

    const remaining: bigint = await contract.remainingWeeklyAllowance(normalizedAddress)
    if (remaining === BigInt(0)) {
      return NextResponse.json({ error: '本周领取额度已用完，请 7 天后再试' }, { status: 400 })
    }

    const claimAmount: bigint = await contract.claimAmount()

    const reserved = await platformServer<{ reservation?: { id?: string } }>(
      '/api/platform/faucet/reservations',
      {
        method: 'POST',
        body: { walletAddress: normalizedAddress.toLowerCase(), network },
      },
    )
    reservationId = reserved.reservation?.id ?? null
    if (!reservationId) {
      return NextResponse.json({ error: '数据库写入错误' }, { status: 500 })
    }

    try {
      const tx = await contract.claim(normalizedAddress, {
        ...(config.chainId ? { chainId: config.chainId } : {}),
      })
      const receipt = await tx.wait()

      try {
        await platformServer(`/api/platform/faucet/reservations/${reservationId}/confirm`, {
          method: 'POST',
          body: { txHash: receipt.hash },
        })
      } catch (confirmError) {
        console.error('Failed to confirm faucet reservation', {
          wallet: normalizedAddress,
          tx: receipt.hash,
          recordId: reservationId,
          error: confirmError,
        })
      }
      reservationId = null

      return NextResponse.json({
        success: true,
        tx_hash: receipt.hash,
        amount: ethers.formatEther(claimAmount),
        recipient: normalizedAddress,
        network,
      })
    } catch (txError) {
      if (reservationId) {
        await releaseReservation(reservationId)
        reservationId = null
      }
      throw txError
    }
  } catch (error: unknown) {
    console.error('Faucet relay claim error:', error)

    if (reservationId) {
      try {
        await releaseReservation(reservationId)
      } catch (cleanupError) {
        console.error('Failed to cleanup pending record:', cleanupError)
      }
    }

    if (error instanceof PlatformError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

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
