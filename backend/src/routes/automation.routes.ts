import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { automationController } from '../controllers/automation.controller';
import { CreateAutomationDto, UpdateAutomationDto, LinkedInCredentialsDto } from '../dtos/automation.dto';

const router = Router();
router.use(authenticate);

router.get('/', automationController.list);
router.post('/', validate(CreateAutomationDto), automationController.create);
router.get('/:id', automationController.getById);
router.put('/:id', validate(UpdateAutomationDto), automationController.update);
router.delete('/:id', automationController.delete);
router.post('/:id/start', automationController.start);
router.post('/:id/stop', automationController.stop);
router.get('/:id/logs', automationController.getLogs);
router.post('/linkedin/credentials', validate(LinkedInCredentialsDto), automationController.saveLinkedInCredentials);

export default router;
