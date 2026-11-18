import { describe, expect, it } from "vitest";
import { validateEvent, validateReading } from "@/lib/validation";
import { assessSeries, ASSESSMENT_TEXT } from "@/lib/analysis";
import { csvCell, eventsToCSV } from "@/lib/export";
import type { EventDraft, EventRecord } from "@/lib/types";

const base: EventDraft = {
  type: "note",
  datetime: "2026-11-18T10:00",
  stands: [],
  reason: "",
  comment: "",
  before: {},
  after: {},
  result: "",
};

const tr = (o: Partial<NonNullable<EventDraft["transition"]>>) => ({
  ...base,
  type: "transition" as const,
  transition: { oldGrade: "", oldSize: "", newGrade: "", newSize: "", steel: "", setupNote: "", ...o },
});

describe("Переход — строго смена сортамента или размера", () => {
  it("требует старое и новое значение", () => {
    const e = validateEvent(tr({}));
    expect(e["transition.old"]).toBeTruthy();
    expect(e["transition.new"]).toBeTruthy();
  });
  it("отклоняет одинаковые сортамент и размер", () => {
    expect(validateEvent(tr({ oldGrade: "А", oldSize: "1", newGrade: "а", newSize: "1" }))["transition.new"]).toMatch(/отличаться/);
  });
  it("принимает смену только размера", () => {
    expect(validateEvent(tr({ oldGrade: "А", oldSize: "1", newGrade: "А", newSize: "2" }))).toEqual({});
  });
});

describe("Клеть обязательна для прижатия, отжимания, перевалки", () => {
  it.each(["press", "release", "rollchange"] as const)("%s без клети — ошибка", (type) => {
    expect(validateEvent({ ...base, type })["stands"]).toBe("Укажите номер клети");
  });
  it("с клетью — без ошибки", () => {
    expect(validateEvent({ ...base, type: "press", stands: [3] })).toEqual({});
  });
});

describe("Показания", () => {
  it("нужно хотя бы одно значение", () => {
    expect(validateReading({ stand: 1, datetime: base.datetime, values: {} })["values"]).toBeTruthy();
  });
});

describe("Норма не выдумывается", () => {
  const pts = (vals: number[]) => vals.map((v, i) => ({ id: String(i), value: v }));
  it("без эталона и при малом числе точек — недостаточно данных", () => {
    const a = assessSeries(pts([1, 2, 3, 100]));
    expect(a.status).toBe("insufficient");
    expect(a.flags).toEqual({});
    expect(ASSESSMENT_TEXT.insufficient).toBe("Недостаточно данных для оценки нормы");
  });
  it("эталон пользователя: значения вне диапазона отмечаются", () => {
    const a = assessSeries(pts([5, 12]), { min: 0, max: 10 });
    expect(a.flags).toEqual({ "1": "out-of-range" });
  });
});

describe("CSV", () => {
  it("экранирует разделитель и кавычки", () => {
    expect(csvCell('a;"b"')).toBe('"a;""b"""');
  });
  it("содержит тип по-русски", () => {
    const rec: EventRecord = { ...base, id: "x", attachments: [], createdAt: "", updatedAt: "" };
    expect(eventsToCSV([rec]).split("\r\n")[1]).toContain("Примечание");
  });
});
