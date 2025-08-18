"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.publishToQueue = exports.initRabbitMq = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const amqplib_1 = __importDefault(require("amqplib"));
dotenv_1.default.config();
let channel;
const initRabbitMq = async (maxRetries = 10, retryDelay = 3000) => {
    let retryCount = 0;
    const retry = async () => {
        try {
            const connection = await amqplib_1.default.connect(process.env.RABBITMQ_URL);
            channel = await connection.createChannel();
            await channel.assertQueue("emailQueue", { durable: true });
            //await channel.assertQueue("otpMAIL", {durable:true});
            console.log("Rabbitmq has connected successfully");
        }
        catch (err) {
            retryCount++;
            if (retryCount >= maxRetries) {
                console.error("Max retries reached.Failed to connect to RabbitMQ:", err);
                throw err;
            }
            console.warn("Connection failed");
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            return retry();
        }
    };
    return retry();
};
exports.initRabbitMq = initRabbitMq;
const publishToQueue = async (queue, message) => {
    if (!channel)
        throw new Error("RabbitMQ channel not initialized");
    channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), { persistent: true });
};
exports.publishToQueue = publishToQueue;
