"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAccessToken = generateAccessToken;
exports.generateRefreshToken = generateRefreshToken;
exports.verifyAccessToken = verifyAccessToken;
exports.verifyRefreshToken = verifyRefreshToken;
exports.hashToken = hashToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const env_1 = require("../config/env");
function generateAccessToken(payload) {
    return jsonwebtoken_1.default.sign(payload, env_1.config.jwt.secret, {
        expiresIn: env_1.config.jwt.expiresIn,
    });
}
function generateRefreshToken(payload) {
    return jsonwebtoken_1.default.sign(payload, env_1.config.jwt.refreshSecret, {
        expiresIn: env_1.config.jwt.refreshExpiresIn,
        jwtid: crypto_1.default.randomUUID(),
    });
}
function verifyAccessToken(token) {
    return jsonwebtoken_1.default.verify(token, env_1.config.jwt.secret);
}
function verifyRefreshToken(token) {
    return jsonwebtoken_1.default.verify(token, env_1.config.jwt.refreshSecret);
}
function hashToken(token) {
    return crypto_1.default.createHash('sha256').update(token).digest('hex');
}
