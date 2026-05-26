# Node + TypeScript 代码规范（本项目专项）

> 起草：2026-05-26
> 范围：Claudio 项目 —— pnpm monorepo + Node 20 LTS + TypeScript strict + Fastify + Next.js 15 + drizzle + zod
> 用法：先读 [`CODING_STANDARDS.md`](./CODING_STANDARDS.md) 通用规范，再读本文。冲突时本文优先（更具体）。

本文**只列 Node/TS 特有规则**，通用原则不重复。

---

## 1. TypeScript 配置

### 1.1 强制开启的编译选项

`tools/configs/tsconfig.base.json` 必须包含：

```jsonc
{
  "compilerOptions": {
    "strict": true,                          // 全套 strict
    "noUncheckedIndexedAccess": true,        // arr[0] 类型自动 T | undefined
    "noImplicitOverride": true,              // 重写必须写 override 关键字
    "noPropertyAccessFromIndexSignature": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": true,      // {a?: string} 不接受 {a: undefined}
    "useUnknownInCatchVariables": true,      // catch (e: unknown)
    "verbatimModuleSyntax": true,            // import type 必须显式
    "isolatedModules": true,
    "target": "ES2024",
    "module": "NodeNext",
    "moduleResolution": "NodeNext"
  }
}
```

**理由：** strict 默认还不够严，上面这些把"看起来安全实际有坑"的写法全堵住。

### 1.2 禁止 `any`

`any` = 关掉类型检查，等于裸奔。**必须用 `unknown` + 收窄**：

```ts
// ❌ 反面
function parse(json: any) { return json.user.name }

// ✅ 正面
function parse(json: unknown) {
  return userSchema.parse(json).name   // 用 zod 收窄
}
```

ESLint 强制 `@typescript-eslint/no-explicit-any: error`。极少数确实需要逃生口的场景写 `// eslint-disable-next-line` + **注释解释为什么**。

### 1.3 禁止类型断言 `as`

`as` 是骗编译器，**99% 的 `as` 都可以用类型守卫 / zod / 泛型替代**：

```ts
// ❌ 反面
const user = response as User   // 编译器信你,运行时崩了别哭

// ✅ 正面
const user = userSchema.parse(response)   // 运行时校验 + 类型推断
```

例外：
- `as const`（字面量收窄）允许
- `satisfies` 比 `as` 优先

```ts
// 用 satisfies 不用 as
const config = {
  port: 3000,
  host: 'localhost'
} satisfies ServerConfig   // 仍保留字面量类型,且做兼容性检查
```

### 1.4 禁止非空断言 `!`

`user!.name` 等同于"我赌它非空，崩了不怪我"。**禁止**。

```ts
// ❌ 反面
const name = user!.name

// ✅ 正面
if (!user) throw new NotFoundError('user')
const name = user.name

// 或者
const name = user?.name ?? 'anonymous'
```

例外：测试代码里测试已校验过的值时允许，**必须就近注释原因**。

---

## 2. 类型设计

### 2.1 `type` 优先于 `interface`

| 用 `type`（默认） | 用 `interface`（极少数场景） |
|---|---|
| 联合类型 / 交叉类型 / 工具类型 | 需要 declaration merging |
| DTO / 配置对象 / 字面量收窄 | 类的契约（implements） |
| Discriminated union（区分联合） | |

```ts
// ✅ 默认 type
type Song = {
  id: string
  title: string
  duration: number
}

type BrainOutput =
  | { kind: 'say'; text: string }
  | { kind: 'play'; songIds: string[] }
  | { kind: 'error'; reason: string }
```

### 2.2 Discriminated Union（区分联合）必备

凡是"有几种形态"的数据**必须**用 discriminated union + 字面量标签：

```ts
// ❌ 反面：可选字段拼接,运行时分不清
type Result = {
  ok: boolean
  data?: Song
  error?: string
}

// ✅ 正面：判断 kind 自动收窄
type Result =
  | { kind: 'ok'; data: Song }
  | { kind: 'error'; reason: string }

if (result.kind === 'ok') {
  result.data   // 自动收窄成 Song
}
```

### 2.3 `unknown` > `any`，`never` 用于穷尽检查

```ts
function handle(output: BrainOutput) {
  switch (output.kind) {
    case 'say': return playBubble(output.text)
    case 'play': return queueSongs(output.songIds)
    case 'error': return logError(output.reason)
    default:
      // 编译器强制穷尽,新增 case 没处理这里会报错
      const _exhaustive: never = output
      throw new Error(`Unhandled kind`)
  }
}
```

### 2.4 Branded Types（防止 ID 串台）

`string` 和 `string` 在类型系统里是一样的，但 `SongId` 和 `UserId` 不应该能互换：

```ts
type Brand<T, B> = T & { readonly __brand: B }
type SongId = Brand<string, 'SongId'>
type UserId = Brand<string, 'UserId'>

function getSong(id: SongId): Song { ... }

const userId = 'u-123' as UserId
getSong(userId)   // ❌ 编译报错
```

**关键 ID 全部用 Branded Types**，防止"把 UserId 当 SongId 传进去"这种隐藏 bug。

### 2.5 `Readonly` 默认

DTO / 配置 / 不可变数据加 `readonly`：

```ts
type Song = {
  readonly id: SongId
  readonly title: string
  readonly artists: readonly string[]   // 注意数组也要
}
```

---

## 3. Null / Undefined 处理

### 3.1 默认值用 `??`，不用 `||`

```ts
// ❌ 反面：0 / '' / false 都会被覆盖
const port = config.port || 3000   // config.port = 0 时回到 3000,坑

// ✅ 正面：只有 null/undefined 才用默认值
const port = config.port ?? 3000
```

### 3.2 Optional chaining 链不要超过 3 层

```ts
// ❌ 反面：深链表示数据结构设计有问题
user?.profile?.address?.city?.zipcode

// ✅ 正面：拆出来,或者改类型让中间层非空
const address = user?.profile?.address
if (!address) return null
const zipcode = address.city.zipcode
```

### 3.3 `undefined` vs `null` 选一个用，别混

本项目约定：
- **`undefined`** = "这个字段没设" / "这个值没存在过"
- **`null`** = "明确表示没有"（数据库 / JSON 传输时用）
- 内部代码尽量只用 `undefined`，跟外部接口（数据库 / API）打交道时再翻译

---

## 4. Async / Await

### 4.1 永远不要漏 `await`

ESLint 强制 `@typescript-eslint/no-floating-promises: error`。**漏 await 等于 fire-and-forget**，错误吃掉、顺序错乱：

```ts
// ❌ 反面
async function setup() {
  initDb()              // ← Promise 飞了
  startServer()         // ← 也飞了,谁先完成不知道
}

// ✅ 正面
async function setup() {
  await initDb()
  await startServer()
}

// 真要 fire-and-forget,显式标
void backgroundTask()   // 或加注释解释为什么不等
```

### 4.2 能并行就 `Promise.all`，不要瀑布

```ts
// ❌ 反面：瀑布
const user = await getUser(id)
const playlist = await getPlaylist(id)
const weather = await getWeather()
// 总耗时 = 3 个相加

// ✅ 正面：并行
const [user, playlist, weather] = await Promise.all([
  getUser(id),
  getPlaylist(id),
  getWeather()
])
// 总耗时 = 最慢那一个
```

注意：**有依赖关系的不能并行**（拿 playlist 要先有 user）。

### 4.3 错误必须捕获或往上抛

```ts
// ❌ 反面：promise rejection 被吞
async function load() {
  return fetch(url).then(r => r.json())   // 失败时整个进程挂
}

// ✅ 正面
async function load() {
  try {
    const r = await fetch(url)
    if (!r.ok) throw new HttpError(r.status, r.statusText)
    return await r.json()
  } catch (err) {
    logger.error({ err, url }, 'fetch failed')
    throw err
  }
}
```

### 4.4 `AbortController` 给可取消的操作

长任务（fetch / brain 调用 / TTS）**必须**支持取消：

```ts
async function generateNext(ac: AbortController) {
  const res = await fetch(url, { signal: ac.signal })
  return res.json()
}

// 用户切手动模式时取消所有进行中的 brain 调用
brainControllers.forEach(ac => ac.abort())
```

---

## 5. 模块系统

### 5.1 全 ESM，禁 CommonJS

`package.json` 全部 `"type": "module"`。新文件**禁止** `require()` / `module.exports`。

### 5.2 import 风格

```ts
// ✅ 显式命名导入
import { generateNextSong } from '@claudio/application/use-cases/generate-next-song'

// ✅ 类型导入显式标
import type { Song } from '@claudio/domain'

// ✅ 同包内相对路径
import { ports } from '../ports'

// ✅ 跨包用别名（不写相对路径地狱）
import { Song } from '@claudio/domain'
```

### 5.3 禁止默认导出（utility / module）

```ts
// ❌ 反面
export default function getSong() { ... }   // 调用方爱起啥名起啥名,搜不到

// ✅ 正面
export function getSong() { ... }   // 命名固定,搜得到、refactor 容易
```

**例外**：Next.js 的 page / layout / route handler **必须**默认导出（框架要求）。

### 5.4 Barrel exports 谨慎用

`packages/domain/index.ts` 这种 re-export 文件**允许但要警惕**：

- ✅ 给跨包公开 API 用：`@claudio/domain` 包根目录的 `index.ts`
- ❌ 不要在子目录滥用：循环 import / 误打包整个模块 / Tree-shaking 失效

---

## 6. 文件命名

| 类型 | 风格 | 例 |
|---|---|---|
| 普通文件 | **kebab-case** | `generate-next-song.ts` |
| React 组件 | **PascalCase**（带扩展名 `.tsx`） | `PlayerBar.tsx` |
| 测试文件 | 同名 + `.test.ts` | `generate-next-song.test.ts` |
| 类型定义文件 | 同名 + `.types.ts`（独立时） | `brain.types.ts` |
| 入口 | `index.ts` | |

文件名 = 主要导出的名字（kebab 化）。一个文件 = 一个核心导出 + 相关辅助。

---

## 7. Fastify 专项

### 7.1 Schema first

每个路由**必须**带 zod schema（请求 / 响应都校验）：

```ts
app.post('/api/chat', {
  schema: {
    body: zodToJsonSchema(chatRequestSchema),
    response: { 200: zodToJsonSchema(chatResponseSchema) }
  },
  handler: async (req, reply) => {
    const body = chatRequestSchema.parse(req.body)   // 二次校验 + 类型推断
    const result = await handleChat(body)
    return result   // 自动校验响应
  }
})
```

### 7.2 Plugin scope

Fastify 的 `plugin` 是隔离作用域。**业务模块都注册成 plugin**，不要全堆在一个 `app.ts` 文件：

```ts
// apps/server/src/api/chat.ts
import { FastifyPluginAsync } from 'fastify'
export const chatPlugin: FastifyPluginAsync = async (app) => {
  app.post('/api/chat', { ... })
}

// 注册
await app.register(chatPlugin)
```

### 7.3 不要在 handler 里写业务逻辑

handler 只做三件事：**校验 → 调 use case → 翻译结果**。

```ts
// ❌ 反面：handler 里塞业务
app.post('/api/chat', async (req, reply) => {
  const body = parse(req.body)
  const user = await db.query(...)
  const context = build(...)
  const brainOut = await spawnClaude(...)
  // ... 100 行
})

// ✅ 正面：handler 薄
app.post('/api/chat', async (req, reply) => {
  const body = chatRequestSchema.parse(req.body)
  const result = await container.useCases.handleChat(body)
  return result
})
```

---

## 8. Drizzle ORM 专项

### 8.1 Schema 是单一真相源

DB schema 用 drizzle 写，**类型从 schema 推导**，不要手写 DTO：

```ts
// packages/infrastructure/src/db/schema.ts
export const songs = sqliteTable('songs', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  // ...
})

// 推导类型
export type DbSong = typeof songs.$inferSelect
export type DbSongInsert = typeof songs.$inferInsert
```

domain 层的 `Song` 是业务模型，**不直接用 `DbSong`** —— 在 repo 实现里做映射。

### 8.2 Migration 强制走 drizzle-kit

```bash
pnpm drizzle-kit generate   # 生成 SQL
pnpm drizzle-kit migrate    # 应用
```

**不要手写 SQL 直接改 DB**。所有 schema 改动 = 一个 migration 文件，进 git。

### 8.3 事务包裹多步写

```ts
await db.transaction(async (tx) => {
  await tx.insert(plays).values(...)
  await tx.update(plan).set(...).where(...)
})
```

---

## 9. Zod 专项

### 9.1 Schema 是契约的真相源

shared 包先定义 zod schema，类型从 schema 推导：

```ts
// packages/shared/src/schemas/song.ts
export const songSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  duration: z.number().positive()
})

export type Song = z.infer<typeof songSchema>
```

### 9.2 `.parse` vs `.safeParse`

- `parse` —— 失败抛异常。**只在系统边界用**（route handler / 进程入口）
- `safeParse` —— 返回 `{ success, data | error }`。**业务逻辑里用**，可控错误流

### 9.3 Schema 复用

```ts
// 基础
export const songSchema = z.object({ ... })

// 派生
export const createSongSchema = songSchema.omit({ id: true })
export const updateSongSchema = songSchema.partial()
```

不要复制粘贴 schema。

---

## 10. React / Next.js 15 专项

### 10.1 Server Components 默认，Client 显式

```tsx
// app/page.tsx —— 默认 Server Component
export default async function Page() {
  const data = await fetchData()   // 直接 await,在服务器跑
  return <Player data={data} />
}

// 需要交互 / 状态时单独抽 Client Component
'use client'
export function Player({ data }) {
  const [playing, setPlaying] = useState(false)
  // ...
}
```

**90% 的组件应该是 Server Component**。`'use client'` 只在真正需要时加（事件 / 状态 / 浏览器 API）。

### 10.2 不要在 Client Component 顶部 `'use client'` 然后写 100 行

`'use client'` 像污染：标了之后整个组件树都进 client bundle。**把 client 部分孤立成最小叶子**：

```tsx
// ✅ 父是 Server,只把交互按钮做成 Client
export default async function Page() {
  const song = await getSong()
  return (
    <article>
      <h1>{song.title}</h1>
      <SongCover src={song.cover} />   {/* Server */}
      <LikeButton songId={song.id} />   {/* Client */}
    </article>
  )
}
```

### 10.3 Server Actions vs API Routes

- **Server Actions（`'use server'`）**：表单提交 / 简单状态变更（喜欢、跳过）
- **API Routes（`app/api/.../route.ts`）**：被 PWA fetch / WS / 外部消费

本项目主要走 API Routes（后端是独立 Fastify，不全用 Next 的 API）。Server Actions 备用。

### 10.4 状态管理

| 状态类型 | 工具 |
|---|---|
| Server state（音乐数据 / plan / history） | **TanStack Query**（不用 useState 反复 fetch） |
| Client UI state（输入框、菜单开关） | `useState` |
| URL state（当前页 / 主题 / filter） | URL 参数（搜索参数 / 路由） |
| 跨组件共享 | Context（少用）/ Zustand（如有需要） |

**永远不要把 server state 抄到 client store**（会脏，会过期，会忘同步）。

### 10.5 `useMemo` / `useCallback` 不要乱用

它们本身有成本（保存依赖、对比）。**只在两种情况用**：

1. 计算确实昂贵
2. 引用相等会触发下游 re-render / effect

普通对象 / 数组字面量不需要 `useMemo`。

### 10.6 `<Image>` 必须带 `width` / `height`

防止布局抖动 + 让 Next.js 自动生成 srcset：

```tsx
<Image src={song.cover} width={200} height={200} alt={song.title} />
```

### 10.7 动态导入大依赖

```tsx
const HeavyVisualizer = dynamic(() => import('./HeavyVisualizer'), {
  ssr: false,
  loading: () => <Skeleton />
})
```

---

## 11. 日志（Pino）

### 11.1 结构化日志

```ts
// ❌ 反面
logger.info('user 123 played song abc')

// ✅ 正面：字段化,可查询、可聚合
logger.info({ userId: '123', songId: 'abc' }, 'song played')
```

### 11.2 日志级别约定

| 级别 | 何时用 |
|---|---|
| `fatal` | 进程必死 |
| `error` | 业务失败 + 抛出去了 |
| `warn` | 降级了 / 重试中 / 配置可疑 |
| `info` | 关键业务事件（"用户登录"、"歌切了"） |
| `debug` | 开发期细节 |
| `trace` | 行级追踪 |

**生产默认 `info`，调试时切 `debug`**。

### 11.3 不要打敏感字段

封一层 logger，自动 redact：

```ts
const logger = pino({
  redact: ['cookie', 'password', 'token', '*.cookie', '*.authorization']
})
```

### 11.4 错误必须带原始错误对象

```ts
// ❌ 反面：丢 stack
catch (err) {
  logger.error('failed: ' + err.message)
}

// ✅ 正面：pino 自动序列化 err 字段
catch (err) {
  logger.error({ err, songId }, 'play failed')
}
```

---

## 12. pnpm Workspace 专项

### 12.1 包版本走 catalog

```yaml
# pnpm-workspace.yaml
catalog:
  fastify: ^5.0.0
  zod: ^3.23.0
  drizzle-orm: ^0.36.0
```

```json
// 子包 package.json
{ "dependencies": { "fastify": "catalog:" } }
```

升级 = 改 `pnpm-workspace.yaml` 一处。

### 12.2 工作区引用用 `workspace:*`

```json
{ "dependencies": { "@claudio/domain": "workspace:*" } }
```

### 12.3 命令统一在 root

```jsonc
// 根 package.json
{
  "scripts": {
    "dev": "pnpm -r --parallel run dev",
    "build": "pnpm -r run build",
    "test": "pnpm -r run test",
    "lint": "pnpm -r run lint",
    "typecheck": "pnpm -r run typecheck"
  }
}
```

不要让用户记每个子包的 script 名。

---

## 13. ESLint 必装

### 13.1 必装插件

```jsonc
{
  "plugins": [
    "@typescript-eslint",
    "import",
    "unused-imports",
    "promise"
  ],
  "extends": [
    "@typescript-eslint/strict-type-checked",
    "@typescript-eslint/stylistic-type-checked",
    "plugin:import/recommended",
    "plugin:import/typescript",
    "plugin:promise/recommended"
  ]
}
```

### 13.2 必开规则

```jsonc
{
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-non-null-assertion": "error",
    "@typescript-eslint/no-floating-promises": "error",
    "@typescript-eslint/no-misused-promises": "error",
    "@typescript-eslint/consistent-type-imports": "error",
    "@typescript-eslint/no-import-type-side-effects": "error",
    "no-console": ["error", { "allow": ["warn", "error"] }],
    "unused-imports/no-unused-imports": "error",
    "import/order": ["error", { "newlines-between": "always" }]
  }
}
```

### 13.3 禁用 import 清单

```jsonc
"no-restricted-imports": ["error", {
  "paths": [
    { "name": "axios", "message": "用 undici (Node 原生级 fetch)" },
    { "name": "lodash", "message": "用原生方法或 lodash-es 按需 import" },
    { "name": "moment", "message": "用 date-fns 或原生 Date" }
  ],
  "patterns": [
    { "group": ["**/internal/*"], "message": "不要 import 别的包的 internal/" }
  ]
}]
```

---

## 14. 测试（Vitest）

### 14.1 测试边界，不测内部

```ts
// ✅ 测 use case 的输入输出
test('generateNextSong returns matching mood when given calm signal', async () => {
  const result = await generateNextSong({
    signals: [calmSignal],
    brain: mockBrain,
    ncm: mockNcm
  })
  expect(result.mood).toBe('calm')
})

// ❌ 不测私有辅助函数（脆性 + 锁死实现）
```

### 14.2 Mock 边界，不 mock 内部

mock `Brain` / `NcmClient` / `TtsClient`（这些是 ports），不 mock domain 层的纯函数。

### 14.3 Fastify 用 `app.inject` 测路由

```ts
const res = await app.inject({
  method: 'POST',
  url: '/api/chat',
  payload: { msg: 'hi' }
})
expect(res.statusCode).toBe(200)
```

不用启真实端口。

### 14.4 React 用 `@testing-library/react`

```ts
test('player shows play button when paused', () => {
  render(<Player initialState="paused" />)
  expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument()
})
```

测**用户能看到 / 能操作的**，不测 DOM 内部结构。

---

## 15. 常见陷阱

### 15.1 Date 时区

`new Date()` 是机器本地时间。**跨时区 / 持久化都用 ISO 字符串 + 显式时区**：

```ts
// ✅ 持久化用 ISO
const playedAt = new Date().toISOString()   // "2026-05-26T08:30:00.000Z"

// ✅ 显示给用户用 Intl
new Intl.DateTimeFormat('zh-CN', {
  timeZone: 'Asia/Shanghai',
  dateStyle: 'short',
  timeStyle: 'short'
}).format(new Date(playedAt))
```

不要用 `moment`。日期算用 `date-fns`，少代码 + tree-shake 友好。

### 15.2 `JSON.parse` 必须 try

```ts
// ❌ 反面
const data = JSON.parse(input)   // 输入非法整个进程挂

// ✅ 正面
function safeJsonParse<T>(input: string, schema: ZodSchema<T>): T | null {
  try {
    return schema.parse(JSON.parse(input))
  } catch {
    return null
  }
}
```

### 15.3 `fetch` 不会因 4xx/5xx 抛异常

```ts
// ❌ 反面
const data = await fetch(url).then(r => r.json())   // 500 时 r.json() 可能也成功（解 HTML 错误页）

// ✅ 正面
const r = await fetch(url)
if (!r.ok) throw new HttpError(r.status, r.statusText)
const data = await r.json()
```

### 15.4 EventEmitter 内存泄漏

```ts
emitter.on('data', handler)
// ⚠️ 一定要 off / removeListener,否则 emitter 持续累积监听器
```

`setMaxListeners` 拉高不是修复，是掩盖。

### 15.5 子进程必须 listen `error` + `exit`

```ts
const p = spawn(cmd, args)
p.on('error', err => logger.error({ err }))   // spawn 失败
p.on('exit', code => logger.info({ code }))   // 退出
// 不监听 error 会让进程崩在你不知道的地方
```

### 15.6 大 JSON 别一次加载

流式处理用 `JSONStream` / `stream-json`，否则大文件 OOM。

### 15.7 Promise 在 forEach 里不会被 await

```ts
// ❌ 反面：forEach 不认 async,await 在外面无效
;[1,2,3].forEach(async (id) => {
  await processOne(id)
})
console.log('done')   // 提前打印,processOne 都没完

// ✅ 正面
for (const id of [1,2,3]) {
  await processOne(id)
}
// 或并行
await Promise.all([1,2,3].map(processOne))
```

---

## 16. 工具链强制

每个包 root 必须装：

| 工具 | 作用 |
|---|---|
| `typescript` | 类型 |
| `eslint` + 上面那套插件 | lint |
| `prettier` | 格式 |
| `vitest` | 测试 |
| `husky` + `lint-staged` | pre-commit 自动跑 lint + format + typecheck |

`package.json` 必备 scripts：

```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc -b",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint src --max-warnings 0",
    "format": "prettier --write src",
    "typecheck": "tsc --noEmit"
  }
}
```

`max-warnings 0` —— warning 也当 error 处理。**有警告必须修，不能留**。

---

## 17. 性能基线

- 后端单次 API 响应 < 200ms（不含外部调用 brain / NCM / TTS 等长任务）
- WS 串场字延迟 < 100ms（流式吐字）
- 前端首屏 < 800ms（SW cache）
- PWA bundle 主包 < 300kb gzipped
- DB 查询全部走 index（不允许全表扫）

超出阈值 = 必须有 issue 跟踪。

---

## 18. 与本规范配套

读取顺序：

1. [`CODING_STANDARDS.md`](./CODING_STANDARDS.md) —— 通用语言无关规范
2. **本文件** —— Node / TS / 本项目专项
3. [`PRD.md`](./PRD.md) —— 项目需求 + 架构决策

冲突时**下层覆盖上层**（更具体的优先）。

---

## 附录 · 一句话口诀

> strict 全开 · 禁 any 禁 ! 禁 as · 类型从 schema 推导
> async 必 await · 能并行 Promise.all · catch 捕错往上抛
> Server Component 默认 · use client 孤立到叶子 · 不要把 server state 抄到 client
> 边界一次 zod parse · 内部 safeParse · 错误结构化日志带 err
> Fastify schema first · drizzle migration 进 git · pnpm catalog 集中版本
> ESLint max-warnings 0 · husky pre-commit 全跑 · 别留 console.log
