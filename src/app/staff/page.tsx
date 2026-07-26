import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { ScanLine, ClipboardList, Truck, Recycle } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function StaffDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [todayRecords, pendingPickups] = await Promise.all([
    db.recyclingRecord.count({
      where: {
        recordedById: session.user.id,
        collectionDate: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        deletedAt: null,
      },
    }),
    db.pickupRequest.count({
      where: { status: "PENDING", deletedAt: null },
    }),
  ]);

  const actions = [
    { href: "/staff/scan", label: "Scan QR Code", icon: ScanLine, desc: "Verify resident" },
    { href: "/staff/record", label: "Record Recycling", icon: ClipboardList, desc: "Log collection" },
    { href: "/staff/pickups", label: "Manage Pickups", icon: Truck, desc: `${pendingPickups} pending` },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Staff Dashboard</h1>
        <p className="text-muted-foreground">Collection operations center</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Today&apos;s records</p>
            <p className="text-3xl font-bold mt-1">{todayRecords}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Pending pickups</p>
            <p className="text-3xl font-bold mt-1">{pendingPickups}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <Recycle className="h-8 w-8 text-primary" />
            <div>
              <p className="font-medium">Ready to collect</p>
              <p className="text-sm text-muted-foreground">Scan or record below</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {actions.map((a) => (
          <Link key={a.href} href={a.href}>
            <Card className="h-full hover:shadow-lg transition-all hover:-translate-y-0.5 cursor-pointer">
              <CardHeader>
                <a.icon className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">{a.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{a.desc}</p>
                <Button variant="outline" size="sm" className="mt-4">
                  Open
                </Button>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
