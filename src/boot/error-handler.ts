import * as Sentry from '@sentry/node';
import type { Request, Response, Express, NextFunction } from 'express';
import { errorLogger } from 'express-winston';
import { format, transports } from 'winston';
import { HttpError } from '../util';
export default ({ app }: { app: Express }) => {
  if (process.env.NODE_ENV === 'production') {
    app.use(
      errorLogger({
        transports: [new transports.Console()],
        format: format.combine(format.colorize(), format.json()),
        requestWhitelist: [
          'url',
          'headers',
          'method',
          'httpVersion',
          'originalUrl',
          'query',
          'body',
          'user',
          'raw_body',
        ],
        // dynamicMeta: (req) => {
        //  return { user: req.user, body: req.body, raw_body: req.raw_body };
        // },
        meta: true, // optional: control whether you want to log the meta data about the request (default to true)
        msg: 'HTTP {{req.method}} {{req.url}}', // optional: customize the default logging message. E.g. "{{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}}"
      }),
    );
  }

  app.use((_1: Request, res: Response) => {
    res.status(404).send('Not Found').end();
  });
  app.use((err, req, res, next) => {
    const { sentry: sentry_id } = res;
    const status = ((err as any).status as number) ?? 500;
    const message =
      typeof err === 'string' ? err : `Something went wrong please try again later`;
    const errors = (err as any).errors ?? [{ msg: message }];
    // get issue severity

    // do not send to sentry if its  syntax error
    if (err instanceof SyntaxError) {
      return res.status(status).json({
        error: `Bad Request`,
        errors: [
          {
            msg: 'Bad Request',
          },
        ],
        sentry_id,
        code: 'MISC',
      });
    }

    Sentry.configureScope((scope) => {
      scope.setTransactionName(`${req.method} ${req.url.split('?')[0]}`);
      scope.setTag('query', req.query);
      if (req.route) {
        scope.setFingerprint([req.method, req.route.path, status, message]);
      }
      const extras: Record<string, unknown> = {
        headers: req.headers,
        headers_strigified: JSON.stringify(req.headers),
        error_message: message,
        errors: errors,
        errorContext: err?.opts?.meta,
      };
      if (req.method !== 'GET') {
        extras.body = req.body;
        extras.body_stringified = JSON.stringify(req.body);
        extras.raw_body = req.raw_body;
        extras.raw_body_stringified = JSON.stringify(req.raw_body);
      }
      scope.setExtra('extras', extras);
    });
    Sentry.captureException(err);

    if (err instanceof HttpError) {
      return err.sendError(res);
    }
    console.error(err);
    res.status(status).json({
      error: message,
      errors,
      sentry_id,
    });
  });
};
