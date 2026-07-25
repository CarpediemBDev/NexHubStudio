/**
 * 공통 Mock 데이터
 */

/**
 * 테스트용 사용자 목록
 */
export const mockUsers = [
  { id: 1, name: '홍길동', department: '개발팀' },
  { id: 2, name: '김철수', department: '기획팀' },
  { id: 3, name: '이영희', department: '디자인팀' },
  { id: 4, name: '박민수', department: '개발팀' },
  { id: 5, name: '정수진', department: '운영팀' },
  { id: 6, name: '최동욱', department: '기획팀' },
  { id: 7, name: '강민지', department: '디자인팀' },
  { id: 8, name: '윤서준', department: '개발팀' },
  { id: 9, name: '임하늘', department: '운영팀' },
  { id: 10, name: '송지우', department: '기획팀' },
  { id: 11, name: '조현우', department: '개발팀' },
  { id: 12, name: '한소희', department: '디자인팀' },
  { id: 13, name: '서준혁', department: '운영팀' },
  { id: 14, name: '장미란', department: '기획팀' },
  { id: 15, name: '노태우', department: '개발팀' },
  { id: 16, name: '배수지', department: '디자인팀' },
  { id: 17, name: '문재인', department: '운영팀' },
  { id: 18, name: '신세경', department: '기획팀' },
  { id: 19, name: '고아라', department: '개발팀' },
  { id: 20, name: '이민호', department: '디자인팀' },
]

/**
 * 사용자 목록 복사본 반환 (불변성 유지)
 */
export function getMockUsers() {
  return [...mockUsers]
}
