"use client"

import { useState } from "react";
import { HiOutlineArrowTopRightOnSquare, HiOutlineArrowUpTray } from "react-icons/hi2";
import { api, errorMessage } from "@/utils/http";
import { readImageFile } from "./ProfilePhotoDialog";
import { Button } from "./ui/Button";
import { useToast } from "./ui/Feedback";
import { Modal } from "./ui/Modal";

export const LetterViewer = ({ url, onClose }) => (
    <Modal
        size="lg"
        title="Excuse letter"
        onClose={onClose}
        footer={(
            <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50">
                <HiOutlineArrowTopRightOnSquare className="h-4 w-4" aria-hidden="true" /> Open full size
            </a>
        )}
    >
        {/* eslint-disable-next-line @next/next/no-img-element -- uploaded letters can be any size */}
        <img src={url} alt="Excuse letter" className="mx-auto max-h-[65vh] rounded-lg object-contain" />
    </Modal>
);

// Lets a student upload a photo or scan of an excuse letter for one class.
export const LetterUploadDialog = ({ attendanceId, studentId, className, onClose, onUploaded }) => {
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

    const upload = async () => {
        setSaving(true);
        try {
            const { data } = await api.put(`/api/uploadLetter/${attendanceId}`, { file, studentId });
            toast.success("Letter uploaded.");
            onUploaded?.(data);
            onClose();
        } catch (error) {
            toast.error(errorMessage(error));
            setSaving(false);
        }
    };

    return (
        <Modal
            title="Upload excuse letter"
            description={className}
            onClose={onClose}
            footer={(
                <>
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={upload} loading={saving} disabled={!file}>Upload letter</Button>
                </>
            )}
        >
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center hover:border-brand-400 hover:bg-brand-50/40">
                {file ? (
                    /* eslint-disable-next-line @next/next/no-img-element -- local preview of a data URL */
                    <img src={file} alt="Letter preview" className="max-h-72 rounded-lg object-contain" />
                ) : (
                    <>
                        <HiOutlineArrowUpTray className="h-7 w-7 text-slate-400" aria-hidden="true" />
                        <span className="text-sm font-medium text-slate-700">Choose a photo of your letter</span>
                        <span className="text-xs text-slate-500">JPG, PNG or WebP, up to 5 MB</span>
                    </>
                )}
                <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={choose} />
            </label>
            {file && <p className="mt-2 text-center text-xs text-slate-500">Tap the image to choose a different one.</p>}
        </Modal>
    );
};
