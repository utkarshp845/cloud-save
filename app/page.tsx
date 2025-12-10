"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentAuthUser } from "@/lib/auth";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        const user = await getCurrentAuthUser();
        if (user) {
          router.push("/dashboard");
        } else {
          router.push("/login");
        }
      } catch {
        router.push("/login");
      }
    };

    checkAuthAndRedirect();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
