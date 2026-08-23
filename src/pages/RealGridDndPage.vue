<template>
  <div class="b2b-page-container">
    <!-- Header Page Title -->
    <div class="mb-3">
      <h4 class="b2b-text-h1 fw-bold m-0" style="color: var(--b2b-color-text-main)">RealGrid Drag &amp; Drop 샘플 (그리드 ↔ 그리드)</h4>
      <p class="small mb-0" style="color: var(--b2b-color-text-muted)">
        모두 <span class="badge bg-success-subtle text-success border border-success-subtle">RealGridCommonJs</span> 공통 컴포넌트 그리드입니다(드래그 기능은 <code>:draggable-rows</code> prop 하나로 on/off).
        <b>이동</b>: 맨 왼쪽 <span class="rg-grip-inline">⠿</span> 그립을 잡고 다른 그리드로 드래그(체크·범위선택 시 일괄, 팀↔팀·팀→풀 가능) 또는 아래 배정 버튼.
        <b>복사</b>: 데이터 셀을 드래그해 범위 선택 후 <kbd>Ctrl</kbd>+<kbd>C</kbd> → 엑셀 붙여넣기.
      </p>
    </div>

    <!-- Toolbar -->
    <div class="b2b-toolbar">
      <div class="d-flex align-items-center justify-content-between w-100">
        <div class="d-flex align-items-center gap-2">
          <span class="badge bg-info-subtle text-info border border-info-subtle px-2 py-1">
            <i class="bi bi-arrows-move me-1"></i>그리드 간 행 이동
          </span>
          <span class="small" style="color: var(--b2b-color-text-muted)">
            인력 풀 <strong class="text-primary">{{ counts.pool }}</strong>명 · 배정 완료
            <strong class="text-success">{{ assignedCount }}</strong>명
          </span>
        </div>
        <div class="d-flex align-items-center gap-2 ms-auto">
          <button
            v-for="team in teamDefs" :key="team.key"
            class="btn-b2b-action"
            :title="'인력 풀에서 체크한 인원을 ' + team.label + '(으)로 이동'"
            @click="assignChecked(team.key)"
          >
            <i class="bi bi-box-arrow-in-right me-0.5" :style="{ color: team.color }"></i>
            <span>선택 → {{ team.label.replace(' 배정', '') }}</span>
          </button>
          <button class="btn-b2b-action" title="모든 배정 초기화(풀로 회수)" @click="resetAll">
            <i class="bi bi-arrow-counterclockwise text-secondary me-0.5"></i>
            <span>초기화</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Main split: source grid (left) + team grids (right) -->
    <div class="dnd-layout">
      <!-- Left: Source Pool Grid -->
      <div class="dnd-col">
        <div class="dnd-col-head">
          <span class="dnd-head-dot" style="background:#64748b"></span>
          <i class="bi bi-people-fill me-1" style="color:#64748b"></i>
          <span class="dnd-head-name">인력 풀 (미배정)</span>
          <span class="dnd-head-count">{{ counts.pool }}</span>
        </div>
        <div
          class="dnd-grid-host"
          :class="{ 'is-drop-hover': hoverGrid === 'pool' }"
          data-grid="pool"
        >
          <RealGridCommonJs
            grid-id="dnd-pool"
            height="100%"
            :fields="gridFields"
            :columns="gridColumns"
            :rows="users"
            v-bind="commonGridProps"
            @init="e => onGridInit('pool', e)"
            @row-drag-move="e => onRowDragMove('pool', e)"
            @row-drag-end="e => onRowDragEnd('pool', e)"
          />
        </div>
      </div>

      <!-- Right: Team Grids -->
      <div class="dnd-teams">
        <div v-for="team in teamDefs" :key="team.key" class="dnd-col dnd-team">
          <div class="dnd-col-head" :style="{ borderColor: team.color }">
            <span class="dnd-head-dot" :style="{ background: team.color }"></span>
            <span class="dnd-head-name">{{ team.label }}</span>
            <span class="dnd-head-count">{{ counts[team.key] }}</span>
            <button
              class="dnd-head-btn"
              title="이 팀 인원 전체를 인력 풀로 회수"
              :disabled="counts[team.key] === 0"
              @click="returnTeamToPool(team.key)"
            >
              <i class="bi bi-arrow-return-left"></i> 회수
            </button>
          </div>
          <div
            class="dnd-grid-host dnd-team-host"
            :class="{ 'is-drop-hover': hoverGrid === team.key }"
            :data-grid="team.key"
          >
            <RealGridCommonJs
              :grid-id="'dnd-' + team.key"
              height="100%"
              :fields="gridFields"
              :columns="gridColumns"
              :rows="emptyRows"
              v-bind="commonGridProps"
              @init="e => onGridInit(team.key, e)"
              @row-drag-move="e => onRowDragMove(team.key, e)"
              @row-drag-end="e => onRowDragEnd(team.key, e)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import RealGridCommonJs from '@/components/RealGridCommonJs.vue'
import { showToast } from '@/utils/toastUtil.js'

const GRADE_MAP = {
  S: ['#dc3545', '#fff'], A: ['#0d6efd', '#fff'], B: ['#198754', '#fff'],
  C: ['#ffc107', '#212529'], D: ['#6c757d', '#fff']
}

export default {
  name: 'RealGridDndPage',
  components: { RealGridCommonJs },
  data() {
    return {
      hoverGrid: null,
      users: [],
      emptyRows: [], // 팀 그리드 초기 rows: 안정적 참조여야 재렌더 때 setRows([])로 안 지워짐
      counts: { pool: 0, teamA: 0, teamB: 0 },
      teamDefs: [
        { key: 'teamA', label: '1팀 배정', color: '#0d6efd' },
        { key: 'teamB', label: '2팀 배정', color: '#20c997' }
      ],
      // 세 그리드 공통 옵션 (편집 off, 체크바 on, 순수 테이블 룩 + 그립 드래그 소스)
      commonGridProps: {
        editable: false,
        checkable: true,
        showRowNumber: true,
        stateBarVisible: false,
        useFooter: false,
        sortable: true,
        filterable: false,
        showColumnPicker: false,
        showSavedViews: false,
        groupPanelVisible: false,
        fitStyle: 'evenFill',
        draggableRows: true, // ← 그립 컬럼 + 드래그 소스 활성 (공통 컴포넌트 prop)
        dragHandleHeader: '이동',
        dragUnit: '명',
        toast: (m, o) => showToast(m, o)
      },
      gridFields: [
        { fieldName: 'userId', dataType: 'text' },
        { fieldName: 'name', dataType: 'text' },
        { fieldName: 'dept', dataType: 'text' },
        { fieldName: 'role', dataType: 'text' },
        { fieldName: 'evalGrade', dataType: 'text' },
        { fieldName: 'skillScore', dataType: 'number' },
        { fieldName: 'region', dataType: 'text' }
      ],
      gridColumns: [
        { name: 'name', fieldName: 'name', width: 80, header: { text: '성명' }, styles: { textAlignment: 'center' } },
        { name: 'dept', fieldName: 'dept', width: 100, header: { text: '부서' }, styles: { textAlignment: 'near' } },
        { name: 'role', fieldName: 'role', width: 90, header: { text: '직무' }, styles: { textAlignment: 'near' } },
        {
          name: 'evalGrade', fieldName: 'evalGrade', width: 60, header: { text: '등급' },
          styles: { textAlignment: 'center' },
          renderer: {
            type: 'html',
            callback: (grid, model) => {
              const v = model && model.value ? String(model.value) : 'B'
              const c = GRADE_MAP[v] || GRADE_MAP.B
              return `<div style="display:flex;align-items:center;justify-content:center;height:100%;"><span style="background:${c[0]};color:${c[1]};font-size:11px;font-weight:700;padding:2px 8px;border-radius:10px;">${v}</span></div>`
            }
          }
        },
        {
          name: 'skillScore', fieldName: 'skillScore', width: 90, header: { text: '역량' },
          styles: { textAlignment: 'far' },
          renderer: { type: 'bar', minimum: 0, maximum: 100, showLabel: true }
        },
        { name: 'region', fieldName: 'region', width: 60, header: { text: '지역' }, styles: { textAlignment: 'center' } }
      ]
    }
  },
  computed: {
    assignedCount() {
      return this.counts.teamA + this.counts.teamB
    }
  },
  created() {
    // 그리드 핸들 저장소 (비반응) — { pool: {gv, dp}, teamA: {...}, teamB: {...} }
    this.grids = {}
  },
  mounted() {
    this.loadUsers()
  },
  methods: {
    onGridInit(key, { gridView, dataProvider }) {
      // 방침: @init 으로 받은 gridView/dataProvider 를 직접 사용
      // 공통 컴포넌트는 softDeleting=true 로 초기화하지만, '이동' 의미라 실제 제거되도록 끈다
      dataProvider.softDeleting = false
      // 셀 범위 선택 후 Ctrl+C 클립보드 복사 활성(원본값 기준 → 엑셀에서 숫자 계산 용이)
      gridView.setCopyOptions({ enabled: true, copyDisplayText: false })
      this.grids[key] = { gv: gridView, dp: dataProvider }
      this.syncCounts()
    },

    async loadUsers() {
      const defaults = [
        { userId: 'minjun.park', name: '박민준', dept: '경영지원', role: 'Security', evalGrade: 'A', skillScore: 88, region: '서울' },
        { userId: 'suhyun.lee', name: '이수현', dept: '경영지원', role: 'PM', evalGrade: 'S', skillScore: 95, region: '대전' },
        { userId: 'minjun.han', name: '한민준', dept: '디자인팀', role: 'DevOps', evalGrade: 'B', skillScore: 72, region: '광주' },
        { userId: 'jihoon.kim', name: '김지훈', dept: '개발팀', role: 'PM', evalGrade: 'A', skillScore: 84, region: '서울' },
        { userId: 'yuna.cho', name: '조유나', dept: '개발팀', role: 'Frontend', evalGrade: 'B', skillScore: 79, region: '부산' },
        { userId: 'doyun.seo', name: '서도윤', dept: '품질관리', role: 'QA', evalGrade: 'C', skillScore: 65, region: '인천' }
      ]
      try {
        const url = (import.meta.env?.BASE_URL ?? '/') + 'db.json'
        const res = await fetch(url)
        if (!res.ok) throw new Error('fetch failed')
        const data = await res.json()
        const rows = (Array.isArray(data) ? data : data.users || [])
          .map(u => ({ userId: u.userId, name: u.name, dept: u.dept, role: u.role, evalGrade: u.evalGrade, skillScore: u.skillScore, region: u.region }))
        this.users = rows.length ? rows : defaults
      } catch (e) {
        console.warn('Using default users:', e)
        this.users = defaults
      }
      this.$nextTick(this.syncCounts)
    },

    syncCounts() {
      for (const k of ['pool', 'teamA', 'teamB']) {
        this.counts[k] = this.grids[k]?.dp ? this.grids[k].dp.getRowCount() : 0
      }
    },

    // ---------- 드롭 처리 (드래그 소스는 공통 컴포넌트가 담당) ----------
    // 컴포넌트가 emit 한 좌표로 대상(.dnd-grid-host)을 찾는다.
    // 대상은 그리드든 DIV든 무관 — data-grid 속성만 있으면 됨.
    gridAtPoint(x, y) {
      const el = document.elementFromPoint(x, y)
      const host = el && el.closest ? el.closest('.dnd-grid-host') : null
      return host ? host.dataset.grid : null
    },

    onRowDragMove(sourceKey, { clientX, clientY }) {
      const target = this.gridAtPoint(clientX, clientY)
      this.hoverGrid = target && target !== sourceKey ? target : null
    },

    onRowDragEnd(sourceKey, { clientX, clientY, rows }) {
      const targetKey = this.gridAtPoint(clientX, clientY)
      this.hoverGrid = null
      if (!targetKey || targetKey === sourceKey || !this.grids[targetKey]) return
      this.moveRows(sourceKey, targetKey, rows)
    },

    // 인력 풀에서 체크한 인원을 팀으로 배정 (드래그 대신 버튼)
    assignChecked(teamKey) {
      const pool = this.grids.pool
      if (!pool) return
      const rows = pool.gv.getCheckedRows() || []
      if (!rows.length) {
        showToast('인력 풀에서 이동할 인원을 체크해 주세요.', { type: 'warning' })
        return
      }
      this.moveRows('pool', teamKey, rows)
    },

    moveRows(sourceKey, targetKey, rows) {
      const s = this.grids[sourceKey], t = this.grids[targetKey]
      if (!s || !t || !rows.length) return
      const persons = rows.map(r => s.dp.getJsonRow(r))
      persons.forEach(p => t.dp.addRow(p))
      s.dp.removeRows(rows)   // softDeleting=false → 실제 제거
      s.gv.checkAll(false)
      this.syncCounts()
      const label = this.labelOf(targetKey)
      showToast(`${persons.length}명을 '${label}'(으)로 이동했습니다.`, { type: 'success' })
    },

    returnTeamToPool(teamKey) {
      const t = this.grids[teamKey]
      if (!t) return
      const n = t.dp.getRowCount()
      if (!n) return
      const rows = Array.from({ length: n }, (_, i) => i)
      this.moveRows(teamKey, 'pool', rows)
    },

    resetAll() {
      if (this.assignedCount === 0) {
        showToast('되돌릴 배정 내역이 없습니다.', { type: 'warning' })
        return
      }
      const moved = this.assignedCount
      this.teamDefs.forEach(t => {
        const g = this.grids[t.key]
        if (!g) return
        const n = g.dp.getRowCount()
        if (!n) return
        const rows = Array.from({ length: n }, (_, i) => i)
        const persons = rows.map(r => g.dp.getJsonRow(r))
        persons.forEach(p => this.grids.pool.dp.addRow(p))
        g.dp.removeRows(rows)
        g.gv.checkAll(false)
      })
      this.syncCounts()
      showToast(`${moved}명을 모두 인력 풀로 회수했습니다.`, { type: 'info' })
    },

    labelOf(key) {
      if (key === 'pool') return '인력 풀'
      return this.teamDefs.find(t => t.key === key)?.label || '팀'
    }
  }
}
</script>

<style scoped>
.dnd-layout {
  display: grid;
  grid-template-columns: 1.35fr 1fr;
  gap: 16px;
  align-items: stretch;
  min-height: 560px;
}

/* ----- Column (grid + header) ----- */
.dnd-col {
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.dnd-col-head {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  font-weight: 600;
  font-size: 0.88rem;
  background: var(--b2b-color-bg-subcard, #f8fafc);
  border: 1px solid var(--b2b-color-border, #e5e7eb);
  border-bottom: 2px solid var(--b2b-color-border, #d1d5db);
  border-radius: 8px 8px 0 0;
}
.dnd-head-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
}
.dnd-head-name { color: var(--b2b-color-text-main, #1f2937); }
.dnd-head-count {
  margin-left: auto;
  background: var(--b2b-color-bg-card, #fff);
  color: var(--b2b-color-text-muted, #64748b);
  font-size: 0.76rem;
  font-weight: 700;
  min-width: 24px;
  text-align: center;
  padding: 1px 8px;
  border-radius: 10px;
  border: 1px solid var(--b2b-color-border, #e5e7eb);
}
.dnd-head-btn {
  border: 1px solid var(--b2b-color-border, #e5e7eb);
  background: var(--b2b-color-bg-card, #fff);
  color: var(--b2b-color-text-muted, #64748b);
  font-size: 0.74rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 6px;
  cursor: pointer;
}
.dnd-head-btn:hover:not(:disabled) { background: #eff6ff; color: #0d6efd; border-color: #bfdbfe; }
.dnd-head-btn:disabled { opacity: 0.45; cursor: default; }

/* ----- Grid host (drop target) ----- */
.dnd-grid-host {
  flex: 1;
  min-height: 200px;
  border-radius: 0 0 8px 8px;
  transition: box-shadow .15s, outline-color .15s;
  outline: 2px solid transparent;
  outline-offset: -2px;
}
.dnd-grid-host.is-drop-hover {
  outline-color: #0d6efd;
  box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.15);
}

/* ----- Right team column ----- */
.dnd-teams {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
}
.dnd-team { flex: 1; min-height: 0; }
.dnd-team-host { min-height: 180px; }

.rg-grip-inline {
  color: #b0b8c4;
  font-weight: 700;
  letter-spacing: 1px;
  padding: 0 2px;
}

@media (max-width: 992px) {
  .dnd-layout { grid-template-columns: 1fr; }
}
</style>
