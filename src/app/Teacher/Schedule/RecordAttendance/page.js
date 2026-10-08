"use client"

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { HiOutlineCheck, HiOutlineCheckCircle, HiOutlineFaceSmile, HiOutlinePlay, HiOutlineVideoCamera } from "react-icons/hi2";
import { createMatcher } from "@/app/faceUtil";
import { useCurrentUser } from "@/components/AppShell";
import { refreshDemoGuide } from "@/components/DemoGuide";
import { LiveRecognition } from "@/components/face/LiveRecognition";
import { Avatar, fullName } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Feedback";
import { Segmented } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageLoader } from "@/components/ui/Spinner";
import { DEMO_FACE_PHOTOS } from "@/globalData/demoAccounts";
import { api, errorMessage, useFetch } from "@/utils/http";
import { displayTime, parseClassDate, relativeDayLabel } from "@/utils/schedule";
import { withSuspense } from "@/utils/withSuspense";

const RecordAttendancePage = () => {
    const toast = useToast();
    const { isDemo } = useCurrentUser();
    const attendanceId = useSearchParams().get("AttendanceId");
    const record = useFetch(attendanceId ? `/api/attendance/getAttendanceById/${attendanceId}` : null);
    const section = record.data?.section;
    const students = useFetch(section ? `/api/people/getStudents/${encodeURIComponent(section)}` : null);
    // Relative URL so the demo visitor cookie is always sent.
    const faces = useFetch(attendanceId ? `/api/facePhotos/forAttendance/${attendanceId}` : null);
    const faceMatcher = useMemo(() => (faces.data?.length ? createMatcher(faces.data) : null), [faces.data]);

    const [check, setCheck] = useState("in");
    const [recording, setRecording] = useState(false);
    const [recognized, setRecognized] = useState([]);
    const [saving, setSaving] = useState(false);

    const onRecognized = useCallback((id) => setRecognized((current) => (current.includes(id) ? current : [...current, id])), []);

    const error = record.error || students.error || faces.error;
    if (error) return <ErrorState message={error} onRetry={() => { record.reload(); students.reload(); faces.reload(); }} />;
    if (record.loading || students.loading || faces.loading) return <PageLoader />;

    const field = check === "in" ? "statusIn" : "statusOut";
    const entries = new Map((record.data.students || []).map((entry) => [entry.id, entry]));
    const roster = students.data
        .filter((student) => entries.has(student.id))
        .sort((a, b) => fullName(a).localeCompare(fullName(b)));
    const withFaces = new Set(faces.data.map((face) => face.owner));
    const date = parseClassDate(record.data.date);

    const save = async () => {
        setSaving(true);
        try {
            const { data } = await api.put(`/api/attendance/updateStatusOfStudents/${attendanceId}`, {
                studentIds: recognized,
                status: check === "in",
            });
            record.mutate(data);
            if (isDemo) refreshDemoGuide();
            toast.success(`${recognized.length} ${recognized.length === 1 ? "student" : "students"} marked present for ${check.toUpperCase()}.`);
            setRecording(false);
            setRecognized([]);
        } catch (requestError) {
            toast.error(errorMessage(requestError));
        }
        setSaving(false);
    };

    const cancel = () => {
        setRecording(false);
        setRecognized([]);
    };

    return (
        <>
            <PageHeader
                back={{ href: "/Teacher/Schedule", label: "Schedule" }}
                title={`${record.data.event} · ${record.data.section}`}
                description={`${date ? relativeDayLabel(date) : record.data.date} · ${displayTime(record.data.time)}`}
                actions={(
                    <ButtonLink variant="secondary" href={`/Teacher/Schedule/CopyAttendance?AttendanceId=${attendanceId}`}>
                        Open sheet
                    </ButtonLink>
                )}
            />

            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                        <div className="flex items-center gap-3">
                            <Segmented
                                value={check}
                                onChange={setCheck}
                                options={[
                                    { value: "in", label: "Time in", disabled: recording },
                                    { value: "out", label: "Time out", disabled: recording },
                                ]}
                            />
                        </div>
                        {recording ? (
                            <div className="flex gap-2">
                                <Button variant="ghost" onClick={cancel} disabled={saving}>Cancel</Button>
                                <Button icon={HiOutlineCheck} onClick={save} loading={saving}>
                                    Save {recognized.length > 0 && `(${recognized.length})`}
                                </Button>
                            </div>
                        ) : (
                            <Button icon={HiOutlinePlay} onClick={() => setRecording(true)} disabled={!faceMatcher}>Start camera</Button>
                        )}
                    </div>
                    <div className="p-5">
                        {!faceMatcher ? (
                            <EmptyState
                                icon={HiOutlineFaceSmile}
                                title="No faces to recognize yet"
                                description={isDemo
                                    ? `Register your face first (${DEMO_FACE_PHOTOS} photos). The camera will then recognize you as Demo Student.`
                                    : `Ask your admin to add face photos for the students in ${record.data.section}. You can still mark attendance on the sheet.`}
                                action={isDemo && <ButtonLink href="/DemoFace">Register your face</ButtonLink>}
                            />
                        ) : recording ? (
                            <LiveRecognition faceMatcher={faceMatcher} students={roster} onRecognized={onRecognized} />
                        ) : (
                            <div className="flex aspect-[4/3] flex-col items-center justify-center gap-3 rounded-xl bg-slate-100 px-6 text-center">
                                <HiOutlineVideoCamera className="h-10 w-10 text-slate-400" aria-hidden="true" />
                                <p className="text-sm font-medium text-slate-700">Camera is off</p>
                                <p className="max-w-sm text-sm text-slate-500">
                                    Choose Time in or Time out, then start the camera. Students are marked present as they&apos;re recognized. Press Save when you&apos;re done.
                                </p>
                            </div>
                        )}
                    </div>
                </Card>

                <Card>
                    <CardHeader
                        title="Students"
                        description={recording ? `${recognized.length} of ${roster.length} recognized` : `${roster.filter((s) => entries.get(s.id)?.[field] === "present").length} of ${roster.length} present for ${check === "in" ? "time in" : "time out"}`}
                    />
                    <ul className="max-h-[28rem] divide-y divide-slate-100 overflow-y-auto">
                        {roster.map((student) => {
                            const justSeen = recognized.includes(student.id);
                            const alreadyPresent = entries.get(student.id)?.[field] === "present";
                            return (
                                <li key={student.id} className="flex items-center justify-between gap-3 px-5 py-2.5">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <Avatar person={student} size="sm" />
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium text-slate-900">{fullName(student)}</p>
                                            {!withFaces.has(student.id) && <p className="text-xs text-slate-400">No face photo</p>}
                                        </div>
                                    </div>
                                    {justSeen ? (
                                        <Badge tone="brand"><HiOutlineCheckCircle className="h-3.5 w-3.5" aria-hidden="true" />Recognized</Badge>
                                    ) : alreadyPresent ? (
                                        <Badge tone="brand">Present</Badge>
                                    ) : (
                                        <Badge>Not yet</Badge>
                                    )}
                                </li>
                            );
                        })}
                        {roster.length === 0 && <li className="px-5 py-6 text-center text-sm text-slate-500">No students in this class.</li>}
                    </ul>
                    {roster.length > 0 && (
                        <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
                            Need to fix someone? <Link href={`/Teacher/Schedule/CopyAttendance?AttendanceId=${attendanceId}`} className="font-medium text-brand-700 hover:text-brand-800">Edit on the sheet</Link>.
                        </p>
                    )}
                </Card>
            </div>
        </>
    );
};

export default withSuspense(RecordAttendancePage);
