import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { vagaRadarController } from "../controllers/vagaRadar.controller";
const router = Router();
router.use(authenticate);
router.post("/analyze", vagaRadarController.analyze);
router.get("/demo", vagaRadarController.demo);
router.get("/signal-types", vagaRadarController.getSignalTypes);
export default router;
