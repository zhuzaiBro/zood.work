// Web3 钱包类型声明

interface Window {
  ethereum?: {
    isMetaMask?: boolean
    request: (args: { method: string; params?: any[] }) => Promise<any>
    on?: (event: string, handler: (...args: any[]) => void) => void
    removeListener?: (event: string, handler: (...args: any[]) => void) => void
  }
  
  solana?: {
    isPhantom?: boolean
    isConnected?: boolean
    connect: (options?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: { toString: () => string } }>
    disconnect: () => Promise<void>
    signMessage: (message: Uint8Array, encoding: string) => Promise<{ signature: Uint8Array }>
    publicKey?: { toString: () => string }
  }
  
  braveSolana?: any
  phantom?: any
}

