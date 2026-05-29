import { Router } from 'express';
import { authenticate, requireRole } from '../middlewares/auth.middleware';
import { adminController } from '../controllers/admin.controller';

const router = Router();
router.use(authenticate, requireRole('ADMIN'));

router.get('/stats', adminController.getStats);
router.get('/users', adminController.listUsers);
router.patch('/users/:id/toggle', adminController.toggleUser);
router.get('/audit-logs', adminController.getAuditLogs);
router.get('/automations', adminController.getAutomations);

export default router;
