import { connectorsForWallets } from '@rainbow-me/rainbowkit'
import { injectedWallet, metaMaskWallet } from '@rainbow-me/rainbowkit/wallets'
import { createConfig, http } from 'wagmi'
import { sepolia } from 'wagmi/chains'

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

export const wagmiConfig = createConfig({
  chains: [sepolia],
  connectors,
  transports: {
    [sepolia.id]: http('https://ethereum-sepolia-rpc.publicnode.com'),
  },
  ssr: true,
})
