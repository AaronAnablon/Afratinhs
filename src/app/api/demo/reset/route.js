import prisma from "@/utils/prismadb"
import { NextResponse } from "next/server"
import { DEMO_MODE } from "@/globalData/demoAccounts"
import { cleanupDemoData, ensureDemoAccounts } from "@/utils/demoSeed"
import { visitorCutoff } from "@/utils/demoVisitor"

// Runs nightly from Vercel Cron (see vercel.json). Vercel sends the CRON_SECRET
// environment variable as a bearer token, so the job only runs when it matches.
// Keeps the demo accounts in shape and deletes the data of expired visitors;
// visitors in the middle of their demo keep theirs.
export const GET = async (request) => {
    const secret = process.env.CRON_SECRET
    if (!DEMO_MODE || !secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }
    try {
        await ensureDemoAccounts(prisma)
        const expiredVisitors = await cleanupDemoData(prisma, { expiredBefore: visitorCutoff() })
        return NextResponse.json({ message: "Demo cleaned up", expiredVisitors })
    } catch (err) {
        console.log(err)
        return NextResponse.json({ message: "Reset Error" }, { status: 500 })
    }
}
