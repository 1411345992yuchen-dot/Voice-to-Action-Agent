# Real Voice Evaluation

## Purpose

V9.1 adds a real-voice evaluation console for Voice-to-Action Agent.

The goal is not to prove that the browser ASR is perfect. The goal is to evaluate the product chain after speech enters the system:

- ASR transcript and confidence.
- Manual review or correction before execution.
- False-trigger blocking for non-task speech.
- Semantic clarification for ambiguous commands.
- Safety confirmation for high-risk physical tasks.
- Agent parsing result after the confirmed transcript is submitted.

## Page

```text
http://localhost:8765/real-voice-eval.html
```

## Data

```text
data/real-voice-evaluation-set.json
```

The first evaluation set covers six scenarios:

| Case | Product Risk | Expected Product Behavior |
|---|---|---|
| Clear daily delivery | Normal low-risk command | Parse and execute after transcript confirmation |
| Ambiguous cup command | Object reference ambiguity | Ask for clarification instead of executing directly |
| Misrecognized cup | ASR noun error | Enter review, allow manual correction, then execute |
| Medicine to elder | High-risk care task | Keep safety confirmation even when ASR is clear |
| Kitchen small talk | False trigger | Block physical execution |
| Move to living room | Objectless navigation | Navigate the robot without asking what to move |

## Metrics

- Recognition confidence.
- Text similarity against the expected command.
- Review required count.
- False-trigger blocked count.
- Agent parsing pass rate after transcript confirmation.
- Correction cost, currently represented by whether the user needs to use the recommended correction.

## Interview Talk Track

I did not connect voice input directly to robot execution. I added a review and evaluation layer between ASR and the Agent task flow. This is important in embodied interaction because a speech recognition error can become a real physical action. The V9.1 page shows how confidence, transcript similarity, false-trigger detection, semantic ambiguity, and safety confirmation jointly decide whether a command should execute.

## Next Step

V9.2 can connect the same evaluation interface to LLM tool calling. The stable contract should remain:

```text
confirmed transcript -> intent / grounding / safety / planner tool calls -> execution plan
```
