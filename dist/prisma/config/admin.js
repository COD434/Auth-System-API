"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedAdmin = void 0;
//import {PrismaClient} from "@prisma/client";
const dotenv_1 = __importDefault(require("dotenv"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const validate_1 = require("./validate");
dotenv_1.default.config();
const AwaitAdmin = async (retries = 5) => {
    while (retries > 0) {
        try {
            await validate_1.prisma.$connect();
            await validate_1.prisma.user.findFirst();
            return;
        }
        catch (err) {
            console.warn("Waiting for DB to be ready...");
            retries--;
            await new Promise((r) => setTimeout(r, 2000));
        }
    }
    throw new Error("Database not ready after retries");
};
const seedAdmin = async () => {
    try {
        await AwaitAdmin();
        const existingAdmin = await validate_1.prisma.user.findFirst({
            where: {
                role: "ADMIN"
            }
        });
        if (!existingAdmin) {
            const hashedPassword = await bcrypt_1.default.hash(process.env.PASS, 10);
            const admin = await validate_1.prisma.user.create({
                data: {
                    email: process.env.ADMIN_EMAIL,
                    username: process.env.ADMIN_USERNAME,
                    password: hashedPassword,
                    role: "ADMIN",
                    isVerified: true,
                }
            });
            console.log("Admin user created:", admin.email);
        }
        else {
            console.log("Admin user already exists:", existingAdmin.email);
        }
    }
    catch (err) {
        console.error("Failed to seed admin");
    }
};
exports.seedAdmin = seedAdmin;
