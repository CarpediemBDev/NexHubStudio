<template>
  <div class="b2b-page-container">
    <!-- Header Page Title -->
    <div class="mb-3">
      <div class="d-flex align-items-center gap-2">
        <h4 class="fw-bold m-0" style="color: var(--b2b-color-text-main)">RealGrid 모델 그룹화 스튜디오 (Grid ➔ DIV)</h4>
        <span class="badge bg-primary px-2.5 py-1">전용 핸들(`⋮⋮`) 다중 D&amp;D</span>
        <span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">
          <i class="bi bi-layers-half me-1"></i>다중 &amp; 단일 D&amp;D 겸용
        </span>
      </div>
      <p class="small text-muted mb-0 mt-1">
        No.(행번호)나 체크박스 컬럼 대신 <strong>전용 이동 핸들 필드(`⋮⋮`)</strong>를 추가하여, 여러 행을 블록 선택 후 핸들 영역을 끌어 우측 <strong>HTML DIV 배정함</strong>으로 일괄 그룹 배정하는 예제입니다.<br/>
        <strong>상단 DIV:</strong> 블록 선택한 다중 모델 일괄 배정 / <strong>하단 DIV:</strong> 1개의 대표 모델만 단일 배정
      </p>
    </div>

    <!-- Usage Banner -->
    <div class="alert alert-info border-info-subtle bg-info-subtle text-dark py-2.5 px-3 mb-3 b2b-text-xs rounded-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
      <div class="d-flex align-items-center gap-2">
        <i class="bi bi-info-circle-fill text-info fs-5"></i>
        <span>
          <strong>전용 핸들(`⋮⋮`) 드래그 앤 드롭 가이드:</strong>
          ① 그리드 셀을 마우스로 끌어 <strong>여러 행을 블록 선택(파란 하이라이트)</strong>
          ② 선택된 행 맨 좌측의 <strong>이동 핸들(`⋮⋮`) 영역을 잡고 우측 DIV 영역으로 끌어서 드롭</strong>
        </span>
      </div>
      <span class="badge bg-primary text-white ms-auto">사용 가이드</span>
    </div>

    <!-- Toolbar -->
    <div class="b2b-toolbar mb-3">
      <div class="d-flex align-items-center justify-content-between w-100 flex-wrap gap-2">
        <div class="d-flex align-items-center gap-2">
          <span class="badge bg-info-subtle text-info border border-info-subtle px-2 py-1">
            <i class="bi bi-box-arrow-right me-1"></i>RealGrid (Grip Column) ➔ 2 DIV Zones
          </span>
          <span class="small text-muted">
            미배정 모델 <strong class="text-primary">{{ poolCount }}</strong>개 · 배정 완료 <strong class="text-success">{{ assignedCount }}</strong>개
          </span>
        </div>

        <div class="d-flex align-items-center gap-2 ms-auto flex-wrap">
          <!-- Add Random Data Button -->
          <button class="btn btn-outline-primary btn-sm" title="랜덤 모델 20개 그리드에 추가" @click="appendMoreModels(20)">
            <i class="bi bi-plus-circle me-1"></i>
            <span>+ 20개 모델 추가</span>
          </button>

          <button class="btn-b2b-action" title="모든 DIV 배정 내역을 그리드로 초기화" @click="resetAll">
            <i class="bi bi-arrow-counterclockwise text-secondary me-0.5"></i>
            <span>전체 초기화</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Main Layout: Grid (Left) + 2 HTML DIV Drop Zones (Right) -->
    <div class="grid-to-div-layout">
      <!-- Left: RealGrid Component with Dedicated Drag Handle Column -->
      <div class="dnd-grid-card">
        <div class="dnd-card-head border-bottom bg-theme-subcard px-3 py-2 d-flex align-items-center justify-content-between">
          <span class="fw-bold b2b-text-sm"><i class="bi bi-grid-3x3-gap-fill text-primary me-1.5"></i>미배정 모델 Pool (이동 핸들 필드 포함)</span>
          <span class="badge bg-secondary-subtle text-secondary b2b-text-2xs">총 {{ poolCount }}개</span>
        </div>
        <div class="dnd-grid-wrapper" @mousedown.capture="onGridMouseDown">
          <RealGridCommonJs
            ref="poolGrid"
            grid-id="realgrid-official-grid-to-div-v2"
            height="100%"
            :fields="gridFields"
            :columns="gridColumns"
            :rows="users"
            :editable="false"
            :checkable="true"
            :show-row-number="true"
            :state-bar-visible="false"
            :use-footer="false"
            :sortable="true"
            :filterable="false"
            :show-column-picker="false"
            :show-saved-views="false"
            :group-panel-visible="false"
            fit-style="evenFill"
            :selection-style="selectionStyle"
            :toast="gridToast"
            @init="onGridInit"
          />
        </div>
      </div>

      <!-- Right: Target DIV Container (2 Zones: Top Multi, Bottom Single) -->
      <div class="dnd-div-container">
        <div
          v-for="zone in zoneDefs"
          :key="zone.key"
          class="target-div-card"
          :class="[
            zone.key === 'groupMulti' ? 'zone-multi' : 'zone-single',
            { 'is-hover': hoverZone === zone.key }
          ]"
          :data-zone="zone.key"
        >
          <!-- Header -->
          <div class="target-div-header" :style="{ borderLeftColor: zone.color }">
            <div>
              <div class="d-flex align-items-center gap-2">
                <span class="div-badge-dot" :style="{ background: zone.color }"></span>
                <span class="fw-bold b2b-text-sm">{{ zone.label }}</span>
                <span class="badge b2b-text-2xs" :class="zone.key === 'groupMulti' ? 'bg-primary-soft text-primary' : 'bg-warning-soft text-dark'">
                  {{ zone.badge }}
                </span>
              </div>
              <span class="b2b-text-2xs text-muted d-block mt-0.5">{{ zone.subText }}</span>
            </div>

            <span class="badge bg-secondary-soft text-dark rounded-pill b2b-text-2xs px-2.5 py-1 ms-2">
              {{ zones[zone.key].length }}개 모델
            </span>
          </div>

          <!-- Body -->
          <div class="target-div-body custom-scrollbar">
            <div v-if="zones[zone.key].length === 0" class="div-empty-msg">
              <i :class="zone.key === 'groupMulti' ? 'bi bi-layers text-primary' : 'bi bi-star text-warning'" class="fs-3 mb-1 opacity-75"></i>
              <span class="fw-medium b2b-text-xs text-secondary">
                {{ zone.key === 'groupMulti' ? '다중 선택된 모델들을 이 블록 영역으로 끌어오세요' : '대표 지정할 모델 1개를 이 영역으로 끌어오세요' }}
              </span>
            </div>

            <!-- Dropped Items -->
            <div
              v-for="(item, idx) in zones[zone.key]"
              :key="item.modelId"
              class="div-dropped-item"
              :class="{ 'item-rep': zone.key === 'representativeSingle' }"
            >
              <div class="d-flex align-items-center gap-2">
                <span v-if="zone.key === 'representativeSingle'" class="badge bg-warning text-dark b2b-text-2xs me-1">
                  <i class="bi bi-star-fill me-0.5"></i>대표
                </span>
                <span class="item-name fw-bold b2b-text-sm text-dark">{{ item.modelName }}</span>
                <span class="item-code b2b-text-2xs badge bg-light text-secondary border">{{ item.modelCode }}</span>
                <span class="item-dept b2b-text-xs text-muted ms-1">{{ item.category }} · {{ item.grade }}</span>
              </div>
              <button class="btn-return-grid" title="그리드로 되돌리기" @click="returnToGrid(zone.key, idx)">
                <i class="bi bi-x-lg"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import RealGridCommonJs from '@/components/RealGridCommonJs.vue'
import { showToast } from '@/utils/toastUtil.js'

export default {
  name: 'RealGridToDivGuidePage',
  components: { RealGridCommonJs },
  data() {
    return {
      poolCount: 0,
      hoverZone: null,
      selectionStyle: 'block',
      users: [],
      _lastSelectedRows: [],
      zoneDefs: [
        { 
          key: 'groupMulti', 
          label: '그룹 포함 모델 목록 (상단)', 
          badge: '다중 배정 (Multi)', 
          subText: '셀을 마우스로 블록 선택 후 핸들(⋮⋮)로 끌어다 놓으세요', 
          color: '#0d6efd',
          maxCount: null
        },
        { 
          key: 'representativeSingle', 
          label: '대표 모델 지정 (하단)', 
          badge: '단일 지정 (Single Max: 1)', 
          subText: '그룹을 대표할 단 1개의 모델만 지정 가능합니다', 
          color: '#fd7e14',
          maxCount: 1
        }
      ],
      zones: {
        groupMulti: [],
        representativeSingle: []
      },
      gridFields: [
        { fieldName: 'dragHandle', dataType: 'text' },
        { fieldName: 'modelId', dataType: 'text' },
        { fieldName: 'modelCode', dataType: 'text' },
        { fieldName: 'modelName', dataType: 'text' },
        { fieldName: 'category', dataType: 'text' },
        { fieldName: 'grade', dataType: 'text' },
        { fieldName: 'manufacturer', dataType: 'text' }
      ],
      gridColumns: [
        { 
          name: 'dragHandle', 
          fieldName: 'dragHandle', 
          width: 50, 
          header: { text: '⋮⋮' }, 
          styles: { textAlignment: 'center', background: '#f8fafc', fontBold: true } 
        },
        { name: 'modelCode', fieldName: 'modelCode', width: 110, header: { text: '모델 코드' }, styles: { textAlignment: 'center' } },
        { name: 'modelName', fieldName: 'modelName', width: 170, header: { text: '모델명' }, styles: { textAlignment: 'near' } },
        { name: 'category', fieldName: 'category', width: 110, header: { text: '카테고리' }, styles: { textAlignment: 'center' } },
        { name: 'grade', fieldName: 'grade', width: 80, header: { text: '등급' }, styles: { textAlignment: 'center' } },
        { name: 'manufacturer', fieldName: 'manufacturer', width: 110, header: { text: '제조사' }, styles: { textAlignment: 'center' } }
      ]
    }
  },
  computed: {
    assignedCount() {
      return this.zones.groupMulti.length + this.zones.representativeSingle.length
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

    generateModels(count = 35, offset = 0) {
      const categories = [
        { name: '센서/전자', prefix: 'SEN', mfrs: ['NexHub Tech', 'SensorMaster', 'IoT Labs'] },
        { name: '제어/동력', prefix: 'CTL', mfrs: ['Core Automation', 'PowerGrid Pro', 'RelayTech'] },
        { name: '검사/광학', prefix: 'VIS', mfrs: ['VisionSys Ltd', 'OpticPro Inc', 'NexHub Tech'] },
        { name: '통신/네트워크', prefix: 'NET', mfrs: ['NexHub Tech', 'NetLink Corp', 'Core Automation'] },
        { name: '구동/모터', prefix: 'MOT', mfrs: ['MotionWorks', 'ServoDrive Pro', 'DriveTech'] },
        { name: '전원/제어', prefix: 'PWR', mfrs: ['PowerGrid Pro', 'EnergyMax', 'Core Automation'] },
        { name: '로봇/액추에이터', prefix: 'ROB', mfrs: ['RoboTech Corp', 'MotionWorks', 'NexHub Tech'] }
      ]
      const grades = ['S Grade', 'A Grade', 'B Grade', 'C Grade']
      const modelNames = [
        '스마트 센서 모듈', '고성능 제어 릴레이', '비전 검사 카메라', '산업용 Gateway',
        '서보 모터 드라이버', '온습도 측정 모듈', '무선 PLC 아이솔레이터', '스마트 파워 패널',
        '스마트 가속도계', '고주파 트랜스미터', '초음파 변환기', '압력 제어 밸브',
        '광학 거리 측정기', '다채널 데이터 로거', '임베디드 시그널 컨트롤러', '안전 리미트 스위치',
        '스마트 인버터 모듈', '산업용 이더넷 스위치', '무선 온도 센서 Node', '고정밀 엔코더',
        '지능형 모터 컨트롤러', '비전 조명 컨트롤러', 'CAN 버스 트랜시버', '배터리 관리 BMS Unit',
        '스마트 유량계', '서보 밸브 드라이버', '디지털 IO 모듈', '노이즈 필터 유닛',
        '산업용 엣지 AI Box', '진동 분석 센서 Pro', '고전압 스위칭 릴레이', '무선 게이트웨이 Hub'
      ]

      const result = []
      for (let i = 1; i <= count; i++) {
        const idx = offset + i
        const cat = categories[(idx - 1) % categories.length]
        const nameBase = modelNames[(idx - 1) % modelNames.length]
        const subIndex = Math.floor((idx - 1) / modelNames.length) + 1
        const suffixChar = String.fromCharCode(65 + ((idx - 1) % 8))
        const subNum = ((idx * 7) % 90) + 10

        const modelCode = `MDL-${cat.prefix}-${100 + idx}`
        const modelName = subIndex > 1 ? `${nameBase} ${suffixChar}${subIndex}` : `${nameBase} ${suffixChar}${subNum}`
        const grade = grades[(idx * 3) % grades.length]
        const manufacturer = cat.mfrs[idx % cat.mfrs.length]

        result.push({
          dragHandle: '⋮⋮',
          modelId: `M${String(idx).padStart(3, '0')}`,
          modelCode,
          modelName,
          category: cat.name,
          grade,
          manufacturer
        })
      }
      return result
    },

    onGridInit({ gridView, dataProvider }) {
      this.gridView = gridView
      this.dataProvider = dataProvider
      this.dataProvider.softDeleting = false

      if (this.gridView) {
        this.gridView.setDisplayOptions({
          selectionStyle: this.selectionStyle,
          rowHoverType: 'row'
        })

        // 마우스 블록 선택 범위 실시간 보존
        const trackSelection = (grid) => {
          const selected = grid.getSelectedRows() || []
          if (selected.length > 1) {
            const sorted = Array.from(new Set(selected)).sort((a, b) => a - b)
            this._lastSelectedRows = sorted
            this._savedBlockRows = [...sorted]
          }
        }
        this.gridView.onSelectionEnded = trackSelection
        this.gridView.onSelectionChanged = trackSelection
      }

      this.syncPoolCount()
    },

    async loadUsers() {
      const initialModels = this.generateModels(35, 0)
      this.users = initialModels
      this.$nextTick(this.syncPoolCount)
    },

    appendMoreModels(count = 20) {
      if (!this.dataProvider) return
      const currentTotal = this.poolCount + this.assignedCount
      const newModels = this.generateModels(count, currentTotal)

      newModels.forEach(m => this.dataProvider.addRow(m))
      this.syncPoolCount()
      showToast(`신규 모델 ${count}개가 그리드에 새로 추가되었습니다. (현재 미배정: ${this.poolCount}개)`, { type: 'success' })
    },

    syncPoolCount() {
      this.poolCount = this.dataProvider ? this.dataProvider.getRowCount() : 0
    },

    // ---------- Mouse Drag Events from Grid to HTML DIV ----------
    onGridMouseDown(e) {
      if (e.button !== 0 || !this.gridView) return

      const gridEl = this.$refs.poolGrid?.$el || e.currentTarget
      const gridRect = gridEl.getBoundingClientRect()
      const selectedRows = this.resolveDragRows()

      this._press = {
        x: e.clientX,
        y: e.clientY,
        gridRect,
        initialSelectedRows: selectedRows,
        started: false
      }

      window.addEventListener('mousemove', this.onDocMouseMove)
      window.addEventListener('mouseup', this.onDocMouseUp)
    },

    onDocMouseMove(e) {
      if (!this._press) return

      const dx = e.clientX - this._press.x
      const dy = e.clientY - this._press.y
      const dist = Math.hypot(dx, dy)

      if (!this._press.started) {
        if (dist < 5) return

        const rect = this._press.gridRect
        const isPointerOutsideRight = e.clientX > rect.right - 10
        const isHeadingRight = dx > 15 && dx > Math.abs(dy)
        const isOverZone = !!this.getZoneAtPoint(e.clientX, e.clientY)
        const isAlreadySelectedBlock = this._press.initialSelectedRows.length > 1 && dist > 8

        const shouldStartDnd = isPointerOutsideRight || isHeadingRight || isOverZone || isAlreadySelectedBlock

        if (!shouldStartDnd) {
          return
        }

        const rows = (this._press.initialSelectedRows && this._press.initialSelectedRows.length > 0)
          ? this._press.initialSelectedRows
          : this.resolveDragRows()

        if (!rows || !rows.length) {
          this.endDragListeners()
          this._press = null
          return
        }

        this._press.started = true
        this._dragRows = rows
        document.body.style.userSelect = 'none'

        const items = rows.map(r => this.dataProvider.getJsonRow(r)).filter(Boolean)
        this.createGhost(rows.length, items)
      }

      this.moveGhost(e)
      this.updateHoverZone(e)
    },

    onDocMouseUp(e) {
      const wasDragging = this._press && this._press.started
      this.endDragListeners()
      this._press = null
      if (!wasDragging) return

      this.finishDrag(e)
      document.body.style.userSelect = ''
      this.removeGhost()
      this.hoverZone = null
    },

    endDragListeners() {
      window.removeEventListener('mousemove', this.onDocMouseMove)
      window.removeEventListener('mouseup', this.onDocMouseUp)
    },

    resolveDragRows() {
      if (!this.gridView) return []

      // 1. 체크바 선택 행들 (만약 활성화된 경우)
      const checked = this.gridView.getCheckedRows() || []
      if (checked.length > 0) {
        return Array.from(new Set(checked)).sort((a, b) => a - b)
      }

      // 2. 현재 마우스 블록 선택 행들
      const selected = this.gridView.getSelectedRows() || []
      if (selected.length > 1) {
        const sorted = Array.from(new Set(selected)).sort((a, b) => a - b)
        this._savedBlockRows = [...sorted]
        return sorted
      }

      // 3. 마우스 다운으로 포커스가 1개로 감소했더라도, 클릭한 행이 이전에 선택한 다중 블록(_savedBlockRows)에 포함되어 있다면 전체 유지!
      const cur = this.gridView.getCurrent()
      const currentRow = (selected.length === 1) ? selected[0] : (cur ? cur.dataRow : -1)

      if (currentRow >= 0 && this._savedBlockRows && this._savedBlockRows.length > 1) {
        if (this._savedBlockRows.includes(currentRow)) {
          return [...this._savedBlockRows]
        }
      }

      // 4. 그룹 헤더 행 드래그 지원: 클릭한 항목이 그룹 헤더인 경우 그 하위 모든 데이터 행들 추출!
      if (cur && cur.itemIndex >= 0) {
        const model = this.gridView.getModel(cur.itemIndex)
        if (model && model.type === 'group') {
          const childDataRows = []
          const totalItems = this.gridView.getItemCount()
          for (let i = cur.itemIndex + 1; i < totalItems; i++) {
            const m = this.gridView.getModel(i)
            if (!m) continue
            if (m.type === 'group' && m.parentId === model.parentId) break
            if (m.type === 'row' && m.dataRow >= 0) {
              childDataRows.push(m.dataRow)
            }
          }
          if (childDataRows.length > 0) {
            return Array.from(new Set(childDataRows)).sort((a, b) => a - b)
          }
        }
      }

      // 5. 최근 블록 선택 보존 fallback
      if (this._lastSelectedRows && this._lastSelectedRows.length > 1) {
        return [...this._lastSelectedRows]
      }

      if (selected.length === 1) {
        return selected
      }

      // 6. Selection API 범위 (fallback)
      const sel = this.gridView.getSelection()
      if (sel && sel.startRow !== undefined && sel.endRow !== undefined) {
        const start = Math.min(sel.startRow, sel.endRow)
        const end = Math.max(sel.startRow, sel.endRow)
        const rows = []
        for (let i = start; i <= end; i++) {
          if (i >= 0) rows.push(i)
        }
        if (rows.length > 0) {
          return Array.from(new Set(rows)).sort((a, b) => a - b)
        }
      }

      // 5. 단일 커서 선택 행
      return (cur && cur.dataRow >= 0) ? [cur.dataRow] : []
    },

    finishDrag(e) {
      const zoneKey = this.getZoneAtPoint(e.clientX, e.clientY)
      if (!zoneKey || !this.zones[zoneKey]) return

      const rows = this._dragRows
      if (!rows || !rows.length) return

      const items = rows.map(r => this.dataProvider.getJsonRow(r)).filter(Boolean)
      if (!items.length) return

      const zoneDef = this.zoneDefs.find(z => z.key === zoneKey)

      if (zoneKey === 'groupMulti') {
        // [상단 DIV] 다중 배정 영역
        this.zones.groupMulti.push(...items)
        this.dataProvider.removeRows(rows)

        const namesSummary = items.length <= 2 
          ? items.map(i => i.modelName).join(', ')
          : `${items[0].modelName} 외 ${items.length - 1}개`

        showToast(`${items.length}개 모델 (${namesSummary})이 '${zoneDef?.label}' 영역으로 이동되었습니다.`, { type: 'success' })
      } else if (zoneKey === 'representativeSingle') {
        // [하단 DIV] 단일 배정 영역 (최대 1개)
        if (items.length > 1) {
          const targetItem = items[0]
          const targetRowIndex = rows[0]

          let replaceNotice = ''
          if (this.zones.representativeSingle.length > 0) {
            const prevItem = this.zones.representativeSingle.pop()
            this.dataProvider.addRow(prevItem)
            replaceNotice = `기존 대표 모델 '${prevItem.modelName}'은(는) 그리드로 반환되고, `
          }

          this.zones.representativeSingle = [targetItem]
          this.dataProvider.removeRow(targetRowIndex)

          showToast(`대표 모델 영역은 단일 지정만 가능하므로, ${replaceNotice}'${targetItem.modelName}'만 대표 모델로 지정되었습니다. (나머지는 그리드 유지)`, { type: 'warning' })
        } else {
          const targetItem = items[0]
          const targetRowIndex = rows[0]

          let replaceNotice = ''
          if (this.zones.representativeSingle.length > 0) {
            const prevItem = this.zones.representativeSingle.pop()
            this.dataProvider.addRow(prevItem)
            replaceNotice = `기존 대표 모델 '${prevItem.modelName}'은(는) 그리드로 반환되고, `
          }

          this.zones.representativeSingle = [targetItem]
          this.dataProvider.removeRow(targetRowIndex)

          showToast(`${replaceNotice}'${targetItem.modelName}' 모델이 대표 모델로 지정되었습니다.`, { type: 'success' })
        }
      }

      if (this.gridView) {
        this.gridView.checkAll(false)
        this.gridView.clearSelection()
      }
      this._lastSelectedRows = []
      this.syncPoolCount()
    },

    getZoneAtPoint(x, y) {
      const el = document.elementFromPoint(x, y)
      const targetCard = el ? el.closest('.target-div-card') : null
      return targetCard ? targetCard.dataset.zone : null
    },

    updateHoverZone(e) {
      this.hoverZone = this.getZoneAtPoint(e.clientX, e.clientY)
    },

    createGhost(count, items = []) {
      const g = document.createElement('div')
      g.className = 'grid-to-div-ghost'

      let labelText = ''
      if (items.length > 0) {
        const firstName = items[0].modelName
        if (items.length === 1) {
          labelText = `<strong>${firstName}</strong> (${items[0].modelCode})`
        } else {
          labelText = `<strong>${firstName} 외 ${items.length - 1}개</strong> (총 ${count}개 모델)`
        }
      } else {
        labelText = `<strong>${count}개 모델 선택됨</strong>`
      }

      g.innerHTML = `<i class="bi bi-box-seam-fill me-1.5"></i><sup>모델 이동</sup> ${labelText}`
      document.body.appendChild(g)
      this._ghost = g
    },

    moveGhost(e) {
      if (this._ghost) {
        this._ghost.style.left = e.clientX + 14 + 'px'
        this._ghost.style.top = e.clientY + 14 + 'px'
      }
    },

    removeGhost() {
      if (this._ghost) {
        this._ghost.remove()
        this._ghost = null
      }
    },

    returnToGrid(zoneKey, idx) {
      const item = this.zones[zoneKey].splice(idx, 1)[0]
      if (!item) return
      delete item.dragHandle
      item.dragHandle = '⋮⋮'
      this.dataProvider.addRow(item)
      this.syncPoolCount()
      showToast(`'${item.modelName}' 모델을 다시 RealGrid로 복구했습니다.`, { type: 'info' })
    },

    resetAll() {
      const allItems = [...this.zones.groupMulti, ...this.zones.representativeSingle]
      if (!allItems.length) {
        showToast('DIV 영역에 배정된 모델이 없습니다.', { type: 'warning' })
        return
      }
      allItems.forEach(item => {
        item.dragHandle = '⋮⋮'
        this.dataProvider.addRow(item)
      })
      this.zones.groupMulti = []
      this.zones.representativeSingle = []
      this._lastSelectedRows = []
      this.syncPoolCount()
      showToast(`${allItems.length}개 모델 배정이 모두 RealGrid로 초기화되었습니다.`, { type: 'info' })
    }
  }
}
</script>

<style scoped>
.grid-to-div-layout {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 16px;
  min-height: 540px;
}

/* Left Grid Card */
.dnd-grid-card {
  display: flex;
  flex-direction: column;
  background: var(--b2b-color-bg-card, #fff);
  border: 1px solid var(--b2b-color-border, #e5e7eb);
  border-radius: 10px;
  overflow: hidden;
}
.dnd-grid-wrapper {
  flex: 1;
  cursor: grab;
}
.dnd-grid-wrapper:active {
  cursor: grabbing;
}

/* Right DIV Container */
.dnd-div-container {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.target-div-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--b2b-color-bg-card, #fff);
  border: 2px dashed var(--b2b-color-border, #d1d5db);
  border-radius: 10px;
  transition: all 0.15s ease-in-out;
  overflow: hidden;
  min-height: 220px;
}

.target-div-card.zone-multi {
  border-color: rgba(13, 110, 253, 0.3);
}

.target-div-card.zone-single {
  border-color: rgba(253, 126, 20, 0.4);
  background: rgba(253, 126, 20, 0.015);
}

.target-div-card.is-hover.zone-multi {
  border-color: #0d6efd !important;
  border-style: solid;
  background: rgba(13, 110, 253, 0.05);
  box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.15);
}

.target-div-card.is-hover.zone-single {
  border-color: #fd7e14 !important;
  border-style: solid;
  background: rgba(253, 126, 20, 0.08);
  box-shadow: 0 0 0 3px rgba(253, 126, 20, 0.2);
}

.target-div-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid var(--b2b-color-border, #e5e7eb);
  border-left: 4px solid #0d6efd;
  background: var(--b2b-color-bg-subcard, #f8fafc);
}

.div-badge-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.target-div-body {
  flex: 1;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
}

.div-empty-msg {
  margin: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: none;
  padding: 16px;
}

.div-dropped-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--b2b-color-bg-card, #fff);
  border: 1px solid var(--b2b-color-border, #e5e7eb);
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: transform 0.1s ease;
}

.div-dropped-item.item-rep {
  border-color: #fd7e14;
  background: #fffdfa;
  box-shadow: 0 2px 6px rgba(253, 126, 20, 0.12);
}

.btn-return-grid {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: #9ca3af;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s ease-in-out;
}

.btn-return-grid:hover {
  background-color: #fee2e2;
  color: #ef4444;
  transform: scale(1.05);
}

@media (max-width: 992px) {
  .grid-to-div-layout {
    grid-template-columns: 1fr;
  }
}
</style>

<!-- Floating Ghost Element Styling -->
<style>
.grid-to-div-ghost {
  position: fixed;
  z-index: 9999;
  pointer-events: none;
  background: linear-gradient(135deg, #0d6efd, #0b5ed7);
  color: #ffffff;
  font-size: 0.85rem;
  padding: 8px 14px;
  border-radius: 20px;
  box-shadow: 0 6px 20px rgba(13, 110, 253, 0.45);
  white-space: nowrap;
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}
</style>
