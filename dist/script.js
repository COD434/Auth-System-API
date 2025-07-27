"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv").config();
delete require.cache[require.resolve("./prisma/config/redis")];
delete require.cache[require.resolve("./prisma/config/session")];
const redis_1 = require("./prisma/config/redis");
const Rabbitmq_1 = require("./prisma/config/Rabbitmq");
const monitor_1 = require("./prisma/config/Monitor/monitor");
const monitor_2 = require("./prisma/config/Monitor/monitor");
const express_1 = __importDefault(require("express"));
const redis_2 = require("./prisma/config/redis");
const admin_1 = require("./prisma/config/admin");
const validate_1 = require("./prisma/config/validate");
const security_1 = require("./prisma/config/security");
const swagger_1 = require("./prisma/config/swagger");
const authController_1 = require("./Controllers/authController");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const userrouter_1 = __importDefault(require("./routes/userrouter"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const OTPlimit_1 = require("./prisma/config/OTPlimit");
/**
 * @swagger
 * /login:
 *   post:
 *     summary: Login a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successful login
 *       401:
 *         description: Invalid credentials
 */
const app = (0, express_1.default)();
const activeUsers = async () => {
    const redisClient = await (0, redis_1.initializeRedisClient)();
    const keys = await redisClient.keys("session:*");
    return keys.length;
};
const KPI = async () => {
    const count = await activeUsers();
    monitor_1.businessKPI.set(count);
};
// Database connection
(0, validate_1.connectDB)();
(0, admin_1.seedAdmin)();
monitor_1.loginCount.inc();
monitor_1.errorCounter.inc();
monitor_1.redisOps.inc();
monitor_1.authSuccessCounter.inc();
setInterval(KPI, 30000);
(0, Rabbitmq_1.initRabbitMq)();
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.urlencoded({ extended: true }));
app.use(security_1.securityHeaders);
app.use("/api-docs", swagger_1.swaggerUihandler.serve, swagger_1.swaggerUihandler.setup(swagger_1.swaggerSpec));
app.use((req, res, next) => {
    req.setTimeout(1000, () => {
        console.error(`Request timeout: ${req.method} ${req.url}`);
        if (!res.headersSent) {
            res.status(503).json({ error: "Request timeout" });
        }
    });
    next();
});
app.use((req, res, next) => {
    console.log(`Incoming request:${req.method} ${req.path}`);
    next();
});
app.use((req, res, next) => {
    req.url = req.url.replace(/[\n\r%0A%0D]+$/, "");
    next();
});
async function initializeApp() {
    try {
        await validate_1.connectDB;
        const { redisStore } = await (0, redis_2.setupRedis)();
        await (0, OTPlimit_1.initializeRateLimiter)();
        app.use("/api/auth", userrouter_1.default);
        // Auth routes
        app.post("/request-password-reset", (0, OTPlimit_1.OTPLimiterMiddleware)(), authController_1.requestPassword);
        app.post("/verify-reset-otp", authController_1.verifyResetOTP);
        app.post("/update-password", authController_1.UpdatePassword);
        app.post("/register", ...authController_1.userValidations, (0, express_async_handler_1.default)(authController_1.register));
        app.post("/login", authController_1.Lvalidations, (0, OTPlimit_1.LoginLimiterMiddleware)(), authController_1.login);
        app.get("/metrics", monitor_2.Metrics);
        app.use((err, req, res, next) => {
            console.error(`Error: ${err.message}`, {
                path: req.path,
                method: req.method,
                stack: process.env.NODE_ENV === "development" ? err.stack : undefined
            });
            const status = err.status || 500;
            res.status(status).json(Object.assign({ error: err.message || "Something went wrong" }, (process.env.NODE_ENV === "development" && { stack: err.stack })));
        });
        app.use((req, res) => {
            res.status(404).json({ error: "Route not found" });
        });
        app.get(/(.*)/, (req, res) => {
            res.status(404).json({
                actualUrlHit: req.url,
                method: req.method,
                availableRoutes: ["POST /login",
                    "POST /register",
                    "GET /debug"]
            });
        });
        // Start server
        const PORT = parseInt(process.env.PORT || "5000", 10);
        app.listen(PORT, "0.0.0.0", () => {
            console.log("Server running on port 5000");
        });
    }
    catch (err) {
        console.error("Failed to initialize application:", err);
        process.exit(1);
    }
}
initializeApp().catch(err => {
    console.error("Critical initialization error:", err);
    process.exit(1);
});
