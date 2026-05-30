import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { shadowApplyController } from "../controllers/shadowApply.controller";
const router = Router();
router.use(authenticate);
router.post("/persona", shadowApplyController.generatePersona);
router.post("/receptivity", shadowApplyController.analyzeReceptivity);
router.post("/analyze", shadowApplyController.fullAnalysis);
export default router;
