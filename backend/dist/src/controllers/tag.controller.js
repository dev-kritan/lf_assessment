"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TagController = void 0;
const tag_service_1 = require("../services/tag.service");
const response_utils_1 = require("../utils/response.utils");
const dto_1 = require("../dto");
class TagController {
    static async getAllTags(req, res, next) {
        try {
            const queryValidation = (0, dto_1.validateDto)(dto_1.tagQuerySchema, req.query);
            if (!queryValidation.success) {
                return (0, response_utils_1.sendError)(res, queryValidation.message, queryValidation.statusCode, queryValidation.errors, queryValidation.code);
            }
            const currentUserId = req.user?.userId;
            const tags = await tag_service_1.TagService.getAllTags(queryValidation.data, currentUserId);
            return (0, response_utils_1.sendSuccess)(res, tags, 'Tags retrieved successfully');
        }
        catch (error) {
            next(error);
        }
    }
    static async createTag(req, res, next) {
        try {
            const bodyValidation = (0, dto_1.validateDto)(dto_1.createTagSchema, req.body);
            if (!bodyValidation.success) {
                return (0, response_utils_1.sendError)(res, bodyValidation.message, bodyValidation.statusCode, bodyValidation.errors, bodyValidation.code);
            }
            const { name, colorHex } = bodyValidation.data;
            const tag = await tag_service_1.TagService.createTag(name, colorHex);
            return (0, response_utils_1.sendCreated)(res, tag, 'Tag created successfully');
        }
        catch (error) {
            next(error);
        }
    }
    static async getTagUsage(req, res, next) {
        try {
            const paramValidation = (0, dto_1.validateDto)(dto_1.tagIdParamSchema, req.params);
            if (!paramValidation.success) {
                return (0, response_utils_1.sendError)(res, paramValidation.message, paramValidation.statusCode, paramValidation.errors, paramValidation.code);
            }
            const tagId = paramValidation.data.id;
            const currentUserId = req.user?.userId;
            const usage = await tag_service_1.TagService.getTagUsage(tagId, currentUserId);
            return (0, response_utils_1.sendSuccess)(res, usage, 'Tag usage retrieved successfully');
        }
        catch (error) {
            next(error);
        }
    }
    static async updateTag(req, res, next) {
        try {
            const paramValidation = (0, dto_1.validateDto)(dto_1.tagIdParamSchema, req.params);
            if (!paramValidation.success) {
                return (0, response_utils_1.sendError)(res, paramValidation.message, paramValidation.statusCode, paramValidation.errors, paramValidation.code);
            }
            const bodyValidation = (0, dto_1.validateDto)(dto_1.updateTagSchema, req.body);
            if (!bodyValidation.success) {
                return (0, response_utils_1.sendError)(res, bodyValidation.message, bodyValidation.statusCode, bodyValidation.errors, bodyValidation.code);
            }
            const tagId = paramValidation.data.id;
            const updatedTag = await tag_service_1.TagService.updateTag(tagId, bodyValidation.data);
            return (0, response_utils_1.sendSuccess)(res, updatedTag, 'Tag updated successfully');
        }
        catch (error) {
            next(error);
        }
    }
    static async deleteTag(req, res, next) {
        try {
            const paramValidation = (0, dto_1.validateDto)(dto_1.tagIdParamSchema, req.params);
            if (!paramValidation.success) {
                return (0, response_utils_1.sendError)(res, paramValidation.message, paramValidation.statusCode, paramValidation.errors, paramValidation.code);
            }
            const tagId = paramValidation.data.id;
            const result = await tag_service_1.TagService.deleteTag(tagId);
            return (0, response_utils_1.sendSuccess)(res, result, 'Tag deleted successfully');
        }
        catch (error) {
            next(error);
        }
    }
}
exports.TagController = TagController;
