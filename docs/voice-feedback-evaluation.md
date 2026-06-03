# Voice Feedback Evaluation

## Purpose

V2.0 将 V1.8 的语音反馈和 V1.9 的语音脚本纳入回归评估。目标不是验证“机器人有没有说话”，而是验证关键状态是否触发了正确类型的话术，并且话术是否包含用户需要知道的行动信息。

## Why It Matters

具身智能机器人执行物理动作时，语音反馈承担三件事：

- 确认理解：用户知道机器人听懂了什么。
- 暴露风险：用户知道为什么要确认、暂停或接管。
- 支持恢复：用户知道下一步可以怎么做。

如果只评估任务是否完成，就会遗漏“用户是否能安全、可控地理解机器人状态”这一层体验质量。

## Evaluation Set

Data file:

```text
data/voice-feedback-evaluation-set.json
```

Current cases:

| Case | Checks |
|---|---|
| 低风险任务 | understand -> start -> progress -> done |
| 歧义澄清 | understand -> clarify |
| 安全确认 | understand -> confirm |
| 异常恢复 | understand -> start -> recovery |
| 中途改口 | understand -> start -> interrupt -> start -> progress -> done |
| 人工接管 | understand -> start -> handoff |

Each case validates two things:

- Expected feedback types are triggered in order.
- Expected text fragments appear in generated feedback.

## UI Entry

```text
http://localhost:8765/?voiceeval=1
```

The main demo shows:

- “运行语音反馈评估” button
- “语音评估” metric
- Case-by-case pass/fail result list

The test plan page also includes voice evaluation:

```text
http://localhost:8765/test-plan.html
```

## Interview Narrative

可以这样讲：

> 到 V2.0，我把语音反馈也纳入了 Agent 行为质量治理。因为具身智能里，任务完成只是底线，用户是否知道机器人听懂了什么、为什么暂停、是否需要确认、如何接管，同样决定产品是否可信。所以我把话术按系统状态做成评估集，验证关键状态能否触发正确反馈。
