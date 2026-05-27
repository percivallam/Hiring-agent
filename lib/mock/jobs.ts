export type Job = {
  id: string;
  title: string;
  team: string;
  location: string;
  priority: "p0" | "p1" | "p2";
  stage: string;
  owner: string;
  pipeline: number;
};

export const jobs: Job[] = [
  { id: "req-2201", title: "agentic product designer", team: "ai platform", location: "shanghai / remote", priority: "p0", stage: "sourcing", owner: "lin", pipeline: 43 },
  { id: "req-2208", title: "senior product manager, recruiting os", team: "hireagent", location: "singapore", priority: "p0", stage: "hm screen", owner: "mara", pipeline: 28 },
  { id: "req-2214", title: "staff frontend engineer, command surface", team: "experience", location: "beijing", priority: "p1", stage: "onsite", owner: "aaron", pipeline: 21 },
  { id: "req-2220", title: "ml ranking scientist", team: "recommendation", location: "shanghai", priority: "p1", stage: "sourcing", owner: "chen", pipeline: 37 },
  { id: "req-2226", title: "people systems architect", team: "people tech", location: "london", priority: "p2", stage: "offer", owner: "olivia", pipeline: 9 },
  { id: "req-2233", title: "design engineer, ai canvas", team: "design systems", location: "tokyo / remote", priority: "p0", stage: "screen", owner: "yuki", pipeline: 31 },
  { id: "req-2242", title: "principal backend engineer, workflow runtime", team: "infra", location: "toronto", priority: "p1", stage: "interview", owner: "noah", pipeline: 18 },
  { id: "req-2249", title: "recruiting ops lead", team: "gtm people", location: "new york", priority: "p2", stage: "approval", owner: "priya", pipeline: 14 }
];
