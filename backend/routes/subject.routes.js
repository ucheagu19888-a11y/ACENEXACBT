import { Router } from 'express';
import * as subjectController from '../controllers/subjectController.js';

const router = Router();

router.get('/', subjectController.getAllSubjects);
router.post('/', subjectController.addSubject);
router.delete('/:id', subjectController.deleteSubject);

export default router;
