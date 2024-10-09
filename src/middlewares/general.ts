import { HttpError } from '../util';
import { Request, Response } from 'express';
import { ApiErrorInterface } from '../interfaces';
export type APIResponse<Res> = {
  data: Res[];
  meta: {
    total: number;
    limit: number;
    totalPages: number;
    currentPage: number;
  };
};
const deprecated = async function (req: Request, res: Response) {
  const error: ApiErrorInterface = {
    code: 410,
    title: '',
    detail: '',
  };
  throw new HttpError(error);
};

export { deprecated };
