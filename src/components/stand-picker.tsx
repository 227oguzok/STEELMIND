import { STANDS } from "@/lib/types";
import { cn } from "@/lib/utils";

export function StandPicker({
  value,
  onChange,
  multiple = true,
}: {
  value: number[];
  onChange: (v: number[]) => void;
  multiple?: boolean | undefined;
}) {
  const toggle = (s: number) => {
    if (!multiple) return onChange(value.includes(s) ? [] : [s]);
    onChange(value.includes(s) ? value.filter((x) => x !== s) : [...value, s].sort((a, b) => a - b));
  };
  return (
    <div className="grid grid-cols-8 gap-1.5" role="group" aria-label="Номера клетей">
      {STANDS.map((s) => {
        const on = value.includes(s);
        return (
          <button
            key={s}
            type="button"
            aria-pressed={on}
            onClick={() => toggle(s)}
            className={cn(
              "h-10 rounded-md border font-mono text-sm tabular-nums transition-colors",
              on
                ? "border-primary bg-primary text-primary-foreground glow-primary"
                : "border-border bg-panel text-muted-foreground hover:border-primary/50 hover:text-foreground",
            )}
          >
            {s}
          </button>
        );
      })}
    </div>
  );
}
