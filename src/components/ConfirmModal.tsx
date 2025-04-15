import React, { useEffect } from 'react';
import styles from '../styles/ConfirmModal.module.css'; // CSS 모듈 import

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmButtonText?: string; // 확인 버튼 텍스트 (옵션)
  cancelButtonText?: string;  // 취소 버튼 텍스트 (옵션)
  confirmButtonVariant?: 'primary' | 'danger' | 'default'; // 버튼 스타일 (옵션)
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmButtonText = "확인",
  cancelButtonText = "취소",
  confirmButtonVariant = 'default'
}) => {
  // 모달이 열릴 때 body 스크롤 막기
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null; // 모달이 열려있지 않으면 아무것도 렌더링하지 않음

  // 버튼 스타일에 따른 CSS 클래스 결정 함수
  const getConfirmButtonClass = () => {
    switch (confirmButtonVariant) {
      case 'primary': return styles.confirmButtonPrimary;
      case 'danger': return styles.confirmButtonDanger;
      default: return styles.confirmButtonDefault;
    }
  };

  // ESC 키로 모달 닫기
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  // 확인 버튼만 표시할지 여부
  const showConfirmOnly = cancelButtonText === undefined || cancelButtonText === "";

  return (
    // modalOverlay: 모달 배경 (클릭 시 닫기)
    <div 
      className={styles.modalOverlay} 
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      {/* modalContent: 실제 모달 내용 (클릭 이벤트 전파 방지) */}
      <div 
        className={styles.modalContent} 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        <h2 id="modal-title">{title}</h2>
        <p id="modal-description">{message}</p>
        {/* modalActions: 버튼들을 담는 컨테이너 */}
        <div className={`${styles.modalActions} ${showConfirmOnly ? styles.singleButton : ''}`}>
          {!showConfirmOnly && (
            <button 
              onClick={onClose} 
              className={styles.cancelButton}
              type="button"
            >
              {cancelButtonText}
            </button>
          )}
          <button 
            onClick={onConfirm} 
            className={`${styles.confirmButton} ${getConfirmButtonClass()} ${showConfirmOnly ? styles.fullWidthButton : ''}`}
            type="button"
          >
            {confirmButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;