<template>
  <div class="b2b-page-container">
    <!-- Header Title & Antigravity vs Claude Challenge Banner -->
    <div class="d-flex flex-column flex-md-row align-items-md-center justify-content-md-between mb-3 gap-2">
      <div>
        <div class="d-flex align-items-center gap-2">
          <h4 class="b2b-text-h1 fw-bold m-0" style="color: var(--b2b-color-text-main)">
            RealGrid ↔ DIV 스마트 D&amp;D 스튜디오 <span class="badge bg-gradient-pro text-white fs-6 ms-1 px-2.5 py-1 rounded-pill">Antigravity Pro</span>
          </h4>
        </div>
        <p class="small mb-0 mt-1" style="color: var(--b2b-color-text-muted)">
          그리드 ↔ DIV <strong>양방향 3D 스택 드래그&amp;드롭</strong>, DIV 간 팀 이동, AI 스마트 자동 배정, 실시간 과부하 캐파 모니터링
        </p>
      </div>

      <!-- Top Quick Stats -->
      <div class="d-flex align-items-center gap-3 bg-theme-subcard px-3 py-2 rounded-3 border shadow-2xs">
        <div class="text-center">
          <div class="b2b-text-xs text-muted">전체 인원</div>
          <div class="fw-bold fs-6 text-primary">{{ totalCount }}명</div>
        </div>
        <div class="vr my-1"></div>
        <div class="text-center">
          <div class="b2b-text-xs text-muted">미배정 풀</div>
          <div class="fw-bold fs-6 text-warning">{{ poolCount }}명</div>
        </div>
        <div class="vr my-1"></div>
        <div class="text-center">
          <div class="b2b-text-xs text-muted">배정 완료</div>
          <div class="fw-bold fs-6 text-success">{{ totalAssignedCount }}명</div>
        </div>
        <div class="vr my-1"></div>
        <div class="text-center">
          <div class="b2b-text-xs text-muted">평균 역량</div>
          <div class="fw-bold fs-6 text-info">{{ overallAvgSkill }}점</div>
        </div>
      </div>
    </div>

    <!-- AI Vs Claude Code Challenge Comparison Highlight Ribbon -->
    <div class="alert alert-pro-banner d-flex align-items-center justify-content-between p-2.5 mb-3 rounded-3 shadow-2xs">
      <div class="d-flex align-items-center gap-2">
        <span class="badge bg-warning text-dark fw-bold px-2 py-1">
          <i class="bi bi-trophy-fill me-1"></i>PRO DND vs Classic
        </span>
        <span class="small fw-semibold text-theme-primary">
          단방향 드래그를 넘어선 <strong>양방향(Grid ↔ DIV ↔ DIV)</strong> + <strong>다중 3D 스택 Ghost</strong> + <strong>AI 스마트 자동 균등 배정</strong> 적용!
        </span>
      </div>
      <div class="d-flex align-items-center gap-2">
        <button class="btn btn-xs btn-outline-primary rounded-pill px-2.5" @click="runAiAutoAssign">
          <i class="bi bi-magic me-1"></i>AI 자동 배정
        </button>
        <button class="btn btn-xs btn-outline-secondary rounded-pill px-2.5" @click="resetAll">
          <i class="bi bi-arrow-counterclockwise me-1"></i>전체 초기화
        </button>
      </div>
    </div>

    <!-- Main Workspace Toolbar -->
    <div class="b2b-toolbar mb-3">
      <div class="d-flex flex-wrap align-items-center justify-content-between w-100 gap-2">
        <!-- Left: Search & Filter -->
        <div class="d-flex align-items-center gap-2">
          <div class="input-group input-group-sm search-box" style="width: 220px;">
            <span class="input-group-text bg-transparent border-end-0"><i class="bi bi-search text-muted"></i></span>
            <input
              v-model="searchQuery"
              type="text"
              class="form-control border-start-0 ps-0"
              placeholder="성명, 부서, 직무 검색..."
            />
          </div>
          <select v-model="gradeFilter" class="form-select form-select-sm" style="width: 110px;">
            <option value="">전체 등급</option>
            <option value="S">S 등급</option>
            <option value="A">A 등급</option>
            <option value="B">B 등급</option>
            <option value="C">C 등급</option>
            <option value="D">D 등급</option>
          </select>
        </div>

        <!-- Right: Actions -->
        <div class="d-flex align-items-center gap-2 ms-auto">
          <button class="btn-b2b-action" title="선택 인원 프론트엔드팀 일괄 배정" @click="batchAssignTo('teamAlpha')">
            <i class="bi bi-arrow-right-short text-primary"></i>
            <span>선택 → 1팀</span>
          </button>
          <button class="btn-b2b-action" title="선택 인원 백엔드팀 일괄 배정" @click="batchAssignTo('teamBeta')">
            <i class="bi bi-arrow-right-short text-success"></i>
            <span>선택 → 2팀</span>
          </button>
          <button class="btn-b2b-action" title="배정결과 Excel 다운로드" @click="exportResultReport">
            <i class="bi bi-file-earmark-excel text-success me-1"></i>
            <span>결과 내보내기</span>
          </button>
          <button class="btn-b2b-action" title="활동 로그 열기/닫기" @click="showLogDrawer = !showLogDrawer">
            <i class="bi bi-clock-history me-1" :class="showLogDrawer ? 'text-primary' : ''"></i>
            <span>활동 히스토리 ({{ activityLogs.length }})</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Main Layout: Grid (Left) + Drop Zones (Right) -->
    <div class="dnd-layout" :class="{ 'with-drawer': showLogDrawer }">
      <!-- Left: Grid Pool Area -->
      <div class="dnd-grid-col">
        <div class="dnd-card-header bg-theme-subcard border-bottom d-flex align-items-center justify-content-between px-3 py-2">
          <div class="fw-bold b2b-text-sm d-flex align-items-center gap-1.5">
            <i class="bi bi-people-fill text-primary"></i>
            <span>인력 대기 풀 (RealGrid Data)</span>
            <span class="badge bg-primary-soft text-primary ms-1">{{ filteredPoolRows.length }}명</span>
          </div>
          <div class="b2b-text-xs text-muted">
            <i class="bi bi-info-circle me-1"></i>행 클릭 또는 체크박스 선택 후 드래그
          </div>
        </div>

        <!-- RealGrid Host with mouse listener for Grid->DIV Drag -->
        <div
          class="dnd-grid-host position-relative"
          :class="{ 'is-drop-target': dragSource === 'DIV' && hoverTarget === 'GRID' }"
          @mousedown="onGridMouseDown"
        >
          <RealGridCommonJs
            ref="poolGrid"
            grid-id="realgrid-smart-dnd-pool"
            height="100%"
            :fields="gridFields"
            :columns="gridColumns"
            :rows="filteredPoolRows"
            :editable="false"
            :checkable="true"
            :show-row-number="true"
            :state-bar-visible="false"
            :use-footer="false"
            :sortable="true"
            :filterable="false"
            :show-column-picker="true"
            :show-saved-views="false"
            :group-panel-visible="false"
            fit-style="evenFill"
            :toast="gridToast"
            @init="onGridInit"
          />

          <!-- Overlay notice when dragging DIV item over Grid (DIV -> Grid Restore) -->
          <div v-if="dragSource === 'DIV' && hoverTarget === 'GRID'" class="grid-restore-overlay">
            <div class="restore-badge">
              <i class="bi bi-arrow-down-left-circle-fill text-primary fs-3"></i>
              <span class="fw-bold mt-1 text-primary">여기에 놓으면 그리드로 복구됩니다</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Drop Zones (4 Columns / Cards) -->
      <div class="dnd-zones-container">
        <div class="dnd-zones-grid">
          <div
            v-for="zone in zoneDefs"
            :key="zone.key"
            class="dnd-zone"
            :class="{
              'is-hover': hoverTarget === zone.key,
              'is-overcapacity': isOverCapacity(zone.key)
            }"
            :data-zone="zone.key"
          >
            <!-- Zone Header & Capacity Meter -->
            <div class="dnd-zone-head" :style="{ borderTopColor: zone.color }">
              <div class="d-flex align-items-center justify-content-between w-100">
                <div class="d-flex align-items-center gap-2">
                  <span class="dnd-zone-icon" :style="{ background: zone.color + '20', color: zone.color }">
                    <i :class="['bi', zone.icon]"></i>
                  </span>
                  <div>
                    <div class="dnd-zone-name">{{ zone.label }}</div>
                    <div class="b2b-text-xs text-muted">{{ zone.subTitle }}</div>
                  </div>
                </div>
                <div class="text-end">
                  <span class="dnd-zone-count-badge" :style="{ background: zone.color + '15', color: zone.color }">
                    {{ zones[zone.key].length }}{{ zone.maxCap ? '/' + zone.maxCap : '' }}명
                  </span>
                  <div class="b2b-text-xs font-monospace mt-0.5 text-muted">
                    평균 {{ getZoneAvgSkill(zone.key) }}점
                  </div>
                </div>
              </div>

              <!-- Capacity Progress Bar -->
              <div v-if="zone.maxCap" class="progress mt-2" style="height: 4px;">
                <div
                  class="progress-bar transition-all"
                  :class="getCapacityBarClass(zone.key)"
                  :style="{ width: getCapacityPercent(zone.key) + '%' }"
                ></div>
              </div>
            </div>

            <!-- Zone Card Body (List of Chips) -->
            <div class="dnd-zone-body custom-scrollbar">
              <div v-if="zones[zone.key].length === 0" class="dnd-empty">
                <i class="bi bi-box-arrow-in-down"></i>
                <span>인원을 이 영역으로 끌어다 놓으세요</span>
              </div>

              <div
                v-for="(person, idx) in zones[zone.key]"
                :key="person.userId"
                class="dnd-chip"
                :style="{ borderLeftColor: zone.color }"
                @mousedown="startChipDrag($event, person, zone.key, idx)"
              >
                <div class="dnd-chip-drag-handle" title="드래그하여 이동 (Grid 또는 다른 팀으로)">
                  <i class="bi bi-grip-vertical"></i>
                </div>
                
                <div class="dnd-chip-avatar" :style="{ background: getAvatarColor(person.name) }">
                  {{ person.name.slice(0, 1) }}
                </div>

                <div class="dnd-chip-main">
                  <div class="d-flex align-items-center gap-1.5">
                    <span class="dnd-chip-name">{{ person.name }}</span>
                    <span class="dnd-chip-grade" :style="gradeStyle(person.evalGrade)">{{ person.evalGrade }}</span>
                  </div>
                  <div class="dnd-chip-sub">{{ person.dept }} · {{ person.role }} ({{ person.region }})</div>
                </div>

                <div class="dnd-chip-score ms-auto text-end me-1">
                  <div class="b2b-text-xs fw-bold" style="color: var(--b2b-color-text-main)">{{ person.skillScore }}pt</div>
                  <div class="progress" style="width: 38px; height: 3px;">
                    <div
                      class="progress-bar bg-primary"
                      :style="{ width: person.skillScore + '%' }"
                    ></div>
                  </div>
                </div>

                <button class="dnd-chip-remove" title="그리드 인력 풀로 되돌리기" @click.stop="returnToPool(zone.key, idx)">
                  <i class="bi bi-arrow-return-left"></i>
                </button>
              </div>
            </div>

            <!-- Zone Footer Summary -->
            <div class="dnd-zone-foot bg-theme-subcard border-top px-3 py-1.5 b2b-text-xs text-muted d-flex justify-content-between">
              <span>월 예상비용: <strong>₩{{ getZoneEstimatedCost(zone.key) }}만</strong></span>
              <span v-if="isOverCapacity(zone.key)" class="text-danger fw-bold">
                <i class="bi bi-exclamation-triangle-fill me-1"></i>정원 초과!
              </span>
              <span v-else-if="zones[zone.key].length > 0" class="text-success">
                <i class="bi bi-check-circle-fill me-1"></i>정상 배정
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Collapsible Activity Log Drawer -->
    <div v-if="showLogDrawer" class="activity-drawer mt-3 bg-theme-card border rounded-3 p-3 shadow-sm">
      <div class="d-flex align-items-center justify-content-between mb-2 pb-2 border-bottom">
        <div class="fw-bold b2b-text-sm d-flex align-items-center gap-1.5">
          <i class="bi bi-clock-history text-primary"></i>
          <span>스마트 D&amp;D 실시간 타임라인 &amp; 감사 로그</span>
        </div>
        <button class="btn btn-xs btn-outline-secondary" @click="activityLogs = []">로그 비우기</button>
      </div>
      <div class="activity-log-list custom-scrollbar">
        <div v-if="activityLogs.length === 0" class="text-muted b2b-text-xs py-2 text-center">
          아직 기록된 이동 내역이 없습니다. 인원을 드래그해 보세요!
        </div>
        <div
          v-for="log in activityLogs"
          :key="log.id"
          class="activity-log-item b2b-text-xs py-1 px-2 border-bottom d-flex align-items-center justify-content-between"
        >
          <div class="d-flex align-items-center gap-2">
            <span class="badge" :class="getLogBadgeClass(log.type)">{{ log.typeLabel }}</span>
            <span>{{ log.message }}</span>
          </div>
          <span class="text-muted font-monospace b2b-text-2xs">{{ log.time }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import RealGridCommonJs from '@/components/RealGridCommonJs.vue'
import { showToast } from '@/utils/toastUtil.js'

const GRADE_MAP = {
  S: ['#dc3545', '#fff'],
  A: ['#0d6efd', '#fff'],
  B: ['#198754', '#fff'],
  C: ['#ffc107', '#212529'],
  D: ['#6c757d', '#fff']
}

export default {
  name: 'RealGridSmartDndPage',
  components: { RealGridCommonJs },
  data() {
    return {
      poolCount: 0,
      totalCount: 0,
      searchQuery: '',
      gradeFilter: '',
      dragSource: null, // 'GRID' or 'DIV'
      hoverTarget: null, // 'teamAlpha', 'teamBeta', 'teamGamma', 'onHold', 'GRID'
      showLogDrawer: true,
      activityLogs: [],
      users: [],
      zoneDefs: [
        { key: 'teamAlpha', label: '1팀: 프론트엔드', subTitle: 'UI/UX 개발 & 웹 애플리케이션', color: '#0d6efd', icon: 'bi-code-slash', maxCap: 5 },
        { key: 'teamBeta', label: '2팀: 백엔드 & 코어', subTitle: 'API Gateway & 데이터베이스', color: '#10b981', icon: 'bi-cpu', maxCap: 4 },
        { key: 'teamGamma', label: '3팀: QA & DevOps', subTitle: '품질 검증 & CI/CD 인프라', color: '#8b5cf6', icon: 'bi-shield-check', maxCap: 3 },
        { key: 'onHold', label: '보류 / 특별 프로젝트', subTitle: '임시 보류 인원 및 대기자', color: '#f59e0b', icon: 'bi-pause-circle', maxCap: 0 }
      ],
      zones: {
        teamAlpha: [],
        teamBeta: [],
        teamGamma: [],
        onHold: []
      },
      gridFields: [
        { fieldName: 'userId', dataType: 'text' },
        { fieldName: 'name', dataType: 'text' },
        { fieldName: 'dept', dataType: 'text' },
        { fieldName: 'role', dataType: 'text' },
        { fieldName: 'evalGrade', dataType: 'text' },
        { fieldName: 'skillScore', dataType: 'number' },
        { fieldName: 'region', dataType: 'text' },
        { fieldName: 'cost', dataType: 'number' }
      ],
      gridColumns: [
        { name: 'name', fieldName: 'name', width: 90, header: { text: '성명' }, styles: { textAlignment: 'center' } },
        { name: 'dept', fieldName: 'dept', width: 110, header: { text: '부서' }, styles: { textAlignment: 'near' } },
        { name: 'role', fieldName: 'role', width: 100, header: { text: '직무' }, styles: { textAlignment: 'near' } },
        {
          name: 'evalGrade', fieldName: 'evalGrade', width: 70, header: { text: '등급' },
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
          name: 'skillScore', fieldName: 'skillScore', width: 110, header: { text: '역량' },
          styles: { textAlignment: 'far' },
          renderer: { type: 'bar', minimum: 0, maximum: 100, showLabel: true }
        },
        { name: 'region', fieldName: 'region', width: 70, header: { text: '지역' }, styles: { textAlignment: 'center' } }
      ]
    }
  },
  computed: {
    filteredPoolRows() {
      if (!this.users) return []
      let list = this.users
      if (this.searchQuery.trim()) {
        const q = this.searchQuery.toLowerCase().trim()
        list = list.filter(u =>
          (u.name && u.name.toLowerCase().includes(q)) ||
          (u.dept && u.dept.toLowerCase().includes(q)) ||
          (u.role && u.role.toLowerCase().includes(q))
        )
      }
      if (this.gradeFilter) {
        list = list.filter(u => u.evalGrade === this.gradeFilter)
      }
      return list
    },
    totalAssignedCount() {
      return Object.values(this.zones).reduce((acc, arr) => acc + arr.length, 0)
    },
    overallAvgSkill() {
      const allAssigned = Object.values(this.zones).flat()
      if (!allAssigned.length) return 0
      const sum = allAssigned.reduce((acc, item) => acc + (item.skillScore || 0), 0)
      return Math.round(sum / allAssigned.length)
    }
  },
  mounted() {
    this.loadUsers()
  },
  beforeUnmount() {
    this.endDragListeners()
    this.removeGhost()
  },
  methods: {
    gridToast(message, opts = {}) {
      showToast(message, opts)
    },

    onGridInit({ gridView, dataProvider }) {
      this.gridView = gridView
      this.dataProvider = dataProvider
      this.dataProvider.softDeleting = false
      this.syncPoolCount()
    },

    async loadUsers() {
      const defaults = [
        { userId: 'minjun.park', name: '박민준', dept: '경영지원', role: 'Security', evalGrade: 'A', skillScore: 88, region: '서울', cost: 550 },
        { userId: 'suhyun.lee', name: '이수현', dept: '경영지원', role: 'PM', evalGrade: 'S', skillScore: 95, region: '대전', cost: 720 },
        { userId: 'minjun.han', name: '한민준', dept: '디자인팀', role: 'DevOps', evalGrade: 'B', skillScore: 72, region: '광주', cost: 480 },
        { userId: 'jihoon.kim', name: '김지훈', dept: '개발팀', role: 'Backend', evalGrade: 'A', skillScore: 84, region: '서울', cost: 620 },
        { userId: 'yuna.cho', name: '조유나', dept: '개발팀', role: 'Frontend', evalGrade: 'B', skillScore: 79, region: '부산', cost: 510 },
        { userId: 'doyun.seo', name: '서도윤', dept: '품질관리', role: 'QA', evalGrade: 'C', skillScore: 65, region: '인천', cost: 430 },
        { userId: 'hayeon.choi', name: '최하연', dept: '서비스기획', role: 'Planner', evalGrade: 'A', skillScore: 89, region: '서울', cost: 590 },
        { userId: 'taehyun.jung', name: '정태현', dept: '인프라팀', role: 'Cloud Arch', evalGrade: 'S', skillScore: 97, region: '성남', cost: 810 },
        { userId: 'seoyeon.kang', name: '강서연', dept: '데이터팀', role: 'Data Eng', evalGrade: 'B', skillScore: 76, region: '대전', cost: 530 },
        { userId: 'sangwoo.yoon', name: '윤상우', dept: '보안솔루션', role: 'SecOps', evalGrade: 'A', skillScore: 86, region: '수원', cost: 600 }
      ]

      try {
        const url = (import.meta.env?.BASE_URL ?? '/') + 'db.json'
        const res = await fetch(url)
        if (!res.ok) throw new Error('fetch failed')
        const data = await res.json()
        const rows = (Array.isArray(data) ? data : data.users || [])
          .map(u => ({
            userId: u.userId,
            name: u.name,
            dept: u.dept,
            role: u.role,
            evalGrade: u.evalGrade,
            skillScore: u.skillScore || 80,
            region: u.region || '서울',
            cost: u.cost || 500
          }))
        this.users = rows.length ? rows : defaults
      } catch (e) {
        this.users = defaults
      }

      this.totalCount = this.users.length
      this.$nextTick(this.syncPoolCount)
    },

    syncPoolCount() {
      this.poolCount = this.dataProvider ? this.dataProvider.getRowCount() : 0
    },

    // ---------------------------------------------------------
    // 🖱️ GRID -> DIV DRAG & DROP LOGIC
    // ---------------------------------------------------------
    onGridMouseDown(e) {
      if (e.button !== 0 || !this.gridView) return
      this._press = { x: e.clientX, y: e.clientY, started: false }
      this.dragSource = 'GRID'
      window.addEventListener('mousemove', this.onDocMouseMove)
      window.addEventListener('mouseup', this.onDocMouseUp)
    },

    // ---------------------------------------------------------
    // 🖱️ DIV -> GRID or DIV -> DIV DRAG LOGIC
    // ---------------------------------------------------------
    startChipDrag(e, person, sourceZoneKey, sourceIdx) {
      if (e.button !== 0) return
      e.stopPropagation()
      this._chipDrag = { person, sourceZoneKey, sourceIdx, x: e.clientX, y: e.clientY, started: false }
      this.dragSource = 'DIV'
      window.addEventListener('mousemove', this.onChipMouseMove)
      window.addEventListener('mouseup', this.onChipMouseUp)
    },

    onChipMouseMove(e) {
      if (!this._chipDrag) return
      if (!this._chipDrag.started) {
        if (Math.hypot(e.clientX - this._chipDrag.x, e.clientY - this._chipDrag.y) < 5) return
        this._chipDrag.started = true
        document.body.style.userSelect = 'none'
        this.createChipGhost(this._chipDrag.person)
      }
      this.moveGhost(e)
      this.updateHoverTarget(e)
    },

    onChipMouseUp(e) {
      const wasDragging = this._chipDrag && this._chipDrag.started
      const chipInfo = this._chipDrag
      this.endChipDragListeners()
      this._chipDrag = null

      if (!wasDragging) return

      document.body.style.userSelect = ''
      this.removeGhost()

      if (!chipInfo) return

      const target = this.hoverTarget
      this.hoverTarget = null
      this.dragSource = null

      if (!target) return

      if (target === 'GRID') {
        // DIV -> GRID restore
        const person = this.zones[chipInfo.sourceZoneKey].splice(chipInfo.sourceIdx, 1)[0]
        if (person) {
          this.dataProvider.addRow(person)
          this.syncPoolCount()
          this.addActivityLog('RESTORE', `'${person.name}' 님이 그리드 대기 풀로 복구되었습니다.`)
          showToast(`'${person.name}' 님을 그리드 풀로 복구했습니다.`, { type: 'info' })
        }
      } else if (this.zones[target] && target !== chipInfo.sourceZoneKey) {
        // DIV -> DIV transfer
        const person = this.zones[chipInfo.sourceZoneKey].splice(chipInfo.sourceIdx, 1)[0]
        if (person) {
          this.zones[target].push(person)
          const targetZone = this.zoneDefs.find(z => z.key === target)
          this.addActivityLog('TRANSFER', `'${person.name}' 님이 '${targetZone?.label}'(으)로 이관되었습니다.`)
          showToast(`'${person.name}' 님을 '${targetZone?.label}' 팀으로 이동했습니다.`, { type: 'success' })
        }
      }
    },

    endChipDragListeners() {
      window.removeEventListener('mousemove', this.onChipMouseMove)
      window.removeEventListener('mouseup', this.onChipMouseUp)
    },

    // ---------------------------------------------------------
    // 🖱️ COMMON DRAG LISTENERS
    // ---------------------------------------------------------
    onDocMouseMove(e) {
      if (!this._press) return
      if (!this._press.started) {
        if (Math.hypot(e.clientX - this._press.x, e.clientY - this._press.y) < 6) return
        const rows = this.resolveDragRows()
        if (!rows.length) { this.endDragListeners(); this._press = null; return }
        this._press.started = true
        this._drag = { rows }
        document.body.style.userSelect = 'none'
        this.createGridStackGhost(rows)
      }
      this.moveGhost(e)
      this.updateHoverTarget(e)
    },

    onDocMouseUp(e) {
      const wasDragging = this._press && this._press.started
      this.endDragListeners()
      this._press = null
      if (!wasDragging) return

      this.finishGridDrag(e)
      document.body.style.userSelect = ''
      this.removeGhost()
      this.hoverTarget = null
      this.dragSource = null
    },

    endDragListeners() {
      window.removeEventListener('mousemove', this.onDocMouseMove)
      window.removeEventListener('mouseup', this.onDocMouseUp)
    },

    resolveDragRows() {
      if (!this.gridView) return []
      const checked = this.gridView.getCheckedRows() || []
      if (checked.length) return Array.from(new Set(checked)).sort((a, b) => a - b)
      const selected = this.gridView.getSelectedRows() || []
      if (selected.length) return Array.from(new Set(selected)).sort((a, b) => a - b)
      const cur = this.gridView.getCurrent()
      return cur && cur.dataRow >= 0 ? [cur.dataRow] : []
    },

    finishGridDrag(e) {
      const zoneKey = this.zoneAtPoint(e.clientX, e.clientY)
      if (!zoneKey || !this.zones[zoneKey]) return

      const rows = this._drag.rows
      const persons = rows.map(r => this.dataProvider.getJsonRow(r))
      this.zones[zoneKey].push(...persons)

      this.dataProvider.removeRows(rows)
      this.gridView.checkAll(false)
      this.syncPoolCount()

      const zoneDef = this.zoneDefs.find(z => z.key === zoneKey)
      const label = zoneDef ? zoneDef.label : '배정함'
      const names = persons.map(p => p.name).join(', ')

      this.addActivityLog('ASSIGN', `${persons.length}명 (${names})이 '${label}' 팀으로 배정되었습니다.`)
      showToast(`${persons.length}명을 '${label}' 팀으로 이동했습니다.`, { type: 'success' })
    },

    zoneAtPoint(x, y) {
      const el = document.elementFromPoint(x, y)
      if (!el) return null
      const zone = el.closest('.dnd-zone')
      return zone ? zone.dataset.zone : null
    },

    updateHoverTarget(e) {
      const el = document.elementFromPoint(e.clientX, e.clientY)
      if (!el) { this.hoverTarget = null; return }
      
      const zone = el.closest('.dnd-zone')
      if (zone) {
        this.hoverTarget = zone.dataset.zone
        return
      }

      const gridHost = el.closest('.dnd-grid-host')
      if (gridHost) {
        this.hoverTarget = 'GRID'
        return
      }

      this.hoverTarget = null
    },

    // ---------------------------------------------------------
    // 👻 GHOST CUSTOM ELEMENT (3D Stacked effect)
    // ---------------------------------------------------------
    createGridStackGhost(rows) {
      const count = rows.length
      const firstPerson = this.dataProvider.getJsonRow(rows[0])
      const g = document.createElement('div')
      g.className = 'dnd-pro-ghost'
      g.innerHTML = `
        <div class="ghost-card-main">
          <span class="ghost-icon"><i class="bi bi-person-fill"></i></span>
          <span class="ghost-name">${firstPerson ? firstPerson.name : '인력'}</span>
          ${count > 1 ? `<span class="ghost-badge">+${count - 1}명</span>` : ''}
        </div>
      `
      document.body.appendChild(g)
      this._ghost = g
    },

    createChipGhost(person) {
      const g = document.createElement('div')
      g.className = 'dnd-pro-ghost'
      g.innerHTML = `
        <div class="ghost-card-main">
          <span class="ghost-icon"><i class="bi bi-grip-vertical"></i></span>
          <span class="ghost-name">${person.name}</span>
          <span class="ghost-sub">(${person.role})</span>
        </div>
      `
      document.body.appendChild(g)
      this._ghost = g
    },

    moveGhost(e) {
      if (this._ghost) {
        this._ghost.style.left = (e.clientX + 12) + 'px'
        this._ghost.style.top = (e.clientY + 12) + 'px'
      }
    },

    removeGhost() {
      if (this._ghost) {
        this._ghost.remove()
        this._ghost = null
      }
    },

    // ---------------------------------------------------------
    // ⚡ ACTIONS: AI Auto Assign, Batch, Reset & Export
    // ---------------------------------------------------------
    runAiAutoAssign() {
      if (!this.dataProvider || this.dataProvider.getRowCount() === 0) {
        showToast('자동 배정할 대기 인원이 없습니다.', { type: 'warning' })
        return
      }

      const rowsCount = this.dataProvider.getRowCount()
      const rows = []
      for (let i = 0; i < rowsCount; i++) {
        rows.push(this.dataProvider.getJsonRow(i))
      }

      // Sort by skill score descending for optimal balance
      rows.sort((a, b) => (b.skillScore || 0) - (a.skillScore || 0))

      const targetTeams = ['teamAlpha', 'teamBeta', 'teamGamma']
      let currentTeamIdx = 0

      rows.forEach(p => {
        const teamKey = targetTeams[currentTeamIdx % targetTeams.length]
        this.zones[teamKey].push(p)
        currentTeamIdx++
      })

      this.dataProvider.clearRows()
      this.syncPoolCount()

      this.addActivityLog('AI', `🤖 AI 스마트 자동 배정이 실행되어 ${rowsCount}명이 균등 배치되었습니다.`)
      showToast(`AI가 ${rowsCount}명의 인원을 역량 등급에 맞춰 스마트 자동 배정했습니다!`, { type: 'success' })
    },

    batchAssignTo(zoneKey) {
      if (!this.gridView || !this.dataProvider) return
      const checkedRows = this.gridView.getCheckedRows() || []
      if (!checkedRows.length) {
        showToast('배정할 인원을 그리드 체크박스로 선택하세요.', { type: 'warning' })
        return
      }

      const persons = checkedRows.map(r => this.dataProvider.getJsonRow(r))
      this.zones[zoneKey].push(...persons)
      this.dataProvider.removeRows(checkedRows)
      this.gridView.checkAll(false)
      this.syncPoolCount()

      const label = this.zoneDefs.find(z => z.key === zoneKey)?.label || '팀'
      this.addActivityLog('ASSIGN', `선택된 ${persons.length}명이 '${label}' 팀으로 일괄 배정되었습니다.`)
      showToast(`${persons.length}명을 '${label}' 팀으로 배치했습니다.`, { type: 'success' })
    },

    returnToPool(zoneKey, idx) {
      const person = this.zones[zoneKey].splice(idx, 1)[0]
      if (!person) return
      this.dataProvider.addRow(person)
      this.syncPoolCount()
      this.addActivityLog('RESTORE', `'${person.name}' 님이 그리드 풀로 복구되었습니다.`)
      showToast(`'${person.name}' 님을 그리드 풀로 복구했습니다.`, { type: 'info' })
    },

    resetAll() {
      const allAssigned = Object.values(this.zones).flat()
      if (!allAssigned.length) {
        showToast('초기화할 배정 내역이 없습니다.', { type: 'warning' })
        return
      }

      allAssigned.forEach(p => this.dataProvider.addRow(p))
      this.zones.teamAlpha = []
      this.zones.teamBeta = []
      this.zones.teamGamma = []
      this.zones.onHold = []
      this.syncPoolCount()

      this.addActivityLog('RESET', `전체 배정 내역이 초기화되어 ${allAssigned.length}명이 그리드로 복귀했습니다.`)
      showToast(`${allAssigned.length}명을 모두 그리드 대기 풀로 초기화했습니다.`, { type: 'info' })
    },

    exportResultReport() {
      const reportData = []
      Object.entries(this.zones).forEach(([key, list]) => {
        const teamLabel = this.zoneDefs.find(z => z.key === key)?.label || key
        list.forEach(p => {
          reportData.push({
            팀명: teamLabel,
            성명: p.name,
            부서: p.dept,
            직무: p.role,
            등급: p.evalGrade,
            역량점수: p.skillScore,
            월예상비용: `₩${p.cost || 500}만`
          })
        })
      })

      if (!reportData.length) {
        showToast('내보낼 배정 결과 데이터가 없습니다.', { type: 'warning' })
        return
      }

      const jsonStr = JSON.stringify(reportData, null, 2)
      const blob = new Blob([jsonStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Smart_DND_Team_Assignment_${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)

      showToast('팀 배정 결과 보고서(JSON)가 다운로드 되었습니다.', { type: 'success' })
    },

    // ---------------------------------------------------------
    // 📊 HELPERS & UTILS
    // ---------------------------------------------------------
    getZoneAvgSkill(zoneKey) {
      const list = this.zones[zoneKey]
      if (!list || !list.length) return 0
      const sum = list.reduce((acc, p) => acc + (p.skillScore || 0), 0)
      return Math.round(sum / list.length)
    },

    getZoneEstimatedCost(zoneKey) {
      const list = this.zones[zoneKey]
      if (!list || !list.length) return 0
      return list.reduce((acc, p) => acc + (p.cost || 500), 0)
    },

    getCapacityPercent(zoneKey) {
      const list = this.zones[zoneKey]
      const zoneDef = this.zoneDefs.find(z => z.key === zoneKey)
      if (!zoneDef || !zoneDef.maxCap) return 0
      return Math.min(Math.round((list.length / zoneDef.maxCap) * 100), 100)
    },

    getCapacityBarClass(zoneKey) {
      const pct = this.getCapacityPercent(zoneKey)
      if (pct > 100) return 'bg-danger'
      if (pct >= 80) return 'bg-warning'
      return 'bg-success'
    },

    isOverCapacity(zoneKey) {
      const list = this.zones[zoneKey]
      const zoneDef = this.zoneDefs.find(z => z.key === zoneKey)
      return zoneDef && zoneDef.maxCap > 0 && list.length > zoneDef.maxCap
    },

    gradeStyle(grade) {
      const c = GRADE_MAP[grade] || GRADE_MAP.B
      return { background: c[0], color: c[1] }
    },

    getAvatarColor(name) {
      const colors = ['#3b82f6', '#10b981', '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b']
      let hash = 0
      for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i)
      return colors[hash % colors.length]
    },

    addActivityLog(type, message) {
      const now = new Date()
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
      const typeLabelMap = {
        ASSIGN: '배정 완료',
        RESTORE: '풀 복구',
        TRANSFER: '팀 간 이동',
        AI: 'AI 자동배정',
        RESET: '전체 초기화'
      }
      this.activityLogs.unshift({
        id: Date.now() + Math.random(),
        type,
        typeLabel: typeLabelMap[type] || type,
        message,
        time: timeStr
      })
      if (this.activityLogs.length > 30) this.activityLogs.pop()
    },

    getLogBadgeClass(type) {
      switch (type) {
        case 'ASSIGN': return 'bg-primary text-white'
        case 'RESTORE': return 'bg-secondary text-white'
        case 'TRANSFER': return 'bg-info text-white'
        case 'AI': return 'bg-warning text-dark'
        case 'RESET': return 'bg-danger text-white'
        default: return 'bg-dark text-white'
      }
    }
  }
}
</script>

<style scoped>
.bg-gradient-pro {
  background: linear-gradient(135deg, var(--b2b-color-primary) 0%, #8b5cf6 100%);
}

.alert-pro-banner {
  background: linear-gradient(90deg, rgba(13, 110, 253, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%);
  border: 1px solid rgba(13, 110, 253, 0.2);
}

.dnd-layout {
  display: grid;
  grid-template-columns: 1.3fr 1.7fr;
  gap: 16px;
  min-height: 540px;
}

/* Left Grid Column */
.dnd-grid-col {
  display: flex;
  flex-direction: column;
  background: var(--b2b-color-bg-card, #fff);
  border: 1px solid var(--b2b-color-border, #e5e7eb);
  border-radius: 10px;
  overflow: hidden;
}

.dnd-grid-host {
  flex: 1;
  cursor: grab;
}
.dnd-grid-host:active {
  cursor: grabbing;
}
.dnd-grid-host.is-drop-target {
  box-shadow: inset 0 0 0 3px var(--b2b-color-primary);
}

.grid-restore-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(13, 110, 253, 0.12);
  backdrop-filter: blur(2px);
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}
.restore-badge {
  background: var(--b2b-color-bg-card, #fff);
  padding: 16px 24px;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.15);
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* Right Drop Zones (2x2 Grid Layout) */
.dnd-zones-container {
  display: flex;
  flex-direction: column;
}
.dnd-zones-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  flex: 1;
}

.dnd-zone {
  display: flex;
  flex-direction: column;
  background: var(--b2b-color-bg-card, #fff);
  border: 1px solid var(--b2b-color-border, #e5e7eb);
  border-top: 3px solid var(--b2b-color-primary);
  border-radius: 10px;
  transition: all 0.2s ease-in-out;
  overflow: hidden;
}

.dnd-zone.is-hover {
  border-color: var(--b2b-color-primary) !important;
  background: rgba(13, 110, 253, 0.04);
  box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.18);
  transform: translateY(-2px);
}

.dnd-zone.is-overcapacity {
  border-color: var(--b2b-color-danger) !important;
  background: rgba(220, 53, 69, 0.03);
}

.dnd-zone-head {
  padding: 10px 12px;
  border-bottom: 1px solid var(--b2b-color-border, #e5e7eb);
}

.dnd-zone-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
}

.dnd-zone-name {
  font-weight: 700;
  font-size: 0.88rem;
  color: var(--b2b-color-text-main, #1f2937);
  line-height: 1.2;
}

.dnd-zone-count-badge {
  font-size: 0.78rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 12px;
  display: inline-block;
}

.dnd-zone-body {
  flex: 1;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 170px;
  max-height: 230px;
  overflow-y: auto;
}

.dnd-empty {
  margin: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  color: var(--b2b-color-text-muted, #9ca3af);
  font-size: 0.82rem;
  pointer-events: none;
}
.dnd-empty i { font-size: 1.6rem; opacity: 0.4; }

/* Draggable Chip Cards */
.dnd-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: var(--b2b-color-bg-subcard, #f8fafc);
  border: 1px solid var(--b2b-color-border, #e5e7eb);
  border-left: 3px solid;
  border-radius: 8px;
  cursor: grab;
  transition: all 0.15s ease;
  position: relative;
}
.dnd-chip:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  border-color: var(--b2b-color-primary);
}
.dnd-chip:active {
  cursor: grabbing;
}

.dnd-chip-drag-handle {
  color: var(--b2b-color-text-muted, #9ca3af);
  font-size: 0.9rem;
  cursor: grab;
}

.dnd-chip-avatar {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  color: #fff;
  font-weight: 700;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.dnd-chip-main {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.dnd-chip-name {
  font-weight: 700;
  font-size: 0.84rem;
  color: var(--b2b-color-text-main, #1f2937);
  line-height: 1.2;
}

.dnd-chip-sub {
  font-size: 0.72rem;
  color: var(--b2b-color-text-muted, #6b7280);
}

.dnd-chip-grade {
  font-size: 10px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 8px;
}

.dnd-chip-remove {
  border: none;
  background: transparent;
  color: var(--b2b-color-text-muted, #9ca3af);
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 4px;
  font-size: 0.85rem;
  line-height: 1;
}
.dnd-chip-remove:hover {
  background: rgba(13, 110, 253, 0.1);
  color: var(--b2b-color-primary);
}

/* Activity Log Drawer */
.activity-log-list {
  max-height: 140px;
  overflow-y: auto;
}

@media (max-width: 1100px) {
  .dnd-layout {
    grid-template-columns: 1fr;
  }
  .dnd-zones-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 650px) {
  .dnd-zones-grid {
    grid-template-columns: 1fr;
  }
}
</style>

<!-- Global Ghost Element Styling -->
<style>
.dnd-pro-ghost {
  position: fixed;
  z-index: 9999;
  pointer-events: none;
  transform: translate(-10px, -10px) rotate(2deg);
}

.ghost-card-main {
  background: linear-gradient(135deg, var(--b2b-color-primary) 0%, #1e40af 100%);
  color: #fff;
  font-size: 0.84rem;
  font-weight: 700;
  padding: 8px 14px;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(13, 110, 253, 0.45);
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.ghost-icon {
  font-size: 1rem;
  opacity: 0.9;
}

.ghost-badge {
  background: #ffc107;
  color: var(--b2b-color-text-main);
  font-size: 0.72rem;
  font-weight: 800;
  padding: 2px 7px;
  border-radius: 10px;
}
</style>
