import React, { useState, forwardRef, useEffect, useRef, useCallback } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import styles from '../styles/CreateVote.module.css';
import { useVoteContext } from '../context/VoteContext';
import { useNavigate, useParams } from 'react-router-dom';
import { VoteTopic } from '../../lib/types';
import { getVoteTopicById, uploadImageToStorage } from '../../lib/api';
import { FaUndo, FaRedo, FaSearchMinus, FaSearchPlus, FaSyncAlt } from 'react-icons/fa';

// 임시 사용자 ID 추가
const tempUserId = '0ac4093b-498d-4e39-af11-145a23385a9a';

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
  const [successMessage, setSuccessMessage] = useState('');
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
      
      // // 만료 시간 설정
      // if (voteData.vote_period) {
      //   // 저장된 투표 기간 설정
      //   setSelectedPeriod(voteData.vote_period);
        
      //   // 기간에 따른 일수 설정
      //   switch (voteData.vote_period) {
      //     case '1일':
      //       setExpiryDays(1);
      //       break;
      //     case '3일':
      //       setExpiryDays(3);
      //       break;
      //     case '1주일':
      //       setExpiryDays(7);
      //       break;
      //     case '1개월':
      //       setExpiryDays(30);
      //       break;
      //     case '특정일':
      //       if (voteData.expires_at) {
      //         setSelectedDate(new Date(voteData.expires_at));
      //         const diffDays = Math.ceil(
      //           (new Date(voteData.expires_at).getTime() - new Date().getTime()) / 
      //           (1000 * 60 * 60 * 24)
      //         );
      //         setExpiryDays(diffDays);
      //       }
      //       break;
      //   }
      // }
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

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index].text = value;
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

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // 이미지 유형 확인
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 선택할 수 있습니다.');
      return;
    }
    
    // 이미지 크기 제한 (10MB로 증가)
    if (file.size > 10 * 1024 * 1024) {
      setError('이미지 크기는 10MB 이하여야 합니다.');
      return;
    }
    
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

      // 파일을 Base64로 변환
      const reader = new FileReader();
      reader.onloadend = () => {
        try {
          // 이미지 처리
          if (typeof reader.result === 'string') {
            // 이미지 데이터를 에디터에 전달
            openImageEditor(index, reader.result);
          }
          setLoading(false);
        } catch (err) {
          console.error('이미지 로드 중 오류:', err);
          setError('이미지를 로드하는 중 오류가 발생했습니다.');
          setLoading(false);
        }
      };
      
      reader.onerror = () => {
        setError('파일을 읽는 중 오류가 발생했습니다.');
        setLoading(false);
      };
      
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('이미지 처리 중 오류:', err);
      setError('이미지를 처리하는 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  // 이미지 에디터 닫기
  const closeImageEditor = () => {
    // 에디터 상태 초기화
    setShowImageEditor(false);
    setImageSrc(null);
    setOriginalImageSrc(null);
    setEditingImageIndex(null);
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
      
      setIsLoading(false);
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
      setScale(parseFloat(e.target.value));
    }, []);

    const decreaseZoom = useCallback(() => {
      setScale(prev => Math.max(0.05, prev - 0.01));
    }, []);

    const increaseZoom = useCallback(() => {
      setScale(prev => Math.min(5, prev + 0.01));
    }, []);

    // 회전 핸들러
    const rotateLeft = useCallback(() => {
      setRotate(prev => prev - 90);
    }, []);

    const rotateRight = useCallback(() => {
      setRotate(prev => prev + 90);
    }, []);

    // 이미지 리셋
    const resetImage = useCallback(() => {
      // 편집 기록이 있는지 확인
      const key = editingImageIndex === -1 ? 'question' : `option-${editingImageIndex}`;
      const history = editHistory[key];
      
      // 편집 기록이 있으면 기록 삭제
      if (history) {
        const newEditHistory = { ...editHistory };
        delete newEditHistory[key];
        setEditHistory(newEditHistory);
      }
      
      // 기본값으로 초기화
      setScale(1);
      setRotate(0);
      setImgPosition({ x: 0, y: 0 });
    }, [editingImageIndex, editHistory, setEditHistory]);

    // 터치 이벤트 핸들러 수정
    const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      
      setIsDragging(true);
      const touch = e.touches[0];
      setDragStart({
        x: touch.clientX - imgPosition.x,
        y: touch.clientY - imgPosition.y
      });
    }, [imgPosition, setIsDragging, setDragStart]);

    const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
      if (!isDragging) return;
      
      e.preventDefault();
      e.stopPropagation();
      
      const touch = e.touches[0];
      const newX = touch.clientX - dragStart.x;
      const newY = touch.clientY - dragStart.y;
      
      setImgPosition({
        x: newX,
        y: newY
      });
    }, [isDragging, dragStart, setImgPosition]);

    const handleTouchEnd = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    }, []);

    // 이미지 크롭 및 저장
    const saveCroppedImage = async () => {
      if (!imageRef.current) return;

      try {
        setIsSaving(true);
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // 캔버스 크기 설정
        if (editingImageIndex === -1) {
          // 질문 이미지는 항상 600x300
          canvas.width = 600;
          canvas.height = 300;
        } else {
          // 옵션 이미지는 유형에 따라 다름
          if (optionType === 'text') {
            canvas.width = 100;  // 정확히 100x100
            canvas.height = 100;
          } else {
            canvas.width = 400;  // 정확히 400x400
            canvas.height = 400;
          }
        }
        
        if (!ctx) return;
        
        // 캔버스 초기화 (배경 투명하게)
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 배경색 설정 (검정 배경)
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 중앙 정렬 및 회전
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rotate * Math.PI) / 180);
        
        // 이미지 그리기
        const img = imageRef.current;
        const scaledWidth = img.naturalWidth * scale;
        const scaledHeight = img.naturalHeight * scale;
        
        ctx.drawImage(
          img,
          -scaledWidth / 2 + imgPosition.x,
          -scaledHeight / 2 + imgPosition.y,
          scaledWidth,
          scaledHeight
        );
        
        ctx.restore();
        
        // 결과 이미지 생성
        const resultImage = canvas.toDataURL('image/png', 0.9);
        
        // 디버깅 정보
        console.log('이미지 저장 시작');
        console.log(`크롭된 이미지 크기: ${canvas.width}x${canvas.height}`);
        
        // 이미지 저장 함수 호출
        onSave(resultImage);
        onClose();
        
      } catch (error) {
        console.error('이미지 저장 중 오류:', error);
      } finally {
        setIsSaving(false);
      }
    };

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
        onTouchMove={(e) => e.preventDefault()}
      >
        <div className={styles['modal-content']}>
          <div 
            className={styles['crop-container']} 
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ 
              height: '500px', 
              maxHeight: '90vh',
              backgroundColor: '#121212' 
            }}
          >
            {isLoading && <div className={styles.loading}>이미지 로딩 중...</div>}
            <div className={styles['crop-preview']}>
              <img
                ref={imageRef}
                src={imgSrc}
                onLoad={handleImageLoad}
                onMouseDown={handleMouseDown}
                onTouchStart={() => setIsDragging(true)}
                style={{
                  transform: `translate(${imgPosition.x}px, ${imgPosition.y}px) scale(${scale}) rotate(${rotate}deg)`,
                  transformOrigin: 'center',
                  cursor: isDragging ? 'grabbing' : 'grab',
                  userSelect: 'none',
                  touchAction: 'none',
                  WebkitUserSelect: 'none',
                  objectFit: 'none'
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
                  aspectRatio: editingImageIndex === -1 ? '2/1' : '1', // 질문 이미지는 2:1 비율, 옵션은 1:1
                  maxWidth: editingImageIndex === -1 ? '90%' : (optionType === 'text' ? '100px' : '400px'),
                  maxHeight: editingImageIndex === -1 ? '300px' : (optionType === 'text' ? '100px' : '400px'),
                  margin: 0,
                  padding: 0,
                  border: '2px dashed #3a8eff'
                }}
              ></div>
            </div>}
          </div>

          <div className={styles['cropper-controls']}>
            <div className={styles['crop-control-group']}>
              <button 
                className={styles['crop-control-button']} 
                onClick={rotateLeft} 
                disabled={isLoading}
                title="왼쪽으로 회전"
              >
                <FaUndo />
              </button>
              <button 
                className={styles['crop-control-button']} 
                onClick={rotateRight} 
                disabled={isLoading}
                title="오른쪽으로 회전"
              >
                <FaRedo />
              </button>
              <button 
                className={styles['crop-control-button']} 
                onClick={resetImage} 
                disabled={isLoading}
                title="초기화"
              >
                <FaSyncAlt />
              </button>
            </div>

            <div className={styles['crop-control-group']}>
              <button 
                className={styles['crop-control-button']} 
                onClick={decreaseZoom}
                disabled={isLoading || scale <= 0.05}
                title="축소"
              >
                <FaSearchMinus />
              </button>
              
              <input
                type="range"
                value={scale}
                min={0.05}
                max={5}
                step={0.01}
                className={styles['zoom-slider']}
                disabled={isLoading}
                onChange={handleZoomChange}
              />
              
              <button 
                className={styles['crop-control-button']} 
                onClick={increaseZoom}
                disabled={isLoading || scale >= 5}
                title="확대"
              >
                <FaSearchPlus />
              </button>
            </div>
          </div>

          <div className={styles['modal-buttons']}>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                console.log('취소 버튼 클릭됨');
                onClose();
              }} 
              className={styles['cancel-button']}
              type="button"
            >
              취소
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                console.log('적용 버튼 클릭됨');
                saveCroppedImage();
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
    
    // 폼 제출 시 네비게이션 타이머 초기화
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
      navigationTimeoutRef.current = null;
    }
    
    if (loading) return;
    
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
      // 현재 시간을 00:00:00으로 설정
      expiryDate.setHours(0, 0, 0, 0);
      // 일수를 더함
      expiryDate.setDate(expiryDate.getDate() + expiryDays);
      // 23:59:59로 설정
      expiryDate.setHours(23, 59, 59, 999);
      
      // vote_period 설정 - 특정일인 경우 날짜 포맷팅
      let votePeriod = selectedPeriod;
      if (selectedDate) {
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        votePeriod = `~${year}/${month}/${day}`;
      }

      // 이미지 업로드 처리
      let questionImageUrl = questionImage;
      
      setProgress(10);
      setProgressStatus("질문 이미지 업로드 중...");
      
      // 수정된 이미지가 Base64 데이터인 경우 Storage에 업로드
      if (questionImage && questionImage.startsWith('data:')) {
        try {
          questionImageUrl = await uploadImageToStorage(questionImage);
          console.log('질문 이미지 업로드 완료:', questionImageUrl);
        } catch (uploadError) {
          console.warn('질문 이미지 업로드 실패, 원본 데이터 사용:', uploadError);
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
              console.warn(`옵션 ${index+1} 이미지 업로드 실패, 원본 데이터 사용:`, uploadError);
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
            vote_period: votePeriod, // 수정된 vote_period 사용
            visible: originalVote.visible,
            related_image: questionImageUrl || undefined,
            options: processedOptions.map(opt => ({
              id: opt.id || 0,  // undefined 대신 기본값 0 사용
              text: opt.text,
              image_url: opt.image_url || '',
              image_class: opt.image_class || 'default',
              topic_id: currentVoteId,
              votes: opt.votes || 0  // undefined 대신 기본값 0 사용
            }))
          };
          
          console.log('투표 업데이트 요청 데이터:', updateData);
          const result = await updateVoteTopic(updateData);
          console.log('투표 업데이트 결과:', result);
          
          // 새 옵션 추가 처리 (API 지원 시)
          if (processedOptions.length > originalVote.options.length) {
            // 새로 추가된 옵션들
            const newOptions = processedOptions.slice(originalVote.options.length);
            
            for (const newOption of newOptions) {
              // 옵션 텍스트만 API로 추가 (이미지는 아직 지원되지 않음)
              await addVoteOption(currentVoteId, newOption.text);
              
              if (newOption.image_url) {
                console.log('옵션 이미지 별도 처리 필요:', newOption.image_url);
                // 여기서는 addVoteOption이 이미지를 지원하지 않으므로 이미지는 별도로 처리 필요
                // 이 부분은 API 기능 확장이 필요함
              }
            }
          }
          
          // 성공 메시지 표시
          setSuccessMessage('투표가 성공적으로 수정되었습니다!');
          
          // 내 투표 페이지로 즉시 이동
              navigate('/my-votes');
        } catch (error) {
          console.error('투표 수정 중 오류 발생:', error);
          setError('투표를 수정하는 중 오류가 발생했습니다.');
        }
      } else {
        // 투표 생성 모드
        setProgress(80);
        
        console.log('투표 생성 데이터:', {
          user_id: tempUserId,
          question,
          options: processedOptions.map(option => ({
            text: option.text,
            image_url: option.image_url || '',
            image_class: 'default',
            topic_id: 0,
            votes: 0
          })),
          related_image: questionImageUrl || undefined,
          display_type: optionType === 'image' ? 'image' : 'text',
          expires_at: selectedDate ? selectedDate.toISOString() : expiryDate.toISOString(),
          visible: true,
          vote_period: votePeriod // 수정된 vote_period 사용

        });
        
        // 투표 생성 API 호출
        const result = await addVote({
          user_id: tempUserId,
          question,
          options: processedOptions.map(option => ({
            text: option.text,
            image_url: option.image_url || '',
            image_class: 'default',
            topic_id: 0,
            votes: 0
          })),
          related_image: questionImageUrl || undefined,
          display_type: optionType === 'image' ? 'image' : 'text',
          expires_at: selectedDate ? selectedDate.toISOString() : expiryDate.toISOString(),
          visible: true,
          vote_period: votePeriod, // 수정된 vote_period 사용 (selectedPeriod 대신)
        });
        console.log('투표 생성 결과:', result);
        
        if (result) {
          setProgress(100);
          
          // 성공 메시지 표시
          setSuccessMessage('투표가 성공적으로 생성되었습니다!');
          
          // 폼 초기화
          setQuestion('');
          setSourceLink('');
          setOptions([{ text: '', image_url: '' }, { text: '', image_url: '' }]);
          setExpiryDays(7);
          setSelectedPeriod('1주일');
          setSelectedDate(null);
          setQuestionImage(null); // 질문 이미지 초기화
          
          // 내 투표 페이지로 즉시 이동
              navigate('/my-votes');
        }
      }
    } catch (err: any) {
      console.error(isEditMode ? '투표 수정 중 오류 발생:' : '투표 생성 중 오류 발생:', err);
      setError(err.message || (isEditMode ? '투표를 수정하는 중 오류가 발생했습니다.' : '투표를 생성하는 중 오류가 발생했습니다.'));
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

  // 컴포넌트 마운트 시 스타일 주입
  useEffect(() => {
    // 기존에 주입된 스타일 제거 (중복 방지)
    const existingStyle = document.getElementById('question-image-style');
    if (existingStyle) {
      existingStyle.remove();
    }
    
    // 컴포넌트 언마운트 시 정리
    return () => {
      const styleEl = document.getElementById('question-image-style');
      if (styleEl) {
        styleEl.remove();
      }
    };
  }, []);

  // 질문 이미지 프리뷰 렌더링 부분 수정
  const renderQuestionImagePreview = () => {
    if (questionImage) {
      return (
        <div className={styles['question-image-container']} style={{marginBottom: '20px', width: '100%'}}>
          <div 
            className={styles['question-image-preview']} 
          >
            <img 
              src={questionImage} 
              alt="질문 이미지" 
              className={styles['question-image']}
            />
            <div className={styles['image-editor-controls']}>
              <button
                type="button"
                className={styles['image-editor-button']}
                onClick={(e) => {
                  e.stopPropagation();
                  openImageEditor(-1, questionImage);
                }}
                title="이미지 편집"
              >
                ✏️
              </button>
              <button
                type="button"
                className={styles['image-editor-button']}
                onClick={(e) => {
                  e.stopPropagation();
                  setQuestionImage(null);
                }}
                title="이미지 삭제"
              >
                ❌
              </button>
            </div>
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
        <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          {/* 옵션 이미지 부분 */}
          <div style={{ flexShrink: 0, marginRight: '10px', width: '100px' }}>
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              id={`file-input-${index}`}
              onChange={(e) => {
                handleImageSelect(e, index);
              }}
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
                    onClick={(e) => {
                      e.stopPropagation();
                      const newOptions = [...options];
                      newOptions[index].image_url = '';
                      setOptions(newOptions);
                    }}
                    title="이미지 삭제"
                  >
                    ❌
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* 옵션 텍스트 입력 부분 */}
          <div className={styles['option-content']}>
            <textarea
              value={option.text}
              onChange={(e) => {
                const newOptions = [...options];
                newOptions[index].text = e.target.value;
                setOptions(newOptions);
              }}
              placeholder={`선택지 ${index + 1}`}
              className={styles['option-input']}
              required
            />
            {/* 옵션 삭제 버튼 수정 */}
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

  return (
    <div className={styles['create-vote-container']}>
      <h2>{isEditMode ? '투표 수정' : '투표 생성'}</h2>
      
      {/* 로딩 화면은 실제 투표 생성/수정 작업 중에만 표시 */}
      {loading && (
        <div className={styles['loading-overlay']}>
          <div className={styles['loading-container']}>
            {progress > 0 && (
              <div className={styles['progress-container']}>
                <div 
                  className={styles['progress-bar']} 
                  style={{ width: `${progress}%` }}
                ></div>
                <div className={styles['progress-text']}>
                  {progressStatus || "투표 카드 생성 중..."} ({progress}%)
                </div>
              </div>
            )}
            <div className={styles['loading-spinner']}></div>
            <p className={styles['loading-message']}>
              {progress > 0 ? (progressStatus || "투표 카드 생성 중...") : "투표 카드 생성 중..."}
            </p>
          </div>
        </div>
      )}
      
      {error && <div className={styles['error']}>{error}</div>}
      
      {successMessage && <div className={styles['success']}>{successMessage}</div>}
      
      {/* 이미지 에디터 모달 */}
      <ImageEditorModal
        isOpen={showImageEditor}
        onClose={closeImageEditor}
        image={imageSrc}
        onSave={(croppedImage) => {
          // 조건을 체크하여 안전하게 처리
          if (editingImageIndex === null) {
            console.error('편집 중인 이미지 인덱스가 없습니다.');
            return;
          }
          
          // 저장 전에 마지막 편집 상태 확인
          const key = editingImageIndex === -1 ? 'question' : `option-${editingImageIndex}`;
          console.log('이미지 저장 전 편집 상태 확인:', key, editHistory[key]);
          
          if (editingImageIndex === -1) {
            // 질문 이미지인 경우
            setQuestionImage(croppedImage);
          } else {
            // 옵션 이미지인 경우
            const newOptions = [...options];
            newOptions[editingImageIndex].image_url = croppedImage;
            setOptions(newOptions);
          }
          
          // 에디터 닫기
          closeImageEditor();
        }}
        editingImageIndex={editingImageIndex !== null ? editingImageIndex : -1}
        optionType={optionType}
      />
      
      <form onSubmit={handleSubmit}>
        <div className={styles['form-group']}>
          <label htmlFor="question" className={styles['required-label']}>질문</label>
          
          {/* 질문 이미지 버튼을 텍스트 필드 위로 이동 - 선택사항으로 표시 */}
          <div className={styles['question-image-container']} style={{ display: 'flex', gap: '10px' }}>
            {/* 질문 이미지 입력 부분 */}
            <div style={{ flex: 1 }}>
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                id="question-image-input"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    // 로딩 상태 설정
                    setLoading(true);
                    setError(null);
                    
                    // 파일을 Base64로 변환
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      try {
                        if (typeof reader.result === 'string') {
                          // 이미지 데이터 저장
                          setQuestionImage(reader.result);
                          // 이미지 에디터 열기
                          setEditingImageIndex(-1);
                          setOriginalImageSrc(reader.result);
                          setImageSrc(reader.result);
                          setShowImageEditor(true);
                        }
                        setLoading(false);
                      } catch (err) {
                        console.error('이미지 로드 중 오류:', err);
                        setError('이미지를 로드하는 중 오류가 발생했습니다.');
                        setLoading(false);
                      }
                    };
                    
                    reader.onerror = () => {
                      setError('파일을 읽는 중 오류가 발생했습니다.');
                      setLoading(false);
                    };
                    
                    reader.readAsDataURL(file);
                  }
                }}
              />
              
              {!questionImage ? (
                <label htmlFor="question-image-input" className={styles['question-image-button']}>
                  🖼️ 질문 이미지 (선택사항)
                </label>
              ) : (
                renderQuestionImagePreview()
              )}
            </div>

            {/* 이미지 탐색 버튼 추가 */}
            <div style={{ flex: 1 }}>
              <button
                type="button"
                className={styles['question-image-button']}
                onClick={() => {
                  // 이미지 탐색 기능은 추후 구현
                  alert('이미지 탐색 기능은 준비 중입니다.');
                }}
              >
                🔍 이미지 탐색 (선택사항)
              </button>
            </div>
          </div>
          
          <div className={styles['content-required']}>
            <textarea
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="투표 질문을 입력하세요"              
              //autoFocus
              required
              onClick={(e) => e.stopPropagation()}
              rows={2}
              className={styles['required-field']}
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
          />
          <small className={styles['form-hint']}>URL 형식으로 입력하세요 (http:// 없이도 가능)</small>
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
                      onChange={(e) => handleImageSelect(e, index)}
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
                            onClick={(e) => {
                              e.stopPropagation();
                              const newOptions = [...options];
                              newOptions[index].image_url = '';
                              setOptions(newOptions);
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
          <button type="submit" className={styles['submit-btn']} disabled={loading}>
            {isEditMode ? '수정하기' : '내투표에 추가'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateVote; 