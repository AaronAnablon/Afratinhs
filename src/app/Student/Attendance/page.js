"use client"

import { useCurrentUser } from "@/components/AppShell";
import { StudentAttendanceList, attendanceSummary } from "@/components/StudentAttendanceList";
import { SummaryStats } from "@/components/StudentProfile";
import { Card } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageLoader } from "@/components/ui/Spinner";
import { useFetch } from "@/utils/http";

export default function StudentAttendancePage() {
    const { user } = useCurrentUser();
    const classes = useFetch(user.section ? `/api/attendance/getStudents/${encodeURIComponent(user.section)}` : null);

    if (classes.error) return <ErrorState message={classes.error} onRetry={classes.reload} />;
    if (classes.loading) return <PageLoader />;

    const records = classes.data || [];
    const replaceRecord = (updated) => classes.mutate((current) => current.map((record) => (record.id === updated.id ? updated : record)));

    return (
        <>
            <PageHeader title="Attendance" description="Your time-in and time-out for each class. If you missed one, upload an excuse letter." />
            <Card className="mb-6 max-w-md">
                <SummaryStats summary={attendanceSummary(records, user.id)} />
            </Card>
            <StudentAttendanceList records={records} studentId={user.id} canUpload onRecordChange={replaceRecord} />
        </>
    );
}
