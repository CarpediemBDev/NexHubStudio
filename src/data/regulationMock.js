/**
 * 규격/규제 정보 관리 - Mock 데이터
 *
 * 실제 4개 테이블 구조와 1:1로 대응한다.
 *   REG_INFO          -> regInfoList        (정보 레코드 / 마스터)
 *   REG_INFO_TARGET   -> record.targets     (멀티 셀렉트 대상, 화면 편의상 마스터에 내장)
 *   REG_INFO_HIST     -> regHistList        (변경 이력, 수정 = 새 버전 INSERT)
 *   REG_CONFLICT_HIST -> regConflictList    (충돌 판정 이력)
 *
 * 설계문서: docs/규격규제_정보관리_설계.md
 */

/* ------------------------------------------------------------------ *
 * 1. 코드 마스터 (타겟 후보) - 계층은 parentCd / levelNo 로 표현
 * ------------------------------------------------------------------ */

// 분야 (마스터 단일 값, 멀티 아님)
export const fieldCodes = [
  { code: 'SAFETY', name: '안전' },
  { code: 'EMC', name: '전자파(EMC)' },
  { code: 'RF', name: '무선(RF)' },
  { code: 'ENERGY', name: '에너지' },
  { code: 'ENV', name: '환경/유해물질' },
  { code: 'RECYCLE', name: '자원순환' },
  { code: 'LABEL', name: '표시/라벨' },
  { code: 'BROADCAST', name: '방송/통신' },
  { code: 'CHEM', name: '화학물질' },
  { code: 'ACCESS', name: '접근성' }
]

// 사업부 (levelNo 1) > 제품군 (2) > 제품 (3)
export const divisionCodes = [
  { code: 'VD', name: 'VD사업부(영상디스플레이)', levelNo: 1 },
  { code: 'DA', name: 'DA사업부(생활가전)', levelNo: 1 },
  { code: 'MX', name: 'MX사업부(모바일)', levelNo: 1 }
]

export const productGroupCodes = [
  { code: 'PG_TV', name: 'TV', parentCd: 'VD', levelNo: 2 },
  { code: 'PG_MON', name: '모니터', parentCd: 'VD', levelNo: 2 },
  { code: 'PG_SIGN', name: '사이니지', parentCd: 'VD', levelNo: 2 },
  { code: 'PG_PROJ', name: '프로젝터', parentCd: 'VD', levelNo: 2 },
  { code: 'PG_REF', name: '냉장고', parentCd: 'DA', levelNo: 2 },
  { code: 'PG_PHONE', name: '스마트폰', parentCd: 'MX', levelNo: 2 }
]

export const productCodes = [
  { code: 'P_QLED', name: 'QLED TV', parentCd: 'PG_TV', levelNo: 3 },
  { code: 'P_NEO', name: 'Neo QLED TV', parentCd: 'PG_TV', levelNo: 3 },
  { code: 'P_OLED', name: 'OLED TV', parentCd: 'PG_TV', levelNo: 3 },
  { code: 'P_8K', name: '8K TV', parentCd: 'PG_TV', levelNo: 3 },
  { code: 'P_LIFE', name: '라이프스타일 TV', parentCd: 'PG_TV', levelNo: 3 },
  { code: 'P_MON27', name: '27" 모니터', parentCd: 'PG_MON', levelNo: 3 },
  { code: 'P_SIGN55', name: '55" 사이니지', parentCd: 'PG_SIGN', levelNo: 3 },
  { code: 'P_PROJ4K', name: '4K 프로젝터', parentCd: 'PG_PROJ', levelNo: 3 },
  { code: 'P_REF900', name: '비스포크 900L', parentCd: 'PG_REF', levelNo: 3 },
  { code: 'P_FOLD', name: '폴더블폰', parentCd: 'PG_PHONE', levelNo: 3 }
]

// 권역 (levelNo 1) > 국가 (2)
export const regionCodes = [
  { code: 'R_ASIA', name: '아시아', levelNo: 1 },
  { code: 'R_EU', name: '유럽', levelNo: 1 },
  { code: 'R_NA', name: '북미', levelNo: 1 },
  { code: 'R_LA', name: '중남미', levelNo: 1 },
  { code: 'R_MEA', name: '중동/아프리카', levelNo: 1 },
  { code: 'R_OCE', name: '오세아니아', levelNo: 1 }
]

export const countryCodes = [
  // 아시아 (24)
  { code: 'KR', name: '한국', parentCd: 'R_ASIA', levelNo: 2 },
  { code: 'JP', name: '일본', parentCd: 'R_ASIA', levelNo: 2 },
  { code: 'CN', name: '중국', parentCd: 'R_ASIA', levelNo: 2 },
  { code: 'VN', name: '베트남', parentCd: 'R_ASIA', levelNo: 2 },
  { code: 'IN', name: '인도', parentCd: 'R_ASIA', levelNo: 2 },
  { code: 'TW', name: '대만', parentCd: 'R_ASIA', levelNo: 2 },
  { code: 'HK', name: '홍콩', parentCd: 'R_ASIA', levelNo: 2 },
  { code: 'MO', name: '마카오', parentCd: 'R_ASIA', levelNo: 2 },
  { code: 'SG', name: '싱가포르', parentCd: 'R_ASIA', levelNo: 2 },
  { code: 'TH', name: '태국', parentCd: 'R_ASIA', levelNo: 2 },
  { code: 'MY', name: '말레이시아', parentCd: 'R_ASIA', levelNo: 2 },
  { code: 'ID', name: '인도네시아', parentCd: 'R_ASIA', levelNo: 2 },
  { code: 'PH', name: '필리핀', parentCd: 'R_ASIA', levelNo: 2 },
  { code: 'BN', name: '브루나이', parentCd: 'R_ASIA', levelNo: 2 },
  { code: 'MM', name: '미얀마', parentCd: 'R_ASIA', levelNo: 2 },
  { code: 'KH', name: '캄보디아', parentCd: 'R_ASIA', levelNo: 2 },
  { code: 'LA', name: '라오스', parentCd: 'R_ASIA', levelNo: 2 },
  { code: 'BD', name: '방글라데시', parentCd: 'R_ASIA', levelNo: 2 },
  { code: 'PK', name: '파키스탄', parentCd: 'R_ASIA', levelNo: 2 },
  { code: 'LK', name: '스리랑카', parentCd: 'R_ASIA', levelNo: 2 },
  { code: 'NP', name: '네팔', parentCd: 'R_ASIA', levelNo: 2 },
  { code: 'MN', name: '몽골', parentCd: 'R_ASIA', levelNo: 2 },
  { code: 'KZ', name: '카자흐스탄', parentCd: 'R_ASIA', levelNo: 2 },
  { code: 'UZ', name: '우즈베키스탄', parentCd: 'R_ASIA', levelNo: 2 },
  // 유럽 (34)
  { code: 'FR', name: '프랑스', parentCd: 'R_EU', levelNo: 2 },
  { code: 'DE', name: '독일', parentCd: 'R_EU', levelNo: 2 },
  { code: 'IT', name: '이탈리아', parentCd: 'R_EU', levelNo: 2 },
  { code: 'ES', name: '스페인', parentCd: 'R_EU', levelNo: 2 },
  { code: 'PL', name: '폴란드', parentCd: 'R_EU', levelNo: 2 },
  { code: 'GB', name: '영국', parentCd: 'R_EU', levelNo: 2 },
  { code: 'NL', name: '네덜란드', parentCd: 'R_EU', levelNo: 2 },
  { code: 'BE', name: '벨기에', parentCd: 'R_EU', levelNo: 2 },
  { code: 'LU', name: '룩셈부르크', parentCd: 'R_EU', levelNo: 2 },
  { code: 'AT', name: '오스트리아', parentCd: 'R_EU', levelNo: 2 },
  { code: 'CH', name: '스위스', parentCd: 'R_EU', levelNo: 2 },
  { code: 'SE', name: '스웨덴', parentCd: 'R_EU', levelNo: 2 },
  { code: 'NO', name: '노르웨이', parentCd: 'R_EU', levelNo: 2 },
  { code: 'DK', name: '덴마크', parentCd: 'R_EU', levelNo: 2 },
  { code: 'FI', name: '핀란드', parentCd: 'R_EU', levelNo: 2 },
  { code: 'IS', name: '아이슬란드', parentCd: 'R_EU', levelNo: 2 },
  { code: 'IE', name: '아일랜드', parentCd: 'R_EU', levelNo: 2 },
  { code: 'PT', name: '포르투갈', parentCd: 'R_EU', levelNo: 2 },
  { code: 'GR', name: '그리스', parentCd: 'R_EU', levelNo: 2 },
  { code: 'CY', name: '키프로스', parentCd: 'R_EU', levelNo: 2 },
  { code: 'MT', name: '몰타', parentCd: 'R_EU', levelNo: 2 },
  { code: 'CZ', name: '체코', parentCd: 'R_EU', levelNo: 2 },
  { code: 'SK', name: '슬로바키아', parentCd: 'R_EU', levelNo: 2 },
  { code: 'HU', name: '헝가리', parentCd: 'R_EU', levelNo: 2 },
  { code: 'RO', name: '루마니아', parentCd: 'R_EU', levelNo: 2 },
  { code: 'BG', name: '불가리아', parentCd: 'R_EU', levelNo: 2 },
  { code: 'HR', name: '크로아티아', parentCd: 'R_EU', levelNo: 2 },
  { code: 'SI', name: '슬로베니아', parentCd: 'R_EU', levelNo: 2 },
  { code: 'RS', name: '세르비아', parentCd: 'R_EU', levelNo: 2 },
  { code: 'EE', name: '에스토니아', parentCd: 'R_EU', levelNo: 2 },
  { code: 'LV', name: '라트비아', parentCd: 'R_EU', levelNo: 2 },
  { code: 'LT', name: '리투아니아', parentCd: 'R_EU', levelNo: 2 },
  { code: 'UA', name: '우크라이나', parentCd: 'R_EU', levelNo: 2 },
  { code: 'TR', name: '튀르키예', parentCd: 'R_EU', levelNo: 2 },
  // 북미 (3)
  { code: 'US', name: '미국', parentCd: 'R_NA', levelNo: 2 },
  { code: 'CA', name: '캐나다', parentCd: 'R_NA', levelNo: 2 },
  { code: 'MX', name: '멕시코', parentCd: 'R_NA', levelNo: 2 },
  // 중남미 (14)
  { code: 'BR', name: '브라질', parentCd: 'R_LA', levelNo: 2 },
  { code: 'AR', name: '아르헨티나', parentCd: 'R_LA', levelNo: 2 },
  { code: 'CL', name: '칠레', parentCd: 'R_LA', levelNo: 2 },
  { code: 'CO', name: '콜롬비아', parentCd: 'R_LA', levelNo: 2 },
  { code: 'PE', name: '페루', parentCd: 'R_LA', levelNo: 2 },
  { code: 'EC', name: '에콰도르', parentCd: 'R_LA', levelNo: 2 },
  { code: 'UY', name: '우루과이', parentCd: 'R_LA', levelNo: 2 },
  { code: 'PY', name: '파라과이', parentCd: 'R_LA', levelNo: 2 },
  { code: 'BO', name: '볼리비아', parentCd: 'R_LA', levelNo: 2 },
  { code: 'VE', name: '베네수엘라', parentCd: 'R_LA', levelNo: 2 },
  { code: 'CR', name: '코스타리카', parentCd: 'R_LA', levelNo: 2 },
  { code: 'PA', name: '파나마', parentCd: 'R_LA', levelNo: 2 },
  { code: 'GT', name: '과테말라', parentCd: 'R_LA', levelNo: 2 },
  { code: 'DO', name: '도미니카공화국', parentCd: 'R_LA', levelNo: 2 },
  // 중동/아프리카 (20)
  { code: 'AE', name: 'UAE', parentCd: 'R_MEA', levelNo: 2 },
  { code: 'SA', name: '사우디아라비아', parentCd: 'R_MEA', levelNo: 2 },
  { code: 'QA', name: '카타르', parentCd: 'R_MEA', levelNo: 2 },
  { code: 'KW', name: '쿠웨이트', parentCd: 'R_MEA', levelNo: 2 },
  { code: 'BH', name: '바레인', parentCd: 'R_MEA', levelNo: 2 },
  { code: 'OM', name: '오만', parentCd: 'R_MEA', levelNo: 2 },
  { code: 'IL', name: '이스라엘', parentCd: 'R_MEA', levelNo: 2 },
  { code: 'JO', name: '요르단', parentCd: 'R_MEA', levelNo: 2 },
  { code: 'IQ', name: '이라크', parentCd: 'R_MEA', levelNo: 2 },
  { code: 'IR', name: '이란', parentCd: 'R_MEA', levelNo: 2 },
  { code: 'EG', name: '이집트', parentCd: 'R_MEA', levelNo: 2 },
  { code: 'MA', name: '모로코', parentCd: 'R_MEA', levelNo: 2 },
  { code: 'TN', name: '튀니지', parentCd: 'R_MEA', levelNo: 2 },
  { code: 'DZ', name: '알제리', parentCd: 'R_MEA', levelNo: 2 },
  { code: 'NG', name: '나이지리아', parentCd: 'R_MEA', levelNo: 2 },
  { code: 'GH', name: '가나', parentCd: 'R_MEA', levelNo: 2 },
  { code: 'KE', name: '케냐', parentCd: 'R_MEA', levelNo: 2 },
  { code: 'ET', name: '에티오피아', parentCd: 'R_MEA', levelNo: 2 },
  { code: 'TZ', name: '탄자니아', parentCd: 'R_MEA', levelNo: 2 },
  { code: 'ZA', name: '남아프리카공화국', parentCd: 'R_MEA', levelNo: 2 },
  // 오세아니아 (5)
  { code: 'AU', name: '호주', parentCd: 'R_OCE', levelNo: 2 },
  { code: 'NZ', name: '뉴질랜드', parentCd: 'R_OCE', levelNo: 2 },
  { code: 'FJ', name: '피지', parentCd: 'R_OCE', levelNo: 2 },
  { code: 'PG', name: '파푸아뉴기니', parentCd: 'R_OCE', levelNo: 2 },
  { code: 'NC', name: '뉴칼레도니아', parentCd: 'R_OCE', levelNo: 2 }
]

// 규제 (levelNo 1) > 규격 (2)
export const regulationCodes = [
  { code: 'RG_KC_SAFE', name: '전기용품 및 생활용품 안전관리법(안전확인)', levelNo: 1 },
  { code: 'RG_RADIO', name: '전파법(방송통신기자재 적합성평가)', levelNo: 1 },
  { code: 'RG_ENERGY', name: '에너지이용 합리화법(효율관리기자재)', levelNo: 1 },
  { code: 'RG_STANDBY', name: '에너지이용 합리화법(대기전력저감프로그램)', levelNo: 1 },
  { code: 'RG_EPR', name: '전자제품등 자원순환법', levelNo: 1 },
  { code: 'RG_KREACH', name: '화학물질등록평가법(K-REACH)', levelNo: 1 },
  { code: 'RG_BCAST', name: '방송법/지상파 UHD 수신 규격', levelNo: 1 },
  { code: 'RG_LABEL', name: '제품 표시·광고 규정(한글 표시)', levelNo: 1 },
  { code: 'RG_EU_LVD', name: 'EU 저전압지침 LVD 2014/35/EU', levelNo: 1 },
  { code: 'RG_EU_ELABEL', name: 'EU 에너지라벨 규정 2017/1369', levelNo: 1 },
  { code: 'RG_EU_EMC', name: 'EU EMC 지침 2014/30/EU', levelNo: 1 },
  // 권역별 해외 레코드(15~25)용
  { code: 'RG_ASEAN_EMC', name: 'ASEAN 전기전자 EMC 상호인정협정(MRA)', levelNo: 1 },
  { code: 'RG_JP_PSE', name: '일본 전기용품안전법(PSE)', levelNo: 1 },
  { code: 'RG_CN_CCC', name: '중국 강제성제품인증(CCC)', levelNo: 1 },
  { code: 'RG_EU_ROHS', name: 'EU RoHS 지침 2011/65/EU', levelNo: 1 },
  { code: 'RG_UKCA', name: '영국 제품안전 규정(UKCA)', levelNo: 1 },
  { code: 'RG_US_FCC', name: '미국 FCC Part 15 / 캐나다 ICES-003', levelNo: 1 },
  { code: 'RG_MX_NOM', name: '멕시코 NOM 공식표준', levelNo: 1 },
  { code: 'RG_LA_SAFE', name: '중남미 국가별 전기안전 인증', levelNo: 1 },
  { code: 'RG_GCC', name: 'GCC 기술규정 / 중동·아프리카 수입 적합성', levelNo: 1 },
  { code: 'RG_OCE_RCM', name: '호주·뉴질랜드 EESS / RCM', levelNo: 1 },
  { code: 'RG_IECEE_CB', name: 'IECEE CB Scheme', levelNo: 1 }
]

export const standardCodes = [
  { code: 'ST_62368', name: 'KC 62368-1 (AV·ICT 기기 안전)', parentCd: 'RG_KC_SAFE', levelNo: 2 },
  { code: 'ST_KN32', name: 'KN 32 (전자파 방사 허용기준)', parentCd: 'RG_RADIO', levelNo: 2 },
  { code: 'ST_KN35', name: 'KN 35 (전자파 내성 기준)', parentCd: 'RG_RADIO', levelNo: 2 },
  { code: 'ST_RF_WIFI', name: '무선설비규칙 5GHz WLAN 기술기준', parentCd: 'RG_RADIO', levelNo: 2 },
  { code: 'ST_EFF_TV', name: '효율관리기자재 운용규정 [별표] 텔레비전수상기', parentCd: 'RG_ENERGY', levelNo: 2 },
  { code: 'ST_STANDBY', name: '대기전력저감프로그램 운용규정(TV)', parentCd: 'RG_STANDBY', levelNo: 2 },
  { code: 'ST_KROHS', name: 'K-RoHS 유해물질 6종 제한', parentCd: 'RG_EPR', levelNo: 2 },
  { code: 'ST_EPR_RATE', name: 'EPR 재활용의무율 고시', parentCd: 'RG_EPR', levelNo: 2 },
  { code: 'ST_SEPARATE', name: '분리배출 표시에 관한 지침', parentCd: 'RG_EPR', levelNo: 2 },
  { code: 'ST_KREACH_REG', name: 'K-REACH 등록·신고 대상물질', parentCd: 'RG_KREACH', levelNo: 2 },
  { code: 'ST_ATSC3', name: 'ATSC 3.0 / TTA 지상파 UHD 수신 규격', parentCd: 'RG_BCAST', levelNo: 2 },
  { code: 'ST_KOR_LABEL', name: '전기용품 한글 표시사항 기준', parentCd: 'RG_LABEL', levelNo: 2 },
  { code: 'ST_EN62368', name: 'EN IEC 62368-1', parentCd: 'RG_EU_LVD', levelNo: 2 },
  { code: 'ST_EU_ELABEL', name: 'EU 2019/2013 (전자 디스플레이 에너지라벨)', parentCd: 'RG_EU_ELABEL', levelNo: 2 },
  { code: 'ST_EN55032', name: 'EN 55032 / EN 55035', parentCd: 'RG_EU_EMC', levelNo: 2 },
  { code: 'ST_ASEAN_CISPR32', name: 'CISPR 32 (ASEAN 조화 EMC 방사 기준)', parentCd: 'RG_ASEAN_EMC', levelNo: 2 },
  { code: 'ST_JP_J62368', name: 'J62368-1 (일본 AV·ICT 기기 안전)', parentCd: 'RG_JP_PSE', levelNo: 2 },
  { code: 'ST_GB4943', name: 'GB 4943.1 (중국 AV·ICT 기기 안전)', parentCd: 'RG_CN_CCC', levelNo: 2 },
  { code: 'ST_EN63000', name: 'EN IEC 63000 (RoHS 기술문서)', parentCd: 'RG_EU_ROHS', levelNo: 2 },
  { code: 'ST_BS62368', name: 'BS EN IEC 62368-1', parentCd: 'RG_UKCA', levelNo: 2 },
  { code: 'ST_FCC15B', name: 'FCC Part 15 Subpart B / ICES-003', parentCd: 'RG_US_FCC', levelNo: 2 },
  { code: 'ST_NOM001', name: 'NOM-001-SCFI (전자기기 안전)', parentCd: 'RG_MX_NOM', levelNo: 2 },
  { code: 'ST_IEC62368_LA', name: 'IEC 62368-1 국가 채택판 (NBR/IRAM 등)', parentCd: 'RG_LA_SAFE', levelNo: 2 },
  { code: 'ST_GSO_IEC62368', name: 'GSO IEC 62368-1', parentCd: 'RG_GCC', levelNo: 2 },
  { code: 'ST_ASNZS62368', name: 'AS/NZS 62368.1', parentCd: 'RG_OCE_RCM', levelNo: 2 },
  { code: 'ST_CB62368', name: 'IEC 62368-1 (CB 시험 기준)', parentCd: 'RG_IECEE_CB', levelNo: 2 }
]

export const statusCodes = [
  { code: 'DRAFT', name: '작성중' },
  { code: 'REVIEW', name: '검토중' },
  { code: 'ACTIVE', name: '시행중' },
  { code: 'EXPIRED', name: '폐지' }
]

export const conflictTypes = [
  { code: 'SAME', name: '동일범위', desc: '기존 레코드와 적용 범위가 완전히 같음 (중복 등록)' },
  { code: 'PARENT', name: '신규가 상위', desc: '신규 레코드가 기존 레코드를 포함 (예: 신규 유럽 ⊃ 기존 프랑스)' },
  { code: 'CHILD', name: '신규가 하위', desc: '기존 레코드가 신규 레코드를 포함 (예: 기존 유럽 ⊃ 신규 프랑스)' },
  { code: 'OVERLAP', name: '부분중복', desc: '포함관계 없이 일부 범위만 겹침' }
]

export const decisionCodes = [
  { code: 'KEEP_BOTH', name: '둘 다 유지(예외 인정)' },
  { code: 'MERGE', name: '기존을 신규로 흡수(기존 폐지)' },
  { code: 'EXCLUDE', name: '신규 범위에서 기존 대상 제외' },
  { code: 'REPLACE', name: '기존 레코드 개정(새 버전)' },
  { code: 'CANCEL', name: '신규 등록 취소' }
]

/* ------------------------------------------------------------------ *
 * 2. REG_INFO + REG_INFO_TARGET
 *    targets: [{ targetType, targetCd }] - 실제 테이블 1행 = 배열 1요소
 * ------------------------------------------------------------------ */

const t = (targetType, codes) => codes.map((targetCd) => ({ targetType, targetCd }))

// 권역에 속한 국가 코드 전부 (except 는 제외)
const countriesOf = (regionCd, except = []) =>
  countryCodes.filter((c) => c.parentCd === regionCd && !except.includes(c.code)).map((c) => c.code)

export const regInfoList = [
  {
    regInfoId: 1,
    regNo: 'REG-2026-0001',
    title: 'KC 안전확인 (전기용품 및 생활용품 안전관리법)',
    fieldCd: 'SAFETY',
    markNm: 'KC 마크 + 안전확인신고번호',
    authority: '국가기술표준원(KATS) / 지정 시험기관',
    url: 'https://www.law.go.kr/법령/전기용품및생활용품안전관리법',
    summary: 'TV는 안전확인대상 전기용품. 지정 시험기관 시험 후 안전확인신고 → KC 마크와 신고번호를 제품·포장·설명서에 표시.',
    statusCd: 'ACTIVE',
    versionNo: 3,
    effectiveDt: '2026-01-01',
    modDt: '2026-07-14',
    modId: 'kim.reg',
    attachCnt: 2,
    targets: [
      ...t('DIVISION', ['VD']),
      ...t('PRODUCT_GROUP', ['PG_TV']),
      ...t('REGION', ['R_ASIA']),
      ...t('COUNTRY', ['KR'])
    ]
  },
  {
    regInfoId: 2,
    regNo: 'REG-2026-0002',
    title: '방송통신기자재 적합성평가(적합등록) - EMC',
    fieldCd: 'EMC',
    markNm: 'KC 마크 + 적합성평가 식별부호',
    authority: '국립전파연구원(RRA)',
    url: 'https://www.rra.go.kr',
    summary: 'KN 32(방사) / KN 35(내성) 시험 후 적합등록. 식별부호를 제품 라벨에 표기해야 판매 가능.',
    statusCd: 'ACTIVE',
    versionNo: 2,
    effectiveDt: '2025-07-01',
    modDt: '2026-03-02',
    modId: 'kim.reg',
    attachCnt: 3,
    targets: [
      ...t('DIVISION', ['VD']),
      ...t('PRODUCT_GROUP', ['PG_TV']),
      ...t('REGION', ['R_ASIA']),
      ...t('COUNTRY', ['KR'])
    ]
  },
  {
    regInfoId: 3,
    regNo: 'REG-2026-0003',
    title: '무선설비 적합인증 (Wi-Fi / Bluetooth 내장 모델)',
    fieldCd: 'RF',
    markNm: 'KC 마크 + 적합인증 식별부호',
    authority: '국립전파연구원(RRA)',
    url: 'https://www.rra.go.kr/ko/license/A_b_popup.do',
    summary: '무선 모듈 내장 TV는 EMC 적합등록과 별도로 무선설비 적합인증 필요. 모듈 인증 승계 시 서류 심사.',
    statusCd: 'ACTIVE',
    versionNo: 1,
    effectiveDt: '2025-04-01',
    modDt: '2025-12-11',
    modId: 'park.cert',
    attachCnt: 1,
    targets: [
      ...t('DIVISION', ['VD']),
      ...t('PRODUCT_GROUP', ['PG_TV']),
      ...t('PRODUCT', ['P_QLED', 'P_NEO', 'P_OLED', 'P_8K']),
      ...t('REGION', ['R_ASIA']),
      ...t('COUNTRY', ['KR'])
    ]
  },
  {
    regInfoId: 4,
    regNo: 'REG-2026-0004',
    title: '에너지소비효율등급 표시 (효율관리기자재)',
    fieldCd: 'ENERGY',
    markNm: '에너지소비효율등급 라벨(1~5등급)',
    authority: '한국에너지공단',
    url: 'https://eep.energy.or.kr',
    summary: 'TV는 효율관리기자재. 신고 후 등급 라벨을 제품 전면·포장·온라인 상세페이지에 표시. 최저효율기준 미달 시 판매 금지.',
    statusCd: 'ACTIVE',
    versionNo: 4,
    effectiveDt: '2026-04-01',
    modDt: '2026-08-05',
    modId: 'lee.energy',
    attachCnt: 2,
    targets: [
      ...t('DIVISION', ['VD']),
      ...t('PRODUCT_GROUP', ['PG_TV']),
      ...t('REGION', ['R_ASIA']),
      ...t('COUNTRY', ['KR'])
    ]
  },
  {
    regInfoId: 5,
    regNo: 'REG-2026-0005',
    title: '대기전력저감프로그램 (경고표지/에너지절약마크)',
    fieldCd: 'ENERGY',
    markNm: '에너지절약마크 또는 대기전력 경고표지',
    authority: '한국에너지공단',
    url: 'https://eep.energy.or.kr/standby/standby_intro.aspx',
    summary: '대기전력저감대상제품. 기준 만족 시 에너지절약마크, 미달 시 경고표지 부착 의무.',
    statusCd: 'ACTIVE',
    versionNo: 1,
    effectiveDt: '2025-01-01',
    modDt: '2025-09-22',
    modId: 'lee.energy',
    attachCnt: 1,
    targets: [
      ...t('DIVISION', ['VD']),
      ...t('PRODUCT_GROUP', ['PG_TV']),
      ...t('REGION', ['R_ASIA']),
      ...t('COUNTRY', ['KR'])
    ]
  },
  {
    regInfoId: 6,
    regNo: 'REG-2026-0006',
    title: 'K-RoHS 유해물질 사용제한',
    fieldCd: 'ENV',
    markNm: '해당 없음(자료 보관 의무)',
    authority: '환경부 / 한국환경산업기술원',
    url: 'https://www.law.go.kr/법령/전기전자제품및자동차의자원순환에관한법률',
    summary: '납·카드뮴·수은·6가크롬·PBB·PBDE 6종 함유 제한. 시험성적서와 물질 정보를 보관·제출.',
    statusCd: 'ACTIVE',
    versionNo: 2,
    effectiveDt: '2025-01-01',
    modDt: '2026-02-17',
    modId: 'choi.env',
    attachCnt: 4,
    targets: [
      ...t('DIVISION', ['VD']),
      ...t('PRODUCT_GROUP', ['PG_TV', 'PG_MON']),
      ...t('REGION', ['R_ASIA']),
      ...t('COUNTRY', ['KR'])
    ]
  },
  {
    regInfoId: 7,
    regNo: 'REG-2026-0007',
    title: '생산자책임재활용(EPR) 분담금 납부',
    fieldCd: 'RECYCLE',
    markNm: '해당 없음',
    authority: '한국전자제품자원순환공제조합',
    url: 'https://www.15782114.or.kr',
    summary: '출고량 기준 재활용의무량 산정 후 분담금 납부. 미이행 시 재활용부과금.',
    statusCd: 'ACTIVE',
    versionNo: 1,
    effectiveDt: '2025-01-01',
    modDt: '2025-11-30',
    modId: 'choi.env',
    attachCnt: 1,
    targets: [
      ...t('DIVISION', ['VD']),
      ...t('PRODUCT_GROUP', ['PG_TV']),
      ...t('REGION', ['R_ASIA']),
      ...t('COUNTRY', ['KR'])
    ]
  },
  {
    regInfoId: 8,
    regNo: 'REG-2026-0008',
    title: '분리배출 표시 의무',
    fieldCd: 'LABEL',
    markNm: '분리배출 표시(재질별 삼각 마크)',
    authority: '환경부',
    url: 'https://www.me.go.kr',
    summary: '포장재 재질별 분리배출 마크를 표시. 표시 위치·크기 규격 준수.',
    statusCd: 'ACTIVE',
    versionNo: 1,
    effectiveDt: '2024-01-01',
    modDt: '2025-06-18',
    modId: 'choi.env',
    attachCnt: 0,
    targets: [
      ...t('DIVISION', ['VD']),
      ...t('PRODUCT_GROUP', ['PG_TV']),
      ...t('REGION', ['R_ASIA']),
      ...t('COUNTRY', ['KR'])
    ]
  },
  {
    regInfoId: 9,
    regNo: 'REG-2026-0009',
    title: '지상파 UHD(ATSC 3.0) 수신 규격 대응',
    fieldCd: 'BROADCAST',
    markNm: 'UHD 수신 적합 표시(권고)',
    authority: '과학기술정보통신부 / TTA',
    url: 'https://www.tta.or.kr',
    summary: '국내 판매 TV의 지상파 UHD 수신 규격. 튜너·자막·재난경보(AEA) 수신 기능 확인.',
    statusCd: 'REVIEW',
    versionNo: 2,
    effectiveDt: '2026-09-01',
    modDt: '2026-08-11',
    modId: 'jung.dev',
    attachCnt: 2,
    targets: [
      ...t('DIVISION', ['VD']),
      ...t('PRODUCT_GROUP', ['PG_TV']),
      ...t('PRODUCT', ['P_NEO', 'P_8K']),
      ...t('REGION', ['R_ASIA']),
      ...t('COUNTRY', ['KR'])
    ]
  },
  {
    regInfoId: 10,
    regNo: 'REG-2026-0010',
    title: '한글 표시사항 / 제품안전정보 표시',
    fieldCd: 'LABEL',
    markNm: '한글 표시 라벨',
    authority: '국가기술표준원 / 공정거래위원회',
    url: 'https://www.safetykorea.kr',
    summary: '모델명, 정격, 제조자, 수입자, A/S 연락처, 제조연월 등 한글 표시 의무.',
    statusCd: 'ACTIVE',
    versionNo: 1,
    effectiveDt: '2024-07-01',
    modDt: '2025-08-01',
    modId: 'kim.reg',
    attachCnt: 1,
    targets: [
      ...t('DIVISION', ['VD']),
      ...t('PRODUCT_GROUP', ['PG_TV', 'PG_MON', 'PG_SIGN']),
      ...t('REGION', ['R_ASIA']),
      ...t('COUNTRY', ['KR'])
    ]
  },
  {
    regInfoId: 11,
    regNo: 'REG-2026-0011',
    title: 'K-REACH 등록·신고 (화학물질)',
    fieldCd: 'CHEM',
    markNm: '해당 없음',
    authority: '환경부 / 화학물질관리협회',
    url: 'https://kreach.me.go.kr',
    summary: '연간 1톤 이상 신규/기존 화학물질 사용 시 등록. TV는 부품 소재 기준 확인 필요.',
    statusCd: 'DRAFT',
    versionNo: 1,
    effectiveDt: '2026-01-01',
    modDt: '2026-06-09',
    modId: 'choi.env',
    attachCnt: 0,
    targets: [
      ...t('DIVISION', ['VD']),
      ...t('PRODUCT_GROUP', ['PG_TV']),
      ...t('REGION', ['R_ASIA']),
      ...t('COUNTRY', ['KR'])
    ]
  },
  /* ---- 해외 레코드 (충돌 시나리오 데모용) ---- */
  {
    regInfoId: 12,
    regNo: 'REG-2025-0087',
    title: 'CE 저전압지침(LVD) - 프랑스 특례',
    fieldCd: 'SAFETY',
    markNm: 'CE 마크',
    authority: 'EU Commission / 프랑스 DGCCRF',
    url: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32014L0035',
    summary: '프랑스 판매 모델 대상 LVD 대응. 프랑스어 안전 문구 및 현지 A/S 정보 추가 표시.',
    statusCd: 'ACTIVE',
    versionNo: 2,
    effectiveDt: '2025-11-03',
    modDt: '2026-01-20',
    modId: 'yoon.eu',
    attachCnt: 3,
    targets: [
      ...t('DIVISION', ['VD']),
      ...t('PRODUCT_GROUP', ['PG_TV']),
      ...t('REGION', ['R_EU']),
      ...t('COUNTRY', ['FR'])
    ]
  },
  {
    regInfoId: 13,
    regNo: 'REG-2025-0091',
    title: 'EU 에너지라벨 (전자 디스플레이)',
    fieldCd: 'ENERGY',
    markNm: 'EU 에너지라벨 + QR(EPREL)',
    authority: 'EU Commission',
    url: 'https://eprel.ec.europa.eu',
    summary: 'EPREL DB 등록 후 라벨·제품정보시트 제공. 라벨 QR 코드 필수.',
    statusCd: 'ACTIVE',
    versionNo: 1,
    effectiveDt: '2025-03-01',
    modDt: '2025-10-15',
    modId: 'yoon.eu',
    attachCnt: 2,
    targets: [
      ...t('DIVISION', ['VD']),
      ...t('PRODUCT_GROUP', ['PG_TV']),
      ...t('REGION', ['R_EU']),
      ...t('COUNTRY', ['DE', 'FR', 'IT'])
    ]
  },
  {
    regInfoId: 14,
    regNo: 'REG-2026-0021',
    title: 'EU EMC 지침 (EN 55032/55035)',
    fieldCd: 'EMC',
    markNm: 'CE 마크',
    authority: 'EU Commission',
    url: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32014L0030',
    summary: '유럽 전 권역 공통 EMC 요구사항. DoC 문서 보관 의무.',
    statusCd: 'ACTIVE',
    versionNo: 1,
    effectiveDt: '2026-02-01',
    modDt: '2026-05-26',
    modId: 'yoon.eu',
    attachCnt: 1,
    targets: [
      ...t('DIVISION', ['VD']),
      ...t('PRODUCT_GROUP', ['PG_TV']),
      ...t('REGION', ['R_EU'])
    ]
  },
  /* ---- 권역별 해외 레코드 (국가 필터 100개 데모용) ---- */
  {
    regInfoId: 15,
    regNo: 'REG-2026-0031',
    title: 'ASEAN EMC 상호인정협정(MRA) 적합성',
    fieldCd: 'EMC',
    markNm: '국가별 EMC 인증 마크',
    authority: 'ASEAN 전기전자 협의체(ACCSQ)',
    url: 'https://asean.org',
    summary: 'ASEAN MRA 지정 시험소 성적서로 회원국 EMC 인증을 받는다. 한·중·일 외 아시아 권역 판매 모델 공통.',
    statusCd: 'ACTIVE',
    versionNo: 1,
    effectiveDt: '2026-03-01',
    modDt: '2026-06-18',
    modId: 'lee.asia',
    attachCnt: 1,
    targets: [
      ...t('DIVISION', ['VD']),
      ...t('PRODUCT_GROUP', ['PG_TV']),
      ...t('REGION', ['R_ASIA']),
      ...t('COUNTRY', countriesOf('R_ASIA', ['KR', 'JP', 'CN']))
    ]
  },
  {
    regInfoId: 16,
    regNo: 'REG-2026-0032',
    title: '일본 PSE (전기용품안전법)',
    fieldCd: 'SAFETY',
    markNm: 'PSE 마크(원형)',
    authority: '일본 경제산업성(METI)',
    url: 'https://www.meti.go.jp',
    summary: 'TV는 비특정전기용품. 자기확인 후 원형 PSE 마크와 사업자명 표시.',
    statusCd: 'ACTIVE',
    versionNo: 1,
    effectiveDt: '2025-09-01',
    modDt: '2026-02-10',
    modId: 'lee.asia',
    attachCnt: 1,
    targets: [
      ...t('DIVISION', ['VD']),
      ...t('PRODUCT_GROUP', ['PG_TV']),
      ...t('REGION', ['R_ASIA']),
      ...t('COUNTRY', ['JP'])
    ]
  },
  {
    regInfoId: 17,
    regNo: 'REG-2026-0033',
    title: '중국 CCC 강제인증',
    fieldCd: 'SAFETY',
    markNm: 'CCC 마크',
    authority: '중국 국가인증인가감독관리위원회(CNCA)',
    url: 'https://www.cnca.gov.cn',
    summary: '지정 인증기관 형식시험 + 공장심사 후 CCC 마크 부착. 매년 사후 공장심사.',
    statusCd: 'REVIEW',
    versionNo: 2,
    effectiveDt: '2026-01-15',
    modDt: '2026-07-02',
    modId: 'lee.asia',
    attachCnt: 2,
    targets: [
      ...t('DIVISION', ['VD']),
      ...t('PRODUCT_GROUP', ['PG_TV']),
      ...t('REGION', ['R_ASIA']),
      ...t('COUNTRY', ['CN'])
    ]
  },
  {
    regInfoId: 18,
    regNo: 'REG-2026-0034',
    title: 'EU RoHS 2 (2011/65/EU) 유해물질 제한',
    fieldCd: 'ENV',
    markNm: 'CE 마크',
    authority: 'EU Commission',
    url: 'https://eur-lex.europa.eu/eli/dir/2011/65/oj',
    summary: '납·수은·카드뮴 등 10종 물질 함유 한도. 기술문서와 DoC 에 RoHS 적합 명시. 유럽 권역 전체.',
    statusCd: 'ACTIVE',
    versionNo: 1,
    effectiveDt: '2025-06-01',
    modDt: '2026-04-11',
    modId: 'yoon.eu',
    attachCnt: 1,
    targets: [
      ...t('DIVISION', ['VD']),
      ...t('PRODUCT_GROUP', ['PG_TV']),
      ...t('REGION', ['R_EU']),
      ...t('COUNTRY', countriesOf('R_EU'))
    ]
  },
  {
    regInfoId: 19,
    regNo: 'REG-2026-0035',
    title: '영국 UKCA 표시',
    fieldCd: 'LABEL',
    markNm: 'UKCA 마크',
    authority: '영국 OPSS',
    url: 'https://www.gov.uk/guidance/using-the-ukca-marking',
    summary: '영국(GB) 판매 모델에 UKCA 표시. UK DoC 별도 작성.',
    statusCd: 'DRAFT',
    versionNo: 1,
    effectiveDt: '2026-10-01',
    modDt: '2026-08-21',
    modId: 'yoon.eu',
    attachCnt: 0,
    targets: [
      ...t('DIVISION', ['VD']),
      ...t('PRODUCT_GROUP', ['PG_TV']),
      ...t('REGION', ['R_EU']),
      ...t('COUNTRY', ['GB'])
    ]
  },
  {
    regInfoId: 20,
    regNo: 'REG-2026-0036',
    title: 'FCC Part 15 / ISED ICES-003 EMC',
    fieldCd: 'EMC',
    markNm: 'FCC SDoC 표시 / ISED 표기',
    authority: '미국 FCC / 캐나다 ISED',
    url: 'https://www.fcc.gov',
    summary: '비의도적 방사기기 SDoC. 캐나다는 ICES-003 적합 문구를 라벨·설명서에 표기.',
    statusCd: 'ACTIVE',
    versionNo: 2,
    effectiveDt: '2025-05-01',
    modDt: '2026-01-30',
    modId: 'jung.na',
    attachCnt: 2,
    targets: [
      ...t('DIVISION', ['VD']),
      ...t('PRODUCT_GROUP', ['PG_TV']),
      ...t('REGION', ['R_NA']),
      ...t('COUNTRY', ['US', 'CA'])
    ]
  },
  {
    regInfoId: 21,
    regNo: 'REG-2026-0037',
    title: '멕시코 NOM-001-SCFI 전자기기 안전',
    fieldCd: 'SAFETY',
    markNm: 'NOM 마크',
    authority: '멕시코 경제부(SE)',
    url: 'https://www.gob.mx/se',
    summary: '현지 인증기관 시험 후 NOM 인증서 발급. 스페인어 라벨 필수.',
    statusCd: 'ACTIVE',
    versionNo: 1,
    effectiveDt: '2025-12-01',
    modDt: '2026-05-14',
    modId: 'jung.na',
    attachCnt: 1,
    targets: [
      ...t('DIVISION', ['VD']),
      ...t('PRODUCT_GROUP', ['PG_TV']),
      ...t('REGION', ['R_NA']),
      ...t('COUNTRY', ['MX'])
    ]
  },
  {
    regInfoId: 22,
    regNo: 'REG-2026-0038',
    title: '중남미 전기안전 인증 (INMETRO / IRAM / SEC 등)',
    fieldCd: 'SAFETY',
    markNm: '국가별 안전 인증 마크',
    authority: '각국 인증기관',
    url: 'https://www.gov.br/inmetro',
    summary: '브라질 INMETRO, 아르헨티나 IRAM, 칠레 SEC 등 국가별 인증. 중남미 권역 공통 관리.',
    statusCd: 'REVIEW',
    versionNo: 1,
    effectiveDt: '2026-04-01',
    modDt: '2026-07-28',
    modId: 'jung.na',
    attachCnt: 1,
    targets: [
      ...t('DIVISION', ['VD']),
      ...t('PRODUCT_GROUP', ['PG_TV']),
      ...t('REGION', ['R_LA']),
      ...t('COUNTRY', countriesOf('R_LA'))
    ]
  },
  {
    regInfoId: 23,
    regNo: 'REG-2026-0039',
    title: 'GCC 적합성 (G-Mark) / 중동·아프리카 수입 적합성',
    fieldCd: 'SAFETY',
    markNm: 'G-Mark / 국가별 적합성 마크',
    authority: 'GCC 표준화기구(GSO) / 각국 표준청',
    url: 'https://www.gso.org.sa',
    summary: 'GCC 6개국 G-Mark 와 SASO·SONCAP 등 국가별 수입 적합성 증명. 중동/아프리카 권역 공통.',
    statusCd: 'ACTIVE',
    versionNo: 1,
    effectiveDt: '2025-08-01',
    modDt: '2026-03-19',
    modId: 'han.mea',
    attachCnt: 2,
    targets: [
      ...t('DIVISION', ['VD']),
      ...t('PRODUCT_GROUP', ['PG_TV']),
      ...t('REGION', ['R_MEA']),
      ...t('COUNTRY', countriesOf('R_MEA'))
    ]
  },
  {
    regInfoId: 24,
    regNo: 'REG-2026-0040',
    title: 'RCM 전기안전·EMC (오세아니아)',
    fieldCd: 'SAFETY',
    markNm: 'RCM 마크',
    authority: '호주 ERAC / 뉴질랜드 EnergySafety',
    url: 'https://www.eess.gov.au',
    summary: 'EESS 등록 후 RCM 표시. 도서국은 호주·뉴질랜드 인증을 준용.',
    statusCd: 'ACTIVE',
    versionNo: 1,
    effectiveDt: '2025-10-01',
    modDt: '2026-02-26',
    modId: 'han.mea',
    attachCnt: 1,
    targets: [
      ...t('DIVISION', ['VD']),
      ...t('PRODUCT_GROUP', ['PG_TV']),
      ...t('REGION', ['R_OCE']),
      ...t('COUNTRY', countriesOf('R_OCE'))
    ]
  },
  {
    regInfoId: 25,
    regNo: 'REG-2026-0041',
    title: 'IECEE CB Scheme 국제 안전 시험성적서',
    fieldCd: 'SAFETY',
    markNm: 'CB 성적서(마크 없음)',
    authority: 'IECEE',
    url: 'https://www.iecee.org',
    summary: 'IEC 62368-1 CB 성적서로 회원국 국가 인증 시 시험 중복을 줄인다. 주요 판매국 기준으로 관리.',
    statusCd: 'ACTIVE',
    versionNo: 3,
    effectiveDt: '2025-01-01',
    modDt: '2026-06-30',
    modId: 'park.cert',
    attachCnt: 3,
    targets: [
      ...t('DIVISION', ['VD']),
      ...t('PRODUCT_GROUP', ['PG_TV']),
      ...t('REGION', ['R_ASIA', 'R_EU', 'R_NA', 'R_LA', 'R_MEA', 'R_OCE']),
      ...t('COUNTRY', ['KR', 'JP', 'CN', 'IN', 'SG', 'DE', 'FR', 'GB', 'IT', 'NL', 'SE', 'CH', 'US', 'CA', 'MX', 'BR', 'AR', 'SA', 'AE', 'ZA', 'AU', 'NZ'])
    ]
  }
]

/* ------------------------------------------------------------------ *
 * 3. REG_INFO_HIST - 수정 = 새 버전 INSERT (스냅샷 보관)
 * ------------------------------------------------------------------ */
export const regHistList = [
  { histId: 101, regInfoId: 1, versionNo: 1, changeType: 'INSERT', changeNote: '최초 등록', regId: 'kim.reg', regDt: '2024-03-11 09:20' },
  { histId: 102, regInfoId: 1, versionNo: 2, changeType: 'UPDATE', changeNote: '적용 규격 KC 60065 → KC 62368-1 전환', regId: 'kim.reg', regDt: '2025-08-02 14:05' },
  { histId: 103, regInfoId: 1, versionNo: 3, changeType: 'UPDATE', changeNote: '2026 시행 개정문 URL/첨부 교체', regId: 'kim.reg', regDt: '2026-07-14 11:32' },
  { histId: 104, regInfoId: 2, versionNo: 1, changeType: 'INSERT', changeNote: '최초 등록', regId: 'park.cert', regDt: '2024-05-20 10:00' },
  { histId: 105, regInfoId: 2, versionNo: 2, changeType: 'UPDATE', changeNote: 'KN 35 내성 기준 추가', regId: 'kim.reg', regDt: '2026-03-02 16:48' },
  { histId: 106, regInfoId: 4, versionNo: 3, changeType: 'UPDATE', changeNote: '최저효율기준 상향(2026-04-01 시행)', regId: 'lee.energy', regDt: '2026-04-01 09:00' },
  { histId: 107, regInfoId: 4, versionNo: 4, changeType: 'UPDATE', changeNote: '온라인 상세페이지 표시 의무 문구 반영', regId: 'lee.energy', regDt: '2026-08-05 13:21' },
  { histId: 108, regInfoId: 12, versionNo: 1, changeType: 'INSERT', changeNote: '프랑스 특례 최초 등록', regId: 'yoon.eu', regDt: '2025-11-03 15:40' },
  { histId: 109, regInfoId: 12, versionNo: 2, changeType: 'CONFLICT_RESOLVE', changeNote: '유럽 공통 레코드 등록에 따른 예외(특례) 처리', regId: 'yoon.eu', regDt: '2026-01-20 17:02' },
  { histId: 110, regInfoId: 9, versionNo: 2, changeType: 'UPDATE', changeNote: '재난경보(AEA) 수신 항목 추가', regId: 'jung.dev', regDt: '2026-08-11 10:15' },
  // 권역별 해외 레코드(15~25)
  { histId: 111, regInfoId: 15, versionNo: 1, changeType: 'INSERT', changeNote: 'ASEAN 권역 EMC 최초 등록', regId: 'lee.asia', regDt: '2026-06-18 10:12' },
  { histId: 112, regInfoId: 16, versionNo: 1, changeType: 'INSERT', changeNote: '최초 등록', regId: 'lee.asia', regDt: '2026-02-10 09:30' },
  { histId: 113, regInfoId: 17, versionNo: 1, changeType: 'INSERT', changeNote: '최초 등록', regId: 'lee.asia', regDt: '2025-12-01 14:00' },
  { histId: 114, regInfoId: 17, versionNo: 2, changeType: 'UPDATE', changeNote: 'GB 4943.1-2022 전환에 따라 공장심사 보고서 추가', regId: 'lee.asia', regDt: '2026-07-02 11:20' },
  { histId: 115, regInfoId: 18, versionNo: 1, changeType: 'INSERT', changeNote: '유럽 권역 공통 최초 등록', regId: 'yoon.eu', regDt: '2026-04-11 16:05' },
  { histId: 116, regInfoId: 19, versionNo: 1, changeType: 'INSERT', changeNote: '작성중 등록', regId: 'yoon.eu', regDt: '2026-08-21 13:40' },
  { histId: 117, regInfoId: 20, versionNo: 1, changeType: 'INSERT', changeNote: '최초 등록', regId: 'jung.na', regDt: '2025-05-01 09:00' },
  { histId: 118, regInfoId: 20, versionNo: 2, changeType: 'UPDATE', changeNote: '캐나다 ICES-003 표기 문구 추가', regId: 'jung.na', regDt: '2026-01-30 15:10' },
  { histId: 119, regInfoId: 21, versionNo: 1, changeType: 'INSERT', changeNote: '최초 등록', regId: 'jung.na', regDt: '2026-05-14 10:45' },
  { histId: 120, regInfoId: 22, versionNo: 1, changeType: 'INSERT', changeNote: '중남미 권역 공통 최초 등록', regId: 'jung.na', regDt: '2026-07-28 17:30' },
  { histId: 121, regInfoId: 23, versionNo: 1, changeType: 'INSERT', changeNote: '중동/아프리카 권역 공통 최초 등록', regId: 'han.mea', regDt: '2026-03-19 11:00' },
  { histId: 122, regInfoId: 24, versionNo: 1, changeType: 'INSERT', changeNote: '오세아니아 권역 공통 최초 등록', regId: 'han.mea', regDt: '2026-02-26 14:25' },
  { histId: 123, regInfoId: 25, versionNo: 1, changeType: 'INSERT', changeNote: '최초 등록', regId: 'park.cert', regDt: '2025-01-02 09:10' },
  { histId: 124, regInfoId: 25, versionNo: 2, changeType: 'UPDATE', changeNote: 'IEC 62368-1 3판 기준으로 성적서 갱신', regId: 'park.cert', regDt: '2025-09-15 10:00' },
  { histId: 125, regInfoId: 25, versionNo: 3, changeType: 'UPDATE', changeNote: '주요 판매국 목록 갱신', regId: 'park.cert', regDt: '2026-06-30 16:40' }
]

/* ------------------------------------------------------------------ *
 * 4. REG_CONFLICT_HIST - 저장 직전 충돌 판정 결과와 담당자의 조치
 * ------------------------------------------------------------------ */
export const regConflictList = [
  {
    conflictId: 9001,
    newRegNo: 'REG-2026-0021',
    newRegInfoId: 14,
    existRegNo: 'REG-2025-0087',
    existRegInfoId: 12,
    conflictType: 'PARENT',
    conflictAxis: 'GEO',
    newScopeTxt: '유럽(권역 전체)',
    existScopeTxt: '유럽 > 프랑스',
    decisionCd: 'KEEP_BOTH',
    decisionNote: '프랑스 현지 표시 요건이 별도라 특례 레코드 유지',
    detectDt: '2026-02-01 09:12',
    decideId: 'yoon.eu',
    decideDt: '2026-02-01 09:20',
    statusCd: 'RESOLVED'
  },
  {
    conflictId: 9002,
    newRegNo: 'REG-2025-0091',
    newRegInfoId: 13,
    existRegNo: 'REG-2025-0087',
    existRegInfoId: 12,
    conflictType: 'OVERLAP',
    conflictAxis: 'GEO',
    newScopeTxt: '독일, 프랑스, 이탈리아',
    existScopeTxt: '유럽 > 프랑스',
    decisionCd: 'KEEP_BOTH',
    decisionNote: '분야(에너지/안전)가 달라 병행 관리',
    detectDt: '2025-03-01 11:02',
    decideId: 'yoon.eu',
    decideDt: '2025-03-01 11:30',
    statusCd: 'RESOLVED'
  },
  {
    conflictId: 9003,
    newRegNo: 'REG-2026-0003',
    newRegInfoId: 3,
    existRegNo: 'REG-2026-0002',
    existRegInfoId: 2,
    conflictType: 'CHILD',
    conflictAxis: 'RULE',
    newScopeTxt: '전파법 > 무선설비규칙 5GHz WLAN',
    existScopeTxt: '전파법(규제 전체)',
    decisionCd: 'KEEP_BOTH',
    decisionNote: '동일 법령 내 별도 인증 절차로 하위 레코드 유지',
    detectDt: '2025-04-01 10:44',
    decideId: 'park.cert',
    decideDt: '2025-04-01 10:50',
    statusCd: 'RESOLVED'
  }
]

/* ------------------------------------------------------------------ *
 * 5. 첨부 (파일 관리 모듈의 파일그룹 ID로 연계 - 별도 테이블 아님)
 * ------------------------------------------------------------------ */
export const attachMock = {
  1: [
    { fileId: 'F-001', fileNm: '안전확인신고증명서_2026.pdf', size: '842KB' },
    { fileId: 'F-002', fileNm: 'KC62368-1_시험성적서.pdf', size: '3.1MB' }
  ],
  2: [
    { fileId: 'F-011', fileNm: 'KN32_방사시험성적서.pdf', size: '2.4MB' },
    { fileId: 'F-012', fileNm: 'KN35_내성시험성적서.pdf', size: '1.9MB' },
    { fileId: 'F-013', fileNm: '적합등록필증.pdf', size: '410KB' }
  ],
  4: [
    { fileId: 'F-021', fileNm: '효율등급_신고확인서.pdf', size: '620KB' },
    { fileId: 'F-022', fileNm: '2026_최저효율기준_개정고시.hwp', size: '180KB' }
  ],
  12: [
    { fileId: 'F-031', fileNm: 'EU_DoC_LVD.pdf', size: '520KB' },
    { fileId: 'F-032', fileNm: 'FR_안전문구_번역본.docx', size: '96KB' },
    { fileId: 'F-033', fileNm: 'EN62368-1_TestReport.pdf', size: '4.2MB' }
  ],
  // 권역별 해외 레코드 — 목록의 첨부 건수(attachCnt)와 맞춘다
  15: [{ fileId: 'F-151', fileNm: 'ASEAN_MRA_EMC_TestReport.pdf', size: '2.2MB' }],
  16: [{ fileId: 'F-161', fileNm: 'PSE_自己確認_試験記録.pdf', size: '1.1MB' }],
  17: [
    { fileId: 'F-171', fileNm: 'CCC_Certificate.pdf', size: '640KB' },
    { fileId: 'F-172', fileNm: 'CCC_Factory_Inspection.pdf', size: '1.8MB' }
  ],
  18: [{ fileId: 'F-181', fileNm: 'RoHS_Technical_File.pdf', size: '3.4MB' }],
  20: [
    { fileId: 'F-201', fileNm: 'FCC_SDoC_TestReport.pdf', size: '2.7MB' },
    { fileId: 'F-202', fileNm: 'ICES-003_Label.pdf', size: '220KB' }
  ],
  21: [{ fileId: 'F-211', fileNm: 'NOM-001-SCFI_Certificado.pdf', size: '900KB' }],
  22: [{ fileId: 'F-221', fileNm: 'INMETRO_IRAM_SEC_목록.xlsx', size: '75KB' }],
  23: [
    { fileId: 'F-231', fileNm: 'G-Mark_Certificate.pdf', size: '510KB' },
    { fileId: 'F-232', fileNm: 'SASO_IECEE_CoC.pdf', size: '430KB' }
  ],
  24: [{ fileId: 'F-241', fileNm: 'EESS_Registration.pdf', size: '380KB' }],
  25: [
    { fileId: 'F-251', fileNm: 'CB_Certificate_IEC62368-1.pdf', size: '700KB' },
    { fileId: 'F-252', fileNm: 'CB_TestReport_Ed3.pdf', size: '5.6MB' },
    { fileId: 'F-253', fileNm: 'CB_National_Differences.pdf', size: '1.3MB' }
  ]
}

/* ------------------------------------------------------------------ *
 * 6. REG_INFO_ITEM - 정보관리항목
 *
 *    "한국에서 TV를 팔려면 무엇을 관리해야 하는가" 를 한 행씩 고른 것.
 *    적용대상 테이블과 같은 (타입 + 코드) 로우 패턴이며,
 *    PARENT_ITEM_ID 로 계층을 가진다.
 *
 *        규제(1)  전파법 적합성평가
 *          └ 규격(2)  KN 32
 *              └ 인증서(3)  적합등록필증
 *
 *    ITEM_NM 은 DB에서는 비정규화 컬럼이지만, 목업에서는 코드에서 파생시킨다.
 * ------------------------------------------------------------------ */

/** 항목 구분 (단일 select) */
export const itemTypeCodes = [
  { code: 'REGULATION', name: '규제', levelNo: 1 },
  { code: 'STANDARD', name: '규격', levelNo: 2 },
  { code: 'CERT', name: '인증서', levelNo: 3 }
]

/** 인증서 / 증빙 (levelNo 3, 상위는 규격) */
export const certCodes = [
  { code: 'CT_SAFE_DECL', name: '안전확인신고증명서', parentCd: 'ST_62368', levelNo: 3 },
  { code: 'CT_SAFE_TEST', name: 'KC 62368-1 시험성적서', parentCd: 'ST_62368', levelNo: 3 },
  { code: 'CT_RF_REG', name: '적합등록필증', parentCd: 'ST_KN32', levelNo: 3 },
  { code: 'CT_RF_TEST', name: 'KN 32 방사시험성적서', parentCd: 'ST_KN32', levelNo: 3 },
  { code: 'CT_RF_IMM', name: 'KN 35 내성시험성적서', parentCd: 'ST_KN35', levelNo: 3 },
  { code: 'CT_WIFI_CERT', name: '무선설비 적합인증서', parentCd: 'ST_RF_WIFI', levelNo: 3 },
  { code: 'CT_EFF_DECL', name: '효율등급 신고확인서', parentCd: 'ST_EFF_TV', levelNo: 3 },
  { code: 'CT_STBY_DECL', name: '대기전력저감 신고확인서', parentCd: 'ST_STANDBY', levelNo: 3 },
  { code: 'CT_ROHS_ANAL', name: '유해물질 분석성적서', parentCd: 'ST_KROHS', levelNo: 3 },
  { code: 'CT_EPR_CERT', name: '재활용의무이행 확인서', parentCd: 'ST_EPR_RATE', levelNo: 3 },
  { code: 'CT_SEP_MARK', name: '분리배출 표시 확인서', parentCd: 'ST_SEPARATE', levelNo: 3 },
  { code: 'CT_KREACH_NOTI', name: 'K-REACH 등록번호 통지서', parentCd: 'ST_KREACH_REG', levelNo: 3 },
  { code: 'CT_ATSC_TEST', name: 'UHD 수신 적합성 시험성적서', parentCd: 'ST_ATSC3', levelNo: 3 },
  { code: 'CT_LABEL_CHK', name: '한글 표시사항 검수확인서', parentCd: 'ST_KOR_LABEL', levelNo: 3 },
  { code: 'CT_EU_DOC', name: 'EU 적합성선언서(DoC)', parentCd: 'ST_EN62368', levelNo: 3 },
  { code: 'CT_EU_TEST', name: 'EN IEC 62368-1 시험성적서', parentCd: 'ST_EN62368', levelNo: 3 },
  { code: 'CT_EU_EPREL', name: 'EPREL 등록확인서', parentCd: 'ST_EU_ELABEL', levelNo: 3 },
  { code: 'CT_EU_EMC_DOC', name: 'EMC 적합성선언서', parentCd: 'ST_EN55032', levelNo: 3 },
  { code: 'CT_ASEAN_EMC', name: 'ASEAN MRA 지정시험소 EMC 성적서', parentCd: 'ST_ASEAN_CISPR32', levelNo: 3 },
  { code: 'CT_JP_PSE_SELF', name: 'PSE 자기확인 시험기록', parentCd: 'ST_JP_J62368', levelNo: 3 },
  { code: 'CT_CN_CCC', name: 'CCC 인증서', parentCd: 'ST_GB4943', levelNo: 3 },
  { code: 'CT_CN_FACTORY', name: 'CCC 공장심사 보고서', parentCd: 'ST_GB4943', levelNo: 3 },
  { code: 'CT_EU_ROHS_DOC', name: 'RoHS 기술문서 / DoC', parentCd: 'ST_EN63000', levelNo: 3 },
  { code: 'CT_UKCA_DOC', name: 'UK 적합성선언서(UK DoC)', parentCd: 'ST_BS62368', levelNo: 3 },
  { code: 'CT_FCC_SDOC', name: 'FCC SDoC 시험성적서', parentCd: 'ST_FCC15B', levelNo: 3 },
  { code: 'CT_NOM_CERT', name: 'NOM 인증서', parentCd: 'ST_NOM001', levelNo: 3 },
  { code: 'CT_LA_CERT', name: '국가별 안전 인증서 (INMETRO/IRAM/SEC)', parentCd: 'ST_IEC62368_LA', levelNo: 3 },
  { code: 'CT_GCC_GMARK', name: 'G-Mark 적합성 증명서', parentCd: 'ST_GSO_IEC62368', levelNo: 3 },
  { code: 'CT_RCM_REG', name: 'EESS 등록 확인서', parentCd: 'ST_ASNZS62368', levelNo: 3 },
  { code: 'CT_CB_CERT', name: 'CB 인증서', parentCd: 'ST_CB62368', levelNo: 3 },
  { code: 'CT_CB_REPORT', name: 'CB 시험성적서', parentCd: 'ST_CB62368', levelNo: 3 }
]

/**
 * 항목 트리 생성 헬퍼.
 * @param {number} regInfoId
 * @param {string} regCd    규제 코드 (레벨 1)
 * @param {object} tree     { 규격코드: [인증서코드, ...] }
 */
let _itemSeq = 6000
const mkItems = (regInfoId, regCd, tree) => {
  const rows = []
  const rootId = (_itemSeq += 1)
  rows.push({
    itemId: rootId, regInfoId, parentItemId: null,
    itemTypeCd: 'REGULATION', itemCd: regCd, levelNo: 1,
    mandatoryYn: 'Y', remark: '', sortOrder: 1
  })
  Object.entries(tree).forEach(([stdCd, certCds], si) => {
    const stdId = (_itemSeq += 1)
    rows.push({
      itemId: stdId, regInfoId, parentItemId: rootId,
      itemTypeCd: 'STANDARD', itemCd: stdCd, levelNo: 2,
      mandatoryYn: 'Y', remark: '', sortOrder: si + 1
    })
    certCds.forEach((certCd, ci) => {
      rows.push({
        itemId: (_itemSeq += 1), regInfoId, parentItemId: stdId,
        itemTypeCd: 'CERT', itemCd: certCd, levelNo: 3,
        mandatoryYn: ci === 0 ? 'Y' : 'N', remark: '', sortOrder: ci + 1
      })
    })
  })
  return rows
}

export const regItemList = [
  ...mkItems(1, 'RG_KC_SAFE', { ST_62368: ['CT_SAFE_DECL', 'CT_SAFE_TEST'] }),
  ...mkItems(2, 'RG_RADIO', { ST_KN32: ['CT_RF_REG', 'CT_RF_TEST'], ST_KN35: ['CT_RF_IMM'] }),
  ...mkItems(3, 'RG_RADIO', { ST_RF_WIFI: ['CT_WIFI_CERT'] }),
  ...mkItems(4, 'RG_ENERGY', { ST_EFF_TV: ['CT_EFF_DECL'] }),
  ...mkItems(5, 'RG_STANDBY', { ST_STANDBY: ['CT_STBY_DECL'] }),
  ...mkItems(6, 'RG_EPR', { ST_KROHS: ['CT_ROHS_ANAL'] }),
  ...mkItems(7, 'RG_EPR', { ST_EPR_RATE: ['CT_EPR_CERT'] }),
  ...mkItems(8, 'RG_EPR', { ST_SEPARATE: ['CT_SEP_MARK'] }),
  ...mkItems(9, 'RG_BCAST', { ST_ATSC3: ['CT_ATSC_TEST'] }),
  ...mkItems(10, 'RG_LABEL', { ST_KOR_LABEL: ['CT_LABEL_CHK'] }),
  ...mkItems(11, 'RG_KREACH', { ST_KREACH_REG: ['CT_KREACH_NOTI'] }),
  ...mkItems(12, 'RG_EU_LVD', { ST_EN62368: ['CT_EU_DOC', 'CT_EU_TEST'] }),
  ...mkItems(13, 'RG_EU_ELABEL', { ST_EU_ELABEL: ['CT_EU_EPREL'] }),
  ...mkItems(14, 'RG_EU_EMC', { ST_EN55032: ['CT_EU_EMC_DOC'] }),
  // 권역별 해외 레코드
  ...mkItems(15, 'RG_ASEAN_EMC', { ST_ASEAN_CISPR32: ['CT_ASEAN_EMC'] }),
  ...mkItems(16, 'RG_JP_PSE', { ST_JP_J62368: ['CT_JP_PSE_SELF'] }),
  ...mkItems(17, 'RG_CN_CCC', { ST_GB4943: ['CT_CN_CCC', 'CT_CN_FACTORY'] }),
  ...mkItems(18, 'RG_EU_ROHS', { ST_EN63000: ['CT_EU_ROHS_DOC'] }),
  ...mkItems(19, 'RG_UKCA', { ST_BS62368: ['CT_UKCA_DOC'] }),
  ...mkItems(20, 'RG_US_FCC', { ST_FCC15B: ['CT_FCC_SDOC'] }),
  ...mkItems(21, 'RG_MX_NOM', { ST_NOM001: ['CT_NOM_CERT'] }),
  ...mkItems(22, 'RG_LA_SAFE', { ST_IEC62368_LA: ['CT_LA_CERT'] }),
  ...mkItems(23, 'RG_GCC', { ST_GSO_IEC62368: ['CT_GCC_GMARK'] }),
  ...mkItems(24, 'RG_OCE_RCM', { ST_ASNZS62368: ['CT_RCM_REG'] }),
  ...mkItems(25, 'RG_IECEE_CB', { ST_CB62368: ['CT_CB_CERT', 'CT_CB_REPORT'] })
]
