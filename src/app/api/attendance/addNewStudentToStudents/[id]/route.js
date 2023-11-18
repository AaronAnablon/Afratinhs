import prisma from "@/utils/prismadb"
import { NextResponse } from "next/server";

export const PUT = async (request, { params }) => {
    try {
        const { id } = params
        const body = await request.json();
        const { newStudent } = body;

        const findJson = await prisma.attendance.findMany({
            where: {
                section: id
            }
        });

        if (findJson.length > 0) {
            // Iterate through each found record and update
            const updatePromises = findJson.map(async (record) => {
                const updatePost = await prisma.attendance.update({
                    where: {
                        id: record.id
                    },
                    data: {
                        students: [...record.students, newStudent]
                    }
                });
                return updatePost;
            });

            const updatedRecords = await Promise.all(updatePromises);

            return NextResponse.json(updatedRecords);
        } else {
            return NextResponse.json({ message: "No records found for the given section" }, { status: 404 });
        }

    } catch (err) {
        console.error(err);
        return NextResponse.json({ message: "Update Error", error: err.message }, { status: 500 });
    }
}

