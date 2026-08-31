import { Router } from 'express';
import { TagController } from '../controllers/tag.controller';
import { authenticate, optionalAuthenticate, requireVerified } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createTagSchema, updateTagSchema } from '../dto';

const router = Router();

router.get('/', optionalAuthenticate, TagController.getAllTags);
router.post('/', authenticate, requireVerified, validate(createTagSchema), TagController.createTag);
router.get('/:id/usage', optionalAuthenticate, TagController.getTagUsage);
router.put('/:id', authenticate, requireVerified, validate(updateTagSchema), TagController.updateTag);
router.delete('/:id', authenticate, requireVerified, TagController.deleteTag);

export default router;

