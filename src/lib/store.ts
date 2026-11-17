import { useSyncExternalStore } from "react";
import type { EventRecord, Reading, ReferenceRange } from "./types";
import { buildDemo } from "./demo";
import { deleteMedia } from "./media";

export interface AppData {
  events: EventRecord[];
  readings: Reading[];
  refs: ReferenceRange[];
  lessonsDone: string[];
}

const KEY = "steelmind.data.v1";
const SEED_KEY = "steelmind.demoSeeded.v1";
const EMPTY: AppData = { events: [], readings: [], refs: [], lessonsDone: [] };

let cache: AppData | null = null;
const listeners = new Set<() => void>();

function arr<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

function normalize(x: unknown): AppData {
  const o = (x ?? {}) as Partial<AppData>;
  return {
    events: arr<EventRecord>(o.events),
    readings: arr<Reading>(o.readings),
    refs: arr<ReferenceRange>(o.refs),
    lessonsDone: arr<string>(o.lessonsDone),
  };
}

function read(): AppData {
  if (cache) return cache;
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = raw ? normalize(JSON.parse(raw)) : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache;
}

export class StorageError extends Error {}

function write(next: AppData) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    throw new StorageError(
      "Не удалось сохранить: хранилище браузера переполнено или недоступно. Сделайте экспорт и удалите лишние записи.",
    );
  }
  cache = next;
  listeners.forEach((l) => l());
}

function update(fn: (d: AppData) => AppData) {
  write(fn(read()));
}

function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      l();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
}

/** Hydration-safe: server and first client render see empty data, then the stored data. */
export function useAppData(): AppData {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function sortByDateDesc<T extends { datetime: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => b.datetime.localeCompare(a.datetime));
}

export const store = {
  getEvent(id: string) {
    return read().events.find((e) => e.id === id);
  },
  upsertEvent(rec: EventRecord) {
    update((d) => {
      const exists = d.events.some((e) => e.id === rec.id);
      return {
        ...d,
        events: exists ? d.events.map((e) => (e.id === rec.id ? rec : e)) : [rec, ...d.events],
      };
    });
  },
  async deleteEvent(id: string) {
    const rec = read().events.find((e) => e.id === id);
    update((d) => ({ ...d, events: d.events.filter((e) => e.id !== id) }));
    if (rec?.attachments.length) await deleteMedia(rec.attachments.map((a) => a.id)).catch(() => {});
  },
  addReading(r: Reading) {
    update((d) => ({ ...d, readings: [r, ...d.readings] }));
  },
  deleteReading(id: string) {
    update((d) => ({ ...d, readings: d.readings.filter((r) => r.id !== id) }));
  },
  upsertRef(r: ReferenceRange) {
    update((d) => ({
      ...d,
      refs: [...d.refs.filter((x) => !(x.stand === r.stand && x.param === r.param)), r],
    }));
  },
  deleteRef(id: string) {
    update((d) => ({ ...d, refs: d.refs.filter((r) => r.id !== id) }));
  },
  toggleLesson(id: string) {
    update((d) => ({
      ...d,
      lessonsDone: d.lessonsDone.includes(id)
        ? d.lessonsDone.filter((x) => x !== id)
        : [...d.lessonsDone, id],
    }));
  },
  loadDemo() {
    const demo = buildDemo();
    update((d) => ({
      ...d,
      events: [...d.events.filter((e) => !e.demo), ...demo.events],
      readings: [...d.readings.filter((r) => !r.demo), ...demo.readings],
    }));
    window.localStorage.setItem(SEED_KEY, "1");
  },
  async removeDemo() {
    const media = read()
      .events.filter((e) => e.demo)
      .flatMap((e) => e.attachments.map((a) => a.id));
    update((d) => ({
      ...d,
      events: d.events.filter((e) => !e.demo),
      readings: d.readings.filter((r) => !r.demo),
    }));
    window.localStorage.setItem(SEED_KEY, "1");
    await deleteMedia(media).catch(() => {});
  },
  ensureSeeded() {
    if (window.localStorage.getItem(SEED_KEY)) return;
    store.loadDemo();
  },
  exportBackup() {
    const d = read();
    return {
      app: "STEELMIND",
      version: 1,
      exportedAt: new Date().toISOString(),
      note: "Медиафайлы (фото/видео) в резервную копию не входят — они хранятся только в этом браузере.",
      ...d,
    };
  },
  /** Merge a backup by id. Returns counts of added/updated items. */
  importBackup(raw: unknown) {
    if (!raw || typeof raw !== "object") throw new Error("Файл не похож на резервную копию STEELMIND");
    const incoming = normalize(raw);
    const valid = incoming.events.filter(
      (e) => e && typeof e.id === "string" && typeof e.type === "string" && typeof e.datetime === "string",
    );
    const validReadings = incoming.readings.filter(
      (r) => r && typeof r.id === "string" && typeof r.stand === "number",
    );
    update((d) => {
      const evMap = new Map(d.events.map((e) => [e.id, e]));
      valid.forEach((e) =>
        evMap.set(e.id, {
          ...e,
          stands: arr<number>(e.stands),
          before: e.before ?? {},
          after: e.after ?? {},
          attachments: arr(e.attachments),
        }),
      );
      const rdMap = new Map(d.readings.map((r) => [r.id, r]));
      validReadings.forEach((r) => rdMap.set(r.id, { ...r, values: r.values ?? {} }));
      const refMap = new Map(d.refs.map((r) => [`${r.stand}:${r.param}`, r]));
      incoming.refs.forEach((r) => r && refMap.set(`${r.stand}:${r.param}`, r));
      return {
        events: [...evMap.values()],
        readings: [...rdMap.values()],
        refs: [...refMap.values()],
        lessonsDone: [...new Set([...d.lessonsDone, ...incoming.lessonsDone])],
      };
    });
    return { events: valid.length, readings: validReadings.length };
  },
};
