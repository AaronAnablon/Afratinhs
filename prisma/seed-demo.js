// Creates (or resets) the demo accounts and sample schedules.
// Usage: npm run seed:demo   (uses DATABASE_URL from .env.local or .env)
require("dotenv").config({ path: ".env.local" });
require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const { resetDemoData } = require("../src/utils/demoSeed");

const prisma = new PrismaClient();

resetDemoData(prisma)
    .then(({ admin, teacher, student, section, scheduleCount }) => {
        console.log("Demo data ready:");
        console.log(`  Admin    ${admin.email}`);
        console.log(`  Teacher  ${teacher.email}`);
        console.log(`  Student  ${student.email} (${section})`);
        console.log(`  ${scheduleCount} schedules for ${section}`);
    })
    .catch((error) => {
        console.error(error.message);
        process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
