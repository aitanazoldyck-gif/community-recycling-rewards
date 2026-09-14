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
  const [asA, asB, requests, sentRequests, residents] = await Promise.all([
    db.socialFriendship.findMany({ where: { userAId: userId, status: "ACCEPTED" }, include: { userB: { select: { id: true, name: true, image: true } } } }),
    db.socialFriendship.findMany({ where: { userBId: userId, status: "ACCEPTED" }, include: { userA: { select: { id: true, name: true, image: true } } } }),
    db.socialFriendRequest.findMany({ where: { receiverId: userId, status: "PENDING" }, orderBy: { createdAt: "desc" }, include: { sender: { select: { id: true, name: true, image: true } } } }),
    db.socialFriendRequest.findMany({ where: { senderId: userId, status: "PENDING" }, select: { id: true, receiverId: true } }),
    db.user.findMany({ where: { id: { not: userId }, role: "RESIDENT", isActive: true, deletedAt: null }, select: { id: true, name: true, image: true }, orderBy: { name: "asc" } }),
  ]);
  const friends = [...asA.map((x) => x.userB), ...asB.map((x) => x.userA)];
  const friendIds = new Set(friends.map((friend) => friend.id));
  const friendSets = await Promise.all(friends.map(async (friend) => {
    const [friendA, friendB] = await Promise.all([
      db.socialFriendship.findMany({ where: { userAId: friend.id, status: "ACCEPTED" }, select: { userBId: true } }),
      db.socialFriendship.findMany({ where: { userBId: friend.id, status: "ACCEPTED" }, select: { userAId: true } }),
    ]);
    return new Set([...friendA.map((item) => item.userBId), ...friendB.map((item) => item.userAId)]);
  }));
  const mutualFor = (index: number) => [...friendSets[index]].filter((id) => friendIds.has(id)).length;
  const friendCards = friends.map((friend, index) => ({ ...friend, status: "FRIEND", mutualCount: mutualFor(index) }));
  const incoming = requests.map((request) => ({ ...request.sender, status: "INCOMING", requestId: request.id }));
  const sentIds = new Set(sentRequests.map((request) => request.receiverId));
  const allFriendships = await db.socialFriendship.findMany({ where: { status: "ACCEPTED" }, select: { userAId: true, userBId: true } });
  const mutualCountFor = (candidateId: string) => allFriendships.filter((friendship) => {
    const connectsCandidate = friendship.userAId === candidateId || friendship.userBId === candidateId;
    const otherId = friendship.userAId === candidateId ? friendship.userBId : friendship.userAId;
    return connectsCandidate && friendIds.has(otherId);
  }).length;
  const suggestions = residents
    .filter((resident) => !friendIds.has(resident.id) && !incoming.some((request) => request.id === resident.id))
    .map((suggestion) => ({
      ...suggestion,
      status: sentIds.has(suggestion.id) ? "SENT" : "SUGGESTION",
      requestId: sentRequests.find((request) => request.receiverId === suggestion.id)?.id,
      mutualCount: mutualCountFor(suggestion.id),
    }));
  return NextResponse.json({ friends: friendCards, requests: incoming, suggestions });
}

export async function DELETE(request: Request) {
  const result = await requireRole(["RESIDENT"]);
  if ("error" in result) return result.error;
  const requestId = new URL(request.url).searchParams.get("requestId");
  if (!requestId) return NextResponse.json({ error: "Friend request ID is required." }, { status: 400 });
  const deleted = await db.socialFriendRequest.deleteMany({ where: { id: requestId, senderId: result.session.user.id, status: "PENDING" } });
  if (deleted.count === 0) return NextResponse.json({ error: "Pending friend request not found." }, { status: 404 });
  return NextResponse.json({ success: true });
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
