# Agent Orchestration

## Product Point

本项目的核心不是“语音助手能聊天”，而是把自然语言转化为具身智能任务执行链。为了让这个能力对产品面试官可见，V1.1 将任务处理拆成五个可解释子 Agent。

## Agents

| Agent | 职责 | 产品价值 |
|---|---|---|
| Intent Agent | 判断用户要检查、递送、搬运还是拿取放置 | 把自然语言转成任务类型 |
| Grounding Agent | 绑定目标对象和目标位置 | 解决“那个”“左边”“桌上”等指代问题 |
| Safety Agent | 判断是否需要确认或人工接管 | 降低物理世界误执行风险 |
| Recovery Agent | 预测执行中断并提供恢复选项 | 让机器人在失败态里仍然可控 |
| Interruption Agent | 识别执行中用户打断、改口和接管 | 支持真实人机协作中的动态意图变化 |
| Planner Agent | 生成技能序列和执行步骤 | 把用户意图转成机器人可执行流程 |
| Evaluator Agent | 估算置信度并支持评估集回归 | 让 Agent 行为可测试、可复盘 |
| Voice Feedback Layer | 将关键状态转成机器人反馈话术 | 建立用户信任，降低物理执行的不确定感 |
| Conversation Design Layer | 将反馈话术沉淀为场景脚本、状态映射和指标 | 展示语音 Agent PM 对状态、风险和协作边界的设计能力 |
| Voice Feedback Evaluator | 验证关键状态是否触发正确话术 | 将语音反馈纳入 Agent 行为质量治理 |

## Key Design Choice

V1.1 使用规则型 Agent，而不是直接接入大模型。原因：

- 本地可运行，不依赖 API key。
- 产品流程可控，适合先验证交互闭环。
- 更容易向面试官解释每个环节的产品设计。
- 后续可以自然升级为 LLM function calling 或 VLM grounding。

## Embodied Intelligence Mapping

- Voice command -> Task goal
- Object grounding -> Scene understanding
- Safety confirmation -> Physical-world safety gate
- Planner -> Robot skill orchestration
- Evaluator -> Regression and behavior quality

## Current Known Example

用例：“把左边那个箱子搬到门口，小心别撞到椅子”

- Intent Agent: 识别为搬运任务。
- Grounding Agent: 目标对象是重箱子；椅子不是目标，而是避障约束。
- Safety Agent: 重箱子 + 小心避障，触发安全确认。
- Planner Agent: 生成导航、搬运、前往门口、状态反馈。
- Evaluator Agent: 给出执行置信度和风险解释。

## V1.2 Grounding Examples

- “把右边那个杯子拿到厨房台面”：Grounding Agent 在杯子候选中选择 x 坐标更靠右的蓝色杯子。
- “把桌上那个红色物体拿到厨房台面”：Grounding Agent 同时使用区域“桌上”和视觉属性“红色”，定位红色杯子。
- “把老人旁边那个东西递给老人”：Grounding Agent 使用空间关系“老人旁边”，定位边桌药盒，并由 Safety Agent 触发高风险确认。
- “把这个拿到厨房”：如果用户先点击场景对象，Grounding Agent 会使用选中对象作为指代上下文。
- 当前 V1.3 评估集覆盖 11 条核心任务流，并验证 11/11 通过。

## V1.3 Recovery Examples

- “把重箱子搬到门口”：Recovery Agent 预测门口通道阻塞，提供重规划路径、改放客厅安全区、人工接管。
- “把药盒递给老人”：Recovery Agent 预测敏感递送风险，提供确认收件人或人工接管。
- “小心别撞到椅子”：Recovery Agent 将椅子视为避障约束，而不是目标对象。

## V1.4 Interruption Examples

- 执行“把红色杯子拿到厨房台面”时，用户说“别放厨房了，放门口”：Interruption Agent 取消未完成动作，保留目标对象，重建目标位置和任务计划。
- 用户说“停一下”：系统进入暂停态，保留当前任务上下文，允许继续执行、改目标或人工接管。
- 用户说“不是这个，换蓝色杯子”：系统重选目标对象并重新生成执行计划。
- 用户说“交给我，我来接管”：系统安全停止，记录人工接管和风险拦截指标。

## V1.8 Voice Feedback Examples

- 任务理解后：机器人反馈“我已理解任务，目标位置是厨房台面。现在开始执行。”
- 高风险确认时：机器人反馈“这是高风险任务。我需要你确认后再执行，也可以转人工接管。”
- 异常恢复时：机器人反馈异常原因，并提示用户选择恢复策略。
- 中途打断时：机器人反馈已取消旧动作，并将按新的任务计划继续。

## V1.9 Conversation Design Examples

- 低风险任务：只保留开始和完成反馈，减少不必要打断。
- 歧义澄清：要求用户在候选对象中选择，不让机器人猜测。
- 安全确认：说明风险，并提供确认或人工接管。
- 异常恢复：提示恢复选项，而不是只告诉用户失败。
- 中途改口：确认最新意图，并说明旧动作会被取消。

## V2.0 Voice Feedback Evaluation

- 基础任务验证 `understand -> start -> progress -> done`。
- 歧义对象验证 `understand -> clarify`。
- 高风险任务验证 `understand -> confirm`。
- 异常恢复验证 `understand -> start -> recovery`。
- 中途改口验证 `interrupt` 话术是否说明取消旧动作和新计划。
- 人工接管验证 `handoff` 话术是否说明安全停止和保留上下文。
