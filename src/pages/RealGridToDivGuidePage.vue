<template>
  <div class="b2b-page-container">
    <!-- Toolbar -->
    <div class="b2b-toolbar mb-3">
      <div class="d-flex align-items-center justify-content-end w-100 flex-wrap gap-2">
        <!-- Add Random Data Button -->
        <button class="btn btn-outline-primary btn-sm" title="랜덤 모델 20개 그리드에 추가" @click="appendMoreModels(20)">
          <i class="bi bi-plus-circle me-1"></i>
          <span>+ 20개 모델 추가</span>
        </button>

        <button class="btn-b2b-action" title="모든 그룹 배정 내역을 그리드로 초기화" @click="resetAll">
          <i class="bi bi-arrow-counterclockwise text-secondary me-0.5"></i>
          <span>전체 초기화</span>
        </button>
      </div>
    </div>

    <!-- Main Layout: Grid (Left) + Unified HTML DIV Drop Zone (Right) -->
    <div class="grid-to-div-layout">
      <!-- Left: RealGrid Component with Dedicated Drag Handle Column -->
      <div class="dnd-grid-card">
        <!-- Grid Header: Left Guide Popover (above No column) + Right Total Count (above manufacturer column) -->
        <div class="dnd-card-head border-bottom bg-theme-subcard px-3 py-2 d-flex align-items-center justify-content-between">
          <!-- Left: Guide Popover Button positioned above 'No' & Grip Column -->
          <div class="guide-tooltip-container" @mouseleave="showGuideTooltip = false">
            <button
              class="btn-guide-toggle"
              :class="{ 'is-active': showGuideTooltip }"
              title="사용 가이드 보기"
              @click="showGuideTooltip = !showGuideTooltip"
            >
              <i class="bi bi-question-circle-fill text-primary"></i>
              <span>가이드</span>
            </button>

            <!-- Floating Popover Tooltip -->
            <transition name="fade-tooltip">
              <div v-if="showGuideTooltip" class="guide-floating-popover shadow border rounded-3 p-3">
                <div class="d-flex align-items-center justify-content-between mb-2 pb-1 border-bottom">
                  <span class="fw-bold b2b-text-sm text-dark">
                    <i class="bi bi-info-circle-fill text-primary me-1.5"></i>모델 그룹화 &amp; 대표 지정 가이드
                  </span>
                  <button class="btn-close-popover" title="닫기" @click="showGuideTooltip = false">
                    <i class="bi bi-x-lg"></i>
                  </button>
                </div>
                <ul class="guide-steps-list m-0 p-0 b2b-text-xs text-secondary">
                  <li class="mb-1.5">
                    <strong class="text-dark">1. 다중 배정:</strong> 그리드 셀을 마우스로 끌어 <span class="text-primary fw-medium">다중 블록 선택</span> 후, 선택 영역을 그대로 잡고 우측 그룹 배정함으로 드롭합니다.
                  </li>
                  <li>
                    <strong class="text-dark">2. 대표 모델 지정:</strong> 배정된 목록에서 원하는 모델의 <span class="text-primary fw-medium">라디오 버튼</span>(행 전체 클릭 가능)을 선택하면 즉시 그룹 대표 모델로 전환됩니다. 대표는 그룹당 <strong class="text-dark">1개</strong>만 지정됩니다.
                  </li>
                </ul>
              </div>
            </transition>
          </div>

          <!-- Right: Total Count positioned above manufacturer column -->
          <span class="b2b-text-xs text-secondary">
            총 <strong class="text-primary fw-bold">{{ poolCount }}</strong>건
          </span>
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
            :checkable="false"
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

      <!-- Right: Unified Target DIV Container -->
      <div class="dnd-div-container">
        <div
          class="target-div-card unified-group-card"
          :class="{ 'is-hover': isHoverDropZone }"
          data-zone="groupUnified"
        >
          <!-- Header (Clean & Symmetric) -->
          <div class="dnd-card-head border-bottom bg-theme-subcard px-3 py-2 d-flex align-items-center justify-content-between">
            <span class="fw-bold b2b-text-sm">그룹 배정 목록</span>

            <span class="badge bg-secondary-subtle text-secondary b2b-text-2xs">
              총 {{ groupModels.length }}개
            </span>
          </div>

          <!-- Body -->
          <div class="target-div-body custom-scrollbar">
            <div v-if="groupModels.length === 0" class="div-empty-msg">
              <i class="bi bi-box-arrow-in-down text-primary fs-2 mb-2 opacity-75"></i>
              <span class="fw-bold b2b-text-sm text-dark mb-1">배정된 모델이 없습니다</span>
              <span class="b2b-text-xs text-muted text-center">
                좌측 그리드에서 모델들을 블록 선택한 후<br/>
                이 영역으로 끌어다 놓으세요.
              </span>
            </div>

            <!-- Dropped Items List (단일 선택: 대표 모델 = 라디오) -->
            <label
              v-for="item in groupModels"
              :key="item.modelId"
              class="div-dropped-item"
              :class="{ 'item-rep': item.modelId === repModelId }"
              :title="item.modelId === repModelId ? '현재 그룹의 대표 모델입니다' : item.modelName + ' 모델을 대표로 지정합니다'"
            >
              <!-- Representative Selector (single-select) -->
              <input
                type="radio"
                class="rep-radio"
                name="groupRepModel"
                :value="item.modelId"
                :checked="item.modelId === repModelId"
                @change="setRepresentative(item.modelId)"
              />

              <!-- Model Info -->
              <span class="item-main">
                <span class="item-name fw-bold b2b-text-sm text-dark text-truncate">
                  {{ item.modelName }}
                </span>
                <span class="item-code b2b-text-2xs badge bg-light text-secondary border flex-shrink-0">
                  {{ item.modelCode }}
                </span>
                <span class="item-dept b2b-text-xs text-muted flex-shrink-0">
                  {{ item.category }} · {{ item.grade }}
                </span>
              </span>

              <!-- Action: Return to Grid -->
              <button
                class="btn-return-grid"
                title="그리드로 되돌리기"
                @click.prevent.stop="returnToGrid(item.modelId)"
              >
                <i class="bi bi-x-lg"></i>
              </button>
            </label>
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
      showGuideTooltip: false,
      isHoverDropZone: false,
      selectionStyle: 'block',
      users: [],
      groupModels: [],
      repModelId: null,
      gridFields: [
        { fieldName: 'modelId', dataType: 'text' },
        { fieldName: 'modelCode', dataType: 'text' },
        { fieldName: 'modelName', dataType: 'text' },
        { fieldName: 'category', dataType: 'text' },
        { fieldName: 'grade', dataType: 'text' },
        { fieldName: 'manufacturer', dataType: 'text' }
      ],
      gridColumns: [
        { name: 'modelCode', fieldName: 'modelCode', width: 110, header: { text: '모델 코드' }, styles: { textAlignment: 'center' } },
        { name: 'modelName', fieldName: 'modelName', width: 170, header: { text: '모델명' }, styles: { textAlignment: 'near' } },
        { name: 'category', fieldName: 'category', width: 110, header: { text: '카테고리' }, styles: { textAlignment: 'center' } },
        { name: 'grade', fieldName: 'grade', width: 80, header: { text: '등급' }, styles: { textAlignment: 'center' } },
        { name: 'manufacturer', fieldName: 'manufacturer', width: 110, header: { text: '제조사' }, styles: { textAlignment: 'center' } }
      ]
    }
  },
  computed: {
    representativeModel() {
      if (!this.repModelId) return null
      return this.groupModels.find(m => m.modelId === this.repModelId) || null
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

        /*
         * RealGrid 는 셀을 누르는 순간 기존 블록 선택을 한 행으로 접어버린다.
         * 그래서 "블록을 잡아서 끌어내기"는 누르기 전에 기억해 둔 블록이 있어야 한다.
         *
         * 그 기억은 선택 이벤트로 갱신하지 않는다. 마우스를 누르고 있는 동안에는
         * RealGrid 가 선택을 계속 바꾸고(누르는 순간 접기, 끄는 동안 아래로 늘리기),
         * 그 통보가 우리 드래그 시작보다 먼저 올지 나중에 올지 정해져 있지 않다.
         * 대신 마우스를 뗀 시점에 '드래그가 아니었다면' 그때의 선택만 기억한다.
         * (onDocMouseUp 참고) 여기 핸들러는 키보드 선택처럼 누르지 않은 경우만 받는다.
         */
        this.gridView.onSelectionEnded = () => {
          if (this._press) return
          this.rememberBlockFromGrid()
        }
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
      const currentTotal = this.poolCount + this.groupModels.length
      const newModels = this.generateModels(count, currentTotal)

      newModels.forEach(m => this.dataProvider.addRow(m))
      this.syncPoolCount()
      showToast(`신규 모델 ${count}개가 그리드에 새로 추가되었습니다. (현재 미배정: ${this.poolCount}개)`, { type: 'success' })
    },

    syncPoolCount() {
      this.poolCount = this.dataProvider ? this.dataProvider.getRowCount() : 0
    },

    // ---------- Representative Model Management ----------
    setRepresentative(modelId) {
      const target = this.groupModels.find(m => m.modelId === modelId)
      if (!target) return
      this.repModelId = modelId
      showToast(`'${target.modelName}' 모델이 그룹의 대표 모델로 지정되었습니다.`, { type: 'success' })
    },

    // ---------- Mouse Drag Events from Grid to HTML DIV ----------
    onGridMouseDown(e) {
      if (e.button !== 0 || !this.gridView) return

      const gridEl = this.$refs.poolGrid?.$el || e.currentTarget
      const gridRect = gridEl.getBoundingClientRect()
      // capture 단계라 RealGrid 가 이번 클릭을 처리하기 전이다 = 누르기 직전의 선택 상태
      const preSelectedRows = this.snapshotSelectedRows()

      this._press = {
        x: e.clientX,
        y: e.clientY,
        gridRect,
        preSelectedRows,
        // 누르기 직전까지 기억해 둔 블록. 제스처 도중 무슨 일이 나도 이 값은 안 변한다.
        preBlockRows: [...(this._blockRows || [])],
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

        /*
         * 그리드 '안'에서의 움직임은 무조건 RealGrid 의 블록 선택이다.
         * 예전에는 dx > 15 만으로도 드래그가 시작돼서, 사용자가 행을 훑어 선택하는
         * 제스처를 우리가 가로챘다. 그러면 mouseup 이 '드래그였다'로 처리되어
         * 블록을 기억하는 경로가 통째로 건너뛰어졌다. (블록 이동이 안 되던 원인)
         *
         * 그래서 시작 조건은 '포인터가 그리드를 벗어났는가' 하나로 좁힌다.
         */
        const rect = this._press.gridRect
        const isPointerOutsideRight = e.clientX > rect.right - 10
        const isOverZone = this.checkIsOverDropZone(e.clientX, e.clientY)

        if (!isPointerOutsideRight && !isOverZone) {
          return
        }

        // 드래그 도중 늘어난 선택이 아니라, 누른 시점을 기준으로 대상 행을 확정한다
        const rows = this.resolveDragRows(this._press.preSelectedRows, this._press.preBlockRows)

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
      this.isHoverDropZone = this.checkIsOverDropZone(e.clientX, e.clientY)
    },

    onDocMouseUp(e) {
      const wasDragging = this._press && this._press.started
      this.endDragListeners()
      this._press = null

      if (!wasDragging) {
        // 끌지 않고 뗐다 = 순수 선택 제스처. 이때의 선택만 블록으로 기억한다.
        this.rememberBlockFromGrid()
        return
      }

      this.finishDrag(e)
      document.body.style.userSelect = ''
      this.removeGhost()
      this.isHoverDropZone = false
    },

    endDragListeners() {
      window.removeEventListener('mousemove', this.onDocMouseMove)
      window.removeEventListener('mouseup', this.onDocMouseUp)
    },

    /** 현재 선택을 블록 기억에 반영한다. 여러 행일 때만 유효하고, 단일 선택이면 비운다. */
    rememberBlockFromGrid() {
      const selected = this.snapshotSelectedRows()
      this._blockRows = selected.length > 1 ? selected : []
    },

    /** 누르기 직전의 블록 선택 스냅샷 */
    snapshotSelectedRows() {
      if (!this.gridView) return []
      const selected = this.gridView.getSelectedRows() || []
      return Array.from(new Set(selected)).sort((a, b) => a - b)
    },

    /*
     * 드래그로 옮길 데이터 행 목록.
     * 판단 근거는 두 가지뿐이다 - 누르기 직전의 블록 선택(preSelected)과 누른 행(anchor).
     * 드래그하는 동안 RealGrid 가 블록 선택을 아래로 늘리더라도 그 결과는 쓰지 않는다.
     * (한 행만 눌러서 끌었는데 아래 행까지 딸려오던 원인)
     */
    resolveDragRows(preSelected = [], preBlock = []) {
      if (!this.gridView) return []

      const cur = this.gridView.getCurrent()
      const anchor = (cur && cur.dataRow >= 0) ? cur.dataRow : -1

      // 누르기 직전 블록 = capture 스냅샷이 살아있으면 그것, 아니면 기억해 둔 블록
      const block = (preSelected.length > 1) ? preSelected : preBlock

      // 그룹 헤더를 누른 경우 하위 행 전체
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

      // 여러 행이 블록 선택된 상태에서 그 안쪽을 눌렀다면 블록 전체
      if (block.length > 1 && (anchor < 0 || block.includes(anchor))) {
        return [...block]
      }

      // 그 외에는 누른 행 하나만
      if (anchor >= 0) return [anchor]

      return block.length ? [...block] : []
    },

    finishDrag(e) {
      const isOver = this.checkIsOverDropZone(e.clientX, e.clientY)
      if (!isOver) return

      const rows = this._dragRows
      if (!rows || !rows.length) return

      const items = rows.map(r => this.dataProvider.getJsonRow(r)).filter(Boolean)
      if (!items.length) return

      // 그룹 목록에 추가
      this.groupModels.push(...items)
      this.dataProvider.removeRows(rows)

      // 아직 대표 모델이 없다면, 첫 번째 모델을 자동으로 대표로 지정
      if (!this.repModelId && this.groupModels.length > 0) {
        this.repModelId = this.groupModels[0].modelId
      }

      const namesSummary = items.length <= 2 
        ? items.map(i => i.modelName).join(', ')
        : `${items[0].modelName} 외 ${items.length - 1}개`

      showToast(`${items.length}개 모델 (${namesSummary})이 그룹 배정함으로 이동되었습니다.`, { type: 'success' })

      if (this.gridView) {
        this.gridView.clearSelection()
      }
      this._blockRows = []
      this.syncPoolCount()
    },

    checkIsOverDropZone(x, y) {
      const el = document.elementFromPoint(x, y)
      const targetCard = el ? el.closest('.target-div-card') : null
      return !!targetCard
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

    returnToGrid(modelId) {
      const idx = this.groupModels.findIndex(m => m.modelId === modelId)
      if (idx < 0) return
      const item = this.groupModels.splice(idx, 1)[0]
      if (!item) return

      // 삭제한 항목이 대표 모델이었던 경우, 남아있는 모델 중 첫 번째를 새 대표로 자동 승격
      if (this.repModelId === item.modelId) {
        this.repModelId = this.groupModels.length > 0 ? this.groupModels[0].modelId : null
      }

      this.dataProvider.addRow(item)
      this.syncPoolCount()
    },

    resetAll() {
      if (!this.groupModels.length) {
        showToast('그룹 영역에 배정된 모델이 없습니다.', { type: 'warning' })
        return
      }
      this.groupModels.forEach(item => {
        this.dataProvider.addRow(item)
      })
      const count = this.groupModels.length
      this.groupModels = []
      this.repModelId = null
      this._blockRows = []
      this.syncPoolCount()
      showToast(`${count}개 모델 배정이 모두 RealGrid로 초기화되었습니다.`, { type: 'info' })
    }
  }
}
</script>

<style scoped>
.grid-to-div-layout {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  grid-template-rows: minmax(0, 1fr);
  gap: 16px;
  /* 페이지 컨테이너(.b2b-page-container) 높이에 맞춰 채우고,
     넘치는 목록은 카드 내부에서 스크롤시킨다 */
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
}

/* Left Grid Card */
.dnd-grid-card {
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: var(--b2b-color-bg-card, #fff);
  border: 1px solid var(--b2b-color-border, #e5e7eb);
  border-radius: 10px;
  overflow: hidden;
}
.dnd-grid-wrapper {
  flex: 1;
  min-height: 0;
  cursor: grab;
}
.dnd-grid-wrapper:active {
  cursor: grabbing;
}

/* Right DIV Container */
.dnd-div-container {
  display: flex;
  flex-direction: column;
  min-height: 0;
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
  min-height: 0;
}

.target-div-card.unified-group-card {
  border-color: rgba(13, 110, 253, 0.35);
  background: rgba(13, 110, 253, 0.015);
}

.target-div-card.is-hover {
  border-color: var(--b2b-color-primary) !important;
  border-style: solid;
  background: rgba(13, 110, 253, 0.06) !important;
  box-shadow: 0 0 0 4px rgba(13, 110, 253, 0.15);
}

.target-div-body {
  flex: 1;
  min-height: 0;
  padding: 12px;
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
  padding: 24px;
}

/* Dropped Item Card (label 전체가 대표 선택 히트영역) */
.div-dropped-item {
  position: relative;
  display: grid;
  grid-template-columns: 16px minmax(0, 1fr) 24px;
  align-items: center;
  gap: 10px;
  margin: 0;
  cursor: pointer;
  padding: 8px 12px;
  background: var(--b2b-color-bg-card, #fff);
  border: 1px solid var(--b2b-color-border, #e5e7eb);
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: all 0.15s ease-in-out;
}

.div-dropped-item:hover {
  border-color: var(--b2b-color-border-hover, #cbd5e1);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
}

/* 키보드 포커스(방향키 이동) 시각화 */
.div-dropped-item:focus-within {
  border-color: var(--b2b-color-primary, #3b82f6);
  box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.14);
}

.item-main {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

/* Representative Radio (single-select) */
.rep-radio {
  width: 15px;
  height: 15px;
  margin: 0;
  cursor: pointer;
}

/* Active Representative Model Item (색 강조 없음 - 라디오 선택 상태로만 표시) */
.div-dropped-item.item-rep {
  cursor: default;
}

.btn-return-grid {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: var(--b2b-color-text-faint);
  border-radius: 6px;
  font-size: var(--b2b-font-size-body);
  cursor: pointer;
  transition: all 0.15s ease-in-out;
}

.btn-return-grid:hover {
  background-color: rgba(239, 68, 68, 0.14);
  color: #EF4444;
  transform: scale(1.05);
}

@media (max-width: 992px) {
  .grid-to-div-layout {
    grid-template-columns: 1fr;
    grid-template-rows: none;
    grid-auto-rows: minmax(320px, auto);
    overflow-y: auto;
  }
}

/* Guide Floating Tooltip Popover */
.guide-tooltip-container {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.btn-guide-toggle {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: var(--b2b-color-bg-subcard, #f1f5f9);
  border: 1px solid var(--b2b-color-border, #e2e8f0);
  color: var(--b2b-color-text-sub, #64748b);
  font-size: 0.75rem;
  font-weight: 500;
  padding: 3px 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-guide-toggle:hover,
.btn-guide-toggle.is-active {
  background: var(--b2b-color-primary-soft, #eff6ff);
  border-color: var(--b2b-color-primary, #3b82f6);
  color: var(--b2b-color-primary, #2563eb);
}

.guide-floating-popover {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  z-index: 1050;
  width: 400px;
  background: var(--b2b-color-bg-card, #ffffff);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08);
}

.guide-steps-list {
  list-style: none;
}

.btn-close-popover {
  border: none;
  background: transparent;
  color: var(--b2b-color-text-faint, #94a3b8);
  font-size: 0.75rem;
  padding: 0;
  cursor: pointer;
}

.btn-close-popover:hover {
  color: var(--b2b-color-text-main, #0f172a);
}

.fade-tooltip-enter-active,
.fade-tooltip-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.fade-tooltip-enter-from,
.fade-tooltip-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>

<!-- Floating Ghost Element Styling -->
<style>
/*
 * 이 페이지 한정 레이아웃 보정.
 * 앱 셸(html/body/.vben-layout)이 뷰포트 높이에 묶여 있지 않아
 * .b2b-page-container 의 height:100% 가 실제로는 내용 높이를 따라간다.
 * 그래서 배정 목록이 길어지면 카드가 무한정 늘어나고 내부 스크롤이 생기지 않는다.
 * :has() 로 이 페이지에서만 컨테이너를 뷰포트 높이에 고정한다.
 * 180px = 컨테이너 상단 오프셋(앱 헤더 + main 패딩 + 전역 PageHeader) + 하단 여백
 */
.b2b-page-container:has(.grid-to-div-layout) {
  height: calc(100vh - 180px);
  min-height: 380px;
}

.grid-to-div-ghost {
  position: fixed;
  z-index: 9999;
  pointer-events: none;
  background: linear-gradient(135deg, var(--b2b-color-primary), var(--b2b-color-primary-hover));
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
