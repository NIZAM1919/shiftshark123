import { NextFunction, Request, Response, Router } from 'express';
import { router as v1Router } from './v1.routes';

const _router: Router = Router({
  mergeParams: true,
});
_router.use('/v1', v1Router);

export const router = _router;
