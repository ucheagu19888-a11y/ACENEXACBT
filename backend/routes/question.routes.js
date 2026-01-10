import { Router } from 'express';
import * as questionController from '../controllers/questionController.js';

const router = Router();

router.get('/', questionController.getAllQuestions);
router.post('/', questionController.addQuestion);
router.post('/bulk', questionController.addBulkQuestions);
router.delete('/reset/all', questionController.resetAllQuestions);
router.delete('/:id', questionController.deleteQuestion);

export default router;
