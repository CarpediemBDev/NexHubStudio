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
  { code: 'KR', name: '한국', parentCd: 'R_ASIA', levelNo: 2 },
  { code: 'JP', name: '일본', parentCd: 'R_ASIA', levelNo: 2 },
  { code: 'CN', name: '중국', parentCd: 'R_ASIA', levelNo: 2 },
  { code: 'VN', name: '베트남', parentCd: 'R_ASIA', levelNo: 2 },
  { code: 'IN', name: '인도', parentCd: 'R_ASIA', levelNo: 2 },
  { code: 'FR', name: '프랑스', parentCd: 'R_EU', levelNo: 2 },
  { code: 'DE', name: '독일', parentCd: 'R_EU', levelNo: 2 },
  { code: 'IT', name: '이탈리아', parentCd: 'R_EU', levelNo: 2 },
  { code: 'ES', name: '스페인', parentCd: 'R_EU', levelNo: 2 },
  { code: 'PL', name: '폴란드', parentCd: 'R_EU', levelNo: 2 },
  { code: 'US', name: '미국', parentCd: 'R_NA', levelNo: 2 },
  { code: 'CA', name: '캐나다', parentCd: 'R_NA', levelNo: 2 },
  { code: 'BR', name: '브라질', parentCd: 'R_LA', levelNo: 2 },
  { code: 'AE', name: 'UAE', parentCd: 'R_MEA', levelNo: 2 },
  { code: 'ZA', name: '남아프리카공화국', parentCd: 'R_MEA', levelNo: 2 },
  { code: 'AU', name: '호주', parentCd: 'R_OCE', levelNo: 2 }
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
  { code: 'RG_EU_EMC', name: 'EU EMC 지침 2014/30/EU', levelNo: 1 }
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
  { code: 'ST_EN55032', name: 'EN 55032 / EN 55035', parentCd: 'RG_EU_EMC', levelNo: 2 }
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
      ...t('REGULATION', ['RG_KC_SAFE']),
      ...t('STANDARD', ['ST_62368']),
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
      ...t('REGULATION', ['RG_RADIO']),
      ...t('STANDARD', ['ST_KN32', 'ST_KN35']),
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
      ...t('REGULATION', ['RG_RADIO']),
      ...t('STANDARD', ['ST_RF_WIFI']),
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
      ...t('REGULATION', ['RG_ENERGY']),
      ...t('STANDARD', ['ST_EFF_TV']),
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
      ...t('REGULATION', ['RG_STANDBY']),
      ...t('STANDARD', ['ST_STANDBY']),
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
      ...t('REGULATION', ['RG_EPR']),
      ...t('STANDARD', ['ST_KROHS']),
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
      ...t('REGULATION', ['RG_EPR']),
      ...t('STANDARD', ['ST_EPR_RATE']),
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
      ...t('REGULATION', ['RG_EPR']),
      ...t('STANDARD', ['ST_SEPARATE']),
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
      ...t('REGULATION', ['RG_BCAST']),
      ...t('STANDARD', ['ST_ATSC3']),
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
      ...t('REGULATION', ['RG_LABEL']),
      ...t('STANDARD', ['ST_KOR_LABEL']),
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
      ...t('REGULATION', ['RG_KREACH']),
      ...t('STANDARD', ['ST_KREACH_REG']),
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
      ...t('REGULATION', ['RG_EU_LVD']),
      ...t('STANDARD', ['ST_EN62368']),
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
      ...t('REGULATION', ['RG_EU_ELABEL']),
      ...t('STANDARD', ['ST_EU_ELABEL']),
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
      ...t('REGULATION', ['RG_EU_EMC']),
      ...t('STANDARD', ['ST_EN55032']),
      ...t('DIVISION', ['VD']),
      ...t('PRODUCT_GROUP', ['PG_TV']),
      ...t('REGION', ['R_EU'])
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
  { histId: 110, regInfoId: 9, versionNo: 2, changeType: 'UPDATE', changeNote: '재난경보(AEA) 수신 항목 추가', regId: 'jung.dev', regDt: '2026-08-11 10:15' }
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
  ]
}
