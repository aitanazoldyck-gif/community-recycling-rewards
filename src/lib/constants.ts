import type { UserRole, WasteType } from "@/generated/prisma/enums";

export const APP_NAME = "EcoRewards";
export const APP_TAGLINE =
  "Transforming Waste into Rewards through Smart Recycling.";

/** Demo accounts seeded on deploy — use @example.com (valid for HTML/Zod email checks). */
export const DEMO_ACCOUNTS = [
  { role: "Admin", email: "admin@example.com", password: "Admin123!" },
  { role: "Staff", email: "staff@example.com", password: "Staff123!" },
  { role: "Resident", email: "resident@example.com", password: "Resident123!" },
] as const;

export const COLORS = {
  primary: "#16A34A",
  secondary: "#10B981",
  accent: "#84CC16",
  warning: "#F59E0B",
  danger: "#EF4444",
  background: "#F8FAFC",
} as const;

export const ROLE_DASHBOARD: Record<UserRole, string> = {
  ADMIN: "/admin",
  COLLECTION_STAFF: "/staff",
  BARANGAY_STAFF: "/barangay",
  RESIDENT: "/resident",
  GUEST: "/",
};

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Administrator",
  COLLECTION_STAFF: "Collection Staff",
  BARANGAY_STAFF: "Barangay Staff",
  RESIDENT: "Resident",
  GUEST: "Guest",
};

export const WASTE_TYPE_LABELS: Record<WasteType, string> = {
  PLASTIC: "Plastic",
  PAPER: "Paper",
  GLASS: "Glass",
  METAL: "Metal",
  ELECTRONICS: "Electronics",
  ORGANIC: "Organic",
  TEXTILE: "Textile",
  HAZARDOUS: "Hazardous",
  OTHER: "Other",
};

export const DEFAULT_WASTE_CATEGORIES: {
  type: WasteType;
  name: string;
  pointsPerKg: number;
  carbonFactorKg: number;
}[] = [
  { type: "PLASTIC", name: "Plastic", pointsPerKg: 10, carbonFactorKg: 2.5 },
  { type: "PAPER", name: "Paper", pointsPerKg: 8, carbonFactorKg: 1.8 },
  { type: "GLASS", name: "Glass", pointsPerKg: 12, carbonFactorKg: 0.8 },
  { type: "METAL", name: "Metal", pointsPerKg: 15, carbonFactorKg: 4.0 },
  {
    type: "ELECTRONICS",
    name: "Electronics",
    pointsPerKg: 25,
    carbonFactorKg: 6.0,
  },
  { type: "ORGANIC", name: "Organic", pointsPerKg: 5, carbonFactorKg: 0.5 },
  { type: "TEXTILE", name: "Textile", pointsPerKg: 7, carbonFactorKg: 1.2 },
  {
    type: "HAZARDOUS",
    name: "Hazardous",
    pointsPerKg: 20,
    carbonFactorKg: 3.0,
  },
  { type: "OTHER", name: "Other", pointsPerKg: 3, carbonFactorKg: 0.3 },
];
