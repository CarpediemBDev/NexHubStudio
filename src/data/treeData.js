/**
 * RealGrid 트리 업무 데이터 소스
 * =========================================================
 *  - departmentTree : 부서(조직도) 계층 데이터
 *  - routesToMenuTree : Vue Router 설정을 메뉴 트리(children 중첩)로 변환
 */

/* =========================================================
 * 1) 부서 조직도 (중첩 children 모델)
 * ========================================================= */
export const departmentTree = [
  {
    deptCode: 'HQ', deptName: '(주) 넥스허브', manager: '대표이사', rank: 'CEO', headcount: 320, status: '운영', createdAt: '2020-01-01', useYn: 'Y',
    children: [
      {
        deptCode: '1000', deptName: '경영지원본부', manager: '김본부', rank: '본부장', headcount: 45, status: '운영', createdAt: '2021-03-15', useYn: 'Y',
        children: [
          { deptCode: '1100', deptName: '인사팀', manager: '이인사', rank: '팀장', headcount: 12, status: '운영', createdAt: '2021-04-01', useYn: 'Y' },
          {
            deptCode: '1200', deptName: '재무팀', manager: '박재무', rank: '팀장', headcount: 18, status: '운영', createdAt: '2021-04-01', useYn: 'Y',
            children: [
              { deptCode: '1210', deptName: '회계파트', manager: '최회계', rank: '파트장', headcount: 8, status: '운영', createdAt: '2022-01-10', useYn: 'Y' },
              { deptCode: '1220', deptName: '자금파트', manager: '정자금', rank: '파트장', headcount: 10, status: '운영', createdAt: '2022-01-10', useYn: 'Y' }
            ]
          },
          { deptCode: '1300', deptName: '총무팀', manager: '홍총무', rank: '팀장', headcount: 15, status: '운영', createdAt: '2021-05-01', useYn: 'Y' }
        ]
      },
      {
        deptCode: '2000', deptName: '연구개발본부', manager: '강연구', rank: '본부장', headcount: 88, status: '운영', createdAt: '2021-03-15', useYn: 'Y',
        children: [
          {
            deptCode: '2100', deptName: '플랫폼개발실', manager: '윤플랫', rank: '실장', headcount: 40, status: '운영', createdAt: '2021-06-01', useYn: 'Y',
            children: [
              { deptCode: '2110', deptName: '프론트엔드팀', manager: '서프론', rank: '팀장', headcount: 18, status: '운영', createdAt: '2022-03-01', useYn: 'Y' },
              { deptCode: '2120', deptName: '백엔드팀', manager: '남백엔', rank: '팀장', headcount: 22, status: '운영', createdAt: '2022-03-01', useYn: 'Y' }
            ]
          },
          { deptCode: '2200', deptName: '데이터분석실', manager: '문데이', rank: '실장', headcount: 28, status: '운영', createdAt: '2021-09-01', useYn: 'Y' },
          { deptCode: '2300', deptName: 'QA팀', manager: '조큐에', rank: '팀장', headcount: 20, status: '신설', createdAt: '2024-01-10', useYn: 'Y' }
        ]
      },
      {
        deptCode: '3000', deptName: '영업본부', manager: '한영업', rank: '본부장', headcount: 62, status: '운영', createdAt: '2021-03-15', useYn: 'Y',
        children: [
          { deptCode: '3100', deptName: '국내영업팀', manager: '오국내', rank: '팀장', headcount: 30, status: '운영', createdAt: '2021-10-01', useYn: 'Y' },
          { deptCode: '3200', deptName: '해외영업팀', manager: '신해외', rank: '팀장', headcount: 32, status: '운영', createdAt: '2021-10-01', useYn: 'Y' }
        ]
      },
      {
        deptCode: '9000', deptName: '미래전략TF', manager: '임전략', rank: 'TF장', headcount: 10, status: '한시조직', createdAt: '2024-06-01', useYn: 'Y',
        children: []
      }
    ]
  }
]

/* =========================================================
 * 2) 라우터 → 메뉴 트리 변환
 * ========================================================= */
function joinPath(base, path) {
  if (!path) return base || '/'
  if (path.startsWith('/')) return path
  if (!base || base === '/') return '/' + path
  return base.replace(/\/$/, '') + '/' + path
}

/**
 * Vue Router 의 routes 배열을 트리 노드(children 중첩)로 변환한다.
 * meta.hidden 이거나 title 이 없는(경로 래퍼) 노드는 표시 대상에서 제외한다.
 *
 * @param {Array} routes - route 정의 배열
 * @param {string} basePath - 상위 경로 (재귀 누적)
 * @returns {Array} 메뉴 트리 노드 배열
 */
export function routesToMenuTree(routes, basePath = '') {
  const nodes = []
  if (!Array.isArray(routes)) return nodes

  for (const r of routes) {
    const meta = r.meta || {}
    const fullPath = joinPath(basePath, r.path)

    // 자식 먼저 변환
    let children = []
    if (r.children && r.children.length) {
      children = routesToMenuTree(r.children, fullPath)
    }

    // 숨김 메뉴는 제외 (단, 자식이 표시 대상이면 그룹 컨테이너로 유지)
    if (meta.hidden && children.length === 0) continue

    const title = meta.title || r.name
    // title 도 없고 자식만 있는 순수 래퍼(root 등)는 자식을 상위로 승격
    if (!title) {
      nodes.push(...children)
      continue
    }

    const node = {
      menuName: title,
      path: fullPath || '/',
      icon: meta.icon || '',
      cache: meta.keepAlive ? 'Y' : 'N',
      visible: meta.hidden ? '숨김' : '표시'
    }
    if (children.length) node.children = children
    nodes.push(node)
  }
  return nodes
}
