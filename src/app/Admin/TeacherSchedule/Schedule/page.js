"use client"

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { HiOutlineCalendarDays, HiOutlinePencilSquare, HiOutlinePlus, HiOutlineTrash } from "react-icons/hi2";
import { ClassList } from "@/components/ClassList";
import { ScheduleFormDialog } from "@/components/forms/ScheduleFormDialog";
import { fullName } from "@/components/ui/Avatar";
import { Button, IconButton } from "@/components/ui/Button";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { useConfirm, useToast } from "@/components/ui/Feedback";
import { Segmented } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageLoader } from "@/components/ui/Spinner";
import { api, errorMessage, useFetch } from "@/utils/http";
import { displayTime, isUpcoming, uniqueSections } from "@/utils/schedule";
import { withSuspense } from "@/utils/withSuspense";

const TeacherSchedulePage = () => {
    const toast = useToast();
    const confirm = useConfirm();
    const teacherId = useSearchParams().get("id");
    const teacher = useFetch(teacherId ? `/api/people/${teacherId}` : null);
    const classes = useFetch(teacherId ? `/api/attendance/${teacherId}` : null);
    const allClasses = useFetch("/api/attendance");
    const [tab, setTab] = useState("upcoming");
    const [dialog, setDialog] = useState(null);

    const error = teacher.error || classes.error;
    if (error) return <ErrorState message={error} onRetry={() => { teacher.reload(); classes.reload(); }} />;
    if (teacher.loading || classes.loading) return <PageLoader />;

    const upcoming = classes.data.filter(isUpcoming);
    const past = classes.data.filter((record) => !isUpcoming(record));

    const reload = () => {
        classes.reload();
        allClasses.reload();
    };

    const remove = async (record) => {
        const ok = await confirm({
            title: "Delete this class?",
            message: `${record.event} on ${record.date}, ${displayTime(record.time)}. Its attendance is deleted too.`,
            confirmLabel: "Delete class",
            tone: "danger",
        });
        if (!ok) return;
        try {
            await api.delete(`/api/attendance/${record.id}`);
            toast.success("Class deleted.");
            reload();
        } catch (requestError) {
            toast.error(errorMessage(requestError));
        }
    };

    return (
        <>
            <PageHeader
                back={{ href: "/Admin/TeacherSchedule", label: "Teachers" }}
                title={fullName(teacher.data)}
                description={teacher.data.email}
                actions={<Button icon={HiOutlinePlus} onClick={() => setDialog({})}>Add classes</Button>}
            />

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
                renderActions={(record) => (
                    <>
                        <IconButton icon={HiOutlinePencilSquare} label="Edit class" onClick={() => setDialog({ record })} />
                        <IconButton icon={HiOutlineTrash} tone="danger" label="Delete class" onClick={() => remove(record)} />
                    </>
                )}
                emptyState={(
                    <EmptyState
                        icon={HiOutlineCalendarDays}
                        title={tab === "upcoming" ? "No upcoming classes" : "No past classes"}
                        description={tab === "upcoming" ? `Schedule classes for ${teacher.data.firstName} to start taking attendance.` : undefined}
                        action={tab === "upcoming" && <Button icon={HiOutlinePlus} onClick={() => setDialog({})}>Add classes</Button>}
                    />
                )}
            />

            {dialog && (
                <ScheduleFormDialog
                    teacherId={teacherId}
                    record={dialog.record}
                    sections={uniqueSections(allClasses.data)}
                    onClose={() => setDialog(null)}
                    onSaved={reload}
                />
            )}
        </>
    );
};

export default withSuspense(TeacherSchedulePage);
