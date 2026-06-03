# Voice-to-Action Agent 一页式作品集 Brief

## 一句话定位

Voice-to-Action Agent 是一个面向语音交互 / Agent PM / 具身智能 PM 转型的本地原型项目：将用户语音或文本指令转化为可执行、安全、可恢复、可评估的家庭服务机器人任务流。

## 产品问题

真实物理世界里，用户不会只说结构化命令。他可能说“把杯子拿到厨房”“老人旁边那个东西递给老人”“别放厨房了放门口”。系统必须先理解指令、定位对象、判断风险、规划动作，并在执行中处理改口和异常，而不是像聊天助手一样只生成一句回答。

## 解决方案

构建一个本地可运行的 Voice-to-Action Agent 原型，把用户输入拆成 Intent、Grounding、Safety、Planner、Execution / Interruption、Evaluator 等模块，并用可视化家庭场景展示机器人任务执行过程。

## 核心能力

- 意图解析：识别搬运、递送、检查、机器人自主导航等任务。
- 场景 grounding：处理“右边那个杯子”“老人旁边那个东西”“这个”等指代。
- 安全门控：药盒、老人、重箱子、门口等场景进入确认或接管。
- 路线规划：展示路线预览、绕行规划、路线评分和风险标记。
- 执行中改口：支持暂停、换对象、改目标、绕行和人工接管。
- 真实语音评估：记录 ASR 文本、置信度、人工修正、误触发阻止和 Agent 解析。
- Tool Calling 原型：将现有 Agent 包装成可替换工具接口，为真实 LLM function calling 做准备。

## 证据指标

| 指标 | 当前结果 |
|---|---|
| 核心任务回归 | 15/15 |
| 测试计划用例 | 37 |
| 真实语音评估 | 6/6 |
| Tool Calling 评估 | 6/6 |

## PM 能力证据

- 能把模糊用户意图拆成可执行任务流。
- 能定义 grounding、安全门控、误触发、确认成本和恢复成功率等指标。
- 能用评估集、Review Sandbox 和 PM Review 归因治理 Agent 行为质量。
- 能把规则原型升级为可替换 Tool Calling 架构。

## 推荐演示路径

1. 打开主 Demo，跑“把红色杯子拿到厨房台面”。
2. 跑“把杯子拿到厨房”，展示歧义澄清。
3. 打开真实语音评估，看 ASR 到执行门控。
4. 打开 Tool Calling Lab，看 LLM 接入前的工具契约。

## 面试讲法

这个项目和我在华为做的多 Agent 告警工作流是一条能力主线：都是把人的模糊意图和业务 SOP 转成可执行、可解释、可评估的任务流。区别在于，这个项目把能力迁移到了语音和具身智能场景，补齐了物理执行中的 grounding、安全、路线、异常和工具调用边界。

## 链接

- 作品集首页：`http://localhost:8765/portfolio-hub.html`
- 主 Demo：`http://localhost:8765/`
- 一页式 Brief：`http://localhost:8765/portfolio-brief.html`
- 真实语音评估：`http://localhost:8765/real-voice-eval.html`
- Tool Calling Lab：`http://localhost:8765/tool-calling-lab.html`
- Agent 架构：`http://localhost:8765/agent-architecture.html`
- 测试计划：`http://localhost:8765/test-plan.html`
