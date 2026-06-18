import type { Address } from 'viem'
import type { FaucetNetworkId } from '@/lib/faucet/networks'
import { FAUCET_NETWORKS } from '@/lib/faucet/networks'

export type RelayerNetworkConfig = {
  rpcUrl: string
  privateKeyEnv: string
  chainId: number
  contractAddress: Address
}

export const RELAYER_CONFIG: Record<FaucetNetworkId, RelayerNetworkConfig> = {
  sepolia: {
    rpcUrl: process.env.SEPOLIA_RPC_URL ?? 'https://ethereum-sepolia-rpc.publicnode.com',
    privateKeyEnv: 'SEPOLIA_CALIM_PK',
    chainId: 11155111,
    contractAddress: FAUCET_NETWORKS.sepolia.address!,
  },
  baseSepolia: {
    rpcUrl: process.env.BASE_SEPOLIA_RPC_URL ?? 'https://base-sepolia-rpc.publicnode.com',
    privateKeyEnv: 'SEPOLIA_CALIM_PK',
    chainId: 84532,
    contractAddress: FAUCET_NETWORKS.baseSepolia.address!,
  },
  bscTestnet: {
    rpcUrl: process.env.BSC_TESTNET_RPC_URL ?? 'https://data-seed-prebsc-1-s1.binance.org:8545/',
    privateKeyEnv: 'SEPOLIA_CALIM_PK',
    chainId: 97,
    contractAddress: FAUCET_NETWORKS.bscTestnet.address!,
  },
}
