(() => {
  const BRIDGE_VERSION = "V10.0";

  const INTEGRATION_GUARDRAILS = [
    {
      id: "server_proxy_only",
      name: "API Key 只允许在后端代理中使用",
      reason: "浏览器端不能持有真实模型密钥，前端只提交任务上下文和工具契约。"
    },
    {
      id: "tool_contract_first",
      name: "LLM 只能选择工具，不直接下发物理动作",
      reason: "机器人移动、抓取、放置必须由本地执行门控和规划模块确认后触发。"
    },
    {
      id: "final_gate_required",
      name: "所有任务必须经过 decide_execution_gate",
      reason: "澄清、确认、阻止执行和人工接管都是显式结果，不能被 prompt 绕过。"
    },
    {
      id: "deterministic_fallback",
      name: "模型失败时回退到本地确定性链路",
      reason: "超时、格式错误、工具越权或代理不可用时，仍能用本地 Agent 保持演示和安全边界。"
    }
  ];

  function buildProxyRequest(command, world, options = {}) {
    const toolSpecs = buildToolSchemas();
    return {
      apiVersion: "voice-to-action.llm-bridge.v1",
      bridgeVersion: BRIDGE_VERSION,
      command,
      modelPolicy: {
        provider: "openai",
        apiSurface: "responses_api",
        model: "server_default",
        temperature: 0.1,
        maxToolRounds: 8
      },
      systemIntent: "Convert a natural-language home-service robot request into auditable tool calls. Do not execute physical actions directly.",
      worldSnapshot: options.omitWorldSnapshot ? null : buildWorldSnapshot(world),
      toolSpecs,
      requiredOutput: {
        finalGateTool: "decide_execution_gate",
        allowedGateModes: ["execute", "clarify", "confirm", "block", "handoff"],
        requireEvaluationTool: true
      },
      guardrails: {
        keyExposedToBrowser: false,
        directRobotActionAllowed: false,
        requireGroundingBeforeRoute: true,
        requireSafetyBeforeExecutionGate: true,
        fallbackStrategy: "local_deterministic_tool_chain"
      },
      traceRequest: {
        includeInputs: true,
        includeOutputs: true,
        includeSafetyRationale: true
      }
    };
  }

  async function runIntegrationPlan(command, world, options = {}) {
    const startedAt = Date.now();
    const proxyRequest = buildProxyRequest(command, world, options);
    const proxyResponse = await callServerProxy(proxyRequest, options);
    const localToolResult = window.VoiceToActionToolCalling.runToolCallingPlan(command, world, {
      expected: options.expected || {}
    });
    const checks = evaluateBridge({
      proxyRequest,
      proxyResponse,
      localToolResult,
      expected: options.expected || {},
      options
    });

    return {
      bridgeVersion: BRIDGE_VERSION,
      command,
      durationMs: Date.now() - startedAt,
      mode: proxyResponse.fallback && proxyResponse.fallback.required
        ? "proxy_validated_local_fallback"
        : "server_proxy_ready",
      readiness: summarizeReadiness(checks),
      proxyRequest,
      proxyResponse,
      localToolResult,
      checks
    };
  }

  async function runIntegrationEvaluation(cases, world) {
    const results = [];
    for (const caseItem of cases) {
      const result = await runIntegrationPlan(caseItem.command, world, {
        expected: caseItem,
        omitWorldSnapshot: caseItem.proxyFault === "missing_world_snapshot",
        forceProxyOffline: caseItem.proxyFault === "proxy_offline"
      });
      results.push({
        id: caseItem.id,
        label: caseItem.label,
        command: caseItem.command,
        passed: result.checks.every((check) => check.pass),
        gateMode: result.localToolResult.gate.mode,
        proxyStatus: result.proxyResponse.provider.status,
        fallbackRequired: result.proxyResponse.fallback.required,
        checks: result.checks,
        pmNote: caseItem.pmNote,
        result
      });
    }
    return results;
  }

  async function callServerProxy(proxyRequest, options) {
    if (options.forceProxyOffline) {
      return {
        mode: "server_proxy_unavailable",
        serverTime: new Date().toISOString(),
        provider: {
          name: "openai_responses_api",
          configured: false,
          keyExposedToBrowser: false,
          status: "offline_simulated"
        },
        requestValidation: {
          passed: false,
          missingFields: ["server_proxy"]
        },
        toolChoicePolicy: {
          allowedTools: proxyRequest.toolSpecs.map((tool) => tool.name),
          requiredFinalGate: "decide_execution_gate",
          blockedDirectActions: ["robot_move", "pick", "place", "handoff_without_gate"]
        },
        llmCall: {
          executed: false,
          reason: "Simulated proxy outage for fallback validation."
        },
        fallback: {
          required: true,
          strategy: "run_local_tool_chain_after_proxy_failure"
        }
      };
    }

    try {
      const proxyUrl = options.proxyUrl || getProxyUrl();
      const response = await fetch(proxyUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(proxyRequest)
      });
      if (!response.ok) {
        throw new Error(`Proxy returned HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      return {
        mode: "server_proxy_error",
        serverTime: new Date().toISOString(),
        provider: {
          name: "openai_responses_api",
          configured: false,
          keyExposedToBrowser: false,
          status: "proxy_error"
        },
        requestValidation: {
          passed: false,
          missingFields: ["server_proxy"]
        },
        toolChoicePolicy: {
          allowedTools: proxyRequest.toolSpecs.map((tool) => tool.name),
          requiredFinalGate: "decide_execution_gate",
          blockedDirectActions: ["robot_move", "pick", "place", "handoff_without_gate"]
        },
        llmCall: {
          executed: false,
          reason: error.message
        },
        fallback: {
          required: true,
          strategy: "run_local_tool_chain_after_proxy_error"
        }
      };
    }
  }

  function getProxyUrl() {
    if (typeof window !== "undefined" && window.location && window.location.origin) {
      return `${window.location.origin}/api/llm-tool-plan`;
    }
    return "http://localhost:8765/api/llm-tool-plan";
  }

  function buildToolSchemas() {
    const specs = window.VoiceToActionToolCalling ? window.VoiceToActionToolCalling.TOOL_SPECS : [];
    return specs.map((tool) => ({
      name: tool.name,
      description: tool.purpose,
      inputSchema: buildInputSchema(tool.name),
      outputPolicy: {
        mustBeJson: true,
        mustBeAuditable: true
      }
    }));
  }

  function buildInputSchema(toolName) {
    const base = {
      type: "object",
      additionalProperties: false,
      properties: {}
    };
    const fields = {
      classify_user_instruction: ["command"],
      parse_task_intent: ["command", "instructionType"],
      ground_scene_reference: ["command", "intent", "worldSnapshot"],
      assess_safety_gate: ["intent", "objectId", "destinationId"],
      plan_physical_route: ["objectId", "destinationId", "routeConstraint"],
      decide_execution_gate: ["instructionType", "needClarification", "requiresHumanConfirmation", "riskLevel"],
      evaluate_tool_trace: ["toolCalls", "expected"]
    }[toolName] || ["input"];

    fields.forEach((field) => {
      base.properties[field] = { type: ["string", "boolean", "object", "array", "null"] };
    });
    base.required = fields.filter((field) => !["expected", "routeConstraint"].includes(field));
    return base;
  }

  function buildWorldSnapshot(world) {
    return {
      objects: (world.objects || []).map((object) => ({
        id: object.id,
        name: object.name,
        type: object.type,
        color: object.color,
        semanticZone: object.semanticZone,
        risk: object.risk,
        aliases: object.aliases || []
      })),
      destinations: (world.destinations || []).map((destination) => ({
        id: destination.id,
        name: destination.name
      }))
    };
  }

  function evaluateBridge(context) {
    const { proxyRequest, proxyResponse, localToolResult, expected } = context;
    const finalGateTool = localToolResult.toolCalls.some((call) => call.name === "decide_execution_gate");
    const evaluationTool = localToolResult.toolCalls.some((call) => call.name === "evaluate_tool_trace");
    const directActionsBlocked = (proxyResponse.toolChoicePolicy.blockedDirectActions || []).includes("robot_move");
    const checks = [
      check("browserKeyHidden", proxyRequest.guardrails.keyExposedToBrowser, false),
      check("proxyKeyHidden", proxyResponse.provider.keyExposedToBrowser, false),
      check("requestValidation", proxyResponse.requestValidation.passed, expected.expectedRequestValidation),
      check("fallbackRequired", proxyResponse.fallback.required, expected.expectedFallbackRequired),
      check("directActionsBlocked", directActionsBlocked, true),
      check("finalGateTool", finalGateTool, true),
      check("evaluationTool", evaluationTool, true),
      check("gateMode", localToolResult.gate.mode, expected.expectedGateMode),
      check("localEvaluationPassed", localToolResult.evaluation.passed, expected.expectedLocalEvaluationPassed),
      check("proxyStatus", proxyResponse.provider.status, expected.expectedProxyStatus)
    ].filter((item) => item.expected !== undefined);
    return checks;
  }

  function summarizeReadiness(checks) {
    const passed = checks.filter((check) => check.pass).length;
    const total = checks.length || 1;
    return {
      passed,
      total,
      score: Math.round((passed / total) * 100),
      label: passed === total ? "ready_with_guardrails" : "needs_review"
    };
  }

  function check(name, actual, expected) {
    return {
      name,
      actual,
      expected,
      pass: expected === undefined || actual === expected
    };
  }

  window.VoiceToActionLLMBridge = {
    BRIDGE_VERSION,
    INTEGRATION_GUARDRAILS,
    buildProxyRequest,
    runIntegrationPlan,
    runIntegrationEvaluation
  };
})();
