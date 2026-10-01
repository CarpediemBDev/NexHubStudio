/**
 * 디자인 하나를 다크·라이트 두 벌로 쓰기.
 *
 * mapStyles.js 의 디자인은 tone(기본 테마) 한 벌의 색만 적는다. 반대 테마가 필요하면
 *   1) 규칙으로 자동 변환한다 — 바탕·육지·국경 같은 "면" 색은 밝기를 뒤집고,
 *      거점·본사·연결선 같은 "강조" 색은 반대 바탕에서 잘 보이게 밝기만 옮긴다 (색상은 그대로)
 *   2) 디자인에 variants[tone] 이 있으면 그 값으로 덮어쓴다 (손으로 맞춘 색. null 이면 항목 삭제)
 * 같은 디자인·테마는 한 번만 만들고 재사용한다 (그리는 쪽에서 매 프레임 불러도 된다).
 */

/* ---------------- 색 변환 ---------------- */
function parse(c) {
  if (typeof c !== 'string') return null
  if (c[0] === '#' && c.length === 7) {
    const n = parseInt(c.slice(1), 16)
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: 1 }
  }
  const m = c.match(/^rgba?\(([^)]+)\)$/)
  if (!m) return null
  const [r, g, b, a = 1] = m[1].split(',').map((v) => parseFloat(v))
  return { r, g, b, a }
}

function toHsl({ r, g, b }) {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  // c: 실제 색 기운. 거의 흰색은 HSL 채도가 높게 나와도 c 가 작다
  if (max === min) return { h: 0, s: 0, l, c: 0 }
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0)
  else if (max === g) h = (b - r) / d + 2
  else h = (r - g) / d + 4
  return { h: h * 60, s, l, c: d }
}

function fromHsl({ h, s, l }, a) {
  const k = (n) => (n + h / 30) % 12
  const q = s * Math.min(l, 1 - l)
  const f = (n) => Math.round(255 * (l - q * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))))
  const [r, g, b] = [f(0), f(8), f(4)]
  if (a < 1) return `rgba(${r},${g},${b},${+a.toFixed(3)})`
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase()
}

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

/** 색 하나에 밝기 함수를 적용한다 (투명도·색상은 유지). 색이 아니면 그대로 */
function mapColor(c, fn) {
  const p = parse(c)
  if (!p) return c
  const hsl = toHsl(p)
  return fromHsl(fn(hsl), p.a)
}

/* 면 색: 밝기를 뒤집는다. 흰 바탕 → 짙은 남색 바탕, 연한 육지 → 바탕보다 조금 밝은 육지 */
const surface = {
  dark: (hsl) => {
    // 무채색(흰·회색)은 그대로 뒤집으면 칙칙한 검정이 되므로 남색 기운을 준다
    const neutral = hsl.c < 0.025
    return { h: neutral ? 220 : hsl.h, s: neutral ? 0.3 : Math.min(hsl.s * 0.85, 0.4), l: clamp(0.08 + (1 - hsl.l) * 1.6, 0.06, 0.7) }
  },
  light: (hsl) => ({ h: hsl.h, s: hsl.s * 0.75, l: clamp(1 - (hsl.l - 0.04) * 1.15, 0.3, 0.985) })
}

/* 강조 색: 같은 색상으로 반대 바탕에서 보이게 밝기만 옮긴다 */
const accent = {
  dark: (hsl) => {
    if (hsl.l > 0.8) return surface.dark(hsl) // 거의 흰 연한 강조(라인 아트 거점 면 등)는 면처럼
    if (hsl.l < 0.3) return { ...hsl, l: 0.9 } // 짙은 남색 본사 → 거의 흰색
    return { ...hsl, l: Math.max(hsl.l, 0.62) }
  },
  light: (hsl) => {
    if (hsl.l < 0.22) return surface.light(hsl) // 거의 검은 강조(나이트 라이트 거점 면 등)는 면처럼
    if (hsl.l > 0.85) return { h: hsl.c < 0.05 ? 222 : hsl.h, s: 0.65, l: 0.2 } // 흰 본사 → 짙은 남색
    return { ...hsl, l: Math.min(hsl.l, 0.46) }
  }
}

const SURFACE_KEYS = ['bg', 'ocean', 'land', 'stroke', 'sphere', 'rim', 'graticule', 'screenGrid', 'mkStroke', 'landGradient', 'shade']
const ACCENT_KEYS = ['mk', 'hq', 'arc', 'pin', 'hqPulse', 'mkGradient', 'aurora', 'atmosphere', 'outlineGlow', 'heat']

const each = (v, fn) => (Array.isArray(v) ? v.map(fn) : fn(v))

function autoVariant(s, tone) {
  const out = { ...s, tone }
  for (const key of SURFACE_KEYS) if (s[key] != null) out[key] = each(s[key], (c) => mapColor(c, surface[tone]))
  for (const key of ACCENT_KEYS) if (s[key] != null) out[key] = each(s[key], (c) => mapColor(c, accent[tone]))
  if (s.regions) {
    // 권역 파스텔: 다크에서는 채도를 낮춘 중간 밝기, 라이트에서는 파스텔 밝기로 고르게
    const region = (hsl) => (tone === 'dark' ? { h: hsl.h, s: hsl.s * 0.55, l: 0.36 } : { h: hsl.h, s: hsl.s, l: 0.8 })
    out.regions = Object.fromEntries(Object.entries(s.regions).map(([k, c]) => [k, mapColor(c, region)]))
  }
  const bgDeep = Array.isArray(out.bg) ? out.bg[out.bg.length - 1] : out.bg
  if (tone === 'dark') {
    // 어두운 바탕에서는 거점이 은은하게 빛나야 살아난다
    out.glow = s.glow || 6
    out.pinRing = bgDeep
    if (s.shadow) out.shadow = { ...s.shadow, color: 'rgba(0,0,0,.55)' }
  } else {
    // 밝은 바탕에서 빛 번짐·비네팅·밝게 더하기는 뿌옇게만 보인다
    delete out.glow
    delete out.vignette
    delete out.heatBlend
    out.pinRing = bgDeep
  }
  return out
}

/* ---------------- 공개 함수 ---------------- */
const cache = new Map()

/**
 * 디자인을 원하는 테마로. tone 이 디자인 기본 테마와 같으면 원본 그대로 돌려준다.
 * 돌려준 객체의 themeKey('키@테마')는 텍스처처럼 테마별로 따로 캐시해야 하는 곳에서 쓴다.
 */
export function styleForTone(style, tone) {
  if (!style || !tone || tone === style.tone) return style
  const id = `${style.key}@${tone}`
  if (cache.has(id)) return cache.get(id)
  const out = autoVariant(style, tone)
  const hand = style.variants?.[tone]
  if (hand) {
    for (const [k, v] of Object.entries(hand)) {
      if (v === null) delete out[k]
      else out[k] = v
    }
  }
  delete out.variants
  out.themeKey = id
  cache.set(id, out)
  return out
}

/** 캐시 키: 같은 디자인이라도 테마가 다르면 다른 키 */
export const themeKeyOf = (s) => s.themeKey || `${s.key}@${s.tone}`
