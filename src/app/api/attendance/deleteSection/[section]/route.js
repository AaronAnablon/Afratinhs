import prisma from "@/utils/prismadb"
import { NextResponse } from "next/server";
import { ADMIN, STUDENT, peopleScopeOf, scopeOf, withAuth } from "@/utils/apiAuth";
import { DEMO_ACCOUNTS } from "@/globalData/demoAccounts";

// Deletes a section's classes and its student accounts (never the demo accounts).
export const DELETE = withAuth([ADMIN], async (request, { params }, user) => {
    const { section } = await params;
    const studentWhere = {
        section,
        role: STUDENT,
        email: { notIn: DEMO_ACCOUNTS.map((account) => account.email) },
        ...peopleScopeOf(user),
    };
    const students = await prisma.people.findMany({ where: studentWhere, select: { id: true } });

    await prisma.attendance.deleteMany({ where: { section, ...scopeOf(user) } });
    await prisma.facephotos.deleteMany({ where: { owner: { in: students.map((student) => student.id) } } });
    await prisma.people.deleteMany({ where: studentWhere });
    return NextResponse.json({ message: "Deleted" });
});
