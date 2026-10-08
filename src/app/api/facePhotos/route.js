import prisma from "@/utils/prismadb"
import { v2 as cloudinary } from 'cloudinary';
import { NextResponse } from "next/server";
import { ADMIN, ApiError, STUDENT, demoStamp, findPersonFor, readJson, withAuth } from "@/utils/apiAuth";
import { isDemoEmail } from "@/globalData/demoAccounts";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

// Saves a face photo for a student so the camera can recognize them.
export const POST = withAuth([ADMIN], async (request, context, user) => {
    // Demo data is shared by every visitor, so a photo saved here would show a
    // visitor's face to the others. Visitors register their own face instead.
    if (user.isDemo) throw new ApiError(403, "In the demo, register your own face on the Register your face page.");

    const { owner, facePhoto, faceDescriptor } = await readJson(request);
    const student = await findPersonFor(user, owner);
    if (student.role !== STUDENT) throw new ApiError(400, "Face photos are only for students.");
    if (isDemoEmail(student.email)) {
        throw new ApiError(403, "Demo visitors register their face on the Register your face page.");
    }
    if (typeof facePhoto !== "string" || !facePhoto.startsWith("data:image/")) throw new ApiError(400, "Please choose an image.");
    if (String(faceDescriptor ?? "").split(",").length !== 128) throw new ApiError(400, "Exactly one face must be visible.");

    const uploadResponse = await cloudinary.uploader.upload(facePhoto, {
        upload_preset: "Afratinhs",
        folder: 'FacePhotos'
    });
    const newPost = await prisma.facephotos.create({
        data: {
            owner: student.id,
            photoPublicId: uploadResponse.public_id,
            photoUrl: uploadResponse.secure_url,
            faceDescriptor,
            ...demoStamp(user),
        },
    })
    return NextResponse.json({ message: "Registered", newPost })
});
