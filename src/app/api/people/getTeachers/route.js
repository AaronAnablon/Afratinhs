import prisma from "@/utils/prismadb"
import { NextResponse } from "next/server"
import { ADMIN, TEACHER, peopleScopeOf, withAuth, withoutPassword } from "@/utils/apiAuth"

export const GET = withAuth([ADMIN], async (request, context, user) => {
    const posts = await prisma.people.findMany({ where: { role: TEACHER, ...peopleScopeOf(user) } })
    return NextResponse.json(posts.map(withoutPassword));
});

export const revalidate = 0;
