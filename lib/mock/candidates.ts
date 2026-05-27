export type Candidate = {
  id: string;
  name: string;
  location: string;
  currentCompany: string;
  title: string;
  skills: string[];
  score: number;
  source: string;
  lastActivity: string;
  education: string;
  experience: Array<{ company: string; role: string; span: string; note: string }>;
  evaluation: string;
};

export const candidates: Candidate[] = [
  {
    id: "cand-1048",
    name: "mara chen",
    location: "singapore",
    currentCompany: "stripe",
    title: "senior product manager, risk",
    skills: ["payments", "risk", "platform", "experimentation"],
    score: 94,
    source: "github referral",
    lastActivity: "screened 2h ago",
    education: "nus, computer science",
    experience: [
      { company: "stripe", role: "senior pm", span: "2021-now", note: "owned risk decisioning and merchant onboarding" },
      { company: "grab", role: "product lead", span: "2018-2021", note: "scaled trust ops tooling across 6 markets" }
    ],
    evaluation: "highest signal for agentic recruiting pm. strong marketplace judgment, crisp systems thinking, low ramp risk."
  },
  {
    id: "cand-1102",
    name: "aaron li",
    location: "shanghai",
    currentCompany: "xiaohongshu",
    title: "staff frontend engineer",
    skills: ["react", "design systems", "performance", "ai ux"],
    score: 91,
    source: "sourcing agent",
    lastActivity: "replied yesterday",
    education: "zju, software engineering",
    experience: [
      { company: "xiaohongshu", role: "staff engineer", span: "2020-now", note: "rebuilt creator workflow and internal ai canvas" },
      { company: "bytedance", role: "senior engineer", span: "2017-2020", note: "led web infra for ads console" }
    ],
    evaluation: "rare product-engineering blend. likely strong for design engineering and agent workspace roles."
  },
  {
    id: "cand-1177",
    name: "nina kapoor",
    location: "bangalore",
    currentCompany: "atlassian",
    title: "engineering manager, collaboration ai",
    skills: ["llm apps", "team leadership", "collaboration", "evaluation"],
    score: 89,
    source: "linkedin outbound",
    lastActivity: "opened outreach 4h ago",
    education: "iit delhi, electrical engineering",
    experience: [
      { company: "atlassian", role: "engineering manager", span: "2022-now", note: "manages 14 engineers on ai meeting workflows" },
      { company: "microsoft", role: "senior engineer", span: "2016-2022", note: "built teams async collaboration surfaces" }
    ],
    evaluation: "excellent people systems background. probe hands-on depth and appetite for early product ambiguity."
  },
  {
    id: "cand-1215",
    name: "lucas weber",
    location: "berlin",
    currentCompany: "linear",
    title: "product designer",
    skills: ["systems design", "interaction", "prototyping", "quality bar"],
    score: 88,
    source: "portfolio watchlist",
    lastActivity: "portfolio parsed today",
    education: "fh potsdam, interface design",
    experience: [
      { company: "linear", role: "product designer", span: "2021-now", note: "designed planning and issue command flows" },
      { company: "pitch", role: "designer", span: "2018-2021", note: "owned editor collaboration details" }
    ],
    evaluation: "very high craft fit. comp and relocation risk likely high."
  },
  {
    id: "cand-1280",
    name: "sophia ng",
    location: "hong kong",
    currentCompany: "canva",
    title: "growth product lead",
    skills: ["growth", "activation", "marketplaces", "analytics"],
    score: 86,
    source: "talent pool",
    lastActivity: "added to slate 1d ago",
    education: "hku, economics",
    experience: [
      { company: "canva", role: "growth product lead", span: "2020-now", note: "activation and team adoption loops" },
      { company: "airbnb", role: "growth pm", span: "2017-2020", note: "host onboarding experiments" }
    ],
    evaluation: "strong operating cadence. best for growth-facing requisitions, less direct ats domain depth."
  },
  {
    id: "cand-1324",
    name: "diego martinez",
    location: "mexico city",
    currentCompany: "deel",
    title: "senior backend engineer",
    skills: ["distributed systems", "payroll", "compliance", "node"],
    score: 84,
    source: "referral",
    lastActivity: "scheduled screen",
    education: "unam, computer engineering",
    experience: [
      { company: "deel", role: "senior backend engineer", span: "2021-now", note: "compliance engine and payroll workflows" },
      { company: "clip", role: "backend engineer", span: "2018-2021", note: "payments reconciliation services" }
    ],
    evaluation: "solid platform depth. strong for workflow reliability, lower evidence for ai-native interfaces."
  },
  {
    id: "cand-1372",
    name: "emily johnson",
    location: "new york",
    currentCompany: "notion",
    title: "research lead",
    skills: ["ux research", "enterprise", "ai writing", "jobs theory"],
    score: 83,
    source: "conference list",
    lastActivity: "enriched 3h ago",
    education: "nyu, psychology",
    experience: [
      { company: "notion", role: "research lead", span: "2022-now", note: "ai writing and enterprise adoption research" },
      { company: "slack", role: "senior researcher", span: "2018-2022", note: "collaboration behavior and admin controls" }
    ],
    evaluation: "excellent discovery rigor. pair with a prototyper for product design loop."
  },
  {
    id: "cand-1401",
    name: "kenji sato",
    location: "tokyo",
    currentCompany: "mercari",
    title: "ml platform lead",
    skills: ["ranking", "retrieval", "ml platform", "experimentation"],
    score: 82,
    source: "paper trail",
    lastActivity: "new paper matched",
    education: "university of tokyo, information science",
    experience: [
      { company: "mercari", role: "ml platform lead", span: "2019-now", note: "ranking platform and marketplace retrieval" },
      { company: "rakuten", role: "ml engineer", span: "2015-2019", note: "recommendation models" }
    ],
    evaluation: "good for recommendation strategy. validate product intuition and recruiter empathy."
  },
  {
    id: "cand-1444",
    name: "olivia smith",
    location: "london",
    currentCompany: "monzo",
    title: "people operations lead",
    skills: ["recruiting ops", "compliance", "offer process", "analytics"],
    score: 80,
    source: "community",
    lastActivity: "viewed jd today",
    education: "lse, management",
    experience: [
      { company: "monzo", role: "people ops lead", span: "2020-now", note: "scaled hiring operations and offer approvals" },
      { company: "deliveroo", role: "recruiting ops", span: "2016-2020", note: "built recruiting dashboards" }
    ],
    evaluation: "domain-heavy operator. best for internal product advisor or ops leadership searches."
  },
  {
    id: "cand-1499",
    name: "yuki tan",
    location: "seattle",
    currentCompany: "figma",
    title: "design engineer",
    skills: ["typescript", "canvas", "prototyping", "interaction"],
    score: 92,
    source: "portfolio watchlist",
    lastActivity: "shortlisted 30m ago",
    education: "uw, human centered design",
    experience: [
      { company: "figma", role: "design engineer", span: "2021-now", note: "built prototyping primitives and ai assist surfaces" },
      { company: "observable", role: "frontend engineer", span: "2018-2021", note: "interactive notebook components" }
    ],
    evaluation: "top-tier design engineering fit. move fast before competing offers."
  },
  {
    id: "cand-1526",
    name: "priya raman",
    location: "austin",
    currentCompany: "tesla",
    title: "technical recruiter",
    skills: ["sourcing", "closing", "hardware", "exec search"],
    score: 79,
    source: "alumni graph",
    lastActivity: "call notes imported",
    education: "ut austin, communications",
    experience: [
      { company: "tesla", role: "technical recruiter", span: "2019-now", note: "closed senior hardware and autonomy roles" },
      { company: "meta", role: "recruiter", span: "2016-2019", note: "infra and product recruiting" }
    ],
    evaluation: "strong recruiting craft. less product-building signal but valuable for workflow validation."
  },
  {
    id: "cand-1588",
    name: "samuel okafor",
    location: "lagos",
    currentCompany: "flutterwave",
    title: "security engineering lead",
    skills: ["fraud", "security", "payments", "incident response"],
    score: 78,
    source: "github referral",
    lastActivity: "matched 6h ago",
    education: "university of lagos, computer science",
    experience: [
      { company: "flutterwave", role: "security lead", span: "2020-now", note: "fraud tooling and incident response" },
      { company: "interswitch", role: "security engineer", span: "2016-2020", note: "payment security controls" }
    ],
    evaluation: "credible risk profile. useful for trust and safety hiring, not primary for ats redesign."
  },
  {
    id: "cand-1633",
    name: "laura garcia",
    location: "madrid",
    currentCompany: "typeform",
    title: "staff product designer",
    skills: ["forms", "conversation ux", "research", "systems"],
    score: 87,
    source: "design network",
    lastActivity: "replied 1d ago",
    education: "ied madrid, product design",
    experience: [
      { company: "typeform", role: "staff designer", span: "2019-now", note: "conversation-first form creation and analytics" },
      { company: "cabify", role: "product designer", span: "2015-2019", note: "driver and rider workflows" }
    ],
    evaluation: "strong conversation interface experience. likely to resist enterprise bloat."
  },
  {
    id: "cand-1685",
    name: "chen wei",
    location: "beijing",
    currentCompany: "kuaishou",
    title: "recommendation scientist",
    skills: ["recommendation", "ranking", "causal inference", "python"],
    score: 85,
    source: "paper trail",
    lastActivity: "added by eval agent",
    education: "tsinghua, statistics",
    experience: [
      { company: "kuaishou", role: "recommendation scientist", span: "2020-now", note: "creator matching and cold-start ranking" },
      { company: "didiglobal", role: "data scientist", span: "2017-2020", note: "driver supply prediction" }
    ],
    evaluation: "high match for ranking strategy. probe explainability and product communication."
  },
  {
    id: "cand-1712",
    name: "mia andersen",
    location: "copenhagen",
    currentCompany: "pleo",
    title: "head of talent",
    skills: ["talent strategy", "hiring manager enablement", "process design"],
    score: 77,
    source: "operator network",
    lastActivity: "profile refreshed",
    education: "cbs, organizational psychology",
    experience: [
      { company: "pleo", role: "head of talent", span: "2021-now", note: "scaled product and engineering hiring" },
      { company: "spotify", role: "talent partner", span: "2016-2021", note: "partnered with platform org" }
    ],
    evaluation: "excellent domain evaluator. use as advisor or senior hrbp candidate."
  },
  {
    id: "cand-1760",
    name: "noah brown",
    location: "toronto",
    currentCompany: "shopify",
    title: "staff data engineer",
    skills: ["analytics infra", "dbt", "data products", "experimentation"],
    score: 81,
    source: "sourcing agent",
    lastActivity: "opened sequence",
    education: "waterloo, systems design engineering",
    experience: [
      { company: "shopify", role: "staff data engineer", span: "2018-now", note: "merchant data platform and experimentation" },
      { company: "wealthsimple", role: "data engineer", span: "2015-2018", note: "analytics pipelines" }
    ],
    evaluation: "good for diagnosis analytics. needs motivation check for recruiting domain."
  },
  {
    id: "cand-1811",
    name: "fatima al-hassan",
    location: "dubai",
    currentCompany: "careem",
    title: "principal product manager",
    skills: ["marketplace", "ops tooling", "ai agents", "growth"],
    score: 90,
    source: "warm intro",
    lastActivity: "intro accepted",
    education: "aub, computer engineering",
    experience: [
      { company: "careem", role: "principal pm", span: "2020-now", note: "captain marketplace and ops automation" },
      { company: "uber", role: "pm", span: "2017-2020", note: "market health tooling" }
    ],
    evaluation: "very strong agentic ops fit. schedule hm screen."
  },
  {
    id: "cand-1876",
    name: "thomas müller",
    location: "munich",
    currentCompany: "personio",
    title: "senior product manager",
    skills: ["hr tech", "workflows", "permissions", "compliance"],
    score: 86,
    source: "competitor map",
    lastActivity: "profile watched",
    education: "tum, management and technology",
    experience: [
      { company: "personio", role: "senior pm", span: "2021-now", note: "approval workflows and employee records" },
      { company: "n26", role: "pm", span: "2018-2021", note: "kyc workflow tooling" }
    ],
    evaluation: "deep hr systems knowledge. watch for legacy mental model bias."
  },
  {
    id: "cand-1938",
    name: "isabella rossi",
    location: "milan",
    currentCompany: "automattic",
    title: "distributed work lead",
    skills: ["async work", "documentation", "collaboration", "remote ops"],
    score: 76,
    source: "community",
    lastActivity: "notes summarized",
    education: "politecnico di milano, design",
    experience: [
      { company: "automattic", role: "distributed work lead", span: "2019-now", note: "remote operating practices and documentation systems" },
      { company: "buffer", role: "ops manager", span: "2015-2019", note: "async hiring process" }
    ],
    evaluation: "useful for remote hiring systems. weaker for core ai product leadership."
  },
  {
    id: "cand-1995",
    name: "victor hugo",
    location: "sao paulo",
    currentCompany: "nubank",
    title: "principal engineer",
    skills: ["platform", "risk", "clojure", "architecture"],
    score: 84,
    source: "engineering graph",
    lastActivity: "ranked today",
    education: "usp, computer science",
    experience: [
      { company: "nubank", role: "principal engineer", span: "2018-now", note: "risk platform and internal developer tooling" },
      { company: "thoughtworks", role: "tech lead", span: "2013-2018", note: "enterprise systems modernization" }
    ],
    evaluation: "high technical judgment. screen for appetite to build product-facing agent workflows."
  }
];
