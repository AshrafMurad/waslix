"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

type AnalyticsBarChartProps = {
  data: Array<{ label: string; value: number }>;
  dir?: "ltr" | "rtl";
  height?: "sm" | "md";
  locale?: string;
  valueFormat?: "number";
};

const chartConfig = {
  value: {
    color: "var(--brand)",
  },
} satisfies ChartConfig;

export function AnalyticsBarChart({
  data,
  dir = "ltr",
  height = "md",
  locale,
  valueFormat,
}: AnalyticsBarChartProps) {
  const rtl = dir === "rtl";

  return (
    <ChartContainer
      config={chartConfig}
      className={height === "sm" ? "h-44 min-w-0" : "h-56 min-w-0"}
    >
      <BarChart
        accessibilityLayer
        data={data}
        layout="vertical"
        margin={{ top: 4, right: rtl ? 4 : 12, bottom: 4, left: rtl ? 12 : 4 }}
      >
        <CartesianGrid horizontal={false} />
        <XAxis type="number" hide />
        <YAxis
          dataKey="label"
          type="category"
          tickLine={false}
          axisLine={false}
          orientation={rtl ? "right" : "left"}
          tick={{ textAnchor: rtl ? "end" : "end" }}
          width={96}
        />
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
                    {valueFormat === "number" && typeof value === "number"
                      ? new Intl.NumberFormat(locale).format(value)
                      : value}
                  </span>
                </>
              )}
            />
          }
        />
        <Bar dataKey="value" fill="var(--color-value)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
