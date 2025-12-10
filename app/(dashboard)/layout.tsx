import { getCurrentAuthUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentAuthUser();

  if (!user) {
    redirect("/login");
  }

  return <>{children}</>;
}

