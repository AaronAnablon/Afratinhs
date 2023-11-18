"use client"

import Link from "next/link";
import { RxCalendar } from "react-icons/rx";
import { GoPeople } from "react-icons/go";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from 'next-auth/react';
import { BsPersonCircle } from "react-icons/bs";
import { AdminRoute } from "@/utils/auth";


const Layout = ({ children }) => {
    const { data: session } = useSession();

    const currentPathname = usePathname()
    const [active, setActive] = useState()
    useEffect(() => {
        setActive(currentPathname)
    }, [currentPathname])

    return (
        // <AdminRoute>
            <div className="w-full">
                <div className={`my-4 w-full flex justify-center ${active !== "/Admin" && "border-b-2 border-green-700"}`}>
                    <div className={`flex justify-between my-2 mx-4 ${active === "/Admin" ? "grid gap-2 w-full" : "w-full"} `}>
                        {active !== "/Admin" &&
                            <div className="hidden md:flex items-center gap-2 ">
                                <div className="rounded-full border-4 border-green-700 text-white bg-green-700">
                                    <BsPersonCircle size={24} />
                                </div>
                                {session?.firstName} {session?.lastName} &#40;Admin&#41;
                            </div>}
                        <Link className={`flex gap-4 items-center ${active?.includes("/Admin/TeacherSchedule") &&
                            "bg-green-700 px-4 rounded-full text-white"}`} href={`/Admin/TeacherSchedule`}>
                            {active === "/Admin" && <div className={`bg-green-700 text-white p-1 rounded-full`}>
                                <RxCalendar size={20} />
                            </div>}
                            {active !== "/Admin" ? "Schedule" : "Teacher's Schedule"}</Link>
                        <Link className={`flex gap-4 items-center  ${active?.includes("Admin/Sections") &&
                            "bg-green-700 px-4 rounded-full text-white"}`} href={`/Admin/Sections`}>
                            {active === "/Admin" && <div className="bg-green-700 text-white p-1 rounded-full">
                                <GoPeople size={20} />
                            </div>}
                            Sections</Link>
                    </div>
                </div>
                <div className="h-full">
                    {children}
                </div>

            </div>
        // </AdminRoute>
    );
}

export default Layout;