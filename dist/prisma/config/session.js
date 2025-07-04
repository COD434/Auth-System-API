"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSessionConfig = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const crypto_1 = __importDefault(require("crypto"));
const redis_1 = require("./redis");
dotenv_1.default.config();
const validateSessionSecret = (key) => {
    if (!key || typeof key !== "string") {
        throw new Error("SESSION_SECRET environment variable is required and must be a string");
    }
    if (key.length < 32) {
        throw new Error("SESSION_SECRET must be at least 32 characters long");
    }
};
const generateRandomSecret = () => {
    return crypto_1.default.randomBytes(32).toString("hex");
};
const getSessionConfig = async () => {
    const { redisStore } = await (0, redis_1.setupRedis)();
    const sessionKey = process.env.SESSION_SECRET || generateRandomSecret();
    validateSessionSecret(sessionKey);
    //const expiryDate = new Date(Date.now() + 60 * 60 * 1000);
    return {
        store: redisStore,
        secret: sessionKey,
        resave: false,
        name: "session_id",
        saveUninitialized: false,
        cookie: {
            secure: process.env.NODE_ENV === "production" ? true : false,
            httpOnly: true,
            sameSite: "strict",
            maxAge: 60 * 60 * 1000
        }
    };
};
exports.getSessionConfig = getSessionConfig;
