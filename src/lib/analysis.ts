/**
 * Deviation assessment strictly from user-entered data.
 * The app never invents a norm or setpoint.
 */
export const MIN_POINTS_FOR_STATS = 5;
export const SIGMA_K = 2;

export type Flag = "out-of-range" | "stat-outlier";

export interface Assessment {
  status: "insufficient" | "reference" | "statistics";
  flags: Record<string, Flag>;
  mean?: number | undefined;
  sd?: number | undefined;
  count: number;
}

export interface Point {
  id: string;
  value: number;
}

export function assessSeries(points: Point[], ref?: { min?: number | undefined; max?: number | undefined }): Assessment {
  const flags: Record<string, Flag> = {};
  const count = points.length;
  const hasRef = ref && (ref.min !== undefined || ref.max !== undefined);

  if (hasRef) {
    for (const p of points) {
      if ((ref.min !== undefined && p.value < ref.min) || (ref.max !== undefined && p.value > ref.max)) {
        flags[p.id] = "out-of-range";
      }
    }
    return { status: "reference", flags, count };
  }

  if (count < MIN_POINTS_FOR_STATS) return { status: "insufficient", flags, count };

  const mean = points.reduce((s, p) => s + p.value, 0) / count;
  const variance = points.reduce((s, p) => s + (p.value - mean) ** 2, 0) / (count - 1);
  const sd = Math.sqrt(variance);
  if (sd > 0) {
    for (const p of points) {
      if (Math.abs(p.value - mean) > SIGMA_K * sd) flags[p.id] = "stat-outlier";
    }
  }
  return { status: "statistics", flags, mean, sd, count };
}

export const ASSESSMENT_TEXT: Record<Assessment["status"], string> = {
  insufficient: "Недостаточно данных для оценки нормы",
  reference: "Сравнение с эталонным диапазоном, введённым пользователем",
  statistics:
    "Эталонный диапазон не задан — норма не оценивается. Отмечены значения за пределами ±2σ относительно введённых данных",
};
