import express from 'express';
const router = express.Router();
import { isEmployer, auth, validate } from '../middlewares';
import jobController from '../controllers/job.controller';
import { createJobValidations } from '../validators';
import { authorization } from '../validators';

router.use(validate([authorization()]), auth, isEmployer);

router.patch('/:parentId/active', jobController.exportMakeAllDraftsActive);
router.patch('/:parentId/:jobId', jobController.updateSlot);
router.post('/', validate(createJobValidations), jobController.createJob);

export { router as jobRouter };
