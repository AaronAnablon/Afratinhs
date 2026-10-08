"use client"

import { useEffect, useRef } from "react";
import { getFullFaceDescription } from "@/app/faceUtil";
import { fullName } from "../ui/Avatar";
import { PageLoader } from "../ui/Spinner";
import { CameraView } from "./CameraView";
import { useFaceModels } from "./useFaceModels";

// Watches the camera and calls onRecognized(studentId) for every known face.
export const LiveRecognition = ({ faceMatcher, students, onRecognized }) => {
    const { ready, error } = useFaceModels();
    const cameraRef = useRef(null);
    const latest = useRef({ students, onRecognized });

    useEffect(() => {
        latest.current = { students, onRecognized };
    });

    useEffect(() => {
        if (!ready || !faceMatcher) return;
        let running = false;
        const timer = setInterval(async () => {
            const frame = cameraRef.current?.screenshot();
            if (running || !frame) return;
            running = true;
            try {
                const faces = await getFullFaceDescription(frame);
                const byId = new Map(latest.current.students.map((student) => [student.id, student]));
                const boxes = faces.map((face) => {
                    const match = faceMatcher.findBestMatch(face.descriptor);
                    const student = match.label !== "unknown" ? byId.get(match.label) : null;
                    if (student) latest.current.onRecognized(student.id);
                    return { box: face.detection.box, matched: Boolean(student), label: student ? fullName(student) : "Unknown" };
                });
                cameraRef.current?.draw(boxes);
            } finally {
                running = false;
            }
        }, 700);
        return () => clearInterval(timer);
    }, [ready, faceMatcher]);

    if (error) return <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>;
    if (!ready) return <PageLoader label="Loading face recognition..." />;
    return <CameraView ref={cameraRef} />;
};
