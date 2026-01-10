import { Router } from 'express';
import * as paymentController from '../controllers/paymentController.js';

const router = Router();

router.post('/verify-paystack', paymentController.verifyPaystack);

export default router;
