import { Router } from 'express';
import * as userController from '../controllers/userController.js';

const router = Router();

router.get('/students', userController.getAllStudents);
router.delete('/:username', userController.deleteUser);

export default router;
