import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { uploadImage } from "@/lib/cloudinary";

const schema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  houseNumber: z.string().optional(),
  barangayId: z.string().optional(),
  image: z.string().max(3_500_000).optional(),
});

export async function PATCH(request: Request) {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  try {
    const data = schema.parse(await request.json());
    const userId = authResult.session.user.id;

    let imageUrl: string | undefined;
    if (data.image) {
      if (!/^data:image\/(jpeg|png|webp);base64,/i.test(data.image)) {
        return NextResponse.json({ error: "Profile image must be an image upload." }, { status: 400 });
      }
      try {
        imageUrl = (await uploadImage(data.image, "profiles")).url;
      } catch (error) {
        console.error("[profile] Image provider failed; using database image fallback", error);
        imageUrl = data.image;
      }
    }

    const userData = {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.phone !== undefined ? { phone: data.phone } : {}),
      ...(imageUrl ? { image: imageUrl } : {}),
    };
    if (Object.keys(userData).length > 0) {
      await db.user.update({
        where: { id: userId },
        data: userData,
      });
    }

    const hasResidentProfileFields =
      data.address !== undefined ||
      data.houseNumber !== undefined ||
      data.barangayId !== undefined;
    const isResidentProfileUpdate = authResult.session.user.role === "RESIDENT" && hasResidentProfileFields;
    if (isResidentProfileUpdate) {
      const profileData = {
        ...(data.address !== undefined ? { address: data.address } : {}),
        ...(data.houseNumber !== undefined ? { houseNumber: data.houseNumber } : {}),
        ...(data.barangayId !== undefined ? { barangayId: data.barangayId || null } : {}),
      };
      await db.residentProfile.upsert({
        where: { userId },
        update: profileData,
        create: {
          userId,
          ...profileData,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    console.error("[profile] Update failed", error);
    return NextResponse.json(
      { error: "Unable to update profile. Please try again." },
      { status: 500 },
    );
  }
}
