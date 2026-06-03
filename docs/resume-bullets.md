# Resume Bullets

## 中文简历版本

- 独立设计并实现 Voice-to-Action 具身智能交互 Agent 原型，面向家庭/服务机器人任务场景，将自然语言指令转化为可执行任务流，覆盖意图解析、对象定位、多轮澄清、安全确认、异常恢复与评估集回归。
- 基于多 Agent 架构拆解具身交互链路，设计 Intent、Grounding、Safety、Recovery、Interruption、Planner、Evaluator 等模块，并在前端可视化展示每个 Agent 的判断依据。
- 设计多模态指代 grounding 能力，支持“右边那个杯子”“桌上那个红色物体”“老人旁边那个东西”“把这个拿到厨房台面”等语音/场景上下文表达。
- 构建高风险任务安全门控与失败恢复机制，针对药品递送、重物搬运、路径阻塞、避障失败等场景提供确认、重规划、改目标和人工接管策略。
- 支持执行中用户打断与改口，覆盖“停一下”“别放厨房，放门口”“换蓝色杯子”“交给我接管”等动态意图变化。
- 设计机器人语音反馈与对话脚本体系，覆盖任务理解、澄清、安全确认、执行进度、异常恢复、中途打断和人工接管，并沉淀状态、风险、话术、指标映射。
- 建立 15 条基础评估用例、7 条打断专项评估用例、7 条语音反馈评估用例和 4 条路线质量评估用例，覆盖任务完成、澄清、安全确认、异常恢复、中途打断、路线重规划、人工接管、话术触发和路线报告质量等关键交互指标，当前四类评估均 100% 通过。
- 新增 Grounding 证据面板、执行路径预览、路线重规划与路线质量评估能力，将“绕开椅子走”等空间语言约束转化为可视化路线、绕行点、风险标记和逐段执行过程。

## 面试项目一句话

这是一个从语音/多模态 Agent PM 过渡到具身智能产品经理的作品集项目，核心是验证“自然语言意图如何被转化为安全可执行的机器人任务流”。

## LinkedIn / 英文简历版本

- Designed and prototyped a Voice-to-Action Agent for embodied interaction, converting natural-language commands into executable robot task flows with intent parsing, object grounding, safety gating, recovery handling, and regression evaluation.
- Built a local multi-agent orchestration model with Intent, Grounding, Safety, Recovery, Interruption, Planner, and Evaluator modules, making each decision step visible in the product UI.
- Implemented scene-aware grounding for references such as "the cup on the right", "the red object on the table", and "this object", simulating multimodal interaction patterns for service robots.
- Designed safety and recovery flows for high-risk embodied tasks, including medicine delivery, heavy-object transport, blocked paths, obstacle avoidance, and human handoff.
- Added mid-execution user interruption handling for pause, destination correction, object correction, and human handoff.
- Designed robot voice feedback and conversation scripts for intent understanding, clarification, safety confirmation, execution progress, recovery, interruption, and handoff states, mapping system states to user risks, response strategies, and metrics.
- Created 15 core evaluation cases, 7 interruption-specific cases, 7 voice-feedback cases, and 4 route-quality cases, plus an expected-vs-actual test plan page for PM-oriented behavior quality review across task completion, clarification, safety confirmation, recovery, interruption, route replanning, handoff, feedback-trigger behavior, and route-report quality.
