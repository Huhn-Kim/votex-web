import React, { useState, useEffect, useRef } from 'react';
import '../styles/VoteCard.css';
import { VoteTopic } from '../lib/types';
import { FaThumbsUp, FaComment, FaHeart, FaRegHeart, FaChartBar, FaShare } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useVoteContext } from '../context/VoteContext';
import { formatNumber } from '../utils/numberFormat';
import VoteSkeletonCard from './VoteSkeletonCard';
import LoadingOverlay from '../components/LoadingOverlay';

interface VoteCardProps {
  topic: VoteTopic;
  onVote: (topic_id: number, option_id: number) => Promise<void>;
  onLike: () => Promise<void>;
  alwaysShowResults?: boolean;
  isMyVote?: boolean;
  onDelete?: (topicId: number) => void;
  onPublish?: (topicId: number) => void;
  onEdit?: (topicId: number) => void;
  disableOptions?: boolean;
  showPeriodInsteadOfDate?: boolean;
  id?: string;
  isLoading?: boolean;
}

// 뱃지 정보를 가져오는 함수
export const getBadgeInfo = (badgeLevel: number) => {
  const getBadgeColor = (level: number) => {
    if (level <= 3) {
      return "#FFFFFF"; // 1-3등급: 흰색
    } else if (level <= 6) {
      return "#FFE566"; // 4-6등급: 더 밝은 노란색
    } else if (level <= 9) {
      return "#00FF88"; // 7-9등급: 초록색
    } else if (level === 10) {
      return "#FFA07A"; // 동메달: 더 밝은 브론즈
    } else if (level === 11) {
      return "#F8F8FF"; // 은메달: 더 밝은 실버
    } else if (level === 12) {
      return "#FFDF00"; // 금메달: 더 밝은 골드
    } else if (level === 13) {
      return "#B9F2FF"; // 다이아몬드: 하늘색 계열
    } else if (level === 14) {
      return "#FFD700"; // 황금왕관
    }
    return "#FFFFFF";
  };

  const color = getBadgeColor(badgeLevel);
  
  if (badgeLevel <= 9) {
    return { name: `${badgeLevel}등급`, color, type: 'number' as const };
  } else if (badgeLevel === 10) {
    return { name: "동메달", color, type: 'medal' as const, medalType: 'bronze' as const };
  } else if (badgeLevel === 11) {
    return { name: "은메달", color, type: 'medal' as const, medalType: 'silver' as const };
  } else if (badgeLevel === 12) {
    return { name: "금메달", color, type: 'medal' as const, medalType: 'gold' as const };
  } else if (badgeLevel === 13) {
    return { name: "다이아몬드", color, type: 'special' as const };
  } else if (badgeLevel === 14) {
    return { name: "황금왕관", color, type: 'special' as const };
  }
  return { name: "초심자", color: "#FFFFFF", type: 'number' as const };
};

// 숫자 아이콘 컴포넌트
const NumberIcon = ({ number, color = "#FFFFFF", size = 24 }: { number: number; color?: string; size?: number }) => {
  const isMobile = window.innerWidth <= 768;
  const fontSize = isMobile ? "20" : "16";
  
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* 배경 원 */}
      <circle cx="12" cy="12" r="10" fill={color} opacity="0.1" />
      {/* 숫자 텍스트 */}
      <text 
        x="12" 
        y="18" 
        textAnchor="middle" 
        fill={color}
        fontSize={fontSize}
        fontWeight="bold"
        filter="drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))"
      >
        {number}
      </text>
    </svg>
  );
};

// 메달 아이콘 컴포넌트
const MedalIcon = ({ type, size = 32 }: { type: 'bronze' | 'silver' | 'gold'; color?: string; size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24">
    {/* 배경 원 */}
    <circle cx="12" cy="12" r="10" fill={type === 'gold' ? '#FFDF00' : type === 'silver' ? '#F8F8FF' : '#FFA07A'} opacity="0.1"/>
    
    {/* 메달 리본 - 크기와 위치 조정 */}
    <g transform="scale(1.4) translate(-4.8, -4.8)">
      <path d="M6 2 C6 2 10 4 12 4 C14 4 18 2 18 2 L16 8 L12 9 L8 8 L6 2" 
            fill={type === 'gold' ? '#FFDF00' : type === 'silver' ? '#F8F8FF' : '#FFA07A'} 
            stroke="#000" 
            strokeWidth="0.7"/>
      
      {/* 메달 본체 */}
      <circle cx="12" cy="14" r="8" 
              fill={type === 'gold' ? '#FFDF00' : type === 'silver' ? '#F8F8FF' : '#FFA07A'} 
              stroke="#000" 
              strokeWidth="0.7"/>
      
      {/* 메달 테두리 장식 */}
      <circle cx="12" cy="14" r="7" 
              fill="none" 
              stroke="#000" 
              strokeWidth="0.5"
              strokeDasharray="2,0.7"/>
      
      {/* 메달 내부 장식 */}
      <circle cx="12" cy="14" r="5.5" 
              fill="none" 
              stroke="#000" 
              strokeWidth="0.5"/>
      
      {/* 메달 중앙 별 모양 */}
      <path d="M12 10 L13.5 13 L17 13 L14.5 15 L15.5 18 L12 16 L8.5 18 L9.5 15 L7 13 L10.5 13 Z"
            fill="#000"
            opacity="0.15"/>
    </g>
    
    {/* 메달 표면 광택 효과 */}
    <ellipse cx="12" cy="12" rx="4" ry="2" 
             fill="#FFFFFF" 
             opacity="0.5"/>
  </svg>
);


// 다이아몬드 아이콘 컴포넌트 수정
const DiamondIcon = ({ color = "#00FFFF", size = 32 }: { color?: string; size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24">
    {/* 배경 원 */}
    <circle cx="12" cy="12" r="10" fill={color} opacity="0.1"/>
    
    {/* 다이아몬드 - 크기와 위치 조정 */}
    <g transform="scale(1.4) translate(-4.8, -4.8)">
      {/* 다이아몬드 상단 */}
      <path d="M12 2 L17 8 L12 14 L7 8 Z" 
            fill={color}
            stroke="#000"
            strokeWidth="0.5"/>
      
      {/* 다이아몬드 하단 */}
      <path d="M7 8 L12 14 L12 20 L4 10 Z" 
            fill={color}
            stroke="#000"
            strokeWidth="0.5"
            opacity="0.9"/>
      
      <path d="M17 8 L12 14 L12 20 L20 10 Z" 
            fill={color}
            stroke="#000"
            strokeWidth="0.5"
            opacity="0.7"/>
      
      {/* 다이아몬드 광택 효과 */}
      <path d="M12 2 L14 5 L12 8 L10 5 Z" 
            fill="#FFFFFF"
            opacity="0.5"/>
      
      <path d="M14 5 L16 8 L14 11 L12 8 Z" 
            fill="#FFFFFF"
            opacity="0.3"/>
      
      <path d="M10 5 L12 8 L10 11 L8 8 Z" 
            fill="#FFFFFF"
            opacity="0.4"/>
    </g>
    
    {/* 다이아몬드 하이라이트 */}
    <path d="M11 4 L12 6 L13 4" 
          stroke="#FFFFFF"
          strokeWidth="0.7"
          fill="none"
          opacity="0.7"/>
  </svg>
);

const CrownIcon = ({ color = "#FFD700", size = 24 }: { color?: string; size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"></path>
  </svg>
);

// 뱃지 레벨에 따른 아이콘 컴포넌트를 반환하는 함수
export const getBadgeIcon = (badgeLevel: number, size = 32) => {
  const badgeInfo = getBadgeInfo(badgeLevel);
  if (!badgeInfo) return null;
  
  const color = badgeInfo.color;
  const isMobile = window.innerWidth <= 768;
  const iconSize = isMobile ? 36 : size; // 모바일에서는 더 크게
  
  switch (badgeInfo.type) {
    case 'number':
      return <NumberIcon number={badgeLevel} color={color} size={iconSize} />;
    case 'medal':
      return <MedalIcon type={badgeInfo.medalType} color={color} size={iconSize} />;
    case 'special':
      return badgeLevel === 13 ? 
        <DiamondIcon color={color} size={iconSize} /> : 
        <CrownIcon color={color} size={iconSize} />;
    default:
      return null;
  }
};

// 남은 기간 계산 함수 추가
const calculateRemainingTime = (expiresAt: string): string => {
  const now = new Date();
  const expireDate = new Date(expiresAt);
  
  // 날짜를 yyyy-mm-dd 형식으로 변환하는 함수
  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  // 현재 날짜와 만료 날짜를 UTC 기준으로 비교
  const today = new Date(formatDate(now));
  const expireDay = new Date(formatDate(expireDate));
  
  // 시간대 보정
  today.setHours(0, 0, 0, 0);
  expireDay.setHours(0, 0, 0, 0);

  // 날짜 차이 계산 (일 단위)
  const diffDays = Math.ceil((expireDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  // 디버깅을 위한 로그
  console.log('계산된 차이:', {
    날짜차이_일: diffDays,
    today: today.toISOString(),
    expireDay: expireDay.toISOString()
  });

  // 현재 시간과의 차이로 남은 시간/분 계산
  const diffTime = expireDate.getTime() - now.getTime();
  
  if (diffTime <= 0) {
    return '종료';
  }

  const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffTime / (1000 * 60));

  // 1시간 이내: 분 단위
  if (diffHours < 1) {
    return `${diffMinutes}분`;
  }
  // 24시간 이내: 시간 단위
  if (diffHours < 24) {
    return `${diffHours}시간`;
  }
  // 일 단위 표시 (diffDays 사용)
  if (diffDays < 30) {
    return `${diffDays}일`;
  }
  // 월 단위
  return `${Math.floor(diffDays / 30)}개월`;
};

// 더보기 아이콘 컴포넌트 삭제

// PNG 이미지의 투명도 확인 함수
const isPngWithTransparency = (src: string): boolean => {
  // 파일 확장자가 png인지, URL에 png가 포함되어 있는지 확인
  return src.toLowerCase().endsWith('.png') || 
         src.toLowerCase().includes('.png') || 
         src.toLowerCase().includes('image/png');
};


// 이미지가 Supabase Storage에서 오는지 확인하는 함수
const isStorageImage = (src: string): boolean => {
  return src.includes('supabase') || 
         src.includes('storage') || 
         (src.includes('http') && !src.startsWith('data:'));
};

// 이미지 로드 실패 시 사용할 기본 이미지 (Base64)
const DEFAULT_ERROR_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjM1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjAwIiBoZWlnaHQ9IjM1MCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7lm77niYfmsLTkvZPmiJDlip88L3RleHQ+PC9zdmc+';

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
  isLoading = false
}) => {
  const { handleLike, userReactions, loadUserReaction, updateVoteTopic } = useVoteContext();
  
  // 현재 투표의 반응 상태 가져오기
  const currentReaction = userReactions.get(topic.id) || { liked: false };
  const { liked: hasLiked } = currentReaction;

  const [topicState, setTopic] = useState(topic);
  const [showResults, setShowResults] = useState(alwaysShowResults || !!topicState.selected_option);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(topicState.selected_option || null);
  const [isVoting, setIsVoting] = useState(false);
  const [voteError, setVoteError] = useState<string | null>(null);
  const navigate = useNavigate();

  // 컴포넌트 마운트 여부를 추적하는 ref 추가
  const isInitialMount = useRef(true);

  // 컴포넌트 마운트 시에만 사용자의 좋아요 상태 확인
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
    const updateRemainingTime = async () => {
      const time = calculateRemainingTime(topic.expires_at);
      setRemainingTime(time);
      
      // 투표가 종료되었고 아직 visible이 true인 경우
      if (time === '종료' && topic.visible) {
        try {
          // visible을 false로 업데이트
          await updateVoteTopic({
            id: topic.id,
            visible: false,
            is_expired: true
          });
          
          // 로컬 상태 업데이트
          setTopic(prev => ({
            ...prev,
            visible: false,
            is_expired: true
          }));
        } catch (err) {
          console.error('투표 종료 처리 중 오류:', err);
        }
      }
    };

    updateRemainingTime();
    const timer = setInterval(updateRemainingTime, 600000); // 10분마다 업데이트

    return () => clearInterval(timer);
  }, [topic.expires_at, topic.visible, topic.id]);

  // 좋아요 처리 함수
  const onLike = async () => {
    // UI 즉시 업데이트 - 좋아요 토글
    setTopic(prev => ({
      ...prev,
      likes: hasLiked ? prev.likes - 1 : prev.likes + 1
    }));

    try {
      // 백그라운드에서 Context 업데이트
      await handleLike(topic.id);
    } catch (error) {
      console.error('좋아요 처리 오류:', error);
      // API 실패 시 UI 롤백
      setTopic(prev => ({
        ...prev,
        likes: hasLiked ? prev.likes + 1 : prev.likes - 1
      }));
    }
  };

  // 옵션 클릭 핸들러 수정
  const handleOptionClick = async (optionId: number) => {
    if (disableOptions || isVoting || topicState.is_expired) return;
    if (selectedOption === optionId) return;
    
    setIsVoting(true);
    setVoteError(null);

    const previousOptionId = selectedOption;
    
    try {
      setSelectedOption(optionId);
      setShowResults(true);
      
      const oldOptions = [...topicState.options];
      const updatedOptions = topicState.options.map(opt => {
        if (opt.id === previousOptionId) {
          return { ...opt, votes: Math.max(0, opt.votes - 1) };
        }
        if (opt.id === optionId) {
          return { ...opt, votes: opt.votes + 1 };
        }
        return opt;
      });

      // total_votes 업데이트 추가
      setTopic(prev => ({
        ...prev,
        options: updatedOptions,
        total_votes: previousOptionId === null ? prev.total_votes + 1 : prev.total_votes
      }));

      // 애니메이션을 더 부드럽게 만들기 위한 설정
      const ANIMATION_DURATION = 100; // 인터벌 시간
      const FRAME_RATE = 60; // 프레임 수
      const TOTAL_FRAMES = (ANIMATION_DURATION / 1000) * FRAME_RATE;
      
      const updateVotesProgressively = () => {
        oldOptions.forEach((oldOpt, index) => {
          const newOpt = updatedOptions[index];
          const diff = newOpt.votes - oldOpt.votes;
          
          if (diff !== 0) {
            let frame = 0;
            
            const animate = () => {
              if (frame <= TOTAL_FRAMES) {
                // easeInOutCubic 이징 함수 사용
                const progress = frame / TOTAL_FRAMES;
                const easeProgress = progress < 0.5
                  ? 5 * progress * progress * progress
                  : 1 - Math.pow(-2 * progress + 2, 3) / 2;
                
                const currentVotes = oldOpt.votes + (diff * easeProgress);
                
                frame ++;
                requestAnimationFrame(animate);

                setTopic(prev => ({
                  ...prev,
                  options: prev.options.map(opt => 
                    opt.id === oldOpt.id 
                      ? { 
                          ...opt, 
                          votes: Math.round(currentVotes * 10) / 10 // 소수점 한자리까지 표현
                        }
                      : opt
                  )
                }));
                
              }
            };
            
            requestAnimationFrame(animate);
          }
        });
      };

      updateVotesProgressively();
      
      // 백그라운드에서 API 호출
      await onVote(topicState.id, optionId);

    } catch (error) {
      console.error('투표 오류:', error);
      setSelectedOption(previousOptionId);
      setVoteError('투표 처리 중 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setIsVoting(false);
    }
  };

  // 투표 비율 계산 함수 수정
  const calculatePercentage = (votes: number) => {
    const sumOfVotes = topicState.options.reduce((sum, opt) => sum + opt.votes, 0);
    const denominator = sumOfVotes > 0 ? sumOfVotes : topicState.total_votes;
    
    if (!denominator || denominator <= 0) return 0;
    
    const percentage = (votes / denominator) * 100;
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

  // 디버깅을 위한 로그
  useEffect(() => {
    console.log('VoteCard 로딩 상태:', isLoading);
  }, [isLoading]);

  // 로딩 상태 체크를 더 엄격하게
  if (isLoading || !topic || Object.keys(topic).length === 0) {
    return <VoteSkeletonCard />;
  }

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
                // placeholder 이미지 URL을 Base64 이미지로 변경
                target.src = DEFAULT_ERROR_IMAGE;
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

                      onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                        console.error(`옵션 이미지 로드 오류: ${option.id}`);
                        const target = e.target as HTMLImageElement;
                        // placeholder 이미지 URL을 Base64 이미지로 변경
                        target.src = DEFAULT_ERROR_IMAGE;
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

  // 상태 관리
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState('');

  // 기존 onClick 핸들러를 대체하는 새 핸들러 추가
  const handleEditClick = async () => {
    if (!onEdit) return;
    
    setLoading(true);
    setProgress(20);
    setProgressStatus("카드 수정 준비 중...");
    
    try {
      setProgress(50);
      setProgressStatus("카드 수정 중...");
      
      // 원래 onEdit 함수 호출
      await onEdit(topicState.id);
      
      setProgress(100);
      setProgressStatus("수정 완료!");
      
      // 완료 후 잠시 보여주기
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error("카드 수정 중 오류:", error);
      setProgress(0);
      setProgressStatus("수정 실패");
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    }
  };

  const handleDeleteClick = async () => {
    if (!onDelete) return;
    
    setLoading(true);
    setProgress(20);
    setProgressStatus("카드 삭제 준비 중...");
    
    try {
      setProgress(50);
      setProgressStatus("카드 삭제 중...");
      
      // 원래 onDelete 함수 호출
      await onDelete(topicState.id);
      
      setProgress(100);
      setProgressStatus("삭제 완료!");
      
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error("카드 삭제 중 오류:", error);
      setProgress(0);
      setProgressStatus("삭제 실패");
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    }
  };

  const handlePublishClick = async () => {
    if (!onPublish) return;
    
    setLoading(true);
    setProgress(20);
    setProgressStatus("카드 업로드 준비 중...");
    
    try {
      setProgress(50);
      setProgressStatus("카드 업로드 중...");
      
      // 원래 onPublish 함수 호출
      await onPublish(topicState.id);
      
      setProgress(100);
      setProgressStatus("업로드 완료!");
      
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error("카드 업로드 중 오류:", error);
      setProgress(0);
      setProgressStatus("업로드 실패");
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    }
  };

  // 분석 페이지로 이동하는 함수 수정
  const handleAnalysisClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/vote/${topicState.id}/analysis`);
  };

  return (
    <div className={`vote-card modern-card ${topicState.is_expired ? 'expired' : ''}`} id={id}>
      <div className="vote-card-header">
        <div className="user-info">          
          <img 
            src={topicState.users.profile_Image || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIyMCIgZmlsbD0iIzQ0NCIvPjx0ZXh0IHg9IjIwIiB5PSIyNSIgZm9udC1zaXplPSIyMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiPj88L3RleHQ+PC9zdmc+'}
            alt="사용자 프로필" 
            className="user-avatar-image"
          />
          <div className="user-details">
            <div className="user-name-container">
              <span className="username">{topicState.users.username || "게스트"}</span>
              <span className="user-badge">{getBadgeIcon(topicState.users.user_grade)}</span>
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
              }}
              title={isSubscribed ? '구독 취소' : '구독하기'}
            >
              {isSubscribed ? <FaHeart className="heart-icon filled" /> : <FaRegHeart className="heart-icon" />}
            </button>
          )}
          {/* 상세분석 아이콘만 배치 */}
          <button 
            className="analysis-btn" 
            onClick={handleAnalysisClick}
            title="상세분석"
          >
            <FaChartBar className="analysis-icon" />
          </button>
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
                className="vote-action-btn"
                onClick={() => navigate(`/vote/${topicState.id}/comments`)}
                aria-label="댓글"
              >
                <FaComment />
                <span>{formatNumber(topicState.comments)}</span>
              </button>
              <button
                className="vote-action-btn"
                onClick={(e) => e.stopPropagation()}
                aria-label="공유"
              >
                <FaShare />
              </button>
            </div>
          </div>
          
          <div className="management-divider"></div>
          <div className="management-buttons">
            {(!topicState.visible || topicState.is_expired) && onPublish && (
              <button 
                className="management-btn publish-btn"
                onClick={handlePublishClick}
              >
                업로드
              </button>
            )}
            {onEdit && (!topicState.visible || topicState.is_expired) && (
              <button 
                className="management-btn edit-btn"
                onClick={handleEditClick}
              >
                수정
              </button>
            )}
            {onDelete && (
              <button 
                className="management-btn delete-btn"
                onClick={handleDeleteClick}
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
              className="vote-action-btn"
              onClick={() => navigate(`/vote/${topicState.id}/comments`)}
              aria-label="댓글"
            >
              <FaComment />
              <span>{formatNumber(topicState.comments)}</span>
            </button>
            <button
              className="vote-action-btn"
              onClick={(e) => e.stopPropagation()}
              aria-label="공유"
            >
              <FaShare />
            </button>
          </div>
        </div>
      )}

      <LoadingOverlay 
        isLoading={loading}
        progress={progress}
        progressStatus={progressStatus}
        defaultMessage="카드 처리 중..."
      />
    </div>
  );
};

export default VoteCard; 