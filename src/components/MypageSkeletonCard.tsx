import styles from '../styles/MyPage.module.css';

const MypageSkeletonCard = () => {
  return (
    <div className={styles.skeletonContainer}>
      {/* 상단 프로필 영역 스켈레톤 */}
      <div className={styles.userHeader}>
        <div className={styles.userInfoContainer}>
          <div className={styles.userProfileRow}>
            {/* 프로필 이미지 스켈레톤 */}
            <div className={styles.userProfileSection}>
              <div className={styles.profileFlexContainer}>
                <div className={`${styles.userAvatar} ${styles.skeleton}`}></div>
                <div className={styles.userNameContainer}>
                  <div className={`${styles.skeletonText} ${styles.skeletonTitle}`}></div>
                  <div className={`${styles.skeletonText} ${styles.skeletonBadge}`}></div>
                </div>
              </div>
            </div>
            
            {/* 레벨 정보 스켈레톤 */}
            <div className={styles.userInfoRight}>
              <div className={styles.levelInfo}>
                <div className={`${styles.skeletonText} ${styles.skeletonLevel}`}></div>
                <div className={`${styles.skeletonText} ${styles.skeletonPoints}`}></div>
                <div className={styles.pointsProgressContainer}>
                  <div className={`${styles.pointsProgressBar} ${styles.skeleton}`}></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* 하단 정보 스켈레톤 */}
          <div className={styles.userInfoFooter}>
            <div className={styles.userContactSection}>
              <div className={styles.userContactInfo}>
                <div className={`${styles.skeletonText} ${styles.skeletonEmail}`}></div>
                <div className={`${styles.skeletonText} ${styles.skeletonDate}`}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 활동 통계 스켈레톤 */}
      <div className={styles.profileStatsCompact}>
        <div className={`${styles.statItemCompact} ${styles.skeleton}`}>
          <div className={`${styles.skeletonText} ${styles.skeletonStatLabel}`}></div>
          <div className={`${styles.skeletonText} ${styles.skeletonStatValue}`}></div>
        </div>
        <div className={`${styles.statItemCompact} ${styles.skeleton}`}>
          <div className={`${styles.skeletonText} ${styles.skeletonStatLabel}`}></div>
          <div className={`${styles.skeletonText} ${styles.skeletonStatValue}`}></div>
        </div>
      </div>

      {/* 최근 획득 등급 스켈레톤 */}
      <div className={styles.recentBadges}>
        <div className={`${styles.skeletonText} ${styles.skeletonTitle}`}></div>
        <div className={`${styles.badgeItem} ${styles.skeleton}`}>
          <div className={styles.recentBadgeContent}>
            <div className={`${styles.badgeIcon} ${styles.skeleton}`}></div>
            <div className={styles.badgeInfo}>
              <div className={`${styles.skeletonText} ${styles.skeletonBadgeName}`}></div>
              <div className={`${styles.skeletonText} ${styles.skeletonBadgeDate}`}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MypageSkeletonCard;
