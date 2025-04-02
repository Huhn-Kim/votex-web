
-- 좋아요 처리 함수
CREATE OR REPLACE FUNCTION handle_like(
  p_topic_id INTEGER,
  p_user_id UUID
) RETURNS VOID AS $$
DECLARE
  p_existing_like_kind text;
  p_existing_option_id INTEGER;
  current_dislikes INTEGER;
  current_likes INTEGER;
BEGIN
  -- 기존 반응 확인
  SELECT like_kind, option_id INTO p_existing_like_kind, p_existing_option_id
  FROM vote_results
  WHERE user_id = p_user_id AND topic_id = p_topic_id;

  -- 현재 좋아요/싫어요 수 확인
  SELECT likes, dislikes INTO current_likes, current_dislikes
  FROM vote_topics
  WHERE id = p_topic_id;

  -- 이미 좋아요를 눌렀다면 아무 작업도 하지 않음
  IF p_existing_like_kind = 'like' THEN
    RETURN;
  END IF;

  -- 트랜잭션 시작
  BEGIN
    -- 이미 싫어요를 눌렀다면 싫어요 취소
    IF p_existing_like_kind = 'dislike' THEN
      -- 음수 방지
      IF current_dislikes > 0 THEN
        UPDATE vote_topics
        SET dislikes = dislikes - 1
        WHERE id = p_topic_id;
      END IF;
      
      -- 좋아요로 변경
      UPDATE vote_topics
      SET likes = likes + 1
      WHERE id = p_topic_id;
      
      -- 사용자 반응 업데이트
      UPDATE vote_results
      SET like_kind = 'like'
      WHERE user_id = p_user_id AND topic_id = p_topic_id;
    ELSE
      -- 좋아요 증가
      UPDATE vote_topics
      SET likes = likes + 1
      WHERE id = p_topic_id;
      
      -- 기존 투표 레코드가 없는 경우 삽입
      INSERT INTO vote_results (user_id, topic_id, option_id, like_kind)
      VALUES (p_user_id, p_topic_id, 
        COALESCE(p_existing_option_id, (SELECT id FROM vote_options WHERE topic_id = p_topic_id LIMIT 1)), 
        1)
      ON CONFLICT (user_id, topic_id) 
      DO UPDATE SET like_kind = 'like';
    END IF;
  END;
END;
$$ LANGUAGE plpgsql;

-- 싫어요 처리 함수
CREATE OR REPLACE FUNCTION handle_dislike(
  p_topic_id INTEGER,
  p_user_id UUID
) RETURNS VOID AS $$
DECLARE
  p_existing_like_kind text;
  p_existing_option_id INTEGER;
  current_likes INTEGER;
  current_dislikes INTEGER;
BEGIN
  -- 기존 반응 확인
  SELECT like_kind, option_id INTO p_existing_like_kind, p_existing_option_id
  FROM vote_results
  WHERE user_id = p_user_id AND topic_id = p_topic_id;

  -- 현재 좋아요/싫어요 수 확인
  SELECT likes, dislikes INTO current_likes, current_dislikes
  FROM vote_topics
  WHERE id = p_topic_id;

  -- 이미 싫어요를 눌렀다면 아무 작업도 하지 않음
  IF p_existing_like_kind = 'dislike' THEN
    RETURN;
  END IF;

  -- 트랜잭션 시작
  BEGIN
    -- 이미 좋아요를 눌렀다면 좋아요 취소
    IF p_existing_like_kind = 'like' THEN
      -- 음수 방지
      IF current_likes > 0 THEN
        UPDATE vote_topics
        SET likes = likes - 1
        WHERE id = p_topic_id;
      END IF;
      
      -- 싫어요로 변경
      UPDATE vote_topics
      SET dislikes = dislikes + 1
      WHERE id = p_topic_id;
      
      -- 사용자 반응 업데이트
      UPDATE vote_results
      SET like_kind = 'dislike'
      WHERE user_id = p_user_id AND topic_id = p_topic_id;
    ELSE
      -- 싫어요 증가
      UPDATE vote_topics
      SET dislikes = dislikes + 1
      WHERE id = p_topic_id;
      
      -- 기존 투표 레코드가 없는 경우 삽입
      INSERT INTO vote_results (user_id, topic_id, option_id, like_kind)
      VALUES (p_user_id, p_topic_id, 
        COALESCE(p_existing_option_id, (SELECT id FROM vote_options WHERE topic_id = p_topic_id LIMIT 1)), 
        0)
      ON CONFLICT (user_id, topic_id) 
      DO UPDATE SET like_kind = 'dislike';
    END IF;
  END;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_vote_rankings()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- 이전 순위 저장용 임시 테이블 생성
    CREATE TEMP TABLE old_ranks AS
    SELECT topic_id, total_ranks, today_ranks, hourly_ranks, comments_ranks
    FROM vote_ranks;

    -- vote_ranks 테이블 업데이트
    INSERT INTO vote_ranks (
        topic_id,
        total_ranks,
        today_ranks,
        hourly_ranks,
        comments_ranks,
        last_updated
    )
    SELECT 
        vt.id,
        ROW_NUMBER() OVER (ORDER BY vt.total_votes DESC),
        ROW_NUMBER() OVER (ORDER BY vt.today_votes DESC),
        ROW_NUMBER() OVER (ORDER BY vt.hourly_votes DESC),
        ROW_NUMBER() OVER (ORDER BY vt.comments DESC),
        CURRENT_TIMESTAMP
    FROM vote_topics vt
    WHERE vt.visible = true
    ON CONFLICT (topic_id) 
    DO UPDATE SET
        total_ranks = EXCLUDED.total_ranks,
        today_ranks = EXCLUDED.today_ranks,
        hourly_ranks = EXCLUDED.hourly_ranks,
        comments_ranks = EXCLUDED.comments_ranks,

        last_updated = EXCLUDED.last_updated;

    -- 순위 변동 계산
    UPDATE vote_ranks vr
    SET 
        total_rank_diff = COALESCE(
            (SELECT old_ranks.total_ranks FROM old_ranks WHERE old_ranks.topic_id = vr.topic_id),
            0
        ) - vr.total_ranks,
        today_rank_diff = COALESCE(
            (SELECT old_ranks.today_ranks FROM old_ranks WHERE old_ranks.topic_id = vr.topic_id),
            0
        ) - vr.today_ranks,
        hourly_rank_diff = COALESCE(
            (SELECT old_ranks.hourly_ranks FROM old_ranks WHERE old_ranks.topic_id = vr.topic_id),
            0
        ) - vr.hourly_ranks,
        comments_rank_diff = COALESCE(
        (SELECT old_ranks.comments_ranks FROM old_ranks WHERE old_ranks.topic_id = vr.topic_id),
        0
        ) - vr.comments_ranks
    WHERE EXISTS (
        SELECT 1 
        FROM vote_topics vt 
        WHERE vt.id = vr.topic_id 
        AND vt.visible = true
    );

    -- 임시 테이블 삭제
    DROP TABLE IF EXISTS old_ranks;
END;
$$;

-- 옵션 투표수 증가 함수
CREATE OR REPLACE FUNCTION increment_option_votes(option_id INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE vote_options
  SET votes = votes + 1
  WHERE id = option_id;
END;
$$ LANGUAGE plpgsql;

-- 옵션 투표수 감소 함수
CREATE OR REPLACE FUNCTION decrement_option_votes(option_id INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE vote_options
  SET votes = GREATEST(0, votes - 1)
  WHERE id = option_id;
END;
$$ LANGUAGE plpgsql;

-- 주제 총 투표수 증가 함수
CREATE OR REPLACE FUNCTION increment_topic_votes(topic_id INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE vote_topics
  SET total_votes = total_votes + 1
  WHERE id = topic_id;
END;
$$ LANGUAGE plpgsql;

-- 만료된 투표를 자동으로 업데이트하는 함수
CREATE OR REPLACE FUNCTION update_expired_votes()
RETURNS VOID AS $$
BEGIN
  UPDATE vote_topics
  SET is_expired = TRUE
  WHERE expires_at < NOW() AND is_expired = FALSE;
END;
$$ LANGUAGE plpgsql;

-- 만료된 투표를 자동으로 업데이트하는 트리거
CREATE OR REPLACE FUNCTION create_update_expired_votes_job()
RETURNS VOID AS $$
BEGIN
  PERFORM cron.schedule(
    'update_expired_votes_job',
    '*/10 * * * *', -- 10분마다 실행
    'SELECT update_expired_votes()'
  );
END;
$$ LANGUAGE plpgsql; 

-- Supabase SQL Editor에서 실행할 스토리지 정책 설정
-- 이 SQL을 실행하여 모든 사용자(익명 포함)가 스토리지를 사용할 수 있도록 허용합니다

-- 기존 정책 삭제 (충돌 방지)
DROP POLICY IF EXISTS "모든 사용자는 파일을 업로드할 수 있음" ON storage.objects;
DROP POLICY IF EXISTS "모든 사용자는 파일을 업데이트할 수 있음" ON storage.objects;
DROP POLICY IF EXISTS "모든 사용자는 파일을 삭제할 수 있음" ON storage.objects;
DROP POLICY IF EXISTS "모든 사용자는 파일을 읽을 수 있음" ON storage.objects;

-- 1. 모든 사용자(익명 포함)가 파일을 업로드할 수 있도록 허용
CREATE POLICY "모든 사용자는 파일을 업로드할 수 있음" 
ON storage.objects FOR INSERT 
TO authenticated, anon 
WITH CHECK (true);

-- 2. 모든 사용자(익명 포함)가 파일을 업데이트할 수 있도록 허용
CREATE POLICY "모든 사용자는 파일을 업데이트할 수 있음" 
ON storage.objects FOR UPDATE 
TO authenticated, anon 
USING (true) WITH CHECK (true);

-- 3. 모든 사용자(익명 포함)가 파일을 삭제할 수 있도록 허용
CREATE POLICY "모든 사용자는 파일을 삭제할 수 있음" 
ON storage.objects FOR DELETE 
TO authenticated, anon 
USING (true);

-- 4. 모든 사용자(익명 포함)가 파일을 읽을 수 있도록 허용
CREATE POLICY "모든 사용자는 파일을 읽을 수 있음" 
ON storage.objects FOR SELECT 
TO authenticated, anon
USING (true);

-- 참고: 이 정책들은 보안상 상당히 개방적입니다. 실제 프로덕션 환경에서는 
-- 필요에 따라 더 제한적인 정책을 사용하는 것이 좋습니다.