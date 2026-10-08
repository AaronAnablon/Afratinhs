"use client"

import Link from "next/link";
import { HiOutlineChevronRight, HiOutlineRectangleStack } from "react-icons/hi2";
import { useCurrentUser } from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageLoader } from "@/components/ui/Spinner";
import { useFetch } from "@/utils/http";
import { groupByDay, isUpcoming, uniqueSections } from "@/utils/schedule";

export default function TeacherSectionsPage() {
    const { user } = useCurrentUser();
    const classes = useFetch(`/api/attendance/${user.id}`);

    if (classes.error) return <ErrorState message={classes.error} onRetry={classes.reload} />;
    if (classes.loading) return <PageLoader />;

    const sections = uniqueSections(classes.data).map((name) => {
        const sectionClasses = classes.data.filter((record) => record.section === name);
        const next = groupByDay(sectionClasses.filter(isUpcoming))[0];
        return { name, count: sectionClasses.length, next };
    });

    return (
        <>
            <PageHeader title="Sections" description="The sections you teach. Open one to review attendance by date." />
            {sections.length === 0 ? (
                <EmptyState icon={HiOutlineRectangleStack} title="No sections yet" description="Sections appear once your admin schedules classes for you." />
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {sections.map((section) => (
                        <Link key={section.name} href={`/Teacher/Sections/Section?section=${encodeURIComponent(section.name)}`} className="group">
                            <Card className="flex h-full items-center justify-between gap-3 p-5 transition group-hover:ring-brand-300">
                                <div className="min-w-0">
                                    <p className="truncate text-base font-semibold text-slate-900 group-hover:text-brand-700">{section.name}</p>
                                    <p className="mt-1 text-sm text-slate-500">{section.count} {section.count === 1 ? "class" : "classes"}</p>
                                    <p className="mt-2 text-xs text-slate-500">{section.next ? `Next: ${section.next.label}` : "No upcoming classes"}</p>
                                </div>
                                <HiOutlineChevronRight className="h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </>
    );
}
