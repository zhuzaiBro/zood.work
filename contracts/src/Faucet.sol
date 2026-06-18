// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title Faucet
 * @notice 测试网 ETH 水龙头
 * @dev owner 可充值、调整全局/单地址领取额度；每个地址在 7 天窗口内最多领取 weeklyLimit
 */
contract Faucet {
    address public owner;

    /// @notice 每次 claim 发送的 ETH 数量（wei）
    uint256 public claimAmount;

    /// @notice 每个地址在一个 7 天周期内最多可领取的 ETH 总量（wei）
    uint256 public weeklyLimit;

    uint256 public constant WEEK = 7 days;

    struct ClaimRecord {
        uint256 periodStart;
        uint256 claimedAmount;
    }

    struct UserConfig {
        /// @dev 为 0 时使用全局 claimAmount
        uint256 customClaimAmount;
        /// @dev 为 0 时使用全局 weeklyLimit
        uint256 customWeeklyLimit;
    }

    mapping(address => ClaimRecord) public claimRecords;
    mapping(address => UserConfig) public userConfigs;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event Deposited(address indexed from, uint256 amount);
    event Claimed(address indexed user, uint256 amount, uint256 claimedInPeriod);
    event ClaimAmountUpdated(uint256 oldAmount, uint256 newAmount);
    event WeeklyLimitUpdated(uint256 oldLimit, uint256 newLimit);
    event UserClaimAmountUpdated(address indexed user, uint256 amount);
    event UserWeeklyLimitUpdated(address indexed user, uint256 limit);
    event Withdrawn(address indexed to, uint256 amount);

    error NotOwner();
    error ZeroAddress();
    error InvalidAmount();
    error WeeklyLimitExceeded();
    error InsufficientBalance();
    error TransferFailed();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    /**
     * @param _owner 合约管理员地址（部署时传入你的钱包地址）
     * @param _claimAmount 每次领取数量，例如 0.1 ether
     * @param _weeklyLimit 每周上限，例如 0.1 ether（通常与单次领取相同）
     */
    constructor(address _owner, uint256 _claimAmount, uint256 _weeklyLimit) {
        if (_owner == address(0)) revert ZeroAddress();
        if (_claimAmount == 0 || _weeklyLimit < _claimAmount) revert InvalidAmount();

        owner = _owner;
        claimAmount = _claimAmount;
        weeklyLimit = _weeklyLimit;
    }

    receive() external payable {
        emit Deposited(msg.sender, msg.value);
    }

    /// @notice owner 向水龙头充值测试 ETH
    function deposit() external payable onlyOwner {
        if (msg.value == 0) revert InvalidAmount();
        emit Deposited(msg.sender, msg.value);
    }

    /// @notice 领取测试 ETH，调用者须为 msg.sender
    function claim() external {
        uint256 amount = _claimAmountFor(msg.sender);
        uint256 limit = _weeklyLimitFor(msg.sender);

        ClaimRecord storage record = claimRecords[msg.sender];
        _resetPeriodIfExpired(record);

        if (record.claimedAmount + amount > limit) revert WeeklyLimitExceeded();
        if (address(this).balance < amount) revert InsufficientBalance();

        record.claimedAmount += amount;

        (bool ok,) = msg.sender.call{value: amount}("");
        if (!ok) revert TransferFailed();

        emit Claimed(msg.sender, amount, record.claimedAmount);
    }

    /// @notice 设置全局单次领取额度
    function setClaimAmount(uint256 newAmount) external onlyOwner {
        if (newAmount == 0) revert InvalidAmount();
        uint256 old = claimAmount;
        claimAmount = newAmount;
        emit ClaimAmountUpdated(old, newAmount);
    }

    /// @notice 设置全局每周领取上限
    function setWeeklyLimit(uint256 newLimit) external onlyOwner {
        if (newLimit < claimAmount) revert InvalidAmount();
        uint256 old = weeklyLimit;
        weeklyLimit = newLimit;
        emit WeeklyLimitUpdated(old, newLimit);
    }

    /// @notice 为指定地址设置单次领取额度，传 0 恢复为全局默认值
    function setUserClaimAmount(address user, uint256 amount) external onlyOwner {
        if (user == address(0)) revert ZeroAddress();
        userConfigs[user].customClaimAmount = amount;
        emit UserClaimAmountUpdated(user, amount);
    }

    /// @notice 为指定地址设置每周上限，传 0 恢复为全局默认值
    function setUserWeeklyLimit(address user, uint256 limit) external onlyOwner {
        if (user == address(0)) revert ZeroAddress();
        userConfigs[user].customWeeklyLimit = limit;
        emit UserWeeklyLimitUpdated(user, limit);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    /// @notice owner 提取合约内剩余 ETH
    function withdraw(uint256 amount) external onlyOwner {
        if (amount == 0 || address(this).balance < amount) revert InvalidAmount();

        (bool ok,) = owner.call{value: amount}("");
        if (!ok) revert TransferFailed();

        emit Withdrawn(owner, amount);
    }

    /// @notice 查询地址在当前周期内还可领取的数量
    function remainingWeeklyAllowance(address user) external view returns (uint256) {
        uint256 limit = _weeklyLimitFor(user);
        ClaimRecord memory record = claimRecords[user];

        if (record.periodStart == 0 || block.timestamp >= record.periodStart + WEEK) {
            return limit;
        }
        if (record.claimedAmount >= limit) return 0;
        return limit - record.claimedAmount;
    }

    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function _claimAmountFor(address user) internal view returns (uint256) {
        uint256 custom = userConfigs[user].customClaimAmount;
        return custom == 0 ? claimAmount : custom;
    }

    function _weeklyLimitFor(address user) internal view returns (uint256) {
        uint256 custom = userConfigs[user].customWeeklyLimit;
        return custom == 0 ? weeklyLimit : custom;
    }

    function _resetPeriodIfExpired(ClaimRecord storage record) internal {
        if (record.periodStart == 0 || block.timestamp >= record.periodStart + WEEK) {
            record.periodStart = block.timestamp;
            record.claimedAmount = 0;
        }
    }
}
