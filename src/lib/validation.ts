import { PARAM_KEYS, STAND_REQUIRED, type EventDraft, type ParamValues } from "./types";

export type Errors = Record<string, string>;

function norm(s: string | undefined) {
  return (s ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function checkParams(prefix: string, v: ParamValues, errors: Errors) {
  for (const k of PARAM_KEYS) {
    const n = v[k];
    if (n !== undefined && !Number.isFinite(n)) errors[`${prefix}.${k}`] = "Введите число";
  }
}

export function validateEvent(d: EventDraft): Errors {
  const errors: Errors = {};
  if (!d.datetime || Number.isNaN(new Date(d.datetime).getTime())) {
    errors["datetime"] = "Укажите дату и время";
  }

  if (STAND_REQUIRED.includes(d.type) && d.stands.length === 0) {
    errors["stands"] = "Укажите номер клети";
  }

  if (d.type === "transition") {
    const t = d.transition;
    const oldSet = norm(t?.oldGrade) || norm(t?.oldSize);
    const newSet = norm(t?.newGrade) || norm(t?.newSize);
    if (!oldSet) errors["transition.old"] = "Укажите прежний сортамент или размер";
    if (!newSet) errors["transition.new"] = "Укажите новый сортамент или размер";
    if (
      oldSet &&
      newSet &&
      norm(t?.oldGrade) === norm(t?.newGrade) &&
      norm(t?.oldSize) === norm(t?.newSize)
    ) {
      errors["transition.new"] =
        "«Переход» — это только смена сортамента или размера: новое значение должно отличаться";
    }
  }

  if (d.type === "defect" && !d.defect?.defectType.trim()) {
    errors["defect.defectType"] = "Выберите тип дефекта";
  }

  if ((d.type === "fault" || d.type === "note") && !d.reason.trim() && !d.comment.trim()) {
    errors["comment"] = "Заполните причину или комментарий";
  }

  checkParams("before", d.before, errors);
  checkParams("after", d.after, errors);
  return errors;
}

export interface ReadingInput {
  stand: number;
  datetime: string;
  values: ParamValues;
}

export function validateReading(r: ReadingInput): Errors {
  const errors: Errors = {};
  if (!Number.isInteger(r.stand) || r.stand < 1) errors["stand"] = "Выберите клеть";
  if (!r.datetime || Number.isNaN(new Date(r.datetime).getTime())) errors["datetime"] = "Укажите дату и время";
  const filled = PARAM_KEYS.filter((k) => r.values[k] !== undefined);
  if (filled.length === 0) errors["values"] = "Введите хотя бы одно значение";
  checkParams("values", r.values, errors);
  return errors;
}
