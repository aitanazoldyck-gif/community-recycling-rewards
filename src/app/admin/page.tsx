import { db } from "@/lib/db";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { formatPoints, formatWeight } from "@/lib/utils";
import { Users, Recycle, Wallet, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [residents, records, redemptions, barangays] = await Promise.all([
    db.user.count({ where: { role: "RESIDENT", deletedAt: null } }),
    db.recyclingRecord.aggregate({
      where: { deletedAt: null },
      _sum: { weightKg: true, pointsEarned: true },
    }),
    db.redemptionRequest.count({ where: { status: "PENDING" } }),
    db.barangay.count({ where: { deletedAt: null, isActive: true } }),
  ]);

  const stats = [
    { label: "Total residents", value: formatPoints(residents), icon: Users },
    { label: "Kg recycled", value: formatWeight(records._sum.weightKg ?? 0), icon: Recycle },
    { label: "Points issued", value: formatPoints(records._sum.pointsEarned ?? 0), icon: Wallet },
    { label: "Active barangays", value: String(barangays), icon: Building2 },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Platform overview and analytics</p>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="text-2xl font-bold mt-1">{s.value}</p>
                </div>
                <s.icon className="h-8 w-8 text-primary/60" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {redemptions > 0 && (
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="pt-6">
            <p className="font-medium">{redemptions} pending redemption requests need review</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
