import prisma from "@/utils/prismadb"
import { NextResponse } from "next/server"


export const GET = async (request, { params }) => {
    try {
        const { id } = params;
        const post = await prisma.people.findMany({
            where: {
                section: id
            }
        });
        return NextResponse.json(post);
    } catch (err) {
        console.log(err)
        return NextResponse.json(
            { message: "GET Error" },
            { status: 500 }
        );
    }
};