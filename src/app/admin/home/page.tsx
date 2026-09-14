import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { SocialHome } from "@/components/resident/social-home";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return <SocialHome initialView="home" />;
}