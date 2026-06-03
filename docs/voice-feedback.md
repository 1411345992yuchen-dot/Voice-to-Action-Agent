# Voice Feedback

## Purpose

V1.8 将 Voice-to-Action Agent 从“语音/文本输入”推进到“语音交互闭环”。具身智能机器人不只要听懂用户，还要在关键节点用清晰话术反馈：我理解了什么、为什么要确认、现在做到哪一步、为什么暂停、如何恢复、什么时候交给人。

## Scope

- 机器人话术日志：在 Demo 左侧展示最近反馈。
- 播报开关：浏览器支持 Web Speech API 时，可用系统语音朗读。
- 重播最近一句：用于面试演示关键状态反馈。
- 语音反馈指标：统计本次 demo 生成的话术数量。

## Covered Moments

| Moment | Example Feedback |
|---|---|
| Ready | 我已就绪。请告诉我你希望我完成什么任务。 |
| Understanding | 我正在理解你的任务，并检查目标对象、位置和安全条件。 |
| Clarification | 我需要确认目标对象。请在候选项里选择你指的是哪一个。 |
| Safety confirmation | 这是高风险任务。我需要你确认后再执行，也可以转人工接管。 |
| Execution start | 我已理解任务，目标位置是厨房台面。现在开始执行。 |
| Progress | 我正在前往目标位置，并准备完成任务。 |
| Recovery | 检测到通道可能受阻，请从恢复选项中选择下一步。 |
| Interruption | 我已暂停任务，并保留当前上下文。 |
| Handoff | 我已安全停止，并保留任务上下文供人工接管。 |

## Interview Narrative

这部分可以这样讲：

> 我把语音交互拆成输入理解和输出反馈两部分。很多语音助手只关注 ASR/NLU，但具身智能更需要状态播报，因为用户要知道机器人是否理解正确、是否安全、是否在执行、为什么暂停，以及接下来需要用户做什么。V1.8 的话术日志和播报开关，是为后续真实 TTS 和多模态反馈预留的产品层。

## V1.9 Extension

V1.9 在此基础上新增 `voice-script.html` 和 `docs/voice-interaction-script.md`，把话术从 Demo 日志沉淀为对话设计资产。重点不再只是“系统能说话”，而是说明每一句反馈对应哪个系统状态、降低哪类用户风险、触发什么下一步动作，以及可以用什么指标验证。

## V2.0 Evaluation Extension

V2.0 新增 `data/voice-feedback-evaluation-set.json` 和 `docs/voice-feedback-evaluation.md`，把话术触发纳入回归评估。当前覆盖理解、澄清、安全确认、异常恢复、中途改口和人工接管 6 类场景，用于验证关键状态是否触发正确类型和内容的反馈。

## V2.3 Route Replanning Extension

V2.3 将“路线重规划”也纳入语音反馈评估。新增用例验证执行中用户说“绕开椅子走”时，系统需要明确反馈：已重规划路径、会绕开椅子障碍、会取消旧动作并沿新的绕行路线继续。当前语音评估覆盖 7 条场景，7/7 通过。
