<template>
  <div class="b2b-page-container">
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
          :class="{ 'is-drop-hover': hoverGrid === 'pool', 'is-drag-source': dragSource === 'pool' }"
          data-grid="pool"
          @mousedown.capture="e => onGridMouseDown('pool', e)"
        >
          <RealGridCommonJs
            grid-id="dnd-pool"
            height="100%"
            :fields="gridFields"
            :columns="gridColumns"
            :rows="users"
            v-bind="commonGridProps"
            @init="e => onGridInit('pool', e)"
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
            :class="{ 'is-drop-hover': hoverGrid === team.key, 'is-drag-source': dragSource === team.key }"
            :data-grid="team.key"
            @mousedown.capture="e => onGridMouseDown(team.key, e)"
          >
            <RealGridCommonJs
              :grid-id="'dnd-' + team.key"
              height="100%"
              :fields="gridFields"
              :columns="gridColumns"
              :rows="emptyRows"
              v-bind="commonGridProps"
              @init="e => onGridInit(team.key, e)"
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
      dragSource: null,
      users: [],
      emptyRows: [], // 팀 그리드 초기 rows: 안정적 참조여야 재렌더 때 setRows([])로 안 지워짐
      counts: { pool: 0, teamA: 0, teamB: 0 },
      teamDefs: [
        { key: 'teamA', label: '1팀 배정', color: '#0d6efd' },
        { key: 'teamB', label: '2팀 배정', color: '#20c997' }
      ],
      // 세 그리드 공통 옵션 (편집 off, 체크바 on, 순수 테이블 룩)
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
    // 드래그 상태(비반응)
    this._press = null
    this._dragRows = []
    this._ghost = null
    // 그리드별 '마지막으로 만들어진 블록 선택' 기억
    this._blocks = { pool: [], teamA: [], teamB: [] }
  },
  beforeUnmount() {
    this.endDragListeners()
    this.removeGhost()
    document.body.style.userSelect = ''
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

    /*
     * ---------- 그리드 → 그리드 드래그 & 드롭 ----------
     * RealGrid 자체 D&D 나 HTML5 dragstart 를 쓰지 않고
     * grid-to-div 페이지와 동일하게 커스텀 포인터 드래그로 구현한다.
     * 그리드 '안'에서의 움직임은 RealGrid 의 블록 선택이므로 건드리지 않고,
     * 포인터가 소스 그리드 밖으로 나간 순간부터만 '행 이동'으로 본다.
     */
    onGridMouseDown(sourceKey, e) {
      if (e.button !== 0 || !this.grids[sourceKey]) return

      this._press = {
        sourceKey,
        x: e.clientX,
        y: e.clientY,
        hostRect: e.currentTarget.getBoundingClientRect(),
        // capture 단계 = RealGrid 가 이번 클릭을 처리하기 전 → 누르기 직전의 선택 상태
        preSelectedRows: this.snapshotSelectedRows(sourceKey),
        preBlockRows: [...(this._blocks[sourceKey] || [])],
        preCheckedRows: this.snapshotCheckedRows(sourceKey),
        started: false
      }

      window.addEventListener('mousemove', this.onDocMouseMove)
      window.addEventListener('mouseup', this.onDocMouseUp)
    },

    onDocMouseMove(e) {
      const press = this._press
      if (!press) return

      if (!press.started) {
        if (Math.hypot(e.clientX - press.x, e.clientY - press.y) < 5) return

        // 시작 조건은 하나 — 포인터가 소스 그리드 밖으로 나갔는가.
        // (그리드 안에서 끌면 사용자는 행을 블록 선택하려는 것이다)
        const r = press.hostRect
        const outside = e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom
        if (!outside) return

        const rows = this.resolveDragRows(press)
        if (!rows.length) {
          this.endDragListeners()
          this._press = null
          return
        }

        press.started = true
        this._dragRows = rows
        this.dragSource = press.sourceKey
        document.body.style.userSelect = 'none'
        this.createGhost(press.sourceKey, rows)
      }

      this.moveGhost(e)
      const target = this.gridAtPoint(e.clientX, e.clientY)
      this.hoverGrid = target && target !== press.sourceKey ? target : null
    },

    onDocMouseUp(e) {
      const press = this._press
      const wasDragging = !!(press && press.started)
      const sourceKey = press ? press.sourceKey : null

      this.endDragListeners()
      this._press = null

      if (!wasDragging) {
        // 끌지 않고 뗄다 = 순수 선택 제스처. 이때의 선택만 블록으로 기억한다.
        if (sourceKey) this.rememberBlock(sourceKey)
        return
      }

      const targetKey = this.gridAtPoint(e.clientX, e.clientY)
      const rows = this._dragRows

      this._dragRows = []
      this.dragSource = null
      this.hoverGrid = null
      this.removeGhost()
      document.body.style.userSelect = ''

      if (!targetKey || targetKey === sourceKey || !this.grids[targetKey]) return
      this._blocks[sourceKey] = []
      this.moveRows(sourceKey, targetKey, rows)
    },

    endDragListeners() {
      window.removeEventListener('mousemove', this.onDocMouseMove)
      window.removeEventListener('mouseup', this.onDocMouseUp)
    },

    // 드롭 대상 찾기 — 그리드든 DIV 든 data-grid 속성만 있으면 된다.
    gridAtPoint(x, y) {
      const el = document.elementFromPoint(x, y)
      const host = el && el.closest ? el.closest('.dnd-grid-host') : null
      return host ? host.dataset.grid : null
    },

    snapshotSelectedRows(key) {
      const gv = this.grids[key]?.gv
      if (!gv) return []
      return Array.from(new Set(gv.getSelectedRows() || [])).sort((a, b) => a - b)
    },

    snapshotCheckedRows(key) {
      const gv = this.grids[key]?.gv
      if (!gv) return []
      return Array.from(new Set(gv.getCheckedRows() || [])).sort((a, b) => a - b)
    },

    /** 끌지 않고 뗄 때의 선택만 '블록'으로 기억한다(여러 행일 때만). */
    rememberBlock(key) {
      const selected = this.snapshotSelectedRows(key)
      this._blocks[key] = selected.length > 1 ? selected : []
    },

    /*
     * 이동할 데이터 행 확정.
     * 드래그 도중 RealGrid 가 블록 선택을 늘려도 그 결과는 쓰지 않고,
     * 누르기 직전의 상태(체크/블록)와 누른 행(anchor)만 근거로 삼는다.
     */
    resolveDragRows(press) {
      const gv = this.grids[press.sourceKey]?.gv
      if (!gv) return []

      const cur = gv.getCurrent()
      const anchor = (cur && cur.dataRow >= 0) ? cur.dataRow : -1

      // 1) 체크해 둔 행이 있고 그 안쪽을 잡았다면 체크된 전체
      const checked = press.preCheckedRows
      if (checked.length && (anchor < 0 || checked.includes(anchor))) return [...checked]

      // 2) 여러 행을 블록 선택한 상태에서 그 안쪽을 잡았다면 블록 전체
      const block = press.preSelectedRows.length > 1 ? press.preSelectedRows : press.preBlockRows
      if (block.length > 1 && (anchor < 0 || block.includes(anchor))) return [...block]

      // 3) 그 외엔 누른 행 하나
      if (anchor >= 0) return [anchor]
      return block.length ? [...block] : []
    },

    createGhost(sourceKey, rows) {
      const dp = this.grids[sourceKey]?.dp
      const names = rows.map(r => dp && dp.getJsonRow(r) && dp.getJsonRow(r).name).filter(Boolean)
      const label = names.length > 1
        ? `<strong>${names[0]} 외 ${names.length - 1}명</strong>`
        : `<strong>${names[0] || rows.length + '명'}</strong>`

      const g = document.createElement('div')
      g.className = 'dnd-drag-ghost'
      g.innerHTML = `<i class="bi bi-person-lines-fill me-1"></i>${label} 이동 중`
      document.body.appendChild(g)
      this._ghost = g
    },

    moveGhost(e) {
      if (!this._ghost) return
      this._ghost.style.left = (e.clientX + 14) + 'px'
      this._ghost.style.top = (e.clientY + 14) + 'px'
    },

    removeGhost() {
      if (this._ghost) {
        this._ghost.remove()
        this._ghost = null
      }
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
  gap: var(--b2b-space-4);
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
  gap: var(--b2b-space-2);
  padding: var(--b2b-space-2) var(--b2b-space-3);
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
  padding: 1px var(--b2b-space-2);
  border-radius: 10px;
  border: 1px solid var(--b2b-color-border, #e5e7eb);
}
.dnd-head-btn {
  border: 1px solid var(--b2b-color-border, #e5e7eb);
  background: var(--b2b-color-bg-card, #fff);
  color: var(--b2b-color-text-muted, #64748b);
  font-size: 0.74rem;
  font-weight: 600;
  padding: 2px var(--b2b-space-2);
  border-radius: 6px;
  cursor: pointer;
}
.dnd-head-btn:hover:not(:disabled) { background: var(--b2b-color-primary-subtle); color: var(--b2b-color-primary); border-color: #bfdbfe; }
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
.dnd-grid-host.is-drag-source {
  opacity: 0.9;
}
.dnd-grid-host.is-drop-hover {
  outline-color: var(--b2b-color-primary);
  box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.15);
}

/* ----- Right team column ----- */
.dnd-teams {
  display: flex;
  flex-direction: column;
  gap: var(--b2b-space-4);
  min-height: 0;
}
.dnd-team { flex: 1; min-height: 0; }
.dnd-team-host { min-height: 180px; }

@media (max-width: 992px) {
  .dnd-layout { grid-template-columns: 1fr; }
}
</style>

<style>
/* 드래그 고스트는 document.body 에 붙으므로 scoped 밖에 둔다. */
.dnd-drag-ghost {
  position: fixed;
  z-index: 9999;
  pointer-events: none;
  background: linear-gradient(135deg, var(--b2b-color-primary), var(--b2b-color-primary-hover));
  color: #ffffff;
  font-size: 0.85rem;
  padding: 7px 14px;
  border-radius: 20px;
  box-shadow: 0 6px 20px rgba(13, 110, 253, 0.45);
  white-space: nowrap;
  border: 1px solid rgba(255, 255, 255, 0.2);
}
</style>
