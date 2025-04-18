/**
 * URL 형식 검증 및 변환 함수
 * URL이 http:// 또는 https://로 시작하지 않으면 http://를 추가합니다.
 * 
 * @param url 변환할 URL 문자열
 * @returns 형식이 검증된 URL 문자열
 */
export const formatUrl = (url: string): string => {
  if (!url) return '';
  
  // URL이 http:// 또는 https://로 시작하지 않으면 http://를 추가
  if (!url.match(/^https?:\/\//i)) {
    return `http://${url}`;
  }
  
  return url;
};

/**
 * 입력된 URL이 유효한지 검사합니다.
 * 
 * @param url 검사할 URL 문자열
 * @returns 유효한 URL이면 true, 아니면 false
 */
export const isValidUrl = (url: string): boolean => {
  if (!url) return false;
  
  try {
    // URL이 http:// 또는 https://로 시작하는지 확인
    const formattedUrl = formatUrl(url);
    new URL(formattedUrl);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * URL이 비디오 파일을 가리키는지 확인합니다.
 * 
 * @param url 검사할 URL 문자열
 * @returns 비디오 URL이면 true, 아니면 false
 */
export const isVideoUrl = (url: string): boolean => {
  if (!url) return false;
  
  const videoExtensions = ['.mp4', '.mov', '.avi', '.wmv', '.flv', '.webm'];
  return videoExtensions.some(ext => url.toLowerCase().endsWith(ext));
}; 