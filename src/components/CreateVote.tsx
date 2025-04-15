import React, { useState, forwardRef, useEffect, useRef, useCallback } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import styles from '../styles/CreateVote.module.css';
import { useVoteContext } from '../context/VoteContext';
import { useNavigate, useParams } from 'react-router-dom';
import { VoteTopic, VoteOption } from '../lib/types';
import { getVoteTopicById, uploadImageToStorage, uploadVideoToStorage, deleteVideoFromStorage, deleteImageFromStorage, updateRelatedImage, updateOptionImageUrl } from '../lib/api';
import { FaUndo, FaRedo, FaSearchMinus, FaSearchPlus, FaSyncAlt } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import LoadingOverlay from './LoadingOverlay';
import supabase from '../lib/supabase'; // Supabase 클라이언트 import
import ConfirmModal from './ConfirmModal';

interface CreateVoteProps {
  isEditMode?: boolean;
  voteId?: number;
}

interface Option {
  text: string;
  image_url?: string;
  id?: number;
  votes?: number;
  image_class?: string;
  gender_stats?: { male: number, female: number };
  region_stats?: {
    seoul: number;
    gyeonggi: number;
    incheon: number;
    busan: number;
    daegu: number;
    daejeon: number;
    gwangju: number;
    ulsan: number;
    sejong: number;
    gangwon: number;
    chungnam: number;
    chungbuk: number;
    jeonnam: number;
    jeonbuk: number;
    gyeongsang: number;
    gyeongnam: number;
    jeolla: number;
    jeju: number;
  };
  age_stats?: {
    age10to19: number;
    age20to29: number;
    age30to39: number;
    age40to49: number;
    age50to59: number;  
    age60to69: number;
    age70to79: number;
    age80plus: number;
  };
  topic_id?: number;
}


const CreateVote: React.FC<CreateVoteProps> = ({ isEditMode = false, voteId }) => {
  const { id } = useParams<{ id: string }>();
  const currentVoteId = voteId || (id ? parseInt(id) : undefined);
  const [question, setQuestion] = useState('');
  const [sourceLink, setSourceLink] = useState('');
  const [options, setOptions] = useState<Option[]>([
    { text: '' },
    { text: '' }
  ]);
  const [expiryDays, setExpiryDays] = useState(7);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('1주일');
  const [optionType, setOptionType] = useState<'text' | 'image' | 'video'>('text');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [originalVote, setOriginalVote] = useState<VoteTopic | null>(null);
  const [questionImage, setQuestionImage] = useState<string | null>(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  
  // 이미지 편집 관련 상태
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [originalImageSrc, setOriginalImageSrc] = useState<string | null>(null);
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null);
  
  // 네비게이션 타이머 참조 저장
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // 편집 상태 저장을 위한 상태 추가
  const [editHistory, setEditHistory] = useState<{
    [key: string]: {
      imgPosition: { x: number, y: number };
      scale: number;
      rotate: number;
      originalImage: string;
    }
  }>({});
  
  // 추가할 상태들
  const [progress, setProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState('');
  
  // Context에서 투표 추가 및 업데이트 함수 가져오기
  const { addVote, updateVoteTopic, addOption: addVoteOption } = useVoteContext();
  
  // 페이지 이동을 위한 navigate 함수
  const navigate = useNavigate();
  
  // 로그인 상태 확인
  const { user } = useAuth();
  const isGuest = !user;
  
  // 커스텀 입력 컴포넌트
  const CustomInput = forwardRef<HTMLButtonElement, { value?: string; onClick?: () => void }>(
    ({ value, onClick }, ref) => (
      <button
        type="button"
        className={`${styles['period-btn']} ${value || selectedPeriod === '특정일' ? styles.selected : ''} ${value ? styles['date-selected'] : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          
          // 달력 버튼 클릭 시 네비게이션 타이머 초기화
          if (navigationTimeoutRef.current) {
            clearTimeout(navigationTimeoutRef.current);
            navigationTimeoutRef.current = null;
          }
          
          // 달력이 열리는 상태 설정
          setIsDatePickerOpen(true);
          
          onClick && onClick();
        }}
        ref={ref}
        style={{ width: '100%' }}
      >
        {value || '특정일'}
      </button>
    )
  );

  CustomInput.displayName = 'CustomInput';

  // 투표 데이터 불러오기 함수
  const loadVoteData = async (voteId: number) => {
    try {
      // 로딩 상태 제거
      setError(null);
      
      // 투표 데이터 가져오기
      const voteData = await getVoteTopicById(voteId);
      if (!voteData) {
        throw new Error('투표 데이터를 찾을 수 없습니다.');
      }
      setOriginalVote(voteData);
      
      // 폼 데이터 설정
      setQuestion(voteData.question);
      setSourceLink(voteData.link || '');
      setOptionType(voteData.display_type as 'text' | 'image');
      
      // 질문 이미지 설정
      if (voteData.related_image) {
        setQuestionImage(voteData.related_image);
      }
      
      // 옵션 데이터 설정
      const voteOptions = voteData.options.map(option => ({
        text: option.text,
        image_url: option.image_url || '',
        id: option.id,
        votes: option.votes || 0,
        image_class: option.image_class || ''
      }));
      setOptions(voteOptions);
      
    } catch (err: any) {
      console.error('투표 데이터를 불러오는 중 오류 발생:', err);
      setError(err.message || '투표 데이터를 불러오는 중 오류가 발생했습니다.');
    }
  };
  
  // 수정 모드일 때 투표 데이터 불러오기
  useEffect(() => {
    if (isEditMode && currentVoteId) {
      loadVoteData(currentVoteId);
    }
  }, [isEditMode, currentVoteId]);

  const handleOptionChange = (index: number, text: string) => {
    const newOptions = [...options];
    newOptions[index].text = text;
    setOptions(newOptions);
  };

  const addOption = () => {
    if (options.length < 5) {
      setOptions([...options, { text: '' }]);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = [...options];
      newOptions.splice(index, 1);
      setOptions(newOptions);
    }
  };

  const handlePeriodSelect = (period: string) => {
    // 기간 버튼 클릭 시 네비게이션 타이머 초기화
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
      navigationTimeoutRef.current = null;
    }
    
    setSelectedPeriod(period);
    if (period === '특정일') {
      setSelectedDate(new Date());
      // 특정일 선택 시 기본 만료일을 7일로 설정
      setExpiryDays(7);
    } else {
      setSelectedDate(null);
      
      // 기간에 따라 만료일 계산 (1일 추가)
      if (period === '1일') {
        setExpiryDays(1);
      } else if (period === '3일') {
        setExpiryDays(3);
      } else if (period === '1주일') {
        setExpiryDays(7);
      } else if (period === '1개월') {
        setExpiryDays(30);
      }
    }
  };

  const handleDateChange = (date: Date | null, event: React.SyntheticEvent<any, Event> | undefined) => {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    
    // 날짜 선택 시 네비게이션 타이머 초기화
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
      navigationTimeoutRef.current = null;
    }
    
    setSelectedDate(date);
    if (date) {
      // 선택한 날짜와 현재 날짜의 차이를 계산하여 만료일 설정
      const now = new Date();
      const diffTime = date.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // 최소 1일 이상으로 설정
      const days = Math.max(1, diffDays);
      setExpiryDays(days);
      
      // 선택한 날짜를 표시하기 위해 selectedPeriod 업데이트
      setSelectedPeriod('특정일');
    }
    
    // 달력이 닫히는 상태 설정
    setIsDatePickerOpen(false);
  };

  // 이미지 편집기 상태 초기화 함수 추가
  const resetImageEditor = () => {
    setEditingImageIndex(null);
    setImageSrc(null);
    setOriginalImageSrc(null);
    setShowImageEditor(false);
  };

  // 이미지/비디오 삭제 핸들러
  const handleImageDelete = async (mediaUrl: string, optionIndex?: number) => {
    try {
      setLoading(true);
      
      // 원래 API URL인지 Base64/Blob인지 확인
      const isApiUrl = mediaUrl.startsWith('http') || mediaUrl.startsWith('https');
      const isVideo = mediaUrl.match(/\.(mp4|webm|ogg)$/) || mediaUrl.startsWith('blob:');
      
      // API URL이라면 스토리지에서 삭제
      if (isApiUrl) {
        if (isVideo) {
          console.log('비디오 삭제 시도:', mediaUrl);
          await deleteVideoFromStorage(mediaUrl);
        } else {
          console.log('이미지 삭제 시도:', mediaUrl);
          await deleteImageFromStorage(mediaUrl);
        }
      }
      
      // 옵션 이미지인 경우
      if (optionIndex !== undefined) {
        // 옵션 이미지 삭제 처리
        const newOptions = [...options];
        
        if (isApiUrl && isEditMode && currentVoteId) {
          // 수정 모드에서는 DB도 업데이트
          const option = newOptions[optionIndex];
          if (option.id) {
            await updateOptionImageUrl(option.id, null);
          }
        }
        
        newOptions[optionIndex].image_url = '';
        setOptions(newOptions);
      } else {
        // 질문 이미지/비디오 삭제 처리
        if (isApiUrl && isEditMode && currentVoteId) {
          // 수정 모드에서는 DB도 업데이트
          await updateRelatedImage(currentVoteId, null);
        }
        
        setQuestionImage(null);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('이미지/비디오 삭제 중 오류:', error);
      setError('이미지/비디오 삭제 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  // handleMediaSelect 함수 수정
  const handleMediaSelect = async (event: React.ChangeEvent<HTMLInputElement>, optionIndex?: number) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 파일 선택 후 input value 초기화 - 동일한 파일 선택 가능하도록
    event.target.value = '';

    // 네비게이션 타이머 초기화
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
      navigationTimeoutRef.current = null;
    }

    // 에러 메시지 초기화
    setError(null);

    try {
      // 로딩 상태 설정
      setLoading(true);

      if (file.type.startsWith('image/')) {
        // 이미지 처리
        const reader = new FileReader();
        reader.onloadend = () => {
          // 명시적으로 string 타입 체크
          const result = reader.result;
          if (result && typeof result === 'string') {
            // 먼저 편집기 상태 초기화
            resetImageEditor();
            
            setTimeout(() => {
              if (optionIndex !== undefined) {
                // 옵션 이미지인 경우
                setEditingImageIndex(optionIndex);
                setOriginalImageSrc(result);
                setImageSrc(result);
                setShowImageEditor(true);
              } else {
                // 질문 이미지인 경우
                setEditingImageIndex(-1);
                setOriginalImageSrc(result);
                setImageSrc(result);
                setShowImageEditor(true);
              }
            }, 100);
          }
          setLoading(false);
        };
        reader.onerror = () => {
          setError('파일을 읽는 중 오류가 발생했습니다.');
          setLoading(false);
        };
        reader.readAsDataURL(file);
      } else if (file.type.startsWith('video/')) {
        const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
        if (file.size > MAX_VIDEO_SIZE) {
          setLoading(false);
          setShowSizeWarningModal(true); // 모달 표시
          return;
        }
        // 동영상 선택 시 URL 생성
        const videoUrl = URL.createObjectURL(file);
        if (optionIndex !== undefined) {
          // 옵션 동영상인 경우
          const newOptions = [...options];
          newOptions[optionIndex].image_url = videoUrl;
          setOptions(newOptions);
        } else {
          // 질문 동영상인 경우
          setQuestionImage(videoUrl);
        }
        setLoading(false);
      }
    } catch (err) {
      console.error('미디어 처리 중 오류:', err);
      setError('미디어를 처리하는 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  // 이미지 에디터 열기
  const openImageEditor = async (index: number, imageData: string) => {
    console.log('이미지 에디터 열기', index);
    
    try {
      // 외부 이미지(URL)인 경우
      if (imageData.startsWith('http')) {
        // 로딩 상태 설정
        setLoading(true);
        
        // 이미지를 Base64로 변환
        const response = await fetch(imageData);
        const blob = await response.blob();
        
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            setEditingImageIndex(index);
            setOriginalImageSrc(imageData);  // 원본 URL 저장
            setImageSrc(reader.result);      // Base64 데이터 설정
            setShowImageEditor(true);
            setLoading(false);
          }
        };
        reader.readAsDataURL(blob);
      } else {
        // Base64 이미지인 경우 기존 로직대로 처리
        setEditingImageIndex(index);
        setOriginalImageSrc(imageData);
        setImageSrc(imageData);
        setShowImageEditor(true);
      }
    } catch (error) {
      console.error('이미지 로드 중 오류:', error);
      setError('이미지를 로드하는 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  // 이미지 에디터 모달 컴포넌트
  const ImageEditorModal = ({
    isOpen,
    onClose,
    image,
    onSave,
    editingImageIndex,
    optionType
  }: {
    isOpen: boolean;
    onClose: () => void;
    image: string | null;
    onSave: (croppedImage: string) => void;
    editingImageIndex: number;
    optionType: string;
  }) => {
    const [imgSrc, setImgSrc] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [scale, setScale] = useState(1);
    const [rotate, setRotate] = useState(0);
    const [imgPosition, setImgPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [pinchStart, setPinchStart] = useState(0);
    const [pinchScale, setPinchScale] = useState(1);

    const imageRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // 이미지 로드 시 상태 초기화
    useEffect(() => {
      if (image && isOpen) {
        setImgSrc(image);
        setIsLoading(true);
        
        // 편집 기록이 있는지 확인
        const key = editingImageIndex === -1 ? 'question' : `option-${editingImageIndex}`;
        const history = editHistory[key];
        
        // 원본 이미지를 비교하여 사용
        if (history && history.originalImage === originalImageSrc) {
          // 편집 기록이 있고 원본 이미지가 같으면 복원
          setScale(history.scale);
          setRotate(history.rotate);
          setImgPosition(history.imgPosition);
          console.log('편집 기록 복원:', key, history);
          
          // 로딩 완료 처리
          setTimeout(() => {
            setIsLoading(false);
          }, 200);
        } else {
          // 없으면 초기화
          setScale(1);
          setRotate(0);
          setImgPosition({ x: 0, y: 0 });
        }
      } else {
        setImgSrc(null);
      }
    }, [image, isOpen, editHistory, editingImageIndex, originalImageSrc]);

    // 이미지 로드 완료 시 처리
    const handleImageLoad = useCallback(() => {
      // 편집 기록이 있는 경우 fit 기능을 적용하지 않음
      const key = editingImageIndex === -1 ? 'question' : `option-${editingImageIndex}`;
      const history = editHistory[key];
      
      if (history && history.originalImage === imgSrc) {
        console.log('편집 기록이 있어 fit 적용하지 않음');
        setIsLoading(false);
        return;
      }
      
      // 초기 위치 및 크기 설정 - 페이지 로드 시 자동 맞춤
      if (imageRef.current && containerRef.current) {
        const container = containerRef.current;
        const cropFrame = container.querySelector(`.${styles['crop-frame']}`);
        
        if (cropFrame) {
          // 이미지를 크롭 프레임에 맞추기 위한 초기화
          setIsLoading(false);
        } else {
          // 크롭 프레임이 없는 경우 기본 처리
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    }, [editingImageIndex, imgSrc, editHistory]);

    // 마우스/터치 이벤트 핸들러
    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLImageElement>) => {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({
        x: e.clientX - imgPosition.x,
        y: e.clientY - imgPosition.y
      });
    }, [imgPosition]);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
      if (!isDragging) return;
      e.preventDefault();
      
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      
      setImgPosition({
        x: newX,
        y: newY
      });
    }, [isDragging, dragStart]);

    const handleMouseUp = useCallback(() => {
      setIsDragging(false);
    }, []);

    // 줌 변경 핸들러
    const handleZoomChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const newScale = parseFloat(e.target.value);
      setScale(newScale);
      setPinchScale(newScale);
      console.log('Zoom change:', { newScale });
    }, []);

    const decreaseZoom = () => {
      // 더 작은 단계로 줌 감소 (0.05 단위)
      const newScale = Math.max(0.1, scale - 0.05);
      setScale(newScale);
      setPinchScale(newScale);
      console.log('Decrease zoom:', { newScale });
    };

    const increaseZoom = () => {
      // 더 작은 단계로 줌 증가 (0.05 단위)
      const newScale = Math.min(5, scale + 0.05);
      setScale(newScale);
      setPinchScale(newScale);
      console.log('Increase zoom:', { newScale });
    };

    // 회전 핸들러
    const rotateLeft = useCallback(() => {
      setRotate(prev => prev - 90);
    }, []);

    const rotateRight = useCallback(() => {
      setRotate(prev => prev + 90);
    }, []);

    // 이미지 리셋
    const resetImage = () => {
      setScale(1);
      setPinchScale(1);
      setRotate(0);
      setImgPosition({ x: 0, y: 0 });
      console.log('Reset image');
    };

    // 터치 이벤트 핸들러 개선
    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
      // 버튼에서의 터치는 무시
      if ((e.target as HTMLElement).tagName === 'BUTTON') return;

      if (e.touches.length === 1) {
        // passive 이벤트용 최적화: preventDefault 제거
        setIsDragging(true);
        const touch = e.touches[0];
        setDragStart({
          x: touch.clientX - imgPosition.x,
          y: touch.clientY - imgPosition.y
        });
      } else if (e.touches.length === 2) {
        // passive 이벤트용 최적화: preventDefault 제거
        // 두 손가락 사이의 거리 계산
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const distance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
        setPinchStart(distance);
        setPinchScale(scale);
      }
    };

    const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
      if (e.touches.length === 1 && isDragging) {
        // passive 이벤트 문제 해결: preventDefault 호출 제거
        const touch = e.touches[0];
        setImgPosition({
          x: touch.clientX - dragStart.x,
          y: touch.clientY - dragStart.y
        });
      } else if (e.touches.length === 2) {
        // passive 이벤트 문제 해결: preventDefault 호출 제거
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const distance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
        
        // 핀치 줌 계산 - 부드러운 변화를 위해 개선된 damping factor 적용
        const damping = 0.4; // 더 부드러운 변화를 위해 damping 감소
        const pinchRatio = distance / pinchStart;
        const newScale = Math.max(0.1, Math.min(5, (pinchRatio * damping + (1 - damping)) * pinchScale));
        setScale(parseFloat(newScale.toFixed(2))); // 소수점 2자리까지만 유지하여 안정성 향상
      }
    };

    const handleTouchEnd = () => {
      // passive 이벤트 문제 해결: preventDefault 호출 제거
      setIsDragging(false);
      // 현재 scale 값을 유지
      console.log('Touch end:', { finalScale: scale });
    };

    // 버튼 클릭 핸들러 수정
    const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement> | React.TouchEvent<HTMLButtonElement>) => {
      // preventDefault 제거, stopPropagation만 유지
      e.stopPropagation();
    };

    // 이미지 크롭 및 저장 함수 - 완전히 새로운 접근 방식
    const handleSave = useCallback(() => {
      if (!imageRef.current || !containerRef.current) return;

      try {
        setIsSaving(true);
        console.log('이미지 저장 시작');

        // 타겟 크기 설정 - 옵션 타입에 따라 다름
        let targetWidth, targetHeight;
        if (editingImageIndex === -1) {
          // 질문 이미지는 항상 2:1 비율
          targetWidth = 600;
          targetHeight = 300;
        } else {
          if (optionType === 'text') {
            // 텍스트 옵션 이미지는 1:1 비율
            targetWidth = 100;
            targetHeight = 100;
          } else {
            // 이미지 옵션은 1:1 비율
            targetWidth = 400;
            targetHeight = 400;
          }
        }

        const img = imageRef.current;
        const container = containerRef.current;
        const cropFrame = container.querySelector(`.${styles['crop-frame']}`);
        
        if (!cropFrame) {
          console.error('크롭 프레임을 찾을 수 없습니다.');
          setIsSaving(false);
          return;
        }

        // 1. 작업 캔버스 생성 (원본 이미지 크기)
        const workCanvas = document.createElement('canvas');
        const workCtx = workCanvas.getContext('2d', { willReadFrequently: true });
        
        if (!workCtx) {
          console.error('작업 캔버스 컨텍스트를 가져올 수 없습니다.');
          setIsSaving(false);
          return;
        }

        // 2. 현재 상태 정보 수집
        const cropRect = cropFrame.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        // 3. 작업 캔버스 크기 설정
        // 회전을 고려하여 충분히 큰 캔버스 사용
        const diagonal = Math.ceil(Math.sqrt(
          img.naturalWidth * img.naturalWidth + 
          img.naturalHeight * img.naturalHeight
        ));
        const padding = 100; // 여유 공간
        workCanvas.width = diagonal + padding;
        workCanvas.height = diagonal + padding;

        // 4. 이미지 그리기에 필요한 변환 수행
        workCtx.save();
        
        // 캔버스 중앙으로 이동
        workCtx.translate(workCanvas.width / 2, workCanvas.height / 2);
        
        // 회전 적용
        workCtx.rotate((rotate * Math.PI) / 180);
        
        // 이미지 그리기 (중앙 정렬)
        workCtx.drawImage(
          img, 
          -img.naturalWidth / 2, 
          -img.naturalHeight / 2,
          img.naturalWidth,
          img.naturalHeight
        );
        
        workCtx.restore();

        // 5. 변환된 이미지에서 크롭 영역 찾기
        // 크롭 영역과 이미지의 비율 계산
        const displayScale = scale;
        
        // 화면에 표시된 이미지 크기
        const displayedWidth = img.naturalWidth * displayScale;
        const displayedHeight = img.naturalHeight * displayScale;
        
        // 화면 상 크롭 프레임의 상대적 위치 (이미지 중심 기준)
        const cropCenterX = cropRect.left + cropRect.width / 2 - (containerRect.left + containerRect.width / 2);
        const cropCenterY = cropRect.top + cropRect.height / 2 - (containerRect.top + containerRect.height / 2);
        
        // 이미지 중심 기준 위치 보정
        const adjustedCenterX = cropCenterX - imgPosition.x;
        const adjustedCenterY = cropCenterY - imgPosition.y;
        
        // 이미지 원본 크기 기준으로 변환
        const sourceScale = img.naturalWidth / displayedWidth;
        
        // 원본 이미지에서의 크롭 중심 좌표
        const sourceCenterX = adjustedCenterX * sourceScale;
        const sourceCenterY = adjustedCenterY * sourceScale;
        
        // 회전이 적용된 작업 캔버스 상의 중심 좌표
        const workCenterX = workCanvas.width / 2 + sourceCenterX;
        const workCenterY = workCanvas.height / 2 + sourceCenterY;
        
        // 크롭 영역 크기 (원본 이미지 기준)
        const cropWidthInSource = cropRect.width * sourceScale;
        const cropHeightInSource = cropRect.height * sourceScale;
        
        // 작업 캔버스에서 크롭할 좌표
        const cropX = workCenterX - cropWidthInSource / 2;
        const cropY = workCenterY - cropHeightInSource / 2;

        // 6. 결과 캔버스 생성 및 크롭된 이미지 그리기
        const resultCanvas = document.createElement('canvas');
        const resultCtx = resultCanvas.getContext('2d');
        
        if (!resultCtx) {
          console.error('결과 캔버스 컨텍스트를 가져올 수 없습니다.');
          setIsSaving(false);
          return;
        }
        
        // 결과 캔버스 크기 설정
        resultCanvas.width = targetWidth;
        resultCanvas.height = targetHeight;
        
        // 배경색 설정
        resultCtx.fillStyle = '#1a1a1a';
        resultCtx.fillRect(0, 0, targetWidth, targetHeight);
        
        // 작업 캔버스에서 크롭한 영역을 결과 캔버스에 그리기
        resultCtx.drawImage(
          workCanvas,
          cropX, cropY, 
          cropWidthInSource, cropHeightInSource,
          0, 0,
          targetWidth, targetHeight
        );
        
        // 7. 결과 이미지 생성 및 저장
        const croppedImage = resultCanvas.toDataURL('image/png', 0.95);
        console.log('이미지 생성 완료', {
          crop: {
            x: cropX, y: cropY, 
            width: cropWidthInSource, height: cropHeightInSource
          },
          target: {
            width: targetWidth, height: targetHeight
          },
          imageInfo: {
            natural: { width: img.naturalWidth, height: img.naturalHeight },
            display: { width: displayedWidth, height: displayedHeight },
            position: imgPosition,
            scale: scale,
            rotate: rotate
          }
        });
        
        // 편집 기록 업데이트
        onSave(croppedImage);
        
        // 편집 상태 종료
        onClose();
      } catch (error) {
        console.error('이미지 저장 중 오류:', error);
      } finally {
        setIsSaving(false);
      }
    }, [containerRef, imageRef, editingImageIndex, onSave, onClose, scale, rotate, imgPosition, optionType, setIsSaving]);

    // 모달이 열릴 때 body 스크롤 막기
    useEffect(() => {
      if (isOpen) {
        document.body.style.overflow = 'hidden';
        document.body.style.touchAction = 'none';
      } else {
        document.body.style.overflow = '';
        document.body.style.touchAction = '';
      }
      
      return () => {
        document.body.style.overflow = '';
        document.body.style.touchAction = '';
      };
    }, [isOpen]);

    if (!isOpen || !imgSrc) return null;

    return (
      <div 
        className={styles['modal-overlay']}
        onTouchStart={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <div 
          className={styles['modal-content']}
          onClick={(e) => e.stopPropagation()}
        >
          <div 
            className={styles['crop-container']} 
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ touchAction: 'none' }}
          >
            {isLoading && <div className={styles.loading}>이미지 로딩 중...</div>}
            <div className={styles['crop-preview']}>
              <img
                ref={imageRef}
                src={imgSrc}
                onLoad={handleImageLoad}
                onMouseDown={handleMouseDown}
                onTouchStart={() => setIsDragging(true)}
                className={styles['preview-image']}
                style={{
                  transform: `translate(${imgPosition.x}px, ${imgPosition.y}px) scale(${scale}) rotate(${rotate}deg)`,
                  cursor: isDragging ? 'grabbing' : 'grab'
                }}
                alt="Crop preview"
                draggable={false}
              />
            </div>
            
            {!isLoading && <div className={styles['crop-overlay']}>
              <div 
                className={styles['crop-frame']} 
                style={{
                  width: editingImageIndex === -1 ? '600px' : (optionType === 'text' ? '100px' : '400px'),
                  height: editingImageIndex === -1 ? '300px' : (optionType === 'text' ? '100px' : '400px'),
                  aspectRatio: editingImageIndex === -1 ? '2/1' : '1/1',
                  maxWidth: '90vw',
                  maxHeight: editingImageIndex === -1 ? '45vw' : (optionType === 'text' ? '100px' : '400px')
                }}
              ></div>
            </div>}
          </div>

          <div className={styles['cropper-controls']}>
            <div className={styles['crop-control-group']}>
              <button 
                className={styles['crop-control-button']} 
                onClick={handleButtonClick}
                onTouchStart={handleButtonClick}
                onTouchEnd={(e) => {
                  // preventDefault 제거, stopPropagation만 유지
                  e.stopPropagation();
                  rotateLeft();
                }}
                disabled={isLoading}
                type="button"
              >
                <FaUndo />
              </button>
              <button 
                className={styles['crop-control-button']} 
                onClick={handleButtonClick}
                onTouchStart={handleButtonClick}
                onTouchEnd={(e) => {
                  // preventDefault 제거, stopPropagation만 유지
                  e.stopPropagation();
                  rotateRight();
                }}
                disabled={isLoading}
                type="button"
              >
                <FaRedo />
              </button>
              <button 
                className={styles['crop-control-button']} 
                onClick={handleButtonClick}
                onTouchStart={handleButtonClick}
                onTouchEnd={(e) => {
                  // preventDefault 제거, stopPropagation만 유지
                  e.stopPropagation();
                  resetImage();
                }}
                disabled={isLoading}
                type="button"
              >
                <FaSyncAlt />
              </button>
            </div>

            <div className={styles['crop-control-group']}>
              <button 
                className={styles['crop-control-button']} 
                onClick={handleButtonClick}
                onTouchStart={handleButtonClick}
                onTouchEnd={(e) => {
                  // preventDefault 제거, stopPropagation만 유지
                  e.stopPropagation();
                  decreaseZoom();
                }}
                disabled={isLoading || scale <= 0.05}
                type="button"
              >
                <FaSearchMinus />
              </button>
              
              <input
                type="range"
                value={scale}
                min={0.1}
                max={5}
                step={0.01} // 더 세밀한 단계 조절을 위해 0.01로 설정
                className={styles['zoom-slider']}
                disabled={isLoading}
                onChange={handleZoomChange}
              />
              
              <button 
                className={styles['crop-control-button']} 
                onClick={handleButtonClick}
                onTouchStart={handleButtonClick}
                onTouchEnd={(e) => {
                  // preventDefault 제거, stopPropagation만 유지
                  e.stopPropagation();
                  increaseZoom();
                }}
                disabled={isLoading || scale >= 5}
                type="button"
              >
                <FaSearchPlus />
              </button>
            </div>
          </div>

          <div className={styles['modal-buttons']}>
            <button 
              onClick={() => {
                console.log('취소 버튼 클릭');
                onClose();
              }} 
              className={styles['cancel-button']}
              type="button"
            >
              취소
            </button>
            <button 
              onClick={() => {
                console.log('적용 버튼 클릭');
                handleSave();
              }}
              className={styles['save-button']}
              disabled={isLoading || isSaving}
              type="button"
            >
              {isSaving ? '처리 중...' : '적용'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // URL 형식 검증 및 변환 함수
  const formatUrl = (url: string): string => {
    if (!url) return '';
    
    // URL이 http:// 또는 https://로 시작하지 않으면 http://를 추가
    if (!url.match(/^https?:\/\//i)) {
      return `http://${url}`;
    }
    
    return url;
  };

  // 폼 제출 처리
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // user 체크만 수행
    if (!user?.id) {
      setError('로그인이 필요합니다. 다시 로그인해주세요.');
      navigate('/login', { 
        state: { from: location.pathname },
        replace: true
      });
      return;
    }
    
    if (loading) return;
    
    // 폼 제출 시 네비게이션 타이머 초기화
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
      navigationTimeoutRef.current = null;
    }
    
    // 필수 필드 검증
    if (!question.trim()) {
      setError('질문을 입력해주세요.');
      return;
    }
    
    // 옵션 검증
    if (options.length < 2) {
      setError('최소 2개의 옵션이 필요합니다.');
      return;
    }
    
    // 빈 옵션 검증
    const hasEmptyOption = options.some(option => !option.text.trim() && !option.image_url);
    if (hasEmptyOption) {
      setError('모든 옵션에 텍스트 또는 이미지를 입력해주세요.');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setProgress(0);
      setProgressStatus("투표 카드 생성 준비 중...");
      
      // URL 형식 변환
      const formattedSourceLink = formatUrl(sourceLink);
      
      // 만료 시간 설정
      const expiryDate = new Date();
      expiryDate.setHours(0, 0, 0, 0);
      expiryDate.setDate(expiryDate.getDate() + expiryDays);
      expiryDate.setHours(23, 59, 59, 999);
      
      // vote_period 설정 - 특정일인 경우 날짜 포맷팅
      let votePeriod = selectedPeriod;
      if (selectedDate) {
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        votePeriod = `~${year}/${month}/${day}`;
      }

      // 미디어 업로드 처리
      let questionMediaUrl = questionImage; // 상태를 다시 확인하여 반영
      
      setProgress(10);
      setProgressStatus("질문 미디어 업로드 중...");
      
      // 이미지 또는 동영상 업로드
      if (questionImage) {
        if (questionImage.startsWith('data:')) {
          // 이미지 업로드
          try {
            questionMediaUrl = await uploadImageToStorage(questionImage);
            console.log('질문 이미지 업로드 완료:', questionMediaUrl);
          } catch (uploadError) {
            console.error('질문 이미지 업로드 실패:', uploadError);
            questionMediaUrl = '';
          }
        } else if (questionImage.startsWith('blob:')) {
          // 동영상 업로드
          try {
            const response = await fetch(questionImage);
            const blob = await response.blob();
            const videoFile = new File([blob], "video.mp4", { type: "video/mp4" });
            questionMediaUrl = await uploadVideoToStorage(videoFile);
            console.log('질문 동영상 업로드 완료:', questionMediaUrl);
          } catch (uploadError) {
            console.error('질문 동영상 업로드 실패:', uploadError);
            questionMediaUrl = '';
          }
        }
      }
      
      setProgress(30);
      setProgressStatus("선택지 이미지 처리 중...");
      
      // 옵션 이미지 업로드 처리
      const processedOptions = await Promise.all(
        options.map(async (option, index) => {
          let image_url = option.image_url;
          
          console.log(`옵션 ${index+1} 이미지 상태 (업로드 전):`, {
            hasImage: !!option.image_url,
            imageStart: option.image_url ? option.image_url.substring(0, 30) + '...' : 'none',
            isBase64: option.image_url ? option.image_url.startsWith('data:') : false
          });
          
          // 수정된 이미지가 Base64 데이터인 경우 Storage에 업로드
          if (option.image_url && option.image_url.startsWith('data:')) {
            try {
              image_url = await uploadImageToStorage(option.image_url);
              console.log(`옵션 ${index+1} 이미지 업로드 완료:`, image_url);
            } catch (uploadError) {
              console.error(`옵션 ${index+1} 이미지 업로드 실패:`, uploadError);
              image_url = '';
            }
          }
          
          // 진행률 업데이트 (30%~60% 사이에서 분배)
          setProgress(30 + Math.floor((index + 1) / options.length * 30));
          
          return {
            ...option,
            image_url: image_url || ''
          };
        })
      );
      
      setProgress(60);
      setProgressStatus("투표 데이터 저장 중...");
      
      // 수정 모드인 경우
      if (isEditMode && currentVoteId && originalVote) {
        setProgress(80);
        
        try {
          const updateData: Partial<VoteTopic> = {
            id: currentVoteId,
            question,
            link: formattedSourceLink,
            display_type: optionType === 'image' ? 'image' : 'text',
            expires_at: selectedDate ? selectedDate.toISOString() : expiryDate.toISOString(),
            vote_period: votePeriod,
            visible: originalVote.visible,
            related_image: questionMediaUrl || undefined,
            options: processedOptions.map(opt => ({
              id: opt.id || 0,
              text: opt.text,
              image_url: opt.image_url || '',
              image_class: opt.image_class || 'default',
              gender_stats: opt.gender_stats || { male: 0, female: 0 },
              region_stats: opt.region_stats || {} as VoteOption['region_stats'],
              age_stats: opt.age_stats || {} as VoteOption['age_stats'],
              topic_id: currentVoteId,
              votes: opt.votes || 0
            }))
          };
          
          console.log('투표 업데이트 요청 데이터:', updateData);
          const result = await updateVoteTopic(updateData);
          console.log('투표 업데이트 결과:', result);
          
          if (processedOptions.length > originalVote.options.length) {
            const newOptions = processedOptions.slice(originalVote.options.length);
            
            for (const newOption of newOptions) {
              await addVoteOption(currentVoteId, newOption.text);
            }
          }
                    
          // 투표 생성 후 weekly_created 값 증가
          const { data, error: fetchError } = await supabase
            .from('users')
            .select('weekly_created')
            .eq('id', user?.id)
            .single();

          if (fetchError) {
            console.error('weekly_created 가져오기 중 오류 발생:', fetchError);
            return;
          }

          // 배열의 마지막 요소 증가
          const updatedWeeklyCreated = [...data.weekly_created];
          updatedWeeklyCreated[updatedWeeklyCreated.length - 1] += 1;

          // 업데이트된 배열을 DB에 저장
          const { error: updateError } = await supabase
            .from('users')
            .update({ weekly_created: updatedWeeklyCreated })
            .eq('id', user?.id);

          if (updateError) {
            console.error('weekly_created 업데이트 중 오류 발생:', updateError);
          }
          setModalTitle('투표 수정 완료');
          setModalMessage('투표가 성공적으로 수정되었습니다!');
          setShowSuccessModal(true);
          navigate('/my-votes');
          
        } catch (error) {
          console.error('투표 수정 중 오류 발생:', error);
          setModalTitle('오류 발생');
          setModalMessage('투표를 수정하는 중 오류가 발생했습니다.');
          setShowErrorModal(true);
        }
      } else {
        setProgress(80);
        
        console.log('투표 생성 데이터:', {
          user_id: user?.id,
          question,
          options: processedOptions.map(option => ({
            text: option.text,
            image_url: option.image_url || '',
            image_class: 'default',
            topic_id: 0,
            votes: 0
          })),
          related_image: questionMediaUrl || undefined,
          display_type: optionType === 'image' ? 'image' : 'text',
          expires_at: selectedDate ? selectedDate.toISOString() : expiryDate.toISOString(),
          visible: true,
          vote_period: votePeriod
        });
        
        const result = await addVote({
          user_id: user?.id,
          question,
          options: processedOptions.map(option => ({
            text: option.text,
            image_url: option.image_url || '',
            image_class: 'default',
            topic_id: 0,
            votes: 0
          })),
          related_image: questionMediaUrl || undefined,
          display_type: optionType === 'image' ? 'image' : 'text',
          expires_at: selectedDate ? selectedDate.toISOString() : expiryDate.toISOString(),
          visible: true,
          vote_period: votePeriod,
        });
        console.log('투표 생성 결과:', result);
        
        if (result) {
          setProgress(100);
          setModalTitle('투표 생성 완료');
          setModalMessage('투표가 성공적으로 생성되었습니다!');
          setShowSuccessModal(true);
          
          // 투표 생성 후 weekly_created 값 증가
          const { data, error: fetchError } = await supabase
            .from('users')
            .select('weekly_created')
            .eq('id', user?.id)
            .single();

          if (fetchError) {
            console.error('weekly_created 가져오기 중 오류 발생:', fetchError);
            return;
          }

          // 배열의 마지막 요소 증가
          const updatedWeeklyCreated = [...data.weekly_created];
          updatedWeeklyCreated[updatedWeeklyCreated.length - 1] += 1;

          // 업데이트된 배열을 DB에 저장
          const { error: updateError } = await supabase
            .from('users')
            .update({ weekly_created: updatedWeeklyCreated })
            .eq('id', user?.id);

          if (updateError) {
            console.error('weekly_created 업데이트 중 오류 발생:', updateError);
          }

          // Reset form state
          setQuestion('');
          setSourceLink('');
          setOptions([{ text: '', image_url: '' }, { text: '', image_url: '' }]);
          setExpiryDays(7);
          setSelectedPeriod('1주일');
          setSelectedDate(null);
          setQuestionImage(null);
          navigate('/my-votes');
        }
      }
    } catch (err: any) {
      console.error('투표 생성 중 오류 발생:', err);
      
      // 세션 관련 에러 처리 추가
      if (err.message?.includes('JWT') || err.message?.includes('session') || err.message?.includes('authentication')) {
        setError('로그인이 필요합니다. 다시 로그인해주세요.');
        navigate('/login', { state: { from: location.pathname } });
        return;
      }
      
      setError(err.message || '투표를 생성하는 중 오류가 발생했습니다.');
      setModalTitle('오류 발생');
      setModalMessage(err.message || '투표를 생성하는 중 오류가 발생했습니다.');
      setShowErrorModal(true);
      setProgress(0);
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, []);

  // 질문 이미지/비디오 프리뷰 렌더링
  const renderQuestionMediaPreview = () => {
    if (!questionImage) return null;
    
    // 이미지/동영상 타입 확인
    const isImage = typeof questionImage === 'string' && 
      (questionImage.startsWith('data:image') || 
       !questionImage.match(/\.(mp4|webm|ogg)$/) && !questionImage.startsWith('blob:'));
    
    const isVideo = typeof questionImage === 'string' && 
      (questionImage.startsWith('data:video') || 
       questionImage.match(/\.(mp4|webm|ogg)$/) || 
       questionImage.startsWith('blob:'));

    if (isImage) {
      // 이미지인 경우
      return (
        <div className={styles['question-image-preview']}>
          <img 
            src={questionImage} 
            alt="질문 이미지" 
            className={styles['question-image']} 
            crossOrigin={questionImage.startsWith('http') ? "anonymous" : undefined}
          />
          <div className={styles['image-editor-controls']}>
            <button
              type="button"
              className={styles['image-editor-button']}
              onClick={() => openImageEditor(-1, questionImage)}
              title="이미지 편집"
            >
              ✏️
            </button>
            <button
              type="button"
              className={styles['image-editor-button']}
              onClick={() => handleImageDelete(questionImage)}
              title="이미지 삭제"
            >
              ❌
            </button>
          </div>
        </div>
      );
    } else if (isVideo) {
      // 비디오인 경우
      return (
        <div className={styles['question-image-preview']}>
          <video 
            controls 
            src={questionImage} 
            className={styles['question-video']} 
            crossOrigin={questionImage.startsWith('http') ? "anonymous" : undefined}
          />
          <div className={styles['image-editor-controls']}>
            <button
              type="button"
              className={styles['image-editor-button']}
              onClick={() => handleImageDelete(questionImage)}
              title="비디오 삭제"
            >
              ❌
            </button>
          </div>
        </div>
      );
    }
    
    return null;
  };

  // 텍스트 옵션 렌더링 부분 수정
  const renderTextOptions = () => {
    return options.map((option, index) => (
      <div key={index} className={styles['vote-option']}>
        <div style={{ display: 'flex', width: '100%' }}>
          <div style={{ flexShrink: 0, marginRight: '10px', width: '100px' }}>
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              id={`file-input-${index}`}
              onChange={(e) => handleMediaSelect(e, index)}
            />
            
            {!option.image_url ? (
              <button
                type="button"
                className={styles['option-image-btn']}
                onClick={() => {
                  const fileInput = document.getElementById(`file-input-${index}`) as HTMLInputElement;
                  fileInput?.click();
                }}
              >
                <span className={styles.emoji}>🖼️</span>
                <span className={styles.text}>이미지</span>
              </button>
            ) : (
              <div 
                className={styles['text-option-image-preview']}
              >
                <img 
                  src={option.image_url} 
                  alt={`선택지 ${index + 1} 이미지`} 
                  crossOrigin="anonymous"
                  className={styles['option-image']}
                />
                <div className={styles['image-editor-controls']}>
                  <button
                    type="button"
                    className={styles['image-editor-button']}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (option.image_url) {
                        openImageEditor(index, option.image_url);
                      } else {
                        const fileInput = document.getElementById(`file-input-${index}`) as HTMLInputElement;
                        fileInput?.click();
                      }
                    }}
                    title="이미지 편집"
                  >
                    ✏️
                  </button>
                  <button
                    type="button"
                    className={styles['image-editor-button']}
                    onClick={async () => {
                      if (option.image_url) {
                        await handleImageDelete(option.image_url, index);
                      }
                    }}
                    title="이미지 삭제"
                  >
                    ❌
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <div className={styles['option-content']}>
            <div className={styles['option-input']}>
              <textarea
                value={option.text}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                placeholder={`선택지 ${index + 1}`}
                className={styles['cover-text-input']}
                onClick={(e) => e.stopPropagation()}
                rows={2}
              ></textarea>
            </div>
            {options.length > 2 && (
              <button 
                type="button" 
                className={`${styles['remove-option-btn']} ${styles['remove-option-btn-absolute']}`}
                onClick={(e) => {
                  e.stopPropagation();
                  removeOption(index);
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    ));
  };

  const [showSizeWarningModal, setShowSizeWarningModal] = useState(false);

  // 이미지 편집 상태를 저장하는 함수 개선
  const saveEditHistory = (index: number, image: string, state: {
    scale: number;
    rotate: number;
    imgPosition: { x: number, y: number };
  }) => {
    const key = index === -1 ? 'question' : `option-${index}`;
    setEditHistory(prev => ({
      ...prev,
      [key]: {
        ...state,
        originalImage: image
      }
    }));
  };

  // 새로운 상태 변수 추가
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalTitle, setModalTitle] = useState('');

  return (
    <div className={styles['create-vote-container']}>
      <h2>{isEditMode ? '투표 수정' : '투표 생성'}</h2>
      
      {isGuest && (
        <div className={styles['warning-message']}>
          로그인 후 투표를 생성할 수 있습니다.
        </div>
      )}

      <LoadingOverlay 
        isLoading={loading}
        progress={progress}
        progressStatus={progressStatus}
        defaultMessage="투표 카드 생성 준비 중..."
      />
      
      {error && <div className={styles['error']}>{error}</div>}
      
      <ImageEditorModal
        isOpen={showImageEditor}
        onClose={() => {
          setShowImageEditor(false);
          setEditingImageIndex(null);
          setImageSrc(null);
        }}
        image={imageSrc}
        onSave={(croppedImage) => {
          if (editingImageIndex === null) return;

          // 편집 상태 저장
          saveEditHistory(editingImageIndex, originalImageSrc || '', {
            scale: 1,
            rotate: 0, 
            imgPosition: { x: 0, y: 0 }
          });

          // 이미지 업데이트 - 크롭된 이미지를 직접 사용
          if (editingImageIndex === -1) {
            setQuestionImage(croppedImage);
          } else {
            setOptions(prev => {
              const newOptions = [...prev];
              newOptions[editingImageIndex] = {
                ...newOptions[editingImageIndex],
                image_url: croppedImage
              };
              return newOptions;
            });
          }

          // 에디터 상태 초기화
          setShowImageEditor(false);
          setEditingImageIndex(null);
          setImageSrc(null);
        }}
        editingImageIndex={editingImageIndex !== null ? editingImageIndex : -1}
        optionType={optionType}
      />
      
      <form onSubmit={handleSubmit}>
        <div className={styles['form-group']}>
          <label htmlFor="question" className={styles['required-label']}>질문</label>
          
          <div className={styles['question-image-container']}>
            <div style={{ width: '100%' }}>
              <input
                type="file"
                accept="image/*,video/*"
                style={{ display: 'none' }}
                id="question-media-input"
                onChange={(e) => handleMediaSelect(e)}
              />

              {!questionImage ? (
                <label htmlFor="question-media-input" className={styles['question-image-button']}>
                  🖼️ 질문 이미지/동영상 (선택사항)
                </label>
              ) : (
                renderQuestionMediaPreview()
              )}

              <small className={styles['form-hint']}>브라우저에서 이미지를 길게 눌러 이미지 다운로드 후 앨범에서 불러오세요</small>
              <small className={styles['form-hint']}>동영상은 50MB 이하로 업로드 가능합니다</small>

            </div>
          </div>
          
          <div className={styles['content-required']}>
            <textarea
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="투표 질문을 입력하세요"              
              required
              onClick={(e) => e.stopPropagation()}
              rows={2}
              className={styles['cover-text-input']}
            ></textarea>
          </div>
        </div>
        
        <div className={styles['form-group']}>
          <label htmlFor="sourceLink" className={styles['optional-label']}>출처 링크</label>
          <input
            type="text"
            id="sourceLink"
            value={sourceLink}
            onChange={(e) => setSourceLink(e.target.value)}
            placeholder="example.com"
            onClick={(e) => e.stopPropagation()}
            className={styles['source-link-input']}
          />
          <small className={styles['form-hint']}>브라우저에서 제목을 길게 눌러 URL 복사하여 붙여넣기 하세요</small>
        </div>
        
        <div className={styles['form-group']}>
          <label className={styles['required-label']}>선택지 유형</label>
          <div className={`${styles['period-buttons']} ${styles['option-type']}`}>
            {[
              { value: 'text', label: '텍스트' },
              { value: 'image', label: '이미지' },
              { value: 'video', label: '동영상' }
            ].map((type) => (
              <button
                key={type.value}
                type="button"
                className={`${styles['period-btn']} ${optionType === type.value ? styles.selected : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setOptionType(type.value as 'text' | 'image' | 'video');
                }}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>
        
        <div className={styles['form-group']}>
          <label className={styles['required-label']}>선택지 (최소 2개, 최대 5개)</label>
          {optionType === 'text' && (
            <div className={styles['text-options']}>
              {renderTextOptions()}
            </div>
          )}
          
          {(optionType === 'image' || optionType === 'video') && (
            <div className={styles['cover-flow']}>
              {options.map((option, index) => (
                <div key={index} className={styles['cover-item-container']}>
                  <div className={`${styles['cover-item']} ${styles['content-required']}`}>
                    <input
                      type="file"
                      accept={optionType === 'image' ? "image/*" : "video/*"}
                      style={{ display: 'none' }}
                      id={`file-input-${index}`}
                      onChange={(e) => handleMediaSelect(e, index)}
                    />
                    {!option.image_url ? (
                      <button
                        type="button"
                        className={styles['option-image-btn']}
                        onClick={() => {
                          const fileInput = document.getElementById(`file-input-${index}`) as HTMLInputElement;
                          fileInput?.click();
                        }}
                      >
                        <span className={styles.emoji}>🖼️</span>
                        <span className={styles.text}>이미지 (필수)</span>
                      </button>
                    ) : (
                      <>
                        {optionType === 'image' ? (
                          <img 
                            src={option.image_url} 
                            alt={`선택지 ${index + 1}`} 
                            className={styles['cover-thumbnail']} 
                            crossOrigin="anonymous"
                          />
                        ) : (
                          <video src={option.image_url} controls className={styles['cover-thumbnail']} />
                        )}
                        
                        <div className={styles['image-editor-controls']}>
                          {optionType === 'image' && (
                            <button
                              type="button"
                              className={styles['image-editor-button']}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (option.image_url) {
                                  openImageEditor(index, option.image_url);
                                } else {
                                  const fileInput = document.getElementById(`file-input-${index}`) as HTMLInputElement;
                                  fileInput?.click();
                                }
                              }}
                              title="이미지 편집"
                            >
                              ✏️
                            </button>
                          )}
                          <button
                            type="button"
                            className={styles['image-editor-button']}
                            onClick={async () => {
                              if (option.image_url) {
                                await handleImageDelete(option.image_url, index);
                              }
                            }}
                            title="이미지 삭제"
                          >
                            ❌
                          </button>
                        </div>
                      </>
                    )}
                    {options.length > 2 && (
                      <button 
                        type="button" 
                        className={styles['remove-option-btn']}
                        onClick={(e) => {
                          e.stopPropagation();
                          removeOption(index);
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    )}
                  </div>
                  <textarea
                    value={option.text}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`선택지 ${index + 1} (선택사항)`}
                    className={styles['cover-text-input']}
                    onClick={(e) => e.stopPropagation()}
                    rows={2}
                  ></textarea>
                </div>
              ))}
            </div>
          )}
          
          {options.length < 5 && (
            <button 
              type="button" 
              className={styles['add-option-btn']}
              onClick={(e) => {
                e.stopPropagation();
                addOption();
              }}
            >
              + 선택지 추가
            </button>
          )}
        </div>
        
        <div className={styles['form-group']}>
          <label className={styles['required-label']}>투표 기간</label>
          <div className={styles['period-buttons']}>
            {['1일', '3일', '1주일', '1개월'].map((period) => (
              <button
                key={period}
                type="button"
                className={`${styles['period-btn']} ${selectedPeriod === period ? styles.selected : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handlePeriodSelect(period);
                }}
              >
                {period}
              </button>
            ))}
            <DatePicker
              selected={selectedDate}
              onChange={handleDateChange}
              dateFormat="yyyy/MM/dd"
              className="date-picker"
              withPortal
              customInput={<CustomInput />}
              minDate={new Date()}
              open={isDatePickerOpen}
              onClickOutside={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setIsDatePickerOpen(false);
              }}
              onCalendarOpen={() => {
                setIsDatePickerOpen(true);
                if (navigationTimeoutRef.current) {
                  clearTimeout(navigationTimeoutRef.current);
                  navigationTimeoutRef.current = null;
                }
              }}
              onCalendarClose={() => {
                setIsDatePickerOpen(false);
              }}
              shouldCloseOnSelect={true}
              preventOpenOnFocus={true}
              portalId="date-picker-portal"
            />
          </div>
        </div>
        
        <div className={styles['form-actions']}>
          <button type="button" className={styles['cancel-btn']} onClick={() => navigate('/my-votes')}>취소</button>
          <button type="submit" className={styles['submit-btn']} disabled={loading || isGuest}>
            {isEditMode ? '수정하기' : '내투표에 추가'}
          </button>
        </div>
      </form>

      <ConfirmModal
        isOpen={showSizeWarningModal}
        onClose={() => setShowSizeWarningModal(false)}
        onConfirm={() => setShowSizeWarningModal(false)}
        title="동영상 크기 초과"
        message="동영상 크기는 50MB를 초과할 수 없습니다. 더 작은 크기의 동영상을 선택해주세요."
        confirmButtonText="확인"
        confirmButtonVariant="danger"
        cancelButtonText={undefined}  // 취소 버튼 자체를 제거
      />

      <ConfirmModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          navigate('/my-votes');
        }}
        onConfirm={() => {
          setShowSuccessModal(false);
          navigate('/my-votes');
        }}
        title={modalTitle}
        message={modalMessage}
        confirmButtonText="확인"
        confirmButtonVariant="primary"
        cancelButtonText=""
      />

      <ConfirmModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        onConfirm={() => setShowErrorModal(false)}
        title={modalTitle}
        message={modalMessage}
        confirmButtonText="확인"
        confirmButtonVariant="danger"
        cancelButtonText={undefined}
      />
    </div>
  );
};

export default CreateVote; 