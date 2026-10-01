/**
 * 권역 타일 디자인과 그리기.
 *
 * 타일은 두 군데에 나온다: 화면 HTML 층(RegionTileLayer)과 SVG·PNG 저장 파일.
 * "배치 계산(layoutTile)"을 한 번 하고 그 결과를 SVG(tileSvg)로 그린다.
 * HTML 층은 그 SVG 를 버튼 안에 넣어 쓰므로 화면과 저장 파일의 모양이 같다.
 *
 * 좌표는 지도와 같은 960x480 기준 단위. 화면 크기에 맞춰 늘리는 건 각 그리는 쪽이 한다.
 *
 * 디자인 참고: 방송 일기예보 지역 타일, 애플·구글 지도 라벨(알약·말풍선),
 * 대시보드 글래스모피즘 카드, 네온 HUD, 에디토리얼 지도 라벨(미니멀)
 */
import { regionName } from './regionTiles'

export const TILE_FONT = "'Pretendard Variable', Pretendard, 'Noto Sans KR', 'Malgun Gothic', sans-serif"

// Bootstrap Icons(MIT) 대륙별 지구 아이콘 경로 (16x16)
const ICONS = {
  americas:
    'M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0M2.04 4.326c.325 1.329 2.532 2.54 3.717 3.19.48.263.793.434.743.484q-.121.12-.242.234c-.416.396-.787.749-.758 1.266.035.634.618.824 1.214 1.017.577.188 1.168.38 1.286.983.082.417-.075.988-.22 1.52-.215.782-.406 1.48.22 1.48 1.5-.5 3.798-3.186 4-5 .138-1.243-2-2-3.5-2.5-.478-.16-.755.081-.99.284-.172.15-.322.279-.51.216-.445-.148-2.5-2-1.5-2.5.78-.39.952-.171 1.227.182.078.099.163.208.273.318.609.304.662-.132.723-.633.039-.322.081-.671.277-.867.434-.434 1.265-.791 2.028-1.12.712-.306 1.365-.587 1.579-.88A7 7 0 1 1 2.04 4.327Z',
  europeAfrica:
    'M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0M3.668 2.501l-.288.646a.847.847 0 0 0 1.479.815l.245-.368a.81.81 0 0 1 1.034-.275.81.81 0 0 0 .724 0l.261-.13a1 1 0 0 1 .775-.05l.984.34q.118.04.243.054c.784.093.855.377.694.801-.155.41-.616.617-1.035.487l-.01-.003C8.274 4.663 7.748 4.5 6 4.5 4.8 4.5 3.5 5.62 3.5 7c0 1.96.826 2.166 1.696 2.382.46.115.935.233 1.304.618.449.467.393 1.181.339 1.877C6.755 12.96 6.674 14 8.5 14c1.75 0 3-3.5 3-4.5 0-.262.208-.468.444-.7.396-.392.87-.86.556-1.8-.097-.291-.396-.568-.641-.756-.174-.133-.207-.396-.052-.551a.33.33 0 0 1 .42-.042l1.085.724c.11.072.255.058.348-.035.15-.15.415-.083.489.117.16.43.445 1.05.849 1.357L15 8A7 7 0 1 1 3.668 2.501',
  asia:
    'm10.495 6.92 1.278-.619a.483.483 0 0 0 .126-.782c-.252-.244-.682-.139-.932.107-.23.226-.513.373-.816.53l-.102.054c-.338.178-.264.626.1.736a.48.48 0 0 0 .346-.027ZM7.741 9.808V9.78a.413.413 0 1 1 .783.183l-.22.443a.6.6 0 0 1-.12.167l-.193.185a.36.36 0 1 1-.5-.516l.112-.108a.45.45 0 0 0 .138-.326M5.672 12.5l.482.233A.386.386 0 1 0 6.32 12h-.416a.7.7 0 0 1-.419-.139l-.277-.206a.302.302 0 1 0-.298.52zM8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0M1.612 10.867l.756-1.288a1 1 0 0 1 1.545-.225l1.074 1.005a.986.986 0 0 0 1.36-.011l.038-.037a.88.88 0 0 0 .26-.755c-.075-.548.37-1.033.92-1.099.728-.086 1.587-.324 1.728-.957.086-.386-.114-.83-.361-1.2-.207-.312 0-.8.374-.8.123 0 .24-.055.318-.15l.393-.474c.196-.237.491-.368.797-.403.554-.064 1.407-.277 1.583-.973.098-.391-.192-.634-.484-.88-.254-.212-.51-.426-.515-.741a7 7 0 0 1 3.425 7.692 1 1 0 0 0-.087-.063l-.316-.204a1 1 0 0 0-.977-.06l-.169.082a1 1 0 0 1-.741.051l-1.021-.329A1 1 0 0 0 11.205 9h-.165a1 1 0 0 0-.945.674l-.172.499a1 1 0 0 1-.404.514l-.802.518a1 1 0 0 0-.458.84v.455a1 1 0 0 0 1 1h.257a1 1 0 0 1 .542.16l.762.49a1 1 0 0 0 .283.126 7 7 0 0 1-9.49-3.409Z'
}
const REGION_ICON = { R_NA: 'americas', R_LA: 'americas', R_EU: 'europeAfrica', R_MEA: 'europeAfrica', R_ASIA: 'asia', R_OCE: 'asia' }

/**
 * 타일 디자인 프리셋. 값만 다르고 그리는 코드는 같다.
 *   label  : 화면에 보일 디자인 이름 (name 은 한글 글자 서식이라 따로 둔다)
 *   layout : stack(영문 위 + 한글 아래) | row(점 + 한글) | iconRow(아이콘 + 영문/한글)
 *   bg     : { color } 또는 { grad: [색...], dir: 'v'(위→아래) | 'd'(대각선) }. null 이면 배경 없음
 *   onDark : 어두운 지도 위에서 바꿀 값 (글자가 안 보이지 않게)
 *   onLight: 밝은 지도 위에서 바꿀 값 (어두운 지도용 디자인을 밝은 지도에 쓸 때)
 */
export const TILE_STYLES = [
  {
    key: 'weather', label: '일기예보', desc: '방송 일기예보의 지역 타일. 짙은 남색 + 노란 띠',
    layout: 'stack', radius: 5, padX: 11.5, padY: [5, 6], minW: 63,
    bg: { grad: ['#24507e', '#142f52'], dir: 'v' }, bar: { color: '#f5c518', h: 3 },
    shadow: { color: 'rgba(4,16,36,.38)', blur: 12, dy: 6 },
    en: { size: 8.2, color: 'rgba(255,255,255,.82)', weight: 600, spacing: 0.6 },
    name: { size: 19, color: '#ffffff', weight: 700 }
  },
  {
    key: 'glass', label: '글래스', desc: '반투명 유리 카드. 밝고 고급스러운 대시보드 느낌',
    layout: 'stack', radius: 12, padX: 13, padY: [7, 8], minW: 66,
    bg: { color: 'rgba(255,255,255,.76)' }, border: { color: 'rgba(255,255,255,.95)', w: 1 },
    shadow: { color: 'rgba(15,23,42,.22)', blur: 18, dy: 8 }, enDot: '#2563EB',
    en: { size: 7.8, color: '#64748B', weight: 600, spacing: 0.8 },
    name: { size: 18, color: '#0F172A', weight: 700 },
    onDark: { bg: { color: 'rgba(15,23,42,.55)' }, border: { color: 'rgba(255,255,255,.22)', w: 1 }, en: { color: '#94A3B8' }, name: { color: '#F8FAFC' }, enDot: '#60A5FA' }
  },
  {
    key: 'pill', label: '알약 라벨', desc: '애플·구글 지도식 라벨. 작고 깔끔해서 지도를 덜 가림',
    layout: 'row', radius: 'full', padX: 12, padY: [7, 7],
    bg: { color: '#FFFFFF' }, shadow: { color: 'rgba(15,23,42,.26)', blur: 12, dy: 4 },
    dot: { color: '#2563EB', r: 4.2, ring: 'rgba(37,99,235,.22)' },
    name: { size: 14.5, color: '#0F172A', weight: 700 }
  },
  {
    key: 'callout', label: '말풍선', desc: '아래 꼬리가 달린 콜아웃. 위치를 콕 집어 주는 느낌',
    layout: 'stack', radius: 10, padX: 12, padY: [6, 7], minW: 60, tail: 7,
    bg: { color: '#0F172A' }, shadow: { color: 'rgba(2,6,23,.35)', blur: 12, dy: 6 },
    en: { size: 7.6, color: '#94A3B8', weight: 600, spacing: 0.8 },
    name: { size: 17, color: '#F8FAFC', weight: 700 },
    onDark: { bg: { color: '#F8FAFC' }, en: { color: '#64748B' }, name: { color: '#0F172A' } }
  },
  {
    key: 'gradient', label: '그라데이션 칩', desc: '블루→바이올렛 브랜드 그라데이션 + 대륙 아이콘',
    layout: 'iconRow', radius: 14, padX: 12, padY: [7, 8],
    bg: { grad: ['#2563EB', '#7C3AED'], dir: 'd' }, shadow: { color: 'rgba(76,29,149,.38)', blur: 18, dy: 8 },
    icon: { color: '#FFFFFF', size: 19 },
    en: { size: 7.4, color: 'rgba(255,255,255,.78)', weight: 600, spacing: 0.8 },
    name: { size: 16, color: '#FFFFFF', weight: 700 }
  },
  {
    key: 'neon', label: '네온', desc: '빛나는 테두리. 어두운 지도·관제 화면에 어울림',
    layout: 'stack', radius: 9, padX: 12, padY: [6, 7], minW: 62,
    bg: { color: 'rgba(6,12,28,.62)' }, border: { color: '#22D3EE', w: 1.2 }, glow: 'rgba(34,211,238,.85)',
    en: { size: 7.8, color: '#67E8F9', weight: 600, spacing: 1 },
    name: { size: 18, color: '#ECFEFF', weight: 700 },
    onLight: { bg: { color: 'rgba(255,255,255,.88)' }, border: { color: '#06B6D4', w: 1.4 }, glow: 'rgba(6,182,212,.55)', en: { color: '#0891B2' }, name: { color: '#0E7490' } }
  },
  {
    key: 'minimal', label: '미니멀', desc: '배경 없이 글자와 짧은 밑줄만. 잡지 지도 같은 세련됨',
    layout: 'stack', bg: null, padX: 4, padY: [2, 3],
    en: { size: 8, color: '#64748B', weight: 700, spacing: 1.4 },
    name: { size: 21, color: '#0F172A', weight: 800, halo: 'rgba(255,255,255,.92)' },
    underline: { color: '#2563EB', w: 22, h: 3 },
    onDark: { en: { color: '#94A3B8' }, name: { color: '#F8FAFC', halo: 'rgba(2,6,23,.8)' }, underline: { color: '#60A5FA' } }
  },
  {
    key: 'iconCard', label: '아이콘 카드', desc: '흰 카드 + 색 원 안의 대륙 아이콘. 친근하고 정보가 분명함',
    layout: 'iconRow', radius: 12, padX: 9, padY: [7, 7],
    bg: { color: '#FFFFFF' }, border: { color: 'rgba(15,23,42,.06)', w: 1 },
    shadow: { color: 'rgba(15,23,42,.2)', blur: 16, dy: 6 },
    icon: { color: '#FFFFFF', size: 15, circle: { r: 14, color: '#2563EB' } },
    en: { size: 7.2, color: '#94A3B8', weight: 600, spacing: 0.8 },
    name: { size: 15, color: '#0F172A', weight: 700 },
    onDark: { bg: { color: '#111827' }, border: { color: 'rgba(255,255,255,.1)', w: 1 }, name: { color: '#F8FAFC' }, icon: { circle: { color: '#3B82F6' } } }
  },
  {
    key: 'atlas-focus', label: 'Atlas Focus 라벨', desc: '작은 블루 점과 한글 권역명. 얇은 테두리와 낮은 그림자로 지도를 덜 가리는 라벨',
    layout: 'row', radius: 7, padX: 12, padY: [8, 8],
    bg: { color: '#FFFFFF' }, border: { color: '#E4EAF2', w: 1 },
    shadow: { color: 'rgba(40,57,83,.09)', blur: 8, dy: 3 },
    dot: { color: '#3268D5', r: 2.8, ring: 'transparent' },
    name: { size: 16, color: '#202D43', weight: 600 },
    onDark: {
      bg: { color: '#172337' }, border: { color: '#3B4D67', w: 1 },
      name: { color: '#E9EFF9' }, dot: { color: '#89B1FF' }
    }
  },
  {
    key: 'region-desk', label: 'Region Desk 카드', desc: '영문과 한글을 왼쪽으로 정렬한 차분한 권역 카드. 연한 블루 배경으로 정보의 위계를 구분',
    layout: 'stack', align: 'left', radius: 7, padX: 13, padY: [8, 9], minW: 94,
    bg: { color: '#EAF1FF' }, border: { color: '#C9DAF4', w: 0.8 },
    en: { size: 8, color: '#758196', weight: 500, spacing: 0.7 },
    name: { size: 17, color: '#3268D5', weight: 600 },
    onDark: {
      bg: { color: '#263E61' }, border: { color: '#3B567B', w: 0.8 },
      en: { color: '#B0C2DB' }, name: { color: '#C7DBFF' }
    }
  }
]

export const tileStyleOf = (key) => TILE_STYLES.find((t) => t.key === key) || TILE_STYLES[0]

// 얕은 객체는 한 단계 더 합친다 (en: { color } 만 바꿔도 size 등은 유지)
function mergeSpec(base, over) {
  if (!over) return base
  const out = { ...base }
  Object.keys(over).forEach((k) => {
    const v = over[k]
    out[k] = v && typeof v === 'object' && !Array.isArray(v) && base[k] && typeof base[k] === 'object'
      ? mergeSpec(base[k], v)
      : v
  })
  return out
}

/* ---------------- 글자 폭 ---------------- */
let measureCtx = null
function textW(text, size, weight, spacing = 0) {
  measureCtx ||= document.createElement('canvas').getContext('2d')
  measureCtx.font = `${weight} ${size}px ${TILE_FONT}`
  return measureCtx.measureText(text).width + spacing * Math.max(0, text.length - 1)
}

/**
 * 타일 하나의 배치. 왼쪽 위(0,0) 기준 상자 크기와 그릴 요소들.
 * @param mapTone 'dark' | 'light' — 지도 바탕에 따라 onDark 값을 쓴다
 */
export function layoutTile(styleKey, region, mapTone = 'light') {
  let sp = tileStyleOf(styleKey)
  sp = mergeSpec(sp, mapTone === 'dark' ? sp.onDark : sp.onLight)
  const en = region.en
  const name = region.name || regionName(region.cd)
  const [pt, pb] = sp.padY
  const texts = []
  const L = { spec: sp, texts, w: 0, h: 0, tail: sp.tail || 0 }

  if (sp.layout === 'row') {
    const nw = textW(name, sp.name.size, sp.name.weight)
    const dr = sp.dot.r
    const innerH = Math.max(dr * 2 + 6, sp.name.size * 1.2)
    L.h = pt + innerH + pb
    L.w = sp.padX + dr * 2 + 7 + nw + sp.padX
    L.dot = { cx: sp.padX + dr, cy: L.h / 2, r: dr }
    texts.push({ text: name, x: sp.padX + dr * 2 + 7, y: L.h / 2 + sp.name.size * 0.36, align: 'left', ...sp.name })
  } else if (sp.layout === 'iconRow') {
    const iconBox = sp.icon.circle ? sp.icon.circle.r * 2 : sp.icon.size
    const enW = textW(en, sp.en.size, sp.en.weight, sp.en.spacing)
    const nw = textW(name, sp.name.size, sp.name.weight)
    const stackH = sp.en.size * 1.25 + 1 + sp.name.size * 1.12
    const innerH = Math.max(iconBox, stackH)
    L.h = pt + innerH + pb
    L.w = sp.padX + iconBox + 8 + Math.max(enW, nw) + sp.padX + 2
    L.icon = { x: sp.padX, y: pt + (innerH - iconBox) / 2, box: iconBox, key: REGION_ICON[region.cd] || 'asia' }
    const tx = sp.padX + iconBox + 8
    const ty = pt + (innerH - stackH) / 2
    texts.push({ text: en, x: tx, y: ty + sp.en.size * 0.95, align: 'left', ...sp.en })
    texts.push({ text: name, x: tx, y: ty + sp.en.size * 1.25 + 1 + sp.name.size * 0.9, align: 'left', ...sp.name })
  } else {
    const dotW = sp.enDot ? 8 : 0
    const enW = textW(en, sp.en.size, sp.en.weight, sp.en.spacing) + dotW
    const nw = textW(name, sp.name.size, sp.name.weight)
    const ul = sp.underline ? sp.underline.h + 4 : 0
    L.w = Math.max(sp.minW || 0, Math.max(enW, nw) + sp.padX * 2)
    L.h = pt + sp.en.size * 1.25 + 2 + sp.name.size * 1.12 + ul + pb + (sp.bar ? sp.bar.h : 0)
    const cx = L.w / 2
    const enY = pt + sp.en.size * 0.95
    const align = sp.align === 'left' ? 'left' : 'center'
    const tx = align === 'left' ? sp.padX : cx
    texts.push({ text: en, x: tx + (align === 'left' ? dotW : dotW / 2), y: enY, align, ...sp.en })
    if (sp.enDot) L.enDot = { cx: cx - enW / 2 + 2.5, cy: enY - sp.en.size * 0.32, r: 2.5, color: sp.enDot }
    const nameY = pt + sp.en.size * 1.25 + 2 + sp.name.size * 0.9
    texts.push({ text: name, x: tx, y: nameY, align, ...sp.name })
    if (sp.underline) L.underline = { x: cx - sp.underline.w / 2, y: nameY + sp.name.size * 0.22 + 4, w: sp.underline.w, h: sp.underline.h }
  }
  L.r = sp.radius === 'full' ? L.h / 2 : sp.radius || 0
  return L
}

function boxPathCommands(L) {
  // 둥근 사각형 + (있으면) 아래 가운데 꼬리
  const { w, h, r, tail } = L
  const c = []
  c.push(['M', r, 0], ['L', w - r, 0], ['Q', w, 0, w, r], ['L', w, h - r], ['Q', w, h, w - r, h])
  if (tail) c.push(['L', w / 2 + tail, h], ['L', w / 2, h + tail], ['L', w / 2 - tail, h])
  c.push(['L', r, h], ['Q', 0, h, 0, h - r], ['L', 0, r], ['Q', 0, 0, r, 0], ['Z'])
  return c
}

/* ---------------- SVG ---------------- */
const r1 = (v) => Math.round(v * 10) / 10
const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')

function svgPathD(cmds) {
  return cmds.map(([op, ...a]) => op + a.map(r1).join(' ')).join('')
}

/** 타일 디자인 하나에 필요한 defs (그라데이션·그림자·빛). id 접두어로 겹치지 않게 */
export function tileDefs(L, id) {
  const sp = L.spec
  let d = ''
  if (sp.bg && sp.bg.grad) {
    const [x2, y2] = sp.bg.dir === 'd' ? [1, 1] : [0, 1]
    d += `<linearGradient id="${id}g" x1="0" y1="0" x2="${x2}" y2="${y2}">${sp.bg.grad.map((c, i) => `<stop offset="${i / (sp.bg.grad.length - 1)}" stop-color="${c}"/>`).join('')}</linearGradient>`
  }
  if (sp.shadow) {
    d += `<filter id="${id}s" x="-40%" y="-40%" width="180%" height="200%"><feDropShadow dx="0" dy="${sp.shadow.dy}" stdDeviation="${r1(sp.shadow.blur / 2)}" flood-color="${sp.shadow.color}"/></filter>`
  }
  if (sp.glow) {
    d += `<filter id="${id}w" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="${sp.glow}"/></filter>`
  }
  return d
}

/**
 * 타일 SVG 조각. (ox, oy) 는 상자 왼쪽 위.
 * @param id tileDefs 와 같은 접두어. clipPath 는 타일마다 달라야 해서 idx 를 붙인다
 */
export function tileSvg(L, ox, oy, id, idx = 0, attrs = '') {
  const sp = L.spec
  const cmds = boxPathCommands(L)
  const d = svgPathD(cmds)
  let out = `<g transform="translate(${r1(ox)} ${r1(oy)})"${attrs}>`
  if (sp.bg) {
    const fill = sp.bg.grad ? `url(#${id}g)` : sp.bg.color
    out += `<path d="${d}" fill="${fill}"${sp.shadow ? ` filter="url(#${id}s)"` : ''}/>`
    if (sp.bar) {
      out += `<clipPath id="${id}c${idx}"><path d="${d}"/></clipPath>`
      out += `<rect x="0" y="${r1(L.h - sp.bar.h)}" width="${r1(L.w)}" height="${sp.bar.h}" fill="${sp.bar.color}" clip-path="url(#${id}c${idx})"/>`
    }
    if (sp.border) {
      out += `<path d="${d}" fill="none" stroke="${sp.border.color}" stroke-width="${sp.border.w}"${sp.glow ? ` filter="url(#${id}w)"` : ''}/>`
    }
  }
  if (L.dot) {
    out += `<circle cx="${r1(L.dot.cx)}" cy="${r1(L.dot.cy)}" r="${r1(L.dot.r + 3)}" fill="${sp.dot.ring}"/>`
    out += `<circle cx="${r1(L.dot.cx)}" cy="${r1(L.dot.cy)}" r="${r1(L.dot.r)}" fill="${sp.dot.color}"/>`
  }
  if (L.enDot) out += `<circle cx="${r1(L.enDot.cx)}" cy="${r1(L.enDot.cy)}" r="${L.enDot.r}" fill="${L.enDot.color}"/>`
  if (L.icon) {
    const ic = sp.icon
    if (ic.circle) out += `<circle cx="${r1(L.icon.x + ic.circle.r)}" cy="${r1(L.icon.y + ic.circle.r)}" r="${ic.circle.r}" fill="${ic.circle.color}"/>`
    const off = (L.icon.box - ic.size) / 2
    out += `<path transform="translate(${r1(L.icon.x + off)} ${r1(L.icon.y + off)}) scale(${r1((ic.size / 16) * 1000) / 1000})" d="${ICONS[L.icon.key]}" fill="${ic.color}"/>`
  }
  L.texts.forEach((t) => {
    const anchor = t.align === 'center' ? 'middle' : 'start'
    const common = `x="${r1(t.x)}" y="${r1(t.y)}" text-anchor="${anchor}" font-family="${esc(TILE_FONT)}" font-size="${t.size}" font-weight="${t.weight}"${t.spacing ? ` letter-spacing="${t.spacing}"` : ''}`
    if (t.halo) out += `<text ${common} fill="none" stroke="${t.halo}" stroke-width="4" stroke-linejoin="round">${esc(t.text)}</text>`
    out += `<text ${common} fill="${t.color}">${esc(t.text)}</text>`
  })
  if (L.underline) {
    out += `<rect x="${r1(L.underline.x)}" y="${r1(L.underline.y)}" width="${L.underline.w}" height="${L.underline.h}" rx="${L.underline.h / 2}" fill="${sp.underline.color}"/>`
  }
  return `${out}</g>`
}

/**
 * HTML 층 버튼 안에 넣을 독립 SVG. 그림자가 잘리지 않게 여백(m)을 둔다.
 * @returns { svg, vw, vh, m } — vw·vh 는 여백 포함 크기(지도 단위)
 */
export function tileStandaloneSvg(L, id) {
  const m = 18
  const vw = L.w + m * 2
  const vh = L.h + L.tail + m * 2
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${r1(vw)} ${r1(vh)}" style="display:block;width:100%;height:auto;overflow:visible"><defs>${tileDefs(L, id)}</defs>${tileSvg(L, m, m, id)}</svg>`
  return { svg, vw, vh, m }
}
