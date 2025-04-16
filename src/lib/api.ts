import supabase from './supabase';
import { VoteTopic, VoteTopicCreateData, VoteTopicUpdateData, ReactionStatus, UserInfo } from './types';
//import { formatDistanceToNow } from 'date-fns';
//import { ko } from 'date-fns/locale';

// 기본 사용자 정보 반환 함수
const getDefaultUserInfo = (): UserInfo => {
  return {
    id: '',
    email: '',
    password: '',
    username: '게스트',
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
    created_at: new Date().toISOString(),
    updated_at: [new Date().toISOString()],
    weekly_created: [],
    weekly_voted: [],
  };
};

// 사용자 정보를 가져오는 API 호출 함수
export const fetchUserInfo = async (userId: string): Promise<UserInfo> => {
  try {
    console.log('api: fetchUserInfo 호출됨, userId:', userId);
    
    if (!userId) {
      console.error('api: userId가 없음');
      return getDefaultUserInfo();
    }
    
    // users 테이블에서 사용자 정보 조회
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    console.log('api: 사용자 정보 조회 결과', { data, error });
    
    if (error) {
      console.error('api: 사용자 정보 조회 에러', error);
      return getDefaultUserInfo();
    }
    
    if (!data) {
      console.error('api: 사용자 정보 없음');
      return getDefaultUserInfo();
    }
    
    console.log('api: 사용자 정보 조회 성공', data);
    return data as UserInfo;
  } catch (error) {
    console.error('api: fetchUserInfo 예외 발생', error);
    return getDefaultUserInfo();
  }
};

// 투표 주제를 VoteTopic 타입으로 변환하는 유틸리티 함수
export const mapToVoteTopic = (topic: any, selectedOption?: number | null): VoteTopic => {
  try {
    console.log('mapToVoteTopic 호출됨, 주제 ID:', topic.id);
    
    // 사용자 정보 추출
    let username = '알 수 없음';
    let profile_Image = '';
    let user_grade = 0;
    let email = '';
    let created_at = topic.created_at || new Date().toISOString();
    let updated_at = topic.updated_at || created_at;
    
    if (topic.users) {
      username = topic.users.username || '알 수 없음';
      profile_Image = topic.users.profile_Image || '';
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
        profile_Image,
        user_grade,
        created_at,
        updated_at,
        weekly_created: topic.users.weekly_created || [],
        weekly_voted: topic.users.weekly_voted || [],
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
    
    // userVotes에 타입을 명시적으로 지정
    let userVotes: { topic_id: number; option_id: number }[] = [];
    
    // userId가 유효한 경우에만 사용자 투표 정보 조회
    if (userId && userId.trim() !== '') {
      try {
        // 사용자가 참여한 투표 정보 가져오기
        const { data, error } = await supabase
          .from('vote_results')
          .select('topic_id, option_id')
          .eq('user_id', userId);
        
        if (error) {
          console.error('사용자 투표 정보 조회 오류:', error);
          // 오류가 발생해도 계속 진행 (기본 투표 데이터는 조회)
        } else {
          userVotes = data || [];
          console.log('사용자 투표 정보:', userVotes.length, '개 조회됨');
        }
      } catch (err) {
        console.error('사용자 투표 정보 조회 중 예외 발생:', err);
        // 예외가 발생해도 계속 진행
      }
    } else {
      console.log('유효한 userId가 없어 사용자 투표 정보 조회를 건너뜁니다.');
    }
    
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
      const userVote = userVotes.find((vote: any) => vote.topic_id === topic.id);
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
        users:user_id (username, profile_Image, user_grade),
        options:vote_options (id, text, votes, image_class, image_url)
      `)
      .eq('id', topicId)
      .single();
    
    if (topicError) {
      if (topicError.code === 'PGRST116') return null;
      throw topicError;
    }
    
    // userId가 제공되었고 유효한 경우에만 사용자 투표 데이터 가져오기
    if (userId && userId.trim() !== '') {
      try {
        // 사용자 투표 데이터 가져오기 - votes 대신 vote_results 테이블 사용
        const { data: userVote, error: voteError } = await supabase
          .from('vote_results')
          .select('option_id')
          .eq('topic_id', topicId)
          .eq('user_id', userId)
          .maybeSingle();
        
        if (voteError && voteError.code !== 'PGRST116') {
          console.error('사용자 투표 조회 오류:', voteError);
          // 오류가 발생해도 기본 주제 데이터는 반환
        } else {
          const selectedOption = userVote ? userVote.option_id : null;
          return topic ? mapToVoteTopic(topic, selectedOption) : null;
        }
      } catch (err) {
        console.error('사용자 투표 조회 중 예외 발생:', err);
        // 예외가 발생해도 기본 주제 데이터는 반환
      }
    }
    
    return topic ? mapToVoteTopic(topic) : null;
  } catch (error) {
    console.error('투표 주제 조회 함수 오류:', error);
    throw error;
  }
};

// 이미지 URL로부터 스토리지 파일 경로 추출 (기존 함수 활용)
const getStoragePathFromUrl = (url: string, bucketName: string): string | null => {
  if (!url || !url.includes(`/storage/v1/object/public/${bucketName}/`)) {
    console.warn(`유효한 ${bucketName} 스토리지 URL이 아닙니다:`, url);
    return null;
  }
  try {
    const urlObject = new URL(url);
    const pathParts = urlObject.pathname.split('/');
    const bucketIndex = pathParts.findIndex(part => part === bucketName);
    if (bucketIndex !== -1 && bucketIndex + 1 < pathParts.length) {
      // URL 디코딩 추가 (파일 이름에 한글 등 포함 시)
      return decodeURIComponent(pathParts.slice(bucketIndex + 1).join('/'));
    }
  } catch (e) {
    console.error(`${bucketName} URL 파싱 오류:`, e);
  }
  return null;
};

// 스토리지에서 이미지 삭제 함수
export const deleteImageFromStorage = async (imageUrl: string): Promise<boolean> => {
  const filePath = getStoragePathFromUrl(imageUrl, 'voteimages'); // 이미지 버킷 이름 확인
  if (!filePath) {
    console.log('이미지 삭제 건너뜀: 유효한 경로 없음', imageUrl);
    return false; // 삭제 안 함
  }

  console.log(`이미지 스토리지 삭제 시도: voteimages/${filePath}`);
  try {
    const { error } = await supabase
      .storage
      .from('voteimages') // 이미지 버킷 이름 확인
      .remove([filePath]);

    if (error) {
      console.error(`이미지 삭제 오류 (voteimages/${filePath}):`, error);
      // 파일을 찾지 못한 경우는 성공으로 간주할 수 있음
      return error.message.includes('Not found');
    }
    console.log(`이미지 삭제 성공: voteimages/${filePath}`);
    return true;
  } catch (err) {
    console.error(`deleteImageFromStorage 함수 오류 (${filePath}):`, err);
    return false;
  }
};

/**
 * 동영상 URL을 받아 Supabase 스토리지 ('votevideos' 버킷)에서 해당 파일을 삭제합니다.
 * @param videoUrl 삭제할 동영상의 전체 URL
 * @returns 삭제 성공 또는 파일이 원래 없었으면 true, 실패하면 false
 */
export const deleteVideoFromStorage = async (videoUrl: string): Promise<boolean> => {
  // videoUrl에서 'votevideos' 버킷 내의 파일 경로 추출
  const filePath = getStoragePathFromUrl(videoUrl, 'votevideos');
  if (!filePath) {
    console.log('비디오 삭제 건너뜀: 유효한 경로 없음', videoUrl);
    return false; // 삭제 안 함
  }

  console.log(`비디오 스토리지 삭제 시도: votevideos/${filePath}`);
  try {
    // Supabase 스토리지에서 파일 삭제 실행
    const { error } = await supabase
      .storage
      .from('votevideos') // 비디오 버킷 이름 명시
      .remove([filePath]); // 파일 경로 배열 전달

    if (error) {
      console.error(`비디오 삭제 오류 (votevideos/${filePath}):`, error);
      // 파일을 찾지 못한 경우는 오류가 아닐 수 있으므로 true 반환 고려
      if (error.message.includes('Not found')) {
         console.warn(`삭제할 비디오(${filePath})를 스토리지에서 찾을 수 없음. 이미 삭제되었을 수 있습니다.`);
         return true; // 파일을 못 찾은 경우도 성공으로 처리
      }
      return false; // 그 외 오류는 실패로 처리
    }

    console.log(`비디오 삭제 성공: votevideos/${filePath}`);
    return true; // 삭제 성공
  } catch (err) {
    console.error(`deleteVideoFromStorage 함수 오류 (${filePath}):`, err);
    return false; // 예외 발생 시 실패
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
        users:user_id (username, profile_Image, user_grade),
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

// Supabase voteimages 폴더에 이미지를 업로드하고 URL을 반환하는 함수
export const uploadImageToStorage = async (imageBase64: string, folderName: string = 'voteimages'): Promise<string> => {
  if (!imageBase64 || !imageBase64.startsWith('data:')) {
    throw new Error('유효한 이미지 데이터가 아닙니다.');
  }

  try {
    // 현재 로그인 상태 확인
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error('세션 확인 중 오류 발생 또는 세션 없음:', sessionError || '세션 없음');
      throw new Error('로그인이 필요합니다. 이미지를 업로드할 수 없습니다.');
    }

    // Base64 데이터에서 필요한 부분 추출
    const matches = imageBase64.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error('이미지 데이터 형식이 올바르지 않습니다.');
    }

    const mime = matches[1];
    const base64Data = matches[2];
    const fileExt = mime.split('/')[1];
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${fileExt}`;
    
    // Base64를 바이너리 데이터로 변환
    const byteCharacters = atob(base64Data);
    const byteArrays = [];
    const sliceSize = 1024;
    
    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);
      const byteNumbers = new Array(slice.length);
      
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      
      byteArrays.push(new Uint8Array(byteNumbers));
    }
    
    // 이미지 데이터를 Blob으로 변환
    const blob = new Blob(byteArrays, { type: mime });
    
    console.log(`이미지 업로드 시도: ${fileName}, 크기: ${blob.size} bytes, 타입: ${mime}`);
    console.log('현재 세션 사용자:', session.user.email);
    
    // 스토리지에 업로드 - 명시적 contentType 설정
    const { error: uploadError } = await supabase
      .storage
      .from(folderName)
      .upload(fileName, blob, {
        contentType: mime,
        upsert: true
      });
    
    if (uploadError) {
      console.error('스토리지 업로드 오류:', uploadError);
      throw new Error(`이미지 업로드 실패: ${uploadError.message}`);
    }
    
    // 업로드된 이미지의 공개 URL 가져오기
    const { data: urlData } = supabase
      .storage
      .from(folderName)
      .getPublicUrl(fileName);
    
    if (!urlData || !urlData.publicUrl) {
      throw new Error('이미지 URL을 가져올 수 없습니다.');
    }
    
    console.log(`이미지 업로드 성공: ${urlData.publicUrl}`);
    return urlData.publicUrl;
  } catch (error) {
    console.error('이미지 업로드 처리 중 오류:', error);
    throw error;
  }
};

// Supabase votevideos 폴더에 동영상을 업로드하고 URL을 반환하는 함수
export const uploadVideoToStorage = async (videoFile: File, folderName: string = 'votevideos'): Promise<string> => {
  try {
    // 현재 로그인 상태 확인
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error('세션 확인 중 오류 발생 또는 세션 없음:', sessionError || '세션 없음');
      throw new Error('로그인이 필요합니다. 동영상을 업로드할 수 없습니다.');
    }

    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${videoFile.type.split('/')[1]}`;
    
    console.log(`동영상 업로드 시도: ${fileName}, 크기: ${videoFile.size} bytes, 타입: ${videoFile.type}`);
    console.log('현재 세션 사용자:', session.user.email);
    
    // 스토리지에 업로드 - 명시적 contentType 설정
    const { error: uploadError } = await supabase
      .storage
      .from(folderName)
      .upload(fileName, videoFile, {
        contentType: videoFile.type,
        upsert: true
      });
    
    if (uploadError) {
      console.error('스토리지 업로드 오류:', uploadError);
      throw new Error(`동영상 업로드 실패: ${uploadError.message}`);
    }
    
    // 업로드된 동영상의 공개 URL 가져오기
    const { data: urlData } = supabase
      .storage
      .from(folderName)
      .getPublicUrl(fileName);
    
    if (!urlData || !urlData.publicUrl) {
      throw new Error('동영상 URL을 가져올 수 없습니다.');
    }
    
    console.log(`동영상 업로드 성공: ${urlData.publicUrl}`);
    return urlData.publicUrl;
  } catch (error) {
    console.error('동영상 업로드 처리 중 오류:', error);
    throw error;
  }
};

export const getMyVotes = async (userId: string): Promise<VoteTopic[]> => {
  try {
    // userId가 비어있으면 빈 배열 반환
    if (!userId) {
      console.log('getMyVotes: userId가 비어있어 빈 배열 반환');
      return [];
    }
    
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
    console.log('createVoteTopic 함수 호출됨:', voteData);
    
    // 현재 로그인 상태 확인
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('로그인 세션이 없습니다. 투표 주제를 생성할 수 없습니다.');
    }
    
    // 관련 이미지가 Base64 형식인 경우 스토리지에 업로드
    let relatedImageUrl = voteData.related_image;
    if (relatedImageUrl) {
      if (relatedImageUrl.startsWith('data:')) {
        try {
          console.log('관련 이미지 업로드 시도...');
          relatedImageUrl = await uploadImageToStorage(relatedImageUrl);
          console.log('관련 이미지 업로드 성공:', relatedImageUrl);
        } catch (error) {
          console.error('관련 이미지 업로드 실패:', error);
          // 이미지 업로드 실패 시에도 계속 진행 (이미지 없이 투표 주제 생성)
          console.log('이미지 업로드 실패로 이미지 없이 투표 주제를 생성합니다.');
          relatedImageUrl = '';
        }
      } else if (!relatedImageUrl.includes('supabase.co/storage')) {
        // 유효하지 않은 이미지 URL인 경우
        console.log('유효하지 않은 이미지 URL입니다. 이미지 없이 투표 주제를 생성합니다.');
        relatedImageUrl = '';
      }
    }
    
    // 투표 주제 생성
    const { data: topic, error: topicError } = await supabase
      .from('vote_topics')
      .insert([{
        user_id: voteData.user_id,
        question: voteData.question,
        link: voteData.link,
        display_type: voteData.display_type,
        related_image: relatedImageUrl,
        expires_at: voteData.expires_at,
        visible: voteData.visible,
        vote_period: voteData.vote_period
      }])
      .select()
      .single();
    
    if (topicError) {
      console.error('투표 주제 생성 오류:', topicError);
      throw new Error(`투표 주제 생성 실패: ${topicError.message}`);
    }
    
    console.log('투표 주제 생성 성공:', topic);
    
    // 옵션 생성
    if (voteData.options && voteData.options.length > 0) {
      const optionsToInsert = [];
      
      for (const option of voteData.options) {
        let imageUrl = option.image_url;
        
        // 옵션 이미지가 Base64 형식인 경우 스토리지에 업로드
        if (imageUrl) {
          if (imageUrl.startsWith('data:')) {
            try {
              console.log(`옵션 이미지 업로드 시도: ${option.text}`);
              imageUrl = await uploadImageToStorage(imageUrl);
              console.log(`옵션 이미지 업로드 성공: ${imageUrl}`);
            } catch (error) {
              console.error(`옵션 이미지 업로드 실패: ${option.text}`, error);
              // 이미지 업로드 실패 시에도 계속 진행 (이미지 없이 옵션 생성)
              console.log(`옵션 이미지 업로드 실패로 이미지 없이 옵션을 생성합니다: ${option.text}`);
              imageUrl = '';
            }
          } else if (!imageUrl.includes('supabase.co/storage')) {
            // 유효하지 않은 이미지 URL인 경우
            console.log(`유효하지 않은 이미지 URL입니다. 이미지 없이 옵션을 생성합니다: ${option.text}`);
            imageUrl = '';
          }
        }
        
        optionsToInsert.push({
          topic_id: topic.id,
          text: option.text,
          image_class: option.image_class,
          image_url: imageUrl
        });
      }
      
      const { error: optionsError } = await supabase
        .from('vote_options')
        .insert(optionsToInsert);
      
      if (optionsError) {
        console.error('옵션 생성 오류:', optionsError);
        throw new Error(`옵션 생성 실패: ${optionsError.message}`);
      }
      
      console.log('옵션 생성 성공:', optionsToInsert.length, '개');
    }
    
    // 생성된 투표 주제 반환
    const createdTopic = await getVoteTopicById(topic.id);
    if (!createdTopic) {
      throw new Error('생성된 투표 주제를 찾을 수 없습니다.');
    }
    
    console.log('생성된 투표 주제 반환:', createdTopic);
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
    // 사용자의 현재 좋아요 상태 확인
    const { data: reaction, error: reactionError } = await supabase
      .from('vote_results')
      .select('like_kind')
      .eq('user_id', userId)
      .eq('topic_id', topicId)
      .maybeSingle();
    
    if (reactionError && reactionError.code !== 'PGRST116') {
      console.error('좋아요 상태 확인 오류:', reactionError);
      throw reactionError;
    }
    
    const isLiked = reaction?.like_kind === 'like';
    
    // 좋아요 토글 처리 - 있으면 취소, 없으면 추가
    if (isLiked) {
      // 좋아요 취소
      const { error: unlikeError } = await supabase.rpc('toggle_like', {
        p_topic_id: topicId,
        p_user_id: userId,
        p_operation: 'unlike'
      });
      
      if (unlikeError) {
        console.error('좋아요 취소 오류:', unlikeError);
        throw unlikeError;
      }
    } else {
      // 좋아요 추가
      const { error: likeError } = await supabase.rpc('toggle_like', {
        p_topic_id: topicId,
        p_user_id: userId,
        p_operation: 'like'
      });
      
      if (likeError) {
        console.error('좋아요 추가 오류:', likeError);
        throw likeError;
      }
    }
  } catch (error) {
    console.error('incrementLikes 함수 오류:', error);
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
      .is('like_kind', null);  // 좋아요가 없는 레코드만 업데이트
    
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
      liked: data?.like_kind === 'like'
    };
  } catch (error) {
    console.error('사용자 반응 상태 확인 중 오류:', error);
    return { liked: false };
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

//vote_ranks 테이블 업데이트  >> supabasecron_job으로 처리
// export const updateRankings = async (): Promise<void> => {
//   try {
//     const { error } = await supabase.rpc('update_vote_rankings');
//     if (error) throw error;
//   } catch (error) {
//     console.error('순위 업데이트 중 오류:', error);
//     throw error;
//   }
// };

// vote_topics의 related_image 필드를 업데이트하는 함수
export const updateRelatedImage = async (topicId: number, imageUrl: string | null): Promise<void> => {
  try {
    const { error } = await supabase
      .from('vote_topics')
      .update({ related_image: imageUrl })
      .eq('id', topicId);

    if (error) throw error;
  } catch (error) {
    console.error('updateRelatedImage 함수 오류:', error);
    throw error;
  }
};

// vote_options의 image_url 필드를 업데이트하는 함수
export const updateOptionImageUrl = async (optionId: number, imageUrl: string | null): Promise<void> => {
  try {
    const { error } = await supabase
      .from('vote_options')
      .update({ image_url: imageUrl })
      .eq('id', optionId);

    if (error) throw error;
  } catch (error) {
    console.error('updateOptionImageUrl 함수 오류:', error);
    throw error;
  }
}; 