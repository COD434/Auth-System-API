"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeRedisClient = exports.setupRedis = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const connect_redis_1 = require("connect-redis");
const ioredis_1 = __importDefault(require("ioredis"));
dotenv_1.default.config();
let redisClientInstance = null;
const DEFAULT_REDIS_CONFIG = {
    host: process.env.REDIS_HOST || "redis",
    port: 6379,
    maxRetriesPerRequest: 10,
    connectTimeout: 5000
};
const DEFAULT_STORE_OPTIONS = {
    prefix: "session",
    ttl: 86400
};
const validateRedisConfig = (config) => {
    if (!config.url && !config.host) {
        throw new Error("Redis configuration requires either URL or host/port");
    }
    if (config.url && !config.url.startsWith("redis://")) {
        throw new Error("Redis URL must use 'redis://' protocol");
    }
    if (config.port && (config.port < 1 || config.port > 65535)) {
        throw new Error("Invalid Redis port number");
    }
};
const getRedisConfig = (options) => {
    const config = Object.assign(Object.assign(Object.assign({}, DEFAULT_REDIS_CONFIG), { host: process.env.REDIS_HOST || DEFAULT_REDIS_CONFIG.host, port: parseInt(process.env.REDIS_PORT || "6380") }), options);
    validateRedisConfig(config);
    return config;
};
const setupRedis = async (options) => {
    try {
        //if(redisClient && redisStore){
        //return{redisClient,redisStore};
        //}
        const config = getRedisConfig(options === null || options === void 0 ? void 0 : options.redisConfig);
        const storeOptions = Object.assign(Object.assign({}, DEFAULT_STORE_OPTIONS), options === null || options === void 0 ? void 0 : options.storeOptions);
        const redisClient = new ioredis_1.default({
            host: config.host,
            port: config.port,
            // password :config.password,
            retryStrategy: (times) => Math.min(times * 50, 2000),
            maxRetriesPerRequest: config.maxRetriesPerRequest
        });
        await new Promise((resolve, reject) => {
            redisClient.once("ready", async () => {
                try {
                    const pong = await redisClient.ping();
                    console.log("Redis ping response:", pong);
                    resolve();
                }
                catch (err) {
                    reject(err);
                }
            });
            redisClient.once("error", (err) => {
                reject(err);
            });
        });
        const redisStore = new connect_redis_1.RedisStore({
            client: redisClient,
            prefix: storeOptions.prefix,
            ttl: storeOptions.ttl
        });
        redisClient.on("error", (err) => {
            console.error("Redis client error:", err);
        });
        redisClient.on("ready", () => {
            console.log("Redis client is ready");
        });
        redisClient.on("reconnecting", () => {
            console.log("Redis client reconnecting...");
        });
        return { redisClient, redisStore };
    }
    catch (error) {
        console.error("Redis setup failed:", error);
        throw error;
    }
};
exports.setupRedis = setupRedis;
const initializeRedisClient = async () => {
    if (!redisClientInstance) {
        const { redisClient } = await setupRedis();
        redisClientInstance = redisClient;
    }
    return redisClientInstance;
};
exports.initializeRedisClient = initializeRedisClient;
