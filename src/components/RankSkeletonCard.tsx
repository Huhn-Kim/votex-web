// import React from 'react';
import styles from '../styles/RankSkeletonCard.module.css';

const RankSkeletonCard = () => (
  <div className={styles.cardContainer}>
    <div className={`${styles.card} ${styles.skeleton}`}>
      <div className={styles.cardRank}>
        <div className={styles.skeletonRank}></div>
      </div>
      <div className={styles.cardThumbnail}>
        <div className={styles.skeletonImage}></div>
      </div>
      <div className={styles.cardContent}>
        <div className={styles.skeletonTitle}></div>
        <div className={styles.skeletonStats}></div>
      </div>
    </div>
  </div>
);

export default RankSkeletonCard; 