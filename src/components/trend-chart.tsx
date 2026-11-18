import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatDateTime, formatNumber, formatTime } from "@/lib/format";
import type { Flag } from "@/lib/analysis";

export interface TrendPoint {
  id: string;
  datetime: string;
  value: number;
}

export function TrendChart({
  points,
  unit,
  flags = {},
  refRange,
  height = 220,
}: {
  points: TrendPoint[];
  unit: string;
  flags?: Record<string, Flag> | undefined;
  refRange?: { min?: number | undefined; max?: number | undefined } | undefined;
  height?: number | undefined;
}) {
  const data = [...points].sort((a, b) => a.datetime.localeCompare(b.datetime));
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="datetime"
            tickFormatter={formatTime}
            stroke="var(--muted-foreground)"
            tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }}
            minTickGap={24}
          />
          <YAxis
            stroke="var(--muted-foreground)"
            tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }}
            width={52}
            domain={["auto", "auto"]}
          />
          {refRange && (refRange.min !== undefined || refRange.max !== undefined) && (
            <ReferenceArea
              {...(refRange.min !== undefined ? { y1: refRange.min } : {})}
              {...(refRange.max !== undefined ? { y2: refRange.max } : {})}
              fill="var(--ok)"
              fillOpacity={0.08}
              stroke="var(--ok)"
              strokeOpacity={0.4}
              strokeDasharray="4 4"
              ifOverflow="extendDomain"
            />
          )}
          <Tooltip
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              fontSize: 12,
            }}
            labelFormatter={(l) => formatDateTime(String(l))}
            formatter={(v) => [`${formatNumber(Number(v))} ${unit}`, "Значение"]}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="var(--ok)"
            strokeWidth={2}
            dot={{ r: 2.5, fill: "var(--ok)", strokeWidth: 0 }}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
          />
          {data
            .filter((p) => flags[p.id])
            .map((p) => (
              <ReferenceDot
                key={p.id}
                x={p.datetime}
                y={p.value}
                r={6}
                fill={flags[p.id] === "out-of-range" ? "var(--alarm)" : "var(--warn)"}
                stroke="var(--background)"
              />
            ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
