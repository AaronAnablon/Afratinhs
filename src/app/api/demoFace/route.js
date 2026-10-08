import prisma from "@/utils/prismadb"
import { NextResponse } from "next/server"
import { DEMO_FACE_TTL_HOURS, DEMO_MODE } from "@/globalData/demoAccounts"
import {
    deleteExpiredDemoFaces,
    getActiveDemoFaces,
    getOrCreateVisitorId,
    getVisitorId,
} from "@/utils/demoVisitor"

const notFound = () => NextResponse.json({ message: "Demo is turned off" }, { status: 404 })

const faceStatus = (face) => face
    ? { registered: true, expiresAt: new Date(face.createdAt.getTime() + DEMO_FACE_TTL_HOURS * 60 * 60 * 1000) }
    : { registered: false }

// Whether this browser has a face registered for the demo.
export const GET = async () => {
    if (!DEMO_MODE) return notFound()
    try {
        const visitorId = await getVisitorId()
        const faces = visitorId ? await getActiveDemoFaces(visitorId) : []
        return NextResponse.json(faceStatus(faces[0]))
    } catch (err) {
        console.log(err)
        return NextResponse.json({ message: "GET Error" }, { status: 500 })
    }
}

// Saves this browser's face, replacing any earlier one.
export const POST = async (request) => {
    if (!DEMO_MODE) return notFound()
    try {
        const { faceDescriptor, consent } = await request.json()
        const values = String(faceDescriptor ?? "").split(",").map(Number)
        if (consent !== true || values.length !== 128 || values.some((value) => !Number.isFinite(value))) {
            return NextResponse.json({ message: "Consent and exactly one detected face are required" }, { status: 400 })
        }

        const visitorId = await getOrCreateVisitorId()
        await deleteExpiredDemoFaces()
        await prisma.demofaces.deleteMany({ where: { visitorId } })
        const face = await prisma.demofaces.create({
            data: { visitorId, faceDescriptor: values.join(",") },
        })
        return NextResponse.json(faceStatus(face))
    } catch (err) {
        console.log(err)
        return NextResponse.json({ message: "POST Error" }, { status: 500 })
    }
}

// Deletes this browser's face.
export const DELETE = async () => {
    if (!DEMO_MODE) return notFound()
    try {
        const visitorId = await getVisitorId()
        if (visitorId) {
            await prisma.demofaces.deleteMany({ where: { visitorId } })
        }
        return NextResponse.json(faceStatus(null))
    } catch (err) {
        console.log(err)
        return NextResponse.json({ message: "DELETE Error" }, { status: 500 })
    }
}
