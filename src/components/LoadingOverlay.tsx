import React, { useEffect } from 'react';
import styles from '../styles/ConfirmModal.module.css';

interface LoadingOverlayProps {
  isLoading: boolean;
  progress?: number;
  progressStatus?: string;
  defaultMessage?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  progressStatus = '',
  defaultMessage = '처리 중...'
}) => {
  useEffect(() => {
    if (isLoading) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isLoading]);
  
  if (!isLoading) return null;
  
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2>{progressStatus || defaultMessage}</h2>
        
        <div 
          className="loading-spinner"
          style={{
            width: '40px',
            height: '40px',
            margin: '20px auto',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '50%',
            borderTop: '4px solid #3a8eff',
            animation: 'spin 1s linear infinite'
          }}
        ></div>
      </div>
    </div>
  );
};

export default LoadingOverlay;
