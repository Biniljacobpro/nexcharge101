import { Router } from 'express';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import { overview, liveStats, listUsers, addCorporateAdmin, listCorporateAdmins, updateCorporateAdminStatus, listStations, updateStationStatus, updateStationManager, updateUserStatus } from '../controllers/admin.controller.js';

const router = Router();

router.use(requireAuth, requireRole('admin'));

router.get('/overview', overview);
router.get('/stats/live', liveStats);
router.get('/users', listUsers);
router.put('/users/:id/status', updateUserStatus);
router.get('/corporate-admins', listCorporateAdmins);
router.post('/add-corporate-admin', addCorporateAdmin);
router.put('/corporate-admins/:id/status', updateCorporateAdminStatus);

// Station management
router.get('/stations', listStations);
router.patch('/stations/:id/status', updateStationStatus);
router.patch('/stations/:id/manager', updateStationManager);

export default router;


