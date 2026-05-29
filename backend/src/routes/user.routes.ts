import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { userController } from '../controllers/user.controller';
import { UpdateProfileDto, ChangePasswordDto } from '../dtos/auth.dto';

const router = Router();
router.use(authenticate);

router.get('/profile', userController.getProfile);
router.put('/profile', validate(UpdateProfileDto), userController.updateProfile);
router.post('/change-password', validate(ChangePasswordDto), userController.changePassword);
router.get('/usage', userController.getUsageStats);
router.delete('/account', userController.deleteAccount);

export default router;
