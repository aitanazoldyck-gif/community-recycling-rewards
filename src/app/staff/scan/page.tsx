"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScanLine, UserCheck } from "lucide-react";
import { formatPoints, getInitials } from "@/lib/utils";
import Link from "next/link";

type ResidentInfo = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  qrCode: string;
  barangay: string | null;
  balance: number;
  totalWeightKg: number;
  environmentalScore: number;
};

export default function ScanPage() {
  const [qr, setQr] = useState("");
  const [loading, setLoading] = useState(false);
  const [resident, setResident] = useState<ResidentInfo | null>(null);

  async function lookup(e: React.FormEvent) {
    e.preventDefault();
    if (!qr.trim()) return;
    setLoading(true);
    setResident(null);
    try {
      const res = await fetch(`/api/residents/lookup?qr=${encodeURIComponent(qr.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Not found");
      setResident(data);
      toast.success("Resident verified!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lookup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ScanLine className="h-7 w-7 text-primary" />
          Scan QR Code
        </h1>
        <p className="text-muted-foreground">Verify a resident before recording recycling</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Enter QR code</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={lookup} className="space-y-4">
            <div>
              <Label htmlFor="qr">Resident QR code</Label>
              <Input
                id="qr"
                value={qr}
                onChange={(e) => setQr(e.target.value)}
                placeholder="Scan or paste QR code value"
                required
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Verifying..." : "Verify resident"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {resident && (
        <Card className="border-primary/30">
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14">
                <AvatarImage src={resident.image ?? undefined} />
                <AvatarFallback>{getInitials(resident.name)}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="flex items-center gap-2">
                  {resident.name}
                  <UserCheck className="h-5 w-5 text-primary" />
                </CardTitle>
                <p className="text-sm text-muted-foreground">{resident.email}</p>
                {resident.barangay && (
                  <Badge variant="secondary" className="mt-1">{resident.barangay}</Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-muted p-3">
                <p className="text-muted-foreground">Balance</p>
                <p className="font-bold text-lg">{formatPoints(resident.balance)} pts</p>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <p className="text-muted-foreground">Env. score</p>
                <p className="font-bold text-lg">{resident.environmentalScore}</p>
              </div>
            </div>
            <Link href={`/staff/record?residentId=${resident.id}`}>
              <Button className="w-full">Record recycling for this resident</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
