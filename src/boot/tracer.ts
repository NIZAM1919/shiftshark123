// 'use strict';
// import tracer from 'dd-trace';
// import type { NextFunction, Request, Response } from 'express';
// export { tracer };

// export const initialize = () => {
//     tracer.init({
//         logInjection: true,
//         runtimeMetrics: true,
//         profiling: true,
//         tags: {
//             env: process.env.DD_ENV,
//             owner: 'virtualVoter',
//         },
//     });
// };

// export const addBodyToDatadog = (
//     req: Request,
//     _: Response,
//     next: NextFunction
// ) => {
//     try {
//         if (['PUT', 'POST'].includes(req.method)) {
//             const span = tracer.scope().active();
//             if (span) {
//                 span.setTag('request_body', JSON.stringify(req.body));
//             }
//         }
//     } catch (err) {
//         console.log(err);
//         // do nothing
//     } finally {
//         next();
//     }
// };
