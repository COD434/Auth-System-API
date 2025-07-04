"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerUihandler = exports.swaggerSpec = void 0;
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swaggerDefinition = {
    openapi: "3.0.0",
    info: {
        title: "Secure API",
        version: "1.0.0",
        description: "This is Documentatio for  my secure API which is JWT-based and uses toen bucket algorithm for  ratelimiting"
    },
    servers: [{
            url: "http://localhost:3000",
            description: "Development server",
        },
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT"
            }
        }
    },
    security: [{ bearerAuth: [] }]
};
const options = {
    swaggerDefinition,
    apis: ["../script.ts", ".../routes/*.ts", ".../Controllers/*.ts"]
};
exports.swaggerSpec = (0, swagger_jsdoc_1.default)(options);
exports.swaggerUihandler = swagger_ui_express_1.default;
