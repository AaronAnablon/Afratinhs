"use client"

import Link from "next/link";
import { HiOutlineChevronRight, HiOutlineRectangleStack, HiOutlineTrash } from "react-icons/hi2";
import { ButtonLink, IconButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { useConfirm, useToast } from "@/components/ui/Feedback";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageLoader } from "@/components/ui/Spinner";
import { STUDENT, TEACHER } from "@/globalData/roles";
import { api, errorMessage, useFetch } from "@/utils/http";
import { uniqueSections } from "@/utils/schedule";
import { fullName } from "@/components/ui/Avatar";

const plural = (count, word) => `${count} ${word}${count === 1 ? "" : "s"}`;

export default function SectionsPage() {
    const toast = useToast();
    const confirm = useConfirm();
    const classes = useFetch("/api/attendance");
    const people = useFetch("/api/people");

    if (classes.error || people.error) return <ErrorState message={classes.error || people.error} onRetry={() => { classes.reload(); people.reload(); }} />;
    if (classes.loading || people.loading) return <PageLoader />;

    const students = people.data.filter((person) => person.role === STUDENT);
    const teachers = people.data.filter((person) => person.role === TEACHER);
    const sections = uniqueSections([...classes.data, ...students]).map((name) => {
        const sectionClasses = classes.data.filter((record) => record.section === name);
        const teacherIds = [...new Set(sectionClasses.map((record) => record.teacher))];
        return {
            name,
            students: students.filter((student) => student.section === name).length,
            classes: sectionClasses.length,
            teachers: teacherIds.map((id) => fullName(teachers.find((teacher) => teacher.id === id))).filter(Boolean),
        };
    });

    const remove = async (section) => {
        const ok = await confirm({
            title: `Delete ${section.name}?`,
            message: `This deletes the section's ${plural(section.classes, "class")} and ${plural(section.students, "student account")}, including attendance and face photos. It can't be undone.`,
            confirmLabel: "Delete section",
            tone: "danger",
        });
        if (!ok) return;
        try {
            await api.delete(`/api/attendance/deleteSection/${encodeURIComponent(section.name)}`);
            toast.success(`${section.name} was deleted.`);
            classes.reload();
            people.reload();
        } catch (error) {
            toast.error(errorMessage(error));
        }
    };

    return (
        <>
            <PageHeader title="Sections" description="A section is created when you schedule a class for it. Open one to manage its students." />

            {sections.length === 0 ? (
                <EmptyState
                    icon={HiOutlineRectangleStack}
                    title="No sections yet"
                    description="Schedule a class for a teacher and give it a section name, then add students to that section here."
                    action={<ButtonLink variant="secondary" href="/Admin/TeacherSchedule">Go to teachers</ButtonLink>}
                />
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {sections.map((section) => {
                        const href = `/Admin/Sections/Students?section=${encodeURIComponent(section.name)}`;
                        return (
                            <Card key={section.name} className="flex flex-col p-5 transition hover:ring-brand-300">
                                <div className="flex items-start justify-between gap-2">
                                    <Link href={href} className="min-w-0 text-base font-semibold text-slate-900 hover:text-brand-700">
                                        <span className="block truncate">{section.name}</span>
                                    </Link>
                                    <IconButton icon={HiOutlineTrash} tone="danger" label={`Delete ${section.name}`} onClick={() => remove(section)} />
                                </div>
                                <p className="mt-1 text-sm text-slate-500">{plural(section.students, "student")} · {plural(section.classes, "class")}</p>
                                <p className="mt-3 line-clamp-2 flex-1 text-xs text-slate-500">
                                    {section.teachers.length ? `Taught by ${section.teachers.join(", ")}` : "No classes scheduled yet"}
                                </p>
                                <Link href={href} className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-800">
                                    View students <HiOutlineChevronRight className="h-4 w-4" aria-hidden="true" />
                                </Link>
                            </Card>
                        );
                    })}
                </div>
            )}
        </>
    );
}
