import prisma from "@/utils/prismadb"
import { NextResponse } from "next/server"
import { ADMIN, ApiError, STUDENT, TEACHER, scopeOf, withAuth, withoutPassword } from "@/utils/apiAuth"

// Students of a section. Teachers can only list sections they teach.
export const GET = withAuth([ADMIN, TEACHER], async (request, { params }, user) => {
    const { id: section } = await params;
    if (user.role === TEACHER) {
        const teaches = await prisma.attendance.findFirst({
            where: { section, teacher: user.id, ...scopeOf(user) },
            select: { id: true },
        });
        if (!teaches) throw new ApiError(403, "You don't teach this section.");
    }
    const post = await prisma.people.findMany({ where: { section, role: STUDENT, ...scopeOf(user) } });
    return NextResponse.json(post.map(withoutPassword));
});

export const revalidate = 0;
