import React, { useEffect, useState } from 'react';
import '../styles/VoteList.css';
import VoteCard from './VoteCard';
import VoteSkeletonCard from './VoteSkeletonCard';
import { useVoteContext } from '../context/VoteContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSearchModal } from './App';

// 투표 목록 컴포넌트
const VoteList: React.FC = () => {
  // Context에서 투표 데이터와 업데이트 함수 가져오기
  const { votes, updateVote, loading, error, refreshVotes, setError, myVotes, handleLike} = useVoteContext();
  const { openSearchModal } = useSearchModal();
  
  // 사용자가 참여한 투표 ID 목록
  const [participatedVoteIds, setParticipatedVoteIds] = useState<number[]>([]);
  
  // 스켈레톤 개수를 화면 크기에 따라 동적으로 조정
  const [skeletonCount, setSkeletonCount] = useState(6);

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

  // 활성화된 투표만 필터링 (투표 기간이 종료되지 않은 투표)
  const activeVotes = votes.filter(vote => !vote.is_expired && vote.visible);

  // 검색어로 투표 필터링
  const filteredVotes = searchQuery
    ? activeVotes.filter(vote => vote.question.toLowerCase().includes(searchQuery.toLowerCase()))
    : activeVotes;

  // 디버깅을 위한 로그 추가
  useEffect(() => {
    console.log('전체 투표 수:', votes.length);
    console.log('활성 투표 수:', activeVotes.length);
    console.log('검색 결과 투표 수:', filteredVotes.length);
    console.log('검색어:', searchQuery);
  }, [votes, activeVotes, filteredVotes, searchQuery]);

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
              검색 결과: {filteredVotes.length}개
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
        {loading ? (
          // 메모이제이션된 스켈레톤 카드 사용
          <>{skeletonCards}</>
        ) : filteredVotes.length === 0 ? (
          <div className="no-votes-message">
            {searchQuery ? (
              <p>검색 결과가 없습니다.</p>
            ) : (
              <p>현재 진행 중인 투표가 없습니다.</p>
            )}
          </div>
        ) : (
          filteredVotes.map(topic => (
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
      </div>
    </div>
  );
};

export default VoteList; 