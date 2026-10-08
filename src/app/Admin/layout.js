"use client"

import { HiOutlineRectangleStack, HiOutlineSquares2X2, HiOutlineUserGroup } from "react-icons/hi2";
import { AppShell } from "@/components/AppShell";
import { ADMIN } from "@/globalData/roles";

const NAV = [
    { href: "/Admin", label: "Dashboard", icon: HiOutlineSquares2X2, exact: true },
    { href: "/Admin/TeacherSchedule", label: "Teachers", icon: HiOutlineUserGroup },
    { href: "/Admin/Sections", label: "Sections", icon: HiOutlineRectangleStack },
];

export default function AdminLayout({ children }) {
    return <AppShell role={ADMIN} nav={NAV}>{children}</AppShell>;
}
