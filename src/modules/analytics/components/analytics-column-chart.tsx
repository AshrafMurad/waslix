"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

type AnalyticsColumnChartProps = {
  data: Array<{ label: string; value: number }>;
  dir?: "ltr" | "rtl";
};

const chartConfig = {
  value: {
    color: "var(--brand)",
  },
} satisfies ChartConfig;

export function AnalyticsColumnChart({
  data,
  dir = "ltr",
}: AnalyticsColumnChartProps) {
  const rtl = dir === "rtl";

  return (
    <ChartContainer config={chartConfig} className="h-56 min-w-0">
      <BarChart
        accessibilityLayer
        data={data}
        margin={{ top: 8, right: rtl ? 8 : 16, bottom: 8, left: rtl ? 16 : 8 }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          interval={0}
          tickMargin={8}
          reversed={rtl}
        />
        <YAxis hide />
        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
        <Bar dataKey="value" fill="var(--color-value)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
