"use client"

import { useEffect, useState } from "react";
import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
    isFaceDetectionModelLoaded,
    isFacialLandmarkDetectionModelLoaded,
    isFeatureExtractionModelLoaded,
    loadModels,
} from "@/app/faceUtil";
import { UPLOAD_OPTION } from "@/globalData";
import { DEMO_FACE_TTL_HOURS, DEMO_MODE } from "@/globalData/demoAccounts";
import { url } from "@/utils/api";
import ModelLoadStatus from "@/utils/ModelLoadStatus";
import ModelLoading from "@/utils/ModelLoading";
import { LoadingSpin } from "@/utils/LoadingSpin";
import useMessageHook from "@/utils/MessageHook";
import { UploadFromDisk } from "@/components/Student/UploadFromDisk";
import { UploadFromWebcam } from "@/components/Student/UploadFromWebCam";

// Demo visitors never upload a photo, only the face descriptor.
const ignorePhoto = () => { }

const Page = () => {
    const { showMessage, Message } = useMessageHook();
    const { data: session } = useSession();
    const router = useRouter();
    // { registered, expiresAt } once loaded from the server
    const [faceStatus, setFaceStatus] = useState(null)
    const [consent, setConsent] = useState(false)
    const [isAllModelLoaded, setIsAllModelLoaded] = useState(false)
    const [loadingMessage, setLoadingMessage] = useState("")
    const [loadingMessageError, setLoadingMessageError] = useState("")
    const [selectedUploadOption, setSelectedUploadOption] = useState("From Webcam")
    const [faceDesc, setFaceDesc] = useState()
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)

    const modelsReady = isAllModelLoaded ||
        (isFaceDetectionModelLoaded() && isFacialLandmarkDetectionModelLoaded() && isFeatureExtractionModelLoaded())

    useEffect(() => {
        if (!DEMO_MODE) return;
        axios.get("/api/demoFace")
            .then((response) => setFaceStatus(response.data))
            .catch(() => showMessage("Something went wrong! Please try again."))
    }, [showMessage])

    // The face models are several MB, so only download them after consent.
    useEffect(() => {
        if (!consent || modelsReady) return;
        loadModels(setLoadingMessage, setLoadingMessageError).then(() => setIsAllModelLoaded(true))
    }, [consent, modelsReady])

    const handleSaveFace = async () => {
        if (!faceDesc || faceDesc.length !== 128) {
            showMessage("Make sure exactly one face is visible, then try again.")
            return;
        }
        setSaving(true)
        try {
            const response = await axios.post("/api/demoFace", { faceDescriptor: Array.from(faceDesc).join(","), consent });
            setFaceStatus(response.data)
        } catch (error) {
            console.error(error)
            showMessage("Something went wrong while saving your face. Please try again.")
        }
        setSaving(false)
    }

    const handleDeleteFace = async () => {
        setDeleting(true)
        try {
            const response = await axios.delete("/api/demoFace");
            setFaceStatus(response.data)
            setConsent(false)
        } catch (error) {
            console.error(error)
            showMessage("Something went wrong while deleting your face. Please try again.")
        }
        setDeleting(false)
    }

    if (!DEMO_MODE) {
        return (
            <main className="min-h-screen grid place-items-center text-green-700">
                <p>The demo is turned off. <Link href="/" className="text-blue-700">Back to homepage</Link></p>
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-white text-gray-800">
            <Message />
            <div className="max-w-3xl mx-auto px-4 py-10">
                <div className="flex items-center gap-3 text-green-700">
                    <Image height={40} width={40} src={"/logo.png"} alt="logo" />
                    <h1 className="text-2xl md:text-3xl font-bold">Register your face</h1>
                </div>
                <p className="mt-4 text-gray-600">
                    To try face recognition, the demo needs your face. When you record attendance as the
                    demo Teacher, the camera will recognize you as Demo Student.
                </p>
                <ul className="mt-4 text-sm text-gray-600 list-disc pl-5 grid gap-1">
                    <li>No photo is saved, only 128 numbers that describe your face.</li>
                    <li>It is linked to this browser and only used in your demo. Other visitors never see or match it.</li>
                    <li>It is deleted automatically after {DEMO_FACE_TTL_HOURS} hours, or right away when you click &quot;Delete my face&quot;.</li>
                </ul>

                {!faceStatus ? (
                    <div className="mt-8 w-10 h-10"><LoadingSpin loading={true} /></div>
                ) : faceStatus.registered ? (
                    <div className="mt-8 rounded-xl border border-green-700/30 p-6">
                        <p className="font-semibold text-green-700">Your face is registered.</p>
                        <p className="mt-1 text-sm text-gray-600">
                            It will be deleted on {new Date(faceStatus.expiresAt).toLocaleString()}.
                        </p>
                        <div className="mt-4 flex flex-wrap gap-3">
                            <button
                                onClick={() => router.push(session ? "/AuthenticateAccount" : "/")}
                                className="bg-green-700 text-white px-5 py-2 rounded-full hover:bg-green-600">
                                Continue to the demo
                            </button>
                            <button
                                onClick={handleDeleteFace}
                                disabled={deleting}
                                className="border border-red-700 text-red-700 px-5 py-2 rounded-full hover:bg-red-50">
                                {deleting ? "Deleting..." : "Delete my face"}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="mt-8 grid gap-6">
                        <label className="flex items-start gap-3 text-sm">
                            <input
                                type="checkbox"
                                checked={consent}
                                onChange={(e) => setConsent(e.target.checked)}
                                className="mt-1"
                            />
                            <span>I agree to let this demo use my face data as described above.</span>
                        </label>
                        {consent && (!modelsReady ? (
                            <div className="bg-white p-4 rounded-md text-green-700">
                                <ModelLoading loadingMessage={loadingMessage} />
                                <ModelLoadStatus errorMessage={loadingMessageError} />
                            </div>
                        ) : loadingMessageError ? (
                            <div className="text-red-700">{loadingMessageError}</div>
                        ) : (
                            <div className="grid gap-4 text-green-700">
                                <div className="flex gap-4 items-center">
                                    <label>Upload Image Option:</label>
                                    <select
                                        value={selectedUploadOption}
                                        className="border-green-700 rounded-lg border-2"
                                        onChange={(e) => setSelectedUploadOption(e.target.value)}
                                    >
                                        {UPLOAD_OPTION.map((option) => (
                                            <option key={option} value={option}>{option}</option>
                                        ))}
                                    </select>
                                </div>
                                {selectedUploadOption === "From Webcam" ? (
                                    <UploadFromWebcam
                                        setFacePhoto={ignorePhoto}
                                        setFaceDesc={setFaceDesc}
                                        handleUploadFacePhoto={handleSaveFace}
                                        loading={saving}
                                        handleSelectUploadOption={setSelectedUploadOption}
                                    />
                                ) : (
                                    <UploadFromDisk
                                        setFacePhoto={ignorePhoto}
                                        setFaceDesc={setFaceDesc}
                                        handleUploadFacePhoto={handleSaveFace}
                                        loading={saving}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                )}

                <div className="mt-10 text-sm">
                    {session ?
                        <button onClick={() => signOut({ callbackUrl: `${url}/` })} className="text-blue-700">Sign out</button> :
                        <Link href="/" className="text-blue-700">Back to homepage</Link>}
                </div>
            </div>
        </main>
    );
}

export default Page;
