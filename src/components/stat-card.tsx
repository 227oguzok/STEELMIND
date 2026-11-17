import type { LucideIcon } from "lucide-react";
import { DemoBadge } from "./notices";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  unit,
  meta,
  icon: Icon,
  demo,
  tone = "ok",
}: {
  label: string;
  value: string;
  unit: string;
  meta: string;
  icon: LucideIcon;
  demo?: boolean;
  tone?: "ok" | "warn" | "muted";
}) {
  return (
    <div className={cn("panel relative overflow-hidden p-4", demo && "demo-hatch")}>
      <div className="flex items-center justify-between gap-2">
        <span className="label-caps flex items-center gap-1.5">
          <Icon className="size-3.5" />
          {label}
        </span>
        {demo && <DemoBadge label="ДЕМО" />}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span
          className={cn(
            "value-readout text-4xl font-semibold md:text-5xl",
            tone === "ok" && "text-ok",
            tone === "warn" && "text-warn",
            tone === "muted" && "text-muted-foreground",
          )}
        >
          {value}
        </span>
        <span className="font-mono text-sm text-muted-foreground">{unit}</span>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{meta}</p>
      <div className={cn("absolute inset-x-0 bottom-0 h-0.5", tone === "warn" ? "bar-hot" : "bg-ok/50")} />
    </div>
  );
}
