<template>
  <div class="d-flex align-items-center gap-1.5 flex-wrap">
    <!-- 현재 뷰 저장 -->
    <button class="btn-b2b-action" title="현재 뷰 상태 저장 (컬럼 배치·너비·표시·고정·정렬)" @click="saveCurrentView">
      <i class="bi bi-bookmark-plus text-warning me-0.5"></i>
      <span>뷰 저장</span>
    </button>

    <!-- 저장된 뷰 칩 목록 -->
    <div v-if="savedViews.length > 0" class="d-flex align-items-center gap-1.5 ms-1 ps-2 border-start">
      <span class="fw-semibold text-secondary small me-1" style="font-size: 12px;">
        <i class="bi bi-star-fill text-warning me-1"></i>내 뷰:
      </span>
      <div
        v-for="view in savedViews"
        :key="view.id"
        class="badge py-1 px-2 border cursor-pointer d-flex align-items-center gap-1 transition-all fw-normal"
        :class="activeId === view.id ? 'bg-primary text-white shadow-sm' : 'bg-theme-card text-theme-primary border-theme'"
        :title="`'${view.name}' 뷰 적용`"
        @click="applyView(view)"
      >
        <span>{{ view.name }}</span>
        <i class="bi bi-x-circle text-danger ms-1 opacity-75" title="삭제" @click.stop="deleteView(view.id)"></i>
      </div>
    </div>
  </div>
</template>

<script>
/**
 * SavedViewsBar — 그리드 "뷰 저장/적용/삭제" 재사용 UI
 * =============================================================================
 * 컬럼 배치(이동/너비/표시)·행열 고정·정렬(+옵션으로 그룹)을 localStorage 에 저장하고
 * 칩 클릭으로 즉시 복원한다. 실제 캡처/복원 로직은 realgridOps 의 순수 함수에 위임.
 *
 *  - gridViewGetter : () => gridView 형태의 함수. 그리드 인스턴스를 클릭 시점에 lazy
 *    resolve 한다(RealGrid 인스턴스를 Vue 반응형 프록시로 감싸지 않기 위함).
 *  - storageKey     : 페이지별 localStorage 키(뷰 교차오염 방지, 필수).
 *  - includeGroup   : true 면 행 그룹핑도 저장(피벗형 그리드 전용).
 */
import { captureViewState, applyViewState } from '@/utils/realgridOps'
import { showToast } from '@/utils/toastUtil.js'

export default {
  name: 'SavedViewsBar',
  props: {
    gridViewGetter: { type: Function, required: true },
    dataProviderGetter: { type: Function, default: null },
    storageKey: { type: String, required: true },
    includeGroup: { type: Boolean, default: false }
  },
  data() {
    return {
      savedViews: [],
      activeId: null
    }
  },
  mounted() {
    this.loadSavedViews()
  },
  methods: {
    _grid() {
      try { return this.gridViewGetter ? this.gridViewGetter() : null } catch (e) { return null }
    },
    _provider() {
      try { return this.dataProviderGetter ? this.dataProviderGetter() : null } catch (e) { return null }
    },

    loadSavedViews() {
      try {
        const stored = localStorage.getItem(this.storageKey)
        if (stored) this.savedViews = JSON.parse(stored)
      } catch (e) {
        console.error('[SavedViewsBar] load error:', e)
      }
    },

    persist() {
      localStorage.setItem(this.storageKey, JSON.stringify(this.savedViews))
    },

    saveCurrentView() {
      const gv = this._grid()
      const dp = this._provider()
      if (!gv) {
        showToast('그리드가 아직 준비되지 않았습니다.', { type: 'warning' })
        return
      }

      const state = captureViewState(gv, { includeGroup: this.includeGroup, dataProvider: dp })
      const viewName = prompt('저장할 뷰 이름을 입력하세요 (컬럼 배치·고정·정렬·노드순서 포함):', '사용자 정의 뷰')
      if (!viewName || !viewName.trim()) return

      const newView = { id: 'view_' + Date.now(), name: viewName.trim(), ...state }
      this.savedViews.push(newView)
      this.persist()
      this.applyView(newView)
      showToast(`'${newView.name}' 뷰가 저장되었습니다!`, { type: 'success' })
    },

    applyView(view) {
      const gv = this._grid()
      const dp = this._provider()
      if (!gv) return
      applyViewState(gv, view, { dataProvider: dp })
      this.activeId = view.id
      showToast(`'${view.name}' 뷰가 적용되었습니다.`, { type: 'info' })
    },

    deleteView(viewId) {
      this.savedViews = this.savedViews.filter(v => v.id !== viewId)
      this.persist()
      if (this.activeId === viewId) this.activeId = null
      showToast('저장된 뷰가 삭제되었습니다.', { type: 'warning' })
    }
  }
}
</script>
