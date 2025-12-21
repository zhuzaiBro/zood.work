import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ethers } from 'ethers';

// 使用公共 RPC 节点，生产环境建议使用 Alchemy 或 Infura 的私有节点以保证稳定性
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';
const FAUCET_AMOUNT = "0.1"; // 每次领取数量
const DAILY_LIMIT = 2.0; // 每天最大累计领取量
const RATE_LIMIT_SECONDS = 60; // 请求频率限制：60秒内同一IP/地址只能请求一次

export async function POST(request: Request) {
  let pendingRecordId: string | null = null;
  
  try {
    // 1. 获取参数和 IP
    const { walletAddress } = await request.json();
    
    // 获取真实 IP (根据部署环境可能需要调整，如 x-real-ip)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown';

    // 2. 基础验证
    if (!walletAddress || !ethers.isAddress(walletAddress)) {
      return NextResponse.json({ error: '无效的钱包地址' }, { status: 400 });
    }

    const supabase = await createClient();

    // 3. 快速检查：钱包是否已领取
    const { data: walletClaim, error: walletCheckError } = await supabase
      .from('faucet_claims')
      .select('id, created_at')
      .eq('wallet_address', walletAddress)
      .maybeSingle();

    if (walletCheckError) {
      console.error('Database error (wallet check):', walletCheckError);
      return NextResponse.json({ error: '数据库查询错误' }, { status: 500 });
    }

    if (walletClaim) {
      return NextResponse.json({ error: '该钱包地址已领取过测试币' }, { status: 400 });
    }

    // 4. 快速检查：IP 是否已领取
    if (ip !== 'unknown') {
      const { data: ipClaim, error: ipCheckError } = await supabase
        .from('faucet_claims')
        .select('id, created_at')
        .eq('ip_address', ip)
        .maybeSingle();

      if (ipCheckError) {
        console.error('Database error (ip check):', ipCheckError);
        return NextResponse.json({ error: '数据库查询错误' }, { status: 500 });
      }

      if (ipClaim) {
        return NextResponse.json({ error: '该 IP 地址已领取过测试币' }, { status: 400 });
      }

      // 5. 请求频率限制：检查同一IP在最近N秒内是否有请求
      const rateLimitTime = new Date(Date.now() - RATE_LIMIT_SECONDS * 1000).toISOString();
      const { data: recentIpRequests, error: rateLimitError } = await supabase
        .from('faucet_claims')
        .select('id')
        .eq('ip_address', ip)
        .gte('created_at', rateLimitTime);

      if (rateLimitError) {
        console.error('Database error (rate limit check):', rateLimitError);
        return NextResponse.json({ error: '数据库查询错误' }, { status: 500 });
      }

      if (recentIpRequests && recentIpRequests.length > 0) {
        return NextResponse.json({ 
          error: `请求过于频繁，请等待 ${RATE_LIMIT_SECONDS} 秒后再试` 
        }, { status: 429 });
      }
    }

    // 6. 请求频率限制：检查同一钱包地址在最近N秒内是否有请求
    const rateLimitTime = new Date(Date.now() - RATE_LIMIT_SECONDS * 1000).toISOString();
    const { data: recentWalletRequests, error: walletRateLimitError } = await supabase
      .from('faucet_claims')
      .select('id')
      .eq('wallet_address', walletAddress)
      .gte('created_at', rateLimitTime);

    if (walletRateLimitError) {
      console.error('Database error (wallet rate limit check):', walletRateLimitError);
      return NextResponse.json({ error: '数据库查询错误' }, { status: 500 });
    }

    if (recentWalletRequests && recentWalletRequests.length > 0) {
      return NextResponse.json({ 
        error: `请求过于频繁，请等待 ${RATE_LIMIT_SECONDS} 秒后再试` 
      }, { status: 429 });
    }

    // 7. 检查全网/全局每日限额 (Daily Limit)
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

    // 8. 关键防护：先插入待处理记录（利用数据库唯一约束防止并发）
    // 使用临时tx_hash标记为pending状态，如果插入失败说明已存在（唯一约束冲突）
    const tempTxHash = `pending_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const { data: insertedRecord, error: insertError } = await supabase
      .from('faucet_claims')
      // @ts-ignore
      .insert({
        wallet_address: walletAddress,
        ip_address: ip,
        amount: Number(FAUCET_AMOUNT),
        tx_hash: tempTxHash
      })
      .select('id')
      .single();

    if (insertError) {
      // 检查是否是唯一约束冲突（PostgreSQL错误代码23505）
      if (insertError.code === '23505' || insertError.message?.includes('duplicate') || insertError.message?.includes('unique')) {
        return NextResponse.json({ 
          error: '该钱包地址或IP已领取过测试币，请勿重复请求' 
        }, { status: 400 });
      }
      
      console.error('Database error (insert pending record):', insertError);
      return NextResponse.json({ error: '数据库写入错误' }, { status: 500 });
    }

    // @ts-ignore
    pendingRecordId = insertedRecord?.id || null;

    // 9. 发送交易
    const privateKey = process.env.SEPOLIA_CALIM_PK;
    if (!privateKey) {
      // 如果配置错误，删除pending记录
      if (pendingRecordId) {
        // @ts-ignore
        await supabase.from('faucet_claims').delete().eq('id', pendingRecordId);
      }
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

    // 10. 更新记录为真实交易哈希
    if (pendingRecordId) {
      const { error: updateError } = await supabase
        .from('faucet_claims')
        // @ts-ignore
        .update({ tx_hash: tx.hash })
        .eq('id', pendingRecordId);

      if (updateError) {
        console.error('Critical Error: Failed to update tx_hash', {
          wallet: walletAddress,
          tx: tx.hash,
          recordId: pendingRecordId,
          error: updateError
        });
        // 虽然更新失败，但币已经发了，返回成功
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: '领取成功',
      tx_hash: tx.hash,
      amount: FAUCET_AMOUNT
    });

  } catch (error: any) {
    console.error('Faucet processing error:', error);
    
    // 如果交易失败，清理pending记录
    if (pendingRecordId) {
      try {
        const supabase = await createClient();
        // @ts-ignore
        await supabase.from('faucet_claims').delete().eq('id', pendingRecordId);
      } catch (cleanupError) {
        console.error('Failed to cleanup pending record:', cleanupError);
      }
    }
    
    return NextResponse.json({ 
      error: '领取失败，请稍后重试', 
      details: error.message 
    }, { status: 500 });
  }
}

