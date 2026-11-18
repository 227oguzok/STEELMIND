import { EVENT_LABEL, type EventRecord, type EventType } from "./types";

export function matchesSearch(e: EventRecord, q: string) {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  const hay = [
    EVENT_LABEL[e.type],
    e.reason,
    e.comment,
    e.result,
    e.stands.join(" "),
    e.transition?.oldGrade,
    e.transition?.oldSize,
    e.transition?.newGrade,
    e.transition?.newSize,
    e.transition?.steel,
    e.transition?.setupNote,
    e.defect?.defectType,
    e.defect?.description,
    e.defect?.observations,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(s);
}

export interface EventFilter {
  from?: string | undefined; // YYYY-MM-DD
  to?: string | undefined; // YYYY-MM-DD
  stand?: number | undefined;
  type?: EventType | undefined;
  q?: string | undefined;
}

export function filterEvents(events: EventRecord[], f: EventFilter) {
  return events.filter((e) => {
    const day = e.datetime.slice(0, 10);
    if (f.from && day < f.from) return false;
    if (f.to && day > f.to) return false;
    if (f.stand && !e.stands.includes(f.stand)) return false;
    if (f.type && e.type !== f.type) return false;
    return matchesSearch(e, f.q ?? "");
  });
}
