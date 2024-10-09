import { Request, Response, NextFunction } from 'express';
import { validateToken, HttpError } from '../util';
import { UserModel } from '../interfaces';
import { Company, User } from '../models';
import { RequestWithCompany } from '../interfaces';
import { validationResult } from 'express-validator';
const auth = async function (req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization;
    const payload = validateToken(token);
    console.log(payload);

    if (payload['type'] !== 'access') {
      throw new HttpError({
        title: 'unauthorized',
        detail: 'Invalid Authorization header',
        code: 401,
      });
    }

    const user = await User.findById(payload['userId']);
    if (!user)
      throw new HttpError({
        title: 'unauthorized',
        detail: 'Invalid Authorization header',
        code: 401,
      });

    req['tokenPayload'] = payload;
    req['user'] = user;
    if (user.role === 'hirer') {
      const company = await Company.findById(user.companyId);
      req['company'] = company;
    }
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

const tokenAuth = async function (req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.query.token as string;
    const payload = validateToken(token);
    let user: UserModel;
    if (req.method != 'GET') {
      throw new HttpError({
        title: 'unauthorized',
        detail: 'missing auth header',
        code: 401,
      });
    }
    // if (payload['tokenType'] !== 'access') {
    //   throw new HttpError({
    //     title: 'unauthorized',
    //     detail: 'Invalid Authorization header',
    //     code: 401,
    //   });
    // }
    user = await User.findById(payload['id']);
    if (!user)
      throw new HttpError({
        title: 'unauthorized',
        detail: 'Invalid Authorization header',
        code: 401,
      });

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

const isEmployer = async function (
  req: RequestWithCompany,
  res: Response,
  next: NextFunction,
) {
  try {
    console.log(req.user.role);
    console.log(req.company);
    if (req.user.role === 'hirer' && !req.company) {
      throw new HttpError({
        title: 'insufficient_permissions',
        detail: 'you do not have sufficient permissions to access this route',
        code: 403,
      });
    }
    if (req.params.companyId)
      if (req.params.companyId !== String(req.company._id)) {
        throw new HttpError({
          title: 'insufficient_permissions',
          detail: 'you do not have sufficient permissions to access this route',
          code: 403,
        });
      }
    next();
  } catch (e) {
    throw new HttpError({
      title: 'insufficient_permissions',
      detail: 'you do not have sufficient permissions to access this route',
      code: 403,
    });
  }
};

export { auth, tokenAuth, isEmployer };
