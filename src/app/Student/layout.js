"use client"

import { HiOutlineCalendarDays, HiOutlineClipboardDocumentCheck, HiOutlineHome } from "react-icons/hi2";
import { AppShell } from "@/components/AppShell";
import { STUDENT } from "@/globalData/roles";

const NAV = [
    { href: "/Student", label: "Overview", icon: HiOutlineHome, exact: true },
    { href: "/Student/Schedule", label: "Schedule", icon: HiOutlineCalendarDays },
    { href: "/Student/Attendance", label: "Attendance", icon: HiOutlineClipboardDocumentCheck },
];

export default function StudentLayout({ children }) {
    return <AppShell role={STUDENT} nav={NAV}>{children}</AppShell>;
}
