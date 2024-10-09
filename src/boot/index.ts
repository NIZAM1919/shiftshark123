import sentrySetup from './sentry-setup';
import express = require('express');
// import { addBodyToDatadog } from './tracer';
import expressWinstonLogger from './express-winston-logger';
import errorHandler from './error-handler';
import { router as mainRouter } from '../routes/index';
import defaultMiddlewares from './default-middlewares';

export default async () => {
  const app = express();
  defaultMiddlewares({ app });

  sentrySetup({ app });
  // app.use(addBodyToDatadog);
  expressWinstonLogger({ app });

  app.use(mainRouter);
  errorHandler({ app });
  return app;
};
