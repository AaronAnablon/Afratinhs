
import {PrismaClient} from '@prisma/client';

const prisma = global.prisma || new PrismaClient();

// Reuse one client across hot reloads in development.
if (process.env.NODE_ENV !== "production") global.prisma = prisma;

export default prisma;
