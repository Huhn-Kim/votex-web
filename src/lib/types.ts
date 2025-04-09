// VoteTopic 인터페이스를 참고해서 투표카드의 테이블 DDL 작성해줘.
// 테이블들에 목업 데이터를 만들어줘. insert 문을 10개 생성해줘.
// @supabase.ts @types.ts 위 레퍼런스를 참고해서 supabse library를 사용해서, 투표카드를 생성, 수정, 삭제, 조회하는 기능의 API를 만들어줘.

// 데이터베이스 스키마 기반 타입 정의
// 뱃지 인터페이스
export interface Badge {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  acquired: boolean;
  acquiredDate?: string;
  color: string;
  level: number;
}

// 사용자 정보 인터페이스
export interface UserInfo {
  id: string;
  username: string;
  phone_number: string;
  email: string; //사용자 ID
  password: string; //사용자 비밀번호
  profile_Image: string; //사용자 프로필 이미지
  gender: string; //사용자 성별
  region: string; //사용자 지역
  interests: string; //사용자 관심사
  birthyear: number; //사용자 생년월일
  created_at: string; //사용자 가입일
  updated_at: string;
  votesCreated: number;
  votesParticipated: number;
  total_points: number; // 총 적립포인트
  monthly_points: number; // 월 적립포인트
  user_grade: number;
}

// 구독 회원 인터페이스
export interface Subscriber {
  id: string;
  name: string;
  profileImage: string;
  bio: string;
  isFollowing: boolean;
}

// 투표 주제 테이블 (vote_topics)
export interface VoteTopic {
  id: number;
  user_id: string;
  question: string;
  link: string;
  total_votes: number;
  today_votes: number;
  hourly_votes: number;
  comments: number;
  likes: number;
  type: string;
  display_type: string;
  created_at: string;
  expires_at: string;
  is_expired: boolean;
  vote_period: string;
  visible: boolean;
  related_image: string;
  
  // 조인된 데이터
  users: {
    id: string;
    username: string;
    email: string;
    profile_Image: string;
    user_grade: number;
    created_at: string;
    updated_at: string;
  };
  options: VoteOption[];
  selected_option?: number | null;  // 클라이언트 상태
}

// 투표 옵션 테이블 (vote_options)
export interface VoteOption {
  id: number;
  topic_id: number;
  text: string;
  votes: number;
  image_class: string;
  image_url: string;
  gender_stats: {
    male: number;
    female: number;
  };
  region_stats: {
    seoul: number;
    gyeonggi: number;
    incheon: number;
    busan: number;
    daegu: number;
    daejeon: number;
    gwangju: number;
    ulsan: number;
    sejong: number;
    gangwon: number;
    chungnam: number;
    chungbuk: number;
    jeonnam: number;
    jeonbuk: number;
    gyeongsang: number;
    gyeongnam: number;
    jeolla: number;
    jeju: number;
  };
  age_stats: {
    age10to19: number;
    age20to29: number;
    age30to39: number;
    age40to49: number;
    age50to59: number;
    age60to69: number;
    age70to79: number;
    age80plus: number;
  };
}

// 투표 결과 테이블 (vote_results)
export interface VoteResult {
  id: number;
  user_id: string;
  topic_id: number;
  option_id: number;
  created_at: string;
  like_kind: string;  // like, dislike
}

// createVoteTopic 함수 파라미터 타입
export interface VoteTopicCreateData {
  user_id: string;
  question: string;
  link?: string;
  display_type?: string;
  type?: string;
  expires_at?: string;
  visible?: boolean;
  related_image?: string;
  vote_period: string;
  options: Array<{
    text: string;
    image_url?: string;
    image_class?: string;
  }>;
}

// updateVoteTopic 함수 파라미터 타입
export interface VoteTopicUpdateData {
  id: number;
  question?: string;
  link?: string;
  display_type?: string;
  expires_at?: string;
  visible?: boolean;
  related_image?: string;
  vote_period?: string;
  options?: Array<{
    id?: number;
    text: string;
    topic_id?: number;
    votes?: number;
    image_url?: string;
    image_class?: string;
    gender_stats?: { male: number, female: number };
    region_stats?: {
      seoul: number;
      gyeonggi: number;
      incheon: number;
      busan: number;
      daegu: number;
      daejeon: number;
      gwangju: number;
      ulsan: number;
      sejong: number;
      gangwon: number;
      chungnam: number;
      chungbuk: number;
      jeonnam: number;
      jeonbuk: number;
      gyeongsang: number;
      gyeongnam: number;
      jeolla: number;
      jeju: number;
    };
    age_stats: {
      age10to19: number;
      age20to29: number;
      age30to39: number;
      age40to49: number;
      age50to59: number;
      age60to69: number;
    };
  }>;
}

// 사용자 좋아요/싫어요 상태
export interface ReactionStatus {
  liked: boolean;
}

// 기존 타입 정의에 추가
export interface VoteRank {
  id: number;
  topic_id: number;
  total_ranks: number;
  today_ranks: number;
  hourly_ranks: number;
  comments_ranks: number;
  total_rank_diff: number;
  today_rank_diff: number;
  hourly_rank_diff: number;
  comments_rank_diff: number;
  last_updated: string;
}