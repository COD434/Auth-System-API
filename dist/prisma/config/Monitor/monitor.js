"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Metrics = exports.businessKPI = exports.authSuccessCounter = exports.redisOps = exports.errorCounter = exports.RatelimitsBlocked = exports.RatelimitAllowed = exports.loginCount = void 0;
const prom_client_1 = __importDefault(require("prom-client"));
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
const register = new prom_client_1.default.Registry();
prom_client_1.default.collectDefaultMetrics({ register });
exports.loginCount = new prom_client_1.default.Counter({
    name: 'login_requests_total',
    help: 'Total number of login req'
});
exports.RatelimitAllowed = new prom_client_1.default.Counter({
    name: "Login_requests_Allowed",
    help: "Total_number_of allowed_requests"
});
exports.RatelimitsBlocked = new prom_client_1.default.Counter({
    name: "Login_Attempts_Blocked",
    help: "Total_number_of_requests_blocked"
});
exports.errorCounter = new prom_client_1.default.Counter({
    name: 'error_events_total',
    help: 'Total number of error events'
});
exports.redisOps = new prom_client_1.default.Counter({
    name: "redis_operations_total",
    help: "Total number f Redis GET/SET operations"
});
exports.authSuccessCounter = new prom_client_1.default.Counter({
    name: "auth_success_total",
    help: "Number of successful auhentications"
});
exports.businessKPI = new prom_client_1.default.Gauge({
    name: "business_kpi_active_users",
    help: "Number of currently active users"
});
register.registerMetric(exports.loginCount);
register.registerMetric(exports.errorCounter);
register.registerMetric(exports.redisOps);
register.registerMetric(exports.authSuccessCounter);
register.registerMetric(exports.businessKPI);
register.registerMetric(exports.RatelimitsBlocked);
register.registerMetric(exports.RatelimitAllowed);
const Metrics = async (req, res) => {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
};
exports.Metrics = Metrics;
