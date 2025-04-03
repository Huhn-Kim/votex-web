import { useState, useEffect } from "react";
import styles from "../styles/MyPage.module.css";
import "../styles/TabStyles.css";

// 뱃지 인터페이스
interface Badge {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  acquired: boolean;
  acquiredDate?: string;
  color: string;
  level: number;
}

// 칭호 인터페이스
interface Title {
  id: string;
  name: string;
  description: string;
  requiredLevel: number;
  acquired: boolean;
  icon: React.ReactNode;
  color: string;
  type: 'number' | 'medal' | 'special'; // 숫자, 메달, 특별 아이콘 구분
}

// 사용자 정보 인터페이스
interface UserInfo {
  id: string;
  name: string;
  email: string;
  profileImage: string;
  bio: string;
  joinDate: string;
  votesCreated: number;
  votesParticipated: number;
  points: number; // XP를 points로 변경
  level: number;
  currentTitle: string;
  nextLevelPoints: number; // nextLevelXp를 nextLevelPoints로 변경
}

// 구독 회원 인터페이스
interface Subscriber {
  id: string;
  name: string;
  profileImage: string;
  bio: string;
  isFollowing: boolean;
}

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

export default function MyPage() {
  // 사용자 정보 상태
  const [userInfo, setUserInfo] = useState<UserInfo>({
    id: "user123",
    name: "헌왕",
    email: "user@example.com",
    profileImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
    bio: "안녕하세요! 투표 앱을 즐겨 사용하고 있습니다.",
    joinDate: "2023년 5월 15일",
    votesCreated: 12,
    votesParticipated: 48,
    points: 0,
    level: 2,
    currentTitle: "2등급",
    nextLevelPoints: 2000,
  });

  // 뱃지 상태
  const [badges, setBadges] = useState<Badge[]>([
    // 1-9등급 (숫자 아이콘)
    ...Array.from({ length: 9 }, (_, i) => ({
      id: `level${i + 1}`,
      name: `${i + 1}등급`,
      icon: getBadgeIcon(i + 1),
      description: i === 0 ? "첫 활동" : 
                  i === 1 ? "초보자" :
                  i === 2 ? "성장중" :
                  i === 3 ? "열정가" :
                  i === 4 ? "전문가" :
                  i === 5 ? "마스터" :
                  i === 6 ? "엘리트" :
                  i === 7 ? "레전드" :
                  "챔피언",
      acquired: i < 3,
      acquiredDate: i < 3 ? "2023년 8월 3일" : undefined,
      color: "#FFFFFF",
      level: i + 1
    })),
    // 10-12등급 (메달)
    {
      id: "level10",
      name: "동메달",
      icon: getBadgeIcon(10),
      description: "10등급 달성",
      acquired: false,
      color: "#FFA07A",
      level: 10
    },
    {
      id: "level11",
      name: "은메달",
      icon: getBadgeIcon(11),
      description: "11등급 달성",
      acquired: false,
      color: "#F8F8FF",
      level: 11
    },
    {
      id: "level12",
      name: "금메달",
      icon: getBadgeIcon(12),
      description: "12등급 달성",
      acquired: false,
      color: "#FFDF00",
      level: 12
    },
    // 13-14등급 (특별)
    {
      id: "level13",
      name: "다이아몬드",
      icon: getBadgeIcon(13),
      description: "13등급 달성",
      acquired: false,
      color: "#00FFFF",
      level: 13
    },
    {
      id: "level14",
      name: "황금왕관",
      icon: getBadgeIcon(14),
      description: "14등급 달성",
      acquired: false,
      color: "#FFD700",
      level: 14
    }
  ]);

  // 칭호 상태
  const [titles, setTitles] = useState<Title[]>([
    {
      id: "level1",
      name: "1등급",
      description: "첫 번째 투표나 카드를 올리면 획득",
      requiredLevel: 1,
      acquired: true,
      icon: getBadgeIcon(1),
      color: "#FFFFFF",
      type: 'number'
    },
    {
      id: "level2",
      name: "2등급",
      description: "일정 횟수의 활동 달성 시 획득",
      requiredLevel: 2,
      acquired: true,
      icon: getBadgeIcon(2),
      color: "#FFFFFF",
      type: 'number'
    },
    // ... 나머지 등급들도 같은 방식으로 추가
  ]);

  // 구독 회원 상태
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  
  // 설정 상태
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    darkMode: true,
    privateProfile: false,
  });

  // 편집 모드 상태
  const [isEditing, setIsEditing] = useState(false);
  const [editedInfo, setEditedInfo] = useState({ ...userInfo });

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

  // useEffect 수정 - 스타일 관련 코드 제거
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
  }, []);

  // 포인트 획득 함수 (earnXP를 earnPoints로 변경)
  const earnPoints = (amount: number) => {
    // 현재 포인트와 레벨 가져오기
    const currentPoints = userInfo.points;
    const currentLevel = userInfo.level;
    const newPoints = currentPoints + amount;
    
    // 레벨업 체크
    const { newLevel, nextLevelPoints } = checkLevelUp(newPoints, currentLevel);
    
    // 사용자 정보 업데이트
    setUserInfo(prev => ({
      ...prev,
      points: newPoints,
      level: newLevel,
      nextLevelPoints: nextLevelPoints
    }));
    
    // 레벨업 시 칭호 업데이트
    if (newLevel > currentLevel) {
      updateTitle(newLevel);
    }
    
    // 뱃지 획득 체크
    checkBadgeAchievements(newPoints, userInfo.votesCreated, userInfo.votesParticipated);
  };
  
  // 레벨업 체크 함수
  const checkLevelUp = (points: number, currentLevel: number) => {
    // 레벨별 필요 포인트 (간단한 예시)
    const levelThresholds = [
      0,      // 레벨 0 (사용하지 않음)
      500,    // 레벨 1
      2000,   // 레벨 2
      5000,   // 레벨 3
      10000   // 레벨 4
    ];
    
    let newLevel = currentLevel;
    
    // 현재 포인트가 다음 레벨 임계값을 넘었는지 확인
    while (newLevel < levelThresholds.length - 1 && points >= levelThresholds[newLevel + 1]) {
      newLevel++;
    }
    
    // 다음 레벨 포인트 계산
    const nextLevelPoints = newLevel < levelThresholds.length - 1 
      ? levelThresholds[newLevel + 1] 
      : levelThresholds[newLevel] + 5000; // 최대 레벨 이후 5000씩 증가
    
    return { newLevel, nextLevelPoints };
  };
  
  // 칭호 업데이트 함수
  const updateTitle = (newLevel: number) => {
    // 레벨에 맞는 칭호 찾기
    const newTitle = titles.find(title => title.requiredLevel === newLevel);
    
    if (newTitle) {
      // 칭호 획득 상태 업데이트
      setTitles(prev => prev.map(title => 
        title.id === newTitle.id 
          ? { ...title, acquired: true } 
          : title
      ));
      
      // 뱃지도 함께 업데이트 (칭호와 뱃지는 동일한 개념)
      setBadges(prev => prev.map(badge => 
        badge.id === newTitle.id 
          ? { ...badge, acquired: true, acquiredDate: new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }).replace(/\./g, '년').replace(/\s/g, ' ') + '일' } 
          : badge
      ));
      
      // 현재 칭호 업데이트
      setUserInfo(prev => ({
        ...prev,
        currentTitle: newTitle.name
      }));
    }
  };
  
  // 뱃지 획득 체크 함수
  const checkBadgeAchievements = (_points: number, _votesCreated: number, _votesParticipated: number) => {
    // 현재 updateTitle 함수에서 뱃지 업데이트를 처리하므로 이 함수에서는 실제 로직을 수행하지 않음
    // 변수명 앞에 언더스코어를 추가하여 의도적으로 사용하지 않는 매개변수임을 표시
    const unlockedBadges: Badge[] = [];
    
    // 뱃지 획득 조건 체크 및 업데이트
    const updatedBadges = badges.map(badge => {
      // 이미 획득한 뱃지는 건너뛰기
      if (badge.acquired) return badge;
      
      let shouldUnlock = false;
      
      // 뱃지별 획득 조건 (레벨 기반 뱃지는 updateTitle에서 처리하므로 여기서는 제외)
      switch (badge.id) {
        case "level1":
          // 첫 활동 시 획득 (레벨 1에 해당)
          // updateTitle에서 처리하므로 여기서는 처리하지 않음
          break;
        case "level2":
          // 50번 이상 활동 시 획득 (레벨 2에 해당)
          // updateTitle에서 처리하므로 여기서는 처리하지 않음
          break;
        case "level3":
          // 5000 XP 이상 획득 시 (레벨 3에 해당)
          // updateTitle에서 처리하므로 여기서는 처리하지 않음
          break;
        // 여기에 레벨과 관계없는 다른 뱃지 조건을 추가할 수 있음
      }
      
      if (shouldUnlock) {
        const today = new Date();
        const acquiredDate = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;
        const unlockedBadge = { ...badge, acquired: true, acquiredDate };
        unlockedBadges.push(unlockedBadge);
        return unlockedBadge;
      }
      
      return badge;
    });
    
    // 새로 획득한 뱃지가 있으면 상태 업데이트 및 알림 표시
    if (unlockedBadges.length > 0) {
      setBadges(updatedBadges);
      
      // 가장 높은 레벨의 뱃지 알림 표시
      const highestBadge = unlockedBadges.reduce((prev, current) => {
        const prevIndex = badges.findIndex(b => b.id === prev.id);
        const currentIndex = badges.findIndex(b => b.id === current.id);
        return prevIndex > currentIndex ? prev : current;
      }, unlockedBadges[0]);
      
      setBadgeNotification({
        show: true,
        badge: highestBadge
      });
      
      // 3초 후 알림 숨기기
      setTimeout(() => {
        setBadgeNotification({
          show: false,
          badge: null
        });
      }, 3000);
    }
  };

  // 설정 변경 핸들러
  const handleSettingChange = (setting: keyof typeof settings) => {
    setSettings({
      ...settings,
      [setting]: !settings[setting],
    });
  };

  // 프로필 편집 시작
  const handleEditStart = () => {
    setIsEditing(true);
    setEditedInfo({ ...userInfo });
  };

  // 편집 필드 변경 핸들러
  const handleEditChange = (field: keyof UserInfo, value: string) => {
    setEditedInfo({
      ...editedInfo,
      [field]: value,
    });
  };

  // 구독 상태 변경 핸들러
  const handleFollowToggle = (subscriberId: string) => {
    setSubscribers(
      subscribers.map((sub) =>
        sub.id === subscriberId
          ? { ...sub, isFollowing: !sub.isFollowing }
          : sub
      )
    );
    // 실제로는 여기서 API 호출하여 서버에 저장
  };

  // 탭 변경 핸들러
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  // 포인트 진행률 계산 (calculateXpProgress를 calculatePointsProgress로 변경)
  const calculatePointsProgress = () => {
    const currentPoints = userInfo.points;
    const nextLevelPoints = userInfo.nextLevelPoints;
    const prevLevelPoints = nextLevelPoints - 1000; // 간단한 예시, 실제로는 레벨별 필요 포인트 계산 로직 필요
    
    return Math.floor(((currentPoints - prevLevelPoints) / (nextLevelPoints - prevLevelPoints)) * 100);
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

  // 테스트 버튼 섹션 수정
  const renderTestButtons = () => (
    <div className={styles.testButtons}>
      <button 
        className={styles.testButton}
        onClick={() => earnPoints(50)} // 투표 생성 시 포인트 획득
      >
        투표 생성 (+50P)
      </button>
      <button 
        className={styles.testButton}
        onClick={() => earnPoints(30)} // 투표 참여 시 포인트 획득
      >
        투표 참여 (+30P)
      </button>
      <button 
        className={styles.testButton}
        onClick={() => earnPoints(20)} // 획득 투표 시 포인트 획득
      >
        획득 투표 (+20P)
      </button>
      <button 
        className={styles.testButton}
        onClick={() => earnPoints(100)} // 친구 추천 시 포인트 획득
      >
        친구 추천 (+100P)
      </button>
      <button 
        className={styles.testButton}
        onClick={() => earnPoints(200)} // AI 분석 시 포인트 획득
      >
        AI 분석 (+200P)
      </button>
      <button 
        className={styles.testButton}
        onClick={() => earnPoints(150)} // AI 투표 추천 시 포인트 획득
      >
        AI 투표 추천 (+150P)
      </button>
      <button 
        className={styles.testButton}
        onClick={() => earnPoints(100)} // 끌어올리기 시 포인트 획득
      >
        끌어올리기 (+100P)
      </button>
    </div>
  );

  return (
    <div className="my-votes-container">
      
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
      
      <div className="vote-tabs">
        <div className="tab-list">
          <button 
            className={`tab-button ${activeTab === "profile" ? 'active' : ''}`}
            onClick={() => handleTabChange("profile")}
          >
            프로필
          </button>
          <button 
            className={`tab-button ${activeTab === "settings" ? 'active' : ''}`}
            onClick={() => handleTabChange("settings")}
          >
            설정
          </button>
          <button 
            className={`tab-button ${activeTab === "subscribers" ? 'active' : ''}`}
            onClick={() => handleTabChange("subscribers")}
          >
            구독 회원
          </button>
          <button 
            className={`tab-button ${activeTab === "badges" ? 'active' : ''}`}
            onClick={() => handleTabChange("badges")}
          >
            나의 등급
          </button>
        </div>
      </div>
      
      <div className={styles.tabs}>
        
        {/* 프로필 탭 */}
        {activeTab === "profile" && (
          <div className={styles.tabContent}>
            <div className={styles.card}>
              <div className={styles.profileContainer}>
                <div className={styles.profileHeader}>
                  <div className={styles.profileAvatar}>
                    <img src={userInfo.profileImage} alt="프로필 이미지" />
                  </div>
                  <div className={styles.profileInfo}>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedInfo.name}
                        onChange={(e) => handleEditChange("name", e.target.value)}
                        className={styles.editInput}
                      />
                    ) : (
                      <div className={styles.profileNameContainer}>
                        <h2 className={styles.profileName}>{userInfo.name}</h2>
                        <div className={styles.titleBadge} style={{ 
                          backgroundColor: `rgba(${hexToRgb(titles.find(t => t.name === userInfo.currentTitle)?.color || "#3a8eff")}, 0.15)`, 
                          borderColor: `rgba(${hexToRgb(titles.find(t => t.name === userInfo.currentTitle)?.color || "#3a8eff")}, 0.3)` 
                        }}>
                          <span className={styles.titleIcon}>
                            {titles.find(t => t.name === userInfo.currentTitle)?.icon}
                          </span>
                          <span className={styles.titleText} style={{ 
                            color: titles.find(t => t.name === userInfo.currentTitle)?.color 
                          }}>
                            {userInfo.currentTitle}
                          </span>
                        </div>
                      </div>
                    )}
                    <div className={styles.profileContact}>
                      <p className={styles.profileEmail}>{userInfo.email}</p>
                      <p className={styles.profileJoinDate}>가입일: {userInfo.joinDate}</p>
                    </div>
                    
                    {/* 레벨 및 포인트 정보 */}
                    <div className={styles.levelInfo}>
                      <div className={styles.levelHeader}>
                        <span className={styles.levelLabel}>레벨 {userInfo.level}</span>
                        <span className={styles.pointsValue}>{userInfo.points} / {userInfo.nextLevelPoints} P</span>
                      </div>
                      <div className={styles.pointsProgressContainer}>
                        <div 
                          className={styles.pointsProgressBar} 
                          style={{ width: `${calculatePointsProgress()}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className={styles.profileBio}>
                  <h3>소개</h3>
                  {isEditing ? (
                    <textarea
                      value={editedInfo.bio}
                      onChange={(e) => handleEditChange("bio", e.target.value)}
                      className={styles.editTextarea}
                    />
                  ) : (
                    <p>{userInfo.bio}</p>
                  )}
                </div>
                
                <div className={styles.profileStatsCompact}>
                  <div className={styles.statItemCompact}>
                    <span className={styles.statLabel}>생성한 투표</span>
                    <span className={styles.statValue}>{userInfo.votesCreated}</span>
                  </div>
                  <div className={styles.statItemCompact}>
                    <span className={styles.statLabel}>참여한 투표</span>
                    <span className={styles.statValue}>{userInfo.votesParticipated}</span>
                  </div>
                </div>
                
                {/* 최근 획득한 등급 */}
                <div className={styles.recentBadges}>
                  <h3>최근 획득한 등급</h3>
                  <div className={styles.badgesList}>
                    {badges.filter(badge => badge.acquired).slice(0, 3).map(badge => (
                      <div key={badge.id} className={styles.badgeItem}>
                        <div className={styles.badgeIcon} style={{ color: badge.color }}>
                          {badge.icon}
                        </div>
                        <div className={styles.badgeInfo}>
                          <span className={styles.badgeName}>{badge.name}</span>
                          <span className={styles.badgeDate}>{badge.acquiredDate}</span>
                        </div>
                      </div>
                    ))}
                    <button 
                      className={styles.viewAllBadgesButton}
                      onClick={() => handleTabChange("badges")}
                    >
                      모든 등급 보기
                    </button>
                    <button onClick={handleEditStart} className={styles.editButton}>프로필 편집</button>
                  </div>
                </div>
                
                {/* 적립금 정보 추가 */}
                <div className={styles.pointsInfo}>
                  <h3>적립금</h3>
                  <div className={styles.pointsValue}>
                    {userInfo.points} P
                  </div>
                  {userInfo.level >= 10 && (
                    <div className={styles.pointsRate}>
                      예상 배당율: {Math.min(userInfo.level - 9, 5)}%
                    </div>
                  )}
                </div>
                
                {/* 테스트 버튼 섹션 */}
                {renderTestButtons()}
              </div>
            </div>
          </div>
        )}
        
        {/* 설정 탭 */}
        {activeTab === "settings" && (
          <div className={styles.tabContent}>
            <div className={styles.card}>
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
                  />
                </div>
                
                <div className={styles.settingActions}>
                  <button className={styles.saveSettingsButton}>설정 저장</button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* 구독 회원 탭 */}
        {activeTab === "subscribers" && (
          <div className={styles.tabContent}>
            <div className={styles.card}>
              <div className={styles.subscribersContainer}>
                {subscribers.length > 0 ? (
                  subscribers.map((subscriber) => (
                    <div key={subscriber.id} className={styles.subscriberItem}>
                      <div className={styles.subscriberInfo}>
                        <div className={styles.subscriberAvatar}>
                          <img src={subscriber.profileImage} alt={`${subscriber.name}의 프로필`} />
                        </div>
                        <div>
                          <h3 className={styles.subscriberName}>{subscriber.name}</h3>
                          <p className={styles.subscriberBio}>{subscriber.bio}</p>
                        </div>
                      </div>
                      <button
                        className={`${styles.followButton} ${subscriber.isFollowing ? styles.following : ""}`}
                        onClick={() => handleFollowToggle(subscriber.id)}
                      >
                        {subscriber.isFollowing ? "구독 중" : "구독하기"}
                      </button>
                    </div>
                  ))
                ) : (
                  <p className={styles.noSubscribers}>구독 중인 회원이 없습니다.</p>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* 등급 탭 */}
        {activeTab === "badges" && (
          <div className={styles.tabContent}>
            <div className={styles.card}>
              <div className={styles.badgesContainer}>
                <div className={styles.badgesList}>
                  {badges.map(badge => (
                    <div 
                      key={badge.id} 
                      className={`${styles.badgeItem} ${badge.acquired ? styles.acquiredBadge : styles.lockedBadge}`}
                    >
                      <div className={styles.badgeIcon} style={{ color: badge.color }}>
                        {badge.icon}
                      </div>
                      <div className={styles.badgeInfo}>
                        <span className={styles.badgeName}>{badge.name}</span>
                        <span className={styles.badgeDescription}>{badge.description}</span>
                        {badge.level >= 10 && (
                          <span className={styles.badgeReward}>
                            {Math.min(badge.level - 9, 5)}% 배당
                          </span>
                        )}
                      </div>
                      <div className={styles.badgeStatus}>
                        {badge.acquired ? (
                          <span className={styles.acquiredStatus}>획득</span>
                        ) : (
                          <span className={styles.lockedStatus}>잠김</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

