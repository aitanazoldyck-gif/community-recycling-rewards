import { NextResponse } from "next/server";
import { requireRole, requireSession } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { z } from "zod";

async function ensureWallet(userId: string) {
  const existing = await db.rewardWallet.findUnique({ where: { residentId: userId } });
  if (existing) return existing;

  return db.rewardWallet.create({ data: { residentId: userId, balance: 0, lifetime: 0 } });
}

export async function GET() {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const rewards = await db.reward.findMany({
    where: { isActive: true, deletedAt: null, stock: { gt: 0 } },
    orderBy: { pointsCost: "asc" },
  });

  return NextResponse.json(rewards);
}

const redeemSchema = z.object({
  rewardId: z.string().min(1),
});

export async function POST(request: Request) {
  const authResult = await requireRole(["RESIDENT"]);
  if ("error" in authResult) return authResult.error;

  try {
    const { rewardId } = redeemSchema.parse(await request.json());
    const userId = authResult.session.user.id;

    const [reward, wallet] = await Promise.all([
      db.reward.findFirst({ where: { id: rewardId, isActive: true, deletedAt: null } }),
      ensureWallet(userId),
    ]);

    if (!reward || reward.stock <= 0) {
      return NextResponse.json({ error: "Reward unavailable" }, { status: 400 });
    }

    const balance = wallet?.balance ?? 0;
    if (balance < reward.pointsCost) {
      return NextResponse.json({ error: "Insufficient points" }, { status: 400 });
    }

    const redemption = await db.$transaction(async (tx) => {
      const req = await tx.redemptionRequest.create({
        data: {
          userId,
          rewardId: reward.id,
          points: reward.pointsCost,
        },
        include: { reward: true },
      });

      await tx.reward.update({
        where: { id: reward.id },
        data: { stock: { decrement: 1 } },
      });

      const newBalance = balance - reward.pointsCost;
      await tx.rewardWallet.update({
        where: { id: wallet.id },
        data: { balance: newBalance },
      });
      await tx.rewardTransaction.create({
        data: {
          walletId: wallet.id,
          userId,
          type: "REDEEM",
          amount: -reward.pointsCost,
          balanceAfter: newBalance,
          description: `Redeemed: ${reward.name}`,
          referenceId: req.id,
        },
      });

      await tx.notification.create({
        data: {
          userId,
          title: "Redemption submitted",
          message: `Your request for "${reward.name}" is pending approval.`,
          type: "reward",
          link: "/resident/rewards",
        },
      });

      return req;
    });

    return NextResponse.json(redemption, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "Redemption failed" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const authResult = await requireRole(["ADMIN"]);
  if ("error" in authResult) return authResult.error;

  try {
    const { id, status, notes } = await request.json();
    const redemption = await db.redemptionRequest.update({
      where: { id },
      data: {
        status,
        notes,
        fulfilledAt: status === "FULFILLED" ? new Date() : undefined,
      },
      include: { reward: true, user: { select: { id: true, name: true } } },
    });

    await db.notification.create({
      data: {
        userId: redemption.userId,
        title: "Redemption update",
        message: `Your redemption for "${redemption.reward.name}" is ${status.toLowerCase()}.`,
        type: "reward",
        link: "/resident/rewards",
      },
    });

    return NextResponse.json(redemption);
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
