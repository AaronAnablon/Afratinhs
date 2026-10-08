import { NextResponse } from "next/server";
import { ADMIN, STUDENT, TEACHER, findAttendanceFor, forViewer, withAuth } from "@/utils/apiAuth";

export const GET = withAuth([ADMIN, TEACHER, STUDENT], async (request, { params }, user) => {
    const { id } = await params;
    const record = await findAttendanceFor(user, id);
    return NextResponse.json(forViewer(user, record));
});

export const revalidate = 0;
