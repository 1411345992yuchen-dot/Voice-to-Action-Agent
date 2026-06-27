const VoiceToActionAgents = (() => {
  function orchestrate(command, world, overrides = {}) {
    const context = createContext(command, world, overrides);
    const intent = intentAgent(context);
    const grounding = groundingAgent(context, intent);
    const safety = safetyAgent(context, intent, grounding);
    const recovery = recoveryAgent(context, intent, grounding, safety);
    const routePreference = inferRoutePreference(command);
    const plan = plannerAgent(context, intent, grounding, safety, recovery);
    const evaluation = evaluatorAgent(context, intent, grounding, safety, recovery, plan);

    const task = {
      userCommand: command,
      intent: intent.intent,
      action: intent.actionLabel,
      object: grounding.object ? grounding.object.name : null,
      objectId: grounding.object ? grounding.object.id : null,
      destination: grounding.destination.name,
      destinationId: grounding.destination.id,
      constraints: safety.constraints,
      routeMode: routePreference.mode,
      routeConstraint: routePreference.constraint,
      riskLevel: safety.riskLevel,
      requiresHumanConfirmation: safety.requiresHumanConfirmation,
      failureMode: recovery.failureMode,
      recoveryOptions: recovery.options,
      confidence: evaluation.confidence,
      status: "parsed"
    };

    return {
      task,
      candidates: grounding.candidates,
      needClarification: grounding.needClarification,
      needConfirmation: safety.requiresHumanConfirmation,
      plan: plan.steps,
      groundingReport: grounding.report,
      trace: [
        intent.trace,
        grounding.trace,
        safety.trace,
        recovery.trace,
        plan.trace,
        evaluation.trace
      ],
      agentSummary: {
        intent,
        grounding,
        safety,
        recovery,
        plan,
        evaluation
      }
    };
  }

  function runEvaluation(evaluationSet, world) {
    return evaluationSet.map((caseItem) => {
      const evaluationWorld = {
        ...world,
        selectedObjectId: caseItem.selectedObjectId || world.selectedObjectId || null
      };
      const result = orchestrate(caseItem.command, evaluationWorld, { evaluationMode: true });
      const task = result.task;
      const checks = [
        compare("intent", task.intent, caseItem.expectedIntent),
        compare("object", task.objectId, caseItem.expectedObjectId),
        compare("destination", task.destinationId, caseItem.expectedDestinationId),
        compare("risk", task.riskLevel, caseItem.expectedRisk),
        compare("clarification", result.needClarification, caseItem.expectedClarification),
        compare("confirmation", result.needConfirmation, caseItem.expectedConfirmation),
        compare("failureMode", task.failureMode, caseItem.expectedFailureMode),
        compare("routeMode", task.routeMode, caseItem.expectedRouteMode)
      ].filter((item) => item.expected !== undefined);

      const passed = checks.every((item) => item.pass);
      return {
        id: caseItem.id,
        command: caseItem.command,
        passed,
        checks,
        reason: caseItem.reason || "",
        task,
        groundingReport: result.groundingReport,
        trace: result.trace
      };
    });
  }

  function createContext(command, world, overrides) {
    return {
      command,
      normalized: command.toLowerCase(),
      objects: world.objects || [],
      destinations: world.destinations || [],
      selectedObjectId: world.selectedObjectId || null,
      overrides,
      hasExplicitConfirmation: Boolean(overrides.confirmed)
    };
  }

  function intentAgent(context) {
    const command = context.command;
    let intent = "pick_and_place";
    let actionLabel = "拿取并放置";
    const evidence = [];

    if (/检查|看看|查看|巡视/.test(command)) {
      intent = "inspect";
      actionLabel = "检查";
      evidence.push("命中检查/查看类动词");
    } else if (isRobotNavigationCommand(command)) {
      intent = "navigate";
      actionLabel = "自主移动";
      evidence.push("命中机器人自身导航类表达");
    } else if (/递给|交给|送到/.test(command)) {
      intent = "deliver";
      actionLabel = "递送";
      evidence.push("命中递送类动词");
    } else if (/搬|移动|挪/.test(command)) {
      intent = "move";
      actionLabel = "搬运";
      evidence.push("命中搬运/移动类动词");
    } else {
      evidence.push("未命中高阶动词，默认理解为拿取并放置");
    }

    return {
      intent,
      actionLabel,
      evidence,
      trace: {
        agent: "Intent Agent",
        title: "意图理解",
        status: "done",
        detail: `识别为「${actionLabel}」任务。`,
        evidence
      }
    };
  }

  function groundingAgent(context, intent) {
    const objectlessIntent = intent.intent === "navigate";
    const object = objectlessIntent
      ? null
      : context.overrides.objectId
      ? findById(context.objects, context.overrides.objectId)
      : inferObject(context.command, context.objects, context);
    const destination = inferDestination(context.command, object, context.destinations);
    const ambiguity = objectlessIntent
      ? { needClarification: false, reason: "", candidates: [] }
      : context.overrides.objectId
      ? { needClarification: false, reason: "", candidates: [] }
      : detectAmbiguity(context.command, object, context.objects);
    const candidates = objectlessIntent ? [] : (ambiguity.candidates.length ? ambiguity.candidates : context.objects);
    const needClarification = objectlessIntent ? !destination : (!object || ambiguity.needClarification);
    const evidence = [];

    if (object) evidence.push(`目标对象：${object.name}（${object.zone}）`);
    if (!object && objectlessIntent) evidence.push("无需目标物体，执行机器人自身移动");
    if (!object && !objectlessIntent) evidence.push("未能稳定定位目标对象");
    if (destination) evidence.push(`目标位置：${destination.name}`);
    const groundingEvidence = buildGroundingEvidence(context.command, object, context);
    evidence.push(...groundingEvidence);
    if (ambiguity.reason) evidence.push(ambiguity.reason);
    const report = buildGroundingReport(context, intent, object, destination, ambiguity);

    return {
      object,
      destination,
      candidates,
      needClarification,
      ambiguityReason: ambiguity.reason,
      report,
      trace: {
        agent: "Grounding Agent",
        title: "对象与位置定位",
        status: needClarification ? "needs_input" : "done",
        detail: needClarification
          ? "存在指代或对象歧义，需要用户澄清。"
          : objectlessIntent
          ? "目标位置已定位，机器人将执行自身移动。"
          : "目标对象与目标位置已定位。",
        evidence
      }
    };
  }

  function safetyAgent(context, intent, grounding) {
    const constraints = extractConstraints(context.command, grounding.object, intent);
    const riskFactors = [];
    let riskLevel = "low";

    if (!grounding.object && intent.intent !== "navigate") {
      riskLevel = "medium";
      riskFactors.push("对象未确认");
    }

    if (grounding.object?.risk === "medium") {
      riskLevel = maxRisk(riskLevel, "medium");
      riskFactors.push(`${grounding.object.name} 为中风险对象/区域`);
    }

    if (grounding.object?.risk === "high") {
      riskLevel = "high";
      riskFactors.push(`${grounding.object.name} 为高风险对象`);
    }

    if (/小心|先确认|老人|药|重|门口/.test(context.command)) {
      riskLevel = maxRisk(riskLevel, "medium");
      riskFactors.push("用户表达包含安全约束或敏感场景");
    }

    const requiresHumanConfirmation = riskLevel !== "low";
    return {
      riskLevel,
      requiresHumanConfirmation,
      constraints,
      riskFactors,
      trace: {
        agent: "Safety Agent",
        title: "安全门控",
        status: requiresHumanConfirmation ? "gated" : "done",
        detail: requiresHumanConfirmation ? `风险等级 ${riskLevel}，执行前需要确认。` : "低风险任务，可自动执行。",
        evidence: riskFactors.length ? riskFactors : ["未发现显著安全风险"]
      }
    };
  }

  function recoveryAgent(context, intent, grounding, safety) {
    const options = [];
    let failureMode = null;
    let detail = "当前未预测到执行中断。";
    const evidence = [];

    if (/门口/.test(context.command) && grounding.object?.id === "heavy_box") {
      failureMode = "blocked_path";
      detail = "门口通道可能被重物任务占用，建议执行前准备重规划。";
      options.push(
        { id: "reroute", label: "重规划路径", outcome: "绕开椅子障碍，降低速度前往门口。" },
        { id: "change_destination", label: "改放客厅安全区", outcome: "将目标位置改为客厅安全区，等待人工搬运。" },
        { id: "handoff", label: "人工接管", outcome: "停止自动执行，由用户或操作员接管。" }
      );
      evidence.push("目标对象为重箱子");
      evidence.push("目标位置为门口，存在狭窄通道风险");
    } else if (grounding.object?.id === "medicine_box" && /递给|老人/.test(context.command)) {
      failureMode = "sensitive_handoff";
      detail = "药品递送需要确认收件人和物品，失败时应转人工。";
      options.push(
        { id: "confirm_recipient", label: "确认收件人", outcome: "语音确认老人是否需要该药盒。" },
        { id: "handoff", label: "人工接管", outcome: "停止自动递送，提醒用户人工处理。" }
      );
      evidence.push("药品属于高风险对象");
      evidence.push("靠近老人场景需要更严格交互");
    } else if (/障碍|椅子/.test(context.command) && grounding.object?.id !== "chair") {
      failureMode = "obstacle_avoidance";
      detail = "用户提到障碍物，执行时需要可恢复的避障策略。";
      options.push(
        { id: "reroute", label: "绕行避障", outcome: "重新规划路径绕开椅子。" },
        { id: "pause", label: "暂停等待", outcome: "暂停任务，等待用户清理障碍。" }
      );
      evidence.push("用户明确提到障碍或避让要求");
    }

    if (!failureMode) {
      options.push({ id: "continue", label: "继续执行", outcome: "按计划执行并持续监测异常。" });
      evidence.push("未发现需要预案的高概率中断");
    }

    return {
      failureMode,
      options,
      trace: {
        agent: "Recovery Agent",
        title: "异常恢复预案",
        status: failureMode ? "caution" : "done",
        detail,
        evidence
      }
    };
  }

  function plannerAgent(context, intent, grounding, safety, recovery) {
    const objectName = grounding.object ? grounding.object.name : "待确认对象";
    const destinationName = grounding.destination ? grounding.destination.name : "待确认位置";
    const routePreference = inferRoutePreference(context.command);
    const routeStep = routePreference.mode === "avoid_chair"
      ? "路径策略：加入椅子绕行点，低速通过障碍附近。"
      : "路径策略：默认路径规划，执行中持续监测障碍。";
    const steps = intent.intent === "navigate" ? [
      "解析用户自然语言，识别为机器人自身移动任务。",
      `定位目标区域：${destinationName}。`,
      safety.requiresHumanConfirmation ? "触发安全确认，等待用户确认或人工接管。" : "安全门控通过，进入导航规划。",
      routeStep,
      recovery.failureMode ? `预置异常恢复：${recovery.options.map((item) => item.label).join(" / ")}。` : "持续监测异常，但无需预置恢复分支。",
      `生成技能序列：定位当前位置 -> 规划路径 -> 前往${destinationName} -> 到达反馈。`,
      "执行中持续反馈进度，异常时暂停并保留上下文。",
      "任务结束后写入指标，用于交互质量和安全性评估。"
    ] : [
      "解析用户自然语言，确定任务目标和动作类型。",
      grounding.object ? `定位并锁定 ${objectName}。` : "进入澄清流程，等待用户选择目标对象。",
      safety.requiresHumanConfirmation ? "触发安全确认，等待用户确认或人工接管。" : "安全门控通过，进入执行规划。",
      routeStep,
      recovery.failureMode ? `预置异常恢复：${recovery.options.map((item) => item.label).join(" / ")}。` : "持续监测异常，但无需预置恢复分支。",
      `生成技能序列：导航 -> ${intent.actionLabel} -> 前往${destinationName} -> 状态反馈。`,
      "执行中持续反馈进度，异常时暂停并保留上下文。",
      "任务结束后写入指标，用于交互质量和安全性评估。"
    ];

    return {
      steps,
      trace: {
        agent: "Planner Agent",
        title: "任务规划",
        status: grounding.needClarification ? "waiting" : "done",
        detail: `生成 ${steps.length} 步任务计划。`,
        evidence: steps.slice(0, 4)
      }
    };
  }

  function evaluatorAgent(context, intent, grounding, safety, recovery, plan) {
    let confidence = 0.86;
    const evidence = [];

    if (!grounding.object && intent.intent !== "navigate") {
      confidence -= 0.28;
      evidence.push("对象缺失，降低执行置信度");
    }

    if (grounding.needClarification) {
      confidence -= 0.18;
      evidence.push("需要澄清，暂不进入自动执行");
    }

    if (safety.requiresHumanConfirmation) {
      confidence -= 0.08;
      evidence.push("安全确认会增加交互轮次，但降低误执行风险");
    }

    if (recovery.failureMode) {
      confidence -= 0.06;
      evidence.push("存在可恢复异常预案，执行前应向用户暴露选择");
    }

    if (!evidence.length) evidence.push("任务对象、位置、动作和风险均可解释");

    return {
      confidence: Number(Math.max(0.18, confidence).toFixed(2)),
      trace: {
        agent: "Evaluator Agent",
        title: "可执行性评估",
        status: confidence > 0.68 ? "done" : "caution",
        detail: `当前任务执行置信度 ${Number(Math.max(0.18, confidence).toFixed(2))}。`,
        evidence
      }
    };
  }

  function isRobotNavigationCommand(command) {
    const hasDestination = /厨房|台面|门口|客厅|老人座位|老人|床头柜|床边|餐桌|桌边/.test(command);
    const hasNavigationVerb = /移动到|走到|前往|去|到/.test(command);
    const hasObjectMention = /把|将|拿|取|放|递|送|搬|挪|杯|水|药|快递|包裹|箱子|椅子|障碍|东西|物体|这个|那个/.test(command);
    return hasDestination && hasNavigationVerb && !hasObjectMention;
  }

  function inferObject(command, objects, context) {
    const objectReference = extractObjectReferencePhrase(command);
    const sceneCandidate = inferObjectBySceneReference(objectReference, objects);
    if (sceneCandidate) return sceneCandidate;

    if (/这个|那个|这边|那边/.test(objectReference) && context.selectedObjectId) {
      return findById(objects, context.selectedObjectId);
    }

    if (/药|药盒/.test(objectReference)) return findById(objects, "medicine_box");
    if (/老人旁边|老人边上|床边物品|床边那个东西|床头柜.*东西|床边.*东西|边桌/.test(objectReference)) return findById(objects, "medicine_box");
    if (/快递|包裹/.test(objectReference)) return findById(objects, "parcel");
    if (/箱子|重箱/.test(objectReference)) return findById(objects, "heavy_box");
    if (/障碍|椅子/.test(objectReference)) return findById(objects, "chair");
    if (/床头柜|床边|床头/.test(objectReference) && /水|水杯|杯/.test(objectReference)) return findById(objects, "red_cup");
    if (/餐桌|桌边|桌上|桌面/.test(objectReference) && /水|水杯|杯/.test(objectReference)) return findById(objects, "blue_cup");
    if (/红色|红杯/.test(objectReference)) return findById(objects, "red_cup");
    if (/蓝色|蓝杯/.test(objectReference)) return findById(objects, "blue_cup");
    return null;
  }

  function inferObjectBySceneReference(command, objects) {
    const sorted = scoreObjectCandidates(command, objects)
      .filter((candidate) => candidate.score > 0)
      .sort((left, right) => right.score - left.score);

    if (!sorted.length) return null;
    if (sorted.length > 1 && sorted[0].score === sorted[1].score && sorted[0].score < 4) return null;
    return sorted[0].object;
  }

  function buildGroundingReport(context, intent, object, destination, ambiguity) {
    const signals = extractGroundingSignals(context.command, context);

    if (intent.intent === "navigate") {
      return {
        mode: "navigation",
        title: "机器人自身移动",
        selectedObjectId: null,
        destinationId: destination?.id || null,
        destinationName: destination?.name || "待确认位置",
        needsClarification: !destination,
        decision: destination
          ? `指令没有出现可搬运对象，系统将机器人自身移动到「${destination.name}」。`
          : "检测到机器人移动意图，但目标位置仍需确认。",
        signals,
        candidates: []
      };
    }

    const objectReference = extractObjectReferencePhrase(context.command);
    const candidateRows = scoreObjectCandidates(objectReference, context.objects)
      .map((candidate) => enrichCandidateForReport(candidate, context, object, ambiguity))
      .sort((left, right) => {
        if (left.isSelected !== right.isSelected) return left.isSelected ? -1 : 1;
        return right.score - left.score;
      })
      .slice(0, 6);

    return {
      mode: "object_grounding",
      title: "对象 Grounding",
      selectedObjectId: object?.id || null,
      selectedObjectName: object?.name || null,
      destinationId: destination?.id || null,
      destinationName: destination?.name || "待确认位置",
      needsClarification: ambiguity.needClarification || !object,
      ambiguityReason: ambiguity.reason,
      decision: buildGroundingDecision(object, destination, ambiguity, candidateRows),
      signals,
      candidates: candidateRows
    };
  }

  function scoreObjectCandidates(command, objects) {
    let candidates = objects.map((object) => ({
      object,
      score: 0,
      reasons: []
    }));

    candidates = scoreByType(command, candidates);
    candidates = scoreByColor(command, candidates);
    candidates = scoreByZone(command, candidates);
    candidates = scoreBySpatialReference(command, candidates);
    candidates = scoreByAlias(command, candidates);
    return candidates;
  }

  function enrichCandidateForReport(candidate, context, selectedObject, ambiguity) {
    const object = candidate.object;
    const reasons = [...candidate.reasons];
    let score = candidate.score;

    if (/这个|那个|这边|那边/.test(context.command) && context.selectedObjectId === object.id) {
      score += 2;
      reasons.push("上下文命中：用户当前选中对象");
    }

    if ((ambiguity.candidates || []).some((item) => item?.id === object.id)) {
      reasons.push("澄清候选：需要用户进一步选择");
    }

    if (!reasons.length) {
      reasons.push("未命中本轮语言或场景证据");
    }

    return {
      id: object.id,
      name: object.name,
      type: object.type,
      zone: object.zone,
      risk: object.risk,
      score,
      reasons,
      isSelected: selectedObject?.id === object.id
    };
  }

  function buildGroundingDecision(object, destination, ambiguity, candidates) {
    if (ambiguity.needClarification) {
      return ambiguity.reason || "候选对象证据接近，进入澄清流程。";
    }

    if (!object) {
      return "没有稳定命中可执行对象，进入澄清流程。";
    }

    const selected = candidates.find((candidate) => candidate.id === object.id);
    const selectedScore = selected ? `，证据分 ${selected.score}` : "";
    const destinationCopy = destination ? `，目标位置为「${destination.name}」` : "";
    return `最终选择「${object.name}」${selectedScore}${destinationCopy}。`;
  }

  function extractGroundingSignals(command, context) {
    const signals = [];
    if (/水|水杯|杯子|杯|箱子|药|药盒|快递|包裹|障碍|椅子|东西|物体/.test(command)) signals.push("对象类型");
    if (/红色|蓝色|红|蓝/.test(command)) signals.push("颜色属性");
    if (/床头柜|床边|床头|餐桌|桌边|桌上|桌面|门口|厨房|客厅|老人|边桌/.test(command)) signals.push("场景区域");
    if (/左边|右边|旁边|附近|边上/.test(command)) signals.push("空间关系");
    if (/这个|那个|这边|那边/.test(command)) signals.push("指代上下文");
    if (context.selectedObjectId) signals.push("当前选中对象");
    if (/移动到|走到|前往|去|到/.test(command)) signals.push("导航目标");
    return signals.length ? signals : ["默认任务语义"];
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

  function inferDestination(command, object, destinations) {
    const targetText = extractTargetPhrase(command);
    const targetDestination = targetText ? matchDestinationText(targetText, destinations) : null;
    if (targetDestination) return targetDestination;

    if (/厨房|台面/.test(command)) return findById(destinations, "kitchen_counter");
    if (/门口/.test(command)) return findById(destinations, "door");
    if (/老人|递给/.test(command)) return findById(destinations, "elder_seat");
    if (/客厅/.test(command)) return findById(destinations, "living_room");
    if (/床头柜|床边|床头/.test(command)) return findById(destinations, "bedside_table");
    if (/餐桌|桌边|桌旁/.test(command)) return findById(destinations, "dining_table");
    if (object?.id === "medicine_box") return findById(destinations, "elder_seat");
    if (object?.id === "parcel") return findById(destinations, "door");
    return findById(destinations, "kitchen_counter");
  }

  function extractTargetPhrase(command) {
    const matches = [...command.matchAll(/(?:拿到|放到|送到|递到|搬到|挪到|带到|移动到|走到|前往|拿去|送去|放去|放在|递给|拿给|送给|交给)([^，。；,;]*)/g)];
    if (!matches.length) return "";
    return matches[matches.length - 1][1] || "";
  }

  function extractObjectReferencePhrase(command) {
    const sourceMatches = [...command.matchAll(/(?:把|将)(.*?)(?:拿到|放到|送到|递到|搬到|挪到|带到|拿去|送去|放去|放在|递给|拿给|送给|交给)/g)];
    if (sourceMatches.length) {
      return (sourceMatches[sourceMatches.length - 1][1] || "").trim();
    }
    return command
      .replace(/(?:拿到|放到|送到|递到|搬到|挪到|带到|移动到|走到|前往|拿去|送去|放去|放在|递给|拿给|送给|交给)([^，。；,;]*)/g, "")
      .trim();
  }

  function matchDestinationText(text, destinations) {
    if (/厨房|台面/.test(text)) return findById(destinations, "kitchen_counter");
    if (/门口/.test(text)) return findById(destinations, "door");
    if (/老人/.test(text)) return findById(destinations, "elder_seat");
    if (/客厅|安全区/.test(text)) return findById(destinations, "living_room");
    if (/餐桌|桌边|桌旁|桌上|桌面/.test(text)) return findById(destinations, "dining_table");
    if (/床头柜|床边|床头/.test(text)) return findById(destinations, "bedside_table");
    return null;
  }

  function detectAmbiguity(command, object, objects) {
    const objectReference = extractObjectReferencePhrase(command);
    if (/水|水杯|杯子|杯/.test(objectReference) && !/红色|蓝色|红杯|蓝杯|左边|右边|床头柜|床边|床头|餐桌|桌边|桌上|桌面/.test(objectReference)) {
      return {
        needClarification: true,
        reason: "水杯存在多个候选，需要位置澄清",
        candidates: [findById(objects, "red_cup"), findById(objects, "blue_cup")].filter(Boolean)
      };
    }

    if (/那个|这个|这边|那边|旁边/.test(objectReference) && !object) {
      return {
        needClarification: true,
        reason: "存在指代词，但缺少视觉或上下文定位",
        candidates: objects.filter((item) => ["red_cup", "blue_cup", "heavy_box", "parcel"].includes(item.id))
      };
    }

    if (!object) {
      return {
        needClarification: true,
        reason: "未识别到可执行对象",
        candidates: objects
      };
    }

    return {
      needClarification: false,
      reason: "",
      candidates: []
    };
  }

  function scoreByType(command, candidates) {
    return candidates.map((candidate) => {
      if (/水|水杯|杯子|杯/.test(command) && candidate.object.type === "cup") addScore(candidate, 2, "类型匹配：水杯");
      if (/箱子/.test(command) && candidate.object.type === "box") addScore(candidate, 3, "类型匹配：箱子");
      if (/药|药盒/.test(command) && candidate.object.type === "medicine") addScore(candidate, 4, "类型匹配：药品");
      if (/快递|包裹/.test(command) && candidate.object.type === "parcel") addScore(candidate, 4, "类型匹配：包裹/快递");
      if (/障碍|椅子/.test(command) && candidate.object.type === "obstacle") addScore(candidate, 2, "类型匹配：障碍物");
      if (/物体|东西/.test(command) && candidate.object.type !== "obstacle") addScore(candidate, 1, "泛化物体候选");
      return candidate;
    });
  }

  function scoreByColor(command, candidates) {
    return candidates.map((candidate) => {
      if (/红色|红/.test(command) && candidate.object.color === "red") addScore(candidate, 3, "颜色匹配：红色");
      if (/蓝色|蓝/.test(command) && candidate.object.color === "blue") addScore(candidate, 3, "颜色匹配：蓝色");
      return candidate;
    });
  }

  function scoreByZone(command, candidates) {
    return candidates.map((candidate) => {
      if (/床头柜|床边|床头/.test(command) && candidate.object.semanticZone === "bedside_table") addScore(candidate, 4, "区域匹配：床头柜");
      if (/餐桌|桌边|桌上|桌面|桌/.test(command) && ["dining_table", "table"].includes(candidate.object.semanticZone)) addScore(candidate, 3, "区域匹配：餐桌");
      if (/门口/.test(command) && candidate.object.semanticZone === "door") addScore(candidate, 3, "区域匹配：门口");
      if (/老人旁边|老人边上|边桌/.test(command) && (candidate.object.semanticZone === "elder_side_table" || candidate.object.id === "medicine_box")) addScore(candidate, 4, "区域匹配：老人旁边");
      if (/客厅左侧|客厅左边/.test(command) && candidate.object.semanticZone === "living_left") addScore(candidate, 4, "区域匹配：客厅左侧");
      return candidate;
    });
  }

  function scoreBySpatialReference(command, candidates) {
    const cups = candidates.filter((candidate) => candidate.object.type === "cup");
    const cupXs = cups.map((candidate) => candidate.object.x);
    const leftCupX = cupXs.length ? Math.min(...cupXs) : null;
    const rightCupX = cupXs.length ? Math.max(...cupXs) : null;

    return candidates.map((candidate) => {
      if (/左边|左侧/.test(command)) {
        if (leftCupX !== null && /水|水杯|杯子|杯/.test(command) && candidate.object.type === "cup" && candidate.object.x === leftCupX) {
          addScore(candidate, 4, "空间匹配：杯子中更靠左");
        } else if (candidate.object.semanticZone === "living_left") {
          addScore(candidate, 3, "空间匹配：客厅左侧");
        }
      }

      if (/右边|右侧/.test(command)) {
        if (rightCupX !== null && /水|水杯|杯子|杯/.test(command) && candidate.object.type === "cup" && candidate.object.x === rightCupX) {
          addScore(candidate, 4, "空间匹配：杯子中更靠右");
        } else if (candidate.object.x > 60) {
          addScore(candidate, 2, "空间匹配：场景右侧");
        }
      }

      if (/旁边|边上|附近/.test(command) && /老人/.test(command) && candidate.object.semanticZone === "elder_side_table") {
        addScore(candidate, 4, "空间匹配：靠近老人座位");
      }

      return candidate;
    });
  }

  function scoreByAlias(command, candidates) {
    return candidates.map((candidate) => {
      const aliases = candidate.object.aliases || [];
      const matchedAlias = aliases.find((alias) => command.includes(alias));
      if (matchedAlias) addScore(candidate, 5, `别名命中：${matchedAlias}`);
      return candidate;
    });
  }

  function buildGroundingEvidence(command, object, context) {
    const evidence = [];
    if (!object) return evidence;

    if (/这个|那个|这边|那边/.test(command) && context.selectedObjectId === object.id) {
      evidence.push("使用用户在场景中选中的对象作为指代上下文");
    }

    if (/左边|右边|旁边|床边|床头柜|餐桌|桌边|桌上|门口|老人/.test(command)) {
      evidence.push("使用场景位置语义完成视觉指代 grounding");
    }

    if (object.color && /红色|蓝色|红|蓝/.test(command)) {
      evidence.push(`使用视觉属性：${object.color}`);
    }

    return evidence;
  }

  function addScore(candidate, score, reason) {
    candidate.score += score;
    candidate.reasons.push(reason);
  }

  function extractConstraints(command, object, intent) {
    const constraints = [];
    const routePreference = inferRoutePreference(command);
    if (/小心/.test(command)) constraints.push("避障/低速执行");
    if (/先确认/.test(command)) constraints.push("执行前二次确认");
    if (/老人/.test(command)) constraints.push("靠近老人时降低速度并语音反馈");
    if (/门口/.test(command)) constraints.push("门口区域先检查通行空间");
    if (routePreference.mode === "avoid_chair") constraints.push("主动绕开椅子障碍", "低速通过障碍附近");
    if (object?.risk === "high") constraints.push("高风险对象需用户确认或人工接管");
    if (intent.intent === "inspect") constraints.push("仅观察反馈，不搬动物体");
    return constraints.length ? mergeUnique(constraints) : ["默认路径规划", "执行完成后状态反馈"];
  }

  function mergeUnique(items) {
    return [...new Set(items.filter(Boolean))];
  }

  function compare(name, actual, expected) {
    return {
      name,
      actual,
      expected,
      pass: actual === expected
    };
  }

  function maxRisk(left, right) {
    const order = { low: 1, medium: 2, high: 3 };
    return order[right] > order[left] ? right : left;
  }

  function findById(items, id) {
    return items.find((item) => item.id === id) || null;
  }

  return {
    orchestrate,
    runEvaluation
  };
})();

window.VoiceToActionAgents = VoiceToActionAgents;
