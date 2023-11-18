import prisma from "@/utils/prismadb"
import { v2 as cloudinary } from 'cloudinary';
import { NextResponse } from "next/server";

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




export const GET = async () => {
    try {
        const posts = await prisma.facephotos.findMany({
        })
        return NextResponse.json(posts, {
            headers: {
                "revalidate": "0"
            }
        });
    } catch (err) {
        console.log(err)
        return NextResponse.json({ message: "GET Error", err }, { status: 500 })
    }
}