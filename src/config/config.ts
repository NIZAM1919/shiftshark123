import dotenv from 'dotenv';
import supabase from '../boot/supabase';

dotenv.config();

// DECLARE ALL VARIABLES
const MONGO_DB_USER = process.env.MONGO_DB_USER || '';
const NODE_ENV = process.env.NODE_ENV || '';
const MONGO_DB_PASSWORD = process.env.MONGO_DB_PASSWORD || '';
const MONGO_DB_HOST = process.env.MONGO_DB_HOST || '';
const MONGO_URL = `mongodb+srv://${MONGO_DB_USER}:${MONGO_DB_PASSWORD}@${MONGO_DB_HOST}`;
const SERVER_PORT = process.env.PORT ? Number(process.env.PORT) : 5000;
const DB_NAME = process.env.DB_NAME || '';
const MONGO_URL_LOCAL = `mongodb://localhost:27017/${DB_NAME}`;
const SUPABASE_PROJECT_URL = process.env.SUPABASE_PROJECT_URL || '';
const SUPABASE_PUBLIC_ANON = process.env.SUPABASE_PUBLIC_ANON || '';

//CREATE CONFIG OBJECT
const config = {
  mongo: {
    url: MONGO_URL,
  },
  server: {
    port: SERVER_PORT,
  },
  supabase: {
    url: SUPABASE_PROJECT_URL,
    anon: SUPABASE_PUBLIC_ANON,
  },
};

//CHECK FOR ENVIRONMENT
if (NODE_ENV === 'production' || NODE_ENV === 'development') {
  config.mongo.url = MONGO_URL + '/' + DB_NAME;
  config.server.port = SERVER_PORT;
} else if (NODE_ENV === 'localhost') {
  config.mongo.url = MONGO_URL_LOCAL;
  config.server.port = SERVER_PORT;
}

//EXPORT
export default config;
