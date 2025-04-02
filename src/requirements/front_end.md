** 프로젝트 구조 **

## 1. 디렉토리 구조
```
votex-web/
├── public/                 # 정적 파일 디렉토리
│   ├── votey_icon2.png    # 기본 투표 이미지
│   └── ...
├── src/
│   ├── components/        # React 컴포넌트
│   │   ├── VoteCard.tsx   # 투표 카드 컴포넌트
│   │   ├── ViewRank.tsx   # 순위 보기 컴포넌트
│   │   ├── VoteForm.tsx   # 투표 생성 폼
│   │   ├── VoteList.tsx   # 투표 목록
│   │   ├── VoteResult.tsx # 투표 결과
│   │   └── common/        # 공통 컴포넌트
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       └── Modal.tsx
│   ├── context/          # React Context
│   │   └── VoteContext.tsx # 투표 관련 전역 상태 관리
│   ├── lib/              # 유틸리티 및 API
│   │   ├── api.ts        # API 호출 함수
│   │   ├── supabase.ts   # Supabase 클라이언트
│   │   ├── types.ts      # TypeScript 타입 정의
│   │   └── constants.ts  # 상수 정의
│   ├── styles/           # CSS 모듈
│   │   ├── ViewRank.module.css
│   │   ├── VoteCard.module.css
│   │   ├── VoteForm.module.css
│   │   └── common/       # 공통 스타일
│   │       ├── button.module.css
│   │       └── input.module.css
│   ├── utils/            # 유틸리티 함수
│   │   ├── numberFormat.ts # 숫자 포맷팅
│   │   ├── dateFormat.ts   # 날짜 포맷팅
│   │   └── validation.ts   # 유효성 검사
│   ├── hooks/            # 커스텀 훅
│   │   ├── useVote.ts    # 투표 관련 훅
│   │   └── useAuth.ts    # 인증 관련 훅
│   └── pages/            # Next.js 페이지
│       ├── index.tsx     # 메인 페이지
│       ├── create.tsx    # 투표 생성 페이지
│       └── [id].tsx      # 투표 상세 페이지
└── package.json          # 프로젝트 설정 및 의존성
```

## 2. 주요 컴포넌트 설명

### 2.1 ViewRank.tsx
- 투표 순위를 표시하는 메인 컴포넌트
- 주요 기능:
  - 투표 목록 표시 및 정렬
  - 검색 기능
  - 진행/종료 상태 토글
  - 모바일 반응형 디자인
  - 이미지 로딩 및 에러 처리
  - 카드 확장/축소 기능
  - 순위 변화 표시
  - 남은 시간 표시

### 2.2 VoteCard.tsx
- 개별 투표 카드 컴포넌트
- 주요 기능:
  - 투표 정보 표시
  - 투표 기능
  - 좋아요/싫어요 기능
  - 결과 표시
  - 이미지 표시
  - 옵션 선택
  - 투표 통계

### 2.3 VoteForm.tsx
- 투표 생성/수정 폼 컴포넌트
- 주요 기능:
  - 투표 제목 입력
  - 옵션 추가/삭제
  - 이미지 업로드
  - 기간 설정
  - 공개/비공개 설정

## 3. 상태 관리

### 3.1 VoteContext.tsx
- 전역 상태 관리 시스템
- 주요 상태:
  ```typescript
  interface VoteContextType {
    votes: VoteTopic[];              // 전체 투표 목록
    myVotes: VoteTopic[];           // 사용자의 투표 목록
    loading: boolean;               // 로딩 상태
    error: string | null;           // 에러 상태
    progress: number;               // 진행 상태
    progressStatus: string;         // 진행 상태 메시지
    userReactions: Map<number, {    // 사용자 반응 상태
      liked: boolean,
      disliked: boolean
    }>;
    userVotes: Map<number, number | null>; // 사용자 투표 상태
  }
  ```
- 주요 기능:
  1. 투표 데이터 관리
     - 투표 목록 조회
     - 투표 생성/수정/삭제
     - 투표 상태 업데이트
  2. 사용자 반응 관리
     - 좋아요/싫어요 처리
     - 투표 선택 처리
     - 반응 상태 동기화
  3. 데이터 동기화
     - 실시간 업데이트
     - 캐시 관리
     - 에러 처리
  4. 성능 최적화
     - 메모이제이션
     - 배치 업데이트
     - 지연 로딩

## 4. 스타일링

### 4.1 CSS 모듈
- 컴포넌트별 스타일 분리
- 주요 스타일:
  - 반응형 디자인
  - 다크 모드
  - 애니메이션 효과
  - 모바일 최적화
  - 테마 시스템
  - 접근성 고려

### 4.2 공통 스타일
- 버튼 스타일
- 입력 필드 스타일
- 모달 스타일
- 카드 스타일
- 그리드 시스템

## 5. API 통신

### 5.1 Supabase
- 데이터베이스 연동
- 주요 기능:
  - 투표 데이터 CRUD
  - 사용자 인증
  - 실시간 업데이트
  - 이미지 스토리지
  - RLS(Row Level Security)

### 5.2 API
- RESTful API 통신
- 주요 엔드포인트:
  - 투표 목록 조회
  - 투표 생성/수정/삭제
  - 순위 업데이트
  - 사용자 인증
  - 이미지 업로드

## 6. 성능 최적화

### 6.1 이미지 처리
- 이미지 최적화
- 지연 로딩
- 에러 처리
- 캐싱
- WebP 포맷 지원
- 반응형 이미지

### 6.2 렌더링 최적화
- 메모이제이션
- 가상화
- 조건부 렌더링
- 코드 스플리팅
- 번들 최적화

## 7. 접근성

### 7.1 웹 접근성
- ARIA 레이블
- 키보드 네비게이션
- 색상 대비
- 스크린 리더 지원
- 포커스 관리
- 시맨틱 HTML

## 8. 보안

### 8.1 데이터 보안
- API 인증
- XSS 방지
- CSRF 방지
- 입력 유효성 검사
- SQL 인젝션 방지
- Rate Limiting

### 8.2 사용자 보안
- 비밀번호 암호화
- 세션 관리
- 권한 관리
- 로그인 시도 제한

