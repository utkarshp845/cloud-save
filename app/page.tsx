import { redirect } from "next/navigation";
import { getCurrentAuthUser } from "@/lib/auth";

export default async function Home() {
  const user = await getCurrentAuthUser();

  if (user) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}

