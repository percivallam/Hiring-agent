"use client";

import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUp, CornerDownLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const commands = ["/find", "/jd", "/pipeline", "/offer", "/diagnose", "/interview", "/settings"];

type CliInputProps = {
  onSubmit: (value: string) => void;
  onCommand: (command: string) => void;
};

export function CliInput({ onSubmit, onCommand }: CliInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  const [historyIndex, setHistoryIndex] = useState(-1);
  const history = useMemo(() => ["find senior pm for recruiting os", "run diagnosis for req-2201", "draft jd for design engineer"], []);
  const showSlash = value.startsWith("/");

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    const next = value.trim();
    if (!next) return;
    if (commands.includes(next)) {
      onCommand(next);
    } else {
      onSubmit(next);
    }
    setValue("");
    setHistoryIndex(-1);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowUp") {
      event.preventDefault();
      const nextIndex = Math.min(historyIndex + 1, history.length - 1);
      setHistoryIndex(nextIndex);
      setValue(history[nextIndex]);
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      const nextIndex = Math.max(historyIndex - 1, -1);
      setHistoryIndex(nextIndex);
      setValue(nextIndex === -1 ? "" : history[nextIndex]);
    }
  };

  return (
    <div className="border-t bg-background/95 px-4 py-3">
      <form onSubmit={submit} className="relative mx-auto max-w-3xl">
        {showSlash && (
          <div className="absolute bottom-[calc(100%+8px)] left-0 z-20 w-72 rounded-md border bg-popover p-1 shadow-overlay">
            {commands
              .filter((command) => command.startsWith(value))
              .map((command) => (
                <button
                  key={command}
                  type="button"
                  className="flex w-full items-center justify-between rounded-sm px-2 py-2 text-left text-xs hover:bg-muted"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    setValue(command);
                    onCommand(command);
                    setValue("");
                  }}
                >
                  <span className="font-mono text-accent">{command}</span>
                  <span className="text-muted-foreground">run</span>
                </button>
              ))}
          </div>
        )}
        <div className="flex min-h-12 items-center gap-2 rounded-lg border bg-surface px-3 focus-within:ring-1 focus-within:ring-ring">
          <Search className="size-4 text-muted-foreground" />
          <span className="font-mono text-accent">▍</span>
          <input
            ref={inputRef}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="find candidates, draft jd, run diagnosis"
            className="h-11 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            aria-label="global command input"
          />
          <Button type="submit" variant="outline" size="sm" className={cn(!value.trim() && "opacity-60")}>
            <CornerDownLeft className="size-3.5" />
            run
          </Button>
        </div>
        <div className="mt-2 flex items-center gap-3 px-1 text-[11px] text-muted-foreground">
          <span>type / for commands</span>
          <span className="flex items-center gap-1"><ArrowUp className="size-3" /> browse history</span>
        </div>
      </form>
    </div>
  );
}
