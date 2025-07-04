import dotenv from "dotenv"
import helmet from  "helmet";
import Redis from "ioredis"
import {RateLimiterRedis} from "rate-limiter-flexible";
import csrf from "csurf";                                                   
import jwt from "jsonwebtoken";
dotenv.config();
const IP_EXPIRATION_SECONDS = 7 * 24 * 60 * 60;

 interface CSPDirectives{
 [key: string]: Array<string | boolean>;
 }

interface DynamicWhiteList{
isAllowed : (ip:string)=> Promise<boolean>;
addIp: (ip: string)=> Promise<void>;
removeIp: (ip: string)=> Promise<void>;
getAll:() => Promise<string[]>;
middleware: () => (req:Request, res: Response, next:any)=> Promise<void>;
listIP:(ip:string)=> Promise<void>;
}

const JWT_SECRET =process.env.JWT_SECRET || "Boo";
const EXPIRY = "1h";

export const generateJWT = (payload:object)=>
jwt.sign(payload, JWT_SECRET,{expiresIn: EXPIRY});

export const verifyJWT = (token:  string)=>
jwt.verify(token, JWT_SECRET);






const redisClient = new Redis({
host:process.env.REDIS_HOST,
port:parseInt(process.env.REDIS_PORT || "6380"),
enableOfflineQueue: false,
retryStrategy:(times)=> Math.min(times * 50, 2000),
maxRetriesPerRequest:10
});
const WHITELIST_KEY = process.env.WHITELIST_KEY
export const dynamicWhiteList={
	
	isAllowed:async (ip: string): Promise<boolean> =>{
    try{
	    
	    const keys = await redisClient.keys("whitelist:ip:*");
	

      //const cidrs = await redisClient.sismember("ip-whitelist",ip);
      ///const isDirectMatch = cidrs.include(ip) || ip === "::1" || ip ==="217.0.0.1";
//if(const key of keys) {

for (const key of keys){
const entry = key.replace("whitelist:ip:","");
if(entry === ip || ip === "::1" || ip === "127.0.0.1"){
return true
}
if(entry.includes("/")){
const CIDR = (await import("ip-cidr")).default;
const cidr = new CIDR(entry);
if (cidr.contains(ip))return true
}
  
 }

return false;
    }catch(err){
    console.error("White check error:",err)
    return false
    }
	},
  
addIP:async (ipOrCIDR: string,ttl: number = IP_EXPIRATION_SECONDS) =>{
const key=`whitelist:ip:${ipOrCIDR}`;
await redisClient.sadd(key,"1");
await redisClient.expire(key,ttl)
  },
	removeIP:async(ipOrCIDR: string) =>{
	const key =`whitelist:ip:${ipOrCIDR}`;
	 await redisClient.srem(key,"1");
	 await redisClient.del(key);
	//console.log("removeIP route hit by:",(req as any).user);
  },
  listIP:async():Promise<string[]> =>{
	  const keys= await redisClient.keys("whitelist:ip:*");
	  return keys.map(key => key.replace("whitelist:ip:",""));
  },

  middleware: () => {
    return async (req:any ,res:Response ,next:any)=>{
      const clientIP= req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim()|| req.ip || req.headers.get;

      if(await dynamicWhiteList.isAllowed(clientIP)){
        return next();
      }
      console.warn(`Blocked request from IP: ${clientIP}`);
      //res.status(403).json({error:"Access denied"})
    };
  }
}



  const cspDirectives = {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'","'unsafe-inline'", "trusted-cdn.com"],
    styleSrc: ["'self'"],
    imgSrc: ["'self'", "data:","trusted-cdn.com"],
    fontSrc: ["'self'", "trusted-fonts.com"],
    connectSrc: ["'self'","api.trusted-domain.com"],
    frameSrc: ["'none'"],
    objectSrc: ["'none'"],
    upgradeInsecureRequests: [],
    reportUri:"/csp-violation-report"
  };

  const securityHeaders= [
      helmet.hsts({
        maxAge: 315353444,
        includeSubDomains: true,
        preload: true,
      }),
      helmet.contentSecurityPolicy({
        directives: cspDirectives,
        reportOnly:process.env.NODE_ENV !== "production"
      }),
      helmet.xssFilter(),
      helmet.noSniff(),
      helmet.frameguard({action:"deny"}),
      helmet.referrerPolicy({policy:"same-origin"}),
     
      
    ];

  
//app.use(securityHeadersi)
const ratelimiter = new RateLimiterRedis({
storeClient: redisClient,
keyPrefix: "rate_limit",
points: 100,
duration: 60,
blockDuration:300
});

const rateLimiterM = (req: any, res:Response, next:any)=>{
ratelimiter.consume(req.ip)
.then(()=> next())
//.catch(()=> res.status(429).send("Too Many Request"))
};
//app.use(rateLimiterM)

//const csrfProtection = csrf({cookie:true});
//app.use(csrfProtection);
redisClient.on("error", (err)=>{
console.error("Security Redis error:",err)
});

redisClient.on("connect",()=>{
console.log("Security Redis connected to:",  redisClient.options.host)
})



export {securityHeaders}

