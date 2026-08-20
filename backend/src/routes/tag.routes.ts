import { Router } from 'express';
import { TagController } from '../controllers/tag.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', TagController.getAllTags);
router.post('/', authenticate, TagController.createTag);

export default router;
