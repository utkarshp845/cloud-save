"use client";

import * as React from "react";
import { TrendingDown, DollarSign } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface SavingsCardProps {
  totalPotentialSavings: number;
}

export function SavingsCard({ totalPotentialSavings }: SavingsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Potential Savings</CardTitle>
        <TrendingDown className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          ${totalPotentialSavings.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Monthly savings from recommendations
        </p>
        <div className="mt-4 flex items-center gap-2 text-sm">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">
            Annual savings: ${(totalPotentialSavings * 12).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

