import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader, EmptyState } from "@/components/page";
import { StorageNotice } from "@/components/notices";
import { EventCard } from "@/components/event-card";
import { inputCls } from "@/components/field";
import { sortByDateDesc, useAppData } from "@/lib/store";
import { matchesSearch } from "@/lib/filters";
import { EVENT_TYPES, type EventType } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/journal/")({
  head: () => ({
    meta: [
      { title: "Архив событий — STEELMIND" },
      { name: "description", content: "Журнал смены: переходы, прижатия, отжимания, перевалки, неисправности, дефекты и примечания." },
      { property: "og:title", content: "Архив событий — STEELMIND" },
      { property: "og:description", content: "Журнал событий смены с локальным хранением и вложениями." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Journal,
});

function Journal() {
  const data = useAppData();
  const [type, setType] = useState<EventType | "all">("all");
  const [q, setQ] = useState("");

  const list = useMemo(
    () => sortByDateDesc(data.events).filter((e) => (type === "all" || e.type === type) && matchesSearch(e, q)),
    [data.events, type, q],
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="Архив событий"
        subtitle={`${data.events.length} записей · хранится локально`}
        actions={
          <Button asChild>
            <Link to="/journal/new">
              <Plus /> Новая запись
            </Link>
          </Button>
        }
      />

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          aria-label="Поиск по журналу"
          placeholder="Поиск: причина, комментарий, сортамент…"
          className={cn(inputCls, "pl-9")}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1">
        {[{ value: "all" as const, label: "Все" }, ...EVENT_TYPES].map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setType(t.value)}
            aria-pressed={type === t.value}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-xs transition-colors",
              type === t.value
                ? "border-primary bg-primary/15 text-primary"
                : "border-border bg-panel text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {list.length ? (
        <div className="space-y-2.5">
          {list.map((e) => (
            <EventCard key={e.id} e={e} />
          ))}
        </div>
      ) : (
        <EmptyState>{data.events.length ? "Ничего не найдено по фильтру." : "Записей пока нет. Создайте первую."}</EmptyState>
      )}

      <StorageNotice />
    </div>
  );
}
