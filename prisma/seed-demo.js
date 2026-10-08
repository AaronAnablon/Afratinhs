// Creates (or resets) the demo accounts shown on the homepage, plus a sample
// section with a few class schedules so every role has something to look at.
// Usage: npm run seed:demo   (reads NEXT_PUBLIC_DEMO_* from .env.local or .env)
require("dotenv").config({ path: ".env.local" });
require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

const DEMO_SECTION = "Demo Section";
const DEMO_TEACHER_NAME = { firstName: "Demo", lastName: "Teacher" };

const getCredentials = (role) => {
    const email = process.env[`NEXT_PUBLIC_DEMO_${role}_EMAIL`];
    const password = process.env[`NEXT_PUBLIC_DEMO_${role}_PASSWORD`];
    if (!email || !password) {
        throw new Error(`Set NEXT_PUBLIC_DEMO_${role}_EMAIL and NEXT_PUBLIC_DEMO_${role}_PASSWORD in .env.local`);
    }
    return { email, password };
};

// People.email is not unique in the schema, so look it up first to avoid duplicates.
const upsertPerson = async ({ email, password, ...data }) => {
    const hashedPassword = await bcrypt.hash(password, 10);
    const existing = await prisma.people.findFirst({ where: { email } });
    if (existing) {
        return prisma.people.update({
            where: { id: existing.id },
            data: { ...data, password: hashedPassword },
        });
    }
    return prisma.people.create({
        data: { ...data, email, password: hashedPassword },
    });
};

const generateUniqueCode = async () => {
    let code;
    do {
        code = Math.floor(10000 + Math.random() * 90000);
    } while (await prisma.attendance.findFirst({ where: { code } }));
    return code;
};

// Same format the Add Schedule form stores, e.g. "Thursday, October 8, 2026".
const formatDate = (daysFromToday) => {
    const date = new Date();
    date.setDate(date.getDate() + daysFromToday);
    return date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
    });
};

const main = async () => {
    const admin = await upsertPerson({
        ...getCredentials("ADMIN"),
        firstName: "Demo",
        lastName: "Admin",
        role: 0,
    });

    const teacher = await upsertPerson({
        ...getCredentials("TEACHER"),
        ...DEMO_TEACHER_NAME,
        role: 1,
    });

    const student = await upsertPerson({
        ...getCredentials("STUDENT"),
        firstName: "Demo",
        lastName: "Student",
        homeAddress: "123 Sample Street",
        age: "16",
        contact: "09123456789",
        section: DEMO_SECTION,
        adviser: `${DEMO_TEACHER_NAME.firstName} ${DEMO_TEACHER_NAME.lastName}`,
        role: 2,
    });

    // Rebuild the demo schedule from scratch so it is fresh after each run.
    await prisma.attendance.deleteMany({
        where: { teacher: teacher.id, section: DEMO_SECTION },
    });

    const schedules = [
        { daysFromToday: -1, event: "Mathematics", present: true },
        { daysFromToday: 0, event: "Science", present: false },
        { daysFromToday: 1, event: "English", present: false },
    ];

    for (const schedule of schedules) {
        await prisma.attendance.create({
            data: {
                isOn: false,
                date: formatDate(schedule.daysFromToday),
                time: "8:00 AM - 9:00 AM",
                teacher: teacher.id,
                event: schedule.event,
                code: await generateUniqueCode(),
                section: DEMO_SECTION,
                students: [{
                    id: student.id,
                    status: "absent",
                    letterUrl: "",
                    letterPublicId: "",
                    ...(schedule.present && { statusIn: "present", statusOut: "present" }),
                }],
            },
        });
    }

    console.log("Demo data ready:");
    console.log(`  Admin    ${admin.email}`);
    console.log(`  Teacher  ${teacher.email}`);
    console.log(`  Student  ${student.email} (${DEMO_SECTION})`);
    console.log(`  ${schedules.length} schedules for ${DEMO_SECTION}`);
};

main()
    .catch((error) => {
        console.error(error.message);
        process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
