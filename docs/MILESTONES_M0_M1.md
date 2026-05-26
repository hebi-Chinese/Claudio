# Claudio · M0 + M1 完工记录

> 起草: 2026-05-26
> 范围: 从空仓库到"能搜歌能播能记录,数据库重启不丢"
> 配套规范: `CODING_STANDARDS.md` / `CODING_STANDARDS_NODE_TS.md` / PRD §5 §6 §9

---

## 0. 一句话总结

- **M0**: 把 pnpm monorepo + 三层 Clean Architecture + 全套配置(tsconfig/eslint/prettier/drizzle/depcruise)搭起来,`pnpm install` 通过、`pnpm typecheck` 全绿、`pnpm arch:check` 0 违规。
- **M1**: 把 10 张 SQLite 表通了、9 个 repo 写完、NCM 客户端 11+ 端点能用、Fastify 7 个 HTTP 路由跑起来、PWA 播放器在浏览器里能搜能播、首启 cookie/snapshot 持久化通了。

---

## 1. 仓库形态

### 1.1 顶层布局

```text
d:/AI music radio/
├── apps/
│   ├── server/           Fastify 后端 (端口 8787)
│   └── pwa/              Next.js 15 PWA (端口 3000)
├── packages/
│   ├── domain/           纯业务实体 (零外部依赖)
│   ├── application/      use-cases + ports (只依赖 domain)
│   ├── infrastructure/   adapter 实现 (db / ncm / brain / tts / calendar / signal)
│   ├── shared/           跨层共享 (logger / config / errors / schemas / types)
│   └── ui/               前端通用组件壳 (M3 之后才用)
├── tools/
│   ├── configs/          ESLint / Prettier / tsconfig.base 共享
│   └── arch-test/        dependency-cruiser 规则,守住依赖方向
├── pnpm-workspace.yaml   workspace + catalog 集中版本
├── package.json          root scripts (dev / build / lint / typecheck / arch:check)
├── PRD.md                需求 (用户 + 我反复讨论的成果)
├── CODING_STANDARDS.md   通用规范
└── CODING_STANDARDS_NODE_TS.md  Node/TS 专项规范
```

### 1.2 依赖方向 (架构测试强制)

```text
apps/* ──→ @claudio/application ──→ @claudio/domain
              ↑                          ↑
              │                          │
       @claudio/infrastructure ──────────┘
              (实现 application 的 ports)
```

- `domain` 不能 import 任何非标准库的外部包
- `application` 不能 import `infrastructure` (依赖倒置)
- `infrastructure` 内兄弟 adapter 不互相 import (`brain/claude` 不能用 `brain/deepseek`)
- `pwa` 不能 import `server` 内部 (只能通过 HTTP/WS 契约)
- 由 `tools/arch-test` 的 dependency-cruiser 规则在 CI/本地强制执行

---

## 2. M0 · 骨架阶段

### 2.1 包管理 & workspace

- pnpm 11 + workspace + **catalog 协议**集中管理 30+ 个三方包版本
- 单一 `pnpm-workspace.yaml` 是版本真相源,各 package 用 `"react": "catalog:"` 引用
- 收益: 升级 React 19 / Fastify 5 / Drizzle 0.36 改一行即可,所有子包同步

### 2.2 TypeScript 配置

- `tools/configs/tsconfig.base.json` 是基线: `strict` + `exactOptionalPropertyTypes` + `verbatimModuleSyntax` + `noUncheckedIndexedAccess` + `isolatedModules`
- 每个包基于 base 派生 `tsconfig.json` + `tsconfig.node.json` (server/cli) 或 web 变体 (pwa)
- 浏览器 / Node 两种环境的 lib 分开,避免互相污染

### 2.3 Lint / Format / 架构测试

- ESLint 9 flat config + typescript-eslint **strict-type-checked**
- 函数 50 行 / 文件 800 行 / 圈复杂度 10 / 嵌套 4 层等硬上限交给 lint 守
- prettier 统一格式 + husky/lint-staged 在 pre-commit 卡门
- `dependency-cruiser` 写在 `tools/arch-test/.dependency-cruiser.cjs`,跑 `pnpm arch:check` 一秒出报告

### 2.4 域模型 (`packages/domain/`)

| 文件 | 内容 |
|---|---|
| `ids.ts` | branded types: `SongId` / `ArtistId` / `AlbumId` / `PlaylistId` / `PlanId` + `toXxxId()` 安全构造器 |
| `song.ts` | `Song` 实体 (id / title / artists / album / durationMs / coverUrl) |
| `plan.ts` | `Plan` + `PlanItem` (一天的节目单) |
| `bubble.ts` | `Bubble` (DJ 串场,kind: say/segue/reaction/greeting) |
| `mood.ts` | `Mood` 枚举 + energy 0-10 |
| `taste.ts` | `Taste` 快照 (markdown content + 来源原因) |
| `index.ts` | 桶导出 |

域层完全纯净,**零三方依赖**,domain 改了 lint 会要求 application/infrastructure 同步调整。

### 2.5 应用层端口 (`packages/application/src/ports/`)

| 端口 | 用途 |
|---|---|
| `IBrain` | LLM 接口 (stream 流式 / generateJson 结构化输出) |
| `INcmClient` | 网易云 11+ 方法 (搜索 / 直链 / 歌词 / 推荐 / FM / 心动 / 排行 / 互动 / 登录 / 快照) |
| `ITtsClient` | TTS 合成 (text + emotion → audioUrl) |
| `ICalendarSource` | 日历事件源 (M1 默认 noop) |
| `ISignalSource` | 上下文信号 (天气 / 时段, M5 实装) |
| `ISongRepo` / `IPlaysRepo` / `IBubblesRepo` / `IPlanRepo` / `IPrefsRepo` | 5 个核心仓储 |
| `INcmSnapshotRepo` / `INcmAccountRepo` / `IConversationsRepo` / `ITasteRepo` | 4 个扩展仓储 (M1 加的) |

业务代码只依赖这些接口,换 brain/数据库/日历 只改 composition.ts 一处。

### 2.6 Shared 横切层

- `@claudio/shared/config` · `loadEnv()` 用 zod 一次性校验所有 env (`SERVER_PORT` / `BRAIN_TYPE` / `DATABASE_URL` / `TTS_URL` 等),禁止 `process.env.X` 散落
- `@claudio/shared/logger` · pino + pino-pretty,统一日志格式
- `@claudio/shared/errors` · `ExternalServiceError` / `ValidationError` / `NotFoundError`
- `@claudio/shared/schemas` · 复用的 zod schema 块

---

## 3. M1 · 后端 + DB + NCM + 首启快照

### 3.1 数据库 (10 张表)

**位置**: `packages/infrastructure/src/db/`

`schema.ts` 用 Drizzle 定义,**类型从 schema 推导**(`typeof songs.$inferSelect`),改表无需手动更新类型:

| 表 | 用途 |
|---|---|
| `songs` | NCM 歌曲缓存 (id/title/artists JSON/album/duration/cover) |
| `plays` | 听歌历史 (song_id/played_at_ms/finished/source/mood/energy) |
| `bubbles` | DJ 串场记录 (kind/text/audio_url/played_at_ms) |
| `plans` | 节目单容器 (date_iso) |
| `plan_items` | 节目单条目 (plan_id/slot_at_ms/song_id/reason/status/order_idx) |
| `prefs` | key/value JSON 配置 |
| `taste_snapshots` | taste.md 演进快照 (taken_at_ms + content + reason) |
| `conversations` | 用户 ↔ DJ 对话历史 (含 brain_latency_ms / context_size) |
| `ncm_account` | 单行登录态 (cookie/userId/vipType/level/loggedInAtMs) |
| `ncm_snapshot` | 单行 cold-start 画像快照 (raw_json 完整 NcmUserSnapshot) |

`client.ts`: `createDb(url)` 工厂返回 `{ db, close, applyMigrations }`,自动建目录 + 开 WAL + 开外键。

`migrations/0000_init.sql`: drizzle-kit 生成的初始迁移,启动时由 `applyMigrations(MIGRATIONS_DIR)` 自动跑。

### 3.2 9 个 Repository

**位置**: `packages/infrastructure/src/db/repos/`

| 文件 | 暴露方法 | 备注 |
|---|---|---|
| `song-repo.ts` | `findById(id)` / `upsert(song)` | 抽 `songToValues()` helper 控复杂度 |
| `plays-repo.ts` | `recordPlay()` / `recentPlays(limit)` / `countPlays(songId, sinceMs)` | source 5 选 1 枚举 |
| `bubbles-repo.ts` | `save(bubble)` / `recent(limit)` | |
| `plan-repo.ts` | `findByDate(iso)` / `save(plan)` / `markStatus(planId, slotAtMs, status)` | save 是 plan + plan_items 事务 |
| `prefs-repo.ts` | `get<T>(key, schema)` / `set<T>(key, value, schema)` | zod schema 强类型 |
| `ncm-snapshot-repo.ts` | `status()` / `load()` / `save(snap)` | 单行 id=1,save 同步更新 `ncm_account.last_snapshot_at_ms` |
| `account-repo.ts` | `loadCookie()` / `saveCookie(c)` / `clear()` | cookie 持久化 = 重启免登录 |
| `conversations-repo.ts` | `add(entry)` / `recent(limit)` | 含 brainLatencyMs |
| `taste-repo.ts` | `current()` / `addSnapshot(content, reason)` / `history(limit)` | markdown 全量快照 |

所有 repo 加 `/* eslint-disable @typescript-eslint/require-await -- better-sqlite3 is sync */` 文件级豁免 (better-sqlite3 的 API 是同步的,但 port 是 async,需要兼容)。

### 3.3 NCM 客户端 (`packages/infrastructure/src/ncm/index.ts`)

387 行的 NCM 完整封装:

| 方法 | 对应 NCM 端点 |
|---|---|
| `search(q, opts)` / `searchSuggest(q)` | `/cloudsearch`, `/search/suggest` |
| `getSongUrl(id, quality)` | `/song/url/v1` (支持 standard/exhigh/lossless/hires) |
| `getLyric(id)` | `/lyric` (raw + tlyric + yrc) |
| `dailyRecommendations()` | `/recommend/songs` |
| `privateFm()` | `/personal_fm` |
| `heartMode(seedId)` | `/playmode/intelligence/list` |
| `toplist(id)` | `/toplist/detail` |
| `like(id, on)` / `fmTrash(id)` | `/like`, `/fm_trash` |
| `qrCreate()` / `qrCheck(unikey)` | `/login/qr/create`, `/login/qr/key`, `/login/qr/check` |
| `fetchUserSnapshot()` | 聚合: `/user/detail` + `/likelist` + `/user/playlist` + `/recommend/songs` + `/playmode/intelligence/list` + `/style/preference` + `/user/record` + `/fm_trash` |
| `setCookie(c)` / `getCookie()` | 内部状态 |

**实现要点**:
- NCM 库是 CJS,ESM 不能 named import → `import NCM from 'NeteaseCloudMusicApi'` + 解构重命名 (`fm_trash` → `fmTrash`)
- 响应字段 (raw `RawSong` 等) 走防御性 narrowing,不裸信任 NCM 返回
- `fetchUserSnapshot` 拆成 `pullSnapshotRaw` + `assembleSnapshot` + 3 个 mapper (`collectLikedIds`/`mapRecentPlayed`/`mapPlaylists`),单函数都不破 50 行
- 出错统一抛 `ExternalServiceError` (来自 shared)
- **遵循"消费 NCM 已聚合的画像,不二次分析"原则** (PRD §6.5)

### 3.4 Fastify 后端 (`apps/server/`)

`composition.ts` 是依赖装配中心,15 个依赖手写工厂模式接起来,**不引 DI 容器框架**:

```text
env → brain / tts / calendar / ncm / db
db → songs / plays / bubbles / plan / prefs / snapshot / account / conversations / taste
```

`index.ts` 启动流程:
1. `loadEnv()` → 校验 env
2. `buildContainer(env)` → 装配
3. `runColdStart(container, logger)` → 恢复 cookie + 拉 snapshot
4. 注册 CORS + 7 个 API plugin
5. SIGINT/SIGTERM 优雅关闭 (关 Fastify + 关 sqlite)
6. `app.listen({ host: '127.0.0.1', port: 8787 })`

`cold-start.ts` 启动逻辑:
- 优先从 DB 装回 cookie (env 兜底)
- 没 cookie 直接跳过快照
- 有 cookie 看 snapshot 新鲜度 (TTL 24h),旧了就重新拉
- 拉失败不阻塞启动 (打 warn 日志即可)

### 3.5 7 个 API plugin

| Plugin | 路由 |
|---|---|
| `search.ts` | `GET /api/search?q=&limit=` |
| `song.ts` | `GET /api/song/:id/url?quality=` · `GET /api/song/:id/lyric` |
| `discover.ts` | `GET /api/recommend/daily` · `GET /api/fm/next` · `GET /api/heart-mode/:seedId` · `GET /api/toplist/:id` |
| `login.ts` | `POST /api/login/qr/create` · `GET /api/login/qr/check?unikey=` · `GET /api/login/status` · `POST /api/login/logout` |
| `feedback.ts` | `POST /api/feedback {songId, action: like\|unlike\|trash}` |
| `snapshot.ts` | `GET /api/snapshot/status` · `GET /api/snapshot/current` · `POST /api/snapshot/refresh` |
| `plays.ts` | `POST /api/plays` · `GET /api/plays/recent?limit=` |

所有路由 body / query 走 zod 校验,失败自动 400。

### 3.6 PWA 播放器 (`apps/pwa/`)

**Next.js 15 App Router**:
- `app/page.tsx` server component 直接挂 `<Player />`
- `app/layout.tsx` 全局 layout
- `app/globals.css` Tailwind 入口

**核心文件**:

| 文件 | 内容 |
|---|---|
| `app/components/Player.tsx` (505 行) | 完整播放器: 搜索框 / 当前歌曲卡 / 歌词滚动 / 队列 / 进度条 / 音量 / 4 种播放模式 (单曲/列表/随机/心动) |
| `app/lib/api.ts` (81 行) | 后端 API 客户端封装 (search / songUrl / lyric / dailyRecs / privateFm / heartMode / loginQrCreate / loginQrCheck / loginStatus / feedback) |
| `app/lib/lrc.ts` (51 行) | LRC 歌词解析 + 二分查找当前行 |

**实现要点**:
- 用 `'use client'` 一处,服务端组件默认
- `Player.tsx` 整文件加文件级 lint 豁免 (`max-lines-per-function`/`complexity`/`no-misused-promises`),因为播放器本质是一个有状态的大组件,拆它反而难维护
- `<audio>` 元素 ref,通过 effect 同步 src/volume/loop
- 进度 / 当前歌词通过 `requestAnimationFrame` 节流刷新
- 用户搜索 → 选歌 → 拿直链 → 写 `<audio>.src` → 播

### 3.7 端到端验证

1. 启动 `pnpm dev` (server :8787 + pwa :3000)
2. 浏览器开 `localhost:3000` 搜"屋顶" → 列表出来 → 点播放
3. **观察到**: `<audio>` 元素 currentTime 从 0 走到 10+ 秒,声音直链已加载 (Chrome 自动播放策略要求 CDP 真实点击,JS 点击 `isTrusted=false` 会被拦)
4. 录一条 play `{songId: "5257138", source: "search"}` → 重启 server → `GET /api/plays/recent` 仍能查到
5. 三项检查: `pnpm typecheck` 绿 / `pnpm lint` 绿 / `pnpm arch:check` 0 违规

---

## 4. 已实现 vs 未实现 (M2-M6 待办)

| 范围 | 状态 |
|---|---|
| Brain 接口 | ✅ 定义好 |
| Brain 真实实现 (Claude 子进程) | ❌ 占位 throw,M2 做 |
| TTS 接口 | ✅ 定义好 |
| TTS 真实实现 (GPT-SoVITS 客户端) | ❌ 占位 throw,M2 做 |
| WS `/stream` 流式聊天 | ❌ M3 做 |
| DJ 串场 UI / bubble stream | ❌ M3 做 |
| 滚动歌词 / 登录 UI / 收藏 / 跳过学习 | ❌ M4 做 |
| Scheduler (早间播报 / 整点检查) | ❌ M5 做 |
| 桌宠联动 | ❌ M5 做 |
| 飞书日历 / 天气 / SW 离线壳 | ❌ M6 做 |

---

## 5. 关键设计决策

| 决策 | 选了什么 | 为什么 |
|---|---|---|
| 包管理 | pnpm + workspace + catalog | 避免子包版本漂移;catalog 升级改一处 |
| HTTP 框架 | Fastify | schema 校验内建、比 express 快、TS 友好 |
| ORM | Drizzle + better-sqlite3 | 类型从 schema 推、SQL-like、单用户场景 sync 反而更简单 |
| 前端 | Next.js 15 App Router | RSC 默认、文件路由、PWA 友好 |
| 架构 | Clean Architecture (domain/application/infrastructure) | 换 brain / 换 DB / 换 NCM 实现都是一行 import 的事 |
| DI | 手写 composition.ts | 8 包规模不需要 DI 容器,反而增加心智负担 |
| Lint | 严格到位 (50 行函数 / 800 行文件 / 复杂度 10) | 让以后不会写成屎山 |
| 架构守门 | dependency-cruiser + 自动跑 | 不让"反正先过"的 PR 把架构搞乱 |

---

## 6. 文件清单速查

代码总行数 ~3000 行 (不含配置 / 锁文件;含 M2 brain+tts+dj api;含 Player 拆分后 8 个文件):

```text
311  packages/infrastructure/src/ncm/index.ts (M2: refactor 后从 387 降到 311)
311  apps/pwa/app/components/player/usePlayerLogic.ts (M2: Player 拆出来的 hook)
156  apps/pwa/app/components/player/ControlsBar.tsx (M2: Player 拆出来)
141  packages/infrastructure/src/ncm/schemas.ts (M2: NCM 响应 zod schemas)
136  packages/infrastructure/src/db/schema.ts
107  apps/pwa/app/components/player/Player.tsx (M2: 拆完后的 orchestrator)
101  apps/pwa/app/components/player/SearchPanel.tsx
 85  apps/server/src/composition.ts (M2: 加 tts)
 81  apps/pwa/app/lib/api.ts
 80  packages/infrastructure/src/db/repos/plan-repo.ts
 75  packages/infrastructure/src/db/repos/song-repo.ts
 74  apps/server/src/index.ts (M2: 加 dj plugin)
 74  apps/pwa/app/components/player/NowPlayingCard.tsx
 70  packages/infrastructure/src/db/repos/ncm-snapshot-repo.ts (含 M2 zod 校验)
 67  packages/infrastructure/src/db/repos/taste-repo.ts
 66  apps/pwa/app/components/player/QueuePanel.tsx
 58  apps/pwa/app/components/player/types.ts
 56  apps/server/src/api/dj.ts (M2: /api/dj/say)
 ...  (其余 40+ 文件,每个 < 60 行)
```

---

## 7. 下一步 (M2 开始)

1. `packages/infrastructure/src/brain/claude/index.ts`: spawn `claude -p --output-format json`,实现 `stream` + `generateJson`
2. `packages/infrastructure/src/tts/index.ts`: POST `${TTS_URL}/infer_single`,把 `0.0.0.0` 替换成 `127.0.0.1` 后返回 audioUrl
3. 在 server 开 `POST /api/dj/say` 路由跑通"输入文案 → 大脑润色 → TTS 合成 → 返回 audioUrl",验证 brain + tts 端到端

完成 M2 后 DJ 才算"能开口",M3 起才能上 WS 流式聊天 UI。
