import mongoose from 'mongoose';
import config from '../config/config';
import Logging from '../lib/logging';

export const connectToD = async () => {
  Logging.info('Connecting to mongo DB');
  await mongoose.connect(config.mongo.url, {
    retryWrites: true,
    w: 'majority',
  });
};

export const disconnectFromDB = async () => {
  await mongoose.connection.close();
  Logging.info('Disconnected from mongo DB');
};
