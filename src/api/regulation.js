/**
 * 규제정보 API
 *
 * 화면·스토어는 이 파일만 부른다. 여기에는 URL 과 파라미터 모양만 두고,
 * 날짜 포맷이나 화면용 가공은 넣지 않는다(넣기 시작하면 또 하나의 잡동사니 파일이 된다).
 *
 * 목업 모드에서는 이 요청을 MSW 가 가로채 src/mocks/handlers/regulation.js 가 응답하고,
 * 실제 모드에서는 vite 프록시를 타고 백엔드로 나간다. 이 파일은 두 경우에 동일하다.
 */
import http from '@/utils/http'

export const regulationApi = {
  /**
   * 화면 진입 시 한 번에 받는 스냅샷.
   * 목록/상세/이력/충돌이 서로 참조하는 구조라 화면마다 쪼개 부르면
   * 충돌 판정(기존 레코드 전량 필요)이 성립하지 않는다.
   * @returns {Promise<{records, items, histories, conflicts, attachments}>}
   */
  snapshot: () => http.get('/regulations').then((r) => r.data),

  /**
   * 전개(행→열) 목록.
   * 목록 한 셀에 여러 줄로 뭉쳐 있던 값 — 규제 > 규격 > 관리항목(인증서), 제품 —
   * 을 "조합 1건 = 1행" 으로 펼친 결과. 펼치기는 결국 JOIN 이므로 화면이 아니라 서버가 한다.
   *
   * 조회인데 POST 인 이유: 앞단 조회 결과가 수천 건이면 ID 목록이 URL 길이 제한을 넘는다.
   * @param {number[]} regInfoIds 이미 걸러진 레코드 ID. 빈 배열이면 전체.
   * @returns {Promise<{rows: Array, totalCount: number}>}
   */
  expanded: (regInfoIds = []) =>
    http.post('/regulations/expanded', { regInfoIds }).then((r) => r.data),

  /**
   * 레코드 1건 저장. 신규/수정 모두 이 엔드포인트로 간다(수정은 서버가 새 버전으로 올린다).
   * @param {object} payload  { master, targets, items, attachFiles, changes, decisions }
   * @returns {Promise<object>} 저장된 레코드
   */
  save: (payload) => http.post('/regulations', payload).then((r) => r.data),

  /** 폐지(물리 삭제 없이 상태만 EXPIRED 로) */
  expire: (regInfoId) => http.post(`/regulations/${regInfoId}/expire`).then((r) => r.data),

  /**
   * 등록을 취소했지만 충돌 감지 사실은 남겨야 할 때.
   * 저장된 레코드가 없으므로 별도 엔드포인트로 분리한다.
   */
  saveConflictHistories: (conflicts, decisionCd) =>
    http.post('/regulations/conflict-histories', { conflicts, decisionCd }).then((r) => r.data)
}

export default regulationApi
