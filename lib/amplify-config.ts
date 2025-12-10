"use client";

import { Amplify } from "aws-amplify";

// Amplify configuration will be loaded from amplify_outputs.json
// This file is generated when you run 'npm run amplify-setup'
// For now, we'll configure it dynamically
export function configureAmplify() {
  if (typeof window === "undefined") {
    return; // Server-side, skip
  }

  try {
    // Try to import amplify_outputs.json
    import("@/amplify_outputs.json")
      .then((outputs) => {
        if (outputs.default && outputs.default.auth) {
          Amplify.configure(outputs.default, { ssr: true });
        }
      })
      .catch(() => {
        console.warn(
          "amplify_outputs.json not found. Run 'npm run amplify-setup' to generate it."
        );
      });
  } catch (error) {
    console.warn("Failed to configure Amplify:", error);
  }
}

// Auto-configure on import in client
if (typeof window !== "undefined") {
  configureAmplify();
}

