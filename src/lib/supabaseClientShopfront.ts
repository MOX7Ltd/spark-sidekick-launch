import { createClient } from '@supabase/supabase-js';
import { getAnonId } from './anon';

const supabaseUrl = 'https://hfrsaqfflwvdbywgixxv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmcnNhcWZmbHd2ZGJ5d2dpeHh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMDc0NTYsImV4cCI6MjA3NDY4MzQ1Nn0.5yEPvT4Gwxns5BzonLMWWJFygvP8sdD8Wg_6fblZJ60';

// Dedicated client with anon-id header for RLS guest access
export const supabaseShopfront = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    headers: {
      'anon-id': typeof window !== 'undefined' ? getAnonId() : 'server-anon',
    },
  },
});
