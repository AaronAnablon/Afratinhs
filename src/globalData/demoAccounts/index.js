// Demo logins shown on the homepage. `npm run seed:demo` creates these same
// accounts from accounts.json, so change the credentials there only.
import accounts from "./accounts.json";

// Set NEXT_PUBLIC_DEMO_MODE=false on a deployment with real school data to turn the demo off.
export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE !== "false";

// Visitors' registered faces are deleted after this many hours.
export const DEMO_FACE_TTL_HOURS = 24;

export const DEMO_ACCOUNTS = DEMO_MODE ? [
    {
        role: "Admin",
        ...accounts.admin,
        description: "Manage teacher accounts, class schedules, sections, students and their face photos.",
    },
    {
        role: "Teacher",
        ...accounts.teacher,
        description: "Open a class schedule and take attendance with the webcam, or review attendance per section.",
    },
    {
        role: "Student",
        ...accounts.student,
        description: "See your class schedule and attendance record, and upload an excuse letter for an absence.",
    },
] : [];

export const isDemoEmail = (email) => DEMO_ACCOUNTS.some((account) => account.email === email);
