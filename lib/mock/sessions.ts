export type Session = {
  id: string;
  title: string;
  group: "today" | "yesterday" | "last 7 days";
  summary: string;
};

export const sessions: Session[] = [
  { id: "agentic-pm-search", title: "find senior pm for recruiting os", group: "today", summary: "12 matches, 3 high confidence" },
  { id: "design-engineer-slate", title: "build design engineer slate", group: "today", summary: "portfolio-heavy filter active" },
  { id: "zero-rec-diagnosis", title: "diagnose zero recommendations", group: "yesterday", summary: "channel and jd constraints reviewed" },
  { id: "jd-rewrite-growth", title: "rewrite growth pm jd", group: "yesterday", summary: "bias and scope diff ready" },
  { id: "offer-approval", title: "approve staff engineer offer", group: "last 7 days", summary: "comp band variance flagged" },
  { id: "interview-rubric", title: "prepare interview rubric", group: "last 7 days", summary: "scorecard generated" }
];
