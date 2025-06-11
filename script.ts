require("dotenv").config();
delete require.cache[require.resolve("./prisma/config/redis")];
delete require.cache[require.resolve("./prisma/config/session")];
import express from "express";
import path from "path"
import { Request, Response,NextFunction } from "express"
import session from "express-session";
import passport from "passport";
import  {setupRedis} from "./prisma/config/redis";
import { getSessionConfig } from "./prisma/config/session";
import {seedAdmin} from "./prisma/config/admin"
import { connectDB } from "./prisma/config/validate";
import {authenticateJWT} from "./prisma/config/jwtAuth"
import { securityHeaders } from "./prisma/config/security";
import { createPassportConfig } from "./Controllers/passportContrller";
import {register,
        login,
        //verifyEmail,
        verifyResetOTP,
        UpdatePassword,
        userValidations,
        Lvalidations,
        vAL,
        requestPassword,
} from "./Controllers/authController"
import {router} from "./routes/userrouter";
import cookieParser from "cookie-parser"
import {initializeRateLimiter,OTPLimiterMiddleware,LoginLimiterMiddleware} from "./prisma/config/OTPlimit";



const app = express();

// Database connection
connectDB();
seedAdmin();

// View engine setup
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(securityHeaders)


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
//const sessionConfig = await getSessionConfig();

//app.use(session({
//...sessionConfig,
//store: redisStore
//}));
  await initializeRateLimiter()
  // Passport initialization
  
  //app.use(passport.initialize());
  //app.use(passport.session());

  // Routes
  app.use("/api/auth", router);
  
  // Auth routes
  app.post("/request-password-reset",OTPLimiterMiddleware(),requestPassword as express.RequestHandler)
  app.post("/verify-reset-otp",verifyResetOTP as express.RequestHandler );
  app.post("/update-password",UpdatePassword   as express.RequestHandler )
  app.post("/register",Lvalidations,vAL as express.RequestHandler, register  as express.RequestHandler );
  app.post("/login", vAL as express.RequestHandler,LoginLimiterMiddleware() ,login );
  //app.get("/verify-email",verifyEmail );
app.get("/profile",authenticateJWT,(req ,res)=>{
  res.json({message: "Secure domain", user:req.user})
  })  

interface ErrorWithStatus extends Error{
status?: number;
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
  
  

app.get(/(.*)/,(req,res)=>{
  res.status(404).json({
  actualUrlHit: req.url,
  method: req.method,
  availableRoutes:["POST /login",
  "POST /register",
  "GET /debug" ]
   });
  });
  // Start server
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
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
