import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { RewardsCatalog } from "@/components/resident/rewards-catalog";

export default async function RewardsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [rewards, wallet, redemptions] = await Promise.all([
    db.reward.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: { pointsCost: "asc" },
    }),
    db.rewardWallet.findUnique({ where: { residentId: session.user.id } }),
    db.redemptionRequest.findMany({
      where: { userId: session.user.id, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { reward: true },
    }),
  ]);

  return (
    <RewardsCatalog
      rewards={rewards}
      balance={wallet?.balance ?? 0}
      redemptions={redemptions}
    />
  );
}
