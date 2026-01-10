import { Router } from 'express';
import authRoutes from './auth.routes.js';
import paymentRoutes from './payment.routes.js';
import adminRoutes from './admin.routes.js';
import questionRoutes from './question.routes.js';
import subjectRoutes from './subject.routes.js';
import resultRoutes from './result.routes.js';
import userRoutes from './user.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/payments', paymentRoutes);
router.use('/admin', adminRoutes);
router.use('/questions', questionRoutes);
router.use('/subjects', subjectRoutes);
router.use('/results', resultRoutes);
router.use('/users', userRoutes);

export default router;
