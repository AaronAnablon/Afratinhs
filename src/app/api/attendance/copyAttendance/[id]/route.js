import prisma from "@/utils/prismadb";
import { NextResponse } from "next/server";
import { ADMIN, ApiError, TEACHER, findAttendanceFor, readJson, scopeOf, withAuth } from "@/utils/apiAuth";

// Copies the attendance statuses from another class (found by its 5-digit
// code) of the same section into this class.
export const PUT = withAuth([ADMIN, TEACHER], async (request, { params }, user) => {
    const { id } = await params;
    const target = await findAttendanceFor(user, id);
    const { code } = await readJson(request);

    const source = await prisma.attendance.findFirst({
        where: { code: parseInt(code, 10) || -1, ...scopeOf(user) },
    });
    if (!source) throw new ApiError(404, "No class found with that code.");
    if (source.id === target.id) throw new ApiError(400, "That is this class's own code.");
    if (source.section !== target.section) throw new ApiError(400, "That class is for a different section.");

    const sourceById = new Map((source.students || []).map((student) => [student.id, student]));
    const updatedRecord = await prisma.attendance.update({
        where: { id: target.id },
        data: {
            students: (target.students || []).map((student) => {
                const copied = sourceById.get(student.id);
                return copied ? { ...student, statusIn: copied.statusIn, statusOut: copied.statusOut } : student;
            }),
        },
    });
    return NextResponse.json(updatedRecord);
});
