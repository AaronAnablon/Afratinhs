// Demo logins shown on the homepage. `npm run seed:demo` creates these same
// accounts from accounts.json, so change the credentials there only.
import accounts from "./accounts.json";

export const DEMO_ACCOUNTS = [
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
];
