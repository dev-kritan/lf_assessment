"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TagController = void 0;
const tag_service_1 = require("../services/tag.service");
const response_utils_1 = require("../utils/response.utils");
class TagController {
    static async getAllTags(req, res, next) {
        try {
            const { event_type, timeframe, search } = req.query;
            const currentUserId = req.user?.userId;
            const tags = await tag_service_1.TagService.getAllTags({ event_type, timeframe, search }, currentUserId);
            return (0, response_utils_1.sendSuccess)(res, tags, 'Tags retrieved successfully');
        }
        catch (error) {
            next(error);
        }
    }
    static async createTag(req, res, next) {
        try {
            const { name, colorHex } = req.body;
            const tag = await tag_service_1.TagService.createTag(name, colorHex);
            return (0, response_utils_1.sendCreated)(res, tag, 'Tag created successfully');
        }
        catch (error) {
            next(error);
        }
    }
    static async getTagUsage(req, res, next) {
        try {
            const tagId = Number(req.params.id);
            if (isNaN(tagId) || tagId <= 0) {
                return res.status(400).json({ success: false, error: { message: 'Invalid tag ID' } });
            }
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
            const tagId = Number(req.params.id);
            if (isNaN(tagId) || tagId <= 0) {
                return res.status(400).json({ success: false, error: { message: 'Invalid tag ID' } });
            }
            const { name, colorHex } = req.body;
            const updatedTag = await tag_service_1.TagService.updateTag(tagId, { name, colorHex });
            return (0, response_utils_1.sendSuccess)(res, updatedTag, 'Tag updated successfully');
        }
        catch (error) {
            next(error);
        }
    }
    static async deleteTag(req, res, next) {
        try {
            const tagId = Number(req.params.id);
            if (isNaN(tagId) || tagId <= 0) {
                return res.status(400).json({ success: false, error: { message: 'Invalid tag ID' } });
            }
            const result = await tag_service_1.TagService.deleteTag(tagId);
            return (0, response_utils_1.sendSuccess)(res, result, 'Tag deleted successfully');
        }
        catch (error) {
            next(error);
        }
    }
}
exports.TagController = TagController;
