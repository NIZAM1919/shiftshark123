import { createClient } from '@supabase/supabase-js';
import { Database } from '../interfaces/supabase.types';
import config from '../config/config';

const supabase = createClient<Database>(config.supabase.url, config.supabase.anon);

export default supabase;
