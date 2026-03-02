import hangul from 'hangul-js';

/**
 * 상표명을 기반으로 다양한 형태의 유사 검색어를 생성합니다.
 * @param trademarkName 원본 상표명
 * @returns 중복이 제거된 검색어 배열
 */
export function generateSearchKeywords(trademarkName: string): string[] {
  if (!trademarkName || typeof trademarkName !== 'string') {
    return [];
  }

  const keywords = new Set<string>();
  const original = trademarkName.trim();

  // 1. 원본 및 기본 변형
  keywords.add(original);
  keywords.add(original.toLowerCase());
  keywords.add(original.toUpperCase());

  // 2. 공백 제거
  const noSpaces = original.replace(/\s+/g, '');
  if (noSpaces.length > 0 && noSpaces !== original) {
    keywords.add(noSpaces);
    keywords.add(noSpaces.toLowerCase());
  }

  // 3. 한글 <-> 영어 발음 변환
  // 영어 -> 한글 변환
  if (/[a-zA-Z]/.test(original)) {
    const koreanPronunciation = hangul.assemble(hangul.d(original.toLowerCase()));
    if (koreanPronunciation && koreanPronunciation !== original) {
      keywords.add(koreanPronunciation);
    }

    // 특수 케이스: 영어 -> 한글
    const engToKorMap: { [key: string]: string[] } = {
      'overlap': ['오버랩', '오바랩'],
      'overlab': ['오버랩', '오바랩'],
      'ip': ['아이피'],
      'dr': ['닥터', '디알'],
      'doctor': ['닥터'],
      'smart': ['스마트'],
      'phone': ['폰'],
      'mobile': ['모바일'],
      'digital': ['디지털'],
      'tech': ['테크'],
      'soft': ['소프트'],
      'ware': ['웨어'],
      'cloud': ['클라우드'],
      'web': ['웹'],
      'app': ['앱'],
      'ai': ['에이아이', '인공지능'],
      'vr': ['브이알', '가상현실'],
      'ar': ['에이알', '증강현실']
    };

    const lowerOriginal = original.toLowerCase();
    if (engToKorMap[lowerOriginal]) {
      engToKorMap[lowerOriginal].forEach(kor => keywords.add(kor));
    }
  }

  // 한글 -> 영어 변환
  if (/[가-힣]/.test(original)) {
    const korToEngMap: { [key: string]: string[] } = {
      '오버랩': ['overlap', 'overlab'],
      '오바랩': ['overlap', 'overlab'],
      '아이피': ['ip'],
      '닥터': ['dr', 'doctor'],
      '디알': ['dr'],
      '스마트': ['smart'],
      '폰': ['phone'],
      '모바일': ['mobile'],
      '디지털': ['digital'],
      '테크': ['tech'],
      '소프트': ['soft'],
      '웨어': ['ware'],
      '클라우드': ['cloud'],
      '웹': ['web'],
      '앱': ['app'],
      '에이아이': ['ai'],
      '인공지능': ['ai'],
      '브이알': ['vr'],
      '가상현실': ['vr'],
      '에이알': ['ar'],
      '증강현실': ['ar']
    };

    if (korToEngMap[original]) {
      korToEngMap[original].forEach(eng => keywords.add(eng));
    }
  }

  // 4. 띄어쓰기 변형
  // Overlap -> Over Lap
  if (/^[A-Z][a-z]+[A-Z][a-z]+/.test(original)) {
    const match = original.match(/[A-Z][a-z]+/g);
    if (match && match.length > 1) {
      keywords.add(match.join(' '));
      keywords.add(match.join(' ').toLowerCase());
    }
  }
  // Over Lap -> OverLap
  if (original.includes(' ')) {
    keywords.add(original.replace(/\s/g, ''));
  }

  // 5. 복합어 분리 (예: mark25 -> mark, 25)
  if (original.includes(' ')) {
    const parts = original.split(/\s+/);
    if (parts.length > 1) {
      parts.forEach(part => {
        if (part.length > 0) {
          keywords.add(part);
          keywords.add(part.toLowerCase());
          keywords.add(part.toUpperCase());
        }
      });
      
      // 복합어 유사발음 변형 추가
      const lowerParts = parts.map(p => p.toLowerCase());
      const combinedLower = lowerParts.join('');
      
      // 특수 케이스: 복합어 -> 유사발음
      const compoundToSimilar: { [key: string]: string[] } = {
        'overlab': ['overlap', '오버랩', '오바랩'],
        'iplab': ['ip lab', '아이피랩'],
        'smartphone': ['smart phone', '스마트폰'],
        'webapp': ['web app', '웹앱'],
        'aiplatform': ['ai platform', '에이아이플랫폼']
      };
      
      if (compoundToSimilar[combinedLower]) {
        compoundToSimilar[combinedLower].forEach(similar => keywords.add(similar));
      }
      
      // "Over Lab" -> "overlap" 특별 케이스
      if (combinedLower === 'overlab') {
        keywords.add('overlap');
        keywords.add('오버랩');
        keywords.add('오바랩');
      }
    }
  }

  // 6. 특수문자 제거 변형
  const noSpecialChars = original.replace(/[^\w\s가-힣]/g, '');
  if (noSpecialChars !== original && noSpecialChars.length > 0) {
    keywords.add(noSpecialChars);
    keywords.add(noSpecialChars.toLowerCase());
  }

  const result = Array.from(keywords).filter(Boolean);
  console.log(`[Keyword Generator] Generated ${result.length} keywords for "${original}":`, result);
  return result;
}
