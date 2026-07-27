# 合约 ABI 用法说明

本文档说明三个链上合约各自方法的用途、调用方与注意事项。精度统一为 **6 位小数**（`1e6 = 1` 个单位）；Token 与 USDT **1:1** 锚定。

部署后你会得到三个地址：

| 合约 | 角色 |
|---|---|
| **Token** | 主合约：ERC20 代币、mint/redeem、税、授权转账、储备投资、管理员入口 |
| **LimitGate** | 赎回额度闸门（单笔上限 + 全服 UTC 日总额） |
| **RedeemQueue** | 超限赎回的票据队列（管理员批准制） |

普通用户和前端 **主要对接 Token**；查询额度、票据状态时只读调用 Gate / Queue。

生成 ABI 文件：

```bash
forge build
# ABI 位于 out/Token.sol/Token.json
#       out/LimitGate.sol/LimitGate.json
#       out/RedeemQueue.sol/RedeemQueue.json
```

部署构造签名：

```solidity
LimitGate(uint256 perTxLimit, uint256 globalDailyLimit)
RedeemQueue()
Token(address usdt, string name, string symbol, address limitGate, address redeemQueue, address investmentVault)
```

`investmentVault` 必须是 **外部地址**（EOA / 多签），不能是 Token / RedeemQueue / LimitGate 自身。

---

## 核心概念（读方法前先懂这些）

### 即时赎回 vs 入队赎回

用户调用 `Token.redeem(amount)` 时，须同时满足 **三关** 才会即时赎回：

1. **单笔 ≤ perTxLimit**
2. **当日已用 + amount ≤ globalDailyLimit**
3. **金库 USDT 余额 ≥ amount**（M17 部分储备后新增条件）

**三关都过** → 当场烧币、当场打 USDT（即时赎回）。  
**任一不过** → **不 revert**，代币锁进 Queue、生成 Pending 票据，等管理员批准后再 `claim`。

> M17 后管理员可把储备提出投资，链上 USDT 余额可能 < `totalSupply()`，即时赎回能力不再保证。

### 部分储备与投资金库（M17）

- 管理员可通过 `withdrawReserve` 把金库 USDT 提到当前 `investmentVault` 去投资
- 链上只记账 `totalWithdrawnForInvestment`，**不验证**投资资产是否真实存在（链下信任）
- 账面守恒：`金库 USDT + totalWithdrawnForInvestment ≥ totalSupply()`
- 变更 `investmentVault` 须 **propose → 等待 2 天 → accept**；窗口内可 `cancelPendingInvestmentVault`
- `withdrawReserve` **无 `to` 参数**，只能提到当前生效的 `investmentVault`

**投资金库地址限制**：禁止设为 Token 自身、RedeemQueue、LimitGate，防止自转账虚增账面后 `rescueExcessUsdt` 提走真实储备。

### 票据状态机

```
Pending ──管理员 approve──► Approved ──持有人 claim──► Claimed（终态）
   │                            │
   ├──管理员 reject──► Rejected   ├──持有人 cancel──► Cancelled
   └──持有人 cancel──► Cancelled   └──持有人 cancel──► Cancelled
```

- **无时间锁**：入队后只等管理员批准，没有 unlockTime
- `claim` 要求 `Approved` 且金库 USDT 足够；**不足时 revert，票据仍为 Approved**（可等回流后再 claim）
- 管理员 approve 后仍可能提走储备，**不保证即时兑付**（部分储备固有风险）
- `cancel` / `reject` 只退 Token，不动 USDT；**暂停期间仍可用**（紧急退出）
- `claim` **暂停时不可用**（会转出 USDT）

### 转账税（固定数额，非比例）

- 仅 **用户间** `transfer` / `transferFrom` / 授权转账 收税
- `taxAmount` 是固定值（如 `1e6` = 1 个单位），从转出额中扣：A 转 100、税 1 → B 收 99、税收地址收 1
- **零税路径**：mint、redeem、入队、claim、cancel、reject、合约自身及托管地址内部流转
- 转账额必须 **严格大于** `taxAmount`，否则 revert

### 暂停语义

| 路径 | 暂停时 |
|---|---|
| `mint` / `redeem` / `transfer` / `transferFrom` / 授权转账 | **revert** |
| `claim` | **revert**（转出 USDT） |
| `withdrawReserve` | **revert**（减少可赎回储备） |
| `returnReserve` | **允许**（还钱对用户有利） |
| `reject` / `cancel` | **允许**（只退 Token，紧急出口） |
| `propose/accept/cancelInvestmentVault` | **允许**（管理员参数设置） |
| `setTax*` / `setPerTxLimit` / `pause` / `unpause` / rescue 系列 | **允许** |

---

## Token 合约

### 只读 / 元数据

| 方法 | 用途 |
|---|---|
| `name()` / `symbol()` / `decimals()` | ERC20 元数据；`decimals` 固定返回 `6` |
| `totalSupply()` | 流通 Token 总量 |
| `balanceOf(account)` | 某地址 Token 余额 |
| `allowance(owner, spender)` | 授权额度 |
| `USDT()` | 锚定 USDT 合约地址 |
| `redeemQueue()` | 队列合约地址 |
| `limitGate()` | 闸门合约地址 |
| `admin()` | 当前管理员 |
| `pendingAdmin()` | 待接受的新管理员（两步转移中间态） |
| `paused()` | 是否全局暂停 |
| `taxAmount()` | 固定税额（6 位精度） |
| `taxReceiver()` | 税收接收地址 |
| `isTaxExempt(account)` | 该地址是否免税（合约自身永远免税） |
| `authorizationState(authorizer, nonce)` | 某 nonce 是否已使用或已取消 |
| `investmentVault()` | 当前生效的投资金库地址 |
| `pendingInvestmentVault()` | 待生效的新投资金库（时间锁中间态） |
| `investmentVaultEffectiveTime()` | 新金库可 accept 的最早时间戳 |
| `VAULT_TIMELOCK()` | 金库变更时间锁常量（`2 days`） |
| `totalWithdrawnForInvestment()` | 已提取去投资的累计账面额 |

### 用户操作 — 铸造与赎回

| 方法 | 调用方 | 用途 |
|---|---|---|
| `mint(usdtAmount)` | 用户 | 存入等量 USDT，铸造 Token。需先 `USDT.approve(Token, amount)`。暂停时 revert |
| `redeem(amount)` | 用户 | 赎回 Token 换回 USDT。额度够且金库 USDT 够则即时完成；否则锁币入队（不 revert）。暂停时 revert |

**mint 示例逻辑**：转 `100e6` USDT → 获得 `100e6` Token。

**redeem 示例逻辑**：

- 即时：烧 `50e6` Token → 收 `50e6` USDT，Gate 日计数器累加
- 入队（限额不过）：Token 转入 Queue 托管，生成 `ticketId`，状态 `Pending`
- 入队（金库 USDT 不足）：同上，即使单笔/日限额已通过

### 用户操作 — ERC20 转账

| 方法 | 调用方 | 用途 |
|---|---|---|
| `transfer(to, value)` | 持有人 | 标准 ERC20 转账；用户间转账可能扣税 |
| `approve(spender, value)` | 持有人 | 授权第三方代转 |
| `transferFrom(from, to, value)` | 被授权方 | 代扣转账；可能扣税 |

### 用户操作 — EIP-712 授权转账（免 gas 代付）

用户离线签名，relayer 上链执行。

| 方法 | 调用方 | 用途 |
|---|---|---|
| `transferWithAuthorization(from, to, value, validAfter, validBefore, nonce, v, r, s)` | 任何人 | 单笔授权转账；签名须由 `from` 签署；nonce 一次性 |
| `batchTransferWithAuthorization(from, tos[], amounts[], validAfter, validBefore, nonce, v, r, s)` | 任何人 | 批量授权转账（最多 200 笔）；全或无原子执行 |
| `cancelAuthorization(authorizer, nonce)` | `authorizer` 本人 | 作废尚未使用的授权 nonce |

时间窗约束：`validAfter < now < validBefore`，且 `validBefore - validAfter ≤ 15 分钟`。

### 管理员 — 权限与暂停

| 方法 | 调用方 | 用途 |
|---|---|---|
| `transferAdmin(nextAdmin)` | admin | 提议新管理员；新地址须调用 `acceptAdmin` |
| `acceptAdmin()` | pendingAdmin | 接受管理员权限 |
| `pause()` | admin | 全局暂停 |
| `unpause()` | admin | 解除暂停 |

### 管理员 — 税收

| 方法 | 调用方 | 用途 |
|---|---|---|
| `setTaxAmount(amount)` | admin | 设置固定税额；`0` 表示不收税 |
| `setTaxReceiver(receiver)` | admin | 设置税收地址；不可为零地址 |
| `setTaxExempt(account, exempt)` | admin | 设置免税名单（from 或 to 免税则不收税） |

### 管理员 — 储备投资（M17）

| 方法 | 调用方 | 用途 |
|---|---|---|
| `withdrawReserve(amount)` | admin | 把金库 USDT 提到当前 `investmentVault`；累加 `totalWithdrawnForInvestment`。**暂停时 revert** |
| `returnReserve(amount)` | 任何人 | 往金库还 USDT；账面 `totalWithdrawnForInvestment` 回冲（上限为当前账面值）。**暂停时仍可用** |
| `proposeInvestmentVault(newVault)` | admin | 提议变更投资金库；启动 2 天时间锁。不可为零地址或内部合约地址 |
| `acceptInvestmentVault()` | admin | 时间锁到期后使新金库生效 |
| `cancelPendingInvestmentVault()` | admin | 撤销待生效的金库变更 |

**withdrawReserve 要点**：

- 只能提到 **当前** `investmentVault`，调用方无法指定收款地址
- 可提至链上余额为 0（无储备率下限）
- 提取后即时赎回可能失败（金库不足时 `redeem` 入队）

**returnReserve 要点**：

- 无需管理员权限（还钱是好事）
- 回流超过账面 `totalWithdrawnForInvestment` 的部分留在金库，可被 `rescueExcessUsdt` 处理

### 管理员 — 误转资产救援

仅可提走 **超额 / 误转** 部分，不能动用户储备与锁仓。

| 方法 | 用途 |
|---|---|
| `rescueExcessUsdt(to)` | 提走账面超额 USDT：`excess = (balance + totalWithdrawnForInvestment) - totalSupply()`；实际转出 `min(excess, balance)` |
| `rescueExcessToken(to)` | 提走 Queue 中超过 `totalLocked` 的 Token（用户锁仓之外） |
| `rescueSelfToken(to)` | 提走误转到 Token 合约自身的全部 Token |
| `rescueGateToken(to)` | 提走误转到 LimitGate 的全部 Token |
| `rescueOtherToken(token, to)` | 提走误转到 Token 合约的其他 ERC20（不含 USDT 和 Token 本身） |

救援路径 **不受暂停影响**。

### 内部接口（前端勿调）

| 方法 | 调用方 | 用途 |
|---|---|---|
| `queueTransfer(to, amount)` | 仅 RedeemQueue | 队列退币 / 转账给用户 |
| `queueBurn(amount)` | 仅 RedeemQueue | claim 时销毁托管 Token |
| `queuePayUsdt(to, amount)` | 仅 RedeemQueue | claim 时向用户支付 USDT |

---

## LimitGate 合约

Gate 的 `admin()` 动态等于 `Token.admin()`；改 Token 管理员后 Gate 权限同步切换。

### 只读

| 方法 | 用途 |
|---|---|
| `tokenContract()` | 绑定的 Token 地址 |
| `admin()` | 当前管理员（= Token.admin()） |
| `perTxLimit()` | 单笔赎回上限（固定值，非百分比） |
| `globalDailyLimit()` | 全服 UTC 日赎回总额上限 |
| `globalUsedToday()` | 今日已消耗的即时赎回额度（跨 UTC 日自动归零） |
| `checkLimits(user, amount)` | 返回 `(userOk, globalOk)` 两关是否通过；**只读，不改状态** |

### 管理员写操作

| 方法 | 调用方 | 用途 |
|---|---|---|
| `setPerTxLimit(limit)` | admin | 调整单笔上限（即时生效） |
| `setGlobalDailyLimit(limit)` | admin | 调整全服日上限（即时生效） |
| `rescueToken(token, to)` | admin | 提走误转到 Gate 的非 Token ERC20 |

> **注意**：`setPerTxLimit` / `setGlobalDailyLimit` 在 **LimitGate 合约上调用**，不在 Token 上。

### 协议内部

| 方法 | 调用方 | 用途 |
|---|---|---|
| `consume(user, amount)` | 仅 Token | 即时赎回成功后累加日计数器 |
| `setToken(token)` | 仅部署者、一次性 | 部署时绑定 Token，防抢跑 |

---

## RedeemQueue 合约

Queue 的 `admin()` 同样动态等于 `Token.admin()`。

### 只读

| 方法 | 用途 |
|---|---|
| `tokenContract()` | 绑定的 Token 地址 |
| `admin()` | 当前管理员 |
| `nextTicketId` | 下一张票据 ID（公开状态变量，自动递增） |
| `totalLocked` | 所有 Pending + Approved 票据锁仓 Token 总额 |
| `totalApproved` | 所有 Approved 待兑付 Token 总额（**不保证金库 USDT 即时够付**，M17 后须结合 `USDT.balanceOf(Token)` 判断） |
| `getTicket(ticketId)` | 查询票据：`{ owner, amount, status }` |

**TicketStatus 枚举**：`None(0), Pending(1), Approved(2), Claimed(3), Cancelled(4), Rejected(5)`

### 用户写操作

| 方法 | 调用方 | 用途 |
|---|---|---|
| `claim(ticketId)` | 票据 owner | 已批准票据：烧托管 Token + 收 USDT。**暂停时 revert**；USDT 不足时 revert 且票据 **仍为 Approved** |
| `cancel(ticketId)` | 票据 owner | 取消 Pending 或 Approved 票据，退回托管 Token。**暂停时仍可用** |

用户 **不直接** 调用 `requestRedeem`——由 `Token.redeem` 在超限时内部触发。

### 管理员写操作

| 方法 | 调用方 | 用途 |
|---|---|---|
| `approve(ticketId)` | admin | Pending → Approved |
| `reject(ticketId)` | admin | Pending → Rejected，退 Token。**暂停时仍可用** |
| `rescueToken(token, to)` | admin | 救援误转资产：非 Token 全额；Token 仅超额部分 |

### 协议内部

| 方法 | 调用方 | 用途 |
|---|---|---|
| `requestRedeem(user, amount)` | 仅 Token | 创建 Pending 票据，锁仓计数 +amount |
| `setToken(token)` | 仅部署者、一次性 | 部署时绑定 Token |

---

## 典型集成流程

### 1. 买入（mint）

```text
1. USDT.approve(Token, amount)
2. Token.mint(amount)
3. 用户 Token 余额 += amount
```

### 2. 即时卖出（redeem，额度内且金库够）

```text
1. 可选：LimitGate.checkLimits(user, amount) 预判限额
2. 可选：USDT.balanceOf(Token) >= amount 预判金库是否够
3. Token.redeem(amount)
4. 用户 Token 减少，USDT 到账
```

### 3. 超限或金库不足（入队 → 批准 → 领取）

```text
1. Token.redeem(amount)          → 查 RedeemRequested 事件得 ticketId
2. （链下）管理员监控 Pending
3. RedeemQueue.approve(ticketId) → 管理员
4. RedeemQueue.claim(ticketId)   → 用户自领 USDT（金库不足时 revert，可稍后重试或 cancel）
```

用户也可在 Pending/Approved 阶段 `cancel(ticketId)` 取回 Token。

### 4. 授权转账（relayer 代付 gas）

```text
1. 用户离线签 EIP-712 结构化数据
2. relayer 调 transferWithAuthorization(...) 或 batchTransferWithAuthorization(...)
3. 查 authorizationState(authorizer, nonce) == true 表示已消费
```

### 5. 前端预判 redeem 路径

```solidity
(bool userOk, bool globalOk) = limitGate.checkLimits(user, amount);
uint256 vaultBalance = IERC20(token.USDT()).balanceOf(token);
if (userOk && globalOk && vaultBalance >= amount) {
    // 预计即时赎回
} else {
    // 预计入队（限额不过或金库 USDT 不足）
}
```

### 6. 储备投资（管理员）

```text
1. Token.withdrawReserve(amount)     → USDT 到 investmentVault，账面累加
2. （链下投资）
3. 任何人 Token.returnReserve(amount) → USDT 回金库，账面回冲
```

变更投资金库：

```text
1. Token.proposeInvestmentVault(newVault)
2. 等待 VAULT_TIMELOCK（2 天）
3. Token.acceptInvestmentVault()
   或 Token.cancelPendingInvestmentVault() 撤销
```

---

## 主要事件（监听用）

### Token

| 事件 | 含义 |
|---|---|
| `Minted(account, usdtAmount)` | 铸造成功 |
| `Redeemed(account, amount)` | 即时赎回成功 |
| `Transfer(from, to, value)` | ERC20 转账（含税时可能有两笔：收款人 + taxReceiver） |
| `TaxAmountSet` / `TaxReceiverSet` / `TaxExemptSet` | 税收参数变更 |
| `Paused` / `Unpaused` | 暂停状态变更 |
| `AdminTransferProposed` / `AdminTransferred` | 管理员转移 |
| `AuthorizationUsed(authorizer, nonce)` | 授权转账已执行 |
| `AuthorizationCanceled(authorizer, nonce)` | 授权已作废 |
| `UsdtRescued` / `SelfTokenRescued` / `TokenRescued` | 救援操作 |
| `InvestmentVaultProposed(newVault, effectiveTime)` | 投资金库变更已提议 |
| `InvestmentVaultChanged(vault)` | 投资金库已生效 |
| `InvestmentVaultCancelled()` | 待生效金库变更已撤销 |
| `ReserveWithdrawn(vault, amount)` | 储备已提取到投资金库 |
| `ReserveReturned(from, amount, bookkeepingReduction)` | 储备已回流 |

### LimitGate

| 事件 | 含义 |
|---|---|
| `Consumed(user, amount, dayId)` | 即时赎回消耗日额度 |
| `PerTxLimitSet` / `GlobalDailyLimitSet` | 限额调整 |
| `TokenBound(token)` | 绑定 Token |

### RedeemQueue

| 事件 | 含义 |
|---|---|
| `RedeemRequested(ticketId, owner, amount)` | 入队成功 |
| `RedeemApproved(ticketId)` | 管理员批准 |
| `RedeemRejected(ticketId)` | 管理员拒绝 |
| `RedeemClaimed(ticketId)` | 用户领取完成 |
| `RedeemCancelled(ticketId)` | 用户取消 |
| `TokenBound(token)` | 绑定 Token |

---

## 常见 revert 原因速查

| 报错片段 | 常见原因 |
|---|---|
| `Admin: paused` | 合约已暂停（含 `withdrawReserve`） |
| `Admin: not admin` | 非管理员调用管理方法 |
| `Tax: amount must exceed tax` | 转账额 ≤ 固定税额 |
| `RedeemQueue: not approved` | claim 时票据非 Approved |
| `RedeemQueue: not cancellable` | cancel 时票据已终态 |
| `RedeemQueue: insufficient USDT` | claim 时金库 USDT 不够；票据仍为 Approved |
| `LimitGate: limit exceeded` | 内部 consume 时额度不足 |
| `auth: zero recipient` | 授权转账收款人为零地址 |
| `AuthorizationInvalid` / `AuthorizationAlreadyUsed` | 签名无效或 nonce 已用 |
| `Token: no excess usdt` | 救援 USDT 时账面无超额（`balance + totalWithdrawn ≤ totalSupply`） |
| `Token: no rescuable balance` | 有账面超额但链上余额为 0，无法转出 |
| `ReserveManager: zero vault` | 投资金库为零地址 |
| `vault cannot be internal` | 投资金库为 Token / Queue / Gate 等内部地址 |
| `ReserveManager: timelock not elapsed` | 金库变更时间锁未到 |
| `ReserveManager: no pending vault` | 无待生效金库却调 accept |
| `ReserveManager: insufficient balance` | 提取额超过金库 USDT 余额 |
| `ReserveManager: zero amount` | 提取或回流金额为零 |

---

## 权限一览

| 操作 | 谁可以调 |
|---|---|
| mint / transfer / redeem / claim | 任意 EOA（claim 须为票据 owner） |
| returnReserve | 任何人 |
| approve / reject / setTax* / pause / rescue* / withdrawReserve / propose*Vault | Token.admin() |
| setPerTxLimit / setGlobalDailyLimit | Token.admin()，在 **LimitGate** 合约上调用 |
| consume / requestRedeem / queue* | 仅 Token 合约 |
| setToken（绑定） | 仅各模块部署者，各一次 |
| transferWithAuthorization | 任何人（须有效签名） |
| cancelAuthorization | 仅 authorizer 本人 |

---

## 前端建议只读组合查询

| 场景 | 建议查询 |
|---|---|
| 用户能否即时赎回 | `checkLimits` + `USDT.balanceOf(Token)` + `paused()` |
| 已批准票据能否 claim | `getTicket(id).status == Approved` + `USDT.balanceOf(Token) >= ticket.amount` |
| 储备健康度 | `totalSupply()`、`USDT.balanceOf(Token)`、`totalWithdrawnForInvestment()` |
| 投资金库是否在变更中 | `pendingInvestmentVault()`、`investmentVaultEffectiveTime()` |
| 队列积压 | `totalLocked`、`totalApproved`、`nextTicketId` |
