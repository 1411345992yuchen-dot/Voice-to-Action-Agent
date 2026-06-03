(() => {
  const TOOL_SPECS = [
    {
      name: "classify_user_instruction",
      purpose: "判断输入是不是明确物理任务，阻止闲聊、否定句或噪声触发执行。"
    },
    {
      name: "parse_task_intent",
      purpose: "识别任务类型，例如搬运、递送、检查或机器人自主导航。"
    },
    {
      name: "ground_scene_reference",
      purpose: "把自然语言里的对象和位置映射到场景中的 objectId / destinationId。"
    },
    {
      name: "assess_safety_gate",
      purpose: "判断药品、老人、重物、门口等任务是否需要确认或接管。"
    },
    {
      name: "plan_physical_route",
      purpose: "生成物理执行路线偏好和关键路点，保留绕行等空间约束。"
    },
    {
      name: "decide_execution_gate",
      purpose: "决定下一步是执行、澄清、确认、阻止执行，还是交给人接管。"
    },
    {
      name: "evaluate_tool_trace",
      purpose: "把工具调用链和期望结果对齐，输出可复盘的通过/观察项。"
    }
  ];

  function runToolCallingPlan(command, world, options = {}) {
    const toolCalls = [];
    const instruction = classifyInstruction(command);
    toolCalls.push(createToolCall("classify_user_instruction", { command }, instruction));

    if (instruction.type === "non_task") {
      const gate = {
        mode: "block",
        reason: "输入包含否定/暂停/闲聊信号，没有明确物理任务，不允许触发动作。",
        noPhysicalExecution: true
      };
      toolCalls.push(createToolCall("decide_execution_gate", {
        instructionType: instruction.type,
        riskLevel: "none"
      }, gate));
      const evaluation = evaluateTrace({ instruction, gate, toolCalls }, options.expected);
      toolCalls.push(createToolCall("evaluate_tool_trace", {
        expected: options.expected || null
      }, evaluation));
      return {
        command,
        mode: "mock_llm_tool_calling",
        instruction,
        gate,
        noPhysicalExecution: true,
        toolCalls,
        evaluation
      };
    }

    const agentResult = window.VoiceToActionAgents.orchestrate(command, world, { evaluationMode: true });
    const task = agentResult.task;

    const intent = {
      intent: task.intent,
      action: task.action,
      confidence: agentResult.agentSummary && agentResult.agentSummary.evaluation
        ? agentResult.agentSummary.evaluation.confidence
        : task.confidence,
      rationale: summarizeIntent(task.intent)
    };
    toolCalls.push(createToolCall("parse_task_intent", {
      command,
      instructionType: instruction.type
    }, intent));

    const grounding = {
      objectId: task.objectId,
      objectName: task.object,
      destinationId: task.destinationId,
      destinationName: task.destination,
      needClarification: agentResult.needClarification,
      topCandidates: normalizeCandidates(agentResult.candidates).slice(0, 3),
      decision: agentResult.groundingReport ? agentResult.groundingReport.decision : "使用现有 Grounding Agent 输出。"
    };
    toolCalls.push(createToolCall("ground_scene_reference", {
      command,
      intent: task.intent
    }, grounding));

    const safety = {
      riskLevel: task.riskLevel,
      requiresHumanConfirmation: task.requiresHumanConfirmation,
      constraints: task.constraints || [],
      recoveryOptions: task.recoveryOptions || [],
      reason: buildSafetyReason(task, agentResult)
    };
    toolCalls.push(createToolCall("assess_safety_gate", {
      intent: task.intent,
      objectId: task.objectId,
      destinationId: task.destinationId
    }, safety));

    const route = buildRouteToolResult(task, world, agentResult);
    toolCalls.push(createToolCall("plan_physical_route", {
      objectId: task.objectId,
      destinationId: task.destinationId,
      routeConstraint: task.routeConstraint
    }, route));

    const gate = decideExecutionGate(agentResult, task, instruction);
    toolCalls.push(createToolCall("decide_execution_gate", {
      instructionType: instruction.type,
      needClarification: agentResult.needClarification,
      requiresHumanConfirmation: task.requiresHumanConfirmation,
      riskLevel: task.riskLevel
    }, gate));

    const evaluation = evaluateTrace({
      instruction,
      task,
      grounding,
      safety,
      route,
      gate,
      agentResult,
      toolCalls
    }, options.expected);
    toolCalls.push(createToolCall("evaluate_tool_trace", {
      expected: options.expected || null
    }, evaluation));

    return {
      command,
      mode: "mock_llm_tool_calling",
      instruction,
      task,
      grounding,
      safety,
      route,
      gate,
      toolCalls,
      evaluation
    };
  }

  function runToolCallingEvaluation(cases, world) {
    return cases.map((caseItem) => {
      const result = runToolCallingPlan(caseItem.command, world, { expected: caseItem });
      return {
        id: caseItem.id,
        label: caseItem.label,
        command: caseItem.command,
        passed: result.evaluation.passed,
        gateMode: result.gate.mode,
        instructionType: result.instruction.type,
        toolCallCount: result.toolCalls.length,
        checks: result.evaluation.checks,
        pmNote: caseItem.pmNote,
        result
      };
    });
  }

  function classifyInstruction(command) {
    const text = String(command || "");
    const hasNegativeMotion = /别动|不要动|先别|别执行|不用|取消|停一下|暂停/.test(text);
    const hasTaskVerb = /把|拿|递|搬|放|移动|走到|前往|去|检查|看看|送/.test(text);
    const hasPhysicalTarget = /杯|药|箱|快递|包裹|厨房|客厅|门口|老人|椅子|障碍|台面/.test(text);
    const type = hasNegativeMotion || !hasTaskVerb || !hasPhysicalTarget ? "non_task" : "task";
    const confidence = type === "task" ? 0.9 : 0.82;
    const reasons = [];
    if (hasTaskVerb) reasons.push("命中任务动词");
    if (hasPhysicalTarget) reasons.push("命中物理场景对象或位置");
    if (hasNegativeMotion) reasons.push("命中否定/暂停信号，阻止执行");
    if (!hasTaskVerb) reasons.push("缺少明确任务动词");
    return { type, confidence, reasons };
  }

  function decideExecutionGate(agentResult, task, instruction) {
    if (instruction.type === "non_task") {
      return {
        mode: "block",
        reason: "没有明确物理任务。",
        noPhysicalExecution: true
      };
    }
    if (agentResult.needClarification) {
      return {
        mode: "clarify",
        reason: "对象或位置 grounding 不唯一，需要先向用户澄清。",
        question: agentResult.groundingReport && agentResult.groundingReport.ambiguity
          ? agentResult.groundingReport.ambiguity.reason
          : "请确认目标对象。"
      };
    }
    if (task.requiresHumanConfirmation) {
      return {
        mode: "confirm",
        reason: "任务涉及高风险对象、老人照护、重物或门口场景，需要确认后执行。"
      };
    }
    return {
      mode: "execute",
      reason: "指令明确、风险可控，可以进入执行计划。"
    };
  }

  function buildRouteToolResult(task, world, agentResult) {
    const object = task.objectId ? findById(world.objects, task.objectId) : null;
    const destination = findById(world.destinations, task.destinationId);
    const waypoints = [];
    if (object) waypoints.push({ role: "pickup", id: object.id, label: object.name, x: object.x, y: object.y });
    if (task.routeMode === "avoid_chair") {
      waypoints.push({ role: "detour", id: "avoid_chair_midpoint", label: "绕开椅子的中间点", x: 42, y: 62 });
    }
    if (destination) waypoints.push({ role: "dropoff", id: destination.id, label: destination.name, x: destination.x, y: destination.y });

    return {
      routeMode: task.routeMode || "direct",
      routeConstraint: task.routeConstraint || null,
      waypointCount: waypoints.length,
      waypoints,
      planSteps: agentResult.plan || [],
      riskMarkers: buildRouteRiskMarkers(task)
    };
  }

  function buildRouteRiskMarkers(task) {
    const markers = [];
    if (task.routeMode === "avoid_chair") markers.push("避开椅子/障碍物");
    if (task.riskLevel === "high") markers.push("高风险物体或照护任务");
    if (task.destinationId === "door") markers.push("门口区域");
    if (task.destinationId === "elder_seat") markers.push("老人座位交互");
    return markers;
  }

  function normalizeCandidates(candidates) {
    return (candidates || []).map((candidate) => {
      const object = candidate.object || candidate;
      return {
        id: object.id || null,
        name: object.name || "未知候选",
        score: candidate.score ?? null,
        reasons: candidate.reasons || []
      };
    });
  }

  function buildSafetyReason(task) {
    if (task.requiresHumanConfirmation) {
      return "Safety Agent 判断该任务需要确认后执行。";
    }
    if (task.riskLevel === "medium") return "任务存在中等风险，但当前不需要强确认。";
    return "任务低风险，可以进入执行门控。";
  }

  function evaluateTrace(context, expected = {}) {
    const task = context.task || {};
    const checks = [
      compare("instructionType", context.instruction.type, expected.expectedInstructionType),
      compare("intent", task.intent, expected.expectedIntent),
      compare("object", task.objectId, expected.expectedObjectId),
      compare("destination", task.destinationId, expected.expectedDestinationId),
      compare("risk", task.riskLevel, expected.expectedRisk),
      compare("routeMode", context.route ? context.route.routeMode : undefined, expected.expectedRouteMode),
      compare("gateMode", context.gate.mode, expected.expectedGateMode),
      compare("clarification", context.agentResult ? context.agentResult.needClarification : undefined, expected.expectedClarification),
      compare("confirmation", task.requiresHumanConfirmation, expected.expectedConfirmation),
      compare("noPhysicalExecution", Boolean(context.gate.noPhysicalExecution), expected.expectedNoPhysicalExecution),
      compareMin("toolCallCount", context.toolCalls.length + 1, expected.expectedMinToolCalls)
    ].filter((item) => item.expected !== undefined);

    const passed = checks.every((item) => item.pass);
    return {
      passed,
      checks,
      summary: passed
        ? "工具调用链符合预期，当前能力可作为 LLM function calling 的稳定接口。"
        : "工具调用链存在观察项，需要复盘具体工具边界或门控策略。"
    };
  }

  function createToolCall(name, input, output) {
    return {
      id: `${name}_${Math.random().toString(36).slice(2, 8)}`,
      name,
      input,
      output,
      status: "completed"
    };
  }

  function summarizeIntent(intent) {
    const map = {
      pick_and_place: "搬运/放置普通物体。",
      deliver: "递送物体到人或照护位置。",
      move: "搬运高风险或重物。",
      inspect: "前往目标区域检查状态。",
      navigate: "机器人自身导航。"
    };
    return map[intent] || "通用物理任务。";
  }

  function compare(name, actual, expected) {
    return {
      name,
      actual,
      expected,
      pass: expected === undefined || actual === expected
    };
  }

  function compareMin(name, actual, expected) {
    return {
      name,
      actual,
      expected,
      pass: expected === undefined || actual >= expected
    };
  }

  function findById(items, id) {
    return (items || []).find((item) => item.id === id) || null;
  }

  window.VoiceToActionToolCalling = {
    TOOL_SPECS,
    runToolCallingPlan,
    runToolCallingEvaluation
  };
})();
