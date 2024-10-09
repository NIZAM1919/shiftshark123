import * as Sentry from '@sentry/node';
import * as Tracing from '@sentry/tracing';
import type { Express } from 'express';

export default ({ app }: { app: Express }) => {
    /**
     * Sentry Configuration
     */
    Sentry.init({
        environment: process.env.SENTRY_ENVIRONMENT,
        dsn: process.env.SENTRY_DNS,
        maxBreadcrumbs: 50,
        attachStacktrace: true,
        debug: false,
        integrations: [
            // enable HTTP calls tracing
            new Sentry.Integrations.Http({ tracing: true }),
            // enable Express.js middleware tracing
            new Tracing.Integrations.Express({ app }),
        ],

        // We recommend adjusting this value in production, or using tracesSampler
        // for finer control
        // tracesSampleRate: 0.0001,

        enabled:
            process.env['NODE_ENV'] === 'production' &&
            !('SENTRY_DISABLE' in process.env),
    });
    // RequestHandler creates a separate execution context using domains, so that every
    // transaction/span/breadcrumb is attached to its own Hub instance
    app.use(
        Sentry.Handlers.requestHandler({
            request: ['data', 'query_string', 'method', 'url'],
            user: ['sub', 'email'],
            ip: true,
        })
    );

    // TracingHandler creates a trace for every incoming request
    app.use(Sentry.Handlers.tracingHandler());
};
