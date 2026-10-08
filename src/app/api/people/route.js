import prisma from "@/utils/prismadb"
import { NextResponse } from "next/server"
import bcrypt from 'bcrypt';
import {
    ADMIN, ApiError, TEACHER, assertEmailAvailable, demoStamp, readJson,
    requireFields, scopeOf, withAuth, withoutPassword,
} from "@/utils/apiAuth"

// Creates a teacher or admin account. Students are created through addStudent.
export const POST = withAuth([ADMIN], async (request, context, user) => {
    const body = await readJson(request);
    requireFields(body, ["firstName", "lastName", "email", "password"]);
    const role = Number(body.role ?? TEACHER);
    if (![ADMIN, TEACHER].includes(role)) throw new ApiError(400, "Invalid role.");

    const email = body.email.trim().toLowerCase();
    await assertEmailAvailable(email);
    const newPost = await prisma.people.create({
        data: {
            firstName: body.firstName.trim(),
            lastName: body.lastName.trim(),
            email,
            password: await bcrypt.hash(body.password, 10),
            role,
            ...demoStamp(user),
        },
    })
    return NextResponse.json({ message: "Registered", newPost: withoutPassword(newPost) })
});

export const GET = withAuth([ADMIN], async (request, context, user) => {
    const posts = await prisma.people.findMany({ where: scopeOf(user) })
    return NextResponse.json(posts.map(withoutPassword));
});

export const revalidate = 0;
