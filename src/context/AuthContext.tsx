import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import supabase from '../lib/supabase';
import { UserInfo } from '../lib/types';

interface AuthContextType {
  user: UserInfo | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any, data: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 초기 인증 상태 확인
    const checkUser = async () => {
      try {
        // 로컬 스토리지에서 사용자 정보 확인
        const storedUser = localStorage.getItem('userInfo');
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            console.log('AuthContext: 로컬 스토리지에서 사용자 정보 로드', parsedUser);
          } catch (e) {
            console.error('AuthContext: 로컬 스토리지 파싱 오류', e);
            localStorage.removeItem('userInfo');
          }
        }
      } catch (error) {
        console.error('AuthContext: 초기 인증 상태 확인 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('AuthContext: 로그인 시도', { email });
      setLoading(true);

      // Supabase Auth를 사용하여 로그인
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      console.log('AuthContext: Supabase Auth 응답', { authData, authError });

      if (authError) {
        console.error('AuthContext: 인증 에러', authError);
        return { error: new Error('이메일 또는 비밀번호가 올바르지 않습니다.') };
      }

      if (!authData.user) {
        console.error('AuthContext: 사용자 데이터 없음');
        return { error: new Error('사용자 정보를 가져올 수 없습니다.') };
      }

      // users 테이블에서 사용자 정보 가져오기 - 이메일로 조회
      console.log('AuthContext: 이메일로 사용자 정보 조회 시작', authData.user.email);
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', authData.user.email)
        .single();

      console.log('AuthContext: 사용자 정보 조회 결과', { userData, userError });

      if (userError) {
        console.error('AuthContext: 사용자 정보 조회 에러', userError);
        return { error: new Error('사용자 정보를 가져올 수 없습니다.') };
      }

      if (!userData) {
        console.error('AuthContext: 사용자 정보가 없음');
        return { error: new Error('사용자 정보가 없습니다. 관리자에게 문의하세요.') };
      }

      // 로그인 성공
      console.log('AuthContext: 로그인 성공', userData);
      
      // 사용자 정보 설정
      const userInfo: UserInfo = {
        ...userData,
        id: userData.id || authData.user.id,
        email: userData.email || authData.user.email,
        username: userData.username || userData.email.split('@')[0],
        profile_Image: userData.profile_Image || '',
        gender: userData.gender || '',
        user_grade: userData.user_grade || 1,
        total_points: userData.total_points || 0,
        monthly_points: userData.monthly_points || 0,
        votesCreated: userData.votesCreated || 0,
        votesParticipated: userData.votesParticipated || 0,
        created_at: userData.created_at || new Date().toISOString(),
        updated_at: userData.updated_at || new Date().toISOString(),
        phone_number: userData.phone_number || '',
        password: '',
        region: userData.region || '',
        interests: userData.interests || '',
        birthyear: userData.birthyear || 0
      };
      
      console.log('AuthContext: 설정된 사용자 정보', userInfo);
      setUser(userInfo);
      localStorage.setItem('userInfo', JSON.stringify(userInfo));
      
      return { error: null };
    } catch (error) {
      console.error('AuthContext: 예외 발생', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      console.log('AuthContext: 회원가입 시도', { email });
      setLoading(true);
      
      // 이메일 주소 정규화 (소문자 변환 및 공백 제거)
      const normalizedEmail = email.toLowerCase().trim();
      
      // 비밀번호 길이 검사
      if (password.length < 6) {
        console.error('AuthContext: 비밀번호 길이 부족', password.length);
        return { 
          error: { message: '비밀번호는 최소 6자 이상이어야 합니다.' }, 
          data: null 
        };
      }
      
      // 이메일 중복 확인
      console.log('AuthContext: 이메일 중복 확인 시작', normalizedEmail);
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('email')
        .eq('email', normalizedEmail)
        .maybeSingle();
      
      console.log('AuthContext: 이메일 중복 확인 결과', { existingUser, checkError });
      
      if (checkError) {
        console.error('AuthContext: 이메일 중복 확인 중 오류', checkError);
        return { error: checkError, data: null };
      }
      
      if (existingUser) {
        console.error('AuthContext: 이미 사용 중인 이메일', normalizedEmail);
        return { 
          error: { message: '이미 사용 중인 이메일 주소입니다.' }, 
          data: null 
        };
      }
      
      // Supabase Auth로 회원가입
      console.log('AuthContext: Supabase Auth 회원가입 시도', { normalizedEmail });
      
      // Supabase의 이메일 유효성 검사 규칙에 맞게 이메일 주소 처리
      // 이메일 주소에 특수 문자가 포함되어 있으면 제거
      const sanitizedEmail = normalizedEmail.replace(/[^a-zA-Z0-9@._-]/g, '');
      
      console.log('AuthContext: 정제된 이메일', sanitizedEmail);
      
      try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: sanitizedEmail,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth`,
            data: {
              email: sanitizedEmail
            }
          }
        });
        
        console.log('AuthContext: Supabase Auth 회원가입 응답', { authData, authError });
        
        if (authError) {
          console.error('AuthContext: 회원가입 에러', authError);
          
          // 이메일 인증 요청 제한 오류 처리
          if (authError.message?.includes('email rate limit exceeded')) {
            return { 
              error: { 
                message: '이메일 인증 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' 
              }, 
              data: null 
            };
          }
          
          return { error: authError, data: null };
        }
        
        if (!authData?.user) {
          console.error('AuthContext: 회원가입 실패 - 사용자 데이터 없음');
          return { error: new Error('회원가입에 실패했습니다.'), data: null };
        }
        
        // 새 사용자 정보 생성
        const newUser: UserInfo = {
          id: authData.user.id,
          email: sanitizedEmail,
          password: '', // 비밀번호는 Auth에서 관리하므로 저장하지 않음
          username: '',
          phone_number: '',
          profile_Image: '',
          gender: '',
          region: '',
          interests: [],
          birthyear: 0,
          votesCreated: 0,
          votesParticipated: 0,
          total_points: 0,
          monthly_points: 0,
          user_grade: 1,
          weekly_created: [],
          weekly_voted: [],
          created_at: new Date().toISOString(),
          updated_at: [new Date().toISOString()]
        };
        
        // users 테이블에 사용자 정보 저장
        const { error: insertError } = await supabase
          .from('users')
          .insert([newUser]);
        
        if (insertError) {
          console.error('AuthContext: 사용자 정보 저장 실패', insertError);
          return { error: insertError, data: null };
        }
        
        console.log('AuthContext: 회원가입 성공', newUser);
        return { error: null, data: newUser };
      } catch (authError) {
        console.error('AuthContext: Supabase Auth 회원가입 중 예외 발생', authError);
        return { error: authError, data: null };
      }
    } catch (error) {
      console.error('AuthContext: 회원가입 예외 발생', error);
      return { error, data: null };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      console.log('AuthContext: 로그아웃 시도');
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('AuthContext: 로그아웃 에러', error);
        throw error;
      }
      
      setUser(null);
      localStorage.removeItem('userInfo');
      console.log('AuthContext: 로그아웃 성공');
    } catch (error) {
      console.error('AuthContext: 로그아웃 에러', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 