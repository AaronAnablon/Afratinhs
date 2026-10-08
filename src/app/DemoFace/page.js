"use client"

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
    HiOutlineArrowPath, HiOutlineCheckCircle, HiOutlineEyeSlash, HiOutlineInformationCircle,
    HiOutlineLockClosed, HiOutlineTrash, HiOutlineUser,
} from "react-icons/hi2";
import { descriptorDistance } from "@/app/faceUtil";
import { FaceCapture } from "@/components/face/FaceCapture";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Feedback";
import { PageLoader } from "@/components/ui/Spinner";
import { DEMO_FACE_PHOTOS, DEMO_FACE_SHOTS, DEMO_MODE, DEMO_VISITOR_TTL_HOURS } from "@/globalData/demoAccounts";
import { ROLE_HOME } from "@/globalData/roles";
import { api, errorMessage } from "@/utils/http";

// Photos further apart than this are probably not the same person.
const SAME_PERSON_DISTANCE = 0.6;

const PRIVACY = [
    { icon: HiOutlineEyeSlash, text: "Your photos never leave your browser. Only 128 numbers per photo that describe your face are saved." },
    { icon: HiOutlineLockClosed, text: "They're linked to this browser and only used in your demo. Other visitors never see or match them." },
    { icon: HiOutlineTrash, text: `They're deleted with the rest of your demo after ${DEMO_VISITOR_TTL_HOURS} hours, or right away when you click "Delete my face".` },
];

const TIPS = [
    "Good, even light on your face",
    "No sunglasses, mask or cap",
    "Only you in the picture",
    "Use the camera or upload photos",
];

const noShots = () => Array(DEMO_FACE_PHOTOS).fill(null);

export default function DemoFacePage() {
    const toast = useToast();
    const { data: session } = useSession();
    const router = useRouter();
    // { visitor, registered, photos, expiresAt } once loaded from the server
    const [faceStatus, setFaceStatus] = useState(null);
    const [consent, setConsent] = useState(false);
    // One { photo, descriptor } per DEMO_FACE_SHOTS prompt, null until taken
    const [shots, setShots] = useState(noShots);
    // Camera or upload, kept between photos
    const [captureMode, setCaptureMode] = useState("camera");
    const [registeringAgain, setRegisteringAgain] = useState(false);
    const [problem, setProblem] = useState("");
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const home = (session && ROLE_HOME[session.role]) || "/";

    useEffect(() => {
        if (!DEMO_MODE) return;
        api.get("/api/demoFace")
            .then((response) => setFaceStatus(response.data))
            .catch(() => toast.error("Couldn't check your demo face. Please reload the page."));
    }, [toast]);

    const setShot = (index, shot) => {
        setShots((current) => current.map((existing, i) => (i === index ? shot : existing)));
        setProblem("");
    };

    const register = async () => {
        const descriptors = shots.map((shot) => shot.descriptor);
        const mismatch = descriptors.some((a, i) => descriptors.slice(i + 1).some((b) => descriptorDistance(a, b) > SAME_PERSON_DISTANCE));
        if (mismatch) {
            setProblem("These photos don't look like the same person. Retake the ones that aren't you.");
            return;
        }
        setSaving(true);
        try {
            const response = await api.post("/api/demoFace", { faceDescriptors: descriptors, consent });
            setFaceStatus(response.data);
            setShots(noShots());
            setRegisteringAgain(false);
            toast.success("Your face is registered.");
        } catch (error) {
            toast.error(errorMessage(error));
            // The visitor expired while the page was open.
            if (error?.response?.status === 401) setFaceStatus({ visitor: false, registered: false, photos: 0 });
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

    const current = shots.findIndex((shot) => !shot);
    const showRegistered = faceStatus?.registered && !registeringAgain;

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
                    Before you can use the demo, register your face. When attendance is taken as the demo
                    Teacher, the camera recognizes you as Demo Student. Every new browser registers its own
                    face, whichever demo account it logs in with.
                </p>

                <div className="mt-5 rounded-xl bg-white p-4 ring-1 ring-inset ring-brand-200">
                    <p className="flex items-center gap-2 text-sm font-semibold text-brand-800">
                        <HiOutlineInformationCircle className="h-5 w-5" aria-hidden="true" /> Why {DEMO_FACE_PHOTOS} photos?
                    </p>
                    <p className="mt-1.5 text-sm text-slate-600">
                        You take {DEMO_FACE_PHOTOS} photos of your face from slightly different angles. The camera compares every face it
                        sees with all {DEMO_FACE_PHOTOS}, so attendance is checked more accurately, even when you aren&apos;t looking straight at it.
                    </p>
                    <ul className="mt-3 grid gap-x-4 gap-y-1 text-sm text-slate-600 sm:grid-cols-2">
                        {TIPS.map((tip) => (
                            <li key={tip} className="flex items-center gap-2">
                                <HiOutlineCheckCircle className="h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />{tip}
                            </li>
                        ))}
                    </ul>
                </div>

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
                    ) : !faceStatus.visitor ? (
                        <div>
                            <p className="font-semibold text-slate-900">Your demo hasn&apos;t started</p>
                            <p className="mt-1 text-sm text-slate-500">
                                Log in with a demo account first. This browser then gets its own copy of the demo data,
                                kept for {DEMO_VISITOR_TTL_HOURS} hours.
                            </p>
                            <div className="mt-5">
                                {session
                                    ? <Button onClick={() => router.push("/AuthenticateAccount")}>Start my demo</Button>
                                    : <Link href="/#demo" className="text-sm font-medium text-brand-700 hover:text-brand-800">Choose a demo account</Link>}
                            </div>
                        </div>
                    ) : showRegistered ? (
                        <div>
                            <p className="flex items-center gap-2 font-semibold text-brand-700">
                                <HiOutlineCheckCircle className="h-5 w-5" aria-hidden="true" /> Your face is registered ({faceStatus.photos} photos)
                            </p>
                            <p className="mt-1 text-sm text-slate-500">It will be deleted on {new Date(faceStatus.expiresAt).toLocaleString()}.</p>
                            <div className="mt-5 flex flex-wrap gap-2">
                                <Button onClick={() => router.push(home)}>Continue to the demo</Button>
                                <Button variant="secondary" icon={HiOutlineArrowPath} onClick={() => setRegisteringAgain(true)}>Register again</Button>
                                <Button variant="dangerGhost" icon={HiOutlineTrash} onClick={remove} loading={deleting}>Delete my face</Button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid gap-5">
                            {faceStatus.photos > 0 && !faceStatus.registered && (
                                <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                                    Your earlier registration only has {faceStatus.photos} {faceStatus.photos === 1 ? "photo" : "photos"}. Please take all {DEMO_FACE_PHOTOS} again.
                                </p>
                            )}
                            <label className="flex items-start gap-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700 ring-1 ring-inset ring-slate-200">
                                <input
                                    type="checkbox"
                                    checked={consent}
                                    onChange={(e) => setConsent(e.target.checked)}
                                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-700 focus:ring-brand-600"
                                />
                                <span>I agree to let this demo use my face data as described above.</span>
                            </label>

                            {consent && (
                                <>
                                    <ol className="grid grid-cols-3 gap-3" aria-label="Face photos">
                                        {DEMO_FACE_SHOTS.map((prompt, index) => {
                                            const shot = shots[index];
                                            return (
                                                <li key={prompt.title} className="min-w-0">
                                                    <div className={`relative aspect-square overflow-hidden rounded-lg ring-inset ${index === current ? "bg-brand-50 ring-2 ring-brand-600" : "bg-slate-100 ring-1 ring-slate-200"}`}>
                                                        {shot ? (
                                                            // eslint-disable-next-line @next/next/no-img-element -- local preview of a data URL
                                                            <img src={shot.photo} alt={`Photo ${index + 1}: ${prompt.title}`} className="h-full w-full object-cover" />
                                                        ) : (
                                                            <div className="flex h-full flex-col items-center justify-center gap-1 text-slate-400">
                                                                <HiOutlineUser className="h-8 w-8" aria-hidden="true" />
                                                                <span className="text-xs font-semibold">{index + 1}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <p className="mt-1.5 truncate text-xs font-medium text-slate-700">{index + 1}. {prompt.title}</p>
                                                    {shot && (
                                                        <button type="button" onClick={() => setShot(index, null)} className="text-xs font-medium text-brand-700 hover:text-brand-800">
                                                            Retake
                                                        </button>
                                                    )}
                                                </li>
                                            );
                                        })}
                                    </ol>

                                    {current >= 0 ? (
                                        <div className="grid gap-3">
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900">
                                                    Photo {current + 1} of {DEMO_FACE_PHOTOS}: {DEMO_FACE_SHOTS[current].title}
                                                </p>
                                                <p className="text-sm text-slate-500">{DEMO_FACE_SHOTS[current].tip}</p>
                                            </div>
                                            <FaceCapture
                                                key={current}
                                                initialMode={captureMode}
                                                onModeChange={setCaptureMode}
                                                onSave={(photo, descriptor) => setShot(current, { photo, descriptor })}
                                                saveLabel={`Use photo ${current + 1}`}
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex flex-wrap items-center gap-3">
                                            <Button onClick={register} loading={saving}>Register my face</Button>
                                            <p className="text-sm text-slate-500">All {DEMO_FACE_PHOTOS} photos are ready.</p>
                                        </div>
                                    )}
                                    {problem && <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">{problem}</p>}
                                </>
                            )}

                            {registeringAgain && (
                                <div>
                                    <Button variant="ghost" onClick={() => { setRegisteringAgain(false); setShots(noShots()); setProblem(""); }}>
                                        Keep my current face
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </Card>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
                    {session
                        ? <button type="button" onClick={() => signOut({ callbackUrl: "/" })} className="font-medium text-slate-500 hover:text-slate-800">Sign out</button>
                        : <Link href="/" className="font-medium text-slate-500 hover:text-slate-800">Back to homepage</Link>}
                    {faceStatus?.visitor && !faceStatus.registered && (
                        <p className="text-slate-500">You need to register your face to continue.</p>
                    )}
                </div>
            </div>
        </main>
    );
}
