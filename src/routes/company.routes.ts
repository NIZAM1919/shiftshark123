import { Router } from 'express';
import { authorization } from '../validators';
import { auth, validate, isEmployer } from '../middlewares';
import companyController from '../controllers/company.controller';
const router: Router = Router({
  mergeParams: true,
});
router.post('/signup', companyController.signUp);
router.use(validate([authorization()]), auth, isEmployer);

router
  .route('/profile')
  .patch(companyController.updateProfile)
  .get(companyController.getMe);

router
  .route('/:companyId/jobs/:parentId/:jobId/applicants/:applicantId')
  .get(companyController.getApplicantDetails)
  .patch(companyController.updateApplicationStatus);

router
  .route('/:companyId/jobs/:parentId/:jobId/applicants')
  .get(companyController.getSlotApplicants)
  .patch(companyController.bulkUpdateApplicationStatus);

router.route('/:companyId/jobs/:parentId/:jobId').get(companyController.getSlotDetails);

router.route('/:companyId/jobs').get(companyController.getJobs);
router.post(
  '/jobs/:jobId/applications/:applicationId/conversation',
  companyController.getOrCreateConversation,
);
router.get(
  '/jobs/:jobId/applications/:applicationId/conversation/:conversationId/message',
  companyController.getConversationMessages,
);
router.post(
  '/jobs/:jobId/applications/:applicationId/conversation/:conversationId/message',
  companyController.sendMessage,
);
router.post(
  '/jobs/:jobId/applications/:applicationId/start',
  companyController.startShift,
);
router.post('/jobs/:jobId/applications/:applicationId/end', companyController.endSift);
router.post(
  '/jobs/:jobId/applications/:applicationId/conversation',
  companyController.getOrCreateConversation,
);
router.get('/me/conversations', companyController.getConversationsWithLastMessage);

// New API to get details of all users in JSON format
router.get('/users', companyController.getAllUsers);

// New API to get specific user details
router.get('/users/:userId', companyController.getUserDetails);

// new api to update verification status of user by admin
router.patch('/:userId/verify', companyController.updateUserVerificationStatus);

export { router as companyRouter };
