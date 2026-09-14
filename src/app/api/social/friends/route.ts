import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/api-auth";
import { db } from "@/lib/db";

const requestSchema = z.object({ receiverId: z.string().min(1) });
const decisionSchema = z.object({ requestId: z.string().min(1), status: z.enum(["ACCEPTED", "DECLINED"]) });

export async function GET() {
  const result = await requireRole(["RESIDENT"]);
  if ("error" in result) return result.error;
  const userId = result.session.user.id;
  const [asA, asB, requests] = await Promise.all([
    db.socialFriendship.findMany({ where: { userAId: userId, status: "ACCEPTED" }, include: { userB: { select: { id: true, name: true, image: true } } } }),
    db.socialFriendship.findMany({ where: { userBId: userId, status: "ACCEPTED" }, include: { userA: { select: { id: true, name: true, image: true } } } }),
    db.socialFriendRequest.findMany({ where: { receiverId: userId, status: "PENDING" }, orderBy: { createdAt: "desc" }, include: { sender: { select: { id: true, name: true, image: true } } } }),
  ]);
  return NextResponse.json({ friends: [...asA.map((x) => x.userB), ...asB.map((x) => x.userA)], requests });
}

export async function POST(request: Request) {
  const result = await requireRole(["RESIDENT"]);
  if ("error" in result) return result.error;
  try {
    const { receiverId } = requestSchema.parse(await request.json());
    if (receiverId === result.session.user.id) return NextResponse.json({ error: "You cannot add yourself." }, { status: 400 });
    const item = await db.socialFriendRequest.upsert({ where: { senderId_receiverId: { senderId: result.session.user.id, receiverId } }, update: { status: "PENDING" }, create: { senderId: result.session.user.id, receiverId } });
    return NextResponse.json(item, { status: 201 });
  } catch { return NextResponse.json({ error: "Unable to send friend request." }, { status: 400 }); }
}

export async function PATCH(request: Request) {
  const result = await requireRole(["RESIDENT"]);
  if ("error" in result) return result.error;
  try {
    const { requestId, status } = decisionSchema.parse(await request.json());
    const friendRequest = await db.socialFriendRequest.findFirst({ where: { id: requestId, receiverId: result.session.user.id, status: "PENDING" } });
    if (!friendRequest) return NextResponse.json({ error: "Friend request not found." }, { status: 404 });
    const updated = await db.$transaction(async (tx) => {
      const requestResult = await tx.socialFriendRequest.update({ where: { id: requestId }, data: { status } });
      if (status === "ACCEPTED") {
        const [userAId, userBId] = [friendRequest.senderId, friendRequest.receiverId].sort();
        await tx.socialFriendship.upsert({ where: { userAId_userBId: { userAId, userBId } }, update: { status: "ACCEPTED" }, create: { userAId, userBId, status: "ACCEPTED" } });
      }
      return requestResult;
    });
    return NextResponse.json(updated);
  } catch { return NextResponse.json({ error: "Unable to update friend request." }, { status: 400 }); }
}
