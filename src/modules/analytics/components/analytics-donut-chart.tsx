"use client";

import { Cell, Pie, PieChart } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

type AnalyticsDonutChartProps = {
  data: Array<{ label: string; value: number; color?: string }>;
  locale: string;
};

const chartConfig = {
  value: {
    color: "var(--brand)",
  },
} satisfies ChartConfig;

const fallbackColors = [
  "var(--healthy)",
  "var(--attention)",
  "var(--risk)",
  "var(--muted-foreground)",
];

export function AnalyticsDonutChart({
  data,
  locale,
}: AnalyticsDonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const numberFormat = new Intl.NumberFormat(locale);

  return (
    <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_12rem] sm:items-center">
      <ChartContainer config={chartConfig} className="h-56 min-w-0">
        <PieChart accessibilityLayer>
          <ChartTooltip
            content={
              <ChartTooltipContent
                hideLabel
                formatter={(value, _name, _item, _index, payload) => (
                  <>
                    <span className="text-muted-foreground">
                      {(payload as { label?: string } | undefined)?.label}
                    </span>
                    <span className="text-foreground ms-auto font-mono font-medium tabular-nums">
                      {typeof value === "number"
                        ? numberFormat.format(value)
                        : value}
                    </span>
                  </>
                )}
              />
            }
          />
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            innerRadius={56}
            outerRadius={84}
            paddingAngle={2}
            strokeWidth={3}
          >
            {data.map((item, index) => (
              <Cell
                key={item.label}
                fill={
                  item.color ?? fallbackColors[index % fallbackColors.length]
                }
              />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
      <div className="grid gap-2 text-sm">
        {data.map((item, index) => (
          <div
            key={item.label}
            className="flex items-center justify-between gap-3"
          >
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="size-2 rounded-full"
                style={{
                  backgroundColor:
                    item.color ?? fallbackColors[index % fallbackColors.length],
                }}
              />
              <span className="truncate">{item.label}</span>
            </span>
            <span className="font-medium tabular-nums">
              {total ? numberFormat.format(item.value) : "0"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
