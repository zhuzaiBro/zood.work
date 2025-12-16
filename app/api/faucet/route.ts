import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ethers } from 'ethers';

// 使用公共 RPC 节点，生产环境建议使用 Alchemy 或 Infura 的私有节点以保证稳定性
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';
const FAUCET_AMOUNT = "0.1"; // 每次领取数量
const DAILY_LIMIT = 2.0; // 每天最大累计领取量

export async function POST(request: Request) {
  try {
    // 1. 获取参数和 IP
    const { walletAddress } = await request.json();
    
    // 获取真实 IP (根据部署环境可能需要调整，如 x-real-ip)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';

    // 2. 基础验证
    if (!walletAddress || !ethers.isAddress(walletAddress)) {
      return NextResponse.json({ error: '无效的钱包地址' }, { status: 400 });
    }

    const supabase = await createClient();

    // 3. 检查钱包是否已领取 (Wallet Check)
    const { data: walletClaim, error: walletCheckError } = await supabase
      .from('faucet_claims')
      .select('id')
      .eq('wallet_address', walletAddress)
      .maybeSingle();

    if (walletCheckError) {
      console.error('Database error (wallet check):', walletCheckError);
      return NextResponse.json({ error: '数据库查询错误' }, { status: 500 });
    }

    if (walletClaim) {
      return NextResponse.json({ error: '该钱包地址已领取过测试币' }, { status: 400 });
    }

    // 4. 检查 IP 是否已领取 (IP Check)
    // 注意：如果没有获取到有效 IP ('unknown')，出于安全考虑可能需要拒绝，或者允许但风险自担。
    // 这里严格执行：如果 IP 存在且已领取，则拒绝。
    if (ip !== 'unknown') {
      const { data: ipClaim, error: ipCheckError } = await supabase
        .from('faucet_claims')
        .select('id')
        .eq('ip_address', ip)
        .maybeSingle();

      if (ipCheckError) {
        console.error('Database error (ip check):', ipCheckError);
        return NextResponse.json({ error: '数据库查询错误' }, { status: 500 });
      }

      if (ipClaim) {
        return NextResponse.json({ error: '该 IP 地址已领取过测试币' }, { status: 400 });
      }
    }

    // 5. 检查全网/全局每日限额 (Daily Limit)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: dailyClaims, error: sumError } = await supabase
      .from('faucet_claims')
      .select('amount')
      .gte('created_at', oneDayAgo);

    if (sumError) {
      console.error('Database error (daily limit):', sumError);
      return NextResponse.json({ error: '数据库查询错误' }, { status: 500 });
    }

    // @ts-ignore
    const totalClaimed = dailyClaims?.reduce((sum, claim) => sum + Number(claim.amount), 0) || 0;

    if (totalClaimed + Number(FAUCET_AMOUNT) > DAILY_LIMIT) {
      return NextResponse.json({ error: '今日测试币发放已达上限，请明天再来' }, { status: 429 });
    }

    // 6. 发送交易
    const privateKey = process.env.SEPOLIA_CALIM_PK;
    if (!privateKey) {
      console.error('Missing SEPOLIA_CALIM_PK environment variable');
      return NextResponse.json({ error: '服务器配置错误' }, { status: 500 });
    }

    const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
    const wallet = new ethers.Wallet(privateKey, provider);

    // 构建交易
    const tx = await wallet.sendTransaction({
      to: walletAddress,
      value: ethers.parseEther(FAUCET_AMOUNT),
    });

    // 7. 记录到数据库
    // @ts-ignore
    const { error: insertError } = await supabase.from('faucet_claims').insert({
      wallet_address: walletAddress,
      ip_address: ip,
      amount: Number(FAUCET_AMOUNT),
      tx_hash: tx.hash
    });

    if (insertError) {
      console.error('Critical Error: Failed to record successful claim', {
        wallet: walletAddress,
        tx: tx.hash,
        error: insertError
      });
      // 虽然数据库写入失败，但币已经发了。返回成功并附带 hash。
    }

    return NextResponse.json({ 
      success: true, 
      message: '领取成功',
      tx_hash: tx.hash,
      amount: FAUCET_AMOUNT
    });

  } catch (error: any) {
    console.error('Faucet processing error:', error);
    return NextResponse.json({ 
      error: '领取失败，请稍后重试', 
      details: error.message 
    }, { status: 500 });
  }
}

