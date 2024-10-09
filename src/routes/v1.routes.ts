import { NextFunction, Request, Response, Router } from 'express';
import { UserRouter } from './user.routes';
import { AuthRouter } from './auth.routes';
import { companyRouter } from './company.routes';
import { commonRouter } from './common.routes';
import { jobRouter } from './job.routes';

const _router: Router = Router({
  mergeParams: true,
});

//DEFINE API VERSION
_router.use(function (req: Request, res: Response, next: NextFunction) {
  res.setHeader('Api-Version', 'v1');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

// HEALTHCHECK
_router.route('/health-check').get(function (req: Request, res: Response) {
  return res.status(200).json({ healthy: true, version: 'v1' });
});

//EXPORT ROUTES WITH BASEPATH
_router.use('/auth', AuthRouter);
_router.use('/service-provider', UserRouter);
_router.use('/hirer', companyRouter);
_router.use('/common', commonRouter);
_router.use('/jobs', jobRouter);

export const router = _router;
