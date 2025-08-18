import dotenv from "dotenv";
import amqp from "amqplib";
dotenv.config()

let channel:   amqp.Channel;

export const initRabbitMq = async(maxRetries = 10, retryDelay = 3000) => {
	let retryCount = 0;
	const retry = async(): Promise<void> =>{
		try{
const connection = await amqp.connect(process.env.RABBITMQ_URL!)
channel = await connection.createChannel();
await channel.assertQueue("emailQueue",{durable:true});
//await channel.assertQueue("otpMAIL", {durable:true});
console.log("Rabbitmq has connected successfully");
}catch(err){
retryCount++;
if (retryCount >= maxRetries){
console.error("Max retries reached.Failed to connect to RabbitMQ:",err)
throw err;
}
console.warn("Connection failed");
await new Promise(resolve => setTimeout(resolve,retryDelay));
return retry();
}
	}
	return retry()
}


export const publishToQueue = async (queue: string, message: any)=>{
if(!channel)
throw new Error("RabbitMQ channel not initialized");
channel.sendToQueue(queue,Buffer.from(JSON.stringify(message)),{persistent: true});
}

