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
const initRabbitMq = async () => {
    const connection = await amqplib_1.default.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();
    await channel.assertQueue("emailQueue", { durable: true });
};
exports.initRabbitMq = initRabbitMq;
const publishToQueue = async (queue, message) => {
    if (!channel)
        throw new Error("RabbitMQ channel not initialized");
    channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), { persistent: true });
};
exports.publishToQueue = publishToQueue;
