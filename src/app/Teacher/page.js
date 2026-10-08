"use client"

import { HiOutlineCalendarDays, HiOutlineClock, HiOutlineRectangleStack } from "react-icons/hi2";
import { useCurrentUser } from "@/components/AppShell";
import { ClassList } from "@/components/ClassList";
import { TeacherClassActions } from "@/components/TeacherClassActions";
import { ButtonLink } from "@/components/ui/Button";
import { StatCard } from "@/components/ui/Card";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageLoader } from "@/components/ui/Spinner";
import { useFetch } from "@/utils/http";
import { daysFromToday, greeting, isToday, parseClassDate, uniqueSections } from "@/utils/schedule";

export default function TeacherDashboard() {
    const { user } = useCurrentUser();
    const classes = useFetch(`/api/attendance/${user.id}`);

    if (classes.error) return <ErrorState message={classes.error} onRetry={classes.reload} />;
    if (classes.loading) return <PageLoader />;

    const todays = classes.data.filter(isToday);
    const nextWeek = classes.data.filter((record) => {
        const offset = daysFromToday(parseClassDate(record.date) ?? new Date(0));
        return offset > 0 && offset <= 7;
    });

    return (
        <>
            <PageHeader title={`${greeting()}, ${user.firstName}`} description="Start taking attendance for today's classes, or review past ones." />

            <div className="grid gap-4 sm:grid-cols-3">
                <StatCard icon={HiOutlineCalendarDays} label="Classes today" value={todays.length} />
                <StatCard icon={HiOutlineClock} label="Next 7 days" value={nextWeek.length} tone="sky" />
                <StatCard icon={HiOutlineRectangleStack} label="Sections" value={uniqueSections(classes.data).length} tone="amber" />
            </div>

            <section className="mt-8">
                <h2 className="mb-3 text-base font-semibold text-slate-900">Today&apos;s classes</h2>
                <ClassList
                    records={todays}
                    dayHeadings={false}
                    showCode
                    renderActions={(record) => <TeacherClassActions record={record} />}
                    emptyState={(
                        <EmptyState
                            icon={HiOutlineCalendarDays}
                            title="No classes today"
                            description="Enjoy the break. Your upcoming classes are on the Schedule page."
                            action={<ButtonLink variant="secondary" href="/Teacher/Schedule">View schedule</ButtonLink>}
                        />
                    )}
                />
            </section>

            {nextWeek.length > 0 && (
                <section className="mt-8">
                    <h2 className="mb-3 text-base font-semibold text-slate-900">Coming up</h2>
                    <ClassList records={nextWeek} />
                </section>
            )}
        </>
    );
}
