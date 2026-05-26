# Claudio · 个人 AI 电台

让 Claude（或可换的 LLM）当 DJ 大脑，读你听歌习惯、规划串场、像电台主播那样播报。网易云音乐拿歌，GPT-SoVITS 合成语音。

## 文档入口

- [PRD.md](./PRD.md) —— 需求 / 架构 / 里程碑
- [CODING_STANDARDS.md](./CODING_STANDARDS.md) —— 通用代码规范（语言无关）
- [CODING_STANDARDS_NODE_TS.md](./CODING_STANDARDS_NODE_TS.md) —— Node + TypeScript 专项

## 前置要求

- Node.js >= 20（推荐 24 LTS，本机已用）
- pnpm >= 11（`npm i -g pnpm`）
- Windows / macOS / Linux 任意

## 快速开始

```bash
# 1. 安装依赖
pnpm install

# 2. 类型检查（验证骨架）
pnpm typecheck

# 3. 启动开发服（所有包并行）
pnpm dev
```

## 仓库结构

详见 PRD §5.3。简版：

```
apps/
  server/                 Fastify 后端入口
  pwa/                    Next.js 15 前端
packages/
  shared/                 跨层共享（types / schemas / logger / config / errors）
  domain/                 业务实体 + 不变量（零依赖）
  application/            use-cases + ports（接口定义）
  infrastructure/         适配器实现（brain / ncm / tts / calendar / signal / db）
  ui/                     前端 tokens + components + themes
tools/
  configs/                共享 ESLint / Prettier / tsconfig
  arch-test/              dependency-cruiser 架构测试
```

## 端口分配

| 端口 | 服务 |
|---|---|
| 3000 | Next.js PWA |
| 8787 | Fastify 后端 |
| 3001 | NCM API（自动 spawn） |
| 8000 | GPT-SoVITS 语音（外部，用户手动起） |
| 9527 / 9528 | aemeath 桌宠 HTTP / MCP（外部） |

## 状态

v0.1 · M0 骨架阶段
