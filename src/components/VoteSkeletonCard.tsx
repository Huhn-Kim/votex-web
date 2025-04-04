// import React from 'react';
import styles from '../styles/VoteSkeletonCard.module.css';
import React from 'react';

const VoteSkeletonCard = React.memo(() => (
  <div className={styles.cardContainer}>
    <div className={`${styles.card} ${styles.skeleton}`}>
      {/* 헤더 영역 */}
      <div className={styles.cardHeader}>
        <div className={styles.userInfo}>
          <div className={styles.skeletonAvatar}></div>
          <div className={styles.userDetails}>
            <div className={styles.skeletonUsername}></div>
            <div className={styles.skeletonPeriod}></div>
          </div>
        </div>
        <div className={styles.skeletonActions}></div>
      </div>

      {/* 질문 영역 */}
      <div className={styles.questionArea}>
        <div className={styles.skeletonQuestionImage}></div>
        <div className={styles.skeletonQuestion}></div>
      </div>

      {/* 옵션 영역 */}
      <div className={styles.optionsArea}>
        <div className={styles.skeletonOption}></div>
        <div className={styles.skeletonOption}></div>
        <div className={styles.skeletonOption}></div>
      </div>

      {/* 푸터 영역 */}
      <div className={styles.cardFooter}>
        <div className={styles.skeletonVoteCount}></div>
        <div className={styles.skeletonActions}>
          <div className={styles.skeletonAction}></div>
          <div className={styles.skeletonAction}></div>
          <div className={styles.skeletonAction}></div>
        </div>
      </div>
    </div>
  </div>
));

VoteSkeletonCard.displayName = 'VoteSkeletonCard';

export default VoteSkeletonCard; 