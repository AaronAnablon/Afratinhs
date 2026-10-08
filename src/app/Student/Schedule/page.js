"use client"

import { useState } from "react";
import { HiOutlineCalendarDays } from "react-icons/hi2";
import { useCurrentUser } from "@/components/AppShell";
import { ClassList } from "@/components/ClassList";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { Segmented } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageLoader } from "@/components/ui/Spinner";
import { useFetch } from "@/utils/http";
import { isUpcoming } from "@/utils/schedule";

export default function StudentSchedulePage() {
    const { user } = useCurrentUser();
    const classes = useFetch(user.section ? `/api/attendance/getStudents/${encodeURIComponent(user.section)}` : null);
    const [tab, setTab] = useState("upcoming");

    if (classes.error) return <ErrorState message={classes.error} onRetry={classes.reload} />;
    if (classes.loading) return <PageLoader />;

    const records = classes.data || [];
    const upcoming = records.filter(isUpcoming);
    const past = records.filter((record) => !isUpcoming(record));

    return (
        <>
            <PageHeader title="Schedule" description={user.section ? `Classes for ${user.section}` : "You aren't in a section yet."} />
            <Segmented
                className="mb-5"
                value={tab}
                onChange={setTab}
                options={[
                    { value: "upcoming", label: `Upcoming (${upcoming.length})` },
                    { value: "past", label: `Past (${past.length})` },
                ]}
            />
            <ClassList
                records={tab === "upcoming" ? upcoming : past}
                order={tab === "upcoming" ? "asc" : "desc"}
                emptyState={<EmptyState icon={HiOutlineCalendarDays} title={tab === "upcoming" ? "No upcoming classes" : "No past classes"} />}
            />
        </>
    );
}
