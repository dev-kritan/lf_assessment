"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
exports.testDbConnection = testDbConnection;
const knex_1 = __importDefault(require("knex"));
const knexfile_1 = __importDefault(require("./knexfile"));
const env_1 = require("./env");
const logger_1 = require("../utils/logger");
const environment = env_1.config.nodeEnv || 'development';
const environmentConfig = knexfile_1.default[environment] || knexfile_1.default.development;
exports.db = (0, knex_1.default)(environmentConfig);
async function testDbConnection() {
    try {
        await exports.db.raw('SELECT 1');
        logger_1.logger.info(`✅ Database connected successfully (${environmentConfig.client})`);
        return true;
    }
    catch (error) {
        logger_1.logger.error('❌ Database connection failed:', error);
        return false;
    }
}
exports.default = exports.db;
