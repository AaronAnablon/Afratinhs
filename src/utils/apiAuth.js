import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import prisma from "@/utils/prismadb";
import { AUTH_SECRET } from "@/utils/authSecret";
import { DEMO_EMAILS, isDemoEmail } from "@/globalData/demoAccounts";
import { ADMIN, STUDENT, TEACHER } from "@/globalData/roles";
import { VISITOR_COOKIE } from "@/utils/demoVisitor";

export class ApiError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

const getSessionUser = async (request) => {
    const token = await getToken({ req: request, secret: AUTH_SECRET });
    if (!token?.id) return null;
    const isDemo = token.isDemo === true || isDemoEmail(token.email);
    return {
        id: token.id,
        role: token.role,
        email: token.email,
        isDemo,
        // The demo visitor's browser, which owns its own copy of the demo data.
        visitorId: isDemo ? request.cookies.get(VISITOR_COOKIE)?.value : undefined,
    };
};

// Wraps a route handler so it only runs for a logged-in user with one of
// `roles` (any role when omitted), and turns ApiErrors into JSON responses.
export const withAuth = (roles, handler) => async (request, context) => {
    try {
        const user = await getSessionUser(request);
        if (!user) throw new ApiError(401, "Please log in again.");
        if (roles && !roles.includes(user.role)) throw new ApiError(403, "You don't have access to this.");
        return await handler(request, context, user);
    } catch (err) {
        if (err instanceof ApiError) {
            return NextResponse.json({ message: err.message }, { status: err.status });
        }
        console.error(err);
        return NextResponse.json({ message: "Something went wrong. Please try again." }, { status: 500 });
    }
};

// Demo users only ever see their own visitor's copy of the demo data (see
// utils/demoVisitor), and real users never see demo records.
// Real records usually have no isDemo field at all, and on MongoDB Prisma's
// `not: true` skips missing fields, so match "not set, false or null" instead.
const REAL_RECORDS = { AND: [{ OR: [{ isDemo: { isSet: false } }, { isDemo: false }, { isDemo: null }] }] };

// Never stored, so a demo user without a visitor cookie matches nothing.
const NO_VISITOR = "none";
const visitorOf = (user) => user.visitorId || NO_VISITOR;

// Classes and face photos the user may see.
export const scopeOf = (user) => (user.isDemo ? { isDemo: true, demoVisitorId: visitorOf(user) } : REAL_RECORDS);

// People the user may see. Demo users also see the three shared demo accounts.
export const peopleScopeOf = (user) => (user.isDemo
    ? { isDemo: true, AND: [{ OR: [{ demoVisitorId: visitorOf(user) }, { email: { in: DEMO_EMAILS } }] }] }
    : REAL_RECORDS);

// Marks records created by demo users so they stay inside their visitor's demo.
export const demoStamp = (user) => {
    if (!user.isDemo) return {};
    if (!user.visitorId) throw new ApiError(401, "Your demo has ended. Please log in with a demo account again.");
    return { isDemo: true, demoVisitorId: user.visitorId };
};

export const withoutPassword = (person) => {
    if (!person) return person;
    const { password, ...rest } = person;
    return rest;
};

export const isObjectId = (value) => typeof value === "string" && /^[a-f\d]{24}$/i.test(value);

export const readJson = async (request) => {
    try {
        return await request.json();
    } catch {
        throw new ApiError(400, "Invalid request.");
    }
};

export const requireFields = (data, fields) => {
    const missing = fields.filter((field) => !String(data?.[field] ?? "").trim());
    if (missing.length) throw new ApiError(400, `Please fill in: ${missing.join(", ")}.`);
};

// Emails must be unique among the people the user works with, and the demo
// account emails are always taken. Every demo visitor's copy of the sample
// data reuses the same emails, so other visitors' copies don't count. (Logins
// only look at real accounts, the demo accounts and the browser's own demo
// data, so no account can shadow another one's login.)
export const assertEmailAvailable = async (user, email, exceptId) => {
    const existing = await prisma.people.findMany({
        where: {
            email: { equals: email.trim(), mode: "insensitive" },
            AND: [{ OR: [peopleScopeOf(user), { email: { in: DEMO_EMAILS } }] }],
        },
        select: { id: true },
    });
    if (existing.some((person) => person.id !== exceptId)) throw new ApiError(409, "That email is already used by another account.");
};

// A person the current user may see: themselves, or anyone in scope for admins and teachers.
export const findPersonFor = async (user, id) => {
    if (!isObjectId(id)) throw new ApiError(404, "Account not found.");
    if (id !== user.id && user.role === STUDENT) throw new ApiError(403, "You don't have access to this.");
    const person = await prisma.people.findFirst({
        where: id === user.id ? { id } : { id, ...peopleScopeOf(user) },
    });
    if (!person) throw new ApiError(404, "Account not found.");
    return person;
};

// A schedule the current user may see: admins see all in scope, teachers
// their own classes, students the classes they are enrolled in.
export const findAttendanceFor = async (user, id) => {
    if (!isObjectId(id)) throw new ApiError(404, "Class not found.");
    const record = await prisma.attendance.findFirst({ where: { id, ...scopeOf(user) } });
    if (!record) throw new ApiError(404, "Class not found.");
    if (user.role === TEACHER && record.teacher !== user.id) throw new ApiError(403, "This isn't one of your classes.");
    if (user.role === STUDENT && !(record.students || []).some((student) => student.id === user.id)) {
        throw new ApiError(403, "You don't have access to this.");
    }
    return record;
};

// Students only get their own row from a class's attendance list.
export const forViewer = (user, record) => user.role === STUDENT
    ? { ...record, students: (record.students || []).filter((student) => student.id === user.id) }
    : record;

export const newStudentEntry = (studentId) => ({ id: studentId, status: "absent", letterUrl: "", letterPublicId: "" });

// Keeps every schedule of a section listing exactly the students in that section.
export const addStudentToSection = async (user, studentId, section) => {
    const records = await prisma.attendance.findMany({ where: { section, ...scopeOf(user) } });
    await Promise.all(records
        .filter((record) => !(record.students || []).some((student) => student.id === studentId))
        .map((record) => prisma.attendance.update({
            where: { id: record.id },
            data: { students: [...(record.students || []), newStudentEntry(studentId)] },
        })));
};

export const removeStudentFromSection = async (user, studentId, section) => {
    const records = await prisma.attendance.findMany({ where: { section, ...scopeOf(user) } });
    await Promise.all(records
        .filter((record) => (record.students || []).some((student) => student.id === studentId))
        .map((record) => prisma.attendance.update({
            where: { id: record.id },
            data: { students: record.students.filter((student) => student.id !== studentId) },
        })));
};

export const sectionStudents = async (user, section) => {
    const students = await prisma.people.findMany({
        where: { section, role: STUDENT, ...peopleScopeOf(user) },
        select: { id: true },
    });
    return students.map((student) => newStudentEntry(student.id));
};

// Five-digit code teachers use to copy attendance between classes.
export const generateUniqueCode = async () => {
    let code;
    do {
        code = Math.floor(10000 + Math.random() * 90000);
    } while (await prisma.attendance.findFirst({ where: { code } }));
    return code;
};

export { ADMIN, STUDENT, TEACHER };
