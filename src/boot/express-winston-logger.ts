import type { Express } from 'express';
import { logger } from 'express-winston';
import { format, transports } from 'winston';
export default ({ app }: { app: Express }) => {
  app.use(
    logger({
      transports: [new transports.Console()],
      format: format.combine(format.colorize(), format.json()),
      meta: true, // optional: control whether you want to log the meta data about the request (default to true)
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
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      // dynamicMeta: (req, res) => {
      // 	return { user: req.user, body: req.body, raw_body: req.raw_body };
      // },
      msg: 'HTTP {{req.method}} {{req.url}}', // optional: customize the default logging message. E.g. "{{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}}"
      expressFormat: true, // Use the default Express/morgan request formatting. Enabling this will override any msg if true. Will only output colors with colorize set to true
      colorize: true, // Color the text and status code, using the Express/morgan color palette (text: gray, status: default green, 3XX cyan, 4XX yellow, 5XX red).
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ignoreRoute: function (req, res) {
        return res.statusCode === 404; // Ignore logging for 404 errors
      }, // optional: allows to skip some log messages based on request and/or response
    }),
  );
};
