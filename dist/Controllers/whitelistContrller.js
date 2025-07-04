"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminController = void 0;
const security_1 = require("../prisma/config/security");
exports.adminController = {
    addIP: async (req, res) => {
        try {
            const { ip, ttl } = req.body;
            if (!ip) {
                res.status(400).json({ error: "IP address require" });
                return;
            }
            await security_1.dynamicWhiteList.addIP(ip, ttl);
            res.json({ message: `IP ${ip} added to whitelist` });
        }
        catch (err) {
            if (err instanceof Error) {
                res.status(500).json({ error: err.message });
            }
        }
    },
    removeIP: async (req, res) => {
        try {
            const { ip } = req.body;
            if (!ip) {
                res.status(400).json({ error: "IP address required" });
                return;
            }
            await security_1.dynamicWhiteList.removeIP(ip);
            res.json({ message: `IP ${ip} removed from whitelist` });
        }
        catch (err) {
            if (err instanceof Error) {
                res.status(500).json({ error: err.message });
            }
        }
    },
    listIP: async (req, res) => {
        try {
            const ips = await security_1.dynamicWhiteList.listIP();
            res.json({ whitelisted_ips: ips });
        }
        catch (err) {
            if (err instanceof Error) {
                res.status(500).json({ error: err.message });
            }
        }
    }
};
