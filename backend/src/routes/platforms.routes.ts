import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { platformsController } from '../controllers/platforms.controller';

const router = Router();
router.use(authenticate);

router.post('/search', platformsController.searchAll);
router.get('/list', platformsController.getPlatforms);

export default router;
