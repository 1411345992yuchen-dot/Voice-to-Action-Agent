const flowGrid = document.querySelector("#flowGrid");
const evidenceGrid = document.querySelector("#evidenceGrid");

const fieldLabels = {
  intent: "意图",
  object: "对象",
  destination: "目标",
  risk: "风险",
  gate: "门控",
  coverage: "评估",
  pmCapability: "能力"
};

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function renderFlowCard(flow) {
  const card = el("article", "flow-card");
  card.append(el("span", "version", flow.version));
  card.append(el("h3", "", flow.title));
  card.append(el("p", "tagline", flow.tagline));
  card.append(el("div", "command-box", flow.command));

  const path = el("div", "agent-path");
  flow.agentPath.forEach((step) => path.append(el("span", "", step)));
  card.append(path);

  card.append(el("p", "talk", flow.talkTrack));

  const action = el("a", "action-link primary", "打开可运行 Demo");
  action.href = flow.demoUrl;
  card.append(action);
  return card;
}

function renderEvidenceCard(flow) {
  const card = el("article", "evidence-card");
  card.append(el("h3", "", flow.title));

  const list = el("dl", "kv");
  Object.entries(flow.evidence).forEach(([key, value]) => {
    list.append(el("dt", "", fieldLabels[key] || key));
    list.append(el("dd", "", value));
  });
  card.append(list);

  const row = el("div", "pill-row");
  row.append(el("span", "pill safe", flow.evidence.gate));
  row.append(el("span", flow.evidence.risk.includes("高") ? "pill risk" : "pill", flow.evidence.risk));
  card.append(row);
  return card;
}

async function init() {
  const response = await fetch("data/interview-demo-flows.json");
  const flows = await response.json();
  flowGrid.innerHTML = "";
  evidenceGrid.innerHTML = "";
  flows.forEach((flow) => {
    flowGrid.append(renderFlowCard(flow));
    evidenceGrid.append(renderEvidenceCard(flow));
  });
}

init().catch((error) => {
  flowGrid.innerHTML = `<article class="flow-card"><h3>加载失败</h3><p class="tagline">${error.message}</p></article>`;
});
