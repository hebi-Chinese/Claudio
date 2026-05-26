# Claudio · 个人 AI 电台 PRD v0.1

> 起草：2026-05-26
> 状态：草稿，待评审
> 来源：用户提供的两张施工图 + 网易云 API / Spotify / Apple Music 调研 + 多轮讨论

---

## 1. 项目概述

- **名称**：Claudio
- **一句话**：让 Claude（或后期可替换的 LLM）当 DJ 大脑，读你听歌习惯 → 规划串场 → 像电台主播那样播报；接网易云音乐拿歌，GPT-SoVITS 合成语音
- **形态**：本地 Node.js 后端 + Next.js PWA，单机自用；后期可迁云端 VPS
- **当前状态**：v0.1 规划阶段，未动代码

---

## 2. 背景与愿景

### 2.1 要解决的问题

- 主流音乐 App（网易云 / Spotify）的"推荐"基于全网协同过滤，不真正理解个体
- 听歌列表没有"上下文"，下雨天和早高峰播一样的歌
- 没有"陪伴感"，只能机械点下一首
- 时段错位 —— 早上想 hype、晚上想 chill，要手动切歌单

### 2.2 愿景

一台懂你品味、知道你今天日程、能跟你聊歌的私人 AI 电台。**不是"推荐算法"，是"AI DJ"**：选歌 + 串场 + 调台 + 跟你对话。

### 2.3 与主流播放器的核心差异

| 维度 | 网易云 / Spotify | Claudio |
|---|---|---|
| 选歌依据 | 聚类 + 协同过滤 | LLM 推理 + 你的个人语料 |
| 上下文感知 | 无 | 时段 / 天气 / 日历 / 心情 |
| 交互 | 单向（点歌） | 双向（你说它聊） |
| 串场 | 无 | 流萤声线 + Claude 文案 |
| 个性化粒度 | 算法黑盒 | `taste.md` 用户可手编 |

---

## 3. 目标用户 / 使用场景

- **唯一用户**：项目主自用
- **主场景**：
  - 在家写代码 / 工作（最高频）
  - 通勤路上手机听
  - 睡前 chill
  - 早起播报（晨间日程 + 天气 + 提神歌）
- **设备**：
  - 桌面浏览器（主）
  - 手机 PWA（次，本地局域网 / Tailscale 访问）
  - 远期：家用音响（UPnP）

---

## 4. 功能需求

### 4.1 v1 · MVP（首发约 25 条，目标 3-4 周）

**A. 播放器核心**
- A1 播 / 停 / 上下首
- A2 进度条 + 拖拽跳转
- A3 音量 + 静音
- A4 播放模式：列表循环 / 单曲循环 / 随机
- A5 音质切换（标准 / HQ / 无损）—— 受账号 VIP 限制
- A6 播放队列管理（查看 / 重排 / 移除）
- A9 Media Session API（锁屏 / 蓝牙耳机 / 媒体键控制）
- A10 桌面通知（切歌弹）
- G1 预缓存下一首（10s 提前）

**B. 内容发现**
- B1 搜索：歌 / 歌单 / 歌手 / 专辑（多类型）
- B2 搜索建议 / 联想
- B5 每日推荐 30 首（需登录）
- B6 私人 FM（无限流）
- B10 心动模式

**C. 用户库 / 个人化**
- C1 登录（扫码优先 / 手机号备选）
- C2 我喜欢的音乐（读 + 写）
- C3 我创建的歌单（读）
- C5 听歌历史（拉取网易云 + 写本地 plays 表）
- C7 听歌报告（本地聚合，周报 / 月报）
- **C8.r 读云盘**（★★ 补强：作为强品味信号；上传 UI 放 v1.5）
- **C9 NCM 首启快照拉取** ★★★ —— 一次性消费 NCM 已算好的画像成品：每日推荐 / 心动模式 / 风格偏好 / 年度报告 / 喜欢列表 / 自建歌单 / 拉黑名单。原样存 `snapshot.json`，prompt 直接读，**不二次分析**
- **I12 飞书日历感知（升 v1）→ 改为 CalendarSource 抽象** ★★ —— v1 实际跑 `NoOpCalendar` + `IcsFileCalendar`（用户可手动丢本地 .ics 文件到 `data/calendar/`），架构上接好飞书 / Google adapter 槽位
- **I17 主题系统 + 极简主题（深色 + 浅色）** ★★★ —— `<ThemeProvider>` + CSS 变量 + 主题切换器，v1 只发"极简"一种但架构能接住后续两种

**D. 歌词 / 视觉**
- D1 滚动歌词
- D2 翻译 / 双语
- D4 大封面 + 模糊背景

**I. ★ AI DJ 核心差异**
- I1 AI 选歌（品味 + 时段 + 天气 + 日历）
- I2 AI 串场词（GPT-SoVITS 合成，插歌曲间）
- I3 串场流式吐字（WS 打字效果）
- I4 用户对话调台（"来点提神的"）
- I6 今日节目单（可提前看 / 编辑）
- I7 DJ 模式 ↔ 手动模式切换
- I8 跳过 / 喜欢实时学习 → 写回 taste

**J. 设置**
- J1 深色 / 浅色 / 跟随系统
- J3 流量控制（仅 WiFi 高音质）
- J6 PWA 安装（添加到主屏）

### 4.2 v1.5 · 体验加分（v1 跑稳后追加）

- I11 天气感知（OpenWeather）
- I12 日历感知（飞书 Open API）
- I13 桌宠联动（切歌触发 aemeath 气泡）
- C8.w 云盘上传 UI（文件选择 + 分片上传）
- **C10 NCM 快照手动重拉**（Settings 里一个按钮，用户偶尔在 NCM 手机端有新动作时手动同步；**不做自动 daily/weekly sync，不做双向写回**）
- **I18 黑胶复古主题**（暖色 + 纹理 + 衬线字 + 磨砂质感）
- **I19 FeishuCalendar adapter**（OAuth 接入飞书日历，作为 CalendarSource 实现之一）
- I9 DJ 人设预设（温柔 / 毒舌 / 学术 / 二次元）
- I15 每日复盘（晚间总结播报）
- E1 看评论 + 热评（增加陪伴感）
- D3 逐字卡拉 OK 高亮（yrc 时间戳）
- F2 曲间淡入淡出
- A8 睡眠定时
- J4 听歌历史导出 JSON

### 4.3 v2 · 远期

- I10 多 DJ 切换
- I14 UPnP 推家用音响
- 多设备同步播放进度
- Tailscale / 公网部署
- 大脑切换到 DeepSeek / Ollama（云端版必需）
- 播客 / 有声内容
- 听歌识曲
- **I20 二次元主题**（萌系粉彩 + 圆角 + 插画 + 圆体字）
- **I21 GoogleCalendar / AppleCalendar adapter**

### 4.4 明确不做（避免范围蔓延）

- 桌面歌词（PWA 无法做，原生才行）
- 一起听 / 歌房（API 不支持）
- 评论发布 / 私信（不是本产品定位）
- DJ 智能 mix（鼓点对齐过渡，工程量过大）
- 自带社交圈（朋友圈 / 动态）

---

## 5. 技术架构

### 5.1 四层结构（沿用施工图）

```
┌─────────────────────────────────────────────────────────┐
│ L4 · 交互表层  PWA / localhost:3000  Next.js + Tailwind │
└────────────┬────────────────────────────────────────────┘
             │ HTTP + WebSocket
┌────────────▼────────────────────────────────────────────┐
│ L2 · 本地大脑  Node.js / Fastify localhost:8787         │
│   ├─ router    意图分流                                 │
│   ├─ context   prompt 组装（L3）                        │
│   ├─ brain     ★ 接口抽象（claude / deepseek / ollama）│
│   ├─ scheduler node-cron 定时任务                       │
│   ├─ tts       :8000 GPT-SoVITS 客户端                  │
│   ├─ ncm       NeteaseCloudMusicApi 客户端              │
│   └─ db        SQLite via drizzle-orm                   │
└────────────┬────────────────────────────────────────────┘
             │ 子进程 / HTTP
┌────────────▼────────────────────────────────────────────┐
│ L1 · 外部上下文                                          │
│   USER 语料(.md/.json)  Claude Code(子进程)              │
│   NCM API(:3001 独立进程)  GPT-SoVITS(:8000)             │
│   OpenWeather  飞书 Open API  aemeath 桌宠(:9528)        │
└─────────────────────────────────────────────────────────┘
```

### 5.2 技术选型

| 层 | 选型 | 理由 |
|---|---|---|
| 包管理 | **pnpm** workspace | 硬链接省盘，monorepo 原生 |
| 运行时 | **Node 20 LTS + TypeScript strict** | 长支期 |
| 后端框架 | **Fastify** + `@fastify/websocket` | 性能 + 内置 schema + WS 一等公民 |
| 数据库 | **drizzle-orm + better-sqlite3** | 同步 API + 类型安全 + 不阉割 SQL |
| 前端框架 | **Next.js 15** (App Router) | 用户钦定 + Image 优化 + 路由约定 |
| UI | **Tailwind CSS** + 自定义组件 + `<ThemeProvider>` + CSS 变量 | 不堆 shadcn，保持设计独特性，主题可切换 |
| 大脑 | **Brain 接口 + 多适配器**，env `BRAIN_TYPE` 切：`claude\|deepseek\|ollama\|openai-compat\|custom` | 云端版默认 deepseek；本地默认 claude；**绝不 hardcode key/URL** |
| 验证 | **zod** | 跨包共享 schema + 类型推断 |
| 调度 | **node-cron** | 简单可靠 |
| HTTP client | **undici** | Node 原生级 fetch |
| 子进程 | **execa** | 比原生 child_process 友好 |
| 进程守护 | dev: `tsx watch` / prod: `pm2` | |
| 测试 | **vitest** | Vite 生态对齐 |

### 5.3 仓库结构（pnpm monorepo · Clean Architecture · 8 packages）

**设计原则：** 严格 Clean Architecture 四层。依赖只能往内指（`apps → application → domain`，`infrastructure` 实现 `application` 里的 ports）。adapter 同族用子目录组织（不为单实现拆独立包）。

```
ai-music-radio/
├── pnpm-workspace.yaml
├── package.json                     workspace root
├── PRD.md
├── CODING_STANDARDS.md              通用代码规范
├── README.md
│
├── apps/
│   ├── server/                      Fastify 入口 + 装配（薄）
│   │   └── src/
│   │       ├── index.ts             bootstrap
│   │       ├── composition.ts       依赖装配（手写工厂,不引 DI 容器）
│   │       └── api/                 Fastify 路由（chat / now / next / taste / plan / feedback / stream WS）
│   │
│   └── pwa/                         Next.js 15 前端（薄壳）
│       └── app/
│           ├── layout.tsx
│           ├── page.tsx             / Player
│           ├── profile/page.tsx
│           └── settings/page.tsx
│
├── packages/
│   ├── @claudio/shared/             跨层共享（types / schemas / logger / config / errors）
│   │   └── src/
│   │       ├── types/               跨包 DTO（Song / Bubble / Plan / Mood ...）
│   │       ├── schemas/             zod schemas（运行时校验）
│   │       ├── logger/              pino 包装 + 字段约定
│   │       ├── config/              env 校验 + 公共常量
│   │       └── errors/              领域错误类（DomainError / NotFoundError / ...）
│   │
│   ├── @claudio/domain/             【最内层】业务实体 + 不变量（纯,零外部依赖）
│   │   └── src/
│   │       ├── song.ts
│   │       ├── plan.ts
│   │       ├── bubble.ts
│   │       ├── mood.ts
│   │       └── taste.ts
│   │
│   ├── @claudio/application/        【应用层】use-cases + ports（仅依赖 domain）
│   │   └── src/
│   │       ├── use-cases/
│   │       │   ├── generate-next-song.ts
│   │       │   ├── generate-today-plan.ts
│   │       │   ├── handle-user-skip.ts
│   │       │   ├── handle-chat-message.ts
│   │       │   └── refresh-ncm-snapshot.ts
│   │       └── ports/               接口定义
│   │           ├── brain.ts         IBrain
│   │           ├── ncm.ts           INcmClient
│   │           ├── tts.ts           ITtsClient
│   │           ├── calendar.ts      ICalendarSource
│   │           ├── signal.ts        ISignalSource
│   │           └── repos.ts         IPlaysRepo / IBubblesRepo / IPlanRepo / IPrefsRepo
│   │
│   ├── @claudio/infrastructure/     【适配器层】实现 ports（adapter 同族子目录组织）
│   │   └── src/
│   │       ├── brain/               多实现:
│   │       │   ├── claude/          Claude Code 子进程
│   │       │   ├── deepseek/        DeepSeek API
│   │       │   ├── ollama/          本地 Ollama
│   │       │   ├── openai-compat/   兼容协议
│   │       │   └── index.ts         按 BRAIN_TYPE env 切实现
│   │       ├── ncm/                 网易云客户端 + enhanced fork 子进程管理
│   │       ├── tts/                 GPT-SoVITS :8000 客户端（未来加 bark/edge-tts）
│   │       ├── calendar/            多实现:
│   │       │   ├── noop/
│   │       │   ├── ics/
│   │       │   ├── feishu/          v1.5
│   │       │   └── index.ts
│   │       ├── signal/              多实现:
│   │       │   ├── weather/
│   │       │   ├── time/
│   │       │   ├── ncm-snapshot/
│   │       │   └── index.ts
│   │       └── db/                  drizzle schema + repo 实现 + migrations
│   │
│   └── @claudio/ui/                 前端专用（tokens + components + themes）
│       └── src/
│           ├── tokens/              CSS 变量定义
│           ├── components/          跨主题通用组件（Player / LyricScroller / BubbleStream / ThemeSwitch）
│           └── themes/
│               ├── minimal/         v1 极简（深色默认 + 浅色可切）
│               ├── retro/           v1.5 黑胶复古
│               └── anime/           v2 二次元
│
└── tools/
    ├── configs/                     共享 ESLint / Prettier / tsconfig.base
    └── arch-test/                   dependency-cruiser 规则
```

**依赖方向（架构测试强制）：**

```
apps/* ──→ @claudio/application ──→ @claudio/domain
              ↑                          ↑
              │                          │
       @claudio/infrastructure ──────────┘
              (实现 application 的 ports)
              
apps/pwa ──→ @claudio/ui ──→ tokens

@claudio/shared 是横切：任何包都可以 import
```

**架构测试规则（`tools/arch-test/`）：**
- `domain` 包不能 import 任何非标准库的外部包
- `application` 不能 import `infrastructure`（依赖倒置）
- `infrastructure` 内的兄弟 adapter 不能互相 import（例：`brain/claude` 不能用 `brain/deepseek`）
- `pwa` 不能 import `server` 内部（只能通过 HTTP / WS 契约）
- `ui` 不能 import 任何业务包（只能用 `shared/types`）

### 5.4 端口分配

| 端口 | 服务 | 起停方 |
|---|---|---|
| 3000 | Next.js PWA | `pnpm dev:pwa` |
| 8787 | Fastify 后端 | `pnpm dev:server` |
| 3001 | NeteaseCloudMusicApi（独立子进程） | server 启动时 spawn |
| 8000 | GPT-SoVITS 语音 | 已有，用户手动维护 |
| 9527/9528 | aemeath 桌宠 HTTP / MCP | 已有，用户手动 |

### 5.5 Brain 接口设计（关键扩展点）

```ts
// packages/shared/src/brain.ts
interface BrainMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface Brain {
  /** 流式生成（用于串场对话） */
  stream(messages: BrainMessage[]): AsyncIterable<string>

  /** JSON 模式生成（用于选歌、生成 plan） */
  generateJSON<T>(
    messages: BrainMessage[],
    schema: ZodSchema<T>
  ): Promise<T>
}
```

实现：
- `ClaudeCodeBrain`（v1）：spawn `claude -p ... --output-format json`，stdin 喂 prompt，stdout 读响应
- `DeepSeekBrain`（云端版）：HTTPS POST DeepSeek API
- `OllamaBrain`（自部署）：HTTP POST 本地 Ollama

业务代码（context.ts / scheduler.ts）只依赖 `Brain` 接口，换实现改一行 import。

### 5.6 数据模型（drizzle schema 草稿）

```ts
// packages/server/src/db/schema.ts
songs          // ncm_id, name, artists, album, duration, cover_url, lyric_url
plays          // song_id, played_at, finished, mood, energy, source(plan|fm|manual)
bubbles        // content, audio_url, kind(say|segue|reaction), played_at
plan_items     // date, slot_at, song_id, reason, status(queued|played|skipped)
prefs          // key, value(JSON)
taste_snapshots // taken_at, content(MD), reason(why changed)
conversations  // ts, user_msg, dj_reply, brain_latency, context_size
ncm_account    // cookie, vip_type, level, last_synced
```

### 5.7 HTTP / WS 契约

| Method | Path | 用途 | Body / 响应 |
|---|---|---|---|
| POST | `/api/chat` | 用户调台对话 | `{msg}` → `{say, play[]}` |
| GET | `/api/now` | 当前播放 | `{song, lyric, bubble?}` |
| GET | `/api/next` | 强制切下一首 | 同上 |
| GET | `/api/taste` | 看 / 编辑品味语料 | `{taste, routines, playlists, mood_rules}` |
| GET | `/api/plan/today` | 今日节目单 | `[{slot_at, song, reason, status}]` |
| POST | `/api/feedback` | 跳过 / 喜欢 | `{song_id, action: 'skip'|'like'|'dislike'}` |
| POST | `/api/mode` | DJ ↔ 手动模式 | `{mode: 'dj'|'manual'}` |
| WS | `/stream` | 服务端推流 | `{event, ...payload}` |

WS 事件类型：`now_playing` / `say_token` / `bubble_ready` / `plan_updated` / `mode_changed`

---

## 6. 关键流程

### 6.1 启动到首屏播放

```
用户打开 localhost:3000
  ↓
PWA SW 命中缓存 → 显示骨架屏（<200ms）
  ↓
并行：GET /api/now + WS /stream 连接
  ↓
后端：plan 表拿当前 slot，无则触发 brain.generateNext()
  ↓
大脑读 taste + 时间 + 天气 + 历史 → JSON {say, play[]}
  ↓
后端：ncm 拿 song_url + cover + lyric；tts 合成 say.wav
  ↓
返回 NowPlaying → PWA <audio> 加载 → 播放
```

### 6.2 用户调台对话

```
用户在输入框打字 "来点提神的"
  ↓
PWA WS send {kind: 'chat', msg: '...'}
  ↓
schema 校验 → router 判定走 brain
  ↓
context.ts 组装 6 片 prompt
  ↓
brain.stream() 启动 claude 子进程
  ↓
流式吐 token → WS push 'say_token' 到 PWA（打字效果）
  ↓
解析完整 JSON → 走 6.1 后半段
```

### 6.3 定时调度（scheduler.ts）

| Cron | 任务 |
|---|---|
| `30 6 * * *` | 拉天气 + 读飞书日历 → 生成全天 plan |
| `0 9 * * *` | 早间播报：天气 + 今日重点 + 提神歌 |
| `0 * * * *` | 整点心情检查 + plan 重排 |
| `30 22 * * *` | 晚间复盘 + chill 切换 |
| `*/30 * * * *` | NCM cookie 保活 + 同步喜欢列表 |

### 6.4 跳过 / 喜欢 → 学习

```
用户点 skip
  ↓
POST /api/feedback {song_id, action:'skip'}
  ↓
写 plays（finished=0） + 触发 taste 增量更新
  ↓
context.ts 下次组装 prompt 时，新 taste 已生效
```

### 6.5 NCM 首启快照拉取（C9）

**核心原则：消费 NCM 已经算好的画像成品，不要拉原始事件再二次分析。**

```
首次登录扫码 → 拿 cookie / uid
  ↓
并行拉 NCM 已聚合的画像端点：
  ├─ /recommend/songs            每日推荐 30（NCM 协同过滤输出）
  ├─ /playmode/intelligence/list 心动模式（NCM 最深个性化）
  ├─ /style/preference           风格偏好 tag
  ├─ /listen/report              年度听歌报告
  ├─ /likelist                   喜欢列表（ground truth）
  ├─ /user/playlist              创建 + 收藏歌单（含标题，= 用户自打的品味标签）
  ├─ /user/cloud                 云盘
  └─ /fm_trash                   拉黑列表（反向信号）
  ↓
全部原样存 packages/server/data/ncm_snapshot.json
  ↓
prompt 组装时直接读 snapshot，不二次分析
  ↓
完成首启
```

**之后的学习信号 100% 来自 Claudio 内行为：**
- 用户在 Claudio 点喜欢 / 跳过 / 评论 → 写本地 `plays` / `feedback` 表
- **不做 NCM daily / weekly auto sync**（用户迁过来后不会再回 NCM 操作 = 死代码）
- **不做 Claudio → NCM 双向写回**（同上）
- v1.5 提供"重新拉一次"手动按钮（手机端偶有动作时手动触发）

**`taste.md` 的角色（澄清）：** 不是 NCM snapshot 的复刻品，是**用户手编的最高优先级指令**（"今晚别给我放林肯公园"、"早起前 30 分钟要带前奏的歌"）。Claudio 启动时初始为空模板，由用户随时编辑。

---

## 7. 非功能需求

| 维度 | 指标 |
|---|---|
| 首屏 | < 800ms（SW 缓存壳） |
| 切歌延迟 | < 500ms（pre-cache 下一首 10s 前置） |
| 串场合成 | < 3s（GPT-SoVITS 在 GPU 上）|
| 大脑响应 | < 5s（短串场）/ < 15s（完整 plan）|
| 隐私 | 所有数据本机 SQLite + 用户语料文件 |
| 安全 | 服务仅监听 127.0.0.1；公网由 Tailscale 加密 |
| 可观测 | 所有 brain 调用记录 prompt / output / latency / token 消耗 |

---

## 8. 风险与依赖

| 风险 | 影响 | 应对 |
|---|---|---|
| 网易云 API 反爬升级 / 接口变动 | 拿不到歌 | 切到 enhanced fork；缓存常听歌 |
| Claude Max 订阅认证失效 | 大脑挂 | Brain 接口已抽象，一行切 DeepSeek |
| GPT-SoVITS :8000 不稳 | 串场没声 | 降级到无音频纯文字串场 |
| 飞书 API 鉴权过期 | 日历断 | v1.5 范围，断了 plan 退化为纯品味驱动 |
| ncm 灰歌 / 版权下架 | 部分歌不能播 | enhanced 版"解灰" + 自动 fallback 同名相似歌 |
| 大脑选歌偏差大 | 体验差 | 跳过反馈回环 + taste 文件可手编纠偏 |
| NCM snapshot 首启拉取失败（cookie 过期 / 风控） | cold start 没画像 | 重试 + 降级为"空品味" + 引导用户手编 taste.md |
| 飞书日历升 v1 后日历断 | 节目单退化 | 单 cron 隔离 → 失败不影响其他流程，prompt 自动省略日历片段 |
| **Max 5x 配额挤兑**（电台后台跑 + 同时开 VSCode 工作） | 5h 内吃掉工作配额、月度 50 session 上限 | v1 中后期切 `BRAIN_TYPE=ollama` 让电台走本地模型，Claude 配额留给工作 |

---

## 9. 里程碑

| M | 目标 | 关键交付 |
|---|---|---|
| **M0** | 骨架 | monorepo + 三包 + 配置 + 空文件，`pnpm install` 通过 |
| **M1** | 后端 + DB + NCM + 首启快照 | drizzle schema 跑通；ncm 搜歌拿播放 URL；首次登录拉 NCM 画像 snapshot |
| **M2** | Brain 抽象 + Claude 子进程 + TTS | 后端能调 Claude 出 JSON + 合成串场 |
| **M3** | PWA 主页 + 播放器 + WS 流式对话 | 浏览器能播能聊，串场流式打字 |
| **M4** | 歌词 + 用户库 + 跳过喜欢 | 滚动歌词、登录、收藏、反馈学习 |
| **M5** | Scheduler + 桌宠联动 | 早间播报 / 整点检查 / 切歌触发桌宠 |
| **M6** | 飞书日历（升 v1） + 天气 + SW 离线壳 | PWA 可装机，节目单含日程感知 |

---

## 10. 待用户决策的开放问题

| # | 问题 | 用户答复 / 决策 |
|---|---|---|
| Q1 | 网易云有账号吗？VIP 吗？ | ✅ **有 VIP** → 默认拉 lossless 音质，灰歌走 enhanced 解灰 |
| Q2 | 飞书有日历用例吗？要不要换 Google Calendar / 本地 ics？ | ⚠️ **暂无飞书** → 设计为 `CalendarSource` 抽象接口；v1 默认 `NoOpCalendar` + `IcsFileCalendar`（用户可丢本地 .ics）；v1.5 加 `FeishuCalendar`（用户入职后启用）；v2 加 Google / Apple |
| Q3 | DJ 人设默认走"流萤温柔"还是"中立专业播报"？ | 流萤温柔（复用现有 SoVITS 模型） |
| Q4 | UI 视觉方向 | ✅ **三主题切换**：v1 极简（深色默认 + 浅色可切）；v1.5 黑胶复古；v2 二次元。架构 v1 就做 `<ThemeProvider>` + CSS 变量主题系统，后续加主题不返工 |
| Q5 | 大脑兜底 + 自部署 | ✅ **Brain 接口多适配器**：env `BRAIN_TYPE=claude\|deepseek\|ollama\|openai-compat\|custom` 切换；自带四个 ready 实现 + 完整文档；云端版默认 DeepSeek，自部署用户可换 Ollama 等本地模型。**绝不 hardcode key / 模型 URL 到云端**，全走 env |

---

## 附录 A · 与原始两张施工图的对应关系

- 第一张图（高层四层 + 协同 API）：1:1 还原
- 第二张图（router / context / claude / scheduler / tts / state.db 六模块）：1:1 还原
- 增量：Brain 接口抽象、云端 LLM 替换路径、桌宠联动、Tailscale 部署方案

## 附录 B · 关键术语

- **DJ 模式**：plan 表驱动，AI 自动选歌 + 串场
- **手动模式**：用户主导播放队列，DJ 不主动切歌但保留对话能力
- **品味语料**：`taste.md / routines.md / playlists.json / mood-rules.md` 四份文件，用户可直接编辑
- **串场（bubble）**：歌曲间的语音文案，由 Claude 生成、GPT-SoVITS 合成
- **plan**：今日节目单，scheduler 早上生成，整点可能重排
