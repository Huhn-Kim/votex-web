import React, { useEffect, useState, useRef, useCallback } from 'react';
import '../styles/VoteList.css';
import VoteCard from './VoteCard';
import VoteSkeletonCard from './VoteSkeletonCard';
import { useVoteContext } from '../context/VoteContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSearchModal } from './App';
import { useAuth } from '../context/AuthContext';
import { VoteTopic } from '../lib/types';

// 투표 목록 컴포넌트
const VoteList: React.FC = () => {
  // Context에서 투표 데이터와 업데이트 함수 가져오기
  const { votes, updateVote, loading, error, refreshVotes, setError, myVotes, handleLike } = useVoteContext();
  const { openSearchModal } = useSearchModal();
  const { user } = useAuth();
  
  // 사용자가 참여한 투표 ID 목록
  const [participatedVoteIds, setParticipatedVoteIds] = useState<number[]>([]);
  
  // 스켈레톤 개수를 화면 크기에 따라 동적으로 조정
  const [skeletonCount, setSkeletonCount] = useState(6);

  // 무한 스크롤 관련 상태
  const [displayedVotes, setDisplayedVotes] = useState<VoteTopic[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);
  const PAGE_SIZE = 20;

  // URL에서 검색 쿼리 파라미터 가져오기
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const searchQuery = queryParams.get('search') || '';
  
  // 사용자가 참여한 투표 ID 목록 생성
  useEffect(() => {
    // myVotes에서 사용자가 생성한 투표 ID 추출
    const myVoteIds = myVotes.map(vote => vote.id);
    
    // votes에서 selected_option이 있는 투표 ID 추출 (사용자가 참여한 투표)
    const participatedIds = votes
      .filter(vote => vote.selected_option !== undefined && vote.selected_option !== null)
      .map(vote => vote.id);
    
    // 중복 제거하여 합치기
    const allParticipatedIds = [...new Set([...myVoteIds, ...participatedIds])];
    
    setParticipatedVoteIds(allParticipatedIds);
  }, [votes, myVotes]);
  
  useEffect(() => {
    const updateSkeletonCount = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setSkeletonCount(4); // 모바일
      } else if (width < 1024) {
        setSkeletonCount(6); // 태블릿
      } else {
        setSkeletonCount(8); // 데스크톱
      }
    };

    updateSkeletonCount();
    window.addEventListener('resize', updateSkeletonCount);
    return () => window.removeEventListener('resize', updateSkeletonCount);
  }, []);
  
  // 다시 시도 핸들러
  const handleRetry = () => {
    setError(null);
    refreshVotes();
  };

  // 검색 결과 초기화 핸들러
  const clearSearch = () => {
    navigate('/');
  };

  // 새 검색 모달 열기 핸들러
  const handleOpenSearchModal = () => {
    openSearchModal();
  };

  // 투표 우선순위에 따른 정렬 함수
  const prioritizeVotes = useCallback((votes: VoteTopic[]): VoteTopic[] => {
    // 4. 만료되지 않은 투표만 필터링
    const activeVotes = votes.filter(vote => !vote.is_expired && vote.visible);
    
    // 사용자 정보가 없는 경우
    if (!user) {
      // 최신순으로 정렬
      return activeVotes.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }
    
    // 사용자의 관심분야 
    const userInterests: string[] = user.interests || [];
    
    // 참여한 투표 ID 목록
    const participatedIds = participatedVoteIds;
    
    // 점수 기반 정렬
    return activeVotes.sort((a, b) => {
      // 각 항목별 점수 계산 (높을수록 우선순위 높음)
      
      // 1. 사용자 관심분야와 일치하는 투표 (최우선)
      const aAreas: string[] = a.type ? [a.type] : [];
      const bAreas: string[] = b.type ? [b.type] : [];
      
      const aInterestMatch = aAreas.some(area => userInterests.includes(area)) ? 1 : 0;
      const bInterestMatch = bAreas.some(area => userInterests.includes(area)) ? 1 : 0;
      
      if (aInterestMatch !== bInterestMatch) {
        return bInterestMatch - aInterestMatch; // 관심분야 일치하면 우선
      }
      
      // 2. 아직 참여하지 않은 투표 우선 (2위 우선순위)
      const aParticipated = participatedIds.includes(a.id) ? 1 : 0;
      const bParticipated = participatedIds.includes(b.id) ? 1 : 0;
      
      if (aParticipated !== bParticipated) {
        return aParticipated - bParticipated; // 참여하지 않은 항목 우선
      }
      
      // 3. 최신 투표 우선 (생성일 기준) (3위 우선순위)
      const aDate = new Date(a.created_at).getTime();
      const bDate = new Date(b.created_at).getTime();
      
      return bDate - aDate; // 최신 항목 우선
    });
  }, [user, participatedVoteIds]);

  // 검색어나 투표 목록이 변경되면 처음부터 다시 로드
  useEffect(() => {
    if (loading) return; // 로딩 중일 때는 실행하지 않음
    
    setDisplayedVotes([]);
    setPage(1);
    setHasMore(true);
    
    // 초기 데이터 로드
    const sortedVotes = prioritizeVotes(votes);
    const initialBatch = sortedVotes.slice(0, PAGE_SIZE);
    setDisplayedVotes(initialBatch);
    setPage(prev => prev + 1);
    setHasMore(initialBatch.length < sortedVotes.length);
    
  }, [searchQuery, votes, prioritizeVotes]); // votes가 바뀔 때만 재정렬

  // 사용자 정보 변경(로그인/로그아웃)이나 검색어 변경 시만 정렬 로직 재실행하기 위한 메모이제이션
  const memoizedPrioritizeVotes = useCallback((votes: VoteTopic[]): VoteTopic[] => {
    console.log('우선순위 기반 정렬 함수 실행됨');
    return prioritizeVotes(votes);
  }, [user, participatedVoteIds]); // user 객체가 바뀌면 재정렬

  // 필터링 및 정렬된 투표 목록
  const filteredVotes = useCallback(() => {
    let result = votes as VoteTopic[];
    
    // 검색어가 있는 경우 검색어로 필터링
    if (searchQuery) {
      result = result.filter(vote => 
        vote.question.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !vote.is_expired && 
        vote.visible
      );
      return result;
    }
    
    // 초기 로드 시에만 우선순위에 따라 정렬하고, 이후에는 투표해도 순서 유지
    return memoizedPrioritizeVotes(result);
  }, [votes, searchQuery, memoizedPrioritizeVotes]);

  // loadMoreVotes를 별도로 호출하지 않고 인터섹션 옵저버에서만 사용
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          // 여기서만 loadMoreVotes 호출
          const loadMore = () => {
            if (loadingMore || !hasMore) return;
            
            setLoadingMore(true);
            
            const sortedVotes = filteredVotes();
            const startIndex = (page - 1) * PAGE_SIZE;
            const endIndex = page * PAGE_SIZE;
            
            // 더 로드할 항목이 있는지 확인
            if (startIndex >= sortedVotes.length) {
              setHasMore(false);
              setLoadingMore(false);
              return;
            }
            
            // 현재 페이지에 해당하는 항목 가져오기
            const nextBatch = sortedVotes.slice(startIndex, endIndex);
            
            // 표시할 투표 목록에 추가
            setDisplayedVotes(prev => [...prev, ...nextBatch]);
            setPage(prev => prev + 1);
            setLoadingMore(false);
            
            // 더 로드할 항목이 있는지 확인
            if (endIndex >= sortedVotes.length) {
              setHasMore(false);
            }
          };
          
          loadMore();
        }
      },
      { threshold: 0.1 }
    );
    
    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }
    
    return () => {
      if (loaderRef.current) {
        observer.unobserve(loaderRef.current);
      }
    };
  }, [loaderRef, hasMore, loadingMore, loading, page, filteredVotes]);

  // 디버깅을 위한 로그 추가
  useEffect(() => {
    console.log('전체 투표 수:', votes.length);
    console.log('표시된 투표 수:', displayedVotes.length);
    console.log('검색어:', searchQuery);
    console.log('더 로드 가능:', hasMore);
  }, [votes.length, displayedVotes.length, searchQuery, hasMore]);

  // 스켈레톤 카드 메모이제이션
  const skeletonCards = React.useMemo(() => (
    [...Array(skeletonCount)].map((_, index) => (
      <VoteSkeletonCard key={`skeleton-${index}`} />
    ))
  ), [skeletonCount]);

  return (
    <div className="vote-card-list">
      {/* 검색 결과 표시 */}
      {searchQuery && (
        <div className="search-result-info">
          <div className="search-query-container">
            <div className="search-query">
              <span className="search-label">검색어: </span>
              <span className="search-term">{searchQuery}</span>
            </div>
            <div className="search-count">
              검색 결과: {filteredVotes().length}개
            </div>
          </div>
          <div className="search-buttons">
            <button 
              className="search-new-button"
              onClick={handleOpenSearchModal}
              title="새 검색"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              새 검색
            </button>
            <button
              className="search-clear-button"
              onClick={clearSearch}
              title="검색창 닫기"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
              닫기
            </button>
          </div>
        </div>
      )}

      {/* 오류 메시지 표시 */}
      {error && (
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button 
            className="retry-button"
            onClick={handleRetry}
          >
            다시 시도
          </button>
        </div>
      )}

      {/* 투표 목록 */}
      <div className="vote-cards">
        {loading && page === 1 ? (
          // 메모이제이션된 스켈레톤 카드 사용 (초기 로딩)
          <>{skeletonCards}</>
        ) : displayedVotes.length === 0 && !loading ? (
          <div className="no-votes-message">
            {searchQuery ? (
              <p>검색 결과가 없습니다.</p>
            ) : (
              <p>현재 진행 중인 투표가 없습니다.</p>
            )}
          </div>
        ) : (
          // 표시할 투표 목록
          displayedVotes.map(topic => (
            <VoteCard 
              key={topic.id} 
              topic={topic} 
              onVote={updateVote}
              onLike={() => handleLike(topic.id)}
              alwaysShowResults={participatedVoteIds.includes(topic.id)}
              isLoading={false}
            />
          ))
        )}
        
        {/* 무한 스크롤을 위한 로더 */}
        {hasMore && !loading && !error && (
          <div 
            ref={loaderRef} 
            className="loader-container"
          >
            {loadingMore && (
              <div className="loading-spinner"></div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VoteList; 