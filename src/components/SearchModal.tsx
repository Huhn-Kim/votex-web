import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from '../styles/SearchModal.module.css';
import { useVoteContext } from '../context/VoteContext';
import { VoteTopic } from '../lib/types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<VoteTopic[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { votes } = useVoteContext();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // 모달이 열릴 때 body 스크롤 막기 및 검색 입력란에 포커스
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 300);
    } else {
      document.body.style.overflow = '';
      setSearchTerm('');
      setSearchResults([]);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // 검색 실행 함수
  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    
    // 투표 제목에서 검색어 찾기
    const term = searchTerm.toLowerCase();
    const results = votes.filter(vote => 
      vote.question.toLowerCase().includes(term) && 
      !vote.is_expired && 
      vote.visible
    );
    
    // 검색 결과 표시 딜레이 (UI 자연스러움을 위해)
    setTimeout(() => {
      setSearchResults(results);
      setIsSearching(false);
    }, 300);
  };

  // 검색어 입력 시 자동 검색
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.trim()) {
        handleSearch();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, votes]);

  // 홈페이지로 이동하며 검색 결과 표시
  const goToSearchResults = () => {
    if (searchTerm.trim()) {
      navigate(`/?search=${encodeURIComponent(searchTerm.trim())}`);
      onClose();
    }
  };

  // 검색 결과 항목 클릭 핸들러
  const handleResultClick = () => {
    onClose();
  };

  // 모달이 닫혀있으면 아무것도 렌더링하지 않음
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.searchHeader}>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="투표 제목 검색..."
            className={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                goToSearchResults();
              }
            }}
          />
          <button
            className={styles.searchButton}
            onClick={goToSearchResults}
            disabled={!searchTerm.trim() || isSearching}
          >
            검색
          </button>
          <button 
            className={styles.closeButton} 
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
          >
            ✕
          </button>
        </div>
        
        <div className={styles.searchResults}>
          {isSearching ? (
            <div className={styles.loadingIndicator}>검색 중...</div>
          ) : searchResults.length > 0 ? (
            searchResults.map((vote) => (
              <div key={vote.id} className={styles.resultItem}>
                <Link 
                  to={`/?search=${encodeURIComponent(searchTerm.trim())}`} 
                  className={styles.resultLink} 
                  onClick={handleResultClick}
                >
                  {vote.related_image && (
                    <img
                      src={vote.related_image}
                      alt={vote.question}
                      className={styles.resultImage}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  )}
                  <div className={styles.resultContent}>
                    <h3 className={styles.resultTitle}>{vote.question}</h3>
                    <div className={styles.resultStats}>
                      <span className={styles.resultStat}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 20s-8-4-8-9c0-3 2-5 5-5 2 0 3 1 3 1h2s1-1 3-1 5 2 5 5c0 5-8 9-8 9z"></path>
                        </svg>
                        {vote.likes}
                      </span>
                      <span className={styles.resultStat}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 12h18M3 6h18M3 18h18"></path>
                        </svg>
                        {vote.total_votes} 투표
                      </span>
                      <span className={styles.resultStat}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                        {vote.comments} 댓글
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            ))
          ) : searchTerm.trim() ? (
            <div className={styles.noResults}>
              검색 결과가 없습니다.
            </div>
          ) : (
            <div className={styles.noResults}>
              검색어를 입력하세요.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchModal; 