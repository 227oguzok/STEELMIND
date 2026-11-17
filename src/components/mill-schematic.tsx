import { Link } from "@tanstack/react-router";
import { STANDS } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Neutral line schematic — not a real mill layout. */
export function MillSchematic({ marked }: { marked: Set<number> }) {
  return (
    <div>
      <div className="-mx-1 overflow-x-auto pb-2">
        <div className="relative flex min-w-max items-center gap-1.5 px-1 py-4">
          <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bar-hot opacity-70" />
          <div className="relative z-10 mr-1 rounded-sm border border-border bg-background px-1.5 py-1 font-mono text-[10px] text-muted-foreground">
            ВХОД
          </div>
          {STANDS.map((s) => {
            const on = marked.has(s);
            return (
              <Link
                key={s}
                to="/analysis"
                search={{ stand: s }}
                aria-label={`Клеть ${s}${on ? ", есть события за 24 ч" : ""}`}
                className={cn(
                  "relative z-10 flex h-16 w-9 flex-col items-center justify-between rounded-sm border bg-panel-raised py-1 transition-colors",
                  on ? "border-primary glow-primary" : "border-steel hover:border-ok",
                )}
              >
                <span className="h-1.5 w-5 rounded-full bg-steel" />
                <span className={cn("font-mono text-xs tabular-nums", on ? "text-primary" : "text-foreground")}>
                  {s}
                </span>
                <span className="h-1.5 w-5 rounded-full bg-steel" />
                {on && <span className="absolute -right-1 -top-1 size-2.5 rounded-full bg-primary animate-status" />}
              </Link>
            );
          })}
          <div className="relative z-10 ml-1 rounded-sm border border-border bg-background px-1.5 py-1 font-mono text-[10px] text-muted-foreground">
            ВЫХОД
          </div>
        </div>
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="italic">Схематично, конфигурация уточняется</span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-primary" /> есть записи в журнале за 24 ч
        </span>
        <span>Нажмите на клеть, чтобы открыть её показания</span>
      </div>
    </div>
  );
}
