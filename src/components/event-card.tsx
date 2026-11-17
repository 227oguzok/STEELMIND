import { Link } from "@tanstack/react-router";
import { Paperclip, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDelete } from "./confirm-delete";
import { DemoBadge } from "./notices";
import { formatDateTime, formatNumber } from "@/lib/format";
import { store } from "@/lib/store";
import {
  DEFECT_LOCATIONS,
  EVENT_LABEL,
  PARAMS,
  PARAM_KEYS,
  SYMMETRY_OPTIONS,
  type EventRecord,
  type EventType,
  type ParamValues,
} from "@/lib/types";

export const TYPE_VARIANT: Record<EventType, NonNullable<BadgeProps["variant"]>> = {
  transition: "ok",
  press: "outline",
  release: "outline",
  rollchange: "outline",
  fault: "warn",
  defect: "warn",
  note: "muted",
};

function ParamLine({ label, v }: { label: string; v: ParamValues }) {
  const keys = PARAM_KEYS.filter((k) => v[k] !== undefined);
  if (!keys.length) return null;
  return (
    <p className="text-xs text-muted-foreground">
      <span className="label-caps mr-1">{label}</span>
      {keys.map((k) => (
        <span key={k} className="mr-3 font-mono text-foreground">
          {PARAMS[k].label.toLowerCase()} {formatNumber(v[k])} {PARAMS[k].unit}
        </span>
      ))}
    </p>
  );
}

export function EventCard({ e, compact = false }: { e: EventRecord; compact?: boolean }) {
  const t = e.transition;
  const d = e.defect;
  return (
    <article className="panel p-3.5">
      <header className="flex flex-wrap items-center gap-2">
        <Badge variant={TYPE_VARIANT[e.type]}>{EVENT_LABEL[e.type]}</Badge>
        {e.stands.length > 0 && (
          <span className="font-mono text-xs text-foreground">
            {e.stands.length === 1 ? "Клеть" : "Клети"} {e.stands.join(", ")}
          </span>
        )}
        {e.demo && <DemoBadge label="ДЕМО" />}
        <time className="ml-auto font-mono text-xs text-muted-foreground">{formatDateTime(e.datetime)}</time>
      </header>

      <div className="mt-2 space-y-1 text-sm">
        {t && (
          <p>
            <span className="text-muted-foreground">{[t.oldGrade, t.oldSize].filter(Boolean).join(" · ") || "—"}</span>
            <span className="mx-2 text-primary">→</span>
            <span className="font-medium">{[t.newGrade, t.newSize].filter(Boolean).join(" · ") || "—"}</span>
            {t.steel && <span className="ml-2 text-xs text-muted-foreground">марка: {t.steel}</span>}
          </p>
        )}
        {d && (
          <p>
            <span className="font-medium">{d.defectType}</span>
            {d.location && (
              <span className="ml-2 text-muted-foreground">
                {DEFECT_LOCATIONS.find((l) => l.value === d.location)?.label}
              </span>
            )}
            <span className="ml-2 text-muted-foreground">
              · {SYMMETRY_OPTIONS.find((s) => s.value === d.symmetry)?.label}
            </span>
          </p>
        )}
        {e.reason && <p className="text-foreground/90">{e.reason}</p>}
        {!compact && (
          <>
            {d?.description && <p className="text-muted-foreground">{d.description}</p>}
            {t?.setupNote && <p className="text-muted-foreground">{t.setupNote}</p>}
            {e.comment && <p className="text-muted-foreground">{e.comment}</p>}
            {d?.observations && (
              <p className="text-muted-foreground">
                <span className="label-caps mr-1">Наблюдения</span>
                {d.observations}
              </p>
            )}
            <ParamLine label="До" v={e.before} />
            <ParamLine label="После" v={e.after} />
            {e.result && (
              <p className="text-xs">
                <span className="label-caps mr-1">Результат</span>
                {e.result}
              </p>
            )}
          </>
        )}
      </div>

      {!compact && (
        <footer className="mt-3 flex items-center gap-2 border-t border-border pt-2.5">
          {e.attachments.length > 0 && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Paperclip className="size-3.5" /> {e.attachments.length}
            </span>
          )}
          <div className="ml-auto flex gap-1.5">
            <Button asChild size="sm" variant="ghost">
              <Link to="/journal/$id" params={{ id: e.id }}>
                <Pencil /> Изменить
              </Link>
            </Button>
            <ConfirmDelete
              trigger={
                <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-alarm">
                  <Trash2 /> Удалить
                </Button>
              }
              onConfirm={async () => {
                await store.deleteEvent(e.id);
                toast.success("Запись удалена");
              }}
            />
          </div>
        </footer>
      )}
    </article>
  );
}
