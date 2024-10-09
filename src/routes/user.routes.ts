import { Router } from 'express';
import { authorization } from '../validators';
import { auth, validate } from '../middlewares';
import userControllers from '../controllers/user.controller';

const router: Router = Router({
  mergeParams: true,
});

// Sign up route
router.post('/signup', userControllers.signUp);

// Middleware for authorization and authentication
router.use(validate([authorization()]), auth);

// User profile routes
router.route('/profile').patch(userControllers.updateMe).get(userControllers.getMe);

// Job application routes
router.route('/jobs/:jobId/apply').get(userControllers.applyForJob);
router
  .route('/jobs/:jobId/withdraw-application')
  .get(userControllers.withdrawApplication);

// Bank and additional details routes
router.put('/bank-details', userControllers.addBankDetails);
router.put('/additional-details', userControllers.addAdditionalDetails);

// Conversation routes
router.get('/me/conversations', userControllers.getConversationsWithLastMessage);
router.post(
  '/jobs/:jobId/applications/:applicationId/conversation',
  userControllers.getOrCreateConversation,
);
router.post(
  '/jobs/:jobId/applications/:applicationId/conversation/:conversationId/message',
  userControllers.sendMessage,
);
router.get(
  '/jobs/:jobId/applications/:applicationId/conversation/:conversationId/message',
  userControllers.getConversationMessages,
);

// Shift routes
router.post('/jobs/:jobId/applications/:applicationId/start', userControllers.startShift);
router.post('/jobs/:jobId/applications/:applicationId/end', userControllers.endShift);

// Job saving routes
router.post('/jobs/:jobId/unsave', userControllers.unSaveJob);
router.post('/jobs/:jobId/save', userControllers.saveJob);
router.route('/jobs/saved').get(userControllers.listSavedJobs);
router.route('/jobs/applied').get(userControllers.listAppliedJobs);

// Job application routes
router
  .route('/application/:applicationId/:jobId')
  .get(userControllers.getApplicationForJob);

// Fetch jobs route
router.route('/jobs').get(userControllers.getJobs);

// New API to get details of all users in JSON format
router.get('/users', userControllers.getAllUsers);

// New API to get specific user details
router.get('/users/:userId', userControllers.getUserDetails);

export { router as UserRouter };
