# GitHub README Draft

## Voice-to-Action Agent

Voice-to-Action Agent is a local portfolio prototype for embodied intelligence interaction. It converts natural-language voice or text commands into executable robot task flows, covering intent parsing, object grounding, safety confirmation, route planning, execution interruption, recovery, and evaluation.

![Portfolio Hub](screenshots/portfolio-hub.png)

![One-page Portfolio Brief](screenshots/portfolio-brief.png)

![Main Demo](screenshots/main-demo-eval.png)

![Real Voice Evaluation](screenshots/real-voice-eval.png)

![Tool Calling Lab](screenshots/tool-calling-lab.png)

## Why It Matters

The project is designed for Agent PM, voice interaction PM, and embodied-intelligence PM interviews. It demonstrates how a vague user instruction can become a reliable, observable, and testable physical-world task flow instead of a simple chat response.

## Key Capabilities

- Multi-agent task orchestration: Intent, Grounding, Safety, Planner, Execution / Interruption, Evaluator.
- Home-service robot task scene with kitchen, living room, entry, elder seat, objects, routes, and task states.
- Voice interaction design: recognition confirmation, short-answer slot filling, false-trigger control, safety prompts, and feedback scripts.
- Execution reliability: route preview, route scoring, interruption handling, recovery flows, human handoff.
- Product evidence: PRD, roadmap, metrics, version history, test plan, role positioning, interview scripts, and portfolio hub.
- Real voice evaluation: browser ASR transcript, confidence, manual correction, false-trigger blocking, and Agent parsing after transcript confirmation.
- LLM Tool Calling prototype: mock LLM planner, stable tool contracts, trace UI, and evaluation cases before a live model is connected.

## Screenshots

| Portfolio Hub | One-page Brief |
|---|---|
| ![Portfolio Hub](screenshots/portfolio-hub.png) | ![One-page Brief](screenshots/portfolio-brief.png) |

| Main Demo | Interview Demo |
|---|---|
| ![Main Demo](screenshots/main-demo-eval.png) | ![Interview Demo](screenshots/interview-demo.png) |

| Real Voice Evaluation | Tool Calling Lab |
|---|---|
| ![Real Voice Evaluation](screenshots/real-voice-eval.png) | ![Tool Calling Lab](screenshots/tool-calling-lab.png) |

## Local Run

```powershell
cd D:\voice-to-action-agent
python server.py
```

Open:

```text
http://localhost:8765/portfolio-hub.html
```

One-page portfolio brief:

```text
http://localhost:8765/portfolio-brief.html
```

Real voice evaluation:

```text
http://localhost:8765/real-voice-eval.html
```

LLM Tool Calling prototype:

```text
http://localhost:8765/tool-calling-lab.html
```

## Recommended Demo Path

1. Portfolio Hub
2. One-page Portfolio Brief
3. Delivery Kit
4. Interview Demo
5. Main Demo
6. Real Voice Evaluation
7. Tool Calling Lab
8. Agent Architecture
9. Evidence Dashboard
10. Test Plan

## Evaluation Assets

- `data/evaluation-set.json`: baseline command grounding and execution cases.
- `data/interruption-evaluation-set.json`: mid-execution interruption cases.
- `data/voice-feedback-evaluation-set.json`: feedback and spoken prompt cases.
- `data/route-evaluation-set.json`: route report and route scoring cases.
- `data/real-voice-evaluation-set.json`: ASR transcript, confidence, correction, false-trigger, and voice-to-Agent cases.
- `data/tool-calling-evaluation-set.json`: tool contract, gate mode, route mode, and no-execution cases for the mock LLM planner.

## Portfolio Positioning

This project connects my Huawei AI workflow engineering experience with a future Agent / voice interaction / embodied-intelligence product management direction. The shared capability is turning vague human intent into executable, explainable, and evaluable task workflows.
