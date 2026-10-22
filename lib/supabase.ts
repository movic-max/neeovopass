import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vlglhctqaweymbgsbioo.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsZ2xoY3RxYXdleW1iZ3NiaW9vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI2MTgxNDQsImV4cCI6MjEwODE5NDE0NH0.Nsih_U_hnx2lgLwGtNlyCdNm10aDxUclenOdrm7nIts';

// If running in Node.js (SSR / build), use ws transport for Realtime
const realtimeOptions: Record<string, unknown> = {};
if (typeof window === 'undefined') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const WebSocketNode = require('ws');
    realtimeOptions.transport = WebSocketNode;
  } catch {
    // ws optional fallback
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: typeof window !== 'undefined',
  },
  realtime: realtimeOptions,
});
