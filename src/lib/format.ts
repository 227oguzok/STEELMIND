export function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** Local "YYYY-MM-DDTHH:mm" for datetime-local inputs. */
export function toLocalInput(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatDateTime(s: string) {
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatTime(s: string) {
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatNumber(v: number | undefined | null, maxDigits = 2) {
  if (v === undefined || v === null || !Number.isFinite(v)) return "—";
  return v.toLocaleString("ru-RU", { maximumFractionDigits: maxDigits });
}

export function formatBytes(n: number) {
  if (n < 1024) return `${n} Б`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} КБ`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} МБ`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} ГБ`;
}

/** undefined = empty, null = not a number. Accepts comma decimals. */
export function parseNum(s: string): number | undefined | null {
  const t = s.trim().replace(",", ".");
  if (t === "") return undefined;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
