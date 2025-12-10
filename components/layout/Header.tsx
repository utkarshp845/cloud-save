"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { handleSignOut, getCurrentAuthUser } from "@/lib/auth";

export function Header() {
  const router = useRouter();
  const [user, setUser] = React.useState<{ username: string } | null>(null);

  React.useEffect(() => {
    getCurrentAuthUser().then(setUser);
  }, []);

  const handleLogout = async () => {
    await handleSignOut();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/dashboard" className="mr-6 flex items-center space-x-2">
            <span className="font-bold text-xl">SpotSave</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          {user && (
            <span className="text-sm text-muted-foreground mr-2">
              {user.username}
            </span>
          )}
          <ThemeToggle />
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/connect">
              <Settings className="h-5 w-5" />
              <span className="sr-only">Settings</span>
            </Link>
          </Button>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
            <span className="sr-only">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
}

