"use client"

import Link from "next/link";
import { HiOutlineCalendarDays, HiOutlineChevronRight, HiOutlineClock } from "react-icons/hi2";
import { useCurrentUser } from "@/components/AppShell";
import { attendanceSummary } from "@/components/StudentAttendanceList";
import { ProfileDetails, SummaryStats } from "@/components/StudentProfile";
import { Avatar, fullName } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageLoader } from "@/components/ui/Spinner";
import { useFetch } from "@/utils/http";
import { displayTime, greeting, groupByDay, isUpcoming } from "@/utils/schedule";

export default function StudentOverview() {
    const { user } = useCurrentUser();
    const classes = useFetch(user.section ? `/api/attendance/getStudents/${encodeURIComponent(user.section)}` : null);

    if (classes.error) return <ErrorState message={classes.error} onRetry={classes.reload} />;
    if (classes.loading) return <PageLoader />;

    const records = classes.data || [];
    const nextDay = groupByDay(records.filter(isUpcoming))[0];

    return (
        <>
            <PageHeader title={`${greeting()}, ${user.firstName}`} description={user.section ? `Student of ${user.section}` : undefined} />

            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="p-5">
                    <div className="mb-5 flex items-center gap-4">
                        <Avatar person={user} size="lg" />
                        <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900">{fullName(user)}</p>
                            <p className="truncate text-sm text-slate-500">{user.email}</p>
                        </div>
                    </div>
                    <ProfileDetails person={user} />
                </Card>

                <div className="space-y-6 lg:col-span-2">
                    <Card>
                        <CardHeader
                            title="Your attendance"
                            description="Based on time-in for classes so far."
                            actions={<ButtonLink size="sm" variant="secondary" href="/Student/Attendance">View all</ButtonLink>}
                        />
                        <SummaryStats summary={attendanceSummary(records, user.id)} />
                    </Card>

                    <Card>
                        <CardHeader
                            title={nextDay ? `Next classes · ${nextDay.label}` : "Next classes"}
                            actions={<ButtonLink size="sm" variant="secondary" href="/Student/Schedule">Full schedule</ButtonLink>}
                        />
                        {nextDay ? (
                            <ul className="divide-y divide-slate-100">
                                {nextDay.items.map((record) => (
                                    <li key={record.id} className="flex items-center justify-between gap-3 px-5 py-3">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-slate-900">{record.event}</p>
                                            <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                                                <HiOutlineClock className="h-3.5 w-3.5" aria-hidden="true" />{displayTime(record.time)}
                                            </p>
                                        </div>
                                        <Badge tone="brand">{record.section}</Badge>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="flex items-center gap-3 px-5 py-6 text-sm text-slate-500">
                                <HiOutlineCalendarDays className="h-5 w-5" aria-hidden="true" /> No upcoming classes.
                            </div>
                        )}
                    </Card>

                    <Link href="/Student/Attendance" className="flex items-center justify-between rounded-xl bg-brand-700 px-5 py-4 text-white shadow-card transition hover:bg-brand-800">
                        <div>
                            <p className="text-sm font-semibold">Missed a class?</p>
                            <p className="text-sm text-brand-100">Upload an excuse letter from the Attendance page.</p>
                        </div>
                        <HiOutlineChevronRight className="h-5 w-5" aria-hidden="true" />
                    </Link>
                </div>
            </div>
        </>
    );
}
