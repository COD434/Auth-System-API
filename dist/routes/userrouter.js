"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = void 0;
const express_1 = require("express");
const whitelistContrller_1 = require("../Controllers/whitelistContrller");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const authController_1 = require("../Controllers/authController");
const jwtAuth_1 = require("../prisma/config/jwtAuth");
const refresh_1 = require("../prisma/config/refresh");
const router = (0, express_1.Router)();
router.use((0, cookie_parser_1.default)());
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
exports.asyncHandler = asyncHandler;
router.post("/logout", jwtAuth_1.authenticateJWT, (req, res) => {
    res.clearCookie("token").json({ success: true, message: "Logged out" });
});
router.post("/admin/refresh-token", authController_1.requireAdmin, jwtAuth_1.authenticateJWT, refresh_1.refreshTokenController);
router.post("/admin/whitelist/add", authController_1.requireAdmin, jwtAuth_1.authenticateJWT, whitelistContrller_1.adminController.addIP);
router.post("/admin/whitelist/remove", authController_1.requireAdmin, jwtAuth_1.authenticateJWT, whitelistContrller_1.adminController.removeIP);
router.get("/admin/whitelist/list", authController_1.requireAdmin, jwtAuth_1.authenticateJWT, whitelistContrller_1.adminController.listIP);
router.get("/verify-email", (0, authController_1.VerificationOfEmail)());
router.get("/guest", authController_1.Incognito);
exports.default = router;
