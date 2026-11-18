import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader, Panel } from "@/components/page";
import { StorageNotice } from "@/components/notices";
import { EventForm } from "@/components/event-form";
import { isEventType, type EventType } from "@/lib/types";

export const Route = createFileRoute("/journal/new")({
  validateSearch: (s: Record<string, unknown>): { type?: EventType | undefined } => {
    const t = s["type"];
    return { type: isEventType(t) ? t : undefined };
  },
  head: () => ({
    meta: [
      { title: "Новая запись — STEELMIND" },
      { name: "description", content: "Создание записи в журнале событий смены." },
      { property: "og:title", content: "Новая запись — STEELMIND" },
      { property: "og:description", content: "Создание записи в журнале событий смены." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NewEvent,
});

function NewEvent() {
  const { type } = Route.useSearch();
  const navigate = useNavigate();
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <PageHeader title="Новая запись" subtitle="Поля со * обязательны для выбранного типа" />
      <Panel>
        <EventForm
          defaultType={type ?? "note"}
          onCancel={() => navigate({ to: "/journal" })}
          onSaved={() => {
            toast.success("Запись сохранена");
            navigate({ to: "/journal" });
          }}
        />
      </Panel>
      <StorageNotice />
    </div>
  );
}
