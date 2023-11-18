
import {PrismaClient} from '@prisma/client';

global.prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") global.prisma = global.prisma;

module.exports = global.prisma;