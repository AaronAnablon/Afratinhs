"use client"

import { useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { HiOutlineCheckCircle, HiOutlineFaceSmile, HiOutlineTrash } from "react-icons/hi2";
import { useCurrentUser } from "@/components/AppShell";
import { FaceCapture } from "@/components/face/FaceCapture";
import { fullName } from "@/components/ui/Avatar";
import { ButtonLink, IconButton } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { useConfirm, useToast } from "@/components/ui/Feedback";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageLoader } from "@/components/ui/Spinner";
import { DEMO_FACE_PHOTOS, isDemoEmail } from "@/globalData/demoAccounts";
import { api, errorMessage, useFetch } from "@/utils/http";
import { withSuspense } from "@/utils/withSuspense";

const FacePhotosPage = () => {
    const toast = useToast();
    const confirm = useConfirm();
    const { isDemo } = useCurrentUser();
    const studentId = useSearchParams().get("id");
    const student = useFetch(studentId ? `/api/people/${studentId}` : null);
    const isDemoStudent = isDemoEmail(student.data?.email);
    const photos = useFetch(student.data && !isDemo ? `/api/facePhotos/${studentId}` : null);
    const demoFace = useFetch(isDemo && isDemoStudent ? "/api/demoFace" : null);
    const [saving, setSaving] = useState(false);

    if (student.error) return <ErrorState message={student.error} onRetry={student.reload} />;
    if (student.loading) return <PageLoader />;

    const back = { href: `/Admin/Sections/Students/StudentAttendance?id=${studentId}`, label: fullName(student.data) };

    // Demo data is shared by every visitor, so the photo uploader is hidden in the
    // demo. Each visitor registers their own face for Demo Student instead.
    if (isDemo) {
        return (
            <>
                <PageHeader back={back} title="Face photos" description={fullName(student.data)} />
                {isDemoStudent ? (
                    <Card className="max-w-2xl">
                        <CardHeader title="Demo Student's face is your own" description="Each visitor registers their own face, so no two visitors share one." />
                        <div className="grid gap-4 p-5">
                            <p className="text-sm text-slate-600">
                                You take {DEMO_FACE_PHOTOS} photos of your face from slightly different angles. The camera compares every
                                face it sees with all {DEMO_FACE_PHOTOS}, so attendance is checked more accurately.
                            </p>
                            {demoFace.loading ? <PageLoader /> : demoFace.data?.registered ? (
                                <p className="flex items-center gap-2 text-sm font-medium text-brand-700">
                                    <HiOutlineCheckCircle className="h-5 w-5" aria-hidden="true" />
                                    Registered with {demoFace.data.photos} photos. Deleted on {new Date(demoFace.data.expiresAt).toLocaleString()}.
                                </p>
                            ) : (
                                <p className="text-sm font-medium text-amber-700">Not registered yet. Until you do, the camera can&apos;t recognize Demo Student.</p>
                            )}
                            <div>
                                <ButtonLink href="/DemoFace">{demoFace.data?.registered ? "Update your face" : "Register your face"}</ButtonLink>
                            </div>
                        </div>
                    </Card>
                ) : (
                    <EmptyState
                        icon={HiOutlineFaceSmile}
                        title="Sample students have no face photos"
                        description={`Demo data is shared by every visitor, so face photos are turned off for other students. Register your own face with ${DEMO_FACE_PHOTOS} photos and the camera recognizes you as Demo Student.`}
                        action={<ButtonLink href="/DemoFace">Register your face</ButtonLink>}
                    />
                )}
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
            <PageHeader back={back} title="Face photos" description={`The camera recognizes ${student.data.firstName} using these photos. Add 3 clear ones from slightly different angles for the most accurate attendance.`} />
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
