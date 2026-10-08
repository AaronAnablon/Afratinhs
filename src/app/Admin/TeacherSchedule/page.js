"use client"

import { useState } from "react";
import { HiOutlineCalendarDays, HiOutlinePencilSquare, HiOutlinePlus, HiOutlineTrash, HiOutlineUserGroup } from "react-icons/hi2";
import { TeacherFormDialog } from "@/components/forms/TeacherFormDialog";
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

export default function TeachersPage() {
    const toast = useToast();
    const confirm = useConfirm();
    const teachers = useFetch("/api/people/getTeachers");
    const classes = useFetch("/api/attendance");
    const [query, setQuery] = useState("");
    const [dialog, setDialog] = useState(null);

    if (teachers.error) return <ErrorState message={teachers.error} onRetry={teachers.reload} />;
    if (teachers.loading) return <PageLoader />;

    const classCount = (id) => (classes.data || []).filter((record) => record.teacher === id).length;
    const search = query.trim().toLowerCase();
    const list = teachers.data
        .filter((teacher) => !search || `${fullName(teacher)} ${teacher.email}`.toLowerCase().includes(search))
        .sort((a, b) => fullName(a).localeCompare(fullName(b)));

    const remove = async (teacher) => {
        const ok = await confirm({
            title: `Delete ${fullName(teacher)}?`,
            message: "This deletes the teacher's account and all of their scheduled classes, including attendance. It can't be undone.",
            confirmLabel: "Delete teacher",
            tone: "danger",
        });
        if (!ok) return;
        try {
            await api.delete(`/api/people/${teacher.id}`);
            toast.success(`${fullName(teacher)} was deleted.`);
            teachers.reload();
            classes.reload();
        } catch (error) {
            toast.error(errorMessage(error));
        }
    };

    return (
        <>
            <PageHeader
                title="Teachers"
                description={`${teachers.data.length} ${teachers.data.length === 1 ? "teacher" : "teachers"}. Open a teacher to plan their classes.`}
                actions={<Button icon={HiOutlinePlus} onClick={() => setDialog({})}>Add teacher</Button>}
            />

            {teachers.data.length === 0 ? (
                <EmptyState
                    icon={HiOutlineUserGroup}
                    title="No teachers yet"
                    description="Add a teacher, then schedule their classes."
                    action={<Button icon={HiOutlinePlus} onClick={() => setDialog({})}>Add teacher</Button>}
                />
            ) : (
                <>
                    <SearchInput value={query} onChange={setQuery} placeholder="Search teachers" className="mb-4 max-w-sm" />
                    <Card className="divide-y divide-slate-100">
                        {list.map((teacher) => (
                            <div key={teacher.id} className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex min-w-0 items-center gap-3">
                                    <Avatar person={teacher} />
                                    <div className="min-w-0">
                                        <p className="flex items-center gap-2 truncate text-sm font-semibold text-slate-900">
                                            {fullName(teacher)}
                                            {isDemoEmail(teacher.email) && <Badge tone="amber">Demo</Badge>}
                                        </p>
                                        <p className="truncate text-sm text-slate-500">{teacher.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 pl-[3.25rem] sm:pl-0">
                                    <span className="mr-2 text-xs text-slate-500">{classCount(teacher.id)} classes</span>
                                    <ButtonLink size="sm" variant="secondary" icon={HiOutlineCalendarDays} href={`/Admin/TeacherSchedule/Schedule?id=${teacher.id}`}>
                                        Schedule
                                    </ButtonLink>
                                    <IconButton icon={HiOutlinePencilSquare} label={`Edit ${fullName(teacher)}`} onClick={() => setDialog({ teacher })} />
                                    <IconButton icon={HiOutlineTrash} tone="danger" label={`Delete ${fullName(teacher)}`} onClick={() => remove(teacher)} />
                                </div>
                            </div>
                        ))}
                        {list.length === 0 && <p className="px-4 py-8 text-center text-sm text-slate-500">No teachers match &ldquo;{query}&rdquo;.</p>}
                    </Card>
                </>
            )}

            {dialog && <TeacherFormDialog teacher={dialog.teacher} onClose={() => setDialog(null)} onSaved={teachers.reload} />}
        </>
    );
}
