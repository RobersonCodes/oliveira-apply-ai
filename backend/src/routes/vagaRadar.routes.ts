import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { requirePlan } from '../middlewares/plan.middleware';
import { vagaRadarController } from '../controllers/vagaRadar.controller';
import { Request, Response, NextFunction } from 'express';
import { jobSearchService } from '../services/jobSearch.service';

const router = Router();
router.use(authenticate);

// Job search — available to all plans
router.post('/search-jobs', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { query, location, sources = ['indeed', 'infojobs'], limit = 10 } = req.body;
    if (!query) return res.status(400).json({ error: 'query é obrigatório' });
    const jobs = await jobSearchService.search(query, location || '', sources, limit);
    res.json({ success: true, data: jobs, total: jobs.length });
  } catch (err) { next(err); }
});

// PRO only routes
router.use(requirePlan('PRO'));
router.post('/analyze', vagaRadarController.analyze);
router.get('/demo', vagaRadarController.demo);
router.get('/signal-types', vagaRadarController.getSignalTypes);

export default router;