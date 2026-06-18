import type { Address } from 'viem'

export type FaucetNetworkId = 'sepolia' | 'baseSepolia' | 'bscTestnet'

export type FaucetNetwork = {
  id: FaucetNetworkId
  chainId: number
  name: string
  symbol: string
  address: Address | null
  explorer: string
}

export const FAUCET_NETWORK_LIST: FaucetNetwork[] = [
  {
    id: 'sepolia',
    chainId: 11155111,
    name: 'Sepolia',
    symbol: 'ETH',
    address: (process.env.NEXT_PUBLIC_FAUCET_ADDRESS_SEPOLIA ??
      '0xbb1546f15bf0bed40e15492ae0a3b344b2a3b462') as Address,
    explorer: 'https://sepolia.etherscan.io',
  },
  {
    id: 'baseSepolia',
    chainId: 84532,
    name: 'Base Sepolia',
    symbol: 'ETH',
    address: (process.env.NEXT_PUBLIC_FAUCET_ADDRESS_BASE_SEPOLIA ??
      '0xa7bcf4a87f681f981fe9dfb84feb4677fa3101a6') as Address,
    explorer: 'https://sepolia.basescan.org',
  },
  {
    id: 'bscTestnet',
    chainId: 97,
    name: 'BSC Testnet',
    symbol: 'BNB',
    address: (process.env.NEXT_PUBLIC_FAUCET_ADDRESS_BSC_TESTNET ??
      '0x90b6ad28c249a73a4a521294ddc0fc74b7fdf9b2') as Address,
    explorer: 'https://testnet.bscscan.com',
  },
]

export const FAUCET_NETWORKS = Object.fromEntries(
  FAUCET_NETWORK_LIST.map((network) => [network.id, network])
) as Record<FaucetNetworkId, FaucetNetwork>

export function getFaucetNetwork(chainId?: number) {
  return FAUCET_NETWORK_LIST.find((network) => network.chainId === chainId)
}

export function getFaucetNetworkById(id: FaucetNetworkId) {
  return FAUCET_NETWORKS[id]
}
