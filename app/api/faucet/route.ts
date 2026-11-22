import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { platformServer, PlatformError } from '@/lib/platform/server';

// 使用公共 RPC 节点，生产环境建议使用 Alchemy 或 Infura 的私有节点以保证稳定性
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';
const BSC_TESTNET_RPC_URL = process.env.BSC_TESTNET_RPC_URL || 'https://data-seed-prebsc-1-s1.binance.org:8545/';
const FAUCET_AMOUNT = "0.1"; // 每次领取数量

type Network = 'sepolia' | 'bsc-testnet';

interface NetworkConfig {
  rpcUrl: string;
  privateKeyEnv: string;
  chainId?: number;
}

const networkConfigs: Record<Network, NetworkConfig> = {
  'sepolia': {
    rpcUrl: SEPOLIA_RPC_URL,
    privateKeyEnv: 'SEPOLIA_CALIM_PK',
  },
  'bsc-testnet': {
    rpcUrl: BSC_TESTNET_RPC_URL,
    privateKeyEnv: 'BSC_TESTNET_CLAIM_PK',
    chainId: 97,
  },
};

async function releaseReservation(id: string) {
  await platformServer(`/api/platform/faucet/reservations/${id}`, { method: 'DELETE' });
}

export async function POST(request: Request) {
  let reservationId: string | null = null;

  try {
    const { walletAddress, network = 'sepolia' } = await request.json();

    if (network !== 'sepolia' && network !== 'bsc-testnet') {
      return NextResponse.json({ error: '不支持的区块链网络' }, { status: 400 });
    }

    const networkConfig = networkConfigs[network as Network];

    if (!walletAddress || !ethers.isAddress(walletAddress)) {
      return NextResponse.json({ error: '无效的钱包地址' }, { status: 400 });
    }

    const reserved = await platformServer<{ reservation?: { id?: string } }>(
      '/api/platform/faucet/reservations',
      {
        method: 'POST',
        body: { walletAddress, network },
      },
    );
    reservationId = reserved.reservation?.id ?? null;
    if (!reservationId) {
      return NextResponse.json({ error: '数据库写入错误' }, { status: 500 });
    }

    const privateKey = process.env[networkConfig.privateKeyEnv];
    if (!privateKey) {
      await releaseReservation(reservationId);
      reservationId = null;
      console.error(`Missing ${networkConfig.privateKeyEnv} environment variable`);
      return NextResponse.json({ error: '服务器配置错误：缺少网络私钥配置' }, { status: 500 });
    }

    const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);

    const txOptions: { to: string; value: bigint; chainId?: number } = {
      to: walletAddress,
      value: ethers.parseEther(FAUCET_AMOUNT),
    };

    if (networkConfig.chainId) {
      txOptions.chainId = networkConfig.chainId;
    }

    const tx = await wallet.sendTransaction(txOptions);

    try {
      await platformServer(`/api/platform/faucet/reservations/${reservationId}/confirm`, {
        method: 'POST',
        body: { txHash: tx.hash },
      });
    } catch (updateError) {
      console.error('Critical Error: Failed to confirm faucet reservation', {
        wallet: walletAddress,
        tx: tx.hash,
        recordId: reservationId,
        error: updateError,
      });
    }
    reservationId = null;

    return NextResponse.json({
      success: true,
      message: '领取成功',
      tx_hash: tx.hash,
      amount: FAUCET_AMOUNT
    });

  } catch (error: unknown) {
    console.error('Faucet processing error:', error);

    if (reservationId) {
      try {
        await releaseReservation(reservationId);
      } catch (cleanupError) {
        console.error('Failed to cleanup pending record:', cleanupError);
      }
    }

    if (error instanceof PlatformError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const details = error instanceof Error ? error.message : undefined;
    return NextResponse.json({
      error: '领取失败，请稍后重试',
      details,
    }, { status: 500 });
  }
}
