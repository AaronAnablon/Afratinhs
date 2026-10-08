import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import prisma from "@/utils/prismadb";
import accounts from "@/globalData/demoAccounts/accounts.json";
import { DEMO_FACE_PHOTOS, DEMO_MODE, DEMO_VISITOR_TTL_HOURS } from "@/globalData/demoAccounts";
import { cleanupDemoData, createVisitorData } from "@/utils/demoSeed";

// Each demo visitor's browser gets a random ID in this cookie. Their copy of
// the demo data, their face and their live class are all tagged with it, so
// visitors never share data. Server-side only.
export const VISITOR_COOKIE = "afratinhs_visitor";
const TTL_MS = DEMO_VISITOR_TTL_HOURS * 60 * 60 * 1000;

// Visitors that started before this date have expired.
export const visitorCutoff = () => new Date(Date.now() - TTL_MS);

export const getVisitorId = async () => (await cookies()).get(VISITOR_COOKIE)?.value;

// This browser's visitor record, or null when there's no cookie or it expired.
export const getActiveVisitor = async () => {
    const visitorId = await getVisitorId();
    if (!visitorId) return null;
    return prisma.demovisitors.findFirst({ where: { visitorId, createdAt: { gte: visitorCutoff() } } });
};

// Returns this browser's visitor, or starts a new one: a new random ID, a fresh
// copy of the premade demo data and a cookie that expires with it. A browser
// without a cookie, or whose visitor expired, always becomes a new visitor.
export const startVisitor = async (timeZone) => {
    const active = await getActiveVisitor();
    if (active) return active;

    await cleanupDemoData(prisma, { expiredBefore: visitorCutoff() });
    const visitorId = randomUUID();
    const visitor = await prisma.demovisitors.create({ data: { visitorId } });
    await createVisitorData(prisma, { visitorId, timeZone });
    (await cookies()).set(VISITOR_COOKIE, visitorId, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: TTL_MS / 1000,
        path: "/",
    });
    return visitor;
};

export const visitorExpiresAt = (visitor) => new Date(visitor.createdAt.getTime() + TTL_MS);

export const getActiveDemoFaces = (visitorId) =>
    prisma.demofaces.findMany({ where: { visitorId }, orderBy: { createdAt: "desc" } });

// { registered, photos } for a visitor's faces. A face only counts as
// registered once all of its photos are saved.
export const demoFaceStatus = (faces) => ({
    registered: faces.length >= DEMO_FACE_PHOTOS,
    photos: faces.length,
});

export const getDemoStudent = () =>
    DEMO_MODE ? prisma.people.findFirst({ where: { email: accounts.student.email, demoVisitorId: { isSet: false } } }) : null;

export const getDemoTeacher = () =>
    DEMO_MODE ? prisma.people.findFirst({ where: { email: accounts.teacher.email, demoVisitorId: { isSet: false } } }) : null;

// The visitor's most recent live class (see startLiveClass in utils/demoSeed).
export const getLiveClass = (visitorId) =>
    prisma.attendance.findFirst({
        where: { demoVisitorId: visitorId, demoLive: true },
        orderBy: { createdAt: "desc" },
    });
