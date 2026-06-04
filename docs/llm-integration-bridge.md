# LLM Integration Bridge

## Purpose

V10 turns the V9.2 Tool Calling prototype into a proxy-ready integration bridge. The goal is not to call a live model from the browser, but to show how a production Agent product should connect a real LLM without breaking grounding, safety, route planning, and execution gates.

## Product Position

For embodied-intelligence interaction, a live LLM is useful for language understanding and tool selection, but it should not directly control physical actions. Voice-to-Action Agent therefore uses this boundary:

1. The browser sends only the user command, world snapshot, tool schemas, and guardrails.
2. The server-side proxy owns provider credentials and model calls.
3. The model can propose tool calls, but final execution still requires `decide_execution_gate`.
4. If the proxy is unavailable, the request is malformed, or the model output cannot be trusted, the deterministic local Agent chain takes over.

## New Files

```text
llm-integration-lab.html
src/llm-integration-bridge.js
src/llm-integration-lab.js
data/llm-integration-evaluation-set.json
docs/llm-integration-bridge.md
server.py
```

## Backend Proxy Contract

The local server now exposes:

```text
POST /api/llm-tool-plan
```

Current behavior is intentionally dry-run only:

- validates whether the request includes `command`, `toolSpecs`, and `worldSnapshot`
- reports whether `OPENAI_API_KEY` is present on the server without exposing its value
- returns the allowed tool policy and blocked direct actions
- marks the live LLM call as not executed
- requires local fallback

This lets the portfolio demonstrate the production boundary without requiring a live API key.

## Frontend Bridge

`src/llm-integration-bridge.js` builds a request with:

- user command
- model policy
- compact world snapshot
- tool schemas derived from V9.2 Tool Calling specs
- required final gate
- guardrails
- trace request options

It then calls the local proxy and runs `VoiceToActionToolCalling.runToolCallingPlan(...)` as the deterministic fallback.

## Evaluation Cases

`data/llm-integration-evaluation-set.json` covers six integration risks:

1. normal low-risk delivery
2. high-risk medicine delivery requiring confirmation
3. ambiguous object requiring clarification
4. false trigger blocking
5. missing world snapshot
6. proxy offline fallback

Each case checks:

- browser key hidden
- proxy key hidden
- request validation
- fallback requirement
- direct action blocking
- final gate presence
- local evaluation pass
- expected gate mode
- proxy status

## Interview Talk Track

The strongest way to explain V10:

> I did not treat LLM integration as "just call a model". For physical-world agents, the key product problem is controlling the boundary between language reasoning and action execution. V10 shows a server-side proxy, auditable tool schemas, a final execution gate, and deterministic fallback, so a real model can be added without bypassing grounding or safety.

## Next Step

The next logical step is to replace the dry-run proxy with a real server-side model call, store traces, and compare model-proposed tool calls against the deterministic local chain.
