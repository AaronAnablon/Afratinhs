import * as faceapi from 'face-api.js';

const MODEL_URL = "/models";
let modelsPromise;

export const modelsLoaded = () =>
    !!faceapi.nets.ssdMobilenetv1.params &&
    !!faceapi.nets.faceLandmark68TinyNet.params &&
    !!faceapi.nets.faceRecognitionNet.params;

// Downloads the three face models once and shares the result.
export function ensureModelsLoaded() {
    modelsPromise ??= Promise.all([
        faceapi.loadSsdMobilenetv1Model(MODEL_URL),
        faceapi.loadFaceLandmarkTinyModel(MODEL_URL),
        faceapi.loadFaceRecognitionModel(MODEL_URL),
    ]).catch((error) => {
        modelsPromise = undefined;
        throw error;
    });
    return modelsPromise;
}

// Detects every face in an image (data URL) with its 128-number descriptor.
export async function getFullFaceDescription(imageSource) {
    const options = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.8 });
    const img = await faceapi.fetchImage(imageSource);
    return faceapi
        .detectAllFaces(img, options)
        .withFaceLandmarks(true)
        .withFaceDescriptors();
}

export const descriptorToString = (descriptor) => Array.from(descriptor).join(",");

const parseDescriptor = (text) => new Float32Array(String(text).match(/-?\d+(?:\.\d+)?(?:e-?\d+)?/gi).map(Number));

// Builds a matcher from [{ owner, faceDescriptor }]; labels are the owners' ids.
export function createMatcher(faces, maxDescriptorDistance = 0.45) {
    const byOwner = new Map();
    for (const face of faces) {
        if (!byOwner.has(face.owner)) byOwner.set(face.owner, []);
        byOwner.get(face.owner).push(parseDescriptor(face.faceDescriptor));
    }
    const labeled = [...byOwner].map(([owner, descriptors]) => new faceapi.LabeledFaceDescriptors(owner, descriptors));
    return labeled.length ? new faceapi.FaceMatcher(labeled, maxDescriptorDistance) : null;
}
