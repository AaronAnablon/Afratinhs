// Demo logins shown on the homepage, read from the NEXT_PUBLIC_DEMO_* env vars.
// A role is hidden when its email or password is not set.
// Create the accounts in the database with `npm run seed:demo`.
export const DEMO_ACCOUNTS = [
    {
        role: "Admin",
        email: process.env.NEXT_PUBLIC_DEMO_ADMIN_EMAIL,
        password: process.env.NEXT_PUBLIC_DEMO_ADMIN_PASSWORD,
        description: "Manage teacher accounts, class schedules, sections, students and their face photos.",
    },
    {
        role: "Teacher",
        email: process.env.NEXT_PUBLIC_DEMO_TEACHER_EMAIL,
        password: process.env.NEXT_PUBLIC_DEMO_TEACHER_PASSWORD,
        description: "Open a class schedule and take attendance with the webcam, or review attendance per section.",
    },
    {
        role: "Student",
        email: process.env.NEXT_PUBLIC_DEMO_STUDENT_EMAIL,
        password: process.env.NEXT_PUBLIC_DEMO_STUDENT_PASSWORD,
        description: "See your class schedule and attendance record, and upload an excuse letter for an absence.",
    },
].filter((account) => account.email && account.password);
