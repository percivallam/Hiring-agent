"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { CliInput } from "@/components/app/cli-input";
import { CommandLauncher } from "@/components/app/command-launcher";
import { ChatStream, EmptyState } from "@/components/app/chat-stream";
import { DrawerMode, DrawerView, RightDrawer } from "@/components/app/drawer";
import { LeftRail } from "@/components/app/left-rail";
import { SettingsOverlay } from "@/components/app/settings-overlay";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Candidate, candidates } from "@/lib/mock/candidates";

type AppShellProps = {
  sessionId?: string;
  initialDrawer?: "pipeline" | "jd" | "diagnosis";
  settingsOpen?: boolean;
};

const streamMessage =
  "12 matches found. top 3 are strong enough for hiring manager review. location filter was expanded to asia remote because exact singapore-only removed 5 high-signal profiles.";

export function AppShell({ sessionId, initialDrawer, settingsOpen = false }: AppShellProps) {
  const router = useRouter();
  const [railCollapsed, setRailCollapsed] = useState(false);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>(initialDrawer ? "peek" : "closed");
  const [drawerView, setDrawerView] = useState<DrawerView>(initialDrawer ?? "candidate");
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | undefined>();
  const [commandOpen, setCommandOpen] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(settingsOpen);
  const [streamedText, setStreamedText] = useState(sessionId ? "" : streamMessage);

  useEffect(() => {
    setSettingsVisible(settingsOpen);
  }, [settingsOpen]);

  useEffect(() => {
    if (!sessionId) return;
    setStreamedText("");
    let i = 0;
    const timer = window.setInterval(() => {
      i += 3;
      setStreamedText(streamMessage.slice(0, i));
      if (i >= streamMessage.length) window.clearInterval(timer);
    }, 22);
    return () => window.clearInterval(timer);
  }, [sessionId]);

  useEffect(() => {
    if (!initialDrawer) return;
    setDrawerView(initialDrawer);
    setDrawerMode("peek");
  }, [initialDrawer]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const mod = event.metaKey || event.ctrlKey;
      if (mod && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen(true);
      }
      if (mod && event.key === "\\") {
        event.preventDefault();
        setDrawerMode((current) => (current === "closed" ? "peek" : "closed"));
      }
      if (mod && event.key === ",") {
        event.preventDefault();
        openSettings();
      }
      if (mod && event.key.toLowerCase() === "b") {
        event.preventDefault();
        setRailCollapsed((current) => !current);
      }
      if (event.key === "Escape") {
        setCommandOpen(false);
        if (settingsVisible) closeSettings();
        else setDrawerMode("closed");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  useEffect(() => {
    try {
      const current = sessionId ?? "new";
      window.localStorage.setItem("hireagent-current-session", current);
      if (!window.localStorage.getItem(`hireagent-msgs-${current}`)) {
        window.localStorage.setItem(`hireagent-msgs-${current}`, JSON.stringify([]));
      }
    } catch {
      // persistence failure must not block the prototype.
    }
  }, [sessionId]);

  const closeSettings = useCallback(() => {
    setSettingsVisible(false);
    if (window.location.pathname === "/settings") router.push(sessionId ? `/c/${sessionId}` : "/");
  }, [router, sessionId]);

  const openSettings = useCallback(() => {
    setSettingsVisible(true);
    if (window.location.pathname !== "/settings") router.push("/settings");
  }, [router]);

  const openDrawer = useCallback((view: "pipeline" | "jd" | "diagnosis") => {
    setDrawerView(view);
    setDrawerMode("peek");
  }, []);

  const openCandidate = useCallback((candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setDrawerView("candidate");
    setDrawerMode("peek");
  }, []);

  const runCommand = useCallback((command: string) => {
    if (command === "/pipeline") openDrawer("pipeline");
    else if (command === "/jd") openDrawer("jd");
    else if (command === "/diagnose") openDrawer("diagnosis");
    else if (command === "/settings") openSettings();
    else if (command === "/find") router.push("/c/agentic-pm-search");
    else if (command === "/interview") openCandidate(candidates[0]);
    else if (command === "/offer") openDrawer("pipeline");
  }, [openCandidate, openDrawer, openSettings, router]);

  const handleSubmit = useCallback((value: string) => {
    const lower = value.toLowerCase();
    if (!sessionId) router.push("/c/agentic-pm-search");
    if (lower.includes("diagnos")) openDrawer("diagnosis");
    if (lower.includes("jd")) openDrawer("jd");
    if (lower.includes("pipeline")) openDrawer("pipeline");
  }, [openDrawer, router, sessionId]);

  const drawerCandidate = selectedCandidate ?? candidates[0];
  const active = useMemo(() => Boolean(sessionId), [sessionId]);

  return (
    <div className="flex h-dvh overflow-hidden bg-background text-foreground">
      <LeftRail
        collapsed={railCollapsed}
        activeSessionId={sessionId}
        onToggle={() => setRailCollapsed((current) => !current)}
        onSettings={openSettings}
      />
      <main className="relative flex min-w-[560px] flex-1 flex-col">
        <div className="flex h-12 items-center justify-between border-b px-4">
          <div>
            <div className="text-sm font-medium">{active ? "conversation" : "new search"}</div>
            <div className="font-mono text-[11px] text-muted-foreground">{sessionId ?? "empty"}</div>
          </div>
          <div className="hidden items-center gap-2 font-mono text-[11px] text-muted-foreground md:flex">
            <span>cmd+k</span>
            <span>cmd+\</span>
            <span>cmd+,</span>
          </div>
        </div>
        <ScrollArea className="min-h-0 flex-1">
          {active ? (
            <ChatStream
              candidates={candidates}
              onOpenCandidate={openCandidate}
              onOpenDrawer={openDrawer}
              streamedText={streamedText}
            />
          ) : (
            <EmptyState />
          )}
        </ScrollArea>
        <CliInput onSubmit={handleSubmit} onCommand={runCommand} />
        <AnimatePresence>
          <SettingsOverlay open={settingsVisible} onClose={closeSettings} />
        </AnimatePresence>
      </main>
      <RightDrawer
        mode={drawerMode}
        view={drawerView}
        candidate={drawerCandidate}
        onModeChange={setDrawerMode}
        onClose={() => setDrawerMode("closed")}
      />
      <CommandLauncher open={commandOpen} onOpenChange={setCommandOpen} onCommand={runCommand} />
    </div>
  );
}
