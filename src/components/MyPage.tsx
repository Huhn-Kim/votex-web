import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/MyPage.module.css";
import "../styles/TabStyles.css";
import { UserInfo, Badge, Subscriber } from '../lib/types';
import supabase from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import MypageSkeletonCard from './MypageSkeletonCard';
import ConfirmModal from './ConfirmModal';

// 숫자 아이콘 컴포넌트 수정 - 크기 증가
const NumberIcon = ({ number, color = "#FFFFFF", size = 32 }: { number: number; color?: string; size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" stroke={color} fill="none"/>
    <text x="12" y="16" textAnchor="middle" fill={color} fontSize="12" fontWeight="bold">{number}</text>
  </svg>
);

// 메달 아이콘 컴포넌트 수정 - 더 고급스러운 디자인
const MedalIcon = ({ type, size = 32 }: { type: 'bronze' | 'silver' | 'gold'; color?: string; size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24">
    {/* 메달 리본 */}
    <path d="M8 2 C8 2 10 3 12 3 C14 3 16 2 16 2 L15 7 L12 8 L9 7 L8 2" 
          fill={type === 'gold' ? '#FFDF00' : type === 'silver' ? '#F8F8FF' : '#FFA07A'} 
          stroke="#000" 
          strokeWidth="0.5"/>
    
    {/* 메달 본체 */}
    <circle cx="12" cy="13" r="7" 
            fill={type === 'gold' ? '#FFDF00' : type === 'silver' ? '#F8F8FF' : '#FFA07A'} 
            stroke="#000" 
            strokeWidth="0.5"/>
    
    {/* 메달 테두리 장식 */}
    <circle cx="12" cy="13" r="6" 
            fill="none" 
            stroke="#000" 
            strokeWidth="0.3"
            strokeDasharray="2,0.5"/>
    
    {/* 메달 내부 장식 */}
    <circle cx="12" cy="13" r="4.5" 
            fill="none" 
            stroke="#000" 
            strokeWidth="0.3"/>
    
    {/* 메달 중앙 별 모양 */}
    <path d="M12 9.5 L13 12 L15.5 12 L13.5 13.5 L14.5 16 L12 14.5 L9.5 16 L10.5 13.5 L8.5 12 L11 12 Z"
          fill="#000"
          opacity="0.1"/>
    
    {/* 메달 표면 광택 효과 */}
    <ellipse cx="12" cy="11" rx="3" ry="1.5" 
             fill="#FFFFFF" 
             opacity="0.4"/>
  </svg>
);

// 다이아몬드 아이콘 컴포넌트 수정 - 더 다이아몬드다운 디자인
const DiamondIcon = ({ color = "#00FFFF", size = 32 }: { color?: string; size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24">
    {/* 다이아몬드 상단 */}
    <path d="M12 2 L17 8 L12 14 L7 8 Z" 
          fill={color}
          stroke="#000"
          strokeWidth="0.3"/>
    
    {/* 다이아몬드 하단 */}
    <path d="M7 8 L12 14 L12 20 L4 10 Z" 
          fill={color}
          stroke="#000"
          strokeWidth="0.3"
          opacity="0.9"/>
    
    <path d="M17 8 L12 14 L12 20 L20 10 Z" 
          fill={color}
          stroke="#000"
          strokeWidth="0.3"
          opacity="0.7"/>
    
    {/* 다이아몬드 광택 효과 - 상단 */}
    <path d="M12 2 L14 5 L12 8 L10 5 Z" 
          fill="#FFFFFF"
          opacity="0.4"/>
    
    {/* 다이아몬드 광택 효과 - 우측 */}
    <path d="M14 5 L16 8 L14 11 L12 8 Z" 
          fill="#FFFFFF"
          opacity="0.2"/>
    
    {/* 다이아몬드 광택 효과 - 좌측 */}
    <path d="M10 5 L12 8 L10 11 L8 8 Z" 
          fill="#FFFFFF"
          opacity="0.3"/>
    
    {/* 다이아몬드 하이라이트 */}
    <path d="M11 4 L12 6 L13 4" 
          stroke="#FFFFFF"
          strokeWidth="0.5"
          fill="none"
          opacity="0.6"/>
  </svg>
);

// 황금왕관 아이콘 컴포넌트 - 이전 디자인으로 복원
const CrownIcon = ({ color = "#FFD700", size = 32 }: { color?: string; size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"></path>
  </svg>
);

// 등급별 색상 정의 수정 - 메달 색상을 더 밝게 조정
const getBadgeColor = (level: number) => {
  if (level <= 3) {
    return "#FFFFFF"; // 1-3등급: 흰색
  } else if (level <= 6) {
    return "#FFE566"; // 4-6등급: 밝은 노란색
  } else if (level <= 9) {
    return "#00FF88"; // 7-9등급: 초록색
  } else if (level === 10) {
    return "#FFA07A"; // 동메달: 더 밝은 브론즈 색상
  } else if (level === 11) {
    return "#F8F8FF"; // 은메달: 더 밝은 실버 색상
  } else if (level === 12) {
    return "#FFDF00"; // 금메달: 더 밝은 골드 색상
  } else if (level === 13) {
    return "#00FFFF"; // 다이아몬드: 이전 색상
  } else if (level === 14) {
    return "#FFD700"; // 황금왕관: 이전 색상
  }
  return "#FFFFFF";
};

// 뱃지 정보를 가져오는 함수 수정
const getGradeLevel = (level: number) => {
  if (level <= 9) {
    return level * 1000;
  } else if (level === 10) {
    return 10000;
  } else if (level === 11) {
    return 15000;
  } else if (level === 12) {
    return 20000;
  } else if (level === 13) {
    return 25000;
  } else if (level === 14) {
    return 30000;
  }
  return 0; // 기본값 추가
};

// 뱃지 정보를 가져오는 함수 수정
const getBadgeInfo = (level: number) => {
  const color = getBadgeColor(level);
  if (level <= 9) {
    return { name: `${level}등급`, color, type: 'number' as const };
  } else if (level === 10) {
    return { name: "동메달", color, type: 'medal' as const, medalType: 'bronze' as const };
  } else if (level === 11) {
    return { name: "은메달", color, type: 'medal' as const, medalType: 'silver' as const };
  } else if (level === 12) {
    return { name: "금메달", color, type: 'medal' as const, medalType: 'gold' as const };
  } else if (level === 13) {
    return { name: "다이아몬드", color, type: 'special' as const };
  } else if (level === 14) {
    return { name: "황금왕관", color, type: 'special' as const };
  }
  return { name: "초심자", color: "#FFFFFF", type: 'number' as const };
};

// 뱃지 아이콘 매핑 함수 수정
const getBadgeIcon = (level: number, size = 32) => {
  const badgeInfo = getBadgeInfo(level);
  if (!badgeInfo) return null;
  
  const color = badgeInfo.color;
  
  switch (badgeInfo.type) {
    case 'number':
      return <NumberIcon number={level} color={color} size={size} />;
    case 'medal':
      return <MedalIcon type={badgeInfo.medalType} color={color} size={size} />;
    case 'special':
      return level === 13 ? 
        <DiamondIcon color={color} size={size} /> : 
        <CrownIcon color={color} size={size} />;
    default:
      return null;
  }
};

// 기본 아바타 컴포넌트 수정
const DefaultAvatar = () => (
  <div className="default-profile-icon">
    <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="#ffffff"/>
    </svg>
  </div>
);

// 일주일 간의 투표 활동 데이터 타입 정의
type WeeklyActivity = {
  date: string;
  votesCreated: number;
  votesParticipated: number;
};

// 바 그래프 컴포넌트
const BarChart = ({ data, maxValue }: { data: WeeklyActivity[], maxValue: number }) => {
  const getDayLabel = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', { weekday: 'short' }).replace('요일', '');
  };

  return (
    <div className={styles.barChartContainer}>
      {data.map((day, index) => (
        <div key={index} className={styles.barChartColumn}>
          <div className={styles.barChartBars}>
            <div 
              className={`${styles.barChartBar} ${styles.barCreated}`} 
              style={{ 
                height: `${maxValue ? (day.votesCreated / maxValue) * 100 : 0}%`,
              }}
            >
              <span className={styles.barTooltip}>{day.votesCreated}개 생성</span>
            </div>
            <div 
              className={`${styles.barChartBar} ${styles.barParticipated}`} 
              style={{ 
                height: `${maxValue ? (day.votesParticipated / maxValue) * 100 : 0}%`,
              }}
            >
              <span className={styles.barTooltip}>{day.votesParticipated}개 참여</span>
            </div>
          </div>
          <div className={styles.barChartLabel}>{getDayLabel(day.date)}</div>
        </div>
      ))}
    </div>
  );
};

export default function MyPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 최근 일주일 간의 투표 활동 데이터
  const [weeklyActivity, setWeeklyActivity] = useState<WeeklyActivity[]>([]);
  const [maxActivityValue, setMaxActivityValue] = useState<number>(0);

  // 뱃지 상태 초기화
  const [badges, setBadges] = useState<Badge[]>([]);

  // 구독 회원 상태
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  
  // 팔로잉 회원 상태 추가
  const [following, setFollowing] = useState<Subscriber[]>([]);
  
  // 설정 상태
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    darkMode: true,
    privateProfile: false,
  });

  // 활성 탭 상태
  const [activeTab, setActiveTab] = useState("profile");

  // 뱃지 획득 알림 상태
  const [badgeNotification, setBadgeNotification] = useState<{
    show: boolean;
    badge: Badge | null;
  }>({
    show: false,
    badge: null
  });

  // 등급 업 축하 모달 상태 추가
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [levelUpInfo, setLevelUpInfo] = useState<{
    newLevel: number;
    badgeName: string;
    reward: string;
  } | null>(null);

  // 사용자 정보 가져오기
  useEffect(() => {
    const loadUserInfo = async () => {
      if (!user || user.id === 'guest') {
        setUserInfo(null);
        setIsLoading(false);
        return;
      }

      try {
        // 로그인된 사용자의 경우 데이터가 로드될 때까지 로딩 상태 유지
        setIsLoading(true);

        const { data, error } = await supabase
          .from('users')
          .select('*, weekly_created, weekly_voted')
          .eq('id', user.id)
          .single();

        if (error) {
          throw error;
        }

        if (data) {
          setUserInfo(data);

          // weekly_created와 weekly_voted 데이터를 기반으로 weeklyActivity 업데이트
          const weeklyData: WeeklyActivity[] = data.weekly_created.map((created: number, index: number) => ({
            date: new Date(Date.now() - (6 - index) * 24 * 60 * 60 * 1000).toISOString(), // 최근 7일 날짜 생성
            votesCreated: created,
            votesParticipated: data.weekly_voted[index] || 0
          }));

          setWeeklyActivity(weeklyData);

          // 최댓값 계산 (차트 스케일링용)
          const maxValue = Math.max(
            ...weeklyData.map(day => Math.max(day.votesCreated, day.votesParticipated)),
            1  // 최소값 1 설정 (0으로 나누기 방지)
          );

          setMaxActivityValue(maxValue);
        } else {
          setUserInfo(null);
        }
      } catch (err) {
        setError('사용자 정보를 불러오는데 실패했습니다.');
        console.error('Error fetching user info:', err);
      } finally {
        // 데이터 로딩이 완료되면 로딩 상태 해제
        setIsLoading(false);
      }
    };

    // 사용자가 로그인되어 있을 때만 바로 loadUserInfo 실행
    if (user && user.id !== 'guest') {
      loadUserInfo();
    } else {
      // 게스트인 경우 최소한의 딜레이 후 로딩 상태 해제
      setIsLoading(false);
    }

    return () => {
      // 클린업 함수: 컴포넌트 언마운트 시 실행됨
    };
  }, [user]);

  // userInfo가 설정된 후에 badges 상태 업데이트
  useEffect(() => {
    if (!userInfo) return;

    const badgeLevels = [
      { id: "level1", name: "1등급", description: "첫 활동", color: "#FFFFFF" },
      { id: "level2", name: "2등급", description: "초보자", color: "#FFFFFF" },
      { id: "level3", name: "3등급", description: "성장중", color: "#FFFFFF" },
      { id: "level4", name: "4등급", description: "열정가", color: "#FFFFFF" },
      { id: "level5", name: "5등급", description: "전문가", color: "#FFFFFF" },
      { id: "level6", name: "6등급", description: "마스터", color: "#FFFFFF" },
      { id: "level7", name: "7등급", description: "엘리트", color: "#FFFFFF" },
      { id: "level8", name: "8등급", description: "레전드", color: "#FFFFFF" },
      { id: "level9", name: "9등급", description: "챔피언", color: "#FFFFFF" },
      { id: "level10", name: "동메달", description: "10등급 달성", color: "#FFA07A" },
      { id: "level11", name: "은메달", description: "11등급 달성", color: "#F8F8FF" },
      { id: "level12", name: "금메달", description: "12등급 달성", color: "#FFDF00" },
      { id: "level13", name: "다이아몬드", description: "13등급 달성", color: "#00FFFF" },
      { id: "level14", name: "황금왕관", description: "14등급 달성", color: "#FFD700" }
    ];

    const updatedBadges = badgeLevels.map((badge, index) => ({
      ...badge,
      icon: getBadgeIcon(index + 1),
      acquired: index < userInfo.user_grade,
      acquiredDate: index < userInfo.user_grade && userInfo.updated_at && userInfo.updated_at.length > index 
        ? new Date(userInfo.updated_at[index]).toLocaleDateString('ko-KR', { 
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }) 
        : undefined,
      level: index + 1
    }));

    setBadges(updatedBadges);
  }, [userInfo]);

  useEffect(() => {
    // 구독 회원 데이터 가져오기
    const sampleSubscribers = Array.from({ length: 10 }, (_, index) => ({
      id: `user${index + 1}`,
      name: `구독자 ${index + 1}`,
      profileImage: `https://randomuser.me/api/portraits/${index % 2 ? 'women' : 'men'}/${index + 1}.jpg`,
      bio: `구독자 ${index + 1}의 간단한 소개입니다.`,
      isFollowing: Math.random() > 0.5,
    }));
    
    setSubscribers(sampleSubscribers);
    
    // 팔로잉 데이터 가져오기
    const sampleFollowing = Array.from({ length: 8 }, (_, index) => ({
      id: `following${index + 1}`,
      name: `팔로잉 ${index + 1}`,
      profileImage: `https://randomuser.me/api/portraits/${index % 2 ? 'men' : 'women'}/${index + 30}.jpg`,
      bio: `팔로잉 ${index + 1}의 간단한 소개입니다.`,
      isFollowing: true,
    }));
    
    setFollowing(sampleFollowing);
  }, []);


  // 포인트 획득 함수 수정
  const earnPoints = async (points: number) => {
    if (!userInfo) return;
    
    try {
      // 1. 최신 사용자 정보를 DB에서 가져옴 (포인트와 등급 모두)
      const { data: latestData, error: fetchError } = await supabase
        .from('users')
        .select('total_points, monthly_points, user_grade')
        .eq('id', userInfo.id)
        .single();

      if (fetchError) {
        console.error('Error fetching latest points:', fetchError);
        return;
      }

      // 2. 최신 포인트에 새로운 포인트를 더함
      const newTotalPoints = latestData.total_points + points;
      const newMonthlyPoints = latestData.monthly_points + points;
      
      // 3. DB 업데이트
      const { error: updateError } = await supabase
        .from('users')
        .update({
          total_points: newTotalPoints,
          monthly_points: newMonthlyPoints
        })
        .eq('id', userInfo.id);

      if (updateError) {
        console.error('Error updating points:', updateError);
        return;
      }

      // 4. 로컬 상태 업데이트
      setUserInfo(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          total_points: newTotalPoints,
          monthly_points: newMonthlyPoints
        };
      });

      // 5. 등급 업데이트 체크 - 최신 DB 데이터 사용
      const currentLevel = latestData.user_grade;
      const nextLevelPoints = getGradeLevel(currentLevel + 1);

      // 6. 다음 등급 조건을 충족하면 updateTitle 호출
      if (newTotalPoints >= nextLevelPoints && currentLevel < 14) {
        await updateTitle(currentLevel, newTotalPoints);  // 매개변수로 최신 값 전달
      }

    } catch (error) {
      console.error('Error in earnPoints:', error);
    }
  };
    
  // 등급 업데이트 함수 수정
  const updateTitle = async (currentLevel: number, currentPoints: number) => {
    if (!userInfo) return;

    const nextLevelPoints = getGradeLevel(currentLevel + 1);

    if (currentPoints >= nextLevelPoints && currentLevel < 14) {
      try {
        const updatedAt = new Date().toISOString();
        
        // 1. 기존 updated_at 배열 처리
        let existingDates: string[] = Array.isArray(userInfo.updated_at) ? userInfo.updated_at : [];
        
        // 2. 새로운 날짜 추가
        const newUpdatedAt = [...existingDates, updatedAt];
        
        const newLevel = currentLevel + 1;

        // 3. 데이터 업데이트
        const { error } = await supabase
          .from('users')
          .update({
            user_grade: newLevel,
            updated_at: newUpdatedAt
          })
          .eq('id', userInfo.id);

        if (error) {
          console.error('Error updating user grade:', error);
          return;
        }

        // 4. 로컬 상태 업데이트
        setUserInfo(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            user_grade: newLevel,
            updated_at: newUpdatedAt
          };
        });

        // 뱃지 업데이트
        setBadges(prev => prev.map(badge => 
          badge.level === newLevel
            ? { ...badge, acquired: true, acquiredDate: new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }).replace(/\./g, '년').replace(/\s/g, ' ') + '일' } 
            : badge
        ));

        // 레벨업 정보 설정 및 모달 표시
        setLevelUpInfo({
          newLevel: newLevel,
          badgeName: getBadgeInfo(newLevel).name,
          reward: newLevel >= 10 ? `${Math.min(newLevel - 9, 5)}% 배당` : '포인트 적립'
        });
        setShowLevelUpModal(true);
        
        // 뱃지 알림 표시
        setBadgeNotification({
          show: true,
          badge: {
            id: `level${newLevel}`,
            name: getBadgeInfo(newLevel).name,
            icon: getBadgeIcon(newLevel),
            description: `${newLevel}등급 달성`,
            acquired: true,
            acquiredDate: new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }).replace(/\./g, '년').replace(/\s/g, ' ') + '일',
            color: getBadgeColor(newLevel),
            level: newLevel
          }
        });
        
        setTimeout(() => {
          setBadgeNotification({
            show: false,
            badge: null
          });
        }, 2000);
      } catch (error) {
        console.error('Error in updateTitle:', error);
      }
    }
  };
  

  // 설정 변경 핸들러
  const handleSettingChange = (setting: keyof typeof settings) => {
    setSettings({
      ...settings,
      [setting]: !settings[setting],
    });
  };

  // 구독 상태 변경 핸들러 수정
  const handleFollowToggle = (userId: string, isFollowingTab: boolean = false) => {
    if (isFollowingTab) {
      setFollowing(
        following.map((user) =>
          user.id === userId
            ? { ...user, isFollowing: !user.isFollowing }
            : user
        )
      );
    } else {
      setSubscribers(
        subscribers.map((sub) =>
          sub.id === userId
            ? { ...sub, isFollowing: !sub.isFollowing }
            : sub
        )
      );
    }
    // 실제로는 여기서 API 호출하여 서버에 저장
  };

  // 탭 변경 핸들러
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  // 포인트 진행률 계산
  const calculatePointsProgress = () => {
    if (!userInfo) return 0;

    const currentLevel = userInfo.user_grade;
    const currentPoints = userInfo.total_points;
    const nextLevelPoints = getGradeLevel(currentLevel + 1);
    const currentLevelPoints = getGradeLevel(currentLevel);

    // 다음 등급까지의 진행률 계산
    const progress = ((currentPoints - currentLevelPoints) / (nextLevelPoints - currentLevelPoints)) * 100;

    return Math.max(0, Math.min(100, Math.floor(progress))); // 0%에서 100% 사이로 제한
  };

  // HEX 색상을 RGB로 변환하는 유틸리티 함수
  const hexToRgb = (hex: string): string => {
    // HEX 색상에서 # 제거
    hex = hex.replace('#', '');
    
    // 3자리 HEX 색상을 6자리로 변환 (예: #FFF -> #FFFFFF)
    if (hex.length === 3) {
      hex = hex.split('').map(char => char + char).join('');
    }
    
    // HEX를 RGB로 변환
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return `${r}, ${g}, ${b}`;
  };

  // 테스트 버튼 렌더링 함수
  const renderTestButtons = () => (
    <div className={styles.testButtons}>
      <button 
        className={styles.testButton}
        onClick={() => earnPoints(50)}
      >
        투표 생성 (+50P)
      </button>
      <button 
        className={styles.testButton}
        onClick={() => earnPoints(30)}
      >
        투표 참여 (+30P)
      </button>
      <button 
        className={styles.testButton}
        onClick={() => earnPoints(20)}
      >
        획득 투표 (+20P)
      </button>
      <button 
        className={styles.testButton}
        onClick={() => earnPoints(100)}
      >
        친구 추천 (+100P)
      </button>
      <button 
        className={styles.testButton}
        onClick={() => earnPoints(200)}
      >
        AI 분석 (+200P)
      </button>
      <button 
        className={styles.testButton}
        onClick={() => earnPoints(150)}
      >
        AI 투표 추천 (+150P)
      </button>
      <button 
        className={styles.testButton}
        onClick={() => earnPoints(100)}
      >
        끌어올리기 (+100P)
      </button>
    </div>
  );

  // 로그인 핸들러 추가
  const handleLogin = () => {
    navigate('/auth');
  };

  // 회원가입 핸들러 추가
  const handleSignup = () => {
    navigate('/signup');
  };

  // 로그아웃 핸들러
  const handleSignOut = async () => {
    try {
      await signOut();
      // 로그아웃 후 즉시 userInfo를 null로 설정
      setUserInfo(null);
      navigate('/mypage');
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  // MyPage 컴포넌트 내부에 useEffect 추가
  useEffect(() => {
    // 사용자 정보가 있을 때만 updateTitle 함수 호출
    if (userInfo) {
      updateTitle(userInfo.user_grade, userInfo.total_points);
    }
  }, [userInfo]); // userInfo가 변경될 때마다 useEffect 실행

  const handleProfileClick = () => {
    if (currentUserInfo.id != "guest") {
      navigate('/signup', { state: { userInfo: userInfo } });
    }
  };

  if (error) {
    return <div className="error">{error}</div>;
  }

  // 게스트 사용자 정보 생성 부분 수정
  const guestUserInfo: UserInfo = {
    id: "guest",
    email: "guest@example.com",
    username: "게스트",
    profile_Image: "",
    gender: "게스트 사용자입니다.",
    user_grade: 0,
    total_points: 0,
    monthly_points: 1000, // 목표 포인트 표시를 위해 추가
    votesCreated: 0,
    votesParticipated: 0,
    created_at: new Date().toISOString(),
    updated_at: [new Date().toISOString()],
    phone_number: "",
    password: "",
    region: "",
    interests: [],
    political_view: "", // political_view 추가
    birthyear: 0,
    weekly_created: [],
    weekly_voted: []
  };

  // 현재 사용자 정보 (로그인 상태가 아니면 게스트 정보 사용)
  const currentUserInfo = userInfo || guestUserInfo;

  return (
    <div className="my-votes-container">
      {isLoading ? (
        <MypageSkeletonCard />
      ) : (
        <>
          {/* 뱃지 획득 알림 */}
          {badgeNotification.show && badgeNotification.badge && (
            <div className={styles.badgeNotification}>
              <div className={styles.badgeNotificationIcon} style={{ color: badgeNotification.badge.color }}>
                {badgeNotification.badge.icon}
              </div>
              <div className={styles.badgeNotificationContent}>
                <h4>새로운 뱃지 획득!</h4>
                <p>{badgeNotification.badge.name}</p>
                <p className={styles.badgeNotificationDesc}>{badgeNotification.badge.description}</p>
              </div>
            </div>
          )}
          
          {/* 상단 사용자 정보 영역 */}
          <div className={styles.userHeader}>
            <div className={styles.userInfoContainer}>
              {/* 사용자 프로필 섹션과 레벨 정보를 가로로 배치 */}
              <div className={styles.userProfileRow}>
                {/* 사용자 이미지, 이름, 등급 영역 */}
                <div className={styles.userProfileSection}>
                  <div className={styles.profileFlexContainer}>
                    <div className={styles.userAvatar} onClick={handleProfileClick}>                  
                      <div className="user-profile-image">
                        {currentUserInfo.profile_Image && currentUserInfo.profile_Image !== "" ? (
                          <img 
                            src={currentUserInfo.profile_Image} 
                            alt="프로필 이미지" 
                            className="profile-image"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              // 에러 발생 시 대체 아이콘 표시
                              (e.currentTarget.parentNode as HTMLElement).classList.add('default-profile-icon');
                            }}
                          />
                        ) : (
                          <DefaultAvatar />
                        )}
                      </div>
                    </div>
                    
                    <div className={styles.userNameContainer}>
                      <h2 className={styles.userName}>{currentUserInfo.username}</h2>
                      
                      {currentUserInfo.id !== "guest" && (
                        <div className={styles.titleBadge} style={{ 
                          backgroundColor: `rgba(${hexToRgb(getBadgeColor(currentUserInfo.user_grade))}, 0.15)`, 
                          borderColor: `rgba(${hexToRgb(getBadgeColor(currentUserInfo.user_grade))}, 0.3)`,
                          alignSelf: 'flex-start'
                        }}>
                          <span className={styles.titleIcon}>
                            {getBadgeIcon(currentUserInfo.user_grade)}
                          </span>
                          <span className={styles.titleText} style={{ 
                            color: getBadgeColor(currentUserInfo.user_grade) 
                          }}>
                            {getBadgeInfo(currentUserInfo.user_grade).name}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* 레벨 정보 영역 - 우측에 배치 */}
                <div className={styles.userInfoRight}>
                  <div className={styles.levelInfo}>
                    <div className={styles.levelHeader}>
                      <span className={styles.levelLabel} style={{ color: getBadgeColor(currentUserInfo.user_grade) }}>
                        레벨 {currentUserInfo.user_grade}
                      </span>
                    </div>
                    <div className={styles.pointsInfoRow}>
                      <span className={styles.pointsValue}>{currentUserInfo.monthly_points} / {currentUserInfo.total_points} P</span>
                    </div>
                    <div className={styles.pointsProgressContainer}>
                      <div 
                        className={styles.pointsProgressBar} 
                        style={{ 
                          width: `${calculatePointsProgress()}%`,
                          backgroundColor: getBadgeColor(currentUserInfo.user_grade)
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* 이메일과 가입일, 로그인/로그아웃 버튼을 가로로 배치 */}
              <div className={styles.userInfoFooter}>
                {/* 이메일과 가입일 영역 */}
                <div className={styles.userContactSection}>
                  <div className={styles.userContactInfo}>
                    <p className={styles.userEmail}>{currentUserInfo.email}</p>
                    <p className={styles.userJoinDate}>
                      {currentUserInfo.id === "guest" ? 
                        "게스트로 접속 중" :
                        `가입일: ${new Date(currentUserInfo.created_at).toLocaleDateString('ko-KR', { 
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}`
                      }
                    </p>
                  </div>
                </div>

                {/* 로그아웃 버튼 영역 */}
                {currentUserInfo.id !== "guest" ? (
                  <div className={styles.logoutButtonContainer}>
                    <button 
                      className={styles.logoutButton}
                      onClick={handleSignOut}
                    >
                      로그아웃
                    </button>
                  </div>
                ) : (
                  <div className={styles.guestActions}>
                    <button 
                      className={styles.loginButton}
                      onClick={handleLogin}
                    >
                      로그인
                    </button>
                    <button 
                      className={styles.signupButton}
                      onClick={handleSignup}
                    >
                      회원가입
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
               

          <div className="vote-tabs">
            <div className="tab-list">
              <button 
                className={`tab-button ${activeTab === "profile" ? 'active' : ''}`}
                onClick={() => handleTabChange("profile")}
              >
                프로필
              </button>
              <button 
                className={`tab-button ${activeTab === "badges" ? 'active' : ''}`}
                onClick={() => handleTabChange("badges")}
              >
                등급
              </button>
              <button 
                className={`tab-button ${activeTab === "subscribers" ? 'active' : ''}`}
                onClick={() => handleTabChange("subscribers")}
              >
                팔로워
              </button>
              <button 
                className={`tab-button ${activeTab === "following" ? 'active' : ''}`}
                onClick={() => handleTabChange("following")}
              >
                팔로잉
              </button>
              <button 
                className={`tab-button ${activeTab === "settings" ? 'active' : ''}`}
                onClick={() => handleTabChange("settings")}
              >
                설정
              </button>
            </div>
          </div>
          
          <div className={styles.tabs}>
            
            {/* 프로필 탭 */}
            {activeTab === "profile" && (
              <div className={styles.tabContent}>
                <div className={styles.profileContainer}>
                  <div className={styles.profileStatsCompact}>
                    <div className={styles.statItemCompact}>
                      <span className={styles.statLabel}>총 생성한 투표</span>
                      <span className={styles.statValue}>{currentUserInfo.votesCreated}</span>
                    </div>
                    <div className={styles.statItemCompact}>
                      <span className={styles.statLabel}>총 참여한 투표</span>
                      <span className={styles.statValue}>{currentUserInfo.votesParticipated}</span>
                    </div>
                  </div>
                  
                  {/* 주간 투표 활동 그래프 추가 */}
                  <div className={styles.weeklyActivitySection}>
                    <h3>최근 일주일 활동</h3>
                    {currentUserInfo.id !== "guest" ? (
                      <div className={styles.weeklyActivityChart}>
                        <div className={styles.chartLegend}>
                          <div className={styles.legendItem}>
                            <div className={`${styles.legendColor} ${styles.createdColor}`}></div>
                            <span>생성한 투표</span>
                          </div>
                          <div className={styles.legendItem}>
                            <div className={`${styles.legendColor} ${styles.participatedColor}`}></div>
                            <span>참여한 투표</span>
                          </div>
                        </div>
                        <BarChart data={weeklyActivity} maxValue={maxActivityValue} />
                        <div className={styles.chartFooter}>
                          <p className={styles.chartNote}>
                            {weeklyActivity.reduce((sum, day) => sum + day.votesCreated, 0)}개 생성 / {weeklyActivity.reduce((sum, day) => sum + day.votesParticipated, 0)}개 참여
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className={styles.guestChartPlaceholder}>
                        <p>로그인하여 활동 통계를 확인하세요</p>
                      </div>
                    )}
                  </div>
                  
                  {/* 최근 획득한 등급과 적립금 정보 */}
                  <div className={styles.profileInfoRow}>
                    <div className={styles.recentBadges}>
                      <h3>최근 획득한 등급</h3>
                      <div className={styles.badgesList}>
                        <div className={styles.badgeItem}>
                          <div className={styles.recentBadgeContent}>
                            <div className={styles.badgeIcon} data-level={currentUserInfo.user_grade}>
                              {getBadgeIcon(currentUserInfo.user_grade)}
                            </div>
                            <div className={styles.badgeInfo}>
                              <div className={styles.badgeName}>{getBadgeInfo(currentUserInfo.user_grade).name}</div>
                              <div className={styles.badgeDate}>
                                {currentUserInfo.id === "guest" ? 
                                  "로그인하여 등급을 획득하세요" :
                                  currentUserInfo.updated_at && currentUserInfo.updated_at.length > 0 ? 
                                    (() => {
                                      const lastDateString = currentUserInfo.updated_at[currentUserInfo.updated_at.length - 1];
                                      const lastDate = new Date(lastDateString);
                                      return isNaN(lastDate.getTime()) ? 
                                        "획득 날짜 없음" : 
                                        `획득일: ${lastDate.toLocaleDateString('ko-KR', { 
                                          year: 'numeric',
                                          month: 'long',
                                          day: 'numeric'
                                        })}`;
                                    })() :
                                    "획득 날짜 없음"
                                }
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className={styles.pointsInfoCard}>
                      <h3>적립금</h3>
                      <div className={styles.pointsPrice}>
                        {currentUserInfo.total_points} P
                      </div>
                      <div className={styles.pointsDescription}>
                        {currentUserInfo.id === "guest" ? 
                          "로그인하여 포인트를 적립하세요" :
                          <div className={styles.pointsRate}>
                            예상 배당율: {currentUserInfo.user_grade < 10 ? "0%" : `${Math.min(currentUserInfo.user_grade - 9, 5)}%`}
                          </div>
                        }
                      </div>
                    </div>
                  </div>
                  
                  {/* 게스트 사용자 안내 메시지 개선 */}
                  {currentUserInfo.id === "guest" && (
                    <div className={styles.guestInfo}>
                      <div className={styles.guestInfoHeader}>
                        <h3>🎉 VoteY의 더 많은 기능을 이용해보세요!</h3>
                        <p className={styles.guestInfoSubtitle}>
                          로그인하시면 다음과 같은 특별한 기능들을 이용하실 수 있습니다
                        </p>
                      </div>
                      <div className={styles.guestFeatureGrid}>
                        <div className={styles.guestFeatureItem}>
                          <span className={styles.featureIcon}>📊</span>
                          <h4>투표 생성 및 참여</h4>
                          <p>나만의 투표를 만들고 다른 사용자의 투표에 참여하세요</p>
                        </div>
                        <div className={styles.guestFeatureItem}>
                          <span className={styles.featureIcon}>💎</span>
                          <h4>포인트 적립</h4>
                          <p>활동할 때마다 포인트를 획득하고 등급을 올려보세요</p>
                        </div>
                        <div className={styles.guestFeatureItem}>
                          <span className={styles.featureIcon}>🏆</span>
                          <h4>등급 혜택</h4>
                          <p>높은 등급을 달성하여 특별한 혜택을 받아보세요</p>
                        </div>
                        <div className={styles.guestFeatureItem}>
                          <span className={styles.featureIcon}>🤝</span>
                          <h4>커뮤니티 활동</h4>
                          <p>다른 회원들과 소통하고 의견을 나눠보세요</p>
                        </div>
                      </div>                  
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* 설정 탭 */}
            {activeTab === "settings" && (
              <div className={styles.tabContent}>
                <div className={styles.settingsContainer}>
                  <div className={styles.settingItem}>
                    <div className={styles.settingInfo}>
                      <label htmlFor="email-notifications">이메일 알림</label>
                      <p className={styles.settingDescription}>새 투표와 결과에 대한 이메일 알림을 받습니다.</p>
                    </div>
                    <input
                      type="checkbox"
                      id="email-notifications"
                      checked={settings.emailNotifications}
                      onChange={() => handleSettingChange("emailNotifications")}
                      className={styles.settingSwitch}
                      disabled={currentUserInfo.id === "guest"}
                    />
                  </div>
                  
                  <div className={styles.settingItem}>
                    <div className={styles.settingInfo}>
                      <label htmlFor="push-notifications">푸시 알림</label>
                      <p className={styles.settingDescription}>앱 푸시 알림을 받습니다.</p>
                    </div>
                    <input
                      type="checkbox"
                      id="push-notifications"
                      checked={settings.pushNotifications}
                      onChange={() => handleSettingChange("pushNotifications")}
                      className={styles.settingSwitch}
                      disabled={currentUserInfo.id === "guest"}
                    />
                  </div>
                  
                  <div className={styles.settingItem}>
                    <div className={styles.settingInfo}>
                      <label htmlFor="dark-mode">다크 모드</label>
                      <p className={styles.settingDescription}>어두운 테마를 사용합니다.</p>
                    </div>
                    <input
                      type="checkbox"
                      id="dark-mode"
                      checked={settings.darkMode}
                      onChange={() => handleSettingChange("darkMode")}
                      className={styles.settingSwitch}
                      disabled={currentUserInfo.id === "guest"}
                    />
                  </div>
                  
                  <div className={styles.settingItem}>
                    <div className={styles.settingInfo}>
                      <label htmlFor="private-profile">비공개 프로필</label>
                      <p className={styles.settingDescription}>프로필을 비공개로 설정합니다.</p>
                    </div>
                    <input
                      type="checkbox"
                      id="private-profile"
                      checked={settings.privateProfile}
                      onChange={() => handleSettingChange("privateProfile")}
                      className={styles.settingSwitch}
                      disabled={currentUserInfo.id === "guest"}
                    />
                  </div>
                            
                </div>
              </div>
            )}
            
            {/* 구독 회원 탭 - 구독 버튼을 하트 아이콘으로 변경 */}
            {activeTab === "subscribers" && (
              <div className={styles.tabContent}>
                <div className={styles.subscribersContainer}>
                  {currentUserInfo.id === "guest" ? (
                    <div className={styles.guestSubscribersInfo}>
                      <h3>팔로워</h3>
                      <p>팔로워 회원이 없습니다.</p>
                    </div>
                  ) : (
                    <>
                      {subscribers.length > 0 ? (
                        subscribers.map((subscriber) => (
                          <div key={subscriber.id} className={styles.subscriberItem}>
                            <div className={styles.subscriberInfo}>
                              <div className={styles.subscriberAvatar}>
                                <img src={subscriber.profileImage} alt={`${subscriber.name}의 프로필`} />
                              </div>
                              <div className={styles.subscriberText}>
                                <h3 className={styles.subscriberName}>{subscriber.name}</h3>
                                <p className={styles.subscriberBio}>{subscriber.bio}</p>
                              </div>
                            </div>
                            <button
                              className={`${styles.heartButton} ${subscriber.isFollowing ? styles.following : ""}`}
                              onClick={() => handleFollowToggle(subscriber.id)}
                            >
                              {subscriber.isFollowing ? 
                                <FaHeart className={styles.heartIconFilled} /> : 
                                <FaRegHeart className={styles.heartIcon} />
                              }
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className={styles.noSubscribers}>팔로워 회원이 없습니다.</p>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
            
            {/* 팔로잉 탭 추가 */}
            {activeTab === "following" && (
              <div className={styles.tabContent}>
                <div className={styles.subscribersContainer}>
                  {currentUserInfo.id === "guest" ? (
                    <div className={styles.guestSubscribersInfo}>
                      <h3>팔로잉</h3>
                      <p>팔로잉 중인 회원이 없습니다.</p>
                    </div>
                  ) : (
                    <>
                      {following.length > 0 ? (
                        following.map((user) => (
                          <div key={user.id} className={styles.subscriberItem}>
                            <div className={styles.subscriberInfo}>
                              <div className={styles.subscriberAvatar}>
                                <img src={user.profileImage} alt={`${user.name}의 프로필`} />
                              </div>
                              <div className={styles.subscriberText}>
                                <h3 className={styles.subscriberName}>{user.name}</h3>
                                <p className={styles.subscriberBio}>{user.bio}</p>
                              </div>
                            </div>
                            <button
                              className={`${styles.heartButton} ${user.isFollowing ? styles.following : ""}`}
                              onClick={() => handleFollowToggle(user.id, true)}
                            >
                              {user.isFollowing ? 
                                <FaHeart className={styles.heartIconFilled} /> : 
                                <FaRegHeart className={styles.heartIcon} />
                              }
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className={styles.noSubscribers}>팔로잉 중인 회원이 없습니다.</p>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
            
            {/* 등급 탭 */}
            {activeTab === "badges" && (
              <div className={styles.tabContent}>
                <div className={styles.badgesContainer}>
                  <div className={styles.badgesList}>
                    {badges.map(badge => (
                      <div 
                        key={badge.id} 
                        className={`${styles.badgeItem} ${currentUserInfo.id === "guest" ? styles.lockedBadge : badge.acquired ? styles.acquiredBadge : styles.lockedBadge}`}
                      >
                        <div className={styles.badgeIcon} style={{ color: badge.color }}>
                          {badge.icon}
                        </div>
                        <div className={styles.badgeInfo}>
                          <span className={styles.badgeName}>{badge.name}</span>
                          <span className={styles.badgeDescription}>{badge.description}</span>
                          {badge.acquiredDate && (
                            <span className={styles.badgeDate} style={{ fontSize: '0.8em', color: '#666' }}>
                              획득일: {badge.acquiredDate}
                            </span>
                          )}
                          {badge.level >= 10 && (
                            <span className={styles.badgeReward}>
                              {Math.min(badge.level - 9, 5)}% 배당
                            </span>
                          )}
                        </div>
                        <div className={styles.badgeStatus}>
                          {currentUserInfo.id === "guest" ? (
                            <span className={styles.lockedStatus}>잠김</span>
                          ) : badge.acquired ? (
                            <span className={styles.acquiredStatus}>획득</span>
                          ) : (
                            <span className={styles.lockedStatus}>잠김</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {currentUserInfo.id === "guest" && (
                    <div className={styles.guestBadgesInfo}>
                      <p>로그인하여 등급을 획득하고 더 많은 기능을 이용해보세요.</p>
                      <div className={styles.guestActions}>
                        <button 
                          className={styles.loginButton}
                          onClick={handleLogin}
                        >
                          로그인
                        </button>
                        <button 
                          className={styles.signupButton}
                          onClick={handleSignup}
                        >
                          회원가입
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 테스트 버튼 섹션 추가 */}
          {renderTestButtons()}

          {/* 등급 업 축하 모달 */}
          {levelUpInfo && (
            <ConfirmModal
              isOpen={showLevelUpModal}
              onClose={() => setShowLevelUpModal(false)}
              onConfirm={() => setShowLevelUpModal(false)}
              title="🎉 등급 업 달성!"
              message={`축하합니다! ${levelUpInfo.badgeName}에 도달하셨습니다.\n새로운 등급에서는 ${levelUpInfo.reward} 혜택이 제공됩니다.`}
              confirmButtonText="확인"
              confirmButtonVariant="primary"
              cancelButtonText={undefined}
            />
          )}
        </>
      )}
    </div>
  );
}

