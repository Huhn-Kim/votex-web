import supabase from './supabase';
import { VoteTopic, VoteTopicCreateData, VoteTopicUpdateData, ReactionStatus } from './types';
//import { formatDistanceToNow } from 'date-fns';
//import { ko } from 'date-fns/locale';

// 투표 주제를 VoteTopic 타입으로 변환하는 유틸리티 함수
export const mapToVoteTopic = (topic: any, selectedOption?: number | null): VoteTopic => {
  try {
    console.log('mapToVoteTopic 호출됨, 주제 ID:', topic.id);
    
    // 사용자 정보 추출
    let username = '알 수 없음';
    let profile_image = '';
    let user_grade = 0;
    let email = '';
    let created_at = topic.created_at || new Date().toISOString();
    let updated_at = topic.updated_at || created_at;
    
    if (topic.users) {
      username = topic.users.username || '알 수 없음';
      profile_image = topic.users.profile_image || '';
      user_grade = topic.users.user_grade || 0;
      email = topic.users.email || '';
      created_at = topic.users.created_at || created_at;
      updated_at = topic.users.updated_at || updated_at;
    }
    
    // 옵션 정보 추출 및 변환
    const options = (topic.options || []).map((option: any) => ({
      id: option.id,
      text: option.text || '',
      votes: option.votes || 0,
      image_class: option.image_class || '',
      image_url: option.image_url || '',
      topic_id: topic.id
    }));
    
    // 만료 시간 계산
    const expiresAt = topic.expires_at || '';
    const now = new Date();
    const expiryDate = new Date(expiresAt);
    const isExpired = expiryDate < now;
    
    return {
      id: topic.id,
      user_id: topic.user_id,
      question: topic.question || '제목 없음',
      link: topic.link || '',
      related_image: topic.related_image || '',
      total_votes: topic.total_votes || 0,
      today_votes: topic.today_votes || 0,
      hourly_votes: topic.hourly_votes || 0,
      comments: topic.comments || 0,
      likes: topic.likes || 0,
      dislikes: topic.dislikes || 0,
      type: topic.type || 'poll',
      display_type: topic.display_type || 'text',
      created_at: created_at,
      expires_at: expiresAt,
      is_expired: isExpired,
      visible: topic.visible ?? true,
      users: {
        id: topic.user_id,
        username,
        email,
        profile_image,
        user_grade,
        created_at,
        updated_at
      },
      options: options,
      selected_option: selectedOption,
      vote_period: topic.vote_period || '1주일',
    };
  } catch (error) {
    console.error('투표 주제 변환 오류:', error);
    throw new Error('투표 데이터 변환 중 오류가 발생했습니다.');
  }
};

// 투표 주제 관련 함수
export const getVoteTopics = async (userId?: string) => {
  try {
    console.log('getVoteTopics 호출됨, userId:', userId);
    
    // 사용자가 참여한 투표 정보 가져오기
    const { data: userVotes, error: votesError } = await supabase
      .from('vote_results')
      .select('topic_id, option_id')
      .eq('user_id', userId);
    
    if (votesError) {
      console.error('사용자 투표 정보 조회 오류:', votesError);
      throw votesError;
    }
    
    console.log('사용자 투표 정보:', userVotes?.length || 0, '개 조회됨');
    
    // 투표 주제와 관련 데이터를 가져옵니다
    const { data, error } = await supabase
      .from('vote_topics')
      .select(`
        *,
        users:user_id (*),
        options:vote_options (*)
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('투표 주제 조회 오류:', error);
      throw error;
    }
    
    console.log('투표 주제:', data?.length || 0, '개 조회됨');
    
    // 데이터를 VoteTopic 형식으로 변환하고 사용자 선택 정보 추가
    const mappedTopics = data.map((topic: any) => {
      const userVote = userVotes?.find(vote => vote.topic_id === topic.id);
      const selectedOption = userVote ? userVote.option_id : null;
      return mapToVoteTopic(topic, selectedOption);
    });
    
    console.log('변환된 투표 주제:', mappedTopics.length, '개');
    return mappedTopics;
  } catch (error) {
    console.error('getVoteTopics 함수 오류:', error);
    throw new Error('투표 데이터를 가져오는 중 오류가 발생했습니다.');
  }
};

export const getVoteTopicById = async (topicId: number, userId?: string) => {
  try {
    // 투표 주제 데이터 가져오기
    const { data: topic, error: topicError } = await supabase
      .from('vote_topics')
      .select(`
        *,
        users:user_id (username, profile_image, user_grade),
        options:vote_options (id, text, votes, image_class, image_url)
      `)
      .eq('id', topicId)
      .single();
    
    if (topicError) {
      if (topicError.code === 'PGRST116') return null;
      throw topicError;
    }
    
    if (userId) {
    // 사용자 투표 데이터 가져오기
    const { data: userVote, error: voteError } = await supabase
      .from('votes')
      .select('option_id')
      .eq('topic_id', topicId)
        .eq('user_id', userId)
      .maybeSingle();
    
      if (voteError && voteError.code !== 'PGRST116') throw voteError;
    
    const selectedOption = userVote ? userVote.option_id : null;
    return topic ? mapToVoteTopic(topic, selectedOption) : null;
    }
    
    return topic ? mapToVoteTopic(topic) : null;
  } catch (error) {
    console.error('투표 주제 조회 함수 오류:', error);
    throw error;
  }
};

// URL에서 파일 경로 추출 함수
const extractFilePathFromUrl = (url: string): string | null => {
  if (!url) return null;
  
  try {
    if (url.startsWith('data:')) return null;
    
    const urlObj = new URL(url);
    const pathSegments = urlObj.pathname.split('/');
    
    if (pathSegments.length >= 2) {
      const bucket = pathSegments[pathSegments.length - 2];
      const fileName = pathSegments[pathSegments.length - 1];
      return `${bucket}/${fileName}`;
    }
    return null;
  } catch (error) {
    console.error('URL 파싱 오류:', error);
    return null;
  }
};

// 스토리지에서 이미지 삭제 함수
export const deleteImageFromStorage = async (imageUrl: string): Promise<boolean> => {
  if (!imageUrl || imageUrl.startsWith('data:')) return true;
  
  try {
    const filePath = extractFilePathFromUrl(imageUrl);
    if (!filePath) {
      console.log('유효한 파일 경로를 추출할 수 없습니다:', imageUrl);
      return false;
    }
    
    const [bucket, fileName] = filePath.split('/');
    
    const { error } = await supabase
      .storage
      .from(bucket)
      .remove([fileName]);
    
    if (error) {
      console.error('이미지 삭제 오류:', error);
      return false;
    }
    
    console.log('이미지 삭제 성공:', fileName);
    return true;
  } catch (error) {
    console.error('이미지 삭제 중 오류 발생:', error);
    return false;
  }
};

// 투표 주제 수정
export const updateVoteTopic = async (topicData: VoteTopicUpdateData): Promise<VoteTopic> => {
  try {
    console.log('updateVoteTopic 호출됨, 데이터:', topicData);

    // 1. vote_topics 테이블 업데이트 (options 제외)
    const { error: topicError } = await supabase
      .from('vote_topics')
      .update({
        question: topicData.question,
        link: topicData.link,
        display_type: topicData.display_type,
        expires_at: topicData.expires_at,
        visible: topicData.visible,
        related_image: topicData.related_image,
        vote_period: topicData.vote_period,
      })
      .eq('id', topicData.id)

    if (topicError) {
      console.error('투표 주제 업데이트 오류:', topicError);
      throw topicError;
    }

    // 2. vote_options 테이블 업데이트
    if (topicData.options && topicData.options.length > 0) {
      for (const option of topicData.options) {
        const { error: optionError } = await supabase
          .from('vote_options')
          .update({
            text: option.text,
            image_url: option.image_url || '',
            image_class: option.image_class || ''
          })
          .eq('id', option.id)
          .eq('topic_id', topicData.id);

        if (optionError) {
          console.error('옵션 업데이트 오류:', optionError);
          throw optionError;
        }
      }
    }

    // 3. 업데이트된 전체 데이터 조회
    const { data: finalData, error: finalError } = await supabase
      .from('vote_topics')
      .select(`
        *,
        users:user_id (username, profile_image, user_grade),
        options:vote_options (id, text, votes, image_class, image_url)
      `)
      .eq('id', topicData.id)
      .single();

    if (finalError) {
      console.error('최종 데이터 조회 오류:', finalError);
      throw finalError;
    }

    console.log('DB 업데이트 결과:', finalData);
    return mapToVoteTopic(finalData);
  } catch (error) {
    console.error('투표 주제 업데이트 중 오류 발생:', error);
    throw error;
  }
};

// Supabase에 이미지를 업로드하고 URL을 반환하는 함수
export const uploadImageToStorage = async (imageBase64: string, folderName: string = 'voteimages'): Promise<string> => {
  if (!imageBase64 || !imageBase64.startsWith('data:')) {
    throw new Error('유효한 이미지 데이터가 아닙니다.');
  }

  try {
    const matches = imageBase64.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error('이미지 데이터 형식이 올바르지 않습니다.');
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    const fileExt = mimeType.split('/')[1];
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${fileExt}`;
    
    const byteCharacters = atob(base64Data);
    const byteArrays = [];
    
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    
    const blob = new Blob(byteArrays, { type: mimeType });

    if (blob.size > 1024 * 1024) {
      console.log('이미지 크기가 너무 큽니다. Base64로 직접 사용합니다.');
      return imageBase64;
    }
    
      const { error } = await supabase
        .storage
        .from(folderName)
        .upload(fileName, blob, {
          contentType: mimeType,
          upsert: true
        });
        
        if (error) {
      console.error('스토리지 업로드 오류:', error);
          return imageBase64;
        }
        
      const { data: urlData } = supabase
        .storage
        .from(folderName)
        .getPublicUrl(fileName);
      
      return urlData.publicUrl;
  } catch (error) {
    console.error('이미지 업로드 처리 중 오류:', error);
      return imageBase64;
    }
};

export const getMyVotes = async (userId: string): Promise<VoteTopic[]> => {
  try {
    // 사용자가 생성하거나 참여한 투표 가져오기
    const { data: voteResults, error: votesError } = await supabase
      .from('vote_results')
      .select('topic_id, option_id')
      .eq('user_id', userId);
    
    if (votesError) throw votesError;
    
    // 사용자의 투표 주제 ID 목록 생성
    const topicIds = voteResults?.map(vote => vote.topic_id) || [];
    
    // 투표 주제와 관련 데이터를 가져옵니다
    const { data, error } = await supabase
      .from('vote_topics')
      .select(`
        *,
        users:user_id (*),
        options:vote_options (*)
      `)
      .or(`user_id.eq.${userId},id.in.(${topicIds.join(',')})`)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // 데이터를 VoteTopic 형식으로 변환하고 사용자 선택 정보 추가
    return data.map((topic: any) => {
      const userVote = voteResults?.find(vote => vote.topic_id === topic.id);
      const selectedOption = userVote ? userVote.option_id : null;
      return mapToVoteTopic(topic, selectedOption);
    });
    } catch (error) {
    console.error('getMyVotes 함수 오류:', error);
      throw error;
  }
};

export const createVoteTopic = async (voteData: VoteTopicCreateData): Promise<VoteTopic> => {
  try {
    // 투표 주제 생성
    const { data: topic, error: topicError } = await supabase
      .from('vote_topics')
      .insert([{
        user_id: voteData.user_id,
        question: voteData.question,
        link: voteData.link,
        display_type: voteData.display_type,
        related_image: voteData.related_image,
        expires_at: voteData.expires_at,
        visible: voteData.visible,
        vote_period: voteData.vote_period
      }])
      .select()
      .single();
    
    if (topicError) throw topicError;
    
    // 옵션 생성
    if (voteData.options && voteData.options.length > 0) {
      const optionsToInsert = voteData.options.map(option => ({
        topic_id: topic.id,
        text: option.text,
        image_class: option.image_class,
        image_url: option.image_url
      }));
      
      const { error: optionsError } = await supabase
    .from('vote_options')
        .insert(optionsToInsert);
      
      if (optionsError) throw optionsError;
    }
    
    // 생성된 투표 주제 반환
    const createdTopic = await getVoteTopicById(topic.id);
    if (!createdTopic) throw new Error('생성된 투표 주제를 찾을 수 없습니다.');
    return createdTopic;
  } catch (error) {
    console.error('createVoteTopic 함수 오류:', error);
    throw error;
  }
};

export const voteForOption = async (userId: string, topicId: number, optionId: number): Promise<void> => {
  try {
    // 투표 결과 생성
    const { error: voteError } = await supabase
      .from('vote_results')
      .insert([{
        user_id: userId,
        topic_id: topicId,
        option_id: optionId,
        like_kind: 0  // 초기값은 좋아요/싫어요 없음
      }]);
    
    if (voteError) throw voteError;
    
    // 옵션의 투표 수 증가
    const { error: updateError } = await supabase.rpc('increment_vote_count', {
      p_option_id: optionId,
      p_topic_id: topicId
    });
    
    if (updateError) throw updateError;
  } catch (error) {
    console.error('voteForOption 함수 오류:', error);
    throw error;
  }
};

// api.ts 또는 VoteContext.tsx에서
export const deleteVoteTopic = async (topicId: number) => {
  try {
    // 먼저 vote_ranks 테이블에서 관련 데이터 삭제
    await supabase
      .from('vote_ranks')
      .delete()
      .eq('topic_id', topicId);

    // 그 다음 vote_topics 테이블에서 삭제
    const { error } = await supabase
      .from('vote_topics')
      .delete()
      .eq('id', topicId);

    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('deleteVoteTopic 함수 오류:', error);
    throw error;
  }
};

// 투표 전체를 삭제하지 않고 특정 옵션만 삭제하고 싶을 때
// 투표 수정 과정에서 일부 옵션만 제거하고 싶을 때
export const deleteVoteOption = async (optionId: number): Promise<void> => {
  try {
    const { error } = await supabase
      .from('vote_options')
      .delete()
      .eq('id', optionId);
    
    if (error) throw error;
  } catch (error) {
    console.error('deleteVoteOption 함수 오류:', error);
    throw error;
  }
};

export const addVoteOption = async (topicId: number, optionText: string): Promise<void> => {
  try {
    const { error } = await supabase
    .from('vote_options')
      .insert([{
        topic_id: topicId,
        text: optionText
      }]);
  
  if (error) throw error;
  } catch (error) {
    console.error('addVoteOption 함수 오류:', error);
    throw error;
  }
};

export const incrementLikes = async (topicId: number, userId: string): Promise<void> => {
  try {
      
    // vote_topics 테이블의 likes 카운트 증가 (SQL 프로시저 호출)
    const { error: likeError } = await supabase.rpc('handle_like', {
      p_topic_id: topicId, p_user_id: userId
    });
    
    if (likeError) throw likeError;
  } catch (error) {
    console.error('incrementLikes 함수 오류:', error);
    throw error;
  }
};

export const incrementDislikes = async (topicId: number, userId: string): Promise<void> => {
  try {
     
    // vote_topics 테이블의 dislikes 카운트 증가 (SQL 프로시저 호출)
    const { error: dislikeError } = await supabase.rpc('handle_dislike', {
      p_topic_id: topicId, p_user_id: userId
    });
    
    if (dislikeError) throw dislikeError;
  } catch (error) {
    console.error('incrementDislikes 함수 오류:', error);
    throw error;
  }
};

export const updateUserVote = async (userId: string, topicId: number, optionId: number): Promise<void> => {
  try {
    const { error } = await supabase
      .from('vote_results')
      .update({ option_id: optionId })
      .eq('user_id', userId)
      .eq('topic_id', topicId)
      .is('like_kind', null);  // 좋아요/싫어요가 없는 레코드만 업데이트
    
    if (error) throw error;
  } catch (error) {
    console.error('updateUserVote 함수 오류:', error);
    throw error;
  }
};

export const updateVoteVisibility = async (topicId: number, visible: boolean): Promise<void> => {
  try {
    const { error } = await supabase
      .from('vote_topics')
      .update({ visible })
      .eq('id', topicId);
    
    if (error) throw error;
  } catch (error) {
    console.error('updateVoteVisibility 함수 오류:', error);
    throw error;
  }
};

export const getUserReactionStatus = async (userId: string, topicId: number): Promise<ReactionStatus> => {
  try {
      const { data, error } = await supabase
      .from('vote_results')
      .select('like_kind')
      .eq('user_id', userId)
      .eq('topic_id', topicId)
      .maybeSingle();
    
    if (error) throw error;
    
    return {
      liked: data?.like_kind === 'like',
      disliked: data?.like_kind === 'dislike'
    };
  } catch (error) {
    console.error('사용자 반응 상태 확인 중 오류:', error);
    return { liked: false, disliked: false };
  }
};

export const getRankedVotes = async (criteria: string) => {
  try {
    const { data, error } = await supabase
      .from('vote_topics')
      .select(`
        *,
        vote_ranks (*),
        options:vote_options (
          id,
          topic_id,
          text,
          image_url,
          votes
        )
      `)
      .eq('visible', true)
      .order(criteria === 'total' ? 'total_votes' : 
             criteria === 'today' ? 'today_votes' : 
             criteria === 'hourly' ? 'hourly_votes' : 
             'comments', { ascending: false });

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error fetching ranked votes:', error);
    throw error;
  }
};

export const updateRankings = async (): Promise<void> => {
  try {
    const { error } = await supabase.rpc('update_vote_rankings');
    if (error) throw error;
  } catch (error) {
    console.error('순위 업데이트 중 오류:', error);
    throw error;
  }
}; 