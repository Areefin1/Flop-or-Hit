import { createClient } from '@supabase/supabase-js';

const URL = 'https://vdgbljumvwcxomohuchd.supabase.co';

const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkZ2JsanVtdndjeG9tb2h1Y2hkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0Nzk3NDUsImV4cCI6MjA2MDA1NTc0NX0.ga0wOxYpJ4AJz9lF-9ivSsHUxra-qWC-Kw3tt3Qpqkg';

export const supabase = createClient(URL, API_KEY);