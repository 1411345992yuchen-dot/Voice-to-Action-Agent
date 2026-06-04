# Focused Demo Links

V11 之后，项目默认只推荐三类入口：产品介绍、主 Demo、核心验收。其他历史页面保留在仓库里，但不再作为面试或作品集主路径。

## Run

```powershell
cd D:\voice-to-action-agent
python server.py
```

## Main Path

- 产品介绍：`http://localhost:8765/intro.html`
- 主 Demo：`http://localhost:8765/`
- 核心验收：`http://localhost:8765/test-plan.html`

## Recommended Demo Script

- 日常执行：`http://localhost:8765/?demo=把桌上的红色杯子拿到厨房台面`
- 歧义澄清：`http://localhost:8765/?demo=把杯子拿到厨房`
- 安全确认：`http://localhost:8765/?confirm=1&demo=把药盒递给老人`
- 执行中改口：`http://localhost:8765/?demo=把桌上的红色杯子拿到厨房台面&interrupt=别放厨房了，放门口`

## Status Brief Examples

- 澄清状态：`http://localhost:8765/?demo=把杯子拿到厨房`
- 安全确认：`http://localhost:8765/?demo=把药盒递给老人`
- 执行改口：`http://localhost:8765/?demo=把桌上的红色杯子拿到厨房台面&interrupt=别放厨房了，放门口`

## Core Acceptance

- 核心验收页：`http://localhost:8765/test-plan.html`
- 默认展示：10 条主链路用例，覆盖日常执行、歧义澄清、安全确认、执行中改口、语音反馈和多轮补全。
- 深度筛选：在页面里切换“全部 / 路线 / 高级交互 / 沙盒”，用于后续专项复盘，不作为默认演示路径。

## Archived Pages

这些页面不删除，主要用于查历史材料或以后继续开发：

- `portfolio-hub.html`
- `portfolio-brief.html`
- `real-voice-eval.html`
- `tool-calling-lab.html`
- `llm-integration-lab.html`
- `agent-architecture.html`
- `delivery-kit.html`
- `resume-pack.html`
- `interview-script.html`
- `demo-video-script.html`
