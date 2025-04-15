-- PostgreSQL cron 확장이 없다면 생성
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 기존 작업이 있다면 삭제
SELECT cron.unschedule('weekly_data_update_job')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'weekly_data_update_job'
);

-- 매주 일요일 자정에 update_weekly_data 함수를 실행하는 작업 스케줄링
SELECT cron.schedule(
  'weekly_data_update_job',   -- 작업 이름
  '0 0 * * 0',                -- cron 표현식: 매주 일요일 00:00
  'SELECT update_weekly_data()'  -- 실행할 함수
);

-- 작업 상태 확인을 위한 쿼리
-- SELECT * FROM cron.job WHERE jobname = 'weekly_data_update_job'; 