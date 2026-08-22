import { Router } from 'express';
import { TagController } from '../controllers/tag.controller';
import { authenticate, optionalAuthenticate } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', optionalAuthenticate, TagController.getAllTags);
router.post('/', authenticate, TagController.createTag);

export default router;
