// Demo logins shown on the homepage. `npm run seed:demo` creates these same
// accounts from accounts.json, so change the credentials there only.
import accounts from "./accounts.json";

// Set NEXT_PUBLIC_DEMO_MODE=false on a deployment with real school data to turn the demo off.
export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE !== "false";

// Each visitor (browser) gets their own copy of the demo data and registers
// their own face. Both are deleted after this many hours, when the visitor
// cookie also expires; the next login then starts over as a new visitor.
export const DEMO_VISITOR_TTL_HOURS = 24;

// Visitors register their face with one photo per prompt. Several slightly
// different angles let the camera recognize them more accurately.
export const DEMO_FACE_SHOTS = [
    { title: "Look straight", tip: "Face the camera directly." },
    { title: "Turn a little left", tip: "Turn your head slightly to your left." },
    { title: "Turn a little right", tip: "Turn your head slightly to your right." },
];
export const DEMO_FACE_PHOTOS = DEMO_FACE_SHOTS.length;

// Length of the class every visitor gets when they log in. Keep in sync with
// LIVE_CLASS_MINUTES in utils/demoSeed.js, which creates it.
export const DEMO_LIVE_CLASS_MINUTES = 20;

export const DEMO_ACCOUNTS = DEMO_MODE ? [
    {
        role: "Admin",
        ...accounts.admin,
        description: "Browse the premade teachers, class schedules, sections and students, and see each student's attendance.",
    },
    {
        role: "Teacher",
        ...accounts.teacher,
        description: "Open the class that starts when you log in and take attendance with the webcam. You're recognized as Demo Student.",
    },
    {
        role: "Student",
        ...accounts.student,
        description: "See your class schedule and attendance record, and upload an excuse letter for the class you missed.",
    },
] : [];

export const DEMO_EMAILS = DEMO_ACCOUNTS.map((account) => account.email);

export const isDemoEmail = (email) => DEMO_EMAILS.includes(email);
