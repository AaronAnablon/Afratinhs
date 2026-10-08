import prisma from "@/utils/prismadb"
import { NextResponse } from "next/server"
import { DEMO_MODE } from "@/globalData/demoAccounts"
import { resetDemoData } from "@/utils/demoSeed"
import { deleteExpiredDemoFaces } from "@/utils/demoVisitor"

// Runs nightly from Vercel Cron (see vercel.json). Vercel sends the CRON_SECRET
// environment variable as a bearer token, so the reset only runs when it matches.
export const GET = async (request) => {
    const secret = process.env.CRON_SECRET
    if (!DEMO_MODE || !secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }
    try {
        const { scheduleCount } = await resetDemoData(prisma)
        const { count: expiredFaces } = await deleteExpiredDemoFaces()
        return NextResponse.json({ message: "Demo data reset", scheduleCount, expiredFaces })
    } catch (err) {
        console.log(err)
        return NextResponse.json({ message: "Reset Error" }, { status: 500 })
    }
}
