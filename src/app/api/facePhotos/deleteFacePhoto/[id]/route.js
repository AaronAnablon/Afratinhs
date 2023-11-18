import prisma from "@/utils/prismadb"
import { v2 as cloudinary } from 'cloudinary';
import { NextResponse } from "next/server";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

export const PUT = async (request, { params }) => {
    try {
        const { id } = params;
        const body = await request.json();
        const { photoPublicId } = body;

        const destroy = await cloudinary.uploader.destroy(photoPublicId, { invalidate: true });
        if (destroy) {
            const deletePhoto = await prisma.facephotos.delete({
                where: {
                    id
                }
            });
            return NextResponse.json(deletePhoto);
        }
    } catch (err) {
        console.log(err)
        return NextResponse.json({ message: "DELETE Error", err }, { status: 500 });
    }
};
