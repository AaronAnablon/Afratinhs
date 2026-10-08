import prisma from "@/utils/prismadb"
import { NextResponse } from "next/server"
import { DEMO_MODE } from "@/globalData/demoAccounts"
import { ApiError, readJson, withAuth } from "@/utils/apiAuth"
import { DEMO_SECTION, startLiveClass } from "@/utils/demoSeed"
import {
    demoFaceStatus,
    getActiveDemoFaces,
    getActiveVisitor,
    getDemoStudent,
    getDemoTeacher,
    getLiveClass,
    startVisitor,
    visitorExpiresAt,
} from "@/utils/demoVisitor"

const assertDemo = (user) => {
    if (!DEMO_MODE || !user.isDemo) throw new ApiError(404, "Demo is turned off");
}

// Everything the app needs about this browser's demo: whether the visitor is
// active, their face, their live class and the demo teacher and student ids
// the demo guide links to. `visitor: false` means the cookie is missing or expired.
const demoStatus = async (visitor, liveClass) => {
    if (!visitor) return { visitor: false }
    const [faces, teacher, student] = await Promise.all([
        getActiveDemoFaces(visitor.visitorId),
        getDemoTeacher(),
        getDemoStudent(),
    ])
    const studentEntry = (liveClass?.students || []).find((entry) => entry.id === student?.id)
    return {
        visitor: true,
        expiresAt: visitorExpiresAt(visitor),
        face: demoFaceStatus(faces),
        liveClass: liveClass && {
            id: liveClass.id,
            event: liveClass.event,
            date: liveClass.date,
            time: liveClass.time,
            // Whether the camera has recognized the visitor as Demo Student yet.
            studentPresent: studentEntry?.statusIn === "present",
        },
        teacherId: teacher?.id,
        studentId: student?.id,
        section: DEMO_SECTION,
    }
}

export const GET = withAuth(null, async (request, context, user) => {
    assertDemo(user)
    const visitor = await getActiveVisitor()
    const liveClass = visitor ? await getLiveClass(visitor.visitorId) : null
    return NextResponse.json(await demoStatus(visitor, liveClass))
})

// Called right after a demo login. A new browser becomes a new visitor with
// its own copy of the demo data, and every login gets a class that runs for
// the next 20 minutes in the visitor's time zone.
export const POST = withAuth(null, async (request, context, user) => {
    assertDemo(user)
    const { timeZone } = await readJson(request)
    const visitor = await startVisitor(timeZone)
    const liveClass = await startLiveClass(prisma, { visitorId: visitor.visitorId, timeZone })
    return NextResponse.json(await demoStatus(visitor, liveClass))
})

export const revalidate = 0
