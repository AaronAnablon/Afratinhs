"use client"

import { HiOutlineCalendarDays, HiOutlineRectangleStack, HiOutlineSquares2X2 } from "react-icons/hi2";
import { AppShell } from "@/components/AppShell";
import { TEACHER } from "@/globalData/roles";

const NAV = [
    { href: "/Teacher", label: "Dashboard", icon: HiOutlineSquares2X2, exact: true },
    { href: "/Teacher/Schedule", label: "Schedule", icon: HiOutlineCalendarDays },
    { href: "/Teacher/Sections", label: "Sections", icon: HiOutlineRectangleStack },
];

export default function TeacherLayout({ children }) {
    return <AppShell role={TEACHER} nav={NAV}>{children}</AppShell>;
}
