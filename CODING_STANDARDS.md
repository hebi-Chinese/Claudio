# 通用代码规范（语言无关）

> 起草：2026-05-26
> 目的：跨项目、跨语言的代码质量基线。任何项目都可以直接引用本文件。
> 用法：让 AI 助手在动手写代码前先读本文件，再读项目根目录或语言专项规范。

本文件**只列规则与原因**，不列具体语法（语法在语言专项规范里）。

---

## 0. 总指导原则

**写代码的目的是被人读，机器执行只是副作用。**

三大反模式（任何时候不要做）：

| 反模式 | 表现 | 危害 |
|---|---|---|
| **过度抽象** | 还没用上就先建框架、为想象中的需求预留接口 | 代码膨胀、心智负担、改一处动十处 |
| **过度耦合** | 模块间直接 import 内部细节、共享可变状态 | 改一处崩一片，无法独立测试 |
| **过度沉默** | 静默吞错、降级到默认值、不打日志 | 出 bug 时无迹可寻 |

---

## 1. 核心原则

### 1.1 KISS（Keep It Simple, Stupid）

写**当前**需要的最简方案。不要为想象的未来设计。复杂度是有成本的。

### 1.2 DRY 但不过度（Rule of Three）

- **看到第 1 次重复** → 容忍
- **看到第 2 次重复** → 注意
- **看到第 3 次重复** → 才抽象

提前抽象比重复更糟，因为错误的抽象比重复**更难修改**。

### 1.3 YAGNI（You Aren't Gonna Need It）

不要写"以防万一"的代码。需要的时候再加，证据驱动而非想象驱动。

### 1.4 显式优于隐式

| 反面 | 正面 |
|---|---|
| 修改全局变量 | 显式传参 |
| 自动转换类型 | 显式转换 |
| 默认参数掩盖逻辑 | 显式声明意图 |
| 元编程 / 反射 | 直接调用 |

### 1.5 早返回（Early Return）

```
// 反面：嵌套金字塔
if (user) {
  if (user.isActive) {
    if (user.hasPermission) {
      doWork()
    }
  }
}

// 正面：早返回
if (!user) return
if (!user.isActive) return
if (!user.hasPermission) return
doWork()
```

---

## 2. 复杂度上限（硬性阈值）

| 维度 | 上限 | 触发时怎么办 |
|---|---|---|
| **函数行数** | 50 行 | 拆函数 |
| **类 / 模块行数** | 300 行（理想 < 200） | 按职责拆类 |
| **单文件行数** | 800 行（理想 200-400） | 按功能拆文件 |
| **嵌套深度** | 4 层 | 早返回 / 提取函数 / 反转条件 |
| **函数参数个数** | 4 个 | 多了就传 options 对象 |
| **圈复杂度** | 10 | 拆函数 / 用查表替条件 |
| **同级 if/else 分支** | 5 个 | 用策略表 / 多态 |

**违反阈值不是错，但需要明确理由。** lint 强制 90% 案例，剩下 10% 写 `// 行内豁免：原因` 注释。

---

## 3. 命名

命名是注释的最廉价形式。**好命名 > 任何注释**。

### 3.1 通用规则

- 长度反映作用域：局部用短名（`i` `tmp`），跨文件 / 公开 API 用长名
- 函数名是动词短语（`getUser` `calculateTotal`）
- 类 / 类型是名词（`User` `OrderProcessor`）
- 布尔是 `is*` / `has*` / `can*` / `should*` 开头
- 集合用复数（`users` 不是 `userList`）
- 常量全大写下划线（`MAX_RETRIES`）
- 不要缩写（`config` 不是 `cfg`，`message` 不是 `msg`，**除非缩写是行业通用术语**如 `id` `url` `http` `db`）
- 不要带类型名（`userArray` → `users`，`stringName` → `name`）
- 不要误导（`getUserList()` 不应返回 Set，`fetchData()` 不应触发副作用）

### 3.2 反模式

```
// 反面
const d = 86400000           // 魔数 + 单字母
const m = users.map(...)     // m 是啥？
function process(data)       // process 什么？
class Manager {}             // 万能后缀,什么都装
const flag1 = true           // 数字命名

// 正面
const MILLISECONDS_PER_DAY = 86400000
const userNames = users.map(u => u.name)
function generateMonthlyReport(users)
class OrderRepository {}
const isUserVerified = true
```

### 3.3 单位与领域语义

数值参数附带单位：`timeoutMs`、`maxRetries`、`limitBytes`、`pricePerUnitUsd`。

---

## 4. 重复消除

### 4.1 真重复 vs 假重复

- **真重复**：业务规则同步变化（"会员折扣"算法）→ 必须抽象
- **假重复**：两段代码长得像但**未来会独立演进** → 不要抽象（强行 DRY 会绑死它们）

**判断标准：** 如果未来会以**不同原因**修改两处，那是巧合的相似，不要合并。

### 4.2 拆分的成本

抽象一个共用函数时问自己：

- 调用方需要传多少参数才能复用？
- 调用方能看懂这个函数在做什么吗？
- 这个函数会成为"什么都加一点的垃圾桶"吗？

宁可让两段代码独立演进，也不要做出**调用方不敢改、维护方不敢删**的"通用工具"。

---

## 5. 错误处理

### 5.1 三种正确做法

| 场景 | 做法 |
|---|---|
| 能处理 | 当场处理 + 记日志 |
| 不能处理但调用方需要知道 | 抛 / 向上传 |
| 不能处理且不需要传播 | 记日志 + 降级，注释写明降级理由 |

### 5.2 严禁的反模式

- **静默吞**：`try { ... } catch {}` 不带任何处理 = 把 bug 埋进土
- **空 catch + 默认值**：故障变成"奇怪的数据"
- **吞掉错误链**：`throw new Error("failed")` 丢了原始 stack trace
- **过度包裹**：所有调用都 `try/catch` 一遍，意义为零

### 5.3 错误信息

错误消息给**人**看，不是给代码看：

```
// 反面
throw new Error("E001")
throw new Error("failed")

// 正面
throw new Error("Failed to fetch user 42 from /api/users: timeout after 5s")
```

包含：**做什么、为什么失败、相关 ID / 上下文**。

### 5.4 边界 vs 内部

| 位置 | 错误策略 |
|---|---|
| 系统边界（HTTP / RPC / CLI 入口） | 捕获所有未处理错误，返回结构化错误 + 记日志 |
| 内部函数 | 失败就抛，让最近的边界处理 |

---

## 6. 输入校验

### 6.1 边界处校验，内部信任

只在数据**第一次进入系统**时校验（HTTP body / CLI 参数 / 外部 API 响应 / 文件读取）。一旦校验通过，内部函数就**信任**类型 —— 不要在每层都校验一遍。

```
// 反面：层层校验
function processUser(user) {
  if (!user) throw ...
  if (!user.id) throw ...
  return formatUser(user)
}
function formatUser(user) {
  if (!user) throw ...      // 重复
  if (!user.name) throw ... // 重复
  ...
}

// 正面：边界一次性校验
const validatedUser = userSchema.parse(rawInput)  // 边界
processUser(validatedUser)  // 内部信任类型
```

### 6.2 永远不信任的输入源

用户输入、外部 API、文件内容、环境变量、数据库查询结果（schema 漂移可能）、子进程 stdout。

---

## 7. 不可变性

### 7.1 默认不可变

- 函数参数：不修改传入对象
- 集合操作：返回新集合（`map` / `filter` / `reduce`），不原地改
- 配置对象：构造后冻结
- 类字段：能用 `readonly` / `final` 就用

### 7.2 例外：性能敏感场景

热点循环、大数组、流式处理等性能敏感场景**允许**原地变更，但：
- 函数命名标明：`sortInPlace()` 而不是 `sort()`
- 文档注释说明
- 调用方有心理预期

---

## 8. 副作用控制

### 8.1 纯函数优先

纯函数 = 相同输入产生相同输出 + 不修改外部状态。**测试容易、推理容易、复用容易**。

业务逻辑核心层尽量写纯函数，副作用（DB / HTTP / 文件 / 时间 / 随机）推到边缘。

### 8.2 副作用集中

副作用集中在"叶子"位置（adapter / handler），不要散落在业务逻辑中间。这样：
- 单元测试可以 mock 叶子
- 业务逻辑可以独立 reasoning

### 8.3 时间和随机是副作用

`new Date()` / `Math.random()` / `uuid()` 都是副作用。要么从外面注入，要么放在边界。

---

## 9. 注释 ★

> 用户特别强调："**该加加，别太详细。太详细维护时改起来费劲。**"

### 9.1 注释的目的：解释 WHY，不解释 WHAT

- **WHAT** 由代码 + 命名表达。**好命名 = 不用写 what**
- **WHY** 写在注释里：为什么这么做、为什么不那么做、什么时候会出问题

```
// 反面：复读机
// 把 user 的 age 加 1
user.age = user.age + 1

// 反面：什么都没说
// 处理用户
function processUser(user) { ... }

// 正面：解释 WHY
// 后端 schema 还没加 age,临时本地累加;等 v2 schema 迁移后删
user.age = user.age + 1

// 正面：解释非显然约束
// 必须先调 ensureAuth(),否则 cookie 还没下来 fetch 会被风控
await ensureAuth()
await fetchData()
```

### 9.2 必须加注释的场景

- **非显然的业务规则**："VIP 用户跳过这个验证"
- **绕过 / workaround**："NCM v4 接口对 cookie 大小敏感,手动截断"
- **危险操作警示**："这里删数据前没二次确认,调用方负责"
- **数学 / 算法**：一句话说思路（"用 Boyer-Moore 投票求众数"）
- **TODO / FIXME / HACK**：带日期 + 上下文（见 §9.5）
- **公开 API**：文档注释（一行说做什么，不必每个参数都写）
- **决策记录**：为什么这么选而不是那么选（如果选择有争议）

### 9.3 不要写的注释

```
// ❌ 复读代码
i++  // 自增 i

// ❌ 过时注释
// 旧逻辑:从 v1.api 取数据   ← v1.api 早就删了

// ❌ 显然到无意义
// 构造函数
constructor() { ... }

// ❌ 注释掉的死代码
// const oldWay = legacy()
// processOldWay(oldWay)

// ❌ 个人吐槽 / 情绪化
// 这破设计真烂,谁写的?
```

### 9.4 文档注释（公开 API / 复杂函数）

**一行原则**：函数注释 1 行说做什么 + 1 行说返回值约定。不写每个参数（参数名 + 类型已经表达），除非有非显然约束。

```
// 反面：详细到累赘
/**
 * 获取用户
 * @param {string} id - 用户的唯一标识符,必须是 UUID 格式
 * @param {object} options - 配置选项
 * @param {boolean} options.includeProfile - 是否包含 profile,默认 false
 * @param {number} options.timeout - 超时时间(毫秒),默认 5000
 * @returns {Promise<User | null>} 返回用户对象,如果不存在返回 null
 * @throws {NotFoundError} 当用户不存在时抛出
 * @example
 *   const user = await getUser('abc-123')
 */

// 正面：精炼
/** 拉用户;不存在返回 null,不抛 NotFoundError(留给调用方判断) */
async function getUser(id: string, options?: { includeProfile?: boolean; timeoutMs?: number }): Promise<User | null>
```

### 9.5 TODO / FIXME / HACK 格式

```
// TODO(2026-05-26): 加分页,数据量超过 1000 才有意义
// FIXME(2026-05-26): NCM cookie 过期没刷新,临时手动重启;追到根因再改
// HACK(2026-05-26): 绕过 chrome 自动播放限制,等用户首次点击后再 unmute
```

- **TODO** = 计划要做但当下没做
- **FIXME** = 已知 bug，临时绕开
- **HACK** = 不优雅但有效，记录原因

**必须带日期**。半年后看到没日期的 TODO 等于看到孤魂野鬼。

### 9.6 注释和代码必须同步修改

修改代码时**必须看周围注释是否仍准确**，不准确就改 / 删。**注释腐烂（comment rot）= 比没注释更糟**，因为它会误导读者。

### 9.7 文件 / 模块顶部注释

可选。如果有，写：
- 这个模块负责什么（1 行）
- 跟谁交互（可选）
- 非显然的约束（如果有）

不要写：作者名（git 知道）、修改历史（git 知道）、版权（License 文件管）。

---

## 10. 测试

### 10.1 覆盖率目标

- 业务逻辑 / 核心模块：**80%+ 行覆盖**
- 适配器 / 边缘代码：**关键路径覆盖即可**
- UI 组件：用快照 + 关键交互测试，不强求覆盖率

### 10.2 AAA 模式

```
// Arrange  准备
const user = makeUser({ vip: true })

// Act      执行
const result = calculateDiscount(user, 100)

// Assert   断言
expect(result).toBe(90)
```

三段之间空行分隔，结构清晰。

### 10.3 测试命名

描述**行为**而非实现：

```
✅ 'returns 0 when input array is empty'
✅ 'throws when user is unauthorized'
✅ 'retries 3 times before giving up'

❌ 'test1'
❌ 'works'
❌ 'calculateDiscount test'
```

### 10.4 一个测试一个断言（principle，可破例）

测试失败时应该一眼看出**哪里**坏了。多断言 = 多个失败原因混在一起。

### 10.5 别 mock 你正在测的东西

mock 外部依赖，不要 mock 被测函数自己的内部。否则测试通过 = 你写的 mock 工作正常 ≠ 代码工作正常。

---

## 11. 提交 / PR

### 11.1 小步提交

一个提交 = 一个逻辑变更。**别把"重构 + 新功能 + 修 bug"塞进一个 commit**，review 时会哭。

### 11.2 提交信息格式（Conventional Commits）

```
<type>: <短描述>

[可选正文 - 解释 WHY]
```

type：`feat` / `fix` / `refactor` / `docs` / `test` / `chore` / `perf` / `ci`

例子：
```
feat: add NCM cold start snapshot puller

fix: handle empty playlist when /user/playlist returns null
  Cause: NCM API silently returns null for users with 0 playlists
  instead of empty array. Treat as empty array on our side.
```

### 11.3 PR 描述模板

- **目标**：解决什么问题
- **方案**：怎么解决的（高层）
- **测试**：怎么验证的
- **关联**：issue / PR / 文档链接

---

## 12. 安全基线

| 项 | 规则 |
|---|---|
| 密钥 | **永远不入库**，全走环境变量 + `.env.example` placeholder |
| 用户输入 | 边界处校验 + 转义 |
| SQL | 永远参数化查询，不拼字符串 |
| 文件路径 | 校验不越界（防 `../../etc/passwd`） |
| 序列化 | 不反序列化不可信数据 |
| 日志 | 不打密码 / token / 完整 cookie |
| 错误消息 | 不向外部泄露内部路径 / 堆栈 |
| 依赖 | 定期跑 `pnpm audit` / `npm audit` |

---

## 13. 性能

### 13.1 不要过早优化

> Premature optimization is the root of all evil. — Knuth

**先正确，再快**。优化前先**测量**找瓶颈（profiler / benchmark），不要猜。

### 13.2 算法优于微优化

`O(n²)` → `O(n log n)` 比"调小循环里少声明一个变量"重要 1000 倍。

### 13.3 内存

- 大对象 / 流处理用迭代器，不要一次加载全部
- 注意闭包持有大对象的引用（内存泄漏经典坑）
- 监听器 / 定时器要清理

---

## 14. 死代码 / 注释代码

**严禁**保留注释掉的代码块。理由：

- 没人敢删（"万一以后要用呢"）
- 没人敢改（"不知道当初为什么注释"）
- 代码搜索全是噪音
- git 知道历史，**信任版本控制**

需要回滚就 `git revert` / `git checkout`，不要在主分支留尸体。

---

## 15. 代码评审清单

提 PR 前自查：

- [ ] 编译 / lint / 类型检查通过
- [ ] 测试通过 + 新代码有测试
- [ ] 命名清晰，没有 `tmp` / `data` / `obj` 这种含义为零的名
- [ ] 函数 < 50 行 / 文件 < 800 行 / 嵌套 < 4 层
- [ ] 没有 console.log / 调试打印 / 注释掉的代码
- [ ] 注释解释 WHY 不是 WHAT
- [ ] 错误处理显式，没有静默吞
- [ ] 不可变默认，副作用集中
- [ ] 没有硬编码密钥 / 路径
- [ ] 用户输入有校验
- [ ] commit message 符合 Conventional Commits

---

## 16. 与本规范配套的语言专项规范

本文件是**语言无关**的总则。具体写代码时还要读：

- `CODING_STANDARDS_NODE_TS.md`（TypeScript / Node.js 专项）
- `CODING_STANDARDS_PYTHON.md`（Python 专项，如有）
- `CODING_STANDARDS_GO.md`（Go 专项，如有）
- 项目根目录的 `CLAUDE.md` / `README.md`（项目特有约定）

读取顺序：**本通用规范 → 语言专项 → 项目特有**。下层覆盖上层冲突。

---

## 附录 · 一句话口诀

> 显式优于隐式 · 早返回不嵌套 · 函数 50 行类 300 行 · 命名优先于注释 · 注释写 WHY 不写 WHAT
> 边界一次校验内部信任 · 不可变为默认 · 副作用推到边缘
> 错误别静默 · 重复 3 次再抽象 · 注释带日期不要孤魂野鬼 · 注释掉的代码必须删

