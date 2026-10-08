// Creates (or resets) the demo accounts shown on the homepage, plus a sample
// section with a few class schedules so every role has something to look at.
// Used by `npm run seed:demo` and the nightly /api/demo/reset job, so it is
// CommonJS to load in both plain Node and Next.js.
const bcrypt = require("bcrypt");
const accounts = require("../globalData/demoAccounts/accounts.json");

const DEMO_SECTION = "Demo Section";
const DEMO_TEACHER_NAME = { firstName: "Demo", lastName: "Teacher" };

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

const resetDemoData = async (prisma) => {
    const demoEmails = Object.values(accounts).map((account) => account.email);

    // People.email is not unique in the schema, so look it up first to avoid duplicates.
    const upsertPerson = async ({ email, password, ...data }) => {
        const hashedPassword = await bcrypt.hash(password, 10);
        const existing = await prisma.people.findFirst({ where: { email } });
        if (existing) {
            return prisma.people.update({
                where: { id: existing.id },
                data: { ...data, password: hashedPassword, isDemo: true },
            });
        }
        return prisma.people.create({
            data: { ...data, email, password: hashedPassword, isDemo: true },
        });
    };

    // Remove everything demo visitors created, keeping only the demo accounts.
    await prisma.facephotos.deleteMany({ where: { isDemo: true } });
    await prisma.people.deleteMany({ where: { isDemo: true, email: { notIn: demoEmails } } });

    const generateUniqueCode = async () => {
        let code;
        do {
            code = Math.floor(10000 + Math.random() * 90000);
        } while (await prisma.attendance.findFirst({ where: { code } }));
        return code;
    };

    const admin = await upsertPerson({
        ...accounts.admin,
        firstName: "Demo",
        lastName: "Admin",
        role: 0,
    });

    const teacher = await upsertPerson({
        ...accounts.teacher,
        ...DEMO_TEACHER_NAME,
        role: 1,
    });

    const student = await upsertPerson({
        ...accounts.student,
        firstName: "Demo",
        lastName: "Student",
        homeAddress: "123 Sample Street",
        age: "16",
        contact: "09123456789",
        section: DEMO_SECTION,
        adviser: `${DEMO_TEACHER_NAME.firstName} ${DEMO_TEACHER_NAME.lastName}`,
        role: 2,
    });

    // Rebuild the demo classes from scratch. Older demo classes may not have
    // the isDemo flag yet, so also match the demo teacher's classes.
    await prisma.attendance.deleteMany({ where: { OR: [{ isDemo: true }, { teacher: teacher.id }] } });

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
                isDemo: true,
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

    return { admin, teacher, student, section: DEMO_SECTION, scheduleCount: schedules.length };
};

module.exports = { resetDemoData };
