import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { VoteTopic } from '../lib/types';
import { useAuth } from '../context/AuthContext';
import { useVoteContext } from '../context/VoteContext';
import '../styles/VoteAnalysisPage.css';
import LoadingOverlay from './LoadingOverlay';
import VoteCard from './VoteCard';
import supabase from '../lib/supabase';

// 더미 데이터 인터페이스 정의
interface DemographicData {
  gender: {
    male: number;
    female: number;
  };
  age: {
    age10to19: number;
    age20to29: number;
    age30to39: number;
    age40to49: number;
    age50to59: number;
    age60to69: number;
    age70to79: number;
    age80plus: number;
  };
  region: Record<string, number>;
  
  optionDemographics: {
    [optionId: number]: {
      gender: {
        male: number;
        female: number;
      };
      age: {
        age10to19: number;
        age20to29: number;
        age30to39: number;
        age40to49: number;
        age50to59: number;
        age60to69: number;
        age70to79: number;
        age80plus: number;
      };
      region: Record<string, number>;
    }
  }
}

const VoteAnalysisPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { updateVote } = useVoteContext();
  
  const [topic, setTopic] = useState<VoteTopic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'gender' | 'age' | 'region'>('overview');
  
  // 더미 데이터 생성 (실제로는 API에서 가져와야 함)
  const [demographicData, setDemographicData] = useState<DemographicData>({
    gender: {
      male: 0,
      female: 0
    },
    age: {
      age10to19: 0,
      age20to29: 0,
      age30to39: 0,
      age40to49: 0,
      age50to59: 0,
      age60to69: 0,
      age70to79: 0,
      age80plus: 0
    },
    region: {},
    optionDemographics: {}
  });
  
  // 투표 주제 데이터 로드
  useEffect(() => {
    const fetchVoteData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const topicId = parseInt(id);
        
        // 투표 주제 데이터 가져오기
        const { data: topic, error: topicError } = await supabase
          .from('vote_topics')
          .select(`
            *,
            users:user_id (username, profile_Image, user_grade),
            options:vote_options (id, text, votes, image_class, image_url, gender_stats, region_stats, age_stats)
          `)
          .eq('id', topicId)
          .single();
        
        if (topicError) {
          if (topicError.code === 'PGRST116') {
            setError('해당 투표를 찾을 수 없습니다.');
            return;
          }
          throw topicError;
        }
        
        // 사용자가 로그인한 경우 vote_results 테이블에서 사용자 투표 데이터 가져오기
        let selectedOption = null;
        if (user && user.id) {
          const { data: userVote } = await supabase
            .from('vote_results')
            .select('option_id')
            .eq('topic_id', topicId)
            .eq('user_id', user.id)
            .maybeSingle();
          
          if (userVote) {
            selectedOption = userVote.option_id;
          }
        }
        
        // 투표 주제 데이터 처리
        if (!topic) {
          setError('투표 데이터를 불러올 수 없습니다.');
          return;
        }
        
        // 선택된 옵션 정보 추가
        const processedTopic = {
          ...topic,
          selected_option: selectedOption,
          users: topic.users || {
            id: '',
            username: '알 수 없음',
            email: '',
            profile_Image: '',
            user_grade: 0,
            created_at: '',
            updated_at: ''
          }
        };
        
        setTopic(processedTopic);
        
        // 실제 데이터로 인구통계 데이터 생성
        generateDemographicData(processedTopic);
      } catch (err) {
        console.error('투표 데이터 로드 오류:', err);
        setError('투표 데이터를 불러오는 데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchVoteData();
  }, [id, user]);
  
  // 더미 데이터 생성 함수
  const generateDemographicData = (topic: VoteTopic) => {
    if (!topic || !topic.options) return;
    
    const genderData = {
      male: 0,
      female: 0
    };
    
    const optionDemographics: Record<number, any> = {};
    
    topic.options.forEach(option => {
      const genderStats = option.gender_stats || { male: 0, female: 0 };
      
      genderData.male += genderStats.male || 0;
      genderData.female += genderStats.female || 0;
      
      optionDemographics[option.id] = {
        gender: {
          male: genderStats.male || 0,
          female: genderStats.female || 0
        },
        age: option.age_stats || {},
        region: option.region_stats || {}
      };
    });
    
    setDemographicData({
      gender: genderData,
      age: calculateTotalAgeData(optionDemographics),
      region: calculateTotalRegionData(optionDemographics),
      optionDemographics
    });
  };
  
  // 전체 연령대 데이터 계산
  const calculateTotalAgeData = (optionDemographics: Record<number, any>): DemographicData['age'] => {
    const totalAgeData: DemographicData['age'] = {
      age10to19: 0,
      age20to29: 0,
      age30to39: 0,
      age40to49: 0,
      age50to59: 0,
      age60to69: 0,
      age70to79: 0,
      age80plus: 0
    };
    
    Object.values(optionDemographics).forEach(demographics => {
      if (demographics.age) {
        Object.entries(demographics.age).forEach(([ageGroup, count]) => {
          totalAgeData[ageGroup as keyof DemographicData['age']] = 
            (totalAgeData[ageGroup as keyof DemographicData['age']] || 0) + (count as number);
        });
      }
    });
    
    return totalAgeData;
  };
  
  // 전체 지역 데이터 계산
  const calculateTotalRegionData = (optionDemographics: Record<number, any>): Record<string, number> => {
    const totalRegionData: Record<string, number> = {
      seoul: 0,
      gyeonggi: 0,
      incheon: 0,
      busan: 0,
      daegu: 0,
      daejeon: 0,
      gwangju: 0,
      ulsan: 0,
      sejong: 0,
      gangwon: 0,
      chungnam: 0,
      chungbuk: 0,
      jeonnam: 0,
      jeonbuk: 0,
      gyeongsang: 0,
      gyeongnam: 0,
      jeolla: 0,
      jeju: 0
    };

    Object.values(optionDemographics).forEach(demographics => {
      if (demographics.region) {
        Object.entries(demographics.region).forEach(([region, count]) => {
          totalRegionData[region] = (totalRegionData[region] || 0) + (count as number);
        });
      }
    });

    return totalRegionData;
  };
  
  // 탭 변경 핸들러
  const handleTabChange = (tab: 'overview' | 'gender' | 'age' | 'region') => {
    setActiveTab(tab);
  };
  
  // 투표 핸들러
  const handleVote = async (topicId: number, optionId: number) => {
    if (!user) return;
    
    try {
      await updateVote(topicId, optionId);
      
      // 투표 후 데이터 다시 가져오기 (gender_stats 포함)
      const { data: updatedTopic, error: topicError } = await supabase
        .from('vote_topics')
        .select(`
          *,
          users:user_id (username, profile_Image, user_grade),
          options:vote_options (id, text, votes, image_class, image_url, gender_stats)
        `)
        .eq('id', topicId)
        .single();
      
      if (topicError) {
        throw topicError;
      }
      
      // 사용자의 투표 정보 가져오기
      const { data: userVote } = await supabase
        .from('vote_results')
        .select('option_id')
        .eq('topic_id', topicId)
        .eq('user_id', user.id)
        .maybeSingle();
      
      // 선택된 옵션 정보 추가
      const processedTopic = {
        ...updatedTopic,
        selected_option: userVote ? userVote.option_id : null,
        users: updatedTopic.users || {
          id: '',
          username: '알 수 없음',
          email: '',
          profile_Image: '',
          user_grade: 0,
          created_at: '',
          updated_at: ''
        }
      };
      
      setTopic(processedTopic);
      generateDemographicData(processedTopic);
    } catch (err) {
      console.error('투표 오류:', err);
    }
  };
  
  // 좋아요/싫어요 핸들러 (현재는 더미 함수)
  const handleLike = async () => {
    // VoteCard에서 필수 prop이지만 이 화면에서는 실제 구현 필요 없음
  };
    
  // 성별 차트 렌더링
  const renderGenderChart = () => {
    const { gender, optionDemographics } = demographicData;
    const total = gender.male + gender.female;
    
    if (total <= 0) return <div className="no-data">데이터가 없습니다.</div>;
    
    const malePercentage = (gender.male / total * 100).toFixed(1);
    const femalePercentage = (gender.female / total * 100).toFixed(1);
    
    const optionsList = topic ? topic.options.map(opt => ({
      id: opt.id,
      text: opt.text,
      color: `hsl(${opt.id * 50}, 70%, 60%)`
    })) : [];
    
    const calculateGenderOptionPercentages = (genderType: 'male' | 'female') => {
      if (!topic || !optionDemographics) return [];
      
      const genderTotal = gender[genderType];
      if (genderTotal <= 0) return [];
      
      return topic.options.map(option => {
        const votes = optionDemographics[option.id]?.gender[genderType] || 0;
        const percentage = genderTotal > 0 ? (votes / genderTotal) * 100 : 0;
        return {
          id: option.id,
          text: option.text,
          votes,
          percentage
        };
      }).sort((a, b) => b.percentage - a.percentage);
    };
    
    const maleOptions = calculateGenderOptionPercentages('male');
    const femaleOptions = calculateGenderOptionPercentages('female');
    
    return (
      <div className="demographic-chart">
        <h3>성별 투표 분포</h3>
        <div className="bar-chart-container">
          <div className="bar-chart-item">
            <div className="bar-label">남성</div>
            <div className="bar-container">
              <div className="bar male-bar" style={{ width: `${malePercentage}%` }}></div>
              <span className="bar-value">{malePercentage}% ({gender.male}명)</span>
            </div>
          </div>
          <div className="bar-chart-item">
            <div className="bar-label">여성</div>
            <div className="bar-container">
              <div className="bar female-bar" style={{ width: `${femalePercentage}%` }}></div>
              <span className="bar-value">{femalePercentage}% ({gender.female}명)</span>
            </div>
          </div>
        </div>
        <div className="chart-analysis">
          <p className="analysis-title">AI 분석 결과</p>
          <p>이 투표에서는 {gender.male > gender.female ? '남성' : '여성'}의 참여율이 더 높게 나타났습니다. 
          {Math.abs(gender.male - gender.female) > total * 0.2 
            ? '두 성별 간의 큰 차이는 주제에 대한 관심도나 의견 성향의 차이를 시사할 수 있습니다.' 
            : '두 성별 간의 참여율은 비교적 균등하게 분포되어 있습니다.'}</p>
        </div>

        <div className="option-demographics">
          <h4 className="option-demographics-title">성별 옵션 선택 현황</h4>
          
          {gender.male > 0 && (
            <div className="demographic-option-group">
              <div className="demographic-name">
                <div className="demographic-icon male-icon"></div>
                <h5>남성이 선택한 옵션</h5>
              </div>
              <div className="stacked-bar-container">
                {maleOptions.map((option, index) => (
                  <div 
                    key={option.id} 
                    className="stacked-bar-segment"
                    style={{ 
                      width: `${option.percentage}%`,
                      backgroundColor: optionsList.find(opt => opt.id === option.id)?.color || `hsl(${index * 60}, 70%, 60%)`,
                      left: `${maleOptions.slice(0, index).reduce((sum, opt) => sum + opt.percentage, 0)}%`
                    }}
                    title={`${option.text}: ${option.percentage.toFixed(1)}% (${option.votes}명)`}
                  >
                    {option.percentage >= 10 && (
                      <span className="stacked-bar-label">{option.percentage.toFixed(1)}%</span>
                    )}
                  </div>
                ))}
              </div>
              <div className="demographic-option-legend">
                {maleOptions.map((option, index) => (
                  <div key={option.id} className="legend-item">
                    <div 
                      className="legend-color" 
                      style={{ 
                        backgroundColor: optionsList.find(opt => opt.id === option.id)?.color || `hsl(${index * 60}, 70%, 60%)`
                      }}
                    ></div>
                    <div className="legend-text">
                      <span className="legend-label">{option.text}</span>
                      <span className="legend-value">{option.percentage.toFixed(1)}% ({option.votes}명)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {gender.female > 0 && (
            <div className="demographic-option-group">
              <div className="demographic-name">
                <div className="demographic-icon female-icon"></div>
                <h5>여성이 선택한 옵션</h5>
              </div>
              <div className="stacked-bar-container">
                {femaleOptions.map((option, index) => (
                  <div 
                    key={option.id} 
                    className="stacked-bar-segment"
                    style={{ 
                      width: `${option.percentage}%`,
                      backgroundColor: optionsList.find(opt => opt.id === option.id)?.color || `hsl(${index * 60}, 70%, 60%)`,
                      left: `${femaleOptions.slice(0, index).reduce((sum, opt) => sum + opt.percentage, 0)}%`
                    }}
                    title={`${option.text}: ${option.percentage.toFixed(1)}% (${option.votes}명)`}
                  >
                    {option.percentage >= 10 && (
                      <span className="stacked-bar-label">{option.percentage.toFixed(1)}%</span>
                    )}
                  </div>
                ))}
              </div>
              <div className="demographic-option-legend">
                {femaleOptions.map((option, index) => (
                  <div key={option.id} className="legend-item">
                    <div 
                      className="legend-color" 
                      style={{ 
                        backgroundColor: optionsList.find(opt => opt.id === option.id)?.color || `hsl(${index * 60}, 70%, 60%)`
                      }}
                    ></div>
                    <div className="legend-text">
                      <span className="legend-label">{option.text}</span>
                      <span className="legend-value">{option.percentage.toFixed(1)}% ({option.votes}명)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  // 연령 차트 렌더링
  const renderAgeChart = () => {
    const { age, optionDemographics } = demographicData;
    const total = Object.values(age).reduce((sum, votes) => sum + votes, 0);
    
    if (total <= 0) return <div className="no-data">데이터가 없습니다.</div>;
    
    const ageCategories: { key: keyof DemographicData['age']; label: string; count: number }[] = [
      { key: 'age10to19', label: '10-19세', count: age.age10to19 },
      { key: 'age20to29', label: '20-29세', count: age.age20to29 },
      { key: 'age30to39', label: '30-39세', count: age.age30to39 },
      { key: 'age40to49', label: '40-49세', count: age.age40to49 },
      { key: 'age50to59', label: '50-59세', count: age.age50to59 },
      { key: 'age60to69', label: '60-69세', count: age.age60to69 },
      { key: 'age70to79', label: '70-79세', count: age.age70to79 },
      { key: 'age80plus', label: '80세 이상', count: age.age80plus }
    ];
    
    // 가장 많은 투표를 한 연령대 찾기
    const maxVoteAgeCategory = ageCategories.reduce((max, category) => 
      category.count > max.count ? category : max, ageCategories[0]);
    
    // 전체 옵션의 목록을 준비
    const optionsList = topic ? topic.options.map(opt => ({
      id: opt.id,
      text: opt.text,
      color: `hsl(${opt.id * 50}, 70%, 60%)`
    })) : [];
    
    // 연령대에 따른 옵션 선택 비율 계산
    const calculateAgeOptionPercentages = (ageType: keyof DemographicData['age']) => {
      if (!topic || !optionDemographics) return [];
      
      const ageTotal = age[ageType];
      if (ageTotal <= 0) return [];
      
      return topic.options.map(option => {
        const votes = optionDemographics[option.id]?.age[ageType] || 0;
        const percentage = ageTotal > 0 ? (votes / ageTotal) * 100 : 0;
        return {
          id: option.id,
          text: option.text,
          votes,
          percentage
        };
      }).sort((a, b) => b.percentage - a.percentage);
    };
    
    return (
      <div className="demographic-chart">
        <h3>연령별 투표 분포</h3>
        <div className="bar-chart-container">
          {ageCategories.map(category => {
            const percentage = (category.count / total * 100).toFixed(1);
            return (
              <div className="bar-chart-item" key={category.key}>
                <div className="bar-label">{category.label}</div>
                <div className="bar-container">
                  <div 
                    className={`bar age-bar ${category.key === maxVoteAgeCategory.key ? 'max-vote-bar' : ''}`} 
                    style={{ width: `${percentage}%` }}
                  ></div>
                  <span className="bar-value">{percentage}% ({category.count}명)</span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="chart-analysis">
          <p className="analysis-title">AI 분석 결과</p>
          <p>이 투표에서는 <strong>{maxVoteAgeCategory.label}</strong> 연령대가 가장 활발하게 참여했습니다. 
          이는 이 연령대가 주제에 대해 높은 관심도를 보이거나, 투표 플랫폼 접근성이 높기 때문일 수 있습니다. 
          {age.age10to19 + age.age20to29 > total * 0.5 
            ? '전체적으로 젊은 연령대가 투표에 더 많이 참여했습니다.' 
            : age.age40to49 + age.age50to59 > total * 0.5 
              ? '전체적으로 고연령대가 투표에 더 많이 참여했습니다.'
              : '투표 참여는 전체 연령대에 걸쳐 비교적 고르게 분포되어 있습니다.'}</p>
        </div>

        {/* 연령대 기준으로 어떤 옵션을 선택했는지 보여줌 */}
        <div className="option-demographics">
          <h4 className="option-demographics-title">연령대별 옵션 선택 현황</h4>
          
          {ageCategories.map(category => {
            const ageVotes = category.count;
            if (ageVotes <= 0) return null;
            
            const ageOptions = calculateAgeOptionPercentages(category.key);
            if (ageOptions.length === 0) return null;
            
            return (
              <div key={category.key} className="demographic-option-group">
                <div className="demographic-name">
                  <div className={`demographic-icon age-${category.key}-icon`}></div>
                  <h5>{category.label} 연령대가 선택한 옵션</h5>
                </div>
                <div className="stacked-bar-container">
                  {ageOptions.map((option, index) => (
                    <div 
                      key={option.id} 
                      className="stacked-bar-segment"
                      style={{ 
                        width: `${option.percentage}%`,
                        backgroundColor: optionsList.find(opt => opt.id === option.id)?.color || `hsl(${index * 60}, 70%, 60%)`,
                        left: `${ageOptions.slice(0, index).reduce((sum, opt) => sum + opt.percentage, 0)}%`
                      }}
                      title={`${option.text}: ${option.percentage.toFixed(1)}% (${option.votes}명)`}
                    >
                      {option.percentage >= 10 && (
                        <span className="stacked-bar-label">{option.percentage.toFixed(1)}%</span>
                      )}
                    </div>
                  ))}
                </div>
                <div className="demographic-option-legend">
                  {ageOptions.map((option, index) => (
                    <div key={option.id} className="legend-item">
                      <div 
                        className="legend-color" 
                        style={{ 
                          backgroundColor: optionsList.find(opt => opt.id === option.id)?.color || `hsl(${index * 60}, 70%, 60%)`
                        }}
                      ></div>
                      <div className="legend-text">
                        <span className="legend-label">{option.text}</span>
                        <span className="legend-value">{option.percentage.toFixed(1)}% ({option.votes}명)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  
  // 지역 차트 렌더링
  const renderRegionChart = () => {
    const { region, optionDemographics } = demographicData;
    const total = Object.values(region).reduce((sum, votes) => sum + votes, 0);

    if (total <= 0) return <div className="no-data">데이터가 없습니다.</div>;

    // 지역 카테고리 정의
    const regionCategories: { key: string; label: string; count: number }[] = [
      { key: 'seoul', label: '서울', count: region.seoul },
      { key: 'gyeonggi', label: '경기', count: region.gyeonggi },
      { key: 'incheon', label: '인천', count: region.incheon },
      { key: 'busan', label: '부산', count: region.busan },
      { key: 'daegu', label: '대구', count: region.daegu },
      { key: 'daejeon', label: '대전', count: region.daejeon },
      { key: 'gwangju', label: '광주', count: region.gwangju },
      { key: 'ulsan', label: '울산', count: region.ulsan },
      { key: 'sejong', label: '세종', count: region.sejong },
      { key: 'gangwon', label: '강원', count: region.gangwon },
      { key: 'chungnam', label: '충남', count: region.chungnam },
      { key: 'chungbuk', label: '충북', count: region.chungbuk },
      { key: 'jeonnam', label: '전남', count: region.jeonnam },
      { key: 'jeonbuk', label: '전북', count: region.jeonbuk },
      { key: 'gyeongsang', label: '경상', count: region.gyeongsang },
      { key: 'gyeongnam', label: '경남', count: region.gyeongnam },
      { key: 'jeolla', label: '전라', count: region.jeolla },
      { key: 'jeju', label: '제주', count: region.jeju }
    ];

    // 지역 데이터를 배열로 변환하고 투표수 기준으로 정렬
    const sortedRegions = regionCategories.sort((a, b) => b.count - a.count);

    // 가장 많은 투표를 한 지역 찾기
    const maxVoteRegion = sortedRegions[0];

    // 전체 옵션의 목록을 준비
    const optionsList = topic ? topic.options.map(opt => ({
      id: opt.id,
      text: opt.text,
      color: `hsl(${opt.id * 50}, 70%, 60%)`
    })) : [];

    // 지역에 따른 옵션 선택 비율 계산
    const calculateRegionOptionPercentages = (regionKey: string) => {
      if (!topic || !optionDemographics) return [];

      const regionTotal = region[regionKey] || 0;
      if (regionTotal <= 0) return [];

      return topic.options.map(option => {
        const votes = optionDemographics[option.id]?.region[regionKey] || 0;
        const percentage = regionTotal > 0 ? (votes / regionTotal) * 100 : 0;
        return {
          id: option.id,
          text: option.text,
          votes,
          percentage
        };
      }).sort((a, b) => b.percentage - a.percentage);
    };

    return (
      <div className="demographic-chart">
        <h3>지역별 투표 분포</h3>
        <div className="bar-chart-container">
          {sortedRegions.map(({ key, label, count }) => {
            const percentage = (count / total * 100).toFixed(1);
            return (
              <div className="bar-chart-item" key={key}>
                <div className="bar-label">{label}</div>
                <div className="bar-container">
                  <div 
                    className={`bar region-bar ${key === maxVoteRegion.key ? 'max-vote-bar' : ''}`} 
                    style={{ width: `${percentage}%` }}
                  ></div>
                  <span className="bar-value">{percentage}% ({count}명)</span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="chart-analysis">
          <p className="analysis-title">AI 분석 결과</p>
          <p>이 투표에서는 <strong>{maxVoteRegion.label}</strong> 지역에서 가장 높은 참여율을 보였습니다. 
          이는 투표 주제가 해당 지역과 관련이 있거나, 이 지역의 사용자가 플랫폼을 더 많이 이용하기 때문일 수 있습니다.
          {sortedRegions[0].count > total * 0.3 
            ? '특정 지역의 참여율이 매우 높게 나타났습니다.' 
            : '전반적으로 투표는 여러 지역에 고르게 분포되어 있습니다.'}</p>
        </div>

        {/* 지역 기준으로 어떤 옵션을 선택했는지 보여줌 */}
        <div className="option-demographics">
          <h4 className="option-demographics-title">지역별 옵션 선택 현황</h4>
          
          {/* 상위 5개 지역만 보여줌 */}
          {sortedRegions.slice(0, 5).map(({ key, label, count }) => {
            if (count <= 0) return null;
            
            const regionOptions = calculateRegionOptionPercentages(key);
            if (regionOptions.length === 0) return null;
            
            return (
              <div key={key} className="demographic-option-group">
                <div className="demographic-name">
                  <div className="demographic-icon region-icon"></div>
                  <h5>{label} 지역에서 선택한 옵션</h5>
                </div>
                <div className="stacked-bar-container">
                  {regionOptions.map((option, index) => (
                    <div 
                      key={option.id} 
                      className="stacked-bar-segment"
                      style={{ 
                        width: `${option.percentage}%`,
                        backgroundColor: optionsList.find(opt => opt.id === option.id)?.color || `hsl(${index * 60}, 70%, 60%)`,
                        left: `${regionOptions.slice(0, index).reduce((sum, opt) => sum + opt.percentage, 0)}%`
                      }}
                      title={`${option.text}: ${option.percentage.toFixed(1)}% (${option.votes}명)`}
                    >
                      {option.percentage >= 10 && (
                        <span className="stacked-bar-label">{option.percentage.toFixed(1)}%</span>
                      )}
                    </div>
                  ))}
                </div>
                <div className="demographic-option-legend">
                  {regionOptions.map((option, index) => (
                    <div key={option.id} className="legend-item">
                      <div 
                        className="legend-color" 
                        style={{ 
                          backgroundColor: optionsList.find(opt => opt.id === option.id)?.color || `hsl(${index * 60}, 70%, 60%)`
                        }}
                      ></div>
                      <div className="legend-text">
                        <span className="legend-label">{option.text}</span>
                        <span className="legend-value">{option.percentage.toFixed(1)}% ({option.votes}명)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  
  // 개요 차트 렌더링
  const renderOverviewCharts = () => {
    return (
      <div className="overview-charts">
        {renderGenderChart()}
        {renderAgeChart()}
        {renderRegionChart()}
      </div>
    );
  };
  
  if (loading) return <LoadingOverlay isLoading={true} progress={50} progressStatus="분석 데이터 로딩 중..." />;
  
  if (error) {
    return (
      <div className="error-container">
        <h2>오류가 발생했습니다</h2>
        <p>{error}</p>
        <button onClick={() => navigate(-1)}>뒤로 가기</button>
      </div>
    );
  }
  
  if (!topic) {
    return (
      <div className="error-container">
        <h2>투표를 찾을 수 없습니다</h2>
        <button onClick={() => navigate(-1)}>뒤로 가기</button>
      </div>
    );
  }
  
  return (
    <div className="vote-analysis-page">
      <div className="analysis-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <h1>투표 상세 분석</h1>
      </div>
      
      <div className="vote-card-container">
        <VoteCard 
          topic={topic}
          onVote={handleVote}
          onLike={handleLike}
          alwaysShowResults={true}
          disableOptions={false}
        />
      </div>
      
      <div className="analysis-container">
        <div className="analysis-tabs">
          <button 
            className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => handleTabChange('overview')}
          >
            전체 개요
          </button>
          <button 
            className={`tab-button ${activeTab === 'gender' ? 'active' : ''}`}
            onClick={() => handleTabChange('gender')}
          >
            성별 분석
          </button>
          <button 
            className={`tab-button ${activeTab === 'age' ? 'active' : ''}`}
            onClick={() => handleTabChange('age')}
          >
            연령별 분석
          </button>
          <button 
            className={`tab-button ${activeTab === 'region' ? 'active' : ''}`}
            onClick={() => handleTabChange('region')}
          >
            지역별 분석
          </button>
        </div>
        
        <div className="tab-content">
          {activeTab === 'overview' && renderOverviewCharts()}
          {activeTab === 'gender' && renderGenderChart()}
          {activeTab === 'age' && renderAgeChart()}
          {activeTab === 'region' && renderRegionChart()}
        </div>
      </div>
    </div>
  );
};

export default VoteAnalysisPage; 