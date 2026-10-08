import prisma from "@/utils/prismadb"
import { NextResponse } from "next/server";
import { ADMIN, ApiError, STUDENT, TEACHER, forViewer, scopeOf, withAuth } from "@/utils/apiAuth";

// All classes of a section. Teachers get only their own classes in it, and
// students only their own section with only their own attendance row.
export const GET = withAuth([ADMIN, TEACHER, STUDENT], async (request, { params }, user) => {
    const { id: section } = await params;
    const where = { section, ...scopeOf(user) };

    if (user.role === TEACHER) where.teacher = user.id;
    if (user.role === STUDENT) {
        const me = await prisma.people.findUnique({ where: { id: user.id }, select: { section: true } });
        if (me?.section !== section) throw new ApiError(403, "You can only see your own section.");
    }

    const records = await prisma.attendance.findMany({ where });
    return NextResponse.json(records.map((record) => forViewer(user, record)));
});

export const revalidate = 0;
