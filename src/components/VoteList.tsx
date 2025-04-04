import React, { useEffect, useState } from 'react';
import '../styles/VoteList.css';
import VoteCard from './VoteCard';
import VoteSkeletonCard from './VoteSkeletonCard';
import { useVoteContext } from '../context/VoteContext';

// 투표 목록 컴포넌트
const VoteList: React.FC = () => {
  // Context에서 투표 데이터와 업데이트 함수 가져오기
  const { votes, updateVote, loading, error, refreshVotes, setError, myVotes, handleLike, handleDislike } = useVoteContext();
  
  // 사용자가 참여한 투표 ID 목록
  const [participatedVoteIds, setParticipatedVoteIds] = useState<number[]>([]);
  
  // 스켈레톤 개수를 화면 크기에 따라 동적으로 조정
  const [skeletonCount, setSkeletonCount] = useState(6);
  
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

  // 활성화된 투표만 필터링 (투표 기간이 종료되지 않은 투표)
  const activeVotes = votes.filter(vote => !vote.is_expired && vote.visible);

  // 스켈레톤 카드 메모이제이션
  const skeletonCards = React.useMemo(() => (
    [...Array(skeletonCount)].map((_, index) => (
      <VoteSkeletonCard key={`skeleton-${index}`} />
    ))
  ), [skeletonCount]);

  return (
    <div className="vote-card-list">
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
        ) : activeVotes.length === 0 ? (
          <div className="no-votes-message">
            <p>현재 진행 중인 투표가 없습니다.</p>
          </div>
        ) : (
          activeVotes.map(topic => (
            <VoteCard 
              key={topic.id} 
              topic={topic} 
              onVote={updateVote}
              onLike={() => handleLike(topic.id)}
              onDislike={() => handleDislike(topic.id)}
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