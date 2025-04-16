import React, { useState, useEffect, useRef } from 'react';
import '../styles/VoteCard.css';
import { VoteTopic } from '../lib/types';
import { FaThumbsUp, FaComment, FaHeart, FaRegHeart, FaChartBar, FaShare, FaCopy, FaLink } from 'react-icons/fa';
import { FaFacebook, FaTwitter } from 'react-icons/fa';
import { FaEnvelope } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useVoteContext } from '../context/VoteContext';
import { formatNumber } from '../utils/numberFormat';
import VoteSkeletonCard from './VoteSkeletonCard';
import LoadingOverlay from '../components/LoadingOverlay';
import ConfirmModal from '../components/ConfirmModal';
import supabase from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import html2canvas from 'html2canvas';
import { Helmet } from 'react-helmet-async';

// 카카오 SDK의 타입 선언
declare global {
  interface Window {
    Kakao?: {
      init: (appKey: string) => void;
      isInitialized: () => boolean;
      Share?: {
        sendDefault: (options: any) => void;
      };
      Link?: {
        sendDefault: (options: any) => void;
      };
    };
  }
}

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

// 파일 확장자를 기반으로 비디오인지 확인하는 함수
const isVideoUrl = (url: string): boolean => {
  if (!url) return false;
  const lowerCaseUrl = url.toLowerCase();
  return lowerCaseUrl.endsWith('.mp4') || 
         lowerCaseUrl.endsWith('.webm') || 
         lowerCaseUrl.endsWith('.ogg'); // 필요에 따라 다른 비디오 확장자 추가
};

// ShareModal 컴포넌트 수정
interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title: string;
  description: string;
  cardRef?: React.RefObject<HTMLDivElement> | null;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, url, title, description, cardRef }) => {
  const [copyStatus, setCopyStatus] = useState<string>('');
  const [cardImage, setCardImage] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [kakaoInitialized, setKakaoInitialized] = useState(false);
  
  // 카카오톡 SDK 초기화
  useEffect(() => {
    if (isOpen && !kakaoInitialized && window.Kakao) {
      try {
        if (!window.Kakao.isInitialized()) {
          window.Kakao.init('713c95bab7e3a87150f162188af5cb8f');
        }
        setKakaoInitialized(true);
        console.log('카카오 SDK 초기화 성공');
      } catch (error) {
        console.error('카카오 SDK 초기화 실패:', error);
      }
    }
  }, [isOpen, kakaoInitialized]);
  
  // 공유 모달이 닫힐 때 복사 상태 초기화
  useEffect(() => {
    if (!isOpen) {
      setCopyStatus('');
      setCardImage(null);
    }
    
    // 카카오 SDK 스크립트 로드
    if (isOpen && !window.Kakao) {
      const script = document.createElement('script');
      script.src = 'https://developers.kakao.com/sdk/js/kakao.js';
      script.async = true;
      script.onload = () => {
        try {
          if (window.Kakao && !window.Kakao.isInitialized()) {
            window.Kakao.init('713c95bab7e3a87150f162188af5cb8f');
          }
          setKakaoInitialized(true);
          console.log('카카오 SDK 스크립트 로드 성공');
        } catch (error) {
          console.error('카카오 SDK 초기화 실패:', error);
        }
      };
      document.head.appendChild(script);
      
      return () => {
        document.head.removeChild(script);
      };
    }
  }, [isOpen]);

  // 클립보드에 URL 복사
  const copyToClipboard = () => {
    navigator.clipboard.writeText(url)
      .then(() => {
        setCopyStatus('링크가 복사되었습니다!');
        setTimeout(() => setCopyStatus(''), 2000);
      })
      .catch(err => {
        console.error('클립보드 복사 실패:', err);
        setCopyStatus('복사 실패');
      });
  };

  // 소셜 미디어로 공유 함수 수정
  const shareToSocial = async (platform: string) => {
    try {
      // 이미지가 필요한 플랫폼이고 아직 이미지가 없는 경우 먼저 이미지 생성
      if (!cardImage && platform !== 'link') {
        setIsGeneratingImage(true);
        
        // cardRef를 통해 직접 카드 요소에 접근
        const cardElement = cardRef?.current;
        
        if (!cardElement) {
          console.error('카드 요소를 찾을 수 없습니다.');
          // 이미지 없이 공유 진행
          setIsGeneratingImage(false);
          performShare(platform);
          return;
        }

        // 결과 바와 투표 수 등은 제외하고 캡처하기 위해 임시 클래스 추가
        cardElement.classList.add('capture-mode');
        
        try {
          // 이미지 생성 - 타입 안전성 보장을 위해 타입 단언 사용
          const canvas = await html2canvas(cardElement as HTMLElement, {
            scale: 2, // 고해상도
            backgroundColor: "#1e1e1e", // 배경색
            logging: true, // 디버깅을 위해 로깅 활성화
            allowTaint: true,
            useCORS: true
          });
          
          // Canvas를 이미지로 변환
          const imageData = canvas.toDataURL('image/png');
          setCardImage(imageData);
          
          // 임시 클래스 제거
          cardElement.classList.remove('capture-mode');
          
          // 이미지 생성 후 실제 공유 로직 호출
          performShare(platform, imageData);
        } catch (error) {
          console.error('이미지 생성 오류:', error);
          // 이미지 생성 실패 시에도 일반 공유 시도
          performShare(platform);
        } finally {
          setIsGeneratingImage(false);
        }
      } else {
        // 이미지가 이미 있거나 필요 없는 경우 바로 공유
        performShare(platform, cardImage);
      }
    } catch (error) {
      console.error('공유 처리 중 오류:', error);
      // 오류 발생 시에도 일반 공유는 시도
      performShare(platform);
    }
  };

  // base64 이미지를 ImgBB API를 통해 호스팅 이미지로 변환하는 함수
  const uploadImageToHost = async (base64Image: string): Promise<string | null> => {
    // 실제 프로덕션에서는 환경 변수나 안전한 방법으로 API 키를 관리해야 합니다
    const API_KEY = '7606e0b797f3cbc08fd94e3a8bb87972'; // ImgBB 무료 API 키
    
    // base64 이미지에서 헤더 제거 (data:image/png;base64, 부분)
    const base64Data = base64Image.split(',')[1];
    
    try {
      const formData = new FormData();
      formData.append('key', API_KEY);
      formData.append('image', base64Data);
      
      const response = await fetch('https://api.imgbb.com/1/upload', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log('이미지 업로드 성공:', data.data.url);
        return data.data.url;
      } else {
        console.error('이미지 업로드 실패:', data);
        return null;
      }
    } catch (error) {
      console.error('이미지 업로드 중 오류:', error);
      return null;
    }
  };

  // 실제 공유 수행 함수
  const performShare = async (platform: string, image?: string | null) => {
    let shareUrl = '';
    
    switch(platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(description)}`;
        break;
      case 'twitter':
        // 이제는 X이지만, URL은 아직 twitter.com을 사용
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
        break;
      case 'gmail':
        shareUrl = `https://mail.google.com/mail/?view=cm&to=&su=${encodeURIComponent(title)}&body=${encodeURIComponent(description)}%0A%0A${encodeURIComponent(url)}`;
        break;
      case 'kakao':
        if (window.Kakao) {
          try {
            // 추가 디버깅 로그
            console.log('카카오 공유 시작 - Kakao SDK 상태:', {
              initialized: window.Kakao.isInitialized(),
              hasShareAPI: !!window.Kakao.Share,
              hasLinkAPI: !!window.Kakao.Link
            });

            // 이미지가 있는 경우 업로드 시도
            let imageUrl = '';
            
            if (image) {
              console.log('생성된 이미지를 카카오톡 공유에 사용합니다');
              // ImgBB 서비스에 이미지 업로드 시도
              const hostedImageUrl = await uploadImageToHost(image);
              
              if (hostedImageUrl) {
                imageUrl = hostedImageUrl;
                console.log('업로드된 이미지 URL:', imageUrl);
              } else {
                // 업로드 실패 시 기본 이미지 사용
                imageUrl = window.location.origin + '/votey_icon2.png';
                console.log('이미지 업로드 실패, 기본 이미지 사용:', imageUrl);
              }
            } else {
              // 이미지가 없는 경우 기본 이미지 사용
              imageUrl = window.location.origin + '/votey_icon2.png';
              console.log('이미지 없음, 기본 이미지 사용:', imageUrl);
            }
            
            // 카카오 공유 데이터 구성
            const kakaoShareData = {
              objectType: 'feed',
              content: {
                title: title.length > 40 ? title.substring(0, 40) + '...' : title,
                description: description.length > 45 ? description.substring(0, 45) + '...' : description,
                imageUrl: imageUrl,
                link: {
                  mobileWebUrl: url,
                  webUrl: url
                }
              },
              buttons: [
                {
                  title: '투표하기',
                  link: {
                    mobileWebUrl: url,
                    webUrl: url
                  }
                }
              ]
            };
            
            console.log('카카오톡 공유 데이터:', kakaoShareData);
            
            // SDK 버전에 따라 다른 API 사용
            if (window.Kakao.Share) {
              window.Kakao.Share.sendDefault(kakaoShareData);
            } else if (window.Kakao.Link) {
              window.Kakao.Link.sendDefault(kakaoShareData);
            } else {
              console.error('카카오톡 공유 API를 찾을 수 없습니다');
              alert('카카오톡 공유 기능을 사용할 수 없습니다.');
            }
          } catch (error) {
            console.error('카카오톡 공유 실패:', error);
            alert('카카오톡 공유 중 오류가 발생했습니다.');
          }
        } else {
          alert('카카오톡 SDK가 로드되지 않았습니다.');
        }
        return;
      case 'download':
        if (image) {
          const link = document.createElement('a');
          link.href = image;
          link.download = `vote-${title.replace(/\s+/g, '-').toLowerCase()}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
        return;
      case 'link':
        copyToClipboard();
        return;
      default:
        return;
    }
    
    // 새 창으로 공유 URL 열기
    window.open(shareUrl, '_blank', 'width=600,height=400');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Helmet을 사용하여 동적 메타 태그 추가 */}
      {cardImage && (
        <Helmet>
          <meta property="og:title" content={title} />
          <meta property="og:description" content={description} />
          <meta property="og:image" content={cardImage} />
          <meta property="og:url" content={url} />
          <meta property="og:type" content="website" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={title} />
          <meta name="twitter:description" content={description} />
          <meta name="twitter:image" content={cardImage} />
        </Helmet>
      )}
      
      <div className="share-modal-overlay" onClick={onClose}>
        <div className="share-modal" onClick={e => e.stopPropagation()}>
          <div className="share-modal-header">
            <h3>공유하기</h3>
            <button className="close-btn" onClick={onClose}>&times;</button>
          </div>
          
          <div className="share-modal-content">
            {isGeneratingImage ? (
              <div className="generating-image">
                <p>이미지 생성 중...</p>
                {/* 여기에 로딩 스피너를 추가할 수 있습니다 */}
              </div>
            ) : cardImage ? (
              <div className="card-image-preview">
                <img src={cardImage} alt="Vote card" className="share-card-image" />
                <div className="image-actions">
                  <button 
                    className="image-action-btn download"
                    onClick={() => performShare('download', cardImage)}
                    title="이미지 다운로드"
                  >
                    다운로드
                  </button>
                </div>
              </div>
            ) : (
              <div className="share-url-container">
                <input 
                  type="text" 
                  value={url} 
                  readOnly 
                  className="share-url-input"
                />
                <button 
                  className="copy-button" 
                  onClick={copyToClipboard}
                  title="링크 복사"
                >
                  <FaCopy />
                </button>
                {copyStatus && (
                  <div className="copy-status">
                    {copyStatus}
                  </div>
                )}
              </div>
            )}
            
            <div className="share-options">
              <button 
                className="share-option-btn facebook"
                onClick={() => shareToSocial('facebook')}
                title="페이스북으로 공유"
                disabled={isGeneratingImage}
              >
                <FaFacebook />
                <span>페이스북</span>
              </button>
              
              <button 
                className="share-option-btn twitter"
                onClick={() => shareToSocial('twitter')}
                title="트위터로 공유"
                disabled={isGeneratingImage}
              >
                <FaTwitter />
                <span>트위터</span>
              </button>
              
              <button 
                className="share-option-btn gmail"
                onClick={() => shareToSocial('gmail')}
                title="Gmail로 공유"
                disabled={isGeneratingImage}
              >
                <FaEnvelope />
                <span>Gmail</span>
              </button>
              
              <button 
                className="share-option-btn kakao"
                onClick={() => shareToSocial('kakao')}
                title="카카오톡으로 공유"
                disabled={isGeneratingImage || !kakaoInitialized}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 3C6.48 3 2 6.48 2 10.8C2 13.8 3.8 16.4 6.6 17.8L5.2 22.2C5.1 22.5 5.3 22.8 5.6 22.9C5.7 22.9 5.8 22.9 5.9 22.9C6.1 22.9 6.2 22.8 6.3 22.7L11.4 19.2C11.6 19.2 11.8 19.2 12 19.2C17.52 19.2 22 15.72 22 11.4C22 7.08 17.52 3 12 3Z" fill="#FEE500"/>
                </svg>
                <span>카카오톡</span>
              </button>
              
              <button 
                className="share-option-btn link"
                onClick={() => shareToSocial('link')}
                title="링크 복사"
                disabled={isGeneratingImage}
              >
                <FaLink />
                <span>링크 복사</span>
              </button>
              
              <button 
                className="share-option-btn download"
                onClick={() => shareToSocial('download')}
                title="이미지 다운로드"
                disabled={isGeneratingImage || !cardImage}
              >
                <FaShare />
                <span>다운로드</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
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
  isLoading = false
}) => {
  const { handleLike, userReactions, loadUserReaction, updateVoteTopic } = useVoteContext();
  const { user } = useAuth();
  
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
      
      // total_votes 업데이트 추가
      setTopic(prev => ({
        ...prev,
        options: updatedOptions,
        total_votes: previousOptionId === null ? prev.total_votes + 1 : prev.total_votes
      }));

      // 다른 사람의 투표카드에 투표할 때만 weekly_voted 증가
      if (!isMyVote) {
        const { data, error: fetchError } = await supabase
          .from('users')
          .select('weekly_voted, total_points, monthly_points, votesParticipated')
          .eq('id', user?.id)
          .single();

        if (fetchError) {
          console.error('weekly_voted 가져오기 중 오류 발생:', fetchError);
          return;
        }

        const updatedWeeklyVoted = [...data.weekly_voted];
        updatedWeeklyVoted[updatedWeeklyVoted.length - 1] += 1;

        const { error: updateError } = await supabase
          .from('users')
          .update({ 
            weekly_voted: updatedWeeklyVoted,
            votesParticipated: data.votesParticipated + 1,
            total_points: data.total_points + 10,    // 10점 추가
            monthly_points: data.monthly_points + 10  // 10점 추가
          })
          .eq('id', user?.id);

        if (updateError) {
          console.error('weekly_voted 업데이트 중 오류 발생:', updateError);
        }
      }

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
    // 비디오 URL인지 확인
    const isVideo = topicState.related_image && isVideoUrl(topicState.related_image);

    return (
      <div className="question-container">
        {topicState.related_image && (
          <div 
            className={`question-media-container ${isVideo ? 'video-container' : 'image-container'} ${!isVideo && isPngWithTransparency(topicState.related_image) ? 'transparent-bg' : ''}`}
          >
            {isVideo ? (
              <video 
                src={topicState.related_image} 
                controls 
                className="question-video"
                onError={(e) => {
                  console.error(`질문 비디오 로드 오류: ${topicState.id}`);
                  // 비디오 로드 실패 시 대체 콘텐츠 표시 (예: 메시지)
                  const target = e.target as HTMLVideoElement;
                  target.style.display = 'none'; // 비디오 숨김
                  // 필요하다면 대체 텍스트나 이미지를 여기에 추가
                }}
              >
                현재 브라우저에서 비디오 재생을 지원하지 않습니다.
              </video>
            ) : (
              <img 
                src={topicState.related_image} 
                alt={topicState.question} 
                className={`question-image ${isStorageImage(topicState.related_image) ? 'storage-image' : ''}`}
                onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                  console.error(`질문 이미지 로드 오류: ${topicState.id}`);
                  const target = e.target as HTMLImageElement;
                  target.src = DEFAULT_ERROR_IMAGE;
                  target.classList.remove('storage-image');
                }} 
              />
            )}
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);

  // 공유 관련 상태 추가
  const [showShareModal, setShowShareModal] = useState(false);
  // 모바일 디바이스 확인
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    typeof navigator !== 'undefined' ? navigator.userAgent : ''
  );

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

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    setShowDeleteConfirm(false);
    if (!onDelete) return;

    setLoading(true);
    setProgress(20);
    setProgressStatus("카드 삭제 준비 중...");
    
    try {
      setProgress(50);
      setProgressStatus("카드 삭제 중...");
      
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

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    console.log("투표 삭제가 취소되었습니다.");
  };

  // 투표 업로드 확인 모달 확인 함수
  const handlePublishClick = () => {
    setShowPublishConfirm(true);
  };

  // 투표 업로드 확인 모달 확인 함수
  const confirmPublish = async () => {
    setShowPublishConfirm(false);
    if (!onPublish) return;

    setLoading(true);
    setProgress(20);
    setProgressStatus("카드 업로드 준비 중...");

    try {
      setProgress(50);
      setProgressStatus("카드 업로드 중...");

      // weekly_created 값 증가
      const { data, error: fetchError } = await supabase
        .from('users')
        .select('weekly_created, total_points, monthly_points, votesCreated')
        .eq('id', user?.id)
        .single();

      if (fetchError) {
        console.error('weekly_created 가져오기 중 오류 발생:', fetchError);
        return;
      }

      const updatedWeeklyCreated = [...data.weekly_created];
      updatedWeeklyCreated[updatedWeeklyCreated.length - 1] += 1;

      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          weekly_created: updatedWeeklyCreated,
          votesCreated: data.votesCreated + 1,
          total_points: data.total_points + 50,    // 50점 추가
          monthly_points: data.monthly_points + 50  // 50점 추가
        })
        .eq('id', user?.id);

      if (updateError) {
        console.error('weekly_created 업데이트 중 오류 발생:', updateError);
      }

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

  const cancelPublish = () => {
    setShowPublishConfirm(false);
    console.log("투표 업로드가 취소되었습니다.");
  };

  // 분석 페이지로 이동하는 함수 수정
  const handleAnalysisClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/vote/${topicState.id}/analysis`);
  };

  // 공유 핸들러 수정
  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const shareUrl = `${window.location.origin}/vote/${topicState.id}`;
    const shareTitle = `${topicState.question} - VoteY 투표`;
    const shareText = `${topicState.question}에 대한 투표에 참여해보세요!`;
    
    // 네이티브 공유 API 지원 확인
    if (navigator.share && isMobile) {
      navigator.share({
        title: shareTitle,
        text: shareText,
        url: shareUrl,
      }).then(() => {
        console.log('네이티브 공유 성공');
      }).catch((error) => {
        console.error('공유 실패:', error);
        setShowShareModal(true); // 실패 시 커스텀 모달 표시
      });
    } else {
      setShowShareModal(true); // 네이티브 API 미지원 시 커스텀 모달 표시
    }
  };

  // 카드 참조 추가
  const cardRef = useRef<HTMLDivElement>(null);

  return (
    <div className={`vote-card modern-card ${topicState.is_expired ? 'expired' : ''}`} id={id} ref={cardRef}>
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
          <button 
            className="analysis-btn" 
            onClick={handleAnalysisClick}
            title="상세분석"
          >
            <FaChartBar className="analysis-icon" />
          </button>
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
                onClick={handleShare}
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
              onClick={handleShare}
              aria-label="공유"
            >
              <FaShare />
            </button>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="투표 삭제 확인"
        message="정말로 이 투표를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        confirmButtonText="삭제"
        confirmButtonVariant="danger"
      />

      {/* 업로드 확인 모달 */}
      <ConfirmModal
        isOpen={showPublishConfirm}
        onClose={cancelPublish}
        onConfirm={confirmPublish}
        title="투표 업로드 확인"
        message="이 투표를 공개 게시하시겠습니까?"
        confirmButtonText="업로드"
        confirmButtonVariant="primary"
      />

      {/* 공유 모달 추가 */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        url={`${window.location.origin}/vote/${topicState.id}`}
        title={`${topicState.question} - VoteY 투표`}
        description={`${topicState.question}에 대한 투표에 참여해보세요!`}
        cardRef={cardRef as React.RefObject<HTMLDivElement>}
      />

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