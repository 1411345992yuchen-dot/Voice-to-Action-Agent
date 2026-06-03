# LLM Tool Calling Prototype

## Purpose

V9.2 adds a local LLM Tool Calling prototype for Voice-to-Action Agent.

This is not a live external LLM integration yet. It is a product and architecture bridge:

```text
user command -> mock LLM planner -> tool calls -> existing Agent modules -> execution gate -> evaluation
```

The reason for doing this before connecting a real model is to lock down stable tool contracts, safety gates, and evaluation criteria. A real LLM can later replace the mock planner without rewriting the embodied-task product logic.

## Page

```text
http://localhost:8765/tool-calling-lab.html
```

## Files

```text
src/tool-calling-prototype.js
src/tool-calling-lab.js
data/tool-calling-evaluation-set.json
```

## Tool Contract

| Tool | Product Role |
|---|---|
| `classify_user_instruction` | Stop small talk, negation, or noise from triggering physical actions |
| `parse_task_intent` | Convert user language into task type |
| `ground_scene_reference` | Bind language references to object and destination IDs |
| `assess_safety_gate` | Preserve safety confirmation for high-risk tasks |
| `plan_physical_route` | Keep route preference and spatial constraints explicit |
| `decide_execution_gate` | Choose execute, clarify, confirm, or block |
| `evaluate_tool_trace` | Make the tool chain reviewable and testable |

## Evaluation Coverage

The first V9.2 evaluation set covers six cases:

1. Low-risk red cup delivery.
2. Ambiguous cup command that must clarify.
3. High-risk medicine delivery that must confirm.
4. Heavy box route with chair avoidance.
5. Kitchen small talk that must be blocked.
6. Objectless robot navigation to the living room.

## Interview Talk Track

I did not simply say "connect an LLM." I first defined tool boundaries. The LLM should only decide which tools to call and how to sequence them; physical execution still has to pass grounding, safety, route planning, and execution gates. This makes the prototype closer to a production Agent product architecture instead of a prompt-only demo.

## Next Step

V9.3 can turn this into an exportable one-page portfolio brief. A later V10 can replace the mock planner with a real LLM function-calling backend while keeping the same evaluation cases.
