"use client"

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { HiOutlineCamera, HiOutlineDocumentDuplicate } from "react-icons/hi2";
import { AttendanceSheet } from "@/components/AttendanceSheet";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/EmptyState";
import { useConfirm, useToast } from "@/components/ui/Feedback";
import { inputClass } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageLoader } from "@/components/ui/Spinner";
import { api, errorMessage, useFetch } from "@/utils/http";
import { displayTime, parseClassDate, relativeDayLabel } from "@/utils/schedule";
import { withSuspense } from "@/utils/withSuspense";

// The attendance sheet of one class: review, correct, or copy from another class.
const AttendanceSheetPage = () => {
    const toast = useToast();
    const confirm = useConfirm();
    const attendanceId = useSearchParams().get("AttendanceId");
    const record = useFetch(attendanceId ? `/api/attendance/getAttendanceById/${attendanceId}` : null);
    const section = record.data?.section;
    const students = useFetch(section ? `/api/people/getStudents/${encodeURIComponent(section)}` : null);
    const [code, setCode] = useState("");
    const [copying, setCopying] = useState(false);

    if (record.error || students.error) return <ErrorState message={record.error || students.error} onRetry={() => { record.reload(); students.reload(); }} />;
    if (record.loading || students.loading) return <PageLoader />;

    const date = parseClassDate(record.data.date);

    const copy = async (event) => {
        event.preventDefault();
        const ok = await confirm({
            title: `Copy attendance from class ${code}?`,
            message: "Every student's IN and OUT status on this sheet is replaced with the one from that class.",
            confirmLabel: "Copy attendance",
        });
        if (!ok) return;
        setCopying(true);
        try {
            const { data } = await api.put(`/api/attendance/copyAttendance/${attendanceId}`, { code });
            record.mutate(data);
            setCode("");
            toast.success("Attendance copied.");
        } catch (error) {
            toast.error(errorMessage(error));
        }
        setCopying(false);
    };

    return (
        <>
            <PageHeader
                back={{ href: "/Teacher/Schedule", label: "Schedule" }}
                title={`${record.data.event} · ${record.data.section}`}
                description={`${date ? relativeDayLabel(date) : record.data.date} · ${displayTime(record.data.time)}`}
                actions={(
                    <ButtonLink icon={HiOutlineCamera} href={`/Teacher/Schedule/RecordAttendance?AttendanceId=${attendanceId}`}>
                        Take attendance
                    </ButtonLink>
                )}
            />

            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader title="Attendance sheet" description="Click a status to switch it between present and absent." />
                    <AttendanceSheet record={record.data} profiles={students.data} editable onChange={record.mutate} />
                </Card>

                <div className="space-y-6">
                    <Card className="p-5">
                        <h2 className="text-base font-semibold text-slate-900">Copy from another class</h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Already took attendance in another {record.data.section} class today? Enter its code to copy it here.
                        </p>
                        <form onSubmit={copy} className="mt-4 flex gap-2">
                            <input
                                value={code}
                                onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 5))}
                                inputMode="numeric"
                                placeholder="5-digit code"
                                aria-label="Class code"
                                className={`${inputClass} tabular-nums`}
                                required
                                minLength={5}
                            />
                            <Button type="submit" variant="secondary" icon={HiOutlineDocumentDuplicate} loading={copying} disabled={code.length !== 5}>Copy</Button>
                        </form>
                    </Card>
                    <Card className="p-5">
                        <h2 className="text-base font-semibold text-slate-900">This class&apos;s code</h2>
                        <p className="mt-1 text-sm text-slate-500">Share it so other classes in this section can copy this attendance.</p>
                        <p className="mt-3 inline-block rounded-lg bg-brand-50 px-3 py-1.5 font-mono text-2xl font-semibold tracking-[0.25em] text-brand-800 ring-1 ring-inset ring-brand-600/20">{record.data.code}</p>
                    </Card>
                </div>
            </div>
        </>
    );
};

export default withSuspense(AttendanceSheetPage);
