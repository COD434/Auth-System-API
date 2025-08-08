"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const amqplib_1 = __importDefault(require("amqplib"));
const email_1 = require("./email");
dotenv_1.default.config();
const StartWorking = async (retries = 5, delay = 5000) => {
    while (retries > 0) {
        try {
            const connection = await amqplib_1.default.connect(process.env.RABBITMQ_URL);
            const channel = await connection.createChannel();
            console.log("Connected to RabbitMQ");
            await channel.assertQueue("emailQueue", { durable: true });
            channel.consume("emailQueue", async (msg) => {
                if (msg !== null) {
                    const { email, verifyToken } = JSON.parse(msg.content.toString());
                    await (0, email_1.sendVerificationEmail)(email, verifyToken);
                    console.log("Job received:", { email, verifyToken });
                    // TODO: SEND EMAIL HERE ...
                    channel.ack(msg);
                }
            });
            break;
        }
        catch (error) {
            console.error("Failed to connect to RabbitMQ:", error);
            retries--;
            if (retries === 0) {
                process.exit(1);
            }
            await new Promise((res) => setTimeout(res, delay));
        }
    }
};
StartWorking().catch(console.error);
