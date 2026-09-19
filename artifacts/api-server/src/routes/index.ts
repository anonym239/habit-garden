import { Router, type IRouter } from "express";
import healthRouter from "./health";
import gardenRouter from "./garden";
import aiRouter from "./ai";
import revenueRouter from "./revenue";
import billingRouter from "./billing";

const router: IRouter = Router();

router.use(healthRouter);
router.use(gardenRouter);
router.use(aiRouter);
router.use(revenueRouter);
router.use(billingRouter);

export default router;
