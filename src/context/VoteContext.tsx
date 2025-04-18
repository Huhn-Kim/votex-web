import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { VoteTopic, VoteTopicCreateData, VoteTopicUpdateData, VoteRank, VoteOption } from '../lib/types';
import { 
  getVoteTopics, 
  getMyVotes, 
  createVoteTopic, 
  updateVoteTopic,
  deleteVoteOption,
  addVoteOption,
  incrementLikes,
  updateVoteVisibility,
  getRankedVotes,
  deleteImageFromStorage,
  deleteVideoFromStorage,
} from '../lib/api';
import supabase from '../lib/supabase';
import { useAuth } from './AuthContext';

// 상단에 RankedVoteData 인터페이스 추가
interface RankedVoteData {
  topic: VoteTopic;
  rank: VoteRank;
}

// Context 타입 정의
interface VoteContextType {
  votes: VoteTopic[];
  myVotes: VoteTopic[];
  loading: boolean;
  error: string | null;
  progress: number;
  progressStatus: string;
  addVote: (voteData: any) => Promise<any>;
  updateVoteTopic: (updateData: Partial<VoteTopic>) => Promise<any>;
  updateVote: (topicId: number, optionId: number) => Promise<any>;
  refreshVotes: () => Promise<void>;
  deleteTopic: (topicId: number) => Promise<void>;
  publishVote: (topicId: number) => Promise<void>;
  addOption: (topicId: number, optionText: string) => Promise<void>;
  deleteOption: (topicId: number, optionId: number) => Promise<void>;
  handleLike: (topicId: number) => Promise<void>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  getRankedVotes: (criteria: 'total' | 'today' | 'hourly' | 'comments') => Promise<RankedVoteData[]>;
  setLoading: (loading: boolean) => void;
  setProgress: (progress: number) => void;
  setProgressStatus: (status: string) => void;
  userReactions: Map<number, { liked: boolean }>;
  updateUserReaction: (topicId: number) => Promise<void>;
  loadUserReaction: (topicId: number) => Promise<void>;
  loadUserVote: (topicId: number) => Promise<number | null>;
  userVotes: Map<number, number | null>;
  loadUserVotes: () => Promise<void>;
}

// Context 생성
export const VoteContext = createContext<VoteContextType>({
  votes: [],
  myVotes: [],
  loading: false,
  error: null,
  progress: 0,
  progressStatus: '',
  addVote: async () => null,
  updateVoteTopic: async () => {},
  updateVote: async () => {},
  refreshVotes: async () => {},
  deleteTopic: async () => {},
  publishVote: async () => {},
  addOption: async () => {},
  deleteOption: async () => {},
  handleLike: async () => {},
  setError: () => {},
  getRankedVotes: async () => [],
  setLoading: () => {},
  setProgress: () => {},
  setProgressStatus: () => {},
  userReactions: new Map(),
  updateUserReaction: async () => {},
  loadUserReaction: async () => {},
  loadUserVote: async () => null,
  userVotes: new Map(),
  loadUserVotes: async () => {},
});

// Context Provider 컴포넌트
export const VoteProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 초기 로딩 상태를 true로 설정
  const [loading, setLoading] = useState(true);
  const [votes, setVotes] = useState<VoteTopic[]>([]);
  const [myVotes, setMyVotes] = useState<VoteTopic[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState('');
  const [userReactions, setUserReactions] = useState<Map<number, { liked: boolean }>>(new Map());
  const [userVotes, setUserVotes] = useState<Map<number, number | null>>(new Map());
  
  // AuthContext에서 현재 로그인한 사용자 정보 가져오기
  const { user } = useAuth();
  const userId = user?.id || '';
  
  // 투표 데이터 가져오기
  const fetchVotes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // userId가 비어있어도 투표 데이터는 가져옴
      const data = await getVoteTopics(userId);
      
      if (Array.isArray(data)) {
        // visible이 true인 투표만 필터링
        const visibleVotes = data.filter(vote => vote.visible === true);
        setVotes(visibleVotes.map(vote => ({
          ...vote,
          display_type: vote.display_type as 'text' | 'image'
        })));
      } else {
        setError('투표 데이터 형식이 올바르지 않습니다.');
      }
    } catch (err) {
      console.error('투표 데이터를 가져오는 중 오류 발생:', err);
      setError('투표 데이터를 가져오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };
  
  // 내 투표 데이터 가져오기
  const fetchMyVotes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // userId가 비어있으면 API 호출 없이 빈 배열 반환
      if (!userId) {
        console.log('fetchMyVotes: userId가 비어있어 API 호출 취소');
        setMyVotes([]);
        setLoading(false);
        return;
      }
      
      const data = await getMyVotes(userId);
      
      if (Array.isArray(data)) {
        // 자세한 데이터 로깅
        data.forEach((vote, index) => {
          if (vote) {
            console.log(`MyVote ${index} (ID: ${vote.id}):`);
            console.log(`- 질문: ${vote.question}`);
            console.log(`- 표시 유형: ${vote.display_type}`);
            console.log(`- 옵션 개수: ${vote.options?.length || 0}`);
            vote.options?.forEach((opt, idx) => {
              console.log(`  옵션 ${idx}: 텍스트=${opt.text}, 이미지URL=${!!opt.image_url ? '있음' : '없음'}`);
            });
          }
        });
        
        // 타입 안전을 위해 null 값 필터링
        const filteredData = data.filter((vote): vote is VoteTopic => vote !== null);
        setMyVotes(filteredData);
      } else {
        console.error('getMyVotes가 배열을 반환하지 않음:', data);
        setError('내 투표 데이터 형식이 올바르지 않습니다.');
      }
    } catch (err) {
      console.error('내 투표 데이터를 가져오는 중 오류 발생:', err);
      setError('내 투표 데이터를 가져오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };
  
  // 사용자 투표 정보 초기 로드 함수
  const loadUserVotes = async () => {
    try {
      // userId가 비어있으면 빈 Map 반환
      if (!userId) {
        console.log('loadUserVotes: userId가 비어있어 빈 Map 반환');
        setUserVotes(new Map());
        return;
      }
      
      const { data, error } = await supabase
        .from('vote_results')
        .select('topic_id, option_id')
        .eq('user_id', userId);

      if (error) {
        console.error('사용자 투표 정보 로드 실패:', error);
        return;
      }

      const votesMap = new Map<number, number | null>();
      data?.forEach(vote => {
        votesMap.set(vote.topic_id, vote.option_id);
      });

      setUserVotes(votesMap);
    } catch (err) {
      console.error('사용자 투표 정보 로드 실패:', err);
    }
  };
  
  // 컴포넌트 마운트 시 데이터 가져오기
  useEffect(() => {
    console.log('VoteContext 마운트됨, 사용자 ID:', userId);
    
    const initializeData = async () => {
      try {
        // 모든 투표 데이터 불러오기
        await fetchVotes();
        
        // 로그인한 경우에만 사용자 관련 데이터 불러오기
        if (userId) {
          await fetchMyVotes();
          await loadUserVotes(); // 사용자 투표 정보 로드
          
          // 홈 화면에 표시되는 모든 투표에 대한 사용자 반응 정보 한번에 로드
          await loadAllUserReactions();
        } else {
          console.log('로그인하지 않은 상태, 사용자 관련 데이터는 로드하지 않음');
        }
      } finally {
        // 로드 상태 종료
        setLoading(false);
      }
    };
    
    initializeData();
  }, [userId]); // userId가 변경될 때마다 실행
  
  // 모든 표시되는 투표에 대한 사용자 반응 정보를 한 번에 로드하는 함수
  const loadAllUserReactions = async () => {
    try {
      // userId가 비어있으면 로드하지 않음
      if (!userId) {
        console.log('loadAllUserReactions: userId가 비어있어 로드하지 않음');
        return;
      }
      
      console.log('모든 투표에 대한 사용자 반응 정보 로드 시작');
      
      // vote_results 테이블에서 현재 사용자의 모든 반응 데이터 가져오기
      const { data, error } = await supabase
        .from('vote_results')
        .select('topic_id, option_id, like_kind')
        .eq('user_id', userId);
        
      if (error) {
        console.error('사용자 반응 정보 로드 실패:', error);
        return;
      }
      
      if (!data || data.length === 0) {
        console.log('사용자 반응 정보가 없음');
        return;
      }
      
      console.log(`${data.length}개의 사용자 반응 정보를 로드함`);
      
      // 사용자 반응 정보를 상태에 저장
      const newReactionsMap = new Map<number, { liked: boolean }>();
      const votedItemsMap = new Map<number, number | null>();
      
      data.forEach(item => {
        // 좋아요 정보 처리
        newReactionsMap.set(item.topic_id, { liked: item.like_kind === 'like' });
        
        // 선택한 옵션 정보 처리
        if (item.option_id) {
          votedItemsMap.set(item.topic_id, item.option_id);
        }
      });
      
      // 상태 업데이트
      setUserReactions(newReactionsMap);
      setUserVotes(votedItemsMap);
      
      // 투표 목록에도 선택한 옵션 정보 반영
      setVotes(prevVotes => prevVotes.map(vote => {
        const optionId = votedItemsMap.get(vote.id);
        if (optionId !== undefined) {
          return { ...vote, selected_option: optionId };
        }
        return vote;
      }));
      
      console.log('모든 투표에 대한 사용자 반응 정보 로드 완료');
    } catch (err) {
      console.error('모든 사용자 반응 정보 로드 실패:', err);
    }
  };
  
  // 에러 메시지 자동 제거를 위한 useEffect
  useEffect(() => {
    if (error) {
      // 에러 메시지가 있으면 5초 후 자동으로 제거
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      
      // 컴포넌트 언마운트 시 타이머 정리
      return () => clearTimeout(timer);
    }
  }, [error]);
  
  // 사용자 반응 초기 로드 함수 수정
  const loadUserReaction = async (topicId: number) => {
    try {
      // userId가 비어있으면 빈 객체 반환
      if (!userId) {
        console.log('loadUserReaction: userId가 비어있어 빈 객체 반환');
        setUserReactions(prev => {
          const newMap = new Map(prev);
          newMap.set(topicId, { liked: false });
          return newMap;
        });
        return;
      }
      
      // vote_results 테이블에서 사용자의 like_kind와 option_id 정보 조회
      const { data, error } = await supabase
        .from('vote_results')
        .select('like_kind, option_id')
        .eq('user_id', userId)
        .eq('topic_id', topicId)
        .maybeSingle(); // single() 대신 maybeSingle() 사용

      if (error && error.code !== 'PGRST116') { // PGRST116: 결과가 없음
        console.error('사용자 반응 상태 로드 실패:', error);
        return;
      }

      // like_kind 값에 따라 상태 설정
      const liked = data?.like_kind === 'like';

      setUserReactions(prev => {
        const newMap = new Map(prev);
        newMap.set(topicId, { liked });
        return newMap;
      });

      // 선택한 옵션 정보 업데이트
      if (data?.option_id) {
        setVotes(prevVotes => prevVotes.map(vote => {
          if (vote.id === topicId) {
            return { ...vote, selected_option: data.option_id };
          }
          return vote;
        }));
      }
    } catch (err) {
      console.error('사용자 반응 상태 로드 실패:', err);
    }
  };
  
  // 사용자 투표 선택 정보 로드 함수 수정
  const loadUserVote = async (topicId: number): Promise<number | null> => {
    try {
      // userId가 비어있으면 null 반환
      if (!userId) {
        console.log('loadUserVote: userId가 비어있어 null 반환');
        return null;
      }
      
      const { data, error } = await supabase
        .from('vote_results')
        .select('option_id')
        .eq('user_id', userId)
        .eq('topic_id', topicId)
        .maybeSingle(); // single() 대신 maybeSingle() 사용

      if (error && error.code !== 'PGRST116') {
        console.error('사용자 투표 정보 로드 실패:', error);
        return null;
      }

      return data?.option_id || null;
    } catch (err) {
      console.error('사용자 투표 정보 로드 실패:', err);
      return null;
    }
  };
  
  // 새 투표 추가 함수
  const addVote = async (vote: Partial<VoteTopic>): Promise<VoteTopic | null> => {
    try {
      // setLoading(true);
      // setError(null);
      
      // const voteOptions = vote.options?.map((option, index) => {
      //   // 이미지 URL 필드 확인
      //   const imageUrlValue = option.image_url || '';
        
      //   return {
      //     text: option.text || '',
      //     image_class: option.image_class || '',
      //     image_url: imageUrlValue
      //   };
      // }) || [
      //   { text: "옵션 1", image_class: '' },
      //   { text: "옵션 2", image_class: '' }
      // ];
      
      // API를 통해 새 투표 주제 생성
      const newVote = {
        ...vote,
        user: '',
        userBadge: '',
        time: '',
        totalVotes: 0,
        likes: 0,
        dislikes: 0,
        comments: 0,
        link: vote.link || '',
        type: vote.type || '',
        question: vote.question || '제목 없음',
        display_type: vote.display_type || 'text',
        related_image: vote.related_image,
        visible: false // 기본적으로 비공개로 설정
      } as VoteTopicCreateData;
      
      const result = await createVoteTopic(newVote);
      
      // 데이터 새로고침
      await fetchVotes();
      await fetchMyVotes();
      
      // setLoading(false);
      return result;
    } catch (err) {
      console.error('투표를 추가하는 중 오류 발생:', err);
      setError('투표를 추가하는 중 오류가 발생했습니다.');
      // setLoading(false);
      throw err;
    }
  };
  
  // 투표 업데이트 함수 최적화
  const updateVote = async (topicId: number, optionId: number) => {
    try {
      // 현재 투표 주제 찾기
      const topic = votes.find(v => v.id === topicId) || myVotes.find(v => v.id === topicId);
      if (!topic) {
        throw new Error('투표 주제를 찾을 수 없습니다');
      }
      
      // 이전 선택 옵션 기록
      const previousOptionId = topic.selected_option ?? null;
      
      // 로컬 상태 즉시 업데이트 (UI 반응성)
      const updateVoteState = (votes: VoteTopic[], topicId: number, previousOptionId: number | null, optionId: number) => {
        return votes.map(vote => {
        if (vote.id === topicId) {
            // 옵션들 업데이트
          const updatedOptions = vote.options.map(opt => {
              if (previousOptionId !== null && opt.id === previousOptionId) {
                return { ...opt, votes: Math.max(0, opt.votes - 1) };
              }
              if (opt.id === optionId) {
                return { ...opt, votes: opt.votes + 1 };
            }
            return opt;
          });
          
          return {
            ...vote,
              selected_option: optionId,
            options: updatedOptions,
              // 이전에 투표하지 않은 경우만 total_votes 증가
              total_votes: previousOptionId === null ? vote.total_votes + 1 : vote.total_votes
          };
        }
        return vote;
      });
      };
      
      // 공용 투표와 내 투표 모두 업데이트
      setVotes(prevVotes => updateVoteState(prevVotes, topicId, previousOptionId, optionId));
      setMyVotes(prevMyVotes => updateVoteState(prevMyVotes, topicId, previousOptionId, optionId));
      
      // 백그라운드에서 DB 업데이트 수행
      (async () => {
        try {
          
          // 1. vote_results 테이블 업데이트: 내 선택 저장
          // 이미 투표한 적이 있는지 확인 - 수정된 쿼리 메서드 사용
          const { data: existingVote, error: checkError } = await supabase
            .from('vote_results')
            .select('*')
            .eq('user_id', userId)
            .eq('topic_id', topicId)
            .single();
          
          if (checkError && checkError.code !== 'PGRST116') { // PGRST116: 결과가 없음
            console.error('투표 확인 오류:', checkError);
            // 오류가 있어도 계속 진행 (사용자 경험 저하 방지)
          } 
          
          // 결과에 따른 처리
          if (existingVote) {
            // 이미 투표한 경우 업데이트
            const { error: updateError } = await supabase
              .from('vote_results')
              .update({ option_id: optionId })
              .eq('user_id', userId)
              .eq('topic_id', topicId);
            
            if (updateError) {
              console.error('투표 업데이트 오류:', updateError);
            } else {
              console.log('기존 투표 업데이트 완료:', topicId, optionId);
            }
          } else {
            // 첫 투표인 경우 새 레코드 생성
            const { error: insertError } = await supabase
              .from('vote_results')
              .insert([
                { user_id: userId, topic_id: topicId, option_id: optionId }
              ]);
            
            if (insertError) {
              // 충돌 또는 다른 오류가 발생한 경우 로깅 후 업데이트 시도
              console.error('투표 삽입 오류:', insertError);
              
              // 업데이트 시도 (혹시 동시에 다른 요청이 삽입을 완료했을 경우)
              const { error: updateError } = await supabase
                .from('vote_results')
                .update({ option_id: optionId })
                .eq('user_id', userId)
                .eq('topic_id', topicId);
              
              if (updateError) {
                console.error('충돌 후 업데이트 오류:', updateError);
              } else {
                console.log('충돌 후 투표 업데이트 완료:', topicId, optionId);
              }
            } else {
              console.log('첫 투표 처리 완료:', topicId, optionId);
            }
          }
          
          // 2. vote_options 테이블 업데이트: 투표수 조정
          if (previousOptionId !== null) {
            // 이전 선택 옵션 투표수 감소
            const { error: decreaseError } = await supabase.rpc(
              'decrement_option_votes', 
              { option_id: previousOptionId }
            );
            
            if (decreaseError) {
              console.error('이전 옵션 투표수 감소 오류:', decreaseError);
            }
          }
          
          // 새 선택 옵션 투표수 증가
          const { error: increaseError } = await supabase.rpc(
            'increment_option_votes', 
            { option_id: optionId }
          );
          
          if (increaseError) {
            console.error('새 옵션 투표수 증가 오류:', increaseError);
          }
          
          // 3. vote_topics 테이블 업데이트: 첫 투표인 경우 total_votes 증가
          if (previousOptionId === null) {
            const { error: totalVotesError } = await supabase.rpc(
              'increment_topic_votes', 
              { topic_id: topicId }
            );
            
            if (totalVotesError) {
              console.error('총 투표수 증가 오류:', totalVotesError);
            }
          }
          
          console.log('투표 업데이트 완료:', topicId, optionId);
        } catch (err) {
          console.error('백그라운드 투표 처리 오류:', err);
          // 오류 발생해도 사용자에게는 알리지 않음 (이미 UI 반영됨)
        }
      })();
      
      return Promise.resolve();
    } catch (err) {
      console.error('투표 업데이트 중 오류:', err);
      setError('투표 업데이트 중 오류가 발생했습니다.');
      return Promise.reject(err);
    }
  };
  
  // 투표 주제 업데이트 함수
  const updateVoteTopicHandler = async (vote: Partial<VoteTopic>) => {
    try {
      // setLoading(true);
      // setError(null);
      // setProgress(0);
      // setProgressStatus('업데이트 준비 중...');
     
      // 기존 투표 데이터 찾기
      const existingVote = myVotes.find(v => v.id === vote.id);
      if (!existingVote) {
        throw new Error('업데이트할 투표를 찾을 수 없습니다.');
      }

      // API를 통해 투표 주제 업데이트
      const updateData: VoteTopicUpdateData = {
        id: Number(vote.id),
        question: vote.question,
        link: vote.link,
        type: vote.type,
        display_type: vote.display_type as 'text' | 'image',
        expires_at: vote.expires_at,
        vote_period: vote.vote_period,
        visible: vote.visible,
        related_image: vote.related_image,
        options: vote.options?.map(newOpt => {
          const existingOpt = existingVote.options.find(opt => opt.id === newOpt.id);
          return {
            ...existingOpt,
            id: newOpt.id || 0,
            text: newOpt.text,
            votes: newOpt.votes || existingOpt?.votes || 0,
            image_url: newOpt.image_url || existingOpt?.image_url || '',
            image_class: newOpt.image_class || existingOpt?.image_class || '',
            topic_id: Number(vote.id),
            gender_stats: newOpt.gender_stats || existingOpt?.gender_stats || { male: 0, female: 0 },
            region_stats: newOpt.region_stats || existingOpt?.region_stats || {} as VoteOption['region_stats'],
            age_stats: newOpt.age_stats || existingOpt?.age_stats || {} as VoteOption['age_stats']
          };
        })
      };
      
      await updateVoteTopic(updateData);
      
      // setProgress(60);
      // setProgressStatus('데이터 갱신 중...');
      
      // 데이터 새로고침
      await fetchVotes();
      await fetchMyVotes();
      
      setProgress(100);
      setProgressStatus('업데이트 완료');
    } catch (err) {
      console.error('투표 주제 업데이트 중 오류 발생:', err);
      setError('투표 주제를 업데이트하는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };
  
  // 투표 새로고침 함수
  const refreshVotes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 모든 투표와 내 투표 새로고침
      await fetchVotes();
      
      if (userId) {
        // 유저 정보가 있는 경우 마이 페이지 투표 정보도 함께 로드
        await fetchMyVotes();
        // 사용자 반응 정보도 함께 로드
        await loadAllUserReactions();
      }
      
      console.log('투표 데이터 새로고침 완료');
      
      // 로딩 상태 해제
      setLoading(false);
    } catch (err) {
      console.error('투표 데이터 새로고침 중 오류 발생:', err);
      setError('투표 데이터를 새로고침하는 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };
  
  // 투표 삭제 함수 수정
  const deleteTopic = useCallback(async (topicId: number) => {
    console.log(`투표 삭제 요청 시작: ID=${topicId}`);
    setLoading(true);
    setError(null);

    // 삭제 전 스토리지 파일 정보 조회를 위한 데이터 임시 저장 변수
    let relatedMediaUrl: string | null = null;
    let optionImageUrls: (string | null)[] = []; // 옵션 이미지 URL 배열

    try {
        // 1. 삭제할 투표의 관련 미디어 URL 정보 조회
        const { data: topicData, error: fetchError } = await supabase
            .from('vote_topics')
            .select(`
                related_image,
                vote_options ( image_url )
            `) // vote_topics의 related_image 와 관련된 vote_options의 image_url 조회
            .eq('id', topicId)
            .single();

        if (fetchError) throw fetchError;
        if (!topicData) throw new Error('삭제할 투표 토픽을 찾을 수 없습니다.');

        // 조회된 정보 저장
        relatedMediaUrl = topicData.related_image;
        // vote_options 데이터가 있고 배열인지 확인 후 URL 추출
        if (topicData.vote_options && Array.isArray(topicData.vote_options)) {
             optionImageUrls = topicData.vote_options.map(opt => opt.image_url).filter(url => url); // null/undefined 제외
        }
        console.log('삭제 대상 미디어 정보:', { relatedMediaUrl, optionImageUrls });

        // 1-2. 먼저 vote_results 테이블에서 관련 데이터 삭제
        const { error: deleteResultsError } = await supabase
            .from('vote_results')
            .delete()
            .eq('topic_id', topicId);
        
        if (deleteResultsError) {
            console.error(`vote_results 삭제 실패: ID=${topicId}`, deleteResultsError);
            // 실패해도 계속 진행 (나중에 CASCADE 설정이 되어있을 수 있음)
        } else {
            console.log(`vote_results 데이터 삭제 성공: ID=${topicId}`);
        }

        // 1-3. vote_ranks 테이블에서 관련 데이터 삭제
        const { error: deleteRanksError } = await supabase
            .from('vote_ranks')
            .delete()
            .eq('topic_id', topicId);
        
        if (deleteRanksError) {
            console.error(`vote_ranks 삭제 실패: ID=${topicId}`, deleteRanksError);
            // 실패해도 계속 진행
        } else {
            console.log(`vote_ranks 데이터 삭제 성공: ID=${topicId}`);
        }

        // 2. 데이터베이스에서 투표 주제 삭제
        const { error: deleteDbError } = await supabase
            .from('vote_topics')
            .delete()
            .eq('id', topicId);

        if (deleteDbError) throw deleteDbError;
        console.log(`DB 투표 삭제 성공: ID=${topicId}`);

        // 3. DB 삭제 성공 후, 스토리지 파일 삭제 시도
        const deletionPromises: Promise<boolean>[] = [];

        // 3-1. 주제 관련 미디어(이미지 또는 비디오) 삭제
        if (relatedMediaUrl) {
            if (isVideoUrl(relatedMediaUrl)) {
                console.log(`주제 관련 비디오 삭제 준비: ${relatedMediaUrl}`);
                deletionPromises.push(deleteVideoFromStorage(relatedMediaUrl));
            } else {
                console.log(`주제 관련 이미지 삭제 준비: ${relatedMediaUrl}`);
                deletionPromises.push(deleteImageFromStorage(relatedMediaUrl));
            }
        }

        // 3-2. 옵션 이미지 삭제
        optionImageUrls.forEach(imageUrl => {
            if (imageUrl) { // null 체크 한번 더 (filter에서 처리했지만 안전하게)
                console.log(`옵션 이미지 삭제 준비: ${imageUrl}`);
                deletionPromises.push(deleteImageFromStorage(imageUrl));
            }
        });

        // 3-3. 모든 스토리지 삭제 Promise 실행
        if (deletionPromises.length > 0) {
            console.log(`${deletionPromises.length}개의 스토리지 파일 삭제 시도...`);
            const deleteResults = await Promise.allSettled(deletionPromises);
            console.log('스토리지 파일 삭제 결과:', deleteResults);
            // 실패 로그 처리 (필요시)
            deleteResults.forEach((result, index) => {
                 if(result.status === 'rejected' || (result.status === 'fulfilled' && !result.value)) {
                     const url = index === 0 && relatedMediaUrl ? relatedMediaUrl : optionImageUrls[index - (relatedMediaUrl ? 1 : 0)];
                     console.error(`스토리지 파일 삭제 실패/문제 발생 (${url}):`, result.status === 'rejected' ? result.reason : 'API false 반환');
                 }
            });
        } else {
            console.log('삭제할 스토리지 파일 없음.');
        }

        // 4. 로컬 상태 업데이트 (삭제된 투표 제거)
        setMyVotes(prevVotes => prevVotes.filter(vote => vote.id !== topicId));
        console.log(`로컬 상태 업데이트 완료: ID=${topicId} 제거`);

    } catch (err: any) {
        console.error('투표 삭제 처리 중 오류 발생:', err);
        setError(err.message || '투표 삭제 중 오류가 발생했습니다.');
        // DB 삭제 실패 시 스토리지 삭제는 시도되지 않음
    } finally {
        setLoading(false); // 로딩 종료
        console.log(`투표 삭제 요청 종료: ID=${topicId}`);
    }
  }, [setMyVotes]); // 종속성 배열 확인
  
  // 투표 옵션 삭제 함수
  const deleteOption = async (optionId: number) => {
    try {
      // API를 통해 옵션 삭제
      await deleteVoteOption(optionId);
      
    } catch (err) {
      console.error('옵션을 삭제하는 중 오류 발생:', err);
      setError('옵션을 삭제하는 중 오류가 발생했습니다.');
    } finally {
      // 데이터 새로고침
      await fetchVotes();
      await fetchMyVotes();
    }
  };
  
  // 투표 옵션 추가 함수
  const addOption = async (topicId: number, optionText: string) => {
    try {
      // API를 통해 옵션 추가
      await addVoteOption(topicId, optionText);
      
      // 데이터 새로고침
      // await fetchVotes();
      // await fetchMyVotes();
    } catch (err) {
      console.error('옵션을 추가하는 중 오류 발생:', err);
      setError('옵션을 추가하는 중 오류가 발생했습니다.');
    }
  };
  
  // 사용자 좋아요 반응 업데이트 함수
  const updateUserReaction = async (topicId: number) => {
    try {
      // 현재 투표 찾기
      const topic = votes.find(v => v.id === topicId) || myVotes.find(v => v.id === topicId);
      if (!topic) return;

      // 현재 반응 상태 가져오기
      const currentReaction = userReactions.get(topicId) || { liked: false };
      
      // 새로운 반응 상태 계산 - 좋아요 토글
      const newReaction = {
        liked: !currentReaction.liked
      };

      // UI 상태 업데이트
      setUserReactions(prev => {
        const newMap = new Map(prev);
        newMap.set(topicId, newReaction);
        return newMap;
      });

      // votes와 myVotes에 좋아요 업데이트
      const updateVoteState = (votes: VoteTopic[]) => {
        return votes.map(vote => {
          if (vote.id === topicId) {
            return {
              ...vote,
              likes: newReaction.liked ? vote.likes + 1 : vote.likes - 1
            };
          }
          return vote;
        });
      };

      setVotes(prevVotes => updateVoteState(prevVotes));
      setMyVotes(prevMyVotes => updateVoteState(prevMyVotes));

    } catch (err) {
      console.error('사용자 반응 업데이트 실패:', err);
      throw err;
    }
  };

  // handleLike API 함수 호출. DB 업데이트
  const handleLike = async (topicId: number) => {
    await updateUserReaction(topicId);
    await incrementLikes(topicId, userId);
  };
  
  // 투표 공개(업로드) 함수 수정
  const publishVote = async (topicId: number) => {
    try {
      setLoading(true);
      setError(null);
      setProgress(0);
      setProgressStatus('업로드 준비 중...');

      setProgress(30);
      setProgressStatus('투표 공개로 변경 중...');
      
      await updateVoteVisibility(topicId, true);
            
      // 데이터 새로고침
      await fetchVotes();
      await fetchMyVotes();
      
      setProgress(100);
      setProgressStatus('업로드 완료');      

    } catch (err) {
      console.error('투표를 공개하는 중 오류 발생:', err);
      setError('투표를 공개하는 중 오류가 발생했습니다.');
      setProgress(0);
      setProgressStatus('');
    } finally {
      // 약간의 지연 후 로딩 상태 해제
      setTimeout(() => {
        setLoading(false);
        setProgress(0);
        setProgressStatus('');
      }, 500);
    }
  };
  
  // 순위별 투표 조회 함수 수정
  const getRankedVotesHandler = async (criteria: 'total' | 'today' | 'hourly' | 'comments'): Promise<RankedVoteData[]> => {
    try {
      const data = await getRankedVotes(criteria);

      if (Array.isArray(data)) {
        const transformedData = data
          .map(item => {
            if (!item || typeof item !== 'object') {
              return null;
            }

            // VoteTopic 인터페이스에 맞게 데이터 구성
            const topic: VoteTopic = {
              id: item.id,
              user_id: item.user_id,
              question: item.question,
              link: item.link || '',
              total_votes: item.total_votes || 0,
              today_votes: item.today_votes || 0,
              hourly_votes: item.hourly_votes || 0,
              likes: item.likes || 0,
              comments: item.comments || 0,
              type: item.type || '',
              display_type: item.display_type || 'text',
              created_at: item.created_at,
              expires_at: item.expires_at,
              is_expired: item.is_expired || false,
              vote_period: item.vote_period || '',
              visible: item.visible || false,
              related_image: item.related_image || '',
              users: {
                id: item.users?.id || '',
                username: item.users?.username || '',
                email: item.users?.email || '',
                profile_Image: item.users?.profile_Image || '',
                user_grade: item.users?.user_grade || 0,
                created_at: item.users?.created_at || '',
                updated_at: item.users?.updated_at || '',
                political_view: item.users?.political_view || '',
                weekly_created: item.users?.weekly_created || [],
                weekly_voted: item.users?.weekly_voted || []
              },
              options: Array.isArray(item.options) ? item.options.map((opt: {
                id: number;
                topic_id: number;
                text: string;
                votes?: number;
                image_class?: string;
                image_url?: string;
              }) => ({
                id: opt.id,
                topic_id: opt.topic_id,
                text: opt.text,
                votes: opt.votes || 0,
                image_class: opt.image_class || '',
                image_url: opt.image_url || ''
              })) : [],
              selected_option: item.selected_option || null
            };

            // VoteRank 인터페이스에 맞게 데이터 구성
            const rank: VoteRank = {
              id: item.vote_ranks?.id || 0,
              topic_id: item.vote_ranks?.topic_id || 0,
              total_ranks: item.vote_ranks?.total_ranks || 0,
              today_ranks: item.vote_ranks?.today_ranks || 0,
              hourly_ranks: item.vote_ranks?.hourly_ranks || 0,
              comments_ranks: item.vote_ranks?.comments_ranks || 0,
              total_rank_diff: item.vote_ranks?.total_rank_diff || 0,
              today_rank_diff: item.vote_ranks?.today_rank_diff || 0,
              hourly_rank_diff: item.vote_ranks?.hourly_rank_diff || 0,
              comments_rank_diff: item.vote_ranks?.comments_rank_diff || 0,
              last_updated: item.vote_ranks?.last_updated || new Date().toISOString()
            };

            return { topic, rank };
          })
          .filter((item): item is RankedVoteData => item !== null);

        return transformedData;
      }
      
      return [];
    } catch (err) {
      console.error('순위별 투표 조회 중 오류:', err);
      setError('순위별 투표를 조회하는 중 오류가 발생했습니다.');
      return [];
    } finally {
      setLoading(false);
    }
  };
  
  // 타입 일치 여부 확인을 위한 명시적 어서션 추가
  const contextValue: VoteContextType = { 
      votes, 
      myVotes, 
      loading, 
      error, 
      progress, 
      progressStatus,
      addVote, 
      updateVote, 
      updateVoteTopic: updateVoteTopicHandler,
      refreshVotes,
      deleteTopic,
      deleteOption,
      addOption,
      handleLike,
      publishVote,
    setError,
    getRankedVotes: getRankedVotesHandler,
    setLoading,
    setProgress,
    setProgressStatus,
    userReactions,
    updateUserReaction,
    loadUserReaction,
    loadUserVote,
    userVotes,
    loadUserVotes,
  };

  return (
    <VoteContext.Provider value={contextValue}>
      {children}
    </VoteContext.Provider>
  );
};

// Context 사용을 위한 커스텀 훅
export const useVoteContext = () => {
  const context = useContext(VoteContext);
  if (context === undefined) {
    throw new Error('useVoteContext must be used within a VoteProvider');
  }
  return context;
}; 
// 아래 미사용 함수들 제거 (이미 주석 처리되어 있음)
// export const calculatePercentage = ...
// export const isExpired = ...
// export const mapToVoteTopic = ... 

// isVideoUrl 함수 정의 (lib/api.ts 에 없다면 여기에 추가)
const isVideoUrl = (url: string): boolean => {
    if (!url) return false;
    // blob URL 체크는 여기선 불필요할 수 있음 (DB에 저장된 URL 대상)
    try {
      const pathname = new URL(url).pathname;
      const lowerCasePath = pathname.toLowerCase();
      return lowerCasePath.endsWith('.mp4') ||
             lowerCasePath.endsWith('.webm') ||
             lowerCasePath.endsWith('.ogg');
    } catch (e) {
      // URL 파싱 실패 시 확장자 검사 시도
      const lowerCaseUrl = url.toLowerCase();
       return lowerCaseUrl.endsWith('.mp4') ||
              lowerCaseUrl.endsWith('.webm') ||
              lowerCaseUrl.endsWith('.ogg');
    }
  };
