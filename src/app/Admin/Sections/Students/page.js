"use client"

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { HiOutlineAcademicCap, HiOutlineClipboardDocumentCheck, HiOutlineFaceSmile, HiOutlinePencilSquare, HiOutlinePlus, HiOutlineTrash } from "react-icons/hi2";
import { StudentFormDialog } from "@/components/forms/StudentFormDialog";
import { Avatar, fullName } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button, ButtonLink, IconButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { useConfirm, useToast } from "@/components/ui/Feedback";
import { SearchInput } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageLoader } from "@/components/ui/Spinner";
import { isDemoEmail } from "@/globalData/demoAccounts";
import { api, errorMessage, useFetch } from "@/utils/http";
import { uniqueSections } from "@/utils/schedule";
import { withSuspense } from "@/utils/withSuspense";

const SectionStudentsPage = () => {
    const toast = useToast();
    const confirm = useConfirm();
    const section = useSearchParams().get("section");
    const students = useFetch(section ? `/api/people/getStudents/${encodeURIComponent(section)}` : null);
    const teachers = useFetch("/api/people/getTeachers");
    const classes = useFetch("/api/attendance");
    const [query, setQuery] = useState("");
    const [dialog, setDialog] = useState(null);

    if (students.error) return <ErrorState message={students.error} onRetry={students.reload} />;
    if (students.loading) return <PageLoader />;

    const search = query.trim().toLowerCase();
    const list = students.data
        .filter((student) => !search || `${fullName(student)} ${student.email}`.toLowerCase().includes(search))
        .sort((a, b) => (a.lastName || "").localeCompare(b.lastName || "") || fullName(a).localeCompare(fullName(b)));

    const remove = async (student) => {
        const ok = await confirm({
            title: `Delete ${fullName(student)}?`,
            message: "This deletes the student's account, attendance and face photos. It can't be undone.",
            confirmLabel: "Delete student",
            tone: "danger",
        });
        if (!ok) return;
        try {
            await api.delete(`/api/people/${student.id}`);
            toast.success(`${fullName(student)} was deleted.`);
            students.reload();
        } catch (error) {
            toast.error(errorMessage(error));
        }
    };

    const addButton = <Button icon={HiOutlinePlus} onClick={() => setDialog({})}>Add student</Button>;

    return (
        <>
            <PageHeader
                back={{ href: "/Admin/Sections", label: "Sections" }}
                title={section}
                description={`${students.data.length} ${students.data.length === 1 ? "student" : "students"}`}
                actions={addButton}
            />

            {students.data.length === 0 ? (
                <EmptyState
                    icon={HiOutlineAcademicCap}
                    title="No students in this section"
                    description="Students you add here are included in every class of the section."
                    action={addButton}
                />
            ) : (
                <>
                    <SearchInput value={query} onChange={setQuery} placeholder="Search students" className="mb-4 max-w-sm" />
                    <Card className="divide-y divide-slate-100">
                        <div className="hidden grid-cols-[minmax(0,2fr),minmax(0,1fr),minmax(0,1fr),auto] gap-4 bg-slate-50/60 px-4 py-2 text-xs font-medium uppercase tracking-wide text-slate-500 lg:grid">
                            <span>Student</span><span>Contact</span><span>Adviser</span><span className="w-[17rem]" />
                        </div>
                        {list.map((student) => (
                            <div key={student.id} className="grid gap-3 px-4 py-3.5 lg:grid-cols-[minmax(0,2fr),minmax(0,1fr),minmax(0,1fr),auto] lg:items-center lg:gap-4">
                                <div className="flex min-w-0 items-center gap-3">
                                    <Avatar person={student} />
                                    <div className="min-w-0">
                                        <p className="flex items-center gap-2 truncate text-sm font-semibold text-slate-900">
                                            {fullName(student)}
                                            {isDemoEmail(student.email) && <Badge tone="amber">Demo</Badge>}
                                        </p>
                                        <p className="truncate text-sm text-slate-500">{student.email}</p>
                                    </div>
                                </div>
                                <p className="truncate text-sm text-slate-600"><span className="text-slate-400 lg:hidden">Contact: </span>{student.contact || "—"}</p>
                                <p className="truncate text-sm text-slate-600"><span className="text-slate-400 lg:hidden">Adviser: </span>{student.adviser || "—"}</p>
                                <div className="flex items-center gap-1">
                                    <ButtonLink size="sm" variant="secondary" icon={HiOutlineClipboardDocumentCheck} href={`/Admin/Sections/Students/StudentAttendance?id=${student.id}`}>
                                        Attendance
                                    </ButtonLink>
                                    <ButtonLink size="sm" variant="ghost" icon={HiOutlineFaceSmile} href={`/Admin/Sections/Students/StudentAttendance/AddFacePhoto?id=${student.id}`}>
                                        Faces
                                    </ButtonLink>
                                    <IconButton icon={HiOutlinePencilSquare} label={`Edit ${fullName(student)}`} onClick={() => setDialog({ student })} />
                                    <IconButton icon={HiOutlineTrash} tone="danger" label={`Delete ${fullName(student)}`} onClick={() => remove(student)} />
                                </div>
                            </div>
                        ))}
                        {list.length === 0 && <p className="px-4 py-8 text-center text-sm text-slate-500">No students match &ldquo;{query}&rdquo;.</p>}
                    </Card>
                </>
            )}

            {dialog && (
                <StudentFormDialog
                    student={dialog.student}
                    section={section}
                    sections={uniqueSections(classes.data)}
                    teachers={teachers.data || []}
                    onClose={() => setDialog(null)}
                    onSaved={students.reload}
                />
            )}
        </>
    );
};

export default withSuspense(SectionStudentsPage);
