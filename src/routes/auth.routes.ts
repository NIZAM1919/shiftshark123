import express, { Router } from 'express';
const router: Router = express.Router();
import { renewToken, sendOTPController, verifyOTP } from '../controllers/auth.controller';
import { deprecated } from '../middlewares';

router.post('/sendOTP', sendOTPController);
router.post('/verifyOTP', verifyOTP);
router.post('/token', renewToken);
router.post('/login', deprecated);

export { router as AuthRouter };
