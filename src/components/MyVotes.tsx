import React, { useState, useEffect, useMemo } from 'react';
import '../styles/MyVotes.module.css';
import '../styles/TabStyles.css';
import VoteCard from './VoteCard';
import { useVoteContext } from '../context/VoteContext';
import { useNavigate } from 'react-router-dom';
import { VoteTopic } from '../../lib/types';
import { formatNumber } from '../utils/numberFormat';

// 내 투표 컴포넌트
const MyVotes: React.FC = () => {
  console.log('MyVotes 컴포넌트 렌더링');
  
  // 현재 선택된 탭 상태
  const [activeTab, setActiveTab] = useState<'created' | 'participated'>('created');
  
  // Context에서 내 투표 데이터와 업데이트 함수 가져오기
  const { 
    myVotes, 
    updateVote, 
    loading, 
    error, 
    refreshVotes, 
    deleteTopic, 
    progress, 
    progressStatus, 
    updateVoteTopic,
    handleLike,
    handleDislike
  } = useVoteContext();
  
  const navigate = useNavigate();
  
  console.log('MyVotes 상태:', { myVotes: myVotes.length, loading, error });

  // useMemo를 사용하여 필터링 결과 메모이제이션
  const filteredVotes = useMemo(() => {
    const userId = '0ac4093b-498d-4e39-af11-145a23385a9a';
    return {
      created: myVotes.filter(vote => vote.user_id === userId),
      participated: myVotes.filter(vote => 
        vote.user_id !== userId && vote.selected_option !== null
      )
    };
  }, [myVotes]);

  // 투표 삭제 핸들러
  const handleDeleteVote = (topicId: number) => {
    if (window.confirm('정말로 이 투표를 삭제하시겠습니까?')) {
      deleteTopic(topicId)
        .then(() => {
          console.log('투표가 성공적으로 삭제되었습니다.');
        })
        .catch((err) => {
          console.error('투표 삭제 중 오류 발생:', err);
        });
    }
  };

  // 투표 업로드 핸들러
  const handlePublishVote = async (topicId: number) => {
    if (window.confirm('이 투표를 업로드하시겠습니까? 모든 사용자에게 공개됩니다.')) {
      try {
        const voteTopic = myVotes.find(vote => vote.id === topicId);
        if (!voteTopic) return;

        const now = new Date();
        let expiryDate: Date;

        // 투표 기간에 따른 종료일 계산
        switch (voteTopic.vote_period) {
          case '1일':
            expiryDate = new Date(now);
            expiryDate.setDate(now.getDate() + 1);
            // 정확히 24시간 후로 설정
            expiryDate.setHours(now.getHours());
            expiryDate.setMinutes(now.getMinutes());
            expiryDate.setSeconds(now.getSeconds());
            break;

          case '3일':
            expiryDate = new Date(now);
            expiryDate.setDate(now.getDate() + 3);
            expiryDate.setHours(23, 59, 59, 999);
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
              const [year, month, day] = dateStr.split('/').map(num => parseInt(num));
              expiryDate = new Date(year, month - 1, day, 23, 59, 59, 999);
              
              // 현재 시간과 비교하여 유효성 검사
              if (expiryDate <= now) {
                alert('만료일이 현재 시간보다 이전입니다. 다시 설정해주세요.');
                return;
              }
            } else {
              // 기본값: 1주일
              expiryDate = new Date(now);
              expiryDate.setDate(now.getDate() + 7);
              expiryDate.setHours(23, 59, 59, 999);
            }
        }

        // 디버깅을 위한 로그
        console.log('투표 업로드 정보:', {
          투표ID: topicId,
          현재시간: now.toISOString(),
          종료시간: expiryDate.toISOString(),
          투표기간: voteTopic.vote_period
        });

        // 업데이트할 데이터 준비
        const updateData = {
          id: topicId,
          visible: true,
          expires_at: expiryDate.toISOString(),
          vote_period: voteTopic.vote_period,
          is_expired: false
        };

        // 투표 업데이트 실행
        await updateVoteTopic(updateData);
        
        // 투표 목록 새로고침
        await refreshVotes();
        
        console.log('투표가 성공적으로 업로드되었습니다.');
      } catch (err) {
        console.error('투표 업로드 중 오류 발생:', err);
        alert('투표 업로드 중 오류가 발생했습니다.');
      }
    }
  };

  // 투표 수정 핸들러
  const handleEditVote = (topicId: number) => {
    // 수정 페이지로 이동
    navigate(`/edit-vote/${topicId}`);
  };

  // 필요한 경우에만 데이터를 새로고침하도록 수정
  useEffect(() => {
    if (myVotes.length === 0) {  // 데이터가 없을 때만 새로고침
      refreshVotes();
    }
  }, [myVotes.length]);
  
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
      <VoteCard 
        key={topic.id}
        topic={topic}
        onVote={updateVote}
        onLike={() => handleLike(topic.id)}
        onDislike={() => handleDislike(topic.id)}
        alwaysShowResults={true}
        isMyVote={activeTab === 'created'}
        onDelete={activeTab === 'created' ? handleDeleteVote : undefined}
        onPublish={activeTab === 'created' && (!topic.visible || topic.is_expired) ? handlePublishVote : undefined}
        onEdit={activeTab === 'created' ? handleEditVote : undefined}
        disableOptions={activeTab === 'created' && !topic.visible}
        showPeriodInsteadOfDate={true}
      />
    ));
  };

  return (
    <div className="my-votes-container">
      {/* 탭 메뉴 - 클래스명을 공통 스타일과 일치시킴 */}
      <div className="vote-tabs">
        <div className="tab-list">
          <button 
            className={`tab-button ${activeTab === 'created' ? 'active' : ''}`}
            onClick={() => setActiveTab('created')}
          >
            생성한 카드 ({formatNumber(filteredVotes.created.length)})
          </button>
          <button 
            className={`tab-button ${activeTab === 'participated' ? 'active' : ''}`}
            onClick={() => setActiveTab('participated')}
          >
            투표한 카드 ({formatNumber(filteredVotes.participated.length)})
          </button>
        </div>
      </div>

      <div className="vote-card-list">
        {/* 로딩 상태 표시 - 로컬 상태 사용 */}
        {(loading) && (
          <div className="loading-container">
            {(progress > 0) && (
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
            <div className="loading-spinner"></div>
            <p>
              {progress > 0 ? progressStatus : "내 투표 데이터를 불러오는 중..."}
            </p>
          </div>
        )}

        {/* 오류 메시지 표시 */}
        {error && (
          <div className="error-container">
            <p className="error-message">{error}</p>
            <button 
              className="retry-button"
              onClick={refreshVotes}
            >
              다시 시도
            </button>
          </div>
        )}

        {/* 투표 목록 */}
        {!loading && !error && (
          <div className="vote-cards">
            {renderVoteList(activeTab === 'created' ? filteredVotes.created : filteredVotes.participated)}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyVotes; 