"use client"

import { useState } from "react";
import { HiOutlinePhoto } from "react-icons/hi2";
import { api, errorMessage } from "@/utils/http";
import { Avatar } from "./ui/Avatar";
import { Button } from "./ui/Button";
import { useToast } from "./ui/Feedback";
import { Modal } from "./ui/Modal";

const MAX_BYTES = 5 * 1024 * 1024;

export const readImageFile = (file) => new Promise((resolve, reject) => {
    if (!file || !/^image\/(png|jpe?g|webp)$/.test(file.type)) return reject(new Error("Please choose a JPG, PNG or WebP image."));
    if (file.size > MAX_BYTES) return reject(new Error("Please choose an image smaller than 5 MB."));
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Couldn't read that file."));
    reader.readAsDataURL(file);
});

export const ProfilePhotoDialog = ({ user, isDemo, onClose, onSaved }) => {
    const toast = useToast();
    const [file, setFile] = useState(null);
    const [saving, setSaving] = useState(false);

    const choose = async (event) => {
        try {
            setFile(await readImageFile(event.target.files[0]));
        } catch (error) {
            toast.error(error.message);
        }
    };

    const save = async () => {
        setSaving(true);
        try {
            await api.put(`/api/people/uploadProfile/${user.id}`, { file });
            toast.success("Profile photo updated.");
            onSaved?.();
            onClose();
        } catch (error) {
            toast.error(errorMessage(error));
            setSaving(false);
        }
    };

    return (
        <Modal
            size="sm"
            title="Profile photo"
            onClose={onClose}
            footer={!isDemo && (
                <>
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={save} loading={saving} disabled={!file}>Save photo</Button>
                </>
            )}
        >
            <div className="flex flex-col items-center gap-4 py-2">
                {file
                    /* eslint-disable-next-line @next/next/no-img-element -- local preview of a data URL */
                    ? <img src={file} alt="New profile photo preview" className="h-24 w-24 rounded-full object-cover ring-1 ring-slate-200" />
                    : <Avatar person={user} size="xl" />}
                {isDemo ? (
                    <p className="text-center text-sm text-slate-500">Demo accounts can&apos;t change their profile photo.</p>
                ) : (
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">
                        <HiOutlinePhoto className="h-4 w-4" aria-hidden="true" />
                        Choose image
                        <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={choose} />
                    </label>
                )}
            </div>
        </Modal>
    );
};
