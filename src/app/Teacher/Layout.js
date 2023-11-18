"use client"

import Link from "next/link";
import { RxCalendar } from "react-icons/rx";
import { GoPeople } from "react-icons/go";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from 'next-auth/react';
import { BsPersonCircle } from "react-icons/bs";
import { TeacherRoute } from "@/utils/auth";


const Layout = ({ children }) => {
    const { data: session } = useSession();

    const currentPathname = usePathname()
    const [active, setActive] = useState()
    useEffect(() => {
        setActive(currentPathname)
    }, [currentPathname])

    return (
        // <TeacherRoute>
        <div className="w-full">
            <div className={`my-4 w-full flex justify-center ${active !== "/Teacher" && "border-b-2 border-green-700"}`}>
                <div className={`flex justify-between my-2 mx-4 ${active === "/Teacher" ? "grid gap-2 w-full" : "w-full"} `}>
                    {active !== "/Teacher" &&
                        <div className="hidden md:flex items-center gap-2 ">
                            <div className="rounded-full border-4 border-green-700 text-white bg-green-700">
                                <BsPersonCircle size={24} />
                            </div>
                            {session?.firstName} {session?.lastName} &#40;Teacher&#41;
                        </div>}
                    {session && <><Link className={`flex gap-4 items-center ${active?.includes("/Teacher/Schedule") &&
                        "bg-green-700 px-4 rounded-full text-white"}`} href={`/Teacher/Schedule?id=${session.id}`}>
                        {active === "/Teacher" && <div className={`bg-green-700 text-white p-1 rounded-full`}>
                            <RxCalendar size={20} />
                        </div>}
                        Schedule</Link>
                        <Link className={`flex gap-4 items-center  ${active?.includes("Teacher/Sections") &&
                            "bg-green-700 px-4 rounded-full text-white"}`} href={`/Teacher/Sections?id=${session.id}`}>
                            {active === "/Teacher" && <div className="bg-green-700 text-white p-1 rounded-full">
                                <GoPeople size={20} />
                            </div>}
                            Sections</Link>
                    </>
                    }
                </div>
            </div>
            <div className="h-full">
                {children}
            </div>

        </div>
        // </TeacherRoute>
    );
}

export default Layout;