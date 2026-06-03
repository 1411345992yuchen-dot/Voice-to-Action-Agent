const fallbackScenario = {
  samples: [
    "把桌上的红色杯子拿到厨房台面",
    "先把红色杯子拿到厨房，再请你移动到客厅",
    "请你移动到客厅",
    "把右边那个杯子拿到厨房台面",
    "把老人旁边那个东西递给老人",
    "把这个拿到厨房台面",
    "把重箱子搬到门口",
    "把重箱子搬到门口，绕开椅子走",
    "帮我检查客厅有没有障碍物",
    "把药盒递给老人，但先确认是不是蓝色那个",
    "去门口看看快递到了没",
    "把左边那个箱子搬到门口，小心别撞到椅子"
  ],
  objects: [
    { id: "red_cup", name: "红色杯子", type: "cup", color: "red", zone: "桌上", semanticZone: "table", aliases: ["红色杯子", "红杯", "红色物体", "桌上红色物体"], x: 51, y: 46, risk: "low" },
    { id: "blue_cup", name: "蓝色杯子", type: "cup", color: "blue", zone: "桌上", semanticZone: "table", aliases: ["蓝色杯子", "蓝杯", "蓝色物体", "右边杯子"], x: 57, y: 46, risk: "low" },
    { id: "medicine_box", name: "药盒", type: "medicine", color: "red", zone: "边桌", semanticZone: "elder_side_table", aliases: ["药盒", "药", "老人旁边的东西", "边桌物品"], x: 78, y: 78, risk: "high" },
    { id: "parcel", name: "快递", type: "parcel", color: "blue", zone: "门口", semanticZone: "door", aliases: ["快递", "包裹", "门口包裹"], x: 14, y: 69, risk: "medium" },
    { id: "chair", name: "椅子障碍", type: "obstacle", color: "blue", zone: "客厅", semanticZone: "living_room", aliases: ["椅子", "障碍", "椅子障碍"], x: 63, y: 55, risk: "medium" },
    { id: "heavy_box", name: "重箱子", type: "box", color: "red", zone: "客厅左侧", semanticZone: "living_left", aliases: ["箱子", "重箱子", "左边箱子", "客厅左侧箱子"], x: 18, y: 82, risk: "high" }
  ],
  destinations: [
    { id: "kitchen_counter", name: "厨房台面", x: 18, y: 29 },
    { id: "door", name: "门口", x: 14, y: 69 },
    { id: "elder_seat", name: "老人座位", x: 74, y: 78 },
    { id: "living_room", name: "客厅", x: 70, y: 38 }
  ]
};

const state = {
  scenario: fallbackScenario,
  objects: [],
  robot: { x: 47, y: 58 },
  carryingObjectId: null,
  metrics: {
    total: 0,
    success: 0,
    clarifications: 0,
    confirmations: 0,
    handoffs: 0,
    riskBlocks: 0,
    recoveries: 0,
    interruptions: 0,
    speechFeedback: 0,
    voiceTurns: 0,
    voiceFallbacks: 0
  },
  evaluationSet: [],
  evaluationResults: [],
  interruptionEvaluationSet: [],
  interruptionEvaluationResults: [],
  voiceFeedbackEvaluationSet: [],
  voiceFeedbackEvaluationResults: [],
  routeEvaluationSet: [],
  routeEvaluationResults: [],
  advancedEvaluationSet: [],
  voiceInteractionEvaluationSet: [],
  qualityEvidence: null,
  executionState: {
    current: "idle",
    reason: "等待任务输入",
    history: []
  },
  handoff: {
    reason: "暂无接管风险",
    trigger: "none",
    recommendation: "保持自动执行观察",
    operatorPrompt: "无需人工介入",
    severity: "low"
  },
  executionRunId: 0,
  executionPaused: false,
  pending: null,
  selectedObjectId: null,
  groundedObjectId: null,
  activeTask: null,
  activePlan: [],
  activeTrace: [],
  activeGroundingReport: null,
  activeRouteReport: null,
  routeProgressIndex: 0,
  taskQueue: {
    items: [],
    currentId: null,
    autoAdvance: true
  },
  perception: {
    events: []
  },
  conversation: {
    turns: [],
    lastTask: null,
    pendingQuestion: null,
    lastDecision: null
  },
  speech: {
    enabled: false,
    last: "",
    log: []
  },
  voiceInteraction: {
    state: "idle",
    transcript: "",
    confidence: null,
    source: "manual",
    demoMode: false,
    demoStep: 0,
    metrics: {
      heard: 0,
      confirmed: 0,
      edited: 0,
      fallbacks: 0
    }
  },
  runLogs: []
};

const RUN_LOG_STORAGE_KEY = "voiceToActionAgent.runLogs.v1";
const MAX_RUN_LOGS = 160;

const nodes = {
  commandInput: document.getElementById("commandInput"),
  runButton: document.getElementById("runButton"),
  evalButton: document.getElementById("evalButton"),
  interruptEvalButton: document.getElementById("interruptEvalButton"),
  voiceEvalButton: document.getElementById("voiceEvalButton"),
  routeEvalButton: document.getElementById("routeEvalButton"),
  voiceButton: document.getElementById("voiceButton"),
  resetButton: document.getElementById("resetButton"),
  sampleList: document.getElementById("sampleList"),
  speechToggle: document.getElementById("speechToggle"),
  replaySpeech: document.getElementById("replaySpeech"),
  speechLast: document.getElementById("speechLast"),
  speechLog: document.getElementById("speechLog"),
  voiceStatePill: document.getElementById("voiceStatePill"),
  voiceLiteCard: document.getElementById("voiceLiteCard"),
  voiceStateRail: document.getElementById("voiceStateRail"),
  voiceTranscriptDraft: document.getElementById("voiceTranscriptDraft"),
  useTranscriptButton: document.getElementById("useTranscriptButton"),
  clearTranscriptButton: document.getElementById("clearTranscriptButton"),
  voiceMetricsGrid: document.getElementById("voiceMetricsGrid"),
  voiceDemoButton: document.getElementById("voiceDemoButton"),
  selectedContext: document.getElementById("selectedContext"),
  contextDrawer: document.querySelector(".context-drawer"),
  runtimeDrawer: document.getElementById("runtimeDrawer"),
  interactionBox: document.getElementById("interactionBox"),
  sceneMap: document.getElementById("sceneMap"),
  routeOverlay: document.getElementById("routeOverlay"),
  robotNode: document.getElementById("robotNode"),
  timeline: document.getElementById("timeline"),
  agentTrace: document.getElementById("agentTrace"),
  groundingEvidence: document.getElementById("groundingEvidence"),
  routePreview: document.getElementById("routePreview"),
  taskJson: document.getElementById("taskJson"),
  planList: document.getElementById("planList"),
  agentStatus: document.getElementById("agentStatus"),
  metricTotal: document.getElementById("metricTotal"),
  metricSuccess: document.getElementById("metricSuccess"),
  metricClarify: document.getElementById("metricClarify"),
  metricConfirm: document.getElementById("metricConfirm"),
  metricHandoff: document.getElementById("metricHandoff"),
  metricRisk: document.getElementById("metricRisk"),
  metricRecovery: document.getElementById("metricRecovery"),
  metricInterrupt: document.getElementById("metricInterrupt"),
  metricInterruptEval: document.getElementById("metricInterruptEval"),
  metricSpeech: document.getElementById("metricSpeech"),
  metricVoiceTurns: document.getElementById("metricVoiceTurns"),
  metricVoiceFallback: document.getElementById("metricVoiceFallback"),
  metricVoiceEval: document.getElementById("metricVoiceEval"),
  metricRouteEval: document.getElementById("metricRouteEval"),
  metricEval: document.getElementById("metricEval"),
  runLog: document.getElementById("runLog"),
  contextMemory: document.getElementById("contextMemory"),
  taskQueue: document.getElementById("taskQueue"),
  perceptionFeed: document.getElementById("perceptionFeed"),
  qualityEvidence: document.getElementById("qualityEvidence"),
  executionStateMachine: document.getElementById("executionStateMachine"),
  handoffPanel: document.getElementById("handoffPanel"),
  productSummary: document.getElementById("productSummary"),
  decisionSummary: document.getElementById("decisionSummary"),
  exportLogButton: document.getElementById("exportLogButton"),
  clearLogButton: document.getElementById("clearLogButton"),
  clearQueueButton: document.getElementById("clearQueueButton")
};

async function init() {
  applyProductizedCopy();
  loadRunLogs();
  try {
    const response = await fetch("data/scenarios.json", { cache: "no-store" });
    if (response.ok) {
      state.scenario = await response.json();
    }
  } catch (error) {
    addTimeline("System", "未加载外部场景文件，已使用内置场景。");
  }

  try {
    const response = await fetch("data/evaluation-set.json", { cache: "no-store" });
    if (response.ok) {
      state.evaluationSet = await response.json();
    }
  } catch (error) {
    state.evaluationSet = [];
  }

  try {
    const response = await fetch("data/interruption-evaluation-set.json", { cache: "no-store" });
    if (response.ok) {
      state.interruptionEvaluationSet = await response.json();
    }
  } catch (error) {
    state.interruptionEvaluationSet = [];
  }

  try {
    const response = await fetch("data/voice-feedback-evaluation-set.json", { cache: "no-store" });
    if (response.ok) {
      state.voiceFeedbackEvaluationSet = await response.json();
    }
  } catch (error) {
    state.voiceFeedbackEvaluationSet = [];
  }

  try {
    const response = await fetch("data/route-evaluation-set.json", { cache: "no-store" });
    if (response.ok) {
      state.routeEvaluationSet = await response.json();
    }
  } catch (error) {
    state.routeEvaluationSet = [];
  }

  try {
    const response = await fetch("data/advanced-interaction-evaluation-set.json", { cache: "no-store" });
    if (response.ok) {
      state.advancedEvaluationSet = await response.json();
    }
  } catch (error) {
    state.advancedEvaluationSet = [];
  }

  try {
    const response = await fetch("data/voice-interaction-evaluation-set.json", { cache: "no-store" });
    if (response.ok) {
      state.voiceInteractionEvaluationSet = await response.json();
    }
  } catch (error) {
    state.voiceInteractionEvaluationSet = [];
  }

  resetScene({ initial: true });
  renderSamples();
  bindEvents();
  updateMetrics();
  updateInspector(null, [], []);
  renderVoiceInteractionConsole();
  addTimeline("Ready", "等待自然语言任务输入。");
  renderRunLogs();
  renderContextMemory();
  renderTaskQueue();
  renderPerceptionFeed();
  handleAutomationParams();
}

function applyProductizedCopy() {
  const setText = (selector, text) => {
    const element = document.querySelector(selector);
    if (element) element.textContent = text;
  };
  const setPlaceholder = (selector, text) => {
    const element = document.querySelector(selector);
    if (element) element.setAttribute("placeholder", text);
  };

  setText(".eyebrow", "Home Robot Interaction Demo");
  setText(".command-panel .section-title h2", "任务输入");
  setText(".stage-panel .section-title h2", "家庭场景");
  setText(".inspector-panel .section-title h2", "任务状态");
  setText("label[for='commandInput']", "输入一句话任务");
  setText(".sample-section-label", "选择一个场景");
  setText(".voice-lite-card summary", "语音确认");
  setText(".advanced-command-drawer summary", "评测工具");
  setText(".runtime-drawer summary", "执行接管");
  setText(".context-drawer summary", "指代对象");
  setText(".debug-drawer summary", "高级证据");
  setText(".topbar-link[href='/case-study-v4.html']", "案例说明");
  setText(".topbar-link[href='/test-plan.html']", "测试计划");
  const productHeadings = document.querySelectorAll(".product-focus-block h3");
  if (productHeadings[0]) productHeadings[0].textContent = "任务理解";
  if (productHeadings[1]) productHeadings[1].textContent = "下一步";

  if (nodes.runButton) nodes.runButton.textContent = "执行任务";
  if (nodes.voiceButton) nodes.voiceButton.textContent = "🎙";
  if (nodes.resetButton) nodes.resetButton.textContent = "↻";
  if (nodes.voiceDemoButton) nodes.voiceDemoButton.textContent = "播放完整演示";
  if (nodes.evalButton) nodes.evalButton.textContent = "基础评测";
  if (nodes.interruptEvalButton) nodes.interruptEvalButton.textContent = "打断评测";
  if (nodes.voiceEvalButton) nodes.voiceEvalButton.textContent = "语音评测";
  if (nodes.routeEvalButton) nodes.routeEvalButton.textContent = "路线评测";

  setPlaceholder("#commandInput", "例如：把红色杯子拿到厨房台面");
  setPlaceholder("#voiceTranscriptDraft", "确认识别文本后再执行");

  const metricLabels = [
    ["#metricTotal", "任务"],
    ["#metricSuccess", "完成率"],
    ["#metricClarify", "澄清"],
    ["#metricConfirm", "确认"],
    ["#metricHandoff", "接管"]
  ];
  metricLabels.forEach(([id, label]) => {
    const metric = document.querySelector(id)?.closest(".metric");
    const span = metric?.querySelector("span");
    if (span) span.textContent = label;
  });
}

function bindEvents() {
  nodes.runButton.addEventListener("click", () => runCommand(nodes.commandInput.value));
  nodes.evalButton.addEventListener("click", runEvaluationSet);
  nodes.interruptEvalButton.addEventListener("click", runInterruptionEvaluationSet);
  nodes.voiceEvalButton.addEventListener("click", runVoiceFeedbackEvaluationSet);
  nodes.routeEvalButton?.addEventListener("click", runRouteEvaluationSet);
  nodes.resetButton.addEventListener("click", resetScene);
  nodes.voiceButton.addEventListener("click", startVoiceInput);
  nodes.useTranscriptButton?.addEventListener("click", useVoiceTranscript);
  nodes.clearTranscriptButton?.addEventListener("click", clearVoiceTranscript);
  nodes.voiceDemoButton?.addEventListener("click", runVoicePmDemo);
  nodes.speechToggle.addEventListener("change", () => {
    state.speech.enabled = nodes.speechToggle.checked;
    addSpeechFeedback(
      "speech",
      state.speech.enabled ? "语音播报已开启。我会在关键状态变化时反馈。" : "语音播报已关闭。我仍会保留文字话术日志。",
      { force: true }
    );
  });
  nodes.replaySpeech.addEventListener("click", () => replayLastSpeech());
  nodes.exportLogButton?.addEventListener("click", exportRunLogs);
  nodes.clearLogButton?.addEventListener("click", clearRunLogs);
  nodes.clearQueueButton?.addEventListener("click", clearTaskQueue);
  document.querySelectorAll("[data-perception-event]").forEach((button) => {
    button.addEventListener("click", () => applyPerceptionEvent(button.getAttribute("data-perception-event")));
  });
  nodes.commandInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      runCommand(nodes.commandInput.value);
    }
  });
}

function handleAutomationParams() {
  const params = new URLSearchParams(window.location.search);
  if (params.has("speech")) {
    state.speech.enabled = true;
    nodes.speechToggle.checked = true;
  }

  const selectedObjectId = params.get("select");
  if (selectedObjectId && state.objects.some((item) => item.id === selectedObjectId)) {
    state.selectedObjectId = selectedObjectId;
    renderScene();
    renderSelectedContext();
    addTimeline("Context", `已通过 URL 预选对象：${findObject(selectedObjectId)?.name || selectedObjectId}。`);
  }

  if (params.has("eval")) {
    window.setTimeout(runEvaluationSet, 320);
    return;
  }

  if (params.has("interrupteval")) {
    window.setTimeout(runInterruptionEvaluationSet, 320);
    return;
  }

  if (params.has("voiceeval")) {
    window.setTimeout(runVoiceFeedbackEvaluationSet, 320);
    return;
  }

  if (params.has("routeeval")) {
    window.setTimeout(runRouteEvaluationSet, 320);
    return;
  }

  if (params.has("voicedemo")) {
    window.setTimeout(runVoicePmDemo, 420);
    return;
  }

  const demoCommand = params.get("demo");
  if (demoCommand) {
    window.setTimeout(() => {
      nodes.commandInput.value = demoCommand;
      runCommand(demoCommand, { confirmed: params.has("confirm") });
    }, 320);

    const perceptionEvent = params.get("perception");
    if (perceptionEvent) {
      window.setTimeout(() => {
        applyPerceptionEvent(perceptionEvent);
      }, 2300);
    }

    const interruptCommand = params.get("interrupt");
    if (interruptCommand) {
      window.setTimeout(() => {
        nodes.commandInput.value = interruptCommand;
        runCommand(interruptCommand, { followUp: true });
      }, 1700);
    }
  }
}

function renderSamples() {
  nodes.sampleList.innerHTML = "";
  const sampleScenarios = [
    { title: "日常递送", helper: "低风险物品移动", command: "把红色杯子拿到厨房台面" },
    { title: "照护确认", helper: "老人/药品相关", command: "把药盒递给老人，但先确认是不是蓝色那个" },
    { title: "高风险搬运", helper: "重物需要确认", command: "把重箱子搬到门口" },
    { title: "自主导航", helper: "无物体移动意图", command: "请你移动到客厅" },
    { title: "异常恢复", helper: "路径变化后重新规划", command: "把重箱子搬到门口，绕开椅子走" }
  ];
  const samples = sampleScenarios.map((item) => {
    const matched = state.scenario.samples.find((sample) => sample === item.command) || item.command;
    return { ...item, command: matched };
  });
  samples.forEach((sample) => {
    const button = document.createElement("button");
    button.type = "button";
    button.title = sample.command;
    button.innerHTML = `<strong>${escapeHtml(sample.title)}</strong><span>${escapeHtml(sample.helper)}</span>`;
    button.addEventListener("click", () => {
      nodes.commandInput.value = sample.command;
      runCommand(sample.command);
    });
    nodes.sampleList.appendChild(button);
  });
}

function setRuntimeFeedbackOpen(open) {
  if (nodes.runtimeDrawer) {
    nodes.runtimeDrawer.open = Boolean(open);
  }
}

function resetScene(options = {}) {
  state.objects = state.scenario.objects.map((item) => ({ ...item }));
  state.robot = { x: 47, y: 58 };
  state.carryingObjectId = null;
  state.pending = null;
  state.selectedObjectId = null;
  state.groundedObjectId = null;
  state.activeTask = null;
  state.activePlan = [];
  state.activeTrace = [];
  state.activeGroundingReport = null;
  state.activeRouteReport = null;
  state.qualityEvidence = null;
  state.voiceInteraction = {
    ...state.voiceInteraction,
    state: "idle",
    transcript: "",
    confidence: null,
    source: "manual",
    demoMode: false
  };
  if (nodes.voiceLiteCard) nodes.voiceLiteCard.open = false;
  updateExecutionState("idle", "场景已重置，等待用户输入任务。", { silent: true });
  updateHandoffDecision(null, "reset");
  state.routeProgressIndex = 0;
  state.taskQueue = {
    items: [],
    currentId: null,
    autoAdvance: true
  };
  state.perception = {
    events: []
  };
  state.conversation = {
    turns: [],
    lastTask: null,
    pendingQuestion: null,
    lastDecision: null
  };
  state.voiceInteraction.state = "idle";
  state.voiceInteraction.transcript = "";
  state.voiceInteraction.confidence = null;
  state.voiceInteraction.source = "manual";
  state.voiceInteraction.demoMode = false;
  state.voiceInteraction.demoStep = 0;
  state.executionRunId += 1;
  state.executionPaused = false;
  nodes.timeline.innerHTML = "";
  setRuntimeFeedbackOpen(false);
  nodes.interactionBox.innerHTML = '<p class="muted">场景已重置。请输入任务或选择示例。</p>';
  setStatus("Ready");
  addSpeechFeedback("ready", options.initial ? "我已就绪。请告诉我你希望我完成什么任务。" : "场景已重置。我已准备好接收新的任务。", {
    silent: options.initial,
    skipMetric: options.initial
  });
  renderScene();
  renderSelectedContext();
  updateInspector(null, [], []);
  renderContextMemory();
  renderTaskQueue();
  renderPerceptionFeed();
  renderQualityEvidence();
  renderExecutionStateMachine();
  renderHandoffPanel();
  renderVoiceInteractionConsole();
}

function renderScene() {
  const activeObjectIds = new Set(state.objects.map((object) => object.id));
  [...nodes.sceneMap.querySelectorAll(".object-node")].forEach((node) => {
    if (!activeObjectIds.has(node.dataset.objectId)) {
      node.remove();
    }
  });

  state.objects.forEach((object) => {
    let element = nodes.sceneMap.querySelector(`[data-object-id="${object.id}"]`);
    if (!element) {
      element = document.createElement("button");
      element.type = "button";
      element.dataset.objectId = object.id;
      element.addEventListener("click", () => {
        state.selectedObjectId = object.id;
        renderScene();
        renderSelectedContext();
        addTimeline("Inspect", `已选中对象：${object.name}。`);
      });
      nodes.sceneMap.appendChild(element);
    }
    element.className = `object-node object-${object.type} color-${object.color || "neutral"} ${object.risk === "high" ? "risk" : ""} ${object.id === state.selectedObjectId ? "selected" : ""} ${object.id === state.groundedObjectId ? "grounded" : ""} ${object.id === state.carryingObjectId ? "carried" : ""}`;
    element.style.left = `${object.x}%`;
    element.style.top = `${object.y}%`;
    element.innerHTML = `<span class="object-label">${object.name}${object.id === state.carryingObjectId ? " · 携带中" : ""}</span>`;
    element.title = `${object.name} · ${object.zone}`;
    element.setAttribute("aria-label", `${object.name}，${object.zone}`);
  });

  nodes.robotNode.style.left = `${state.robot.x}%`;
  nodes.robotNode.style.top = `${state.robot.y}%`;
  renderRouteOverlay();
}

function renderSelectedContext() {
  const selected = state.selectedObjectId ? findObject(state.selectedObjectId) : null;
  if (nodes.contextDrawer) {
    nodes.contextDrawer.open = Boolean(selected);
  }
  if (!selected) {
    nodes.selectedContext.innerHTML = `
      <strong>当前指代对象</strong>
      <p class="muted">点击场景中的物体后，可以说“把这个拿到厨房台面”。</p>
    `;
    return;
  }

  nodes.selectedContext.innerHTML = `
    <strong>当前指代对象：${selected.name}</strong>
    <p class="muted">${selected.zone} · ${selected.type} · 风险 ${selected.risk}</p>
    <div class="choice-row">
      <button type="button" data-context-command="把这个拿到厨房台面">把这个拿到厨房台面</button>
      <button type="button" data-context-command="把这个拿到门口">把这个拿到门口</button>
    </div>
  `;

  nodes.selectedContext.querySelectorAll("[data-context-command]").forEach((button) => {
    button.addEventListener("click", () => {
      const command = button.getAttribute("data-context-command");
      nodes.commandInput.value = command;
      runCommand(command);
    });
  });
}

function analyzeConversationContext(command, overrides = {}) {
  const evidence = [];
  const pending = state.pending;
  const lastTask = state.conversation.lastTask || state.activeTask;
  const hasActiveExecution = isExecutionActive();

  if (pending?.type === "clarification") {
    const resolvedObject = resolveClarificationReply(command, pending.parseResult?.candidates || []);
    if (resolvedObject) {
      return buildContextDecision({
        type: "slot_fill",
        label: "补充澄清信息",
        action: "resolve_clarification",
        confidence: 0.92,
        summary: `用户用短回复补全目标对象：${resolvedObject.name}。`,
        evidence: ["存在待澄清对象", `短回复命中候选：${resolvedObject.name}`],
        resolvedCommand: pending.command,
        resolvedOverrides: { objectId: resolvedObject.id, queueItemId: pending.parseResult?.queueItemId || null, skipQueueSplit: true }
      });
    }
    evidence.push("存在待澄清问题，但短回复没有命中候选对象");
  }

  if (pending?.type === "confirmation") {
    if (isAffirmativeReply(command)) {
      return buildContextDecision({
        type: "confirmation",
        label: "确认上一任务",
        action: "confirm_pending",
        confidence: 0.94,
        summary: "用户确认执行上一轮安全门控任务。",
        evidence: ["存在待安全确认任务", "用户回复为确认/继续类表达"],
        resolvedCommand: pending.command,
        resolvedOverrides: { objectId: pending.parseResult?.task?.objectId || null, queueItemId: pending.parseResult?.queueItemId || null, skipQueueSplit: true }
      });
    }
    if (isCancelReply(command)) {
      return buildContextDecision({
        type: "cancel",
        label: "取消待处理任务",
        action: "cancel_pending",
        confidence: 0.9,
        summary: "用户取消上一轮待确认任务。",
        evidence: ["存在待安全确认任务", "用户回复为取消/不用类表达"]
      });
    }
    evidence.push("存在待安全确认任务，但用户输入更像新指令或补充约束");
  }

  if (isCancelReply(command) && (pending || hasActiveExecution)) {
    return buildContextDecision({
      type: "cancel",
      label: "取消当前上下文",
      action: "cancel_pending",
      confidence: 0.86,
      summary: "用户取消当前执行或待处理上下文。",
      evidence: ["命中取消类表达", pending ? "存在待处理任务" : "存在执行中任务"]
    });
  }

  if (hasActiveExecution && classifyInterruption(command)) {
    return buildContextDecision({
      type: "interruption",
      label: "执行中打断",
      action: "interrupt_active",
      confidence: 0.9,
      summary: "用户在执行中提出暂停、改口、换对象、重规划或接管。",
      evidence: ["当前存在 activeTask", `打断类型：${classifyInterruption(command)}`]
    });
  }

  if (!hasActiveExecution && lastTask && isLastTaskRevision(command)) {
    const revised = buildRevisionCommand(command, lastTask);
    if (revised) {
      return buildContextDecision({
        type: "revision",
        label: "修正上一任务",
        action: "revise_last_task",
        confidence: 0.78,
        summary: `用户基于上一任务改口：${revised.summary}`,
        evidence: ["命中不是/换/改成类表达", `上一任务：${lastTask.object || "无目标物"} -> ${lastTask.destination}`],
        resolvedCommand: revised.command,
        resolvedOverrides: revised.overrides
      });
    }
  }

  if (/^(然后|再|接着|顺便|另外)/.test(command)) {
    return buildContextDecision({
      type: "follow_up",
      label: "连续任务",
      action: "parse_as_new_task",
      confidence: 0.72,
      summary: "用户用连续连接词发起下一步任务，保留上一任务作为语境参考。",
      evidence: ["命中然后/再/接着/顺便/另外", lastTask ? `上一任务目标：${lastTask.destination}` : "当前无上一任务"]
    });
  }

  if (/^(红色的|蓝色的|这个|那个|左边的|右边的)$/.test(command) || (/^(红色|蓝色|左边|右边)$/.test(command) && !pending)) {
    return buildContextDecision({
      type: "orphan_slot",
      label: "孤立补充信息",
      action: "parse_as_new_task",
      confidence: 0.42,
      summary: "用户输入像补充信息，但当前没有待澄清任务，需要作为新输入重新理解。",
      evidence: ["短回复缺少动作和目标位置", "当前无待澄清问题"]
    });
  }

  return buildContextDecision({
    type: hasActiveExecution && !overrides.followUp ? "new_task_during_execution" : "new_task",
    label: hasActiveExecution && !overrides.followUp ? "新独立任务" : "新任务",
    action: "parse_as_new_task",
    confidence: hasActiveExecution ? 0.68 : 0.82,
    summary: hasActiveExecution
      ? "执行中收到完整新任务，应取消旧动作并重新解析。"
      : "用户发起新的可执行任务。",
    evidence: evidence.length ? evidence : ["未命中待确认、待澄清、取消或修正规则"]
  });
}

function buildContextDecision({ type, label, action, confidence, summary, evidence = [], resolvedCommand = null, resolvedOverrides = {} }) {
  return {
    type,
    label,
    action,
    confidence,
    summary,
    evidence,
    resolvedCommand,
    resolvedOverrides,
    time: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  };
}

function appendConversationTurn(command, decision) {
  const turn = {
    command,
    decision: decision.label,
    type: decision.type,
    action: decision.action,
    summary: decision.summary,
    time: decision.time
  };
  state.conversation.turns = [turn, ...state.conversation.turns].slice(0, 8);
  state.conversation.lastDecision = decision;
}

function resolveClarificationReply(command, candidates = []) {
  const normalized = command.trim();
  const available = candidates.filter(Boolean);
  if (!available.length) return null;
  if (/红|红色/.test(normalized)) return available.find((item) => item.color === "red" || item.id.includes("red")) || null;
  if (/蓝|蓝色/.test(normalized)) return available.find((item) => item.color === "blue" || item.id.includes("blue")) || null;
  if (/药|药盒/.test(normalized)) return available.find((item) => item.id === "medicine_box") || null;
  if (/快递|包裹/.test(normalized)) return available.find((item) => item.id === "parcel") || null;
  if (/箱|重/.test(normalized)) return available.find((item) => item.id === "heavy_box") || null;
  return available.find((item) => normalized.includes(item.name)) || null;
}

function isAffirmativeReply(command) {
  return /^(确认|可以|继续|执行|好的|好|是的|对|没错|就这个|就它|开始)$/.test(command.trim());
}

function isCancelReply(command) {
  return /^(取消|不用了|算了|停止|别做了|先别做|不要了)$/.test(command.trim());
}

function isLastTaskRevision(command) {
  return /不是|换|改成|改为|别拿|别放/.test(command);
}

function buildRevisionCommand(command, lastTask) {
  const nextObject = inferObject(command);
  const nextDestination = inferInterruptDestination(command) || inferDestination(command, nextObject || findObject(lastTask.objectId));
  if (nextObject) {
    return {
      command: `把${nextObject.name}${lastTask.destination ? `拿到${lastTask.destination}` : "拿到厨房台面"}`,
      summary: `目标对象改为 ${nextObject.name}`,
      overrides: { objectId: nextObject.id }
    };
  }
  if (nextDestination && lastTask.object) {
    return {
      command: `把${lastTask.object}拿到${nextDestination.name}`,
      summary: `目标位置改为 ${nextDestination.name}`,
      overrides: { objectId: lastTask.objectId }
    };
  }
  return null;
}

function maybeCreateTaskQueue(command) {
  const segments = splitCompoundCommand(command);
  if (segments.length < 2) return false;

  state.taskQueue.items = segments.map((segment, index) => createQueueItem(segment, index));
  state.taskQueue.currentId = state.taskQueue.items[0]?.id || null;
  renderTaskQueue();
  recordRunLog("queue-create", "识别到多任务队列", {
    command,
    segments,
    queue: state.taskQueue.items
  });
  addTimeline("Queue", `识别到 ${segments.length} 个顺序任务，已创建任务队列。`);
  addSpeechFeedback("understand", `我识别到 ${segments.length} 个任务，会按顺序执行。`);
  startQueueItem(state.taskQueue.items[0]);
  return true;
}

function splitCompoundCommand(command) {
  const normalized = command
    .replace(/[；;]/g, "，")
    .replace(/\s+/g, "")
    .replace(/^先/, "");
  return normalized
    .split(/，?(?:然后|再|接着|随后|之后|顺便)/)
    .map((item) => normalizeQueueSegment(item))
    .filter((item) => item.length >= 3 && /厨房|台面|门口|客厅|老人|杯|药|快递|包裹|箱子|移动|检查|看看|递给|拿|搬|去/.test(item));
}

function normalizeQueueSegment(segment) {
  return segment
    .replace(/^[，,。.\s]+/, "")
    .replace(/^(再|然后|接着|随后|之后|顺便|先)/, "")
    .replace(/[。.\s]+$/, "")
    .trim();
}

function createQueueItem(command, index) {
  return {
    id: `queue-${Date.now()}-${index}-${Math.random().toString(16).slice(2, 7)}`,
    command,
    index,
    status: index === 0 ? "current" : "queued",
    priority: inferQueuePriority(command),
    risk: inferCommandRiskHint(command),
    createdAt: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  };
}

function inferQueuePriority(command) {
  if (/药|老人|重|小心|接管|确认/.test(command)) return "high";
  if (/门口|快递|障碍|椅子/.test(command)) return "medium";
  return "normal";
}

function inferCommandRiskHint(command) {
  if (/药|老人|重|箱子/.test(command)) return "high";
  if (/门口|快递|障碍|椅子|小心/.test(command)) return "medium";
  return "low";
}

function startQueueItem(item) {
  if (!item) {
    state.taskQueue.currentId = null;
    renderTaskQueue();
    return;
  }
  state.taskQueue.currentId = item.id;
  updateQueueItem(item.id, { status: "current" });
  nodes.commandInput.value = item.command;
  runCommand(item.command, { skipQueueSplit: true, queueItemId: item.id });
}

function updateQueueItem(id, patch) {
  const item = state.taskQueue.items.find((entry) => entry.id === id);
  if (!item) return;
  Object.assign(item, patch, {
    updatedAt: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  });
  renderTaskQueue();
}

function currentQueueItem() {
  return state.taskQueue.items.find((item) => item.id === state.taskQueue.currentId) || null;
}

function markQueueItemDone(id) {
  if (!id) return;
  updateQueueItem(id, { status: "done" });
}

function startNextQueuedTask() {
  const next = state.taskQueue.items.find((item) => item.status === "queued");
  if (!next) {
    state.taskQueue.currentId = null;
    renderTaskQueue();
    return;
  }
  window.setTimeout(() => {
    if (isExecutionActive() || state.pending) return;
    addTimeline("Queue", `开始队列中的下一个任务：${next.command}`);
    recordRunLog("queue-next", "开始队列中的下一个任务", { item: next });
    startQueueItem(next);
  }, 650);
}

function clearTaskQueue() {
  state.taskQueue.items = state.taskQueue.items.map((item) => (
    ["queued", "current", "waiting_input", "safety_gated"].includes(item.status)
      ? { ...item, status: "canceled" }
      : item
  ));
  state.taskQueue.currentId = null;
  renderTaskQueue();
  recordRunLog("queue-clear", "清空任务队列", { queue: state.taskQueue.items });
}

function applyPerceptionEvent(eventType) {
  const activeTask = state.activeTask ? { ...state.activeTask } : null;
  let event;

  if (eventType === "target_moved") {
    event = simulateTargetMoved(activeTask);
  } else if (eventType === "path_blocked") {
    event = simulatePathBlocked(activeTask);
  } else if (eventType === "elder_moved") {
    event = simulateElderMoved(activeTask);
  }

  if (!event) return;
  pushPerceptionEvent(event);
  recordRunLog("perception", event.title, event);
  addTimeline("Perception", event.summary);
  addSpeechFeedback("recovery", event.speech);
  renderScene();
  renderPerceptionFeed();
}

function simulateTargetMoved(activeTask) {
  const objectId = activeTask?.objectId || state.selectedObjectId || "red_cup";
  const object = findObject(objectId) || findObject("red_cup");
  if (!object) return null;

  if (state.carryingObjectId === object.id) {
    return {
      type: "target_moved",
      severity: "watch",
      title: "目标已在携带中",
      summary: `${object.name} 已被机器人携带，感知事件不改变目标位置。`,
      speech: `${object.name} 已在我手上，我会继续执行当前任务。`,
      action: "continue"
    };
  }

  object.x = object.id === "medicine_box" ? 31 : 58;
  object.y = object.id === "medicine_box" ? 72 : 31;
  object.zone = object.id === "medicine_box" ? "老人座位旁" : "餐桌旁";

  if (activeTask?.objectId === object.id) {
    state.activeRouteReport = buildRouteReport(activeTask);
    updateInspector({ ...activeTask, status: "executing" }, state.activePlan, addPerceptionTrace(state.activeTrace, "目标重新定位", `${object.name} 被挪到 ${object.zone}`), state.activeGroundingReport, state.activeRouteReport);
  }

  return {
    type: "target_moved",
    severity: activeTask?.objectId === object.id ? "medium" : "low",
    title: "目标被挪走",
    summary: `${object.name} 被感知到移动到 ${object.zone}，系统已刷新目标坐标和路线预览。`,
    speech: `我检测到${object.name}位置变化，已重新定位目标并更新路线。`,
    action: activeTask?.objectId === object.id ? "reground_and_replan" : "update_world_state"
  };
}

function simulatePathBlocked(activeTask) {
  const chair = findObject("chair");
  if (chair) {
    chair.x = 66;
    chair.y = 62;
    chair.zone = "通道";
  }

  if (activeTask) {
    const nextTask = {
      ...activeTask,
      failureMode: "obstacle_avoidance",
      recoveryOptions: defaultRecoveryOptions("obstacle_avoidance")
    };
    state.activeTask = nextTask;
    state.activeRouteReport = buildRouteReport({ ...nextTask, routeMode: "avoid_chair" }, { routeMode: "avoid_chair" });
    state.activeTrace = addPerceptionTrace(state.activeTrace, "路径突发障碍", "感知到通道被椅子阻挡");
    pauseForRecovery(nextTask, state.activePlan, state.activeTrace, state.executionRunId);
  }

  return {
    type: "path_blocked",
    severity: activeTask ? "high" : "medium",
    title: "路径被挡住",
    summary: activeTask
      ? "通道出现障碍，当前任务已暂停并进入恢复选择。"
      : "通道出现障碍，后续路线规划会提高避障风险。 ",
    speech: activeTask
      ? "我检测到路径被挡住，已暂停任务。请从恢复选项中选择下一步。"
      : "我检测到通道出现障碍，后续执行会优先考虑绕行。",
    action: activeTask ? "pause_for_recovery" : "update_world_state"
  };
}

function simulateElderMoved(activeTask) {
  const destination = state.scenario.destinations.find((item) => item.id === "elder_seat");
  if (destination) {
    destination.x = 29;
    destination.y = 72;
    destination.name = "老人新位置";
  }

  if (activeTask?.destinationId === "elder_seat") {
    const nextTask = { ...activeTask, destination: "老人新位置" };
    state.activeTask = nextTask;
    state.activeRouteReport = buildRouteReport(nextTask);
    state.activeTrace = addPerceptionTrace(state.activeTrace, "目标区域变化", "老人座位位置发生变化");
    updateInspector({ ...nextTask, status: "executing" }, state.activePlan, state.activeTrace, state.activeGroundingReport, state.activeRouteReport);
  }

  return {
    type: "elder_moved",
    severity: activeTask?.destinationId === "elder_seat" ? "medium" : "low",
    title: "老人位置变化",
    summary: "老人位置已更新，涉及老人递送或靠近任务会重新计算目标点。",
    speech: "我检测到老人位置发生变化，已更新目标位置和路线。",
    action: activeTask?.destinationId === "elder_seat" ? "update_destination_and_route" : "update_world_state"
  };
}

function pushPerceptionEvent(event) {
  state.perception.events = [{
    ...event,
    time: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  }, ...state.perception.events].slice(0, 8);
}

function defaultRecoveryOptions(failureMode) {
  if (failureMode === "obstacle_avoidance") {
    return [
      { id: "reroute", label: "绕行避障", outcome: "重新规划路径绕开椅子。" },
      { id: "pause", label: "暂停等待", outcome: "暂停任务，等待用户清理障碍。" },
      { id: "handoff", label: "人工接管", outcome: "停止自动执行，由用户接管。" }
    ];
  }
  return [
    { id: "reroute", label: "重规划路径", outcome: "重新计算路线并低速继续。" },
    { id: "handoff", label: "人工接管", outcome: "停止自动执行，由用户接管。" }
  ];
}

function addPerceptionTrace(trace = [], title, detail) {
  return [
    ...(trace || []),
    {
      agent: "Perception Monitor",
      title,
      status: "caution",
      detail,
      evidence: ["环境状态发生变化", "已刷新世界模型或触发恢复策略"]
    }
  ];
}

function runCommand(rawCommand, overrides = {}) {
  const command = (rawCommand || "").trim();
  if (!command) {
    nodes.interactionBox.innerHTML = '<p class="muted">请输入一个可执行任务，例如“把红色杯子拿到厨房台面”。</p>';
    addSpeechFeedback("clarify", "我还没有收到任务。请告诉我要拿取、递送、检查或搬运什么。");
    return;
  }

  if (!overrides.skipQueueSplit) {
    const queued = maybeCreateTaskQueue(command);
    if (queued) return;
  }

  const contextDecision = overrides.contextCarry || analyzeConversationContext(command, overrides);
  appendConversationTurn(command, contextDecision);
  renderContextMemory();
  recordRunLog("command", "收到用户指令", { command, overrides });
  updateVoiceInteractionState("understanding", {
    transcript: command,
    source: overrides.fromVoice ? "voice" : state.voiceInteraction.source
  });

  if (contextDecision.action === "resolve_clarification") {
    recordRunLog("context-resolve", "多轮上下文补全澄清对象", contextDecision);
    addTimeline("Context", contextDecision.summary);
    runCommand(contextDecision.resolvedCommand, {
      ...overrides,
      ...contextDecision.resolvedOverrides,
      followUp: true,
      contextCarry: { ...contextDecision, action: "parse_as_new_task" }
    });
    return;
  }

  if (contextDecision.action === "confirm_pending") {
    recordRunLog("context-confirm", "多轮上下文确认待执行任务", contextDecision);
    addTimeline("Context", contextDecision.summary);
    runCommand(contextDecision.resolvedCommand, {
      ...overrides,
      ...contextDecision.resolvedOverrides,
      confirmed: true,
      followUp: true,
      contextCarry: { ...contextDecision, action: "parse_as_new_task" }
    });
    return;
  }

  if (contextDecision.action === "cancel_pending") {
    if (state.taskQueue.currentId) updateQueueItem(state.taskQueue.currentId, { status: "canceled" });
    state.pending = null;
    state.conversation.pendingQuestion = null;
    state.executionRunId += 1;
    releaseCarriedObject();
    state.activeTask = null;
    state.activePlan = [];
    state.activeTrace = [];
    state.activeGroundingReport = null;
    state.activeRouteReport = null;
    state.routeProgressIndex = 0;
    setStatus("Ready");
    nodes.interactionBox.innerHTML = '<span class="tag warn">已取消</span><p class="muted" style="margin-top:8px;">已取消上一轮待确认或待澄清任务，等待新的指令。</p>';
    addSpeechFeedback("interrupt", "我已取消上一轮待处理任务。你可以重新告诉我要做什么。");
    addTimeline("Context", "用户取消待处理任务，上下文已清空待确认项。");
    renderContextMemory();
    recordRunLog("context-cancel", "多轮上下文取消待处理任务", contextDecision);
    return;
  }

  if (contextDecision.action === "revise_last_task") {
    recordRunLog("context-revise", "多轮上下文基于上一任务改写指令", contextDecision);
    addTimeline("Context", contextDecision.summary);
    runCommand(contextDecision.resolvedCommand, {
      ...overrides,
      ...contextDecision.resolvedOverrides,
      contextCarry: { ...contextDecision, action: "parse_as_new_task" }
    });
    return;
  }

  if (isExecutionActive() && classifyInterruption(command)) {
    handleInterruption(command);
    return;
  }

  if (isExecutionActive() && !overrides.followUp) {
    cancelActiveExecutionForNewCommand(command);
  } else if (state.carryingObjectId && !overrides.followUp) {
    releaseCarriedObject();
  }

  setStatus("Parsing");
  updateExecutionState("parsing", "收到用户表达，开始解析意图、对象、目标位置和安全约束。");
  addSpeechFeedback("understand", "我正在理解你的任务，并检查目标对象、位置和安全条件。");
  if (!overrides.followUp) {
    state.metrics.total += 1;
  }
  const parseResult = parseCommand(command, overrides);
  parseResult.queueItemId = overrides.queueItemId || null;
  parseResult.contextDecision = contextDecision;
  parseResult.routeReport = buildRouteReport(parseResult.task);
  state.routeProgressIndex = 0;
  recordRunLog("parse", "完成指令解析", {
    command,
    needClarification: Boolean(parseResult.needClarification),
    needConfirmation: Boolean(parseResult.needConfirmation),
    task: parseResult.task,
    contextDecision,
    groundingReport: parseResult.groundingReport,
    routeReport: parseResult.routeReport
  });

  if (parseResult.needClarification) {
    updateExecutionState("need_clarification", "目标对象或位置不够明确，进入澄清门。", { task: parseResult.task });
    updateVoiceInteractionState("clarifying", { transcript: command });
    if (overrides.queueItemId) updateQueueItem(overrides.queueItemId, { status: "waiting_input", risk: parseResult.task.riskLevel });
    state.metrics.clarifications += 1;
    updateMetrics();
    updateInspector(parseResult.task, parseResult.plan || [], parseResult.trace || [], parseResult.groundingReport, parseResult.routeReport);
    recordRunLog("clarification", "需要用户澄清目标对象", {
      command,
      candidates: parseResult.candidates || []
    });
    requestClarification(parseResult, command);
    return;
  }

  if (parseResult.needConfirmation && !overrides.confirmed) {
    updateExecutionState("need_confirmation", "任务存在安全风险，进入确认门。", { task: parseResult.task });
    updateVoiceInteractionState("confirming", { transcript: command });
    if (overrides.queueItemId) updateQueueItem(overrides.queueItemId, { status: "safety_gated", risk: parseResult.task.riskLevel });
    state.metrics.confirmations += 1;
    updateMetrics();
    updateInspector(parseResult.task, parseResult.plan || buildPlan(parseResult.task), parseResult.trace || [], parseResult.groundingReport, parseResult.routeReport);
    recordRunLog("confirmation", "需要用户安全确认", { command, task: parseResult.task });
    requestConfirmation(parseResult, command);
    return;
  }

  executeTask(parseResult.task, parseResult.plan || buildPlan(parseResult.task), parseResult.trace || [], {
    groundingReport: parseResult.groundingReport,
    routeReport: parseResult.routeReport,
    queueItemId: overrides.queueItemId || null
  });
}

function parseCommand(command, overrides = {}) {
  if (window.VoiceToActionAgents) {
    return window.VoiceToActionAgents.orchestrate(command, buildWorld(), overrides);
  }

  const normalized = command.toLowerCase();
  const routePreference = inferRoutePreference(command);
  const object = overrides.objectId
    ? state.objects.find((item) => item.id === overrides.objectId)
    : inferObject(normalized);
  const destination = inferDestination(normalized, object);
  const action = inferAction(normalized, object);
  const riskLevel = inferRisk(command, object, action);

  const objectlessIntent = action.intent === "navigate";
  const ambiguousCup = !objectlessIntent && !overrides.objectId && normalized.includes("杯子") && !normalized.includes("红色") && !normalized.includes("蓝色");
  const deicticReference = !objectlessIntent && !overrides.objectId && /那个|这个|左边|右边|这边|那边/.test(command) && !object;
  const ambiguousBox = !objectlessIntent && !overrides.objectId && normalized.includes("箱子") && !normalized.includes("重");

  const task = {
    userCommand: command,
    intent: action.intent,
    action: action.label,
    object: object ? object.name : null,
    objectId: object ? object.id : null,
    destination: destination.name,
    destinationId: destination.id,
    constraints: extractConstraints(command),
    routeMode: routePreference.mode,
    routeConstraint: routePreference.constraint,
    riskLevel,
    requiresHumanConfirmation: riskLevel !== "low",
    status: "parsed"
  };

  return {
    task,
    candidates: getClarificationCandidates(ambiguousCup, ambiguousBox, deicticReference),
    needClarification: objectlessIntent ? !destination : (ambiguousCup || ambiguousBox || deicticReference || !object),
    needConfirmation: riskLevel !== "low",
    plan: buildPlan(task),
    trace: [],
    groundingReport: buildFallbackGroundingReport(command, object, destination, action, {
      ambiguousCup,
      ambiguousBox,
      deicticReference,
      objectlessIntent
    })
  };
}

function buildWorld() {
  return {
    objects: state.objects,
    destinations: state.scenario.destinations,
    selectedObjectId: state.selectedObjectId
  };
}

function inferObject(command) {
  if (/老人旁边|老人边上|边桌/.test(command)) return findObject("medicine_box");
  if (/桌上|桌面|桌/.test(command) && /东西|物体/.test(command)) return findObject("red_cup");
  if (/门口/.test(command) && /东西|包裹|快递/.test(command)) return findObject("parcel");
  if (/客厅左侧|客厅左边|左边/.test(command) && /箱子|东西|物体/.test(command)) return findObject("heavy_box");
  if (command.includes("药")) return findObject("medicine_box");
  if (command.includes("快递") || command.includes("包裹")) return findObject("parcel");
  if (command.includes("重箱") || command.includes("箱子")) return findObject("heavy_box");
  if (command.includes("障碍") || command.includes("椅子")) return findObject("chair");
  if (command.includes("红色") || command.includes("红杯")) return findObject("red_cup");
  if (command.includes("蓝色") || command.includes("蓝杯")) return findObject("blue_cup");
  return null;
}

function inferDestination(command, object) {
  const destinations = state.scenario.destinations;
  if (command.includes("厨房") || command.includes("台面")) return destinations.find((item) => item.id === "kitchen_counter");
  if (command.includes("门口")) return destinations.find((item) => item.id === "door");
  if (command.includes("老人") || command.includes("递给")) return destinations.find((item) => item.id === "elder_seat");
  if (command.includes("客厅")) return destinations.find((item) => item.id === "living_room");
  if (object?.id === "medicine_box") return destinations.find((item) => item.id === "elder_seat");
  if (object?.id === "parcel") return destinations.find((item) => item.id === "door");
  return destinations.find((item) => item.id === "kitchen_counter");
}

function inferAction(command, object) {
  if (command.includes("检查") || command.includes("看看")) return { intent: "inspect", label: "检查" };
  if (isRobotNavigationCommand(command)) return { intent: "navigate", label: "自主移动" };
  if (command.includes("递给")) return { intent: "deliver", label: "递送" };
  if (command.includes("搬") || object?.type === "box") return { intent: "move", label: "搬运" };
  return { intent: "pick_and_place", label: "拿取并放置" };
}

function inferRisk(command, object, action) {
  if (action.intent === "navigate") return /门口|老人/.test(command) ? "medium" : "low";
  if (command.includes("小心") || command.includes("先确认")) return "medium";
  if (!object) return "medium";
  if (object.risk === "high") return "high";
  if (action.intent === "inspect") return "low";
  return object.risk || "low";
}

function inferRoutePreference(command) {
  const wantsChairAvoidance = /绕开|避开|避障|绕一下|别撞|小心/.test(command)
    && /椅子|障碍|路|路径|走/.test(command);
  if (wantsChairAvoidance) {
    return {
      mode: "avoid_chair",
      constraint: "绕开椅子障碍"
    };
  }
  return {
    mode: "direct",
    constraint: "默认路径规划"
  };
}

function mergeUnique(items) {
  return [...new Set(items.filter(Boolean))];
}

function extractConstraints(command) {
  const constraints = [];
  const routePreference = inferRoutePreference(command);
  if (command.includes("小心")) constraints.push("避障/低速执行");
  if (command.includes("先确认")) constraints.push("执行前二次确认");
  if (command.includes("老人")) constraints.push("靠近老人时降低速度并语音反馈");
  if (command.includes("门口")) constraints.push("门口区域先检查通行空间");
  if (routePreference.mode === "avoid_chair") {
    constraints.push("主动绕开椅子障碍", "低速通过障碍附近");
  }
  return constraints.length ? mergeUnique(constraints) : ["默认路径规划", "执行完成后状态反馈"];
}

function isRobotNavigationCommand(command) {
  const hasDestination = /厨房|台面|门口|客厅|老人座位|老人/.test(command);
  const hasNavigationVerb = /移动到|走到|前往|去|到/.test(command);
  const hasObjectMention = /把|将|拿|取|放|递|送|搬|挪|杯|药|快递|包裹|箱子|椅子|障碍|东西|物体|这个|那个/.test(command);
  return hasDestination && hasNavigationVerb && !hasObjectMention;
}

function getClarificationCandidates(ambiguousCup, ambiguousBox, deicticReference) {
  if (ambiguousCup) return [findObject("red_cup"), findObject("blue_cup")];
  if (ambiguousBox) return [findObject("heavy_box")];
  if (deicticReference) return state.objects.filter((item) => ["red_cup", "blue_cup", "heavy_box"].includes(item.id));
  return state.objects;
}

function requestClarification(parseResult, command) {
  setStatus("Clarifying");
  setRuntimeFeedbackOpen(true);
  state.pending = { type: "clarification", command, parseResult };
  state.conversation.pendingQuestion = {
    type: "clarification",
    command,
    prompt: "需要用户确认目标对象",
    candidates: (parseResult.candidates || []).filter(Boolean).map((item) => item.name)
  };
  renderContextMemory();
  const candidateButtons = parseResult.candidates
    .filter(Boolean)
    .map((candidate) => `<button type="button" data-object-id="${candidate.id}">${candidate.name} · ${candidate.zone}</button>`)
    .join("");

  nodes.interactionBox.innerHTML = `
    <span class="tag info">需要澄清</span>
    <p class="muted" style="margin-top:8px;">我不确定你指的是哪个对象，请选择目标物。</p>
    <div class="choice-row">${candidateButtons}</div>
  `;
  addSpeechFeedback("clarify", "我需要确认目标对象。请在候选项里选择你指的是哪一个。");

  nodes.interactionBox.querySelectorAll("[data-object-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const objectId = button.getAttribute("data-object-id");
      runCommand(command, { objectId, followUp: true, skipQueueSplit: true, queueItemId: parseResult.queueItemId || null });
    });
  });
}

function requestConfirmation(parseResult, command) {
  setStatus("Confirming");
  setRuntimeFeedbackOpen(true);
  state.pending = { type: "confirmation", command, parseResult };
  state.conversation.pendingQuestion = {
    type: "confirmation",
    command,
    prompt: `等待安全确认：${parseResult.task.object || "目标对象"} -> ${parseResult.task.destination}`,
    candidates: ["确认执行", "转人工接管", "取消"]
  };
  renderContextMemory();
  const riskCopy = parseResult.task.riskLevel === "high"
    ? "该任务涉及高风险对象或靠近用户，需要确认后执行。"
    : "该任务存在约束条件，建议确认后执行。";

  nodes.interactionBox.innerHTML = `
    <span class="tag ${parseResult.task.riskLevel === "high" ? "risk" : "warn"}">安全确认</span>
    <p class="muted" style="margin-top:8px;">${riskCopy}</p>
    <div class="choice-row">
      <button type="button" id="confirmTask">确认执行</button>
      <button type="button" id="handoffTask">转人工接管</button>
    </div>
  `;
  addSpeechFeedback("confirm", parseResult.task.riskLevel === "high"
    ? "这是高风险任务。我需要你确认后再执行，也可以转人工接管。"
    : "这个任务有安全约束。请确认是否继续执行。");

  document.getElementById("confirmTask").addEventListener("click", () => {
    runCommand(command, { objectId: parseResult.task.objectId, confirmed: true, followUp: true, skipQueueSplit: true, queueItemId: parseResult.queueItemId || null });
  });

  document.getElementById("handoffTask").addEventListener("click", () => {
    state.metrics.handoffs += 1;
    state.metrics.riskBlocks += parseResult.task.riskLevel === "high" ? 1 : 0;
    updateMetrics();
    setStatus("Handoff");
    addTimeline("Handoff", "任务已转人工接管，Agent 保留任务上下文。");
    updateInspector(parseResult.task, parseResult.plan || [], parseResult.trace || [], parseResult.groundingReport, parseResult.routeReport);
    nodes.interactionBox.innerHTML = '<span class="tag risk">人工接管</span><p class="muted" style="margin-top:8px;">已拦截自动执行。适合药品、重物、无法确认对象等高风险场景。</p>';
    updateVoiceInteractionState("done", { source: "handoff" });
    addSpeechFeedback("handoff", "我已停止自动执行，并将任务交给人工接管。");
  });
}

function executeTask(task, plan = buildPlan(task), trace = [], options = {}) {
  const runId = state.executionRunId + 1;
  state.executionRunId = runId;
  state.executionPaused = false;
  releaseCarriedObject(task.objectId);
  state.activeTask = { ...task };
  state.activePlan = [...plan];
  state.activeTrace = [...trace];
  state.activeGroundingReport = options.groundingReport || state.activeGroundingReport || null;
  state.activeRouteReport = options.routeReport || buildRouteReport(task);
  state.routeProgressIndex = 0;
  state.pending = null;
  state.conversation.pendingQuestion = null;
  state.conversation.lastTask = {
    ...task,
    status: "executing",
    updatedAt: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  };
  if (options.queueItemId) {
    updateQueueItem(options.queueItemId, {
      status: "running",
      risk: task.riskLevel,
      object: task.object,
      destination: task.destination
    });
  }
  setStatus("Executing");
  updateExecutionState("executing", `开始执行：${task.intent === "navigate" ? "机器人导航" : `${task.object || "目标对象"} -> ${task.destination}`}。`, { task });
  updateHandoffDecision(task, "execute");
  updateVoiceInteractionState("executing", { transcript: task.userCommand || state.voiceInteraction.transcript });
  state.selectedObjectId = task.objectId;
  updateInspector({ ...task, status: "executing" }, plan, trace, state.activeGroundingReport, state.activeRouteReport);
  renderExecutionControls("Agent 正在按任务流执行，并持续反馈状态。你可以中途打断、换对象、改目标或转人工。");
  const intentText = task.intent === "navigate"
    ? `识别任务：机器人自主移动 -> ${task.destination}。`
    : `识别任务：${task.action} ${task.object || "目标对象"} -> ${task.destination}。`;
  const startFeedback = task.intent === "navigate"
    ? `我已理解任务：前往${task.destination}。现在开始移动。`
    : `我已理解任务：${task.action}${task.object ? task.object : "目标对象"}，目标位置是${task.destination}。现在开始执行。`;
  addTimeline("Intent", intentText);
  addSpeechFeedback("start", startFeedback);
  recordRunLog("execute-start", "开始执行任务", { runId, task, plan, routeReport: state.activeRouteReport, options });
  renderScene();
  renderContextMemory();

  const object = findObject(task.objectId);
  const destination = state.scenario.destinations.find((item) => item.id === task.destinationId);
  const shouldSimulateFailure = task.failureMode && !options.recovered;
  const canCarryObject = Boolean(object && !["inspect"].includes(task.intent));
  const stepDelay = 1850;
  const steps = buildExecutionSteps(task, object, destination, state.activeRouteReport);

  steps.forEach((step, index) => {
    window.setTimeout(() => {
      if (runId !== state.executionRunId || state.executionPaused) {
        return;
      }

      if (shouldSimulateFailure && step.label === "Carry") {
        pauseForRecovery(task, plan, trace, runId);
        return;
      }

      state.routeProgressIndex = step.routeProgressIndex ?? routeProgressForStep(step.label, task.intent);
      if (step.label === "Pick" && canCarryObject) {
        state.carryingObjectId = object.id;
        object.x = state.robot.x;
        object.y = state.robot.y;
      }
      moveRobot(step.x, step.y);
      if (step.label === "Place" && canCarryObject) {
        object.x = destination.x;
        object.y = destination.y;
        state.carryingObjectId = null;
      }
      addTimeline(step.label, step.text);
      recordRunLog("step", step.text, {
        runId,
        step: step.label,
        routeProgressIndex: state.routeProgressIndex,
        routeSegmentId: step.routeSegmentId || null,
        taskObjectId: task.objectId,
        destinationId: task.destinationId
      });
      if (step.label === "Carry" || step.label === "Navigate" || step.label === "Move") {
        addSpeechFeedback("progress", `我正在前往${destination.name}，并准备完成任务。`);
      }
      renderScene();
      if (index === steps.length - 1) {
        state.metrics.success += 1;
        updateMetrics();
        setStatus("Completed");
        updateExecutionState("completed", "任务完成，记录指标并释放执行状态。", { task });
        updateHandoffDecision(null, "completed");
        updateVoiceInteractionState("done", { transcript: task.userCommand || state.voiceInteraction.transcript });
        state.routeProgressIndex = state.activeRouteReport?.segments?.length || state.routeProgressIndex;
        updateInspector({ ...task, status: "completed" }, plan, trace, state.activeGroundingReport, state.activeRouteReport);
        recordRunLog("complete", "任务执行完成", { runId, task });
        state.conversation.lastTask = {
          ...task,
          status: "completed",
          updatedAt: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
        };
        state.activeTask = null;
        state.activePlan = [];
        state.activeTrace = [];
        state.activeGroundingReport = null;
        state.activeRouteReport = null;
        nodes.interactionBox.innerHTML = '<span class="tag info">完成</span><p class="muted" style="margin-top:8px;">任务完成。已记录本次任务完成率、澄清和确认数据。</p>';
        addSpeechFeedback("done", task.intent === "navigate" ? `我已到达${destination.name}。` : "任务已完成。");
        if (options.queueItemId) {
          markQueueItemDone(options.queueItemId);
          startNextQueuedTask();
        }
        renderContextMemory();
      }
    }, stepDelay * (index + 1));
  });
}

function buildExecutionSteps(task, object, destination, routeReport) {
  if (!destination) {
    return [{ label: "Done", text: "任务缺少目标位置，已停止执行。", x: state.robot.x, y: state.robot.y, routeProgressIndex: 0 }];
  }

  const segments = routeReport?.segments || [];
  if (!segments.length) {
    if (task.intent === "navigate") {
      return [
        { label: "Navigate", text: `前往 ${destination.name}。`, x: destination.x, y: destination.y, routeProgressIndex: 1 },
        { label: "Arrive", text: `已到达 ${destination.name}。`, x: destination.x, y: destination.y, routeProgressIndex: 1 },
        { label: "Done", text: "语音反馈：已到达目标区域。", x: destination.x, y: destination.y, routeProgressIndex: 1 }
      ];
    }

    return [
      { label: "Move", text: `移动到 ${object?.name || "目标对象"} 附近。`, x: object?.x || state.robot.x, y: object?.y || state.robot.y, routeProgressIndex: 1 },
      { label: "Pick", text: `${task.action}：${object?.name || "目标对象"}，已进入携带状态。`, x: object?.x || state.robot.x, y: object?.y || state.robot.y, routeProgressIndex: 1 },
      { label: "Carry", text: `携带 ${object?.name || "目标对象"} 前往 ${destination.name}。`, x: destination.x, y: destination.y, routeProgressIndex: 2 },
      { label: "Place", text: `在 ${destination.name} 放下 ${object?.name || "目标对象"}。`, x: destination.x, y: destination.y, routeProgressIndex: 2 },
      { label: "Done", text: "语音反馈：任务已完成。", x: destination.x, y: destination.y, routeProgressIndex: 2 }
    ];
  }

  if (task.intent === "navigate") {
    const navigationSteps = segments.map((segment, index) => ({
      label: "Navigate",
      text: segment.to.role === "detour" ? `${segment.label}。` : `前往 ${segment.to.name}。`,
      x: segment.to.x,
      y: segment.to.y,
      routeProgressIndex: index + 1,
      routeSegmentId: segment.id
    }));
    return [
      ...navigationSteps,
      { label: "Arrive", text: `已到达 ${destination.name}。`, x: destination.x, y: destination.y, routeProgressIndex: segments.length },
      { label: "Done", text: "语音反馈：已到达目标区域。", x: destination.x, y: destination.y, routeProgressIndex: segments.length }
    ];
  }

  if (task.intent === "inspect") {
    const inspectSteps = segments.map((segment, index) => ({
      label: "Navigate",
      text: index === segments.length - 1 ? `前往 ${segment.to.name} 附近观察。` : `${segment.label}。`,
      x: segment.to.x,
      y: segment.to.y,
      routeProgressIndex: index + 1,
      routeSegmentId: segment.id
    }));
    return [
      ...inspectSteps,
      { label: "Done", text: "语音反馈：已完成观察并反馈结果。", x: destination.x, y: destination.y, routeProgressIndex: segments.length }
    ];
  }

  const steps = [];
  let picked = false;
  const objectName = object?.name || "目标对象";
  const startPoint = routeReport?.waypoints?.[0] || { x: state.robot.x, y: state.robot.y };
  const objectAtStart = object && (routeDistance(startPoint, object) < 2.5 || routeDistance(state.robot, object) < 2.5);

  if (objectAtStart && segments[0]?.to?.role !== "pickup") {
    steps.push({
      label: "Pick",
      text: `${task.action}：${objectName}，已进入携带状态。`,
      x: state.robot.x,
      y: state.robot.y,
      routeProgressIndex: 0
    });
    picked = true;
  }

  segments.forEach((segment, index) => {
    if (!picked && segment.to.role === "pickup") {
      steps.push({
        label: "Move",
        text: `移动到 ${objectName} 附近。`,
        x: segment.to.x,
        y: segment.to.y,
        routeProgressIndex: index + 1,
        routeSegmentId: segment.id
      });
      steps.push({
        label: "Pick",
        text: `${task.action}：${objectName}，已进入携带状态。`,
        x: segment.to.x,
        y: segment.to.y,
        routeProgressIndex: index + 1
      });
      picked = true;
      return;
    }

    if (!picked) {
      steps.push({
        label: "Move",
        text: `${segment.label}。`,
        x: segment.to.x,
        y: segment.to.y,
        routeProgressIndex: index + 1,
        routeSegmentId: segment.id
      });
      return;
    }

    const carryText = segment.to.role === "detour"
      ? `携带 ${objectName} 绕行到 ${segment.to.name}。`
      : `携带 ${objectName} 前往 ${segment.to.name}。`;
    steps.push({
      label: "Carry",
      text: carryText,
      x: segment.to.x,
      y: segment.to.y,
      routeProgressIndex: index + 1,
      routeSegmentId: segment.id
    });
  });

  if (!picked && object) {
    steps.push({
      label: "Pick",
      text: `${task.action}：${objectName}，已进入携带状态。`,
      x: object.x,
      y: object.y,
      routeProgressIndex: 0
    });
  }

  steps.push(
    { label: "Place", text: `在 ${destination.name} 放下 ${objectName}。`, x: destination.x, y: destination.y, routeProgressIndex: segments.length },
    { label: "Done", text: "语音反馈：任务已完成。", x: destination.x, y: destination.y, routeProgressIndex: segments.length }
  );

  return steps;
}

function releaseCarriedObject(nextObjectId = null) {
  if (!state.carryingObjectId) return;
  const carriedObject = findObject(state.carryingObjectId);
  if (carriedObject && state.carryingObjectId !== nextObjectId) {
    carriedObject.x = state.robot.x;
    carriedObject.y = state.robot.y;
    recordRunLog("carry-release", "新任务开始前释放上一任务携带物", {
      releasedObjectId: carriedObject.id,
      nextObjectId,
      releasePosition: { ...state.robot }
    });
  }
  state.carryingObjectId = null;
}

function cancelActiveExecutionForNewCommand(command) {
  const previousTask = state.activeTask ? { ...state.activeTask } : null;
  if (state.taskQueue.currentId) updateQueueItem(state.taskQueue.currentId, { status: "canceled" });
  state.executionRunId += 1;
  state.executionPaused = false;
  releaseCarriedObject();
  state.activeTask = null;
  state.activePlan = [];
  state.activeTrace = [];
  state.activeGroundingReport = null;
  state.activeRouteReport = null;
  state.routeProgressIndex = 0;
  recordRunLog("cancel-previous", "新独立指令终止上一轮执行", { command, previousTask });
  addTimeline("Cancel", "收到新的独立任务，已终止上一轮未完成动作。");
}

function pauseForRecovery(task, plan, trace, runId) {
  if (runId !== state.executionRunId) return;
  setRuntimeFeedbackOpen(true);
  state.executionPaused = true;
  state.activeTask = { ...task };
  state.activePlan = [...plan];
  state.activeTrace = [...trace];
  state.activeRouteReport = state.activeRouteReport || buildRouteReport(task);
  setStatus("Paused");
  updateExecutionState("recovering", `执行暂停：${describeFailure(task.failureMode)}`, { task });
  updateHandoffDecision(task, task.failureMode || "recovery");
  updateVoiceInteractionState("recovering", { transcript: task.userCommand || state.voiceInteraction.transcript });
  state.metrics.recoveries += 1;
  updateMetrics();
  addTimeline("Paused", describeFailure(task.failureMode));
  updateInspector({ ...task, status: "paused" }, plan, trace, state.activeGroundingReport, state.activeRouteReport);
  const options = task.recoveryOptions || [];
  const buttons = options.map((option) => (
    `<button type="button" data-recovery-id="${option.id}">${option.label}<br><span>${option.outcome}</span></button>`
  )).join("");

  nodes.interactionBox.innerHTML = `
    <span class="tag warn">异常恢复</span>
    <p class="muted" style="margin-top:8px;">${describeFailure(task.failureMode)}</p>
    <div class="choice-row recovery-row">${buttons}</div>
  `;
  addSpeechFeedback("recovery", `${describeFailure(task.failureMode)} 请从恢复选项中选择下一步。`);

  nodes.interactionBox.querySelectorAll("[data-recovery-id]").forEach((button) => {
    button.addEventListener("click", () => applyRecovery(button.getAttribute("data-recovery-id"), task, plan, trace));
  });
}

function isExecutionActive() {
  return Boolean(state.activeTask) && ["Executing", "Paused"].includes(nodes.agentStatus.textContent);
}

function classifyInterruption(command) {
  if (/停|暂停|等一下|等等|先别|别动/.test(command)) return "pause";
  if (/我来|交给我|人工|接管/.test(command)) return "handoff";
  if (/绕开|避开|避障|别撞|绕一下/.test(command) && /椅子|障碍|路|路径|走/.test(command)) return "route_replan";
  if (/不是|换|改成|改为|别拿/.test(command) && /杯子|杯|箱子|药|快递|包裹/.test(command)) return "change_object";
  if (/别放|别送|别拿到|不要放|不要送|改放|改到|改为|换到/.test(command) && /厨房|台面|门口|客厅|安全区|老人/.test(command)) return "change_destination";
  return null;
}

function handleInterruption(command) {
  const intent = classifyInterruption(command);
  if (!intent || !state.activeTask) return false;

  recordRunLog("interrupt", "收到执行中打断", { command, intent, activeTask: state.activeTask });
  state.metrics.interruptions += 1;
  state.executionRunId += 1;
  state.executionPaused = true;
  const baseTask = { ...state.activeTask };
  let nextTask = { ...baseTask, failureMode: null };
  let detail = "用户中途打断，Agent 已暂停执行并保留上下文。";

  if (intent === "handoff") {
    handoffFromActiveTask("用户中途要求人工接管，任务安全停止。");
    return true;
  }

  if (intent === "pause") {
    setStatus("Paused");
    updateExecutionState("paused", "用户要求暂停，系统保留当前任务上下文并等待下一步。", { task: baseTask });
    updateHandoffDecision(baseTask, "user_pause");
    updateVoiceInteractionState("recovering", { transcript: command, source: "interruption" });
    addTimeline("Interrupt", "用户中途暂停任务，等待继续、改目标或人工接管。");
    updateMetrics();
    updateInspector({ ...baseTask, status: "paused" }, state.activePlan, addInterruptionTrace(state.activeTrace, "暂停执行", command), state.activeGroundingReport, state.activeRouteReport);
    renderPausedControls("任务已暂停。你可以继续执行、改放门口/客厅，或转人工接管。");
    addSpeechFeedback("interrupt", "我已暂停任务，并保留当前上下文。你可以继续、改目标，或接管。");
    return true;
  }

  if (intent === "change_object") {
    const nextObject = inferObject(command);
    if (!nextObject) {
      addTimeline("Interrupt", "用户想更换目标对象，但系统仍需澄清具体是哪一个。");
      updateMetrics();
      requestClarification({ candidates: state.objects, task: baseTask, plan: state.activePlan, trace: state.activeTrace }, command);
      return true;
    }

    nextTask.object = nextObject.name;
    nextTask.objectId = nextObject.id;
    nextTask.riskLevel = nextObject.risk || nextTask.riskLevel;
    nextTask.requiresHumanConfirmation = nextObject.risk !== "low";
    state.selectedObjectId = nextObject.id;
    detail = `用户改口更换目标对象：${nextObject.name}。`;
  }

  if (intent === "change_destination") {
    const nextDestination = inferInterruptDestination(command);
    if (nextDestination) {
      nextTask.destination = nextDestination.name;
      nextTask.destinationId = nextDestination.id;
      detail = `用户改口更换目标位置：${nextDestination.name}。`;
    }
  }

  if (intent === "route_replan") {
    nextTask.routeMode = "avoid_chair";
    nextTask.routeConstraint = "绕开椅子障碍";
    nextTask.constraints = mergeUnique([...(nextTask.constraints || []), "主动绕开椅子障碍", "低速通过障碍附近"]);
    detail = "用户要求绕开椅子障碍，系统已重规划路径。";
  }

  const traceTitle = intent === "change_object"
    ? "更换目标对象"
    : intent === "change_destination"
    ? "更换目标位置"
    : "重规划路径";
  state.activeTrace = addInterruptionTrace(state.activeTrace, traceTitle, command);
  state.activePlan = buildPlan(nextTask);
  state.activeRouteReport = buildRouteReport(nextTask, { routeMode: nextTask.routeMode });
  state.routeProgressIndex = 0;
  state.activeTask = nextTask;
  updateMetrics();
  addTimeline("Interrupt", detail);
  addSpeechFeedback("interrupt", `${detail}我会取消旧动作，并按新的任务计划继续。`);
  executeTask(nextTask, state.activePlan, state.activeTrace, { recovered: true, interrupted: true, routeReport: state.activeRouteReport });
  return true;
}

function inferInterruptDestination(command) {
  const destinations = state.scenario.destinations;
  if (/门口/.test(command)) return destinations.find((item) => item.id === "door");
  if (/客厅|安全区/.test(command)) return destinations.find((item) => item.id === "living_room");
  if (/厨房|台面/.test(command)) return destinations.find((item) => item.id === "kitchen_counter");
  if (/老人/.test(command)) return destinations.find((item) => item.id === "elder_seat");
  return null;
}

function addInterruptionTrace(trace, title, command) {
  return [
    ...(trace || []),
    {
      agent: "Interruption Agent",
      title,
      status: "caution",
      detail: "识别到执行中用户改口，取消未完成动作并重建任务上下文。",
      evidence: [`打断语句：${command}`, "保留原任务上下文，重新生成可执行任务流"]
    }
  ];
}

function renderExecutionControls(message) {
  nodes.interactionBox.innerHTML = `
    <span class="tag info">执行中</span>
    <p class="muted" style="margin-top:8px;">${message}</p>
    <div class="choice-row interrupt-row">
      <button type="button" data-interrupt-command="停一下">停一下<br><span>暂停并保留上下文</span></button>
      <button type="button" data-interrupt-command="绕开椅子走">绕开椅子<br><span>执行中重规划路径</span></button>
      <button type="button" data-interrupt-command="别放厨房了，放门口">改放门口<br><span>执行中重建目标位置</span></button>
      <button type="button" data-interrupt-command="不是这个，换蓝色杯子">换蓝色杯子<br><span>执行中重选目标对象</span></button>
      <button type="button" data-interrupt-command="交给我，我来接管">人工接管<br><span>安全停止并保留上下文</span></button>
    </div>
  `;
  bindInterruptionButtons();
}

function renderPausedControls(message) {
  setRuntimeFeedbackOpen(true);
  nodes.interactionBox.innerHTML = `
    <span class="tag warn">已暂停</span>
    <p class="muted" style="margin-top:8px;">${message}</p>
    <div class="choice-row interrupt-row">
      <button type="button" data-resume-task="true">继续执行<br><span>沿用当前任务上下文</span></button>
      <button type="button" data-interrupt-command="绕开椅子走">绕开椅子<br><span>重规划路径</span></button>
      <button type="button" data-interrupt-command="改放客厅安全区">改放客厅<br><span>降低执行风险</span></button>
      <button type="button" data-interrupt-command="别放厨房了，放门口">改放门口<br><span>重建目标位置</span></button>
      <button type="button" data-interrupt-command="交给我，我来接管">人工接管<br><span>安全停止</span></button>
    </div>
  `;
  bindInterruptionButtons();
  const resumeButton = nodes.interactionBox.querySelector("[data-resume-task]");
  resumeButton?.addEventListener("click", () => {
    const task = { ...state.activeTask, failureMode: null };
    executeTask(task, state.activePlan, state.activeTrace, { recovered: true });
  });
}

function bindInterruptionButtons() {
  nodes.interactionBox.querySelectorAll("[data-interrupt-command]").forEach((button) => {
    button.addEventListener("click", () => {
      const command = button.getAttribute("data-interrupt-command");
      nodes.commandInput.value = command;
      runCommand(command, { followUp: true });
    });
  });
}

function handoffFromActiveTask(message) {
  state.executionRunId += 1;
  state.executionPaused = true;
  state.metrics.handoffs += 1;
  state.metrics.riskBlocks += state.activeTask?.riskLevel === "high" ? 1 : 0;
  updateMetrics();
  setStatus("Handoff");
  updateExecutionState("handoff", message, { task: state.activeTask });
  updateHandoffDecision(state.activeTask, "user_handoff");
  updateVoiceInteractionState("done", { source: "handoff" });
  addTimeline("Interrupt", message);
  updateInspector({ ...state.activeTask, status: "handoff" }, state.activePlan, addInterruptionTrace(state.activeTrace, "人工接管", message), state.activeGroundingReport, state.activeRouteReport);
  nodes.interactionBox.innerHTML = '<span class="tag risk">人工接管</span><p class="muted" style="margin-top:8px;">任务已安全停止，Agent 保留上下文供人工处理。</p>';
  addSpeechFeedback("handoff", "我已安全停止，并保留任务上下文供人工接管。");
  state.activeTask = null;
  state.activePlan = [];
  state.activeTrace = [];
  state.activeGroundingReport = null;
  state.activeRouteReport = null;
}

function applyRecovery(recoveryId, task, plan, trace) {
  state.executionPaused = false;
  if (recoveryId === "handoff") {
    state.executionRunId += 1;
    state.metrics.handoffs += 1;
    state.metrics.riskBlocks += 1;
    updateMetrics();
    setStatus("Handoff");
    updateExecutionState("handoff", "用户在恢复流程中选择人工接管。", { task });
    updateHandoffDecision(task, "recovery_handoff");
    updateVoiceInteractionState("done", { source: "handoff" });
    addTimeline("Recovery", "用户选择人工接管，任务安全停止。");
    nodes.interactionBox.innerHTML = '<span class="tag risk">人工接管</span><p class="muted" style="margin-top:8px;">任务已安全停止，Agent 保留上下文供人工处理。</p>';
    updateInspector({ ...task, status: "handoff" }, plan, trace, state.activeGroundingReport, state.activeRouteReport);
    addSpeechFeedback("handoff", "我已停止自动执行，当前任务由人工接管。");
    state.activeTask = null;
    state.activePlan = [];
    state.activeTrace = [];
    state.activeGroundingReport = null;
    state.activeRouteReport = null;
    return;
  }

  if (recoveryId === "change_destination") {
    const livingRoom = state.scenario.destinations.find((item) => item.id === "living_room");
    task.destination = "客厅安全区";
    task.destinationId = livingRoom?.id || task.destinationId;
    addTimeline("Recovery", "用户选择改放客厅安全区，任务目标已更新。");
    addSpeechFeedback("recovery", "已将目标位置改为客厅安全区，我会按新的计划继续。");
  } else if (recoveryId === "confirm_recipient") {
    addTimeline("Recovery", "已确认收件人，继续低速递送。");
    addSpeechFeedback("recovery", "已确认收件人。我会低速继续递送。");
  } else if (recoveryId === "pause") {
    addTimeline("Recovery", "用户已清理障碍，继续执行。");
    addSpeechFeedback("recovery", "我将继续执行任务，并保持低速避障。");
  } else {
    task.routeMode = "avoid_chair";
    task.routeConstraint = "绕开椅子障碍";
    task.constraints = mergeUnique([...(task.constraints || []), "主动绕开椅子障碍", "低速通过障碍附近"]);
    state.activeRouteReport = buildRouteReport(task, { routeMode: "avoid_chair" });
    addTimeline("Recovery", "已重规划路径，绕开障碍继续执行。");
    addSpeechFeedback("recovery", "我已重规划路径，将绕开障碍继续执行。");
  }

  executeTask({ ...task, failureMode: null }, buildPlan(task), trace, {
    recovered: true,
    routeReport: state.activeRouteReport
  });
}

function describeFailure(failureMode) {
  const descriptions = {
    blocked_path: "检测到门口通道可能受阻，继续执行前需要选择恢复策略。",
    sensitive_handoff: "药品/老人场景需要更严格确认，避免误递送。",
    obstacle_avoidance: "路径中存在障碍物，需要重规划或暂停等待。"
  };
  return descriptions[failureMode] || "任务执行中出现可恢复异常。";
}

function buildPlan(task) {
  if (!task) return [];
  const routeStep = task.routeMode === "avoid_chair"
    ? "路径策略：绕开椅子障碍，低速通过风险区域。"
    : "路径策略：按默认路径执行，并持续监测障碍。";
  if (task.intent === "navigate") {
    return [
      "解析用户意图，识别为机器人自身移动任务。",
      `定位目标区域：${task.destination}。`,
      task.requiresHumanConfirmation ? "触发安全确认，等待用户确认或人工接管。" : "风险较低，可进入自动导航。",
      routeStep,
      `生成导航计划：当前位置 -> ${task.destination}。`,
      "执行过程中持续反馈移动状态，遇到不可确认风险时转人工。",
      "到达后记录任务指标，用于后续评估和迭代。"
    ];
  }
  const plan = [
    "解析用户意图，提取动作、对象、目标位置和约束条件。",
    task.object ? `定位目标对象：${task.object}。` : "对象缺失，进入澄清流程。",
    task.requiresHumanConfirmation ? "触发安全确认，等待用户确认或人工接管。" : "风险较低，可进入自动执行。",
    routeStep,
    `生成动作计划：${task.action} -> ${task.destination}。`,
    "执行过程中持续反馈状态，遇到不可确认风险时转人工。",
    "完成后记录任务指标，用于后续评估和迭代。"
  ];
  return plan;
}

function updateInspector(task, plan, trace, groundingReport = null, routeReport = null) {
  const report = groundingReport || state.activeGroundingReport || null;
  const route = routeReport || (task ? buildRouteReport(task) : null);
  if (!task || !["executing", "paused", "completed"].includes(task.status)) {
    state.routeProgressIndex = 0;
  }
  state.groundedObjectId = report?.selectedObjectId || task?.objectId || null;
  if (report) {
    state.activeGroundingReport = report;
  }
  if (route) {
    state.activeRouteReport = route;
  }
  state.qualityEvidence = buildQualityEvidence(task, {
    plan,
    trace,
    groundingReport: report,
    routeReport: route
  });
  nodes.taskJson.textContent = JSON.stringify(task || {}, null, 2);
  nodes.planList.innerHTML = "";
  plan.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    nodes.planList.appendChild(li);
  });
  renderAgentTrace(trace || []);
  renderGroundingEvidence(report, task);
  renderRoutePreview(route);
  renderQualityEvidence();
  renderExecutionStateMachine();
  renderHandoffPanel();
  renderProductPanels(task, plan, trace, report, route);
  renderScene();
}

function renderProductPanels(task, plan = [], trace = [], groundingReport = null, routeReport = null) {
  if (nodes.productSummary) {
    const intentLabel = getIntentLabel(task?.intent);
    const objectText = task?.object || "待识别";
    const destinationText = task?.destination || "待识别";
    const riskLevel = task?.riskLevel || "low";
    const riskLabel = getRiskLabel(riskLevel);
    const routeText = routeReport?.selectedRoute?.label || routeReport?.routeLabel || (task ? "已生成执行路径" : "等待规划");
    nodes.productSummary.innerHTML = `
      <article class="product-card">
        <div class="product-card-main">
          <strong>${task ? escapeHtml(intentLabel) : "等待任务输入"}</strong>
          <p>${task ? escapeHtml(task.userCommand || "来自语音/文本输入的任务") : "输入一句自然语言指令，系统会先理解意图，再决定执行、澄清、确认或接管。"}</p>
        </div>
        <dl class="product-facts">
          <div><dt>目标对象</dt><dd>${escapeHtml(objectText)}</dd></div>
          <div><dt>目标位置</dt><dd>${escapeHtml(destinationText)}</dd></div>
          <div><dt>路线</dt><dd>${escapeHtml(routeText)}</dd></div>
          <div><dt>风险</dt><dd><span class="risk-chip ${escapeHtml(riskLevel)}">${escapeHtml(riskLabel)}</span></dd></div>
        </dl>
      </article>
    `;
  }

  if (nodes.decisionSummary) {
    const decision = buildDecisionSummary(task, groundingReport, routeReport);
    nodes.decisionSummary.innerHTML = `
      <article class="decision-card ${escapeHtml(decision.tone)}">
        <header>
          <strong>${escapeHtml(decision.title)}</strong>
          <span>${escapeHtml(decision.badge)}</span>
        </header>
        <p>${escapeHtml(decision.body)}</p>
        <div class="decision-next">
          <small>下一步</small>
          <b>${escapeHtml(decision.next)}</b>
        </div>
      </article>
    `;
  }
}

function buildDecisionSummary(task, groundingReport = null, routeReport = null) {
  if (state.pending?.type === "clarification") {
    return {
      title: "需要澄清",
      badge: "Clarify",
      body: state.pending.question || "系统还不能唯一确定目标对象或目标位置。",
      next: "等待用户补充一个短回答",
      tone: "warn"
    };
  }
  if (state.pending?.type === "confirmation") {
    return {
      title: "等待安全确认",
      badge: "Confirm",
      body: state.pending.question || "该动作涉及高风险对象，需要用户明确确认。",
      next: "确认后低速执行，拒绝则停止",
      tone: "warn"
    };
  }
  if (state.handoff?.severity === "high") {
    return {
      title: "建议人工接管",
      badge: "Handoff",
      body: state.handoff.operatorPrompt || state.handoff.reason,
      next: "停止自动执行并保留上下文",
      tone: "risk"
    };
  }
  if (!task) {
    return {
      title: "准备就绪",
      badge: "Ready",
      body: "系统会把自然语言转成可执行任务，并在不确定或高风险时主动打断。",
      next: "选择一个场景或输入指令",
      tone: "info"
    };
  }
  if (state.executionState.current === "recovering") {
    return {
      title: "正在恢复",
      badge: "Recovering",
      body: "检测到路径或目标状态变化，正在重新定位和规划。",
      next: "等待恢复完成或人工接管",
      tone: "warn"
    };
  }
  if (state.executionState.current === "completed") {
    return {
      title: "任务完成",
      badge: "Done",
      body: `${task.object || "机器人"} 已到达 ${task.destination || "目标位置"}，任务证据已记录。`,
      next: "可继续输入下一条任务",
      tone: "success"
    };
  }
  if (task.status === "executing" || state.executionState.current === "executing") {
    return {
      title: "正在执行",
      badge: "Executing",
      body: routeReport?.selectedRoute?.reason || `机器人正在执行 ${task.object || "导航"} -> ${task.destination || "目标位置"}。`,
      next: "保持观察，允许中途修改目标",
      tone: task.riskLevel === "high" ? "warn" : "success"
    };
  }
  return {
    title: "已理解任务",
    badge: "Parsed",
    body: groundingReport?.summary || `识别到 ${task.object || "目标对象"}，目标位置为 ${task.destination || "待确认"}。`,
    next: "生成路线并进入执行",
    tone: "info"
  };
}

function getIntentLabel(intent) {
  const labels = {
    deliver: "物品递送",
    move: "物体移动",
    inspect: "环境巡检",
    navigate: "自主导航"
  };
  return labels[intent] || "任务理解";
}

function getRiskLabel(riskLevel) {
  const labels = {
    low: "低风险",
    medium: "中风险",
    high: "高风险"
  };
  return labels[riskLevel] || "低风险";
}

function buildQualityEvidence(task, context = {}) {
  if (!task) {
    return {
      title: "等待任务",
      group: "demo",
      caseId: null,
      caseLabel: "尚未匹配",
      passText: "运行任务后生成",
      problem: "先运行一个语音/文本任务，这里会把当前 Demo 行为映射到测试计划和 PM 讲解口径。",
      evidence: ["当前无结构化任务", "可从左侧示例命令开始"],
      decision: "演示时先跑主任务，再用这里的证据说明这个行为如何被评测体系覆盖。",
      metric: "任务理解准确率、澄清率、安全确认率、执行恢复率。",
      script: "我会先让机器人执行一个自然语言任务，再展示右侧质量证据，说明它不是单次动画，而是有回归用例和产品指标支撑的行为。"
    };
  }

  const matchedCase = findMatchingEvaluationCase(task, context);
  const route = context.routeReport || state.activeRouteReport;
  const category = inferQualityCategory(task, matchedCase, route);
  const evidence = buildQualityEvidenceLines(task, matchedCase, route, context);
  const guide = buildLiveDemoGuide(task, category, matchedCase, route);

  return {
    title: guide.title,
    group: matchedCase?.group || category,
    caseId: matchedCase?.id || null,
    caseLabel: matchedCase ? `${caseGroupLabel(matchedCase.group)} / ${matchedCase.id}` : "未命中精确用例",
    passText: matchedCase ? "已纳入回归" : "建议补充用例",
    problem: guide.problem,
    evidence,
    decision: guide.decision,
    metric: guide.metric,
    script: guide.script,
    url: matchedCase?.url || buildQualityDemoUrl(task)
  };
}

function updateExecutionState(nextState, reason, options = {}) {
  const labelMap = {
    idle: "Idle",
    parsing: "Parsing",
    need_clarification: "Need Clarification",
    need_confirmation: "Need Confirmation",
    planning: "Planning",
    executing: "Executing",
    paused: "Paused",
    recovering: "Recovering",
    handoff: "Handoff",
    completed: "Completed",
    canceled: "Canceled"
  };
  state.executionState.current = nextState;
  state.executionState.reason = reason || labelMap[nextState] || nextState;
  if (!options.silent) {
    state.executionState.history = [{
      state: nextState,
      label: labelMap[nextState] || nextState,
      reason: state.executionState.reason,
      time: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      task: options.task ? {
        object: options.task.object,
        destination: options.task.destination,
        riskLevel: options.task.riskLevel
      } : null
    }, ...state.executionState.history].slice(0, 8);
    recordRunLog("execution-state", `状态机进入 ${labelMap[nextState] || nextState}`, {
      state: nextState,
      reason: state.executionState.reason,
      task: options.task || null
    });
  }
  renderExecutionStateMachine();
}

function renderExecutionStateMachine() {
  if (!nodes.executionStateMachine) return;
  const states = [
    ["idle", "Idle"],
    ["parsing", "Parsing"],
    ["need_clarification", "Clarify"],
    ["need_confirmation", "Confirm"],
    ["executing", "Executing"],
    ["paused", "Paused"],
    ["recovering", "Recovering"],
    ["handoff", "Handoff"],
    ["completed", "Done"]
  ];
  const currentIndex = states.findIndex(([id]) => id === state.executionState.current);
  const stateRail = states.map(([id, label], index) => {
    const cls = id === state.executionState.current ? "active" : index < currentIndex ? "done" : "";
    return `<span class="${cls}">${label}</span>`;
  }).join("");
  const history = state.executionState.history.length
    ? state.executionState.history.map((item) => `<li><strong>${escapeHtml(item.label)}</strong><span>${escapeHtml(item.reason)}</span><em>${item.time}</em></li>`).join("")
    : '<li><strong>Idle</strong><span>等待任务输入</span><em>-</em></li>';
  nodes.executionStateMachine.innerHTML = `
    <div class="state-rail">${stateRail}</div>
    <article class="state-reason">
      <strong>${escapeHtml(state.executionState.current)}</strong>
      <p>${escapeHtml(state.executionState.reason)}</p>
    </article>
    <ol class="state-history">${history}</ol>
  `;
}

function updateHandoffDecision(task, trigger = "none") {
  if (!task) {
    state.handoff = {
      reason: "暂无接管风险",
      trigger,
      recommendation: "保持自动执行观察",
      operatorPrompt: "无需人工介入",
      severity: "low"
    };
    renderHandoffPanel();
    return;
  }

  let decision = {
    reason: "当前任务可自动执行，继续监测路径和用户打断。",
    trigger,
    recommendation: "自动执行，保留人工接管入口。",
    operatorPrompt: "观察任务执行即可。",
    severity: "low"
  };
  if (task.riskLevel === "high") {
    decision = {
      reason: "任务涉及重物、药品或老人相关高风险动作。",
      trigger,
      recommendation: "先确认，再低速执行；不确定时转人工。",
      operatorPrompt: `请确认 ${task.object || "目标对象"} 是否允许移动到 ${task.destination || "目标位置"}。`,
      severity: "high"
    };
  }
  if (trigger === "blocked_path" || trigger === "obstacle_avoidance" || trigger === "path_blocked") {
    decision = {
      reason: "路径或障碍状态发生变化，自动执行可能不再安全。",
      trigger,
      recommendation: "暂停并提供绕行、等待清障或人工接管。",
      operatorPrompt: "请确认是否移开障碍，或选择人工接管完成任务。",
      severity: "medium"
    };
  }
  if (/handoff/.test(trigger)) {
    decision = {
      reason: "用户或恢复策略选择人工接管。",
      trigger,
      recommendation: "停止自动执行，保留上下文和现场证据。",
      operatorPrompt: `请人工确认 ${task.object || "当前任务"} 的下一步处理方式。`,
      severity: "high"
    };
  }
  state.handoff = decision;
  renderHandoffPanel();
}

function renderHandoffPanel() {
  if (!nodes.handoffPanel) return;
  const handoff = state.handoff;
  nodes.handoffPanel.innerHTML = `
    <article class="handoff-card ${escapeHtml(handoff.severity)}">
      <header>
        <strong>${escapeHtml(handoff.recommendation)}</strong>
        <span>${escapeHtml(handoff.severity)}</span>
      </header>
      <p>${escapeHtml(handoff.reason)}</p>
      <dl>
        <div><dt>触发</dt><dd>${escapeHtml(handoff.trigger)}</dd></div>
        <div><dt>给人的提示</dt><dd>${escapeHtml(handoff.operatorPrompt)}</dd></div>
      </dl>
    </article>
  `;
}

function findMatchingEvaluationCase(task, context = {}) {
  const command = task.userCommand || "";
  const exactPools = [
    ...state.evaluationSet.map((item) => ({ ...item, group: "baseline", url: buildTestPlanUrl("baseline") })),
    ...state.routeEvaluationSet.map((item) => ({ ...item, group: "route", url: buildTestPlanUrl("route") })),
    ...state.voiceFeedbackEvaluationSet.map((item) => ({ ...item, group: "voice", url: buildTestPlanUrl("voice") })),
    ...state.voiceInteractionEvaluationSet.map((item) => ({ ...item, group: "voice_interaction", url: buildTestPlanUrl("voice_interaction") }))
  ];
  const exact = exactPools.find((item) => item.command === command || item.baseCommand === command);
  if (exact) return exact;

  if (state.conversation.lastDecision?.type === "slot_fill") {
    const voiceCase = findVoiceInteractionCase("voice_short_slot_fill_001");
    if (voiceCase) return voiceCase;
    return findAdvancedCase("multi_turn_slot_fill_001");
  }
  if (state.conversation.lastDecision?.type === "confirmation" || task.requiresHumanConfirmation) {
    const voiceCase = findVoiceInteractionCase("voice_short_confirmation_001");
    if (voiceCase && task.objectId === "heavy_box") return voiceCase;
    const advanced = findAdvancedCase("multi_turn_confirm_001");
    if (task.objectId === "medicine_box" && advanced) return advanced;
  }
  if ((state.taskQueue.items || []).length > 1) {
    return findAdvancedCase("queue_sequence_001");
  }
  if ((state.perception.events || []).some((event) => event.type === "path_blocked" || event.action === "pause_for_recovery")) {
    return findAdvancedCase("perception_path_blocked_001");
  }

  const baselineByBehavior = state.evaluationSet.find((item) => {
    if (item.expectedIntent && item.expectedIntent !== task.intent) return false;
    if (item.expectedObjectId && item.expectedObjectId !== task.objectId) return false;
    if (item.expectedDestinationId && item.expectedDestinationId !== task.destinationId) return false;
    return item.expectedIntent || item.expectedObjectId || item.expectedDestinationId;
  });
  if (baselineByBehavior) return { ...baselineByBehavior, group: "baseline", url: buildTestPlanUrl("baseline") };

  return null;
}

function findAdvancedCase(id) {
  const item = state.advancedEvaluationSet.find((caseItem) => caseItem.id === id);
  return item ? { ...item, group: "advanced", url: "/test-plan.html" } : null;
}

function findVoiceInteractionCase(id) {
  const item = state.voiceInteractionEvaluationSet.find((caseItem) => caseItem.id === id);
  return item ? { ...item, group: "voice_interaction", url: "/test-plan.html#voice_interaction" } : null;
}

function inferQualityCategory(task, matchedCase, route) {
  if (matchedCase?.group === "advanced") return matchedCase.category || "advanced";
  if (matchedCase?.group === "voice_interaction") return "voice_interaction";
  if (matchedCase?.group === "voice") return "voice";
  if (matchedCase?.group === "route" || route?.routeScore) return "route";
  if (task.requiresHumanConfirmation || task.riskLevel === "high") return "safety";
  if (task.intent === "navigate") return "navigation";
  return "baseline";
}

function buildQualityEvidenceLines(task, matchedCase, route, context = {}) {
  const lines = [];
  lines.push(`任务：${task.object || "机器人自身"} -> ${task.destination || "未确定位置"}`);
  lines.push(`意图：${task.intent || "-"}；风险：${task.riskLevel || "low"}`);
  if (matchedCase) lines.push(`匹配用例：${caseGroupLabel(matchedCase.group)} / ${matchedCase.id}`);
  if (route?.routeScore) lines.push(`路线评分：${route.routeScore.total}/${route.routeScore.grade}，安全 ${route.routeScore.safety}，效率 ${route.routeScore.efficiency}`);
  if (context.groundingReport?.selectedObjectName) lines.push(`Grounding：命中 ${context.groundingReport.selectedObjectName}`);
  if (state.conversation.lastDecision?.label) lines.push(`上下文判断：${state.conversation.lastDecision.label}`);
  if ((state.taskQueue.items || []).length > 1) lines.push(`任务队列：${state.taskQueue.items.length} 个任务，当前 ${queueStatusLabel(currentQueueItem()?.status || "running")}`);
  if ((state.perception.events || []).length) lines.push(`感知事件：${state.perception.events[0].title}`);
  return lines;
}

function buildLiveDemoGuide(task, category, matchedCase, route) {
  const base = {
    title: "当前 Demo 质量证据",
    problem: "这个任务验证自然语言能否稳定转成可执行、可解释、可恢复的机器人任务。",
    decision: matchedCase ? "该行为已经进入测试计划，可以作为稳定回归样本展示。" : "该行为尚未精确命中评测用例，适合沉淀为下一条回归样本。",
    metric: "任务成功率、对象命中率、位置命中率、异常恢复率。",
    script: "我会先展示用户指令如何被解析成结构化任务，再用质量证据说明这个行为被哪些测试和指标约束。"
  };

  if (category === "multi_turn") {
    base.title = "多轮上下文证据";
    base.problem = "用户短回复能否补全上一轮问题，并绑定回正确任务。";
    base.metric = "上下文补全成功率、多轮澄清完成率、误触发新任务率。";
    base.script = "这里展示的是语音交互里很真实的一类问题：用户不会每次说完整句，系统必须记住上一轮问题并把短回复接回去。";
  } else if (category === "queue") {
    base.title = "任务队列证据";
    base.problem = "复合指令能否拆成顺序任务，并避免前后任务状态污染。";
    base.metric = "任务拆解准确率、队列推进成功率、跨任务状态污染率。";
    base.script = "这个任务说明系统已经从单句执行进入多任务编排，用户说一串事时，机器人要能拆、排、执行和交接。";
  } else if (category === "perception") {
    base.title = "动态感知证据";
    base.problem = "物理环境变化时，机器人是否能暂停、解释并进入恢复策略。";
    base.metric = "感知事件响应时延、暂停成功率、恢复策略选择率。";
    base.script = "这部分最接近具身智能：真实世界会变化，机器人不能只按静态计划走，必须把感知事件接入任务状态机。";
  } else if (category === "route") {
    base.title = "路线质量证据";
    base.problem = "机器人为什么这样走，风险在哪里，推荐路线是否有评分依据。";
    base.metric = "路线评分、风险标记召回率、推荐路线采纳率。";
    base.script = `我会展示路线评分${route?.routeScore ? ` ${route.routeScore.total}/${route.routeScore.grade}` : ""}、风险点和策略标签，把移动行为从黑盒动画变成可验收指标。`;
  } else if (category === "voice") {
    base.title = "语音反馈证据";
    base.problem = "关键状态是否说对话，让用户知道系统理解了什么、卡在哪里、下一步要什么。";
    base.metric = "话术覆盖率、澄清/确认命中率、用户二次追问率。";
    base.script = "语音反馈不是装饰，它决定用户是否信任机器人。这里可以讲我如何把系统状态映射成话术策略。";
  } else if (category === "voice_interaction") {
    base.title = "语音交互状态机证据";
    base.problem = "语音识别是否先确认、允许修正、失败能兜底，并能把短回复接回上下文。";
    base.metric = "识别确认率、误触发率、人工修正率、兜底成功率、短回复接续成功率。";
    base.script = "这里可以讲 V3.6 的核心：我不是只加麦克风，而是把语音识别、确认、修正和兜底变成可验证的产品状态机。";
  } else if (category === "safety") {
    base.title = "安全门控证据";
    base.problem = "高风险任务是否会先确认，而不是直接自动执行。";
    base.metric = "安全确认召回率、误拦截率、人工接管率。";
    base.script = "这条任务体现具身智能 PM 的安全边界意识：药盒、重物、老人相关动作必须先经过确认或恢复策略。";
  } else if (category === "navigation") {
    base.title = "自主移动证据";
    base.problem = "无物体任务是否能被理解为机器人自身导航，而不是错误追问移动什么。";
    base.metric = "导航意图识别率、目标位置命中率、无物体误澄清率。";
    base.script = "这里可以说明系统区分了搬运物体和机器人自身移动，这是家庭机器人语音入口的基础能力。";
  }

  return base;
}

function renderQualityEvidence() {
  if (!nodes.qualityEvidence) return;
  const evidence = state.qualityEvidence || buildQualityEvidence(null);
  const evidenceList = (evidence.evidence || [])
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("");
  nodes.qualityEvidence.innerHTML = `
    <article class="quality-card ${evidence.caseId ? "matched" : ""}">
      <header>
        <strong>${escapeHtml(evidence.title)}</strong>
        <span>${escapeHtml(evidence.passText)}</span>
      </header>
      <p>${escapeHtml(evidence.problem)}</p>
      <div class="quality-case-row">
        <span>${escapeHtml(evidence.caseLabel)}</span>
        <a href="${escapeHtml(evidence.url || "/test-plan.html")}">查看证据</a>
      </div>
      <ul>${evidenceList}</ul>
    </article>
    <article class="quality-guide">
      <strong>PM 讲解口径</strong>
      <p>${escapeHtml(evidence.script)}</p>
      <dl>
        <div><dt>决策</dt><dd>${escapeHtml(evidence.decision)}</dd></div>
        <div><dt>指标</dt><dd>${escapeHtml(evidence.metric)}</dd></div>
      </dl>
    </article>
  `;
}

function buildQualityDemoUrl(task) {
  const params = new URLSearchParams();
  if (task?.userCommand) params.set("demo", task.userCommand);
  return `/?${params.toString()}`;
}

function buildTestPlanUrl(filter) {
  return filter ? `/test-plan.html#${filter}` : "/test-plan.html";
}

function caseGroupLabel(group) {
  const labels = {
    baseline: "基础评估",
    interruption: "打断评估",
    voice: "语音评估",
    route: "路线评估",
    advanced: "高级交互",
    voice_interaction: "语音交互"
  };
  return labels[group] || "评估用例";
}

function renderGroundingEvidence(report, task = null) {
  if (!nodes.groundingEvidence) return;

  if (!report) {
    nodes.groundingEvidence.innerHTML = '<p class="muted">等待任务输入后展示候选对象、命中证据和最终 grounding 决策。</p>';
    return;
  }

  const signalTags = (report.signals || [])
    .map((signal) => `<span>${escapeHtml(signal)}</span>`)
    .join("");

  const destination = report.destinationName || task?.destination || "待确认位置";
  const summary = report.mode === "navigation"
    ? `自主移动 · ${destination}`
    : `${report.selectedObjectName || "待确认对象"} · ${destination}`;

  const candidateList = report.candidates?.length
    ? report.candidates.map((candidate) => renderGroundingCandidate(candidate)).join("")
    : '<p class="muted compact-copy">该任务不需要物体候选，系统只定位目标区域。</p>';

  nodes.groundingEvidence.innerHTML = `
    <article class="grounding-summary ${report.needsClarification ? "needs-input" : "resolved"}">
      <div>
        <strong>${escapeHtml(summary)}</strong>
        <p>${escapeHtml(report.decision || "等待 grounding 决策。")}</p>
      </div>
      <span>${report.needsClarification ? "待澄清" : "已定位"}</span>
    </article>
    <div class="grounding-signals">${signalTags}</div>
    <div class="grounding-candidates">${candidateList}</div>
  `;
}

function renderGroundingCandidate(candidate) {
  const reasons = (candidate.reasons || [])
    .slice(0, 4)
    .map((reason) => `<li>${escapeHtml(reason)}</li>`)
    .join("");

  return `
    <article class="grounding-candidate ${candidate.isSelected ? "chosen" : ""}">
      <header>
        <strong>${escapeHtml(candidate.name)}</strong>
        <span>${candidate.isSelected ? "选中" : `分数 ${candidate.score}`}</span>
      </header>
      <div class="candidate-meta">
        <span>${escapeHtml(candidate.zone || "未知区域")}</span>
        <span>${escapeHtml(candidate.type || "object")}</span>
        <span>风险 ${escapeHtml(candidate.risk || "low")}</span>
      </div>
      <ul>${reasons}</ul>
    </article>
  `;
}

function buildRouteReport(task, options = {}) {
  if (!task) return null;
  const destination = state.scenario.destinations.find((item) => item.id === task.destinationId);
  const object = findObject(task.objectId);
  if (!destination && !object) return null;
  const routePreference = inferRoutePreference(task.userCommand || "");
  const routeMode = options.routeMode || task.routeMode || routePreference.mode;
  const routeConstraint = task.routeConstraint || routePreference.constraint;

  const waypoints = [
    {
      id: "robot",
      name: "当前位置",
      role: "start",
      x: state.robot.x,
      y: state.robot.y
    }
  ];

  if (task.intent === "navigate") {
    waypoints.push(pointFromDestination(destination, "destination"));
  } else if (task.intent === "inspect") {
    waypoints.push(pointFromObject(object, "inspect") || pointFromDestination(destination, "destination"));
  } else {
    waypoints.push(pointFromObject(object, "pickup"));
    waypoints.push(pointFromDestination(destination, "destination"));
  }

  const expandedWaypoints = expandRouteWithDetours(waypoints.filter(Boolean), routeMode);
  const compactWaypoints = compactRouteWaypoints(expandedWaypoints);
  const segments = compactWaypoints.slice(1).map((to, index) => ({
    id: `segment-${index + 1}`,
    from: compactWaypoints[index],
    to,
    label: describeRouteSegment(task, compactWaypoints[index], to, index),
    distance: routeDistance(compactWaypoints[index], to)
  }));
  const totalDistance = segments.reduce((sum, segment) => sum + segment.distance, 0);
  const riskMarkers = detectRouteRisks(task, object, destination, segments);
  const routeRisk = summarizeRouteRisk(task, object, riskMarkers);
  const strategyLabels = buildRouteStrategyLabels(task, object, destination, routeMode, riskMarkers);
  const routeScore = scoreRoutePlan({
    task,
    object,
    destination,
    routeMode,
    waypoints: compactWaypoints,
    segments,
    riskMarkers,
    totalDistance
  });
  const routeComparison = buildRouteComparison(task, object, destination, routeMode, routeScore);

  return {
    mode: task.intent === "navigate" ? "navigation" : "manipulation",
    routeMode,
    routeConstraint,
    status: routeRisk,
    summary: buildRouteSummary(task, compactWaypoints, totalDistance, riskMarkers, routeMode),
    totalDistance: Math.round(totalDistance),
    estimatedSeconds: Math.max(4, Math.round(totalDistance * 0.12 + segments.length * 2)),
    waypoints: compactWaypoints,
    segments,
    riskMarkers,
    strategyLabels,
    routeScore,
    routeComparison
  };
}

function buildRouteMetrics(task, routeMode) {
  const destination = state.scenario.destinations.find((item) => item.id === task.destinationId);
  const object = findObject(task.objectId);
  const waypoints = [{
    id: "robot",
    name: "当前位置",
    role: "start",
    x: state.robot.x,
    y: state.robot.y
  }];

  if (task.intent === "navigate") {
    waypoints.push(pointFromDestination(destination, "destination"));
  } else if (task.intent === "inspect") {
    waypoints.push(pointFromObject(object, "inspect") || pointFromDestination(destination, "destination"));
  } else {
    waypoints.push(pointFromObject(object, "pickup"));
    waypoints.push(pointFromDestination(destination, "destination"));
  }

  const compactWaypoints = compactRouteWaypoints(expandRouteWithDetours(waypoints.filter(Boolean), routeMode));
  const segments = compactWaypoints.slice(1).map((to, index) => ({
    id: `compare-segment-${index + 1}`,
    from: compactWaypoints[index],
    to,
    label: describeRouteSegment(task, compactWaypoints[index], to, index),
    distance: routeDistance(compactWaypoints[index], to)
  }));
  const totalDistance = segments.reduce((sum, segment) => sum + segment.distance, 0);
  const scoredTask = { ...task, routeMode };
  const riskMarkers = detectRouteRisks(scoredTask, object, destination, segments);
  const score = scoreRoutePlan({
    task: scoredTask,
    object,
    destination,
    routeMode,
    waypoints: compactWaypoints,
    segments,
    riskMarkers,
    totalDistance
  });

  return {
    routeMode,
    label: routeMode === "avoid_chair" ? "绕行路线" : "默认路线",
    totalDistance: Math.round(totalDistance),
    estimatedSeconds: Math.max(4, Math.round(totalDistance * 0.12 + segments.length * 2)),
    riskCount: riskMarkers.filter((marker) => marker.level !== "low").length,
    score
  };
}

function scoreRoutePlan({ task, object, destination, routeMode, waypoints, segments, riskMarkers, totalDistance }) {
  const highRisks = riskMarkers.filter((marker) => marker.level === "high").length;
  const mediumRisks = riskMarkers.filter((marker) => marker.level === "medium").length;
  const lowRisks = riskMarkers.filter((marker) => marker.level === "low").length;
  const hasDetour = waypoints.some((waypoint) => waypoint.role === "detour");
  const missingPhysicalTarget = !destination && task.intent !== "inspect";
  const efficiency = clampScore(100 - totalDistance * 0.55 - Math.max(0, segments.length - 2) * 4);
  const safety = clampScore(100 - highRisks * 28 - mediumRisks * 14 - lowRisks * 2 + (hasDetour ? 8 : 0));
  const feasibility = clampScore(100 - (missingPhysicalTarget ? 35 : 0) - (!segments.length ? 35 : 0) - (object?.risk === "high" ? 8 : 0));
  const total = Math.round(safety * 0.45 + efficiency * 0.3 + feasibility * 0.25);
  const grade = total >= 85 ? "A" : total >= 72 ? "B" : total >= 60 ? "C" : "D";
  const recommendation = buildRouteRecommendation({
    task,
    routeMode,
    total,
    safety,
    efficiency,
    feasibility,
    highRisks,
    mediumRisks,
    hasDetour,
    destination
  });

  return {
    total,
    grade,
    safety: Math.round(safety),
    efficiency: Math.round(efficiency),
    feasibility: Math.round(feasibility),
    riskExposure: highRisks * 3 + mediumRisks * 2 + lowRisks,
    detourCost: Math.max(0, Math.round(totalDistance - directRouteDistance(task, object, destination))),
    recommendation
  };
}

function directRouteDistance(task, object, destination) {
  const points = [{ x: state.robot.x, y: state.robot.y }];
  if (task.intent !== "navigate" && object) points.push(object);
  if (destination) points.push(destination);
  return points.slice(1).reduce((sum, point, index) => sum + routeDistance(points[index], point), 0);
}

function buildRouteRecommendation({ task, routeMode, total, safety, efficiency, feasibility, highRisks, mediumRisks, hasDetour, destination }) {
  if (highRisks > 0) return "建议保留确认或人工接管兜底，执行前说明风险来源。";
  if (routeMode === "avoid_chair" && hasDetour) return "推荐采用绕行路线，安全收益高于轻微距离成本。";
  if (mediumRisks > 0) return "可执行，但建议低速通过并持续播报状态。";
  if (task.intent === "navigate") return "适合自主导航，保持路径监测即可。";
  if (destination?.id === "door") return "门口空间需要执行前检查，确认通行后再完成放置。";
  if (total < 70 || safety < 70 || feasibility < 70) return "建议重新规划或转人工确认后执行。";
  if (efficiency >= 85) return "路线较短，可按默认路径执行。";
  return "路线可执行，建议按计划执行并保留中途打断能力。";
}

function buildRouteComparison(task, object, destination, routeMode, activeScore) {
  const shouldCompare = task.intent !== "navigate" && task.objectId !== "chair" && (destination?.id === "door" || /椅子|障碍|绕开|避开|别撞/.test(task.userCommand || ""));
  if (!shouldCompare) return null;

  const direct = buildRouteMetrics({ ...task, routeMode: "direct" }, "direct");
  const avoid = buildRouteMetrics({ ...task, routeMode: "avoid_chair" }, "avoid_chair");
  const userRequestedAvoid = routeMode === "avoid_chair" || /绕开|避开|避障|别撞/.test(task.userCommand || "");
  const recommendedMode = userRequestedAvoid
    ? "avoid_chair"
    : avoid.score.safety - direct.score.safety >= 8 && avoid.totalDistance - direct.totalDistance <= 45
    ? "avoid_chair"
    : direct.score.total >= avoid.score.total
    ? "direct"
    : "avoid_chair";

  return {
    activeMode: routeMode,
    recommendedMode,
    activeScore: activeScore.total,
    options: [direct, avoid],
    delta: {
      distance: avoid.totalDistance - direct.totalDistance,
      seconds: avoid.estimatedSeconds - direct.estimatedSeconds,
      safety: avoid.score.safety - direct.score.safety,
      riskExposure: avoid.score.riskExposure - direct.score.riskExposure
    },
    reason: recommendedMode === "avoid_chair"
      ? "绕行路线降低障碍接近风险，适合重物或门口通行场景。"
      : "默认路线效率更高，当前风险可通过低速和状态反馈控制。"
  };
}

function clampScore(value) {
  return Math.max(0, Math.min(100, value));
}

function expandRouteWithDetours(waypoints, routeMode) {
  if (routeMode !== "avoid_chair" || waypoints.length < 2) return waypoints;
  const chair = findObject("chair");
  if (!chair) return waypoints;

  const expanded = [waypoints[0]];
  waypoints.slice(1).forEach((waypoint, index) => {
    const from = expanded[expanded.length - 1];
    const passesChair = distancePointToSegment(chair, from, waypoint) < 14;
    const segmentAlreadyTargetsChair = from.id === "chair" || waypoint.id === "chair";
    if (passesChair && !segmentAlreadyTargetsChair) {
      const detourPoint = makeDetourPoint(from, waypoint, index + 1);
      if (routeDistance(from, detourPoint) > 2 && routeDistance(detourPoint, waypoint) > 2) {
        expanded.push(detourPoint);
      }
    }
    expanded.push(waypoint);
  });

  return expanded;
}

function makeDetourPoint(from, to, index) {
  const goesToDoor = to.id === "door";
  const goesToPickupOnLeft = to.role === "pickup" && to.x < 35;
  const x = goesToDoor ? 62 : goesToPickupOnLeft ? 58 : Math.max(42, Math.min(68, (from.x + to.x) / 2 + 10));
  const y = goesToDoor || goesToPickupOnLeft ? 30 : 34;
  return {
    id: `detour_${index}`,
    name: "客厅绕行点",
    role: "detour",
    x,
    y
  };
}

function pointFromObject(object, role) {
  if (!object) return null;
  return {
    id: object.id,
    name: object.name,
    role,
    x: object.x,
    y: object.y
  };
}

function pointFromDestination(destination, role) {
  if (!destination) return null;
  return {
    id: destination.id,
    name: destination.name,
    role,
    x: destination.x,
    y: destination.y
  };
}

function compactRouteWaypoints(waypoints) {
  return waypoints.reduce((items, waypoint) => {
    const previous = items[items.length - 1];
    if (previous && routeDistance(previous, waypoint) < 2) {
      return items;
    }
    items.push(waypoint);
    return items;
  }, []);
}

function describeRouteSegment(task, from, to, index) {
  if (to.role === "detour") return `绕开椅子到 ${to.name}`;
  if (task.intent === "navigate") return `前往 ${to.name}`;
  if (task.intent === "inspect") return `前往 ${to.name} 附近观察`;
  if (to.role === "pickup" || index === 0) return `接近 ${to.name}`;
  return `携带 ${task.object || "目标对象"} 前往 ${to.name}`;
}

function detectRouteRisks(task, object, destination, segments) {
  const markers = [];
  const chair = findObject("chair");
  const nearChair = chair && segments.some((segment) => distancePointToSegment(chair, segment.from, segment.to) < 12);
  const routeMode = task.routeMode || inferRoutePreference(task.userCommand || "").mode;
  if (nearChair && task.objectId !== "chair") {
    if (routeMode === "avoid_chair") {
      markers.push({
        id: "chair_avoided",
        level: "low",
        label: "已规划椅子绕行",
        detail: "路线加入绕行点，靠近障碍时保持低速并可中途暂停。"
      });
    } else {
      markers.push({
        id: "near_chair",
        level: "medium",
        label: "路径靠近椅子障碍",
        detail: "建议低速绕行，并保留中途暂停能力。"
      });
    }
  }

  if (object?.risk === "high") {
    markers.push({
      id: "high_risk_object",
      level: "high",
      label: "高风险对象搬运",
      detail: `${object.name} 需要安全确认或人工接管兜底。`
    });
  }

  if (destination?.id === "elder_seat" || /老人/.test(task.userCommand || "")) {
    markers.push({
      id: "elder_handoff",
      level: "medium",
      label: "靠近老人座位",
      detail: "接近目标区域前应低速移动并语音反馈。"
    });
  }

  if (destination?.id === "door") {
    markers.push({
      id: "door_space",
      level: "medium",
      label: "门口通行空间",
      detail: "门口区域可能狭窄，执行前需要检查通行空间。"
    });
  }

  return dedupeRiskMarkers(markers);
}

function dedupeRiskMarkers(markers) {
  const seen = new Set();
  return markers.filter((marker) => {
    if (seen.has(marker.id)) return false;
    seen.add(marker.id);
    return true;
  });
}

function summarizeRouteRisk(task, object, riskMarkers) {
  if (riskMarkers.some((marker) => marker.level === "high") || task.riskLevel === "high" || object?.risk === "high") return "high";
  if (riskMarkers.some((marker) => marker.level === "medium") || task.riskLevel === "medium") return "medium";
  return "low";
}

function buildRouteSummary(task, waypoints, totalDistance, riskMarkers, routeMode) {
  const names = waypoints.map((waypoint) => waypoint.name).join(" -> ");
  const hasDetour = waypoints.some((waypoint) => waypoint.role === "detour");
  const detourCopy = hasDetour
    ? "，已加入绕行点"
    : routeMode === "avoid_chair"
    ? "，已启用绕行策略"
    : "";
  const riskCopy = riskMarkers.length ? `，识别到 ${riskMarkers.length} 个路径风险点` : "，未发现显著路径风险";
  return `${names}${detourCopy}，预计路径长度 ${Math.round(totalDistance)}${riskCopy}。`;
}

function buildRouteStrategyLabels(task, object, destination, routeMode, riskMarkers) {
  const labels = [];
  if (routeMode === "avoid_chair") {
    labels.push("主动绕行", "低速避障");
  } else {
    labels.push("默认路径");
  }
  if (task.intent === "navigate") labels.push("自主导航");
  if (object?.risk === "high") labels.push("高风险确认");
  if (destination?.id === "elder_seat") labels.push("靠近老人降速");
  if (destination?.id === "door") labels.push("门口空间检查");
  if (riskMarkers.some((marker) => marker.id === "chair_avoided")) labels.push("障碍已规避");
  return mergeUnique(labels);
}

function routeDistance(left, right) {
  if (!left || !right) return 0;
  return Math.hypot(left.x - right.x, left.y - right.y);
}

function distancePointToSegment(point, start, end) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  if (dx === 0 && dy === 0) return routeDistance(point, start);
  const t = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(point.x - (start.x + t * dx), point.y - (start.y + t * dy));
}

function routeProgressForStep(label, intent) {
  if (intent === "navigate") {
    if (label === "Navigate") return 1;
    if (label === "Arrive" || label === "Done") return 2;
    return 0;
  }

  if (label === "Move") return 1;
  if (label === "Pick") return 1;
  if (label === "Carry") return 2;
  if (label === "Place" || label === "Done") return 3;
  return 0;
}

function renderRouteOverlay() {
  if (!nodes.routeOverlay) return;
  const report = state.activeRouteReport;
  if (!report || !report.segments?.length) {
    nodes.routeOverlay.innerHTML = "";
    return;
  }

  const segmentMarkup = report.segments.map((segment, index) => {
    const status = index < state.routeProgressIndex ? "completed" : index === state.routeProgressIndex ? "active" : "planned";
    return `<line class="route-segment ${status} to-${segment.to.role}" x1="${segment.from.x}" y1="${segment.from.y}" x2="${segment.to.x}" y2="${segment.to.y}" />`;
  }).join("");
  const waypointMarkup = report.waypoints.map((waypoint, index) => {
    const status = index <= state.routeProgressIndex ? "completed" : "planned";
    return `<circle class="route-waypoint ${status} role-${waypoint.role}" cx="${waypoint.x}" cy="${waypoint.y}" r="${waypoint.role === "start" ? 1.6 : 2.1}" />`;
  }).join("");

  nodes.routeOverlay.innerHTML = `${segmentMarkup}${waypointMarkup}`;
}

function renderRoutePreview(report) {
  if (!nodes.routePreview) return;
  if (!report) {
    nodes.routePreview.innerHTML = '<p class="muted">等待任务输入后展示路线、预计距离、风险点和执行进度。</p>';
    return;
  }

  const riskLabel = report.status === "high" ? "高风险" : report.status === "medium" ? "需注意" : "低风险";
  const segments = report.segments.map((segment, index) => {
    const status = index < state.routeProgressIndex ? "completed" : index === state.routeProgressIndex ? "active" : "planned";
    return `
      <li class="${status}">
        <span>${index + 1}</span>
        <div>
          <strong>${escapeHtml(segment.label)}</strong>
          <small>${Math.round(segment.distance)} 距离单位</small>
        </div>
      </li>
    `;
  }).join("");
  const risks = report.riskMarkers.length
    ? report.riskMarkers.map((risk) => `
        <article class="route-risk ${risk.level}">
          <strong>${escapeHtml(risk.label)}</strong>
          <p>${escapeHtml(risk.detail)}</p>
        </article>
      `).join("")
    : '<p class="muted compact-copy">当前路线未发现显著风险点，可按计划执行并持续监测。</p>';
  const strategyTags = report.strategyLabels?.length
    ? `<div class="route-strategy-tags">${report.strategyLabels.map((label) => `<span>${escapeHtml(label)}</span>`).join("")}</div>`
    : "";
  const score = report.routeScore ? `
    <article class="route-score-card grade-${escapeHtml(report.routeScore.grade.toLowerCase())}">
      <div class="route-score-main">
        <span>${escapeHtml(report.routeScore.grade)}</span>
        <div>
          <strong>${report.routeScore.total} 分 · 路线评分</strong>
          <p>${escapeHtml(report.routeScore.recommendation)}</p>
        </div>
      </div>
      <div class="route-score-grid">
        <div><b>${report.routeScore.safety}</b><span>安全</span></div>
        <div><b>${report.routeScore.efficiency}</b><span>效率</span></div>
        <div><b>${report.routeScore.feasibility}</b><span>可行</span></div>
        <div><b>${report.routeScore.riskExposure}</b><span>风险暴露</span></div>
      </div>
    </article>
  ` : "";
  const comparison = report.routeComparison ? `
    <article class="route-comparison-card">
      <header>
        <strong>路线对比</strong>
        <span>推荐：${report.routeComparison.recommendedMode === "avoid_chair" ? "绕行路线" : "默认路线"}</span>
      </header>
      <div class="route-comparison-options">
        ${report.routeComparison.options.map((option) => `
          <div class="${option.routeMode === report.routeComparison.activeMode ? "active" : ""}">
            <strong>${escapeHtml(option.label)}</strong>
            <p>${option.score.total} 分 · ${option.totalDistance} 距离单位 · ${option.estimatedSeconds} 秒</p>
            <small>安全 ${option.score.safety} / 风险暴露 ${option.score.riskExposure}</small>
          </div>
        `).join("")}
      </div>
      <p class="comparison-note">${escapeHtml(report.routeComparison.reason)} 距离差 ${report.routeComparison.delta.distance >= 0 ? "+" : ""}${report.routeComparison.delta.distance}，安全差 ${report.routeComparison.delta.safety >= 0 ? "+" : ""}${report.routeComparison.delta.safety}。</p>
    </article>
  ` : "";

  nodes.routePreview.innerHTML = `
    <article class="route-summary ${report.status}">
      <div>
        <strong>${escapeHtml(riskLabel)} · 约 ${report.estimatedSeconds} 秒</strong>
        <p>${escapeHtml(report.summary)}</p>
      </div>
      <span>${report.totalDistance}</span>
    </article>
    ${strategyTags}
    ${score}
    ${comparison}
    <ol class="route-segment-list">${segments}</ol>
    <div class="route-risk-list">${risks}</div>
  `;
}

function buildFallbackGroundingReport(command, object, destination, action, flags = {}) {
  const signals = [];
  if (/杯子|杯|箱子|药|药盒|快递|包裹|障碍|椅子|东西|物体/.test(command)) signals.push("对象类型");
  if (/红色|蓝色|红|蓝/.test(command)) signals.push("颜色属性");
  if (/桌上|桌面|门口|厨房|客厅|老人|边桌/.test(command)) signals.push("场景区域");
  if (/左边|右边|旁边|附近|边上/.test(command)) signals.push("空间关系");
  if (/这个|那个|这边|那边/.test(command)) signals.push("指代上下文");
  if (/移动到|走到|前往|去|到/.test(command)) signals.push("导航目标");

  if (flags.objectlessIntent || action.intent === "navigate") {
    return {
      mode: "navigation",
      title: "机器人自身移动",
      selectedObjectId: null,
      destinationId: destination?.id || null,
      destinationName: destination?.name || "待确认位置",
      needsClarification: !destination,
      decision: destination ? `指令没有出现可搬运对象，系统将机器人自身移动到「${destination.name}」。` : "目标位置仍需确认。",
      signals: signals.length ? signals : ["导航目标"],
      candidates: []
    };
  }

  const candidates = state.objects.map((item) => ({
    id: item.id,
    name: item.name,
    type: item.type,
    zone: item.zone,
    risk: item.risk,
    score: item.id === object?.id ? 1 : 0,
    reasons: item.id === object?.id ? ["命中本地兜底解析结果"] : ["未命中本轮语言或场景证据"],
    isSelected: item.id === object?.id
  }));

  return {
    mode: "object_grounding",
    title: "对象 Grounding",
    selectedObjectId: object?.id || null,
    selectedObjectName: object?.name || null,
    destinationId: destination?.id || null,
    destinationName: destination?.name || "待确认位置",
    needsClarification: flags.ambiguousCup || flags.ambiguousBox || flags.deicticReference || !object,
    decision: object ? `最终选择「${object.name}」，目标位置为「${destination?.name || "待确认位置"}」。` : "没有稳定命中可执行对象，进入澄清流程。",
    signals: signals.length ? signals : ["默认任务语义"],
    candidates
  };
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderAgentTrace(trace) {
  nodes.agentTrace.innerHTML = "";
  if (!trace.length) {
    nodes.agentTrace.innerHTML = '<p class="muted">等待任务输入后展示子 Agent 决策链。</p>';
    return;
  }

  trace.forEach((item) => {
    const card = document.createElement("article");
    card.className = "agent-card";
    const evidence = (item.evidence || []).map((line) => `<li>${line}</li>`).join("");
    card.innerHTML = `
      <header>
        <strong>${item.title}</strong>
        <span class="agent-status ${item.status}">${item.agent}</span>
      </header>
      <p>${item.detail}</p>
      ${evidence ? `<ul>${evidence}</ul>` : ""}
    `;
    nodes.agentTrace.appendChild(card);
  });
}

function moveRobot(x, y) {
  state.robot = { x, y };
  if (state.carryingObjectId) {
    const carriedObject = findObject(state.carryingObjectId);
    if (carriedObject) {
      carriedObject.x = x;
      carriedObject.y = y;
    }
  }
  nodes.robotNode.classList.add("active");
  renderScene();
  window.setTimeout(() => nodes.robotNode.classList.remove("active"), 900);
}

function updateMetrics() {
  const successRate = state.metrics.total ? Math.round((state.metrics.success / state.metrics.total) * 100) : 0;
  nodes.metricTotal.textContent = String(state.metrics.total);
  nodes.metricSuccess.textContent = `${successRate}%`;
  nodes.metricClarify.textContent = String(state.metrics.clarifications);
  nodes.metricConfirm.textContent = String(state.metrics.confirmations);
  nodes.metricHandoff.textContent = String(state.metrics.handoffs);
  nodes.metricRisk.textContent = String(state.metrics.riskBlocks);
  nodes.metricRecovery.textContent = String(state.metrics.recoveries);
  nodes.metricInterrupt.textContent = String(state.metrics.interruptions);
  nodes.metricSpeech.textContent = String(state.metrics.speechFeedback);
  if (nodes.metricVoiceTurns) nodes.metricVoiceTurns.textContent = String(state.metrics.voiceTurns);
  if (nodes.metricVoiceFallback) nodes.metricVoiceFallback.textContent = String(state.metrics.voiceFallbacks);
  if (state.interruptionEvaluationResults.length) {
    const passed = state.interruptionEvaluationResults.filter((item) => item.passed).length;
    nodes.metricInterruptEval.textContent = `${passed}/${state.interruptionEvaluationResults.length}`;
  } else {
    nodes.metricInterruptEval.textContent = "-";
  }
  if (state.voiceFeedbackEvaluationResults.length) {
    const passed = state.voiceFeedbackEvaluationResults.filter((item) => item.passed).length;
    nodes.metricVoiceEval.textContent = `${passed}/${state.voiceFeedbackEvaluationResults.length}`;
  } else {
    nodes.metricVoiceEval.textContent = "-";
  }
  if (state.routeEvaluationResults.length) {
    const passed = state.routeEvaluationResults.filter((item) => item.passed).length;
    nodes.metricRouteEval.textContent = `${passed}/${state.routeEvaluationResults.length}`;
  } else if (nodes.metricRouteEval) {
    nodes.metricRouteEval.textContent = "-";
  }
  if (state.evaluationResults.length) {
    const passed = state.evaluationResults.filter((item) => item.passed).length;
    nodes.metricEval.textContent = `${passed}/${state.evaluationResults.length}`;
  } else {
    nodes.metricEval.textContent = "-";
  }
}

function addSpeechFeedback(type, text, options = {}) {
  if (!text) return;
  const item = {
    type,
    text,
    time: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  };
  state.speech.last = text;
  state.speech.log.unshift(item);
  state.speech.log = state.speech.log.slice(0, 8);
  if (!options.skipMetric) {
    state.metrics.speechFeedback += 1;
  }
  renderSpeechFeedback();
  updateMetrics();

  if ((state.speech.enabled || options.force) && !options.silent) {
    speakText(text);
  }
}

function renderSpeechFeedback() {
  nodes.speechLast.textContent = state.speech.last || "等待任务后生成反馈话术。";
  nodes.speechLog.innerHTML = state.speech.log
    .map((item) => `<li><strong>${speechTypeLabel(item.type)}</strong> ${item.text}<br><span>${item.time}</span></li>`)
    .join("");
}

function replayLastSpeech() {
  if (!state.speech.last) {
    addSpeechFeedback("speech", "当前还没有可重播的话术。");
    return;
  }
  speakText(state.speech.last);
}

function speakText(text) {
  if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
    nodes.speechLast.textContent = `${text}（当前浏览器不支持系统播报，仅显示话术。）`;
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "zh-CN";
  utterance.rate = 0.95;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

function speechTypeLabel(type) {
  const labels = {
    ready: "就绪",
    understand: "理解",
    clarify: "澄清",
    confirm: "确认",
    start: "开始",
    progress: "进度",
    done: "完成",
    recovery: "恢复",
    interrupt: "打断",
    handoff: "接管",
    speech: "播报",
    eval: "评估"
  };
  return labels[type] || "反馈";
}

function runEvaluationSet() {
  if (!window.VoiceToActionAgents) {
    nodes.interactionBox.innerHTML = '<span class="tag warn">评估不可用</span><p class="muted" style="margin-top:8px;">未加载 Agent 编排器。</p>';
    return;
  }

  if (!state.evaluationSet.length) {
    nodes.interactionBox.innerHTML = '<span class="tag warn">评估集为空</span><p class="muted" style="margin-top:8px;">未找到 data/evaluation-set.json。</p>';
    return;
  }

  state.evaluationResults = window.VoiceToActionAgents.runEvaluation(state.evaluationSet, buildWorld());
  const passed = state.evaluationResults.filter((item) => item.passed).length;
  const summary = state.evaluationResults.map((item) => {
    const mark = item.passed ? "通过" : "未通过";
    const failed = item.checks.filter((check) => !check.pass)
      .map((check) => `${check.name}: ${check.actual} != ${check.expected}`)
      .join("；");
    return `<li><strong>${mark}</strong> ${item.command}${failed ? `<br><span>${failed}</span>` : ""}</li>`;
  }).join("");

  updateMetrics();
  setStatus("Evaluated");
  addTimeline("Eval", `评估集完成：${passed}/${state.evaluationResults.length} 通过。`);
  recordRunLog("evaluation", "基础评估完成", {
    passed,
    total: state.evaluationResults.length,
    failed: state.evaluationResults.filter((item) => !item.passed).map((item) => item.command)
  });
  addSpeechFeedback("eval", `基础评估完成，${passed} 条通过，共 ${state.evaluationResults.length} 条。`);
  nodes.interactionBox.innerHTML = `
    <span class="tag info">评估完成</span>
    <p class="muted" style="margin-top:8px;">用于展示产品经理对 Agent 行为的回归测试意识。</p>
    <ol class="eval-result-list">${summary}</ol>
  `;

  const firstFailed = state.evaluationResults.find((item) => !item.passed) || state.evaluationResults[0];
  if (firstFailed) {
    updateInspector(firstFailed.task, [], firstFailed.trace || [], firstFailed.groundingReport);
  }
}

function runInterruptionEvaluationSet() {
  if (!window.VoiceToActionAgents) {
    nodes.interactionBox.innerHTML = '<span class="tag warn">打断评估不可用</span><p class="muted" style="margin-top:8px;">未加载 Agent 编排器。</p>';
    return;
  }

  if (!state.interruptionEvaluationSet.length) {
    nodes.interactionBox.innerHTML = '<span class="tag warn">打断评估集为空</span><p class="muted" style="margin-top:8px;">未找到 data/interruption-evaluation-set.json。</p>';
    return;
  }

  state.interruptionEvaluationResults = state.interruptionEvaluationSet.map(simulateInterruptionCase);
  const passed = state.interruptionEvaluationResults.filter((item) => item.passed).length;
  const summary = state.interruptionEvaluationResults.map((item) => {
    const mark = item.passed ? "通过" : "未通过";
    const failed = item.checks.filter((check) => !check.pass)
      .map((check) => `${check.name}: ${check.actual} != ${check.expected}`)
      .join("；");
    return `<li><strong>${mark}</strong> ${item.baseCommand} / ${item.interruptionCommand}${failed ? `<br><span>${failed}</span>` : ""}</li>`;
  }).join("");

  updateMetrics();
  setStatus("Interrupt Eval");
  addTimeline("Eval", `打断评估完成：${passed}/${state.interruptionEvaluationResults.length} 通过。`);
  recordRunLog("evaluation", "打断评估完成", {
    passed,
    total: state.interruptionEvaluationResults.length,
    failed: state.interruptionEvaluationResults.filter((item) => !item.passed).map((item) => item.name || item.baseCommand)
  });
  addSpeechFeedback("eval", `打断评估完成，${passed} 条通过，共 ${state.interruptionEvaluationResults.length} 条。`);
  nodes.interactionBox.innerHTML = `
    <span class="tag info">打断评估完成</span>
    <p class="muted" style="margin-top:8px;">验证执行中暂停、改目标、换对象、人工接管和无效打断的行为稳定性。</p>
    <ol class="eval-result-list">${summary}</ol>
  `;

  const firstFailed = state.interruptionEvaluationResults.find((item) => !item.passed) || state.interruptionEvaluationResults[0];
  if (firstFailed) {
    updateInspector(firstFailed.task, [], firstFailed.trace || [], firstFailed.groundingReport);
  }
}

function runVoiceFeedbackEvaluationSet() {
  if (!state.voiceFeedbackEvaluationSet.length) {
    nodes.interactionBox.innerHTML = '<span class="tag warn">语音评估集为空</span><p class="muted" style="margin-top:8px;">未找到 data/voice-feedback-evaluation-set.json。</p>';
    return;
  }

  state.voiceFeedbackEvaluationResults = state.voiceFeedbackEvaluationSet.map(simulateVoiceFeedbackCase);
  const passed = state.voiceFeedbackEvaluationResults.filter((item) => item.passed).length;
  const summary = state.voiceFeedbackEvaluationResults.map((item) => {
    const mark = item.passed ? "通过" : "未通过";
    const failed = item.checks.filter((check) => !check.pass)
      .map((check) => `${check.name}: ${check.actual} != ${check.expected}`)
      .join("；");
    return `<li><strong>${mark}</strong> ${item.command}${failed ? `<br><span>${failed}</span>` : ""}</li>`;
  }).join("");

  updateMetrics();
  setStatus("Voice Eval");
  addTimeline("Eval", `语音反馈评估完成：${passed}/${state.voiceFeedbackEvaluationResults.length} 通过。`);
  recordRunLog("evaluation", "语音反馈评估完成", {
    passed,
    total: state.voiceFeedbackEvaluationResults.length,
    failed: state.voiceFeedbackEvaluationResults.filter((item) => !item.passed).map((item) => item.name || item.command)
  });
  addSpeechFeedback("eval", `语音反馈评估完成，${passed} 条通过，共 ${state.voiceFeedbackEvaluationResults.length} 条。`);
  nodes.interactionBox.innerHTML = `
    <span class="tag info">语音反馈评估完成</span>
    <p class="muted" style="margin-top:8px;">验证理解、澄清、确认、恢复、改口和接管等关键状态是否触发正确话术。</p>
    <ol class="eval-result-list">${summary}</ol>
  `;

  const firstFailed = state.voiceFeedbackEvaluationResults.find((item) => !item.passed) || state.voiceFeedbackEvaluationResults[0];
  if (firstFailed) {
    updateInspector(firstFailed.task, [], firstFailed.trace || [], firstFailed.groundingReport);
  }
}

function runRouteEvaluationSet() {
  if (!state.routeEvaluationSet.length) {
    nodes.interactionBox.innerHTML = '<span class="tag warn">路线评估集为空</span><p class="muted" style="margin-top:8px;">未找到 data/route-evaluation-set.json。</p>';
    return;
  }

  state.routeEvaluationResults = state.routeEvaluationSet.map(simulateRouteEvaluationCase);
  const passed = state.routeEvaluationResults.filter((item) => item.passed).length;
  const summary = state.routeEvaluationResults.map((item) => {
    const mark = item.passed ? "通过" : "未通过";
    const failed = item.checks.filter((check) => !check.pass)
      .map((check) => `${check.name}: ${check.actual} != ${check.expected}`)
      .join("；");
    return `<li><strong>${mark}</strong> ${item.command}${failed ? `<br><span>${failed}</span>` : ""}</li>`;
  }).join("");

  updateMetrics();
  setStatus("Route Eval");
  addTimeline("Eval", `路线质量评估完成：${passed}/${state.routeEvaluationResults.length} 通过。`);
  recordRunLog("evaluation", "路线质量评估完成", {
    passed,
    total: state.routeEvaluationResults.length,
    failed: state.routeEvaluationResults.filter((item) => !item.passed).map((item) => item.command)
  });
  addSpeechFeedback("eval", `路线质量评估完成，${passed} 条通过，共 ${state.routeEvaluationResults.length} 条。`);
  nodes.interactionBox.innerHTML = `
    <span class="tag info">路线评估完成</span>
    <p class="muted" style="margin-top:8px;">验证路径分段、绕行点、风险标记和路线策略是否符合物理执行预期。</p>
    <ol class="eval-result-list">${summary}</ol>
  `;

  const firstFailed = state.routeEvaluationResults.find((item) => !item.passed) || state.routeEvaluationResults[0];
  if (firstFailed) {
    state.routeProgressIndex = 0;
    updateInspector(firstFailed.task, [], firstFailed.trace || [], firstFailed.groundingReport, firstFailed.routeReport);
  }
}

function simulateRouteEvaluationCase(caseItem) {
  const snapshot = captureRouteEvaluationSnapshot();
  try {
    state.objects = state.scenario.objects.map((item) => ({ ...item }));
    state.robot = { x: 47, y: 58 };
    state.carryingObjectId = null;
    state.selectedObjectId = caseItem.selectedObjectId || null;

    const parseResult = parseCommand(caseItem.command, { confirmed: true, evaluationMode: true });
    const task = parseResult.task || {};
    const routeReport = buildRouteReport(task);
    const waypointRoles = routeReport?.waypoints?.map((waypoint) => waypoint.role) || [];
    const riskMarkerIds = routeReport?.riskMarkers?.map((marker) => marker.id) || [];
    const strategyLabels = routeReport?.strategyLabels || [];
    const actual = {
      objectId: task.objectId,
      destinationId: task.destinationId,
      mode: routeReport?.mode,
      routeMode: routeReport?.routeMode,
      status: routeReport?.status,
      segmentCount: routeReport?.segments?.length || 0,
      waypointRoles,
      riskMarkers: riskMarkerIds,
      strategyLabels,
      scoreTotal: routeReport?.routeScore?.total,
      scoreGrade: routeReport?.routeScore?.grade,
      safetyScore: routeReport?.routeScore?.safety,
      efficiencyScore: routeReport?.routeScore?.efficiency,
      recommendedMode: routeReport?.routeComparison?.recommendedMode
    };
    const expected = {
      objectId: caseItem.expectedObjectId,
      destinationId: caseItem.expectedDestinationId,
      mode: caseItem.expectedMode,
      routeMode: caseItem.expectedRouteMode,
      status: caseItem.expectedStatus,
      minSegments: caseItem.expectedMinSegments,
      waypointRoles: caseItem.expectedWaypointRoles,
      forbiddenWaypointRoles: caseItem.forbiddenWaypointRoles,
      riskMarkers: caseItem.expectedRiskMarkers,
      forbiddenRiskMarkers: caseItem.forbiddenRiskMarkers,
      strategyLabels: caseItem.expectedStrategyLabels,
      minScore: caseItem.expectedMinScore,
      grade: caseItem.expectedScoreGrade,
      minSafetyScore: caseItem.expectedMinSafetyScore,
      minEfficiencyScore: caseItem.expectedMinEfficiencyScore,
      recommendedMode: caseItem.expectedRecommendedMode
    };
    const checks = [
      compareEvaluation("object", actual.objectId, expected.objectId),
      compareEvaluation("destination", actual.destinationId, expected.destinationId),
      compareEvaluation("mode", actual.mode, expected.mode),
      compareEvaluation("routeMode", actual.routeMode, expected.routeMode),
      compareEvaluation("status", actual.status, expected.status),
      compareAtLeast("segments", actual.segmentCount, expected.minSegments),
      compareIncludesAll("waypointRoles", actual.waypointRoles, expected.waypointRoles),
      compareExcludesAll("forbiddenWaypointRoles", actual.waypointRoles, expected.forbiddenWaypointRoles),
      compareIncludesAll("riskMarkers", actual.riskMarkers, expected.riskMarkers),
      compareExcludesAll("forbiddenRiskMarkers", actual.riskMarkers, expected.forbiddenRiskMarkers),
      compareIncludesAll("strategyLabels", actual.strategyLabels, expected.strategyLabels),
      compareAtLeast("scoreTotal", actual.scoreTotal, expected.minScore),
      compareEvaluation("scoreGrade", actual.scoreGrade, expected.grade),
      compareAtLeast("safetyScore", actual.safetyScore, expected.minSafetyScore),
      compareAtLeast("efficiencyScore", actual.efficiencyScore, expected.minEfficiencyScore),
      compareEvaluation("recommendedMode", actual.recommendedMode, expected.recommendedMode)
    ].filter((item) => item.expected !== undefined);
    const passed = checks.every((item) => item.pass);

    return {
      id: caseItem.id,
      command: caseItem.command,
      passed,
      checks,
      expected,
      actual,
      task,
      routeReport,
      groundingReport: parseResult.groundingReport || null,
      trace: [
        ...(parseResult.trace || []),
        {
          agent: "Route Evaluator",
          title: "路线质量评估",
          status: passed ? "done" : "caution",
          detail: `路线模式：${actual.routeMode || "unknown"}，分段数：${actual.segmentCount}，评分：${actual.scoreTotal || "-"}。`,
          evidence: [
            `路径节点：${actual.waypointRoles.join(" -> ")}`,
            `风险标记：${actual.riskMarkers.join(" / ") || "none"}`,
            `策略标签：${actual.strategyLabels.join(" / ") || "none"}`,
            `推荐路线：${actual.recommendedMode || "无需对比"}`
          ]
        }
      ]
    };
  } finally {
    restoreRouteEvaluationSnapshot(snapshot);
  }
}

function captureRouteEvaluationSnapshot() {
  return {
    objects: state.objects.map((item) => ({ ...item })),
    robot: { ...state.robot },
    carryingObjectId: state.carryingObjectId,
    selectedObjectId: state.selectedObjectId
  };
}

function restoreRouteEvaluationSnapshot(snapshot) {
  state.objects = snapshot.objects;
  state.robot = snapshot.robot;
  state.carryingObjectId = snapshot.carryingObjectId;
  state.selectedObjectId = snapshot.selectedObjectId;
  renderScene();
  renderSelectedContext();
}

function compareAtLeast(name, actual, expected) {
  return {
    name,
    actual,
    expected: expected === undefined ? undefined : `>=${expected}`,
    pass: expected === undefined || actual >= expected
  };
}

function compareIncludesAll(name, actual = [], expected = []) {
  if (expected === undefined) {
    return { name, actual: actual.join(","), expected, pass: true };
  }
  const missing = expected.filter((item) => !actual.includes(item));
  return {
    name,
    actual: actual.join(",") || "none",
    expected: expected.join(",") || "none",
    pass: missing.length === 0
  };
}

function compareExcludesAll(name, actual = [], forbidden = []) {
  if (forbidden === undefined) {
    return { name, actual: actual.join(","), expected: undefined, pass: true };
  }
  const present = forbidden.filter((item) => actual.includes(item));
  return {
    name,
    actual: actual.join(",") || "none",
    expected: `exclude ${forbidden.join(",") || "none"}`,
    pass: present.length === 0
  };
}

function simulateVoiceFeedbackCase(caseItem) {
  const generated = buildVoiceFeedbackSequence(caseItem);
  const actualTypes = generated.map((item) => item.type);
  const actualText = generated.map((item) => item.text).join(" | ");
  const expectedTypes = caseItem.expectedTypes || [];
  const expectedTextIncludes = caseItem.expectedTextIncludes || [];
  const checks = [
    compareEvaluation("types", actualTypes.join(","), expectedTypes.join(",")),
    ...expectedTextIncludes.map((text) => ({
      name: `text:${text}`,
      actual: actualText.includes(text) ? text : actualText,
      expected: text,
      pass: actualText.includes(text)
    }))
  ];
  const passed = checks.every((item) => item.pass);

  return {
    id: caseItem.id,
    command: caseItem.baseCommand
      ? `${caseItem.baseCommand} / ${caseItem.interruptionCommand}`
      : caseItem.command,
    passed,
    checks,
    expected: {
      types: expectedTypes,
      textIncludes: expectedTextIncludes
    },
    actual: {
      types: actualTypes,
      text: generated.map((item) => `${speechTypeLabel(item.type)}：${item.text}`)
    },
    task: generated.task || {},
    groundingReport: generated.groundingReport || null,
    trace: [
      {
        agent: "Voice Feedback Evaluator",
        title: "语音反馈质量评估",
        status: passed ? "done" : "caution",
        detail: `场景：${caseItem.category}，评估关键状态话术是否正确触发。`,
        evidence: [
          `预期类型：${expectedTypes.join(" -> ")}`,
          `实际类型：${actualTypes.join(" -> ")}`,
          caseItem.note || "语音反馈需要帮助用户理解系统状态和下一步动作。"
        ]
      }
    ]
  };
}

function buildVoiceFeedbackSequence(caseItem) {
  const feedback = [];
  const add = (type, text) => feedback.push({ type, text });
  const command = caseItem.command || caseItem.baseCommand;
  const parseResult = parseCommand(command, { confirmed: Boolean(caseItem.confirmed), evaluationMode: true });
  const task = parseResult.task || {};

  add("understand", "我正在理解你的任务，并检查目标对象、位置和安全条件。");

  if (caseItem.category === "clarification" || parseResult.needClarification) {
    add("clarify", "我需要确认目标对象。请在候选项里选择你指的是哪一个。");
    feedback.task = task;
    feedback.groundingReport = parseResult.groundingReport || null;
    return feedback;
  }

  if (caseItem.category === "safety_confirmation" || (parseResult.needConfirmation && !caseItem.confirmed)) {
    add("confirm", task.riskLevel === "high"
      ? "这是高风险任务。我需要你确认后再执行，也可以转人工接管。"
      : "这个任务有安全约束。请确认是否继续执行。");
    feedback.task = task;
    feedback.groundingReport = parseResult.groundingReport || null;
    return feedback;
  }

  add("start", buildStartSpeech(task));

  if (caseItem.category === "recovery" && task.failureMode) {
    add("recovery", `${describeFailure(task.failureMode)} 请从恢复选项中选择下一步。`);
    feedback.task = task;
    feedback.groundingReport = parseResult.groundingReport || null;
    return feedback;
  }

  if (caseItem.category === "interruption") {
    const interruptionType = classifyInterruption(caseItem.interruptionCommand);
    const simulated = simulateInterruptionOutcome(task, caseItem.interruptionCommand, interruptionType);
    if (interruptionType === "change_destination") {
      add("interrupt", `用户改口更换目标位置：${simulated.task.destination}。我会取消旧动作，并按新的任务计划继续。`);
    } else if (interruptionType === "change_object") {
      add("interrupt", `用户改口更换目标对象：${simulated.task.object}。我会取消旧动作，并按新的任务计划继续。`);
    } else if (interruptionType === "route_replan") {
      add("interrupt", "用户要求重规划路径：绕开椅子障碍。我会取消旧动作，并按新的绕行路线继续。");
    }
    add("start", buildStartSpeech(simulated.task));
    add("progress", `我正在前往${simulated.task.destination}，并准备完成任务。`);
    add("done", "任务已完成。");
    feedback.task = simulated.task;
    feedback.groundingReport = parseResult.groundingReport || null;
    return feedback;
  }

  if (caseItem.category === "handoff") {
    add("handoff", "我已安全停止，并保留任务上下文供人工接管。");
    feedback.task = { ...task, status: "handoff" };
    feedback.groundingReport = parseResult.groundingReport || null;
    return feedback;
  }

  add("progress", `我正在前往${task.destination}，并准备完成任务。`);
  add("done", "任务已完成。");
  feedback.task = task;
  feedback.groundingReport = parseResult.groundingReport || null;
  return feedback;
}

function buildStartSpeech(task) {
  return `我已理解任务：${task.action}${task.object ? task.object : "目标对象"}，目标位置是${task.destination}。现在开始执行。`;
}

function simulateInterruptionCase(caseItem) {
  const baseResult = parseCommand(caseItem.baseCommand, { confirmed: true, evaluationMode: true });
  const baseTask = baseResult.task || {};
  const interruptionType = classifyInterruption(caseItem.interruptionCommand);
  const simulated = simulateInterruptionOutcome(baseTask, caseItem.interruptionCommand, interruptionType);
  const checks = [
    compareEvaluation("type", simulated.type, caseItem.expectedType),
    compareEvaluation("status", simulated.status, caseItem.expectedStatus),
    compareEvaluation("object", simulated.task.objectId, caseItem.expectedObjectId),
    compareEvaluation("destination", simulated.task.destinationId, caseItem.expectedDestinationId),
    compareEvaluation("routeMode", simulated.task.routeMode, caseItem.expectedRouteMode)
  ].filter((item) => item.expected !== undefined);

  const passed = checks.every((item) => item.pass);
  return {
    id: caseItem.id,
    baseCommand: caseItem.baseCommand,
    interruptionCommand: caseItem.interruptionCommand,
    passed,
    checks,
    task: simulated.task,
    groundingReport: baseResult.groundingReport || null,
    trace: [
      ...(baseResult.trace || []),
      {
        agent: "Interruption Evaluator",
        title: "打断行为评估",
        status: passed ? "done" : "caution",
        detail: `识别结果：${simulated.type || "ignored"}，预期：${caseItem.expectedType || "ignored"}。`,
        evidence: [
          `原始任务：${caseItem.baseCommand}`,
          `打断语句：${caseItem.interruptionCommand}`,
          `模拟状态：${simulated.status}`
        ]
      }
    ]
  };
}

function simulateInterruptionOutcome(baseTask, interruptionCommand, interruptionType) {
  const task = { ...baseTask, failureMode: null };

  if (!interruptionType) {
    return {
      type: null,
      status: "ignored",
      task: { ...task, status: "executing" }
    };
  }

  if (interruptionType === "pause") {
    return {
      type: interruptionType,
      status: "paused",
      task: { ...task, status: "paused" }
    };
  }

  if (interruptionType === "handoff") {
    return {
      type: interruptionType,
      status: "handoff",
      task: { ...task, status: "handoff" }
    };
  }

  if (interruptionType === "change_object") {
    const nextObject = inferObject(interruptionCommand);
    if (nextObject) {
      task.object = nextObject.name;
      task.objectId = nextObject.id;
      task.riskLevel = nextObject.risk || task.riskLevel;
      task.requiresHumanConfirmation = nextObject.risk !== "low";
    }
  }

  if (interruptionType === "change_destination") {
    const nextDestination = inferInterruptDestination(interruptionCommand);
    if (nextDestination) {
      task.destination = nextDestination.name;
      task.destinationId = nextDestination.id;
    }
  }

  if (interruptionType === "route_replan") {
    task.routeMode = "avoid_chair";
    task.routeConstraint = "绕开椅子障碍";
    task.constraints = mergeUnique([...(task.constraints || []), "主动绕开椅子障碍", "低速通过障碍附近"]);
  }

  return {
    type: interruptionType,
    status: "replanned",
    task: { ...task, status: "replanned" }
  };
}

function compareEvaluation(name, actual, expected) {
  return {
    name,
    actual,
    expected,
    pass: actual === expected
  };
}

function addTimeline(label, text) {
  const item = document.createElement("div");
  item.className = "timeline-item";
  item.innerHTML = `<strong>${label}</strong><span>${text}</span>`;
  nodes.timeline.prepend(item);
}

function setStatus(status) {
  nodes.agentStatus.textContent = status;
}

function loadRunLogs() {
  try {
    const saved = window.localStorage.getItem(RUN_LOG_STORAGE_KEY);
    state.runLogs = saved ? JSON.parse(saved) : [];
  } catch (error) {
    state.runLogs = [];
  }
}

function recordRunLog(type, message, detail = {}) {
  const entry = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    time: new Date().toLocaleString("zh-CN", { hour12: false }),
    type,
    message,
    detail,
    snapshot: {
      status: nodes.agentStatus?.textContent || "",
      robot: { ...state.robot },
      carryingObjectId: state.carryingObjectId,
      selectedObjectId: state.selectedObjectId,
      activeTask: state.activeTask ? { ...state.activeTask } : null,
      objects: state.objects.map((item) => ({
        id: item.id,
        name: item.name,
        x: item.x,
        y: item.y,
        zone: item.zone
      }))
    }
  };
  state.runLogs = [entry, ...state.runLogs].slice(0, MAX_RUN_LOGS);
  try {
    window.localStorage.setItem(RUN_LOG_STORAGE_KEY, JSON.stringify(state.runLogs));
  } catch (error) {
    // Local storage can be unavailable in restrictive browser modes; the page log still works in memory.
  }
  sendRunLogToServer(entry);
  renderRunLogs();
}

function sendRunLogToServer(entry) {
  try {
    window.fetch("/api/run-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
      keepalive: true
    }).catch(() => {});
  } catch (error) {
    // The static fallback server may not support POST; localStorage remains the fallback log.
  }
}

function renderRunLogs() {
  if (!nodes.runLog) return;
  if (!state.runLogs.length) {
    nodes.runLog.innerHTML = '<p class="muted">暂无运行日志。执行一次任务后会自动记录。</p>';
    return;
  }
  nodes.runLog.innerHTML = state.runLogs.slice(0, 18).map((entry) => {
    const carrying = entry.snapshot.carryingObjectId ? `携带：${entry.snapshot.carryingObjectId}` : "未携带";
    return `
      <article class="run-log-item">
        <div>
          <strong>${escapeHtml(entry.message)}</strong>
          <span>${escapeHtml(entry.time)} · ${escapeHtml(entry.type)} · ${escapeHtml(carrying)}</span>
        </div>
        <code>${escapeHtml(JSON.stringify(entry.detail))}</code>
      </article>
    `;
  }).join("");
}

function renderContextMemory() {
  if (!nodes.contextMemory) return;
  const decision = state.conversation.lastDecision;
  const pending = state.conversation.pendingQuestion;
  const lastTask = state.conversation.lastTask;
  const turns = state.conversation.turns || [];
  const decisionHtml = decision
    ? `
      <article class="context-decision">
        <header>
          <strong>${escapeHtml(decision.label)}</strong>
          <span>${Math.round((decision.confidence || 0) * 100)}%</span>
        </header>
        <p>${escapeHtml(decision.summary)}</p>
        <ul>${(decision.evidence || []).slice(0, 3).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      </article>
    `
    : '<p class="muted">等待用户指令后展示上下文判断。</p>';
  const pendingHtml = pending
    ? `
      <article class="context-chip warn">
        <strong>待处理</strong>
        <span>${escapeHtml(pending.prompt)}</span>
      </article>
    `
    : `
      <article class="context-chip">
        <strong>待处理</strong>
        <span>无待澄清或待确认任务</span>
      </article>
    `;
  const lastTaskHtml = lastTask
    ? `
      <article class="context-chip">
        <strong>上一任务</strong>
        <span>${escapeHtml(lastTask.object || "机器人自身")} -> ${escapeHtml(lastTask.destination || "未知位置")} · ${escapeHtml(lastTask.status || "parsed")}</span>
      </article>
    `
    : `
      <article class="context-chip">
        <strong>上一任务</strong>
        <span>暂无</span>
      </article>
    `;
  const turnHtml = turns.length
    ? turns.slice(0, 5).map((turn) => `
      <li>
        <strong>${escapeHtml(turn.decision)}</strong>
        <span>${escapeHtml(turn.command)}</span>
      </li>
    `).join("")
    : '<li><span>暂无多轮记录</span></li>';

  nodes.contextMemory.innerHTML = `
    ${decisionHtml}
    <div class="context-chip-grid">
      ${pendingHtml}
      ${lastTaskHtml}
    </div>
    <ol class="context-turns">${turnHtml}</ol>
  `;
}

function renderTaskQueue() {
  if (!nodes.taskQueue) return;
  const items = state.taskQueue.items || [];
  if (!items.length) {
    nodes.taskQueue.innerHTML = '<p class="muted">暂无队列。可以输入“先把红色杯子拿到厨房，再请你移动到客厅”。</p>';
    return;
  }

  const counts = {
    queued: items.filter((item) => item.status === "queued").length,
    running: items.filter((item) => ["current", "running", "waiting_input", "safety_gated"].includes(item.status)).length,
    done: items.filter((item) => item.status === "done").length,
    canceled: items.filter((item) => item.status === "canceled").length
  };
  const summary = `
    <div class="queue-summary">
      <span>进行中 ${counts.running}</span>
      <span>等待 ${counts.queued}</span>
      <span>完成 ${counts.done}</span>
      <span>取消 ${counts.canceled}</span>
    </div>
  `;
  const list = items.map((item) => `
    <article class="queue-item ${item.status} priority-${item.priority}">
      <header>
        <strong>${item.index + 1}. ${escapeHtml(queueStatusLabel(item.status))}</strong>
        <span>${escapeHtml(queuePriorityLabel(item.priority))}</span>
      </header>
      <p>${escapeHtml(item.command)}</p>
      <div>
        <small>风险 ${escapeHtml(item.risk || "low")}</small>
        ${item.destination ? `<small>${escapeHtml(item.object || "机器人")} -> ${escapeHtml(item.destination)}</small>` : ""}
      </div>
    </article>
  `).join("");

  nodes.taskQueue.innerHTML = `${summary}<div class="queue-list">${list}</div>`;
}

function renderPerceptionFeed() {
  if (!nodes.perceptionFeed) return;
  const events = state.perception.events || [];
  if (!events.length) {
    nodes.perceptionFeed.innerHTML = '<p class="muted">暂无环境变化。可触发上方事件验证重新定位、重规划或恢复。</p>';
    return;
  }
  nodes.perceptionFeed.innerHTML = events.map((event) => `
    <article class="perception-item ${event.severity}">
      <header>
        <strong>${escapeHtml(event.title)}</strong>
        <span>${escapeHtml(event.time)}</span>
      </header>
      <p>${escapeHtml(event.summary)}</p>
      <small>${escapeHtml(perceptionActionLabel(event.action))}</small>
    </article>
  `).join("");
}

function perceptionActionLabel(action) {
  const labels = {
    continue: "继续执行",
    reground_and_replan: "重新定位并重规划",
    update_world_state: "更新世界状态",
    pause_for_recovery: "暂停并进入恢复",
    update_destination_and_route: "更新目标点和路线"
  };
  return labels[action] || "感知更新";
}

function queueStatusLabel(status) {
  const labels = {
    current: "当前任务",
    running: "执行中",
    queued: "等待执行",
    waiting_input: "等待澄清",
    safety_gated: "等待确认",
    done: "已完成",
    canceled: "已取消"
  };
  return labels[status] || "队列任务";
}

function queuePriorityLabel(priority) {
  const labels = {
    high: "高优先",
    medium: "中优先",
    normal: "普通"
  };
  return labels[priority] || "普通";
}

function exportRunLogs() {
  const blob = new Blob([JSON.stringify(state.runLogs, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `voice-to-action-run-logs-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function clearRunLogs() {
  state.runLogs = [];
  window.localStorage.removeItem(RUN_LOG_STORAGE_KEY);
  renderRunLogs();
}

function updateVoiceInteractionState(nextState, patch = {}) {
  state.voiceInteraction = {
    ...state.voiceInteraction,
    ...patch,
    state: nextState || state.voiceInteraction.state
  };
  if (nodes.voiceLiteCard) {
    const source = state.voiceInteraction.source || "";
    const isVoiceSource = source === "voice" || source === "voice-confirmed" || source === "fallback";
    const isVoiceReview = ["listening", "reviewing"].includes(state.voiceInteraction.state);
    nodes.voiceLiteCard.open = isVoiceReview || (isVoiceSource && !["idle", "done"].includes(state.voiceInteraction.state));
  }
  renderVoiceInteractionConsole();
}

function renderVoiceInteractionConsole() {
  if (!nodes.voiceStatePill || !nodes.voiceStateRail || !nodes.voiceMetricsGrid) return;
  const steps = [
    { id: "idle", label: "空闲" },
    { id: "listening", label: "听取" },
    { id: "reviewing", label: "确认识别" },
    { id: "understanding", label: "理解" },
    { id: "clarifying", label: "澄清" },
    { id: "confirming", label: "确认" },
    { id: "executing", label: "执行" },
    { id: "recovering", label: "恢复" },
    { id: "done", label: "完成" }
  ];
  const currentIndex = Math.max(0, steps.findIndex((step) => step.id === state.voiceInteraction.state));
  const activeStep = steps[currentIndex] || steps[0];
  nodes.voiceStatePill.textContent = activeStep.label;
  nodes.voiceStatePill.dataset.state = state.voiceInteraction.state;
  nodes.voiceStateRail.innerHTML = steps.map((step, index) => {
    const stateClass = index < currentIndex ? "done" : index === currentIndex ? "active" : "";
    return `<span class="${stateClass}">${step.label}</span>`;
  }).join("");

  if (nodes.voiceTranscriptDraft && document.activeElement !== nodes.voiceTranscriptDraft) {
    nodes.voiceTranscriptDraft.value = state.voiceInteraction.transcript || "";
  }

  const confidence = state.voiceInteraction.confidence == null
    ? "-"
    : `${Math.round(state.voiceInteraction.confidence * 100)}%`;
  nodes.voiceMetricsGrid.innerHTML = `
    <div><strong>${state.voiceInteraction.metrics.heard}</strong><span>识别轮次</span></div>
    <div><strong>${state.voiceInteraction.metrics.confirmed}</strong><span>确认执行</span></div>
    <div><strong>${state.voiceInteraction.metrics.edited}</strong><span>人工修正</span></div>
    <div><strong>${state.voiceInteraction.metrics.fallbacks}</strong><span>兜底次数</span></div>
    <div><strong>${confidence}</strong><span>识别置信</span></div>
    <div><strong>${state.voiceInteraction.demoMode ? `Step ${state.voiceInteraction.demoStep}` : state.voiceInteraction.source}</strong><span>输入来源</span></div>
  `;
}

function useVoiceTranscript() {
  const transcript = (nodes.voiceTranscriptDraft?.value || "").trim();
  if (!transcript) {
    updateVoiceInteractionState("idle", { transcript: "" });
    addSpeechFeedback("speech", "识别确认区为空，请先语音输入或手动输入任务。");
    return;
  }
  const wasEdited = transcript !== state.voiceInteraction.transcript;
  state.voiceInteraction.metrics.confirmed += 1;
  if (wasEdited) state.voiceInteraction.metrics.edited += 1;
  state.metrics.voiceTurns += 1;
  nodes.commandInput.value = transcript;
  updateVoiceInteractionState("understanding", { transcript, source: "voice-confirmed" });
  recordRunLog("voice-confirm", "用户确认语音识别结果并执行", {
    transcript,
    wasEdited,
    confidence: state.voiceInteraction.confidence
  });
  runCommand(transcript, { fromVoice: true });
}

function clearVoiceTranscript() {
  updateVoiceInteractionState("idle", {
    transcript: "",
    confidence: null,
    source: "manual"
  });
  if (nodes.voiceTranscriptDraft) nodes.voiceTranscriptDraft.value = "";
  recordRunLog("voice-clear", "清空语音识别确认区");
}

function simulateVoiceUtterance(transcript, options = {}) {
  state.voiceInteraction.metrics.heard += 1;
  state.metrics.voiceTurns += 1;
  nodes.commandInput.value = transcript;
  updateVoiceInteractionState(options.state || "understanding", {
    transcript,
    confidence: options.confidence ?? 0.94,
    source: options.source || "demo"
  });
  recordRunLog("voice-demo-utterance", "语音 PM Demo 注入一轮语音输入", {
    transcript,
    demoStep: state.voiceInteraction.demoStep,
    followUp: Boolean(options.followUp)
  });
  addTimeline("Voice Demo", `模拟用户说：${transcript}`);
  runCommand(transcript, { fromVoice: true, followUp: Boolean(options.followUp), confirmed: Boolean(options.confirmed) });
}

function runVoicePmDemo() {
  resetScene();
  state.speech.enabled = true;
  nodes.speechToggle.checked = true;
  state.voiceInteraction.demoMode = true;
  state.voiceInteraction.demoStep = 1;
  updateVoiceInteractionState("listening", {
    transcript: "",
    confidence: null,
    source: "demo"
  });
  addSpeechFeedback("speech", "语音 PM Demo 开始。我会串联澄清、安全确认、中途改口和动态环境恢复。");
  recordRunLog("voice-demo-start", "启动 V3.6 语音 PM Demo");

  const steps = [
    { delay: 600, step: 1, text: "把杯子拿到厨房", followUp: false },
    { delay: 2300, step: 1, text: "红色的", followUp: true },
    { delay: 9800, step: 2, text: "把重箱子搬到门口", followUp: false },
    { delay: 11600, step: 2, text: "确认", followUp: true },
    { delay: 17600, step: 3, text: "把红色杯子拿到厨房台面", followUp: false },
    { delay: 19800, step: 3, text: "别放厨房了，放门口", followUp: true },
    { delay: 27600, step: 4, text: "把重箱子搬到门口，绕开椅子走", followUp: false },
    { delay: 29400, step: 4, text: "确认", followUp: true },
    { delay: 30900, step: 4, perception: "path_blocked" }
  ];

  steps.forEach((item) => {
    window.setTimeout(() => {
      state.voiceInteraction.demoStep = item.step;
      if (item.perception) {
        updateVoiceInteractionState("recovering", { source: "demo-perception" });
        applyPerceptionEvent(item.perception);
        return;
      }
      simulateVoiceUtterance(item.text, { followUp: item.followUp, source: "demo" });
    }, item.delay);
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function findObject(id) {
  return state.objects.find((item) => item.id === id);
}

function startVoiceInput() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    state.voiceInteraction.metrics.fallbacks += 1;
    state.metrics.voiceFallbacks += 1;
    updateVoiceInteractionState("idle", { source: "fallback" });
    updateMetrics();
    nodes.interactionBox.innerHTML = '<span class="tag warn">语音不可用</span><p class="muted" style="margin-top:8px;">当前浏览器不支持 Web Speech API，请使用文本输入。</p>';
    addSpeechFeedback("speech", "当前浏览器不支持语音输入。请使用文本输入任务。");
    recordRunLog("voice-fallback", "浏览器不支持语音输入，降级到文本输入");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "zh-CN";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  setStatus("Listening");
  updateVoiceInteractionState("listening", { source: "voice", transcript: "", confidence: null });
  nodes.interactionBox.innerHTML = '<span class="tag info">正在听</span><p class="muted" style="margin-top:8px;">请说出完整任务。识别结果会先进入确认区，你可以修改后再执行。</p>';
  recordRunLog("voice-listening", "开始语音识别");
  recognition.start();

  recognition.onresult = (event) => {
    const result = event.results[0][0];
    const transcript = result.transcript;
    const confidence = Number.isFinite(result.confidence) ? result.confidence : null;
    state.voiceInteraction.metrics.heard += 1;
    nodes.commandInput.value = transcript;
    if (nodes.voiceTranscriptDraft) nodes.voiceTranscriptDraft.value = transcript;
    updateVoiceInteractionState("reviewing", { transcript, confidence, source: "voice" });
    updateMetrics();
    addTimeline("Voice", `识别到语音：${transcript}`);
    recordRunLog("voice-result", "语音识别结果进入确认区", { transcript, confidence });
    nodes.interactionBox.innerHTML = `
      <span class="tag info">待确认识别</span>
      <p class="muted" style="margin-top:8px;">已识别：“${escapeHtml(transcript)}”。请在语音识别确认区检查，必要时修改后点击“使用并执行”。</p>
    `;
    addSpeechFeedback("speech", "我已识别到语音，请你确认识别结果后再执行。", { skipMetric: true });
  };

  recognition.onerror = () => {
    state.voiceInteraction.metrics.fallbacks += 1;
    state.metrics.voiceFallbacks += 1;
    setStatus("Ready");
    updateVoiceInteractionState("idle", { source: "fallback" });
    updateMetrics();
    nodes.interactionBox.innerHTML = '<span class="tag warn">语音失败</span><p class="muted" style="margin-top:8px;">语音识别失败，请重试或改用文本输入。</p>';
    addSpeechFeedback("speech", "语音识别失败。请重试，或改用文本输入。");
    recordRunLog("voice-error", "语音识别失败，提示用户重试或使用文本输入");
  };

  recognition.onend = () => {
    if (state.voiceInteraction.state === "listening") {
      state.voiceInteraction.metrics.fallbacks += 1;
      state.metrics.voiceFallbacks += 1;
      updateVoiceInteractionState("idle", { source: "fallback" });
      updateMetrics();
      nodes.interactionBox.innerHTML = '<span class="tag warn">未识别到语音</span><p class="muted" style="margin-top:8px;">没有拿到有效识别结果，请靠近麦克风重试，或直接输入文本。</p>';
      recordRunLog("voice-empty", "语音识别结束但没有返回有效结果");
    }
  };
}

init();
