import prisma from "@/utils/prismadb"
import { NextResponse } from "next/server"
import bcrypt from 'bcrypt';

export const POST = async (request) => {
    try {
        const body = await request.json();
        const { firstName, lastName, email, password, role } = body;

        const saltRounds = 10

        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const newPost = await prisma.people.create({
            data: {
                firstName,
                lastName,
                email,
                password: hashedPassword,
                role,
            },
        })
        return NextResponse.json({ message: "Registered", newPost })


    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: "POST Error", error }, { status: 500 });
    }
};




export const GET = async () => {
    try {
        const posts = await prisma.people.findMany({
        })
        return NextResponse.json(posts, {
            headers: {
                "revalidate": "0"
            }
        });
    } catch (err) {
        console.log(err)
        return NextResponse.json({ message: "GET Error", err }, { status: 500 })
    }
}