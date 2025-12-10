"use client";

import * as React from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { generateRoleArn, validateRoleArn } from "@/lib/aws/policies";
import { validateAccountId, validateExternalId, sanitizeExternalId } from "@/lib/utils/validation";
import { useAWSStore } from "@/lib/store/aws-store";

export function ARNInputForm() {
  const [accountId, setAccountId] = React.useState("");
  const [roleName, setRoleName] = React.useState("SpotSaveReadOnlyRole");
  const [roleArn, setRoleArn] = React.useState("");
  const [externalId, setExternalId] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const { setCredentials, setRoleInfo } = useAWSStore();

  const handleGenerateARN = () => {
    if (!validateAccountId(accountId)) {
      setError("Invalid AWS Account ID. Must be 12 digits.");
      return;
    }

    try {
      const generatedArn = generateRoleArn(accountId, roleName);
      setRoleArn(generatedArn);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate ARN");
    }
  };

  const handleTestConnection = async () => {
    setError(null);
    setSuccess(false);

    if (!roleArn || !validateRoleArn(roleArn)) {
      setError("Invalid role ARN format");
      return;
    }

    if (!externalId || !validateExternalId(externalId)) {
      setError("Invalid external ID. Must be alphanumeric with hyphens/underscores, 2-1224 characters.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/aws/assume-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roleArn: roleArn.trim(),
          externalId: sanitizeExternalId(externalId),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to assume role");
      }

      const { credentials } = await response.json();
      setCredentials(credentials);
      setRoleInfo(roleArn.trim(), accountId, sanitizeExternalId(externalId));
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect to AWS");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connect AWS Account</CardTitle>
        <CardDescription>
          Enter your AWS account details to connect SpotSave
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              Successfully connected to AWS! You can now view your cost data.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="accountId">AWS Account ID (12 digits)</Label>
          <div className="flex gap-2">
            <Input
              id="accountId"
              type="text"
              placeholder="123456789012"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              maxLength={12}
              disabled={isLoading}
            />
            <Input
              type="text"
              placeholder="Role Name"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              disabled={isLoading}
              className="w-48"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleGenerateARN}
              disabled={isLoading || !accountId}
            >
              Generate ARN
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="roleArn">Role ARN</Label>
          <Input
            id="roleArn"
            type="text"
            placeholder="arn:aws:iam::123456789012:role/SpotSaveReadOnlyRole"
            value={roleArn}
            onChange={(e) => setRoleArn(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="externalId">External ID</Label>
          <Input
            id="externalId"
            type="text"
            placeholder="your-unique-external-id"
            value={externalId}
            onChange={(e) => setExternalId(e.target.value)}
            disabled={isLoading}
          />
          <p className="text-xs text-muted-foreground">
            This should match the external ID configured in your role's trust policy
          </p>
        </div>

        <Button
          onClick={handleTestConnection}
          disabled={isLoading || !roleArn || !externalId}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testing connection...
            </>
          ) : (
            "Test Connection"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

