"use client"

import { useEffect, useRef, useState } from "react";
import { HiOutlineArrowPath, HiOutlineArrowUpTray, HiOutlineCamera, HiOutlineCheckCircle, HiOutlineExclamationTriangle } from "react-icons/hi2";
import { descriptorToString, getFullFaceDescription } from "@/app/faceUtil";
import { readImageFile } from "../ProfilePhotoDialog";
import { Button } from "../ui/Button";
import { Segmented } from "../ui/Field";
import { PageLoader } from "../ui/Spinner";
import { CameraView } from "./CameraView";
import { useFaceModels } from "./useFaceModels";

const faceHint = (count) => {
    if (count === null) return { ok: false, text: "Looking for a face..." };
    if (count === 0) return { ok: false, text: "No face found. Face the camera in good light." };
    if (count > 1) return { ok: false, text: "More than one face. Make sure only one person is in view." };
    return { ok: true, text: "Face detected. You can take the photo." };
};

// Takes one face from the webcam or an uploaded photo and hands back
// onSave(photoDataUrl, descriptorText). Requires exactly one face.
export const FaceCapture = ({ onSave, saving = false, saveLabel = "Save face" }) => {
    const { ready, error } = useFaceModels();
    const cameraRef = useRef(null);
    const [mode, setMode] = useState("camera");
    const [liveCount, setLiveCount] = useState(null);
    const [captured, setCaptured] = useState(null);
    const [problem, setProblem] = useState("");
    const [busy, setBusy] = useState(false);

    // Live face check while the camera is showing.
    useEffect(() => {
        if (!ready || mode !== "camera" || captured) return;
        let running = false;
        const timer = setInterval(async () => {
            const frame = cameraRef.current?.screenshot();
            if (running || !frame) return;
            running = true;
            try {
                const faces = await getFullFaceDescription(frame);
                setLiveCount(faces.length);
                cameraRef.current?.draw(faces.map((face) => ({ box: face.detection.box, matched: faces.length === 1 })));
            } finally {
                running = false;
            }
        }, 600);
        return () => clearInterval(timer);
    }, [ready, mode, captured]);

    const detectSingle = async (photo) => {
        const faces = await getFullFaceDescription(photo);
        if (faces.length !== 1) {
            setProblem(faces.length === 0 ? "No face found in that picture." : "That picture has more than one face.");
            return;
        }
        setProblem("");
        setCaptured({ photo, descriptor: descriptorToString(faces[0].descriptor) });
    };

    const takePhoto = async () => {
        const frame = cameraRef.current?.screenshot();
        if (!frame) return;
        setBusy(true);
        await detectSingle(frame);
        setBusy(false);
    };

    const choose = async (event) => {
        setBusy(true);
        try {
            await detectSingle(await readImageFile(event.target.files[0]));
        } catch (readError) {
            setProblem(readError.message);
        }
        setBusy(false);
        event.target.value = "";
    };

    const switchMode = (value) => {
        setMode(value);
        setCaptured(null);
        setProblem("");
        setLiveCount(null);
    };

    if (error) return <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>;
    if (!ready) return <PageLoader label="Loading face recognition. The first time can take a few seconds..." />;

    const hint = faceHint(liveCount);

    return (
        <div className="grid gap-4">
            <Segmented
                value={mode}
                onChange={switchMode}
                options={[{ value: "camera", label: "Use camera" }, { value: "upload", label: "Upload a photo" }]}
            />

            {captured ? (
                <div className="grid gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element -- local preview of a data URL */}
                    <img src={captured.photo} alt="Captured face" className="w-full rounded-xl object-cover" />
                    <p className="flex items-center gap-2 text-sm text-brand-700">
                        <HiOutlineCheckCircle className="h-5 w-5" aria-hidden="true" /> One face found.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        <Button onClick={() => onSave(captured.photo, captured.descriptor)} loading={saving}>{saveLabel}</Button>
                        <Button variant="secondary" icon={HiOutlineArrowPath} onClick={() => setCaptured(null)} disabled={saving}>
                            {mode === "camera" ? "Retake" : "Choose another"}
                        </Button>
                    </div>
                </div>
            ) : mode === "camera" ? (
                <div className="grid gap-3">
                    <CameraView ref={cameraRef} />
                    <p className={`flex items-center gap-2 text-sm ${hint.ok ? "text-brand-700" : "text-slate-500"}`} aria-live="polite">
                        {hint.ok
                            ? <HiOutlineCheckCircle className="h-5 w-5" aria-hidden="true" />
                            : <HiOutlineExclamationTriangle className="h-5 w-5 text-amber-500" aria-hidden="true" />}
                        {hint.text}
                    </p>
                    <div>
                        <Button icon={HiOutlineCamera} onClick={takePhoto} loading={busy} disabled={!hint.ok}>Take photo</Button>
                    </div>
                </div>
            ) : (
                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center hover:border-brand-400 hover:bg-brand-50/40">
                    <HiOutlineArrowUpTray className="h-7 w-7 text-slate-400" aria-hidden="true" />
                    <span className="text-sm font-medium text-slate-700">{busy ? "Checking the photo..." : "Choose a clear, front-facing photo"}</span>
                    <span className="text-xs text-slate-500">JPG, PNG or WebP, one face only</span>
                    <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={choose} disabled={busy} />
                </label>
            )}

            {problem && <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">{problem}</p>}
        </div>
    );
};
