import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Activity, ClipboardPlus, Gauge, Plus, ScanSearch, Waves, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { PageHeader, Panel, EmptyState } from "@/components/page";
import { DemoBadge, SafetyNotice } from "@/components/notices";
import { StatCard } from "@/components/stat-card";
import { MillSchematic } from "@/components/mill-schematic";
import { TrendChart } from "@/components/trend-chart";
import { EventCard } from "@/components/event-card";
import { sortByDateDesc, useAppData } from "@/lib/store";
import { formatDateTime, formatNumber } from "@/lib/format";
import { PARAMS, PARAM_KEYS, STANDS, type Param } from "@/lib/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Главная панель — STEELMIND" },
      { name: "description", content: "Сводка показаний, схема линии из 16 клетей, тренд и последние события смены." },
      { property: "og:title", content: "Главная панель — STEELMIND" },
      { property: "og:description", content: "Сводка показаний, схема линии и последние события смены." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const ICONS = { rpm: Gauge, current: Zap, speed: Waves } as const;

function Dashboard() {
  const data = useAppData();
  const [stand, setStand] = useState(1);
  const [param, setParam] = useState<Param>("current");

  const readings = useMemo(() => sortByDateDesc(data.readings), [data.readings]);
  const events = useMemo(() => sortByDateDesc(data.events), [data.events]);

  const latest = PARAM_KEYS.map((k) => ({ k, r: readings.find((r) => r.values[k] !== undefined) }));

  const marked = useMemo(() => {
    const since = Date.now() - 24 * 3600 * 1000;
    return new Set(events.filter((e) => new Date(e.datetime).getTime() >= since).flatMap((e) => e.stands));
  }, [events]);

  const trend = readings
    .filter((r) => r.stand === stand && r.values[param] !== undefined)
    .slice(0, 40)
    .map((r) => ({ id: r.id, datetime: r.datetime, value: r.values[param] as number }));
  const trendDemo = readings.some((r) => r.stand === stand && r.demo);
  const hasDemo = data.events.some((e) => e.demo) || data.readings.some((r) => r.demo);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Главная панель"
        subtitle="Последние введённые показания и события. Онлайн-связи с оборудованием нет."
        badge={hasDemo ? <DemoBadge /> : undefined}
        actions={
          <>
            <Button asChild>
              <Link to="/journal/new">
                <Plus /> Новая запись
              </Link>
            </Button>
            <Button asChild variant="panel">
              <Link to="/analysis" search={{ stand: undefined }}>
                <ClipboardPlus /> Ввести показания
              </Link>
            </Button>
          </>
        }
      />

      <SafetyNotice />

      <div className="grid gap-3 sm:grid-cols-3">
        {latest.map(({ k, r }) => (
          <StatCard
            key={k}
            label={PARAMS[k].label}
            unit={PARAMS[k].unit}
            icon={ICONS[k]}
            value={r ? formatNumber(r.values[k]) : "—"}
            meta={r ? `Последнее введённое · клеть ${r.stand} · ${formatDateTime(r.datetime)}` : "Нет введённых показаний"}
            demo={r?.demo}
            tone={r ? "ok" : "muted"}
          />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Статусы" className="lg:col-span-1">
          <ul className="space-y-2.5 text-sm">
            <StatusRow label="Связь с оборудованием" value="Не подключено" tone="muted" />
            <StatusRow label="Режим" value="Справочно-аналитический" tone="ok" />
            <StatusRow label="Хранение" value="Локально в браузере" tone="ok" />
            <StatusRow label="Записей в журнале" value={String(data.events.length)} tone="ok" />
            <StatusRow label="Введено показаний" value={String(data.readings.length)} tone="ok" />
            <StatusRow label="Демо-данные" value={hasDemo ? "Присутствуют" : "Нет"} tone={hasDemo ? "warn" : "muted"} />
          </ul>
        </Panel>

        <Panel title="Линия стана" className="lg:col-span-2">
          <MillSchematic marked={marked} />
        </Panel>
      </div>

      <Panel
        title={
          <span className="flex items-center gap-2">
            <Activity className="size-3.5" /> Тренд по введённым данным
          </span>
        }
        actions={trendDemo ? <DemoBadge /> : undefined}
      >
        <div className="mb-3 grid grid-cols-2 gap-2 sm:max-w-md">
          <NativeSelect aria-label="Клеть" value={stand} onChange={(e) => setStand(Number(e.target.value))}>
            {STANDS.map((s) => (
              <option key={s} value={s}>
                Клеть {s}
              </option>
            ))}
          </NativeSelect>
          <NativeSelect aria-label="Параметр" value={param} onChange={(e) => setParam(e.target.value as Param)}>
            {PARAM_KEYS.map((k) => (
              <option key={k} value={k}>
                {PARAMS[k].label}, {PARAMS[k].unit}
              </option>
            ))}
          </NativeSelect>
        </div>
        {trend.length > 1 ? (
          <TrendChart points={trend} unit={PARAMS[param].unit} />
        ) : (
          <EmptyState>Для тренда нужно минимум два введённых значения по выбранной клети.</EmptyState>
        )}
      </Panel>

      <Panel
        title="Последние события"
        actions={
          <Button asChild size="sm" variant="ghost">
            <Link to="/journal">Весь журнал</Link>
          </Button>
        }
      >
        {events.length ? (
          <div className="space-y-2">
            {events.slice(0, 4).map((e) => (
              <EventCard key={e.id} e={e} compact />
            ))}
          </div>
        ) : (
          <EmptyState>Записей пока нет.</EmptyState>
        )}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button asChild variant="panel">
            <Link to="/journal/new" search={{ type: "transition" }}>
              Записать переход
            </Link>
          </Button>
          <Button asChild variant="panel">
            <Link to="/defects">
              <ScanSearch /> Дефект
            </Link>
          </Button>
        </div>
      </Panel>
    </div>
  );
}

function StatusRow({ label, value, tone }: { label: string; value: string; tone: "ok" | "warn" | "muted" }) {
  const dot = tone === "ok" ? "bg-ok glow-ok" : tone === "warn" ? "bg-warn animate-status" : "bg-muted-foreground";
  return (
    <li className="flex items-center justify-between gap-3 border-b border-border/60 pb-2 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="flex items-center gap-2 text-right font-medium">
        <span className={`size-2 rounded-full ${dot}`} />
        {value}
      </span>
    </li>
  );
}
