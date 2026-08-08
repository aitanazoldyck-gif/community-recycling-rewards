"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatPoints } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const REDEEM_THRESHOLD = 150;

export function RedeemCard({ balance }: { balance: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [currentBalance, setCurrentBalance] = useState(balance);

  const canRedeem = currentBalance >= REDEEM_THRESHOLD;

  async function handleRedeem() {
    if (!canRedeem) return;

    setLoading(true);
    try {
      // Get available rewards that cost 150 points or less
      const res = await fetch("/api/rewards");
      const rewards = await res.json();

      // Find a reward that costs exactly 150 points or the closest available
      const eligibleReward = rewards.find((r: any) => r.pointsCost <= currentBalance && r.stock > 0);

      if (!eligibleReward) {
        toast.error("No rewards available for redemption at this time");
        return;
      }

      // Redeem the reward
      const redeemRes = await fetch("/api/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rewardId: eligibleReward.id }),
      });

      const data = await redeemRes.json();
      if (!redeemRes.ok) {
        throw new Error(data.error ?? "Redemption failed");
      }

      setCurrentBalance((prev) => prev - eligibleReward.pointsCost);
      toast.success(`Successfully redeemed "${eligibleReward.name}"!`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to redeem");
    } finally {
      setLoading(false);
    }
  }

  // Only show the card if user has close to the threshold or above
  if (currentBalance < REDEEM_THRESHOLD - 50) {
    return null;
  }

  const pointsNeeded = REDEEM_THRESHOLD - currentBalance;
  const isEligible = currentBalance >= REDEEM_THRESHOLD;

  return (
    <Card className={`border-2 ${isEligible ? "border-primary/50 bg-gradient-to-br from-primary/5 to-secondary/5" : "border-border/50"}`}>
      <CardHeader>
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-lg">Redeem Your Points</CardTitle>
          <Badge variant={isEligible ? "success" : "secondary"}>
            {isEligible ? "Eligible" : `${pointsNeeded} pts needed`}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {isEligible
            ? "Congratulations! You have enough points to redeem a reward."
            : `You need ${pointsNeeded} more points to redeem a reward.`}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold text-primary">{formatPoints(currentBalance)}</p>
            <p className="text-sm text-muted-foreground">current balance</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{formatPoints(REDEEM_THRESHOLD)}</p>
            <p className="text-sm text-muted-foreground">points needed</p>
          </div>
        </div>
        <Button
          className="w-full"
          variant={isEligible ? "default" : "secondary"}
          disabled={!isEligible || loading}
          onClick={handleRedeem}
          size="lg"
        >
          {loading ? "Processing..." : isEligible ? "Redeem Now" : "Earn More Points"}
        </Button>
        {!isEligible && (
          <p className="text-xs text-center text-muted-foreground">
            Continue recycling to earn more points and unlock rewards!
          </p>
        )}
      </CardContent>
    </Card>
  );
}
