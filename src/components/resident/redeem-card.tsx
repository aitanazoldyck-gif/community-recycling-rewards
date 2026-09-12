"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatPoints } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ImagePlus, Smartphone, WalletCards } from "lucide-react";

const REDEEM_THRESHOLD = 150;

export function RedeemCard({ balance }: { balance: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [currentBalance, setCurrentBalance] = useState(balance);
  const [redeemAmount, setRedeemAmount] = useState(String(Math.min(REDEEM_THRESHOLD, balance)));
  const [gcashNumber, setGcashNumber] = useState("");
  const [gcashQr, setGcashQr] = useState("");
  const [gcashQrName, setGcashQrName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const amount = Number(redeemAmount);
  const canRedeem = Number.isInteger(amount) && amount >= REDEEM_THRESHOLD && amount <= currentBalance;
  const normalizedGcash = gcashNumber.replace(/\s|-/g, "");
  const canRedeemGcash = canRedeem && /^09\d{9}$/.test(normalizedGcash) && Boolean(gcashQr);

  function handleQrChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    if (file.size > 6 * 1024 * 1024) {
      toast.error("QR image must be smaller than 6 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setGcashQr(String(reader.result));
      setGcashQrName(file.name);
    };
    reader.readAsDataURL(file);
  }

  async function handleRedeem() {
    if (!canRedeemGcash) return;

    setLoading(true);
    try {
      const redeemRes = await fetch("/api/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ points: amount, gcashNumber: normalizedGcash, gcashQr }),
      });

      const data = await redeemRes.json();
      if (!redeemRes.ok) {
        throw new Error(data.error ?? "Redemption failed");
      }

      setCurrentBalance((prev) => prev - amount);
      setRedeemAmount("");
      setGcashNumber("");
      setGcashQr("");
      setGcashQrName("");
      toast.success("GCash redemption submitted for approval!");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to redeem");
    } finally {
      setLoading(false);
    }
  }

  const pointsNeeded = REDEEM_THRESHOLD - currentBalance;
  const isEligible = currentBalance >= REDEEM_THRESHOLD;

  return (
    <Card className="overflow-hidden border-2 border-[#007dfe]/20 bg-gradient-to-br from-[#007dfe]/[0.08] via-background to-[#00b8f2]/[0.08] shadow-lg shadow-[#007dfe]/5">
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#007dfe] text-xl font-black text-white shadow-md shadow-[#007dfe]/25">G</div>
            <div>
              <CardTitle className="text-xl">GCash Redeem</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Fast, secure payout to your GCash wallet</p>
            </div>
          </div>
          <Badge variant={isEligible ? "success" : "secondary"} className="w-fit">
            {isEligible ? "Ready to redeem" : `${pointsNeeded} pts needed`}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Available</p>
            <p className="mt-1 text-2xl font-bold text-[#007dfe]">{formatPoints(currentBalance)} <span className="text-sm font-medium">pts</span></p>
          </div>
          <div className="rounded-xl bg-background/70 p-3 text-right ring-1 ring-border/60">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Minimum</p>
            <p className="mt-1 text-lg font-bold">{formatPoints(REDEEM_THRESHOLD)} pts</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="redeem-amount" className="flex items-center gap-2 text-sm font-semibold"><WalletCards className="h-4 w-4 text-[#007dfe]" /> Points to redeem</label>
          <input
            id="redeem-amount"
            type="number"
            min={REDEEM_THRESHOLD}
            max={currentBalance}
            step="1"
            value={redeemAmount}
            onChange={(event) => setRedeemAmount(event.target.value)}
            className="flex h-11 w-full rounded-xl border border-border/80 bg-white/80 px-4 text-sm dark:bg-white/5"
          />
          </div>
          <div className="space-y-2">
            <label htmlFor="gcash-number" className="flex items-center gap-2 text-sm font-semibold"><Smartphone className="h-4 w-4 text-[#007dfe]" /> GCash mobile number</label>
            <input id="gcash-number" type="tel" inputMode="numeric" placeholder="09XX XXX XXXX" value={gcashNumber} onChange={(event) => setGcashNumber(event.target.value)} className="flex h-11 w-full rounded-xl border border-border/80 bg-white/80 px-4 text-sm dark:bg-white/5" />
          </div>
        </div>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold"><ImagePlus className="h-4 w-4 text-[#007dfe]" /> GCash QR code</label>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleQrChange} className="sr-only" />
          <button type="button" onClick={() => fileRef.current?.click()} className="flex min-h-24 w-full items-center gap-4 rounded-2xl border border-dashed border-[#007dfe]/40 bg-background/60 p-4 text-left transition hover:border-[#007dfe] hover:bg-[#007dfe]/5">
            {gcashQr ? <img src={gcashQr} alt="GCash QR preview" className="h-16 w-16 rounded-xl object-cover ring-2 ring-[#007dfe]/20" /> : <span className="grid h-16 w-16 place-items-center rounded-xl bg-[#007dfe]/10 text-[#007dfe]"><ImagePlus className="h-6 w-6" /></span>}
            <span><span className="block font-semibold">{gcashQrName || "Upload your GCash QR"}</span><span className="mt-1 block text-xs text-muted-foreground">PNG or JPG, up to 6 MB</span></span>
          </button>
        </div>
        <Button
          className="w-full"
          variant={canRedeemGcash ? "default" : "secondary"}
          disabled={!canRedeemGcash || loading}
          onClick={handleRedeem}
          size="lg"
        >
          {loading ? "Submitting securely..." : canRedeemGcash ? "Redeem through GCash" : "Complete the details above"}
        </Button>
        <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Your request will be reviewed before payout.</p>
      </CardContent>
    </Card>
  );
}
