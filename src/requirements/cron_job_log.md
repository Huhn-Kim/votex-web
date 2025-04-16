-- -- 테이블 구조 확인
-- SELECT column_name
-- FROM information_schema.columns
-- WHERE table_schema = 'cron'
-- AND table_name = 'job_run_details';

-- pg_cron job 실행 로그 조회 (수정된 버전)
SELECT 
  jobid,
  command,  -- jobname 대신 command 사용
  status,
  return_message,
  start_time,
  end_time,
  EXTRACT(EPOCH FROM (end_time - start_time)) AS duration_seconds
FROM 
  cron.job_run_details
WHERE 
  command LIKE '%update_weekly_data%'  -- jobname 대신 command로 필터링
ORDER BY 
  start_time DESC
LIMIT 10;

-- 모든 pg_cron job 목록 조회
SELECT * FROM cron.job;

-- 최근 실행된 모든 cron job 로그 조회
SELECT 
  jobid,
  jobname,
  status,
  return_message,
  start_time,
  end_time,
  EXTRACT(EPOCH FROM (end_time - start_time)) AS duration_seconds
FROM 
  cron.job_run_details
ORDER BY 
  start_time DESC
LIMIT 20;

-- 실패한 job 로그 조회
SELECT 
  jobid,
  jobname,
  status,
  return_message,
  start_time,
  end_time
FROM 
  cron.job_run_details
WHERE 
  status = 'failed'
ORDER BY 
  start_time DESC;

-- 요일별 실행 통계
SELECT 
  to_char(start_time, 'Day') AS day_of_week,
  COUNT(*) AS execution_count,
  AVG(EXTRACT(EPOCH FROM (end_time - start_time))) AS avg_duration_seconds,
  MIN(start_time) AS first_execution,
  MAX(start_time) AS last_execution
FROM 
  cron.job_run_details
WHERE 
  jobname = 'weekly_data_update_job'
GROUP BY 
  to_char(start_time, 'Day')
ORDER BY 
  to_char(start_time, 'ID');