import { Router } from 'express';
import healthRoutes from './health.js';
import prescriptionRoutes from './prescriptions.js';
import eligibilityRoutes from './eligibility.js';
import campaignRoutes from './campaigns.js';
import communicationRoutes from './communications.js';
import summaryRoutes from './summary.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/prescriptions', prescriptionRoutes);
router.use('/eligibility', eligibilityRoutes);
router.use('/campaigns', campaignRoutes);
router.use('/communications', communicationRoutes);
router.use('/summary', summaryRoutes);

export default router;
