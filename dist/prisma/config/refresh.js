"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshTokenController = void 0;
const Rvalidation_1 = require("./Rvalidation");
const refreshTokenController = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        const newAccessToken = await (0, Rvalidation_1.validateAndRefreshToken)(refreshToken);
        res.json({ accessToken: newAccessToken });
    }
    catch (err) {
        const status = err.message === "Missing token" ? 401 : 403;
        res.status(status).json({ message: err.message });
    }
};
exports.refreshTokenController = refreshTokenController;
