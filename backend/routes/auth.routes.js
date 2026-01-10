import { Router } from 'express';
import * as authController from '../controllers/authController.js';

const router = Router();

router.post('/login-with-token', authController.loginWithToken);
router.post('/login', authController.loginUser);
router.post('/update-credentials', authController.updateCredentials);
router.post('/register', authController.registerStudent);

export default router;
