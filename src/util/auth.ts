import jwt from 'jsonwebtoken';

export const createAcessToken = (payload: any) => {
  payload = {
    ...payload,
    type: 'access',
  };
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '1d',
  });
};

export const verifyToken = (token: string, type?: 'access' | 'refresh') => {
  try {
    if (type === 'refresh') {
      return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } else return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    console.log(err);
    return null;
  }
};

export const createRefreshToken = (payload: any) => {
  payload = {
    ...payload,
    type: 'refresh',
  };
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: '7d',
  });
};

export const createShortLivedToken = (payload: any) => {
  payload = {
    ...payload,
    type: 'short-lived',
  };
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '15m',
  });
};
