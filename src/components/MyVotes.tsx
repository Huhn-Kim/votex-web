import React, { useState, useEffect, useMemo } from 'react';
import '../styles/MyVotes.module.css';
import '../styles/TabStyles.css';
import VoteCard from './VoteCard';
import VoteSkeletonCard from './VoteSkeletonCard';
import { useVoteContext } from '../context/VoteContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { VoteTopic } from '../lib/types';
import { formatNumber } from '../utils/numberFormat';
import { useAuth } from '../context/AuthContext';

// 내 투표 컴포넌트
const MyVotes: React.FC = () => {
  console.log('MyVotes 컴포넌트 렌더링');
  
  // 현재 선택된 탭 상태를 localStorage에서 가져오도록 수정
  const [activeTab, setActiveTab] = useState<'created' | 'participated'>(() => {
    // localStorage에서 저장된 탭 상태 가져오기
    const savedTab = localStorage.getItem('myVotesActiveTab');
    return (savedTab as 'created' | 'participated') || 'created';
  });
  const [initialLoading, setInitialLoading] = useState(true); // 초기 로딩 상태 추가
  const [lastViewedVoteId, setLastViewedVoteId] = useState<string | null>(null);

  // AuthContext에서 현재 로그인한 사용자 정보 가져오기
  const { user } = useAuth();
  const userId = user?.id || '';
  
  // Context에서 내 투표 데이터와 업데이트 함수 가져오기
  const { 
    myVotes, 
    updateVote, 
    loading, 
    error, 
    refreshVotes, 
    deleteTopic, 
    updateVoteTopic,
    handleLike,
    progress,
    progressStatus
  } = useVoteContext();
  
  const navigate = useNavigate();
  const location = useLocation();
  
  console.log('MyVotes 상태:', { myVotes: myVotes.length, loading, error });

  // 초기 로딩 처리
  useEffect(() => {
    const initializeData = async () => {
      if (myVotes.length === 0) {
        await refreshVotes();
      }
      // 데이터 로딩이 완료되면 초기 로딩 상태를 false로 설정
      setInitialLoading(false);
    };

    initializeData();
  }, []);

  // useMemo를 사용하여 필터링 결과 메모이제이션
  const filteredVotes = useMemo(() => {
    return {
      created: myVotes.filter(vote => vote.user_id === userId),
      participated: myVotes.filter(vote => 
        vote.user_id !== userId && vote.selected_option !== null
      )
    };
  }, [myVotes, userId]);

  // 스크롤 위치 저장
  useEffect(() => {
    const handleScroll = () => {
      sessionStorage.setItem('myVotesScrollPosition', window.scrollY.toString());
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 스크롤 위치 복원 및 마지막으로 본 투표 ID 처리
  useEffect(() => {
    const savedScrollPosition = sessionStorage.getItem('myVotesScrollPosition');
    const lastViewedId = sessionStorage.getItem('lastViewedVoteAnalysisId');
    
    if (lastViewedId) {
      setLastViewedVoteId(lastViewedId);
      // 데이터가 로딩되면 해당 카드로 스크롤하기 위해 ID 저장
      setTimeout(() => {
        const element = document.getElementById(`vote-card-${lastViewedId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('highlight-card');
          // 하이라이트 효과 제거를 위한 타이머
          setTimeout(() => {
            element.classList.remove('highlight-card');
          }, 2000);
        }
        // 처리 후 세션 스토리지에서 제거
        sessionStorage.removeItem('lastViewedVoteAnalysisId');
      }, 500); // 데이터 및 DOM이 준비된 후 스크롤
    } 
    else if (savedScrollPosition) {
      // 마지막 본 투표가 없는 경우 기존의 스크롤 위치 복원
      setTimeout(() => {
        window.scrollTo({
          top: parseInt(savedScrollPosition),
          behavior: 'instant'
        });
      }, 100);
    }
  }, [location.pathname, myVotes.length]); // 경로 변경 및 투표 데이터 로드 완료 시 다시 실행

  // 투표 삭제 핸들러
  const handleDeleteVote = async (topicId: number) => {
    try {
      // 세션 스토리지에 스크롤 위치 저장
      sessionStorage.setItem('myVotesScrollPosition', window.scrollY.toString());
      // 실제 삭제 함수 호출
      await deleteTopic(topicId);
      // 삭제 성공 후 필요한 UI 업데이트 로직 (예: 목록 새로고침)이 여기에 필요할 수 있습니다.
      // (현재 코드에는 없으므로 필요 시 추가해야 합니다)
    } catch (err) {
      console.error('투표 삭제 중 오류 발생:', err);
      // 사용자에게 오류 메시지 표시 등의 추가 처리 가능
    }
  };

  // 투표 업로드 핸들러
  const handlePublishVote = async (topicId: number) => {
    try {
      // 세션 스토리지에 스크롤 위치 저장
      sessionStorage.setItem('myVotesScrollPosition', window.scrollY.toString());
      
      // 해당 투표 데이터 찾기
      const voteTopic = myVotes.find(vote => vote.id === topicId);
      if (!voteTopic) {
          console.error(`ID가 ${topicId}인 투표를 찾을 수 없습니다.`);
          alert('투표 정보를 찾을 수 없습니다.');
          return; // 투표 정보 없으면 함수 종료
      }

      const now = new Date();
      let expiryDate: Date;

      // 투표 기간에 따른 종료일 계산
      switch (voteTopic.vote_period) {
        case '1일':
          expiryDate = new Date(now);
          expiryDate.setDate(now.getDate() + 1);
          // 정확히 24시간 후로 설정 (시간/분/초 유지)
          expiryDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
          break;

        case '3일':
          expiryDate = new Date(now);
          expiryDate.setDate(now.getDate() + 3);
          expiryDate.setHours(23, 59, 59, 999); // 해당 날짜의 끝 시간으로 설정
          break;

        case '1주일':
          expiryDate = new Date(now);
          expiryDate.setDate(now.getDate() + 7);
          expiryDate.setHours(23, 59, 59, 999);
          break;

        case '1개월':
          expiryDate = new Date(now);
          expiryDate.setMonth(now.getMonth() + 1);
          expiryDate.setHours(23, 59, 59, 999);
          break;

        default:
          // 특정일(~YYYY/MM/DD) 형식 처리
          if (voteTopic.vote_period.startsWith('~')) {
            const dateStr = voteTopic.vote_period.substring(1); // ~ 제거
            // 날짜 파싱 시 유효성 검사 강화
            try {
              const [year, month, day] = dateStr.split('/').map(num => parseInt(num, 10));
              if (isNaN(year) || isNaN(month) || isNaN(day)) {
                throw new Error('날짜 형식이 잘못되었습니다.');
              }
              // 월은 0부터 시작하므로 1 빼주기
              expiryDate = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

              // 현재 시간과 비교하여 유효성 검사 (UTC 기준으로 비교)
              if (expiryDate <= new Date(Date.now())) {
                 alert('만료일이 현재 시간보다 이전입니다. 투표 기간을 다시 설정해주세요.');
                 return; // 만료일이 유효하지 않으면 함수 종료
              }
            } catch (parseError) {
               console.error('특정일 파싱 오류:', parseError);
               alert('투표 기간 형식이 잘못되었습니다. 다시 설정해주세요.');
               return; // 날짜 파싱 실패 시 함수 종료
            }
          } else {
            // 유효하지 않은 기간 문자열 처리 (기본값: 1주일)
            console.warn(`알 수 없는 투표 기간 형식: ${voteTopic.vote_period}. 기본값(1주일)으로 설정합니다.`);
            expiryDate = new Date(now);
            expiryDate.setDate(now.getDate() + 7);
            expiryDate.setHours(23, 59, 59, 999);
          }
      }

      // 디버깅을 위한 로그
      console.log('투표 업로드 정보:', {
        투표ID: topicId,
        현재시간: now.toISOString(),
        계산된_종료시간: expiryDate.toISOString(),
        입력된_투표기간: voteTopic.vote_period
      });

      // 업데이트할 데이터 준비
      const updateData = {
        id: topicId,
        visible: true, // 공개 상태로 변경
        expires_at: expiryDate.toISOString(), // 계산된 만료 시간
        // vote_period는 변경하지 않음 (원본 유지)
        is_expired: false // 만료 상태 초기화
      };

      // 투표 업데이트 API 호출
      await updateVoteTopic(updateData);
      
      // 투표 목록 새로고침 (상태 업데이트 반영)
      await refreshVotes();

    } catch (err) {
      console.error('투표 업로드 중 오류 발생:', err);
      alert('투표 업로드 중 오류가 발생했습니다.'); // 사용자에게 오류 알림
    }
  };

  // 투표 수정 핸들러
  const handleEditVote = (topicId: number) => {
    sessionStorage.setItem('myVotesScrollPosition', window.scrollY.toString());
    navigate(`/edit-vote/${topicId}`);
  };

  // 로딩 상태 디버깅을 위한 로그 추가
  useEffect(() => {
    console.log('로딩 상태:', loading);
  }, [loading]);

  // 스켈레톤 카드 메모이제이션
  const skeletonCards = useMemo(() => (
    [...Array(5)].map((_, index) => (
      <VoteSkeletonCard key={`skeleton-${index}`} />
    ))
  ), []);

  // 투표 목록 렌더링 함수
  const renderVoteList = (votes: VoteTopic[]) => {
    if (votes.length === 0) {
      return (
        <div className="no-votes-message">
          <p>{activeTab === 'created' ? '생성한 투표가 없습니다.' : '참여한 투표가 없습니다.'}</p>
        </div>
      );
    }

    return votes.map(topic => (
      <div 
        key={topic.id} 
        id={`vote-card-${topic.id}`}
        className={`vote-card-container ${lastViewedVoteId === topic.id.toString() ? 'last-viewed' : ''}`}
      >
        <VoteCard 
          topic={topic}
          onVote={updateVote}
          onLike={() => handleLike(topic.id)}
          alwaysShowResults={true}
          isMyVote={activeTab === 'created'}
          onDelete={activeTab === 'created' ? handleDeleteVote : undefined}
          onPublish={activeTab === 'created' && (!topic.visible || topic.is_expired) ? handlePublishVote : undefined}
          onEdit={activeTab === 'created' && !topic.visible ? handleEditVote : undefined}
          disableOptions={activeTab === 'created' && !topic.visible}
          showPeriodInsteadOfDate={true}
        />
      </div>
    ));
  };

  // 탭 변경 시 localStorage에 상태 저장
  const handleTabChange = (tab: 'created' | 'participated') => {
    setActiveTab(tab);
    localStorage.setItem('myVotesActiveTab', tab);
  };

  // 컴포넌트가 마운트될 때 실행되는 useEffect에 다음 추가
  useEffect(() => {
    // 컴포넌트 언마운트 시 현재 탭 상태 저장
    return () => {
      localStorage.setItem('myVotesActiveTab', activeTab);
    };
  }, [activeTab]);

  return (
    <div className="my-votes-container">
      {/* 탭 메뉴 - 클래스명을 공통 스타일과 일치시킴 */}
      <div className="vote-tabs">
        <div className="tab-list">
          <button 
            className={`tab-button ${activeTab === 'created' ? 'active' : ''}`}
            onClick={() => handleTabChange('created')}
          >
            생성한 카드 ({formatNumber(filteredVotes.created.length)})
          </button>
          <button 
            className={`tab-button ${activeTab === 'participated' ? 'active' : ''}`}
            onClick={() => handleTabChange('participated')}
          >
            투표한 카드 ({formatNumber(filteredVotes.participated.length)})
          </button>
        </div>
      </div>

      {/* 로딩 상태와 진행률 표시 */}
      {loading && (
        <div className="loading-container">
          {progress > 0 && (
            <div className="progress-container">
              <div 
                className="progress-bar" 
                style={{ width: `${progress}%` }}
              ></div>
              <div className="progress-text">
                {progressStatus} ({progress}%)
              </div>
            </div>
          )}
        </div>
      )}

      {/* 에러 메시지 */}
      {error && (
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button className="retry-button" onClick={refreshVotes}>
            다시 시도
          </button>
        </div>
      )}

      <div className="vote-card-list">
        {initialLoading ? (
          // 초기 로딩 시에만 스켈레톤 UI 표시
          <div className="vote-cards">
            {skeletonCards}
          </div>
        ) : (
          // 데이터 로딩이 완료된 후
          <div className="vote-cards">
            {(activeTab === 'created' && filteredVotes.created.length === 0) || 
             (activeTab === 'participated' && filteredVotes.participated.length === 0) ? (
              // 데이터가 없는 경우 메시지 표시
              <div className="no-votes-message">
                <p>{activeTab === 'created' ? '생성한 투표가 없습니다.' : '참여한 투표가 없습니다.'}</p>
              </div>
            ) : (
              // 데이터가 있는 경우 투표 목록 표시
              renderVoteList(activeTab === 'created' ? filteredVotes.created : filteredVotes.participated)
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyVotes; 