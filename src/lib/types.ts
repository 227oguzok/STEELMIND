/** Number of stands on the neutral schematic. Real configuration is not confirmed yet. */
export const STAND_COUNT = 16;
export const STANDS: number[] = Array.from({ length: STAND_COUNT }, (_, i) => i + 1);

export type EventType =
  | "transition"
  | "press"
  | "release"
  | "rollchange"
  | "fault"
  | "defect"
  | "note";

export const EVENT_TYPES: { value: EventType; label: string; hint: string }[] = [
  { value: "transition", label: "Переход", hint: "Строго смена сортамента или размера проката" },
  { value: "press", label: "Прижатие клети", hint: "Фиксация выполненного прижатия по распоряжению" },
  { value: "release", label: "Отжимание клети", hint: "Фиксация выполненного отжимания по распоряжению" },
  { value: "rollchange", label: "Перевалка", hint: "Замена валков / узлов клети" },
  { value: "fault", label: "Неисправность", hint: "Обнаруженная неисправность оборудования" },
  { value: "defect", label: "Дефект", hint: "Дефект проката: тип, место, симметрия" },
  { value: "note", label: "Примечание", hint: "Произвольная заметка смены" },
];

export const EVENT_LABEL: Record<EventType, string> = Object.fromEntries(
  EVENT_TYPES.map((t) => [t.value, t.label]),
) as Record<EventType, string>;

export function isEventType(v: unknown): v is EventType {
  return typeof v === "string" && v in EVENT_LABEL;
}

/** Types where a stand number is mandatory. */
export const STAND_REQUIRED: EventType[] = ["press", "release", "rollchange"];

export type Param = "rpm" | "current" | "speed";
export const PARAM_KEYS: Param[] = ["rpm", "current", "speed"];
export const PARAMS: Record<Param, { label: string; unit: string }> = {
  rpm: { label: "Обороты", unit: "об/мин" },
  current: { label: "Ток", unit: "А" },
  speed: { label: "Скорость", unit: "м/с" },
};

export type ParamValues = Partial<Record<Param, number>>;

export interface AttachmentMeta {
  id: string;
  name: string;
  mime: string;
  size: number;
  kind: "image" | "video" | "other";
}

export interface TransitionInfo {
  oldGrade: string;
  oldSize: string;
  newGrade: string;
  newSize: string;
  steel: string;
  setupNote: string;
}

export type DefectLocation = "" | "head" | "body" | "tail";
export const DEFECT_LOCATIONS: { value: Exclude<DefectLocation, "">; label: string }[] = [
  { value: "head", label: "Голова" },
  { value: "body", label: "Тело" },
  { value: "tail", label: "Хвост" },
];

export type Symmetry = "unknown" | "symmetric" | "asymmetric";
export const SYMMETRY_OPTIONS: { value: Symmetry; label: string }[] = [
  { value: "unknown", label: "Не определено" },
  { value: "symmetric", label: "Симметричный" },
  { value: "asymmetric", label: "Несимметричный" },
];

export const DEFECT_TYPES = [
  "Плена",
  "Закат",
  "Трещина",
  "Рванина",
  "Волосовина",
  "Вмятина / отпечаток",
  "Риска / царапина",
  "Окалина вкатанная",
  "Ус",
  "Нарушение геометрии",
  "Скручивание",
  "Другое",
];

export interface DefectInfo {
  defectType: string;
  location: DefectLocation;
  symmetry: Symmetry;
  description: string;
  observations: string;
}

export interface EventRecord {
  id: string;
  type: EventType;
  /** Local date-time "YYYY-MM-DDTHH:mm". */
  datetime: string;
  stands: number[];
  reason: string;
  comment: string;
  before: ParamValues;
  after: ParamValues;
  result: string;
  attachments: AttachmentMeta[];
  transition?: TransitionInfo;
  defect?: DefectInfo;
  demo?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type EventDraft = Omit<EventRecord, "id" | "createdAt" | "updatedAt" | "attachments">;

export interface Reading {
  id: string;
  datetime: string;
  stand: number;
  values: ParamValues;
  note: string;
  demo?: boolean;
  createdAt: string;
}

/** Reference range entered by the user from an official document. Never invented by the app. */
export interface ReferenceRange {
  id: string;
  stand: number;
  param: Param;
  min?: number;
  max?: number;
  source: string;
}
