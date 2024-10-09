import express = require('express');
import methodOverride from 'method-override';
import bodyParser from 'body-parser';
import bodyPareserHandler from 'express-body-parser-error-handler';
import Logging from '../lib/logging';
import type { Request, Response, NextFunction, Express } from 'express';
import cors from 'cors';
export default ({ app }: { app: Express }) => {
  // app.use(bodyParser.json({ limit: '2mb' }));
  app.use(express.json({ limit: '2mb' }));
  app.use(bodyPareserHandler());
  app.use(express.urlencoded({ limit: '2mb', extended: false }));
  app.use(cors());

  // Disable x-powered-by header
  app.disable('x-powered-by');

  //	Setup Custom Response Headers
  const custom_headers = [
    {
      name: 'strict-transport-security',
      value: 'max-age=63072000; includeSubDomains; preload',
    },
    { name: 'Content-Security-Policy', value: 'upgrade-insecure-requests' },
    { name: 'X-Frame-Options', value: 'SAMEORIGIN' },
    { name: 'X-Content-Type-Options', value: 'nosniff' },
    { name: 'Referrer-Policy', value: 'same-origin' },
    { name: 'X-XSS-Protection', value: '1; mode=block' },
    { name: 'server', value: 'cloudfront' },
    {
      name: 'Permissions-Policy',
      value:
        'geolocation=(self), midi=(self), push=(self), sync-xhr=(self), microphone=(self), camera=(self), magnetometer=(self), gyroscope=(self), speaker=(self), vibrate=(self), fullscreen=(self), payment=(self)',
    },
  ];

  app.use(function (_: Request, res: Response, next: NextFunction) {
    custom_headers.forEach(({ name, value }) => {
      res.setHeader(name, value);
    });
    next();
  });

  // app.use(methodOverride());
  app.get('/ping', (req: Request, res: Response) => {
    res.status(200).end();
  });
  app.head('/ping', (req: Request, res: Response) => {
    res.status(200).end();
  });
  if ((process.env.ENABLE_LOGGING = 'true'))
    // manual routing for debugging puposes
    app.use((req, res, next) => {
      Logging.info(
        `Incomming -> Method: [${req.method}] - Url: [${req.url}] - IP: [${req.socket.remoteAddress}]`,
      );
      res.on('finish', () => {
        Logging.info(
          `Incomming -> Method: [${req.method}] - Url: [${req.url}] IP: [${req.socket.remoteAddress}] - Status: [${res.statusCode}]`,
        );
      });
      next();
    });
};
