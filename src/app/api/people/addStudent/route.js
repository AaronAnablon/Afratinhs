import prisma from "@/utils/prismadb"
import { NextResponse } from "next/server"
import bcrypt from 'bcrypt';
import {
    ADMIN, STUDENT, addStudentToSection, assertEmailAvailable, demoStamp, readJson,
    requireFields, withAuth, withoutPassword,
} from "@/utils/apiAuth"

// Creates a student and adds them to every class of their section.
export const POST = withAuth([ADMIN], async (request, context, user) => {
    const body = await readJson(request);
    requireFields(body, ["firstName", "lastName", "email", "password", "section"]);

    const email = body.email.trim().toLowerCase();
    await assertEmailAvailable(email);
    const section = body.section.trim();
    const newPost = await prisma.people.create({
        data: {
            firstName: body.firstName.trim(),
            lastName: body.lastName.trim(),
            email,
            homeAddress: body.homeAddress,
            age: body.age,
            contact: body.contact,
            section,
            adviser: body.adviser,
            password: await bcrypt.hash(body.password, 10),
            role: STUDENT,
            ...demoStamp(user),
        },
    })
    await addStudentToSection(user, newPost.id, section);
    return NextResponse.json(withoutPassword(newPost))
});
