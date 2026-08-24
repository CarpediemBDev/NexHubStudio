/**
 * 메일 템플릿 미리보기용 간이 렌더러 (프론트 전용 / 데모 목적)
 *
 * ─────────────────────────────────────────────────────────────────────────
 *  ※ 백엔드 연동 시 이 파일 전체를 API 호출로 교체할 것
 *
 *     import http from '@/utils/http'
 *     const res = await http.post(`/mail/templates/${id}/preview`, { model })
 *     // res.data => { subject, html, text }
 *
 *     이유: 프론트에서 Velocity 를 흉내내면 "미리보기는 멀쩡한데 실제 발송은 깨지는"
 *           사고가 난다. 미리보기는 실제 발송과 동일한 엔진을 태우는 것이 원칙이다.
 *           (docs/mail-template-설계.md 4.1 참조)
 * ─────────────────────────────────────────────────────────────────────────
 *
 * 지원 문법
 *   VELOCITY   ${a.b} / $a.b / $!{a}(null 안전) / $map.get($k) / $list.size()
 *              #if #elseif #else #end / #foreach #end / #set
 *   THYMELEAF  th:text / th:href / th:if  (속성 치환 수준만)
 *   PLAIN      ${a.b} 단순 치환
 */

/* ------------------------------------------------------------------ */
/* 공통 유틸                                                           */
/* ------------------------------------------------------------------ */

const HTML_ESCAPE_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

/** 치환 값은 항상 이스케이프한다 (Velocity 의 $esc.html 과 동일한 정책) */
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (ch) => HTML_ESCAPE_MAP[ch])
}

/** 'order.items[0].name' 형태 경로를 모델에서 찾아온다 */
function resolvePath(path, model) {
  const clean = String(path).trim().replace(/^\$/, '').replace(/^!/, '').replace(/^\{|\}$/g, '')
  if (!clean) return undefined

  let cursor = model
  const tokens = clean.split('.')
  for (const token of tokens) {
    if (cursor === null || cursor === undefined) return undefined
    // Velocity Map 접근: map.get($key) / map.get('key')
    const getMatch = token.match(/^get\(\s*(.+?)\s*\)$/)
    if (getMatch) {
      const rawKey = getMatch[1]
      const key = rawKey.startsWith('$') ? resolvePath(rawKey, model) : rawKey.replace(/^['"]|['"]$/g, '')
      cursor = key === undefined || key === null ? undefined : cursor[key]
      continue
    }

    // items[0] 형태 처리
    const arrayMatch = token.match(/^([\w$]+)\[(\d+)\]$/)
    if (arrayMatch) {
      cursor = cursor[arrayMatch[1]]
      if (!Array.isArray(cursor)) return undefined
      cursor = cursor[Number(arrayMatch[2])]
    } else {
      cursor = cursor[token]
    }
  }
  return cursor
}

function isTruthy(value) {
  if (value === undefined || value === null) return false
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'string') return value.trim() !== '' && value !== 'false'
  return true
}

/** 리터럴('abc', 12, true) · $변수 · $list.size() 를 값으로 변환 */
function evalOperand(raw, model) {
  const token = String(raw).trim()
  if (!token) return undefined
  if (/^-?\d+(\.\d+)?$/.test(token)) return Number(token)
  if (token === 'true') return true
  if (token === 'false') return false
  if (token === 'null') return null
  if (/^'.*'$/.test(token) || /^".*"$/.test(token)) return token.slice(1, -1)

  // Velocity 메서드 호출 — 실제 .vm 자산에서 $list.size() 형태가 흔하다
  const call = token.match(/^(.+?)\.(size|length|isEmpty)\(\)$/)
  if (call) {
    const target = resolvePath(call[1], model)
    const size = target === undefined || target === null ? 0 : target.length ?? 0
    return call[2] === 'isEmpty' ? size === 0 : size
  }

  return resolvePath(token, model)
}

/** 괄호·따옴표 밖에 있는 연산자로만 분리한다 */
function splitTopLevel(source, operator) {
  const parts = []
  let depth = 0
  let quote = null
  let start = 0

  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i]
    if (quote) {
      if (ch === quote) quote = null
      continue
    }
    if (ch === '"' || ch === "'") {
      quote = ch
      continue
    }
    if (ch === '(') depth += 1
    else if (ch === ')') depth -= 1
    else if (depth === 0 && source.startsWith(operator, i)) {
      parts.push(source.slice(start, i))
      i += operator.length - 1
      start = i + 1
    }
  }
  parts.push(source.slice(start))
  return parts
}

/** 문자열 전체가 한 쌍의 괄호로 감싸여 있는지 — "($a) == ($b)" 는 false */
function isWrappedInParens(source) {
  if (!source.startsWith('(') || !source.endsWith(')')) return false
  let depth = 0
  for (let i = 0; i < source.length; i += 1) {
    if (source[i] === '(') depth += 1
    else if (source[i] === ')') {
      depth -= 1
      if (depth === 0) return i === source.length - 1
    }
  }
  return false
}

/** #if / #elseif 조건 평가 — && · || · 비교연산 · truthy 지원 */
function evalCondition(expr, model) {
  let source = String(expr).trim()

  // 논리 연산 먼저 분해 (|| 가 && 보다 결합력이 약하다)
  const orParts = splitTopLevel(source, '||')
  if (orParts.length > 1) return orParts.some((part) => evalCondition(part, model))
  const andParts = splitTopLevel(source, '&&')
  if (andParts.length > 1) return andParts.every((part) => evalCondition(part, model))

  let negate = false
  while (source.startsWith('!')) {
    negate = !negate
    source = source.slice(1).trim()
  }

  // 전체를 감싼 괄호 제거: ($a > 0) → $a > 0
  while (isWrappedInParens(source)) {
    source = source.slice(1, -1).trim()
  }

  const compare = source.match(/^(.+?)\s*(==|!=|>=|<=|>|<)\s*(.+)$/)
  let result
  if (compare) {
    const left = evalOperand(compare[1], model)
    const right = evalOperand(compare[3], model)
    switch (compare[2]) {
      case '==': result = String(left) === String(right); break
      case '!=': result = String(left) !== String(right); break
      case '>':  result = Number(left) > Number(right); break
      case '<':  result = Number(left) < Number(right); break
      case '>=': result = Number(left) >= Number(right); break
      case '<=': result = Number(left) <= Number(right); break
      default:   result = false
    }
  } else {
    result = isTruthy(evalOperand(source, model))
  }

  return negate ? !result : result
}

/* ------------------------------------------------------------------ */
/* 변수 치환                                                           */
/* ------------------------------------------------------------------ */

// ${a.b} · $!{a.b} · $a.b · $!a.b
const INTERPOLATION_RE = /\$(!)?\{([^{}]+)\}|\$(!)?([a-zA-Z_][\w]*(?:\.[a-zA-Z_][\w]*(?:\[\d+\])?)*)/g

function interpolate(text, model, options = {}) {
  const keepMissing = options.keepMissing !== false // 미정의 변수는 원문 유지(작성 중 확인 편의)
  return String(text).replace(INTERPOLATION_RE, (matched, quietA, braced, quietB, bare) => {
    const path = braced || bare
    const quiet = Boolean(quietA || quietB)
    const value = resolvePath(path, model)

    if (value === undefined || value === null) {
      if (quiet) return '' // $!{x} 는 null 을 빈 문자열로
      return keepMissing ? matched : ''
    }
    if (typeof value === 'object') return escapeHtml(JSON.stringify(value))
    return escapeHtml(value)
  })
}

/* ------------------------------------------------------------------ */
/* Velocity 서브셋 파서                                                */
/* ------------------------------------------------------------------ */

const DIRECTIVE_RE = /#(if|foreach|set|elseif|else|end)\b/g

/** index 이후 첫 디렉티브를 찾는다 */
function nextDirective(source, fromIndex) {
  DIRECTIVE_RE.lastIndex = fromIndex
  const matched = DIRECTIVE_RE.exec(source)
  if (!matched) return null
  return { name: matched[1], index: matched.index, length: matched[0].length }
}

/** openIndex 위치의 '(' 부터 짝이 맞는 ')' 까지 읽어 내부 표현식을 반환 */
function readParenthesis(source, openIndex) {
  let cursor = openIndex
  while (cursor < source.length && source[cursor] !== '(') cursor += 1
  if (source[cursor] !== '(') return { expr: '', end: openIndex }

  let depth = 0
  const start = cursor
  for (; cursor < source.length; cursor += 1) {
    if (source[cursor] === '(') depth += 1
    else if (source[cursor] === ')') {
      depth -= 1
      if (depth === 0) return { expr: source.slice(start + 1, cursor), end: cursor + 1 }
    }
  }
  return { expr: source.slice(start + 1), end: source.length }
}

/**
 * fromIndex 부터 짝이 맞는 #end 까지를 읽어 분기 목록으로 반환.
 * #elseif / #else 는 최상위 깊이에서만 분기로 인정한다.
 */
function readBranches(source, fromIndex) {
  const branches = [{ condition: null, body: '' }]
  let depth = 0
  let cursor = fromIndex
  let segmentStart = fromIndex

  while (cursor < source.length) {
    const directive = nextDirective(source, cursor)
    if (!directive) break

    if (directive.name === 'if' || directive.name === 'foreach') {
      depth += 1
      cursor = directive.index + directive.length
      continue
    }

    if (directive.name === 'end') {
      if (depth === 0) {
        branches[branches.length - 1].body = source.slice(segmentStart, directive.index)
        return { branches, end: directive.index + directive.length }
      }
      depth -= 1
      cursor = directive.index + directive.length
      continue
    }

    if ((directive.name === 'elseif' || directive.name === 'else') && depth === 0) {
      branches[branches.length - 1].body = source.slice(segmentStart, directive.index)
      if (directive.name === 'elseif') {
        const { expr, end } = readParenthesis(source, directive.index + directive.length)
        branches.push({ condition: expr, body: '' })
        segmentStart = end
        cursor = end
      } else {
        branches.push({ condition: null, body: '' })
        segmentStart = directive.index + directive.length
        cursor = segmentStart
      }
      continue
    }

    cursor = directive.index + directive.length
  }

  // #end 누락 — 남은 전체를 본문으로 처리
  branches[branches.length - 1].body = source.slice(segmentStart)
  return { branches, end: source.length }
}

function renderVelocity(source, model, options) {
  let output = ''
  let cursor = 0

  while (cursor < source.length) {
    const directive = nextDirective(source, cursor)
    if (!directive) {
      output += interpolate(source.slice(cursor), model, options)
      break
    }

    output += interpolate(source.slice(cursor, directive.index), model, options)

    if (directive.name === 'set') {
      const { expr, end } = readParenthesis(source, directive.index + directive.length)
      const assign = expr.match(/^\s*\$?\{?([\w.]+)\}?\s*=\s*(.+)$/)
      if (assign) model[assign[1]] = evalOperand(assign[2], model)
      cursor = end
      continue
    }

    if (directive.name === 'if') {
      const { expr, end } = readParenthesis(source, directive.index + directive.length)
      const { branches, end: blockEnd } = readBranches(source, end)
      const firstCondition = expr

      let rendered = ''
      for (let i = 0; i < branches.length; i += 1) {
        const condition = i === 0 ? firstCondition : branches[i].condition
        const matches = condition === null ? true : evalCondition(condition, model)
        if (matches) {
          rendered = renderVelocity(branches[i].body, model, options)
          break
        }
      }
      output += rendered
      cursor = blockEnd
      continue
    }

    if (directive.name === 'foreach') {
      const { expr, end } = readParenthesis(source, directive.index + directive.length)
      const { branches, end: blockEnd } = readBranches(source, end)
      const body = branches[0].body

      const loop = expr.match(/^\s*\$?\{?([\w.]+)\}?\s+in\s+(.+)$/)
      if (loop) {
        const itemName = loop[1]
        const list = resolvePath(loop[2], model)
        if (Array.isArray(list)) {
          const backup = model[itemName]
          list.forEach((item, index) => {
            model[itemName] = item
            model.foreach = { index, count: index + 1, hasNext: index < list.length - 1 }
            output += renderVelocity(body, model, options)
          })
          model[itemName] = backup
          delete model.foreach
        }
      }
      cursor = blockEnd
      continue
    }

    // 짝이 맞지 않는 #end / #else 등은 그대로 출력
    output += source.slice(directive.index, directive.index + directive.length)
    cursor = directive.index + directive.length
  }

  return output
}

/* ------------------------------------------------------------------ */
/* Thymeleaf(속성 수준) 서브셋                                          */
/* ------------------------------------------------------------------ */

function renderThymeleaf(source, model, options) {
  let output = source

  // th:if="${x}" 가 거짓이면 해당 엘리먼트 제거
  output = output.replace(
    /<(\w+)([^>]*?)\sth:if="\$\{([^}]+)\}"([^>]*)>([\s\S]*?)<\/\1>/g,
    (matched, tag, before, expr, after, inner) =>
      (evalCondition(expr, model) ? `<${tag}${before}${after}>${inner}</${tag}>` : '')
  )

  // th:text="${x}" 는 엘리먼트 내용을 치환
  output = output.replace(
    /<(\w+)([^>]*?)\sth:text="\$\{([^}]+)\}"([^>]*)>([\s\S]*?)<\/\1>/g,
    (matched, tag, before, expr, after, fallback) => {
      const value = resolvePath(expr, model)
      const text = value === undefined || value === null ? fallback : escapeHtml(value)
      return `<${tag}${before}${after}>${text}</${tag}>`
    }
  )

  // th:href / th:src → 실제 속성으로 변환
  output = output.replace(/\sth:(href|src)="\$\{([^}]+)\}"/g, (matched, attr, expr) => {
    const value = resolvePath(expr, model)
    return value ? ` ${attr}="${escapeHtml(value)}"` : ` ${attr}="#"`
  })

  // 기존 href="#" 등이 남아 중복되는 경우 정리
  output = output.replace(/\s(href|src)="#"\s+(href|src)="/g, ' $2="')

  return interpolate(output, model, options)
}

/* ------------------------------------------------------------------ */
/* 공개 API                                                            */
/* ------------------------------------------------------------------ */

/**
 * 템플릿 본문을 모델로 렌더링한다.
 * @param {string} source     템플릿 원문 (Velocity/Thymeleaf 문법 포함 HTML)
 * @param {object} model      치환 데이터
 * @param {string} engineType VELOCITY | THYMELEAF | PLAIN
 * @param {object} options    { keepMissing:boolean } 미정의 변수를 원문으로 남길지
 */
export function renderTemplate(source, model = {}, engineType = 'VELOCITY', options = {}) {
  if (!source) return ''
  // 모델 원본 오염 방지 (#set / #foreach 가 모델을 건드린다)
  const scope = JSON.parse(JSON.stringify(model))

  try {
    if (engineType === 'THYMELEAF') return renderThymeleaf(source, scope, options)
    if (engineType === 'PLAIN') return interpolate(source, scope, options)
    return renderVelocity(source, scope, options)
  } catch (error) {
    return `<div style="color:#dc3545;font-family:monospace;padding:12px;">렌더링 오류: ${escapeHtml(error.message)}</div>`
  }
}

/** 레이아웃(헤더/푸터) 과 본문을 결합해 완성된 메일 HTML 을 만든다 */
export function composeMailHtml(layout, bodyHtml, model = {}, engineType = 'VELOCITY') {
  if (!layout) return bodyHtml
  const header = renderTemplate(layout.headerHtml || '', model, engineType, { keepMissing: false })
  const footer = renderTemplate(layout.footerHtml || '', model, engineType, { keepMissing: false })
  const css = layout.baseCss ? `<style>${layout.baseCss}</style>` : ''
  return `${css}${header}${bodyHtml}${footer}`
}

/** 변수 정의(MAIL_TEMPLATE_VAR) 목록으로 미리보기/테스트용 기본 모델을 만든다 */
export function buildModelFromVariables(variables = []) {
  const model = {}
  variables.forEach((variable) => {
    model[variable.varName] = castSampleValue(variable.sampleValue, variable.dataType)
  })
  return model
}

/** 샘플 값 문자열을 dataType 에 맞는 실제 값으로 변환 */
export function castSampleValue(raw, dataType) {
  if (raw === undefined || raw === null || raw === '') {
    return dataType === 'LIST' ? [] : ''
  }
  if (dataType === 'LIST' || dataType === 'OBJECT') {
    try {
      return typeof raw === 'string' ? JSON.parse(raw) : raw
    } catch {
      return dataType === 'LIST' ? [] : {}
    }
  }
  if (dataType === 'NUMBER') {
    const parsed = Number(String(raw).replace(/,/g, ''))
    return Number.isNaN(parsed) ? raw : parsed
  }
  if (dataType === 'BOOLEAN') return raw === true || raw === 'true' || raw === 'Y'
  return raw
}

/**
 * 본문에서 실제 사용 중인 변수명을 추출한다.
 * 변수 정의 테이블과 대조해 "정의는 있는데 안 쓰는 변수 / 쓰는데 정의가 없는 변수"를 잡아낸다.
 */
export function extractUsedVariables(source) {
  if (!source) return []
  const found = new Set()
  const matcher = new RegExp(INTERPOLATION_RE.source, 'g')
  let matched = matcher.exec(source)
  while (matched) {
    const path = matched[2] || matched[4]
    if (path) found.add(path.split(/[.[]/)[0])
    matched = matcher.exec(source)
  }
  // #foreach 루프 변수는 지역 변수이므로 제외
  const loopVars = new Set()
  const foreachMatcher = /#foreach\s*\(\s*\$?\{?([\w.]+)\}?\s+in\s+/g
  let loop = foreachMatcher.exec(source)
  while (loop) {
    loopVars.add(loop[1])
    loop = foreachMatcher.exec(source)
  }
  return [...found].filter((name) => !loopVars.has(name) && name !== 'foreach')
}

/** iframe srcdoc 에 넣을 완성 문서 (메일 클라이언트 유사 환경) */
export function wrapPreviewDocument(html, bodyWidth = 600) {
  return `<!doctype html>
<html lang="ko"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  html,body{margin:0;padding:0;background:#f4f6f8;}
  body{font-family:'Malgun Gothic','Apple SD Gothic Neo',sans-serif;-webkit-text-size-adjust:100%;}
  img{max-width:100%;}
  .preview-shell{max-width:${bodyWidth}px;margin:0 auto;}
</style>
</head><body><div class="preview-shell">${html}</div></body></html>`
}

export default {
  renderTemplate,
  composeMailHtml,
  buildModelFromVariables,
  castSampleValue,
  extractUsedVariables,
  wrapPreviewDocument,
}
