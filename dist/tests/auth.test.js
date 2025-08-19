"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const admin_1 = require("../prisma/config/admin");
const sinon_1 = __importDefault(require("sinon"));
const dotenv_1 = __importDefault(require("dotenv"));
const child_process_1 = require("child_process");
const chai_1 = __importDefault(require("chai"));
const supertest_1 = __importDefault(require("supertest"));
const script_1 = __importDefault(require("../script"));
const email_1 = require("../prisma/config/email");
const rabbitmq = __importStar(require("../prisma/config/Rabbitmq"));
const validate_1 = require("../prisma/config/validate");
const ioredis_1 = __importDefault(require("ioredis"));
dotenv_1.default.config({
    path: path_1.default.resolve(process.cwd(), ".env.test"),
    override: true
});
const expect = chai_1.default.expect;
const newPass = "3000Hunnids#@";
const testPassword = "1234Hunnids#@";
const testEmail = "seeisakarabo461@email.com";
const userName = "tester";
const OTP = (0, email_1.genOTP)();
describe("User Auth flow", () => {
    const redis = new ioredis_1.default({
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT)
    });
    before(async function () {
        this.timeout(1110000);
        console.log("Using DB:", process.env.DATABASE_URL);
        (0, child_process_1.execSync)("npx prisma migrate deploy --schema=prisma/schema.prisma", { stdio: "inherit" });
        console.log("Connecting to DB...");
        await validate_1.prisma.$connect();
        await cleanDatabase();
        console.log("seeding admin...");
        await (0, admin_1.seedAdmin)();
        sinon_1.default.stub(rabbitmq, "publishToQueue").resolves();
    });
    after(async () => {
        await redis.quit();
        await validate_1.prisma.$disconnect();
        sinon_1.default.restore();
    });
    async function cleanDatabase() {
        const tablenames = await validate_1.prisma.$queryRaw `SELECT tablename FROM pg_tables WHERE schemaname='public'`;
        for (const { tablename } of tablenames) {
            if (tablename !== "_prisma_migrations") {
                try {
                    await validate_1.prisma.$executeRawUnsafe(`TRUNCATE TABLE "public"."${tablename}" CASCADE;`);
                }
                catch (error) {
                    console.log({ error });
                }
            }
        }
    }
    it("should register and then log in the user", async () => {
        const register = await (0, supertest_1.default)(script_1.default).post("/register").send({
            username: userName,
            email: testEmail,
            password: testPassword,
        });
        expect(register.status).to.equal(200);
        const login = await (0, supertest_1.default)(script_1.default).post("/login").send({
            username: userName,
            email: testEmail,
            password: testPassword,
        });
        const requestPassReset = await (0, supertest_1.default)(script_1.default).post("/request-password-reset").send({
            email: testEmail
        });
        const verifyOTP = await (0, supertest_1.default)(script_1.default).post("/verify-reset-otp").send({
            email: testEmail
            //otp:OTP
        });
        //const passUpdate = await (0, supertest_1.default)(script_1.default).post("/update-password").send({
            //email: testEmail,
          //  password: newPass
        //});
        //expect(passUpdate.status).to.equal(200);
        expect(verifyOTP.status).to.equal(200);
        expect(requestPassReset.status).to.equal(200);
        expect(login.status).to.equal(200);
        expect(login.body.user).to.have.property("accessToken");
        expect(login.body.user.email).to.equal(testEmail);
    });
});
