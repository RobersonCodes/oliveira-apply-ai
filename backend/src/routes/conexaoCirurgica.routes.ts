import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { conexaoCirurgicaController } from "../controllers/conexaoCirurgica.controller";
const router = Router();
router.use(authenticate);
router.post("/strategy", conexaoCirurgicaController.createStrategy);
router.post("/comment", conexaoCirurgicaController.generateComment);
export default router;
