import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import '../styles/App.css'
import HomePage from '../pages/HomePage'
import CreateVotePage from '../pages/CreateVotePage'
import MyVotesPage from '../pages/MyVotesPage'
import ViewRank from './ViewRank'
import MyPage from './MyPage'
import AuthPage from '../pages/auth/AuthPage'
import SignupPage from '../pages/auth/SignupPage'
import VoteAnalysisPage from './VoteAnalysisPage'
import { VoteProvider } from '../context/VoteContext'
import { AuthProvider, useAuth } from '../context/AuthContext'
import { useEffect, useState, useRef, createContext, useContext } from 'react'
import { HelmetProvider } from 'react-helmet-async'
import SearchModal from './SearchModal'

// 검색 모달 Context
interface SearchModalContextType {
  openSearchModal: () => void;
  closeSearchModal: () => void;
}

const SearchModalContext = createContext<SearchModalContextType | undefined>(undefined);

// 검색 모달 Context 사용 훅
export const useSearchModal = () => {
  const context = useContext(SearchModalContext);
  if (!context) {
    throw new Error('useSearchModal must be used within a SearchModalProvider');
  }
  return context;
};

function App() {
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollTimeoutRef = useRef<number | null>(null);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // 스크롤 방향 감지
      if (currentScrollY > lastScrollY.current) {
        // 아래로 스크롤 - 헤더 숨기기
        setIsHeaderVisible(false);
      } else {
        // 위로 스크롤 - 헤더 보이기
        setIsHeaderVisible(true);
      }
      
      // 마지막 스크롤 위치 저장
      lastScrollY.current = currentScrollY;
      
      // 스크롤이 멈추면 타임아웃 재설정
      if (scrollTimeoutRef.current !== null) {
        window.clearTimeout(scrollTimeoutRef.current);
      }
      
      scrollTimeoutRef.current = window.setTimeout(() => {
        // 스크롤이 멈추면 헤더 표시
        setIsHeaderVisible(true);
      }, 500); // 스크롤 멈춤 감지 딜레이
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current !== null) {
        window.clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // 검색 모달 열기/닫기 핸들러
  const openSearchModal = () => {
    setIsSearchModalOpen(true);
  };

  const closeSearchModal = () => {
    setIsSearchModalOpen(false);
  };

  // 검색 단축키 이벤트 리스너
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K 또는 Command+K를 눌렀을 때 검색 모달 열기
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault(); // 브라우저 기본 동작 방지
        openSearchModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // 컨텍스트 값
  const searchModalContextValue = {
    openSearchModal,
    closeSearchModal
  };

  return (
    <HelmetProvider>
      <AuthProvider>
        <VoteProvider>
          <SearchModalContext.Provider value={searchModalContextValue}>
            <Router>
              <div className="app-container">
                <header className={`app-header ${isHeaderVisible ? '' : 'header-hidden'}`}>
                  <div className="header-content">
                    <div className="logo-container">
                      <img src="/votey_icon2.png" alt="VoteY Logo" className="app-logo" />
                      <h1 className="app-title">VoteY</h1>
                    </div>
                    <div className="header-actions">
                      <div className="notification-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                        </svg>
                        <span className="notification-badge">3</span>
                      </div>
                      <div className="search-icon" onClick={openSearchModal}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="11" cy="11" r="8"></circle>
                          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                      </div>
                    </div>
                  </div>
                </header>
                <main className="content">
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/create" element={<CreateVotePage />} />
                    <Route path="/edit-vote/:id" element={<CreateVotePage isEditMode={true} />} />
                    <Route path="/my-votes" element={<MyVotesPage />} />
                    <Route path="/rank" element={<ViewRank />} />
                    <Route path="/mypage" element={<MyPage />} />
                    <Route path="/auth" element={<AuthPage />} />
                    <Route path="/signup" element={<SignupPage />} />
                    <Route path="/login" element={<AuthPage />} />
                    <Route path="/vote/:id/analysis" element={<VoteAnalysisPage />} />
                  </Routes>
                </main>
                <NavBar />
                
                {/* 검색 모달 */}
                <SearchModal isOpen={isSearchModalOpen} onClose={closeSearchModal} />
              </div>
            </Router>
          </SearchModalContext.Provider>
        </VoteProvider>
      </AuthProvider>
    </HelmetProvider>
  )
}

function NavBar() {
  const location = useLocation();
  const { user } = useAuth();
  
  const isLoggedIn = !!user;
  
  return (
    <footer className="nav-bar">
      <Link to="/" className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}>
        <div className="nav-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8h5z" fill="currentColor"/>
          </svg>
        </div>
        <div className="nav-text">홈</div>
      </Link>
      <Link to="/rank" className={`nav-item ${location.pathname === '/rank' ? 'active' : ''}`}>
        <div className="nav-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm4.24 16L12 15.45 7.77 18l1.12-4.81-3.73-3.23 4.92-.42L12 5.4l1.92 4.14 4.92.42-3.73 3.23L16.23 18z" fill="currentColor"/>
          </svg>
        </div>
        <div className="nav-text">순위</div> 
      </Link>
      <Link to="/create" className={`nav-item ${location.pathname === '/create' ? 'active' : ''}`}>
        <div className="nav-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"/>
          </svg>
        </div>
        <div className="nav-text">추가</div>
      </Link>
      <Link to="/my-votes" className={`nav-item ${location.pathname === '/my-votes' ? 'active' : ''}`}>
        <div className="nav-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" fill="currentColor"/>
          </svg>
        </div>
        <div className="nav-text">내투표</div>
      </Link>
      <Link to="/mypage" className={`nav-item ${location.pathname === '/mypage' ? 'active' : ''}`}>
        <div className="nav-icon">
          {isLoggedIn && user?.profile_Image ? (
            <div className="user-avatar-container">
              <img 
                src={user.profile_Image} 
                alt={user.username || "사용자"} 
                className="user-avatar"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  
                  const parent = e.currentTarget.parentNode as HTMLElement;
                  parent.classList.add('default-avatar');
                  
                  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                  svg.setAttribute("width", "28");
                  svg.setAttribute("height", "28");
                  svg.setAttribute("viewBox", "0 0 24 24");
                  svg.setAttribute("fill", "none");
                  
                  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                  path.setAttribute("d", "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z");
                  path.setAttribute("fill", "currentColor");
                  
                  svg.appendChild(path);
                  parent.appendChild(svg);
                }}
              />
            </div>
          ) : (
            <div className="user-avatar-container default-avatar">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="currentColor"/>
              </svg>
            </div>
          )}
        </div>
        <div className="nav-text">내페이지</div>
      </Link>
    </footer>
  );
}

export default App 