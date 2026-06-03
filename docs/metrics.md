# Metrics

## Product Metrics

- Task Completion Rate: 任务完成率。
- First-pass Success Rate: 无澄清一次完成率。
- Clarification Rate: 触发澄清的任务比例。
- Confirmation Rate: 触发安全确认的任务比例。
- Human Handoff Rate: 人工接管比例。
- Risk Block Rate: 高风险自动执行被拦截比例。
- Recovery Trigger Rate: 任务执行中触发异常恢复的比例。
- Recovery Success Rate: 异常恢复后成功完成任务的比例。
- Interruption Handling Rate: 执行中用户打断被正确识别并处理的比例。
- Interruption Recovery Success Rate: 用户改口后仍能完成任务的比例。
- Interruption Evaluation Pass Rate: 打断专项评估集通过比例。
- Voice Feedback Coverage: 关键任务状态是否都有对应反馈话术。
- Voice Feedback Usefulness: 用户是否能通过反馈理解机器人状态和下一步操作。
- Script-State Coverage: 核心系统状态是否都有可复盘的话术脚本、用户风险和反馈策略。
- Voice Feedback Evaluation Pass Rate: 语音反馈评估集通过比例。
- Route Evaluation Pass Rate: 路线质量评估集通过比例。
- Route Risk Marker Recall: 路线报告是否识别到应有的障碍、门口、老人交接和高风险物体标记。
- Detour Compliance Rate: 用户要求绕行时，路线是否生成绕行点且不再穿过被规避障碍。
- Average Turns to Execute: 从用户下达任务到开始执行的平均轮次。
- Average Task Duration: 任务平均耗时。

## Interaction Quality Metrics

- Misunderstanding Rate: 对象、位置或动作理解错误比例。
- Over-clarification Rate: 不需要澄清却打断用户的比例。
- Under-clarification Rate: 应该澄清但直接执行的比例。
- User Trust Score: 用户对自动执行的信任评分。

## Embodied Intelligence Metrics

- Object Grounding Accuracy: 对象定位准确率。
- Action Feasibility Rate: 计划动作可执行比例。
- Collision or Near-miss Rate: 碰撞或近碰次数。
- Recovery Success Rate: 异常恢复成功率。
- Safe Interruption Rate: 执行中暂停、改口或接管时未出现危险动作的比例。
- Safe Stop Rate: 风险场景安全停止比例。
- Route Plan Validity: 路径分段、起点、取物点、绕行点和终点是否符合任务预期。
- Route Explainability: 用户是否能从路线卡片理解机器人为什么这样走、哪里需要注意。

## Interview Narrative

这个项目不把“识别率”作为唯一指标，因为具身智能交互的关键不是听懂一句话，而是安全地完成一个任务。指标体系需要覆盖理解、澄清、执行、安全和用户信任。

## V2.4 Evaluation Harness

- 基础评估集：`data/evaluation-set.json`，覆盖 15 条任务理解、grounding、安全确认、导航和恢复预案用例。
- 打断评估集：`data/interruption-evaluation-set.json`，覆盖 7 条暂停、改目标、换对象、路线重规划、人工接管和无效打断用例。
- 语音评估集：`data/voice-feedback-evaluation-set.json`，覆盖 7 条理解、澄清、确认、恢复、改口、绕行和接管话术用例。
- 路线质量评估集：`data/route-evaluation-set.json`，覆盖 4 条 direct / avoid_chair / navigation / elder handoff 路线报告用例。
- 测试计划页：`test-plan.html`，合并 33 条用例并展示 expected vs actual、PASS/FAIL 和复盘说明。
- Demo URL:

```text
http://localhost:8765/?eval=1
http://localhost:8765/?interrupteval=1
http://localhost:8765/?voiceeval=1
http://localhost:8765/?routeeval=1
http://localhost:8765/test-plan.html
http://localhost:8765/voice-script.html
```
