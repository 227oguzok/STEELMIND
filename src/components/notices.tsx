import { HardDrive, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function DemoBadge({ className, label = "ДЕМО / условные данные" }: { className?: string | undefined; label?: string }) {
  return (
    <Badge variant="demo" className={className}>
      {label}
    </Badge>
  );
}

export const SAFETY_TEXT =
  "Приложение справочно-аналитическое. Не заменяет технологические карты, инструкции и распоряжения ответственного персонала. Не управляет оборудованием и не выдаёт команд на изменение уставок или оборотов.";

export function SafetyNotice({ className }: { className?: string }) {
  return (
    <div
      role="note"
      className={cn("flex gap-3 rounded-lg border border-warn/40 strip-warn p-3 text-sm", className)}
    >
      <ShieldAlert className="mt-0.5 size-5 shrink-0 text-warn" />
      <div>
        <p className="font-display text-sm uppercase tracking-wider text-warn">Производственная безопасность</p>
        <p className="mt-1 text-foreground/90">{SAFETY_TEXT}</p>
      </div>
    </div>
  );
}

export function SafetyStrip() {
  return (
    <div className="flex items-center gap-2 border-t border-warn/25 strip-warn px-4 py-1.5 text-[11px] leading-tight text-foreground/85">
      <ShieldAlert className="size-3.5 shrink-0 text-warn" />
      <span>Не заменяет техкарты и инструкции. Только справка и анализ — без управления оборудованием.</span>
    </div>
  );
}

export function StorageNotice({ className }: { className?: string }) {
  return (
    <div className={cn("flex gap-3 rounded-lg border border-border bg-panel p-3 text-xs text-muted-foreground", className)}>
      <HardDrive className="mt-0.5 size-4 shrink-0 text-ok" />
      <p>
        Записи хранятся только в этом браузере на этом устройстве — облачной синхронизации нет. Фото и видео
        лежат в локальной базе браузера и не попадают в экспорт. Регулярно делайте резервный экспорт в разделе
        «Аналитика». Очистка данных браузера удалит записи.
      </p>
    </div>
  );
}
