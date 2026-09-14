import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const POINTS_PER_CENTAVO = 1;
export const PHP_PER_POINT = 0.01;
export const GCASH_MINIMUM_PESOS = 100;
export const GCASH_MINIMUM_POINTS = GCASH_MINIMUM_PESOS / PHP_PER_POINT;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPoints(points: number): string {
  return new Intl.NumberFormat("en-PH").format(points);
}

export function formatWeight(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(2)} t`;
  return `${kg.toFixed(2)} kg`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(amount);
}

export function pointsToCurrency(points: number): number {
  return points * PHP_PER_POINT;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
