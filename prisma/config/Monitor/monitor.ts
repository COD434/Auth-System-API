import client from "prom-client";
import express from "express";
const app = express();

 const register =  new client.Registry();

client.collectDefaultMetrics({register});

export const loginCount = new client.Counter({
name:'login_requests_total',
help:'Total number of login req'
})
export const RatelimitAllowed = new client.Counter({
name:"Login_requests_Allowed",
help:"Total_number_of allowed_requests"
})
export const RatelimitsBlocked = new client.Counter({
name:"Login_Attempts_Blocked",
help:"Total_number_of_requests_blocked"
})
export const guestCounter = new client.Counter({
name:"Guest_visited",
help:"Total_number_visited",
labelNames:["endpoint"]
})
export const guestBlocked =new client.Counter({
name:"guests_Blocked",
help:"total_guests_blocked",
labelNames:["endpoint","method"]})
export const errorCounter = new client.Counter({
name:'error_events_total',
help:'Total number of error events'
})
export const redisOps = new client.Counter({
name:"redis_operations_total",
help:"Total number f Redis GET/SET operations"
})
export const authSuccessCounter = new client.Counter({
name:"auth_success_total",
help:"Number of successful auhentications"
})
export const businessKPI = new client.Gauge({
name:"business_kpi_active_users",
help:"Number of currently active users"
})
register.registerMetric(loginCount);
register.registerMetric(errorCounter);
register.registerMetric(redisOps);
register.registerMetric(authSuccessCounter);
register.registerMetric(businessKPI)
register.registerMetric(RatelimitsBlocked)
register.registerMetric(RatelimitAllowed)
register.registerMetric(guestCounter)
register.registerMetric(guestBlocked)
export const Metrics =async (req:any, res:any)=>{
res.set("Content-Type",register.contentType);
res.end(await register.metrics());
};

