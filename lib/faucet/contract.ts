import { parseAbi, type Address } from 'viem'

export const FAUCET_ADDRESS = (process.env.NEXT_PUBLIC_FAUCET_CONTRACT_ADDRESS ??
  '0xBF52E9B30729c481B18aB3F305d327eEA5a41e88') as Address

export const SEPOLIA_CHAIN_ID = 11155111

export const FAUCET_ABI = parseAbi([
  'function claim() external',
  'function claimAmount() view returns (uint256)',
  'function weeklyLimit() view returns (uint256)',
  'function remainingWeeklyAllowance(address user) view returns (uint256)',
  'function getContractBalance() view returns (uint256)',
  'event Claimed(address indexed user, uint256 amount, uint256 claimedInPeriod)',
  'error WeeklyLimitExceeded()',
  'error InsufficientBalance()',
])
