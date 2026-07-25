// 목업 유저 생성기 (숫자 PK 제거, userId는 영문 given.surname[+번호])
// 결과: { userId, name(한글), dept, role }
export function generateMockUsers(count = 100, { seed = 1 } = {}) {
  let s = seed >>> 0 // LCG PRNG
  const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32

  const SURNAMES_KO = ['김', '이', '박', '최', '정', '한', '조', '윤', '장', '임']
  const GIVEN_KO = [
    '서연',
    '민준',
    '지후',
    '서윤',
    '하린',
    '지우',
    '도윤',
    '지민',
    '유진',
    '수연',
    '가은',
    '예빈',
    '나연',
    '다은',
    '채원',
    '시윤',
    '하율',
    '수현',
    '연우',
    '현우',
  ]

  const SURNAME_ROMA = {
    김: 'kim',
    이: 'lee',
    박: 'park',
    최: 'choi',
    정: 'jung',
    한: 'han',
    조: 'jo',
    윤: 'yoon',
    장: 'jang',
    임: 'lim',
  }
  const GIVEN_ROMA = {
    서연: 'seoyeon',
    민준: 'minjun',
    지후: 'jihu',
    서윤: 'seoyun',
    하린: 'harin',
    지우: 'jiwoo',
    도윤: 'doyoon',
    지민: 'jimin',
    유진: 'yujin',
    수연: 'suyeon',
    가은: 'gaeun',
    예빈: 'yebin',
    나연: 'nayeon',
    다은: 'daeun',
    채원: 'chaewon',
    시윤: 'siyoon',
    하율: 'hayul',
    수현: 'suhyun',
    연우: 'yeonwoo',
    현우: 'hyunwoo',
  }

  const depts = [
    '플랫폼개발팀',
    '인프라팀',
    'QA팀',
    '경영지원',
    '데이터팀',
    '보안팀',
    '모바일팀',
    '디자인팀',
  ]
  const roles = [
    'Backend',
    'DevOps',
    'QA',
    'Frontend',
    'HR',
    'Data',
    'Security',
    'iOS',
    'Android',
    'Designer',
    'PM',
  ]

  // userId 중복 방지 (base -> 카운트)
  const taken = new Map()

  const list = []
  for (let i = 0; i < count; i++) {
    const surKo = SURNAMES_KO[Math.floor(rnd() * SURNAMES_KO.length)]
    const givKo = GIVEN_KO[Math.floor(rnd() * GIVEN_KO.length)]
    const name = surKo + givKo

    const givEn = GIVEN_ROMA[givKo] || 'user'
    const surEn = SURNAME_ROMA[surKo] || 'member'
    const base = `${givEn}.${surEn}`.toLowerCase()

    // 중복 시 base, base2, base3 ...
    let userId = base
    if (taken.has(base)) {
      const n = taken.get(base) + 1
      taken.set(base, n)
      userId = `${base}${n}`
    } else {
      taken.set(base, 1)
    }

    list.push({
      userId, // ✔ 영문 고유키
      name, // 한글 성명
      dept: depts[Math.floor(rnd() * depts.length)],
      role: roles[Math.floor(rnd() * roles.length)],
    })
  }
  return list
}
