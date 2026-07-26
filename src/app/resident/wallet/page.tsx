import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { formatPoints } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function WalletPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const wallet = await db.rewardWallet.findUnique({
    where: { residentId: session.user.id },
    include: {
      transactions: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  const balance = wallet?.balance ?? 0;
  const lifetime = wallet?.lifetime ?? 0;
  const transactions = wallet?.transactions ?? [];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Reward Wallet</h1>
        <p className="text-muted-foreground">Your points balance and transaction history</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-secondary/5">
          <CardContent className="pt-8 pb-6 text-center">
            <p className="text-sm text-muted-foreground">Available balance</p>
            <p className="text-5xl font-bold text-gradient mt-2">{formatPoints(balance)}</p>
            <p className="text-sm text-muted-foreground mt-1">points</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-8 pb-6 text-center">
            <p className="text-sm text-muted-foreground">Lifetime earned</p>
            <p className="text-4xl font-bold mt-2">{formatPoints(lifetime)}</p>
            <p className="text-sm text-muted-foreground mt-1">total points</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction history</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No transactions yet. Start recycling to earn points!
            </p>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between rounded-xl border border-border/50 p-4"
                >
                  <div>
                    <p className="font-medium">{tx.description ?? tx.type}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(tx.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={tx.amount >= 0 ? "success" : "warning"}>
                      {tx.amount >= 0 ? "+" : ""}
                      {tx.amount} pts
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      Balance: {formatPoints(tx.balanceAfter)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
