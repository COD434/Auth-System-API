
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
log:[
	{level:"warn", emit:"event"},
	{level:"info", emit:"event"},
	{level:"error", emit:"event"},
],
});


export type PrismaClientType = typeof prisma;

const connectDB = async (): Promise<void> => {
try{
await prisma.$connect();
console.log("Database connected successfully");
}catch(err) {
console.error("Database connection error:",err);
process.exit(1);
 }
};

process.on("beforeExit", async () => {
await prisma.$disconnect();
});

prisma.$on("warn",(e) => {
console.warn('Prisma warn',e)
})

prisma.$on("info",(e)=>{
console.info("Prisma info",e)
})

prisma.$on("error",(e)=>{
console.error("Prisma error",e)
})

export {prisma, connectDB}
