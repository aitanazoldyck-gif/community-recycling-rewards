"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { ArrowLeft, Check, ChevronRight, Clock3, Globe2, Heart, LockKeyhole, LogOut, MapPin, Pencil, Trash2, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { prepareProfileImage } from "@/lib/profile-image";

type Barangay = { id: string; name: string };

export function ProfileForm({
  user,
  profile,
  barangays,
}: {
  user: { name: string | null; email: string; phone: string | null; image: string | null };
  profile: { address: string; houseNumber: string; barangayId: string; barangayName: string };
  barangays: Barangay[];
}) {
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [image, setImage] = useState(user.image ?? "");
  const [form, setForm] = useState({
    name: user.name ?? "",
    phone: user.phone ?? "",
    address: profile.address,
    houseNumber: profile.houseNumber,
    barangayId: profile.barangayId,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          image: image.startsWith("data:image/") ? image : undefined,
        }),
      });
      const result = await res.json().catch(() => null);
      if (!res.ok) throw new Error(result?.error ?? "Update failed");
      toast.success("Profile updated!");
      setEditing(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update profile");
    } finally {
      setLoading(false);
    }
  }

  const menuItems = [
    { label: "Favourites", icon: Heart },
    { label: "Downloads", icon: LockKeyhole },
    { label: "Language", icon: Globe2 },
    { label: "Location", icon: MapPin },
    { label: "Display", icon: UserRound },
    { label: "Feed preference", icon: Clock3 },
  ];

  if (!editing) {
    return (
      <div className="mx-auto max-w-xl rounded-[2rem] border border-border/60 bg-card p-5 shadow-sm sm:p-8">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" aria-label="Back" onClick={() => window.history.back()}><ArrowLeft className="h-5 w-5" /></Button>
          <h1 className="text-base font-semibold">My Profile</h1>
          <Button variant="ghost" size="icon" aria-label="Profile settings"><Pencil className="h-4 w-4" /></Button>
        </div>
        <div className="mt-8 flex items-center gap-4 border-b border-border/60 pb-7">
          <Avatar className="h-20 w-20 ring-4 ring-primary/10">
            <AvatarImage src={image || undefined} />
            <AvatarFallback className="text-xl">{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-xl font-bold">{user.name || "Resident"}</h2>
            <p className="truncate text-sm text-muted-foreground">{user.email}</p>
            <p className="mt-1 text-xs text-muted-foreground">{profile.barangayName}</p>
          </div>
          <Button onClick={() => setEditing(true)} className="shrink-0">Edit Profile</Button>
        </div>
        <div className="divide-y divide-border/60">
          {menuItems.map(({ label, icon: Icon }) => (
            <button key={label} type="button" className="flex w-full items-center gap-4 py-4 text-left text-sm transition hover:text-primary">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <span className="flex-1">{label}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          ))}
          <button type="button" className="flex w-full items-center gap-4 py-4 text-left text-sm text-muted-foreground transition hover:text-destructive"><Trash2 className="h-4 w-4" /><span className="flex-1">Clear cache</span><ChevronRight className="h-4 w-4" /></button>
          <button type="button" onClick={() => void signOut({ callbackUrl: `${window.location.origin}/` })} className="flex w-full items-center gap-4 py-4 text-left text-sm text-destructive"><LogOut className="h-4 w-4" /><span className="flex-1">Log out</span><ChevronRight className="h-4 w-4" /></button>
        </div>
        <p className="pt-6 text-center text-xs text-muted-foreground/60">EcoRewards profile</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl rounded-[2rem] border border-border/60 bg-card p-5 shadow-sm sm:p-8">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" aria-label="Back to profile" onClick={() => setEditing(false)}><ArrowLeft className="h-5 w-5" /></Button>
        <h1 className="text-base font-semibold">Edit Profile</h1>
        <Button variant="ghost" size="icon" aria-label="Save profile" type="submit" form="profile-edit-form" disabled={loading}><Check className="h-5 w-5 text-emerald-600" /></Button>
      </div>
      <div className="mt-8 flex justify-center">
        <label htmlFor="profile-image" className="relative block cursor-pointer">
          <Avatar className="h-24 w-24 ring-4 ring-primary/10"><AvatarImage src={image || undefined} /><AvatarFallback className="text-2xl">{getInitials(form.name)}</AvatarFallback></Avatar>
          <span className="absolute bottom-0 right-0 rounded-full bg-primary px-2 py-1 text-[10px] font-semibold text-primary-foreground">Change</span>
        </label>
        <input id="profile-image" type="file" accept="image/*" className="sr-only" onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          if (!file.type.startsWith("image/")) return toast.error("Choose an image file.");
          if (file.size > 6 * 1024 * 1024) return toast.error("Profile image must be smaller than 6 MB.");
          void prepareProfileImage(file)
            .then(setImage)
            .catch((error: unknown) => toast.error(error instanceof Error ? error.message : "Unable to process image file."));
        }} />
      </div>
      <form id="profile-edit-form" onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div className="space-y-3"><h2 className="text-sm font-semibold">Your Information</h2>
          <div><Label htmlFor="name">Full name</Label><Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label htmlFor="phone">Phone</Label><Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div><Label htmlFor="email">Email ID</Label><Input id="email" value={user.email} disabled /></div>
          <div><Label htmlFor="barangay">Barangay</Label><select id="barangay" value={form.barangayId} onChange={(e) => setForm({ ...form, barangayId: e.target.value })} className="flex h-11 w-full rounded-xl border border-border/80 bg-background px-4 text-sm"><option value="">Select barangay</option>{barangays.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
          <div><Label htmlFor="house">House number</Label><Input id="house" value={form.houseNumber} onChange={(e) => setForm({ ...form, houseNumber: e.target.value })} /></div>
          <div><Label htmlFor="address">Address</Label><Input id="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
        </div>
        <Button type="submit" className="w-full" disabled={loading}>{loading ? "Saving..." : "Save changes"}</Button>
      </form>
    </div>
  );
}
