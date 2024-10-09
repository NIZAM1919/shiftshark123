import { Router } from 'express';
import { authorization } from '../validators';
import { auth, validate } from '../middlewares';
import commonController from '../controllers/common.controller';

const router: Router = Router({
  mergeParams: true,
});

router.use(validate([authorization()]), auth);

router.post('/upload', commonController.uploadFile);
router.route('/me/notifications/unread').get(commonController.getUnreadNotifications);
router.route('/me/notifications').get(commonController.getNotifications);
router
  .route('/me/notifications/mark-as-read/:id')
  .patch(commonController.markNotificationAsRead);
router
  .route('/me/notifications/mark-as-read')
  .patch(commonController.markNotificationAsRead);

export { router as commonRouter };
