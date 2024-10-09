import { Request } from 'express';
import { CompanyDocument, UserDocument } from '../interfaces';

export interface RequestWithUser extends Request {
  user: UserDocument;
}

export interface RequestWithCompany extends Request {
  user: UserDocument;
  company: CompanyDocument;
}
