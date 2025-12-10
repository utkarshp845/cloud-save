"use client";

import * as React from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getPermissionsPolicy } from "@/lib/aws/policies";

export function PolicyTemplate() {
  const [copied, setCopied] = React.useState(false);
  const policy = getPermissionsPolicy();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(policy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>IAM Permissions Policy</CardTitle>
        <CardDescription>
          Copy this policy and attach it to your IAM role in the AWS Console
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <pre className="overflow-x-auto rounded-md bg-muted p-4 text-sm">
            <code>{policy}</code>
          </pre>
          <Button
            variant="outline"
            size="icon"
            className="absolute right-2 top-2"
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
        <div className="text-sm text-muted-foreground space-y-2">
          <p>
            <strong>Steps to create the role:</strong>
          </p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>Go to AWS IAM Console → Roles → Create Role</li>
            <li>Select "AWS Account" as trusted entity type</li>
            <li>Configure the trust policy (see next step)</li>
            <li>Attach the permissions policy above</li>
            <li>Name the role (e.g., "SpotSaveReadOnlyRole")</li>
            <li>Copy the role ARN and use it in the next step</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}

