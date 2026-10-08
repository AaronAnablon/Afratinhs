"use client"

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { HiOutlineCalendarDays } from "react-icons/hi2";
import { useCurrentUser } from "@/components/AppShell";
import { AttendanceSheet } from "@/components/AttendanceSheet";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { SelectField } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageLoader } from "@/components/ui/Spinner";
import { useFetch } from "@/utils/http";
import { daysFromToday, displayTime, groupByDay } from "@/utils/schedule";
import { withSuspense } from "@/utils/withSuspense";

const TeacherSectionPage = () => {
    const { user } = useCurrentUser();
    const section = useSearchParams().get("section");
    const classes = useFetch(`/api/attendance/${user.id}`);
    const students = useFetch(section ? `/api/people/getStudents/${encodeURIComponent(section)}` : null);
    const [selectedDay, setSelectedDay] = useState(null);

    if (classes.error || students.error) return <ErrorState message={classes.error || students.error} onRetry={() => { classes.reload(); students.reload(); }} />;
    if (classes.loading || students.loading) return <PageLoader />;

    const days = groupByDay(classes.data.filter((record) => record.section === section), "desc");
    // Default to the most recent day that isn't in the future.
    const defaultDay = (days.find((day) => daysFromToday(day.date) <= 0) ?? days[0])?.key;
    const day = days.find((group) => group.key === (selectedDay ?? defaultDay));

    const replaceRecord = (updated) => classes.mutate((current) => current.map((record) => (record.id === updated.id ? updated : record)));

    return (
        <>
            <PageHeader
                back={{ href: "/Teacher/Sections", label: "Sections" }}
                title={section}
                description={`${students.data.length} ${students.data.length === 1 ? "student" : "students"}`}
            />

            {days.length === 0 ? (
                <EmptyState icon={HiOutlineCalendarDays} title="No classes in this section" />
            ) : (
                <>
                    <SelectField label="Day" value={day?.key ?? ""} onChange={(event) => setSelectedDay(event.target.value)} className="mb-6 max-w-xs">
                        {days.map((group) => (
                            <option key={group.key} value={group.key}>
                                {group.label} ({group.items.length} {group.items.length === 1 ? "class" : "classes"})
                            </option>
                        ))}
                    </SelectField>
                    <div className="space-y-6">
                        {day?.items.map((record) => (
                            <Card key={record.id}>
                                <CardHeader title={record.event} description={displayTime(record.time)} />
                                <AttendanceSheet record={record} profiles={students.data} editable onChange={replaceRecord} />
                            </Card>
                        ))}
                    </div>
                </>
            )}
        </>
    );
};

export default withSuspense(TeacherSectionPage);
