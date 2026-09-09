<template>
  <div class="b2b-page-container">
    <!-- Toolbar -->
    <div class="b2b-toolbar mb-3">
      <div class="d-flex align-items-center justify-content-end w-100 flex-wrap gap-2">
        <button class="btn btn-outline-primary btn-sm" title="랜덤 모델 20개를 각 그룹에 추가" @click="appendMoreModels(20)">
          <i class="bi bi-plus-circle me-1"></i>
          <span>+ 20개 모델 추가</span>
        </button>

        <!-- 방식 2: 체크 → 버튼으로 우측 이동 -->
        <button
          class="btn-b2b-primary"
          :disabled="checkedCount === 0"
          title="좌측 트리에서 체크한 부모 그룹을 우측 배정함으로 옮깁니다"
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
      <!-- Left: RealGrid TreeView — 부모(그룹) 행만 보여준다 -->
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
                    <i class="bi bi-diagram-3-fill text-primary me-1.5"></i>부모 그룹 배정 가이드
                  </span>
                  <button class="btn-close-popover" title="닫기" @click="showGuideTooltip = false">
                    <i class="bi bi-x-lg"></i>
                  </button>
                </div>
                <ul class="guide-steps-list m-0 p-0 b2b-text-xs text-secondary">
                  <li class="mb-1.5">
                    <strong class="text-dark">배정 단위는 부모(그룹):</strong>
                    자식 모델은 좌측에 <span class="text-primary fw-medium">보이지 않습니다.</span>
                    부모를 옮기면 <span class="text-primary fw-medium">자식 모델이 통째로 함께</span> 따라갑니다.
                  </li>
                  <li class="mb-1.5">
                    <strong class="text-dark">방식 1 · 드래그 &amp; 드롭:</strong>
                    트리의 부모 행을 잡고 우측 배정함으로 끌어다 놓습니다.
                    여러 행을 <span class="text-primary fw-medium">블록 선택</span>한 뒤 그 안쪽을 잡고 끌면 한 번에 옮겨집니다.
                  </li>
                  <li class="mb-1.5">
                    <strong class="text-dark">방식 2 · 체크 후 버튼:</strong>
                    좌측 <span class="text-primary fw-medium">체크박스</span>로 그룹을 고르고 상단
                    <span class="text-primary fw-medium">[체크 항목 배정]</span> 버튼을 누릅니다.
                    행을 <span class="text-primary fw-medium">블록으로 훑으면</span> 그 안의 그룹이 자동으로 체크되고,
                    <span class="text-primary fw-medium">블록이 사라지면 체크도 함께 해제</span>되어 화면과 항상 일치합니다.
                  </li>
                  <li class="mb-1.5">
                    <strong class="text-dark">대표 그룹:</strong>
                    우측 카드의 <span class="text-primary fw-medium">라디오</span>를 선택하면 그 그룹이
                    배정 목록 전체의 <span class="text-primary fw-medium">대표 그룹</span>이 됩니다. (목록당 1개)
                  </li>
                  <li>
                    <strong class="text-dark">자식 확인 · 그룹 대표 모델:</strong>
                    우측에 배정된 <span class="text-primary fw-medium">부모 카드를 클릭</span>하면
                    부모와 자식을 한 트리에서 보여주는 팝업이 열립니다.
                    팝업 왼쪽의 <span class="text-primary fw-medium">라디오</span>를 선택하면
                    그 그룹의 대표 모델이 바뀝니다. (그룹당 1개)
                  </li>
                </ul>
              </div>
            </transition>
          </div>

          <span class="b2b-text-xs text-secondary">
            미배정 그룹 <strong class="text-primary fw-bold">{{ poolCategories.length }}</strong>개 · 모델 {{ poolModelCount }}개
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
            grid-id="realgrid-tree-to-div-v2"
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
            :tree-line-visible="false"
            :check-bar-width="34"
            :toast="gridToast"
            @init="onGridInit"
          />
        </div>
      </div>

      <!-- Right: Target DIV Container — 부모만 보인다. 자식은 카드를 눌러 팝업에서 확인 -->
      <div class="dnd-div-container">
        <div
          class="target-div-card unified-group-card"
          :class="{ 'is-hover': isHoverDropZone }"
          data-zone="groupUnified"
        >
          <div class="dnd-card-head border-bottom bg-theme-subcard px-3 py-2 d-flex align-items-center justify-content-between">
            <span class="fw-bold b2b-text-sm">그룹 배정 목록</span>
            <span class="b2b-text-2xs text-secondary">
              <template v-if="repCategory">대표 그룹 <strong class="text-dark">{{ repCategory }}</strong> · </template>
              그룹 {{ assignedGroups.length }} · 모델 {{ assignedModelCount }}개
            </span>
          </div>

          <div class="target-div-body custom-scrollbar">
            <div v-if="assignedGroups.length === 0" class="div-empty-msg">
              <i class="bi bi-box-arrow-in-down text-primary fs-2 mb-2 opacity-75"></i>
              <span class="fw-bold b2b-text-sm text-dark mb-1">배정된 그룹이 없습니다</span>
              <span class="b2b-text-xs text-muted text-center">
                좌측 트리에서 부모 행을 끌어다 놓거나,<br/>
                체크 후 [체크 항목 배정] 버튼을 누르세요.
              </span>
            </div>

            <!-- 배정된 부모 카드. 클릭하면 자식까지 담긴 트리 팝업이 열린다 -->
            <div
              v-for="group in assignedGroups"
              :key="group.category"
              class="div-dropped-item"
              :class="{ 'item-rep': group.category === repCategory }"
              role="button"
              tabindex="0"
              :title="group.category + ' 그룹의 자식 모델 ' + group.models.length + '개를 트리 팝업으로 봅니다'"
              @click="openCategoryPopup(group.category)"
              @keydown.enter.prevent="openCategoryPopup(group.category)"
              @keydown.space.prevent="openCategoryPopup(group.category)"
            >
              <!--
                대표 그룹 선택(전체에서 1개). 카드 클릭은 팝업 열기라서
                라디오 클릭은 카드까지 번지지 않게 끊는다.
              -->
              <input
                type="radio"
                class="rep-radio"
                name="treeGroupRepCategory"
                :value="group.category"
                :checked="group.category === repCategory"
                :title="group.category + ' 그룹을 대표 그룹으로 지정합니다'"
                @click.stop
                @keydown.enter.stop
                @keydown.space.stop
                @change="setRepCategory(group.category)"
              />

              <span class="item-main">
                <span class="item-name fw-bold b2b-text-sm text-dark text-truncate">
                  {{ group.category }}
                </span>
                <span class="item-meta b2b-text-xs text-muted text-truncate">
                  자식 {{ group.models.length }}개 · 대표 {{ group.repName || '미지정' }}
                </span>
              </span>

              <button
                class="btn-return-grid"
                title="트리로 되돌리기"
                @click.stop="returnCategory(group.category)"
              >
                <i class="bi bi-x-lg"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 부모 클릭 → 부모 + 자식을 한 트리로 보여주는 팝업 -->
    <CategoryModelTreeModal
      :is-open="!!openedGroup"
      :category="openedGroup ? openedGroup.category : ''"
      :models="openedGroup ? openedGroup.models : []"
      :rep-model-id="openedGroup ? (repByCategory[openedGroup.category] || '') : ''"
      @close="closeCategoryPopup"
      @set-rep="onSetRepresentative"
    />
  </div>
</template>

<script>
import RealGridTreeJs from '@/components/RealGridTreeJs.vue'
import CategoryModelTreeModal from '@/components/CategoryModelTreeModal.vue'
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
  components: { RealGridTreeJs, CategoryModelTreeModal },
  data() {
    return {
      showGuideTooltip: false,
      isHoverDropZone: false,
      isBlockDrag: false,
      selectionStyle: 'block',
      // 전체 모델 원본(평면). 부모(카테고리)는 이 목록에서 매번 다시 묶는다.
      catalog: [],
      // 우측 배정 목록 — 옮긴 순서대로 담은 '부모 이름' 목록
      assignedCategories: [],
      // 대표 모델은 그룹마다 1개 — { '센서/전자': 'M001', ... }
      repByCategory: {},
      // 대표 그룹은 배정 목록 전체에서 1개 (우측 패널의 라디오)
      repCategory: null,
      // 팝업으로 열어 둔 부모 이름 (null 이면 닫힘)
      openedCategory: null,
      checkedCount: 0,
      gridFields: [
        { fieldName: 'nodeType', dataType: 'text' },
        { fieldName: 'category', dataType: 'text' },
        { fieldName: 'modelCount', dataType: 'text' },
        { fieldName: 'prefix', dataType: 'text' },
        { fieldName: 'manufacturers', dataType: 'text' }
      ],
      gridColumns: [
        { name: 'category', fieldName: 'category', width: 220, header: { text: '부모 그룹' }, styles: { textAlignment: 'near', fontBold: true } },
        { name: 'modelCount', fieldName: 'modelCount', width: 110, header: { text: '자식 모델' }, styles: { textAlignment: 'center' } },
        { name: 'prefix', fieldName: 'prefix', width: 90, header: { text: '코드' }, styles: { textAlignment: 'center' } },
        { name: 'manufacturers', fieldName: 'manufacturers', width: 220, header: { text: '제조사' }, styles: { textAlignment: 'near' } }
      ]
    }
  },
  computed: {
    /** 카테고리 이름 → 그 카테고리의 모델 목록 */
    modelsByCategory() {
      const map = new Map()
      CATEGORY_DEFS.forEach(cat => map.set(cat.name, []))
      this.catalog.forEach(m => {
        if (!map.has(m.category)) map.set(m.category, [])
        map.get(m.category).push(m)
      })
      return map
    },
    assignedSet() {
      return new Set(this.assignedCategories)
    },
    /** 좌측에 남아 있는 부모. 모델이 하나도 없는 카테고리는 옮길 것이 없으니 빼둔다. */
    poolCategories() {
      return CATEGORY_DEFS.filter(cat => {
        if (this.assignedSet.has(cat.name)) return false
        const models = this.modelsByCategory.get(cat.name)
        return !!(models && models.length)
      })
    },
    poolModelCount() {
      return this.poolCategories.reduce((sum, cat) => sum + this.modelsByCategory.get(cat.name).length, 0)
    },
    /*
     * 우측 배정 목록. 부모 단위이므로 카드 하나 = 카테고리 하나다.
     * 자식(models)은 화면에 펼치지 않고 팝업에 넘겨주기 위해서만 들고 있다.
     */
    assignedGroups() {
      return this.assignedCategories.map(name => {
        const models = this.modelsByCategory.get(name) || []
        const repId = this.repByCategory[name]
        const rep = models.find(m => m.modelId === repId)
        return { category: name, models, repName: rep ? rep.modelName : '' }
      })
    },
    assignedModelCount() {
      return this.assignedGroups.reduce((sum, g) => sum + g.models.length, 0)
    },
    openedGroup() {
      if (!this.openedCategory) return null
      return this.assignedGroups.find(g => g.category === this.openedCategory) || null
    },
    /*
     * 좌측 트리는 상태(전체 카테고리 - 배정된 카테고리)에서 매번 통째로 다시 만든다.
     * RealGrid 노드를 직접 지우고 붙이면 dataRow 인덱스가 어긋나는데,
     * 다시 만들면 그 경우의 수가 아예 없다. RealGridTreeJs 는 rows prop 을
     * deep watch 하므로 이 값만 바뀌면 트리가 갱신된다.
     *
     * 자식(모델)은 여기에 담지 않는다 — 좌측에서 다루는 단위는 부모뿐이고,
     * children 키가 있으면 펼침 화살표가 생겨 "자식은 숨긴다"는 규칙이 깨진다.
     */
    treeRows() {
      return this.poolCategories.map(cat => {
        const models = this.modelsByCategory.get(cat.name)
        return {
          nodeType: 'category',
          category: cat.name,
          modelCount: `${models.length}개`,
          prefix: cat.prefix,
          manufacturers: cat.mfrs.join(', ')
        }
      })
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
      showToast(`신규 모델 ${count}개가 각 그룹에 추가되었습니다. (미배정 그룹의 모델: ${this.poolModelCount}개)`, { type: 'success' })
    },

    onGridInit({ gridView, dataProvider }) {
      this.gridView = gridView
      this.dataProvider = dataProvider

      gridView.setDisplayOptions({
        selectionStyle: this.selectionStyle,
        rowHoverType: 'row'
      })

      /*
       * 배정 대상은 부모(카테고리)뿐이다. 좌측 트리에는 부모 행만 있으므로
       * "고른 것 = 체크된 것"이 언제나 화면 그대로다.
       */
      gridView.setCheckBar({
        visible: true,
        width: 34,
        exclusive: false,
        head: 'check',
        checkableCallback: (dataSource, item) => {
          const info = this.nodeInfo(item && item.dataRow)
          return !!(info && info.nodeType === 'category')
        }
      })

      gridView.onItemChecked = () => this.syncCheckedCount()
      gridView.onItemAllChecked = () => this.$nextTick(this.syncCheckedCount)

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
     * dataRow 목록 → 실제로 옮길 부모(카테고리) 이름 목록.
     * 좌측 트리에는 부모 행만 있지만, 판단은 nodeType 으로 한다.
     * 중복은 Set 으로 제거한다.
     */
    rowsToCategoryNames(dataRows) {
      if (!this.dataProvider) return []
      const names = []
      const seen = new Set()

      ;(dataRows || []).forEach(row => {
        const info = this.nodeInfo(row)
        if (!info || info.nodeType !== 'category' || !info.category) return
        if (seen.has(info.category)) return
        seen.add(info.category)
        names.push(info.category)
      })

      return names
    },

    // ---------- 방식 2: 체크박스 + 버튼 ----------
    checkedCategoryNames() {
      if (!this.gridView) return []
      let rows = []
      try {
        // TreeView.getCheckedRows(visibleOnly) — 접혀 있는 노드도 포함해야 한다
        rows = this.gridView.getCheckedRows(false) || []
      } catch (e) {
        rows = []
      }
      return this.rowsToCategoryNames(rows)
    },

    syncCheckedCount() {
      this.checkedCount = this.checkedCategoryNames().length
    },

    /** 트리를 다시 그리면 체크 상태는 사라진다. 카운트와 블록 기억도 같이 맞춘다. */
    resetCheckState() {
      this.checkedCount = 0
      this._blockRows = []
      this._prePress = null
    },

    assignChecked() {
      const names = this.checkedCategoryNames()
      if (!names.length) {
        showToast('배정할 그룹을 좌측 트리에서 체크해 주세요.', { type: 'warning' })
        return
      }
      this.assignCategories(names)
    },

    // ---------- 공통 배정 ----------
    /*
     * 부모를 옮기면 그 아래 자식 모델도 통째로 따라간다.
     * 자식을 따로 복사해 두지 않는 이유는, 소속(category)만 보면 언제든 다시
     * 묶을 수 있어서다. 모델이 추가돼도 배정된 그룹의 자식 수가 저절로 맞는다.
     */
    assignCategories(names) {
      const added = []
      names.forEach(name => {
        if (this.assignedSet.has(name)) return
        const models = this.modelsByCategory.get(name)
        if (!models || !models.length) return
        this.assignedCategories.push(name)
        added.push({ name, count: models.length })
      })

      if (!added.length) return 0

      // 새로 생긴 그룹의 대표 모델과, 목록 전체의 대표 그룹을 채운다
      this.syncRepresentatives()
      this.syncRepCategory()

      const modelSum = added.reduce((sum, a) => sum + a.count, 0)
      const summary = added.length <= 2
        ? added.map(a => a.name).join(', ')
        : `${added[0].name} 외 ${added.length - 1}개`
      showToast(`${added.length}개 그룹 (${summary})이 자식 모델 ${modelSum}개와 함께 배정되었습니다.`, { type: 'success' })

      if (this.gridView) {
        try { this.gridView.clearSelection() } catch (e) { /* noop */ }
      }
      this.resetCheckState()
      return added.length
    },

    returnCategory(name) {
      const idx = this.assignedCategories.indexOf(name)
      if (idx < 0) return
      this.assignedCategories.splice(idx, 1)

      // 되돌린 그룹이 열려 있었다면 팝업도 같이 닫는다
      if (this.openedCategory === name) this.openedCategory = null

      // 빠진 그룹의 대표 자리도 함께 정리된다 (syncRepresentatives)
      this.syncRepresentatives()
      this.syncRepCategory()
      this.resetCheckState()
    },

    resetAll() {
      if (!this.assignedCategories.length) {
        showToast('그룹 영역에 배정된 그룹이 없습니다.', { type: 'warning' })
        return
      }
      const count = this.assignedCategories.length
      this.assignedCategories = []
      this.repByCategory = {}
      this.repCategory = null
      this.openedCategory = null
      this.resetCheckState()
      showToast(`${count}개 그룹 배정이 모두 트리로 초기화되었습니다.`, { type: 'info' })
    },

    /*
     * 대표 그룹은 배정 목록 전체에서 1개다.
     * 아직 없거나(첫 배정) 대표였던 그룹이 트리로 돌아갔으면 남은 첫 그룹이 이어받고,
     * 목록이 비면 대표도 사라진다. '고를 수 있는데 아무것도 안 켜진 라디오'를 남기지 않는다.
     */
    syncRepCategory() {
      if (!this.assignedCategories.length) {
        this.repCategory = null
        return
      }
      if (!this.assignedCategories.includes(this.repCategory)) {
        this.repCategory = this.assignedCategories[0]
      }
    },

    setRepCategory(name) {
      if (!this.assignedCategories.includes(name) || this.repCategory === name) return
      this.repCategory = name
      showToast(`'${name}' 그룹이 대표 그룹으로 지정되었습니다.`, { type: 'success' })
    },

    /**
     * 배정된 그룹마다 대표가 정확히 1개 있도록 맞춘다.
     * 기존 대표가 그 그룹에 그대로 남아있으면 유지하고, 없으면 첫 모델로 채운다.
     * 되돌린 그룹은 새 객체에 담기지 않아 대표 자리도 같이 사라진다.
     */
    syncRepresentatives() {
      const next = {}
      this.assignedCategories.forEach(name => {
        const models = this.modelsByCategory.get(name) || []
        if (!models.length) return
        const current = this.repByCategory[name]
        const stillThere = current && models.some(m => m.modelId === current)
        next[name] = stillThere ? current : models[0].modelId
      })
      this.repByCategory = next
    },

    // ---------- 부모 클릭 → 자식 트리 팝업 ----------
    openCategoryPopup(name) {
      // 드래그로 카드 위에서 손을 뗀 직후의 클릭까지 팝업으로 받지 않는다
      if (this._suppressCardClick) return
      this.openedCategory = name
    },

    closeCategoryPopup() {
      this.openedCategory = null
    },

    onSetRepresentative({ category, modelId }) {
      const models = this.modelsByCategory.get(category) || []
      const target = models.find(m => m.modelId === modelId)
      if (!target) return
      this.repByCategory = { ...this.repByCategory, [category]: modelId }
      showToast(`'${target.modelName}' 모델이 ${category} 그룹의 대표로 지정되었습니다.`, { type: 'success' })
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
      /*
       * 체크바를 눌렀는지는 '누른 위치' 로 판별한다.
       * 이벤트 순서로는 안 된다 — RealGrid 의 체크 토글(onItemChecked)은 우리 mouseup
       * 뒤에 오기 때문에, 그 사이 rememberBlockFromGrid 가 방금 켠 체크를 지워버린다.
       */
      this._pressOnCheckbar = this.isCheckbarPoint(e.clientX, e.clientY)
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
        const names = this.rowsToCategoryNames(rows)

        if (!names.length) {
          this.endDragListeners()
          this._press = null
          return
        }

        this._press.started = true
        this._dragNames = names
        document.body.style.userSelect = 'none'
        this.createGhost(names)
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

      // 체크바를 누른 제스처인가. (onGridPointerDown 에서 위치로 판별해 둔 값)
      const viaCheckbar = this._pressOnCheckbar

      // 블록을 씌웠다 = 그 안의 그룹이 고른 것
      if (selected.length > 1) {
        this.syncChecksToBlock(selected)
        return
      }

      /*
       * 블록이 사라졌다(블록 밖을 클릭했거나 선택이 풀렸다) = 고른 게 없다.
       * 체크도 같이 비운다. 화면에 블록이 없는데 체크만 남아 있으면
       * 무엇이 배정될지 화면만 보고는 알 수 없다.
       *
       * 예외는 체크바 직접 클릭. 그것도 '한 행 선택'이라 여기서 지우면
       * 수동으로 체크하는 것 자체가 불가능해진다.
       */
      if (viaCheckbar) return
      this.clearAllChecks()
    },

    /** 그 좌표가 체크바(제어열)인가. RealGrid 는 체크바 셀을 .rg-checkbar-cell 로 그린다. */
    isCheckbarPoint(x, y) {
      const el = document.elementFromPoint(x, y)
      return !!(el && el.closest('[class*="rg-checkbar"]'))
    },

    clearAllChecks() {
      if (!this.gridView || !this.checkedCount) return
      // (checked, visibleOnly, checkableOnly, checkEvent) — 접힌 노드까지 해제
      this.gridView.checkAll(false, false, true, false)
      this.syncCheckedCount()
    },

    /*
     * 체크 상태를 방금 그은 블록에 맞춘다.
     *
     * 이전 블록의 체크는 지운다. 블록을 다른 데로 옮겼는데 앞의 체크가 남아 있으면
     * 화면에 보이는 블록과 실제로 배정될 목록이 어긋나, 무엇을 고른 상태인지 알 수 없게 된다.
     * '블록 = 체크된 것' 이 항상 눈에 보이는 그대로여야 한다.
     *
     * 단, 단일 행 선택(그냥 클릭)에서는 호출되지 않는다. (rememberBlockFromGrid 의 length > 1)
     * 체크바를 직접 클릭하는 것도 한 행 선택이라, 여기서 지우면 수동 체크가 아예 불가능해진다.
     */
    syncChecksToBlock(dataRows) {
      if (!this.gridView) return
      const items = []
      dataRows.forEach(row => {
        const info = this.nodeInfo(row)
        if (!info || info.nodeType !== 'category') return
        const itemIndex = this.gridView.getItemIndex(row)
        if (itemIndex >= 0) items.push(itemIndex)
      })

      this.clearAllChecks()
      if (items.length) {
        // (itemIndices, checked, checkEvent) — 이벤트는 끄고 개수는 한 번에 맞춘다
        this.gridView.checkItems(items, true, false)
      }
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
      const names = this._dragNames
      this._dragNames = null
      if (!this.checkIsOverDropZone(e.clientX, e.clientY)) return
      if (!names || !names.length) return

      /*
       * 드롭 지점이 이미 배정된 카드 위일 수 있다. 그 카드의 click 은 드롭 직후에
       * 오므로, 손을 뗀 것만으로 팝업이 열리지 않게 한 박자 막아둔다.
       */
      this._suppressCardClick = true
      this.$nextTick(() => { this._suppressCardClick = false })

      this.assignCategories(names)
    },

    checkIsOverDropZone(x, y) {
      const el = document.elementFromPoint(x, y)
      return !!(el && el.closest('.target-div-card'))
    },

    createGhost(names) {
      const g = document.createElement('div')
      g.className = 'tree-to-div-ghost'

      const first = names[0]
      const modelSum = names.reduce((sum, name) => sum + (this.modelsByCategory.get(name) || []).length, 0)
      const labelText = names.length === 1
        ? `<strong>${first}</strong> (자식 ${modelSum}개)`
        : `<strong>${first} 외 ${names.length - 1}개 그룹</strong> (자식 ${modelSum}개)`

      g.innerHTML = `<i class="bi bi-folder-fill me-1.5"></i><sup>그룹 이동</sup> ${labelText}`
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

/* Dropped Parent Card (카드 전체가 팝업 열기 히트영역) */
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
  border-color: var(--b2b-color-primary, #3b82f6);
  box-shadow: 0 2px 6px rgba(13, 110, 253, 0.12);
}

/* 대표 그룹은 목록에서 한눈에 찾을 수 있어야 한다 */
.div-dropped-item.item-rep {
  border-color: var(--b2b-color-primary, #3b82f6);
  background: rgba(13, 110, 253, 0.05);
}

.rep-radio {
  width: 15px;
  height: 15px;
  margin: 0;
  cursor: pointer;
}

/* 키보드 포커스(Tab 이동) 시각화 */
.div-dropped-item:focus-visible {
  outline: none;
  border-color: var(--b2b-color-primary, #3b82f6);
  box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.14);
}

/* 카드 본문은 '이름 + 한 줄 요약'뿐이다. 아이콘·배지를 늘리면 카드마다
 * 훑어야 할 것이 늘어 정작 이름이 눈에 안 들어온다. */
.item-main {
  display: flex;
  align-items: baseline;
  gap: var(--b2b-space-2);
  min-width: 0;
}

.item-meta {
  min-width: 0;
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

<!-- 전역(non-scoped) 스타일: 페이지 높이 보정 + 드래그 고스트 -->
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
