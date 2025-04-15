import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from '../../styles/AuthPage.module.css';
import { useAuth } from '../../context/AuthContext';

const AuthPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // URL 파라미터 확인하여 로그인/회원가입 모드 설정
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const mode = searchParams.get('mode');
    
    if (mode === 'signup') {
      setIsLogin(false);
    } else {
      setIsLogin(true);
    }
  }, [location]);

  // 이미 로그인된 경우 메인 페이지로 리다이렉트
  useEffect(() => {
    if (user) {
      console.log('AuthPage: 이미 로그인된 사용자, 나의페이지로 리다이렉트', user);
      navigate('/mypage');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    console.log('AuthPage: 폼 제출됨', { email, password, isLogin });
    
    try {
      // 항상 로그인 로직 실행
      console.log('AuthPage: 로그인 시도 중...');
      const { error } = await signIn(email, password);
      
      if (error) {
        console.error('AuthPage: 로그인 에러', error);
        setError(error.message || '로그인에 실패했습니다.');
        setLoading(false);
        return;
      }
      
      console.log('AuthPage: 로그인 성공, MyPage로 이동');
      navigate('/mypage');
    } catch (err) {
      console.error('AuthPage: 예외 발생', err);
      setError('알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authBox}>
        <div className={styles.logoContainer}>
          <img
            src="/votey_icon2.png"
            alt="VoteY Logo"
            className={styles.logo}
          />
          <h1 className={styles.title}>VoteY</h1>
        </div>
        
        <h2 className={styles.subtitle}>Vote Your Opinion</h2>

        {error && <div className={styles.errorMessage}>{error}</div>}
        {loading && <div className={styles.loading}>처리 중...</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="email">이메일</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={styles.input}
              placeholder="이메일을 입력하세요"
            />
          </div>
          
          <div className={styles.inputGroup}>
            <label htmlFor="password">비밀번호</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={styles.input}
              placeholder="비밀번호를 입력하세요"
            />
          </div>
          
          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? '처리 중...' : '로그인'}
          </button>
        </form>
        
        <div className={styles.switchMode}>
          <p className={styles.switchText}>계정이 없으신가요?</p>
          <button 
            onClick={() => navigate('/signup')}
            className={styles.switchButton}
          >
            회원가입
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage; 