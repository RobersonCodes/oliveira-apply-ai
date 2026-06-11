import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { indeedController } from '../controllers/indeed.controller';

const router = Router();
router.use(authenticate);

router.post('/search', indeedController.search);
router.post('/start', indeedController.startAutomation);
router.get('/countries', indeedController.getCountries);

export default router;
