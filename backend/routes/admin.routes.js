import { Router } from 'express';
import * as adminController from '../controllers/adminController.js';

const router = Router();

router.post('/generate-token', adminController.generateToken);
router.get('/tokens', adminController.getAllTokens);
router.post('/token-status', adminController.updateTokenStatus);
router.post('/reset-token-device', adminController.resetTokenDevice);
router.delete('/tokens/:tokenCode', adminController.deleteToken);

export default router;
