import dotenv from "dotenv";
import amqp from  "amqplib";
import {sendVerificationEmail} from "./email";
dotenv.config()

const StartWorking = async (retries = 5 ,delay = 5000) => {
	while(retries > 0){
	try{
const connection = await amqp.connect(process.env.RABBITMQ_URL!)
const channel = await connection.createChannel();
console.log("Connected to RabbitMQ");
await channel.assertQueue("emailQueue",{durable:true})

channel.consume("emailQueue",async (msg) =>{
if(msg !== null){
const {email,verifyToken} = JSON.parse(msg.content.toString())
await sendVerificationEmail(email,verifyToken);
console.log("Job received:", {email, verifyToken})
// TODO: SEND EMAIL HERE ...
channel.ack(msg)
}
})
break;

}catch(error){
console.error("Failed to connect to RabbitMQ:",error);
	      retries--;
	      if (retries ===0){
		      process.exit(1)
}
await new Promise((res) => setTimeout(res,delay));
}
	}
	}

StartWorking().catch(console.error);
