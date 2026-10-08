import prisma from "@/utils/prismadb"
import { NextResponse } from "next/server"
import {
    ADMIN, ApiError, TEACHER, demoStamp, generateUniqueCode, isObjectId, readJson,
    requireFields, scopeOf, sectionStudents, withAuth,
} from "@/utils/apiAuth"

// Creates one class schedule per date for a teacher. The student list is
// filled from the students currently in the section.
export const POST = withAuth([ADMIN], async (request, context, user) => {
    const { dates, time, teacher, event, section } = await readJson(request);
    requireFields({ time, teacher, event, section }, ["time", "teacher", "event", "section"]);
    if (!Array.isArray(dates) || dates.length === 0) throw new ApiError(400, "Pick at least one date.");

    const teacherAccount = isObjectId(teacher) && await prisma.people.findFirst({
        where: { id: teacher, role: TEACHER, ...scopeOf(user) },
    });
    if (!teacherAccount) throw new ApiError(404, "Teacher not found.");

    const students = await sectionStudents(user, section.trim());
    const newPosts = [];
    for (const date of dates) {
        newPosts.push(await prisma.attendance.create({
            data: {
                isOn: false,
                date,
                time,
                teacher,
                event: event.trim(),
                code: await generateUniqueCode(),
                section: section.trim(),
                students,
                ...demoStamp(user),
            },
        }));
    }
    return NextResponse.json({ message: "Registered", newPosts });
});

export const GET = withAuth([ADMIN], async (request, context, user) => {
    const posts = await prisma.attendance.findMany({ where: scopeOf(user) });
    return NextResponse.json(posts);
});

export const revalidate = 0;
