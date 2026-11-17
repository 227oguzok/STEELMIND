import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useHydrated } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel, EmptyState } from "@/components/page";
import { DemoBadge } from "@/components/notices";
import { EventForm } from "@/components/event-form";
import { ConfirmDelete } from "@/components/confirm-delete";
import { store, useAppData } from "@/lib/store";
import { formatDateTime } from "@/lib/format";
import { EVENT_LABEL } from "@/lib/types";

export const Route = createFileRoute("/journal/$id")({
  head: () => ({
    meta: [
      { title: "Редактирование записи — STEELMIND" },
      { name: "description", content: "Редактирование записи журнала событий." },
      { property: "og:title", content: "Редактирование записи — STEELMIND" },
      { property: "og:description", content: "Редактирование записи журнала событий." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: EditEvent,
});

function EditEvent() {
  const { id } = Route.useParams();
  const hydrated = useHydrated();
  const data = useAppData();
  const navigate = useNavigate();
  const rec = data.events.find((e) => e.id === id);

  if (!hydrated) return <EmptyState>Загрузка записи…</EmptyState>;
  if (!rec)
    return (
      <EmptyState>
        Запись не найдена на этом устройстве.{" "}
        <Link to="/journal" className="text-primary underline">
          К журналу
        </Link>
      </EmptyState>
    );

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <PageHeader
        title="Редактирование"
        subtitle={`${EVENT_LABEL[rec.type]} · создано ${formatDateTime(rec.createdAt)}`}
        badge={rec.demo ? <DemoBadge /> : undefined}
        actions={
          <ConfirmDelete
            trigger={
              <Button variant="outline" className="text-alarm">
                <Trash2 /> Удалить
              </Button>
            }
            onConfirm={async () => {
              await store.deleteEvent(rec.id);
              toast.success("Запись удалена");
              navigate({ to: "/journal" });
            }}
          />
        }
      />
      <Panel>
        <EventForm
          key={rec.id}
          initial={rec}
          submitLabel="Сохранить изменения"
          onCancel={() => navigate({ to: "/journal" })}
          onSaved={() => {
            toast.success("Изменения сохранены");
            navigate({ to: "/journal" });
          }}
        />
      </Panel>
    </div>
  );
}
