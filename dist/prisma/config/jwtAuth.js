"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateJWT = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const redis_1 = require("./redis");
dotenv_1.default.config();
const redisClientPromise = (0, redis_1.setupRedis)();
let redisClient;
redisClientPromise.then(({ redisClient: client }) => {
    redisClient = client;
}).catch(err => console.error("Redis setup error", err));
const authenticateJWT = async (req, res, next) => {
    var _a;
    const authHeader = req.headers.authorization;
    const token = ((_a = req.cookies) === null || _a === void 0 ? void 0 : _a.token) || ((authHeader === null || authHeader === void 0 ? void 0 : authHeader.startsWith("Bearer ")) ? authHeader.split(" ")[1] : null);
    if (!token) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const storedToken = await redisClient.get(`session:${decoded.userId}`);
        if (storedToken !== token) {
            res.status(403).json({ success: false, message: "Invalid session", errors: [] });
            return;
        }
        req.user = decoded;
        return next();
    }
    catch (err) {
        res.status(403).json({ success: false, message: "Invalid  or expired token" });
        return;
    }
    ;
};
exports.authenticateJWT = authenticateJWT;
