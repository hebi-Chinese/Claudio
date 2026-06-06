# Claudio · 个人 AI 电台

浏览器里开一个 PWA, AI DJ 给你聊天 + 选歌, 网易云音乐做音源, 流式 TTS 把 DJ 的话变成声音。Clean Architecture 的 pnpm monorepo。

## 前置

- Node.js >= 20 (推荐 22 LTS)
- pnpm >= 11 (`npm i -g pnpm`)
- Windows / macOS / Linux

## 起 dev

```bash
pnpm install
pnpm dev          # turbo 并行起 PWA (:3000) + server (:8787)
```

Windows 用户也可以直接双击根目录 `claudio.bat`。

打开 [http://localhost:3000](http://localhost:3000) 就能用。

## fork 起来要做什么

读 [CLAUDE.md](./CLAUDE.md) — 给 AI 助手 (Claude Code / Cursor / Copilot) 看的 fork 引导, 把 LLM 大脑 / TTS 声音 / 网易云账号三件事告诉它, 它会自动帮你配。

人工配也行, 三个必选项:

1. **LLM 大脑**: 改 `claudio.bat` 顶部 `set BRAIN=...` (`deepseek` / `ollama` / `openai` / `claude`), 见下面 "配 brain"
2. **TTS 声音**: 改 `claudio.bat` 顶部 `set TTS=...` (`mock` / `gpt-sovits` / `voxcpm`). voxcpm 已内置 Python wrapper, 先 `cd tools/voxcpm-server && pip install -r requirements.txt && python app.py` 起 :8001, 再起 Claudio. 详见 [tts/README](./packages/infrastructure/src/tts/README.md) 跟 [voxcpm-server/README](./tools/voxcpm-server/README.md)
3. **网易云账号** (可选): PWA 设置面板里扫码登录

### 配 brain

设计哲学: **URL 一层, brand 专属 env, 不预填 default**. 每个 BRAIN_TYPE 读自己专属的 URL env, 没填 startup throw (不静默走错地方).

最简配置 (DeepSeek): 改 `claudio.bat` 顶部两行就够:

```bat
set "BRAIN=deepseek"
set "DEEPSEEK_API_KEY=sk-your-key"
```

剩下的 (`DEEPSEEK_URL` / `OPENAI_API_KEY` / `OPENAI_MODEL`) bat 自动按 `BRAIN` 推. 想换 brain 改一行 `set BRAIN=...` 即可.

每个 brand 必须的 env 变量:

| BRAIN_TYPE      | 必须 set                                                                                         |
| --------------- | ------------------------------------------------------------------------------------------------ |
| `claude`        | (无 URL, 走 CLI 子进程)                                                                          |
| `deepseek`      | `DEEPSEEK_URL` + `OPENAI_API_KEY` + `OPENAI_MODEL`                                               |
| `ollama`        | `OLLAMA_URL` + `OPENAI_MODEL`                                                                    |
| `openai-compat` | `OPENAI_BASE_URL` + `OPENAI_API_KEY` + `OPENAI_MODEL` (官方 / 自部署 / OpenRouter 都走这条)      |
| `custom`        | 在 `apps/server/src/composition.ts` 给 `createBrain` 传 `customResolver: () => string`, 不走 env |

⚠ 互不串味: `BRAIN_TYPE=deepseek` 时**只读** `DEEPSEEK_URL`, 不会偷偷用 `OPENAI_BASE_URL` 兜底. 没填就 throw `BRAIN_TYPE=deepseek 必须 set DEEPSEEK_URL env`. 这是为了 shell 残留环境变量不跨 brand 串.

完整 brain 文档 → [brain/README](./packages/infrastructure/src/brain/README.md), 详细 fork 配置 → [CLAUDE.md](./CLAUDE.md).

## 仓库结构

```
apps/
  server/        Fastify 5 + WS 后端 (:8787)
  pwa/           Next.js 15 + React 19 前端 (:3000)
packages/
  domain/        业务实体 + Errors (零外部依赖)
  application/   use-cases + ports (只依赖 domain)
  infrastructure/  adapters (brain/tts/ncm/db/clock/...)
  shared/        config (env) + logger + 跨层共享
tools/
  configs/       共享 ESLint / Prettier / tsconfig
  arch-test/     dependency-cruiser 守住依赖方向
```

依赖单向: `apps → infrastructure → application → domain`。架构由 `pnpm arch:check` 强制。

## 常用命令

```bash
pnpm dev          # 起 PWA + server (turbo)
pnpm typecheck    # 全仓 tsc --noEmit
pnpm lint         # ESLint --max-warnings 0
pnpm arch:check   # dependency-cruiser
pnpm build        # 生产构建
```

## 端口

| Port | Service                     |
| ---- | --------------------------- |
| 3000 | PWA                         |
| 8787 | Server                      |
| 3001 | NCM API (server 自动 spawn) |
| 8000 | GPT-SoVITS (可选, 需自起)   |

## 状态

WIP 私有项目, 非生产就绪。
