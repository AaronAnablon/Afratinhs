"use client"

import { useId, useState } from "react";
import { api, errorMessage } from "@/utils/http";
import { fullName } from "../ui/Avatar";
import { Button } from "../ui/Button";
import { SelectField, TextField } from "../ui/Field";
import { useToast } from "../ui/Feedback";
import { Modal } from "../ui/Modal";
import { PasswordFields, passwordProblem } from "./PasswordFields";

// Adds a student to `section`, or edits one when `student` is given.
// `sections` suggests existing section names when moving a student.
export const StudentFormDialog = ({ student, section, sections = [], teachers = [], onClose, onSaved }) => {
    const toast = useToast();
    const formId = useId();
    const listId = useId();
    const editing = Boolean(student);
    const [form, setForm] = useState({
        firstName: student?.firstName ?? "",
        lastName: student?.lastName ?? "",
        email: student?.email ?? "",
        contact: student?.contact ?? "",
        homeAddress: student?.homeAddress ?? "",
        age: student?.age ?? "",
        adviser: student?.adviser ?? "",
        section: student?.section ?? section ?? "",
        password: "",
        confirmPassword: "",
    });
    const [changePassword, setChangePassword] = useState(!editing);
    const [passwordError, setPasswordError] = useState("");
    const [saving, setSaving] = useState(false);

    const set = (name, value) => setForm((current) => ({ ...current, [name]: value }));

    const submit = async (event) => {
        event.preventDefault();
        const problem = changePassword ? passwordProblem(form.password, form.confirmPassword) : "";
        setPasswordError(problem);
        if (problem) return;

        const { confirmPassword, password, ...rest } = form;
        const data = { ...rest, ...(changePassword && { password }) };
        setSaving(true);
        try {
            if (editing) await api.put(`/api/people/${student.id}`, { data });
            else await api.post("/api/people/addStudent", data);
            toast.success(editing ? "Student updated." : "Student added.");
            onSaved?.();
            onClose();
        } catch (error) {
            toast.error(errorMessage(error));
            setSaving(false);
        }
    };

    return (
        <Modal
            size="lg"
            title={editing ? "Edit student" : "Add student"}
            description={editing ? undefined : `New student in ${section}. They're added to every class of this section.`}
            onClose={onClose}
            footer={(
                <>
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit" form={formId} loading={saving}>{editing ? "Save changes" : "Add student"}</Button>
                </>
            )}
        >
            <form id={formId} onSubmit={submit} className="grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                    <TextField label="First name" value={form.firstName} onChange={(e) => set("firstName", e.target.value)} required autoFocus />
                    <TextField label="Last name" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} required />
                    <TextField label="Email" type="email" autoComplete="off" value={form.email} onChange={(e) => set("email", e.target.value)} required />
                    <TextField label="Contact number" type="tel" value={form.contact} onChange={(e) => set("contact", e.target.value)} />
                    <TextField label="Home address" value={form.homeAddress} onChange={(e) => set("homeAddress", e.target.value)} className="sm:col-span-2" />
                    <TextField label="Age" type="number" min="5" max="99" value={form.age} onChange={(e) => set("age", e.target.value)} />
                    <SelectField label="Adviser" value={form.adviser} onChange={(e) => set("adviser", e.target.value)}>
                        <option value="">No adviser</option>
                        {teachers.map((teacher) => (
                            <option key={teacher.id} value={fullName(teacher)}>{fullName(teacher)}</option>
                        ))}
                        {form.adviser && !teachers.some((teacher) => fullName(teacher) === form.adviser) && (
                            <option value={form.adviser}>{form.adviser}</option>
                        )}
                    </SelectField>
                    {editing && (
                        <>
                            <TextField
                                label="Section"
                                list={listId}
                                value={form.section}
                                onChange={(e) => set("section", e.target.value)}
                                required
                                hint="Changing it moves the student to that section's classes."
                                className="sm:col-span-2"
                            />
                            <datalist id={listId}>
                                {sections.map((name) => <option key={name} value={name} />)}
                            </datalist>
                        </>
                    )}
                </div>
                {editing && (
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                        <input type="checkbox" checked={changePassword} onChange={(e) => setChangePassword(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-brand-700 focus:ring-brand-600" />
                        Set a new password
                    </label>
                )}
                {changePassword && (
                    <PasswordFields password={form.password} confirm={form.confirmPassword} onChange={set} error={passwordError} />
                )}
            </form>
        </Modal>
    );
};
