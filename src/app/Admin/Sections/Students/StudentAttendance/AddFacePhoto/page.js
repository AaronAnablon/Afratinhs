"use client"

import { useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { HiOutlineFaceSmile, HiOutlineTrash } from "react-icons/hi2";
import { FaceCapture } from "@/components/face/FaceCapture";
import { fullName } from "@/components/ui/Avatar";
import { ButtonLink, IconButton } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { useConfirm, useToast } from "@/components/ui/Feedback";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageLoader } from "@/components/ui/Spinner";
import { isDemoEmail } from "@/globalData/demoAccounts";
import { api, errorMessage, useFetch } from "@/utils/http";
import { withSuspense } from "@/utils/withSuspense";

const FacePhotosPage = () => {
    const toast = useToast();
    const confirm = useConfirm();
    const studentId = useSearchParams().get("id");
    const student = useFetch(studentId ? `/api/people/${studentId}` : null);
    const isDemoStudent = isDemoEmail(student.data?.email);
    const photos = useFetch(student.data && !isDemoStudent ? `/api/facePhotos/${studentId}` : null);
    const [saving, setSaving] = useState(false);

    if (student.error) return <ErrorState message={student.error} onRetry={student.reload} />;
    if (student.loading) return <PageLoader />;

    const back = { href: `/Admin/Sections/Students/StudentAttendance?id=${studentId}`, label: fullName(student.data) };

    // Demo visitors each register their own face, so the shared uploader is hidden.
    if (isDemoStudent) {
        return (
            <>
                <PageHeader back={back} title="Face photos" description={fullName(student.data)} />
                <EmptyState
                    icon={HiOutlineFaceSmile}
                    title="Demo visitors use their own face"
                    description="Each visitor registers their own face for Demo Student, so no two visitors share one."
                    action={<ButtonLink href="/DemoFace">Register your face</ButtonLink>}
                />
            </>
        );
    }

    const save = async (photo, descriptor) => {
        setSaving(true);
        try {
            await api.post("/api/facePhotos", { owner: studentId, facePhoto: photo, faceDescriptor: descriptor });
            toast.success("Face photo saved.");
            photos.reload();
        } catch (error) {
            toast.error(errorMessage(error));
        }
        setSaving(false);
    };

    const remove = async (photo) => {
        const ok = await confirm({ title: "Delete this face photo?", message: "The camera will no longer use it to recognize this student.", confirmLabel: "Delete photo", tone: "danger" });
        if (!ok) return;
        try {
            await api.put(`/api/facePhotos/deleteFacePhoto/${photo.id}`);
            toast.success("Face photo deleted.");
            photos.reload();
        } catch (error) {
            toast.error(errorMessage(error));
        }
    };

    return (
        <>
            <PageHeader back={back} title="Face photos" description={`The camera recognizes ${student.data.firstName} using these photos. Add 2 or 3 clear, front-facing ones.`} />
            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader title="Add a face photo" description="Good light, face the camera, nobody else in view." />
                    <div className="p-5">
                        <FaceCapture onSave={save} saving={saving} saveLabel="Save face photo" />
                    </div>
                </Card>
                <Card>
                    <CardHeader title={`Saved photos${photos.data ? ` (${photos.data.length})` : ""}`} />
                    <div className="p-5">
                        {photos.loading ? <PageLoader /> : photos.data?.length ? (
                            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                {photos.data.map((photo) => (
                                    <li key={photo.id} className="group relative overflow-hidden rounded-lg ring-1 ring-slate-200">
                                        <Image src={photo.photoUrl} alt={`Face photo of ${fullName(student.data)}`} width={240} height={240} className="aspect-square w-full object-cover" />
                                        <div className="absolute right-1.5 top-1.5 rounded-lg bg-white/90 shadow-sm">
                                            <IconButton icon={HiOutlineTrash} tone="danger" label="Delete photo" onClick={() => remove(photo)} />
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="py-8 text-center text-sm text-slate-500">No face photos yet. Until you add one, the camera can&apos;t recognize this student.</p>
                        )}
                    </div>
                </Card>
            </div>
        </>
    );
};

export default withSuspense(FacePhotosPage);
