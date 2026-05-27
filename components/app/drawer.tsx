"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BarChart, Check, Columns3, ExternalLink, FileText, GripVertical, Pin, PinOff, Split, X } from "lucide-react";
import { Bar, BarChart as RBarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Candidate, candidates } from "@/lib/mock/candidates";
import { attributionData, channelData, funnelData } from "@/lib/mock/diagnosis";
import { cn } from "@/lib/utils";

export type DrawerView = "candidate" | "pipeline" | "jd" | "diagnosis";
export type DrawerMode = "closed" | "peek" | "pinned" | "popout";

type DrawerProps = {
  mode: DrawerMode;
  view: DrawerView;
  candidate?: Candidate;
  onModeChange: (mode: DrawerMode) => void;
  onClose: () => void;
};

export function RightDrawer({ mode, view, candidate, onModeChange, onClose }: DrawerProps) {
  const [width, setWidth] = useState(560);
  const visible = mode !== "closed";
  const activeCandidate = candidate ?? candidates[0];

  return (
    <AnimatePresence>
      {visible && (
        <motion.aside
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
          className={cn(
            "fixed inset-y-0 right-0 z-30 flex border-l bg-background shadow-drawer",
            mode === "popout" && "inset-y-6 right-6 rounded-lg border"
          )}
          style={{ width: mode === "popout" ? Math.min(width + 120, 720) : width }}
        >
          <ResizeHandle onResize={setWidth} />
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex h-12 items-center gap-2 border-b px-3">
              {view === "candidate" && <FileText className="size-4 text-accent" />}
              {view === "pipeline" && <Columns3 className="size-4 text-accent" />}
              {view === "jd" && <Split className="size-4 text-accent" />}
              {view === "diagnosis" && <BarChart className="size-4 text-accent" />}
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{drawerTitle(view, activeCandidate)}</div>
                <div className="font-mono text-[11px] text-muted-foreground">{mode}</div>
              </div>
              <Button size="icon" variant="ghost" onClick={() => onModeChange(mode === "pinned" ? "peek" : "pinned")} aria-label="pin drawer">
                {mode === "pinned" ? <PinOff /> : <Pin />}
              </Button>
              <Button size="icon" variant="ghost" onClick={() => onModeChange(mode === "popout" ? "peek" : "popout")} aria-label="pop out drawer">
                <ExternalLink />
              </Button>
              <Button size="icon" variant="ghost" onClick={onClose} aria-label="close drawer">
                <X />
              </Button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {view === "candidate" && <CandidateDetail candidate={activeCandidate} />}
              {view === "pipeline" && <PipelineKanban />}
              {view === "jd" && <JdEditor />}
              {view === "diagnosis" && <DiagnosisCharts />}
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function drawerTitle(view: DrawerView, candidate: Candidate) {
  if (view === "candidate") return candidate.name;
  if (view === "pipeline") return "pipeline kanban";
  if (view === "jd") return "jd editor";
  return "diagnosis";
}

function ResizeHandle({ onResize }: { onResize: (width: number) => void }) {
  return (
    <div
      className="flex w-2 cursor-col-resize items-center justify-center border-r bg-surface"
      onMouseDown={(event) => {
        const startX = event.clientX;
        const startWidth = event.currentTarget.parentElement?.getBoundingClientRect().width ?? 560;
        const move = (moveEvent: MouseEvent) => {
          onResize(Math.max(480, Math.min(720, startWidth + startX - moveEvent.clientX)));
        };
        const up = () => {
          window.removeEventListener("mousemove", move);
          window.removeEventListener("mouseup", up);
        };
        window.addEventListener("mousemove", move);
        window.addEventListener("mouseup", up);
      }}
    >
      <GripVertical className="size-3 text-muted-foreground" />
    </div>
  );
}

function CandidateDetail({ candidate }: { candidate: Candidate }) {
  return (
    <div className="space-y-5">
      <div>
        <div className="font-mono text-[11px] text-muted-foreground">{candidate.id}</div>
        <h2 className="mt-1 text-xl font-medium">{candidate.name}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {candidate.title} · {candidate.currentCompany}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[
          ["score", candidate.score.toFixed(0)],
          ["location", candidate.location],
          ["source", candidate.source],
          ["activity", candidate.lastActivity]
        ].map(([label, value]) => (
          <div key={label} className="rounded-md border bg-surface p-3">
            <div className="text-[11px] text-muted-foreground">{label}</div>
            <div className="mt-1 font-mono text-xs">{value}</div>
          </div>
        ))}
      </div>
      <Section title="ai evaluation">
        <p className="text-sm text-muted-foreground">{candidate.evaluation}</p>
      </Section>
      <Section title="experience">
        <div className="space-y-3">
          {candidate.experience.map((item) => (
            <div key={`${item.company}-${item.span}`} className="border-l border-border pl-3">
              <div className="text-sm">{item.role}</div>
              <div className="font-mono text-[11px] text-muted-foreground">
                {item.company} · {item.span}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{item.note}</p>
            </div>
          ))}
        </div>
      </Section>
      <Section title="skills graph">
        <div className="space-y-2">
          {candidate.skills.map((skill, index) => (
            <div key={skill}>
              <div className="mb-1 flex justify-between font-mono text-[11px] text-muted-foreground">
                <span>{skill}</span>
                <span>{88 - index * 7}</span>
              </div>
              <div className="h-1.5 rounded-sm bg-muted">
                <div className="h-full rounded-sm bg-accent" style={{ width: `${88 - index * 7}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Section>
      <div className="sticky bottom-0 -mx-4 border-t bg-background p-4">
        <div className="flex gap-2">
          <Button variant="outline">shortlist</Button>
          <Button variant="outline">outreach</Button>
          <Button variant="outline">schedule</Button>
        </div>
      </div>
    </div>
  );
}

function PipelineKanban() {
  const [stages, setStages] = useState({
    sourced: candidates.slice(0, 5),
    screened: candidates.slice(5, 9),
    interview: candidates.slice(9, 13),
    offer: candidates.slice(13, 16),
    hired: candidates.slice(16, 18)
  });
  const [dragged, setDragged] = useState<{ stage: keyof typeof stages; id: string } | null>(null);

  return (
    <div className="grid min-w-[900px] grid-cols-5 gap-3">
      {(Object.entries(stages) as Array<[keyof typeof stages, Candidate[]]>).map(([stage, items]) => (
        <div
          key={stage}
          className="rounded-lg border bg-surface"
          onDragOver={(event) => event.preventDefault()}
          onDrop={() => {
            if (!dragged) return;
            setStages((current) => {
              const moving = current[dragged.stage].find((candidate) => candidate.id === dragged.id);
              if (!moving || dragged.stage === stage) return current;
              return {
                ...current,
                [dragged.stage]: current[dragged.stage].filter((candidate) => candidate.id !== dragged.id),
                [stage]: [moving, ...current[stage]]
              };
            });
            setDragged(null);
          }}
        >
          <div className="flex items-center justify-between border-b px-3 py-2">
            <span className="text-xs font-medium">{stage}</span>
            <span className="font-mono text-[11px] text-muted-foreground">{items.length}</span>
          </div>
          <div className="space-y-2 p-2">
            {items.map((candidate) => (
              <div
                key={candidate.id}
                draggable
                onDragStart={() => setDragged({ stage, id: candidate.id })}
                className="cursor-grab rounded-md border bg-background p-2 active:cursor-grabbing"
              >
                <div className="truncate text-xs font-medium">{candidate.name}</div>
                <div className="mt-1 truncate font-mono text-[11px] text-muted-foreground">{candidate.score} · {candidate.source}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function JdEditor() {
  const chunks = [
    ["scope", "own ai-native recruiting workflows across search, eval, outreach, and offer approval.", "own command-first recruiting workflows where agents complete sourcing, evaluation, outreach, and offer approval."],
    ["requirements", "7+ years product experience, hr tech preferred, strong stakeholder management.", "shipped ai or developer-facing workflows, can reason from recruiter behavior to system design, hr tech optional."],
    ["success", "improve hiring funnel conversion and hiring manager satisfaction.", "reduce time-to-slate, raise qualified reply rate, and make every recommendation explainable."]
  ];

  return (
    <div className="space-y-4">
      <Tabs defaultValue="diff">
        <TabsList>
          <TabsTrigger value="diff">diff</TabsTrigger>
          <TabsTrigger value="current">current</TabsTrigger>
          <TabsTrigger value="suggested">suggested</TabsTrigger>
        </TabsList>
        <TabsContent value="diff" className="space-y-3">
          {chunks.map(([label, current, suggested]) => (
            <div key={label} className="rounded-lg border bg-surface">
              <div className="flex items-center justify-between border-b px-3 py-2">
                <span className="font-mono text-[11px] text-muted-foreground">{label}</span>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost"><X className="size-3.5" /> reject</Button>
                  <Button size="sm" variant="outline"><Check className="size-3.5" /> accept</Button>
                </div>
              </div>
              <div className="grid gap-0 md:grid-cols-2">
                <p className="border-b p-3 text-sm text-muted-foreground md:border-b-0 md:border-r">{current}</p>
                <p className="p-3 text-sm">{suggested}</p>
              </div>
            </div>
          ))}
        </TabsContent>
        <TabsContent value="current">
          <TextPanel text="we need a senior pm to own recruiting product workflows, partner with hrbp and engineering, and improve candidate pipeline quality." />
        </TabsContent>
        <TabsContent value="suggested">
          <TextPanel text="build command-first recruiting workflows where agents search, evaluate, explain, and coordinate hiring decisions with measurable funnel gains." />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TextPanel({ text }: { text: string }) {
  return <div className="rounded-lg border bg-surface p-4 text-sm text-muted-foreground">{text}</div>;
}

function DiagnosisCharts() {
  return (
    <div className="space-y-4">
      <ChartCard title="funnel conversion">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={funnelData}>
            <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="stage" stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))" }} />
            <Line type="monotone" dataKey="conversion" stroke="#00D9A3" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="zero-recommendation attribution">
        <ResponsiveContainer width="100%" height={220}>
          <RBarChart data={attributionData}>
            <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="reason" stroke="hsl(var(--muted-foreground))" fontSize={11} interval={0} angle={-15} textAnchor="end" height={58} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))" }} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {attributionData.map((item) => <Cell key={item.reason} fill="#00D9A3" />)}
            </Bar>
          </RBarChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="channel comparison">
        <div className="space-y-2">
          {channelData.map((row) => (
            <div key={row.channel} className="rounded-md border bg-background p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs">{row.channel}</span>
                <span className="font-mono text-[11px] text-muted-foreground">offer {row.offer}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 font-mono text-[11px] text-muted-foreground">
                <span>reply {row.reply}%</span>
                <span>screen {row.screen}%</span>
                <span>offer {row.offer}%</span>
              </div>
            </div>
          ))}
        </div>
      </ChartCard>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-surface p-3">
      <div className="mb-3 text-sm font-medium">{title}</div>
      {children}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-xs font-medium text-muted-foreground">{title}</h3>
      {children}
    </section>
  );
}
