//import {PrismaClient} from "@prisma/client";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import {prisma} from "./validate";
dotenv.config();


const AwaitAdmin= async (retries = 5 ) =>{
while(retries > 0){
try{
await prisma.$connect();
await prisma.user.findFirst();
return;
}catch(err){
console.warn("Waiting for DB to be ready...");
retries--;
await new Promise((r) =>setTimeout(r,2000));
}
}
throw new Error("Database not ready after retries");
}


export const seedAdmin = async () =>{
	try{ 
await AwaitAdmin()
const existingAdmin = await prisma.user.findFirst({
where:{
role:"ADMIN"
 }
})
if(!existingAdmin){
const hashedPassword = await bcrypt.hash(process.env.PASS!,10)
const admin = await prisma.user.create({
data:{
email:process.env.ADMIN_EMAIL!,
username:process.env.ADMIN_USERNAME!,
password:hashedPassword,
role:"ADMIN",
isVerified:true,
}
});
console.log("Admin user created:",admin.email);
}else{
console.log("Admin user already exists:",existingAdmin.email)
 }
	}catch(err){
	console.error("Failed to seed admin")
	}
}

