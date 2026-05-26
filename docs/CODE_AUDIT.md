# Claudio · 代码规范自审报告

> 起草: 2026-05-26
> 触发: 用户提醒 "严于律己宽于律人"
> 对标: `CODING_STANDARDS.md` + `CODING_STANDARDS_NODE_TS.md` + 全局 `my-coding-standards.md`

---

## 结论

代码体量约 3000 行,**16 项违规全部修完** (上一轮 7 项 + 这一轮第三轮 9 项)。

`pnpm typecheck` / `pnpm lint` / `pnpm arch:check` 三项 CI 检查全绿。

> **第三轮 (2026-05-26)**: 用户提醒"上一次扫到一个大漏洞就停了,真实审计没做完"。重新系统性 grep + 9 个新发现 (1 HIGH + 4 MEDIUM + 4 LOW) 全部修了。

---

## ✅ 第三轮新修 (lint 抓不到、上一轮漏掉的)

### 8. HIGH · PWA API 客户端响应零校验

- **文件**: [apps/pwa/app/lib/api.ts](../apps/pwa/app/lib/api.ts) (旧)
- **位置**: `get<T>` / `post<T>` 全部 `(await res.json()) as T`
- **后果**: 后端契约一改前端就崩,且崩点在调用处不在边界
- **修法**:
  - 抽 [apps/pwa/app/lib/env.ts](../apps/pwa/app/lib/env.ts) 集中校验前端 env
  - api.ts 给每个端点定义 zod schema,`get(path, schema)` / `post(path, schema, body)` 强制传 schema,内部 `.safeParse()` 后失败抛 `Error('<path> response shape invalid: ...')`
  - `ApiSong` / `ApiLyric` 等类型改成 `z.infer<typeof xxxSchema>` 单一真相源

### 9. MEDIUM · login.ts 后台 snapshot fetch 静默吞

- **文件**: [apps/server/src/api/login.ts:28](../apps/server/src/api/login.ts#L28)
- **旧**: `.catch(() => { /* swallow */ })`
- **修**: `.catch((err) => app.log.warn({ err }, 'login: post-login snapshot fetch failed'))`

### 10. MEDIUM · usePlayerLogic 在 setState reducer 内跑副作用

- **文件**: [apps/pwa/app/components/player/usePlayerLogic.ts](../apps/pwa/app/components/player/usePlayerLogic.ts) `handleEnded`
- **问题**: `setState((s) => { ...audio.play()...; return s })` — React StrictMode 会双调用 reducer,导致双播
- **修法**: 用 `queueMicrotask` 把 audio.play 推到 setState 返回后,且失败 surface 到 state.error

### 11. MEDIUM · TextDecoder 跨 chunk 切坏 UTF-8 多字节

- **文件**: [packages/infrastructure/src/brain/claude/index.ts](../packages/infrastructure/src/brain/claude/index.ts) `readTextDeltas`
- **问题**: `new TextDecoder().decode(chunk)` per-chunk,Claude 流式吐中文 chunk 切在多字节序列中间会乱码
- **修法**: 单 `TextDecoder` + `{ stream: true }`,末尾 `decoder.decode()` flush 剩余字节

### 12. MEDIUM · PWA env 散落 process.env

- **文件**: [apps/pwa/app/lib/api.ts:3](../apps/pwa/app/lib/api.ts#L3) (旧)
- **修法**: 新建 [apps/pwa/app/lib/env.ts](../apps/pwa/app/lib/env.ts),zod 校验,业务代码只 import `env`

### 13. LOW · TTS_EMOTIONS DRY 违规

- **位置**: `apps/server/src/api/dj.ts` 写了 `TTS_EMOTIONS` const,但 `packages/application/src/ports/tts.ts` 已经有 `TtsEmotion` 类型 — 类型与运行时元组分两边
- **修法**: ports/tts.ts 改成"元组在前、类型从元组推",`TTS_EMOTIONS` 和 `TtsEmotion` 同源;dj.ts 直接 import

### 14. LOW · brain.generateJson 末尾 `schema.parse()` 没 safeParse 包

- **文件**: [packages/infrastructure/src/brain/claude/index.ts](../packages/infrastructure/src/brain/claude/index.ts) `parseGenerateJsonResult`
- **问题**: 其它失败都包成 `ExternalServiceError`,只有最末 `schema.parse(inner)` 会漏 `ZodError`
- **修法**: 改 `.safeParse()` 后统一抛 `ExternalServiceError('claude', 'result.body shape invalid: ...')`

### 15. LOW · usePlayerLogic 两处 `/* swallow */` 自动播放拒绝

- **文件**: [apps/pwa/app/components/player/usePlayerLogic.ts](../apps/pwa/app/components/player/usePlayerLogic.ts) 行 174 + 188
- **修法**: 全部改为 `setState((s) => ({ ...s, error: '播放失败: ...' }))`,错误进入用户可见的 ErrorBanner

### 16. LOW · cold-start.ts 魔数 `3600000`

- **文件**: [apps/server/src/cold-start.ts](../apps/server/src/cold-start.ts)
- **修法**: 抽 `const HOUR_MS = 60 * 60 * 1000`,`SNAPSHOT_TTL_MS = 24 * HOUR_MS`,日志格式化用 `HOUR_MS`

---

## ✅ 已修

### 1. `as` 断言外部 API 响应 — brain

- **文件**: [packages/infrastructure/src/brain/claude/index.ts](../packages/infrastructure/src/brain/claude/index.ts)
- **位置**: `parseGenerateJsonResult` 里 `envelope as { is_error?, result? }`
- **违规**: `CODING_STANDARDS_NODE_TS §1.3` (禁止 `as` 断言)
- **修法**: 加 `envelopeSchema = z.object({...})`,走 `.safeParse()` 后再读字段

### 2. `as` 断言外部 API 响应 — tts

- **文件**: [packages/infrastructure/src/tts/index.ts](../packages/infrastructure/src/tts/index.ts)
- **位置**: `(await res.body.json()) as InferResponse`
- **违规**: 同上 §1.3
- **修法**: 加 `inferResponseSchema = z.object({ audio_url: z.string().min(1) })`,`.safeParse()` 后取值

### 3. 错误抛 `Error` 而非领域错误 — brain

- **文件**: [packages/infrastructure/src/brain/claude/index.ts](../packages/infrastructure/src/brain/claude/index.ts)
- **位置**: 8 处 `throw new Error(...)`
- **违规**: `CODING_STANDARDS §5.3` (统一用领域错误层级,可 `instanceof` 收窄)
- **修法**: 全部换成 `throw new ExternalServiceError('claude', ...)`,与 tts 客户端一致

### 4. `JSON.parse() as ArtistJson[]` — song-repo

- **文件**: [packages/infrastructure/src/db/repos/song-repo.ts](../packages/infrastructure/src/db/repos/song-repo.ts)
- **位置**: `dbRowToSong` 解 `artistsJson` 字段
- **违规**: §1.3 + §6.1 (边界处校验)
- **修法**: 抽 `parseArtists()` 用 `z.array(z.object({...}))` 校验,失败抛 `ValidationError`

### 5. `JSON.parse() as NcmUserSnapshot` — ncm-snapshot-repo

- **文件**: [packages/infrastructure/src/db/repos/ncm-snapshot-repo.ts](../packages/infrastructure/src/db/repos/ncm-snapshot-repo.ts)
- **位置**: `load()` 反序列化 `rawJson`
- **违规**: 同上
- **修法**: 加 `snapshotShapeSchema` 校验顶层结构,内嵌 `playlists`/`dailyRecommendations` 等仍是 `z.array(z.unknown())` (写入方 `NcmClient` 保证 shape) + 末尾保留一个**带显式 TODO 注释**的 `as NcmUserSnapshot` 收窄
- **遗留**: 真要完美就得把 `NcmUserSnapshot` 在 `application/ports/ncm.ts` 改为 zod 单一真相源,目前 TS-only 类型,迁移成本中等

### 6. ncm/index.ts ~15 处 `as ResponseType` (本回合收掉)

- **文件**: [packages/infrastructure/src/ncm/index.ts](../packages/infrastructure/src/ncm/index.ts)
- **位置**: `search` / `getSongUrl` / `getLyric` / `dailyRecommendations` / `privateFm` / `heartMode` / `toplist` / `like` / `fmTrash` / `qrCreate` / `qrCheck` / `fetchUserSnapshot` 全员
- **违规**: §1.3 (禁止 `as`) + §6.1 (外部 API 必须 zod 校验)
- **修法**:
  - 新建 [packages/infrastructure/src/ncm/schemas.ts](../packages/infrastructure/src/ncm/schemas.ts) 把所有 NCM 响应 body 定义为 `z.object`,类型用 `z.infer` 推导
  - 新建 [packages/infrastructure/src/ncm/call.ts](../packages/infrastructure/src/ncm/call.ts) 提供 `callNcm(fn, schema, op)` helper,内置 envelope 校验 + status=200 检查 + body shape 校验,失败统一抛 `ExternalServiceError('NCM', ...)`
  - `index.ts` 所有调用改成 `await callNcm(() => cloudsearch(...), searchBodySchema, 'search')`
  - 仅保留 2-3 处输入参数 bridge (`as unknown as Parameters<typeof X>[0]`):NCM 库的入参字段是 `const enum`,`isolatedModules` 下无法 import,这是文档级的 workaround,不在 §1.3 禁列里

### 7. Player.tsx 文件级豁免 5 条 lint (本回合收掉)

- **原文件**: ~~apps/pwa/app/components/Player.tsx~~ (已删,505 行)
- **替换**: [apps/pwa/app/components/player/](../apps/pwa/app/components/player/) (8 个文件,总 916 行,**没一个文件级豁免**)
- **违规**: `my-coding-standards §2` (函数 50 行 / 复杂度 10) 全破;§15 不应"批量豁免"
- **修法**: 拆成 hooks + sub-components:

```text
apps/pwa/app/components/player/
├── types.ts            58 行 · 类型 + 常量 + formatTime/describeError
├── usePlayerLogic.ts  311 行 · audio ref + state + 3 个 sub-hook (queue/transport/audio) + 4 个纯 transformer
├── useSearch.ts        43 行 · 搜索表单 state + submit
├── Player.tsx         107 行 · orchestrator,只连 hooks ↔ 子组件
├── SearchPanel.tsx    101 行 · 搜索表单 + 结果行
├── NowPlayingCard.tsx  74 行 · 当前歌曲卡 + 歌词面板
├── QueuePanel.tsx      66 行 · 队列侧栏
└── ControlsBar.tsx    156 行 · 底部传输栏 + seek slider + 音量
```

- **效果**:
  - 0 个文件级 eslint-disable
  - 单文件最大 311 行 (<800)
  - 单函数最大 49 行 (<50)
  - 圈复杂度全部 <10
  - 同时修了一批附带问题: `<button>` 缺 `type="button"`、`no-confusing-void-expression` 11 处、`max-params` 1 处、3 处对不存在的 lint 规则的失效 `eslint-disable` 注释

---

## 📊 其它已审过的(无问题或可接受)

### branded types `as`

- `packages/domain/src/ids.ts` 里 7 个 `raw as SongId` 等
- **判定**: 标准 §2.4 branded types 的标准构造器写法,**不是违规**

### `repos/*.ts` 文件级 `require-await` 豁免

- 9 个 repo 都有 `/* eslint-disable @typescript-eslint/require-await -- better-sqlite3 is sync */`
- **判定**: better-sqlite3 是同步 API 但 port 接口是 async,豁免有合理理由 + 行内说明,**符合 §15**

### `api/*.ts` 文件级 `require-await` 豁免

- 7 个 plugin 都有同样豁免
- **判定**: Fastify plugin 签名要求 async,豁免合理,**符合 §15**

### 命名豁免 (snake_case 外部字段)

- brain/tts/ncm 多处 `is_error` / `audio_url` / `model_name` 等
- **判定**: 外部协议字段无法改名,行内 `// eslint-disable-next-line ... -- 字段` 注释清楚,**符合 §15**

---

## 三项 CI 检查现状

```text
pnpm typecheck   ✅ 全绿
pnpm lint        ✅ 全绿 (0 errors, 0 warnings)
pnpm arch:check  ✅ 0 errors (1 pre-existing warning: drizzle.config.ts orphan)
```

CI 绿 ≠ 代码达标。本审计就是 lint 抓不到的部分。

---

## 自查清单 (对应 `my-coding-standards §15`)

- [x] 编译 / lint / 类型检查通过
- [ ] **测试通过 + 新代码有测试** ← 还不达标: 整个项目还没写测试 (M0/M1/M2 都没写 vitest)
- [x] 命名清晰
- [x] 函数 < 50 行 / 文件 < 800 行 / 嵌套 < 4 层
- [x] 没有 console.log / 调试打印 / 注释掉的代码
- [x] 注释解释 WHY
- [x] 错误处理显式
- [x] 不可变默认,副作用集中
- [x] 没有硬编码密钥 / 路径
- [x] 用户输入有校验
- [ ] commit message 符合 Conventional Commits ← N/A: 本项目当前不是 git repo

---

## 仍然挂着的两条 TODO

| 位置 | 内容 | 触发时机 |
| --- | --- | --- |
| `ncm-snapshot-repo.ts` `parseSnapshot()` | 末尾还有一个 `as NcmUserSnapshot` 收窄,因为 `NcmUserSnapshot` 类型在 application/ports 是 TS-only,没法 `.parse()` 出 branded 类型 | 等 application/ports 改 zod 单一真相源时一并去掉 |
| 测试覆盖率 = 0 | M0/M1/M2 全无单元测试,与 §10.1 "业务逻辑 80%+ 行覆盖" 冲突 | 建议进 M3 前补 brain/tts/ncm/usePlayerLogic 的 vitest 单测 |

---

## 下一步建议

代码规范侧已经清完。下一阶段可选:

- **A) 补单测** — 给已写的 brain/tts/ncm/usePlayerLogic 补一波 vitest 单测,把覆盖率拉到 §10.1 要求的 80%+,再进 M3
- **B) 直接进 M3** — WS 流式聊天 + DJ 串场气泡,测试在 M3 完了后补

我个人推荐 **A**: 现在功能模块边界已经清晰 (hooks 都是纯函数 + 副作用集中),补测的成本最低。
