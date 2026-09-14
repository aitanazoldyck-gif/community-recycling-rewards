import { redirect } from "next/navigation";

export default async function ResidentDashboardPage() {
  redirect("/resident/home");
}
