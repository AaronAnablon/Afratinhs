// Creates (or resets) the shared demo accounts and deletes every demo
// visitor's data, so the next demo login starts fresh. Demo logins also create
// the accounts, so running this is optional.
// Usage: npm run seed:demo   (uses DATABASE_URL from .env.local or .env)
require("dotenv").config({ path: ".env.local" });
require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const { resetDemoData } = require("../src/utils/demoSeed");

const prisma = new PrismaClient();

resetDemoData(prisma)
    .then(({ admin, teacher, student, section, visitorsCleared }) => {
        console.log("Demo accounts ready:");
        console.log(`  Admin    ${admin.email}`);
        console.log(`  Teacher  ${teacher.email}`);
        console.log(`  Student  ${student.email} (${section})`);
        console.log(`  Deleted the data of ${visitorsCleared} demo visitors`);
    })
    .catch((error) => {
        console.error(error.message);
        process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
