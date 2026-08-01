import { NextResponse } from "next/server";

const categories = [
  { id: "biodegradable-waste", name: "Biodegradable Waste (Organic)", pointsPerKg: 5, type: "ORGANIC" },
  { id: "recyclable-plastic", name: "Recyclable Waste (Plastic)", pointsPerKg: 10, type: "PLASTIC" },
  { id: "recyclable-paper", name: "Recyclable Waste (Paper)", pointsPerKg: 8, type: "PAPER" },
  { id: "recyclable-glass", name: "Recyclable Waste (Glass)", pointsPerKg: 12, type: "GLASS" },
  { id: "recyclable-metal", name: "Recyclable Waste (Metal)", pointsPerKg: 15, type: "METAL" },
  { id: "residual-waste", name: "Residual Waste (Non-Recyclable)", pointsPerKg: 3, type: "OTHER" },
  { id: "hazardous-waste", name: "Hazardous Waste", pointsPerKg: 20, type: "HAZARDOUS" },
  { id: "electronic-waste", name: "Electronic Waste (E-Waste)", pointsPerKg: 25, type: "ELECTRONICS" },
  { id: "medical-waste", name: "Medical Waste", pointsPerKg: 7, type: "TEXTILE" },
  { id: "construction-waste", name: "Construction Waste", pointsPerKg: 4, type: "OTHER" },
];

export async function GET() {
  return NextResponse.json(categories);
}
