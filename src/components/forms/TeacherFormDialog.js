"use client"

import { useId, useState } from "react";
import { api, errorMessage } from "@/utils/http";
import { TEACHER } from "@/globalData/roles";
import { Button } from "../ui/Button";
import { TextField } from "../ui/Field";
import { useToast } from "../ui/Feedback";
import { Modal } from "../ui/Modal";
import { PasswordFields, passwordProblem } from "./PasswordFields";

// Adds a teacher, or edits one when `teacher` is given.
export const TeacherFormDialog = ({ teacher, onClose, onSaved }) => {
    const toast = useToast();
    const formId = useId();
    const editing = Boolean(teacher);
    const [form, setForm] = useState({
        firstName: teacher?.firstName ?? "",
        lastName: teacher?.lastName ?? "",
        email: teacher?.email ?? "",
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

        const data = { firstName: form.firstName, lastName: form.lastName, email: form.email, ...(changePassword && { password: form.password }) };
        setSaving(true);
        try {
            if (editing) await api.put(`/api/people/${teacher.id}`, { data });
            else await api.post("/api/people", { ...data, role: TEACHER });
            toast.success(editing ? "Teacher updated." : "Teacher added.");
            onSaved?.();
            onClose();
        } catch (error) {
            toast.error(errorMessage(error));
            setSaving(false);
        }
    };

    return (
        <Modal
            title={editing ? "Edit teacher" : "Add teacher"}
            description={editing ? undefined : "The teacher logs in with this email and password."}
            onClose={onClose}
            footer={(
                <>
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit" form={formId} loading={saving}>{editing ? "Save changes" : "Add teacher"}</Button>
                </>
            )}
        >
            <form id={formId} onSubmit={submit} className="grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                    <TextField label="First name" value={form.firstName} onChange={(e) => set("firstName", e.target.value)} required autoFocus />
                    <TextField label="Last name" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} required />
                </div>
                <TextField label="Email" type="email" autoComplete="off" value={form.email} onChange={(e) => set("email", e.target.value)} required />
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
