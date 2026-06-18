import { parseAbi } from 'viem'

export const FAUCET_ABI = parseAbi([
  'function claim(address recipient) external',
  'function claimAmount() view returns (uint256)',
  'function weeklyLimit() view returns (uint256)',
  'function remainingWeeklyAllowance(address user) view returns (uint256)',
  'function getContractBalance() view returns (uint256)',
  'event Claimed(address indexed user, uint256 amount, uint256 claimedInPeriod)',
  'error WeeklyLimitExceeded()',
  'error InsufficientBalance()',
])
