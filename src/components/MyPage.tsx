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
  xp: number;
  level: number;
  currentTitle: string;
  nextLevelXp: number;
}

// 구독 회원 인터페이스
interface Subscriber {
  id: string;
  name: string;
  profileImage: string;
  bio: string;
  isFollowing: boolean;
}

// 아이콘 컴포넌트
const CompassIcon = ({ color = "#FFFFFF", size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
  </svg>
);

const MapIcon = ({ color = "#FFD700", size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
    <line x1="8" y1="2" x2="8" y2="18"></line>
    <line x1="16" y1="6" x2="16" y2="22"></line>
  </svg>
);

const TelescopeIcon = ({ color = "#FF8C00", size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
  </svg>
);

const CrownIcon = ({ color = "#FF4500", size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"></path>
  </svg>
);

// 뱃지 등급에 따른 정보 매핑
const getBadgeInfo = (badgeLevel: number) => {
  switch(badgeLevel) {
    case 1:
      return { name: "초심자", color: "#FFFFFF" };
    case 2:
      return { name: "탐험가", color: "#FFD700" };
    case 3:
      return { name: "분석가", color: "#FF8C00" };
    case 4:
      return { name: "전문가", color: "#FF4500" };
    default:
      return null;
  }
};

// 뱃지 아이콘 매핑 함수
const getBadgeIcon = (badgeLevel: number, size = 24) => {
  const badgeInfo = getBadgeInfo(badgeLevel);
  if (!badgeInfo) return null;
  
  const color = badgeInfo.color;
  
  switch(badgeLevel) {
    case 1:
      return <CompassIcon color={color} size={size} />;
    case 2:
      return <MapIcon color={color} size={size} />;
    case 3:
      return <TelescopeIcon color={color} size={size} />;
    case 4:
      return <CrownIcon color={color} size={size} />;
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
    xp: 1250,
    level: 2,
    currentTitle: "탐험가",
    nextLevelXp: 2000,
  });

  // 뱃지 상태
  const [badges, setBadges] = useState<Badge[]>([
    {
      id: "beginner",
      name: "초심자",
      icon: getBadgeIcon(1),
      description: "첫 번째 투표나 카드를 올리면 획득. 투표의 세계를 탐색하기 시작한 초보자입니다. (흰색 등급)",
      acquired: true,
      acquiredDate: "2023년 5월 16일",
      color: "#FFFFFF" // 흰색
    },
    {
      id: "intermediate",
      name: "탐험가",
      icon: getBadgeIcon(2),
      description: "일정 횟수의 활동(예: 50번의 투표나 카드 제출) 달성 시 획득. 투표 데이터를 탐색하는 능력을 갖추었습니다. (노란색 등급)",
      acquired: true,
      acquiredDate: "2023년 8월 3일",
      color: "#FFD700" // 노란색
    },
    {
      id: "advanced",
      name: "분석가",
      icon: getBadgeIcon(3),
      description: "상당히 높은 활동점수 달성 시 획득. 투표 데이터를 심층적으로 분석할 수 있는 전문성을 갖추었습니다. (주황색 등급)",
      acquired: false,
      color: "#FF8C00" // 주황색
    },
    {
      id: "expert",
      name: "전문가",
      icon: getBadgeIcon(4),
      description: "최고 레벨에 도달했을 때 획득. 투표 커뮤니티 내에서 인정받는 최고 권위자입니다. (빨간색 등급)",
      acquired: false,
      color: "#FF4500" // 빨간색
    }
  ]);

  // 칭호 상태
  const [titles, setTitles] = useState<Title[]>([
    {
      id: "beginner",
      name: "초심자",
      description: "투표의 세계를 탐색하기 시작한 초보자 (흰색 등급)",
      requiredLevel: 1,
      acquired: true,
      icon: getBadgeIcon(1),
      color: "#FFFFFF" // 흰색
    },
    {
      id: "intermediate",
      name: "탐험가",
      description: "투표 데이터를 탐색하는 능력을 갖춘 중급자 (노란색 등급)",
      requiredLevel: 2,
      acquired: true,
      icon: getBadgeIcon(2),
      color: "#FFD700" // 노란색
    },
    {
      id: "advanced",
      name: "분석가",
      description: "투표 데이터를 심층적으로 분석할 수 있는 고급 사용자 (주황색 등급)",
      requiredLevel: 3,
      acquired: false,
      icon: getBadgeIcon(3),
      color: "#FF8C00" // 주황색
    },
    {
      id: "expert",
      name: "전문가",
      description: "투표 커뮤니티에서 인정받는 최고 권위자 (빨간색 등급)",
      requiredLevel: 4,
      acquired: false,
      icon: getBadgeIcon(4),
      color: "#FF4500" // 빨간색
    }
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

  // XP 획득 함수
  const earnXP = (amount: number) => {
    // 현재 XP와 레벨 가져오기
    const currentXP = userInfo.xp;
    const currentLevel = userInfo.level;
    const newXP = currentXP + amount;
    
    // 레벨업 체크
    const { newLevel, nextLevelXp } = checkLevelUp(newXP, currentLevel);
    
    // 사용자 정보 업데이트
    setUserInfo(prev => ({
      ...prev,
      xp: newXP,
      level: newLevel,
      nextLevelXp: nextLevelXp
    }));
    
    // 레벨업 시 칭호 업데이트
    if (newLevel > currentLevel) {
      updateTitle(newLevel);
    }
    
    // 뱃지 획득 체크
    checkBadgeAchievements(newXP, userInfo.votesCreated, userInfo.votesParticipated);
  };
  
  // 레벨업 체크 함수
  const checkLevelUp = (xp: number, currentLevel: number) => {
    // 레벨별 필요 XP (간단한 예시)
    const levelThresholds = [
      0,      // 레벨 0 (사용하지 않음)
      500,    // 레벨 1
      2000,   // 레벨 2
      5000,   // 레벨 3
      10000   // 레벨 4
    ];
    
    let newLevel = currentLevel;
    
    // 현재 XP가 다음 레벨 임계값을 넘었는지 확인
    while (newLevel < levelThresholds.length - 1 && xp >= levelThresholds[newLevel + 1]) {
      newLevel++;
    }
    
    // 다음 레벨 XP 계산
    const nextLevelXp = newLevel < levelThresholds.length - 1 
      ? levelThresholds[newLevel + 1] 
      : levelThresholds[newLevel] + 5000; // 최대 레벨 이후 5000씩 증가
    
    return { newLevel, nextLevelXp };
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
  const checkBadgeAchievements = (_xp: number, _votesCreated: number, _votesParticipated: number) => {
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
        case "beginner":
          // 첫 활동 시 획득 (레벨 1에 해당)
          // updateTitle에서 처리하므로 여기서는 처리하지 않음
          break;
        case "intermediate":
          // 50번 이상 활동 시 획득 (레벨 2에 해당)
          // updateTitle에서 처리하므로 여기서는 처리하지 않음
          break;
        case "advanced":
          // 5000 XP 이상 획득 시 (레벨 3에 해당)
          // updateTitle에서 처리하므로 여기서는 처리하지 않음
          break;
        case "expert":
          // 10000 XP 이상 획득 시 (레벨 4에 해당)
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

  // 투표 생성 시 XP 획득 (예시 함수)
  const handleCreateVote = () => {
    // 투표 생성 로직...
    
    // 투표 생성 카운트 증가
    setUserInfo(prev => ({
      ...prev,
      votesCreated: prev.votesCreated + 1
    }));
    
    // XP 획득 (투표 생성 시 100 XP)
    earnXP(100);
  };
  
  // 투표 참여 시 XP 획득 (예시 함수)
  const handleParticipateVote = () => {
    // 투표 참여 로직...
    
    // 투표 참여 카운트 증가
    setUserInfo(prev => ({
      ...prev,
      votesParticipated: prev.votesParticipated + 1
    }));
    
    // XP 획득 (투표 참여 시 20 XP)
    earnXP(20);
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

  // XP 진행률 계산
  const calculateXpProgress = () => {
    const currentXp = userInfo.xp;
    const nextLevelXp = userInfo.nextLevelXp;
    const prevLevelXp = nextLevelXp - 1000; // 간단한 예시, 실제로는 레벨별 필요 XP 계산 로직 필요
    
    return Math.floor(((currentXp - prevLevelXp) / (nextLevelXp - prevLevelXp)) * 100);
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
            칭호
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
                    
                    {/* 레벨 및 XP 정보 */}
                    <div className={styles.levelInfo}>
                      <div className={styles.levelHeader}>
                        <span className={styles.levelLabel}>레벨 {userInfo.level}</span>
                        <span className={styles.xpValue}>{userInfo.xp} / {userInfo.nextLevelXp} XP</span>
                      </div>
                      <div className={styles.xpProgressContainer}>
                        <div 
                          className={styles.xpProgressBar} 
                          style={{ width: `${calculateXpProgress()}%` }}
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
                
                {/* 최근 획득한 뱃지 */}
                <div className={styles.recentBadges}>
                  <h3>최근 획득한 뱃지</h3>
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
                      모든 뱃지 보기
                    </button>
                    <button onClick={handleEditStart} className={styles.editButton}>프로필 편집</button>
                  </div>
                </div>
                
                                
                {/* 테스트 버튼 (개발 중에만 표시) */}
                <div className={styles.testButtons}>
                  <button 
                    className={styles.testButton}
                    onClick={handleCreateVote}
                  >
                    투표 생성 테스트 (+100 XP)
                  </button>
                  <button 
                    className={styles.testButton}
                    onClick={handleParticipateVote}
                  >
                    투표 참여 테스트 (+20 XP)
                  </button>
                </div>
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
        
        {/* 뱃지 & 칭호 탭 */}
        {activeTab === "badges" && (
          <div className={styles.tabContent}>
            <div className={styles.card}>
              <div className={styles.badgesContainer}>
                <div className={styles.titlesList}>
                  {titles.map(title => {
                    // 해당 ID를 가진 뱃지 찾기
                    const matchingBadge = badges.find(badge => badge.id === title.id);
                    return (
                    <div key={title.id} className={`${styles.titleCard} ${title.acquired ? styles.acquiredTitle : ''}`} 
                      style={{ borderLeftColor: title.acquired ? title.color : '#777' }}>
                      <div className={styles.titleHeader}>
                        <div className={styles.titleNameWithIcon}>
                          <span className={styles.titleCardIcon} style={{ color: title.color }}>
                            {title.icon}
                          </span>
                          <h4 className={styles.titleName}>{title.name}</h4>
                        </div>
                        <span className={styles.titleLevel}>레벨 {title.requiredLevel}</span>
                      </div>
                      <p className={styles.titleDescription}>{matchingBadge?.description || title.description}</p>
                      <div className={styles.titleStatus}>
                        {title.acquired ? (
                          <div className={styles.acquiredBadge}>
                            <span className={styles.checkIcon}>✓</span> {matchingBadge?.acquiredDate ? `${matchingBadge.acquiredDate}에 획득` : '획득'}
                          </div>
                        ) : (
                          <div className={styles.lockedBadge}>
                            <span className={styles.lockIcon}>🔒</span> 잠김
                          </div>
                        )}
                      </div>
                    </div>
                  )})}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
