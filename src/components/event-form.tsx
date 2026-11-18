import { useState, type FormEvent } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { Field, inputCls, textareaCls } from "./field";
import { StandPicker } from "./stand-picker";
import { AttachmentPicker, MediaThumb, type PendingFile } from "./media";
import { deleteMedia, putMedia } from "@/lib/media";
import { newId, parseNum, toLocalInput } from "@/lib/format";
import { store, StorageError } from "@/lib/store";
import { validateEvent, type Errors } from "@/lib/validation";
import {
  DEFECT_LOCATIONS,
  DEFECT_TYPES,
  EVENT_TYPES,
  PARAMS,
  PARAM_KEYS,
  STAND_REQUIRED,
  SYMMETRY_OPTIONS,
  type AttachmentMeta,
  type DefectInfo,
  type EventDraft,
  type EventRecord,
  type EventType,
  type Param,
  type ParamValues,
  type TransitionInfo,
} from "@/lib/types";
import { cn } from "@/lib/utils";

type ParamText = Record<Param, string>;

const emptyTransition: TransitionInfo = { oldGrade: "", oldSize: "", newGrade: "", newSize: "", steel: "", setupNote: "" };
const emptyDefect: DefectInfo = { defectType: "", location: "", symmetry: "unknown", description: "", observations: "" };

function toText(v: ParamValues): ParamText {
  return {
    rpm: v.rpm?.toString() ?? "",
    current: v.current?.toString() ?? "",
    speed: v.speed?.toString() ?? "",
  };
}

function fromText(t: ParamText): ParamValues {
  const out: ParamValues = {};
  for (const k of PARAM_KEYS) {
    const n = parseNum(t[k]);
    if (n === null) out[k] = Number.NaN;
    else if (n !== undefined) out[k] = n;
  }
  return out;
}

export function EventForm({
  initial,
  lockedType,
  defaultType = "note",
  submitLabel = "Сохранить запись",
  onSaved,
  onCancel,
}: {
  initial?: EventRecord | undefined;
  lockedType?: EventType | undefined;
  defaultType?: EventType | undefined;
  submitLabel?: string | undefined;
  onSaved: (rec: EventRecord) => void;
  onCancel?: (() => void) | undefined;
}) {
  const [type, setType] = useState<EventType>(initial?.type ?? lockedType ?? defaultType);
  const [datetime, setDatetime] = useState(() => initial?.datetime ?? toLocalInput(new Date()));
  const [stands, setStands] = useState<number[]>(initial?.stands ?? []);
  const [reason, setReason] = useState(initial?.reason ?? "");
  const [comment, setComment] = useState(initial?.comment ?? "");
  const [result, setResult] = useState(initial?.result ?? "");
  const [before, setBefore] = useState<ParamText>(toText(initial?.before ?? {}));
  const [after, setAfter] = useState<ParamText>(toText(initial?.after ?? {}));
  const [transition, setTransition] = useState<TransitionInfo>(initial?.transition ?? emptyTransition);
  const [defect, setDefect] = useState<DefectInfo>(initial?.defect ?? emptyDefect);
  const [kept, setKept] = useState<AttachmentMeta[]>(initial?.attachments ?? []);
  const [removed, setRemoved] = useState<AttachmentMeta[]>([]);
  const [pending, setPending] = useState<PendingFile[]>([]);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [showParams, setShowParams] = useState(
    () => Object.keys(initial?.before ?? {}).length + Object.keys(initial?.after ?? {}).length > 0,
  );

  const typeInfo = EVENT_TYPES.find((t) => t.value === type);
  const standLabel = type === "transition" ? "Затронутые клети" : "Клеть";

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    const draft: EventDraft = {
      type,
      datetime,
      stands,
      reason: reason.trim(),
      comment: comment.trim(),
      result: result.trim(),
      before: fromText(before),
      after: fromText(after),
      transition: type === "transition" ? transition : undefined,
      defect: type === "defect" ? defect : undefined,
      demo: initial?.demo,
    };
    const errs = validateEvent(draft);
    setErrors(errs);
    if (Object.keys(errs).length) {
      if (errs["before.rpm"] || errs["before.current"] || errs["before.speed"] || errs["after.rpm"] || errs["after.current"] || errs["after.speed"]) {
        setShowParams(true);
      }
      toast.error("Проверьте выделенные поля");
      return;
    }
    setSaving(true);
    try {
      const saved: AttachmentMeta[] = [];
      for (const p of pending) {
        try {
          await putMedia(p.meta.id, p.file);
          saved.push(p.meta);
        } catch {
          toast.error(`Не удалось сохранить «${p.meta.name}» — недостаточно места в браузере`);
        }
      }
      const now = new Date().toISOString();
      const rec: EventRecord = {
        ...draft,
        id: initial?.id ?? newId(),
        attachments: [...kept, ...saved],
        createdAt: initial?.createdAt ?? now,
        updatedAt: now,
      };
      store.upsertEvent(rec);
      if (removed.length) await deleteMedia(removed.map((r) => r.id)).catch(() => {});
      onSaved(rec);
    } catch (e) {
      toast.error(e instanceof StorageError ? e.message : "Не удалось сохранить запись");
    } finally {
      setSaving(false);
    }
  };

  const paramGrid = (label: string, prefix: "before" | "after", value: ParamText, set: (v: ParamText) => void) => (
    <div className="space-y-2">
      <p className="label-caps">{label}</p>
      <div className="grid grid-cols-3 gap-2">
        {PARAM_KEYS.map((k) => (
          <Field key={k} label={`${PARAMS[k].label}, ${PARAMS[k].unit}`} htmlFor={`${prefix}-${k}`} error={errors[`${prefix}.${k}`]}>
            <Input
              id={`${prefix}-${k}`}
              inputMode="decimal"
              className={cn(inputCls, "font-mono")}
              value={value[k]}
              onChange={(e) => set({ ...value, [k]: e.target.value })}
            />
          </Field>
        ))}
      </div>
    </div>
  );

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      {!lockedType && (
        <Field label="Тип события" htmlFor="ev-type" hint={typeInfo?.hint}>
          <NativeSelect id="ev-type" value={type} onChange={(e) => setType(e.target.value as EventType)}>
            {EVENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </NativeSelect>
        </Field>
      )}

      <Field label="Дата и время" htmlFor="ev-dt" error={errors["datetime"]}>
        <Input id="ev-dt" type="datetime-local" className={inputCls} value={datetime} onChange={(e) => setDatetime(e.target.value)} />
      </Field>

      <Field
        label={`${standLabel}${STAND_REQUIRED.includes(type) ? " *" : " (если применимо)"}`}
        error={errors["stands"]}
        hint="Нумерация по нейтральной схеме из 16 клетей — конфигурация уточняется"
      >
        <StandPicker value={stands} onChange={setStands} multiple={type === "transition" || type === "note" || type === "fault"} />
      </Field>

      {type === "transition" && (
        <div className="space-y-4 rounded-lg border border-ok/30 bg-ok/5 p-3">
          <p className="text-xs text-ok">«Переход» — строго смена сортамента или размера проката.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Старый сортамент" htmlFor="tr-og" error={errors["transition.old"]}>
              <Input id="tr-og" className={inputCls} value={transition.oldGrade} onChange={(e) => setTransition({ ...transition, oldGrade: e.target.value })} />
            </Field>
            <Field label="Старый размер" htmlFor="tr-os">
              <Input id="tr-os" className={inputCls} value={transition.oldSize} onChange={(e) => setTransition({ ...transition, oldSize: e.target.value })} />
            </Field>
            <Field label="Новый сортамент" htmlFor="tr-ng" error={errors["transition.new"]}>
              <Input id="tr-ng" className={inputCls} value={transition.newGrade} onChange={(e) => setTransition({ ...transition, newGrade: e.target.value })} />
            </Field>
            <Field label="Новый размер" htmlFor="tr-ns">
              <Input id="tr-ns" className={inputCls} value={transition.newSize} onChange={(e) => setTransition({ ...transition, newSize: e.target.value })} />
            </Field>
          </div>
          <Field label="Марка стали (если известна)" htmlFor="tr-st">
            <Input id="tr-st" className={inputCls} value={transition.steel} onChange={(e) => setTransition({ ...transition, steel: e.target.value })} />
          </Field>
          <Field label="Комментарий о переналадке" htmlFor="tr-note">
            <Textarea id="tr-note" className={textareaCls} value={transition.setupNote} onChange={(e) => setTransition({ ...transition, setupNote: e.target.value })} />
          </Field>
        </div>
      )}

      {type === "defect" && (
        <div className="space-y-4 rounded-lg border border-warn/30 bg-warn/5 p-3">
          <Field label="Тип дефекта *" htmlFor="df-type" error={errors["defect.defectType"]}>
            <NativeSelect id="df-type" value={defect.defectType} onChange={(e) => setDefect({ ...defect, defectType: e.target.value })}>
              <option value="">— выберите —</option>
              {DEFECT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Где проявился">
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Где проявился дефект">
              {DEFECT_LOCATIONS.map((l) => {
                const on = defect.location === l.value;
                return (
                  <button
                    key={l.value}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setDefect({ ...defect, location: on ? "" : l.value })}
                    className={cn(
                      "h-11 rounded-md border text-sm transition-colors",
                      on ? "border-primary bg-primary/15 text-primary" : "border-border bg-panel text-muted-foreground",
                    )}
                  >
                    {l.label}
                  </button>
                );
              })}
            </div>
          </Field>
          <Field label="Симметрия" htmlFor="df-sym">
            <NativeSelect id="df-sym" value={defect.symmetry} onChange={(e) => setDefect({ ...defect, symmetry: e.target.value as DefectInfo["symmetry"] })}>
              {SYMMETRY_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Описание дефекта" htmlFor="df-desc">
            <Textarea id="df-desc" className={textareaCls} value={defect.description} onChange={(e) => setDefect({ ...defect, description: e.target.value })} />
          </Field>
          <Field label="Наблюдения оператора" htmlFor="df-obs" hint="Что заметили до и после появления дефекта">
            <Textarea id="df-obs" className={textareaCls} value={defect.observations} onChange={(e) => setDefect({ ...defect, observations: e.target.value })} />
          </Field>
        </div>
      )}

      <Field label="Причина" htmlFor="ev-reason">
        <Input id="ev-reason" className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)} />
      </Field>
      <Field label="Комментарий" htmlFor="ev-comment" error={errors["comment"]}>
        <Textarea id="ev-comment" className={textareaCls} value={comment} onChange={(e) => setComment(e.target.value)} />
      </Field>

      <div className="rounded-lg border border-border p-3">
        <button type="button" className="flex w-full items-center justify-between text-left" onClick={() => setShowParams((v) => !v)} aria-expanded={showParams}>
          <span className="label-caps">Параметры до / после (если измерены)</span>
          <span className="text-xs text-primary">{showParams ? "Скрыть" : "Показать"}</span>
        </button>
        {showParams && (
          <div className="mt-3 space-y-4">
            {paramGrid("До", "before", before, setBefore)}
            {paramGrid("После", "after", after, setAfter)}
            <p className="text-xs text-muted-foreground">Вносятся только фактически считанные значения. Приложение не рекомендует уставки.</p>
          </div>
        )}
      </div>

      <Field label="Результат" htmlFor="ev-result">
        <Input id="ev-result" className={inputCls} value={result} onChange={(e) => setResult(e.target.value)} />
      </Field>

      <Field label="Вложения">
        <div className="space-y-3">
          <AttachmentPicker onAdd={(files) => setPending((p) => [...p, ...files])} />
          {(kept.length > 0 || pending.length > 0) && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {kept.map((m) => (
                <MediaThumb
                  key={m.id}
                  meta={m}
                  onRemove={() => {
                    setKept((k) => k.filter((x) => x.id !== m.id));
                    setRemoved((r) => [...r, m]);
                  }}
                />
              ))}
              {pending.map((p) => (
                <MediaThumb key={p.meta.id} meta={p.meta} file={p.file} onRemove={() => setPending((x) => x.filter((y) => y.meta.id !== p.meta.id))} />
              ))}
            </div>
          )}
        </div>
      </Field>

      <div className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-10 -mx-1 flex gap-2 rounded-lg border border-border bg-background/95 p-2 backdrop-blur md:static md:border-0 md:bg-transparent md:p-0">
        {onCancel && (
          <Button type="button" variant="outline" size="lg" onClick={onCancel}>
            Отмена
          </Button>
        )}
        <Button type="submit" size="lg" className="flex-1 md:flex-none" disabled={saving}>
          <Save /> {saving ? "Сохранение…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
