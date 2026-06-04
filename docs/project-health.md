# Project Health

## Current State

V11 把项目从“作品集材料集合”收缩回 Voice-to-Action Agent 本体。当前主线只有三类入口：

1. `intro.html`：说明产品问题、主流程和非目标。
2. `index.html`：主产品 Demo，验证自然语言任务到物理执行流。
3. `test-plan.html`：核心验收页，证明关键行为可回归。

## Current Strengths

- 主 Demo 可本地运行，能展示从自然语言到机器人任务执行的闭环。
- Agent 编排链路清晰：Intent、Grounding、Safety、Planner、Evaluator。
- 支持对象澄清、安全确认、路线预览、执行中改口、异常恢复和运行日志。
- 核心验收仍覆盖基础、打断、语音反馈、路线质量和高级交互回归。
- 新增聚焦版 `intro.html`，适合面试开场快速说明项目价值。

## Current Risks

- 场景仍是 2D 产品抽象，不是机器人 SDK 或真实仿真环境。
- 真实语音、Tool Calling 和 LLM 接入桥已作为历史实验保留，但不再是主路径。
- 主 Demo 仍保留较多高级能力，后续应继续做“默认简洁，高级折叠”。
- 家庭场景视觉还可以继续打磨，但优先级低于主流程稳定性和讲解清晰度。

## V11 Scope Reset

- 新增 `intro.html` 作为唯一介绍页。
- 主 Demo 顶部导航只保留“产品介绍”和“核心验收”。
- `portfolio-hub.html` 改为跳转到 `intro.html` 的收缩说明页。
- 默认隐藏主 Demo 的高级评估按钮和底部大指标条，减少界面噪音。
- `README.md` 和 `docs/demo-links.md` 已改为聚焦版，只推荐主 Demo 与核心验收路线。

## Recommended Next

1. 继续简化主 Demo 左栏和右栏，让默认界面只呈现“输入 -> 场景 -> 决策”三件事。
2. 做一版核心场景脚本锁定：日常执行、歧义澄清、安全确认、执行中改口。
3. 把高级实验页移入更明确的 `archive` 或文档归档索引，避免未来继续发散。
