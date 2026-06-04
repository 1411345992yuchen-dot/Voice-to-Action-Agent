# GitHub Publish Checklist

## Repository

- Repo URL: `https://github.com/1411345992yuchen-dot/Voice-to-Action-Agent.git`
- Main branch: `main`
- Local root: `D:\voice-to-action-agent`

## Before Push

1. Run syntax checks:

```powershell
node --check D:\voice-to-action-agent\src\app.js
node --check D:\voice-to-action-agent\src\agent-orchestrator.js
node --check D:\voice-to-action-agent\src\test-plan.js
node --check D:\voice-to-action-agent\src\real-voice-eval.js
node --check D:\voice-to-action-agent\src\llm-integration-bridge.js
node --check D:\voice-to-action-agent\src\llm-integration-lab.js
python -m json.tool D:\voice-to-action-agent\data\real-voice-evaluation-set.json
python -m json.tool D:\voice-to-action-agent\data\llm-integration-evaluation-set.json
python -m py_compile D:\voice-to-action-agent\server.py
```

2. Start the local app:

```powershell
cd D:\voice-to-action-agent
python server.py
```

3. Open these pages:

```text
http://localhost:8765/portfolio-hub.html
http://localhost:8765/portfolio-brief.html
http://localhost:8765/
http://localhost:8765/real-voice-eval.html
http://localhost:8765/tool-calling-lab.html
http://localhost:8765/llm-integration-lab.html
http://localhost:8765/test-plan.html
http://localhost:8765/project-health.html
```

4. Confirm README screenshots render:

```text
docs/screenshots/portfolio-hub.png
docs/screenshots/portfolio-brief.png
docs/screenshots/main-demo-eval.png
docs/screenshots/interview-demo.png
docs/screenshots/real-voice-eval.png
docs/screenshots/tool-calling-lab.png
docs/screenshots/llm-integration-lab.png
docs/screenshots/agent-architecture.png
```

## Commit

Suggested commit message:

```text
Add GitHub showcase and real voice evaluation
```

## Reviewer Path

When sharing the project, recommend this reading order:

1. README cover and screenshots.
2. Portfolio Hub.
3. One-page Portfolio Brief.
4. Reviewer Brief.
5. Interview Demo.
6. Real Voice Evaluation.
7. Tool Calling Lab.
8. LLM Integration Lab.
9. Agent Architecture.
10. Test Plan.

## Positioning

Use this sentence when introducing the repository:

> A local Voice-to-Action Agent prototype that turns natural-language voice or text commands into safe, explainable, and evaluable physical-world task flows for home-service robot scenarios.
