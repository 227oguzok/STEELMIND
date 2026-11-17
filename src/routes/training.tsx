import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Circle, FileText } from "lucide-react";
import { PageHeader, Panel } from "@/components/page";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { LEVELS } from "@/lib/content/training";
import { store, useAppData } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/training")({
  head: () => ({
    meta: [
      { title: "Обучение оператора — STEELMIND" },
      { name: "description", content: "Программа обучения оператора прокатного стана от новичка до самостоятельной работы." },
      { property: "og:title", content: "Обучение оператора — STEELMIND" },
      { property: "og:description", content: "Модули: безопасность, клети, обороты/ток/скорость, натяжение, дефекты, переход, перевалка." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Training,
});

function Training() {
  const { lessonsDone } = useAppData();
  const all = LEVELS.flatMap((l) => l.modules.flatMap((m) => m.lessons));
  const doneAll = all.filter((l) => lessonsDone.includes(l.id)).length;

  return (
    <div className="space-y-4">
      <PageHeader title="Обучение оператора" subtitle="Структура курса. Материалы конкретного стана добавляются по документам предприятия." />

      <Panel title="Общий прогресс">
        <div className="flex items-center gap-3">
          <Progress value={(doneAll / all.length) * 100} className="h-2 flex-1" />
          <span className="font-mono text-sm text-ok">
            {doneAll}/{all.length}
          </span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Отметки «изучено» хранятся локально и помогают отслеживать план обучения.</p>
      </Panel>

      <div className="grid gap-4">
        {LEVELS.map((level, i) => {
          const lessons = level.modules.flatMap((m) => m.lessons);
          const done = lessons.filter((l) => lessonsDone.includes(l.id)).length;
          return (
            <Panel key={level.id}>
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-md border border-primary/50 bg-primary/10 font-display text-lg text-primary">
                  {i + 1}
                </span>
                <div className="flex-1">
                  <h2 className="text-lg uppercase tracking-wide">{level.title}</h2>
                  <p className="text-sm text-muted-foreground">{level.description}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Progress value={(done / lessons.length) * 100} className="h-1.5 flex-1" />
                    <span className="font-mono text-xs text-muted-foreground">
                      {done}/{lessons.length}
                    </span>
                  </div>
                </div>
              </div>

              <Accordion type="multiple" className="mt-3">
                {level.modules.map((m) => (
                  <AccordionItem key={m.id} value={m.id} className="border-border">
                    <AccordionTrigger className="font-display uppercase tracking-wide hover:no-underline">
                      {m.title}
                    </AccordionTrigger>
                    <AccordionContent>
                      <ul className="space-y-2">
                        {m.lessons.map((l) => {
                          const on = lessonsDone.includes(l.id);
                          return (
                            <li key={l.id} className={cn("rounded-md border p-3", on ? "border-ok/40 bg-ok/5" : "border-border bg-panel")}>
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="font-medium">{l.title}</p>
                                  <ul className="mt-1 list-inside list-disc text-xs text-muted-foreground">
                                    {l.goals.map((g) => (
                                      <li key={g}>{g}</li>
                                    ))}
                                  </ul>
                                  <p className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
                                    <FileText className="size-3" /> Контент: структура урока · материалы по техкартам предприятия
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => store.toggleLesson(l.id)}
                                  aria-pressed={on}
                                  className={cn("flex shrink-0 items-center gap-1 rounded-md px-2 py-1.5 text-xs", on ? "text-ok" : "text-muted-foreground hover:text-foreground")}
                                >
                                  {on ? <CheckCircle2 className="size-5" /> : <Circle className="size-5" />}
                                  <span className="hidden sm:inline">{on ? "Изучено" : "Отметить"}</span>
                                </button>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
