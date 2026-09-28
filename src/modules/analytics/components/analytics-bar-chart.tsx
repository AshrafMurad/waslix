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
};

const chartConfig = {
  value: {
    color: "var(--brand)",
  },
} satisfies ChartConfig;

export function AnalyticsBarChart({ data }: AnalyticsBarChartProps) {
  return (
    <ChartContainer config={chartConfig} className="h-56 w-full">
      <BarChart accessibilityLayer data={data} layout="vertical">
        <CartesianGrid horizontal={false} />
        <XAxis type="number" hide />
        <YAxis
          dataKey="label"
          type="category"
          tickLine={false}
          axisLine={false}
          width={120}
        />
        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
        <Bar dataKey="value" fill="var(--color-value)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
