 import {initializeRedisClient} from "./prisma/config/redis"
import {initRabbitMq} from "./prisma/config/Rabbitmq"
import{loginCount, 
	errorCounter,
	redisOps,
	authSuccessCounter, 
	businessKPI} from './prisma/config/Monitor/monitor';
import {Metrics} from "./prisma/config/Monitor/monitor"
import express from "express";
import path from "path"
import { Request, Response,NextFunction } from "express"
import session from "express-session";
import passport from "passport";
import  {setupRedis} from "./prisma/config/redis";
import { getSessionConfig } from "./prisma/config/session";
import {seedAdmin} from "./prisma/config/admin"
import{Incognito} from "./Controllers/authController"
import { connectDB } from "./prisma/config/validate";
import {authenticateJWT} from "./prisma/config/jwtAuth"
import { securityHeaders } from "./prisma/config/security";
import { createPassportConfig } from "./Controllers/passportContrller";
import {swaggerSpec, swaggerUihandler} from "./prisma/config/swagger";
import {register,
        login,
        verifyResetOTP,
        UpdatePassword,
        userValidations,
        Lvalidations,
        vAL,
        requestPassword} from "./Controllers/authController";
import asyncHandler from "express-async-handler";
import router from "./routes/userrouter";
import cookieParser from "cookie-parser"
import {initializeRateLimiter,OTPLimiterMiddleware,LoginLimiterMiddleware} from "./prisma/config/OTPlimit";

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Login a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successful login
 *       401:
 *         description: Invalid credentials
 */ 


const app = express();
const activeUsers = async() =>{
const redisClient = await initializeRedisClient();
const keys = await redisClient.keys("session:*")
return keys.length
}
const KPI = async()=>{
const count =await activeUsers();
businessKPI.set(count);
}
// Database connection
connectDB();
seedAdmin();
loginCount.inc();
errorCounter.inc();
redisOps.inc();
authSuccessCounter.inc();
setInterval(KPI,30000);
initRabbitMq()

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(securityHeaders)
app.use("/api-docs",swaggerUihandler.serve,swaggerUihandler.setup(swaggerSpec))

app.use((req: Request ,res:Response, next:NextFunction)=>{
req.setTimeout(1000,()=>{
console.error(`Request timeout: ${req.method} ${req.url}`);
if (!res.headersSent){
res.status(503).json({error: "Request timeout"})
  }
 })
 next();
})
app.use((req, res, next)=>{
console.log(`Incoming request:${req.method} ${req.path}`)
next();
});
app.use((req, res, next)=>{
req.url =req.url.replace(/[\n\r%0A%0D]+$/, "");
next();
})

async function initializeApp () {
  try{
await connectDB
const { redisStore } = await setupRedis();


  await initializeRateLimiter()
  


  app.use("/api/auth", router);
  
  // Auth routes
  app.post("/request-password-reset",OTPLimiterMiddleware(),requestPassword as express.RequestHandler)
  app.post("/verify-reset-otp",verifyResetOTP as express.RequestHandler );
  app.post("/update-password",UpdatePassword   as express.RequestHandler )
  app.post("/register" ,...userValidations,asyncHandler(register)  );
  app.post("/login",LoginLimiterMiddleware(),Lvalidations,login as express.RequestHandler );
app.get("/metrics",Metrics)


interface ErrorWithStatus extends Error{
status?: number
}

app.use((err:ErrorWithStatus, req:Request, res:Response, next:NextFunction)=>{
console.error(`Error: ${err.message}`,{
path:req.path,
method: req.method,
stack:process.env.NODE_ENV === "development" ? err.stack : undefined
})
const status =err.status || 500;
res.status(status).json({
error:err.message || "Something went wrong",
...(process.env.NODE_ENV === "development" && {stack: err.stack})})
})


app.use((req, res)=>{
res.status(404).json({error: "Route not found"})
});
  
  const PORT =parseInt(process.env.PORT || "5000",10);
  app.listen(PORT,"0.0.0.0",() =>{
  console.log("Server running on port 5000")
  });



  } catch(err) {
  console.error("Failed to initialize application:",err)
  process.exit(1);
   }
  }
  initializeApp().catch(err =>{
  console.error("Critical initialization error:",err)
  process.exit(1);
  });
  export default app;
