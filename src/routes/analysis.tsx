import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, type FormEvent } from "react";
import { AlertTriangle, Info, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { NativeSelect } from "@/components/ui/native-select";
import { PageHeader, Panel, EmptyState } from "@/components/page";
import { DemoBadge, StorageNotice } from "@/components/notices";
import { Field, inputCls } from "@/components/field";
import { TrendChart } from "@/components/trend-chart";
import { ConfirmDelete } from "@/components/confirm-delete";
import { sortByDateDesc, store, StorageError, useAppData } from "@/lib/store";
import { assessSeries, ASSESSMENT_TEXT, MIN_POINTS_FOR_STATS } from "@/lib/analysis";
import { formatDateTime, formatNumber, newId, parseNum, toLocalInput } from "@/lib/format";
import { validateReading, type Errors } from "@/lib/validation";
import { PARAMS, PARAM_KEYS, STANDS, type Param, type ParamValues } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/analysis")({
  validateSearch: (s: Record<string, unknown>): { stand?: number | undefined } => {
    const n = Number(s["stand"]);
    return { stand: Number.isInteger(n) && n >= 1 && n <= STANDS.length ? n : undefined };
  },
  head: () => ({
    meta: [
      { title: "Анализ показаний — STEELMIND" },
      { name: "description", content: "Ручной ввод оборотов, тока и скорости по клетям, графики и отклонения по введённым данным." },
      { property: "og:title", content: "Анализ показаний — STEELMIND" },
      { property: "og:description", content: "Ручной ввод показаний по клетям и анализ отклонений только по введённым данным." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Analysis,
});

function Analysis() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/analysis" });
  const data = useAppData();
  const stand = search.stand ?? 1;
  const [param, setParam] = useState<Param>("current");
  const setStand = (s: number) => navigate({ search: { stand: s }, replace: true });

  const readings = useMemo(() => sortByDateDesc(data.readings), [data.readings]);
  const standReadings = readings.filter((r) => r.stand === stand);
  const series = standReadings
    .filter((r) => r.values[param] !== undefined)
    .map((r) => ({ id: r.id, datetime: r.datetime, value: r.values[param] as number }));
  const ref = data.refs.find((r) => r.stand === stand && r.param === param);
  const assessment = assessSeries(series, ref);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Показания"
        subtitle="Только по введённым вручную данным. Норма и уставки приложением не задаются."
        badge={readings.some((r) => r.demo) ? <DemoBadge /> : undefined}
      />

      <div className="grid gap-4 lg:grid-cols-5">
        <Panel title="Ввод показаний" className="lg:col-span-2">
          <ReadingForm defaultStand={stand} />
        </Panel>

        <Panel title="Клети — последние значения" className="lg:col-span-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {STANDS.map((s) => {
              const last = readings.find((r) => r.stand === s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStand(s)}
                  aria-pressed={s === stand}
                  className={cn(
                    "rounded-md border p-2 text-left transition-colors",
                    s === stand ? "border-primary bg-primary/10 glow-primary" : "border-border bg-panel hover:border-ok/60",
                    last?.demo && "demo-hatch",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display text-sm uppercase tracking-wide">Клеть {s}</span>
                    {last?.demo && <span className="text-[9px] font-semibold text-demo">ДЕМО</span>}
                  </div>
                  {last ? (
                    <dl className="mt-1 space-y-0.5 font-mono text-[11px]">
                      {PARAM_KEYS.map((k) => (
                        <div key={k} className="flex justify-between gap-1">
                          <dt className="text-muted-foreground">{PARAMS[k].unit}</dt>
                          <dd className="text-ok">{formatNumber(last.values[k])}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <p className="mt-1 text-[11px] text-muted-foreground">нет данных</p>
                  )}
                </button>
              );
            })}
          </div>
        </Panel>
      </div>

      <Panel
        title={`Клеть ${stand} · временной ряд`}
        actions={standReadings.some((r) => r.demo) ? <DemoBadge /> : undefined}
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

        <AssessmentNote status={assessment.status} count={assessment.count} mean={assessment.mean} sd={assessment.sd} unit={PARAMS[param].unit} />

        {series.length > 1 ? (
          <TrendChart points={series} unit={PARAMS[param].unit} flags={assessment.flags} refRange={ref} height={240} />
        ) : (
          <EmptyState>Для графика нужно минимум два значения.</EmptyState>
        )}

        <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-ok" /> введённые значения</span>
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-warn" /> статистическое отклонение (±2σ)</span>
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-alarm" /> вне введённого эталонного диапазона</span>
        </div>

        <RefEditor stand={stand} param={param} />

        <div className="mt-4">
          <p className="label-caps mb-2">Записи клети {stand}</p>
          {standReadings.length ? (
            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full min-w-[520px] text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr className="label-caps">
                    <th className="px-3 py-2 font-medium">Время</th>
                    {PARAM_KEYS.map((k) => (
                      <th key={k} className="px-3 py-2 text-right font-medium">
                        {PARAMS[k].unit}
                      </th>
                    ))}
                    <th className="px-3 py-2 font-medium">Примечание</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody>
                  {standReadings.slice(0, 50).map((r) => {
                    const flag = assessment.flags[r.id];
                    return (
                      <tr key={r.id} className="border-t border-border">
                        <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-muted-foreground">{formatDateTime(r.datetime)}</td>
                        {PARAM_KEYS.map((k) => (
                          <td
                            key={k}
                            className={cn(
                              "px-3 py-2 text-right font-mono",
                              k === param && flag === "out-of-range" && "font-semibold text-alarm",
                              k === param && flag === "stat-outlier" && "font-semibold text-warn",
                            )}
                          >
                            {formatNumber(r.values[k])}
                          </td>
                        ))}
                        <td className="px-3 py-2 text-xs text-muted-foreground">
                          {r.demo && <Badge variant="demo" className="mr-1">ДЕМО</Badge>}
                          {r.note}
                        </td>
                        <td className="px-1">
                          <ConfirmDelete
                            title="Удалить показание?"
                            description="Значение будет удалено из этого браузера."
                            trigger={
                              <Button size="icon" variant="ghost" aria-label="Удалить показание" className="text-muted-foreground hover:text-alarm">
                                <Trash2 />
                              </Button>
                            }
                            onConfirm={() => {
                              store.deleteReading(r.id);
                              toast.success("Показание удалено");
                            }}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState>По этой клети показаний нет.</EmptyState>
          )}
        </div>
      </Panel>

      <StorageNotice />
    </div>
  );
}

function AssessmentNote({
  status,
  count,
  mean,
  sd,
  unit,
}: {
  status: "insufficient" | "reference" | "statistics";
  count: number;
  mean?: number | undefined;
  sd?: number | undefined;
  unit: string;
}) {
  return (
    <div
      className={cn(
        "mb-3 flex gap-2 rounded-md border p-2.5 text-xs",
        status === "insufficient" ? "border-border bg-muted/40 text-muted-foreground" : "border-ok/30 bg-ok/5 text-foreground/90",
      )}
    >
      {status === "insufficient" ? <AlertTriangle className="size-4 shrink-0 text-warn" /> : <Info className="size-4 shrink-0 text-ok" />}
      <div>
        <p className="font-medium">{ASSESSMENT_TEXT[status]}</p>
        <p className="mt-0.5 text-muted-foreground">
          Точек: {count}.
          {status === "insufficient" && ` Для статистики нужно ≥ ${MIN_POINTS_FOR_STATS} значений, либо введите эталонный диапазон из документа.`}
          {status === "statistics" && ` Среднее ${formatNumber(mean)} ${unit}, σ = ${formatNumber(sd)} ${unit}. Это не норма.`}
        </p>
      </div>
    </div>
  );
}

function RefEditor({ stand, param }: { stand: number; param: Param }) {
  const data = useAppData();
  const ref = data.refs.find((r) => r.stand === stand && r.param === param);
  const [open, setOpen] = useState(false);
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [source, setSource] = useState("");
  const [errors, setErrors] = useState<Errors>({});

  const start = () => {
    setMin(ref?.min?.toString() ?? "");
    setMax(ref?.max?.toString() ?? "");
    setSource(ref?.source ?? "");
    setErrors({});
    setOpen(true);
  };

  const save = (e: FormEvent) => {
    e.preventDefault();
    const a = parseNum(min);
    const b = parseNum(max);
    const errs: Errors = {};
    if (a === null) errs["min"] = "Введите число";
    if (b === null) errs["max"] = "Введите число";
    if (a === undefined && b === undefined) errs["min"] = "Укажите хотя бы одну границу";
    if (typeof a === "number" && typeof b === "number" && a > b) errs["max"] = "Максимум меньше минимума";
    if (!source.trim()) errs["source"] = "Укажите документ-источник";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    store.upsertRef({ id: ref?.id ?? newId(), stand, param, min: a ?? undefined, max: b ?? undefined, source: source.trim() });
    toast.success("Эталонный диапазон сохранён");
    setOpen(false);
  };

  return (
    <div className="mt-4 rounded-md border border-dashed border-border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs">
          <p className="label-caps">Эталонный диапазон · {PARAMS[param].label}</p>
          {ref ? (
            <p className="mt-1 font-mono text-ok">
              {formatNumber(ref.min)} … {formatNumber(ref.max)} {PARAMS[param].unit}
              <span className="ml-2 font-sans text-muted-foreground">источник: {ref.source}</span>
            </p>
          ) : (
            <p className="mt-1 text-muted-foreground">Не задан. Вводите только из утверждённого документа (техкарта, инструкция).</p>
          )}
        </div>
        <div className="flex gap-1.5">
          {ref && (
            <Button size="sm" variant="ghost" onClick={() => store.deleteRef(ref.id)}>
              Убрать
            </Button>
          )}
          {!open && (
            <Button size="sm" variant="panel" onClick={start}>
              {ref ? "Изменить" : "Задать"}
            </Button>
          )}
        </div>
      </div>
      {open && (
        <form onSubmit={save} className="mt-3 grid gap-2 sm:grid-cols-4" noValidate>
          <Field label="Мин." htmlFor="ref-min" error={errors["min"]}>
            <Input id="ref-min" inputMode="decimal" className={cn(inputCls, "font-mono")} value={min} onChange={(e) => setMin(e.target.value)} />
          </Field>
          <Field label="Макс." htmlFor="ref-max" error={errors["max"]}>
            <Input id="ref-max" inputMode="decimal" className={cn(inputCls, "font-mono")} value={max} onChange={(e) => setMax(e.target.value)} />
          </Field>
          <Field label="Источник" htmlFor="ref-src" error={errors["source"]} className="sm:col-span-2">
            <Input id="ref-src" placeholder="Напр.: техкарта №…" className={inputCls} value={source} onChange={(e) => setSource(e.target.value)} />
          </Field>
          <div className="flex gap-2 sm:col-span-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Отмена
            </Button>
            <Button type="submit">Сохранить диапазон</Button>
          </div>
        </form>
      )}
    </div>
  );
}

function ReadingForm({ defaultStand }: { defaultStand: number }) {
  const [stand, setStand] = useState<number>(defaultStand);
  const [datetime, setDatetime] = useState(() => toLocalInput(new Date()));
  const [vals, setVals] = useState<Record<Param, string>>({ rpm: "", current: "", speed: "" });
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Errors>({});

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const values: ParamValues = {};
    for (const k of PARAM_KEYS) {
      const n = parseNum(vals[k]);
      if (n === null) values[k] = Number.NaN;
      else if (n !== undefined) values[k] = n;
    }
    const errs = validateReading({ stand, datetime, values });
    setErrors(errs);
    if (Object.keys(errs).length) return;
    try {
      store.addReading({ id: newId(), stand, datetime, values, note: note.trim(), createdAt: new Date().toISOString() });
      toast.success(`Показание по клети ${stand} сохранено`);
      setVals({ rpm: "", current: "", speed: "" });
      setNote("");
      setDatetime(toLocalInput(new Date()));
    } catch (err) {
      toast.error(err instanceof StorageError ? err.message : "Не удалось сохранить");
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3" noValidate>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Клеть" htmlFor="rd-stand" error={errors["stand"]}>
          <NativeSelect id="rd-stand" value={stand} onChange={(e) => setStand(Number(e.target.value))}>
            {STANDS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Время" htmlFor="rd-dt" error={errors["datetime"]}>
          <Input id="rd-dt" type="datetime-local" className={inputCls} value={datetime} onChange={(e) => setDatetime(e.target.value)} />
        </Field>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {PARAM_KEYS.map((k) => (
          <Field key={k} label={PARAMS[k].unit} htmlFor={`rd-${k}`} error={errors[`values.${k}`]}>
            <Input
              id={`rd-${k}`}
              inputMode="decimal"
              placeholder={PARAMS[k].label}
              className={cn(inputCls, "font-mono")}
              value={vals[k]}
              onChange={(e) => setVals({ ...vals, [k]: e.target.value })}
            />
          </Field>
        ))}
      </div>
      {errors["values"] && <p role="alert" className="text-xs font-medium text-alarm">{errors["values"]}</p>}
      <Field label="Примечание" htmlFor="rd-note">
        <Input id="rd-note" className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>
      <Button type="submit" size="lg" className="w-full">
        <Plus /> Добавить показание
      </Button>
      <p className="text-xs text-muted-foreground">Вносите фактически считанные значения с приборов/экранов. Без автоматического подключения к оборудованию.</p>
    </form>
  );
}
