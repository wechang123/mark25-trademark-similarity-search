/**
 * 상표 최종 분석 노드 - 실제 KIPRIS 데이터 기반 분석
 * 
 * 3가지 핵심 평가 기준:
 * 1. 유사군 코드 적합성
 * 2. 상표 식별력
 * 3. 선행 상표 유사도
 */

import { TrademarkAnalysisState, PartialTrademarkAnalysisState } from '../types/state';
import { generateAIAnalysis } from '@/infrastructure/ai/server-ai-analysis';
import { 
  recordFinalAnalysisEvent,
  updateSessionProgress 
} from '@/infrastructure/database/workflow-events';
import { initializeAPILogger } from '@/infrastructure/logging';

/**
 * 상세한 기준에 맞춘 분석 프롬프트 
 */
function createAnalysisPrompt(state: TrademarkAnalysisState): string {
  const { trademarkName, businessDescription } = state.initialInput;
  const kiprisData = state.analysisResults?.kipris?.data;
  const overlappingTrademarks = kiprisData?.similarTrademarks || [];
  const similarGroupCodes = state.initialInput.similarGroupCodes || [];

  return `
당신은 대한민국 상표 전문 변리사입니다. 아래 상표법 조문을 정확히 적용하여 상표 등록 가능성을 분석해주세요.
각 법 조항을 하나하나 개별적으로 체크하고, 반드시 Google과 Naver 검색을 통해 저명성 검토를 수행하세요.

[분석 대상 상표]
- 상표명: ${trademarkName}
- 사업 설명: ${businessDescription}
- 선택된 유사군 코드: ${similarGroupCodes.join(', ')}

[KIPRIS 검색 결과]
- 유사 상표: ${overlappingTrademarks.length}개 발견
${overlappingTrademarks.slice(0, 10).map(tm => 
  `  • ${tm.title} (출원: ${tm.applicationNumber}, 유사군: ${tm.similarGroupCodes?.join(',') || 'N/A'})`
).join('\n')}
[중요: 분석 순서 및 등록 가능성 계산]
⚠️ 반드시 아래 5가지 기준을 모두 먼저 분석한 후, 마지막에 registrationPossibility를 계산하세요.

registrationPossibility 계산 규칙:
- 5가지 기준 중 하나라도 점수가 0점이면 → registrationPossibility = 0
- 모든 기준이 0점 이상이면 → Gemini가 종합 판단으로 점수 측정

[법적 판단 기준 - 각 조항을 개별적으로 체크하세요]

1. 지정상품 적합성 분석
   - 사업 설명과 선택된 유사군 코드의 적합성을 종합적으로 판단
   - 추가로 필요한 유사군 코드가 있는지 검토
   - 비즈니스 전체를 포괄할 수 있는 유사군 제안

2. 식별력 평가 - 상표법 제33조 제1항 (각 호를 개별적으로 체크)
   
   제33조(상표등록의 요건) 
   ① 다음 각 호의 어느 하나에 해당하는 상표를 제외하고는 상표등록을 받을 수 있다.
   
   【제1호】 그 상품의 보통명칭을 보통으로 사용하는 방법으로 표시한 표장만으로 된 상표
   → 해당 여부 체크
   
   【제2호】 그 상품에 대하여 관용(慣用)하는 상표
   → 해당 여부 체크
   
   【제3호】 그 상품의 산지(産地)ㆍ품질ㆍ원재료ㆍ효능ㆍ용도ㆍ수량ㆍ형상ㆍ가격ㆍ생산방법ㆍ가공방법ㆍ사용방법 또는 시기를 보통으로 사용하는 방법으로 표시한 표장만으로 된 상표
   → 해당 여부 체크
   
   【제4호】 현저한 지리적 명칭이나 그 약어(略語) 또는 지도만으로 된 상표
   → 해당 여부 체크
   
   【제5호】 흔히 있는 성(姓) 또는 명칭을 보통으로 사용하는 방법으로 표시한 표장만으로 된 상표
   → 해당 여부 체크
   
   【제6호】 간단하고 흔히 있는 표장만으로 된 상표
   → 해당 여부 체크
   
   【제7호】 제1호부터 제6호까지에 해당하는 상표 외에 수요자가 누구의 업무에 관련된 상품을 표시하는 것인가를 식별할 수 없는 상표
   → 해당 여부 체크

3. 선등록 상표와의 관계 - 제34조 제1항 제7호, 제35조 제1항
   
   제34조(상표등록을 받을 수 없는 상표) 
   ① 제33조에도 불구하고 다음 각 호의 어느 하나에 해당하는 상표에 대해서는 상표등록을 받을 수 없다.
       7. 선출원(先出願)에 의한 타인의 등록상표(등록된 지리적 표시 단체표장은 제외한다)와 동일ㆍ유사한 상표로서 그 지정상품과 동일ㆍ유사한 상품에 사용하는 상표. 다만, 그 타인으로부터 상표등록에 대한 동의를 받은 경우(동일한 상표로서 그 지정상품과 동일한 상품에 사용하는 상표에 대하여 동의를 받은 경우는 제외한다)에는 상표등록을 받을 수 있다.
   
   제35조(선출원) 
   ① 동일ㆍ유사한 상품에 사용할 동일ㆍ유사한 상표에 대하여 다른 날에 둘 이상의 상표등록출원이 있는 경우에는 먼저 출원한 자만이 그 상표를 등록받을 수 있다.
   
   → KIPRIS 검색 결과와 비교하여 동일·유사 여부 판단

4. 불등록사유 검토 - 제34조 제1항 제1호~제6호 (각 호를 개별적으로 체크)
   
   제34조(상표등록을 받을 수 없는 상표) 
   ① 제33조에도 불구하고 다음 각 호의 어느 하나에 해당하는 상표에 대해서는 상표등록을 받을 수 없다.
   
   【제1호】 국가의 국기(國旗) 및 국제기구의 기장(記章) 등으로서 다음 각 목의 어느 하나에 해당하는 상표
       가. 대한민국의 국기, 국장(國章), 군기(軍旗), 훈장, 포장(褒章), 기장, 대한민국이나 공공기관의 감독용 또는 증명용 인장(印章)ㆍ기호와 동일ㆍ유사한 상표
       나. 「공업소유권의 보호를 위한 파리 협약」(이하 "파리협약"이라 한다) 동맹국, 세계무역기구 회원국 또는 「상표법조약」 체약국(이하 이 항에서 "동맹국등"이라 한다)의 국기와 동일ㆍ유사한 상표
       다. 국제적십자, 국제올림픽위원회 또는 저명(著名)한 국제기관의 명칭, 약칭, 표장과 동일ㆍ유사한 상표. 다만, 그 기관이 자기의 명칭, 약칭 또는 표장을 상표등록출원한 경우에는 상표등록을 받을 수 있다.
       라. 파리협약 제6조의3에 따라 세계지식재산기구로부터 통지받아 특허청장이 지정한 동맹국등의 문장(紋章), 기(旗), 훈장, 포장 또는 기장이나 동맹국등이 가입한 정부 간 국제기구의 명칭, 약칭, 문장, 기, 훈장, 포장 또는 기장과 동일ㆍ유사한 상표. 다만, 그 동맹국등이 가입한 정부 간 국제기구가 자기의 명칭ㆍ약칭, 표장을 상표등록출원한 경우에는 상표등록을 받을 수 있다.
       마. 파리협약 제6조의3에 따라 세계지식재산기구로부터 통지받아 특허청장이 지정한 동맹국등이나 그 공공기관의 감독용 또는 증명용 인장ㆍ기호와 동일ㆍ유사한 상표로서 그 인장 또는 기호가 사용되고 있는 상품과 동일ㆍ유사한 상품에 대하여 사용하는 상표
   → 해당 여부 체크
   
   【제2호】 국가ㆍ인종ㆍ민족ㆍ공공단체ㆍ종교 또는 저명한 고인(故人)과의 관계를 거짓으로 표시하거나 이들을 비방 또는 모욕하거나 이들에 대한 평판을 나쁘게 할 우려가 있는 상표
   → 해당 여부 체크
   
   【제3호】 국가ㆍ공공단체 또는 이들의 기관과 공익법인의 비영리 업무나 공익사업을 표시하는 표장으로서 저명한 것과 동일ㆍ유사한 상표. 다만, 그 국가 등이 자기의 표장을 상표등록출원한 경우에는 상표등록을 받을 수 있다.
   → 해당 여부 체크
   
   【제4호】 상표 그 자체 또는 상표가 상품에 사용되는 경우 수요자에게 주는 의미와 내용 등이 일반인의 통상적인 도덕관념인 선량한 풍속에 어긋나는 등 공공의 질서를 해칠 우려가 있는 상표
   → 해당 여부 체크
   
   【제5호】 정부가 개최하거나 정부의 승인을 받아 개최하는 박람회 또는 외국정부가 개최하거나 외국정부의 승인을 받아 개최하는 박람회의 상패ㆍ상장 또는 포장과 동일ㆍ유사한 표장이 있는 상표. 다만, 그 박람회에서 수상한 자가 그 수상한 상품에 관하여 상표의 일부로서 그 표장을 사용하는 경우에는 상표등록을 받을 수 있다.
   → 해당 여부 체크
   
   【제6호】 저명한 타인의 성명ㆍ명칭 또는 상호ㆍ초상ㆍ서명ㆍ인장ㆍ아호(雅號)ㆍ예명(藝名)ㆍ필명(筆名) 또는 이들의 약칭을 포함하는 상표. 다만, 그 타인의 승낙을 받은 경우에는 상표등록을 받을 수 있다.
   → 해당 여부 체크

5. 저명성 관련 검토 - 제34조 제1항 제9호~제14호 (반드시 인터넷 검색 수행)
   
   ⚠️ 중요: Google과 Naver 검색을 통해 각 항목별로 저명상표 해당 가능성을 검토하세요.
   검색어: "${trademarkName}", "${trademarkName} 브랜드", "${trademarkName} 회사" 등
   
   제34조(상표등록을 받을 수 없는 상표) 
   ① 제33조에도 불구하고 다음 각 호의 어느 하나에 해당하는 상표에 대해서는 상표등록을 받을 수 없다.
   
   【제9호】 타인의 상품을 표시하는 것이라고 수요자들에게 널리 인식되어 있는 상표(지리적 표시는 제외한다)와 동일ㆍ유사한 상표로서 그 타인의 상품과 동일ㆍ유사한 상품에 사용하는 상표
   → 인터넷 검색 수행 후 해당 여부 체크
   
   【제10호】 특정 지역의 상품을 표시하는 것이라고 수요자들에게 널리 인식되어 있는 타인의 지리적 표시와 동일ㆍ유사한 상표로서 그 지리적 표시를 사용하는 상품과 동일하다고 인정되어 있는 상품에 사용하는 상표
   → 인터넷 검색 수행 후 해당 여부 체크
   
   【제11호】 수요자들에게 현저하게 인식되어 있는 타인의 상품이나 영업과 혼동을 일으키게 하거나 그 식별력 또는 명성을 손상시킬 염려가 있는 상표
   → 인터넷 검색 수행 후 해당 여부 체크
   
   【제12호】 상품의 품질을 오인하게 하거나 수요자를 기만할 염려가 있는 상표
   → 인터넷 검색 수행 후 해당 여부 체크
   
   【제13호】 국내 또는 외국의 수요자들에게 특정인의 상품을 표시하는 것이라고 인식되어 있는 상표(지리적 표시는 제외한다)와 동일ㆍ유사한 상표로서 부당한 이익을 얻으려 하거나 그 특정인에게 손해를 입히려고 하는 등 부정한 목적으로 사용하는 상표
   → 인터넷 검색 수행 후 해당 여부 체크
   
   【제14호】 국내 또는 외국의 수요자들에게 특정 지역의 상품을 표시하는 것이라고 인식되어 있는 지리적 표시와 동일ㆍ유사한 상표로서 부당한 이익을 얻으려 하거나 그 지리적 표시의 정당한 사용자에게 손해를 입히려고 하는 등 부정한 목적으로 사용하는 상표
   → 인터넷 검색 수행 후 해당 여부 체크

[응답 형식]
⚠️ 중요: 먼저 5가지 기준을 모두 분석하고, 각각에 score를 부여한 후,
마지막에 registrationPossibility를 계산하세요.

📊 점수 부여 기준:
- 100-80점: 매우 우수 (등록 가능성에 긍정적인 영향)
- 79-60점: 양호 (일부 주의 필요하지만 전반적으로 긍정적)  
- 59-40점: 주의 필요 (개선이 필요한 수준)
- 39-20점: 위험 (심각한 문제가 있어 등록 어려움)
- 19-0점: 매우 위험 (등록 거의 불가능한 수준)

⚠️ Fail-fast 규칙: 5가지 기준 중 하나라도 0점이면 전체 등록 가능성은 0%

{
  "registrationPossibility": "5가지 기준 분석 후 마지막에 계산 (하나라도 0점이면 0)",
  
  "designatedGoodsCompatibility": {
    "score": 0~100,
    "summary": "사업 설명과 유사군 코드의 매칭 정도를 한 줄로 요약",
    "currentCodes": ["현재 선택된 유사군"],
    "recommendedAdditionalCodes": ["추가 권장 유사군"],
    "analysis": "상세 분석 내용"
  },
  
  "distinctiveness": {
    "score": 0~100,
    "summary": "상표의 식별력 수준을 한 줄로 요약",
    "article33Violations": [
      {
        "clauseNumber": 1,
        "clauseText": "제33조 제1항 제1호",
        "description": "그 상품의 보통명칭을 보통으로 사용하는 방법으로 표시한 표장만으로 된 상표",
        "violated": true/false,
        "reason": "판단 근거"
      },
      {
        "clauseNumber": 2,
        "clauseText": "제33조 제1항 제2호",
        "description": "그 상품에 대하여 관용하는 상표",
        "violated": true/false,
        "reason": "판단 근거"
      },
      {
        "clauseNumber": 3,
        "clauseText": "제33조 제1항 제3호",
        "description": "그 상품의 산지ㆍ품질ㆍ원재료ㆍ효능ㆍ용도ㆍ수량ㆍ형상ㆍ가격ㆍ생산방법ㆍ가공방법ㆍ사용방법 또는 시기를 보통으로 사용하는 방법으로 표시한 표장만으로 된 상표",
        "violated": true/false,
        "reason": "판단 근거"
      },
      {
        "clauseNumber": 4,
        "clauseText": "제33조 제1항 제4호",
        "description": "현저한 지리적 명칭이나 그 약어 또는 지도만으로 된 상표",
        "violated": true/false,
        "reason": "판단 근거"
      },
      {
        "clauseNumber": 5,
        "clauseText": "제33조 제1항 제5호",
        "description": "흔히 있는 성 또는 명칭을 보통으로 사용하는 방법으로 표시한 표장만으로 된 상표",
        "violated": true/false,
        "reason": "판단 근거"
      },
      {
        "clauseNumber": 6,
        "clauseText": "제33조 제1항 제6호",
        "description": "간단하고 흔히 있는 표장만으로 된 상표",
        "violated": true/false,
        "reason": "판단 근거"
      },
      {
        "clauseNumber": 7,
        "clauseText": "제33조 제1항 제7호",
        "description": "제1호부터 제6호까지에 해당하는 상표 외에 수요자가 누구의 업무에 관련된 상품을 표시하는 것인가를 식별할 수 없는 상표",
        "violated": true/false,
        "reason": "판단 근거"
      }
    ],
    "analysis": "종합 분석"
  },
  
  "priorTrademarkSimilarity": {
    "score": 0~100,
    "summary": "선등록 상표와의 유사성 정도를 한 줄로 요약",
    "article34_1_7_violated": true/false,
    "article35_1_violated": true/false,
    "conflictingTrademarks": [
      {
        "name": "상표명",
        "applicationNumber": "출원번호",
        "similarityType": "칭호/외관/관념",
        "riskLevel": "높음/중간/낮음"
      }
    ],
    "analysis": "상세 분석"
  },
  
  "nonRegistrableReasons": {
    "score": 0~100,
    "hasViolations": true/false,
    "summary": "불등록사유 해당 여부를 한 줄로 요약",
    "article34Violations": [
      {
        "clauseNumber": 1,
        "clauseText": "제34조 제1항 제1호",
        "description": "국가의 국기 및 국제기구의 기장 등",
        "violated": true/false,
        "reason": "판단 근거"
      },
      {
        "clauseNumber": 2,
        "clauseText": "제34조 제1항 제2호",
        "description": "국가ㆍ인종ㆍ민족ㆍ공공단체ㆍ종교 또는 저명한 고인과의 관계를 거짓으로 표시하거나 이들을 비방 또는 모욕하거나 이들에 대한 평판을 나쁘게 할 우려가 있는 상표",
        "violated": true/false,
        "reason": "판단 근거"
      },
      {
        "clauseNumber": 3,
        "clauseText": "제34조 제1항 제3호",
        "description": "국가ㆍ공공단체 또는 이들의 기관과 공익법인의 비영리 업무나 공익사업을 표시하는 표장으로서 저명한 것과 동일ㆍ유사한 상표",
        "violated": true/false,
        "reason": "판단 근거"
      },
      {
        "clauseNumber": 4,
        "clauseText": "제34조 제1항 제4호",
        "description": "상표 그 자체 또는 상표가 상품에 사용되는 경우 수요자에게 주는 의미와 내용 등이 일반인의 통상적인 도덕관념인 선량한 풍속에 어긋나는 등 공공의 질서를 해칠 우려가 있는 상표",
        "violated": true/false,
        "reason": "판단 근거"
      },
      {
        "clauseNumber": 5,
        "clauseText": "제34조 제1항 제5호",
        "description": "정부가 개최하거나 정부의 승인을 받아 개최하는 박람회의 상패ㆍ상장 또는 포장과 동일ㆍ유사한 표장이 있는 상표",
        "violated": true/false,
        "reason": "판단 근거"
      },
      {
        "clauseNumber": 6,
        "clauseText": "제34조 제1항 제6호",
        "description": "저명한 타인의 성명ㆍ명칭 또는 상호ㆍ초상ㆍ서명ㆍ인장ㆍ아호ㆍ예명ㆍ필명 또는 이들의 약칭을 포함하는 상표",
        "violated": true/false,
        "reason": "판단 근거"
      }
    ],
    "analysis": "종합 분석"
  },
  
  "famousnessCheck": {
    "score": 0~100,
    "searchPerformed": true,
    "summary": "저명상표 충돌 가능성을 한 줄로 요약",
    "searchResults": {
      "google": "Google 검색 결과 요약 - ${trademarkName}에 대한 기존 브랜드/기업 정보",
      "naver": "Naver 검색 결과 요약 - ${trademarkName}에 대한 국내 브랜드/기업 정보",
      "summary": "검색 종합 - 저명상표 여부 및 충돌 가능성 판단"
    },
    "article34FamousnessViolations": [
      {
        "clauseNumber": 9,
        "clauseText": "제34조 제1항 제9호",
        "description": "타인의 상품을 표시하는 것이라고 수요자들에게 널리 인식되어 있는 상표",
        "searchResults": "Google/Naver 검색 결과 요약",
        "violated": true/false,
        "conflictingBrand": "발견된 저명상표명 (있는 경우)",
        "reason": "판단 근거"
      },
      {
        "clauseNumber": 10,
        "clauseText": "제34조 제1항 제10호",
        "description": "특정 지역의 상품을 표시하는 것이라고 수요자들에게 널리 인식되어 있는 타인의 지리적 표시",
        "searchResults": "Google/Naver 검색 결과 요약",
        "violated": true/false,
        "reason": "판단 근거"
      },
      {
        "clauseNumber": 11,
        "clauseText": "제34조 제1항 제11호",
        "description": "수요자들에게 현저하게 인식되어 있는 타인의 상품이나 영업과 혼동을 일으키게 하거나 그 식별력 또는 명성을 손상시킬 염려가 있는 상표",
        "searchResults": "Google/Naver 검색 결과 요약",
        "violated": true/false,
        "reason": "판단 근거"
      },
      {
        "clauseNumber": 12,
        "clauseText": "제34조 제1항 제12호",
        "description": "상품의 품질을 오인하게 하거나 수요자를 기만할 염려가 있는 상표",
        "searchResults": "Google/Naver 검색 결과 요약",
        "violated": true/false,
        "reason": "판단 근거"
      },
      {
        "clauseNumber": 13,
        "clauseText": "제34조 제1항 제13호",
        "description": "국내 또는 외국의 수요자들에게 특정인의 상품을 표시하는 것이라고 인식되어 있는 상표와 동일ㆍ유사한 상표로서 부정한 목적으로 사용하는 상표",
        "searchResults": "Google/Naver 검색 결과 요약",
        "violated": true/false,
        "conflictingBrand": "발견된 저명상표명 (있는 경우)",
        "reason": "판단 근거"
      },
      {
        "clauseNumber": 14,
        "clauseText": "제34조 제1항 제14호",
        "description": "국내 또는 외국의 수요자들에게 특정 지역의 상품을 표시하는 것이라고 인식되어 있는 지리적 표시와 동일ㆍ유사한 상표로서 부정한 목적으로 사용하는 상표",
        "searchResults": "Google/Naver 검색 결과 요약",
        "violated": true/false,
        "reason": "판단 근거"
      }
    ],
    "analysis": "종합 분석"
  },
  
  "finalRecommendation": "등록 진행 권장/신중 검토 필요/등록 재검토 권장",
  "detailedAdvice": "구체적인 조언 및 대응 방안",
  "legalRisks": ["식별된 법적 리스크 목록"],
  "actionItems": ["권장 조치사항 목록"]
}
`;
}

/**
 * 실제 KIPRIS 데이터 기반 분석 결과 생성
 */
async function analyzeWithRealData(
  state: TrademarkAnalysisState
): Promise<any> {
  // 실제 KIPRIS 데이터 확인
  const kiprisData = state.analysisResults?.kipris?.data;
  if (!kiprisData || !kiprisData.similarTrademarks) {
    throw new Error('KIPRIS 검색 결과가 없습니다. kipris-search 노드를 먼저 실행해주세요.');
  }

  // AI 분석 요청 - 올바른 파라미터로 호출
  const prompt = createAnalysisPrompt(state);
  console.log('📝 [trademark-final-analysis] Calling generateAIAnalysis with custom prompt');
  
  const analysisResult = await generateAIAnalysis(
    state.initialInput.trademarkName,  // trademark
    state.initialInput.businessDescription,  // industry
    null,  // kiprisResult (이미 프롬프트에 포함)
    prompt  // customPrompt
  );

  // 결과 검증 및 정규화
  if (!analysisResult.success || !analysisResult.data) {
    throw new Error(analysisResult.error || 'AI 분석 실패');
  }
  
  const result = typeof analysisResult.data === 'string' 
    ? JSON.parse(analysisResult.data) 
    : analysisResult.data;

  console.log('📊 [trademark-final-analysis] AI response keys:', Object.keys(result));
  console.log('📊 [trademark-final-analysis] 5가지 기준 점수:', {
    designatedGoods: result.designatedGoodsCompatibility?.score || 0,
    distinctiveness: result.distinctiveness?.score || 0,
    priorTrademark: result.priorTrademarkSimilarity?.score || 0,
    nonRegistrable: result.nonRegistrableReasons?.score || 0,
    famousness: result.famousnessCheck?.score || 0
  });

  // 5가지 기준 점수 확인
  const scores = {
    designatedGoods: result.designatedGoodsCompatibility?.score || 0,
    distinctiveness: result.distinctiveness?.score || 0,
    priorTrademark: result.priorTrademarkSimilarity?.score || 0,
    nonRegistrable: result.nonRegistrableReasons?.score || 0,
    famousness: result.famousnessCheck?.score || 0
  };

  // Fail-fast 로직: 하나라도 0점이면 전체 0점
  const hasZeroScore = Object.values(scores).some(score => score === 0);
  
  let finalScore: number;
  if (hasZeroScore) {
    console.log('⚠️ [trademark-final-analysis] 0점 기준 발견 - 등록 가능성 0%');
    finalScore = 0;
  } else {
    // 모든 점수가 0점 이상이면 가중평균 계산 (각 20%)
    finalScore = (
      scores.designatedGoods * 0.2 +
      scores.distinctiveness * 0.2 +
      scores.priorTrademark * 0.2 +
      scores.nonRegistrable * 0.2 +
      scores.famousness * 0.2
    );
    console.log('✅ [trademark-final-analysis] 가중평균 계산:', finalScore);
  }

  return {
    ...result,
    registrationPossibility: Math.round(finalScore),
    timestamp: new Date().toISOString()
  };
}

/**
 * 상표 최종 분석 노드
 */
export async function trademarkFinalAnalysisNode(
  state: TrademarkAnalysisState
): Promise<PartialTrademarkAnalysisState> {
  console.log('[trademark-final-analysis] 실제 데이터 기반 분석 시작');
  const sessionId = state.sessionId || 'unknown';
  const isDebugMode = state.isDebugMode || false;
  
  // Initialize API logger for this session
  initializeAPILogger(sessionId, isDebugMode);

  try {
    // Update session to final_analysis stage
    await updateSessionProgress(sessionId, {
      current_stage: 'final_analysis',
      current_substep: 'analysis_request',
      progress: 70,
      status: 'processing'
    });

    // AI 분석 요청 시작
    await recordFinalAnalysisEvent(
      sessionId,
      'analysis_request',
      'processing',
      {
        model_used: 'gemini-2.5-pro',
        request_timestamp: new Date().toISOString()
      },
      isDebugMode
    );
    // 1. 실제 KIPRIS 데이터 기반 분석
    const startTime = Date.now();
    const analysisResult = await analyzeWithRealData(state);
    
    // AI 분석 응답 완료
    await recordFinalAnalysisEvent(
      sessionId,
      'analysis_response',
      'completed',
      {
        response_time_ms: Date.now() - startTime,
        registration_probability: analysisResult.registrationPossibility,
        risk_level: analysisResult.registrationPossibility > 70 ? 'low' : 
                   analysisResult.registrationPossibility > 40 ? 'medium' : 'high'
      },
      isDebugMode
    );
    
    // 보고서 준비 시작
    await recordFinalAnalysisEvent(
      sessionId,
      'prepare_report',
      'processing',
      {},
      isDebugMode
    );
    
    // 2. 데이터베이스 저장 (sessionId 사용)
    console.log('[trademark-final-analysis] Saving to DB with sessionId:', sessionId);
    
    // Direct Supabase query replacing repository.saveTrademarkFinalAnalysis
    const { createServiceRoleClient } = await import('@/infrastructure/database/server');
    const supabase = await createServiceRoleClient();
    
    // Extract designated goods from state
    const designatedGoods = state.initialInput.designatedProducts || 
                            state.initialInput.similarGroupCodes || 
                            [];
    
    // Get user_id from analysis_sessions
    const { data: sessionData, error: sessionError } = await supabase
      .schema('trademark_analysis')
      .from('analysis_sessions')
      .select('user_id')
      .eq('id', sessionId)
      .single();
    
    if (sessionError || !sessionData?.user_id) {
      console.error('[trademark-final-analysis] Failed to get user_id for session:', sessionError);
      console.warn('[trademark-final-analysis] 분석 결과 저장 실패 - user_id 없음');
    } else {
      const finalAnalysisData = {
        id: crypto.randomUUID(),
        session_id: sessionId,
        user_id: sessionData.user_id,
        registration_possibility: analysisResult.registrationPossibility || 0,
        
        // Designated goods compatibility
        designated_goods_compatibility_score: analysisResult.designatedGoodsCompatibility?.score || 0,
        designated_goods_compatibility_reason: analysisResult.designatedGoodsCompatibility?.analysis || '',
        designated_goods: analysisResult.designatedGoodsCompatibility?.currentCodes || designatedGoods || [],
        designated_goods_summary: analysisResult.designatedGoodsCompatibility?.summary || '',
        designated_goods_recommended: analysisResult.designatedGoodsCompatibility?.recommendedAdditionalCodes || [],
        
        // Distinctiveness (Article 33)
        distinctiveness_score: analysisResult.distinctiveness?.score || 0,
        distinctiveness_reason: analysisResult.distinctiveness?.analysis || '',
        distinctiveness_summary: analysisResult.distinctiveness?.summary || '',
        article_33_violations: analysisResult.distinctiveness?.article33Violations || [],
        
        // Prior trademark similarity
        prior_trademark_similarity_score: analysisResult.priorTrademarkSimilarity?.score || 0,
        prior_trademark_similarity_reason: analysisResult.priorTrademarkSimilarity?.analysis || '',
        prior_trademark_summary: analysisResult.priorTrademarkSimilarity?.summary || '',
        article_34_1_7_violation: analysisResult.priorTrademarkSimilarity?.article34_1_7_violated || false,
        article_35_1_violation: analysisResult.priorTrademarkSimilarity?.article35_1_violated || false,
        conflicting_trademarks: analysisResult.priorTrademarkSimilarity?.conflictingTrademarks || [],
        
        // Non-registrable reasons
        non_registrable_score: analysisResult.nonRegistrableReasons?.score || 0,
        non_registrable_summary: analysisResult.nonRegistrableReasons?.summary || '',
        article_34_1to6_violations: analysisResult.nonRegistrableReasons?.article34Violations || [],
        
        // Famousness check
        famousness_score: analysisResult.famousnessCheck?.score || 0,
        famousness_summary: analysisResult.famousnessCheck?.summary || '',
        article_34_9to14_violations: analysisResult.famousnessCheck?.article34FamousnessViolations || [],
        internet_search_results: analysisResult.famousnessCheck?.searchResults || {},
        
        // Final recommendation
        final_recommendation: analysisResult.finalRecommendation || '',
        detailed_advice: analysisResult.detailedAdvice || '',
        legal_risks: analysisResult.legalRisks || [],
        action_items: analysisResult.actionItems || [],
        
        processing_time_ms: null,
        is_debug_mode: isDebugMode || false,
        
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error: insertError } = await supabase
        .schema('trademark_analysis')
        .from('trademark_final_analysis')
        .insert(finalAnalysisData);

      if (insertError) {
        console.error('[trademark-final-analysis] Failed to save final analysis:', insertError);
        console.warn('[trademark-final-analysis] 분석 결과 저장 실패');
      } else {
        console.log('[trademark-final-analysis] 분석 결과 저장 완료');
      }
    }

    // 보고서 준비 완료
    await recordFinalAnalysisEvent(
      sessionId,
      'prepare_report',
      'completed',
      {
        recommendations: analysisResult.actionItems?.length || 0,
        // legal_risks: analysisResult.legalRisks?.length || 0 // Property not found in type
      },
      isDebugMode
    );
    
    // Update session progress - analysis completed
    await updateSessionProgress(sessionId, {
      current_stage: 'final_analysis',
      current_substep: 'prepare_report',  // Use the last valid substep instead of 'completed'
      progress: 100,
      status: 'completed'
    });
    
    // 3. 상태 업데이트
    return {
      comprehensiveAnalysisResult: analysisResult,
      currentStep: 'COMPLETE',  // 워크플로우 완료 표시
      progress: 100,  // 100%로 설정
      conversationHistory: [
        ...state.conversationHistory,
        {
          role: 'assistant',
          content: `상표 분석이 완료되었습니다. 등록 가능성: ${analysisResult.registrationPossibility}%`,
          type: 'result',
          metadata: {
            stepName: 'trademark-final-analysis',
            timestamp: new Date().toISOString()
          }
        }
      ]
    };

  } catch (error) {
    console.error('[trademark-final-analysis] 분석 실패:', error);
    
    // 에러 처리 - 실제 데이터가 없을 경우 명확한 메시지
    return {
      currentStep: 'ERROR',
      errors: [
        {
          step: 'trademark-final-analysis',
          error: error instanceof Error ? error.message : '분석 중 오류 발생',
          timestamp: new Date().toISOString(),
          recoverable: false
        }
      ],
      conversationHistory: [
        ...state.conversationHistory,
        {
          role: 'assistant',
          content: '상표 분석 중 오류가 발생했습니다. KIPRIS 검색 결과를 확인해주세요.',
          type: 'result',
          metadata: {
            stepName: 'trademark-final-analysis',
            error: true,
            timestamp: new Date().toISOString()
          }
        }
      ]
    };
  }
}

/**
 * 분석 결과 포맷팅 헬퍼
 */
export function formatAnalysisResult(result: any): string {
  // Check for violations
  const hasArticle33Violations = result.distinctiveness?.article33Violations?.some((v: any) => v.violated) || false;
  const hasArticle34_1to6Violations = result.nonRegistrableReasons?.article34Violations?.some((v: any) => v.violated) || false;
  const hasArticle34_7Violation = result.priorTrademarkSimilarity?.article34_1_7_violated || false;
  const hasArticle35_1Violation = result.priorTrademarkSimilarity?.article35_1_violated || false;
  const hasArticle34_9to14Violations = result.famousnessCheck?.article34FamousnessViolations?.some((v: any) => v.violated) || false;

  // Format violations for display
  const formatViolations = (violations: any[], articleName: string) => {
    const violated = violations?.filter((v: any) => v.violated) || [];
    if (violated.length === 0) return '✅ 위반사항 없음';
    return violated.map((v: any) => `❌ ${v.clauseText}: ${v.reason}`).join('\n   ');
  };

  return `
📊 상표 등록 가능성 종합 분석 결과

✅ 등록 가능성: ${result.registrationPossibility}%

📈 세부 평가:

1️⃣ 지정상품 적합성: ${result.designatedGoodsCompatibility?.score}점
   📝 ${result.designatedGoodsCompatibility?.summary}
   • 현재 유사군: ${result.designatedGoodsCompatibility?.currentCodes?.join(', ') || '없음'}
   • 추가 권장: ${result.designatedGoodsCompatibility?.recommendedAdditionalCodes?.join(', ') || '없음'}
   
2️⃣ 식별력 (제33조): ${result.distinctiveness?.score}점
   📝 ${result.distinctiveness?.summary}
   ${formatViolations(result.distinctiveness?.article33Violations, '제33조')}
   
3️⃣ 선등록 상표 (제34조 1항 7호, 제35조 1항): ${result.priorTrademarkSimilarity?.score}점
   📝 ${result.priorTrademarkSimilarity?.summary}
   • 제34조 1항 7호: ${hasArticle34_7Violation ? '❌ 위반' : '✅ 문제없음'}
   • 제35조 1항: ${hasArticle35_1Violation ? '❌ 위반' : '✅ 문제없음'}
   ${result.priorTrademarkSimilarity?.conflictingTrademarks?.length > 0 ? 
     `• 충돌 상표: ${result.priorTrademarkSimilarity.conflictingTrademarks.map((t: any) => 
       `${t.name} (${t.riskLevel})`).join(', ')}` : ''}

4️⃣ 불등록사유 (제34조 1항 1-6호): ${hasArticle34_1to6Violations ? '⚠️ 위반사항 있음' : '✅ 문제없음'}
   📝 ${result.nonRegistrableReasons?.summary}
   ${formatViolations(result.nonRegistrableReasons?.article34Violations, '제34조 1-6호')}

5️⃣ 저명성 검토 (제34조 1항 9-14호): ${hasArticle34_9to14Violations ? '⚠️ 위반사항 있음' : '✅ 문제없음'}
   📝 ${result.famousnessCheck?.summary}
   ${formatViolations(result.famousnessCheck?.article34FamousnessViolations, '제34조 9-14호')}

🎯 최종 권고: ${result.finalRecommendation}

💡 상세 조언:
${result.detailedAdvice}

⚠️ 법적 리스크:
${result.legalRisks?.map((risk: string) => `• ${risk}`).join('\n') || '• 특별한 리스크 없음'}

✅ 권장 조치사항:
${result.actionItems?.map((item: string) => `• ${item}`).join('\n') || '• 현재 상태로 진행 가능'}
`;
}