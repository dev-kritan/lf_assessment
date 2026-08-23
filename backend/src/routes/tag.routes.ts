import { Router } from 'express';
import { TagController } from '../controllers/tag.controller';
import { authenticate, optionalAuthenticate } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', optionalAuthenticate, TagController.getAllTags);
router.post('/', authenticate, TagController.createTag);
router.get('/:id/usage', optionalAuthenticate, TagController.getTagUsage);
router.put('/:id', authenticate, TagController.updateTag);
router.delete('/:id', authenticate, TagController.deleteTag);

export default router;

