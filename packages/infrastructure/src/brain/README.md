# Brain Adapters

实现 `IBrain` 接口（在 `@claudio/application/ports/brain`）。

## 已实现

- `claude/` —— Claude Code 子进程（默认，需要本地 CLI + Max 订阅）

## 待实现（v1.5+）

- `deepseek/` —— DeepSeek API
- `ollama/` —— 本地 Ollama
- `openai-compat/` —— 任意 OpenAI 协议网关
- `custom/` —— 用户自定义

## 添加新 brain

1. 在本目录新建 `<name>/` 子目录
2. 在 `<name>/index.ts` 实现 `IBrain`
3. 在父级 `../index.ts` 注册到 `createBrain()` switch 分支
4. 加测试 `<name>/index.test.ts`
5. 兄弟 adapter 间**不要互相 import**（架构测试会拒绝）
