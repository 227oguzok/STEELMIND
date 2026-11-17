import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Calculator, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader, Panel, EmptyState } from "@/components/page";
import { Field, inputCls } from "@/components/field";
import { FORMULAS, TERMS } from "@/lib/content/reference";
import { formatNumber, parseNum } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/reference")({
  head: () => ({
    meta: [
      { title: "Техническая база — STEELMIND" },
      { name: "description", content: "Справочник терминов и формул прокатного производства с единицами и допущениями." },
      { property: "og:title", content: "Техническая база — STEELMIND" },
      { property: "og:description", content: "Термины и формулы прокатного производства с пояснениями." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Reference,
});

function Reference() {
  const [q, setQ] = useState("");
  const s = q.trim().toLowerCase();
  const terms = useMemo(() => TERMS.filter((t) => !s || `${t.term} ${t.definition}`.toLowerCase().includes(s)), [s]);
  const formulas = useMemo(
    () => FORMULAS.filter((f) => !s || `${f.title} ${f.explanation} ${f.expression}`.toLowerCase().includes(s)),
    [s],
  );

  return (
    <div className="space-y-4">
      <PageHeader title="Техническая база" subtitle="Общие сведения. Параметры конкретного стана не подставляются." />

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input aria-label="Поиск по справочнику" placeholder="Поиск термина или формулы" className={cn(inputCls, "pl-9")} value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <Tabs defaultValue="formulas">
        <TabsList className="grid w-full grid-cols-2 bg-panel sm:w-80">
          <TabsTrigger value="formulas">Формулы · {formulas.length}</TabsTrigger>
          <TabsTrigger value="terms">Термины · {terms.length}</TabsTrigger>
        </TabsList>

        <TabsContent value="formulas" className="mt-4 space-y-3">
          <SpeedCalculator />
          {formulas.length === 0 && <EmptyState>Ничего не найдено.</EmptyState>}
          <div className="grid gap-3 md:grid-cols-2">
            {formulas.map((f) => (
              <Panel key={f.id}>
                <h3 className="font-display text-base uppercase tracking-wide">{f.title}</h3>
                <p className="my-3 rounded-md border border-border bg-background px-3 py-2.5 font-mono text-lg text-ok">{f.expression}</p>
                <dl className="space-y-1 text-sm">
                  {f.variables.map((v) => (
                    <div key={v.symbol} className="flex gap-2">
                      <dt className="w-14 shrink-0 font-mono text-primary">{v.symbol}</dt>
                      <dd className="text-muted-foreground">
                        {v.meaning}, <span className="font-mono text-foreground">{v.unit}</span>
                      </dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-3 text-sm">{f.explanation}</p>
                <p className="mt-2 rounded-md border border-dashed border-warn/40 p-2 text-xs text-muted-foreground">
                  <span className="label-caps mr-1 text-warn">Допущения</span>
                  {f.assumptions}
                </p>
              </Panel>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="terms" className="mt-4">
          {terms.length === 0 ? (
            <EmptyState>Ничего не найдено.</EmptyState>
          ) : (
            <div className="grid gap-2 md:grid-cols-2">
              {terms.map((t) => (
                <div key={t.term} className="panel p-3">
                  <p className="font-display uppercase tracking-wide text-primary">{t.term}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{t.definition}</p>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SpeedCalculator() {
  const [d, setD] = useState("");
  const [n, setN] = useState("");
  const dv = parseNum(d);
  const nv = parseNum(n);
  const v = typeof dv === "number" && typeof nv === "number" ? (Math.PI * dv * nv) / 60 : undefined;
  return (
    <Panel
      title={
        <span className="flex items-center gap-2">
          <Calculator className="size-3.5" /> Калькулятор окружной скорости
        </span>
      }
    >
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:items-end">
        <Field label="D, м" htmlFor="calc-d" error={dv === null ? "Число" : undefined}>
          <Input id="calc-d" inputMode="decimal" className={cn(inputCls, "font-mono")} value={d} onChange={(e) => setD(e.target.value)} />
        </Field>
        <Field label="n, об/мин" htmlFor="calc-n" error={nv === null ? "Число" : undefined}>
          <Input id="calc-n" inputMode="decimal" className={cn(inputCls, "font-mono")} value={n} onChange={(e) => setN(e.target.value)} />
        </Field>
        <div className="col-span-2 rounded-md border border-border bg-background px-3 py-2 sm:col-span-1">
          <p className="label-caps">v, м/с</p>
          <p className="value-readout text-2xl text-ok">{formatNumber(v, 3)}</p>
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Расчёт только по введённым вами значениям. Без учёта опережения; не является рекомендацией по режиму.
      </p>
    </Panel>
  );
}
