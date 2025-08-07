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
const sinon_1 = __importDefault(require("sinon"));
const dotenv_1 = __importDefault(require("dotenv"));
const chai_1 = __importDefault(require("chai"));
const supertest_1 = __importDefault(require("supertest"));
const script_1 = __importDefault(require("../script"));
const rabbitmq = __importStar(require("../prisma/config/Rabbitmq"));
const validate_1 = require("../prisma/config/validate");
const ioredis_1 = __importDefault(require("ioredis"));
dotenv_1.default.config({ path: ".env.test" });
const expect = chai_1.default.expect;
const testPassword = "SuperSecret123";
const testEmail = "test0@email.com";
describe("User Auth flow", () => {
    const redis = new ioredis_1.default(process.env.REDIS_URL);
    before(async () => {
        await validate_1.prisma.user.deleteMany();
        sinon_1.default.stub(rabbitmq, "publishToQueue").resolves();
    });
    after(async () => {
        await redis.quit();
        await validate_1.prisma.$disconnect();
        sinon_1.default.restore();
    });
    it("should register and then log in the user", async () => {
        const register = await (0, supertest_1.default)(script_1.default).post("/register").send({
            email: testEmail,
            password: testPassword,
        });
        expect(register.status).to.equal(200);
        const login = await (0, supertest_1.default)(script_1.default).post("/login").send({
            email: testEmail,
            password: testPassword,
        });
        expect(login.status).to.equal(200);
        expect(login.body.user).to.have.property("accessToken");
        expect(login.body.user.email).to.equal(testEmail);
    });
});
