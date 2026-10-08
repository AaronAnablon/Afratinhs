// Premade data for the public demo. The three demo accounts shown on the
// homepage are shared, and every demo visitor (browser, see utils/demoVisitor)
// gets their own copy of sample teachers, sections, students and a week of
// classes with attendance, so visitors never see each other's changes. Also
// creates the 20-minute class each visitor gets when they log in.
// Used by `npm run seed:demo`, the nightly /api/demo/reset job and demo logins,
// so it is CommonJS to load in both plain Node and Next.js.
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const accounts = require("../globalData/demoAccounts/accounts.json");

// Role numbers from src/globalData/roles.
const ADMIN = 0;
const TEACHER = 1;
const STUDENT = 2;

// Used when the visitor's own time zone is unknown.
const DEMO_TIME_ZONE = process.env.DEMO_TIME_ZONE || "Asia/Manila";
const LIVE_CLASS_MINUTES = 20;
const DAY_MS = 24 * 60 * 60 * 1000;

// Demo Teacher is the shared demo account; the others are sample teachers nobody can log in as.
const TEACHERS = {
    demo: { firstName: "Demo", lastName: "Teacher", email: accounts.teacher.email },
    english: { firstName: "Maria", lastName: "Santos", email: "maria.santos@example.com" },
    math: { firstName: "Jose", lastName: "Reyes", email: "jose.reyes@example.com" },
};

// Demo Student is in the first section, together with its sample students.
const SECTIONS = [
    {
        name: "Grade 10 - Rizal",
        adviser: "demo",
        age: 16,
        students: [["Juan", "Dela Cruz"], ["Andrea", "Bautista"], ["Miguel", "Garcia"], ["Sofia", "Mendoza"], ["Carlo", "Villanueva"], ["Bea", "Ramos"], ["Paolo", "Castillo"]],
    },
    {
        name: "Grade 9 - Mabini",
        adviser: "english",
        age: 15,
        students: [["Liza", "Aquino"], ["Mark", "Torres"], ["Jasmine", "Flores"], ["Kevin", "Navarro"], ["Angela", "Cruz"], ["Rafael", "Domingo"]],
    },
    {
        name: "Grade 8 - Luna",
        adviser: "math",
        age: 14,
        students: [["Nicole", "Pascual"], ["Joshua", "Santiago"], ["Kristine", "Morales"], ["Daniel", "Lopez"], ["Patricia", "Gonzales"], ["Gabriel", "Rivera"]],
    },
];
const DEMO_SECTION = SECTIONS[0].name;

const BARANGAYS = ["Talangan", "Bucal", "Lazaan", "Sabang", "Malaya", "Abo", "Maravilla", "Poblacion I"];

// The same timetable runs every day, weekends too, so "today" always has classes.
const TIMETABLE = [
    { teacher: "demo", event: "Science 10", section: "Grade 10 - Rizal", time: "8:00 AM - 9:00 AM" },
    { teacher: "english", event: "English 10", section: "Grade 10 - Rizal", time: "9:00 AM - 10:00 AM" },
    { teacher: "math", event: "Mathematics 10", section: "Grade 10 - Rizal", time: "1:00 PM - 2:00 PM" },
    { teacher: "math", event: "Mathematics 9", section: "Grade 9 - Mabini", time: "8:00 AM - 9:00 AM" },
    { teacher: "demo", event: "Science 9", section: "Grade 9 - Mabini", time: "10:00 AM - 11:00 AM" },
    { teacher: "english", event: "English 9", section: "Grade 9 - Mabini", time: "1:00 PM - 2:00 PM" },
    { teacher: "english", event: "English 8", section: "Grade 8 - Luna", time: "10:00 AM - 11:00 AM" },
    { teacher: "demo", event: "Science 8", section: "Grade 8 - Luna", time: "1:00 PM - 2:00 PM" },
    { teacher: "math", event: "Mathematics 8", section: "Grade 8 - Luna", time: "2:00 PM - 3:00 PM" },
];
const DAYS = [-3, -2, -1, 0, 1, 2, 3];

// Demo Student missed this class, so visitors can try uploading an excuse letter.
const MISSED_CLASS = { day: -1, event: "Mathematics 10" };

const demoEmails = () => Object.values(accounts).map((account) => account.email);
const studentEmail = ([firstName, lastName]) => `${firstName}.${lastName}`.toLowerCase().replace(/\s+/g, "") + "@example.com";
const newStudentEntry = (id) => ({ id, status: "absent", letterUrl: "", letterPublicId: "" });
const fullName = (person) => `${person.firstName} ${person.lastName}`;

const validTimeZone = (timeZone) => {
    if (typeof timeZone !== "string" || !timeZone) return DEMO_TIME_ZONE;
    try {
        new Intl.DateTimeFormat("en-US", { timeZone });
        return timeZone;
    } catch {
        return DEMO_TIME_ZONE;
    }
};

// Date and time parts of `date` as seen in `timeZone`.
const zonedParts = (date, timeZone) => Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
        timeZone,
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hourCycle: "h23",
    }).formatToParts(date).map(({ type, value }) => [type, value]),
);

// Same formats the Add Schedule form stores: "Thursday, October 8, 2026" and "1:05 PM".
const classDate = (date, timeZone) => {
    const { weekday, month, day, year } = zonedParts(date, timeZone);
    return `${weekday}, ${month} ${day}, ${year}`;
};

const clockTime = (date, timeZone) => {
    const { hour, minute } = zonedParts(date, timeZone);
    const hours = Number(hour) % 24;
    return `${hours % 12 || 12}:${minute} ${hours >= 12 ? "PM" : "AM"}`;
};

// Seeded random numbers, so every visitor's sample attendance looks the same.
const seededRandom = (seed) => () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// Five-digit codes teachers use to copy attendance between classes, unique in the database.
const uniqueCodes = async (prisma, count) => {
    const codes = new Set();
    while (codes.size < count) {
        const candidates = new Set();
        while (candidates.size < count - codes.size) {
            const code = Math.floor(10000 + Math.random() * 90000);
            if (!codes.has(code)) candidates.add(code);
        }
        const taken = await prisma.attendance.findMany({ where: { code: { in: [...candidates] } }, select: { code: true } });
        const takenCodes = new Set(taken.map((record) => record.code));
        candidates.forEach((code) => !takenCodes.has(code) && codes.add(code));
    }
    return [...codes];
};

// Sample people share a random password nobody knows, so they can't log in.
let lockedPassword = null;
const getLockedPassword = () => (lockedPassword ??= bcrypt.hash(crypto.randomBytes(32).toString("hex"), 10));

// People.email is not unique in the schema, so look it up first to avoid duplicates.
const upsertAccount = async (prisma, { email, password, ...data }) => {
    const hashedPassword = await bcrypt.hash(password, 10);
    const existing = await prisma.people.findFirst({ where: { email, demoVisitorId: { isSet: false } } });
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

// The three shared demo accounts.
const upsertAccounts = async (prisma) => ({
    admin: await upsertAccount(prisma, { ...accounts.admin, firstName: "Demo", lastName: "Admin", role: ADMIN }),
    teacher: await upsertAccount(prisma, { ...accounts.teacher, ...TEACHERS.demo, role: TEACHER }),
    student: await upsertAccount(prisma, {
        ...accounts.student,
        firstName: "Demo",
        lastName: "Student",
        homeAddress: "Talangan, Nagcarlan, Laguna",
        age: "16",
        contact: "09123456789",
        section: DEMO_SECTION,
        adviser: fullName(TEACHERS.demo),
        role: STUDENT,
    }),
});

// Makes sure the demo accounts exist and are up to date. Runs on every demo
// login, so the demo works without running the seed script first.
let pendingCheck = null;
const ensureDemoAccounts = (prisma) => {
    pendingCheck ??= (async () => {
        const existing = await prisma.people.findMany({
            where: { email: { in: demoEmails() }, demoVisitorId: { isSet: false } },
            select: { email: true, isDemo: true, section: true },
        });
        const ready = demoEmails().every((email) => existing.some((person) => person.email === email && person.isDemo === true))
            && existing.some((person) => person.email === accounts.student.email && person.section === DEMO_SECTION);
        if (!ready) await upsertAccounts(prisma);
    })().finally(() => {
        pendingCheck = null;
    });
    return pendingCheck;
};

// Gives a new visitor their own copy of the sample data. Classes are dated
// relative to today in the visitor's time zone.
const createVisitorData = async (prisma, { visitorId, timeZone }) => {
    const zone = validTimeZone(timeZone);
    const now = new Date();
    const stamp = { isDemo: true, demoVisitorId: visitorId };

    const shared = await prisma.people.findMany({
        where: { email: { in: [accounts.teacher.email, accounts.student.email] }, isDemo: true, demoVisitorId: { isSet: false } },
        select: { id: true, email: true },
    });
    const demoTeacherId = shared.find((person) => person.email === accounts.teacher.email)?.id;
    const demoStudentId = shared.find((person) => person.email === accounts.student.email)?.id;
    if (!demoTeacherId || !demoStudentId) throw new Error("The demo accounts are missing");

    const password = await getLockedPassword();
    let personIndex = 0;
    await prisma.people.createMany({
        data: [
            ...Object.entries(TEACHERS)
                .filter(([key]) => key !== "demo")
                .map(([, teacher]) => ({ ...teacher, role: TEACHER, password, ...stamp })),
            ...SECTIONS.flatMap((section) => section.students.map((name) => {
                const index = personIndex++;
                return {
                    firstName: name[0],
                    lastName: name[1],
                    email: studentEmail(name),
                    homeAddress: `${BARANGAYS[index % BARANGAYS.length]}, Nagcarlan, Laguna`,
                    age: String(section.age - (index % 3 === 0 ? 1 : 0)),
                    contact: `0917${String(2000000 + index * 135791).slice(-7)}`,
                    section: section.name,
                    adviser: fullName(TEACHERS[section.adviser]),
                    role: STUDENT,
                    password,
                    ...stamp,
                };
            })),
        ],
    });

    const people = await prisma.people.findMany({ where: stamp, select: { id: true, email: true, role: true, section: true } });
    const teacherIds = Object.fromEntries(Object.entries(TEACHERS).map(([key, { email }]) => [
        key,
        key === "demo" ? demoTeacherId : people.find((person) => person.email === email)?.id,
    ]));
    const studentIds = (section) => [
        ...(section === DEMO_SECTION ? [demoStudentId] : []),
        ...people.filter((person) => person.role === STUDENT && person.section === section).map((person) => person.id),
    ];

    const random = seededRandom(2026);
    const classes = DAYS.flatMap((day) => TIMETABLE.map((slot) => ({ day, ...slot })));
    const codes = await uniqueCodes(prisma, classes.length);
    await prisma.attendance.createMany({
        data: classes.map(({ day, teacher, event, section, time }, index) => ({
            isOn: false,
            date: classDate(new Date(now.getTime() + day * DAY_MS), zone),
            time,
            teacher: teacherIds[teacher],
            event,
            code: codes[index],
            section,
            ...stamp,
            students: studentIds(section).map((id) => {
                // Today's and later classes haven't been taken yet.
                if (day >= 0) return newStudentEntry(id);
                const missed = id === demoStudentId
                    ? day === MISSED_CLASS.day && event === MISSED_CLASS.event
                    : random() < 0.12;
                const leftEarly = id !== demoStudentId && random() < 0.05;
                return {
                    ...newStudentEntry(id),
                    statusIn: missed ? "absent" : "present",
                    statusOut: missed || leftEarly ? "absent" : "present",
                };
            }),
        })),
    });

    return { people: people.length + shared.length, classes: classes.length };
};

// The class a demo visitor gets when they log in: Demo Teacher with Demo
// Student's section, from now until 20 minutes from now in the visitor's time
// zone, so attendance can be taken right away. Logging in again within those
// 20 minutes (e.g. as another role) keeps the same class.
const startLiveClass = async (prisma, { visitorId, timeZone }) => {
    const now = new Date();
    const running = await prisma.attendance.findFirst({
        where: {
            demoVisitorId: visitorId,
            demoLive: true,
            createdAt: { gte: new Date(now.getTime() - LIVE_CLASS_MINUTES * 60 * 1000) },
        },
        orderBy: { createdAt: "desc" },
    });
    if (running) return running;

    const zone = validTimeZone(timeZone);
    const [teacher, students, [code]] = await Promise.all([
        prisma.people.findFirst({ where: { email: accounts.teacher.email, isDemo: true, demoVisitorId: { isSet: false } }, select: { id: true } }),
        prisma.people.findMany({
            where: {
                isDemo: true,
                role: STUDENT,
                section: DEMO_SECTION,
                OR: [{ demoVisitorId: visitorId }, { email: accounts.student.email, demoVisitorId: { isSet: false } }],
            },
            select: { id: true },
        }),
        uniqueCodes(prisma, 1),
    ]);
    if (!teacher) return null;

    const end = new Date(now.getTime() + LIVE_CLASS_MINUTES * 60 * 1000);
    return prisma.attendance.create({
        data: {
            isOn: false,
            date: classDate(now, zone),
            time: `${clockTime(now, zone)} - ${clockTime(end, zone)}`,
            teacher: teacher.id,
            event: "Live demo class",
            code,
            section: DEMO_SECTION,
            students: students.map((person) => newStudentEntry(person.id)),
            isDemo: true,
            demoVisitorId: visitorId,
            demoLive: true,
        },
    });
};

// Deletes everything that belongs to these visitors, including their faces.
const deleteVisitorData = async (prisma, visitorIds) => {
    if (visitorIds.length === 0) return;
    const where = { demoVisitorId: { in: visitorIds } };
    await Promise.all([
        prisma.attendance.deleteMany({ where }),
        prisma.people.deleteMany({ where }),
        prisma.facephotos.deleteMany({ where }),
        prisma.demofaces.deleteMany({ where: { visitorId: { in: visitorIds } } }),
        prisma.demovisitors.deleteMany({ where: { visitorId: { in: visitorIds } } }),
    ]);
};

// Deletes the data of visitors that started before `expiredBefore`, and demo
// data left by older versions of the demo (shared sample data, faces without
// a visitor). Returns how many visitors were removed.
const cleanupDemoData = async (prisma, { expiredBefore }) => {
    const expired = await prisma.demovisitors.findMany({ where: { createdAt: { lt: expiredBefore } }, select: { visitorId: true } });
    await deleteVisitorData(prisma, expired.map((visitor) => visitor.visitorId));

    const teacher = await prisma.people.findFirst({ where: { email: accounts.teacher.email, demoVisitorId: { isSet: false } }, select: { id: true } });
    await Promise.all([
        prisma.people.deleteMany({ where: { isDemo: true, demoVisitorId: { isSet: false }, email: { notIn: demoEmails() } } }),
        prisma.attendance.deleteMany({
            where: {
                OR: [
                    { isDemo: true, demoVisitorId: { isSet: false } },
                    // Classes from before demo records had the isDemo flag.
                    ...(teacher ? [{ teacher: teacher.id, isDemo: { isSet: false } }] : []),
                ],
            },
        }),
        prisma.facephotos.deleteMany({ where: { isDemo: true, demoVisitorId: { isSet: false } } }),
        prisma.demofaces.deleteMany({ where: { createdAt: { lt: expiredBefore } } }),
    ]);
    return expired.length;
};

// Rebuilds the demo accounts and deletes every visitor's data, so the next
// demo login starts fresh. Used by `npm run seed:demo`.
const resetDemoData = async (prisma) => {
    const { admin, teacher, student } = await upsertAccounts(prisma);
    const visitors = await prisma.demovisitors.findMany({ select: { visitorId: true } });
    await deleteVisitorData(prisma, visitors.map((visitor) => visitor.visitorId));
    await prisma.demofaces.deleteMany({});
    await cleanupDemoData(prisma, { expiredBefore: new Date() });
    return { admin, teacher, student, section: DEMO_SECTION, visitorsCleared: visitors.length };
};

module.exports = {
    DEMO_SECTION,
    LIVE_CLASS_MINUTES,
    cleanupDemoData,
    createVisitorData,
    deleteVisitorData,
    ensureDemoAccounts,
    resetDemoData,
    startLiveClass,
};
