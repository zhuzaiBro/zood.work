import { connectorsForWallets } from '@rainbow-me/rainbowkit'
import { injectedWallet, metaMaskWallet } from '@rainbow-me/rainbowkit/wallets'
import { createConfig, http } from 'wagmi'
import { baseSepolia, bscTestnet, sepolia } from 'wagmi/chains'

const connectors = connectorsForWallets(
  [
    {
      groupName: '浏览器钱包',
      wallets: [metaMaskWallet, injectedWallet],
    },
  ],
  {
    appName: '水煮油条君',
    projectId: '00000000000000000000000000000000',
  }
)

export const faucetChains = [sepolia, baseSepolia, bscTestnet] as const

export const wagmiConfig = createConfig({
  chains: faucetChains,
  connectors,
  transports: {
    [sepolia.id]: http('https://ethereum-sepolia-rpc.publicnode.com'),
    [baseSepolia.id]: http('https://base-sepolia-rpc.publicnode.com'),
    [bscTestnet.id]: http('https://data-seed-prebsc-1-s1.binance.org:8545'),
  },
  ssr: true,
})
