import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { VoteTopic, VoteTopicCreateData, VoteTopicUpdateData, VoteRank } from '../../lib/types';
import { 
  getVoteTopics, 
  getMyVotes, 
  createVoteTopic, 
  deleteVoteTopic as apiDeleteVoteTopic,
  updateVoteTopic,
  deleteVoteOption,
  addVoteOption,
  incrementLikes,
  incrementDislikes,
  updateVoteVisibility,
  getRankedVotes,
  deleteImageFromStorage,
} from '../../lib/api';
import supabase from '../../lib/supabase';

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
  handleDislike: (topicId: number) => Promise<void>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  getRankedVotes: (criteria: 'total' | 'today' | 'hourly' | 'comments') => Promise<RankedVoteData[]>;
  setLoading: (loading: boolean) => void;
  setProgress: (progress: number) => void;
  setProgressStatus: (status: string) => void;
  userReactions: Map<number, { liked: boolean, disliked: boolean }>;
  updateUserReaction: (topicId: number, type: 'like' | 'dislike') => Promise<void>;
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
  handleDislike: async () => {},
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
  const [userReactions, setUserReactions] = useState<Map<number, { liked: boolean, disliked: boolean }>>(new Map());
  const [userVotes, setUserVotes] = useState<Map<number, number | null>>(new Map());
  
  // 헌왕 사용자 ID
  const tempUserId = '0ac4093b-498d-4e39-af11-145a23385a9a';
  
  // 투표 데이터 가져오기
  const fetchVotes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await getVoteTopics(tempUserId);
      
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
      
      const data = await getMyVotes(tempUserId);
      
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
      const { data, error } = await supabase
        .from('vote_results')
        .select('topic_id, option_id')
        .eq('user_id', tempUserId);

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
    fetchVotes();
    fetchMyVotes();
    loadUserVotes(); // 사용자 투표 정보도 함께 로드
  }, []);
  
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
      // vote_results 테이블에서 사용자의 like_kind와 option_id 정보 조회
      const { data, error } = await supabase
        .from('vote_results')
        .select('like_kind, option_id')
        .eq('user_id', tempUserId)
        .eq('topic_id', topicId)
        .maybeSingle(); // single() 대신 maybeSingle() 사용

      if (error && error.code !== 'PGRST116') { // PGRST116: 결과가 없음
        console.error('사용자 반응 상태 로드 실패:', error);
        return;
      }

      // like_kind 값에 따라 상태 설정
      const liked = data?.like_kind === 'like';
      const disliked = data?.like_kind === 'dislike';

      setUserReactions(prev => {
        const newMap = new Map(prev);
        newMap.set(topicId, { liked, disliked });
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
      const { data, error } = await supabase
        .from('vote_results')
        .select('option_id')
        .eq('user_id', tempUserId)
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
      setLoading(true);
      setError(null);
      
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
        question: vote.question || '제목 없음',
        display_type: vote.display_type || 'text',
        related_image: vote.related_image,
        visible: false // 기본적으로 비공개로 설정
      } as VoteTopicCreateData;
      
      const result = await createVoteTopic(newVote);
      
      // 데이터 새로고침
      await fetchVotes();
      await fetchMyVotes();
      
      setLoading(false);
      return result;
    } catch (err) {
      console.error('투표를 추가하는 중 오류 발생:', err);
      setError('투표를 추가하는 중 오류가 발생했습니다.');
      setLoading(false);
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
            .eq('user_id', tempUserId)
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
              .eq('user_id', tempUserId)
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
                { user_id: tempUserId, topic_id: topicId, option_id: optionId }
              ]);
            
            if (insertError) {
              // 충돌 또는 다른 오류가 발생한 경우 로깅 후 업데이트 시도
              console.error('투표 삽입 오류:', insertError);
              
              // 업데이트 시도 (혹시 동시에 다른 요청이 삽입을 완료했을 경우)
              const { error: updateError } = await supabase
                .from('vote_results')
                .update({ option_id: optionId })
                .eq('user_id', tempUserId)
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
      setLoading(true);
      setError(null);
      setProgress(0);
      setProgressStatus('업데이트 준비 중...');
     
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
        display_type: vote.display_type as 'text' | 'image',
        expires_at: vote.expires_at,
        vote_period: vote.vote_period,
        visible: vote.visible,
        related_image: vote.related_image,
        options: vote.options?.map(newOpt => {
          // 기존 옵션 찾기
          const existingOpt = existingVote.options.find(opt => opt.id === newOpt.id);
          return {
            ...existingOpt, // 기존 데이터 유지
            id: newOpt.id || 0,
            text: newOpt.text, // 새로운 텍스트로 업데이트
            image_url: newOpt.image_url || existingOpt?.image_url || '',
            image_class: newOpt.image_class || existingOpt?.image_class || '',
            topic_id: Number(vote.id)
          };
        })
      };
      
      await updateVoteTopic(updateData);
      
      setProgress(60);
      setProgressStatus('데이터 갱신 중...');
      
      // 데이터 새로고침
      await fetchVotes();
      await fetchMyVotes();
      
      setProgress(100);
      setProgressStatus('업데이트 완료');
    } catch (err) {
      console.error('투표 주제 업데이트 중 오류 발생:', err);
      setError('투표 주제를 업데이트하는 중 오류가 발생했습니다.');
      setProgress(0);
      setProgressStatus('');
    } finally {
      setLoading(false);
    }
  };
  
  // 데이터 새로고침 함수
  const refreshVotes = async () => {
    setLoading(true); // 로딩 시작
    await fetchVotes();
    await fetchMyVotes();
    setLoading(false); // 로딩 종료
  };
  
  // 투표 삭제 함수 수정
  const deleteTopic = async (topicId: number) => {
    try {
      setLoading(true);
      setError(null);
      setProgress(0);
      setProgressStatus('삭제 준비 중...');

      // 삭제 시작
      setProgress(20);
      setProgressStatus('투표 카드 삭제 중...');
      
      await apiDeleteVoteTopic(topicId);
            
      // 로컬 상태 업데이트
      setVotes(prevVotes => prevVotes.filter(vote => vote.id !== topicId));
      setMyVotes(prevMyVotes => prevMyVotes.filter(vote => vote.id !== topicId));
      
      // 관련된 이미지 삭제
      setProgress(80);
      setProgressStatus('투표 관련 이미지 삭제 중...');

      // 삭제할 투표 주제 찾기
      const targetVote = votes.find(v => v.id === topicId) || myVotes.find(v => v.id === topicId);
      if (!targetVote) {
        throw new Error('삭제할 투표를 찾을 수 없습니다.');
      }

      // 이미지 삭제 처리
      const imageDeletionPromises = [];
      if (targetVote.related_image) {
        imageDeletionPromises.push(deleteImageFromStorage(targetVote.related_image));
      }
      targetVote.options.forEach(option => {
        if (option.image_url) {
          imageDeletionPromises.push(deleteImageFromStorage(option.image_url));
        }
      });
      if (imageDeletionPromises.length > 0) {
        await Promise.all(imageDeletionPromises);
      }

      setProgress(100);
      setProgressStatus('삭제 완료');
      
    } catch (err) {
      console.error('투표를 삭제하는 중 오류 발생:', err);
      setError('투표를 삭제하는 중 오류가 발생했습니다.');
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
  
  // 사용자 좋아요/싫어요 반응 업데이트 함수
  const updateUserReaction = async (topicId: number, type: 'like' | 'dislike') => {
    try {
      // 현재 투표 찾기
      const topic = votes.find(v => v.id === topicId) || myVotes.find(v => v.id === topicId);
      if (!topic) return;

      // 현재 반응 상태 가져오기
      const currentReaction = userReactions.get(topicId) || { liked: false, disliked: false };
      
      // 새로운 반응 상태 계산
      const newReaction = {
        liked: type === 'like' ? !currentReaction.liked : false,
        disliked: type === 'dislike' ? !currentReaction.disliked : false
      };

      // UI 상태 업데이트
      setUserReactions(prev => {
        const newMap = new Map(prev);
        newMap.set(topicId, newReaction);
        return newMap;
      });

      // votes와 myVotes에 좋아요/싫어요 업데이트
      const updateVoteState = (votes: VoteTopic[]) => {
        return votes.map(vote => {
          if (vote.id === topicId) {
            return {
              ...vote,
              likes: type === 'like' 
                ? (newReaction.liked ? vote.likes + 1 : vote.likes - 1)
                : (currentReaction.liked ? vote.likes - 1 : vote.likes),
              dislikes: type === 'dislike'
                ? (newReaction.disliked ? vote.dislikes + 1 : vote.dislikes - 1)
                : (currentReaction.disliked ? vote.dislikes - 1 : vote.dislikes)
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

  //handleLike와 handleDislike API 함수 호출. DB 업데이트
  const handleLike = async (topicId: number) => {
    await updateUserReaction(topicId, 'like');
    await incrementLikes(topicId, tempUserId);
  };

  const handleDislike = async (topicId: number) => {
    await updateUserReaction(topicId, 'dislike');
    await incrementDislikes(topicId, tempUserId);
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
              dislikes: item.dislikes || 0,
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
                profile_image: item.users?.profile_image || '',
                user_grade: item.users?.user_grade || 0,
                created_at: item.users?.created_at || '',
                updated_at: item.users?.updated_at || ''
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
      handleDislike,
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