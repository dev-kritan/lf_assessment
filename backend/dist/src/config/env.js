"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
exports.config = {
    port: parseInt(process.env.PORT || '5000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
    isTest: process.env.NODE_ENV === 'test',
    isProd: process.env.NODE_ENV === 'production',
    db: {
        client: process.env.DB_CLIENT || (process.env.NODE_ENV === 'test' ? 'better-sqlite3' : 'mysql2'),
        host: process.env.DB_HOST || '127.0.0.1',
        port: parseInt(process.env.DB_PORT || '3306', 10),
        user: process.env.DB_USER || 'eventuser',
        password: process.env.DB_PASSWORD || 'eventpassword',
        database: process.env.DB_NAME || 'event_planner_db',
        filename: process.env.DB_FILENAME || path_1.default.resolve(__dirname, '../../database/event_planner.sqlite'),
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'fallback-secret-key-for-development-mode-32-chars',
        expiresIn: process.env.JWT_EXPIRES_IN || '15m',
        refreshSecret: process.env.REFRESH_TOKEN_SECRET || 'fallback-refresh-secret-key-32-chars',
        refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
    },
    cookieSecret: process.env.COOKIE_SECRET || 'fallback-cookie-secret',
    appName: process.env.APP_NAME || 'EventPlanner',
};
