import { Request, Response, NextFunction } from 'express';
import { validateToken, HttpError } from '../util';
import { User } from '../models/user.model';

const commonAuth = async function (req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization;
    const payload = validateToken(token);

    if (payload['tokenType'] != 'access' && payload['short-lived']) {
      throw new HttpError({
        title: 'unauthorized',
        detail: 'Invalid Authorization header',
        code: 401,
      });
    }
    const user = await User.findById(payload['id']);
    req['tokenPayload'] = payload;
    req['user'] = user;
    next();
  } catch (e) {
    if (e.opts?.title === 'invalid_token') {
      next(
        new HttpError({
          title: 'unauthorized',
          detail: 'Invalid Authorization header',
          code: 401,
        }),
      );
    } else {
      next(e);
    }
  }
};

export default commonAuth;
