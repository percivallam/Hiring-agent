"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Braces,
  Boxes,
  FileJson,
  GitPullRequestArrow,
  Plug,
  Shield,
  Users,
  Workflow
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { jobs } from "@/lib/mock/jobs";

const categories = [
  { id: "requisitions", label: "requisitions", icon: GitPullRequestArrow },
  { id: "job templates", label: "job templates", icon: FileJson },
  { id: "approval flows", label: "approval flows", icon: Workflow },
  { id: "recommendation strategy", label: "recommendation strategy", icon: Braces },
  { id: "field mapping", label: "field mapping", icon: Boxes },
  { id: "integrations", label: "integrations", icon: Plug },
  { id: "permissions", label: "permissions", icon: Shield },
  { id: "members", label: "members", icon: Users }
];

type SettingsOverlayProps = {
  open: boolean;
  onClose: () => void;
};

export function SettingsOverlay({ open, onClose }: SettingsOverlayProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
      className="absolute inset-0 z-20 flex bg-background shadow-overlay"
    >
      <div className="flex w-64 shrink-0 flex-col border-r bg-surface p-3">
        <Button variant="ghost" className="mb-3 justify-start" onClick={onClose}>
          <ArrowLeft className="size-4" />
          back to cli
        </Button>
        <div className="mb-2 px-2 text-[11px] text-muted-foreground">settings</div>
        <div className="space-y-1">
          {categories.map((category, index) => {
            const Icon = category.icon;
            return (
              <a
                key={category.id}
                href={`#${category.id}`}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2 py-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground",
                  index === 0 && "bg-muted text-foreground"
                )}
              >
                <Icon className="size-4" />
                {category.label}
              </a>
            );
          })}
        </div>
      </div>
      <div className="min-w-0 flex-1 overflow-y-auto p-6">
        <div className="mb-6">
          <div className="font-mono text-[11px] text-accent">settings</div>
          <h1 className="mt-1 text-xl font-medium">configure low-frequency systems</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            keep admin work out of the recruiting command loop. edit only when policy, source systems, or approval logic changes.
          </p>
          <div className="mt-4 flex max-w-xl items-center gap-2 rounded-lg border bg-background px-3">
            <span className="font-mono text-accent">▍</span>
            <input
              ref={inputRef}
              className="h-10 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              placeholder="search settings or type a command"
              aria-label="settings command input"
            />
          </div>
        </div>
        <div className="space-y-6">
          <SettingsSection id="requisitions" title="requisitions">
            <div className="grid gap-2">
              {jobs.map((job) => (
                <div key={job.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-md border bg-background p-3">
                  <div>
                    <div className="text-sm">{job.title}</div>
                    <div className="font-mono text-[11px] text-muted-foreground">{job.id} · {job.team} · {job.location}</div>
                  </div>
                  <span className="font-mono text-[11px] text-muted-foreground">{job.pipeline}</span>
                  <span className="rounded-sm border px-1.5 py-0.5 font-mono text-[11px] text-accent">{job.priority}</span>
                </div>
              ))}
            </div>
          </SettingsSection>
          <SettingsSection id="job templates" title="job templates">
            <Placeholder rows={["agentic product leader", "design engineer", "ml ranking scientist", "people systems operator"]} />
          </SettingsSection>
          <SettingsSection id="approval flows" title="approval flows">
            <Placeholder rows={["offer exception: hm -> finance -> people partner", "new req: business lead -> hrbp", "agency spend: talent lead -> procurement"]} />
          </SettingsSection>
          <SettingsSection id="recommendation strategy" title="recommendation strategy">
            <Placeholder rows={["weight domain evidence at 0.34", "weight agentic product judgment at 0.29", "penalize stale activity after 21d", "require explainability for every top-3 slate"]} mono />
          </SettingsSection>
          <SettingsSection id="field mapping" title="field mapping">
            <Placeholder rows={["greenhouse.candidate_id -> profile.external_id", "ashby.stage -> pipeline.stage", "lark.owner_open_id -> req.owner"]} mono />
          </SettingsSection>
          <SettingsSection id="integrations" title="integrations">
            <Placeholder rows={["greenhouse connected", "lark docs connected", "gmail read-only", "linkedin pending manual export"]} />
          </SettingsSection>
          <SettingsSection id="permissions" title="permissions">
            <Placeholder rows={["recruiter: search, outreach, schedule", "hiring manager: review, score, approve", "interviewer: rubric, feedback", "business lead: offer approval"]} />
          </SettingsSection>
          <SettingsSection id="members" title="members">
            <Placeholder rows={["lin · spec owner", "mara · recruiter", "aaron · hiring manager", "olivia · people partner"]} />
          </SettingsSection>
        </div>
      </div>
    </motion.div>
  );
}

function SettingsSection({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-6 rounded-lg border bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium">{title}</h2>
        <Button variant="outline" size="sm">edit</Button>
      </div>
      <Separator className="mb-3" />
      {children}
    </section>
  );
}

function Placeholder({ rows, mono = false }: { rows: string[]; mono?: boolean }) {
  return (
    <div className="grid gap-2">
      {rows.map((row) => (
        <div key={row} className={cn("rounded-md border bg-background p-3 text-xs text-muted-foreground", mono && "font-mono")}>
          {row}
        </div>
      ))}
    </div>
  );
}
