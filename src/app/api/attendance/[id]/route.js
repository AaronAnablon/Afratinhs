import prisma from "@/utils/prismadb"
import { NextResponse } from "next/server";
import {
    ADMIN, ApiError, TEACHER, findAttendanceFor, isObjectId, peopleScopeOf, readJson,
    requireFields, scopeOf, sectionStudents, withAuth,
} from "@/utils/apiAuth";

// All classes of one teacher. Teachers can only list their own.
export const GET = withAuth([ADMIN, TEACHER], async (request, { params }, user) => {
    const { id } = await params;
    if (user.role === TEACHER && id !== user.id) throw new ApiError(403, "You can only see your own classes.");
    const post = await prisma.attendance.findMany({ where: { teacher: id, ...scopeOf(user) } });
    return NextResponse.json(post);
});

export const revalidate = 0;

export const PUT = withAuth([ADMIN], async (request, { params }, user) => {
    const { id } = await params;
    const record = await findAttendanceFor(user, id);
    const { data } = await readJson(request);
    requireFields(data, ["date", "time", "teacher", "event", "section"]);

    const teacherAccount = isObjectId(data.teacher) && await prisma.people.findFirst({
        where: { id: data.teacher, role: TEACHER, ...peopleScopeOf(user) },
    });
    if (!teacherAccount) throw new ApiError(404, "Teacher not found.");

    const section = data.section.trim();
    const updatePost = await prisma.attendance.update({
        where: { id: record.id },
        data: {
            date: data.date,
            time: data.time,
            teacher: data.teacher,
            event: data.event.trim(),
            section,
            // Moving the class to another section switches its student list too.
            ...(section !== record.section && { students: await sectionStudents(user, section) }),
        },
    });
    return NextResponse.json(updatePost);
});

export const DELETE = withAuth([ADMIN], async (request, { params }, user) => {
    const { id } = await params;
    const record = await findAttendanceFor(user, id);
    await prisma.attendance.delete({ where: { id: record.id } });
    return NextResponse.json({ message: "Deleted" });
});
