"use client";

import * as React from "react";
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";

// Configure Amplify immediately (not in useEffect)
if (typeof window !== "undefined" && outputs?.auth) {
  Amplify.configure(outputs, { ssr: true });
}

export function AmplifyProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

