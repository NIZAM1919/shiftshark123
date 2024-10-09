import dotenv from 'dotenv';
// import * as BootTracer from './tracer';

(() => {
  let path: string = '.env';
  if (process.env.ENV_OVERRIDE == 'production') {
    path = '.env.production';
  } else if (process.env.ENV_OVERRIDE == 'development') {
    path = '.env.development';
  }
  dotenv.config({ path });
  // if (process.env.NODE_ENV === 'production') {
  //     BootTracer.initialize();
  //     BootTracer.tracer.use('http', { blocklist: ['/ping'] });
  // }
})();
