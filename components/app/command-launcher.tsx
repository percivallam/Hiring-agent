"use client";

import { BarChart3, BriefcaseBusiness, Columns3, FileText, Search, Settings, UserRoundCheck } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator
} from "@/components/ui/command";

type CommandLauncherProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCommand: (command: string) => void;
};

const items = [
  { command: "/find", label: "find candidates", icon: Search },
  { command: "/jd", label: "draft jd", icon: FileText },
  { command: "/pipeline", label: "open pipeline", icon: Columns3 },
  { command: "/offer", label: "review offer", icon: BriefcaseBusiness },
  { command: "/diagnose", label: "run diagnosis", icon: BarChart3 },
  { command: "/interview", label: "prepare interview", icon: UserRoundCheck },
  { command: "/settings", label: "open settings", icon: Settings }
];

export function CommandLauncher({ open, onOpenChange, onCommand }: CommandLauncherProps) {
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="run command" />
      <CommandList>
        <CommandEmpty>no command found</CommandEmpty>
        <CommandGroup heading="commands">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <CommandItem
                key={item.command}
                value={`${item.command} ${item.label}`}
                onSelect={() => {
                  onCommand(item.command);
                  onOpenChange(false);
                }}
              >
                <Icon className="size-4 text-muted-foreground" />
                <span>{item.label}</span>
                <span className="ml-auto font-mono text-[11px] text-muted-foreground">{item.command}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="shortcuts">
          <CommandItem value="toggle drawer">
            <span className="font-mono text-[11px] text-muted-foreground">cmd+\</span>
            <span>toggle drawer</span>
          </CommandItem>
          <CommandItem value="collapse rail">
            <span className="font-mono text-[11px] text-muted-foreground">cmd+b</span>
            <span>collapse rail</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
