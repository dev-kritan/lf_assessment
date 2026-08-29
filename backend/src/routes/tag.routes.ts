import { Router } from 'express';
import { TagController } from '../controllers/tag.controller';
import { authenticate, optionalAuthenticate, requireVerified } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', optionalAuthenticate, TagController.getAllTags);
router.post('/', authenticate, requireVerified, TagController.createTag);
router.get('/:id/usage', optionalAuthenticate, TagController.getTagUsage);
router.put('/:id', authenticate, requireVerified, TagController.updateTag);
router.delete('/:id', authenticate, requireVerified, TagController.deleteTag);

export default router;

