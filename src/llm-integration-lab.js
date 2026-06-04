(() => {
  const state = {
    cases: [],
    world: null,
    activeCase: null,
    latestResult: null,
    batchResults: []
  };

  const els = {
    guardrailGrid: document.getElementById("guardrailGrid"),
    caseList: document.getElementById("caseList"),
    activeCaseId: document.getElementById("activeCaseId"),
    activeCaseTitle: document.getElementById("activeCaseTitle"),
    activeCaseScenario: document.getElementById("activeCaseScenario"),
    commandInput: document.getElementById("commandInput"),
    runCaseButton: document.getElementById("runCaseButton"),
    resetCaseButton: document.getElementById("resetCaseButton"),
    runAllButton: document.getElementById("runAllButton"),
    caseStatusPill: document.getElementById("caseStatusPill"),
    readinessPanel: document.getElementById("readinessPanel"),
    requestJson: document.getElementById("requestJson"),
    proxyJson: document.getElementById("proxyJson"),
    localTrace: document.getElementById("localTrace"),
    batchResult: document.getElementById("batchResult")
  };

  init();

  async function init() {
    bindEvents();
    renderGuardrails();
    try {
      const [scenarioRes, evalRes] = await Promise.all([
        fetch("data/scenarios.json"),
        fetch("data/llm-integration-evaluation-set.json")
      ]);
      const scenarioData = await scenarioRes.json();
      const evalData = await evalRes.json();
      state.world = {
        objects: scenarioData.objects,
        destinations: scenarioData.destinations,
        selectedObjectId: null
      };
      state.cases = evalData.cases || [];
      state.activeCase = state.cases[0] || null;
      renderCases();
      renderActiveCase();
    } catch (error) {
      els.caseList.innerHTML = `<article class="eval-case"><strong>加载失败</strong><span>${escapeHtml(error.message)}</span></article>`;
    }
  }

  function bindEvents() {
    els.runCaseButton.addEventListener("click", runActiveCase);
    els.resetCaseButton.addEventListener("click", renderActiveCase);
    els.runAllButton.addEventListener("click", runAllCases);
  }

  function renderGuardrails() {
    const guardrails = window.VoiceToActionLLMBridge
      ? window.VoiceToActionLLMBridge.INTEGRATION_GUARDRAILS
      : [];
    els.guardrailGrid.innerHTML = guardrails.map((item, index) => `
      <article class="tool-card">
        <span>${index + 1}</span>
        <strong>${escapeHtml(item.name)}</strong>
        <p>${escapeHtml(item.reason)}</p>
      </article>
    `).join("");
  }

  function renderCases() {
    els.caseList.innerHTML = state.cases.map((caseItem) => {
      const active = state.activeCase && state.activeCase.id === caseItem.id ? " active" : "";
      return `
        <button type="button" class="eval-case${active}" data-case-id="${caseItem.id}">
          <strong>${escapeHtml(caseItem.label)}</strong>
          <span>${escapeHtml(caseItem.command)}</span>
          <small>${escapeHtml(caseItem.pmNote)}</small>
        </button>
      `;
    }).join("");

    els.caseList.querySelectorAll("[data-case-id]").forEach((button) => {
      button.addEventListener("click", () => {
        state.activeCase = state.cases.find((item) => item.id === button.dataset.caseId) || null;
        state.latestResult = null;
        renderCases();
        renderActiveCase();
      });
    });
  }

  function renderActiveCase() {
    const caseItem = state.activeCase;
    if (!caseItem) return;
    els.activeCaseId.textContent = caseItem.id;
    els.activeCaseTitle.textContent = caseItem.label;
    els.activeCaseScenario.textContent = `${caseItem.pmNote} 预期门控：${caseItem.expectedGateMode}`;
    els.commandInput.value = caseItem.command;
    els.caseStatusPill.textContent = "等待运行";
    els.caseStatusPill.className = "pill";
    els.readinessPanel.innerHTML = placeholderCards();
    els.requestJson.textContent = "等待运行。";
    els.proxyJson.textContent = "等待运行。";
    els.localTrace.innerHTML = "";
  }

  async function runActiveCase() {
    const caseItem = state.activeCase;
    if (!caseItem || !state.world || !window.VoiceToActionLLMBridge) return;
    els.caseStatusPill.textContent = "运行中";
    els.caseStatusPill.className = "pill";
    const command = els.commandInput.value.trim();
    const expected = { ...caseItem, command };
    const result = await window.VoiceToActionLLMBridge.runIntegrationPlan(command, state.world, {
      expected,
      omitWorldSnapshot: caseItem.proxyFault === "missing_world_snapshot",
      forceProxyOffline: caseItem.proxyFault === "proxy_offline"
    });
    state.latestResult = result;
    renderResult(result);
  }

  async function runAllCases() {
    if (!state.world || !window.VoiceToActionLLMBridge) return;
    els.runAllButton.disabled = true;
    els.runAllButton.textContent = "运行中...";
    state.batchResults = await window.VoiceToActionLLMBridge.runIntegrationEvaluation(state.cases, state.world);
    renderBatchResults();
    els.runAllButton.disabled = false;
    els.runAllButton.textContent = "运行全部 V10 用例";
  }

  function renderResult(result) {
    const passed = result.checks.every((check) => check.pass);
    els.caseStatusPill.textContent = passed ? "PASS" : "WATCH";
    els.caseStatusPill.className = passed ? "pill safe" : "pill risk";
    els.readinessPanel.innerHTML = `
      <article class="eval-result-card ${passed ? "pass" : "watch"}">
        <strong>Readiness</strong>
        <p>${result.readiness.passed}/${result.readiness.total} · ${result.readiness.score}% · ${escapeHtml(result.readiness.label)}</p>
      </article>
      <article class="eval-result-card ${result.proxyResponse.requestValidation.passed ? "pass" : "watch"}">
        <strong>Proxy</strong>
        <p>${escapeHtml(result.proxyResponse.provider.status)} · validation=${result.proxyResponse.requestValidation.passed}</p>
      </article>
      <article class="eval-result-card ${result.localToolResult.evaluation.passed ? "pass" : "watch"}">
        <strong>Local Fallback</strong>
        <p>gate=${escapeHtml(result.localToolResult.gate.mode)} · tools=${result.localToolResult.toolCalls.length}</p>
      </article>
      <article class="eval-result-card">
        <strong>Checks</strong>
        <ul class="check-list">
          ${result.checks.map((check) => `
            <li class="${check.pass ? "pass" : "watch"}">${escapeHtml(check.name)}：${formatValue(check.actual)} / ${formatValue(check.expected)}</li>
          `).join("")}
        </ul>
      </article>
    `;
    els.requestJson.textContent = JSON.stringify(result.proxyRequest, null, 2);
    els.proxyJson.textContent = JSON.stringify(result.proxyResponse, null, 2);
    els.localTrace.innerHTML = result.localToolResult.toolCalls.map((call, index) => `
      <article class="tool-call-card">
        <div class="tool-call-head">
          <span>${index + 1}</span>
          <strong>${escapeHtml(call.name)}</strong>
          <em>${escapeHtml(call.status)}</em>
        </div>
        <div class="tool-json-grid">
          <div>
            <h4>Input</h4>
            <pre>${escapeHtml(JSON.stringify(call.input, null, 2))}</pre>
          </div>
          <div>
            <h4>Output</h4>
            <pre>${escapeHtml(JSON.stringify(call.output, null, 2))}</pre>
          </div>
        </div>
      </article>
    `).join("");
  }

  function renderBatchResults() {
    if (!state.batchResults.length) return;
    const passedCount = state.batchResults.filter((item) => item.passed).length;
    els.batchResult.innerHTML = `
      <article class="runbook-step">
        <strong>${passedCount}/${state.batchResults.length} 通过</strong>
        <p>覆盖低风险执行、高风险确认、歧义澄清、闲聊阻止、缺少世界状态和代理不可用六类接入风险。</p>
        <p>用于说明真实 LLM 接入不是替代安全链路，而是被工具契约和后端代理约束。</p>
      </article>
      ${state.batchResults.map((item) => `
        <article class="runbook-step">
          <strong>${item.passed ? "PASS" : "WATCH"} · ${escapeHtml(item.label)}</strong>
          <p>${escapeHtml(item.command)}<br>proxy=${escapeHtml(item.proxyStatus)} · fallback=${item.fallbackRequired} · gate=${escapeHtml(item.gateMode)}</p>
          <p>${escapeHtml(item.pmNote)}</p>
        </article>
      `).join("")}
    `;
  }

  function placeholderCards() {
    return `
      <article class="eval-result-card">
        <strong>Readiness</strong>
        <p>等待运行。</p>
      </article>
      <article class="eval-result-card">
        <strong>Proxy</strong>
        <p>等待运行。</p>
      </article>
      <article class="eval-result-card">
        <strong>Local Fallback</strong>
        <p>等待运行。</p>
      </article>
    `;
  }

  function formatValue(value) {
    if (value === null) return "null";
    if (value === undefined) return "undefined";
    return escapeHtml(String(value));
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
})();
