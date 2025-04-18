import { useState, useEffect, useMemo } from "react";
import { useVoteContext } from "../context/VoteContext";
import { VoteTopic, VoteRank } from "../lib/types";
import styles from "../styles/ViewRank.module.css";
import "../styles/TabStyles.css";
import VoteCard from './VoteCard';
import supabase from '../lib/supabase';
import { formatNumber } from '../utils/numberFormat';
import RankSkeletonCard from './RankSkeletonCard';

interface RankedVoteData {
  topic: VoteTopic;
  rank: VoteRank;
}

// 상수 추가
const DEFAULT_VOTE_IMAGE = '/votey_icon2.png';

// 남은 기간 계산 함수 추가
const calculateRemainingTime = (expiresAt: string): string => {
  const now = new Date();
  const expireDate = new Date(expiresAt);
  const diffTime = expireDate.getTime() - now.getTime();
  
  if (diffTime <= 0) {
    return '종료';
  }

  // 밀리초를 각 단위로 변환
  const minutes = Math.floor(diffTime / (1000 * 60));
  const hours = minutes / 60;  // 소수점 유지
  const days = hours / 24;     // 소수점 유지
  const months = days / 30;    // 소수점 유지

  // 1시간 이내: 분 단위
  if (hours < 1) {
    return `${Math.floor(minutes)}분`;
  }
  // 24시간 이내: 시간 단위
  if (hours < 24) {
    return `${Math.floor(hours)}시간`;
  }
  // 30일 이내: 일 단위
  if (days < 30) {
    return `${Math.floor(days)}일`;
  }
  // 그 이상: 월 단위
  return `${Math.floor(months)}개월`;
};


// 이미지 우선순위 결정 함수
const getImageByPriority = (topic: VoteTopic): string => {
  if (topic.related_image) {
    return topic.related_image;
  }
  
  const firstOptionImage = topic.options?.[0]?.image_url;
  if (firstOptionImage) {
    return firstOptionImage;
  }
  
  return DEFAULT_VOTE_IMAGE;
};

// 이미지 프리로딩 함수
const preloadImages = (votes: RankedVoteData[]) => {
  const firstBatchSize = 10; // 처음 10개만 즉시 로드
  
  votes.slice(0, firstBatchSize).forEach(({ topic }) => {
    if (!topic) return;
    const imageUrl = getImageByPriority(topic);
    const img = new Image();
    img.src = imageUrl;
  });
};

export default function ViewRank() {
  const { 
    getRankedVotes, 
    loadUserReaction,
    userVotes,
    updateVote,
    handleLike,
  } = useVoteContext();
  
  // AuthContext에서 현재 로그인한 사용자 정보 가져오기
  // const { user } = useAuth();
  // const userId = user?.id || '';
  
  const [searchQuery, setSearchQuery] = useState("");
  const [sortCriteria, setSortCriteria] = useState<'total' | 'today' | 'hourly' | 'comments'>('total');
  const [isActive, setIsActive] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [rankedVotes, setRankedVotes] = useState<RankedVoteData[]>([]);
  const [imageUrls, setImageUrls] = useState<Map<number, string>>(new Map());
  const [imageLoadingStates, setImageLoadingStates] = useState<Map<number, boolean>>(new Map());
  const [initialLoading, setInitialLoading] = useState(true);
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);

  // 화면 크기 감지
  useEffect(() => {
    const checkIfMobile = () => setIsMobile(window.innerWidth <= 600);
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  useEffect(() => {
    if (selectedTopicId) {
      const element = document.getElementById(`card-${selectedTopicId}`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedTopicId]);

  // 마운트 될 때 데이터 가져오기 - 로딩 최적화
  useEffect(() => {
    let isMounted = true;

    const fetchVoteRankData = async () => {
      try {
        // 데이터가 없을 경우만 로딩 표시
        if (rankedVotes.length === 0) {
        setInitialLoading(true);
        }
        
        // 최대 500ms 동안만 로딩 표시
        const loadingTimeout = setTimeout(() => {
          if (isMounted) {
            setInitialLoading(false);
          }
        }, 500);
        
        // 데이터 가져오기
        const data = await getRankedVotes(sortCriteria);
        
        // 타임아웃 취소
        clearTimeout(loadingTimeout);
        
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setRankedVotes(data);
          // 데이터를 받은 후 이미지 프리로딩 시작
          preloadImages(data);
        }
      } catch (error) {
        console.error('순위 데이터 로드 중 오류:', error);
      } finally {
        if (isMounted) {
          setInitialLoading(false);
        }
      }
    };

    // 약간의 지연 후 데이터 로드 시작 (UI 반응성 향상)
    const minLoadingTime = setTimeout(() => {
    fetchVoteRankData();
    }, 100);

    return () => {
      isMounted = false;
      clearTimeout(minLoadingTime);
    };
  }, [sortCriteria, getRankedVotes]);

  // 검색어가 있을 때만 필터링과 100위 제한을 위한 useMemo 수정
  const displayVotes = useMemo(() => {
    let filteredVotes = rankedVotes;
    
    // 진행/종료 상태에 따른 필터링
    filteredVotes = rankedVotes.filter(({ topic }) => {
      const isExpired = topic?.is_expired || new Date(topic?.expires_at || '') <= new Date();
      return isActive ? !isExpired : isExpired;
    });
    
    // 검색어가 있을 경우 필터링
    if (searchQuery.trim()) {
      filteredVotes = filteredVotes.filter(({ topic }) => 
        topic?.question?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // 100위까지만 제한
    return filteredVotes.slice(0, 100);
  }, [rankedVotes, searchQuery, isActive]);

  // useEffect를 map 밖으로 이동
  useEffect(() => {
    displayVotes.forEach(({ topic }) => {
      if (!topic) return;
      
      const newImageUrl = getImageByPriority(topic);
      
      // 이미지가 이미 로드된 경우 스킵
      if (imageUrls.get(topic.id) === newImageUrl) return;

      // 로딩 상태 설정
      setImageLoadingStates(prev => new Map(prev).set(topic.id, true));
      
      const img = new Image();
      img.onload = () => {
        setImageUrls(prev => new Map(prev).set(topic.id, newImageUrl));
        setImageLoadingStates(prev => new Map(prev).set(topic.id, false));
      };
      img.onerror = () => {
        console.log('이미지 로드 실패, 디폴트 이미지로 대체:', topic.id);
        setImageUrls(prev => new Map(prev).set(topic.id, DEFAULT_VOTE_IMAGE));
        setImageLoadingStates(prev => new Map(prev).set(topic.id, false));
      };
      img.src = newImageUrl;
    });
  }, [displayVotes]);

  // 토글 상태가 변경될 때 정렬 기준 조정
  const handleToggleChange = (newIsActive: boolean) => {
    setIsActive(newIsActive);
    if (!newIsActive && (sortCriteria === 'today' || sortCriteria === 'hourly')) {
      setSortCriteria('total');
    }
  };

  // 순위 변화 표시 함수 수정
  const getRankChangeIndicator = (rank: VoteRank | undefined) => {
    if (!rank) return <span>-</span>;

    const diff = 
      sortCriteria === 'total' ? rank.total_rank_diff :
      sortCriteria === 'today' ? rank.today_rank_diff :
      sortCriteria === 'hourly' ? rank.hourly_rank_diff : 
      sortCriteria === 'comments' ? rank.comments_rank_diff :
      0;

    if (diff === 0) return <span>-</span>;
    if (diff > 0) return <span className="text-green-500">↑{diff}</span>;
    return <span className="text-red-500">↓{Math.abs(diff)}</span>;
  };

  // 순위 뱃지 렌더링 함수 수정
  const getRankBadge = (rank: number) => {
    if (rank <= 3) {
      const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉";
      return <span className={styles.topRankBadge}>{medal}</span>;
    }
    return <span className={styles.rankBadge}>{rank}</span>;
  };

  // VoteCard 렌더링 부분 수정
  const renderVoteCard = (topic: VoteTopic) => {
    const defaultUserInfo = {
      id: '',
      username: '사용자',
      email: '',
      profile_Image: '',
      user_grade: 0,
      created_at: '',
      updated_at: ''
    };

    const userInfo = topic.users || defaultUserInfo;
    const votePeriod = topic.vote_period || '기간 미설정';

    // 투표 처리 핸들러
    const handleVote = async (topicId: number, optionId: number) => {
      try {
        await updateVote(topicId, optionId);
        
        // 투표 후 사용자 반응 정보 갱신
        await loadUserReaction(topicId);
        
        // 데이터 갱신
        const updatedData = await getRankedVotes(sortCriteria);
        if (Array.isArray(updatedData)) {
          setRankedVotes(updatedData);
        }
      } catch (error) {
        console.error('투표 처리 중 오류:', error);
      }
    };

    return (
      <VoteCard 
        key={topic.id}
        id={`expanded-card-${topic.id}`}
        topic={{
          ...topic,
          users: userInfo,
          vote_period: votePeriod,
        }}
        onVote={handleVote}
        onLike={() => handleLike(topic.id)}
        alwaysShowResults={true}
        showPeriodInsteadOfDate={true}
        isMyVote={false}
        disableOptions={false}
      />
    );
  };

  // VoteCard 컴포넌트 메모이제이션
  const MemoizedVoteCard = useMemo(() => {
    if (!selectedTopicId) return null;
    
    const selectedVote = displayVotes.find(v => v.topic.id === selectedTopicId);
    if (!selectedVote) return null;

    return renderVoteCard(selectedVote.topic);
  }, [selectedTopicId, displayVotes]);

  // 카드 클릭 핸들러 수정
  const handleCardClick = async (topicId: number) => {
    try {
      if (selectedTopicId === topicId) {
        setSelectedTopicId(null);
      } else {
        // 사용자 정보와 반응 정보 로드
        await loadUserReaction(topicId);
        
        // 선택된 topic의 사용자 정보 가져오기
        const { data: userData, error: userError } = await supabase
          .from('vote_topics')
          .select(`
            *,
            users (
              id,
              username,
              email,
              profile_Image,
              user_grade,
              created_at,
              updated_at
            )
          `)
          .eq('id', topicId)
          .single();

        if (userError) throw userError;

        // rankedVotes 업데이트
        setRankedVotes(prev => prev.map(item => {
          if (item.topic.id === topicId) {
            return {
              ...item,
              topic: {
                ...item.topic,
                users: userData.users,
                selected_option: userVotes.get(topicId) || null // 미리 로드된 사용자 투표 정보 사용
              }
            };
          }
          return item;
        }));

        setSelectedTopicId(topicId);
      }
    } catch (error) {
      console.error('카드 클릭 처리 중 오류:', error);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (e.target === e.currentTarget) {
      setSelectedTopicId(null);
    }
  };

  // 디바운스 함수 추가
  const debounce = (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout;
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  // 스크롤 이벤트 핸들러 수정
  useEffect(() => {
    if (!selectedTopicId) return;

    const handleScroll = () => {
      const expandedCard = document.getElementById(`expanded-card-${selectedTopicId}`);
      if (!expandedCard) return;

      const rect = expandedCard.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const threshold = 100; // 화면에서 벗어난 임계값
      
      // 카드가 화면에서 벗어났는지 확인 (임계값 적용)
      if (rect.bottom < -threshold || rect.top > windowHeight + threshold) {
        console.log('카드가 화면을 벗어남:', {
          bottom: rect.bottom,
          top: rect.top,
          windowHeight,
          threshold
        });
        setSelectedTopicId(null);
      }
    };

    // 디바운스된 스크롤 핸들러 생성
    const debouncedHandleScroll = debounce(handleScroll, 100);

    // 스크롤 이벤트 리스너 등록
    window.addEventListener('scroll', debouncedHandleScroll, { passive: true });
    
    // 터치 이벤트도 추가 (모바일 대응)
    window.addEventListener('touchmove', debouncedHandleScroll, { passive: true });

    // 초기 체크
    handleScroll();

    return () => {
      window.removeEventListener('scroll', debouncedHandleScroll);
      window.removeEventListener('touchmove', debouncedHandleScroll);
    };
  }, [selectedTopicId]);

  return (
    <div>
      {/* 탭 메뉴 영역 - class 이름을 공통 스타일과 일치하도록 수정 */}
      <div className="vote-tabs">
        <div className="tab-list">
          <div className={styles.toggleSwitch}>
            <input 
              type="checkbox" 
              id="toggle-switch" 
              className={styles.toggleInput} 
              checked={isActive}
              onChange={() => handleToggleChange(!isActive)}
            />
            <label htmlFor="toggle-switch" className={styles.toggleLabel}>
              <span className={styles.toggleIcon}>
                {isActive ? "✓" : "✗"}
              </span>
              <span className={styles.toggleText}>
                {isMobile ? (isActive ? "진행" : "종료") : (isActive ? "진행중" : "종료됨")}
              </span>
            </label>
          </div>
          
          <button 
            className={`tab-button ${sortCriteria === "total" ? 'active' : ''}`}
            onClick={() => setSortCriteria("total")}
          >
            {isMobile ? "총득표" : "총득표수"}
          </button>
          {isActive && (
            <button 
              className={`tab-button ${sortCriteria === "today" ? 'active' : ''}`}
              onClick={() => setSortCriteria("today")}
            >
              {isMobile ? "오늘득표" : "오늘득표수"}
            </button>
          )}
          {isActive && (
            <button 
              className={`tab-button ${sortCriteria === "hourly" ? 'active' : ''}`}
              onClick={() => setSortCriteria("hourly")}
            >
              {isMobile ? "급등중" : "관심급등"}
            </button>
          )}
          <button 
            className={`tab-button ${sortCriteria === "comments" ? 'active' : ''}`}
            onClick={() => setSortCriteria("comments")}
          >
            {isMobile ? "댓글수" : "댓글수"}
          </button>
        </div>
      </div>

      {/* 검색 영역 */}
      <div className={styles.searchContainer}>
        <input
          type="search"
          placeholder="투표 검색..."
          className={styles.searchInput}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* 카드 목록 */}
      <div className={styles.cardList}>
        {initialLoading ? (
          // 스켈레톤 UI 표시
          <>
            {[...Array(10)].map((_, index) => (
              <RankSkeletonCard key={index} />
            ))}
          </>
        ) : displayVotes.length > 0 ? (
          // 실제 데이터 표시
          displayVotes.map(({ topic, rank }, index) => {
            if (index >= 100) return null;
            
            return (
              <div key={topic.id} className={styles.cardContainer}>
                <div 
                  className={`${styles.card} ${selectedTopicId === topic.id ? styles.selected : ''}`}
                  onClick={() => handleCardClick(topic.id)}
                >
                  <div className={styles.cardRank}>
                    <span className={styles.rankBadge}>{getRankBadge(index + 1)}</span>
                    {getRankChangeIndicator(rank)}
                  </div>
                  <div className={styles.cardThumbnail}>
                    <img 
                      src={imageUrls.get(topic.id) || DEFAULT_VOTE_IMAGE}
                      alt={topic?.question || '투표 이미지'} 
                      className={`${styles.thumbnailImage} ${
                        imageUrls.get(topic.id) === DEFAULT_VOTE_IMAGE ? styles.defaultImage : ''
                      } ${imageLoadingStates.get(topic.id) ? styles.loading : ''} ${
                        topic.options?.[0]?.image_url ? styles.optionImage : ''
                      }`}
                      loading="lazy"
                      onError={(_: React.SyntheticEvent<HTMLImageElement, Event>) => {
                        console.log('이미지 렌더링 실패:', topic.id);
                        setImageUrls(prev => new Map(prev).set(topic.id, DEFAULT_VOTE_IMAGE));
                        setImageLoadingStates(prev => new Map(prev).set(topic.id, false));
                      }}
                    />
                  </div>
                  <div className={styles.cardContent}>
                    <h3 className={styles.cardTitle}>{topic?.question || '제목 없음'}</h3>
                    <div className={styles.cardStats}>
                      <div className={styles.statItem}>
                        <span className={styles.statLabel}>오늘/전체:</span>
                        <span className={styles.statValue}>
                          {formatNumber(topic?.today_votes || 0)}/
                          {formatNumber(topic?.total_votes || 0)}
                        </span>
                      </div>
                      <div className={styles.statItem}>
                        <span className={styles.statLabel}>댓글:</span>
                        <span className={styles.statValue}>
                          {formatNumber(topic?.comments || 0)}
                        </span>
                      </div>
                      {sortCriteria === "hourly" && (
                        <div className={styles.statItem}>
                          <span className={styles.statLabel}>급상승:</span>
                          <span className={styles.statValue}>
                            {formatNumber(topic?.hourly_votes || 0)}표/시간
                          </span>
                        </div>
                      )}
                      <div className={styles.statItem} style={{ marginLeft: 'auto' }}>
                        <span className={`${styles.remainingTime} ${(topic?.is_expired || new Date(topic?.expires_at || '') <= new Date()) ? styles.expired : ''}`}>
                          {topic?.is_expired || new Date(topic?.expires_at || '') <= new Date() ? '종료' : `${calculateRemainingTime(topic.expires_at)} 남음`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* 확장된 VoteCard */}
                {selectedTopicId === topic.id && (
                  <div 
                    className={styles.backdrop}
                    onClick={handleBackdropClick}
                  >
                    <div className={styles.expandedCard}>
                      <div className={styles.expandedCardContent} onClick={e => e.stopPropagation()}>
                        {MemoizedVoteCard}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <p className={styles.noResults}>
            {searchQuery ? "검색 결과가 없습니다." : "표시할 데이터가 없습니다."}
          </p>
        )}
      </div>
    </div>
  );
}
