"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAndRefreshToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const redis_1 = require("./redis");
let redisClient;
const validateAndRefreshToken = async (refreshToken) => {
    if (!refreshToken) {
        throw new Error("Missing token");
    }
    const decoded = jsonwebtoken_1.default.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const redisClient = await (0, redis_1.initializeRedisClient)();
    const storedToken = await redisClient.get(`refresh:${decoded.userId}`);
    if (storedToken !== refreshToken) {
        throw new Error("Invalid refersh token");
    }
    const newAccessToken = jsonwebtoken_1.default.sign({
        userId: decoded.userId, email: decoded.email
    }, process.env.JWT_SECRET, { expiresIn: "15m" });
    return newAccessToken;
};
exports.validateAndRefreshToken = validateAndRefreshToken;
