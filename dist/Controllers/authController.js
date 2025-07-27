"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.vAL = exports.Lvalidations = exports.userValidations = exports.verifyResetOTP = exports.requestPassword = exports.login = exports.register = exports.requireAdmin = exports.VerificationOfEmail = exports.UpdatePassword = exports.Incognito = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const { PrismaClient } = require("@prisma/client");
const express_validator_1 = require("express-validator");
const monitor_1 = require("../prisma/config/Monitor/monitor");
const email_1 = require("../prisma/config/email");
const Rabbitmq_1 = require("../prisma/config/Rabbitmq");
const validate_1 = require("../prisma/config/validate");
const security_1 = require("../prisma/config/security");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const monitor_2 = require("../prisma/config/Monitor/monitor");
const redis_1 = require("../prisma/config/redis");
dotenv_1.default.config();
const jwtAuth_1 = require("../prisma/config/jwtAuth");
;
const toMail = {
    sendVerificationEmail: email_1.sendVerificationEmail,
    sendWelcomeEmail: email_1.sendWelcomeEmail,
    SendResetPasswordOTP: email_1.SendResetPasswordOTP,
    genOTP: email_1.genOTP
};
const createPasswordService = (prisma, mailService, options = {}) => {
    const { otpExpirationMinutes = 10, otpGenerator = email_1.genOTP, } = options;
    return {
        async requestPasswordReset(email) {
            const user = await prisma.user.findFirst({ where: { email }, });
            if (!user) {
                throw new Error("INVALID_CREDENTIALS");
            }
            const resetToken = otpGenerator();
            const resetExpires = new Date(Date.now() + otpExpirationMinutes * 60 * 1000);
            await prisma.user.update({
                where: { email },
                data: { resetToken, resetExpires },
            });
            await mailService.SendResetPasswordOTP(email, resetToken);
            return { email, resetToken };
        }
    };
};
//ANONYMOUS AUTH LOGIC
const Incognito = (req, res, next) => {
    const authHeader = req.headers.authorization;
    let token = authHeader === null || authHeader === void 0 ? void 0 : authHeader.split(" ")[1];
    let user = token ? (0, jwtAuth_1.verifyToken)(token) : null;
    if (!user) {
        const GToken = (0, jwtAuth_1.guestToken)();
        user = (0, jwtAuth_1.verifyToken)(GToken);
        res.setHeader("X-Guest-Token", GToken);
        monitor_2.guestCounter.inc({ endpoint: req.path });
    }
    if ((user === null || user === void 0 ? void 0 : user.type) === "guest") {
        monitor_2.guestBlocked.inc({ endpoint: req.path, method: req.method });
    }
    res.user = user;
    next();
};
exports.Incognito = Incognito;
const createPasswordErrorHandler = (options) => {
    const { userNotFoundMessage = "INVALID_CREDENTIALS", defaultErrorMessage = "ERROR_SENDING_OTP", successMessage = "Password reset OTP has been sent to your email" } = options || {};
    return (error, res, email) => {
        if (error.message === "INVALID_CREDENTIALS") {
            return res.status(400).json({ error: defaultErrorMessage });
        }
        console.error("Password Reset error:", error);
        return res.status(500).json({
            error: defaultErrorMessage
        });
    };
};
const passwordService = createPasswordService(validate_1.prisma, toMail, {
    otpExpirationMinutes: 15,
    otpGenerator: email_1.genOTP
});
const HandlePasswordError = createPasswordErrorHandler({
    userNotFoundMessage: "INVALID_CREDENTIALS",
    successMessage: "OTP sent to your email"
});
const requestPassword = async (req, res, next) => {
    const { email } = req.body;
    try {
        const result = await passwordService.requestPasswordReset(email);
        return {
            email: result.email,
            error: "",
            success: "Password reset OTP has been sent to your email"
        };
    }
    catch (err) {
        if (err instanceof Error) {
            HandlePasswordError(err, res, email);
        }
        else {
            HandlePasswordError(new Error(String(err)), res, email);
        }
    }
};
exports.requestPassword = requestPassword;
const verifyResetOTP = async (req, res, next) => {
    try {
        const { email, otp } = req.body;
        const user = await validate_1.prisma.user.findUnique({
            where: {
                email,
                resetToken: otp,
                resetExpires: { gt: new Date() }
            }
        });
        if (!user) {
            res.status(400).json({ error: "Invalid or expired OTP", email });
        }
        res.status(200).json({ success: true, message: "OTP verified,Please enter your new password" });
    }
    catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        return res.status(400).json({ message: errorMessage });
    }
};
exports.verifyResetOTP = verifyResetOTP;
const UpdatePassword = async (req, res, next) => {
    const { email, password, otp } = req.body;
    const hashed = await bcrypt_1.default.hash(password, 10);
    try {
        const user = await validate_1.prisma.user.findFirst({
            where: {
                email,
                resetToken: otp,
                resetExpires: { gt: new Date() }
            }
        });
        if (!user) {
            res.status(400);
            return;
        }
        await validate_1.prisma.user.update({
            where: { email },
            data: {
                password: hashed,
                resetToken: null,
                resetExpires: null
            }
        });
        res.status(200);
        return;
    }
    catch (err) {
        res.status(500);
        return;
    }
};
exports.UpdatePassword = UpdatePassword;
const registerValidations = ({ minPasswordLength = 8, strongPasswordOptions = {
    minLength: 12,
    minLowercase: 1,
    minNumbers: 1,
    minSymbols: 1,
    minUppercase: 1
}, usernameRegex = /^[a-zA-Z0-9_-]+$/ } = {}) => [
    (0, express_validator_1.body)("email")
        .normalizeEmail()
        .isEmail()
        .withMessage("Invalid email")
        .custom(async (email) => {
        const user = await validate_1.prisma.user.findUnique({ where: { email } });
        if (user) {
            throw new Error("User with that email already exists, want to login?");
        }
        return true;
    }),
    (0, express_validator_1.body)("username")
        .matches(usernameRegex)
        .trim()
        .escape()
        .notEmpty()
        .withMessage("Username is required"),
    (0, express_validator_1.body)("password")
        .isStrongPassword(strongPasswordOptions)
        .withMessage("Password must include at least one lowercase, uppercase, number and symbol")
        .trim()
        .escape()
        .isLength({ min: minPasswordLength })
        .withMessage(`Password must be at least ${minPasswordLength} long`),
];
const Authservice = {
    async registerUser({ email, password, username, tokenExpiryHours = 24, bcryptRounds = 10 }) {
        const verifyToken = (0, email_1.genOTP)();
        const verifyExpires = new Date(Date.now() + tokenExpiryHours * 60 * 60 * 1000);
        const hashedPassword = await bcrypt_1.default.hash(password, bcryptRounds);
        const user = await validate_1.prisma.user.create({
            data: {
                email,
                username,
                password: hashedPassword,
                isVerified: false,
                verifyToken,
                verifyExpires
            }
        });
        try {
            await (0, Rabbitmq_1.publishToQueue)("emailQueue", { email, verifyToken });
        }
        catch (emailError) {
            console.error("Email send failure:", emailError);
            throw new Error("Failed to send verification email");
        }
        return user;
    }
};
const userValidations = registerValidations();
exports.userValidations = userValidations;
const register = async (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({
            success: false,
            validationErrors: errors.array(),
            FormData: req.body
        });
        return;
    }
    try {
        const { email, password, username } = req.body;
        await Authservice.registerUser({ email, password, username });
        res.status(200).json({
            success: true,
            message: "Registration successful! Please check your email to verify your account."
        });
        console.log("sent  JSON response");
    }
    catch (err) {
        console.error("Registration error:", err);
        res.json({
            success: false,
            message: "Registration failed. Please try again",
            formData: req.body
        });
    }
};
exports.register = register;
const loginValidations = ({ minUsernameLength = 5, requireUsername = false } = {}) => [
    (0, express_validator_1.body)("email")
        .isEmail()
        .normalizeEmail()
        .withMessage("Invalid email")
        .bail(),
    (0, express_validator_1.body)("password").
        trim()
        .bail()
        .notEmpty()
        .withMessage("Password is required"),
    (0, express_validator_1.body)("username")
        .optional({ checkFalsy: !requireUsername })
        .isLength({ min: minUsernameLength })
        .withMessage(`Username must have atleast ${minUsernameLength} characters`),
];
const vAL = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }
    next();
};
exports.vAL = vAL;
const authServiceLogin = {
    async loginUser(credentials) {
        const { email, password } = credentials;
        const user = await validate_1.prisma.user.findFirst({ where: { email } });
        if (!user) {
            throw new Error("INVALID_EMAIL");
        }
        const isValidPassword = await bcrypt_1.default.compare(password, user.password);
        if (!isValidPassword) {
            throw new Error("INVALID_PASSWORD");
        }
        return user;
    }
};
const handleLoginError = (error, res, formValues = {}) => {
    const { email, username } = formValues;
    switch (error.message) {
        case "INVALID_EMAIL":
            return res.status(400).json({
                errors: [{
                        param: "email",
                        msg: "Email not found ,want to register"
                    }],
                values: formValues
            });
        case "INVALID_PASSWORD":
            return res.status(400).json({
                error: "Incorrect Password",
                field: "password",
                values: formValues
            });
        default:
            console.error("Login error", error);
            return res.status(400).json({
                success: false,
                error: "Login failed",
                values: formValues
            });
    }
};
const Lvalidations = loginValidations();
exports.Lvalidations = Lvalidations;
const login = async (req, res) => {
    const { email, password, username } = req.body;
    try {
        monitor_1.loginCount.inc();
        const user = await authServiceLogin.loginUser({ email, password, username });
        if (!user) {
            monitor_1.errorCounter.inc();
        }
        const token = (0, security_1.generateJWT)({ userId: user.id, email: user.email });
        const redisClient = await (0, redis_1.initializeRedisClient)();
        const accessToken = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: "15m" });
        const refreshToken = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "7d" });
        await redisClient.set(`refresh:${user.id}`, refreshToken, "EX", 7 * 24 * 60 * 60);
        await redisClient.set(`session:${user.id}`, accessToken, "EX", 15 * 60);
        res.cookie("token", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === " production",
            sameSite: "strict",
            maxAge: 15 * 60 * 1000,
        })
            .status(200).json({
            success: monitor_1.authSuccessCounter.inc(),
            message: "Login Successful",
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                accessToken,
                refreshToken
            }
        });
    }
    catch (error) {
        if (error instanceof Error) {
            monitor_1.errorCounter.inc();
            handleLoginError(error, res, { email, username });
        }
    }
};
exports.login = login;
const createEmailVerificationService = (prisma, options = {}) => {
    const { tokenExpirationCheck = true, postVerificationUpdate = async () => { } } = options;
    return {
        async verifyEmailToken(token) {
            if (!token)
                throw new Error("MISSING_TOKEN");
            const whereClause = Object.assign({ verifyToken: token }, (tokenExpirationCheck && { verifyExpires: { gt: new Date() }
            }));
            const user = await prisma.user.findFirst({
                where: whereClause
            });
            if (!user)
                throw new Error("INVALID_OR_EXPIRED_TOKEN");
            const updatedUser = await prisma.user.update({
                where: { id: user.id },
                data: {
                    isVerified: true,
                    verifyToken: null,
                    verifyExpires: null
                }
            });
            await postVerificationUpdate(user.id);
            return updatedUser;
        },
    };
};
const VerificationOfEmail = (options) => {
    const { missingTokenMessage = "Invalid verification links", invalidTokenMessage = "Invalid or Expired verifcation link", defaultErrorMessage = "Email verification failed" } = options || {};
    const emailVerificationService = createEmailVerificationService(validate_1.prisma, { tokenExpirationCheck: process.env.NODE_ENV !== "test",
        postVerificationUpdate: async (userId) => {
            try {
                await Promise.all([
                    (0, email_1.sendWelcomeEmail)(userId),
                    //addToMailingList(userId)
                ]);
            }
            catch (error) {
                console.error("Non-critical post-verification steps failed", error);
            }
        }
    });
    const handleVerificationError = (error, res) => {
        switch (error.message) {
            case "MISSING_TOKEN":
                res.status(400).json({ message: "Invalid verification link" });
                break;
            case "INVALID_OR_EXPIRED_TOKEN":
                res.status(400).json({ message: "Expired link" });
                break;
            default:
                res.status(500).json({ message: "Verification failed" });
        }
        ;
    };
    return async (req, res, next) => {
        const { token } = req.query;
        try {
            await emailVerificationService.verifyEmailToken(token);
            res.json({ success: true, message: "Successfully Verified" });
        }
        catch (err) {
            if (err instanceof Error) {
                handleVerificationError(err, res);
            }
            else {
                console.error("Unexpected error type", err);
                handleVerificationError(new Error(String(err)), res);
            }
        }
    };
};
exports.VerificationOfEmail = VerificationOfEmail;
const requireAdmin = (req, res, next) => {
    const authHeader = req.headers.authorization || req.cookies.token;
    if (!authHeader) {
        res.status(401).json({ error: "Unauthorized:No token provided" });
        return;
    }
    const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : authHeader;
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== "ADMIN") {
            res.status(403).json({ error: "Forbidden: Admin only" });
        }
        //const user = (req as any).user;
        //if(!user || user.role !==" ADMIN"){
        //res.status(403).json({success:false,message:"Admin access required"})
        //return;
        //}
        next();
    }
    catch (error) {
        res.status(401).json({ error: "Invalid or expired token" });
    }
};
exports.requireAdmin = requireAdmin;
