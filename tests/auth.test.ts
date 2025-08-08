import sinon from "sinon"
import dotenv from "dotenv";
import chai from "chai";
import request from "supertest";

import app from  "../script";
import * as rabbitmq from "../prisma/config/Rabbitmq";
import {prisma} from "../prisma/config/validate"
import Redis from "ioredis";
dotenv.config({path:".env.test"});

process.env.REDIS_HOST= "localhost"
process.env.REDIS_PORT= "6379"

const expect = chai.expect;
const testPassword = "SuperSecret123";
const testEmail= "test0@email.com";

describe("User Auth flow",()=>{

const redis = new Redis({
host:process.env.REDIS_HOST,
port: Number(process.env.REDIS_PORT)
});

before(async()=>{
await prisma.user.deleteMany()
sinon.stub(rabbitmq,"publishToQueue").resolves();
});

after(async()=>{
await redis.quit();
await prisma.$disconnect();
sinon.restore();
});

it("should register and then log in the user",async()=>{
const register = await request(app).post("/register").send({
email:testEmail,
password: testPassword,
})

expect(register.status).to.equal(200);

const login = await request(app).post("/login").send({
email:testEmail,
password:testPassword,
})

expect(login.status).to.equal(200);
expect(login.body.user).to.have.property("accessToken");
expect(login.body.user.email).to.equal(testEmail);
 });
});

