import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { neuralController } from '../controllers/neural.controller';

const router = Router();
router.use(authenticate);

// Prediz score de uma vaga
router.post('/predict', neuralController.predict);

// Prediz score de múltiplas vagas e ranqueia
router.post('/predict/batch', neuralController.batchPredict);

// Treina/retreina modelo com histórico do usuário
router.post('/train', neuralController.train);

// Stats do modelo (precisão, feature importance, histórico de predições)
router.get('/stats', neuralController.getStats);

// Atualiza threshold de score mínimo para aplicar
router.patch('/threshold', neuralController.updateThreshold);

// Sincroniza outcome de uma candidatura e retreina
router.post('/sync/:applicationId', neuralController.syncOutcome);

export default router;
