import prisma from "@/utils/prismadb";
import { v2 as cloudinary } from 'cloudinary';
import { NextResponse } from "next/server";
import { ADMIN, ApiError, findPersonFor, readJson, withAuth, withoutPassword } from "@/utils/apiAuth";
import { isDemoEmail } from "@/globalData/demoAccounts";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

// Changes a profile photo. Anyone can change their own; admins can change anyone's.
export const PUT = withAuth(null, async (request, { params }, user) => {
    const { id } = await params;
    if (id !== user.id && user.role !== ADMIN) throw new ApiError(403, "You can only change your own photo.");
    const person = await findPersonFor(user, id);
    if (isDemoEmail(person.email)) throw new ApiError(403, "Demo accounts can't change their profile photo.");

    const { file } = await readJson(request);
    if (typeof file !== "string" || !file.startsWith("data:image/")) throw new ApiError(400, "Please choose an image.");

    if (person.profilePublicId) {
        await cloudinary.uploader.destroy(person.profilePublicId, { invalidate: true });
    }
    const cloudinaryUploadResponse = await cloudinary.uploader.upload(file, {
        upload_preset: "Afratinhs",
        folder: 'Profile'
    });
    const updatePost = await prisma.people.update({
        where: { id: person.id },
        data: {
            profilePublicId: cloudinaryUploadResponse.public_id,
            profile: cloudinaryUploadResponse.secure_url,
        }
    });
    return NextResponse.json(withoutPassword(updatePost));
});
