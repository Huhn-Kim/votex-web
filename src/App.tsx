// import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import './styles/App.css'
import { useEffect } from 'react';

import HomePage from './pages/HomePage'
import CreateVotePage from './pages/CreateVotePage'
import MyVotesPage from './pages/MyVotesPage'
import ViewRank from './components/ViewRank';
import MyPage from './components/MyPage';
import { useState } from 'react';
import { VoteProvider } from './context/VoteContext';

function App() {
  const [notificationCount, _setNotificationCount] = useState(3); // 알림 개수 상태 추가
  
  useEffect(() => {
    // 모바일 환경에서 일관된 폰트와 스타일을 위한 설정
    document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    
    // 모바일에서 100vh 버그 해결을 위한 리사이징 리스너
    const handleResize = () => {
      document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);
  
  return (
    <VoteProvider>
      <Router>
        <div className="app-container">
          <header className="app-header">
            <div className="header-content">
              <div className="logo-container">
                <img 
                  src="/votey_icon2.png" 
                  alt="VoteX Logo" 
                  className="app-logo" 
                />
                <h1 className="app-title">VoteY</h1>
              </div>
              <div className="header-actions">
                <div className="notification-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22ZM18 16V11C18 7.93 16.36 5.36 13.5 4.68V4C13.5 3.17 12.83 2.5 12 2.5C11.17 2.5 10.5 3.17 10.5 4V4.68C7.63 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16Z" fill="white"/>
                  </svg>
                  {notificationCount > 0 && (
                    <span className="notification-badge">{notificationCount}</span>
                  )}
                </div>
                <div className="search-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15.5 14H14.71L14.43 13.73C15.41 12.59 16 11.11 16 9.5C16 5.91 13.09 3 9.5 3C5.91 3 3 5.91 3 9.5C3 13.09 5.91 16 9.5 16C11.11 16 12.59 15.41 13.73 14.43L14 14.71V15.5L19 20.49L20.49 19L15.5 14ZM9.5 14C7.01 14 5 11.99 5 9.5C5 7.01 7.01 5 9.5 5C11.99 5 14 7.01 14 9.5C14 11.99 11.99 14 9.5 14Z" fill="white"/>
                  </svg>
                </div>
              </div>
            </div>
            <nav className="app-nav">
              {/* 네비게이션 링크들 */}
            </nav>
          </header>
          
          <main className="content">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/create" element={<CreateVotePage />} />
              <Route path="/edit-vote/:id" element={<CreateVotePage isEditMode={true} />} />
              <Route path="/my-votes" element={<MyVotesPage />} />
              <Route path="/rank" element={<ViewRank />} />
              <Route path="/mypage" element={<MyPage />} />
            </Routes>
          </main>
          
          <NavBar />
        </div>
      </Router>
    </VoteProvider>
  )
}

function NavBar() {
  const location = useLocation();
  
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
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="currentColor"/>
          </svg>
        </div>
        <div className="nav-text">내페이지</div>
      </Link>
    </footer>
  );
}

export default App
