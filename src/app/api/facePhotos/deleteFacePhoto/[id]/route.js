import prisma from "@/utils/prismadb"
import { v2 as cloudinary } from 'cloudinary';
import { NextResponse } from "next/server";
import { ADMIN, ApiError, isObjectId, scopeOf, withAuth } from "@/utils/apiAuth";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

export const PUT = withAuth([ADMIN], async (request, { params }, user) => {
    const { id } = await params;
    const photo = isObjectId(id) && await prisma.facephotos.findFirst({ where: { id, ...scopeOf(user) } });
    if (!photo) throw new ApiError(404, "Photo not found.");

    await cloudinary.uploader.destroy(photo.photoPublicId, { invalidate: true });
    const deletePhoto = await prisma.facephotos.delete({ where: { id: photo.id } });
    return NextResponse.json({ id: deletePhoto.id });
});
