import prisma from "@/utils/prismadb"
import { NextResponse } from "next/server"
import { DEMO_FACE_PHOTOS, DEMO_MODE } from "@/globalData/demoAccounts"
import { demoFaceStatus, getActiveDemoFaces, getActiveVisitor, visitorExpiresAt } from "@/utils/demoVisitor"

const notFound = () => NextResponse.json({ message: "Demo is turned off" }, { status: 404 })
const noVisitor = () => NextResponse.json({ message: "Your demo has ended. Please log in with a demo account again." }, { status: 401 })

const parseDescriptor = (text) => {
    const values = String(text ?? "").split(",").map(Number)
    return values.length === 128 && values.every((value) => Number.isFinite(value)) ? values.join(",") : null
}

// `visitor: false` when this browser has no active demo (no cookie, or it expired).
const status = (visitor, faces) => visitor
    ? { visitor: true, expiresAt: visitorExpiresAt(visitor), ...demoFaceStatus(faces) }
    : { visitor: false, ...demoFaceStatus([]) }

// Whether this browser has a face registered for the demo.
export const GET = async () => {
    if (!DEMO_MODE) return notFound()
    try {
        const visitor = await getActiveVisitor()
        return NextResponse.json(status(visitor, visitor ? await getActiveDemoFaces(visitor.visitorId) : []))
    } catch (err) {
        console.log(err)
        return NextResponse.json({ message: "GET Error" }, { status: 500 })
    }
}

// Saves this browser's face (one descriptor per photo), replacing any earlier one.
export const POST = async (request) => {
    if (!DEMO_MODE) return notFound()
    try {
        const { faceDescriptors, consent } = await request.json()
        const descriptors = Array.isArray(faceDescriptors) ? faceDescriptors.map(parseDescriptor) : []
        if (consent !== true || descriptors.length !== DEMO_FACE_PHOTOS || descriptors.includes(null)) {
            return NextResponse.json(
                { message: `Consent and ${DEMO_FACE_PHOTOS} photos with exactly one face each are required` },
                { status: 400 },
            )
        }

        const visitor = await getActiveVisitor()
        if (!visitor) return noVisitor()
        await prisma.demofaces.deleteMany({ where: { visitorId: visitor.visitorId } })
        await prisma.demofaces.createMany({
            data: descriptors.map((faceDescriptor) => ({ visitorId: visitor.visitorId, faceDescriptor })),
        })
        return NextResponse.json(status(visitor, await getActiveDemoFaces(visitor.visitorId)))
    } catch (err) {
        console.log(err)
        return NextResponse.json({ message: "POST Error" }, { status: 500 })
    }
}

// Deletes this browser's face.
export const DELETE = async () => {
    if (!DEMO_MODE) return notFound()
    try {
        const visitor = await getActiveVisitor()
        if (visitor) {
            await prisma.demofaces.deleteMany({ where: { visitorId: visitor.visitorId } })
        }
        return NextResponse.json(status(visitor, []))
    } catch (err) {
        console.log(err)
        return NextResponse.json({ message: "DELETE Error" }, { status: 500 })
    }
}
