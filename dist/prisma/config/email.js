"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendWelcomeEmail = exports.SendResetPasswordOTP = exports.genOTP = exports.sendVerificationEmail = exports.Token = void 0;
const client_1 = require("@prisma/client");
const crypto_1 = __importDefault(require("crypto"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const prisma = new client_1.PrismaClient();
const transporter = nodemailer_1.default.createTransport({
    host: "smtp.ethereal.email",
    //pool:true,
    port: 587,
    secure: false,
    auth: {
        user: "fannie47@ethereal.email",
        pass: "QpnbWHrRJsER8v8jZp"
    }
});
const Token = () => {
    return crypto_1.default.randomBytes(32).toString("hex");
};
exports.Token = Token;
const sendVerificationEmail = async (email, token) => {
    try {
        const verificationUrl = `${process.env.BASE_URL}/verify-email?token=${token}`;
        const mailOptions = {
            from: "Karabo", //<${process.env.GMAIL_USER}>,
            to: email,
            subject: "Welcome",
            html: `
    <div style = "font-family: Arial,sans-serif;max-width: 600px; margin:0 auto">
    <h1>Thank you for try this out here's your  verification url ${verificationUrl}</h1>
    
    </div>`
        };
        const info = await transporter.sendMail(mailOptions);
        console.log("Verification email sent  to:", info.messageId);
        console.log("Preview:", nodemailer_1.default.getTestMessageUrl(info));
    }
    catch (error) {
        console.error("Error sending verification email:", error);
        throw new Error("Error occured while sending verificaton:" + error.message);
    }
};
exports.sendVerificationEmail = sendVerificationEmail;
const genOTP = () => {
    return Math.floor(10000 + Math.random() * 900000).toString();
};
exports.genOTP = genOTP;
const SendResetPasswordOTP = async (email, otp) => {
    const mailOptions = {
        from: "Karabo",
        to: email,
        subject: "Password Reset OTP",
        html: `<div style="font-style:Arial,sans-serif;
                max-width:600px;margin: 0 auto;">

                <h1 style="color: #333;">Password Reset request</h1>

                <p>Your password reset OTP is: ${otp}.this OPT will expire in 10minutes.</p>
                <div style="background: #f4f4f4; padding: 20px; text-align: center; margin:20px 0;">
                <h1 style="margin: 0; color: #0066cc;">${otp}</h1>
                </div>
                <p>This OTP will expire in 10 minutes.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style ="font-style: 12px; color: #777; ">This is an automated message,please do not reply.</p>
                </div>
                `
    };
    try {
        await transporter.sendMail(mailOptions);
        console.log(`${otp} was sent to ${email}`);
    }
    catch (err) {
        console.error("Couldnt send email sorry:", err);
        throw new Error("try again later");
    }
};
exports.SendResetPasswordOTP = SendResetPasswordOTP;
const sendWelcomeEmail = async (userId) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, username: true }
    });
    if (!user || !user.email) {
        throw new Error("user not found or missing email");
    }
};
exports.sendWelcomeEmail = sendWelcomeEmail;
