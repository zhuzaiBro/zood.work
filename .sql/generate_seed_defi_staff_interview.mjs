import fs from 'fs'

const COLLECTION_ID = 'f1a2b3c4-d5e6-4f78-9abc-def010000001'
const TAG_ID = 'f1a2b3c4-d5e6-4f78-9abc-def010000002'

const collection = {
  id: COLLECTION_ID,
  title: 'DeFi Staff 智能合约面试题',
  description:
    'Staff 级 DeFi 核心协议方向（Prop AMM + DEX Aggregator + MEV 防护）面试题预测与备考思路，覆盖 Solidity/EVM、做市机制、路由设计、安全与系统架构。',
  icon: '⛓️',
  sort: 10,
}

const tag = {
  id: TAG_ID,
  name: 'Web3',
  slug: 'web3',
  sort: 2,
}

const questions = [
  {
    id: 'f1a2b3c4-d5e6-4f78-9abc-def010000101',
    sort: 1,
    title: '详细说说 Gas 优化的常见手段，给几个具体例子',
    difficulty: '中等',
    is_vip: false,
    content: `## 板块
Solidity & EVM 基础（筛选关）

## 答题思路
分层讲解：storage 布局、读写优化、算术与错误处理、批量与数据结构选择。

## 参考答案要点

### 1. Storage 布局
- 将多个小类型变量 **packing** 到同一 slot（如两个 \`uint128\` 占一个 \`uint256\` slot）
- 合理安排状态变量顺序，避免浪费 slot
- **例子**：把 \`uint128 a; uint128 b;\` 放同一 slot，一次 \`SSTORE\` 写入两个字段，比两个 \`uint256\` 省约 20000 gas（首次写入）

### 2. 减少 SLOAD / SSTORE
- 热路径里用 \`memory\` / \`calldata\` 缓存 storage 变量
- 批量更新后一次性写回 storage
- 用 \`immutable\` / \`constant\` 替代可变的 storage 读取

### 3. 算术与错误
- 在已证明安全的区间使用 \`unchecked\`
- 用 **custom error** 替代带字符串的 \`require\`，省部署和 revert gas

### 4. 结构与调用
- **Multicall** 合并多笔操作为一次交易
- 用 **bitmap** 替代多个 \`bool\` 状态
- 避免循环内不必要的外部调用；能 \`staticcall\` 就不要 \`call\`

### 5. 其他
- 事件优于链上存大数组
- 精简 \`calldata\` 结构，避免冗余字段`,
  },
  {
    id: 'f1a2b3c4-d5e6-4f78-9abc-def010000102',
    sort: 2,
    title: '可升级合约的几种代理模式区别（Transparent vs UUPS vs Beacon）',
    difficulty: '中等',
    is_vip: false,
    content: `## 板块
Solidity & EVM 基础（筛选关）

## 答题思路
从 **存储冲突、gas 成本、升级权限位置** 三个维度对比。

## 参考答案要点

| 模式 | 升级逻辑位置 | Gas | 适用场景 | 主要风险 |
|------|-------------|-----|----------|----------|
| Transparent Proxy | 独立 ProxyAdmin + 代理合约 | 较高（admin/user 双路径） | 传统 OZ 方案 | Admin 与用户 selector 冲突需规避 |
| UUPS | 实现合约内 | 较低 | 主流新项目 | 实现合约未保留升级函数会 **永久锁死** |
| Beacon | Beacon 合约存 implementation | 多实例共享逻辑时省 gas | 多 Vault / 多池同逻辑 | Beacon 被攻破则全部实例受影响 |

### Transparent
- 普通用户调用走 fallback delegatecall 到 implementation
- Admin 调用走 proxy 自身 admin 函数，不会误进 implementation

### UUPS
- 升级函数在 implementation，proxy 更薄
- **必须**保证每次升级后仍保留 \`_authorizeUpgrade\`

### Beacon
- 多个 proxy 指向同一 beacon，改 beacon 即可批量升级
- 适合「多实例、同逻辑、同步升级」`,
  },
  {
    id: 'f1a2b3c4-d5e6-4f78-9abc-def010000103',
    sort: 3,
    title: 'storage collision 是怎么发生的，如何避免',
    difficulty: '困难',
    is_vip: true,
    content: `## 板块
Solidity & EVM 基础（筛选关）

## 答题思路
讲清代理模式下 **slot 布局必须严格对齐**，以及继承顺序、升级实现变更导致的偏移问题。

## 参考答案要点

### 如何发生
1. **代理与实现 slot 冲突**：implementation 的状态变量从 slot 0 开始，覆盖 proxy 存的 \`implementation\` / \`admin\` 等
2. **升级后布局变化**：V2 在 V1 中间插入新变量，后续变量 slot 整体错位
3. **不规则继承**：C3 线性化下父合约变量顺序与预期不一致

### 如何避免
- 代理合约 **只保留固定 slot** 的 admin/implementation，业务状态全部在 implementation
- 升级时 **只在末尾追加** 变量，禁止删除/重排/改类型
- OpenZeppelin **storage gap**：预留 \`uint256[50] __gap\`
- **ERC-7201 namespaced storage**：\`keccak256("namespace")\` 作为基 slot，逻辑模块隔离
- 升级前 diff 布局 + 审计 + 存储布局测试`,
  },
  {
    id: 'f1a2b3c4-d5e6-4f78-9abc-def010000104',
    sort: 4,
    title: 'Foundry 的 Invariant Testing 是怎么工作的？给 Prop AMM 设计几个 invariant',
    difficulty: '困难',
    is_vip: true,
    content: `## 板块
Solidity & EVM 基础（筛选关）— **本 JD 重点**

## 答题思路
Invariant testing = **fuzz + 状态机**：Handler 随机调用协议函数，每步断言全局性质始终成立。

## Foundry 工作方式
1. 部署被测合约 + **Handler**（封装合法/边界操作）
2. \`targetContract(handler)\` 限定 fuzz 入口
3. 运行 N 次随机序列，每次序列后检查 \`invariant_*\` 函数
4. 失败时 Foundry 会 **shrinking** 找最小复现路径

## Prop AMM 可设计的 Invariant 示例

\`\`\`solidity
// 1. 偿付能力
invariant_vaultSolvency() // 总资产 >= 所有份额可赎回价值之和

// 2. 曲线/定价不被掏空
invariant_noArbDrain() // swap 后 k 或曲线不变量不被套利至协议亏损

// 3. 资金守恒
invariant_feeConservation() // 协议费累计 + LP 净值 == 总流入（±舍入）

// 4. 报价合法
invariant_priceSanity() // 价格 > 0，无溢出，tick/sqrtPrice 在允许范围
\`\`\`

## 加分点
- Handler 要覆盖 deposit / withdraw / swap / updateOracle / pause
- 用 ghost variable 追踪累计流入流出
- 结合 **assume** 过滤不可达状态`,
  },
  {
    id: 'f1a2b3c4-d5e6-4f78-9abc-def010000105',
    sort: 5,
    title: 'Prop AMM 和传统 Uniswap V2/V3 AMM 的本质区别是什么？',
    difficulty: '困难',
    is_vip: true,
    content: `## 板块
AMM 与做市机制（核心面）

## 答题思路
传统 AMM = **链上池子比例/曲线被动定价**；Prop AMM = **链下做市模型定价 + 链上结算**。

## 参考答案要点

### 传统 AMM（Uniswap V2/V3）
- 价格由池内 \`x*y=k\` 或集中流动性曲线 **内生决定**
- LP 被动提供流动性，承担 **LVR / 逆向选择** 损失
- 完全链上、可组合性强、不依赖链下 infra

### Prop AMM（如 HumidiFi、Tessera 类）
- 报价由链下模型（订单簿、波动率、跨场所 mid）计算
- 通过 **Oracle / 签名报价 / 参数更新** 写入链上
- 链上负责 **验证 + 结算 + 风控**，不是「池子自己出价」

### 优劣对比
| | Prop AMM | 传统 AMM |
|---|----------|----------|
| 价差/深度 | 更接近 CEX | 受池子大小限制 |
| LVR | 可主动跟随外部价，窗口更小 | LP 易被套利 |
| 依赖 | 链下 infra、预言机延迟 | 仅链上状态 |
| 风险 | 预言机操纵、报价延迟 | 无常损失、MEV |

## 备考提示
阅读 HumidiFi / Tessera 设计文档，能画「链下报价 → 链上验证 → 结算」时序图。`,
  },
  {
    id: 'f1a2b3c4-d5e6-4f78-9abc-def010000106',
    sort: 6,
    title: '什么是 LVR（Loss-Versus-Rebalancing），Prop AMM 怎么缓解它',
    difficulty: '困难',
    is_vip: true,
    content: `## 板块
AMM 与做市机制（核心面）— **热点题**

## 答题思路
LVR = 被动 LP 相对「完美对冲再平衡」策略的 **确定性损失**，本质是套利者利用 AMM 价格滞后于外部市场价获利。

## LVR 直觉
- 外部价已变，AMM 池内价还没变
- 知情交易者 against LP 成交
- LP 相当于 **慢半拍的对冲者**，损失可被量化（与波动率、区块时间相关）

## Prop AMM 缓解手段
1. **高频 Oracle-driven 报价**：缩短滞后窗口，让链上价更快贴近外部 mid
2. **主动调整曲线斜率 / spread**：做市商根据库存与波动加宽价差
3. **拍卖机制返还套利价值**：MEV-Share / LVR auction，把被提取价值分给 LP
4. **RFQ / 签名报价**：大额单不走公开池 spot，减少被 sandwich 的公开敞口

## 面试加分
- 区分 IL（无常损失）与 LVR（可预测、与区块时间相关）
- 提到 CoW Protocol batch auction、Uniswap X 等减少排序优势的方案`,
  },
  {
    id: 'f1a2b3c4-d5e6-4f78-9abc-def010000107',
    sort: 7,
    title: '设计一个 Vault 的流动性管理机制，需要考虑哪些边界情况？',
    difficulty: '困难',
    is_vip: false,
    content: `## 板块
AMM 与做市机制（核心面）

## 答题思路
按 **存/取份额计算、攻击面、流动性约束、极端行情** 四条线展开。

## 边界情况清单

### 1. 份额铸造 / 赎回
- 按 **当前 NAV** 计算 shares，防止抢跑铸造套利已实现收益
- 首笔存款 **donation / inflation attack**（ERC4626 经典坑）：空 vault 时攻击者捐 1 wei 抬高 share 价格
- **缓解**：虚拟 shares、最小首存、dead shares 烧给 \`address(0)\`

### 2. 精度与舍入
- 向下取整 mint、向上取整 burn，**偏向协议** 防 dust 攻击
- 多资产 vault 的 oracle 精度与 stale price

### 3. 流动性约束
- 提现 **排队 / 冷却期 / epoch 结算**
- LP 锁定期 vs 即时赎回的流动性错配
- 部分资产不可即时变现时的 **withdrawal limit**

### 4. 极端行情
- 清算优先级（bad debt 社会化 vs 先扣 buffer）
- Circuit breaker：单日赎回上限
- 与外部 AMM 脱锚时的暂停机制

## 案例引用
OpenZeppelin ERC4626 文档中的 **first depositor inflation attack** — 展示踩坑经验。`,
  },
  {
    id: 'f1a2b3c4-d5e6-4f78-9abc-def010000108',
    sort: 8,
    title: '集中流动性（Concentrated Liquidity）的核心数据结构是怎么设计的？',
    difficulty: '中等',
    is_vip: false,
    content: `## 板块
AMM 与做市机制（核心面）

## 答题思路
以 Uniswap V3 为例：tick、liquidityNet、bitmap、sqrtPriceX96。

## 核心数据结构

### 1. 价格表示 — \`sqrtPriceX96\`
- 存 \`sqrt(price) * 2^96\`，避免 \`sqrt\` 浮点，乘除用 Q64.96 定点数

### 2. Tick 离散化
- 价格映射到 tick index：\`price = 1.0001^tick\`
- 每个 tick 存 **liquidityNet**（穿越该 tick 时流动性增减）

### 3. Tick Bitmap
- \`mapping(int16 => uint256)\` 压缩存储
- swap 时 **bit 运算** 找下一个已初始化 tick，O(1) 跳跃

### 4. Position（NFT LP 头寸）
- \`(owner, tickLower, tickUpper, liquidity)\`
- 只在 \`[tickLower, tickUpper)\` 区间内提供流动性

### 5. 全局状态
- \`slot0\`: sqrtPriceX96, tick, feeGrowthGlobal...
- swap 循环：在当前 tick 内消耗流动性 → 跨 tick → 更新 fee

## 设计要点
- 集中流动性 = LP 自选区间，资本效率更高
- 工程难点：跨 tick swap  gas 优化、flash accounting`,
  },
  {
    id: 'f1a2b3c4-d5e6-4f78-9abc-def010000109',
    sort: 9,
    title: '如何设计跨多个流动性来源（Uniswap/KyberSwap/1inch 等）的路由算法？',
    difficulty: '困难',
    is_vip: true,
    content: `## 板块
DEX Aggregator / 路由设计（JD 重头戏）

## 答题思路
两层：**流动性发现** → **路由优化**。

## 架构分层

### Layer 1 — 流动性发现
- 拉取各 DEX pool state（reserve、tick、fee tier）
- RFQ 源：Market maker 签名报价 + expiry
- 缓存 + 事件订阅，而非纯 polling

### Layer 2 — 路由优化
- 目标：给定 \`amountIn\`，最大化 \`amountOut\`（或最小化 \`amountIn\`）
- 单路径：沿边际价格 **贪心** 选最优池
- 多路径：**分拆交易量** — 因 AMM 价格影响非线性，不能简单按比例分

## 关键难点
1. **边际价格**：每增加 dQ 的边际 output 递减，用梯度/迭代分拆
2. **Gas 权衡**：路径越多 hop 越多，链上执行成本吃掉收益
3. **RFQ 有效期**：过期重询，链上 calldata 带 nonce + deadline
4. **多链 / 多 VM**：跨链非原子，需 bridge 风险溢价与 fallback

## 简化模型（可白板）
\`\`\`
while remaining > 0:
  pick pool with best marginal rate at current size
  allocate min(remaining, sweet_spot_chunk)
  update pool state locally
\`\`\`
更严谨可用凸优化 / 线性规划近似。`,
  },
  {
    id: 'f1a2b3c4-d5e6-4f78-9abc-def010000110',
    sort: 10,
    title: '怎么优化交易执行延迟？',
    difficulty: '中等',
    is_vip: false,
    content: `## 板块
DEX Aggregator / 路由设计

## 答题思路
链下预计算 + 私有通道 + Gas 竞价策略。

## 参考答案要点

### 链下侧
- **预计算路由**：热门 token pair 缓存 top-K 路径
- **池状态缓存**：订阅 Sync/Swap 事件增量更新，减少 RPC
- **并行询价**：多 DEX 并发请求，取 median / best
- **Colocation**：节点靠近 sequencer（如 Base sequencer）

### 链上提交侧
- **Private Order Flow**：Flashbots Protect、MEV-Share、builder 直连
- 避免公开 mempool 被 sandwich 的 **等待成本**
- **EIP-1559 优先费**动态调整：根据 pending 区块 base fee + tip 估算

### 协议 / 产品侧
- 默认合理 slippage，减少 revert 重发
- 模拟（eth_call / tenderly）前置失败检测
- 批量 intent 合并（ERC-4337 bundle）

## JD 关联
可提及 **Base Sequencer、交易排序、Private Order Flow**，体现对 infra 的了解。`,
  },
  {
    id: 'f1a2b3c4-d5e6-4f78-9abc-def010000111',
    sort: 11,
    title: '怎么应对聚合的某个流动性来源报价滞后或失效？',
    difficulty: '中等',
    is_vip: false,
    content: `## 板块
DEX Aggregator / 路由设计

## 答题思路
新鲜度校验 → 多源交叉验证 → failover → 链上保护。

## 防御层次

### 1. 报价新鲜度
- 检查 \`timestamp\` / \`blockNumber\` / TTL
- Stale 超过 N 秒自动剔除该源

### 2. 多源交叉验证
- 与同 pair 其他 DEX mid 价偏离 > X% 则降权或丢弃
- Chainlink / 外部 index 作为 sanity check

### 3. Failover
- 源超时（circuit open）→ 备用源
- 降级为纯链上 AMM 路由，放弃 RFQ

### 4. 链上最终保护
- \`minAmountOut\` / \`maxAmountIn\`
- \`deadline\`
- 部分 fill 策略 vs 整单 revert

### 5. 观测
- 每源 latency、偏差、失败率 metrics
- 告警 + 自动摘除 unhealthy adapter`,
  },
  {
    id: 'f1a2b3c4-d5e6-4f78-9abc-def010000112',
    sort: 12,
    title: '三明治攻击的原理，以及在协议层怎么防御？',
    difficulty: '中等',
    is_vip: false,
    content: `## 板块
MEV / 安全（高频考点）

## 原理
1. 监测 mempool 中用户大额 swap
2. **Front-run**：攻击者先买，推高价格
3. 用户 tx 以更差价成交
4. **Back-run**：攻击者卖出获利

## 协议层防御

### 用户保护
- **Slippage limit**（\`minAmountOut\`）
- **Deadline** 限制可被打的时间窗口

### 定价机制
- **TWAP** 替代 spot 做 oracle / 大额定价
- **Batch auction**（CoW）：同批用户统一清算价，消除排序优势

### 协议设计
- 限制单笔 **price impact** 上限
- **Commit-reveal** 或加密 mempool（Flashbots SUAVE 方向）
- 私有 RPC / MEV-Share 返还部分价值给用户

### Prop AMM 特化
- 签名报价锁定价格，减少 public swap 敞口
- 动态 spread 在检测到 volatile mempool 时加宽`,
  },
  {
    id: 'f1a2b3c4-d5e6-4f78-9abc-def010000113',
    sort: 13,
    title: '预言机操纵攻击怎么发生，怎么防？',
    difficulty: '中等',
    is_vip: false,
    content: `## 板块
MEV / 安全（高频考点）

## 攻击路径
1. 闪电贷借大量资金
2. 在低流动性 pool **拉爆 spot 价格**
3. 协议用该 spot 作抵押品定价 / 清算价
4. 借出超额资产或不当清算获利
5. 同一 tx 内还原，归还闪电贷

## 防御手段

### 价格来源
- **TWAP** 而非瞬时 spot（拉长操纵成本）
- **Chainlink + 链上 TWAP** 双源，偏离度检查
- **Circuit breaker**：单 block 最大变化阈值

### 协议参数
- 低流动性资产 **降低 LTV / 提高 margin**
- 使用 **独立 oracle feed**，不读可被闪电贷影响的 pool spot

### 工程实践
- 借贷协议常用 Chainlink + Uniswap TWAP fallback
- 监控 oracle 偏差告警`,
  },
  {
    id: 'f1a2b3c4-d5e6-4f78-9abc-def010000114',
    sort: 14,
    title: '闪电贷攻击的本质是什么？给一个攻击向量并设计防御',
    difficulty: '困难',
    is_vip: false,
    content: `## 板块
MEV / 安全（高频考点）

## 本质
闪电贷不是漏洞，是 **零资本杠杆放大器** — 把需要大量本金的攻击压缩到 **单笔 tx** 内完成。

## 示例攻击向量
**Governance flash loan vote**
1. 闪电贷借大量 governance token
2. 投票通过恶意提案
3. 同一 tx 还贷

或 **Oracle manipulation + borrow**（见上一题）。

## 防御设计
- **Reentrancy guard**（Checks-Effects-Interactions）
- 同一 tx 内 **禁止** 同时 mint & redeem 套利份额
- 治理：**投票需 snapshot 区块**，不能临时借票
- 关键状态变更要求 **跨块**（timelock）
- Invariant：\`totalBorrow <= totalCollateral * LTV\` 在 tx 末仍成立

## 面试态度
不试图「禁止闪电贷」，而是让 **单 tx 内状态转移满足不变量**。`,
  },
  {
    id: 'f1a2b3c4-d5e6-4f78-9abc-def010000115',
    sort: 15,
    title: '重入攻击的现代变种有哪些？',
    difficulty: '困难',
    is_vip: false,
    content: `## 板块
MEV / 安全（高频考点）

## 经典重入
\`withdraw\` 先 \`call\` 后改 balance → 攻击者 fallback 反复提

## 现代变种

### 1. Cross-function reentrancy
- 函数 A 外部调用中，重入函数 B
- A 的 state 未更新，B 读到旧状态

### 2. Read-only reentrancy
- 协议 P 重入期间 view 返回 **过时价格/份额**
- 外部协议 Q 依赖 P 的 view 做定价 → 被利用
- **防御**：重入锁也保护 view 一致性，或 ERC4626 的 \`totalAssets\` 在回调期间 revert

### 3. Cross-contract reentrancy
- 通过多个合约共享状态，在 C 重入时影响 D

### 4. ERC777 / 回调 token
- \`tokensReceived\` hook 触发重入

### 5. 跨层重入（Bridge / L2）
- 消息处理顺序与本地 state 不同步

## 防御总纲
- CEI 模式 + \`nonReentrant\`
- Pull over push 付款
- 对外部 composability 假设 **view 也可能 lie during callback**`,
  },
  {
    id: 'f1a2b3c4-d5e6-4f78-9abc-def010000116',
    sort: 16,
    title: '协议 TVL 暴增 10 倍、交易量暴增 50 倍，合约/系统架构需要哪些改造？',
    difficulty: '困难',
    is_vip: true,
    content: `## 板块
系统架构 / Scaling（Staff 级）

## 答题思路
链上降写入 + 链下水平扩展 + 风控升级。

## 链上改造
- 减少 **SSTORE**：批处理状态更新、merkle root 提交代替逐笔记账
- 高频参数放链下，链上只存 **commit + verify**（ZK/签名）
- **分池 / 分片**：按 asset pair 拆合约，降低单合约热点
- 升级 **pause / rate limit** 参数
- Gas 优化 re-audit（热点函数 inline assembly）

## 链下改造
- 路由服务 **水平扩展** + 无状态 worker
- Oracle 更新 **批处理**，降低 RPC 压力
- 专用 **archive node / 索引**（The Graph / 自研 indexer）
- Sequencer 亲和部署

## 运维 / 风控
- 监控：延迟、revert 率、oracle 偏差、TVL 异动
- **熔断**自动化：异常流量、价格脱锚
-  incident runbook + 多签 emergency council

## Staff 加分
讲清 **哪些必须链上原子、哪些可链下 eventual consistency**。`,
  },
  {
    id: 'f1a2b3c4-d5e6-4f78-9abc-def010000117',
    sort: 17,
    title: '如何设计高吞吐低延迟的链下做市报价系统并与链上结算对齐？',
    difficulty: '困难',
    is_vip: true,
    content: `## 板块
系统架构 / Scaling（Staff 级）— **呼应 JD**

## 架构概览
\`\`\`
Market Data → Pricing Engine → Quote Service → Signer → Chain Settlement
\`\`\`

## 链下组件
1. **Market data ingest**：CEX/DEX/RFQ  feed，低延迟 normalized order book
2. **Pricing model**：库存 skew、vol surface、fee、spread 规则
3. **Quote service**：生成 \`(pair, amountIn, amountOut, expiry, nonce)\`
4. **Signer**：HSM / MPC 签名（EIP-712）

## 链上组件（最小化）
- 验证签名 + nonce 未用 + 未过期
- 执行 swap / 更新 vault 参数
- 失败则 revert，无 silent fallback

## 对齐要点
- **Clock sync**：链下 expiry 对齐 block time
- **Nonce / replay**：链上 mapping 消耗报价
- **Partial fill** 规则写清
- **Drift handling**：链上成交价与签名价偏差容忍 band
- **Failover**：signer 不可用 → 降级 TWAP 模式或 pause

## JD 关键词
「链下做市模型驱动链上参数调整」— 能画 sequence diagram。`,
  },
  {
    id: 'f1a2b3c4-d5e6-4f78-9abc-def010000118',
    sort: 18,
    title: 'Solana 上做 Prop AMM 和 EVM 上的核心架构差异是什么？',
    difficulty: '中等',
    is_vip: false,
    content: `## 板块
Solana 相关（加分项）

## 核心差异

### 账户模型
- Solana：**账户即状态**，做市商更新 **自有 quote account**，并行不互斥
- EVM：单合约 storage 串行，热点 slot 竞争

### 执行与吞吐
- Solana 高 TPS + 低 block time → Oracle 报价 **更新频率更高**
- 更接近 CEX 体验；但程序复杂度在 account layout

### 开发框架
- **Anchor**：PDA 派生、CPI 组合
- 报价账户用 PDA + discriminator，链上程序验证 signer

### 与 EVM 对比
| | Solana | EVM |
|---|--------|-----|
| 并行 | 账户级并行 | 单线程 state |
| 成本 | 按 CU 计 | Gas + storage |
| 升级 | Program upgrade authority | Proxy pattern |
| 组合 | CPI | delegatecall / 外部 call |

## Prop AMM 含义
Solana 上可把 **每个 market maker 报价** 拆成独立 account，链上撮合读多账户 — 天然适合 prop model。`,
  },
  {
    id: 'f1a2b3c4-d5e6-4f78-9abc-def010000119',
    sort: 19,
    title: '讲一个你在创新性和可维护性之间做权衡的真实例子',
    difficulty: '中等',
    is_vip: false,
    content: `## 板块
行为面 / 软素质（Staff 级）

## 答题框架 — STAR
- **Situation**：项目背景与约束
- **Task**：你要达成的目标
- **Action**：如何做 trade-off 分析
- **Result**：量化结果与 retrospect

## 示例方向（请替换为你的真实经历）
**情境**：DEX 聚合路由 v1 用贪心算法，3 周可上线；团队希望支持多路径凸优化。

**权衡**：
- 创新：凸优化更优解，但依赖求解器、难审计、延迟 +200ms
- 可维护：贪心 + 2-hop 覆盖 90% 场景，代码 500 行可测

**决策**：先 ship 贪心 + 完整 metrics；v2 对 >$100k 订单异步跑优化器

**结果**：上线 3 周，P99 延迟 80ms；大额单 opt-in 优化后 slippage 降 15bp

## 面试官想听
- 你怎么 **量化** trade-off（延迟、覆盖率、维护成本）
- 不是「选了简单的」而是 **分阶段交付**`,
  },
  {
    id: 'f1a2b3c4-d5e6-4f78-9abc-def010000120',
    sort: 20,
    title: '如果你和外部审计团队对某个安全假设有分歧，你怎么处理？',
    difficulty: '中等',
    is_vip: false,
    content: `## 板块
行为面 / 软素质（Staff 级）

## 答题思路
Security-first，用证据而非直觉化解分歧。

## 处理流程
1. **对齐威胁模型**：攻击者能力、资金规模、时间窗口是否一致
2. **写清假设**：「我们假设 oracle 延迟 < 30s」— 可 falsify 的陈述
3. **证据优先级**：
   - PoC / fuzz 反例 > 理论争论
   - Invariant test / formal spec（Certora）验证
4. **分歧仍存**：选 **更保守** 方案（降 LTV、加 timelock、加 cap）
5. **文档化**：Risk acceptance 需多签 / 治理记录，非口头过关

## 示例话术
「如果审计认为 TWAP 窗口 30min 不够，我会先跑 historical manipulation cost 分析；若 5min TWAP 可将攻击 ROI 降到负，我们改参数；若不确定，加 circuit breaker 作为 defense in depth。」

## Staff 信号
- 不 defensive，把审计当协作
- 能提出 **可验证** 的实验让分歧落地`,
  },
]

function sqlString(value) {
  return `'${value.replace(/'/g, "''")}'`
}

function dollarQuote(label, text) {
  let tag = `$${label}$`
  while (text.includes(tag)) tag = `$${label}_${Math.random().toString(36).slice(2)}$`
  return `${tag}${text}${tag}`
}

const questionValues = questions
  .map((q) => {
    const content = dollarQuote(`q${q.sort}`, q.content.trim())
    return `  (
    ${sqlString(q.id)},
    ${sqlString(COLLECTION_ID)},
    ${sqlString(q.title)},
    ${content},
    ${sqlString(q.difficulty)},
    ${q.is_vip},
    ${q.sort}
  )`
  })
  .join(',\n')

const sql = `-- DeFi Staff 智能合约面试题（Prop AMM + DEX Aggregator + MEV）
-- 生成命令: node .sql/generate_seed_defi_staff_interview.mjs
-- 在 Supabase SQL Editor 中执行

BEGIN;

-- 1. 标签（Web3）
INSERT INTO public.interview_tags (id, name, slug, sort)
VALUES (
  ${sqlString(tag.id)},
  ${sqlString(tag.name)},
  ${sqlString(tag.slug)},
  ${tag.sort}
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  sort = EXCLUDED.sort;

-- 2. 题集
INSERT INTO public.interview_collections (id, title, description, icon, sort)
VALUES (
  ${sqlString(collection.id)},
  ${sqlString(collection.title)},
  ${sqlString(collection.description)},
  ${sqlString(collection.icon)},
  ${collection.sort}
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  sort = EXCLUDED.sort;

-- 3. 题集 ↔ 标签
INSERT INTO public.interview_collection_tags (collection_id, tag_id)
SELECT ${sqlString(COLLECTION_ID)}, id
FROM public.interview_tags
WHERE slug = ${sqlString(tag.slug)}
ON CONFLICT DO NOTHING;

-- 4. 清理旧题目（按固定 ID，可重复执行）
DELETE FROM public.interview_question
WHERE id IN (
${questions.map((q) => `  ${sqlString(q.id)}`).join(',\n')}
);

-- 5. 插入题目
INSERT INTO public.interview_question (
  id, collection_id, title, content, difficulty, is_vip, sort
) VALUES
${questionValues}
ON CONFLICT (id) DO UPDATE SET
  collection_id = EXCLUDED.collection_id,
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  difficulty = EXCLUDED.difficulty,
  is_vip = EXCLUDED.is_vip,
  sort = EXCLUDED.sort,
  updated_at = NOW();

COMMIT;

-- 导入后访问: /interview/${COLLECTION_ID}
`

const outPath = new URL('./seed_defi_staff_interview_questions.sql', import.meta.url)
fs.writeFileSync(outPath, sql, 'utf8')
console.log(`Wrote ${outPath.pathname} (${questions.length} questions)`)
