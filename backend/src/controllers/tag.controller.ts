import { Request, Response, NextFunction } from 'express';
import { TagService } from '../services/tag.service';
import { sendSuccess, sendCreated, sendError } from '../utils/response.utils';
import {
  validateDto,
  createTagSchema,
  updateTagSchema,
  tagQuerySchema,
  tagIdParamSchema,
} from '../dto';

export class TagController {
  static async getAllTags(req: Request, res: Response, next: NextFunction) {
    try {
      const queryValidation = validateDto(tagQuerySchema, req.query);
      if (!queryValidation.success) {
        return sendError(res, queryValidation.message, queryValidation.statusCode, queryValidation.errors, queryValidation.code);
      }

      const currentUserId = req.user?.userId;
      const isVerified = Boolean(req.user?.isEmailVerified);
      const tags = await TagService.getAllTags(queryValidation.data, currentUserId, isVerified);
      return sendSuccess(res, tags, 'Tags retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async createTag(req: Request, res: Response, next: NextFunction) {
    try {
      const bodyValidation = validateDto(createTagSchema, req.body);
      if (!bodyValidation.success) {
        return sendError(res, bodyValidation.message, bodyValidation.statusCode, bodyValidation.errors, bodyValidation.code);
      }

      const { name, colorHex } = bodyValidation.data;
      const tag = await TagService.createTag(name, colorHex);
      return sendCreated(res, tag, 'Tag created successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getTagUsage(req: Request, res: Response, next: NextFunction) {
    try {
      const paramValidation = validateDto(tagIdParamSchema, req.params);
      if (!paramValidation.success) {
        return sendError(res, paramValidation.message, paramValidation.statusCode, paramValidation.errors, paramValidation.code);
      }

      const tagId = paramValidation.data.id;
      const currentUserId = req.user?.userId;
      const isVerified = Boolean(req.user?.isEmailVerified);
      const usage = await TagService.getTagUsage(tagId, currentUserId, isVerified);
      return sendSuccess(res, usage, 'Tag usage retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async updateTag(req: Request, res: Response, next: NextFunction) {
    try {
      const paramValidation = validateDto(tagIdParamSchema, req.params);
      if (!paramValidation.success) {
        return sendError(res, paramValidation.message, paramValidation.statusCode, paramValidation.errors, paramValidation.code);
      }

      const bodyValidation = validateDto(updateTagSchema, req.body);
      if (!bodyValidation.success) {
        return sendError(res, bodyValidation.message, bodyValidation.statusCode, bodyValidation.errors, bodyValidation.code);
      }

      const tagId = paramValidation.data.id;
      const updatedTag = await TagService.updateTag(tagId, bodyValidation.data);
      return sendSuccess(res, updatedTag, 'Tag updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async deleteTag(req: Request, res: Response, next: NextFunction) {
    try {
      const paramValidation = validateDto(tagIdParamSchema, req.params);
      if (!paramValidation.success) {
        return sendError(res, paramValidation.message, paramValidation.statusCode, paramValidation.errors, paramValidation.code);
      }

      const tagId = paramValidation.data.id;
      const result = await TagService.deleteTag(tagId);
      return sendSuccess(res, result, 'Tag deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

