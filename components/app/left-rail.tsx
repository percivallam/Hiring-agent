"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { BriefcaseBusiness, ChevronLeft, ChevronRight, Command, Moon, Plus, Settings, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { sessions } from "@/lib/mock/sessions";

type LeftRailProps = {
  collapsed: boolean;
  activeSessionId?: string;
  onToggle: () => void;
  onSettings: () => void;
};

const groups = ["today", "yesterday", "last 7 days"] as const;

export function LeftRail({ collapsed, activeSessionId, onToggle, onSettings }: LeftRailProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme !== "light" : true;

  return (
    <aside
      className={cn(
        "flex h-dvh shrink-0 flex-col border-r bg-surface transition-[width] duration-200 ease-drawer",
        collapsed ? "w-14" : "w-60"
      )}
    >
      <div className="flex h-12 items-center gap-2 px-3">
        <div className="flex size-7 items-center justify-center rounded-md border border-border bg-background">
          <BriefcaseBusiness className="size-4 text-accent" />
        </div>
        {!collapsed && <span className="text-sm font-medium">hireagent</span>}
        <Button className="ml-auto" size="icon" variant="ghost" onClick={onToggle} aria-label="collapse left rail">
          {collapsed ? <ChevronRight /> : <ChevronLeft />}
        </Button>
      </div>

      <div className="px-2">
        <Button asChild variant="outline" className={cn("w-full justify-start", collapsed && "px-0")}>
          <Link href="/">
            <Plus className="size-4" />
            {!collapsed && "new search"}
          </Link>
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden px-2 py-4">
        {!collapsed ? (
          <div className="space-y-5">
            {groups.map((group) => (
              <section key={group}>
                <div className="mb-2 px-2 text-[11px] text-muted-foreground">{group}</div>
                <div className="space-y-1">
                  {sessions
                    .filter((session) => session.group === group)
                    .map((session) => (
                      <Link
                        key={session.id}
                        href={`/c/${session.id}`}
                        className={cn(
                          "block rounded-md px-2 py-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground",
                          activeSessionId === session.id && "bg-muted text-foreground"
                        )}
                      >
                        <div className="truncate">{session.title}</div>
                        <div className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">{session.summary}</div>
                      </Link>
                    ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            {sessions.slice(0, 5).map((session) => (
              <Link
                key={session.id}
                href={`/c/${session.id}`}
                className={cn(
                  "flex size-8 items-center justify-center rounded-md border border-transparent font-mono text-[11px] text-muted-foreground hover:border-border hover:text-foreground",
                  activeSessionId === session.id && "border-border bg-muted text-foreground"
                )}
              >
                {session.title.slice(0, 1)}
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="mt-auto px-2 pb-3">
        <Separator className="mb-2" />
        <div className="space-y-1">
          <Button
            className={cn("w-full justify-start", collapsed && "px-0")}
            variant="ghost"
            onClick={() => setTheme(isDark ? "light" : "dark")}
          >
            {isDark ? <Moon /> : <Sun />}
            {!collapsed && <span>{isDark ? "dark" : "light"}</span>}
          </Button>
          <Button className={cn("w-full justify-start", collapsed && "px-0")} variant="ghost" onClick={onSettings}>
            <Settings />
            {!collapsed && <span>settings</span>}
          </Button>
          <div className={cn("flex items-center gap-2 px-2 py-1 text-[11px] text-muted-foreground", collapsed && "justify-center px-0")}>
            <Command className="size-3.5" />
            {!collapsed && <span>cmd+k launcher</span>}
          </div>
        </div>
      </div>
    </aside>
  );
}
