(() => {
  const state = {
    cases: [],
    world: null,
    activeCase: null,
    latestResult: null,
    batchResults: []
  };

  const els = {
    toolSpecGrid: document.getElementById("toolSpecGrid"),
    caseList: document.getElementById("caseList"),
    activeCaseId: document.getElementById("activeCaseId"),
    activeCaseTitle: document.getElementById("activeCaseTitle"),
    activeCaseScenario: document.getElementById("activeCaseScenario"),
    caseStatusPill: document.getElementById("caseStatusPill"),
    commandInput: document.getElementById("commandInput"),
    runCaseButton: document.getElementById("runCaseButton"),
    resetCaseButton: document.getElementById("resetCaseButton"),
    runAllButton: document.getElementById("runAllButton"),
    summaryPanel: document.getElementById("summaryPanel"),
    toolTrace: document.getElementById("toolTrace"),
    batchResult: document.getElementById("batchResult")
  };

  init();

  async function init() {
    bindEvents();
    renderToolSpecs();
    try {
      const [scenarioRes, evalRes] = await Promise.all([
        fetch("data/scenarios.json"),
        fetch("data/tool-calling-evaluation-set.json")
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

  function renderToolSpecs() {
    const specs = window.VoiceToActionToolCalling ? window.VoiceToActionToolCalling.TOOL_SPECS : [];
    els.toolSpecGrid.innerHTML = specs.map((tool, index) => `
      <article class="tool-card">
        <span>${index + 1}</span>
        <strong>${escapeHtml(tool.name)}</strong>
        <p>${escapeHtml(tool.purpose)}</p>
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
    els.summaryPanel.innerHTML = `
      <article class="eval-result-card">
        <strong>Instruction</strong>
        <p>等待运行。</p>
      </article>
      <article class="eval-result-card">
        <strong>Gate</strong>
        <p>等待运行。</p>
      </article>
      <article class="eval-result-card">
        <strong>Evaluation</strong>
        <p>等待运行。</p>
      </article>
    `;
    els.toolTrace.innerHTML = "";
  }

  function runActiveCase() {
    const caseItem = state.activeCase;
    if (!caseItem || !state.world || !window.VoiceToActionToolCalling) return;

    const command = els.commandInput.value.trim();
    const expected = { ...caseItem, command };
    const result = window.VoiceToActionToolCalling.runToolCallingPlan(command, state.world, { expected });
    state.latestResult = result;
    renderResult(result);
  }

  function runAllCases() {
    if (!state.world || !window.VoiceToActionToolCalling) return;
    state.batchResults = window.VoiceToActionToolCalling.runToolCallingEvaluation(state.cases, state.world);
    renderBatchResults();
  }

  function renderResult(result) {
    const passed = result.evaluation.passed;
    els.caseStatusPill.textContent = passed ? "PASS" : "WATCH";
    els.caseStatusPill.className = passed ? "pill safe" : "pill risk";

    els.summaryPanel.innerHTML = `
      <article class="eval-result-card ${result.instruction.type === "task" ? "pass" : "watch"}">
        <strong>Instruction</strong>
        <p>${escapeHtml(result.instruction.type)} · confidence ${formatNumber(result.instruction.confidence)}</p>
        <p>${escapeHtml(result.instruction.reasons.join(" / "))}</p>
      </article>
      <article class="eval-result-card ${result.gate.mode === "execute" ? "pass" : "watch"}">
        <strong>Gate</strong>
        <p>${escapeHtml(result.gate.mode)}</p>
        <p>${escapeHtml(result.gate.reason)}</p>
      </article>
      <article class="eval-result-card ${passed ? "pass" : "watch"}">
        <strong>Evaluation</strong>
        <p>${passed ? "工具调用链通过当前用例。" : "存在需要复盘的工具输出。"}</p>
        <ul class="check-list">
          ${result.evaluation.checks.map((check) => `
            <li class="${check.pass ? "pass" : "watch"}">${escapeHtml(check.name)}：${formatValue(check.actual)} / ${formatValue(check.expected)}</li>
          `).join("")}
        </ul>
      </article>
    `;

    els.toolTrace.innerHTML = result.toolCalls.map((call, index) => `
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
        <p>批量用例覆盖普通递送、歧义澄清、高风险确认、绕行路线、误触发阻止和自主导航。</p>
        <p>这些结果证明工具接口在接真实 LLM 前已经有验收边界。</p>
      </article>
      ${state.batchResults.map((item) => `
        <article class="runbook-step">
          <strong>${item.passed ? "PASS" : "WATCH"} · ${escapeHtml(item.label)}</strong>
          <p>${escapeHtml(item.command)}<br>gate=${escapeHtml(item.gateMode)} · instruction=${escapeHtml(item.instructionType)} · tools=${item.toolCallCount}</p>
          <p>${escapeHtml(item.pmNote)}</p>
        </article>
      `).join("")}
    `;
  }

  function formatNumber(value) {
    return typeof value === "number" ? value.toFixed(2) : "-";
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
