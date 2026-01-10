import { Router } from 'express';
import * as resultController from '../controllers/resultController.js';

const router = Router();

router.get('/:username', resultController.getStudentResults);
router.post('/', resultController.saveResult);
router.delete('/:username', resultController.clearResults);

export default router;
