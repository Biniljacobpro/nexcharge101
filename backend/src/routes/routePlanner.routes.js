import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { planRoute } from '../controllers/routePlanner.controller.js';

const router = Router();

// All route planner routes require authentication
router.use(requireAuth);

// Plan a multi-stop EV route
router.post('/', planRoute);

export default router;