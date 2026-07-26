import { db } from "@/lib/db";

export async function recordRecycling(input: {
  residentId: string;
  wasteCategoryId: string;
  weightKg: number;
  quantity?: number;
  centerId?: string;
  recordedById: string;
  notes?: string;
  images?: string[];
}) {
  const category = await db.wasteCategory.findUnique({
    where: { id: input.wasteCategoryId },
  });
  if (!category?.isActive) throw new Error("Invalid waste category");

  const pointsEarned = Math.round(input.weightKg * category.pointsPerKg);
  const carbonSavedKg = input.weightKg * category.carbonFactorKg;

  return db.$transaction(async (tx) => {
    const record = await tx.recyclingRecord.create({
      data: {
        residentId: input.residentId,
        wasteCategoryId: input.wasteCategoryId,
        weightKg: input.weightKg,
        quantity: input.quantity ?? 1,
        centerId: input.centerId,
        recordedById: input.recordedById,
        verifiedById: input.recordedById,
        pointsEarned,
        carbonSavedKg,
        notes: input.notes,
        images: input.images ?? [],
        verified: true,
      },
      include: { wasteCategory: true },
    });

    const wallet = await tx.rewardWallet.findUnique({
      where: { residentId: input.residentId },
    });

    const balance = (wallet?.balance ?? 0) + pointsEarned;
    const lifetime = (wallet?.lifetime ?? 0) + pointsEarned;

    if (wallet) {
      await tx.rewardWallet.update({
        where: { id: wallet.id },
        data: { balance, lifetime },
      });
      await tx.rewardTransaction.create({
        data: {
          walletId: wallet.id,
          userId: input.residentId,
          type: "EARN",
          amount: pointsEarned,
          balanceAfter: balance,
          description: `Recycled ${category.name}`,
          referenceId: record.id,
        },
      });
    } else {
      const created = await tx.rewardWallet.create({
        data: {
          residentId: input.residentId,
          balance: pointsEarned,
          lifetime: pointsEarned,
        },
      });
      await tx.rewardTransaction.create({
        data: {
          walletId: created.id,
          userId: input.residentId,
          type: "EARN",
          amount: pointsEarned,
          balanceAfter: pointsEarned,
          description: `Recycled ${category.name}`,
          referenceId: record.id,
        },
      });
    }

    const profile = await tx.residentProfile.findUnique({
      where: { userId: input.residentId },
    });

    if (profile) {
      const totalWeight = profile.totalWeightKg + input.weightKg;
      const carbonSaved = profile.carbonSavedKg + carbonSavedKg;
      const envScore = Math.min(1000, profile.environmentalScore + Math.round(pointsEarned / 2));

      await tx.residentProfile.update({
        where: { userId: input.residentId },
        data: {
          totalWeightKg: totalWeight,
          carbonSavedKg: carbonSaved,
          environmentalScore: envScore,
          recyclingStreak: profile.recyclingStreak + 1,
        },
      });
    }

    await tx.notification.create({
      data: {
        userId: input.residentId,
        title: "Points earned!",
        message: `You earned ${pointsEarned} points for recycling ${input.weightKg}kg of ${category.name}.`,
        type: "reward",
        link: "/resident/wallet",
      },
    });

    return record;
  });
}
