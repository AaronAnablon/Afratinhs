"use client"

import { useState } from "react";
import { HiOutlineArrowUpTray, HiOutlineClipboardDocumentCheck, HiOutlineDocumentText } from "react-icons/hi2";
import { api, errorMessage } from "@/utils/http";
import { displayTime, groupByDay, isPast, isUpcoming, isToday } from "@/utils/schedule";
import { LetterUploadDialog, LetterViewer } from "./LetterDialogs";
import { Badge, StatusPill } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { EmptyState } from "./ui/EmptyState";
import { useToast } from "./ui/Feedback";

// Classes that already happened (including today), newest first.
export const attendedClasses = (records = []) => records.filter((record) => !isUpcoming(record) || isToday(record));

export const attendanceSummary = (records, studentId) => {
    const entries = attendedClasses(records)
        .map((record) => ({ record, entry: (record.students || []).find((student) => student.id === studentId) }))
        .filter(({ entry }) => entry);
    return {
        total: entries.length,
        present: entries.filter(({ entry }) => entry.statusIn === "present").length,
        absent: entries.filter(({ record, entry }) => entry.statusIn !== "present" && !isToday(record)).length,
        letters: entries.filter(({ entry }) => entry.letterUrl).length,
    };
};

// One student's attendance per class. Admins can flip statuses (`editable`);
// students can upload an excuse letter for classes they missed (`canUpload`).
export const StudentAttendanceList = ({ records, studentId, editable = false, canUpload = false, onRecordChange }) => {
    const toast = useToast();
    const [saving, setSaving] = useState(null);
    const [viewing, setViewing] = useState(null);
    const [uploading, setUploading] = useState(null);

    const groups = groupByDay(attendedClasses(records), "desc");
    if (groups.length === 0) {
        return <EmptyState icon={HiOutlineClipboardDocumentCheck} title="No attendance yet" description="Attendance appears here once classes have taken place." />;
    }

    const toggle = async (record, entry, field) => {
        setSaving(`${record.id}:${field}`);
        try {
            const { data } = await api.put(`/api/attendance/updateStatusOfStudent/${record.id}`, {
                studentId,
                statusIn: entry.statusIn ?? "absent",
                statusOut: entry.statusOut ?? "absent",
                [field]: entry[field] === "present" ? "absent" : "present",
            });
            onRecordChange?.(data);
        } catch (error) {
            toast.error(errorMessage(error));
        }
        setSaving(null);
    };

    return (
        <div className="space-y-6">
            {groups.map((group) => (
                <section key={group.key} aria-label={group.label}>
                    <h3 className="mb-2 text-sm font-semibold text-slate-900">{group.label}</h3>
                    <Card className="divide-y divide-slate-100">
                        {group.items.map((record) => {
                            const entry = (record.students || []).find((student) => student.id === studentId);
                            if (!entry) return null;
                            const past = isPast(record);
                            const missed = entry.statusIn === "absent" || (!entry.statusIn && past);
                            return (
                                <div key={record.id} className="flex flex-col gap-3 px-4 py-3.5 md:flex-row md:items-center md:justify-between">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-slate-900">{record.event}</p>
                                        <p className="mt-0.5 text-xs text-slate-500">{displayTime(record.time)}</p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <StatusPill
                                            label="In"
                                            present={entry.statusIn === "present"}
                                            pending={!entry.statusIn && !past}
                                            saving={saving === `${record.id}:statusIn`}
                                            onToggle={editable ? () => toggle(record, entry, "statusIn") : undefined}
                                        />
                                        <StatusPill
                                            label="Out"
                                            present={entry.statusOut === "present"}
                                            pending={!entry.statusOut && !past}
                                            saving={saving === `${record.id}:statusOut`}
                                            onToggle={editable ? () => toggle(record, entry, "statusOut") : undefined}
                                        />
                                        {entry.letterUrl ? (
                                            <Button size="sm" variant="ghost" icon={HiOutlineDocumentText} onClick={() => setViewing(entry.letterUrl)}>
                                                Letter
                                            </Button>
                                        ) : canUpload && missed ? (
                                            <Button size="sm" variant="secondary" icon={HiOutlineArrowUpTray} onClick={() => setUploading(record)}>
                                                Upload letter
                                            </Button>
                                        ) : missed && past ? (
                                            <Badge tone="amber">No letter</Badge>
                                        ) : null}
                                    </div>
                                </div>
                            );
                        })}
                    </Card>
                </section>
            ))}
            {viewing && <LetterViewer url={viewing} onClose={() => setViewing(null)} />}
            {uploading && (
                <LetterUploadDialog
                    attendanceId={uploading.id}
                    studentId={studentId}
                    className={`${uploading.event} · ${displayTime(uploading.time)}`}
                    onClose={() => setUploading(null)}
                    onUploaded={onRecordChange}
                />
            )}
        </div>
    );
};
