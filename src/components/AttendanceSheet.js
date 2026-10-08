"use client"

import { useState } from "react";
import { HiOutlineDocumentText } from "react-icons/hi2";
import { api, errorMessage } from "@/utils/http";
import { isPast } from "@/utils/schedule";
import { LetterViewer } from "./LetterDialogs";
import { Avatar, fullName } from "./ui/Avatar";
import { StatusPill } from "./ui/Badge";
import { Button } from "./ui/Button";
import { useToast } from "./ui/Feedback";

// Students of one class with their IN / OUT status. When `editable`, clicking
// a status flips it right away and `onChange` receives the updated class.
export const AttendanceSheet = ({ record, profiles = [], editable = false, onChange }) => {
    const toast = useToast();
    const [saving, setSaving] = useState(null);
    const [letter, setLetter] = useState(null);

    const byId = new Map(profiles.map((person) => [person.id, person]));
    const rows = (record.students || [])
        .map((entry) => ({ entry, person: byId.get(entry.id) }))
        .sort((a, b) => fullName(a.person).localeCompare(fullName(b.person)));
    const past = isPast(record);
    const presentIn = rows.filter(({ entry }) => entry.statusIn === "present").length;
    const presentOut = rows.filter(({ entry }) => entry.statusOut === "present").length;

    const toggle = async (entry, field) => {
        setSaving(`${entry.id}:${field}`);
        try {
            const { data } = await api.put(`/api/attendance/updateStatusOfStudent/${record.id}`, {
                studentId: entry.id,
                statusIn: entry.statusIn ?? "absent",
                statusOut: entry.statusOut ?? "absent",
                [field]: entry[field] === "present" ? "absent" : "present",
            });
            onChange?.(data);
        } catch (error) {
            toast.error(errorMessage(error));
        }
        setSaving(null);
    };

    if (rows.length === 0) {
        return <p className="px-4 py-6 text-center text-sm text-slate-500">No students in this class yet.</p>;
    }

    return (
        <div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 border-b border-slate-100 bg-slate-50/60 px-4 py-2 text-xs text-slate-500">
                <span><span className="font-semibold text-slate-700">{presentIn}</span> of {rows.length} present at IN</span>
                <span><span className="font-semibold text-slate-700">{presentOut}</span> of {rows.length} present at OUT</span>
            </div>
            <ul className="divide-y divide-slate-100">
                {rows.map(({ entry, person }) => (
                    <li key={entry.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 items-center gap-3">
                            <Avatar person={person} size="sm" />
                            <span className="truncate text-sm font-medium text-slate-900">{person ? fullName(person) : "Removed student"}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 pl-11 sm:pl-0">
                            <StatusPill
                                label="In"
                                present={entry.statusIn === "present"}
                                pending={!entry.statusIn && !past}
                                saving={saving === `${entry.id}:statusIn`}
                                onToggle={editable ? () => toggle(entry, "statusIn") : undefined}
                            />
                            <StatusPill
                                label="Out"
                                present={entry.statusOut === "present"}
                                pending={!entry.statusOut && !past}
                                saving={saving === `${entry.id}:statusOut`}
                                onToggle={editable ? () => toggle(entry, "statusOut") : undefined}
                            />
                            {entry.letterUrl && (
                                <Button size="sm" variant="ghost" icon={HiOutlineDocumentText} onClick={() => setLetter(entry.letterUrl)}>
                                    Letter
                                </Button>
                            )}
                        </div>
                    </li>
                ))}
            </ul>
            {letter && <LetterViewer url={letter} onClose={() => setLetter(null)} />}
        </div>
    );
};
