"use client";

import * as React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ForecastResponse } from "@/types/aws";

interface ForecastChartProps {
  data: ForecastResponse;
}

export function ForecastChart({ data }: ForecastChartProps) {
  const chartData = React.useMemo(() => {
    const actualMap = new Map(
      data.actual.map((item) => [
        item.month,
        item.amount,
      ])
    );

    return data.forecast.map((item) => {
      const month = item.timePeriod.substring(0, 7);
      const forecastValue = parseFloat(item.meanValue);
      const actualValue = actualMap.get(month) || 0;

      return {
        month: new Date(month + "-01").toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        }),
        actual: actualValue,
        forecast: forecastValue,
      };
    });
  }, [data]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Forecast vs Actual</CardTitle>
        <CardDescription>Cost predictions vs actual spending</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis
              tickFormatter={(value) => `$${value.toLocaleString()}`}
            />
            <Tooltip
              formatter={(value: number) => [
                `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              ]}
            />
            <Legend />
            <Bar
              dataKey="actual"
              fill="hsl(var(--chart-1))"
              name="Actual"
            />
            <Bar
              dataKey="forecast"
              fill="hsl(var(--chart-2))"
              name="Forecast"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

