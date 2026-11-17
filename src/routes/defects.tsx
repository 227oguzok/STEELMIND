import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { BrainCircuit, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel, EmptyState } from "@/components/page";
import { StorageNotice } from "@/components/notices";
import { EventForm } from "@/components/event-form";
import { EventCard } from "@/components/event-card";
import { sortByDateDesc, useAppData } from "@/lib/store";
import type { EventRecord } from "@/lib/types";

export const Route = createFileRoute("/defects")({
  head: () => ({
    meta: [
      { title: "Диагностика дефектов — STEELMIND" },
      { name: "description", content: "Регистрация дефектов проката с фото и видео для последующего анализа." },
      { property: "og:title", content: "Диагностика дефектов — STEELMIND" },
      { property: "og:description", content: "Регистрация дефектов проката: тип, клеть, место, симметрия, фото и видео." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Defects,
});

function Defects() {
  const data = useAppData();
  const [saved, setSaved] = useState<EventRecord | null>(null);
  const [formKey, setFormKey] = useState(0);
  const defects = useMemo(() => sortByDateDesc(data.events.filter((e) => e.type === "defect")), [data.events]);

  return (
    <div className="space-y-4">
      <PageHeader title="Диагностика дефектов" subtitle="Регистрация дефекта и материалов для последующего анализа" />

      <div className="flex gap-3 rounded-lg border border-border bg-panel p-3 text-sm">
        <BrainCircuit className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
        <div>
          <p className="font-display text-sm uppercase tracking-wider">AI-модуль анализа не подключён</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Приложение не формирует автоматических заключений о причинах дефектов. Материалы сохраняются для
            последующего анализа специалистами или будущим модулем.
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Panel title="Регистрация дефекта" className="lg:col-span-3">
          {saved ? (
            <div className="space-y-4 text-center">
              <CheckCircle2 className="mx-auto size-12 text-ok" />
              <div>
                <p className="font-display text-lg uppercase tracking-wide">Материал сохранён для последующего анализа</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {saved.defect?.defectType}
                  {saved.stands.length ? ` · клеть ${saved.stands.join(", ")}` : ""} · вложений: {saved.attachments.length}
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                <Button asChild variant="panel">
                  <Link to="/journal/$id" params={{ id: saved.id }}>
                    Дописать наблюдения
                  </Link>
                </Button>
                <Button
                  onClick={() => {
                    setSaved(null);
                    setFormKey((k) => k + 1);
                  }}
                >
                  Зарегистрировать ещё
                </Button>
              </div>
            </div>
          ) : (
            <EventForm key={formKey} lockedType="defect" submitLabel="Сохранить дефект" onSaved={setSaved} />
          )}
        </Panel>

        <Panel title={`Зарегистрированные дефекты · ${defects.length}`} className="lg:col-span-2">
          {defects.length ? (
            <div className="space-y-2">
              {defects.slice(0, 10).map((e) => (
                <EventCard key={e.id} e={e} />
              ))}
            </div>
          ) : (
            <EmptyState>Дефектов пока не зарегистрировано.</EmptyState>
          )}
        </Panel>
      </div>

      <StorageNotice />
    </div>
  );
}
