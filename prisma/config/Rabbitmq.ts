import dotenv from "dotenv";
import amqp from "amqplib";
dotenv.config()

let channel:   amqp.Channel;

export const initRabbitMq = async() => {
const connection = await amqp.connect(process.env.RABBITMQ_URL!)
channel = await connection.createChannel();
await channel.assertQueue("emailQueue",{durable:true});
};

export const publishToQueue = async (queue: string, message: any)=>{
if(!channel)
throw new Error("RabbitMQ channel not initialized");
channel.sendToQueue(queue,Buffer.from(JSON.stringify(message)),{persistent: true});
}
