/**
 * 세계지도 디자인 프리셋. 값만 다르고 그리는 코드는 mapEngine.js 하나를 같이 쓴다.
 *
 * 공통 키
 *   kind   : dot | hex | square | diamond | plus | scan | halftone | fill | globe | dotglobe
 *   bg     : 배경색 또는 그라데이션 색 배열 (bgRadial 이면 방사형)
 *   land   : 일반 국가 색, mk : 거점 국가 색, hq : 본사(한국) 색
 *   arc    : 서울발 연결선 색 (없으면 연결선 생략), glow : 거점·연결선 빛 번짐 세기
 *   tone   : 'dark' | 'light' — 갤러리 태그 표시용
 *   focusRegion : 강조할 규제 권역 코드. 해당 국가 면은 mk, 한국은 hq 색으로 표시
 *   fx     : false 이면 연결선·거점 핀·본사 펄스·도시 라벨 생략
 */
export const MAP_STYLES = [
  {
    key: 'midnight-dot',
    name: '미드나잇 도트',
    tone: 'dark',
    desc: '짙은 남색 위에 점으로 찍은 대륙. 거점만 밝게 빛나고 서울에서 연결선이 뻗어 나가요. 메인 히어로 영역에 가장 임팩트가 커요.',
    kind: 'dot', step: 7.5, r: 2.2, rMk: 2.7,
    bg: ['#081428', '#0E2347', '#0A1A36'], vignette: 'rgba(0,0,0,.35)',
    land: '#264776', mk: '#5AB0FF', hq: '#FFFFFF', arc: '#7CC4FF', glow: 8, pinRing: '#0A1A36'
  },
  {
    key: 'white-blue-dot',
    name: '화이트 블루 도트',
    tone: 'light',
    desc: '흰 바탕에 블루 계열 도트. 전자 업계 코퍼레이트 블루 느낌이라 밝은 대시보드 카드 안에 자연스럽게 들어가요.',
    kind: 'dot', step: 7.5, r: 2.2, rMk: 2.7,
    bg: '#FFFFFF', land: '#C9DDF3', mk: '#1F6FD1', hq: '#0A2A5C', arc: '#3D8BEB'
  },
  {
    key: 'hex-tile',
    name: '헥사곤 타일',
    tone: 'light',
    desc: '육각형 타일로 채운 지도. 반도체·디스플레이를 연상시키는 테크 감성이고, 거점 국가는 청록 타일로 표시해요.',
    kind: 'hex', step: 9, r: 4.6, rMk: 4.6,
    bg: ['#F7FAFC', '#EEF4F8'], land: '#DCE6EF', mk: '#14A38B', hq: '#0B5E50', arc: '#14A38B'
  },
  {
    key: 'globe-light',
    name: '라이트 지구본',
    tone: 'light',
    desc: '천천히 도는 지구본 위로 서울발 연결선이 이어져요. 글로벌 네트워크를 보여 주기 좋고 화면에 생동감을 줘요.',
    kind: 'globe', spin: 6,
    bg: ['#FAFCFF', '#EEF3FB'], ocean: ['#F6F9FE', '#DCE8F7'], atmosphere: 'rgba(31,111,209,.16)',
    land: '#FFFFFF', mk: '#BCD6F5', hq: '#1F6FD1', stroke: '#B9CFEA', graticule: 'rgba(31,111,209,.08)',
    rim: '#B9CFEA', shade: 'rgba(15,40,90,.10)', arc: '#1F6FD1'
  },
  {
    key: 'line-art',
    name: '라인 아트',
    tone: 'light',
    desc: '얇은 국경선만 그린 미니멀 스타일. 고급스럽고 조용해서 지도 위에 KPI 숫자를 올려도 복잡하지 않아요.',
    kind: 'fill',
    bg: '#FBFAF7', land: '#FBFAF7', mk: '#EAF1FB', hq: '#1F6FD1', stroke: '#B8C3D1', mkStroke: '#7FA8DB', lw: 0.6,
    graticule: '#ECE8DF', sphere: '#D9D4C9', arc: '#1F6FD1'
  },
  {
    key: 'duotone',
    name: '듀오톤 면',
    tone: 'light',
    desc: '부드러운 블루 면 지도에 거점만 진하게. 가장 무난하고 누가 봐도 깔끔한 정석 디자인이에요.',
    kind: 'fill',
    bg: '#FFFFFF', land: '#E4ECF6', mk: '#5B9BE6', hq: '#1F5FB8', stroke: '#FFFFFF', lw: 0.7, arc: '#1F5FB8'
  },
  {
    key: 'aurora-dot',
    name: '오로라 도트',
    tone: 'dark',
    desc: '서쪽에서 동쪽으로 청록 → 보라 → 핑크로 번지는 도트. 브랜드 키비주얼처럼 화려하지만 배경이 어두워 과하지 않아요.',
    kind: 'dot', step: 7, r: 2, rMk: 2.6, palette: 'aurora', aurora: ['#22D3EE', '#818CF8', '#E879F9'], landAlpha: 0.42,
    bg: ['#060A18', '#0E1432', '#120B2A'], vignette: 'rgba(0,0,0,.4)',
    hq: '#FFFFFF', arc: '#A5B4FC', glow: 10, pinRing: '#0E1432'
  },
  {
    key: 'cyber-grid',
    name: '사이버 그리드',
    tone: 'dark',
    desc: '관제실 모니터 같은 화면. 촘촘한 격자 배경에 시안색 도트가 빛나요. 실시간 모니터링 화면과 잘 어울려요.',
    kind: 'dot', step: 6, r: 1.7, rMk: 2.2,
    bg: ['#04070D', '#071420'], screenGrid: 'rgba(0,240,255,.05)', vignette: 'rgba(0,0,0,.5)',
    land: '#123540', mk: '#00E5FF', hq: '#FFFFFF', arc: '#00E5FF', glow: 12, pinRing: '#04070D'
  },
  {
    key: 'pixel',
    name: '픽셀 스퀘어',
    tone: 'light',
    desc: '정사각 픽셀로 찍은 지도. 반듯하고 디지털한 인상이라 데이터 중심 대시보드에 잘 맞아요.',
    kind: 'square', step: 8, r: 3.1, rMk: 3.1,
    bg: '#F6F7F9', land: '#D5DAE1', mk: '#2563EB', hq: '#0F172A', arc: '#2563EB'
  },
  {
    key: 'globe-dark-dot',
    name: '다크 도트 지구본',
    tone: 'dark',
    desc: '우주 같은 배경에 점으로 이뤄진 지구본이 돌아요. 대기광이 감싸서 가장 "있어 보이는" 연출이에요.',
    kind: 'dotglobe', spin: 6, r: 1.6, rMk: 2,
    bg: ['#0D1B38', '#050A16'], bgRadial: true,
    ocean: ['#10264D', '#0A1630'], atmosphere: 'rgba(59,130,246,.45)', graticule: 'rgba(147,197,253,.06)',
    land: '#3B6FC4', mk: '#93C5FD', hq: '#FFFFFF', rim: 'rgba(147,197,253,.35)', arc: '#60A5FA', glow: 8, pinRing: '#0A1630'
  },
  {
    key: 'globe-light-dot',
    name: '라이트 도트 지구본',
    tone: 'light',
    desc: '흰 지구본에 블루 도트. 다크 지구본보다 차분해서 밝은 테마 메인화면에 두기 좋아요.',
    kind: 'dotglobe', spin: 6, r: 1.6, rMk: 2,
    bg: ['#FFFFFF', '#F1F5FB'], ocean: ['#FFFFFF', '#EEF4FC'], atmosphere: 'rgba(31,111,209,.12)',
    land: '#9DB8DA', mk: '#1F6FD1', hq: '#0A2A5C', rim: '#D3E1F2', shade: 'rgba(15,40,90,.06)', arc: '#1F6FD1'
  },
  {
    key: 'night-lights',
    name: '나이트 라이트',
    tone: 'dark',
    desc: '밤의 위성 사진처럼 거점 도시에 불빛이 번져요. 감성적이고 고급스러운 연출이에요.',
    kind: 'fill',
    bg: ['#020409', '#070C18'], land: '#111827', mk: '#141C2E', hq: '#1A2338', stroke: '#1C2537', lw: 0.6,
    heat: ['rgba(255,196,107,.75)', 'rgba(255,170,70,.22)', 'rgba(255,150,50,0)'], heatBlend: 'lighter',
    arc: '#FFC46B', hqPulse: '#FFD58A', pin: '#FFD58A', pinRing: '#070C18', glow: 10
  },
  {
    key: 'blueprint',
    name: '블루프린트',
    tone: 'dark',
    desc: '설계 도면처럼 파란 바탕에 흰 선. 엔지니어링 회사다운 정체성이 드러나는 디자인이에요.',
    kind: 'fill',
    bg: ['#0B3B75', '#0E4C92'], screenGrid: 'rgba(255,255,255,.05)', graticule: 'rgba(255,255,255,.12)', sphere: 'rgba(255,255,255,.35)',
    land: 'rgba(255,255,255,.05)', mk: 'rgba(255,255,255,.2)', hq: 'rgba(255,255,255,.55)', stroke: 'rgba(255,255,255,.75)', lw: 0.55,
    arc: '#FFFFFF', hqPulse: '#FFFFFF', pinRing: '#0E4C92'
  },
  {
    key: 'gradient-fill',
    name: '그라데이션 면',
    tone: 'light',
    desc: '대륙이 서쪽 블루에서 동쪽 민트로 이어지는 그라데이션. 밝고 산뜻해서 칙칙함과는 거리가 멀어요.',
    kind: 'fill',
    bg: '#FFFFFF', landGradient: ['#D6E6FB', '#D3F1EC'], mkGradient: ['#3B82F6', '#14B8A6'],
    hq: '#0A2A5C', stroke: '#FFFFFF', lw: 0.7, arc: '#2563EB'
  },
  {
    key: 'emboss',
    name: '소프트 엠보스',
    tone: 'light',
    desc: '흰 대륙이 살짝 떠 있는 듯한 입체 그림자. 뉴모피즘 느낌으로 부드럽고 세련돼요.',
    kind: 'fill',
    bg: '#EDF1F6', land: '#FFFFFF', mk: '#DCE9FA', hq: '#1F6FD1', stroke: '#FFFFFF', lw: 0.6,
    shadow: { color: 'rgba(30,50,90,.18)', blur: 14, dy: 6 }, arc: '#1F6FD1'
  },
  {
    key: 'charcoal-accent',
    name: '차콜 + 레드 포인트',
    tone: 'light',
    desc: '진한 차콜 대륙에 레드 한 색만 포인트로. 잡지 인포그래픽처럼 단단하고 자신감 있는 인상이에요.',
    kind: 'fill',
    bg: '#F5F5F2', land: '#2B2F36', mk: '#4A505A', hq: '#E5484D', stroke: '#F5F5F2', lw: 0.5,
    arc: '#E5484D', pin: '#E5484D'
  },
  {
    key: 'halftone',
    name: '하프톤',
    tone: 'light',
    desc: '서울에서 멀어질수록 점이 작아지는 하프톤. "한국에서 세계로"라는 메시지가 디자인 자체에 담겨요.',
    kind: 'halftone', step: 7, r: 2.9, rMk: 2.7,
    bg: '#FFFFFF', land: '#2F6FD0', mk: '#1F5FB8', hq: '#0A2A5C', arc: '#1F6FD1'
  },
  {
    key: 'cross-stitch',
    name: '크로스 스티치',
    tone: 'light',
    desc: '십자 모양 패턴으로 짠 지도. 따뜻한 베이지 톤이라 딱딱한 B2B 화면에 부드러운 인상을 줘요.',
    kind: 'plus', step: 9, r: 3.2, rMk: 3.4,
    bg: '#FBF8F3', land: '#CDBFAE', mk: '#B4532A', hq: '#6B2A12', arc: '#B4532A'
  },
  {
    key: 'scanline',
    name: '스캔라인',
    tone: 'dark',
    desc: '대륙을 가로줄로 그린 레트로 디지털 스타일. 레이더나 디스플레이 화면 같은 느낌이에요.',
    kind: 'scan', step: 5, lw: 2.2,
    bg: ['#0B1222', '#111B33'], vignette: 'rgba(0,0,0,.35)',
    land: '#2C4778', mk: '#4FD1C5', hq: '#FFFFFF', arc: '#4FD1C5', glow: 8, pinRing: '#0B1222'
  },
  {
    key: 'outline-glow',
    name: '아웃라인 글로우',
    tone: 'dark',
    desc: '어두운 대륙의 국경선만 은은하게 빛나요. 차분한데도 첨단 느낌이 확실해요.',
    kind: 'fill',
    bg: ['#090E1D', '#0F1730'], land: '#0F1830', mk: '#18275A', hq: '#9DB7FF', stroke: '#4F7BFF', lw: 0.6,
    outlineGlow: 'rgba(79,123,255,.85)', arc: '#9DB7FF', glow: 10, pinRing: '#0F1730'
  },
  {
    key: 'pastel-region',
    name: '파스텔 권역',
    tone: 'light',
    desc: '권역마다 다른 파스텔 색. 화사하고 친근해서 보는 순간 대륙 구분이 한눈에 들어와요.',
    kind: 'fill', palette: 'region',
    regions: { NA: '#B5D4F4', LA: '#F5C4B3', EU: '#CECBF6', AF: '#FAC775', ME: '#F4C0D1', AS: '#9FE1CB', OC: '#F4C0D1' },
    bg: '#FFFFFF', hq: '#0F6E56', stroke: '#FFFFFF', lw: 0.7, arc: '#534AB7'
  },
  {
    key: 'heatmap',
    name: '히트맵',
    tone: 'light',
    desc: '거점 주변이 붉게 달아오르는 히트맵. 규제 건수나 리스크 밀집도를 보여 줄 때 바로 쓸 수 있어요.',
    kind: 'fill',
    bg: '#FFFFFF', land: '#E8EBEF', mk: '#E8EBEF', hq: '#E8EBEF', stroke: '#FFFFFF', lw: 0.6,
    heat: ['rgba(239,68,68,.6)', 'rgba(249,115,22,.28)', 'rgba(250,204,21,0)'],
    arc: '#EF4444', arcBase: 0.18, hqPulse: '#B91C1C', pin: '#DC2626'
  },
  {
    key: 'city-label',
    name: '도시 라벨',
    tone: 'light',
    desc: '연한 회색 지도에 거점 도시 이름표를 달았어요. 정보 전달이 가장 명확한 보고서형 디자인이에요.',
    kind: 'fill',
    bg: '#FFFFFF', land: '#E9ECF0', mk: '#D5E2F1', hq: '#1F6FD1', stroke: '#FFFFFF', lw: 0.6,
    arc: '#1F6FD1', arcBase: 0.25, labels: true
  },
  {
    key: 'green-esg',
    name: '그린 ESG',
    tone: 'light',
    desc: '연두·초록 톤 도트. 환경 규제나 ESG 보고 화면에 어울리는 싱그러운 분위기예요.',
    kind: 'dot', step: 7.5, r: 2.3, rMk: 2.8,
    bg: ['#F4FBF6', '#E7F5EC'], land: '#B6DCC3', mk: '#1F9D55', hq: '#0B4F2A', arc: '#1F9D55'
  },
  {
    key: 'violet-hex',
    name: '바이올렛 헥사',
    tone: 'dark',
    desc: '보랏빛 배경에 육각 타일. AI·플랫폼 서비스 같은 미래지향적 느낌이 강해요.',
    kind: 'hex', step: 9, r: 4.5, rMk: 4.5,
    bg: ['#120A2A', '#1E1145', '#140B30'], vignette: 'rgba(0,0,0,.35)',
    land: '#352770', mk: '#A78BFA', hq: '#FFFFFF', arc: '#C4B5FD', glow: 10, pinRing: '#1E1145'
  },
  {
    key: 'diamond',
    name: '다이아몬드',
    tone: 'light',
    desc: '마름모 패턴의 지도. 도트보다 날렵하고 정돈된 인상이라 프리미엄 브랜드 느낌을 줘요.',
    kind: 'diamond', step: 9, r: 3.6, rMk: 3.8,
    bg: '#FFFFFF', land: '#D9E2EC', mk: '#0EA5E9', hq: '#075985', arc: '#0EA5E9'
  },
  {
    key: 'atlas-focus-light',
    name: 'Atlas Focus 라이트',
    tone: 'light',
    desc: '차분한 회색 육지와 또렷한 국경선. 아시아 규제 대상 국가를 부드러운 블루로, 한국을 진한 블루로 강조해요. 거점·연결선을 끄면 권역 라벨이 잘 읽히는 담백한 지도가 돼요.',
    kind: 'fill', focusRegion: 'R_ASIA',
    bg: '#F6F9FD', land: '#DCE4EE', mk: '#9EBCED', hq: '#3268D5',
    stroke: '#F6F9FD', lw: 0.75, graticule: 'rgba(117,129,150,.10)',
    // 거점·연결선 ON 일 때 색: 한국 강조색과 같은 블루로 절제
    arc: '#3268D5', arcBase: 0.28, pinRing: '#F6F9FD'
  },
  {
    key: 'atlas-focus-dark',
    name: 'Atlas Focus 다크',
    tone: 'dark',
    desc: '짙은 네이비 바탕에 회청색 육지와 절제된 블루 강조. 아시아 규제 대상 국가와 한국이 드러나고, 작은 권역 라벨을 얹어도 복잡하지 않은 Atlas Focus의 다크 버전이에요.',
    kind: 'fill', focusRegion: 'R_ASIA',
    bg: '#111D30', land: '#33445B', mk: '#496C9F', hq: '#89B1FF',
    stroke: '#111D30', lw: 0.75, graticule: 'rgba(157,172,191,.08)',
    arc: '#89B1FF', arcBase: 0.3, pinRing: '#111D30'
  },
  {
    // 국내 전자 대기업(삼성 등) 글로벌 사이트의 코퍼레이트 톤: 흰 바탕 + 연회색 도트 + 단일 브랜드 블루(#1428A0)
    key: 'enterprise-blue',
    name: '엔터프라이즈 블루',
    tone: 'light',
    desc: '삼성 같은 전자 대기업 글로벌 사이트의 정제된 톤. 흰 바탕에 연회색 도트, 거점과 연결선만 브랜드 블루 한 색으로 절제해 신뢰감과 고급스러움을 줘요.',
    kind: 'dot', step: 6.5, r: 1.9, rMk: 2.3,
    bg: ['#FFFFFF', '#F7F8FB'], land: '#D5DAE3', mk: '#1428A0', hq: '#1428A0',
    arc: '#1428A0', arcBase: 0.22, pin: '#1428A0', pinRing: '#FFFFFF', hqPulse: '#1428A0'
  }
]
