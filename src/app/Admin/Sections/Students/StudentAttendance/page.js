"use client"

import { useSearchParams } from "next/navigation";
import { HiOutlineFaceSmile } from "react-icons/hi2";
import { StudentAttendanceList, attendanceSummary } from "@/components/StudentAttendanceList";
import { Avatar, fullName } from "@/components/ui/Avatar";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageLoader } from "@/components/ui/Spinner";
import { useFetch } from "@/utils/http";
import { withSuspense } from "@/utils/withSuspense";
import { ProfileDetails, SummaryStats } from "@/components/StudentProfile";

const StudentAttendancePage = () => {
    const studentId = useSearchParams().get("id");
    const student = useFetch(studentId ? `/api/people/${studentId}` : null);
    const section = student.data?.section;
    const classes = useFetch(section ? `/api/attendance/getStudents/${encodeURIComponent(section)}` : null);

    if (student.error || classes.error) return <ErrorState message={student.error || classes.error} onRetry={() => { student.reload(); classes.reload(); }} />;
    if (student.loading || (section && classes.loading)) return <PageLoader />;

    const records = classes.data || [];
    const replaceRecord = (updated) => classes.mutate((current) => current.map((record) => (record.id === updated.id ? updated : record)));

    return (
        <>
            <PageHeader
                back={{ href: `/Admin/Sections/Students?section=${encodeURIComponent(section ?? "")}`, label: section || "Sections" }}
                title={fullName(student.data)}
                description={student.data.email}
                actions={(
                    <ButtonLink variant="secondary" icon={HiOutlineFaceSmile} href={`/Admin/Sections/Students/StudentAttendance/AddFacePhoto?id=${studentId}`}>
                        Face photos
                    </ButtonLink>
                )}
            />

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="space-y-6">
                    <Card className="p-5">
                        <div className="mb-5 flex items-center gap-4">
                            <Avatar person={student.data} size="lg" />
                            <div className="min-w-0">
                                <p className="truncate font-semibold text-slate-900">{fullName(student.data)}</p>
                                <p className="truncate text-sm text-slate-500">Student</p>
                            </div>
                        </div>
                        <ProfileDetails person={student.data} />
                    </Card>
                    <Card>
                        <SummaryStats summary={attendanceSummary(records, studentId)} />
                    </Card>
                </div>
                <section className="lg:col-span-2">
                    <h2 className="mb-1 text-base font-semibold text-slate-900">Attendance</h2>
                    <p className="mb-4 text-sm text-slate-500">Click a status to correct it.</p>
                    <StudentAttendanceList records={records} studentId={studentId} editable onRecordChange={replaceRecord} />
                </section>
            </div>
        </>
    );
};

export default withSuspense(StudentAttendancePage);
