import prisma from "@/utils/prismadb"
import { v2 as cloudinary } from 'cloudinary';
import { NextResponse } from "next/server";
import { getDemoStudent } from "@/utils/demoVisitor";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});


export const POST = async (request) => {
    try {
        const body = await request.json();
        const { owner, facePhoto, faceDescriptor } = body;

        // Demo visitors register their own face instead, so they never share one.
        const demoStudent = await getDemoStudent();
        if (demoStudent && owner === demoStudent.id) {
            return NextResponse.json({ message: "Demo visitors register their face on the Register your face page." }, { status: 403 });
        }

        const uploadResponse = await cloudinary.uploader.upload(facePhoto, {
            upload_preset: "Afratinhs",
            folder: 'FacePhotos'
        });

        if (uploadResponse) {
            const newPost = await prisma.facephotos.create({
                data: {
                    owner,
                    photoPublicId: uploadResponse.public_id,
                    photoUrl: uploadResponse.secure_url,
                    faceDescriptor,
                },
            })
            return NextResponse.json({ message: "Registered", newPost })
        }

    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: "POST Error", error }, { status: 500 });
    }
};