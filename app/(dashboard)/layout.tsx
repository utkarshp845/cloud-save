"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { getCurrentAuthUser } from "@/lib/auth";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isChecking, setIsChecking] = React.useState(true);
  const [isAuthorized, setIsAuthorized] = React.useState(false);

  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getCurrentAuthUser();
        if (user) {
          setIsAuthorized(true);
          setIsChecking(false);
        } else {
          // Use window.location for hard redirect
          window.location.href = "/login";
        }
      } catch (error) {
        // Use window.location for hard redirect
        window.location.href = "/login";
      }
    };

    checkAuth();
  }, []);

  if (isChecking || !isAuthorized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

