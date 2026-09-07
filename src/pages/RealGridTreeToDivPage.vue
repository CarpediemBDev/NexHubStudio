<template>
  <div class="b2b-page-container">
    <!-- Toolbar -->
    <div class="b2b-toolbar mb-3">
      <div class="d-flex align-items-center justify-content-end w-100 flex-wrap gap-2">
        <button class="btn btn-outline-primary btn-sm" title="랜덤 모델 20개 트리에 추가" @click="appendMoreModels(20)">
          <i class="bi bi-plus-circle me-1"></i>
          <span>+ 20개 모델 추가</span>
        </button>

        <!-- 방식 2: 체크 → 버튼으로 우측 이동 -->
        <button
          class="btn-b2b-primary"
          :disabled="checkedCount === 0"
          title="좌측 트리에서 체크한 모델을 우측 그룹 배정함으로 옮깁니다"
          @click="assignChecked"
        >
          <i class="bi bi-arrow-right-circle me-0.5"></i>
          <span>체크 항목 배정</span>
          <span v-if="checkedCount > 0" class="badge bg-white text-primary ms-1">{{ checkedCount }}</span>
        </button>

        <button class="btn-b2b-action" title="모든 그룹 배정 내역을 트리로 초기화" @click="resetAll">
          <i class="bi bi-arrow-counterclockwise text-secondary me-0.5"></i>
          <span>전체 초기화</span>
        </button>
      </div>
    </div>

    <!-- Main Layout: Tree Grid (Left) + HTML DIV Drop Zone (Right) -->
    <div class="tree-to-div-layout">
      <!-- Left: RealGrid TreeView -->
      <div class="dnd-grid-card">
        <div class="dnd-card-head border-bottom bg-theme-subcard px-3 py-2 d-flex align-items-center justify-content-between">
          <!-- Left: Guide Popover -->
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

            <transition name="fade-tooltip">
              <div v-if="showGuideTooltip" class="guide-floating-popover shadow border rounded-3 p-3">
                <div class="d-flex align-items-center justify-content-between mb-2 pb-1 border-bottom">
                  <span class="fw-bold b2b-text-sm text-dark">
                    <i class="bi bi-diagram-3-fill text-primary me-1.5"></i>트리 모델 그룹화 가이드
                  </span>
                  <button class="btn-close-popover" title="닫기" @click="showGuideTooltip = false">
                    <i class="bi bi-x-lg"></i>
                  </button>
                </div>
                <ul class="guide-steps-list m-0 p-0 b2b-text-xs text-secondary">
                  <li class="mb-1.5">
                    <strong class="text-dark">방식 1 · 드래그 &amp; 드롭:</strong>
                    트리의 모델 행을 잡고 우측 배정함으로 끌어다 놓습니다.
                    여러 행을 <span class="text-primary fw-medium">블록 선택</span>한 뒤 그 안쪽을 잡고 끌면 한 번에 옮겨집니다.
                  </li>
                  <li class="mb-1.5">
                    <strong class="text-dark">방식 2 · 체크 후 버튼:</strong>
                    좌측 <span class="text-primary fw-medium">체크박스</span>로 모델을 고르고 상단
                    <span class="text-primary fw-medium">[체크 항목 배정]</span> 버튼을 누릅니다.
                    행을 <span class="text-primary fw-medium">블록으로 훑으면</span> 그 안의 모델이 자동으로 체크되며,
                    앞서 체크한 항목은 그대로 유지됩니다.
                  </li>
                  <li class="mb-1.5">
                    <strong class="text-dark">배정 단위는 모델:</strong>
                    <span class="text-primary fw-medium">카테고리 행</span>은 분류 라벨이라 체크·배정 대상이 아닙니다.
                    블록에 카테고리가 섞여도 모델만 선택됩니다.
                  </li>
                  <li>
                    <strong class="text-dark">대표 모델 지정:</strong>
                    배정 목록은 <span class="text-primary fw-medium">카테고리별로 묶여</span> 표시됩니다.
                    각 그룹 안에서 <span class="text-primary fw-medium">라디오 버튼</span>(행 전체 클릭 가능)을 선택하면
                    즉시 대표 모델로 전환되며, 대표는 <strong class="text-dark">카테고리마다 1개</strong>씩 지정됩니다.
                  </li>
                </ul>
              </div>
            </transition>
          </div>

          <span class="b2b-text-xs text-secondary">
            미배정 <strong class="text-primary fw-bold">{{ poolCount }}</strong>건 · 카테고리 {{ treeRows.length }}개
          </span>
        </div>

        <div
          class="dnd-grid-wrapper"
          :class="{ 'is-block-drag': isBlockDrag }"
          @pointerdown.capture="onGridPointerDown"
          @mousedown.capture="onGridMouseDown"
        >
          <RealGridTreeJs
            ref="treeGrid"
            grid-id="realgrid-tree-to-div-v1"
            height="100%"
            :fields="gridFields"
            :columns="gridColumns"
            :rows="treeRows"
            children-field="children"
            :editable="false"
            :insertable="false"
            :checkable="true"
            :show-row-number="true"
            :state-bar-visible="false"
            :use-footer="false"
            :sortable="false"
            :filterable="false"
            :show-column-picker="false"
            :show-saved-views="false"
            :draggable="false"
            :pinnable="false"
            :auto-expand-all="true"
            :tree-line-visible="true"
            :check-bar-width="34"
            :toast="gridToast"
            @init="onGridInit"
          />
        </div>
      </div>

      <!-- Right: Target DIV Container -->
      <div class="dnd-div-container">
        <div
          class="target-div-card unified-group-card"
          :class="{ 'is-hover': isHoverDropZone }"
          data-zone="groupUnified"
        >
          <div class="dnd-card-head border-bottom bg-theme-subcard px-3 py-2 d-flex align-items-center justify-content-between">
            <span class="fw-bold b2b-text-sm">그룹 배정 목록</span>
            <span class="badge bg-secondary-subtle text-secondary b2b-text-2xs">
              카테고리 {{ groupedAssignments.length }} · 총 {{ groupModels.length }}개
            </span>
          </div>

          <div class="target-div-body custom-scrollbar">
            <div v-if="groupModels.length === 0" class="div-empty-msg">
              <i class="bi bi-box-arrow-in-down text-primary fs-2 mb-2 opacity-75"></i>
              <span class="fw-bold b2b-text-sm text-dark mb-1">배정된 모델이 없습니다</span>
              <span class="b2b-text-xs text-muted text-center">
                좌측 트리에서 모델을 끌어다 놓거나,<br/>
                체크 후 [체크 항목 배정] 버튼을 누르세요.
              </span>
            </div>

            <!-- 배정 목록: 카테고리별 그룹. 대표 모델(라디오)은 그룹마다 1개 -->
            <div
              v-for="group in groupedAssignments"
              :key="group.category"
              class="div-group-block"
            >
              <div class="div-group-head">
                <span class="group-name b2b-text-xs fw-bold text-dark text-truncate">
                  {{ group.category }}
                </span>
                <span class="group-count b2b-text-2xs badge bg-secondary-subtle text-secondary flex-shrink-0">
                  {{ group.models.length }}
                </span>
              </div>

              <label
                v-for="item in group.models"
                :key="item.modelId"
                class="div-dropped-item"
                :class="{ 'item-rep': item.modelId === repByCategory[group.category] }"
                :title="item.modelId === repByCategory[group.category]
                  ? group.category + ' 그룹의 대표 모델입니다'
                  : item.modelName + ' 모델을 ' + group.category + ' 그룹의 대표로 지정합니다'"
              >
                <!-- 라디오 그룹을 카테고리마다 분리해야 그룹별로 하나씩 켜진다 -->
                <input
                  type="radio"
                  class="rep-radio"
                  :name="'treeGroupRep_' + group.category"
                  :value="item.modelId"
                  :checked="item.modelId === repByCategory[group.category]"
                  @change="setRepresentative(group.category, item.modelId)"
                />

                <span class="item-main">
                  <span class="item-name fw-bold b2b-text-sm text-dark text-truncate">
                    {{ item.modelName }}
                  </span>
                  <span class="item-code b2b-text-2xs badge bg-light text-secondary border flex-shrink-0">
                    {{ item.modelCode }}
                  </span>
                  <span class="item-dept b2b-text-xs text-muted flex-shrink-0">
                    {{ item.grade }}
                  </span>
                </span>

                <button
                  class="btn-return-grid"
                  title="트리로 되돌리기"
                  @click.prevent.stop="returnToTree(item.modelId)"
                >
                  <i class="bi bi-x-lg"></i>
                </button>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import RealGridTreeJs from '@/components/RealGridTreeJs.vue'
import { showToast } from '@/utils/toastUtil.js'

const CATEGORY_DEFS = [
  { name: '센서/전자', prefix: 'SEN', mfrs: ['NexHub Tech', 'SensorMaster', 'IoT Labs'] },
  { name: '제어/동력', prefix: 'CTL', mfrs: ['Core Automation', 'PowerGrid Pro', 'RelayTech'] },
  { name: '검사/광학', prefix: 'VIS', mfrs: ['VisionSys Ltd', 'OpticPro Inc', 'NexHub Tech'] },
  { name: '통신/네트워크', prefix: 'NET', mfrs: ['NexHub Tech', 'NetLink Corp', 'Core Automation'] },
  { name: '구동/모터', prefix: 'MOT', mfrs: ['MotionWorks', 'ServoDrive Pro', 'DriveTech'] },
  { name: '전원/제어', prefix: 'PWR', mfrs: ['PowerGrid Pro', 'EnergyMax', 'Core Automation'] },
  { name: '로봇/액추에이터', prefix: 'ROB', mfrs: ['RoboTech Corp', 'MotionWorks', 'NexHub Tech'] }
]

const GRADES = ['S Grade', 'A Grade', 'B Grade', 'C Grade']

const MODEL_NAMES = [
  '스마트 센서 모듈', '고성능 제어 릴레이', '비전 검사 카메라', '산업용 Gateway',
  '서보 모터 드라이버', '온습도 측정 모듈', '무선 PLC 아이솔레이터', '스마트 파워 패널',
  '스마트 가속도계', '고주파 트랜스미터', '초음파 변환기', '압력 제어 밸브',
  '광학 거리 측정기', '다채널 데이터 로거', '임베디드 시그널 컨트롤러', '안전 리미트 스위치',
  '스마트 인버터 모듈', '산업용 이더넷 스위치', '무선 온도 센서 Node', '고정밀 엔코더',
  '지능형 모터 컨트롤러', '비전 조명 컨트롤러', 'CAN 버스 트랜시버', '배터리 관리 BMS Unit',
  '스마트 유량계', '서보 밸브 드라이버', '디지털 IO 모듈', '노이즈 필터 유닛',
  '산업용 엣지 AI Box', '진동 분석 센서 Pro', '고전압 스위칭 릴레이', '무선 게이트웨이 Hub'
]

export default {
  name: 'RealGridTreeToDivPage',
  components: { RealGridTreeJs },
  data() {
    return {
      showGuideTooltip: false,
      isHoverDropZone: false,
      isBlockDrag: false,
      selectionStyle: 'block',
      // 전체 모델 원본(평면). 트리는 이 목록에서 매번 다시 만든다.
      catalog: [],
      // 우측 배정 목록(순서 유지)
      groupModels: [],
      // 대표 모델은 카테고리마다 1개 — { '센서/전자': 'M001', ... }
      repByCategory: {},
      checkedCount: 0,
      gridFields: [
        { fieldName: 'nodeType', dataType: 'text' },
        { fieldName: 'modelId', dataType: 'text' },
        { fieldName: 'modelCode', dataType: 'text' },
        { fieldName: 'modelName', dataType: 'text' },
        { fieldName: 'category', dataType: 'text' },
        { fieldName: 'grade', dataType: 'text' },
        { fieldName: 'manufacturer', dataType: 'text' }
      ],
      gridColumns: [
        { name: 'modelName', fieldName: 'modelName', width: 260, header: { text: '카테고리 / 모델명' }, styles: { textAlignment: 'near' } },
        { name: 'modelCode', fieldName: 'modelCode', width: 120, header: { text: '모델 코드' }, styles: { textAlignment: 'center' } },
        { name: 'grade', fieldName: 'grade', width: 90, header: { text: '등급' }, styles: { textAlignment: 'center' } },
        { name: 'manufacturer', fieldName: 'manufacturer', width: 130, header: { text: '제조사' }, styles: { textAlignment: 'center' } }
      ]
    }
  },
  computed: {
    catalogMap() {
      const map = new Map()
      this.catalog.forEach(m => map.set(m.modelId, m))
      return map
    },
    assignedIdSet() {
      return new Set(this.groupModels.map(m => m.modelId))
    },
    poolModels() {
      return this.catalog.filter(m => !this.assignedIdSet.has(m.modelId))
    },
    poolCount() {
      return this.poolModels.length
    },
    /*
     * 배정 목록을 카테고리별로 묶는다. 그룹 순서는 CATEGORY_DEFS 를 따라
     * 좌측 트리와 같게 맞춘다. 대표 모델은 여기 담지 않는다 —
     * repByCategory 를 참조하면 syncRepresentatives 가 자기 자신을 다시 계산하게 된다.
     */
    groupedAssignments() {
      const byCategory = new Map()
      this.groupModels.forEach(m => {
        if (!byCategory.has(m.category)) byCategory.set(m.category, [])
        byCategory.get(m.category).push(m)
      })
      return CATEGORY_DEFS
        .filter(cat => byCategory.has(cat.name))
        .map(cat => ({ category: cat.name, models: byCategory.get(cat.name) }))
    },
    /*
     * 트리는 상태(전체 모델 - 배정 목록)에서 매번 통째로 다시 만든다.
     * RealGrid 트리 노드를 직접 지우고 붙이면 부모가 빈 카테고리로 남거나
     * dataRow 인덱스가 어긋나는데, 다시 만들면 그 경우의 수가 아예 없다.
     * RealGridTreeJs 는 rows prop 을 deep watch 하므로 이 값만 바뀌면 트리가 갱신된다.
     */
    treeRows() {
      const byCategory = new Map()
      this.poolModels.forEach(m => {
        if (!byCategory.has(m.category)) byCategory.set(m.category, [])
        byCategory.get(m.category).push(m)
      })

      const rows = []
      CATEGORY_DEFS.forEach(cat => {
        const models = byCategory.get(cat.name)
        if (!models || models.length === 0) return
        rows.push({
          nodeType: 'category',
          modelId: '',
          modelCode: `${models.length}개`,
          modelName: cat.name,
          category: cat.name,
          grade: '',
          manufacturer: '',
          /*
           * 잎(모델) 노드에는 children 키를 아예 넣지 않는다.
           * setNestedRows 의 childrenProp 은 '자식이 있는지를 지시하는 속성'이라
           * 빈 배열 children: [] 도 "자식 있음"으로 읽혀 잎에까지 펼침 화살표가 그려진다.
           * 키가 없어야 RealGrid 가 잎으로 보고 화살표 자리를 비운다.
           */
          children: models.map(m => ({
            nodeType: 'model',
            modelId: m.modelId,
            modelCode: m.modelCode,
            modelName: m.modelName,
            category: m.category,
            grade: m.grade,
            manufacturer: m.manufacturer
          }))
        })
      })
      return rows
    }
  },
  mounted() {
    this.catalog = this.generateModels(35, 0)
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
      const result = []
      for (let i = 1; i <= count; i++) {
        const idx = offset + i
        const cat = CATEGORY_DEFS[(idx - 1) % CATEGORY_DEFS.length]
        const nameBase = MODEL_NAMES[(idx - 1) % MODEL_NAMES.length]
        const subIndex = Math.floor((idx - 1) / MODEL_NAMES.length) + 1
        const suffixChar = String.fromCharCode(65 + ((idx - 1) % 8))
        const subNum = ((idx * 7) % 90) + 10

        result.push({
          modelId: `M${String(idx).padStart(3, '0')}`,
          modelCode: `MDL-${cat.prefix}-${100 + idx}`,
          modelName: subIndex > 1 ? `${nameBase} ${suffixChar}${subIndex}` : `${nameBase} ${suffixChar}${subNum}`,
          category: cat.name,
          grade: GRADES[(idx * 3) % GRADES.length],
          manufacturer: cat.mfrs[idx % cat.mfrs.length]
        })
      }
      return result
    },

    appendMoreModels(count = 20) {
      const newModels = this.generateModels(count, this.catalog.length)
      this.catalog = this.catalog.concat(newModels)
      this.resetCheckState()
      showToast(`신규 모델 ${count}개가 트리에 추가되었습니다. (현재 미배정: ${this.poolCount}개)`, { type: 'success' })
    },

    onGridInit({ gridView, dataProvider }) {
      this.gridView = gridView
      this.dataProvider = dataProvider

      gridView.setDisplayOptions({
        selectionStyle: this.selectionStyle,
        rowHoverType: 'row'
      })

      // 카테고리 행을 한눈에 구분한다. RealGrid 는 클래스의 computed 스타일을 읽으므로
      // 이 클래스는 전역(non-scoped) CSS 에 있어야 한다.
      gridView.setRowStyleCallback((grid, item) => {
        const info = this.nodeInfo(item && item.dataRow)
        return info && info.nodeType === 'category' ? 'rg-tree-category-row' : undefined
      })

      /*
       * 배정 대상은 모델뿐이다. 카테고리는 분류 라벨이라 체크 자체를 막는다.
       * 이렇게 해야 "고른 것 = 체크된 것"이 항상 일치한다. 부모를 체크 가능하게 두면
       * 체크바가 2상태뿐이라 '일부만 체크'를 표현하지 못해 개수가 어긋나 보인다.
       */
      gridView.setCheckBar({
        visible: true,
        width: 34,
        exclusive: false,
        head: 'check',
        checkableCallback: (dataSource, item) => {
          const info = this.nodeInfo(item && item.dataRow)
          return !!(info && info.nodeType === 'model')
        }
      })

      gridView.onItemChecked = () => this.syncCheckedCount()
      gridView.onItemAllChecked = () => {
        this.$nextTick(this.syncCheckedCount)
      }

      /*
       * RealGrid 는 셀을 누르는 순간 기존 블록 선택을 한 행으로 접어버린다.
       * 그래서 "블록을 잡아서 끌어내기"는 누르기 전에 기억해 둔 블록이 있어야 한다.
       * 누르고 있는 동안에는 그리드가 선택을 계속 바꾸므로(누르는 순간 접기,
       * 끄는 동안 늘리기) 그 통보는 쓰지 않는다. 끌지 않고 뗀 시점의 선택만 기억한다.
       * (onDocMouseUp 참고) 이 핸들러는 키보드 선택처럼 누르지 않은 경우만 받는다.
       */
      gridView.onSelectionEnded = () => {
        if (this._press) return
        this.rememberBlockFromGrid()
      }
    },

    // ---------- 노드 조회 헬퍼 ----------
    /** dataRow → 노드 값. 트리 provider 의 getJsonRow 는 하위까지 묶어 주므로 재귀를 끈다. */
    nodeInfo(dataRow) {
      if (!this.dataProvider || dataRow == null || dataRow < 0) return null
      try {
        return this.dataProvider.getJsonRow(dataRow, false, false) || null
      } catch (e) {
        return null
      }
    },

    /**
     * dataRow 목록 → 실제로 옮길 모델 ID 목록.
     * 배정 단위는 모델뿐이라 카테고리 행은 그냥 걸러낸다. 블록에 카테고리가
     * 섞여 들어와도 개수가 늘지 않는다. 중복은 Set 으로 제거한다.
     */
    rowsToModelIds(dataRows) {
      if (!this.dataProvider) return []
      const ids = []
      const seen = new Set()

      ;(dataRows || []).forEach(row => {
        const info = this.nodeInfo(row)
        if (!info || info.nodeType !== 'model' || !info.modelId) return
        if (seen.has(info.modelId)) return
        seen.add(info.modelId)
        ids.push(info.modelId)
      })

      return ids
    },

    // ---------- 방식 2: 체크박스 + 버튼 ----------
    checkedModelIds() {
      if (!this.gridView) return []
      let rows = []
      try {
        // TreeView.getCheckedRows(visibleOnly) — 접혀 있는 노드도 포함해야 한다
        rows = this.gridView.getCheckedRows(false) || []
      } catch (e) {
        rows = []
      }
      return this.rowsToModelIds(rows)
    },

    syncCheckedCount() {
      this.checkedCount = this.checkedModelIds().length
    },

    /** 트리를 다시 그리면 체크 상태는 사라진다. 카운트와 블록 기억도 같이 맞춘다. */
    resetCheckState() {
      this.checkedCount = 0
      this._blockRows = []
      this._prePress = null
    },

    assignChecked() {
      const ids = this.checkedModelIds()
      if (!ids.length) {
        showToast('배정할 모델을 좌측 트리에서 체크해 주세요.', { type: 'warning' })
        return
      }
      this.assignModels(ids)
    },

    // ---------- 공통 배정 ----------
    assignModels(modelIds) {
      const added = []
      modelIds.forEach(id => {
        if (this.assignedIdSet.has(id)) return
        const model = this.catalogMap.get(id)
        if (model) {
          this.groupModels.push(model)
          added.push(model)
        }
      })

      if (!added.length) return 0

      // 새로 생긴 카테고리 그룹에 대표를 채운다
      this.syncRepresentatives()

      const summary = added.length <= 2
        ? added.map(m => m.modelName).join(', ')
        : `${added[0].modelName} 외 ${added.length - 1}개`
      showToast(`${added.length}개 모델 (${summary})이 그룹 배정함으로 이동되었습니다.`, { type: 'success' })

      if (this.gridView) {
        try { this.gridView.clearSelection() } catch (e) { /* noop */ }
      }
      this.resetCheckState()
      return added.length
    },

    returnToTree(modelId) {
      const idx = this.groupModels.findIndex(m => m.modelId === modelId)
      if (idx < 0) return
      const item = this.groupModels.splice(idx, 1)[0]
      if (!item) return

      // 되돌린 항목이 그 그룹의 대표였다면 같은 그룹의 첫 모델로 승계한다.
      // 그룹이 통째로 비었으면 대표 자리도 함께 사라진다. (syncRepresentatives)
      this.syncRepresentatives()
      this.resetCheckState()
    },

    resetAll() {
      if (!this.groupModels.length) {
        showToast('그룹 영역에 배정된 모델이 없습니다.', { type: 'warning' })
        return
      }
      const count = this.groupModels.length
      this.groupModels = []
      this.repByCategory = {}
      this.resetCheckState()
      showToast(`${count}개 모델 배정이 모두 트리로 초기화되었습니다.`, { type: 'info' })
    },

    /**
     * 카테고리마다 대표가 정확히 1개 있도록 맞춘다.
     * 기존 대표가 그 그룹에 그대로 남아있으면 유지하고, 빠졌거나 없으면 첫 모델로 채운다.
     * 남은 모델이 없는 카테고리는 새 객체에 아예 담기지 않아 대표 자리도 같이 정리된다.
     */
    syncRepresentatives() {
      const next = {}
      this.groupedAssignments.forEach(group => {
        const current = this.repByCategory[group.category]
        const stillThere = current && group.models.some(m => m.modelId === current)
        next[group.category] = stillThere ? current : group.models[0].modelId
      })
      this.repByCategory = next
    },

    setRepresentative(category, modelId) {
      const target = this.groupModels.find(m => m.modelId === modelId)
      if (!target) return
      this.repByCategory = { ...this.repByCategory, [category]: modelId }
      showToast(`'${target.modelName}' 모델이 ${category} 그룹의 대표 모델로 지정되었습니다.`, { type: 'success' })
    },

    // ---------- 방식 1: 트리 → DIV 마우스 드래그 ----------
    /*
     * RealGrid 는 셀 누르기를 pointerdown 에서 처리한다.
     * mousedown 시점에는 이미 선택이 한 행으로 접힌 뒤라 누르기 직전 상태를 볼 수 없다.
     * 래퍼의 pointerdown capture 는 RealGrid 핸들러(자손 엘리먼트)보다 먼저 오므로,
     * 여기서만 '누르기 직전의 진짜 블록'을 스냅샷할 수 있다.
     */
    onGridPointerDown(e) {
      if (e.button !== 0 || !this.gridView) return
      this._prePress = {
        rows: this.snapshotSelectedRows(),
        selection: this.snapshotSelection()
      }
    },

    onGridMouseDown(e) {
      if (e.button !== 0 || !this.gridView) return

      const gridEl = this.$refs.treeGrid?.$el || e.currentTarget
      const gridRect = gridEl.getBoundingClientRect()

      // pointerdown 스냅샷 = 누르기 직전의 선택. (mousedown 시점의 선택은 이미 접혔다)
      const pre = this._prePress || { rows: [], selection: null }
      const preSelectedRows = pre.rows || []

      const cur = this.gridView.getCurrent()
      const anchor = (cur && cur.itemIndex >= 0)
        ? { itemIndex: cur.itemIndex, dataRow: cur.dataRow, column: cur.column }
        : null

      /*
       * 블록 안쪽을 눌렀다 = 옮기려는 제스처다. 새 블록을 그으려는 게 아니다.
       * 그대로 두면 누르는 순간 블록이 한 행으로 접히고 끄는 동안 다시 그어져서
       * 옮겨지는 행은 그대로인데 화면만 바뀌니 "블록이 재지정된다"고 보인다.
       * 그래서 (1) 접힌 선택을 즉시 원래 블록으로 되돌리고,
       *        (2) 합성 pointerup/mouseup 으로 RealGrid 의 드래그 추적을 끊고,
       *        (3) 그래도 안쪽 움직임은 새로 긋기에 움직임마다 되돌린다(keepBlockSelection).
       */
      const canFreeze = !!(anchor && anchor.dataRow >= 0 &&
        preSelectedRows.length > 1 && pre.selection &&
        preSelectedRows.includes(anchor.dataRow))

      if (canFreeze) {
        this.gridView.setSelection(pre.selection, false)
        this.releaseGridPointer(e)
        this.isBlockDrag = true
      }

      this._press = {
        x: e.clientX,
        y: e.clientY,
        gridRect,
        anchor,
        preSelectedRows,
        // 고정해 둘 블록. 그리드가 다시 그으려 할 때마다 이 값으로 되돌린다.
        blockSelection: canFreeze ? pre.selection : null,
        // 누르기 직전까지 기억해 둔 블록. 제스처 도중 무슨 일이 나도 이 값은 안 변한다.
        preBlockRows: [...(this._blockRows || [])],
        moveGesture: canFreeze,
        started: false
      }

      window.addEventListener('mousemove', this.onDocMouseMove)
      window.addEventListener('mouseup', this.onDocMouseUp)
    },

    /** RealGrid 의 드래그 선택 추적을 끊는다. 우리 핸들러가 되받지 않도록 표시해서 보낸다. */
    releaseGridPointer(e) {
      const target = e.target
      if (!target) return

      const base = {
        bubbles: true,
        cancelable: true,
        clientX: e.clientX,
        clientY: e.clientY,
        button: 0,
        buttons: 0
      }

      const pointerUp = new PointerEvent('pointerup', { ...base, pointerId: 1, pointerType: 'mouse' })
      pointerUp.__nexhubSynthetic = true
      target.dispatchEvent(pointerUp)

      const mouseUp = new MouseEvent('mouseup', base)
      mouseUp.__nexhubSynthetic = true
      target.dispatchEvent(mouseUp)
    },

    onDocMouseMove(e) {
      if (!this._press) return

      // 고스트가 뜨기 전(임계값 이내)이라도 블록은 흔들리면 안 된다
      this.keepBlockSelection()

      const dx = e.clientX - this._press.x
      const dy = e.clientY - this._press.y
      const dist = Math.hypot(dx, dy)

      if (!this._press.started) {
        if (dist < 5) return

        /*
         * 그리드 '안'에서의 움직임은 RealGrid 의 블록 선택이다. 가로채면 행을 훑어
         * 선택하는 제스처가 통째로 드래그로 처리돼 버린다. 그래서 시작 조건은
         * '포인터가 그리드를 벗어났는가' 하나로 좁힌다.
         * 단, 블록을 잡고 누른 제스처(moveGesture)는 이미 RealGrid 의 선택 추적을
         * 끊어놨으므로 경쟁할 상대가 없다. 곧바로 고스트를 띄운다.
         */
        const rect = this._press.gridRect
        const isPointerOutsideRight = e.clientX > rect.right - 10
        const isOverZone = this.checkIsOverDropZone(e.clientX, e.clientY)

        if (!this._press.moveGesture && !isPointerOutsideRight && !isOverZone) {
          return
        }

        // 드래그 도중 늘어난 선택이 아니라, 누른 시점을 기준으로 대상 행을 확정한다
        const rows = this.resolveDragRows(this._press.preSelectedRows, this._press.preBlockRows)
        const ids = this.rowsToModelIds(rows)

        if (!ids.length) {
          this.endDragListeners()
          this._press = null
          return
        }

        this._press.started = true
        this._dragIds = ids
        document.body.style.userSelect = 'none'
        this.createGhost(ids)
      }

      this.moveGhost(e)
      this.isHoverDropZone = this.checkIsOverDropZone(e.clientX, e.clientY)
    },

    /*
     * 블록 고정.
     * RealGrid 는 누르고 있는 동안 포인터를 따라 선택을 계속 다시 긋는다.
     * 합성 pointerup 만으로는 그리드 안쪽 움직임까지 끊지 못해서 움직임마다 되돌린다.
     * 이 핸들러는 window 버블이라 그리드 자신의 갱신 '뒤'에 돌고, 그 사이에 화면을
     * 다시 그리지 않으므로 사용자 눈에는 블록이 처음부터 고정돼 있는 것으로 보인다.
     */
    keepBlockSelection() {
      const frozen = this._press && this._press.blockSelection
      if (!frozen || !this.gridView) return

      const cur = this.gridView.getSelection()
      if (cur && cur.startItem === frozen.startItem && cur.endItem === frozen.endItem &&
          cur.startColumn === frozen.startColumn && cur.endColumn === frozen.endColumn) {
        return
      }
      this.gridView.setSelection(frozen, false)
    },

    onDocMouseUp(e) {
      if (e && e.__nexhubSynthetic) return

      const press = this._press
      const wasDragging = !!(press && press.started)
      // 그리드가 마지막 순간에 늘려놓은 선택이 남지 않도록 뗄 때도 한 번 되돌린다
      this.keepBlockSelection()
      this.endDragListeners()
      this._press = null
      this._prePress = null
      this.isBlockDrag = false

      if (!wasDragging) {
        /*
         * 블록 안을 끌지 않고 그냥 클릭했다 = 그 행 하나만 고르려는 의도다.
         * 위에서 블록을 되돌려 놨으므로, 여기서 눌린 행으로 다시 접어준다.
         */
        if (press && press.moveGesture && press.anchor) {
          this.collapseSelectionTo(press.anchor)
        }
        // 끌지 않고 뗐다 = 순수 선택 제스처. 이때의 선택만 블록으로 기억한다.
        this.rememberBlockFromGrid()
        return
      }

      this.finishDrag(e)
      document.body.style.userSelect = ''
      this.removeGhost()
      this.isHoverDropZone = false
    },

    /** 블록을 눌린 셀 하나로 접는다. */
    collapseSelectionTo(anchor) {
      if (!this.gridView || !anchor || anchor.itemIndex < 0) return
      this.gridView.setSelection({
        cellType: 'data',
        style: this.selectionStyle,
        startItem: anchor.itemIndex,
        endItem: anchor.itemIndex,
        startColumn: anchor.column,
        endColumn: anchor.column
      }, false)
    },

    endDragListeners() {
      window.removeEventListener('mousemove', this.onDocMouseMove)
      window.removeEventListener('mouseup', this.onDocMouseUp)
    },

    /** 현재 선택을 블록 기억에 반영한다. 여러 행일 때만 유효하고, 단일 선택이면 비운다. */
    rememberBlockFromGrid() {
      const selected = this.snapshotSelectedRows()
      this._blockRows = selected.length > 1 ? selected : []
      // 블록을 씌우면 그 안의 모델을 체크한다
      if (selected.length > 1) this.checkRowsInBlock(selected)
    },

    /*
     * 블록에 걸린 모델 행을 체크한다.
     *
     * 기존 체크는 지우지 않고 누적한다 — 블록을 새로 그을 때마다 앞의 체크가 날아가면
     * 여러 카테고리에 걸쳐 고르는 게 불가능해진다.
     * 단일 행 선택(그냥 클릭)은 호출되지 않는다. 클릭할 때마다 체크가 붙으면
     * 행을 훑어보는 것조차 못 하게 된다. (rememberBlockFromGrid 의 length > 1 조건)
     * 카테고리 행은 체크 대상이 아니므로 걸러진다.
     */
    checkRowsInBlock(dataRows) {
      if (!this.gridView) return
      const items = []
      dataRows.forEach(row => {
        const info = this.nodeInfo(row)
        if (!info || info.nodeType !== 'model') return
        const itemIndex = this.gridView.getItemIndex(row)
        if (itemIndex >= 0) items.push(itemIndex)
      })
      if (!items.length) return
      // (itemIndices, checked, checkEvent) — 이벤트는 끄고 개수만 한 번에 맞춘다
      this.gridView.checkItems(items, true, false)
      this.syncCheckedCount()
    },

    /**
     * 선택 영역 스냅샷. setSelection 에 그대로 되돌려 넣을 수 있는 순수 값으로 복사한다.
     * (getSelection() 이 준 객체는 RealGrid 가 계속 고쳐 쓰므로 참조로 들고 있으면 안 된다)
     */
    snapshotSelection() {
      if (!this.gridView) return null
      const sel = this.gridView.getSelection()
      if (!sel || sel.startItem == null) return null
      return {
        cellType: sel.cellType,
        style: sel.style,
        startItem: sel.startItem,
        startColumn: sel.startColumn,
        endItem: sel.endItem,
        endColumn: sel.endColumn
      }
    },

    /** 누르기 직전의 블록 선택 스냅샷 */
    snapshotSelectedRows() {
      if (!this.gridView) return []
      const selected = this.gridView.getSelectedRows() || []
      return Array.from(new Set(selected)).sort((a, b) => a - b)
    },

    /*
     * 드래그로 옮길 데이터 행 목록.
     * 판단 근거는 누르기 직전의 블록 선택과 누른 행뿐이다. 드래그하는 동안
     * RealGrid 가 블록을 아래로 늘리더라도 그 결과는 쓰지 않는다.
     * (카테고리 노드를 하위 모델로 펼치는 일은 rowsToModelIds 가 맡는다)
     */
    resolveDragRows(preSelected = [], preBlock = []) {
      if (!this.gridView) return []

      const cur = this.gridView.getCurrent()
      const anchor = (cur && cur.dataRow >= 0) ? cur.dataRow : -1
      // 누르기 직전 블록 = capture 스냅샷이 살아있으면 그것, 아니면 기억해 둔 블록
      const block = (preSelected.length > 1) ? preSelected : preBlock

      // 여러 행이 블록 선택된 상태에서 그 안쪽을 눌렀다면 블록 전체
      if (block.length > 1 && (anchor < 0 || block.includes(anchor))) {
        return [...block]
      }
      // 그 외에는 누른 행 하나만
      if (anchor >= 0) return [anchor]
      return block.length ? [...block] : []
    },

    finishDrag(e) {
      const ids = this._dragIds
      this._dragIds = null
      if (!this.checkIsOverDropZone(e.clientX, e.clientY)) return
      if (!ids || !ids.length) return
      this.assignModels(ids)
    },

    checkIsOverDropZone(x, y) {
      const el = document.elementFromPoint(x, y)
      return !!(el && el.closest('.target-div-card'))
    },

    createGhost(ids) {
      const g = document.createElement('div')
      g.className = 'tree-to-div-ghost'

      const first = this.catalogMap.get(ids[0])
      const firstName = first ? first.modelName : '모델'
      const labelText = ids.length === 1
        ? `<strong>${firstName}</strong> (${first ? first.modelCode : ''})`
        : `<strong>${firstName} 외 ${ids.length - 1}개</strong> (총 ${ids.length}개 모델)`

      g.innerHTML = `<i class="bi bi-diagram-3-fill me-1.5"></i><sup>모델 이동</sup> ${labelText}`
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
    }
  }
}
</script>

<style scoped>
.tree-to-div-layout {
  display: grid;
  grid-template-columns: 1.25fr 1fr;
  grid-template-rows: minmax(0, 1fr);
  gap: var(--b2b-space-4);
  /* 페이지 컨테이너 높이에 맞춰 채우고, 넘치는 목록은 카드 내부에서 스크롤시킨다 */
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
}

/* Left Tree Card */
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
/*
 * 블록을 잡고 끄는 동안에는 선택이 고정돼 있다는 걸 커서로도 알린다.
 * (RealGrid 가 셀 위에서 자체 커서를 씌우므로 자손까지 강제한다)
 */
.dnd-grid-wrapper.is-block-drag,
.dnd-grid-wrapper.is-block-drag * {
  cursor: grabbing !important;
}
/* 카드 안에서는 트리 컴포넌트 자체 테두리/라운드를 지운다 */
.dnd-grid-wrapper :deep(.realgrid-tree-wrapper) {
  border: 0 !important;
  border-radius: 0 !important;
  box-shadow: none !important;
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
  padding: var(--b2b-space-3);
  display: flex;
  flex-direction: column;
  gap: var(--b2b-space-2);
  overflow-y: auto;
}

.div-empty-msg {
  margin: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: none;
  padding: var(--b2b-space-5);
}

/* 카테고리 그룹 블록 */
.div-group-block {
  display: flex;
  flex-direction: column;
  gap: var(--b2b-space-1);
}

/* 스크롤해도 어느 그룹을 보고 있는지 놓치지 않도록 헤더를 고정한다 */
.div-group-head {
  position: sticky;
  top: calc(var(--b2b-space-3) * -1);
  z-index: 1;
  display: flex;
  align-items: center;
  gap: var(--b2b-space-2);
  padding: var(--b2b-space-1) var(--b2b-space-2);
  margin-bottom: 1px;
  background: var(--b2b-color-bg-subcard, #f1f5f9);
  border-left: 3px solid var(--b2b-color-primary, #3b82f6);
  border-radius: 4px;
}

/* 그룹 안의 항목은 헤더 아래로 한 단 들여쓴다 */
.div-group-block .div-dropped-item {
  margin-left: var(--b2b-space-3);
}

/* Dropped Item Card (label 전체가 대표 선택 히트영역) */
.div-dropped-item {
  position: relative;
  display: grid;
  grid-template-columns: 16px minmax(0, 1fr) 24px;
  align-items: center;
  gap: var(--b2b-space-3);
  margin: 0;
  cursor: pointer;
  padding: var(--b2b-space-2) var(--b2b-space-3);
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
  gap: var(--b2b-space-2);
  min-width: 0;
}

/* Representative Radio (single-select) */
.rep-radio {
  width: 15px;
  height: 15px;
  margin: 0;
  cursor: pointer;
}

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
  .tree-to-div-layout {
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
  gap: var(--b2b-space-1);
  background: var(--b2b-color-bg-subcard, #f1f5f9);
  border: 1px solid var(--b2b-color-border, #e2e8f0);
  color: var(--b2b-color-text-sub, #64748b);
  font-size: 0.75rem;
  font-weight: 500;
  padding: 3px var(--b2b-space-2);
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
  width: 430px;
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

<!-- 전역(non-scoped) 스타일: 드래그 고스트 + RealGrid 행 스타일 콜백용 클래스 -->
<style>
/*
 * 이 페이지 한정 레이아웃 보정.
 * 앱 셸(html/body/.vben-layout)이 뷰포트 높이에 묶여 있지 않아
 * .b2b-page-container 의 height:100% 가 실제로는 내용 높이를 따라간다.
 * :has() 로 이 페이지에서만 컨테이너를 뷰포트 높이에 고정한다.
 * 180px = 컨테이너 상단 오프셋(앱 헤더 + main 패딩 + 전역 PageHeader) + 하단 여백
 */
.b2b-page-container:has(.tree-to-div-layout) {
  height: calc(100vh - 180px);
  min-height: 380px;
}

/*
 * RealGrid 는 setRowStyleCallback 이 돌려준 클래스명의 computed 스타일을 읽어
 * 캔버스에 그린다. 따라서 scoped 가 아닌 전역 클래스로 정의해야 한다.
 */
.rg-tree-category-row {
  background: #f1f5f9;
  color: #0f172a;
  font-weight: 700;
}

.tree-to-div-ghost {
  position: fixed;
  z-index: 9999;
  pointer-events: none;
  background: linear-gradient(135deg, var(--b2b-color-primary), var(--b2b-color-primary-hover));
  color: #ffffff;
  font-size: 0.85rem;
  padding: var(--b2b-space-2) 14px;
  border-radius: 20px;
  box-shadow: 0 6px 20px rgba(13, 110, 253, 0.45);
  white-space: nowrap;
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}
</style>
