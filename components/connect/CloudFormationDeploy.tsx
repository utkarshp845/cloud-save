"use client";

import * as React from "react";
import { Download, ExternalLink, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAWSStore } from "@/lib/store/aws-store";

export function CloudFormationDeploy() {
  const { accountId, setExternalId } = useAWSStore();
  const [externalId, setLocalExternalId] = React.useState("");
  const [copied, setCopied] = React.useState(false);

  // Generate a random external ID if not set
  React.useEffect(() => {
    if (!externalId) {
      const generated = `spotsave-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      setLocalExternalId(generated);
    }
  }, []);

  const handleCopyTemplate = async () => {
    try {
      const response = await fetch("/spotsave-role.yaml");
      const template = await response.text();
      // Replace the default ExternalId with the generated one
      const updatedTemplate = template.replace(
        /ExternalId:\s*'spotsave-external-id'/,
        `ExternalId: '${externalId}'`
      );
      await navigator.clipboard.writeText(updatedTemplate);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy template:", error);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch("/spotsave-role.yaml");
      const template = await response.text();
      // Replace the default ExternalId with the generated one
      const updatedTemplate = template.replace(
        /ExternalId:\s*'spotsave-external-id'/,
        `ExternalId: '${externalId}'`
      );
      const blob = new Blob([updatedTemplate], { type: "text/yaml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "spotsave-role.yaml";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download template:", error);
    }
  };

  const handleOpenCloudFormation = () => {
    // Save external ID to store
    if (externalId) {
      setExternalId(externalId);
    }

    // Create CloudFormation console URL with template
    const region = "us-east-1"; // Default region, user can change in console
    const templateUrl = encodeURIComponent(
      `${window.location.origin}/spotsave-role.yaml`
    );
    const stackName = "SpotSaveRole";
    
    // Open CloudFormation create stack page
    const cfUrl = `https://${region}.console.aws.amazon.com/cloudformation/home?region=${region}#/stacks/create/review?templateURL=${templateUrl}&stackName=${stackName}`;
    window.open(cfUrl, "_blank");
  };

  const handleSaveExternalId = () => {
    if (externalId) {
      setExternalId(externalId);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Deploy with CloudFormation</CardTitle>
          <CardDescription>
            The easiest way to set up SpotSave - deploy the IAM role with one click
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              CloudFormation will automatically create the IAM role with all required permissions.
              No manual copy-pasting needed!
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">External ID</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={externalId}
                  onChange={(e) => setLocalExternalId(e.target.value)}
                  placeholder="spotsave-external-id"
                  className="flex-1 px-3 py-2 border rounded-md"
                />
                <Button
                  variant="outline"
                  onClick={handleSaveExternalId}
                  disabled={!externalId}
                >
                  Save
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                This External ID will be used in the CloudFormation template for secure role assumption.
                Save it - you'll need it when connecting your account.
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleOpenCloudFormation}
                className="flex-1"
                disabled={!externalId}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Deploy in CloudFormation Console
              </Button>
              <Button
                variant="outline"
                onClick={handleDownloadTemplate}
                disabled={!externalId}
              >
                <Download className="mr-2 h-4 w-4" />
                Download Template
              </Button>
              <Button
                variant="outline"
                onClick={handleCopyTemplate}
                disabled={!externalId}
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Copy Template
                  </>
                )}
              </Button>
            </div>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>After deploying:</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1 ml-2">
                <li>Click "Deploy in CloudFormation Console" above</li>
                <li>In CloudFormation, update the ExternalId parameter with the value above</li>
                <li>Review and create the stack</li>
                <li>Once created, copy the RoleArn from the stack Outputs</li>
                <li>Enter the RoleArn and ExternalId in the next step to connect</li>
              </ol>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}

