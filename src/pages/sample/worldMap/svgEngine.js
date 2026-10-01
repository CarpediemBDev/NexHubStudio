/**
 * 세계지도 SVG 렌더러. mapEngine.js(Canvas)와 같은 데이터·같은 디자인 설정으로 SVG 마크업 문자열을 만든다.
 *
 * Canvas 와 다른 점
 *   - 결과물이 벡터라 확대해도 다시 그릴 필요 없이 선명하다. 문자열 그대로 .svg 파일로 저장할 수 있다.
 *   - 나라 하나가 <path data-cid> 하나라서 클릭·호버·CSS 를 요소에 바로 걸 수 있다.
 *     (도트·헥사곤처럼 점으로 찍는 디자인도 나라별 점들을 path 하나로 묶었다)
 *   - 평면 지도의 움직임(연결선 빛, 본사 펄스)은 SVG 자체 애니메이션(<animate>)이라 JS 없이 돈다.
 *     지구본만 회전 때문에 매 프레임 마크업을 다시 만든다.
 */
import { geoOrthographic, geoPath, geoGraticule10, geoDistance } from 'd3-geo'
import {
  W, H, GR, MARKETS, HQ, ROUTES, features, flatProj,
  gridSamples, getGlobePts, toneOf, isAccent, alpha
} from './mapEngine'
import { tilePositions } from './regionTiles'
import { layoutTile, tileSvg, tileDefs } from './tileRender'

const r1 = (v) => Math.round(v * 10) / 10
const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

function shapeD(shape, x, y, r) {
  x = r1(x)
  y = r1(y)
  r = r1(r)
  if (shape === 'square') return `M${r1(x - r)} ${r1(y - r)}h${r1(r * 2)}v${r1(r * 2)}h${r1(-r * 2)}z`
  if (shape === 'diamond') return `M${x} ${r1(y - r)}l${r} ${r}l${-r} ${r}l${-r} ${-r}z`
  if (shape === 'hex') {
    let d = ''
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 180) * (60 * i - 30)
      d += `${i ? 'L' : 'M'}${r1(x + r * Math.cos(a))} ${r1(y + r * Math.sin(a))}`
    }
    return `${d}z`
  }
  if (shape === 'plus') {
    const t = r1(r * 0.32)
    return `M${r1(x - r)} ${r1(y - t)}h${r1(r * 2)}v${r1(t * 2)}h${r1(-r * 2)}z M${r1(x - t)} ${r1(y - r)}h${r1(t * 2)}v${r1(r * 2)}h${r1(-t * 2)}z`
  }
  return `M${r1(x - r)} ${y}a${r} ${r} 0 1 0 ${r1(r * 2)} 0a${r} ${r} 0 1 0 ${r1(-r * 2)} 0`
}

function gradStops(colors) {
  return colors.map((c, i) => `<stop offset="${r1((i / (colors.length - 1)) * 100)}%" stop-color="${c}"/>`).join('')
}

/* ---------------- defs ---------------- */
function defs(s, id) {
  let d = ''
  if (Array.isArray(s.bg)) {
    d += s.bgRadial
      ? `<radialGradient id="${id}bg" cx="50%" cy="46%" r="70%">${gradStops(s.bg)}</radialGradient>`
      : `<linearGradient id="${id}bg" x1="0" y1="0" x2="1" y2="1">${gradStops(s.bg)}</linearGradient>`
  }
  if (s.screenGrid) {
    d += `<pattern id="${id}sg" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0V32" fill="none" stroke="${s.screenGrid}" stroke-width="1"/></pattern>`
  }
  if (s.vignette) {
    d += `<radialGradient id="${id}vg" cx="50%" cy="50%" r="62%"><stop offset="35%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="${s.vignette}"/></radialGradient>`
  }
  if (s.glow) {
    d += `<filter id="${id}gl" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${r1(s.glow / 3)}" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`
  }
  if (s.palette === 'aurora') {
    d += `<linearGradient id="${id}au" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${W}" y2="0">${gradStops(s.aurora)}</linearGradient>`
  }
  if (s.landGradient) {
    d += `<linearGradient id="${id}lg" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${W}" y2="0">${gradStops(s.landGradient)}</linearGradient>`
    d += `<linearGradient id="${id}mg" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${W}" y2="0">${gradStops(s.mkGradient)}</linearGradient>`
  }
  if (s.shadow) {
    d += `<filter id="${id}sh" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="${s.shadow.dy}" stdDeviation="${r1(s.shadow.blur / 2)}" flood-color="${s.shadow.color}"/></filter>`
  }
  if (s.outlineGlow) {
    d += `<filter id="${id}og" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="4"/></filter>`
  }
  if (s.heat) {
    d += `<radialGradient id="${id}ht">${gradStops(s.heat)}</radialGradient>`
  }
  if (s.ocean) {
    d += `<radialGradient id="${id}oc" cx="35%" cy="30%" r="75%">${gradStops(s.ocean)}</radialGradient>`
  }
  if (s.atmosphere) {
    const inner = r1((GR * 0.92 / (GR + 34)) * 100)
    d += `<radialGradient id="${id}at"><stop offset="${inner}%" stop-color="${s.atmosphere}"/><stop offset="100%" stop-color="#000" stop-opacity="0"/></radialGradient>`
  }
  if (s.shade) {
    d += `<radialGradient id="${id}sd" cx="30%" cy="25%" r="80%"><stop offset="65%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="${s.shade}"/></radialGradient>`
  }
  return `<defs>${d}</defs>`
}

function bgLayer(s, id) {
  let out = `<rect width="${W}" height="${H}" fill="${Array.isArray(s.bg) ? `url(#${id}bg)` : s.bg}"/>`
  if (s.screenGrid) out += `<rect width="${W}" height="${H}" fill="url(#${id}sg)"/>`
  return out
}

/* ---------------- 육지 ---------------- */
function countryAttrs(f) {
  return `data-cid="${f.cid}" data-name="${esc(f.properties.name)}"`
}

function gridLand(s, id) {
  const shape = s.kind === 'halftone' ? 'dot' : s.kind
  const pts = gridSamples(shape, s.step)
  const byCountry = new Map()
  const hp = flatProj(HQ.ll)
  pts.forEach((p) => {
    if (!byCountry.has(p.f)) byCountry.set(p.f, [])
    let d
    if (shape === 'scan') d = `M${r1(p.x1)} ${r1(p.y)}H${r1(p.x2)}`
    else {
      let r = isAccent(p.f) ? s.rMk ?? s.r : s.r
      if (s.kind === 'halftone' && !isAccent(p.f)) {
        r = Math.max(0.5, s.r * (1 - Math.hypot(p.x - hp[0], (p.y - hp[1]) * 1.6) / 760))
      }
      d = shapeD(shape, p.x, p.y, r)
    }
    byCountry.get(p.f).push(d)
  })
  let out = ''
  byCountry.forEach((ds, f) => {
    let paint = toneOf(s, f, 0)
    let extra = ''
    if (s.palette === 'aurora' && f.cid !== '410') {
      paint = `url(#${id}au)`
      if (!isAccent(f)) extra = shape === 'scan' ? ` stroke-opacity="${s.landAlpha ?? 0.45}"` : ` fill-opacity="${s.landAlpha ?? 0.45}"`
    }
    if (s.glow && isAccent(f)) extra += ` filter="url(#${id}gl)"`
    const paintAttr = shape === 'scan'
      ? `fill="none" stroke="${paint}" stroke-width="${s.lw || 2}" stroke-linecap="round"`
      : `fill="${paint}"`
    out += `<path class="c" ${countryAttrs(f)} ${paintAttr}${extra} d="${ds.join('')}"/>`
  })
  return out
}

function fillLand(s, id) {
  const path = geoPath(flatProj)
  let out = ''
  if (s.graticule) out += `<path d="${path(geoGraticule10())}" fill="none" stroke="${s.graticule}" stroke-width="0.6"/>`
  if (s.sphere) out += `<path d="${path({ type: 'Sphere' })}" fill="none" stroke="${s.sphere}" stroke-width="0.8"/>`
  const all = features.map((f) => path(f)).join('')
  if (s.shadow) out += `<path d="${all}" fill="${s.land}" filter="url(#${id}sh)"/>`
  if (s.outlineGlow) out += `<path d="${all}" fill="none" stroke="${s.outlineGlow}" stroke-width="${(s.lw || 0.6) + 1.2}" filter="url(#${id}og)"/>`
  features.forEach((f) => {
    let fill = toneOf(s, f, 0)
    if (s.landGradient && f.cid !== '410') fill = `url(#${id}${isAccent(f) ? 'mg' : 'lg'})`
    const stroke = s.stroke ? ` stroke="${s.mkStroke && isAccent(f) ? s.mkStroke : s.stroke}" stroke-width="${s.lw || 0.6}" stroke-linejoin="round"` : ''
    out += `<path class="c" ${countryAttrs(f)} fill="${fill}"${stroke} d="${path(f)}"/>`
  })
  if (s.heat) {
    const blend = s.heatBlend === 'lighter' ? ' style="mix-blend-mode:screen"' : ''
    out += `<g${blend} pointer-events="none">`
    Object.values(MARKETS).forEach((m, i) => {
      const [x, y] = flatProj(m.ll)
      const r = m === HQ ? 70 : 34 + (i % 4) * 9
      out += `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r}" fill="url(#${id}ht)"/>`
    })
    out += '</g>'
  }
  return out
}

/* ---------------- 효과 ----------------
 * smil=true  : 평면 지도. <animate> 로 브라우저가 알아서 움직인다
 * smil=false : 지구본. 매 프레임 다시 만들므로 시간 t 로 위치를 계산해 박아 넣는다 */
function fx(s, id, proj, t, center, smil) {
  if (s.fx === false) return ''
  const path = geoPath(proj)
  const visible = (ll) => !center || geoDistance(ll, center) < 1.5
  let out = '<g pointer-events="none">'
  if (s.arc) {
    const glow = s.glow ? ` filter="url(#${id}gl)"` : ''
    ROUTES.forEach((m, i) => {
      const d = path({ type: 'LineString', coordinates: [HQ.ll, m.ll] })
      if (!d) return
      out += `<path d="${d}" fill="none" stroke="${alpha(s.arc, s.arcBase ?? 0.35)}" stroke-width="1.1"/>`
      // pathLength=1000 으로 선 길이를 정규화해 두면 길이를 재지 않고도 빛 조각을 같은 속도로 흘릴 수 있다
      const comet = `d="${d}" fill="none" stroke="${s.arc}" stroke-width="2.2" stroke-linecap="round" pathLength="1000" stroke-dasharray="30 3000"${glow}`
      if (smil) {
        out += `<path ${comet}><animate attributeName="stroke-dashoffset" from="30" to="-1000" dur="3.1s" begin="${r1(-i * 0.43)}s" repeatCount="indefinite"/></path>`
      } else {
        const phase = (t * 0.32 + i * 0.137) % 1
        out += `<path ${comet} stroke-dashoffset="${r1(30 - phase * 1030)}"/>`
      }
    })
  }
  const pin = s.pin || s.arc || s.hq
  const ring = s.pinRing || 'rgba(255,255,255,.9)'
  ROUTES.forEach((m) => {
    if (!visible(m.ll)) return
    const [x, y] = proj(m.ll)
    out += `<circle cx="${r1(x)}" cy="${r1(y)}" r="3.4" fill="${pin}" stroke="${ring}" stroke-width="1.4"/>`
  })
  if (visible(HQ.ll)) {
    const [hx, hy] = proj(HQ.ll).map(r1)
    const pc = s.hqPulse || s.hq
    for (let k = 0; k < 2; k++) {
      if (smil) {
        out += `<circle cx="${hx}" cy="${hy}" r="6" fill="none" stroke="${pc}" stroke-width="1.6"><animate attributeName="r" values="6;30" dur="1.8s" begin="${-k * 0.9}s" repeatCount="indefinite"/><animate attributeName="opacity" values=".8;0" dur="1.8s" begin="${-k * 0.9}s" repeatCount="indefinite"/></circle>`
      } else {
        const ph = (t * 0.55 + k * 0.5) % 1
        out += `<circle cx="${hx}" cy="${hy}" r="${r1(6 + ph * 24)}" fill="none" stroke="${pc}" stroke-width="1.6" opacity="${r1((1 - ph) * 0.8)}"/>`
      }
    }
    out += `<circle cx="${hx}" cy="${hy}" r="5.5" fill="${pc}" stroke="${s.pinRing || 'rgba(255,255,255,.95)'}" stroke-width="2"${s.glow ? ` filter="url(#${id}gl)"` : ''}/>`
  }
  if (s.labels) {
    Object.values(MARKETS).forEach((m) => {
      if (!visible(m.ll)) return
      const [x, y] = proj(m.ll)
      const w = m.city.length * 11 + 14
      out += `<rect x="${r1(x + 7)}" y="${r1(y - 18)}" width="${w}" height="18" rx="9" fill="${s.labelBg || 'rgba(255,255,255,.92)'}" stroke="${s.labelBorder || 'rgba(15,23,42,.12)'}" stroke-width="0.8"/>`
      out += `<text x="${r1(x + 14)}" y="${r1(y - 8.5)}" dominant-baseline="middle" font-size="11" font-weight="500" font-family="Pretendard, 'Noto Sans KR', sans-serif" fill="${m === HQ ? s.hq : s.labelText || '#334155'}">${m.city}</text>`
    })
  }
  return `${out}</g>`
}

/* ---------------- 지구본 ---------------- */
function globe(s, id, t) {
  const rot = [-100 - t * (s.spin ?? 6), -20]
  const proj = geoOrthographic().scale(GR).translate([480, 240]).rotate(rot).clipAngle(90)
  const path = geoPath(proj)
  const center = [-rot[0], -rot[1]]
  let out = ''
  if (s.atmosphere) out += `<circle cx="480" cy="240" r="${GR + 34}" fill="url(#${id}at)"/>`
  out += `<circle cx="480" cy="240" r="${GR}" fill="url(#${id}oc)"/>`
  if (s.graticule) out += `<path d="${path(geoGraticule10())}" fill="none" stroke="${s.graticule}" stroke-width="0.6"/>`
  if (s.kind === 'dotglobe') {
    const byCountry = new Map()
    getGlobePts().forEach(({ ll, f }) => {
      if (geoDistance(ll, center) > 1.55) return
      const [x, y] = proj(ll)
      if (!byCountry.has(f)) byCountry.set(f, [])
      byCountry.get(f).push(shapeD('dot', x, y, isAccent(f) ? s.rMk ?? s.r : s.r))
    })
    byCountry.forEach((ds, f) => {
      const glow = s.glow && isAccent(f) ? ` filter="url(#${id}gl)"` : ''
      out += `<path class="c" ${countryAttrs(f)} fill="${toneOf(s, f, 0)}"${glow} d="${ds.join('')}"/>`
    })
  } else {
    features.forEach((f) => {
      const d = path(f)
      if (!d) return
      out += `<path class="c" ${countryAttrs(f)} fill="${toneOf(s, f, 0)}"${s.stroke ? ` stroke="${s.stroke}" stroke-width="0.5"` : ''} d="${d}"/>`
    })
  }
  if (s.shade) out += `<circle cx="480" cy="240" r="${GR}" fill="url(#${id}sd)" pointer-events="none"/>`
  if (s.rim) out += `<circle cx="480" cy="240" r="${GR}" fill="none" stroke="${s.rim}" stroke-width="1"/>`
  out += fx(s, id, proj, t, center, false)
  return out
}

/* ---------------- 권역 타일 ----------------
 * 화면의 RegionTileLayer(HTML)·Canvas 와 같은 tileRender 로 그린다. 저장 파일에 넣는 용도라 클릭 동작은 없지만
 * 다른 프로젝트에서 인라인으로 넣으면 data-region 으로 클릭을 잡을 수 있다 */
function tilesSvg(id, proj, tileLL, styleKey, mapTone) {
  const tiles = tilePositions(proj, tileLL).map((t) => ({ t, L: layoutTile(styleKey, t, mapTone) }))
  const defs = tiles.length ? tileDefs(tiles[0].L, `${id}t`) : ''
  let out = '<g class="region-tiles">'
  tiles.forEach(({ t, L }, i) => {
    out += tileSvg(L, t.x - L.w / 2, t.y - L.h / 2, `${id}t`, i, ` data-region="${t.cd}" style="cursor:pointer"`)
  })
  return { defs, body: `${out}</g>` }
}

export const isGlobeStyle = (s) => s.kind === 'globe' || s.kind === 'dotglobe'

let seq = 0
/**
 * SVG 마크업 문자열을 만든다. 같은 페이지에 SVG 가 여럿 있어도 defs id 가 겹치지 않게 접두어를 붙인다.
 * @param t 지구본 회전 시각(초). 평면 지도는 쓰지 않는다
 * @param opts.tiles  권역 타일을 넣을지 (평면 지도만. 지구본은 돌아가서 위치가 맞지 않는다)
 * @param opts.tileLL 사용자가 옮긴 타일 위치 { R_ASIA: [lon, lat] }
 * @param opts.tileStyle 타일 디자인 키 (tileRender.TILE_STYLES)
 */
export function buildSvg(s, t = 1.4, idPrefix = `wm${++seq}`, opts = {}) {
  const id = idPrefix
  let body = bgLayer(s, id)
  let extraDefs = ''
  if (isGlobeStyle(s)) body += globe(s, id, t)
  else {
    body += s.kind === 'fill' ? fillLand(s, id) : gridLand(s, id)
    if (s.vignette) body += `<rect width="${W}" height="${H}" fill="url(#${id}vg)" pointer-events="none"/>`
    body += fx(s, id, flatProj, t, null, true)
    if (opts.tiles) {
      const tiles = tilesSvg(id, flatProj, opts.tileLL, opts.tileStyle, s.tone)
      body += tiles.body
      extraDefs = tiles.defs
    }
  }
  const defsMarkup = defs(s, id).replace('</defs>', `${extraDefs}</defs>`)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${defsMarkup}${body}</svg>`
}
