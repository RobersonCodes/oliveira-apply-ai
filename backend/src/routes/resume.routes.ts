import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { uploadResume } from '../middlewares/upload.middleware';
import { resumeController } from '../controllers/resume.controller';

const router = Router();
router.use(authenticate);

router.get('/', resumeController.list);
router.post('/upload', uploadResume.single('resume'), resumeController.upload);
router.post('/adapt', resumeController.adapt);
router.post('/cover-letter', resumeController.generateCoverLetter);
router.post('/analyze-match', resumeController.analyzeMatch);
router.post('/interview-prep', resumeController.interviewPrep);
router.delete('/:id', resumeController.delete);

export default router;
