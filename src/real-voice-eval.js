(() => {
  const STORAGE_KEY = "voiceToActionAgent.realVoiceEval.v1";

  const state = {
    cases: [],
    world: null,
    activeCase: null,
    results: loadSavedResults(),
    recognition: null
  };

  const els = {
    summaryCards: document.getElementById("summaryCards"),
    caseList: document.getElementById("caseList"),
    activeCaseId: document.getElementById("activeCaseId"),
    activeCaseTitle: document.getElementById("activeCaseTitle"),
    activeCaseScenario: document.getElementById("activeCaseScenario"),
    transcriptInput: document.getElementById("transcriptInput"),
    confidenceInput: document.getElementById("confidenceInput"),
    confidenceValue: document.getElementById("confidenceValue"),
    evaluateButton: document.getElementById("evaluateButton"),
    sampleButton: document.getElementById("sampleButton"),
    correctionButton: document.getElementById("correctionButton"),
    speechButton: document.getElementById("speechButton"),
    speechSupportPill: document.getElementById("speechSupportPill"),
    resultPanel: document.getElementById("resultPanel"),
    voiceEvalLog: document.getElementById("voiceEvalLog"),
    clearLogButton: document.getElementById("clearLogButton")
  };

  init();

  async function init() {
    bindEvents();
    setupSpeechRecognition();

    try {
      const [scenarioRes, evalRes] = await Promise.all([
        fetch("data/scenarios.json"),
        fetch("data/real-voice-evaluation-set.json")
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
      renderAll();
    } catch (error) {
      els.caseList.innerHTML = `<article class="eval-case"><strong>加载失败</strong><p>${escapeHtml(error.message)}</p></article>`;
    }
  }

  function bindEvents() {
    els.confidenceInput.addEventListener("input", () => {
      els.confidenceValue.textContent = Number(els.confidenceInput.value).toFixed(2);
    });
    els.evaluateButton.addEventListener("click", evaluateActiveCase);
    els.sampleButton.addEventListener("click", useSampleTranscript);
    els.correctionButton.addEventListener("click", useCorrectionTranscript);
    els.speechButton.addEventListener("click", startSpeechRecognition);
    els.clearLogButton.addEventListener("click", () => {
      state.results = [];
      saveResults();
      renderSummary();
      renderLog();
    });
  }

  function setupSpeechRecognition() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      els.speechSupportPill.textContent = "当前浏览器不支持 Web Speech";
      els.speechSupportPill.className = "pill risk";
      els.speechButton.disabled = true;
      return;
    }

    const recognition = new Recognition();
    recognition.lang = "zh-CN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => {
      els.speechSupportPill.textContent = "正在听取";
      els.speechSupportPill.className = "pill safe";
    };
    recognition.onerror = (event) => {
      els.speechSupportPill.textContent = `识别失败：${event.error}`;
      els.speechSupportPill.className = "pill risk";
    };
    recognition.onend = () => {
      if (els.speechSupportPill.textContent === "正在听取") {
        els.speechSupportPill.textContent = "可使用麦克风";
        els.speechSupportPill.className = "pill safe";
      }
    };
    recognition.onresult = (event) => {
      const item = event.results[0][0];
      els.transcriptInput.value = item.transcript || "";
      if (typeof item.confidence === "number" && item.confidence > 0) {
        els.confidenceInput.value = String(item.confidence);
        els.confidenceValue.textContent = item.confidence.toFixed(2);
      }
      els.speechSupportPill.textContent = "识别结果待确认";
      els.speechSupportPill.className = "pill";
    };

    state.recognition = recognition;
    els.speechSupportPill.textContent = "可使用麦克风";
    els.speechSupportPill.className = "pill safe";
  }

  function renderAll() {
    renderCases();
    renderActiveCase();
    renderSummary();
    renderLog();
  }

  function renderCases() {
    els.caseList.innerHTML = state.cases.map((caseItem) => {
      const active = state.activeCase && state.activeCase.id === caseItem.id ? " active" : "";
      return `
        <button type="button" class="eval-case${active}" data-case-id="${caseItem.id}">
          <strong>${escapeHtml(caseItem.label)}</strong>
          <span>${escapeHtml(caseItem.scenario)}</span>
          <small>${escapeHtml(caseItem.pmNote)}</small>
        </button>
      `;
    }).join("");

    els.caseList.querySelectorAll("[data-case-id]").forEach((button) => {
      button.addEventListener("click", () => {
        state.activeCase = state.cases.find((item) => item.id === button.dataset.caseId) || null;
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
    els.activeCaseScenario.textContent = `${caseItem.scenario} 推荐讲法：${caseItem.pmNote}`;
    useSampleTranscript();
    renderResultPlaceholder();
  }

  function renderSummary() {
    const totalCases = state.cases.length;
    const totalRuns = state.results.length;
    const latestRuns = getLatestRunsByCase();
    const passedRuns = latestRuns.filter((item) => item.overallPassed).length;
    const reviewRuns = latestRuns.filter((item) => item.reviewRequired).length;
    const falseTriggerBlocked = latestRuns.filter((item) => item.expectedNoExecution && item.gatePassed).length;
    const passRate = latestRuns.length ? Math.round((passedRuns / latestRuns.length) * 100) : 0;

    els.summaryCards.innerHTML = `
      <article class="score-card">
        <span class="score-value">${totalCases}</span>
        <strong>语音用例</strong>
        <p>覆盖清晰执行、歧义、误识别、高风险、误触发和导航。</p>
      </article>
      <article class="score-card">
        <span class="score-value">${passRate}%</span>
        <strong>最近通过率</strong>
        <p>按每个用例最近一次评估统计，未运行时为 0。</p>
      </article>
      <article class="score-card">
        <span class="score-value">${reviewRuns}</span>
        <strong>触发确认</strong>
        <p>低置信、歧义或非任务语音进入人工确认/阻止。</p>
      </article>
      <article class="score-card">
        <span class="score-value">${falseTriggerBlocked}</span>
        <strong>误触发阻止</strong>
        <p>闲聊或非明确任务没有进入物理执行。</p>
      </article>
    `;
  }

  function renderResultPlaceholder() {
    els.resultPanel.innerHTML = `
      <article class="eval-result-card">
        <strong>ASR 层</strong>
        <p>模拟识别文本已填入。你可以修改文本或使用麦克风。</p>
      </article>
      <article class="eval-result-card">
        <strong>门控层</strong>
        <p>点击“评估当前文本”后判断是否需要确认、澄清或阻止执行。</p>
      </article>
      <article class="eval-result-card">
        <strong>Agent 层</strong>
        <p>确认后的文本会进入现有 Intent / Grounding / Safety 编排。</p>
      </article>
    `;
  }

  function renderLog() {
    if (!state.results.length) {
      els.voiceEvalLog.innerHTML = `
        <article class="runbook-step">
          <strong>暂无记录</strong>
          <p>每次评估会记录识别文本、是否进入确认、Agent 解析是否通过。</p>
          <p>用于面试时说明你如何设计语音交互指标。</p>
        </article>
      `;
      return;
    }

    els.voiceEvalLog.innerHTML = state.results.slice(0, 8).map((item) => `
      <article class="runbook-step">
        <strong>${item.overallPassed ? "PASS" : "WATCH"} · ${escapeHtml(item.label)}</strong>
        <p>${escapeHtml(item.transcript)}<br>置信度 ${item.confidence.toFixed(2)} · 相似度 ${item.similarity.toFixed(2)} · ${item.reviewRequired ? "进入确认/阻止" : "可进入解析"}</p>
        <p>${escapeHtml(item.summary)}</p>
      </article>
    `).join("");
  }

  function useSampleTranscript() {
    const caseItem = state.activeCase;
    if (!caseItem) return;
    els.transcriptInput.value = caseItem.sampleTranscript || caseItem.expectedCommand || "";
    els.confidenceInput.value = String(caseItem.sampleConfidence || 0.8);
    els.confidenceValue.textContent = Number(els.confidenceInput.value).toFixed(2);
  }

  function useCorrectionTranscript() {
    const caseItem = state.activeCase;
    if (!caseItem) return;
    els.transcriptInput.value = caseItem.correctedCommand || caseItem.expectedCommand || caseItem.sampleTranscript || "";
    els.confidenceInput.value = String(Math.max(Number(caseItem.sampleConfidence || 0.8), 0.86));
    els.confidenceValue.textContent = Number(els.confidenceInput.value).toFixed(2);
  }

  function startSpeechRecognition() {
    if (!state.recognition) return;
    try {
      state.recognition.start();
    } catch (error) {
      els.speechSupportPill.textContent = "语音识别已在运行";
      els.speechSupportPill.className = "pill";
    }
  }

  function evaluateActiveCase() {
    const caseItem = state.activeCase;
    const transcript = els.transcriptInput.value.trim();
    const confidence = Number(els.confidenceInput.value);
    if (!caseItem || !transcript) return;

    const result = evaluateCase(caseItem, transcript, confidence);
    state.results.unshift(result);
    saveResults();
    renderResult(result);
    renderSummary();
    renderLog();
  }

  function evaluateCase(caseItem, transcript, confidence) {
    const similarity = stringSimilarity(transcript, caseItem.expectedCommand || "");
    const lowConfidence = confidence < Number(caseItem.minConfidence || 0.78);
    const lowSimilarity = similarity < Number(caseItem.minSimilarity || 0.82);
    const taskLike = isTaskLike(transcript);
    const semanticReview = caseItem.expectedClarification === true || caseItem.expectedConfirmation === true;
    const reviewRequired = lowConfidence || lowSimilarity || !taskLike || semanticReview || caseItem.expectedReviewRequired === true;
    const noExecutionGate = caseItem.expectedNoExecution === true && (!taskLike || /别动|不要|别执行|先别/.test(transcript));

    let agentResult = null;
    let taskChecks = [];
    let agentPassed = false;

    if (!caseItem.expectedNoExecution && window.VoiceToActionAgents && state.world) {
      agentResult = window.VoiceToActionAgents.orchestrate(transcript, state.world, { evaluationMode: true });
      taskChecks = buildTaskChecks(caseItem, agentResult);
      agentPassed = taskChecks.every((check) => check.pass);
    }

    const asrPassed = !lowConfidence && !lowSimilarity;
    const gatePassed = caseItem.expectedNoExecution ? noExecutionGate : (caseItem.expectedReviewRequired ? reviewRequired : true);
    const overallPassed = Boolean(asrPassed || reviewRequired) && gatePassed && (caseItem.expectedNoExecution || agentPassed);

    return {
      id: `${caseItem.id}-${Date.now()}`,
      caseId: caseItem.id,
      label: caseItem.label,
      transcript,
      expectedCommand: caseItem.expectedCommand,
      confidence,
      similarity,
      lowConfidence,
      lowSimilarity,
      taskLike,
      reviewRequired,
      expectedNoExecution: Boolean(caseItem.expectedNoExecution),
      noExecutionGate,
      asrPassed,
      gatePassed,
      agentPassed,
      overallPassed,
      taskChecks,
      agentTask: agentResult ? agentResult.task : null,
      summary: buildSummary(caseItem, {
        lowConfidence,
        lowSimilarity,
        reviewRequired,
        noExecutionGate,
        agentPassed,
        taskChecks
      })
    };
  }

  function buildTaskChecks(caseItem, agentResult) {
    const task = agentResult.task || {};
    const checks = [
      check("intent", task.intent, caseItem.expectedIntent),
      check("object", task.objectId, caseItem.expectedObjectId),
      check("destination", task.destinationId, caseItem.expectedDestinationId),
      check("risk", task.riskLevel, caseItem.expectedRisk),
      check("clarification", agentResult.needClarification, caseItem.expectedClarification),
      check("confirmation", agentResult.needConfirmation, caseItem.expectedConfirmation)
    ];
    return checks.filter((item) => item.expected !== undefined);
  }

  function renderResult(result) {
    const checkList = result.taskChecks.length
      ? result.taskChecks.map((item) => `<li class="${item.pass ? "pass" : "watch"}">${escapeHtml(item.name)}：${formatValue(item.actual)} / 预期 ${formatValue(item.expected)}</li>`).join("")
      : "<li>该用例预期不进入 Agent 执行。</li>";

    const agentTask = result.agentTask
      ? `${result.agentTask.intent} · ${result.agentTask.object || "无物体"} -> ${result.agentTask.destination}`
      : "未执行";

    els.resultPanel.innerHTML = `
      <article class="eval-result-card ${result.asrPassed ? "pass" : "watch"}">
        <strong>ASR 层</strong>
        <p>置信度 ${result.confidence.toFixed(2)}，文本相似度 ${result.similarity.toFixed(2)}。</p>
        <div class="confidence-meter"><span style="width:${Math.round(result.confidence * 100)}%"></span></div>
        <p>${result.lowConfidence || result.lowSimilarity ? "建议进入人工确认或修正。" : "识别质量满足直接解析门槛。"}</p>
      </article>
      <article class="eval-result-card ${result.gatePassed ? "pass" : "watch"}">
        <strong>门控层</strong>
        <p>${result.reviewRequired ? "进入确认/澄清/阻止路径。" : "可进入 Agent 解析。"}</p>
        <p>${result.expectedNoExecution ? (result.noExecutionGate ? "非明确任务已阻止执行。" : "需要阻止误触发。") : "物理执行前保留语义和安全门控。"}</p>
      </article>
      <article class="eval-result-card ${result.agentPassed || result.expectedNoExecution ? "pass" : "watch"}">
        <strong>Agent 层</strong>
        <p>${escapeHtml(agentTask)}</p>
        <ul class="check-list">${checkList}</ul>
      </article>
    `;
  }

  function buildSummary(caseItem, result) {
    if (caseItem.expectedNoExecution) {
      return result.noExecutionGate
        ? "非任务语音被阻止，没有进入物理执行。"
        : "需要加强误触发识别，避免地点词触发行动。";
    }
    if (result.lowConfidence || result.lowSimilarity) {
      return "识别层建议先确认或人工修正，再进入 Agent 解析。";
    }
    if (caseItem.expectedConfirmation) return "高风险任务识别清楚，但仍需安全确认。";
    if (caseItem.expectedClarification) return "语音文本清楚，但语义对象存在歧义，需要澄清。";
    return result.agentPassed ? "识别文本成功进入 Agent 任务链路。" : "识别通过，但 Agent 解析结果仍需复盘。";
  }

  function getLatestRunsByCase() {
    const seen = new Set();
    const latest = [];
    state.results.forEach((item) => {
      if (seen.has(item.caseId)) return;
      seen.add(item.caseId);
      latest.push(item);
    });
    return latest;
  }

  function isTaskLike(text) {
    if (/别动|不要动|先别|不用|取消|闲聊|有点吵/.test(text)) return false;
    return /把|拿|递|搬|放|移动|走到|前往|去|检查|看看|送/.test(text);
  }

  function stringSimilarity(left, right) {
    const a = normalize(left);
    const b = normalize(right);
    if (!a && !b) return 1;
    if (!a || !b) return 0;
    const distance = levenshtein(a, b);
    return Math.max(0, 1 - distance / Math.max(a.length, b.length));
  }

  function normalize(value) {
    return String(value || "").replace(/[，。！？、\s]/g, "").toLowerCase();
  }

  function levenshtein(a, b) {
    const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
    for (let i = 0; i <= a.length; i += 1) matrix[i][0] = i;
    for (let j = 0; j <= b.length; j += 1) matrix[0][j] = j;
    for (let i = 1; i <= a.length; i += 1) {
      for (let j = 1; j <= b.length; j += 1) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }
    return matrix[a.length][b.length];
  }

  function check(name, actual, expected) {
    return {
      name,
      actual,
      expected,
      pass: actual === expected
    };
  }

  function formatValue(value) {
    if (value === null) return "null";
    if (value === undefined) return "undefined";
    return escapeHtml(String(value));
  }

  function loadSavedResults() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch (error) {
      return [];
    }
  }

  function saveResults() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.results.slice(0, 30)));
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
