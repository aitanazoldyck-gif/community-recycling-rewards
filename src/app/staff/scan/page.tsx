"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, ScanLine, Upload, UserCheck } from "lucide-react";
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

declare global {
  interface Window {
    BarcodeDetector?: {
      new (): {
        detect(source: ImageBitmap | HTMLCanvasElement | HTMLVideoElement | ImageData): Promise<Array<{ rawValue: string }>>;
      };
    };
  }
}

export default function ScanPage() {
  const [qr, setQr] = useState("");
  const [loading, setLoading] = useState(false);
  const [resident, setResident] = useState<ResidentInfo | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [scanSupported, setScanSupported] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const supported = typeof window !== "undefined" && "BarcodeDetector" in window && Boolean(navigator.mediaDevices?.getUserMedia);
    setScanSupported(supported);

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!cameraActive) return;

    let intervalId: number | undefined;

    const runDetection = async () => {
      if (!videoRef.current || !streamRef.current || loading) return;

      try {
        const detector = getBarcodeDetector();
        if (!detector) return;

        const canvas = document.createElement("canvas");
        canvas.width = videoRef.current.videoWidth || 640;
        canvas.height = videoRef.current.videoHeight || 480;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const [result] = await detector.detect(canvas);
        const value = result?.rawValue?.trim();
        if (value) {
          setQr(value);
          await lookupResident(value);
        }
      } catch {
        // Ignore transient detection errors and keep scanning.
      }
    };

    intervalId = window.setInterval(() => {
      void runDetection();
    }, 1200);

    return () => {
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [cameraActive, loading]);

  async function lookupResident(valueOverride?: string) {
    const value = (valueOverride ?? qr).trim();
    if (!value) return;
    setLoading(true);
    setResident(null);
    try {
      const res = await fetch(`/api/residents/lookup?qr=${encodeURIComponent(value)}`);
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

  async function lookup(e: React.FormEvent) {
    e.preventDefault();
    await lookupResident(qr);
  }

  function getBarcodeDetector() {
    if (typeof window === "undefined" || !("BarcodeDetector" in window)) return null;
    return new window.BarcodeDetector();
  }

  async function startCamera() {
    if (!scanSupported) {
      toast.error("Camera scanning is not supported in this browser. Please upload an image instead.");
      return;
    }

    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
      toast.success("Camera ready. Point it at the QR code.");
    } catch {
      toast.error("Unable to access your camera. You can still upload a QR image file.");
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }

    stopCamera();

    const reader = new FileReader();
    reader.onload = async () => {
      setPreviewUrl(reader.result as string);
      try {
        const detector = getBarcodeDetector();
        if (!detector) {
          toast.error("QR detection is not supported in this browser. Please enter the code manually.");
          return;
        }

        const imageBitmap = await createImageBitmap(file);
        const [result] = await detector.detect(imageBitmap);
        const value = result?.rawValue?.trim();
        if (value) {
          setQr(value);
          await lookupResident(value);
        } else {
          toast.error("No QR code was detected in the image. Please try another photo.");
        }
      } catch {
        toast.error("We could not read the QR code from that image. Please try another file.");
      }
    };

    reader.readAsDataURL(file);
    event.target.value = "";
  }

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ScanLine className="h-7 w-7 text-primary" />
          Scan QR Code
        </h1>
        <p className="text-muted-foreground">Verify a resident by scanning with the camera or uploading a QR image</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scan or enter QR code</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={startCamera} disabled={loading || cameraActive} className="gap-2">
              <Camera className="h-4 w-4" />
              {cameraActive ? "Camera active" : "Open camera"}
            </Button>
            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-2">
              <Upload className="h-4 w-4" />
              Upload image
            </Button>
            {cameraActive && (
              <Button type="button" variant="outline" onClick={stopCamera} className="gap-2">
                Stop camera
              </Button>
            )}
          </div>

          {!scanSupported && (
            <p className="text-sm text-muted-foreground">
              Camera scanning is not available in this browser. You can still upload a QR image file.
            </p>
          )}

          {cameraActive && (
            <div className="rounded-lg border bg-muted/40 p-2">
              <video ref={videoRef} className="w-full rounded-md bg-black" playsInline muted />
            </div>
          )}

          {previewUrl && (
            <div className="rounded-lg border bg-muted/40 p-2">
              <img src={previewUrl} alt="Uploaded QR code preview" className="w-full rounded-md object-contain" />
            </div>
          )}

          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />

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
