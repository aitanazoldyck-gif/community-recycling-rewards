import { db } from "@/lib/db";

export async function getFriendIds(userId: string) {
  const [asA, asB] = await Promise.all([
    db.socialFriendship.findMany({ where: { userAId: userId, status: "ACCEPTED" }, select: { userBId: true } }),
    db.socialFriendship.findMany({ where: { userBId: userId, status: "ACCEPTED" }, select: { userAId: true } }),
  ]);
  return [userId, ...asA.map((item) => item.userBId), ...asB.map((item) => item.userAId)];
}

export function isValidMediaUrl(value: string) {
  return value.startsWith("https://") || value.startsWith("data:image/") || value.startsWith("data:video/");
}
