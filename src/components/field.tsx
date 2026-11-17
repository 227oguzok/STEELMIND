import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
  className,
}: {
  label: ReactNode;
  htmlFor?: string;
  error?: string;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor} className="label-caps block">
        {label}
      </Label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && (
        <p role="alert" className="text-xs font-medium text-alarm">
          {error}
        </p>
      )}
    </div>
  );
}

/** Shared sizing for text inputs: 16px on iPhone avoids auto-zoom. */
export const inputCls = "h-11 bg-panel text-base md:text-sm";
export const textareaCls = "min-h-24 bg-panel text-base md:text-sm";
