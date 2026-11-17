import { STANDS, type EventRecord, type Reading } from "./types";
import { newId, toLocalInput } from "./format";

/** Clearly-labelled conditional demo data. Not real mill parameters. */
export function buildDemo(now = new Date()): { events: EventRecord[]; readings: Reading[] } {
  const at = (minutesAgo: number) => toLocalInput(new Date(now.getTime() - minutesAgo * 60000));
  const created = now.toISOString();
  const base = {
    reason: "",
    comment: "",
    before: {},
    after: {},
    result: "",
    attachments: [],
    demo: true,
    createdAt: created,
    updatedAt: created,
  };

  const events: EventRecord[] = [
    {
      ...base,
      id: newId(),
      type: "transition",
      datetime: at(360),
      stands: [10, 11, 12, 13, 14, 15, 16],
      reason: "ДЕМО: плановая смена сортамента по заданию",
      result: "Выполнено (условно)",
      transition: {
        oldGrade: "Сортамент А (ДЕМО)",
        oldSize: "Размер 1 (условный)",
        newGrade: "Сортамент Б (ДЕМО)",
        newSize: "Размер 2 (условный)",
        steel: "",
        setupNote: "ДЕМО: переналадка по техкарте. Условная запись для демонстрации.",
      },
    },
    { ...base, id: newId(), type: "press", datetime: at(300), stands: [7], reason: "ДЕМО: пример записи о прижатии", comment: "Выполнено по распоряжению мастера (условно)" },
    { ...base, id: newId(), type: "release", datetime: at(270), stands: [7], reason: "ДЕМО: пример записи об отжимании" },
    { ...base, id: newId(), type: "rollchange", datetime: at(180), stands: [12], reason: "ДЕМО: плановая перевалка", result: "Завершено (условно)" },
    {
      ...base,
      id: newId(),
      type: "fault",
      datetime: at(120),
      stands: [5],
      reason: "ДЕМО: пример неисправности",
      comment: "Условная запись. Сообщено ответственному персоналу.",
      result: "Передано в службу",
    },
    {
      ...base,
      id: newId(),
      type: "defect",
      datetime: at(60),
      stands: [9],
      defect: {
        defectType: "Закат",
        location: "body",
        symmetry: "asymmetric",
        description: "ДЕМО: пример описания дефекта",
        observations: "",
      },
    },
    { ...base, id: newId(), type: "note", datetime: at(30), stands: [], comment: "ДЕМО: пример примечания к смене" },
  ];

  const readings: Reading[] = [];
  for (const s of STANDS) {
    for (let k = 0; k < 10; k++) {
      let current = Math.round(380 + s * 18 + 12 * Math.sin(k * 0.7 + s));
      if (s === 5 && k === 7) current += 140; // demonstrates a statistical outlier
      readings.push({
        id: newId(),
        datetime: at((9 - k) * 45),
        stand: s,
        values: {
          rpm: Math.round(60 + s * 35 + 4 * Math.sin(k + s)),
          current,
          speed: Math.round((0.4 + s * 0.45 + 0.03 * Math.sin(k)) * 100) / 100,
        },
        note: "ДЕМО: условное значение",
        demo: true,
        createdAt: created,
      });
    }
  }
  return { events, readings };
}
