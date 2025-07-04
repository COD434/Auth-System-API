"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = exports.prisma = void 0;
const child_process_1 = require("child_process");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient({
    log: [
        { level: "warn", emit: "event" },
        { level: "info", emit: "event" },
        { level: "error", emit: "event" },
    ],
});
exports.prisma = prisma;
const runMigration = async () => {
    try {
        const migrationStatus = (0, child_process_1.execSync)('npx prisma migrate status').toString();
        if (!migrationStatus.includes('Database schema  is up to date')) {
            console.log('Running database migrations...');
            (0, child_process_1.execSync)('npx prisma migrate deploy', { stdio: 'inherit' });
        }
    }
    catch (err) {
        console.error('migration  failed:', err);
        process.exit(1);
    }
};
const connectDB = async () => {
    try {
        await prisma.$connect();
        console.log("Database connected successfully");
    }
    catch (err) {
        console.error("Database connection error:", err);
        process.exit(1);
    }
};
exports.connectDB = connectDB;
process.on("beforeExit", async () => {
    await prisma.$disconnect();
});
prisma.$on("warn", (e) => {
    console.warn('Prisma warn', e);
});
prisma.$on("info", (e) => {
    console.info("Prisma info", e);
});
prisma.$on("error", (e) => {
    console.error("Prisma error", e);
});
