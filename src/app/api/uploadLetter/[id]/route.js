import prisma from "@/utils/prismadb";
import { v2 as cloudinary } from 'cloudinary';
import { NextResponse } from "next/server";
import { ADMIN, ApiError, STUDENT, findAttendanceFor, forViewer, readJson, withAuth } from "@/utils/apiAuth";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

// Uploads an excuse letter for a student's absence. Students can only
// upload their own; admins can upload for anyone in the class.
export const PUT = withAuth([ADMIN, STUDENT], async (request, { params }, user) => {
    const { id } = await params;
    const record = await findAttendanceFor(user, id);
    const { file, studentId } = await readJson(request);

    if (user.role === STUDENT && studentId !== user.id) throw new ApiError(403, "You can only upload your own letter.");
    if (!(record.students || []).some((student) => student.id === studentId)) {
        throw new ApiError(404, "That student isn't in this class.");
    }
    if (typeof file !== "string" || !file.startsWith("data:image/")) throw new ApiError(400, "Please choose an image.");

    const uploadResponse = await cloudinary.uploader.upload(file, {
        upload_preset: "Afratinhs",
        folder: 'Letters'
    });

    const updatedRecord = await prisma.attendance.update({
        where: { id: record.id },
        data: {
            students: record.students.map((student) => student.id === studentId
                ? { ...student, letterUrl: uploadResponse.secure_url, letterPublicId: uploadResponse.public_id }
                : student),
        },
    });
    return NextResponse.json(forViewer(user, updatedRecord));
});
