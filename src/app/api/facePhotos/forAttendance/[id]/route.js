import prisma from "@/utils/prismadb"
import { NextResponse } from "next/server";
import { ADMIN, TEACHER, findAttendanceFor, scopeOf, withAuth } from "@/utils/apiAuth";
import { getActiveDemoFaces, getDemoStudent, getVisitorId } from "@/utils/demoVisitor";

// Face data for the students in one class. The demo student's face is the
// current visitor's own registered face, never another visitor's.
export const GET = withAuth([ADMIN, TEACHER], async (request, { params }, user) => {
    const { id } = await params;
    const attendance = await findAttendanceFor(user, id);

    const studentIds = (attendance.students || []).map((student) => student.id);
    const demoStudent = user.isDemo ? await getDemoStudent() : null;

    const faces = await prisma.facephotos.findMany({
        where: {
            owner: { in: studentIds.filter((studentId) => studentId !== demoStudent?.id) },
            ...scopeOf(user),
        },
        select: { owner: true, faceDescriptor: true },
    });

    const visitorId = await getVisitorId();
    if (demoStudent && visitorId && studentIds.includes(demoStudent.id)) {
        const demoFaces = await getActiveDemoFaces(visitorId);
        faces.push(...demoFaces.map((face) => ({ owner: demoStudent.id, faceDescriptor: face.faceDescriptor })));
    }

    return NextResponse.json(faces);
});

export const revalidate = 0;
