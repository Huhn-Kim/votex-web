-- 사용자 테이블
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) UNIQUE,
  profile_image VARCHAR(255),
  user_badge INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 투표 주제 테이블
CREATE TABLE vote_topics (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  question VARCHAR(255) NOT NULL,
  link VARCHAR(255),
  total_votes INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  dislikes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  type VARCHAR(50) DEFAULT 'text',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_expired BOOLEAN DEFAULT FALSE
);

-- 투표 옵션 테이블
CREATE TABLE vote_options (
  id SERIAL PRIMARY KEY,
  topic_id INTEGER REFERENCES vote_topics(id) ON DELETE CASCADE,
  text VARCHAR(255) NOT NULL,
  votes INTEGER DEFAULT 0,
  image_class VARCHAR(255)
);

-- 사용자 투표 기록 테이블
CREATE TABLE votes (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  topic_id INTEGER REFERENCES vote_topics(id) ON DELETE CASCADE,
  option_id INTEGER REFERENCES vote_options(id) ON DELETE CASCADE,
  like_kind INTEGER, -- 1: 좋아요, 0: 싫어요, NULL: 반응 없음
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, topic_id)
);

-- 구독 관계 테이블
CREATE TABLE subscriptions (
  id SERIAL PRIMARY KEY,
  subscriber_id UUID REFERENCES users(id) ON DELETE CASCADE,
  subscribed_to_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(subscriber_id, subscribed_to_id)
);

-- 사용자 반응 테이블 (좋아요/싫어요)
CREATE TABLE user_reactions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  topic_id INTEGER REFERENCES vote_topics(id) ON DELETE CASCADE,
  liked BOOLEAN DEFAULT FALSE,
  disliked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, topic_id)
);

-- 좋아요 처리 함수
CREATE OR REPLACE FUNCTION handle_like(
  p_topic_id INTEGER,
  p_user_id UUID
) RETURNS VOID AS $$
DECLARE
  p_existing_like_kind INTEGER;
  p_existing_option_id INTEGER;
  current_dislikes INTEGER;
  current_likes INTEGER;
BEGIN
  -- 기존 반응 확인
  SELECT like_kind, option_id INTO p_existing_like_kind, p_existing_option_id
  FROM votes
  WHERE user_id = p_user_id AND topic_id = p_topic_id;

  -- 현재 좋아요/싫어요 수 확인
  SELECT likes, dislikes INTO current_likes, current_dislikes
  FROM vote_topics
  WHERE id = p_topic_id;

  -- 이미 좋아요를 눌렀다면 아무 작업도 하지 않음
  IF p_existing_like_kind = 1 THEN
    RETURN;
  END IF;

  -- 트랜잭션 시작
  BEGIN
    -- 이미 싫어요를 눌렀다면 싫어요 취소
    IF p_existing_like_kind = 0 THEN
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
      UPDATE votes
      SET like_kind = 1
      WHERE user_id = p_user_id AND topic_id = p_topic_id;
    ELSE
      -- 좋아요 증가
      UPDATE vote_topics
      SET likes = likes + 1
      WHERE id = p_topic_id;
      
      -- 기존 투표 레코드가 없는 경우 삽입
      INSERT INTO votes (user_id, topic_id, option_id, like_kind)
      VALUES (p_user_id, p_topic_id, 
        COALESCE(p_existing_option_id, (SELECT id FROM vote_options WHERE topic_id = p_topic_id LIMIT 1)), 
        1)
      ON CONFLICT (user_id, topic_id) 
      DO UPDATE SET like_kind = 1;
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
  p_existing_like_kind INTEGER;
  p_existing_option_id INTEGER;
  current_likes INTEGER;
  current_dislikes INTEGER;
BEGIN
  -- 기존 반응 확인
  SELECT like_kind, option_id INTO p_existing_like_kind, p_existing_option_id
  FROM votes
  WHERE user_id = p_user_id AND topic_id = p_topic_id;

  -- 현재 좋아요/싫어요 수 확인
  SELECT likes, dislikes INTO current_likes, current_dislikes
  FROM vote_topics
  WHERE id = p_topic_id;

  -- 이미 싫어요를 눌렀다면 아무 작업도 하지 않음
  IF p_existing_like_kind = 0 THEN
    RETURN;
  END IF;

  -- 트랜잭션 시작
  BEGIN
    -- 이미 좋아요를 눌렀다면 좋아요 취소
    IF p_existing_like_kind = 1 THEN
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
      UPDATE votes
      SET like_kind = 0
      WHERE user_id = p_user_id AND topic_id = p_topic_id;
    ELSE
      -- 싫어요 증가
      UPDATE vote_topics
      SET dislikes = dislikes + 1
      WHERE id = p_topic_id;
      
      -- 기존 투표 레코드가 없는 경우 삽입
      INSERT INTO votes (user_id, topic_id, option_id, like_kind)
      VALUES (p_user_id, p_topic_id, 
        COALESCE(p_existing_option_id, (SELECT id FROM vote_options WHERE topic_id = p_topic_id LIMIT 1)), 
        0)
      ON CONFLICT (user_id, topic_id) 
      DO UPDATE SET like_kind = 0;
    END IF;
  END;
END;
$$ LANGUAGE plpgsql;

-- 샘플 데이터 삽입
INSERT INTO users (username, email, profile_image, user_badge) VALUES
('헌왕', 'user1@example.com', 'https://randomuser.me/api/portraits/men/45.jpg', 2),
('푸드블로거', 'user2@example.com', 'https://randomuser.me/api/portraits/women/28.jpg', 1),
('테크인사이더', 'user3@example.com', 'https://randomuser.me/api/portraits/men/36.jpg', 3),
('여행블로거', 'user4@example.com', 'https://randomuser.me/api/portraits/women/42.jpg', 2),
('스포츠 전문가', 'user5@example.com', 'https://randomuser.me/api/portraits/men/22.jpg', 3);

-- 투표 주제 샘플 데이터
INSERT INTO vote_topics (user_id, question, link, type, expires_at) VALUES
((SELECT id FROM users WHERE username = '헌왕'), '다음 대선에서 가장 유력한 후보는?', 'news.naver.com/politics', 'text', NOW() + INTERVAL '3 days'),
((SELECT id FROM users WHERE username = '푸드블로거'), '가장 좋아하는 한식은?', 'blog.naver.com/foodtrends', 'text', NOW() + INTERVAL '10 hours'),
((SELECT id FROM users WHERE username = '테크인사이더'), '2023년 가장 혁신적인 기술은?', 'techcrunch.com/trends', 'text', NOW() + INTERVAL '7 days'),
((SELECT id FROM users WHERE username = '헌왕'), '올해 최고의 영화는?', 'rottentomatoes.com/reviews', 'image', NOW() - INTERVAL '1 day'),
((SELECT id FROM users WHERE username = '여행블로거'), '가장 가보고 싶은 여행지는?', 'tripadvisor.com/destinations', 'image', NOW() + INTERVAL '21 days'),
((SELECT id FROM users WHERE username = '스포츠 전문가'), '2024 올림픽에서 한국이 가장 많은 메달을 딸 종목은?', 'sports.naver.com/olympics', 'text', NOW() - INTERVAL '12 hours');

-- 투표 옵션 샘플 데이터
-- 첫 번째 투표 주제의 옵션들
INSERT INTO vote_options (topic_id, text, votes, image_class) VALUES
(1, '이재명', 120, 'default-image-blue'),
(1, '김문수', 80, 'default-image-red'),
(1, '이준석', 200, 'default-image-green');

-- 두 번째 투표 주제의 옵션들
INSERT INTO vote_options (topic_id, text, votes, image_class) VALUES
(2, '김치찌개', 150, 'default-image-food-1'),
(2, '비빔밥', 120, 'default-image-food-2'),
(2, '불고기', 100, 'default-image-food-3');

-- 세 번째 투표 주제의 옵션들
INSERT INTO vote_options (topic_id, text, votes, image_class) VALUES
(3, '인공지능', 300, 'default-image-purple'),
(3, '가상현실', 150, 'default-image-cyan'),
(3, '블록체인', 100, 'default-image-orange');

-- 네 번째 투표 주제의 옵션들
INSERT INTO vote_options (topic_id, text, votes, image_class) VALUES
(4, '오펜하이머', 250, 'default-image-blue'),
(4, '바비', 200, 'default-image-red'),
(4, '미션 임파서블', 150, 'default-image-green');

-- 다섯 번째 투표 주제의 옵션들
INSERT INTO vote_options (topic_id, text, votes, image_class) VALUES
(5, '발리', 180, 'default-image-cyan'),
(5, '스위스', 150, 'default-image-purple'),
(5, '하와이', 120, 'default-image-orange');

-- 여섯 번째 투표 주제의 옵션들
INSERT INTO vote_options (topic_id, text, votes, image_class) VALUES
(6, '양궁', 280, 'default-image-blue'),
(6, '태권도', 190, 'default-image-red'),
(6, '쇼트트랙', 230, 'default-image-green');

-- 투표 주제의 총 투표수 업데이트
UPDATE vote_topics SET total_votes = 400 WHERE id = 1;
UPDATE vote_topics SET total_votes = 370 WHERE id = 2;
UPDATE vote_topics SET total_votes = 550 WHERE id = 3;
UPDATE vote_topics SET total_votes = 600 WHERE id = 4;
UPDATE vote_topics SET total_votes = 450 WHERE id = 5;
UPDATE vote_topics SET total_votes = 700 WHERE id = 6;

-- 만료된 투표 표시
UPDATE vote_topics SET is_expired = TRUE WHERE expires_at < NOW(); 