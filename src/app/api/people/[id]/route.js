import prisma from "@/utils/prismadb"
import { NextResponse } from "next/server";
import bcrypt from 'bcrypt';
import {
    ADMIN, ApiError, STUDENT, TEACHER, addStudentToSection, assertEmailAvailable,
    findPersonFor, readJson, removeStudentFromSection, requireFields, scopeOf, withAuth, withoutPassword,
} from "@/utils/apiAuth";
import { isDemoEmail } from "@/globalData/demoAccounts";

const assertNotDemoAccount = (person) => {
    if (isDemoEmail(person.email)) throw new ApiError(403, "Demo accounts can't be changed.");
};

export const GET = withAuth(null, async (request, { params }, user) => {
    const { id } = await params;
    const person = await findPersonFor(user, id);
    return NextResponse.json(withoutPassword(person));
});

export const PUT = withAuth([ADMIN], async (request, { params }, user) => {
    const { id } = await params;
    const person = await findPersonFor(user, id);
    assertNotDemoAccount(person);

    const { data } = await readJson(request);
    requireFields(data, ["firstName", "lastName", "email"]);
    const email = data.email.trim().toLowerCase();
    await assertEmailAvailable(user, email, person.id);

    const updateData = {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email,
    };
    if (person.role === STUDENT) {
        requireFields(data, ["section"]);
        Object.assign(updateData, {
            homeAddress: data.homeAddress,
            age: data.age,
            contact: data.contact,
            section: data.section.trim(),
            adviser: data.adviser,
        });
    }
    if (data.password) {
        updateData.password = await bcrypt.hash(data.password, 10);
    }

    const updatePost = await prisma.people.update({ where: { id: person.id }, data: updateData })

    // Moving a student to another section moves them between class lists too.
    if (person.role === STUDENT && updateData.section !== person.section) {
        await removeStudentFromSection(user, person.id, person.section);
        await addStudentToSection(user, person.id, updateData.section);
    }
    return NextResponse.json(withoutPassword(updatePost));
});

export const DELETE = withAuth([ADMIN], async (request, { params }, user) => {
    const { id } = await params;
    const person = await findPersonFor(user, id);
    assertNotDemoAccount(person);
    if (person.id === user.id) throw new ApiError(400, "You can't delete your own account.");

    if (person.role === STUDENT) {
        await removeStudentFromSection(user, person.id, person.section);
        await prisma.facephotos.deleteMany({ where: { owner: person.id } });
    }
    if (person.role === TEACHER) {
        await prisma.attendance.deleteMany({ where: { teacher: person.id, ...scopeOf(user) } });
    }
    await prisma.people.delete({ where: { id: person.id } });
    return NextResponse.json({ message: "Deleted" });
});
