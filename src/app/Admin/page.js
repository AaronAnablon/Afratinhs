"use client"

import Link from "next/link";
import { HiOutlineAcademicCap, HiOutlineCalendarDays, HiOutlineChevronRight, HiOutlineRectangleStack, HiOutlineUserGroup } from "react-icons/hi2";
import { useCurrentUser } from "@/components/AppShell";
import { ClassList } from "@/components/ClassList";
import { fullName } from "@/components/ui/Avatar";
import { ButtonLink } from "@/components/ui/Button";
import { Card, StatCard } from "@/components/ui/Card";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageLoader } from "@/components/ui/Spinner";
import { STUDENT, TEACHER } from "@/globalData/roles";
import { useFetch } from "@/utils/http";
import { greeting, isToday, uniqueSections } from "@/utils/schedule";

const QuickLink = ({ href, icon: Icon, title, text }) => (
    <Link href={href} className="flex items-center gap-4 px-4 py-4 transition hover:bg-slate-50">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
            <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900">{title}</p>
            <p className="text-sm text-slate-500">{text}</p>
        </div>
        <HiOutlineChevronRight className="h-5 w-5 text-slate-400" aria-hidden="true" />
    </Link>
);

export default function AdminDashboard() {
    const { user } = useCurrentUser();
    const people = useFetch("/api/people");
    const classes = useFetch("/api/attendance");

    if (people.error || classes.error) {
        return <ErrorState message={people.error || classes.error} onRetry={() => { people.reload(); classes.reload(); }} />;
    }
    if (people.loading || classes.loading) return <PageLoader />;

    const teachers = people.data.filter((person) => person.role === TEACHER);
    const students = people.data.filter((person) => person.role === STUDENT);
    const sections = uniqueSections([...classes.data, ...students]);
    const todaysClasses = classes.data.filter(isToday);
    const teacherName = (id) => fullName(teachers.find((teacher) => teacher.id === id)) || "Unknown teacher";

    return (
        <>
            <PageHeader title={`${greeting()}, ${user.firstName}`} description="Here's an overview of attendance at school today." />

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard icon={HiOutlineUserGroup} label="Teachers" value={teachers.length} />
                <StatCard icon={HiOutlineAcademicCap} label="Students" value={students.length} tone="sky" />
                <StatCard icon={HiOutlineRectangleStack} label="Sections" value={sections.length} tone="amber" />
                <StatCard icon={HiOutlineCalendarDays} label="Classes today" value={todaysClasses.length} tone="rose" />
            </div>

            <div className="mt-8 grid gap-8 lg:grid-cols-3">
                <section className="lg:col-span-2">
                    <h2 className="mb-3 text-base font-semibold text-slate-900">Today&apos;s classes</h2>
                    <ClassList
                        records={todaysClasses}
                        dayHeadings={false}
                        renderMeta={(record) => <span className="text-xs text-slate-500">{teacherName(record.teacher)}</span>}
                        renderActions={(record) => (
                            <ButtonLink size="sm" variant="secondary" href={`/Admin/TeacherSchedule/Schedule?id=${record.teacher}`}>
                                Teacher schedule
                            </ButtonLink>
                        )}
                        emptyState={(
                            <EmptyState
                                icon={HiOutlineCalendarDays}
                                title="No classes today"
                                description="Classes you schedule for teachers appear here on their day."
                                action={<ButtonLink variant="secondary" href="/Admin/TeacherSchedule">Go to teachers</ButtonLink>}
                            />
                        )}
                    />
                </section>
                <section>
                    <h2 className="mb-3 text-base font-semibold text-slate-900">Manage</h2>
                    <Card className="divide-y divide-slate-100 overflow-hidden">
                        <QuickLink href="/Admin/TeacherSchedule" icon={HiOutlineUserGroup} title="Teachers" text="Add teachers and plan their classes" />
                        <QuickLink href="/Admin/Sections" icon={HiOutlineRectangleStack} title="Sections" text="Students, attendance and face photos" />
                    </Card>
                </section>
            </div>
        </>
    );
}
