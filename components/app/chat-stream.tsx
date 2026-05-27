"use client";

import { ChevronDown, GitBranch, Mail, Search, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Candidate } from "@/lib/mock/candidates";
import { cn } from "@/lib/utils";

type ChatStreamProps = {
  candidates: Candidate[];
  onOpenCandidate: (candidate: Candidate) => void;
  onOpenDrawer: (view: "pipeline" | "jd" | "diagnosis") => void;
  streamedText: string;
};

export function EmptyState() {
  return (
    <div className="flex h-full items-center justify-center px-6">
      <div className="w-full max-w-xl rounded-lg border bg-surface p-6">
        <div className="mb-3 font-mono text-accent">▍</div>
        <h1 className="text-base font-medium">type / for commands, or just ask.</h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          find candidates, draft jd, run diagnosis, schedule interview, approve offers.
        </p>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {["/find senior pm", "/diagnose req-2201", "/jd rewrite", "/pipeline ai platform"].map((item) => (
            <div key={item} className="rounded-md border bg-background px-3 py-2 font-mono text-xs text-muted-foreground">
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ChatStream({ candidates, onOpenCandidate, onOpenDrawer, streamedText }: ChatStreamProps) {
  const top = candidates.slice(0, 3);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6">
      <div className="mb-5">
        <div className="mb-2 text-[11px] uppercase tracking-normal text-muted-foreground">user</div>
        <div className="rounded-lg border bg-surface p-3 font-mono text-sm">/find senior pm for recruiting os, asia preferred</div>
      </div>

      <ThinkingTrace />

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        className="space-y-4"
      >
        <div>
          <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-normal text-muted-foreground">
            <Sparkles className="size-3.5 text-accent" />
            agent
          </div>
          <div className="rounded-lg border bg-surface p-4">
            <p className="min-h-[60px] whitespace-pre-wrap text-sm text-foreground">{streamedText}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => onOpenDrawer("pipeline")}>
                view pipeline
              </Button>
              <Button variant="outline" size="sm" onClick={() => onOpenDrawer("jd")}>
                edit jd
              </Button>
              <Button variant="outline" size="sm" onClick={() => onOpenDrawer("diagnosis")}>
                run diagnosis
              </Button>
            </div>
          </div>
        </div>

        <HandoffMarkers />

        <div className="grid gap-2">
          {top.map((candidate, index) => (
            <button
              key={candidate.id}
              onClick={() => onOpenCandidate(candidate)}
              className="group rounded-lg border bg-background p-3 text-left transition-colors hover:bg-muted"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{candidate.name}</span>
                    <span className="rounded-sm border px-1.5 py-0.5 font-mono text-[11px] text-accent">
                      {candidate.score.toFixed(0)}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {candidate.title} · {candidate.currentCompany} · {candidate.location}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {candidate.skills.slice(0, 4).map((skill) => (
                      <span key={skill} className="rounded-sm border px-1.5 py-0.5 text-[11px] text-muted-foreground">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                <span className="font-mono text-[11px] text-muted-foreground group-hover:text-foreground">open</span>
              </div>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function ThinkingTrace() {
  return (
    <details className="mb-4 rounded-lg border bg-surface p-3" open>
      <summary className="flex cursor-pointer list-none items-center justify-between text-xs text-muted-foreground">
        <span className="font-mono">agent thinking</span>
        <ChevronDown className="size-4" />
      </summary>
      <div className="mt-3 space-y-1 font-mono text-[11px] leading-5 text-muted-foreground">
        <div>parse intent: senior pm, recruiting os, asia preferred</div>
        <div>call search_candidates with location expansion: singapore, shanghai, hong kong, remote asia</div>
        <div>rerank: domain fit × agentic product judgment × closing risk</div>
      </div>
    </details>
  );
}

function HandoffMarkers() {
  const steps = [
    { icon: Search, label: "sourcing agent", note: "found 12 profiles" },
    { icon: GitBranch, label: "eval agent", note: "ranked 3 high confidence" },
    { icon: Mail, label: "outreach agent", note: "draft ready" }
  ];

  return (
    <div className="rounded-lg border bg-surface p-3">
      <div className="grid gap-2 sm:grid-cols-3">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <div key={step.label} className={cn("flex items-center gap-2", index > 0 && "sm:border-l sm:pl-3")}>
              <div className="flex size-7 items-center justify-center rounded-md border bg-background">
                <Icon className="size-3.5 text-accent" />
              </div>
              <div>
                <div className="text-xs">{step.label}</div>
                <div className="font-mono text-[11px] text-muted-foreground">{step.note}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
