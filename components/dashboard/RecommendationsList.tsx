"use client";

import * as React from "react";
import { AlertCircle, TrendingDown, Server, Database } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Recommendation } from "@/types/aws";

interface RecommendationsListProps {
  recommendations: Recommendation[];
}

const getIcon = (type: Recommendation["type"]) => {
  switch (type) {
    case "reserved-instance":
      return <TrendingDown className="h-4 w-4" />;
    case "rightsizing":
      return <Server className="h-4 w-4" />;
    case "idle-resource":
      return <AlertCircle className="h-4 w-4" />;
    default:
      return <AlertCircle className="h-4 w-4" />;
  }
};

const getPriorityColor = (priority: Recommendation["priority"]) => {
  switch (priority) {
    case "high":
      return "destructive";
    case "medium":
      return "default";
    case "low":
      return "secondary";
    default:
      return "default";
  }
};

export function RecommendationsList({ recommendations }: RecommendationsListProps) {
  if (recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recommendations</CardTitle>
          <CardDescription>Cost optimization opportunities</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No recommendations available at this time.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recommendations</CardTitle>
        <CardDescription>
          {recommendations.length} cost optimization opportunities
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {recommendations.map((rec) => (
          <div
            key={rec.id}
            className="flex items-start gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
          >
            <div className="mt-1">{getIcon(rec.type)}</div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-sm">{rec.title}</h4>
                <Badge variant={getPriorityColor(rec.priority)}>
                  {rec.priority}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{rec.description}</p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>Service: {rec.service}</span>
                {rec.resourceId && <span>Resource: {rec.resourceId}</span>}
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-primary">
                ${rec.potentialSavings.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <div className="text-xs text-muted-foreground">/month</div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

