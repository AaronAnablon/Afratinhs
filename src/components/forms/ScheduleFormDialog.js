"use client"

import { useId, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { HiOutlineXMark } from "react-icons/hi2";
import { api, errorMessage } from "@/utils/http";
import { dayKey, formatClassDate, formatTimeRange, fromDayKey, parseClassDate, parseTimeRange, shortDate } from "@/utils/schedule";
import { Button } from "../ui/Button";
import { TextField } from "../ui/Field";
import { useToast } from "../ui/Feedback";
import { Modal } from "../ui/Modal";

// Adds classes for a teacher on one or more dates, or edits one class when `record` is given.
export const ScheduleFormDialog = ({ teacherId, record, sections = [], onClose, onSaved }) => {
    const toast = useToast();
    const formId = useId();
    const listId = useId();
    const editing = Boolean(record);
    const initialTime = parseTimeRange(record?.time);
    const initialDate = record && parseClassDate(record.date);
    const [dates, setDates] = useState([]);
    const [date, setDate] = useState(initialDate ? dayKey(initialDate) : "");
    const [from, setFrom] = useState(initialTime.from || "08:00");
    const [to, setTo] = useState(initialTime.to || "09:00");
    const [section, setSection] = useState(record?.section ?? "");
    const [event, setEvent] = useState(record?.event ?? "");
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    const sortedDates = [...dates].sort((a, b) => a - b);

    const submit = async (submitEvent) => {
        submitEvent.preventDefault();
        if (!editing && dates.length === 0) return setError("Pick at least one date on the calendar.");
        if (from >= to) return setError("The class has to end after it starts.");
        setError("");

        const time = formatTimeRange(from, to);
        setSaving(true);
        try {
            if (editing) {
                await api.put(`/api/attendance/${record.id}`, {
                    data: { date: formatClassDate(fromDayKey(date)), time, teacher: record.teacher, event, section },
                });
            } else {
                await api.post("/api/attendance", { dates: sortedDates.map(formatClassDate), time, teacher: teacherId, event, section });
            }
            toast.success(editing ? "Class updated." : `${dates.length} ${dates.length === 1 ? "class" : "classes"} added.`);
            onSaved?.();
            onClose();
        } catch (requestError) {
            toast.error(errorMessage(requestError));
            setSaving(false);
        }
    };

    return (
        <Modal
            size={editing ? "md" : "lg"}
            title={editing ? "Edit class" : "Add classes"}
            description={editing ? undefined : "Pick every date this class happens. Students in the section are added automatically."}
            onClose={onClose}
            footer={(
                <>
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit" form={formId} loading={saving}>
                        {editing ? "Save changes" : dates.length > 1 ? `Add ${dates.length} classes` : "Add class"}
                    </Button>
                </>
            )}
        >
            <form id={formId} onSubmit={submit} className={editing ? "grid gap-4" : "grid gap-6 md:grid-cols-[auto,1fr]"}>
                {!editing && (
                    <div>
                        <p className="mb-1.5 text-sm font-medium text-slate-700">Dates</p>
                        <div className="date-picker"><DatePicker inline selectsMultiple selectedDates={dates} onChange={(value) => setDates(value ?? [])} /></div>
                        <div className="mt-2 flex max-w-[16rem] flex-wrap gap-1.5">
                            {sortedDates.map((value) => (
                                <span key={dayKey(value)} className="inline-flex items-center gap-1 rounded-md bg-brand-50 py-0.5 pl-2 pr-1 text-xs font-medium text-brand-800">
                                    {shortDate(value)}
                                    <button type="button" aria-label={`Remove ${shortDate(value)}`} onClick={() => setDates(dates.filter((d) => dayKey(d) !== dayKey(value)))} className="rounded p-0.5 hover:bg-brand-100">
                                        <HiOutlineXMark className="h-3 w-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>
                )}
                <div className="grid content-start gap-4">
                    {editing && <TextField label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />}
                    <div className="grid grid-cols-2 gap-3">
                        <TextField label="Starts" type="time" value={from} onChange={(e) => setFrom(e.target.value)} required />
                        <TextField label="Ends" type="time" value={to} onChange={(e) => setTo(e.target.value)} required />
                    </div>
                    <TextField label="Subject or event" placeholder="e.g. Mathematics" value={event} onChange={(e) => setEvent(e.target.value)} required />
                    <TextField
                        label="Section"
                        placeholder="e.g. Grade 10 - Rizal"
                        list={listId}
                        value={section}
                        onChange={(e) => setSection(e.target.value)}
                        required
                        hint={editing ? "Changing the section replaces the class's student list." : "Type a new name to create a section."}
                    />
                    <datalist id={listId}>
                        {sections.map((name) => <option key={name} value={name} />)}
                    </datalist>
                    {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
                </div>
            </form>
        </Modal>
    );
};
