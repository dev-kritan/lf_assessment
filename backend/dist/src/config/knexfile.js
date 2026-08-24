"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const env_1 = require("./env");
const migrationsPath = path_1.default.resolve(__dirname, '../../database/migrations');
const seedsPath = path_1.default.resolve(__dirname, '../../database/seeds');
const knexConfig = {
    development: {
        client: env_1.config.db.client,
        connection: env_1.config.db.client === 'better-sqlite3'
            ? { filename: env_1.config.db.filename }
            : {
                host: env_1.config.db.host,
                port: env_1.config.db.port,
                user: env_1.config.db.user,
                password: env_1.config.db.password,
                database: env_1.config.db.database,
                charset: 'utf8mb4',
            },
        useNullAsDefault: env_1.config.db.client === 'better-sqlite3',
        pool: env_1.config.db.client === 'better-sqlite3' ? { min: 1, max: 1 } : { min: 2, max: 10 },
        migrations: {
            directory: migrationsPath,
            extension: 'ts',
        },
        seeds: {
            directory: seedsPath,
            extension: 'ts',
        },
    },
    test: {
        client: 'better-sqlite3',
        connection: {
            filename: ':memory:',
        },
        useNullAsDefault: true,
        pool: { min: 1, max: 1 },
        migrations: {
            directory: migrationsPath,
            extension: 'ts',
        },
        seeds: {
            directory: seedsPath,
            extension: 'ts',
        },
    },
    production: {
        client: 'mysql2',
        connection: {
            host: env_1.config.db.host,
            port: env_1.config.db.port,
            user: env_1.config.db.user,
            password: env_1.config.db.password,
            database: env_1.config.db.database,
            charset: 'utf8mb4',
        },
        pool: { min: 2, max: 20 },
        migrations: {
            directory: migrationsPath,
            extension: 'ts',
        },
        seeds: {
            directory: seedsPath,
            extension: 'ts',
        },
    },
};
exports.default = knexConfig;
