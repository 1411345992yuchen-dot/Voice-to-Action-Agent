# Voice-to-Action Agent

Voice-to-Action Agent 是一个聚焦具身智能交互的本地产品原型：用户用语音或文本说出自然语言任务，系统将其转化为可执行、安全、可解释的机器人任务流。

这个项目现在只强调一个主命题：

```text
自然语言指令 -> 意图理解 -> 对象定位 -> 安全确认 -> 动作规划 -> 执行反馈 / 异常恢复
```

## Product Focus

目标用户不是来阅读一堆作品集材料的人，而是想快速判断这个产品原型是否成立的面试官、AI 产品经理或具身智能产品经理。

核心问题：

- 用户不会输入结构化命令，只会说“把杯子拿到厨房”“老人旁边那个东西递给老人”。
- 机器人不能只理解语言，还要知道拿什么、送到哪、有没有风险、是否需要确认。
- 物理世界执行不是一句回答，必须有路线、状态、反馈、异常和接管。

## Run Locally

```powershell
cd D:\voice-to-action-agent
python server.py
```

打开主 Demo：

```text
http://localhost:8765/
```

打开产品介绍页：

```text
http://localhost:8765/intro.html
```

打开核心验收页：

```text
http://localhost:8765/test-plan.html
```

## Main Demo

主 Demo 是项目主体，不再让作品集包装页抢主线。
V11.1 后默认界面只保留三块：一句话任务、家庭场景、任务状态。语音确认、执行接管、指代对象和高级证据只在需要时展开。
V11.2 在任务状态侧新增“理解 / 定位 / 安全门 / 执行”四步核心流程条，让面试官不用展开高级证据，也能看到 Voice-to-Action 的产品闭环。

推荐演示 4 条路径：

1. 日常执行：`把桌上的红色杯子拿到厨房台面`
2. 歧义澄清：`把杯子拿到厨房`
3. 安全确认：`把药盒递给老人`
4. 执行中改口：先执行杯子任务，再输入 `别放厨房了，放门口`

## Core Capabilities

- **自然语言任务理解**：识别搬运、递送、检查、机器人自主导航等意图。
- **对象 Grounding**：使用颜色、区域、左右、旁边、当前选中对象等线索定位目标。
- **歧义澄清**：当“杯子”等指代不唯一时，先向用户确认。
- **安全确认**：药盒、老人、重物、门口等任务进入确认或接管。
- **路线与执行可视化**：展示机器人移动、物体跟随、路线 overlay 和执行时间线。
- **执行中变化处理**：支持暂停、改目的地、换对象和异常恢复。
- **核心流程展示**：用四步流程条展示理解、定位、安全门和执行状态。
- **核心验收**：默认只展示 10 条主链路用例，证明语音理解、对象澄清、安全确认、执行改口和多轮补全稳定。

## Focused Project Structure

```text
D:\voice-to-action-agent
├── index.html                  # 主产品 Demo
├── intro.html                  # 聚焦版产品介绍页
├── test-plan.html              # 核心验收与回归页
├── server.py                   # 本地服务和运行日志接口
├── src
│   ├── app.js                  # 主 Demo 交互、执行、日志和状态
│   ├── agent-orchestrator.js   # Intent / Grounding / Safety / Planner / Evaluator
│   ├── styles.css              # 主 Demo 样式
│   ├── test-plan.js            # 验收用例回放
│   └── test-plan.css
├── data
│   ├── scenarios.json          # 场景、对象、目标点
│   ├── evaluation-set.json     # 核心任务验收
│   ├── interruption-evaluation-set.json
│   ├── voice-feedback-evaluation-set.json
│   ├── route-evaluation-set.json
│   └── advanced-interaction-evaluation-set.json
└── docs
    ├── PRD.md
    ├── architecture.md
    ├── metrics.md
    └── roadmap.md
```

## De-emphasized Materials

下面这些内容仍保留在仓库中，但不再作为主产品入口：

- 投递包、面试脚本、简历素材、视频脚本
- Portfolio Hub、Reviewer Brief、Delivery Kit
- Tool Calling Lab、LLM Integration Lab
- 图标/户型/场景历史选择页
- 大量历史版本说明和辅助文档

它们可以作为历史记录或补充材料，但后续优化不再围绕这些页面继续扩展。

归档索引：`docs/archive-index.md`

## Verification

常用本地校验：

```powershell
python -m py_compile server.py
python -m json.tool data\scenarios.json
python -m json.tool data\evaluation-set.json
```

如果需要跑脚本语法检查，Windows 上优先使用 bundled Node：

```powershell
C:\Users\ychen\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe --check src\app.js
C:\Users\ychen\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe --check src\agent-orchestrator.js
C:\Users\ychen\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe --check src\test-plan.js
```

## Next Product Direction

V11 之后的优化只围绕 Voice-to-Action 本体：

1. 继续强化语音输入、对象澄清、安全确认、执行反馈和异常恢复。
2. 把任务状态卡继续改成用户可理解的产品语言，而不是工程日志堆叠。
3. 继续把高级证据保持为按需展开，避免默认界面回到功能堆叠。
4. 将额外材料归档，不再继续横向扩展页面。
