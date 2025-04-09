import React from 'react';
import styles from '../styles/CreateVote.module.css';

interface LoadingOverlayProps {
  isLoading: boolean;
  progress?: number;
  progressStatus?: string;
  defaultMessage?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  progress = 0,
  progressStatus = '',
  defaultMessage = '처리 중...'
}) => {
  if (!isLoading) return null;
  
  return (
    <div className={styles['loading-overlay']}>
      <div className={styles['loading-container']}>
        {progress > 0 && (
          <div className={styles['progress-container']}>
            <div 
              className={styles['progress-bar']} 
              style={{ width: `${progress}%` }}
            ></div>
            <div className={styles['progress-text']}>
              {progressStatus || defaultMessage} ({progress}%)
            </div>
          </div>
        )}
        <div className={styles['loading-spinner']}></div>
        <p className={styles['loading-message']}>
          {progress > 0 ? (progressStatus || defaultMessage) : defaultMessage}
        </p>
      </div>
    </div>
  );
};

export default LoadingOverlay;
