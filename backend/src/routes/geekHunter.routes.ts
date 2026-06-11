import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { geekHunterController } from '../controllers/geekHunter.controller';

const router = Router();
router.use(authenticate);

router.post('/search', geekHunterController.search);
router.post('/start', geekHunterController.startAutomation);
router.get('/skills', geekHunterController.getSkillCategories);

export default router;
