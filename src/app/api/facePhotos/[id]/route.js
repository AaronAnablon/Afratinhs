import prisma from "@/utils/prismadb"
import { NextResponse } from "next/server";
import { ADMIN, findPersonFor, scopeOf, withAuth } from "@/utils/apiAuth";

// Face photos of one student.
export const GET = withAuth([ADMIN], async (request, { params }, user) => {
    const { id } = await params;
    const student = await findPersonFor(user, id);
    const post = await prisma.facephotos.findMany({
        where: { owner: student.id, ...scopeOf(user) },
        select: { id: true, owner: true, photoUrl: true, photoPublicId: true, createdAt: true },
    });
    return NextResponse.json(post);
});

export const revalidate = 0;
