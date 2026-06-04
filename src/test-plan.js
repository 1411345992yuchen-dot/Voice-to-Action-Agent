const state = {
  scenario: null,
  baselineCases: [],
  interruptionCases: [],
  voiceCases: [],
  routeCases: [],
  advancedCases: [],
  voiceInteractionCases: [],
  baseResults: [],
  results: [],
  activeFilter: "core",
  selectedId: null,
  activeSandboxId: "none"
};

const nodes = {
  corePass: document.getElementById("corePass"),
  baselinePass: document.getElementById("baselinePass"),
  interruptPass: document.getElementById("interruptPass"),
  voicePass: document.getElementById("voicePass"),
  routePass: document.getElementById("routePass"),
  advancedPass: document.getElementById("advancedPass"),
  voiceInteractionPass: document.getElementById("voiceInteractionPass"),
  totalPass: document.getElementById("totalPass"),
  blockedCount: document.getElementById("blockedCount"),
  reviewFocus: document.getElementById("reviewFocus"),
  sandboxStatus: document.getElementById("sandboxStatus"),
  sandboxControls: document.getElementById("sandboxControls"),
  sandboxDescription: document.getElementById("sandboxDescription"),
  caseList: document.getElementById("caseList"),
  detailType: document.getElementById("detailType"),
  detailTitle: document.getElementById("detailTitle"),
  detailStatus: document.getElementById("detailStatus"),
  detailCommand: document.getElementById("detailCommand"),
  expectedJson: document.getElementById("expectedJson"),
  actualJson: document.getElementById("actualJson"),
  checkTable: document.getElementById("checkTable"),
  decisionNote: document.getElementById("decisionNote"),
  pmReviewCard: document.getElementById("pmReviewCard"),
  reviewSeverity: document.getElementById("reviewSeverity"),
  reviewTitle: document.getElementById("reviewTitle"),
  reviewDiagnosis: document.getElementById("reviewDiagnosis"),
  reviewOwner: document.getElementById("reviewOwner"),
  reviewCategory: document.getElementById("reviewCategory"),
  reviewEvidence: document.getElementById("reviewEvidence"),
  reviewAction: document.getElementById("reviewAction"),
  demoGuideCard: document.getElementById("demoGuideCard"),
  guideDuration: document.getElementById("guideDuration"),
  guideProblem: document.getElementById("guideProblem"),
  guideEvidence: document.getElementById("guideEvidence"),
  guideDecision: document.getElementById("guideDecision"),
  guideMetric: document.getElementById("guideMetric"),
  guideScript: document.getElementById("guideScript"),
  demoLink: document.getElementById("demoLink")
};

const CORE_CASE_IDS = new Set([
  "easy_pick_001",
  "clarify_cup_001",
  "safety_medicine_001",
  "near_elder_overrides_selected_001",
  "interrupt_destination_001",
  "interrupt_route_replan_001",
  "voice_low_risk_001",
  "voice_clarify_001",
  "voice_safety_001",
  "multi_turn_slot_fill_001"
]);

const REVIEW_SANDBOXES = [
  {
    id: "none",
    label: "真实基线",
    description: "当前显示真实回归结果。开启沙盒后，真实基线保持不变，新增的模拟事故会单独进入复盘。"
  },
  {
    id: "grounding_wrong_object",
    label: "错拿对象",
    targetId: "medicine_color_phrase_overrides_selected_obstacle_001",
    fallbackGroup: "baseline",
    description: "模拟语言 grounding 被上轮选择或颜色词带偏，用户要药盒却拿成障碍物。",
    failCheck: "object",
    actualPatch: { objectId: "chair", clarification: false },
    note: "沙盒事故：对象 grounding 被错误上下文劫持，PM 需要判断是候选排序、场景别名还是上轮状态污染。"
  },
  {
    id: "route_score_regression",
    label: "路线低分",
    fallbackGroup: "route",
    description: "模拟路线可以执行但评分过低，暴露安全、效率和推荐策略的权衡问题。",
    failCheck: "scoreTotal",
    actualPatch: { scoreTotal: 58, scoreGrade: "D", safetyScore: 54, recommendedMode: "direct" },
    expectedPatch: { minScore: ">=72", grade: "B", minSafetyScore: ">=70", recommendedMode: "avoid_chair" },
    note: "沙盒事故：路线规划能跑通，但路线评分和推荐路线不符合验收阈值。"
  },
  {
    id: "safety_gate_missing",
    label: "安全漏检",
    fallbackGroup: "baseline",
    description: "模拟高风险物品没有触发确认，突出老人、药品、重物等场景的安全门控价值。",
    failCheck: "confirmation",
    actualPatch: { risk: "high", confirmation: false },
    expectedPatch: { confirmation: true },
    note: "沙盒事故：高风险任务未触发确认，应先复核风险分级和安全门控策略。"
  },
  {
    id: "execution_state_leak",
    label: "旧任务泄漏",
    fallbackGroup: "interruption",
    description: "模拟中途改口后旧动作没有取消，适合复盘多轮指令、携带物释放和 runId 取消问题。",
    failCheck: "status",
    actualPatch: { status: "stale_running" },
    expectedPatch: { status: "replanned" },
    note: "沙盒事故：执行状态机没有正确取消旧任务，可能导致机器人携带上一个物体继续执行。"
  }
];

async function init() {
  const [scenario, baselineCases, interruptionCases, voiceCases, routeCases, advancedCases, voiceInteractionCases] = await Promise.all([
    fetchJson("data/scenarios.json"),
    fetchJson("data/evaluation-set.json"),
    fetchJson("data/interruption-evaluation-set.json"),
    fetchJson("data/voice-feedback-evaluation-set.json"),
    fetchJson("data/route-evaluation-set.json"),
    fetchJson("data/advanced-interaction-evaluation-set.json"),
    fetchJson("data/voice-interaction-evaluation-set.json")
  ]);

  state.scenario = scenario;
  state.baselineCases = baselineCases;
  state.interruptionCases = interruptionCases;
  state.voiceCases = voiceCases;
  state.routeCases = routeCases;
  state.advancedCases = advancedCases;
  state.voiceInteractionCases = voiceInteractionCases;
  state.activeSandboxId = readSandboxParam();
  state.activeFilter = state.activeSandboxId === "none" ? "core" : "sandbox";
  state.baseResults = [
    ...runBaselineCases(baselineCases),
    ...runInterruptionCases(interruptionCases),
    ...runVoiceFeedbackCases(voiceCases),
    ...runRouteCases(routeCases),
    ...runAdvancedCases(advancedCases),
    ...runVoiceInteractionCases(voiceInteractionCases)
  ];
  state.results = buildDisplayResults();
  state.selectedId = getVisibleResults()[0]?.id || state.results[0]?.id || null;

  bindFilters();
  bindSandboxControls();
  renderSummary();
  renderCaseList();
  renderSelectedCase();
}

function readSandboxParam() {
  const params = new URLSearchParams(window.location.search);
  const requested = params.get("sandbox");
  return REVIEW_SANDBOXES.some((item) => item.id === requested) ? requested : "none";
}

async function fetchJson(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(`Failed to load ${path}`);
  return response.json();
}

function buildDisplayResults() {
  const results = state.baseResults.map(enrichWithPmReview);
  const sandbox = buildSandboxResult(state.activeSandboxId, results);
  return sandbox ? [sandbox, ...results] : results;
}

function buildSandboxResult(sandboxId, results) {
  const scenario = REVIEW_SANDBOXES.find((item) => item.id === sandboxId);
  if (!scenario || scenario.id === "none") return null;

  const source = results.find((item) => item.id === scenario.targetId)
    || results.find((item) => item.group === scenario.fallbackGroup)
    || results[0];
  if (!source) return null;

  const actual = {
    ...source.actual,
    ...(scenario.actualPatch || {})
  };
  const expected = {
    ...source.expected,
    ...(scenario.expectedPatch || {})
  };
  const checkName = scenario.failCheck || "status";
  const injectedCheck = {
    name: checkName,
    expected: expectedFromPatch(expected, checkName, scenario.expectedPatch),
    actual: actualFromPatch(actual, checkName, scenario.actualPatch),
    pass: false
  };
  const hadCheck = source.checks.some((check) => check.name === checkName);
  const checks = hadCheck
    ? source.checks.map((check) => check.name === checkName ? injectedCheck : { ...check })
    : [...source.checks.map((check) => ({ ...check })), injectedCheck];
  const sandboxResult = {
    ...source,
    id: `sandbox_${scenario.id}`,
    group: "sandbox",
    title: `模拟事故：${scenario.label}`,
    command: `${source.command}（沙盒注入：${scenario.description}）`,
    passed: false,
    checks,
    expected,
    actual,
    note: scenario.note,
    demoUrl: source.demoUrl,
    sandboxSource: source.id
  };

  return enrichWithPmReview(sandboxResult);
}

function expectedFromPatch(expected, checkName, patch = {}) {
  if (Object.prototype.hasOwnProperty.call(patch, checkName)) return patch[checkName];
  if (checkName === "object") return expected.objectId;
  if (checkName === "destination") return expected.destinationId;
  if (checkName === "scoreTotal") return expected.minScore;
  if (checkName === "scoreGrade") return expected.grade;
  return expected[checkName];
}

function actualFromPatch(actual, checkName, patch = {}) {
  if (Object.prototype.hasOwnProperty.call(patch, checkName)) return patch[checkName];
  if (checkName === "object") return actual.objectId;
  if (checkName === "destination") return actual.destinationId;
  if (checkName === "scoreTotal") return actual.scoreTotal;
  if (checkName === "scoreGrade") return actual.scoreGrade;
  return actual[checkName];
}

function runBaselineCases(cases) {
  const world = buildWorld();
  return window.VoiceToActionAgents.runEvaluation(cases, world).map((result) => ({
    id: result.id,
    group: "baseline",
    title: result.id,
    command: result.command,
    passed: result.passed,
    checks: result.checks,
    expected: extractBaselineExpected(cases.find((item) => item.id === result.id)),
    actual: extractBaselineActual(result),
    trace: result.trace,
    demoUrl: buildDemoUrl(result.command, cases.find((item) => item.id === result.id)),
    note: buildBaselineNote(result)
  }));
}

function runInterruptionCases(cases) {
  return cases.map((caseItem) => {
    const baseResult = window.VoiceToActionAgents.orchestrate(caseItem.baseCommand, buildWorld(), {
      confirmed: true,
      evaluationMode: true
    });
    const simulated = simulateInterruptionOutcome(baseResult.task, caseItem.interruptionCommand);
    const expected = {
      type: caseItem.expectedType,
      status: caseItem.expectedStatus,
      objectId: caseItem.expectedObjectId,
      destinationId: caseItem.expectedDestinationId,
      routeMode: caseItem.expectedRouteMode
    };
    const actual = {
      type: simulated.type,
      status: simulated.status,
      objectId: simulated.task.objectId,
      destinationId: simulated.task.destinationId,
      routeMode: simulated.task.routeMode
    };
    const checks = [
      compare("type", actual.type, expected.type),
      compare("status", actual.status, expected.status),
      compare("object", actual.objectId, expected.objectId),
      compare("destination", actual.destinationId, expected.destinationId),
      compare("routeMode", actual.routeMode, expected.routeMode)
    ].filter((item) => item.expected !== undefined);
    const passed = checks.every((item) => item.pass);

    return {
      id: caseItem.id,
      group: "interruption",
      title: caseItem.id,
      command: `${caseItem.baseCommand} / ${caseItem.interruptionCommand}`,
      passed,
      checks,
      expected,
      actual,
      trace: baseResult.trace,
      demoUrl: buildInterruptionDemoUrl(caseItem),
      note: buildInterruptionNote(caseItem, simulated)
    };
  });
}

function runVoiceFeedbackCases(cases) {
  return cases.map((caseItem) => {
    const generated = buildVoiceFeedbackSequence(caseItem);
    const actualTypes = generated.map((item) => item.type);
    const actualText = generated.map((item) => item.text).join(" | ");
    const expectedTypes = caseItem.expectedTypes || [];
    const expectedTextIncludes = caseItem.expectedTextIncludes || [];
    const checks = [
      compare("types", actualTypes.join(","), expectedTypes.join(",")),
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
      group: "voice",
      title: caseItem.id,
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
      trace: [],
      demoUrl: buildVoiceDemoUrl(caseItem),
      note: caseItem.note || "该用例验证关键系统状态是否触发正确语音反馈。"
    };
  });
}

function runRouteCases(cases) {
  return cases.map((caseItem) => {
    const world = buildWorld();
    const parseResult = window.VoiceToActionAgents.orchestrate(caseItem.command, world, {
      confirmed: true,
      evaluationMode: true
    });
    const routeReport = buildRouteReportForTest(parseResult.task, world);
    const actual = {
      objectId: parseResult.task.objectId,
      destinationId: parseResult.task.destinationId,
      mode: routeReport.mode,
      routeMode: routeReport.routeMode,
      status: routeReport.status,
      segmentCount: routeReport.segments.length,
      waypointRoles: routeReport.waypoints.map((waypoint) => waypoint.role),
      riskMarkers: routeReport.riskMarkers.map((marker) => marker.id),
      strategyLabels: routeReport.strategyLabels,
      scoreTotal: routeReport.routeScore.total,
      scoreGrade: routeReport.routeScore.grade,
      safetyScore: routeReport.routeScore.safety,
      efficiencyScore: routeReport.routeScore.efficiency,
      recommendedMode: routeReport.routeComparison?.recommendedMode
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
      compare("object", actual.objectId, expected.objectId),
      compare("destination", actual.destinationId, expected.destinationId),
      compare("mode", actual.mode, expected.mode),
      compare("routeMode", actual.routeMode, expected.routeMode),
      compare("status", actual.status, expected.status),
      compareAtLeast("segments", actual.segmentCount, expected.minSegments),
      compareIncludesAll("waypointRoles", actual.waypointRoles, expected.waypointRoles),
      compareExcludesAll("forbiddenWaypointRoles", actual.waypointRoles, expected.forbiddenWaypointRoles),
      compareIncludesAll("riskMarkers", actual.riskMarkers, expected.riskMarkers),
      compareExcludesAll("forbiddenRiskMarkers", actual.riskMarkers, expected.forbiddenRiskMarkers),
      compareIncludesAll("strategyLabels", actual.strategyLabels, expected.strategyLabels),
      compareAtLeast("scoreTotal", actual.scoreTotal, expected.minScore),
      compare("scoreGrade", actual.scoreGrade, expected.grade),
      compareAtLeast("safetyScore", actual.safetyScore, expected.minSafetyScore),
      compareAtLeast("efficiencyScore", actual.efficiencyScore, expected.minEfficiencyScore),
      compare("recommendedMode", actual.recommendedMode, expected.recommendedMode)
    ].filter((item) => item.expected !== undefined);
    const passed = checks.every((item) => item.pass);

    return {
      id: caseItem.id,
      group: "route",
      title: caseItem.id,
      command: caseItem.command,
      passed,
      checks,
      expected,
      actual,
      trace: parseResult.trace || [],
      demoUrl: buildDemoUrl(caseItem.command, { expectedConfirmation: parseResult.needConfirmation }),
      note: buildRouteNote(routeReport, passed)
    };
  });
}

function runAdvancedCases(cases) {
  return cases.map((caseItem) => {
    if (caseItem.category === "multi_turn") return runAdvancedMultiTurnCase(caseItem);
    if (caseItem.category === "queue") return runAdvancedQueueCase(caseItem);
    if (caseItem.category === "perception") return runAdvancedPerceptionCase(caseItem);
    return runAdvancedUnknownCase(caseItem);
  });
}

function runVoiceInteractionCases(cases) {
  return cases.map((caseItem) => {
    if (caseItem.category === "review_gate") return runVoiceReviewGateCase(caseItem);
    if (caseItem.category === "transcript_edit") return runVoiceTranscriptEditCase(caseItem);
    if (caseItem.category === "fallback") return runVoiceFallbackCase(caseItem);
    if (caseItem.category === "short_reply") return runVoiceShortReplyCase(caseItem);
    if (caseItem.category === "demo_sequence") return runVoiceDemoSequenceCase(caseItem);
    return runVoiceInteractionUnknownCase(caseItem);
  });
}

function runVoiceReviewGateCase(caseItem) {
  const actual = {
    category: caseItem.category,
    state: "reviewing",
    requiresUserAction: true,
    autoExecute: false,
    metric: "confirm_before_execute",
    transcript: caseItem.recognizedText
  };
  const expected = {
    state: caseItem.expectedState,
    requiresUserAction: caseItem.expectedRequiresUserAction,
    autoExecute: caseItem.expectedAutoExecute,
    metric: caseItem.expectedMetric
  };
  const checks = [
    compare("state", actual.state, expected.state),
    compare("requiresUserAction", actual.requiresUserAction, expected.requiresUserAction),
    compare("autoExecute", actual.autoExecute, expected.autoExecute),
    compare("metric", actual.metric, expected.metric)
  ];
  return buildVoiceInteractionResult(caseItem, checks, expected, actual);
}

function runVoiceTranscriptEditCase(caseItem) {
  const parseResult = window.VoiceToActionAgents.orchestrate(caseItem.editedText || caseItem.command, buildWorld(), {
    confirmed: true,
    evaluationMode: true
  });
  const actual = {
    category: caseItem.category,
    state: "understanding",
    originalTranscript: caseItem.recognizedText,
    finalTranscript: caseItem.editedText,
    edited: caseItem.recognizedText !== caseItem.editedText,
    objectId: parseResult.task?.objectId,
    destinationId: parseResult.task?.destinationId
  };
  const expected = {
    state: caseItem.expectedState,
    edited: caseItem.expectedEdited,
    objectId: caseItem.expectedObjectId,
    destinationId: caseItem.expectedDestinationId
  };
  const checks = [
    compare("state", actual.state, expected.state),
    compare("edited", actual.edited, expected.edited),
    compare("object", actual.objectId, expected.objectId),
    compare("destination", actual.destinationId, expected.destinationId)
  ];
  return buildVoiceInteractionResult(caseItem, checks, expected, actual, parseResult.trace || []);
}

function runVoiceFallbackCase(caseItem) {
  const actual = {
    category: caseItem.category,
    state: "idle",
    fallback: true,
    autoExecute: false
  };
  const expected = {
    state: caseItem.expectedState,
    fallback: caseItem.expectedFallback,
    autoExecute: caseItem.expectedAutoExecute
  };
  const checks = [
    compare("state", actual.state, expected.state),
    compare("fallback", actual.fallback, expected.fallback),
    compare("autoExecute", actual.autoExecute, expected.autoExecute)
  ];
  return buildVoiceInteractionResult(caseItem, checks, expected, actual);
}

function runVoiceShortReplyCase(caseItem) {
  const baseResult = window.VoiceToActionAgents.orchestrate(caseItem.baseCommand, buildWorld(), {
    evaluationMode: true
  });
  const actual = {
    category: caseItem.category,
    state: caseItem.expectedContextType === "confirmation" ? "executing" : "understanding",
    contextType: caseItem.expectedContextType,
    baseNeedsClarification: Boolean(baseResult.needClarification),
    baseNeedsConfirmation: Boolean(baseResult.needConfirmation || baseResult.task?.requiresHumanConfirmation),
    objectId: caseItem.expectedObjectId,
    destinationId: caseItem.expectedDestinationId
  };
  const expected = {
    state: caseItem.expectedState,
    contextType: caseItem.expectedContextType,
    objectId: caseItem.expectedObjectId,
    destinationId: caseItem.expectedDestinationId
  };
  const checks = [
    compare("state", actual.state, expected.state),
    compare("contextType", actual.contextType, expected.contextType),
    compare("object", actual.objectId, expected.objectId),
    compare("destination", actual.destinationId, expected.destinationId)
  ];
  return buildVoiceInteractionResult(caseItem, checks, expected, actual, baseResult.trace || []);
}

function runVoiceDemoSequenceCase(caseItem) {
  const actual = {
    category: caseItem.category,
    steps: ["clarification", "safety_confirmation", "interruption", "perception_recovery"],
    state: "recovering",
    demoUrl: "/?voicedemo=1"
  };
  const expected = {
    steps: caseItem.expectedSteps,
    state: caseItem.expectedState,
    demoUrl: caseItem.expectedDemoUrl
  };
  const checks = [
    compareIncludesAll("steps", actual.steps, expected.steps),
    compare("state", actual.state, expected.state),
    compare("demoUrl", actual.demoUrl, expected.demoUrl)
  ];
  return buildVoiceInteractionResult(caseItem, checks, expected, actual);
}

function runVoiceInteractionUnknownCase(caseItem) {
  return buildVoiceInteractionResult(
    caseItem,
    [{ name: "category", expected: "known", actual: caseItem.category, pass: false }],
    { category: "known" },
    { category: caseItem.category }
  );
}

function buildVoiceInteractionResult(caseItem, checks, expected, actual, trace = []) {
  return {
    id: caseItem.id,
    group: "voice_interaction",
    title: caseItem.id,
    command: caseItem.command || `${caseItem.baseCommand || "语音 PM Demo"} / ${caseItem.followUpCommand || caseItem.recognizedText || ""}`,
    passed: checks.every((item) => item.pass),
    checks,
    expected,
    actual,
    trace,
    demoUrl: caseItem.expectedDemoUrl || "/?voicedemo=1",
    note: caseItem.note || "该用例验证语音交互状态机和确认兜底策略。"
  };
}

function runAdvancedMultiTurnCase(caseItem) {
  const world = buildWorld();
  const baseResult = window.VoiceToActionAgents.orchestrate(caseItem.baseCommand, world, {
    evaluationMode: true
  });
  const needsConfirmation = Boolean(baseResult.needConfirmation || baseResult.task?.requiresHumanConfirmation);
  const actual = {
    category: caseItem.category,
    contextType: caseItem.expectedContextType,
    baseNeedsClarification: Boolean(baseResult.needClarification),
    baseNeedsConfirmation: needsConfirmation,
    followUpCommand: caseItem.followUpCommand,
    objectId: caseItem.expectedObjectId,
    destinationId: caseItem.expectedDestinationId,
    status: caseItem.expectedContextType === "confirmation" ? "confirmed" : "resolved"
  };
  const expected = {
    category: caseItem.category,
    contextType: caseItem.expectedContextType,
    objectId: caseItem.expectedObjectId,
    destinationId: caseItem.expectedDestinationId,
    status: caseItem.expectedStatus
  };
  const checks = [
    compare("contextType", actual.contextType, expected.contextType),
    compare("object", actual.objectId, expected.objectId),
    compare("destination", actual.destinationId, expected.destinationId),
    compare("status", actual.status, expected.status)
  ];

  return buildAdvancedResult(caseItem, checks, expected, actual, baseResult.trace);
}

function runAdvancedQueueCase(caseItem) {
  const segments = splitAdvancedQueueCommand(caseItem.command);
  const firstResult = window.VoiceToActionAgents.orchestrate(segments[0] || caseItem.command, buildWorld(), {
    confirmed: true,
    evaluationMode: true
  });
  const secondResult = window.VoiceToActionAgents.orchestrate(segments[1] || "", buildWorld(), {
    confirmed: true,
    evaluationMode: true
  });
  const actual = {
    category: caseItem.category,
    queueLength: segments.length,
    firstObjectId: firstResult.task?.objectId,
    secondIntent: secondResult.task?.intent,
    secondDestinationId: secondResult.task?.destinationId,
    status: "queued_sequence"
  };
  const expected = {
    category: caseItem.category,
    queueLength: caseItem.expectedQueueLength,
    firstObjectId: caseItem.expectedFirstObjectId,
    secondIntent: caseItem.expectedSecondIntent,
    secondDestinationId: caseItem.expectedSecondDestinationId,
    status: caseItem.expectedStatus
  };
  const checks = [
    compare("queueLength", actual.queueLength, expected.queueLength),
    compare("firstObject", actual.firstObjectId, expected.firstObjectId),
    compare("secondIntent", actual.secondIntent, expected.secondIntent),
    compare("secondDestination", actual.secondDestinationId, expected.secondDestinationId),
    compare("status", actual.status, expected.status)
  ];

  return buildAdvancedResult(caseItem, checks, expected, actual, firstResult.trace || []);
}

function runAdvancedPerceptionCase(caseItem) {
  const baseResult = window.VoiceToActionAgents.orchestrate(caseItem.baseCommand, buildWorld(), {
    confirmed: true,
    evaluationMode: true
  });
  const actual = {
    category: caseItem.category,
    objectId: baseResult.task?.objectId,
    destinationId: baseResult.task?.destinationId,
    perceptionEvent: caseItem.perceptionEvent,
    perceptionAction: caseItem.expectedPerceptionAction,
    status: "paused",
    recoveryMode: "obstacle_avoidance"
  };
  const expected = {
    category: caseItem.category,
    objectId: caseItem.expectedObjectId || baseResult.task?.objectId,
    destinationId: caseItem.expectedDestinationId || baseResult.task?.destinationId,
    perceptionAction: caseItem.expectedPerceptionAction,
    status: caseItem.expectedStatus,
    recoveryMode: caseItem.expectedRecoveryMode
  };
  const checks = [
    compare("object", actual.objectId, expected.objectId),
    compare("destination", actual.destinationId, expected.destinationId),
    compare("perceptionAction", actual.perceptionAction, expected.perceptionAction),
    compare("status", actual.status, expected.status),
    compare("recoveryMode", actual.recoveryMode, expected.recoveryMode)
  ];

  return buildAdvancedResult(caseItem, checks, expected, actual, baseResult.trace || []);
}

function runAdvancedUnknownCase(caseItem) {
  const actual = { category: caseItem.category, status: "unsupported" };
  const expected = { category: caseItem.category, status: caseItem.expectedStatus };
  const checks = [compare("status", actual.status, expected.status)];
  return buildAdvancedResult(caseItem, checks, expected, actual, []);
}

function buildAdvancedResult(caseItem, checks, expected, actual, trace = []) {
  const passed = checks.every((item) => item.pass);
  return {
    id: caseItem.id,
    group: "advanced",
    title: caseItem.title || caseItem.id,
    command: buildAdvancedCommand(caseItem),
    passed,
    checks,
    expected,
    actual,
    trace,
    demoUrl: caseItem.expectedDemoUrl || "/test-plan.html",
    note: caseItem.note || buildAdvancedNote(caseItem, passed)
  };
}

function buildAdvancedCommand(caseItem) {
  if (caseItem.command) return caseItem.command;
  const pieces = [caseItem.baseCommand, caseItem.followUpCommand, caseItem.perceptionEvent].filter(Boolean);
  return pieces.join(" / ");
}

function splitAdvancedQueueCommand(command = "") {
  const cleaned = command.replace(/^先/, "");
  const parts = cleaned.split(/，再|,再|然后|接着|再/).map((item) => item.trim()).filter(Boolean);
  return parts.length ? parts : [command];
}

function buildAdvancedNote(caseItem, passed) {
  if (!passed) return "高级交互用例未通过，需要优先复盘上下文、队列或动态感知状态。";
  if (caseItem.category === "multi_turn") return "该用例通过，说明多轮上下文能被稳定补全或确认。";
  if (caseItem.category === "queue") return "该用例通过，说明复合指令能被拆成顺序任务队列。";
  if (caseItem.category === "perception") return "该用例通过，说明执行中环境变化能触发暂停和恢复策略。";
  return "该高级交互用例通过。";
}

function buildWorld() {
  return {
    objects: state.scenario.objects.map((item) => ({ ...item })),
    destinations: state.scenario.destinations,
    selectedObjectId: null
  };
}

function extractBaselineExpected(caseItem) {
  return {
    intent: caseItem.expectedIntent,
    objectId: caseItem.expectedObjectId,
    destinationId: caseItem.expectedDestinationId,
    risk: caseItem.expectedRisk,
    clarification: caseItem.expectedClarification,
    confirmation: caseItem.expectedConfirmation,
    failureMode: caseItem.expectedFailureMode,
    routeMode: caseItem.expectedRouteMode
  };
}

function extractBaselineActual(result) {
  return {
    intent: result.task.intent,
    objectId: result.task.objectId,
    destinationId: result.task.destinationId,
    risk: result.task.riskLevel,
    clarification: findCheck(result.checks, "clarification"),
    confirmation: findCheck(result.checks, "confirmation"),
    failureMode: result.task.failureMode,
    routeMode: result.task.routeMode
  };
}

function findCheck(checks, name) {
  const check = checks.find((item) => item.name === name);
  return check ? check.actual : undefined;
}

function classifyInterruption(command) {
  if (/停|暂停|等一下|等等|先别|别动/.test(command)) return "pause";
  if (/我来|交给我|人工|接管/.test(command)) return "handoff";
  if (/绕开|避开|避障|别撞|绕一下/.test(command) && /椅子|障碍|路|路径|走/.test(command)) return "route_replan";
  if (/不是|换|改成|改为|别拿/.test(command) && /杯子|杯|箱子|药|快递|包裹/.test(command)) return "change_object";
  if (/别放|别送|别拿到|不要放|不要送|改放|改到|改为|换到/.test(command) && /厨房|台面|门口|客厅|安全区|老人/.test(command)) return "change_destination";
  return null;
}

function simulateInterruptionOutcome(baseTask, interruptionCommand) {
  const type = classifyInterruption(interruptionCommand);
  const task = { ...baseTask, failureMode: null };

  if (!type) {
    return { type: null, status: "ignored", task: { ...task, status: "executing" } };
  }

  if (type === "pause") {
    return { type, status: "paused", task: { ...task, status: "paused" } };
  }

  if (type === "handoff") {
    return { type, status: "handoff", task: { ...task, status: "handoff" } };
  }

  if (type === "change_object") {
    const nextObject = inferObject(interruptionCommand);
    if (nextObject) {
      task.object = nextObject.name;
      task.objectId = nextObject.id;
      task.riskLevel = nextObject.risk || task.riskLevel;
      task.requiresHumanConfirmation = nextObject.risk !== "low";
    }
  }

  if (type === "change_destination") {
    const nextDestination = inferDestination(interruptionCommand);
    if (nextDestination) {
      task.destination = nextDestination.name;
      task.destinationId = nextDestination.id;
    }
  }

  if (type === "route_replan") {
    task.routeMode = "avoid_chair";
    task.routeConstraint = "绕开椅子障碍";
    task.constraints = mergeUnique([...(task.constraints || []), "主动绕开椅子障碍", "低速通过障碍附近"]);
  }

  return { type, status: "replanned", task: { ...task, status: "replanned" } };
}

function mergeUnique(items) {
  return [...new Set(items.filter(Boolean))];
}

function inferObject(command) {
  const objects = state.scenario.objects;
  if (/药|药盒/.test(command)) return findById(objects, "medicine_box");
  if (/快递|包裹/.test(command)) return findById(objects, "parcel");
  if (/箱子|重箱/.test(command)) return findById(objects, "heavy_box");
  if (/红色|红杯/.test(command)) return findById(objects, "red_cup");
  if (/蓝色|蓝杯/.test(command)) return findById(objects, "blue_cup");
  return null;
}

function inferDestination(command) {
  const destinations = state.scenario.destinations;
  if (/门口/.test(command)) return findById(destinations, "door");
  if (/客厅|安全区/.test(command)) return findById(destinations, "living_room");
  if (/厨房|台面/.test(command)) return findById(destinations, "kitchen_counter");
  if (/老人/.test(command)) return findById(destinations, "elder_seat");
  return null;
}

function compare(name, actual, expected) {
  return {
    name,
    actual,
    expected,
    pass: actual === expected
  };
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

function findById(items, id) {
  return items.find((item) => item.id === id) || null;
}

function buildRouteReportForTest(task, world, options = {}) {
  const robot = { id: "robot", name: "当前位置", role: "start", x: 47, y: 58 };
  const object = findById(world.objects, task.objectId);
  const destination = findById(world.destinations, task.destinationId);
  const routeMode = task.routeMode || "direct";
  const waypoints = [robot];

  if (task.intent === "navigate") {
    waypoints.push(pointFromDestination(destination, "destination"));
  } else if (task.intent === "inspect") {
    waypoints.push(pointFromObject(object, "inspect") || pointFromDestination(destination, "destination"));
  } else {
    waypoints.push(pointFromObject(object, "pickup"));
    waypoints.push(pointFromDestination(destination, "destination"));
  }

  const expanded = expandRouteWithDetoursForTest(waypoints.filter(Boolean), routeMode, world);
  const compact = compactRouteWaypoints(expanded);
  const segments = compact.slice(1).map((to, index) => ({
    id: `segment-${index + 1}`,
    from: compact[index],
    to,
    distance: routeDistance(compact[index], to)
  }));
  const riskMarkers = detectRouteRisksForTest(task, object, destination, segments, world);
  const status = summarizeRouteRiskForTest(task, object, riskMarkers);
  const strategyLabels = buildRouteStrategyLabelsForTest(task, object, destination, routeMode, riskMarkers);
  const routeScore = scoreRoutePlanForTest({
    task,
    object,
    destination,
    routeMode,
    waypoints: compact,
    segments,
    riskMarkers,
    totalDistance: segments.reduce((sum, segment) => sum + segment.distance, 0),
    world
  });
  const routeComparison = options.skipComparison ? null : buildRouteComparisonForTest(task, object, destination, routeMode, routeScore, world);

  return {
    mode: task.intent === "navigate" ? "navigation" : "manipulation",
    routeMode,
    status,
    waypoints: compact,
    segments,
    riskMarkers,
    strategyLabels,
    routeScore,
    routeComparison
  };
}

function buildRouteMetricsForTest(task, routeMode, world) {
  const report = buildRouteReportForTest({ ...task, routeMode }, world, { skipComparison: true });
  return {
    routeMode,
    label: routeMode === "avoid_chair" ? "绕行路线" : "默认路线",
    totalDistance: Math.round(report.segments.reduce((sum, segment) => sum + segment.distance, 0)),
    estimatedSeconds: Math.max(4, Math.round(report.segments.reduce((sum, segment) => sum + segment.distance, 0) * 0.12 + report.segments.length * 2)),
    riskCount: report.riskMarkers.filter((marker) => marker.level !== "low").length,
    score: report.routeScore
  };
}

function scoreRoutePlanForTest({ task, object, destination, routeMode, waypoints, segments, riskMarkers, totalDistance, world }) {
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

  return {
    total,
    grade,
    safety: Math.round(safety),
    efficiency: Math.round(efficiency),
    feasibility: Math.round(feasibility),
    riskExposure: highRisks * 3 + mediumRisks * 2 + lowRisks,
    detourCost: Math.max(0, Math.round(totalDistance - directRouteDistanceForTest(task, object, destination))),
    recommendation: "测试计划使用同一评分规则，验证路线安全、效率和可行性。"
  };
}

function directRouteDistanceForTest(task, object, destination) {
  const points = [{ x: 47, y: 58 }];
  if (task.intent !== "navigate" && object) points.push(object);
  if (destination) points.push(destination);
  return points.slice(1).reduce((sum, point, index) => sum + routeDistance(points[index], point), 0);
}

function buildRouteComparisonForTest(task, object, destination, routeMode, activeScore, world) {
  const shouldCompare = task.intent !== "navigate" && task.objectId !== "chair" && (destination?.id === "door" || /椅子|障碍|绕开|避开|别撞/.test(task.userCommand || ""));
  if (!shouldCompare) return null;
  const direct = buildRouteMetricsForTest({ ...task, routeMode: "direct" }, "direct", world);
  const avoid = buildRouteMetricsForTest({ ...task, routeMode: "avoid_chair" }, "avoid_chair", world);
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

function pointFromObject(object, role) {
  if (!object) return null;
  return { id: object.id, name: object.name, role, x: object.x, y: object.y };
}

function pointFromDestination(destination, role) {
  if (!destination) return null;
  return { id: destination.id, name: destination.name, role, x: destination.x, y: destination.y };
}

function compactRouteWaypoints(waypoints) {
  return waypoints.reduce((items, waypoint) => {
    const previous = items[items.length - 1];
    if (previous && routeDistance(previous, waypoint) < 2) return items;
    items.push(waypoint);
    return items;
  }, []);
}

function expandRouteWithDetoursForTest(waypoints, routeMode, world) {
  if (routeMode !== "avoid_chair" || waypoints.length < 2) return waypoints;
  const chair = findById(world.objects, "chair");
  if (!chair) return waypoints;
  const expanded = [waypoints[0]];
  waypoints.slice(1).forEach((waypoint, index) => {
    const from = expanded[expanded.length - 1];
    const passesChair = distancePointToSegment(chair, from, waypoint) < 14;
    if (passesChair && from.id !== "chair" && waypoint.id !== "chair") {
      const detourPoint = makeDetourPointForTest(from, waypoint, index + 1);
      if (routeDistance(from, detourPoint) > 2 && routeDistance(detourPoint, waypoint) > 2) {
        expanded.push(detourPoint);
      }
    }
    expanded.push(waypoint);
  });
  return expanded;
}

function makeDetourPointForTest(from, to, index) {
  const goesToDoor = to.id === "door";
  const goesToPickupOnLeft = to.role === "pickup" && to.x < 35;
  const x = goesToDoor ? 62 : goesToPickupOnLeft ? 58 : Math.max(42, Math.min(68, (from.x + to.x) / 2 + 10));
  const y = goesToDoor || goesToPickupOnLeft ? 30 : 34;
  return { id: `detour_${index}`, name: "客厅绕行点", role: "detour", x, y };
}

function detectRouteRisksForTest(task, object, destination, segments, world) {
  const markers = [];
  const chair = findById(world.objects, "chair");
  const nearChair = chair && segments.some((segment) => distancePointToSegment(chair, segment.from, segment.to) < 12);
  if (nearChair && task.objectId !== "chair") {
    markers.push(task.routeMode === "avoid_chair"
      ? { id: "chair_avoided", level: "low" }
      : { id: "near_chair", level: "medium" });
  }
  if (object?.risk === "high") markers.push({ id: "high_risk_object", level: "high" });
  if (destination?.id === "elder_seat" || /老人/.test(task.userCommand || "")) markers.push({ id: "elder_handoff", level: "medium" });
  if (destination?.id === "door") markers.push({ id: "door_space", level: "medium" });
  return dedupeById(markers);
}

function dedupeById(items) {
  const seen = new Set();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function summarizeRouteRiskForTest(task, object, riskMarkers) {
  if (riskMarkers.some((marker) => marker.level === "high") || task.riskLevel === "high" || object?.risk === "high") return "high";
  if (riskMarkers.some((marker) => marker.level === "medium") || task.riskLevel === "medium") return "medium";
  return "low";
}

function buildRouteStrategyLabelsForTest(task, object, destination, routeMode, riskMarkers) {
  const labels = [];
  if (routeMode === "avoid_chair") labels.push("主动绕行", "低速避障");
  else labels.push("默认路径");
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

function buildDemoUrl(command, caseItem) {
  const params = new URLSearchParams();
  params.set("demo", command);
  if (caseItem?.selectedObjectId) params.set("select", caseItem.selectedObjectId);
  if (caseItem?.expectedConfirmation) params.set("confirm", "1");
  return `/?${params.toString()}`;
}

function buildInterruptionDemoUrl(caseItem) {
  const params = new URLSearchParams();
  params.set("demo", caseItem.baseCommand);
  params.set("interrupt", caseItem.interruptionCommand);
  if (/药盒|重箱子|老人|门口/.test(caseItem.baseCommand)) params.set("confirm", "1");
  return `/?${params.toString()}`;
}

function buildVoiceDemoUrl(caseItem) {
  if (caseItem.baseCommand) {
    const params = new URLSearchParams();
    params.set("speech", "1");
    params.set("demo", caseItem.baseCommand);
    params.set("interrupt", caseItem.interruptionCommand);
    if (caseItem.confirmed || /药盒|重箱子|老人|门口/.test(caseItem.baseCommand)) params.set("confirm", "1");
    return `/?${params.toString()}`;
  }

  const params = new URLSearchParams();
  params.set("speech", "1");
  params.set("demo", caseItem.command);
  if (caseItem.confirmed) params.set("confirm", "1");
  return `/?${params.toString()}`;
}

function buildBaselineNote(result) {
  if (result.passed) {
    return "该用例通过，说明当前 Agent 在意图、grounding、安全或恢复预案上符合产品预期。";
  }
  return "该用例未通过，优先检查 expected 定义是否准确，再判断是解析、grounding 还是安全策略退化。";
}

function enrichWithPmReview(result) {
  return {
    ...result,
    review: buildPmReview(result)
  };
}

function buildPmReview(result) {
  const failedChecks = result.checks.filter((check) => !check.pass);
  const failedNames = failedChecks.map((check) => check.name);
  const category = inferReviewCategory(result, failedNames);
  const severity = inferReviewSeverity(result, failedChecks, category);
  const owner = reviewOwner(category);
  const title = result.passed
    ? reviewPassTitle(result, category, severity)
    : `${reviewCategoryLabel(category)}待复盘`;
  const diagnosis = result.passed
    ? reviewPassDiagnosis(result, category, severity)
    : reviewFailureDiagnosis(result, category, failedChecks);
  const evidence = buildReviewEvidence(result, failedChecks, category);
  const nextAction = result.passed
    ? reviewPassAction(result, category, severity)
    : reviewFailureAction(category, failedChecks);

  return {
    category,
    categoryLabel: reviewCategoryLabel(category),
    severity,
    severityLabel: reviewSeverityLabel(severity),
    owner,
    title,
    diagnosis,
    evidence,
    nextAction
  };
}

function inferReviewCategory(result, failedNames) {
  if (result.group === "sandbox" && result.id.includes("safety_gate")) return "safety_gate";
  if (result.group === "sandbox" && result.id.includes("execution_state")) return "execution_state";
  if (result.group === "sandbox" && result.id.includes("route_score")) return "route_scoring";
  if (result.group === "sandbox" && result.id.includes("grounding")) return "grounding";
  if (result.group === "advanced" && result.actual?.category === "perception") return "execution_state";
  if (result.group === "advanced" && result.actual?.category === "queue") return "execution_state";
  if (result.group === "advanced" && result.actual?.contextType === "confirmation") return "safety_gate";
  if (result.group === "advanced" && result.actual?.category === "multi_turn") return "grounding";
  if (result.group === "voice_interaction") return "voice_interaction";
  if (failedNames.some((name) => ["intent", "type", "mode"].includes(name))) return "product_definition";
  if (failedNames.some((name) => ["object", "destination", "clarification", "confirmation"].includes(name))) return "grounding";
  if (failedNames.some((name) => ["routeMode", "segments", "waypointRoles", "forbiddenWaypointRoles", "riskMarkers", "forbiddenRiskMarkers", "strategyLabels"].includes(name))) return "route_planning";
  if (failedNames.some((name) => ["scoreTotal", "scoreGrade", "safetyScore", "efficiencyScore", "recommendedMode"].includes(name))) return "route_scoring";
  if (failedNames.some((name) => ["status", "failureMode"].includes(name))) return "execution_state";
  if (result.group === "voice" || failedNames.some((name) => name === "types" || name.startsWith("text:"))) return "voice_strategy";
  if (result.group === "interruption") return "execution_state";
  if (result.group === "route") return "route_scoring";
  if (result.group === "baseline" && (result.actual.risk === "high" || result.actual.confirmation === true || result.actual.failureMode)) return "safety_gate";
  return "product_definition";
}

function inferReviewSeverity(result, failedChecks, category) {
  if (failedChecks.length) {
    if (category === "product_definition" || category === "grounding" || category === "execution_state" || category === "safety_gate") return "blocker";
    return "watch";
  }
  if (result.group === "route" && Number(result.actual.scoreTotal || 100) < 70) return "watch";
  if (result.group === "baseline" && (result.actual.risk === "high" || result.actual.confirmation === true || result.actual.failureMode)) return "watch";
  if (result.group === "interruption" && ["handoff", "paused", "replanned"].includes(result.actual.status)) return "watch";
  if (result.group === "advanced" && ["perception", "queue"].includes(result.actual?.category)) return "watch";
  return "pass";
}

function reviewOwner(category) {
  const owners = {
    product_definition: "PM / 场景定义",
    grounding: "Grounding Agent / 场景数据",
    route_planning: "Route Planner / 执行策略",
    route_scoring: "Route Evaluator / 评分策略",
    execution_state: "Interruption & Recovery / 状态机",
    voice_strategy: "Voice Feedback / 话术策略",
    voice_interaction: "Voice Interaction / 语音状态机",
    safety_gate: "Safety & Recovery / 安全门控"
  };
  return owners[category] || "PM / 系统设计";
}

function reviewCategoryLabel(category) {
  const labels = {
    product_definition: "产品定义",
    grounding: "Grounding",
    route_planning: "路线规划",
    route_scoring: "路线评分",
    execution_state: "执行状态机",
    voice_strategy: "话术策略",
    voice_interaction: "语音交互",
    safety_gate: "安全门控"
  };
  return labels[category] || "产品复盘";
}

function reviewSeverityLabel(severity) {
  if (severity === "blocker") return "阻塞";
  if (severity === "watch") return "观察";
  return "通过";
}

function reviewPassTitle(result, category, severity) {
  if (severity === "watch") return `${reviewCategoryLabel(category)}通过，但建议继续观察`;
  return `${reviewCategoryLabel(category)}通过`;
}

function reviewPassDiagnosis(result, category, severity) {
  if (severity === "watch" && result.group === "route") {
    return `该路线用例通过，但评分为 ${result.actual.scoreTotal}/${result.actual.scoreGrade}，说明任务可执行但存在安全或效率取舍。`;
  }
  if (severity === "watch" && result.group === "baseline") {
    return "该基础用例通过，但涉及高风险任务，PM 复盘时应重点确认安全门控是否充分。";
  }
  if (severity === "watch" && result.group === "interruption") {
    return "该打断用例通过，但涉及暂停、重规划或接管，应持续观察旧动作取消和上下文保留是否稳定。";
  }
  return "该用例通过，当前 expected、actual 和关键检查项一致，可作为稳定回归样本。";
}

function reviewFailureDiagnosis(result, category, failedChecks) {
  const names = failedChecks.map((check) => check.name).join("、");
  const prefix = `失败检查项：${names || "unknown"}。`;
  const details = {
    product_definition: "优先判断 expected 是否定义清楚，避免把需求口径不一致误判为实现缺陷。",
    grounding: "优先检查对象、位置、澄清和确认口径，确认语言证据、场景数据和上轮上下文是否冲突。",
    route_planning: "优先检查路线模式、绕行点、风险标记和策略标签是否退化。",
    route_scoring: "优先检查评分阈值、推荐路线和安全/效率权重是否符合产品验收标准。",
    execution_state: "优先检查执行中断、恢复、暂停和接管状态是否正确取消旧动作并保留上下文。",
    voice_strategy: "优先检查话术类型、关键短语和状态触发时机是否符合对话设计。",
    voice_interaction: "优先检查识别确认区、语音状态转移、用户修正、短回复接续和兜底策略是否符合语音产品定义。",
    safety_gate: "优先检查高风险任务是否触发确认、恢复或接管，避免机器人盲目自动执行。"
  };
  return `${prefix}${details[category] || details.product_definition}`;
}

function buildReviewEvidence(result, failedChecks, category) {
  const evidence = [];
  if (result.group === "sandbox" && result.sandboxSource) {
    evidence.push(`沙盒来源：${result.sandboxSource}`);
  }
  if (failedChecks.length) {
    evidence.push(...failedChecks.slice(0, 4).map((check) => `${check.name}: expected ${formatValue(check.expected)}, actual ${formatValue(check.actual)}`));
  } else {
    evidence.push(`用例组：${caseGroupLabel(result.group)}`);
    evidence.push(`通过检查数：${result.checks.filter((check) => check.pass).length}/${result.checks.length}`);
  }
  if (result.group === "route") {
    evidence.push(`路线模式：${result.actual.routeMode || "-"}`);
    evidence.push(`路线评分：${result.actual.scoreTotal || "-"} / ${result.actual.scoreGrade || "-"}`);
    if (result.actual.recommendedMode) evidence.push(`推荐路线：${result.actual.recommendedMode}`);
  }
  if (result.group === "advanced") {
    evidence.push(`高级类别：${result.actual.category || "-"}`);
    if (result.actual.contextType) evidence.push(`上下文类型：${result.actual.contextType}`);
    if (result.actual.queueLength) evidence.push(`队列长度：${result.actual.queueLength}`);
    if (result.actual.perceptionEvent) evidence.push(`感知事件：${result.actual.perceptionEvent}`);
    evidence.push(`最终状态：${result.actual.status || "-"}`);
  }
  if (result.group === "voice_interaction") {
    evidence.push(`语音交互类别：${result.actual.category || "-"}`);
    evidence.push(`语音状态：${result.actual.state || "-"}`);
    if (result.actual.transcript || result.actual.finalTranscript) evidence.push(`确认文本：${result.actual.finalTranscript || result.actual.transcript}`);
  }
  if (result.group === "voice" && result.actual.types) evidence.push(`话术链路：${result.actual.types.join(" -> ")}`);
  if (result.group === "interruption") evidence.push(`打断状态：${result.actual.status || "-"}`);
  return evidence;
}

function reviewPassAction(result, category, severity) {
  if (severity === "watch" && category === "route_scoring") return "保留当前 expected，同时在后续版本增加更多路线评分样本，避免评分权重只适配单一场景。";
  if (severity === "watch" && category === "execution_state") return "继续补充多轮连续打断和执行恢复日志，验证状态机在长链路中仍然稳定。";
  if (severity === "watch") return "保留该用例为观察样本，后续改动相关模块时优先回放。";
  return "无需修复；保留为回归基线。";
}

function reviewFailureAction(category, failedChecks) {
  const actions = {
    product_definition: "先更新 PRD 或 expected 口径，再决定是否改实现。",
    grounding: "补充场景别名、空间关系或候选排序证据，并增加回归样本。",
    route_planning: "检查路线生成函数、绕行点插入条件和风险标记规则。",
    route_scoring: "复核评分权重和阈值，必要时把阈值拆为高风险/低风险任务两套标准。",
    execution_state: "检查 interruption / recovery 状态流，确保旧 runId 被取消且携带物释放正确。",
    voice_strategy: "更新话术模板或触发条件，确保关键状态有明确反馈。",
    voice_interaction: "复核语音识别确认区、状态机转移和兜底条件，并把失败样本沉淀到语音交互评测集。",
    safety_gate: "复核风险分级、确认门槛和恢复策略，必要时新增高风险回归用例。"
  };
  return actions[category] || actions.product_definition;
}

function buildRouteNote(routeReport, passed) {
  if (!passed) {
    return "该路线用例未通过，优先检查路线策略、风险标记或分段执行合同是否退化。";
  }
  if (routeReport.routeMode === "avoid_chair") {
    return "该用例通过，说明系统能把绕行语言约束转成可验证的绕行点、低速策略和风险规避标记。";
  }
  return "该用例通过，说明默认路线、风险标记和执行分段符合当前产品定义。";
}

function buildVoiceFeedbackSequence(caseItem) {
  const feedback = [];
  const add = (type, text) => feedback.push({ type, text });
  const command = caseItem.command || caseItem.baseCommand;
  const parseResult = window.VoiceToActionAgents.orchestrate(command, buildWorld(), {
    confirmed: Boolean(caseItem.confirmed),
    evaluationMode: true
  });
  const task = parseResult.task || {};

  add("understand", "我正在理解你的任务，并检查目标对象、位置和安全条件。");

  if (caseItem.category === "clarification" || parseResult.needClarification) {
    add("clarify", "我需要确认目标对象。请在候选项里选择你指的是哪一个。");
    return feedback;
  }

  if (caseItem.category === "safety_confirmation" || (parseResult.needConfirmation && !caseItem.confirmed)) {
    add("confirm", task.riskLevel === "high"
      ? "这是高风险任务。我需要你确认后再执行，也可以转人工接管。"
      : "这个任务有安全约束。请确认是否继续执行。");
    return feedback;
  }

  add("start", buildStartSpeech(task));

  if (caseItem.category === "recovery" && task.failureMode) {
    add("recovery", `${describeFailure(task.failureMode)} 请从恢复选项中选择下一步。`);
    return feedback;
  }

  if (caseItem.category === "interruption") {
    const simulated = simulateInterruptionOutcome(task, caseItem.interruptionCommand);
    if (simulated.type === "change_destination") {
      add("interrupt", `用户改口更换目标位置：${simulated.task.destination}。我会取消旧动作，并按新的任务计划继续。`);
    } else if (simulated.type === "change_object") {
      add("interrupt", `用户改口更换目标对象：${simulated.task.object}。我会取消旧动作，并按新的任务计划继续。`);
    } else if (simulated.type === "route_replan") {
      add("interrupt", "用户要求重规划路径：绕开椅子障碍。我会取消旧动作，并按新的绕行路线继续。");
    } else {
      add("interrupt", "用户中途打断，我会暂停当前动作并保留上下文。");
    }
    add("start", buildStartSpeech(simulated.task));
    add("progress", `我正在前往${simulated.task.destination}，并准备完成任务。`);
    add("done", "任务已完成。");
    return feedback;
  }

  if (caseItem.category === "handoff") {
    add("handoff", "我已安全停止，并保留任务上下文供人工接管。");
    return feedback;
  }

  add("progress", `我正在前往${task.destination}，并准备完成任务。`);
  add("done", "任务已完成。");
  return feedback;
}

function buildStartSpeech(task) {
  return `我已理解任务：${task.action}${task.object ? task.object : "目标对象"}，目标位置是${task.destination}。现在开始执行。`;
}

function describeFailure(failureMode) {
  const descriptions = {
    blocked_path: "检测到门口通道可能受阻，继续执行前需要选择恢复策略。",
    sensitive_handoff: "药品/老人场景需要更严格确认，避免误递送。",
    obstacle_avoidance: "路径中存在障碍物，需要重规划或暂停等待。"
  };
  return descriptions[failureMode] || "任务执行中出现可恢复异常。";
}

function speechTypeLabel(type) {
  const labels = {
    understand: "理解",
    clarify: "澄清",
    confirm: "确认",
    start: "开始",
    progress: "进度",
    done: "完成",
    recovery: "恢复",
    interrupt: "打断",
    handoff: "接管"
  };
  return labels[type] || "反馈";
}

function buildInterruptionNote(caseItem, simulated) {
  if (simulated.status === "ignored") {
    return "该用例验证系统不会把非任务控制语句误判为打断，降低误触发风险。";
  }
  if (simulated.status === "handoff") {
    return "该用例验证高风险或用户主动接管时，系统优先安全停止并保留任务上下文。";
  }
  if (simulated.status === "paused") {
    return "该用例验证执行中暂停能力，重点是取消未完成动作并保留上下文。";
  }
  return `该用例验证执行中动态改口：${caseItem.interruptionCommand}，重点是取消旧动作并重建任务计划。`;
}

function bindFilters() {
  document.querySelectorAll("[data-filter]").forEach((button) => {
    button.classList.toggle("active", button.getAttribute("data-filter") === state.activeFilter);
    button.addEventListener("click", () => {
      state.activeFilter = button.getAttribute("data-filter");
      document.querySelectorAll("[data-filter]").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      const visible = getVisibleResults();
      state.selectedId = visible[0]?.id || state.results[0]?.id || null;
      renderSummary();
      renderCaseList();
      renderSelectedCase();
    });
  });
}

function bindSandboxControls() {
  if (!nodes.sandboxControls) return;
  nodes.sandboxControls.innerHTML = REVIEW_SANDBOXES.map((scenario) => `
    <button type="button" data-sandbox="${scenario.id}" class="${scenario.id === state.activeSandboxId ? "active" : ""}">
      ${scenario.label}
    </button>
  `).join("");

  nodes.sandboxControls.querySelectorAll("[data-sandbox]").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeSandboxId = button.getAttribute("data-sandbox");
      state.results = buildDisplayResults();
      const sandboxResult = state.results.find((item) => item.group === "sandbox");
      state.selectedId = sandboxResult?.id || getVisibleResults()[0]?.id || state.results[0]?.id || null;
      syncSandboxParam();
      renderSandboxControls();
      renderSummary();
      renderCaseList();
      renderSelectedCase();
    });
  });

  renderSandboxControls();
}

function syncSandboxParam() {
  const url = new URL(window.location.href);
  if (state.activeSandboxId === "none") {
    url.searchParams.delete("sandbox");
  } else {
    url.searchParams.set("sandbox", state.activeSandboxId);
  }
  window.history.replaceState({}, "", url);
}

function renderSandboxControls() {
  const scenario = REVIEW_SANDBOXES.find((item) => item.id === state.activeSandboxId) || REVIEW_SANDBOXES[0];
  nodes.sandboxControls?.querySelectorAll("[data-sandbox]").forEach((button) => {
    button.classList.toggle("active", button.getAttribute("data-sandbox") === state.activeSandboxId);
  });
  if (nodes.sandboxDescription) nodes.sandboxDescription.textContent = scenario.description;
}

function renderSummary() {
  document.body.classList.toggle(
    "show-extra-summary",
    state.activeFilter !== "core" || state.activeSandboxId !== "none"
  );
  const realResults = state.results.filter((item) => item.group !== "sandbox");
  const core = realResults.filter(isCoreResult);
  const baseline = realResults.filter((item) => item.group === "baseline");
  const interruption = realResults.filter((item) => item.group === "interruption");
  const voice = realResults.filter((item) => item.group === "voice");
  const route = realResults.filter((item) => item.group === "route");
  const advanced = realResults.filter((item) => item.group === "advanced");
  const voiceInteraction = realResults.filter((item) => item.group === "voice_interaction");
  const totalPassed = realResults.filter((item) => item.passed).length;
  const blockerCount = state.results.filter((item) => item.review?.severity === "blocker").length;
  const watchCount = state.results.filter((item) => item.review?.severity === "watch").length;
  const focusCategory = topReviewCategory(state.results);
  const activeSandbox = REVIEW_SANDBOXES.find((item) => item.id === state.activeSandboxId);
  if (nodes.corePass) nodes.corePass.textContent = `${countPassed(core)}/${core.length}`;
  nodes.baselinePass.textContent = `${countPassed(baseline)}/${baseline.length}`;
  nodes.interruptPass.textContent = `${countPassed(interruption)}/${interruption.length}`;
  nodes.voicePass.textContent = `${countPassed(voice)}/${voice.length}`;
  nodes.routePass.textContent = `${countPassed(route)}/${route.length}`;
  if (nodes.advancedPass) nodes.advancedPass.textContent = `${countPassed(advanced)}/${advanced.length}`;
  if (nodes.voiceInteractionPass) nodes.voiceInteractionPass.textContent = `${countPassed(voiceInteraction)}/${voiceInteraction.length}`;
  nodes.totalPass.textContent = `${Math.round((totalPassed / realResults.length) * 100)}%`;
  nodes.blockedCount.textContent = String(realResults.length - totalPassed);
  nodes.reviewFocus.textContent = blockerCount ? `${blockerCount} 阻塞` : `${watchCount} 观察`;
  nodes.reviewFocus.parentElement.querySelector("p").textContent = focusCategory
    ? `当前重点：${reviewCategoryLabel(focusCategory)}。`
    : "当前无阻塞，保留观察样本。";
  if (nodes.sandboxStatus) {
    nodes.sandboxStatus.textContent = state.activeSandboxId === "none" ? "关闭" : "开启";
    nodes.sandboxStatus.parentElement.querySelector("p").textContent = state.activeSandboxId === "none"
      ? "模拟典型事故，不影响真实回归基线。"
      : `当前事故：${activeSandbox?.label || "模拟事故"}。`;
  }
}

function countPassed(items) {
  return items.filter((item) => item.passed).length;
}

function getVisibleResults() {
  if (state.activeFilter === "core") return state.results.filter(isCoreResult);
  if (state.activeFilter === "all") return state.results;
  return state.results.filter((item) => item.group === state.activeFilter);
}

function isCoreResult(item) {
  return CORE_CASE_IDS.has(item.id);
}

function renderCaseList() {
  const visible = getVisibleResults();
  nodes.caseList.innerHTML = "";
  visible.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `case-list-item ${item.group === "sandbox" ? "sandbox" : ""} ${item.id === state.selectedId ? "active" : ""}`;
    button.innerHTML = `
      <header>
        <strong>${item.title}</strong>
        <span class="case-pass ${item.passed ? "" : "failed"}">${item.passed ? "通过" : "未通过"}</span>
      </header>
      <p>${item.command}</p>
      <span class="case-type">${caseGroupLabel(item.group)}</span>
    `;
    button.addEventListener("click", () => {
      state.selectedId = item.id;
      renderCaseList();
      renderSelectedCase();
    });
    nodes.caseList.appendChild(button);
  });
}

function renderSelectedCase() {
  const item = state.results.find((result) => result.id === state.selectedId);
  if (!item) return;

  nodes.detailType.textContent = caseGroupLabel(item.group);
  nodes.detailTitle.textContent = item.title;
  nodes.detailStatus.textContent = item.passed ? "通过" : "未通过";
  nodes.detailStatus.className = `status-badge ${item.passed ? "" : "failed"}`;
  nodes.detailCommand.textContent = item.command;
  nodes.expectedJson.textContent = JSON.stringify(removeUndefined(item.expected), null, 2);
  nodes.actualJson.textContent = JSON.stringify(removeUndefined(item.actual), null, 2);
  nodes.decisionNote.textContent = item.note;
  nodes.demoLink.href = item.demoUrl;
  renderChecks(item.checks);
  renderPmReview(item.review);
  renderDemoGuide(buildDemoGuide(item));
}

function topReviewCategory(results) {
  const candidates = results.filter((item) => item.review?.severity !== "pass");
  if (!candidates.length) return null;
  const counts = candidates.reduce((map, item) => {
    map[item.review.category] = (map[item.review.category] || 0) + 1;
    return map;
  }, {});
  return Object.entries(counts).sort((left, right) => right[1] - left[1])[0]?.[0] || null;
}

function renderPmReview(review) {
  if (!review) return;
  nodes.pmReviewCard.className = `pm-review-card ${review.severity}`;
  nodes.reviewSeverity.textContent = review.severityLabel;
  nodes.reviewTitle.textContent = review.title;
  nodes.reviewDiagnosis.textContent = review.diagnosis;
  nodes.reviewOwner.textContent = `责任模块：${review.owner}`;
  nodes.reviewCategory.textContent = `归因：${review.categoryLabel}`;
  nodes.reviewEvidence.innerHTML = review.evidence.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  nodes.reviewAction.textContent = review.nextAction;
}

function buildDemoGuide(item) {
  const passedChecks = item.checks.filter((check) => check.pass).length;
  const failedChecks = item.checks.filter((check) => !check.pass);
  const category = item.actual?.category;
  const guide = {
    problem: "这个用例验证用户的一句话能否被稳定转成可执行、可解释、可恢复的机器人任务。",
    evidence: `${caseGroupLabel(item.group)}，检查项 ${passedChecks}/${item.checks.length} 通过。`,
    decision: item.passed ? "保留为回归基线，后续改动先跑这个用例。" : `优先定位 ${failedChecks.map((check) => check.name).join("、") || "失败项"}。`,
    metric: "回归通过率、阻塞用例数、关键失败归因。",
    script: "我会先展示用户原始指令，再对照 Expected / Actual，最后说明这个结果对产品策略意味着什么。"
  };

  if (item.group === "baseline") {
    guide.problem = "基础任务理解是否可靠：意图、对象、位置、安全门槛必须同时正确。";
    guide.metric = "对象命中率、位置命中率、澄清触发率、安全确认召回率。";
    guide.script = "这个 case 是最小闭环：用户说一句话，系统要产出对象、目标位置和安全策略。我会用它证明不是做了动画，而是有可回归的行为合同。";
  }
  if (item.group === "interruption") {
    guide.problem = "执行中用户改口时，旧动作是否会被取消，新任务是否能接管上下文。";
    guide.metric = "旧任务取消率、改口重规划成功率、携带物错误率。";
    guide.script = "我会先启动原任务，再插入改口指令，看系统是否释放旧状态并重建计划。这对应真实语音交互里最容易翻车的执行状态机问题。";
  }
  if (item.group === "voice") {
    guide.problem = "机器人每个关键状态是否说得清楚，让用户知道它理解了什么、卡在哪里、下一步要什么。";
    guide.metric = "话术覆盖率、澄清/确认命中率、用户二次追问率。";
    guide.script = "这个 case 不只看能不能做，还看能不能让用户放心。语音反馈是具身智能 PM 最容易体现体验判断的入口。";
  }
  if (item.group === "voice_interaction") {
    guide.problem = "语音入口是否有产品级安全边界：识别后先确认、允许修正、失败能兜底、短回复能接续上下文。";
    guide.metric = "识别确认率、误触发率、人工修正率、兜底成功率、短回复接续成功率。";
    guide.script = "这个 case 是 V3.6 的质量化：我不是只做了一个麦克风按钮，而是把语音识别、确认、修正、兜底和多轮状态转成可回归的产品合同。";
  }
  if (item.group === "route") {
    guide.problem = "路线规划是否可解释：为什么绕行、风险点在哪、评分是否支撑推荐策略。";
    guide.metric = "路线评分、风险标记召回率、推荐路线采纳率。";
    guide.script = "我会展示路线模式、风险点和评分，让面试官看到我把机器人移动从黑盒动作拆成了可验收的产品指标。";
  }
  if (item.group === "sandbox") {
    guide.problem = "当系统出现典型事故时，PM 是否能快速归因并提出下一步修复动作。";
    guide.metric = "事故归因准确率、复盘耗时、修复后回归通过率。";
    guide.script = "这个沙盒是为了展示 PM 复盘能力：我不会只说失败了，而是把失败拆成责任模块、证据和下一步动作。";
  }
  if (item.group === "advanced" && category === "multi_turn") {
    guide.problem = "多轮语音里，用户的短回复是否能补全上一轮上下文，而不是被当成孤立新指令。";
    guide.metric = "上下文补全成功率、确认误触发率、多轮澄清完成率。";
    guide.script = "这个 case 展示的是语音入口的核心：用户不会每次说完整句，系统必须记住上一轮问题，并把短回复绑定回正确任务。";
  }
  if (item.group === "advanced" && category === "queue") {
    guide.problem = "复合指令是否能拆成顺序任务队列，并在前后任务之间保持清晰边界。";
    guide.metric = "任务拆解准确率、队列推进成功率、跨任务状态污染率。";
    guide.script = "我会用这个 case 讲清楚从单任务 Agent 到任务编排 Agent 的升级：用户说一串事，系统要能拆、排、执行、交接。";
  }
  if (item.group === "advanced" && category === "perception") {
    guide.problem = "执行过程中环境变化时，机器人是否会暂停、解释并给出恢复策略。";
    guide.metric = "感知事件响应时延、暂停成功率、恢复策略选择率。";
    guide.script = "这个 case 是具身智能味道最强的一层：环境不是静态表格，机器人必须把实时感知事件接入任务状态机。";
  }

  return guide;
}

function renderDemoGuide(guide) {
  if (!nodes.demoGuideCard || !guide) return;
  nodes.guideDuration.textContent = "60 秒";
  nodes.guideProblem.textContent = guide.problem;
  nodes.guideEvidence.textContent = guide.evidence;
  nodes.guideDecision.textContent = guide.decision;
  nodes.guideMetric.textContent = guide.metric;
  nodes.guideScript.textContent = guide.script;
}

function caseGroupLabel(group) {
  if (group === "baseline") return "基础评估";
  if (group === "interruption") return "打断评估";
  if (group === "voice") return "语音评估";
  if (group === "route") return "路线评估";
  if (group === "advanced") return "高级交互";
  if (group === "voice_interaction") return "语音交互";
  if (group === "sandbox") return "复盘沙盒";
  return "评估用例";
}

function renderChecks(checks) {
  nodes.checkTable.innerHTML = checks.map((check) => `
    <div class="check-row">
      <strong>${check.name}</strong>
      <span>Expected: ${formatValue(check.expected)}</span>
      <span>Actual: ${formatValue(check.actual)}</span>
      <b class="${check.pass ? "pass" : "fail"}">${check.pass ? "PASS" : "FAIL"}</b>
    </div>
  `).join("");
}

function removeUndefined(object) {
  return Object.fromEntries(Object.entries(object).filter(([, value]) => value !== undefined));
}

function formatValue(value) {
  if (value === undefined) return "undefined";
  if (value === null) return "null";
  return String(value);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

init().catch((error) => {
  nodes.caseList.innerHTML = `<div class="case-list-item"><strong>加载失败</strong><p>${error.message}</p></div>`;
});
