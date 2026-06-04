# Demo 链接清单

本地运行：

```powershell
cd D:\voice-to-action-agent
python server.py
```

然后打开：

```text
http://localhost:8765/
```

## 作品集入口

- 作品集首页：`http://localhost:8765/portfolio-hub.html`
- 一页式 Brief：`http://localhost:8765/portfolio-brief.html`
- 面试演示模式：`http://localhost:8765/interview-demo.html`
- 岗位讲法：`http://localhost:8765/role-positioning.html`
- 产品决策日志：`http://localhost:8765/decision-log.html`
- 证据总览：`http://localhost:8765/evidence-dashboard.html`
- 语音交互专项：`http://localhost:8765/voice-lab.html`
- 真实语音评估：`http://localhost:8765/real-voice-eval.html`
- Tool Calling Lab：`http://localhost:8765/tool-calling-lab.html`
- LLM Integration Lab：`http://localhost:8765/llm-integration-lab.html`
- Agent 架构说明：`http://localhost:8765/agent-architecture.html`

## 可运行任务 Demo

- 日常递送：`http://localhost:8765/?demo=把红色杯子拿到厨房台面`
- 歧义澄清：`http://localhost:8765/?demo=把杯子拿到厨房`
- 高风险确认：`http://localhost:8765/?confirm=1&demo=把药盒递给老人`
- 执行中改口：`http://localhost:8765/?demo=把红色杯子拿到厨房台面&interrupt=别放厨房了，放门口`
- 避障路线：`http://localhost:8765/?demo=把重箱子搬到门口，绕开椅子走`
- 语音 PM Demo：`http://localhost:8765/?voicedemo=1`

## 质量验证

- 核心评估：`http://localhost:8765/?eval=1`
- 打断评估：`http://localhost:8765/?interrupteval=1`
- 语音反馈评估：`http://localhost:8765/?voiceeval=1`
- 路线质量评估：`http://localhost:8765/?routeeval=1`
- 真实语音评估：`http://localhost:8765/real-voice-eval.html`
- Tool Calling 评估：`http://localhost:8765/tool-calling-lab.html`
- LLM 接入桥评估：`http://localhost:8765/llm-integration-lab.html`
- 测试计划页：`http://localhost:8765/test-plan.html`
