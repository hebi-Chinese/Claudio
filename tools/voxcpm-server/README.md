# VoxCPM HTTP server (Claudio TTS adapter 后端)

把 [VoxCPM2](https://github.com/OpenBMB/VoxCPM) 的 Python in-process API 包成
`http://127.0.0.1:8001/synthesize` 给 Claudio 后端 (Node/TS) 调用.

跟 GPT-SoVITS `:8000/infer_single` 的响应字段 (`audio_url`) 故意一致 — TS adapter
风格统一.

## 为什么需要

VoxCPM 是 Python lib (load 模型, 调 `model.generate(...)` 拿 numpy wav). Claudio
server 是 TS, 不能跨语言直调, 所以包一层 HTTP. 这层只做翻译, 不做业务.

## 一次性安装

需 Python ≥ 3.10 (<3.13), CUDA ≥ 12.0, PyTorch ≥ 2.5, 显存 ≥ 6GB.

```bash
cd tools/voxcpm-server

# venv (推荐)
python -m venv .venv
.venv\Scripts\activate     # Windows
# source .venv/bin/activate # Linux/Mac

pip install -r requirements.txt
```

首次 `python app.py` 会从 HuggingFace 拉模型 (~4GB), 慢但只一次.
想固定路径不走 HF cache:

```bash
set VOXCPM_MODEL=D:\models\VoxCPM2     # 已下载到本地的路径
```

## 启动

```bash
python app.py
```

监听 `:8001`. 看到 `Uvicorn running on http://127.0.0.1:8001` 就 ok.

## 测一下

```bash
curl -X POST http://127.0.0.1:8001/synthesize ^
  -H "Content-Type: application/json" ^
  -d "{\"text\":\"你好主人, 今晚想听什么\"}"
```

返回:

```json
{ "audio_url": "http://127.0.0.1:8001/outputs/abc123.wav" }
```

浏览器打开 audio_url 应该能放出来.

## API

### `POST /synthesize`

请求:

```json
{
  "text": "要合成的中文 (1-500 字)",
  "voice_design": "温柔女声, 25 岁, 中性情绪", // 可选, 自然语言描述声音
  "cfg_value": 2.0, // 可选, classifier-free guidance
  "inference_timesteps": 10 // 可选, 越大越精细越慢
}
```

`voice_design` 是 VoxCPM 的核心特性 — 自然语言描述声音 (性别/年龄/情绪/语速/口音),
不需要参考音频. 例子:

- `"温柔女声, 25 岁, 慵懒带点磁性"`
- `"年轻男声, 略带嘶哑, 像电台 DJ"`
- `"机械感女声, 像 AI 助理"`

响应:

```json
{ "audio_url": "http://127.0.0.1:8001/outputs/<hash>.wav" }
```

### `GET /health`

返回 `{ "status": "ok", "model": "openbmb/VoxCPM2" }`. 给 Claudio 启动时探活用.

## 环境变量

| Env              | 默认              | 作用                             |
| ---------------- | ----------------- | -------------------------------- |
| `VOXCPM_MODEL`   | `openbmb/VoxCPM2` | HF repo 或本地路径               |
| `VOXCPM_HOST`    | `127.0.0.1`       | 监听 host                        |
| `VOXCPM_PORT`    | `8001`            | 监听端口                         |
| `VOXCPM_OUT_DIR` | `outputs`         | 生成 wav 落盘目录 (相对启动 cwd) |

## 怎么让 Claudio 用上

`claudio.bat` 顶部:

```bat
set TTS=voxcpm
set VOXCPM_URL=http://127.0.0.1:8001
set VOXCPM_VOICE_DESIGN=温柔女声, 25 岁, 中性情绪
```

或者直接 env:

```bat
set TTS_TYPE=voxcpm
set VOXCPM_URL=http://127.0.0.1:8001
```

然后**先起本 server** (`python app.py`), 再起 Claudio (`claudio.bat`).
Claudio TTS 调用就会走到 vox, DJ 的话声音变成 voice_design 描述的那种.

## Stuck

| 症状                            | 第一步                                                       |
| ------------------------------- | ------------------------------------------------------------ |
| `pip install voxcpm` 失败       | Python 版本要 ≥3.10 <3.13; PyTorch 装 CUDA 版本              |
| 起来但 `model.generate` 卡 30s+ | CUDA 没用上, 看启动 log `device=cpu`? 装 torch CUDA 版       |
| 8001 已占                       | `set VOXCPM_PORT=8002` 再起; 同时 Claudio 那边 VOXCPM_URL 改 |
| audio_url 返回但浏览器播不出来  | 防火墙挡 8001; outputs/ 路径权限不够                         |
| 中文音质怪                      | `voice_design` 没写清楚, 加 "中文, 标准口音" 等限定          |
