"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BonusController = void 0;
const bonus_service_1 = require("../services/bonus.service");
const response_utils_1 = require("../utils/response.utils");
class BonusController {
    static async getBonusData(req, res, next) {
        try {
            const data = await bonus_service_1.BonusService.getRawTables();
            return (0, response_utils_1.sendSuccess)(res, data, 'Bonus raw table data retrieved');
        }
        catch (error) {
            next(error);
        }
    }
    static async executeQ1(req, res, next) {
        try {
            const result = await bonus_service_1.BonusService.runQ1();
            return (0, response_utils_1.sendSuccess)(res, result, 'Query Q1 executed successfully');
        }
        catch (error) {
            next(error);
        }
    }
    static async executeQ2(req, res, next) {
        try {
            const result = await bonus_service_1.BonusService.runQ2();
            return (0, response_utils_1.sendSuccess)(res, result, 'Query Q2 executed successfully');
        }
        catch (error) {
            next(error);
        }
    }
    static async executeQ4(req, res, next) {
        try {
            const result = await bonus_service_1.BonusService.runQ4();
            return (0, response_utils_1.sendSuccess)(res, result, 'Query Q4 executed successfully');
        }
        catch (error) {
            next(error);
        }
    }
}
exports.BonusController = BonusController;
