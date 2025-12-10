"use client";

import * as React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { MonthlyCost } from "@/types/aws";

interface CostTrendChartProps {
  data: MonthlyCost[];
}

export function CostTrendChart({ data }: CostTrendChartProps) {
  const chartData = data.map((item) => ({
    month: new Date(item.month + "-01").toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    }),
    cost: item.amount,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Cost Trends</CardTitle>
        <CardDescription>12-month spending overview</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis
              tickFormatter={(value) => `$${value.toLocaleString()}`}
            />
            <Tooltip
              formatter={(value: number) => [
                `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                "Cost",
              ]}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="cost"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ r: 4 }}
              name="Monthly Cost"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

