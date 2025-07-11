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
exports.securityHeaders = exports.dynamicWhiteList = exports.verifyJWT = exports.generateJWT = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const helmet_1 = __importDefault(require("helmet"));
const ioredis_1 = __importDefault(require("ioredis"));
const rate_limiter_flexible_1 = require("rate-limiter-flexible");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
dotenv_1.default.config();
const IP_EXPIRATION_SECONDS = 7 * 24 * 60 * 60;
const JWT_SECRET = process.env.JWT_SECRET || "Boo";
const EXPIRY = "1h";
const generateJWT = (payload) => jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: EXPIRY });
exports.generateJWT = generateJWT;
const verifyJWT = (token) => jsonwebtoken_1.default.verify(token, JWT_SECRET);
exports.verifyJWT = verifyJWT;
const redisClient = new ioredis_1.default({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    enableOfflineQueue: false,
    retryStrategy: (times) => Math.min(times * 50, 2000),
    maxRetriesPerRequest: 10,
    password: process.env.REDIS_PASSWORD
});
const WHITELIST_KEY = process.env.WHITELIST_KEY;
exports.dynamicWhiteList = {
    isAllowed: async (ip) => {
        try {
            const keys = await redisClient.keys("whitelist:ip:*");
            //const cidrs = await redisClient.sismember("ip-whitelist",ip);
            ///const isDirectMatch = cidrs.include(ip) || ip === "::1" || ip ==="217.0.0.1";
            //if(const key of keys) {
            for (const key of keys) {
                const entry = key.replace("whitelist:ip:", "");
                if (entry === ip || ip === "::1" || ip === "127.0.0.1") {
                    return true;
                }
                if (entry.includes("/")) {
                    const CIDR = (await Promise.resolve().then(() => __importStar(require("ip-cidr")))).default;
                    const cidr = new CIDR(entry);
                    if (cidr.contains(ip))
                        return true;
                }
            }
            return false;
        }
        catch (err) {
            console.error("White check error:", err);
            return false;
        }
    },
    addIP: async (ipOrCIDR, ttl = IP_EXPIRATION_SECONDS) => {
        const key = `whitelist:ip:${ipOrCIDR}`;
        await redisClient.sadd(key, "1");
        await redisClient.expire(key, ttl);
    },
    removeIP: async (ipOrCIDR) => {
        const key = `whitelist:ip:${ipOrCIDR}`;
        await redisClient.srem(key, "1");
        await redisClient.del(key);
        //console.log("removeIP route hit by:",(req as any).user);
    },
    listIP: async () => {
        const keys = await redisClient.keys("whitelist:ip:*");
        return keys.map(key => key.replace("whitelist:ip:", ""));
    },
    middleware: () => {
        return async (req, res, next) => {
            var _a, _b;
            const clientIP = ((_b = (_a = req.headers["x-forwarded-for"]) === null || _a === void 0 ? void 0 : _a.toString().split(",")[0]) === null || _b === void 0 ? void 0 : _b.trim()) || req.ip || req.headers.get;
            if (await exports.dynamicWhiteList.isAllowed(clientIP)) {
                return next();
            }
            console.warn(`Blocked request from IP: ${clientIP}`);
            //res.status(403).json({error:"Access denied"})
        };
    }
};
const cspDirectives = {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", "trusted-cdn.com"],
    styleSrc: ["'self'"],
    imgSrc: ["'self'", "data:", "trusted-cdn.com"],
    fontSrc: ["'self'", "trusted-fonts.com"],
    connectSrc: ["'self'", "api.trusted-domain.com"],
    frameSrc: ["'none'"],
    objectSrc: ["'none'"],
    upgradeInsecureRequests: [],
    reportUri: "/csp-violation-report"
};
const securityHeaders = [
    helmet_1.default.hsts({
        maxAge: 315353444,
        includeSubDomains: true,
        preload: true,
    }),
    helmet_1.default.contentSecurityPolicy({
        directives: cspDirectives,
        reportOnly: process.env.NODE_ENV !== "production"
    }),
    helmet_1.default.xssFilter(),
    helmet_1.default.noSniff(),
    helmet_1.default.frameguard({ action: "deny" }),
    helmet_1.default.referrerPolicy({ policy: "same-origin" }),
];
exports.securityHeaders = securityHeaders;
//app.use(securityHeadersi)
const ratelimiter = new rate_limiter_flexible_1.RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: "rate_limit",
    points: 100,
    duration: 60,
    blockDuration: 300
});
const rateLimiterM = (req, res, next) => {
    ratelimiter.consume(req.ip)
        .then(() => next());
    //.catch(()=> res.status(429).send("Too Many Request"))
};
//app.use(rateLimiterM)
//const csrfProtection = csrf({cookie:true});
//app.use(csrfProtection);
redisClient.on("error", (err) => {
    console.error("Security Redis error:", err);
});
redisClient.on("connect", () => {
    console.log("Security Redis connected to:", redisClient.options.host);
});
