import prisma from "@/utils/prismadb"
import { NextResponse } from "next/server";
import { ADMIN, ApiError, TEACHER, findAttendanceFor, readJson, withAuth } from "@/utils/apiAuth";

const STATUSES = ["present", "absent"];

// Sets one student's IN and OUT status for a class.
export const PUT = withAuth([ADMIN, TEACHER], async (request, { params }, user) => {
    const { id } = await params;
    const record = await findAttendanceFor(user, id);
    const { studentId, statusIn, statusOut } = await readJson(request);

    if (![statusIn, statusOut].every((status) => status === undefined || STATUSES.includes(status))) {
        throw new ApiError(400, "Status must be present or absent.");
    }
    if (!(record.students || []).some((student) => student.id === studentId)) {
        throw new ApiError(404, "That student isn't in this class.");
    }

    const updatedRecord = await prisma.attendance.update({
        where: { id: record.id },
        data: {
            students: record.students.map((student) => student.id === studentId
                ? { ...student, statusIn, statusOut }
                : student),
        },
    });
    return NextResponse.json(updatedRecord);
});
