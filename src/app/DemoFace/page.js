"use client"

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { HiOutlineCheckCircle, HiOutlineEyeSlash, HiOutlineLockClosed, HiOutlineTrash } from "react-icons/hi2";
import { FaceCapture } from "@/components/face/FaceCapture";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Feedback";
import { PageLoader } from "@/components/ui/Spinner";
import { DEMO_FACE_TTL_HOURS, DEMO_MODE } from "@/globalData/demoAccounts";
import { api, errorMessage } from "@/utils/http";

const PRIVACY = [
    { icon: HiOutlineEyeSlash, text: "No photo is saved, only 128 numbers that describe your face." },
    { icon: HiOutlineLockClosed, text: "It's linked to this browser and only used in your demo. Other visitors never see or match it." },
    { icon: HiOutlineTrash, text: `It's deleted after ${DEMO_FACE_TTL_HOURS} hours, or right away when you click "Delete my face".` },
];

export default function DemoFacePage() {
    const toast = useToast();
    const { data: session } = useSession();
    const router = useRouter();
    // { registered, expiresAt } once loaded from the server
    const [faceStatus, setFaceStatus] = useState(null);
    const [consent, setConsent] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (!DEMO_MODE) return;
        api.get("/api/demoFace")
            .then((response) => setFaceStatus(response.data))
            .catch(() => toast.error("Couldn't check your demo face. Please reload the page."));
    }, [toast]);

    const save = async (photo, descriptor) => {
        setSaving(true);
        try {
            const response = await api.post("/api/demoFace", { faceDescriptor: descriptor, consent });
            setFaceStatus(response.data);
            toast.success("Your face is registered.");
        } catch (error) {
            toast.error(errorMessage(error));
        }
        setSaving(false);
    };

    const remove = async () => {
        setDeleting(true);
        try {
            const response = await api.delete("/api/demoFace");
            setFaceStatus(response.data);
            setConsent(false);
            toast.success("Your face was deleted.");
        } catch (error) {
            toast.error(errorMessage(error));
        }
        setDeleting(false);
    };

    if (!DEMO_MODE) {
        return (
            <main className="grid min-h-screen place-items-center px-4 text-center">
                <p className="text-slate-600">The demo is turned off. <Link href="/" className="font-medium text-brand-700">Back to homepage</Link></p>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gradient-to-b from-brand-50 to-slate-50 px-4 py-10">
            <div className="mx-auto max-w-2xl">
                <div className="flex items-center gap-3">
                    <Image height={44} width={44} src={"/logo.png"} alt="" />
                    <div>
                        <p className="text-sm font-semibold text-brand-800">AFRATINHS demo</p>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Register your face</h1>
                    </div>
                </div>
                <p className="mt-4 text-slate-600">
                    To try face recognition, the demo needs your face. When you take attendance as the demo
                    Teacher, the camera will recognize you as Demo Student.
                </p>
                <ul className="mt-4 grid gap-2">
                    {PRIVACY.map(({ icon: Icon, text }) => (
                        <li key={text} className="flex items-start gap-2.5 text-sm text-slate-600">
                            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" aria-hidden="true" />
                            {text}
                        </li>
                    ))}
                </ul>

                <Card className="mt-6 p-5 sm:p-6">
                    {!faceStatus ? (
                        <PageLoader />
                    ) : faceStatus.registered ? (
                        <div>
                            <p className="flex items-center gap-2 font-semibold text-brand-700">
                                <HiOutlineCheckCircle className="h-5 w-5" aria-hidden="true" /> Your face is registered
                            </p>
                            <p className="mt-1 text-sm text-slate-500">It will be deleted on {new Date(faceStatus.expiresAt).toLocaleString()}.</p>
                            <div className="mt-5 flex flex-wrap gap-2">
                                <Button onClick={() => router.push(session ? "/AuthenticateAccount" : "/")}>Continue to the demo</Button>
                                <Button variant="dangerGhost" icon={HiOutlineTrash} onClick={remove} loading={deleting}>Delete my face</Button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid gap-5">
                            <label className="flex items-start gap-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700 ring-1 ring-inset ring-slate-200">
                                <input
                                    type="checkbox"
                                    checked={consent}
                                    onChange={(e) => setConsent(e.target.checked)}
                                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-700 focus:ring-brand-600"
                                />
                                <span>I agree to let this demo use my face data as described above.</span>
                            </label>
                            {consent && <FaceCapture onSave={save} saving={saving} saveLabel="Register my face" />}
                        </div>
                    )}
                </Card>

                <div className="mt-6 text-sm">
                    {session
                        ? <button type="button" onClick={() => signOut({ callbackUrl: "/" })} className="font-medium text-slate-500 hover:text-slate-800">Sign out</button>
                        : <Link href="/" className="font-medium text-slate-500 hover:text-slate-800">Back to homepage</Link>}
                </div>
            </div>
        </main>
    );
}
