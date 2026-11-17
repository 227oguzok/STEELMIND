import { useEffect, useRef, useState } from "react";
import { FileWarning, ImagePlus, Video, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getMedia, MAX_FILE_BYTES, MAX_FILE_MB, mediaKind } from "@/lib/media";
import { formatBytes, newId } from "@/lib/format";
import type { AttachmentMeta } from "@/lib/types";

export interface PendingFile {
  meta: AttachmentMeta;
  file: File;
}

export function MediaThumb({
  meta,
  file,
  onRemove,
}: {
  meta: AttachmentMeta;
  file?: Blob;
  onRemove?: () => void;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let created: string | null = null;
    (async () => {
      const blob = file ?? (await getMedia(meta.id).catch(() => undefined));
      if (cancelled) return;
      if (!blob) return setMissing(true);
      created = URL.createObjectURL(blob);
      setUrl(created);
    })();
    return () => {
      cancelled = true;
      if (created) URL.revokeObjectURL(created);
    };
  }, [meta.id, file]);

  return (
    <figure className="relative overflow-hidden rounded-md border border-border bg-background">
      <div className="flex aspect-video items-center justify-center bg-muted">
        {missing ? (
          <div className="flex flex-col items-center gap-1 p-2 text-center text-xs text-muted-foreground">
            <FileWarning className="size-5" />
            Файл недоступен на этом устройстве
          </div>
        ) : !url ? (
          <span className="text-xs text-muted-foreground">Загрузка…</span>
        ) : meta.kind === "image" ? (
          <img src={url} alt={meta.name} className="h-full w-full object-cover" />
        ) : meta.kind === "video" ? (
          <video src={url} controls playsInline preload="metadata" className="h-full w-full bg-background" />
        ) : (
          <a href={url} download={meta.name} className="text-xs text-primary underline">
            Скачать файл
          </a>
        )}
      </div>
      <figcaption className="flex items-center justify-between gap-2 px-2 py-1 text-[11px] text-muted-foreground">
        <span className="truncate">{meta.name}</span>
        <span className="shrink-0 font-mono">{formatBytes(meta.size)}</span>
      </figcaption>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Убрать ${meta.name}`}
          className="absolute right-1 top-1 rounded-md bg-background/85 p-1.5 text-foreground hover:text-alarm"
        >
          <X className="size-4" />
        </button>
      )}
    </figure>
  );
}

export function AttachmentPicker({ onAdd }: { onAdd: (files: PendingFile[]) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const handle = (list: FileList | null) => {
    if (!list) return;
    const ok: PendingFile[] = [];
    Array.from(list).forEach((file) => {
      if (file.size > MAX_FILE_BYTES) {
        toast.error(`«${file.name}» больше ${MAX_FILE_MB} МБ — не добавлен. Сократите или сожмите видео.`);
        return;
      }
      ok.push({
        file,
        meta: { id: newId(), name: file.name, mime: file.type, size: file.size, kind: mediaKind(file.type) },
      });
    });
    if (ok.length) onAdd(ok);
    if (ref.current) ref.current.value = "";
  };
  return (
    <div>
      <input
        ref={ref}
        type="file"
        accept="image/*,video/*"
        multiple
        className="sr-only"
        id="attachment-input"
        onChange={(e) => handle(e.target.files)}
      />
      <Button type="button" variant="panel" className="w-full sm:w-auto" onClick={() => ref.current?.click()}>
        <ImagePlus /> Фото
        <span className="text-muted-foreground">/</span>
        <Video /> Видео
      </Button>
      <p className="mt-1.5 text-xs text-muted-foreground">
        До {MAX_FILE_MB} МБ на файл. Хранятся локально в браузере, в экспорт не входят.
      </p>
    </div>
  );
}
