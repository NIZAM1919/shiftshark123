import './boot/init'; //loads env and sets up DD
import * as mongo from './boot/mongo';
import bootApp from './boot/index';
import Logging from './lib/logging';
import { createServer } from 'http';
let httpServer: any = null;
import { Server } from 'socket.io';
import Socket from './util/socket';

export async function closeGracefully(signal: string) {
  Logging.info(`*^!@4=> Received signal to terminate: ${signal}`);

  try {
    Logging.info('Gracefulling shutting down HTTP server');
    await new Promise<void>((resolve, reject) => {
      if (httpServer == null) resolve();
      (httpServer as Server).close((err?: Error) => {
        if (err) reject(err);
        resolve();
      });
    });

    Logging.info('Disconnecting from all external services');
    await Promise.all([mongo.disconnectFromDB()]);

    Logging.info('Graceful shutdown complete. Exiting');
    process.exit(0);
  } catch (err) {
    Logging.error('Failed to gracefully shutdown:');
    Logging.error(err);
    process.exit(1);
  }
}

process.once('SIGINT', closeGracefully);
process.once('SIGTERM', closeGracefully);

/**
 * Starts our server. :')
 */
export async function startServer() {
  Logging.info('Starting server');
  const [, app] = await Promise.all([mongo.connectToD(), bootApp()]);
  const port = +(process.env?.['PORT'] || 5001);
  httpServer = createServer(app);
  const ioServer = new Server(httpServer);
  Socket.getInstance(ioServer);
  httpServer.listen(port, () => {
    Logging.info(`Your server is ready to listen on PORT: ${port}!`);
  });
  return httpServer;
}
