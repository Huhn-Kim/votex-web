/**
 * Supabase Edge Function - Weekly Data Update
 * 
 * 이 함수는 주간 사용자 데이터를 업데이트하는 함수입니다.
 * Deno 런타임에서 실행되며, cron.json에 설정된 스케줄(매주 일요일 자정)에 따라 자동 실행됩니다.
 * 
 * 주의: 이 파일은 로컬 TypeScript 컴파일러에서 오류가 발생할 수 있지만
 * Supabase Edge Functions 환경에서는 정상적으로 작동합니다.
 */

// Deno 런타임용 import - 로컬 개발 환경에서는 오류가 표시될 수 있음
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

// CORS 헤더 설정
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Edge Function 핸들러
serve(async (req) => {
  // CORS preflight 요청 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('[Weekly Update] Function started');
    
    // Supabase 클라이언트 생성 (Edge Functions에서 자동으로 환경 변수 주입)
    // @ts-ignore - 로컬 편집기에서 오류 표시되지만 Supabase 환경에서는 정상 작동
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization') ?? '' },
        },
      }
    );

    console.log('[Weekly Update] Executing update_weekly_data function...');
    
    // update_weekly_data 함수 호출 (SQL 함수)
    const { data, error } = await supabaseClient.rpc('update_weekly_data');
    
    if (error) {
      console.error('[Weekly Update] Error:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    console.log('[Weekly Update] Successfully completed');
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Weekly data updated successfully',
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('[Weekly Update] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

// Supabase Edge Function에서는 내부적으로 handler 함수를 호출합니다. 