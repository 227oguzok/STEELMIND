import { EVENT_LABEL, PARAMS, PARAM_KEYS, type EventRecord, type ParamValues } from "./types";
import { DEFECT_LOCATIONS, SYMMETRY_OPTIONS } from "./types";

export const CSV_SEPARATOR = ";";

export function csvCell(v: unknown): string {
  const s = v === undefined || v === null ? "" : String(v);
  if (/[";\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function params(v: ParamValues) {
  return PARAM_KEYS.filter((k) => v[k] !== undefined)
    .map((k) => `${PARAMS[k].label}=${v[k]} ${PARAMS[k].unit}`)
    .join(", ");
}

export const CSV_HEADER = [
  "id",
  "Дата/время",
  "Тип",
  "Клети",
  "Причина",
  "Комментарий",
  "Параметры до",
  "Параметры после",
  "Результат",
  "Старый сортамент",
  "Старый размер",
  "Новый сортамент",
  "Новый размер",
  "Марка стали",
  "Переналадка",
  "Тип дефекта",
  "Место дефекта",
  "Симметрия",
  "Описание дефекта",
  "Наблюдения",
  "Вложения",
  "ДЕМО",
];

export function eventsToCSV(events: EventRecord[]): string {
  const rows = events.map((e) => [
    e.id,
    e.datetime,
    EVENT_LABEL[e.type],
    e.stands.join(", "),
    e.reason,
    e.comment,
    params(e.before),
    params(e.after),
    e.result,
    e.transition?.oldGrade,
    e.transition?.oldSize,
    e.transition?.newGrade,
    e.transition?.newSize,
    e.transition?.steel,
    e.transition?.setupNote,
    e.defect?.defectType,
    DEFECT_LOCATIONS.find((l) => l.value === e.defect?.location)?.label,
    e.defect ? SYMMETRY_OPTIONS.find((s) => s.value === e.defect?.symmetry)?.label : "",
    e.defect?.description,
    e.defect?.observations,
    e.attachments.map((a) => a.name).join(", "),
    e.demo ? "да" : "",
  ]);
  return [CSV_HEADER, ...rows].map((r) => r.map(csvCell).join(CSV_SEPARATOR)).join("\r\n");
}

export function downloadFile(filename: string, content: string, mime: string) {
  // BOM so spreadsheet apps detect UTF-8 Cyrillic correctly.
  const blob = new Blob([mime.startsWith("text/csv") ? "\uFEFF" + content : content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function stamp(d = new Date()) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}
