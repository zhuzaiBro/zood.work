export const FAUCET_ADDRESS =
  process.env.NEXT_PUBLIC_FAUCET_CONTRACT_ADDRESS ??
  '0xBF52E9B30729c481B18aB3F305d327eEA5a41e88'

export const SEPOLIA_CHAIN_ID = 11155111
export const SEPOLIA_CHAIN_ID_HEX = '0xaa36a7'

export const FAUCET_ABI = [
  'function claim() external',
  'function claimAmount() view returns (uint256)',
  'function weeklyLimit() view returns (uint256)',
  'function remainingWeeklyAllowance(address user) view returns (uint256)',
  'function getContractBalance() view returns (uint256)',
  'event Claimed(address indexed user, uint256 amount, uint256 claimedInPeriod)',
  'error WeeklyLimitExceeded()',
  'error InsufficientBalance()',
] as const

export const SEPOLIA_NETWORK = {
  chainId: SEPOLIA_CHAIN_ID_HEX,
  chainName: 'Sepolia',
  nativeCurrency: { name: 'Sepolia ETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: ['https://1rpc.io/sepolia'],
  blockExplorerUrls: ['https://sepolia.etherscan.io'],
}
