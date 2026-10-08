"use client"

import { useState } from "react";
import { HiOutlineCalendarDays } from "react-icons/hi2";
import { useCurrentUser } from "@/components/AppShell";
import { ClassList } from "@/components/ClassList";
import { TeacherClassActions } from "@/components/TeacherClassActions";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { Segmented } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageLoader } from "@/components/ui/Spinner";
import { useFetch } from "@/utils/http";
import { isUpcoming } from "@/utils/schedule";

export default function TeacherSchedulePage() {
    const { user } = useCurrentUser();
    const classes = useFetch(`/api/attendance/${user.id}`);
    const [tab, setTab] = useState("upcoming");

    if (classes.error) return <ErrorState message={classes.error} onRetry={classes.reload} />;
    if (classes.loading) return <PageLoader />;

    const upcoming = classes.data.filter(isUpcoming);
    const past = classes.data.filter((record) => !isUpcoming(record));

    return (
        <>
            <PageHeader title="Schedule" description="Your classes. Take attendance with the camera, or open the sheet to review and correct it." />
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
                showCode
                renderActions={(record) => <TeacherClassActions record={record} />}
                emptyState={(
                    <EmptyState
                        icon={HiOutlineCalendarDays}
                        title={tab === "upcoming" ? "No upcoming classes" : "No past classes"}
                        description={tab === "upcoming" ? "Your school admin schedules your classes." : undefined}
                    />
                )}
            />
        </>
    );
}
