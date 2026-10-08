import prisma from "@/utils/prismadb"
import { NextResponse } from "next/server";
import { ADMIN, ApiError, TEACHER, findAttendanceFor, readJson, withAuth } from "@/utils/apiAuth";

// Marks the students recognized by the camera as present, for either the
// IN (status true) or the OUT (status false) attendance.
export const PUT = withAuth([ADMIN, TEACHER], async (request, { params }, user) => {
    const { id } = await params;
    const record = await findAttendanceFor(user, id);
    const { studentIds, status } = await readJson(request);
    if (!Array.isArray(studentIds)) throw new ApiError(400, "Invalid request.");

    const recognized = new Set(studentIds);
    const updatedRecord = await prisma.attendance.update({
        where: { id: record.id },
        data: {
            students: (record.students || []).map((student) => {
                if (!recognized.has(student.id)) return student;
                return status
                    ? { ...student, statusIn: "present" }
                    : { ...student, statusOut: "present" };
            }),
        },
    });
    return NextResponse.json(updatedRecord);
});
