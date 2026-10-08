"use client"

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import Webcam from "react-webcam";
import { HiOutlineVideoCamera } from "react-icons/hi2";

// Mirrored webcam with a canvas on top for drawing face boxes. Screenshots use
// the camera's full resolution, so detection boxes map 1:1 onto the canvas.
export const CameraView = forwardRef(function CameraView({ className = "" }, ref) {
    const webcamRef = useRef(null);
    const canvasRef = useRef(null);
    const [devices, setDevices] = useState([]);
    const [deviceId, setDeviceId] = useState();
    const [error, setError] = useState("");

    useImperativeHandle(ref, () => ({
        // Returns a data URL of the current frame, or null if the camera isn't ready.
        screenshot: () => {
            const video = webcamRef.current?.video;
            return video?.readyState === 4 ? webcamRef.current.getScreenshot() : null;
        },
        // Draws boxes for [{ box: {x, y, width, height}, label, matched }].
        draw: (boxes) => {
            const video = webcamRef.current?.video;
            const canvas = canvasRef.current;
            if (!video || !canvas) return;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext("2d");
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const scale = canvas.width / 640;
            for (const { box, label, matched } of boxes) {
                const color = matched ? "#22c55e" : "#f59e0b";
                ctx.lineWidth = 3 * scale;
                ctx.strokeStyle = color;
                ctx.strokeRect(box.x, box.y, box.width, box.height);
                if (label) {
                    ctx.font = `600 ${16 * scale}px Inter, system-ui, sans-serif`;
                    const width = ctx.measureText(label).width + 12 * scale;
                    const height = 24 * scale;
                    ctx.fillStyle = color;
                    ctx.fillRect(box.x - 1.5 * scale, box.y - height, width, height);
                    ctx.fillStyle = "#ffffff";
                    ctx.fillText(label, box.x + 5 * scale, box.y - 7 * scale);
                }
            }
        },
    }), []);

    useEffect(() => {
        navigator.mediaDevices?.enumerateDevices().then((list) => {
            setDevices(list.filter((device) => device.kind === "videoinput" && device.deviceId));
        });
    }, []);

    if (error) {
        return (
            <div className={`flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-xl bg-slate-900 p-6 text-center text-slate-200 ${className}`}>
                <HiOutlineVideoCamera className="h-8 w-8 text-slate-400" aria-hidden="true" />
                <p className="text-sm font-medium">Can&apos;t open the camera</p>
                <p className="max-w-xs text-xs text-slate-400">{error}</p>
            </div>
        );
    }

    return (
        <div className={className}>
            <div className="relative overflow-hidden rounded-xl bg-slate-900">
                <Webcam
                    ref={webcamRef}
                    audio={false}
                    mirrored
                    forceScreenshotSourceSize
                    screenshotFormat="image/jpeg"
                    videoConstraints={deviceId ? { deviceId: { exact: deviceId } } : { facingMode: "user", width: 640, height: 480 }}
                    onUserMediaError={() => setError("Allow camera access in your browser, or use a photo instead.")}
                    className="block h-auto w-full"
                />
                <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />
            </div>
            {devices.length > 1 && (
                <select
                    value={deviceId ?? ""}
                    onChange={(event) => setDeviceId(event.target.value || undefined)}
                    aria-label="Camera"
                    className="mt-2 block w-full rounded-lg border-0 py-1.5 pl-3 text-sm text-slate-700 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-brand-600"
                >
                    <option value="">Default camera</option>
                    {devices.map((device, index) => (
                        <option key={device.deviceId} value={device.deviceId}>{device.label || `Camera ${index + 1}`}</option>
                    ))}
                </select>
            )}
        </div>
    );
});
