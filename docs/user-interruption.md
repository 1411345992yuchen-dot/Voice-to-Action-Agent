# User Interruption

## Why It Matters

真实具身智能交互不是“一问一答”。用户会在机器人已经开始行动后临时改口：停一下、别放那里、换另一个、我来接管。对产品经理来说，这类场景直接决定用户是否信任机器人。

## V1.4 Scope

V1.4 在执行层加入 Interruption Agent 视图，覆盖四类打断：

| Type | 示例 | 系统行为 |
|---|---|---|
| Pause | 停一下、等等 | 取消未完成动作，进入暂停态，保留上下文 |
| Change destination | 别放厨房了，放门口 | 保留目标对象，重建目标位置和任务计划 |
| Change object | 不是这个，换蓝色杯子 | 重选目标对象，重新执行 grounding 和 planning |
| Human handoff | 交给我，我来接管 | 安全停止，记录人工接管和风险拦截 |

## Demo URL

```text
http://localhost:8765/?demo=把红色杯子拿到厨房台面&interrupt=别放厨房了，放门口
http://localhost:8765/?interrupteval=1
```

## V1.5 Interruption Evaluation

为了让“用户中途改口”不是一次性演示，V1.5 增加了 `data/interruption-evaluation-set.json`：

- 改目标位置：厨房台面 -> 门口。
- 暂停任务：执行中进入 Paused。
- 换目标对象：红色杯子 -> 蓝色杯子。
- 人工接管：高风险递送任务安全停止。
- 改放安全区：重箱子改放客厅安全区。
- 无效打断：如“声音大一点”不应误触发任务重规划。

## PM Interview Narrative

这部分体现的是具身智能产品里的动态任务控制能力：机器人不能只在任务开始前理解用户，还要在执行过程中允许用户纠正、暂停和接管。产品设计重点不是“打断按钮”，而是上下文保留、动作取消、计划重建、安全停止、指标归因和回归评估。
