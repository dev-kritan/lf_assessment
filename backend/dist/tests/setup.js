"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const knex_1 = __importDefault(require("../src/config/knex"));
beforeAll(async () => {
    // Run migrations and seeds on the test database
    await knex_1.default.migrate.latest({
        directory: './database/migrations',
    });
    await knex_1.default.seed.run({
        directory: './database/seeds',
    });
});
afterAll(async () => {
    await knex_1.default.destroy();
});
