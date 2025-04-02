import React, { useState, useEffect, useRef } from 'react';
import '../styles/VoteCard.css';
import { VoteTopic } from '../../lib/types';
import { FaThumbsUp, FaThumbsDown, FaComment } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useVoteContext } from '../context/VoteContext';
import { formatNumber } from '../utils/numberFormat';

interface VoteCardProps {
  topic: VoteTopic;
  onVote: (topic_id: number, option_id: number) => Promise<void>;
  onLike: () => Promise<void>;
  onDislike: () => Promise<void>;
  alwaysShowResults?: boolean;
  isMyVote?: boolean;
  onDelete?: (topicId: number) => void;
  onPublish?: (topicId: number) => void;
  onEdit?: (topicId: number) => void;
  disableOptions?: boolean;
  showPeriodInsteadOfDate?: boolean;
  id?: string;
}

// 뱃지 정보를 가져오는 함수
export const getBadgeInfo = (badgeLevel: number) => {
  switch (badgeLevel) {
    case 1:
      return { name: '초심자', color: '#FFFFFF' };
    case 2:
      return { name: '탐험가', color: '#FFD700' };
    case 3:
      return { name: '분석가', color: '#FF8C00' };
    case 4:
      return { name: '전문가', color: '#FF4500' };
    default:
      return null;
  }
};

// 뱃지 아이콘 컴포넌트
const CompassIcon = ({ className, color = "#FFFFFF", size = 24 }: { className?: string; color?: string; size?: number }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
  </svg>
);

const MapIcon = ({ className, color = "#FFD700", size = 24 }: { className?: string; color?: string; size?: number }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
    <line x1="8" y1="2" x2="8" y2="18"></line>
    <line x1="16" y1="6" x2="16" y2="22"></line>
  </svg>
);

const TelescopeIcon = ({ className, color = "#FF8C00", size = 24 }: { className?: string; color?: string; size?: number }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
  </svg>
);

const CrownIcon = ({ className, color = "#FF4500", size = 24 }: { className?: string; color?: string; size?: number }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"></path>
  </svg>
);

// 뱃지 레벨에 따른 아이콘 컴포넌트를 반환하는 함수
export const getBadgeIcon = (badgeLevel: number, size = 24) => {
  const badgeInfo = getBadgeInfo(badgeLevel);
  if (!badgeInfo) return null;
  
  const color = badgeInfo.color;
  const iconSize = Math.floor(size * 0.8); // 배지 크기의 80%로 아이콘 크기 설정
  
  switch (badgeLevel) {
    case 1:
      return <CompassIcon color={color} size={iconSize} />;
    case 2:
      return <MapIcon color={color} size={iconSize} />;
    case 3:
      return <TelescopeIcon color={color} size={iconSize} />;
    case 4:
      return <CrownIcon color={color} size={iconSize} />;
    default:
      return null;
  }
};

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
  // 30일 이내: 일 단위 (정확히 24시간 = 1일이 되도록)
  if (days < 30) {
    return `${Math.floor(days)}일`;
  }
  // 그 이상: 월 단위
  return `${Math.floor(months)}개월`;
};

// 더보기 아이콘 컴포넌트
const MoreIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="5" r="1"></circle>
    <circle cx="12" cy="12" r="1"></circle>
    <circle cx="12" cy="19" r="1"></circle>
  </svg>
);

// PNG 이미지의 투명도 확인 함수
const isPngWithTransparency = (src: string): boolean => {
  // 파일 확장자가 png인지, URL에 png가 포함되어 있는지 확인
  return src.toLowerCase().endsWith('.png') || 
         src.toLowerCase().includes('.png') || 
         src.toLowerCase().includes('image/png');
};

// 이미지가 Base64인지 확인하는 함수
const isBase64Image = (src: string): boolean => {
  return src.startsWith('data:image');
};

// 이미지가 Supabase Storage에서 오는지 확인하는 함수
const isStorageImage = (src: string): boolean => {
  return src.includes('supabase') || 
         src.includes('storage') || 
         (src.includes('http') && !src.startsWith('data:'));
};

const VoteCard: React.FC<VoteCardProps> = ({
  topic,
  onVote,
  alwaysShowResults = false,
  onDelete,
  onPublish,
  onEdit,
  isMyVote = false,
  disableOptions = false,
  showPeriodInsteadOfDate = false,
  id,
}) => {
  const { handleLike, handleDislike, userReactions, loadUserReaction } = useVoteContext();
  
  // 현재 투표의 반응 상태 가져오기
  const currentReaction = userReactions.get(topic.id) || { liked: false, disliked: false };
  const { liked: hasLiked, disliked: hasDisliked } = currentReaction;

  const [topicState, setTopic] = useState(topic);
  const [showResults, setShowResults] = useState(alwaysShowResults || !!topicState.selected_option);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(topicState.selected_option || null);
  const [isVoting, setIsVoting] = useState(false);
  const [voteError, setVoteError] = useState<string | null>(null);
  const navigate = useNavigate();

  // ref 추가
  const moreOptionsRef = useRef<HTMLDivElement>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);

  // 컴포넌트 마운트 여부를 추적하는 ref 추가
  const isInitialMount = useRef(true);

  // 컴포넌트 마운트 시에만 사용자의 좋아요/싫어요 상태 확인
  useEffect(() => {
    if (isInitialMount.current) {
      const checkUserReaction = async () => {
        try {
          await loadUserReaction(topic.id);
        } catch (err) {
          console.error('사용자 반응 상태 확인 실패:', err);
        }
      };

      checkUserReaction();
      isInitialMount.current = false;
    }
  }, []);

  // 남은 시간 상태 추가
  const [remainingTime, setRemainingTime] = useState<string>('');

  // 실시간 업데이트를 위한 useEffect 수정
  useEffect(() => {
    const updateRemainingTime = () => {
      const time = calculateRemainingTime(topic.expires_at);
      setRemainingTime(time);
    };

    updateRemainingTime();
    const timer = setInterval(updateRemainingTime, 600000); // 10분마다 업데이트

    return () => clearInterval(timer);
  }, [topic.expires_at]);

  // 좋아요 처리 함수
  const onLike = async () => {
    if (hasLiked) return;

    const wasDisliked = hasDisliked;
    
    // UI 즉시 업데이트
    setTopic(prev => ({
      ...prev,
      likes: prev.likes + 1,
      dislikes: wasDisliked ? prev.dislikes - 1 : prev.dislikes
    }));

    try {
      // 백그라운드에서 Context 업데이트
      await handleLike(topic.id);
    } catch (error) {
      console.error('좋아요 처리 오류:', error);
      // API 실패 시 UI 롤백
      setTopic(prev => ({
        ...prev,
        likes: prev.likes - 1,
        dislikes: wasDisliked ? prev.dislikes + 1 : prev.dislikes
      }));
    }
  };

  // 싫어요 처리 함수
  const onDislike = async () => {
    if (hasDisliked) return;

    const wasLiked = hasLiked;
    
    setTopic(prev => ({
      ...prev,
      dislikes: prev.dislikes + 1,
      likes: wasLiked ? prev.likes - 1 : prev.likes
    }));

    try {
      await handleDislike(topic.id);
    } catch (error) {
      console.error('싫어요 처리 오류:', error);
      setTopic(prev => ({
        ...prev,
        dislikes: prev.dislikes - 1,
        likes: wasLiked ? prev.likes + 1 : prev.likes
      }));
    }
  };

  // 옵션 클릭 핸들러 수정
  const handleOptionClick = async (optionId: number) => {
    // 비활성화된 경우 또는 이미 진행 중이면 클릭 무시
    if (disableOptions || isVoting || topicState.is_expired) return;

    // 같은 옵션을 다시 선택한 경우 무시
    if (selectedOption === optionId) return;
    
    setIsVoting(true);
    setVoteError(null);

    const previousOptionId = selectedOption;
    
    try {
      // 즉시 UI 업데이트
      setSelectedOption(optionId);
      setShowResults(true);
      
      // 로컬 UI 즉시 업데이트 (투표율 계산용)
      // 모든 옵션의 투표수와 퍼센트를 정확하게 업데이트
      setTopic(prevTopic => {
        // 각 옵션의 투표수 업데이트
        const updatedOptions = prevTopic.options.map(opt => {
          if (opt.id === previousOptionId) {
            return { ...opt, votes: Math.max(0, opt.votes - 1) };
          }
          if (opt.id === optionId) {
            return { ...opt, votes: opt.votes + 1 };
          }
          return opt;
        });
        
        // total_votes 계산
        const newTotalVotes = previousOptionId === null 
          ? prevTopic.total_votes + 1 
          : prevTopic.total_votes;
        
        return {
          ...prevTopic,
          selected_option: optionId,
          options: updatedOptions,
          total_votes: newTotalVotes
        };
      });
      
      // 백그라운드에서 API 호출하고 즉시 상태 해제
      // Promise로 처리하지 않고 try-catch로 감싸기
      try {
        await onVote(topicState.id, optionId);
      } catch (err) {
        console.error('백그라운드 투표 오류:', err);
      }
    } catch (error) {
      console.error('투표 오류:', error);
      
      // 에러 발생 시 이전 상태로 롤백
      setSelectedOption(previousOptionId);
      setVoteError('투표 처리 중 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      // 즉시 투표 처리 중 상태 해제
      setIsVoting(false);
    }
  };

  // 투표 비율 계산 함수 수정
  const calculatePercentage = (votes: number) => {
    // 모든 옵션의 투표 수 합계 계산
    const sumOfVotes = topicState.options.reduce((sum, opt) => sum + opt.votes, 0);
    
    // 옵션들의 투표 수 합계와 total_votes 비교 로깅
    console.log('투표율 계산 데이터:', {
      optionVotes: votes,
      sumOfAllVotes: sumOfVotes,
      totalVotes: topicState.total_votes,
      usingSum: sumOfVotes > 0
    });
    
    // 투표 수 합계가 0보다 크면 이를 사용, 아니면 topic.total_votes 사용
    const denominator = sumOfVotes > 0 ? sumOfVotes : topicState.total_votes;
    
    // 유효한 투표 수 확인
    if (!denominator || denominator <= 0) return 0;
    
    // 안전하게 퍼센트 계산
    const percentage = (votes / denominator) * 100;
    
    // 결과 로깅
    console.log(`옵션 투표율: ${votes}/${denominator} = ${percentage}%`);
    
    return Math.min(Math.round(percentage * 10) / 10, 100);
  };

  // 이미지 클래스를 결정하는 함수
  const getImageClass = (imageClass: string | undefined): string => {
    if (!imageClass) {
      // 기본 이미지 클래스 배열
      const defaultClasses = [
        'default-image-blue',
        'default-image-red',
        'default-image-green',
        'default-image-orange',
        'default-image-purple',
        'default-image-cyan',
        'default-image-brown',
        'default-image-food-1',
        'default-image-food-2',
        'default-image-food-3'
      ];
      // 랜덤하게 기본 이미지 클래스 선택
      return defaultClasses[Math.floor(Math.random() * defaultClasses.length)];
    }
    return imageClass;
  };

  // 외부 클릭 감지를 위한 useEffect 수정
  useEffect(() => {
    if (showMoreOptions) {
      const handleClickOutside = (event: Event) => {  // MouseEvent 대신 Event 타입 사용
        // 클릭된 요소가 팝업 내부나 버튼이 아닌 경우 팝업 닫기
        if (
          moreOptionsRef.current && 
          !moreOptionsRef.current.contains(event.target as Node) &&
          moreButtonRef.current && 
          !moreButtonRef.current.contains(event.target as Node)
        ) {
          setShowMoreOptions(false);
        }
      };

      // 이벤트 리스너 등록
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      
      // 클린업 함수
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('touchstart', handleClickOutside);
      };
    }
  }, [showMoreOptions]); // showMoreOptions가 변경될 때만 실행

  // 더보기 메뉴 토글 함수 수정
  const toggleMoreOptions = (e: React.MouseEvent) => {
    e.stopPropagation(); // 이벤트 버블링 방지
    setShowMoreOptions(!showMoreOptions);
  };

  // 남은 시간 상태 추가
  // const [remainingTime, setRemainingTime] = useState<string>(
  //   calculateRemainingTime(topic.expires_at)
  // );

  // // 실시간 업데이트를 위한 useEffect 추가
  // useEffect(() => {
  //   // 1분마다 남은 시간 업데이트
  //   const timer = setInterval(() => {
  //     setRemainingTime(calculateRemainingTime(topic.expires_at));
  //   }, 60000); // 1분마다 업데이트

  //   // 컴포넌트 언마운트 시 타이머 정리
  //   return () => clearInterval(timer);
  // }, [topic.expires_at]);

  // renderTimeInfo 함수 수정
  const renderTimeInfo = () => {
    // 특정일 형식인지 확인 (~YYYY/MM/DD)
    const isSpecificDate = topic.vote_period.startsWith('~');
    
    if (showPeriodInsteadOfDate) {
      return (
        <div className="vote-period-status-text">
          <span className="vote-period-text">
            {isSpecificDate ? topic.vote_period : `${topic.vote_period}`}
          </span>
          <span className="vote-status-separator">•</span>
          {topic.is_expired ? (
            <span className="vote-status-text expired-text">종료</span>
          ) : topic.visible ? (
            <span className="vote-status-text active-text">
              {remainingTime} 남음
            </span>
          ) : (
            <span className="vote-status-text not-started-text">공개 전</span>
          )}
        </div>
      );
    } else {
      return (
        <div className="vote-period-status-text">
          <span className="vote-period-text">
            {isSpecificDate ? topic.vote_period : topic.vote_period}
          </span>
          <span className="vote-status-separator">•</span>
          {topic.is_expired ? (
            <span className="vote-status-text expired-text">종료</span>
          ) : (
            <span className="vote-status-text active-text">
              {remainingTime} 남음
            </span>
          )}
        </div>
      );
    }
  };

  // 질문 관련 부분을 렌더링
  const renderQuestion = () => {
    // 이미지 관련 정보 출력
    if (topicState.related_image) {
      console.log('질문 이미지 정보:', {
        isBase64: isBase64Image(topicState.related_image),
        isStorage: isStorageImage(topicState.related_image),
        isPng: isPngWithTransparency(topicState.related_image),
        url: topicState.related_image.substring(0, 30) + '...'
      });
    }

    return (
      <div className="question-container">
        {topicState.related_image && (
          <div 
            className={`question-image-container ${isPngWithTransparency(topicState.related_image) ? 'transparent-bg' : ''}`}
          >
            <img 
              src={topicState.related_image} 
              alt={topicState.question} 
              className={`question-image ${isStorageImage(topicState.related_image) ? 'storage-image' : ''}`}
              onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                console.error(`질문 이미지 로드 오류: ${topicState.id}`);
                const target = e.target as HTMLImageElement;
                target.src = 'https://via.placeholder.com/600x350?text=이미지+로드+실패';
                target.classList.remove('storage-image');
              }} 
            />
          </div>
        )}
        <div className="question-text-container">
          <h3 className="vote-question">{topicState.question}</h3>
          {topicState.link && (
            <p className="vote-link">
              <a href={topicState.link} target="_blank" rel="noopener noreferrer">{topicState.link}</a>
            </p>
          )}
        </div>
      </div>
    );
  };

  // 텍스트 옵션 렌더링 함수 수정
  const renderTextOptions = () => {
    return (
      <div className="vote-options">
        {topicState.options.map((option) => {
          const isSelected = selectedOption === option.id;
          const percentage = calculatePercentage(option.votes);
          const hasImage = !!option.image_url;
          
          return (
            <div
              key={option.id}
              className={`vote-option ${isSelected ? 'selected' : ''} ${
                showResults ? 'show-results' : ''
              } ${disableOptions ? "disabled" : ""} ${hasImage ? 'has-image' : ''}`}
              onClick={() => !disableOptions && handleOptionClick(option.id)}
            >
              {/* 바 그래프 (가장 낮은 z-index) */}
              {showResults && (
                <div className="vote-result">
                  <div 
                    className="vote-bar" 
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              )}
              
              {/* 옵션 이미지가 있는 경우 표시 */}
              {hasImage && (
                <div className="option-image-container">
                  <img
                    src={option.image_url} 
                    alt={option.text}
                    className="option-image"
                    onLoad={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                      // 이미지 로드 완료 후 로그
                      const img = e.target as HTMLImageElement;
                      console.log(`옵션 이미지 ${option.id} 로드 완료:`, {
                        ratio: img.naturalWidth / img.naturalHeight,
                        size: `${img.naturalWidth}x${img.naturalHeight}`,
                        complete: img.complete,
                        currentSrc: img.currentSrc.substring(0, 30) + '...'
                      });
                      
                      // 이미지 컨테이너 크기 확인을 위한 로깅
                      const container = img.parentElement;
                      if (container) {
                        console.log(`이미지 컨테이너 크기:`, {
                          width: container.clientWidth,
                          height: container.clientHeight
                        });
                      }
                    }}
                    onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                      console.error(`옵션 이미지 로드 오류 (${option.id}):`, option.image_url);
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
              )}
              
              {/* 옵션 텍스트 콘텐츠 */}
              <div className="option-content">
                <div className="option-text">
                  {option.text}
                </div>
                
                {/* 퍼센트 표시 - 우측 정렬 */}
                {showResults && (
                  <div className="vote-percentage">
                    {percentage}%
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // 이미지 옵션 렌더링 수정
  const renderImageOptions = () => {
    return (
      <div className="image-grid-options">
        {topicState.options.map((option) => {
          const isSelected = selectedOption === option.id;
          const percentage = calculatePercentage(option.votes);
          const imageSource = option.image_url;
          
          return (
            <div 
              key={option.id} 
              className={`image-grid-option ${isSelected ? 'selected' : ''} 
                ${imageSource && isPngWithTransparency(imageSource) ? 'transparent-bg' : ''} 
                ${disableOptions ? "disabled" : ""}
                ${showResults ? 'show-results' : ''}
                ${(topicState.is_expired && isSelected) ? 'expired-selected' : ''}`}
              onClick={() => !disableOptions && handleOptionClick(option.id)}
            >
              {imageSource ? (
                <div className="image-with-text">
                  {/* 이미지 컨테이너 */}
                  <div className="image-container">
                    <img 
                      src={imageSource} 
                      alt={option.text}
                      loading="lazy"
                      className={`option-image ${isStorageImage(imageSource) ? 'storage-image' : ''}`}
                      onLoad={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                        // 이미지 로드 완료 후 로그
                        const img = e.target as HTMLImageElement;
                        console.log(`옵션 이미지 ${option.id} 로드 완료:`, {
                          ratio: img.naturalWidth / img.naturalHeight,
                          size: `${img.naturalWidth}x${img.naturalHeight}`,
                          complete: img.complete,
                          currentSrc: img.currentSrc.substring(0, 30) + '...'
                        });
                      }}
                      onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                        console.error(`이미지 로드 오류 (옵션 ${option.id}):`, {
                          url: imageSource
                        });
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://via.placeholder.com/300?text=이미지+로드+실패';
                      }}
                    />
                  </div>

                  {/* 오버레이 컨테이너 - 명시적으로 이미지 위에 배치 */}
                  <div className="overlays-container">
                    {option.text && 
                      <div className="option-text-overlay" title={option.text}>
                        {option.text}
                      </div>
                    }
                    
                    {(showResults || (topicState.is_expired && isSelected)) && (
                      <>
                        <div className="vote-bar-overlay" style={{ width: `${percentage}%` }}></div>
                        <div className="vote-percentage-overlay">
                          {percentage}%
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className={`image-grid-option-text ${getImageClass(option.image_class)}`}>
                  {option.text}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  useEffect(() => {
    // 질문 관련 이미지 로깅
    console.log(`VoteCard ${topic.id} - 질문 이미지:`, topic.related_image || '없음');
    // 옵션 이미지 로깅
    console.log(`VoteCard ${topic.id} - 옵션 이미지:`, topic.options.map(opt => ({ 
      id: opt.id, 
      image: opt.image_url || '없음' 
    })));
  }, [topic]);

  return (
    <div className={`vote-card modern-card ${topicState.is_expired ? 'expired' : ''}`} id={id}>
      <div className="vote-card-header">
        <div className="user-info">
          <img 
            src={topicState.users.profile_image || 'https://placehold.co/40x40/444/fff'} 
            alt={topicState.users.username} 
            className="user-avatar" 
            onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
              const target = e.target as HTMLImageElement;
              target.style.objectFit = 'contain';
              target.src = 'https://placehold.co/40x40/444/fff?text=?';
            }}
          />
          <div className="user-details">
            <div className="user-name-container">
              <span className="username">{topicState.users.username || "익명 사용자"}</span>
              <span className="user-badge">{getBadgeIcon(topicState.users.user_badge)}</span>
            </div>
            {renderTimeInfo()}
          </div>
        </div>
        <div className="card-actions">
          {!isMyVote && (
            <button 
              className={`subscription-btn ${isSubscribed ? 'subscribed' : ''}`} 
              onClick={() => {
                setIsSubscribed(!isSubscribed);
                console.log(`${isSubscribed ? '구독 취소' : '구독'}: ${topicState.id}`);
              }}
            >
              {isSubscribed ? '구독중' : '구독'}
            </button>
          )}
          <div className="more-options-container">
            <button 
              ref={moreButtonRef} 
              className="more-btn-text" 
              onClick={toggleMoreOptions}
            >
              <MoreIcon />
            </button>
            {showMoreOptions && (
              <div 
                ref={moreOptionsRef}
                className="more-options-menu"
              >
                <div className="more-option" data-option="ai-analysis" onClick={(e) => e.stopPropagation()}>
                  <span className="option-icon">🤖</span>
                  <span className="option-text">AI 분석</span>
                </div>
                <div className="more-option" data-option="share" onClick={(e) => e.stopPropagation()}>
                  <span className="option-icon">🔗</span>
                  <span className="option-text">공유하기</span>
                </div>
                <div className="more-option" data-option="report" onClick={(e) => e.stopPropagation()}>
                  <span className="option-icon">🚨</span>
                  <span className="option-text">신고하기</span>
                </div>
                <div className="more-option" data-option="not-interested" onClick={(e) => e.stopPropagation()}>
                  <span className="option-icon">🔕</span>
                  <span className="option-text">관심없음</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="vote-card-content">
        {renderQuestion()}
        
        {topicState.display_type === 'image' ? (
          renderImageOptions()
        ) : (
          <div className="vote-options-container">
            {renderTextOptions()}
          </div>
        )}
       
        {voteError && (
          <div className="vote-error">
            {voteError}
          </div>
        )}
      </div>

      {/* 관리 버튼 섹션 (isMyVote인 경우에만 표시) */}
      {isMyVote && (
        <div className="management-section">
          <div className="vote-info">
            <div className="vote-count-container">
              <span className="vote-count-text">{formatNumber(topicState.total_votes)}명 투표</span>
            </div>
            
            <div className="vote-actions">
              <button 
                className={`vote-action-btn ${hasLiked ? 'active' : ''}`}
                onClick={onLike}
                aria-label="좋아요"
              >
                <FaThumbsUp />
                <span>{formatNumber(topicState.likes)}</span>
              </button>
              <button 
                className={`vote-action-btn ${hasDisliked ? 'active' : ''}`}
                onClick={onDislike}
                aria-label="싫어요"
              >
                <FaThumbsDown />
                <span>{formatNumber(topicState.dislikes)}</span>
              </button>
              <button
                className="vote-action-btn"
                onClick={() => navigate(`/vote/${topicState.id}/comments`)}
                aria-label="댓글"
              >
                <FaComment />
                <span>{formatNumber(topicState.comments)}</span>
              </button>
            </div>
          </div>
          
          <div className="management-divider"></div>
          <div className="management-buttons">
            {(!topicState.visible || topicState.is_expired) && onPublish && (
              <button 
                className="management-btn publish-btn"
                onClick={() => onPublish(topicState.id)}
              >
                업로드
              </button>
            )}
            {onEdit && (!topicState.visible || topicState.is_expired) && (
              <button 
                className="management-btn edit-btn"
                onClick={() => onEdit(topicState.id)}
              >
                수정
              </button>
            )}
            {onDelete && (
              <button 
                className="management-btn delete-btn"
                onClick={() => onDelete(topicState.id)}
              >
                삭제
              </button>
            )}
          </div>
        </div>
      )}

      {/* isMyVote가 아닌 경우에는 vote-info만 별도로 표시 */}
      {!isMyVote && (
        <div className="vote-info">
          <div className="vote-count-container">
            <span className="vote-count-text">{formatNumber(topicState.total_votes)}명 투표</span>
          </div>
          
          <div className="vote-actions">
            <button 
              className={`vote-action-btn ${hasLiked ? 'active' : ''}`}
              onClick={onLike}
              aria-label="좋아요"
            >
              <FaThumbsUp />
              <span>{formatNumber(topicState.likes)}</span>
            </button>
            <button 
              className={`vote-action-btn ${hasDisliked ? 'active' : ''}`}
              onClick={onDislike}
              aria-label="싫어요"
            >
              <FaThumbsDown />
              <span>{formatNumber(topicState.dislikes)}</span>
            </button>
            <button
              className="vote-action-btn"
              onClick={() => navigate(`/vote/${topicState.id}/comments`)}
              aria-label="댓글"
            >
              <FaComment />
              <span>{formatNumber(topicState.comments)}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoteCard; 