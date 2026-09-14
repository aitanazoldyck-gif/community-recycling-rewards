import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { SocialHome } from "@/components/resident/social-home";

export const dynamic = "force-dynamic";

export default async function ResidentHomePage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const params = await searchParams;
  return <SocialHome initialView={params.view ?? "home"} />;
}
