import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { QueryOptions } from 'mongoose';

export function convertToBase64(x: string): string {
  const bufferObj = Buffer.from(x, 'utf8');
  const base64String = bufferObj.toString('base64');
  return base64String;
}
import { Request, Response, NextFunction } from 'express';
/**
 *
 * @param time milliseconds to wait
 * @returns
 */
export function wait(time: number): Promise<null> {
  return new Promise((resolve) => {
    setTimeout(function () {
      resolve(null);
    }, time);
  });
}

export function removeTralingSlashFromUrl(url: string) {
  // function to check if the user submits url with backslash
  if (url.endsWith('/')) {
    return url.slice(0, url.lastIndexOf('/'));
  }
  return url;
}

export function isUrlValid(url: string) {
  // this custom regex is used as the host can be
  // 1. www.google.com
  // 2. google.com
  // 3. 142.251.33.68
  // 4. http://www.google.com
  // 5. https://www.google.com

  const pattern = new RegExp(
    '^(https?:\\/\\/)?' +
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*',
  ); // port and path

  if (!pattern.test(url)) {
    return false;
  }
  return true;
}

export const toTitleCase = (name: string) => {
  if (!name) return '';
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
};

export function getNthDayDateFromNow(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

export function addHoursInCurrentDT(h: number) {
  const dd = new Date();
  dd.setHours(dd.getHours() + h);
  return dd;
}

export function getUTCStringDate(timestamp) {
  const dd = new Date(timestamp).toUTCString();
  if (dd !== 'Invalid Date') {
    const ddArr = dd.split(' ');
    return ddArr
      .splice(0, 4)
      .join(' ')
      .concat(` ${ddArr[ddArr.length - 1]}`);
  }
  return '-';
}

export function generateRandomNumber(min: number, max: number) {
  const difference = max - min;
  let random = Math.random();
  random = Math.floor(random * difference);
  random = random + min;
  return random;
}

export function generateRandomString(length = 10) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

export function generateCode(orgIntegrationId: string) {
  // generate 13 codes for syncs 1st for 7 days from current date and rest for 30 days each
  const codes = [];
  let startDate = new Date();
  let endDate = new Date();
  startDate.setDate(startDate.getDate() - 7);

  let payload = {
    orgIntegrationId,
    type: 'custom',
    startDate,
    endDate,
  };

  let code = jwt.sign(payload, process.env.SYNC_JWT_SECRET, {
    expiresIn: '15d',
  });
  codes.push(code);

  for (let i = 0; i < 12; i++) {
    endDate = new Date(startDate);
    startDate = getPreviousMonthDate(startDate);
    payload = {
      orgIntegrationId,
      type: 'custom',
      startDate,
      endDate,
      isBackwardSync: true,
    } as any;
    code = jwt.sign(payload, process.env.SYNC_JWT_SECRET, {
      expiresIn: '15d',
    });
    codes.push(code);
  }
  return codes;
}

export function getPreviousMonthDate(date: Date) {
  date.setDate(date.getDate() - 30);
  return date;
}

export function getPageOptions(req: Request) {
  let limit = req.query.limit ? Number(req.query.limit) : 20;
  let page = req.query.page ? Number(req.query.page) : 1;
  limit = limit > 50 ? 50 : limit;
  const sortBy: string = (req.query.sortBy as string) || 'createdAt';
  let orderQuery = req.query.order || 'desc';
  const order = orderQuery == 'desc' ? -1 : 1;
  const sortOptions: QueryOptions['sort'] = { [sortBy as string]: order };
  return {
    limit,
    page,
    skipCount: (page - 1) * limit,
    sortBy,
    order,
    sortOptions,
  };
}
