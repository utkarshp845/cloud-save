"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PolicyTemplate } from "@/components/connect/PolicyTemplate";
import { ARNInputForm } from "@/components/connect/ARNInputForm";
import { CloudFormationDeploy } from "@/components/connect/CloudFormationDeploy";
import { getTrustPolicy } from "@/lib/aws/policies";
import { useAWSStore } from "@/lib/store/aws-store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const steps = [
  {
    title: "Deploy Role",
    description: "Deploy IAM role with CloudFormation (recommended) or manual setup",
  },
  {
    title: "Connect Account",
    description: "Enter your AWS account details and test the connection",
  },
];

export function RoleSetupWizard() {
  const [currentStep, setCurrentStep] = React.useState(0);
  const { accountId, externalId } = useAWSStore();

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>AWS Account Setup</CardTitle>
          <CardDescription>
            Follow these steps to connect your AWS account to SpotSave
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step indicator */}
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      index === currentStep
                        ? "bg-primary text-primary-foreground"
                        : index < currentStep
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <p className="text-xs mt-2 text-center">{step.title}</p>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-1 flex-1 mx-2 ${
                      index < currentStep ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step content */}
          <div className="min-h-[400px]">
            {currentStep === 0 && (
              <Tabs defaultValue="cloudformation" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="cloudformation">CloudFormation (Recommended)</TabsTrigger>
                  <TabsTrigger value="manual">Manual Setup</TabsTrigger>
                </TabsList>
                <TabsContent value="cloudformation" className="mt-4">
                  <CloudFormationDeploy />
                </TabsContent>
                <TabsContent value="manual" className="mt-4 space-y-4">
                  <PolicyTemplate />
                  <Card>
                    <CardHeader>
                      <CardTitle>IAM Trust Policy</CardTitle>
                      <CardDescription>
                        Use this trust policy when creating your IAM role manually
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">AWS Account ID</label>
                        <input
                          type="text"
                          placeholder="123456789012"
                          className="w-full px-3 py-2 border rounded-md"
                          value={accountId || ""}
                          readOnly
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">External ID</label>
                        <input
                          type="text"
                          placeholder="your-external-id"
                          className="w-full px-3 py-2 border rounded-md"
                          value={externalId || ""}
                          readOnly
                        />
                      </div>
                      {accountId && externalId && (
                        <div className="relative">
                          <pre className="overflow-x-auto rounded-md bg-muted p-4 text-sm">
                            <code>
                              {getTrustPolicy(accountId, externalId)}
                            </code>
                          </pre>
                        </div>
                      )}
                      <p className="text-sm text-muted-foreground">
                        Note: You'll need to generate an external ID first in the next step.
                        The trust policy will be shown after you enter your account details.
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
            {currentStep === 1 && <ARNInputForm />}
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            {currentStep < steps.length - 1 && (
              <Button onClick={nextStep}>
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

