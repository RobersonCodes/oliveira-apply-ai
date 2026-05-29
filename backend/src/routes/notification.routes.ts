import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { notificationController } from '../controllers/notification.controller';

const router = Router();
router.use(authenticate);

router.get('/', notificationController.list);
router.post('/read', notificationController.markRead);
router.delete('/:id', notificationController.delete);

export default router;
