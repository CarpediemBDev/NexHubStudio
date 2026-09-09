<template>
  <!--
    배정된 '부모(카테고리)'를 클릭했을 때 뜨는 상세 팝업.
    좌측 목록에서는 자식(모델)을 숨기고 부모만 다루기 때문에,
    "그 부모가 실제로 무엇을 데리고 왔는지"는 이 팝업의 트리에서만 확인한다.
  -->
  <div
    v-if="isOpen"
    class="modal-backdrop-custom d-flex align-items-center justify-content-center"
    @mousedown.self="$emit('close')"
  >
    <div class="modal-card-custom bg-theme-card rounded-3 shadow-lg border-theme overflow-hidden">
      <!-- Header -->
      <div class="px-4 py-3 bg-theme-subcard border-bottom border-theme d-flex align-items-center justify-content-between">
        <div class="d-flex align-items-center gap-2 min-w-0">
          <i class="bi bi-diagram-3-fill text-primary fs-5"></i>
          <h5 class="fw-bold text-theme-primary m-0 fs-6 text-truncate">
            {{ category }} <span class="text-secondary fw-normal">그룹 구성</span>
          </h5>
        </div>
        <button type="button" class="btn-close" title="닫기" @click="$emit('close')"></button>
      </div>

      <!-- Body: 부모 + 자식을 한 화면에 보여주는 RealGrid 트리 -->
      <div class="popup-tree-body">
        <RealGridTreeJs
          grid-id="realgrid-tree-to-div-popup-v2"
          height="100%"
          :fields="gridFields"
          :columns="gridColumns"
          :rows="treeRows"
          children-field="children"
          :editable="false"
          :insertable="false"
          :checkable="true"
          :check-bar-exclusive="true"
          :check-bar-width="38"
          :show-row-number="false"
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
          :toast="gridToast"
          @init="onGridInit"
        />
      </div>

      <!-- Footer -->
      <div class="px-4 py-3 bg-theme-subcard border-top border-theme d-flex justify-content-end">
        <button type="button" class="btn btn-sm btn-outline-secondary px-3" @click="$emit('close')">닫기</button>
      </div>
    </div>
  </div>
</template>

<script>
import RealGridTreeJs from '@/components/RealGridTreeJs.vue'
import { showToast } from '@/utils/toastUtil.js'

export default {
  name: 'CategoryModelTreeModal',
  components: { RealGridTreeJs },
  props: {
    isOpen: { type: Boolean, default: false },
    category: { type: String, default: '' },
    models: { type: Array, default: () => [] },
    repModelId: { type: String, default: '' }
  },
  emits: ['close', 'set-rep'],
  data() {
    return {
      gridFields: [
        { fieldName: 'nodeType', dataType: 'text' },
        { fieldName: 'modelId', dataType: 'text' },
        { fieldName: 'modelCode', dataType: 'text' },
        { fieldName: 'modelName', dataType: 'text' },
        { fieldName: 'grade', dataType: 'text' },
        { fieldName: 'manufacturer', dataType: 'text' }
      ],
      gridColumns: [
        { name: 'modelName', fieldName: 'modelName', width: 250, header: { text: '그룹 / 모델명' }, styles: { textAlignment: 'near' } },
        { name: 'modelCode', fieldName: 'modelCode', width: 120, header: { text: '모델 코드' }, styles: { textAlignment: 'center' } },
        { name: 'grade', fieldName: 'grade', width: 90, header: { text: '등급' }, styles: { textAlignment: 'center' } },
        { name: 'manufacturer', fieldName: 'manufacturer', width: 180, header: { text: '제조사' }, styles: { textAlignment: 'center' } }
      ]
    }
  },
  computed: {
    /*
     * 부모 1개 + 자식 N개. 좌측 목록이 부모만 보여주는 대신
     * 여기서는 부모와 자식을 같은 트리에 얹어 계층을 그대로 보여준다.
     *
     * 대표 여부는 행 값으로 넣지 않는다 — 값에 섞으면 대표가 바뀔 때마다 rows 가
     * 새로 만들어져 트리가 통째로 다시 서고, 그때 체크(라디오) 상태가 날아간다.
     * 대표는 체크바가 들고 있고, 이 목록은 '무엇이 들어있나'만 그린다.
     */
    treeRows() {
      if (!this.category) return []
      return [{
        nodeType: 'category',
        modelId: '',
        modelCode: `${this.models.length}개`,
        modelName: this.category,
        grade: '',
        manufacturer: '',
        children: this.models.map(m => ({
          nodeType: 'model',
          modelId: m.modelId,
          modelCode: m.modelCode,
          modelName: m.modelName,
          grade: m.grade,
          manufacturer: m.manufacturer
        }))
      }]
    }
  },
  watch: {
    /*
     * 대표가 밖에서 바뀌었거나(다른 그룹을 열었거나) 자식 목록이 늘어났으면
     * 라디오를 현재 대표에 다시 맞춘다. 트리는 rows 가 바뀐 뒤에 세워지므로
     * 한 틱 기다렸다가 체크한다.
     */
    repModelId() {
      this.$nextTick(this.syncRepCheck)
    },
    models() {
      this.$nextTick(this.syncRepCheck)
    },
    category() {
      this.$nextTick(this.syncRepCheck)
    }
  },
  methods: {
    gridToast(message, opts = {}) {
      showToast(message, opts)
    },

    onGridInit({ gridView, dataProvider }) {
      this.gridView = gridView
      this.dataProvider = dataProvider

      gridView.setDisplayOptions({ selectionStyle: 'rows', rowHoverType: 'row' })

      // 부모(그룹) 행을 자식과 눈에 띄게 구분한다 (전역 CSS 클래스여야 RealGrid 가 읽는다)
      gridView.setRowStyleCallback((grid, item) => {
        const info = this.nodeInfo(item && item.dataRow)
        return info && info.nodeType === 'category' ? 'rg-popup-parent-row' : undefined
      })

      /*
       * 체크바를 '대표 선택 라디오'로 쓴다. (grid-to-div 우측 패널의 라디오와 같은 규칙)
       * exclusive: 켜는 순간 나머지가 꺼지므로 그룹당 대표는 언제나 1개다.
       * 부모(그룹) 행은 대표가 될 수 없으니 체크 대상에서 뺀다 —
       * 헤더의 전체 체크(head)도 '하나만 고른다'와 어긋나 끈다.
       */
      gridView.setCheckBar({
        visible: true,
        width: 38,
        exclusive: true,
        head: 'none',
        checkableCallback: (dataSource, item) => {
          const info = this.nodeInfo(item && item.dataRow)
          return !!(info && info.nodeType === 'model')
        }
      })

      /*
       * exclusive 체크바는 '이전 것 끄기 → 새 것 켜기' 순으로 두 번 통보한다.
       * 그래서 끈 통보를 그 자리에서 되돌리면(다시 켜면) 배타 규칙에 걸려
       * 방금 누른 라디오가 도로 꺼진다 — 눌러도 대표가 안 바뀌는 것처럼 보인다.
       * 켠 통보만 대표 변경으로 처리하고, 화면은 통보가 다 끝난 뒤(nextTick)
       * 지금 대표 기준으로 한 번에 맞춘다. 그러면 켜진 것을 다시 눌러 끈 경우도
       * 대표가 그대로 복원돼, 대표 없는 그룹이 생기지 않는다.
       */
      gridView.onItemChecked = (grid, itemIndex, checked) => {
        if (this._syncing) return
        const info = this.nodeInfo(grid.getDataRow(itemIndex))
        if (!info || info.nodeType !== 'model') return

        if (checked && info.modelId !== this.repModelId) {
          this.$emit('set-rep', { category: this.category, modelId: info.modelId })
        }
        this.$nextTick(this.syncRepCheck)
      }

      // 그리드가 처음 서면 지금 대표에 라디오를 맞춰 둔다
      this.$nextTick(this.syncRepCheck)
    },

    /*
     * 현재 대표 모델의 행에 라디오를 켠다.
     * TreeView 의 시그니처는 checkItem(itemIndex, checked, checkChildren, checkEvent) 이고
     * checkEvent 를 끄지 않으면 우리 onItemChecked 가 다시 불려 무한히 되풀이된다.
     * (_syncing 은 그래도 남는 재진입을 막는 빗장)
     */
    syncRepCheck() {
      if (!this.gridView || !this.isOpen || this._syncing) return
      this._syncing = true
      try {
        const itemIndex = this.itemIndexOfModel(this.repModelId)
        this.gridView.checkAll(false, false, true, false)
        if (itemIndex >= 0) this.gridView.checkItem(itemIndex, true, false, false)
      } catch (e) { /* noop */ } finally {
        this._syncing = false
      }
    },

    /** modelId → 화면상의 itemIndex. 트리는 dataRow 와 itemIndex 가 다르다. */
    itemIndexOfModel(modelId) {
      if (!modelId || !this.gridView || !this.dataProvider) return -1
      const count = this.dataProvider.getRowCount()
      for (let dataRow = 0; dataRow < count; dataRow++) {
        const info = this.nodeInfo(dataRow)
        if (info && info.nodeType === 'model' && info.modelId === modelId) {
          return this.gridView.getItemIndex(dataRow)
        }
      }
      return -1
    },

    /** dataRow → 노드 값. 트리 provider 의 getJsonRow 는 하위까지 묶어 주므로 재귀를 끈다. */
    nodeInfo(dataRow) {
      if (!this.dataProvider || dataRow == null || dataRow < 0) return null
      try {
        return this.dataProvider.getJsonRow(dataRow, false, false) || null
      } catch (e) {
        return null
      }
    }
  }
}
</script>

<style scoped>
.modal-backdrop-custom {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(3px);
  z-index: 1060;
}

.modal-card-custom {
  width: 760px;
  max-width: 95vw;
  display: flex;
  flex-direction: column;
  animation: fadeInModal 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

/* 트리는 카드 안에서 고정 높이를 갖고, 넘치면 그리드 자체가 스크롤한다 */
.popup-tree-body {
  height: 380px;
  padding: var(--b2b-space-3);
}

.popup-tree-body :deep(.realgrid-tree-wrapper) {
  border-color: var(--b2b-color-border, #e5e7eb) !important;
}

.min-w-0 {
  min-width: 0;
}

@keyframes fadeInModal {
  from {
    opacity: 0;
    transform: scale(0.96) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
</style>

<!-- 전역(non-scoped): RealGrid 는 setRowStyleCallback 이 준 클래스의 computed 스타일을 읽는다 -->
<style>
.rg-popup-parent-row {
  background: #f1f5f9;
  color: #0f172a;
  font-weight: 700;
}
</style>
