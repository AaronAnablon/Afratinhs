import prisma from "@/utils/prismadb"
import { NextResponse } from "next/server";

export const GET = async (req, { params }) => {
    try {
        const email = params
        const post = await prisma.people.findMany({
            where: {
                email: email.id,
            },
        })
        return NextResponse.json(post);
    } catch (err) {
        console.log(err)
        return NextResponse.json(
            { message: "GET Error" },
            { status: 500 }
        );
    }
};