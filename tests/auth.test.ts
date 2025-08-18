import path from "path"
import {seedAdmin} from "../prisma/config/admin"
import sinon from "sinon"
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import {execSync}from "child_process";
import chai from "chai";
import request from "supertest";
import app from  "../script";
import {genOTP } from "../prisma/config/email";
import * as rabbitmq from "../prisma/config/Rabbitmq";
import {prisma} from "../prisma/config/validate"
import Redis from "ioredis";
dotenv.config({
	path:path.resolve(process.cwd(),".env.test"),
	override:true
});


const expect = chai.expect;
const newPass = "3000Hunnids#@"
const testPassword = "1234Hunnids#@";
const testEmail= "seeisakarabo461@email.com";
const userName = "tester";
const OTP = genOTP()

describe("User Auth flow",()=>{

const redis = new Redis({
host:process.env.REDIS_HOST,
port: Number(process.env.REDIS_PORT)
});

before(async function(){
this.timeout(1110000);

console.log("Using DB:",process.env.DATABASE_URL);
execSync("npx prisma migrate deploy --schema=prisma/schema.prisma", { stdio: "inherit" })

console.log("Connecting to DB...")
await prisma.$connect();

await cleanDatabase();
console.log("seeding admin...")
await seedAdmin();

sinon.stub(rabbitmq,"publishToQueue").resolves();

});

after(async()=>{
await redis.quit();
await prisma.$disconnect();
sinon.restore();
});

 async function cleanDatabase() {
    const tablenames = await prisma.$queryRaw<
      Array<{ tablename: string }>
    >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

    for (const { tablename } of tablenames) {
      if (tablename !== "_prisma_migrations") {
        try {
          await prisma.$executeRawUnsafe(
            `TRUNCATE TABLE "public"."${tablename}" CASCADE;`
          );
        } catch (error) {
          console.log({ error });
        }
      }
    }
  }

it("should register and then log in the user",async()=>{
const register = await request(app).post("/register").send({
username:userName,
email:testEmail,
password: testPassword,
})

expect(register.status).to.equal(200);

const login = await request(app).post("/login").send({
username:userName,	
email:testEmail,
password:testPassword,
})
const requestPassReset =await request(app).post("/request-password-reset").send({
email:testEmail
})
const verifyOTP= await request(app).post("/verify-reset-otp").send({
email:testEmail
//otp:OTP
})
const passUpdate = await request(app).post("/update-password").send({
email:testEmail,
password:newPass
})
expect(passUpdate.status).to.equal(200)
expect(verifyOTP.status).to.equal(200)
expect(requestPassReset.status).to.equal(200)
expect(login.status).to.equal(200);
expect(login.body.user).to.have.property("accessToken");
expect(login.body.user.email).to.equal(testEmail);

});
});
