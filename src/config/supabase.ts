import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://goxfwpqgqvcriwdsthsz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdveGZ3cHFncXZjcml3ZHN0aHN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNjQwOTUsImV4cCI6MjA4Nzk0MDA5NX0.64waNnbGkPNNMjNKT1GpGVbtrJ_fD_3wj3WKdEBDkyw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
