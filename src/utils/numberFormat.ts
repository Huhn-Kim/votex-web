/**
 * 숫자를 한국어 표기법으로 포맷팅하는 함수
 * @param num 포맷팅할 숫자
 * @returns 포맷팅된 문자열
 */
export const formatNumber = (num: number): string => {
  if (num >= 10000000) { // 천만 이상
    const value = (num / 10000000).toFixed(1);
    return `${value.endsWith('.0') ? value.slice(0, -2) : value}천만`;
  } else if (num >= 10000) { // 만 이상
    const value = (num / 10000).toFixed(1);
    // 소수점이 있는 경우 (예: 3.5)는 그대로 표시
    if (value.includes('.') && !value.endsWith('.0')) {
      return `${value}만`;
    }
    // 소수점이 없거나 .0인 경우
    return `${value.endsWith('.0') ? value.slice(0, -2) : value}만`;
  } else if (num >= 1000) { // 천 이상
    const value = (num / 1000).toFixed(1);
    // 소수점이 있는 경우 (예: 1.5)는 그대로 표시
    if (value.includes('.') && !value.endsWith('.0')) {
      return `${value}천`;
    }
    // 소수점이 없거나 .0인 경우
    return `${value.endsWith('.0') ? value.slice(0, -2) : value}천`;
  }
  return num.toString();
}; 