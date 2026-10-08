import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import prisma from "@/utils/prismadb";
import accounts from "@/globalData/demoAccounts/accounts.json";
import { DEMO_FACE_TTL_HOURS, DEMO_MODE, isDemoEmail } from "@/globalData/demoAccounts";

// Each demo visitor's browser gets a random ID so their face is kept apart
// from other visitors. Server-side only.
const VISITOR_COOKIE = "afratinhs_visitor";
const TTL_MS = DEMO_FACE_TTL_HOURS * 60 * 60 * 1000;

export const getVisitorId = async () => (await cookies()).get(VISITOR_COOKIE)?.value;

export const getOrCreateVisitorId = async () => {
    const cookieStore = await cookies();
    let visitorId = cookieStore.get(VISITOR_COOKIE)?.value;
    if (!visitorId) {
        visitorId = randomUUID();
        cookieStore.set(VISITOR_COOKIE, visitorId, {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            maxAge: TTL_MS / 1000,
            path: "/",
        });
    }
    return visitorId;
};

// Faces registered before this date have expired.
export const demoFaceCutoff = () => new Date(Date.now() - TTL_MS);

export const deleteExpiredDemoFaces = () =>
    prisma.demofaces.deleteMany({ where: { createdAt: { lt: demoFaceCutoff() } } });

export const getActiveDemoFaces = (visitorId) =>
    prisma.demofaces.findMany({
        where: { visitorId, createdAt: { gte: demoFaceCutoff() } },
        orderBy: { createdAt: "desc" },
    });

export const getDemoStudent = () =>
    DEMO_MODE ? prisma.people.findFirst({ where: { email: accounts.student.email } }) : null;

export const isDemoPersonId = async (id) => {
    if (!DEMO_MODE) return false;
    const person = await prisma.people.findUnique({ where: { id }, select: { email: true } });
    return isDemoEmail(person?.email);
};
