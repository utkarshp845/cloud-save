"use client";

import * as React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ServiceCost } from "@/types/aws";

interface ServiceBreakdownChartProps {
  data: ServiceCost[];
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7300",
  "#00ff00",
];

export function ServiceBreakdownChart({ data }: ServiceBreakdownChartProps) {
  const chartData = data.map((item) => ({
    name: item.service.replace("Amazon ", "").replace("AWS ", ""),
    value: item.amount,
    percentage: item.percentage,
  }));

  const renderLabel = (entry: { name: string; percentage: number }) => {
    return `${entry.name}: ${entry.percentage.toFixed(1)}%`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Service Cost Breakdown</CardTitle>
        <CardDescription>Top services by spending</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              label={renderLabel}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [
                `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                "Cost",
              ]}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

