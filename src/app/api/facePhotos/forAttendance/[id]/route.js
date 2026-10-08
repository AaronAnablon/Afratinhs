import prisma from "@/utils/prismadb"
import { NextResponse } from "next/server";
import { getActiveDemoFaces, getDemoStudent, getVisitorId } from "@/utils/demoVisitor";

// Face data for the students in one attendance record. The demo student's
// face is the current visitor's own registered face, never another visitor's.
export const GET = async (request, { params }) => {
    try {
        const { id } = await params;
        const attendance = await prisma.attendance.findUnique({ where: { id } });
        if (!attendance) {
            return NextResponse.json({ message: "Attendance not found" }, { status: 404 });
        }

        const studentIds = (attendance.students || []).map((student) => student.id);
        const demoStudent = await getDemoStudent();

        const faces = await prisma.facephotos.findMany({
            where: { owner: { in: studentIds.filter((studentId) => studentId !== demoStudent?.id) } },
            select: { owner: true, photoUrl: true, photoPublicId: true, faceDescriptor: true },
        });

        const visitorId = await getVisitorId();
        if (demoStudent && visitorId && studentIds.includes(demoStudent.id)) {
            const demoFaces = await getActiveDemoFaces(visitorId);
            faces.push(...demoFaces.map((face) => ({
                owner: demoStudent.id,
                photoUrl: "",
                photoPublicId: "",
                faceDescriptor: face.faceDescriptor,
            })));
        }

        return NextResponse.json(faces);
    } catch (err) {
        console.log(err)
        return NextResponse.json({ message: "GET Error" }, { status: 500 });
    }
};

export const revalidate = 0;
