# Roadmap

## V1: Voice/Text to Task Flow

- 固定 2D 家庭场景
- 多 Agent 编排：Intent、Grounding、Safety、Planner、Evaluator
- 场景语义 grounding：颜色、区域、左右、旁边、选中对象上下文
- 对象澄清
- 安全确认
- 异常恢复预案：重规划、改目标、暂停等待、人工接管
- 执行中用户打断：暂停、改目标、换对象、人工接管
- 执行时间线
- 指标面板
- 评估集回归

## V1.2: Multimodal Grounding Prototype

- 增加对象视觉属性：颜色、区域、类型、别名
- 支持“右边那个杯子”“桌上那个红色物体”“老人旁边那个东西”
- 支持点击场景对象后用“这个/那个”指代
- 扩展评估集到 10 条用例，并验证 10/10 通过

## V1.3: Failure Recovery

- 增加 Recovery Agent
- 对门口重箱子、药品递送、避障任务预置恢复策略
- 执行中模拟异常暂停，让用户选择重规划、改目标或人工接管
- 扩展评估集到 11 条用例，并验证 11/11 通过

## V1.4: User Interruption

- 增加执行中的 Interruption Agent 视图
- 支持“停一下”“别放厨房了，放门口”“不是这个，换蓝色杯子”“交给我接管”
- 打断时取消未完成动作，保留上下文，并重建任务计划
- 增加中途打断指标，用于衡量动态意图变化处理能力

## V1.5: Interruption Evaluation

- 新增 `data/interruption-evaluation-set.json`
- 覆盖暂停、改目标、换对象、人工接管、改放安全区和无效打断
- 增加“运行打断评估”入口和打断评估指标卡
- 当前打断专项评估 6/6 通过

## V1.6: Test Plan Replay

- 新增 `test-plan.html`
- 将 11 条基础评估和 6 条打断评估合并为 17 条可回放测试用例
- 支持按基础/打断筛选，并展示 expected vs actual、PASS/FAIL、PM 复盘口径和对应 demo 链接
- 用于面试讲解 Agent 行为质量治理，而不只是展示单次 demo

## V1.7: Version History

- 新增 `version-history.html`
- 将 V1.0-V1.7 串成完整产品演进故事，并在后续版本持续补充证据链
- 每个版本都对应产品问题、关键优化、体现能力和证据链接
- 用于面试开场、项目复盘和职业转型叙事表达

## V1.8: Voice Feedback

- 新增机器人语音反馈卡片
- 支持反馈话术日志、播报开关、重播最近一句
- 覆盖理解、澄清、安全确认、执行进度、完成、异常恢复、中途打断和人工接管
- 增加语音反馈指标，用于展示语音交互闭环

## V1.9: Voice Interaction Script

- 新增 `voice-script.html`
- 将低风险任务、歧义澄清、安全确认、异常恢复、中途改口和人工接管沉淀成对话脚本
- 建立系统状态、用户风险、反馈策略和指标的映射
- 用于展示语音 Agent PM 的对话设计、风险表达和状态管理能力

## V2.0: Voice Feedback Evaluation

- 新增 `data/voice-feedback-evaluation-set.json`
- 首页新增“运行语音反馈评估”和“语音评估”指标
- 测试计划页新增语音评估筛选和 6 条话术触发回归用例
- 覆盖理解、澄清、安全确认、异常恢复、中途改口和人工接管
- 用于展示语音 Agent PM 的话术质量治理、状态机意识和交互回归评估能力

## V2.1: Grounding Evidence

- 新增 Grounding 证据面板
- 展示候选对象、证据分、命中原因、最终选择和导航类无对象解释
- 修复“老人旁边那个东西”等空间语义被上一轮选中对象劫持的问题
- 用于展示具身智能 Agent 的可解释 grounding 和行为复盘能力

## V2.2: Route Preview

- 新增路线 overlay 和执行路径预览卡片
- 展示路线分段、预计距离、预计耗时和路径风险点
- 执行中路线进度随机器人移动更新
- 用于展示物理执行过程可预期，而不只是语言理解正确

## V2.3: Route Replanning

- 支持“绕开椅子走”等空间约束，生成主动绕行点
- 恢复策略“重规划路径”和执行中打断“绕开椅子走”都能真实改变路线
- 机器人按路线段逐段移动，携带物体跟随机器人经过绕行点
- 基础评估 15/15、打断评估 7/7、语音评估 7/7，通过测试计划页合并为 29 条可回放用例

## V2.4: Route Quality Evaluation

- 新增 `data/route-evaluation-set.json`
- 首页新增“运行路线质量评估”和“路线评估”指标
- 测试计划页新增路线评估筛选和 4 条路线报告回归用例
- 覆盖 direct、avoid_chair、navigation、elder handoff 四类路线报告
- 验收路径分段、绕行点、风险标记、策略标签和路线模式，当前路线评估 4/4 通过
- 基础评估 15/15、打断评估 7/7、语音评估 7/7、路线评估 4/4，通过测试计划页合并为 33 条可回放用例

## V2.5: Route Scoring and Comparison

- 在路线报告中新增 `routeScore`，输出安全分、效率分、可行性分、总分、等级、风险暴露和绕行成本
- 在门口/障碍相关任务中新增 `routeComparison`，对比默认路线与绕行路线
- 路线预览卡片展示评分、推荐理由、默认/绕行路线距离、耗时、安全差和风险暴露差
- 路线评估集新增评分验收字段：最低总分、等级、最低安全分、最低效率分和推荐路线
- 当前基础评估 15/15、打断评估 7/7、语音评估 7/7、路线评估 4/4，测试计划总通过率 100%

## V2.6: PM Review Mode

- 测试计划页新增 PM 复盘模式，不只显示 PASS/FAIL，还输出归因、责任模块、证据和下一步动作
- 支持归因到产品定义、Grounding、安全门控、路线规划、路线评分、执行状态机和话术策略
- 顶部新增 PM 复盘重点卡，自动统计阻塞/观察样本，并提示当前最值得复盘的模块
- 通过用例也会标记观察样本，例如高风险任务、路线低分任务、执行中重规划或接管任务
- 当前基础评估 15/15、打断评估 7/7、语音评估 7/7、路线评估 4/4，测试计划总通过率 100%

## V2.7: Failure Injection / Review Sandbox

- 测试计划页新增 Review Sandbox，不影响真实回归结果，但可以额外注入一条可控失败用例
- 支持四类典型事故：错拿对象、路线低分、安全漏检、旧任务泄漏
- 沙盒用例自动进入 PM Review 卡片，输出严重级别、归因、责任模块、证据和下一步动作
- 支持 URL 直达沙盒场景，例如 `test-plan.html?sandbox=grounding_wrong_object`
- 真实回归基线仍保持基础评估 15/15、打断评估 7/7、语音评估 7/7、路线评估 4/4，测试计划总通过率 100%

## V3.0: Multi-turn Context Manager

- 主 Demo 新增多轮上下文面板，展示当前输入被判定为新任务、补充澄清、确认、取消、修正上一任务、连续任务或执行中打断
- 支持待澄清问题的短回复补全，例如先说“把杯子拿到厨房”，再说“红色的”，系统会复用上一轮命令并注入 `objectId`
- 支持待安全确认任务的短回复确认或取消，例如“确认”“继续”“取消”
- 保留上一任务摘要，便于后续做“不是那个，换蓝色的”“然后去门口看看快递”等多轮任务能力
- 运行日志新增上下文决策记录，便于复盘多轮交互中是如何判断、补全或取消任务的

## V3.1: Task Queue and Priority Management

- 主 Demo 新增任务队列面板，展示进行中、等待、完成和取消数量
- 支持把复合指令拆成顺序队列，例如 `先把红色杯子拿到厨房，再请你移动到客厅`
- 队列项包含状态、优先级、风险提示、目标对象和目标位置
- 当前任务完成后自动推进下一个等待任务；如果遇到安全确认或澄清，会停在等待输入状态
- 队列行为写入运行日志，便于复盘多任务编排、优先级和安全门控之间的关系

## V3.2: Dynamic Environment and Perception Events

- 主 Demo 新增环境感知面板，可手动触发目标被挪走、路径被挡住、老人位置变化
- 目标被挪走时，系统更新物体坐标和 zone，并刷新路线预览
- 路径被挡住时，系统把椅子移动到通道区域；如果当前正在执行任务，则暂停并进入异常恢复选择
- 老人位置变化时，系统更新 `elder_seat` 目标点，涉及老人递送或靠近任务会重新计算路线
- 支持 URL 触发感知事件，例如 `?demo=把红色杯子拿到厨房&perception=path_blocked`
- 感知事件会写入运行日志、时间线和环境感知 feed，便于复盘动态物理世界中的 Agent 行为

## V3.3: Advanced Interaction Evaluation

- 新增 `data/advanced-interaction-evaluation-set.json`。
- 把多轮澄清、多轮确认、任务队列和动态感知 4 类高级交互纳入 `test-plan.html`。
- 测试计划页新增“高级交互”汇总卡和筛选项，真实回归基线从 33 条扩展到 37 条。
- 当前结果：基础 15/15、打断 7/7、语音 7/7、路线 4/4、高级交互 4/4，总通过率 100%。

## V3.4: PM Demo Guide

- 测试计划详情页新增 `PM Demo Guide`。
- 每条用例自动生成产品问题、观察证据、决策口径、下一步指标和 60 秒讲解词。
- 针对基础理解、执行中打断、语音反馈、路线规划、沙盒事故、多轮上下文、任务队列和动态感知分别输出不同讲解口径。
- 目标是让项目不仅能跑，还能在面试中讲清楚“为什么这个能力体现语音/具身智能产品经理能力”。

## V3.5: Live Quality Evidence

- 主 Demo 新增 `Quality Evidence / PM 讲解` 面板。
- 运行任务时自动匹配测试计划里的基础、语音、路线或高级交互用例。
- 展示当前任务的产品问题、观察证据、决策口径、下一步指标和面试讲解词。
- 目标是把现场 Demo 和质量治理页面打通，让演示本身就能说明“这个行为如何被评测和指标约束”。

## V9.0: GitHub Showcase Package

- README 首屏新增项目定位、推荐阅读路径和四张核心截图。
- 新增 `docs/github-publish-checklist.md`，沉淀提交前检查、截图路径、分享顺序和推荐介绍文案。
- `docs/screenshots` 纳入 GitHub 展示资产，支持异步评审。
- 目标是让项目从“本地可运行”升级为“外部打开也能快速理解价值”。

## V9.1: Real Voice Evaluation

- 新增 `real-voice-eval.html`。
- 新增 `src/real-voice-eval.js` 和 `data/real-voice-evaluation-set.json`。
- 支持浏览器 Web Speech API 识别、模拟 ASR 文本、置信度、人工修正和本轮评估日志。
- 评估覆盖清晰执行、歧义澄清、误识别修正、高风险确认、闲聊误触发和无物体导航。
- 目标是把语音链路从“输入方式”提升为“ASR 到物理执行门控的产品质量评估”。

## V9.2: LLM Tool Calling Prototype

- 新增 `tool-calling-lab.html`。
- 新增 `src/tool-calling-prototype.js`、`src/tool-calling-lab.js` 和 `data/tool-calling-evaluation-set.json`。
- 把现有 Agent 编排包装成工具调用链：指令分类、意图解析、场景 grounding、安全门控、路线规划、执行门控和工具链评估。
- 批量评估覆盖普通递送、歧义澄清、高风险确认、绕行路线、闲聊误触发和无物体导航。
- 目标是先固定工具契约和验收边界，再把 mock planner 替换成真实 LLM function calling。

## V9.3: One-page Portfolio Brief

- 新增 `portfolio-brief.html`，把项目定位、问题、方案、核心机制、证据指标、演示路径和面试讲法收敛为一页。
- 新增 `docs/portfolio-one-page-brief.md`，提供可复制到投递材料或 GitHub 的 Markdown 版本。
- 页面支持浏览器打印和导出 PDF。
- 目标是让项目不仅能被浏览和运行，也能被快速转发给 HR、面试官或作品集评审。

## V10.0: LLM Integration Bridge

- 新增 `llm-integration-lab.html`。
- 新增 `src/llm-integration-bridge.js`、`src/llm-integration-lab.js` 和 `data/llm-integration-evaluation-set.json`。
- `server.py` 新增 `/api/llm-tool-plan` dry-run 后端代理，校验真实 LLM 接入前的请求边界，不暴露浏览器端 API Key。
- 页面展示前端请求包、后端代理响应、本地确定性 Tool Calling 兜底和接入检查项。
- 评估覆盖低风险执行、高风险确认、歧义澄清、闲聊阻止、缺少世界状态和代理不可用六类接入风险。
- 目标是从“Tool Calling 契约”推进到“真实模型接入前的代理、安全和回退策略”。

## V11.0: Scope Reset

- 新增 `intro.html`，作为唯一推荐介绍页。
- 主 Demo 顶部导航只保留“产品介绍”和“核心验收”。
- `portfolio-hub.html` 降级为收缩说明和跳转页。
- 默认隐藏主 Demo 的高级评估按钮和底部大指标条。
- `README.md`、`docs/demo-links.md` 和 `docs/project-health.md` 改为聚焦版。
- 历史作品集材料、Tool Calling Lab 和 LLM Integration Lab 保留归档，但不再作为演示主线。
- 目标是把项目重新聚焦到 Voice-to-Action Agent 本体：自然语言任务理解、对象定位、安全确认、路线执行、反馈和异常恢复。

## V2: Multimodal Reference

- 加入场景图上传或静态图片
- 支持“左边那个”“桌上的那个红色物体”等多模态指代
- 引入对象 grounding 评估
- 扩展错误案例回放到真实视觉 grounding 失败态

## V3: Agentic Planner

- 接入 LLM function calling
- 工具化技能：navigate、pick、place、inspect、handoff
- 增加任务计划可编辑和人审
- 引入自动评估集回归

## V4: Robot Simulation Bridge

- 对接简化 ROS2 或仿真层
- 支持导航失败、抓取失败、路径阻塞等真实异常
- 增加任务恢复策略
- 输出完整作品集 case study
