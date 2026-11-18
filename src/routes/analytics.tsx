import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Database, Download, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { PageHeader, Panel, EmptyState } from "@/components/page";
import { DemoBadge, StorageNotice } from "@/components/notices";
import { Field, inputCls } from "@/components/field";
import { EventCard } from "@/components/event-card";
import { ConfirmDelete } from "@/components/confirm-delete";
import { sortByDateDesc, store, useAppData } from "@/lib/store";
import { filterEvents } from "@/lib/filters";
import { downloadFile, eventsToCSV, stamp } from "@/lib/export";
import { storageEstimate } from "@/lib/media";
import { formatBytes } from "@/lib/format";
import { EVENT_TYPES, STANDS, isEventType, type EventType } from "@/lib/types";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Аналитика и экспорт — STEELMIND" },
      { name: "description", content: "Фильтры по дате, клети и типу события, статистика по сохранённым записям, экспорт CSV/JSON." },
      { property: "og:title", content: "Аналитика и экспорт — STEELMIND" },
      { property: "og:description", content: "Статистика по сохранённым записям и резервный экспорт." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Analytics,
});

function Analytics() {
  const data = useAppData();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [stand, setStand] = useState(0);
  const [type, setType] = useState<EventType | "">("");
  const [q, setQ] = useState("");
  const [usage, setUsage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    storageEstimate().then((e) => e && setUsage(`${formatBytes(e.usage)} из ~${formatBytes(e.quota)}`)).catch(() => {});
  }, [data]);

  const list = useMemo(
    () =>
      sortByDateDesc(
        filterEvents(data.events, {
          ...(from ? { from } : {}),
          ...(to ? { to } : {}),
          ...(stand ? { stand } : {}),
          ...(type ? { type } : {}),
          q,
        }),
      ),
    [data.events, from, to, stand, type, q],
  );

  const byType = EVENT_TYPES.map((t) => ({ ...t, n: list.filter((e) => e.type === t.value).length }));
  const maxType = Math.max(1, ...byType.map((t) => t.n));
  const byStand = STANDS.map((s) => ({ s, n: list.filter((e) => e.stands.includes(s)).length }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n)
    .slice(0, 6);
  const demoCount = list.filter((e) => e.demo).length;
  const hasDemo = data.events.some((e) => e.demo) || data.readings.some((r) => r.demo);

  const importFile = async (f: File | undefined) => {
    if (!f) return;
    try {
      const res = store.importBackup(JSON.parse(await f.text()));
      toast.success(`Импортировано: записей ${res.events}, показаний ${res.readings}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось прочитать файл");
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Аналитика и экспорт" subtitle="Статистика только по реально сохранённым записям" />

      <Panel title="Фильтры">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
          <Field label="С даты" htmlFor="f-from">
            <Input id="f-from" type="date" className={inputCls} value={from} onChange={(e) => setFrom(e.target.value)} />
          </Field>
          <Field label="По дату" htmlFor="f-to">
            <Input id="f-to" type="date" className={inputCls} value={to} onChange={(e) => setTo(e.target.value)} />
          </Field>
          <Field label="Клеть" htmlFor="f-stand">
            <NativeSelect id="f-stand" value={stand} onChange={(e) => setStand(Number(e.target.value))}>
              <option value={0}>Все</option>
              {STANDS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Тип" htmlFor="f-type">
            <NativeSelect id="f-type" value={type} onChange={(e) => setType(isEventType(e.target.value) ? e.target.value : "")}>
              <option value="">Все</option>
              {EVENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Поиск" htmlFor="f-q" className="col-span-2 md:col-span-1">
            <Input id="f-q" className={inputCls} value={q} onChange={(e) => setQ(e.target.value)} />
          </Field>
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Итого по фильтру">
          <p className="value-readout text-5xl font-semibold text-ok">{list.length}</p>
          <p className="mt-1 text-sm text-muted-foreground">записей</p>
          {demoCount > 0 && (
            <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <DemoBadge label="ДЕМО" /> из них демонстрационных: {demoCount}
            </p>
          )}
        </Panel>
        <Panel title="По типам" className="lg:col-span-2">
          <ul className="space-y-1.5">
            {byType.map((t) => (
              <li key={t.value} className="grid grid-cols-[8.5rem_1fr_2rem] items-center gap-2 text-sm">
                <span className="truncate text-muted-foreground">{t.label}</span>
                <span className="h-2 overflow-hidden rounded-full bg-muted">
                  <span className="block h-full rounded-full bar-hot" style={{ width: `${(t.n / maxType) * 100}%` }} />
                </span>
                <span className="text-right font-mono">{t.n}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel title="Клети с наибольшим числом записей">
        {byStand.length ? (
          <div className="flex flex-wrap gap-2">
            {byStand.map((x) => (
              <span key={x.s} className="rounded-md border border-border bg-panel-raised px-3 py-1.5 font-mono text-sm">
                Клеть {x.s}: <span className="text-primary">{x.n}</span>
              </span>
            ))}
          </div>
        ) : (
          <EmptyState>Нет записей с указанной клетью.</EmptyState>
        )}
      </Panel>

      <Panel title="Экспорт и резервная копия">
        <div className="flex flex-wrap gap-2">
          <Button variant="panel" disabled={!list.length} onClick={() => downloadFile(`steelmind-events-${stamp()}.csv`, eventsToCSV(list), "text/csv;charset=utf-8")}>
            <Download /> CSV (по фильтру)
          </Button>
          <Button
            variant="panel"
            disabled={!list.length}
            onClick={() => downloadFile(`steelmind-events-${stamp()}.json`, JSON.stringify({ app: "STEELMIND", events: list }, null, 2), "application/json")}
          >
            <Download /> JSON (по фильтру)
          </Button>
          <Button onClick={() => downloadFile(`steelmind-backup-${stamp()}.json`, JSON.stringify(store.exportBackup(), null, 2), "application/json")}>
            <Database /> Полная резервная копия
          </Button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="sr-only" onChange={(e) => void importFile(e.target.files?.[0])} />
          <Button variant="outline" onClick={() => fileRef.current?.click()}>
            <Upload /> Восстановить из копии
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Резервная копия включает журнал, показания, эталонные диапазоны и прогресс обучения. Фото и видео в неё не входят.
          {usage && ` Занято в браузере: ${usage}.`}
        </p>
      </Panel>

      <Panel title="Демо-данные">
        <div className="flex flex-wrap items-center gap-2">
          {hasDemo ? (
            <ConfirmDelete
              title="Удалить демо-данные?"
              description="Будут удалены все записи и показания с меткой ДЕМО. Ваши записи останутся."
              confirmLabel="Удалить демо"
              trigger={
                <Button variant="outline" className="text-alarm">
                  <Trash2 /> Удалить демо-данные
                </Button>
              }
              onConfirm={async () => {
                await store.removeDemo();
                toast.success("Демо-данные удалены");
              }}
            />
          ) : (
            <Button variant="panel" onClick={() => { store.loadDemo(); toast.success("Демо-данные загружены"); }}>
              Загрузить демо-данные
            </Button>
          )}
          <span className="text-xs text-muted-foreground">Демо-данные — условные значения, не полученные с оборудования.</span>
        </div>
      </Panel>

      <Panel title={`Записи · ${list.length}`}>
        {list.length ? (
          <div className="space-y-2">
            {list.slice(0, 30).map((e) => (
              <EventCard key={e.id} e={e} compact />
            ))}
            {list.length > 30 && <p className="text-center text-xs text-muted-foreground">Показаны первые 30. Полный список — в экспорте.</p>}
          </div>
        ) : (
          <EmptyState>Нет записей по фильтру.</EmptyState>
        )}
      </Panel>

      <StorageNotice />
    </div>
  );
}
