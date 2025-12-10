"use client";

import * as React from "react";
import { Amplify } from "aws-amplify";

export function AmplifyProvider({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    // Configure Amplify when component mounts
    const configureAmplify = async () => {
      try {
        const outputs = await import("@/amplify_outputs.json");
        if (outputs.default && outputs.default.auth) {
          Amplify.configure(outputs.default, { ssr: true });
        }
      } catch (error) {
        console.warn(
          "amplify_outputs.json not found. Run 'npm run amplify-setup' to generate it."
        );
      }
    };

    configureAmplify();
  }, []);

  return <>{children}</>;
}

