import { createClient } from '@supabase/supabase-js';

// 환경 변수에서 Supabase URL과 API 키를 가져옵니다.
const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || 'https://nemmgowccesebzdgyzrk.supabase.co';
const supabaseKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lbW1nb3djY2VzZWJ6ZGd5enJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIwMDM0OTUsImV4cCI6MjA1NzU3OTQ5NX0.s2JMFa5ib9RNhZ0OfEVUL2qs1hEhB5AS7RQPhlyEKU0';

// Supabase 클라이언트 생성
const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase; 