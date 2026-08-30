<template>
  <div class="b2b-page-container">
    <!-- Toolbar -->
    <div class="b2b-toolbar">
      <div class="d-flex align-items-center justify-content-between w-100">
        <div class="d-flex align-items-center gap-2">
          <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1">mergeRule 셀 병합</span>
          <QuickSearchBar
            :searchResult="searchResult"
            @search="onGridSearch"
            @clear="searchResult = { count: 0, current: 0 }"
          />
        </div>
        <div class="d-flex align-items-center gap-2 ms-auto">
          <button class="btn-b2b-action" title="병합 기준 컬럼 순서대로 다시 정렬합니다" @click="resortByMergeKeys">
            <i class="bi bi-sort-down text-primary me-0.5"></i>
            <span>정렬 재적용</span>
          </button>
          <button class="btn-b2b-action" title="병합 상태를 초기값으로 되돌립니다" @click="resetDemo">
            <i class="bi bi-arrow-counterclockwise text-secondary me-0.5"></i>
            <span>초기화</span>
          </button>
          <span class="vr mx-1"></span>
          <button class="btn-b2b-action" title="엑셀 파일 내보내기" @click="exportExcel">
            <i class="bi bi-file-earmark-excel text-success me-0.5"></i>
            <span>엑셀</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 옵션 패널 -->
    <div class="b2b-card mb-3">
      <div class="b2b-card-header">
        <span class="rg-merge-title">
          <i class="bi bi-layout-three-columns text-primary me-1"></i>
          셀 병합 옵션 (mergeRule)
        </span>
        <span class="rg-merge-hint">
          병합은 <b>연속된 행</b>에만 적용됩니다. 기준 컬럼으로 정렬돼 있어야 제대로 묶입니다.
        </span>
      </div>
      <div class="b2b-card-body">
        <div class="rg-merge-switches">
          <label class="form-check form-switch rg-switch">
            <input class="form-check-input" type="checkbox" v-model="mergeEnabled" @change="applyMergeRules">
            <span class="form-check-label">셀 병합 사용</span>
          </label>
          <label class="form-check form-switch rg-switch">
            <input class="form-check-input" type="checkbox" v-model="hierarchical" :disabled="!mergeEnabled" @change="applyMergeRules">
            <span class="form-check-label">계층 기준 병합 (상위 값까지 같아야 묶음)</span>
          </label>
          <label class="form-check form-switch rg-switch">
            <input class="form-check-input" type="checkbox" v-model="breakOnEmpty" :disabled="!mergeEnabled" @change="applyBreakOnEmpty">
            <span class="form-check-label">빈 값이면 병합 중단 (breakMergeOnEmpty)</span>
          </label>
          <label class="form-check form-switch rg-switch">
            <input class="form-check-input" type="checkbox" v-model="showInnerFocus" @change="applyShowInnerFocus">
            <span class="form-check-label">병합 셀 안의 개별 행 포커스 표시 (showInnerFocus)</span>
          </label>
          <label class="form-check form-switch rg-switch">
            <input class="form-check-input" type="checkbox" v-model="mergeEdit" :disabled="!mergeEnabled" @change="applyMergeEdit">
            <span class="form-check-label">병합 셀 수정 시 묶인 행 전체 반영 (mergeEdit)</span>
          </label>
          <label class="form-check form-switch rg-switch rg-switch-compare">
            <input class="form-check-input" type="checkbox" v-model="groupCompare" @change="applyGroupCompare">
            <span class="form-check-label">
              <i class="bi bi-exclamation-triangle text-warning me-1"></i>
              비교: rowGroup mergeMode 로 바꿔보기 (회색 그룹 셀)
            </span>
          </label>
        </div>

        <div class="rg-merge-note">
          <div class="rg-merge-note-row">
            <span class="rg-merge-tag rg-merge-tag-ok">mergeRule</span>
            <span>
              컬럼 속성입니다. 병합된 칸도 <b>일반 데이터 셀</b>이라 배경색이 그대로입니다.
              편집·정렬·엑셀 내보내기 모두 평소와 같습니다.
              모든 컬럼을 한 번에 묶기만 하면 될 때는 공통 컴포넌트에 <code>:merge-mode="true"</code>
              (= <code>:mergeable="true"</code>)만 주면 되고, 이 페이지처럼 컬럼별로 다른 기준이 필요할 때 직접 수식을 씁니다.
              컬럼 정의에 <code>mergeRule</code>이 있으면 공통 컴포넌트는 그 값을 덮어쓰지 않습니다.
            </span>
          </div>
          <div class="rg-merge-note-row">
            <span class="rg-merge-tag rg-merge-tag-warn">rowGroup.mergeMode</span>
            <span>
              그룹핑 옵션입니다. 합쳐진 칸이 데이터 셀이 아니라 <b>그룹 셀</b>
              (<code>.rg-rowgroup-header</code> / <code>.rg-rowgroup-bar</code> / <code>.rg-rowgroup-footer</code>)로 그려지고,
              테마 CSS가 여기에 회색 계열 배경을 칠합니다
              (<code>realgrid-style.css</code>는 <code>whitesmoke</code>, <code>realgrid-white.css</code>는 <code>#f1f7ff</code> / 푸터 <code>#f7f7f7</code>).
              색만 바꾸고 싶다면 테마 CSS 뒤에서 이 클래스들을 덮어쓰면 됩니다. 위 비교 스위치로 직접 확인해 보세요.
            </span>
          </div>
        </div>

        <pre class="rg-merge-code">{{ appliedRuleCode }}</pre>
      </div>
    </div>

    <!-- Grid -->
    <div class="b2b-grid-card mb-4">
      <div class="b2b-grid-wrapper">
        <RealGridCommonJs
          grid-id="realgrid-merge-page"
          :fields="gridFields"
          :columns="gridColumns"
          :rows="members"
          :sortable="true"
          :filterable="true"
          :checkable="true"
          :show-row-number="true"
          :state-bar-visible="true"
          :state-bar-width="20"
          :check-bar-width="36"
          :pinnable="true"
          :group-panel-visible="false"
          :column-hideable="false"
          :commit-when-leave="true"
          :use-footer="true"
          :fit-style="'evenFill'"
          :grid-options="gridOptions"
          :toast="gridToast"
          @init="onGridInit"
        />
      </div>
    </div>
  </div>
</template>

<script>
import RealGridCommonJs from '@/components/RealGridCommonJs.vue'
import QuickSearchBar from '@/components/QuickSearchBar.vue'
import { showToast } from '@/utils/toastUtil.js'
import { searchGrid } from '@/utils/realgridOps'

/** 병합 기준 컬럼 (상위 → 하위 순서) */
const MERGE_KEYS = ['region', 'dept', 'team']

export default {
  name: 'RealGridMergePage',
  components: { RealGridCommonJs, QuickSearchBar },
  data() {
    return {
      searchResult: { count: 0, current: 0 },
      mergeEnabled: true,
      hierarchical: true,
      breakOnEmpty: true,
      showInnerFocus: true,
      mergeEdit: false,
      groupCompare: false,
      members: [
        { memberId: 'm-001', region: '서울', dept: '개발본부', team: '플랫폼팀', name: '박민준', role: 'Backend', evalGrade: 'A', salary: 7200, joinDate: '2019-04-12' },
        { memberId: 'm-002', region: '서울', dept: '개발본부', team: '플랫폼팀', name: '이수현', role: 'Backend', evalGrade: 'S', salary: 9520, joinDate: '2018-01-15' },
        { memberId: 'm-003', region: '서울', dept: '개발본부', team: '플랫폼팀', name: '한지우', role: 'DevOps', evalGrade: 'B', salary: 6100, joinDate: '2021-08-20' },
        { memberId: 'm-004', region: '서울', dept: '개발본부', team: '프론트팀', name: '김지훈', role: 'Frontend', evalGrade: 'A', salary: 6800, joinDate: '2020-03-09' },
        { memberId: 'm-005', region: '서울', dept: '개발본부', team: '프론트팀', name: '정예린', role: 'Frontend', evalGrade: 'B', salary: 5400, joinDate: '2022-06-01' },
        { memberId: 'm-006', region: '서울', dept: '경영지원', team: '인사팀', name: '오세훈', role: 'HR', evalGrade: 'B', salary: 5100, joinDate: '2017-11-02' },
        { memberId: 'm-007', region: '서울', dept: '경영지원', team: '인사팀', name: '문가영', role: 'HR', evalGrade: 'A', salary: 5600, joinDate: '2020-09-14' },
        { memberId: 'm-008', region: '서울', dept: '경영지원', team: '', name: '배준호', role: '미배정', evalGrade: 'C', salary: 4300, joinDate: '2024-02-19' },
        { memberId: 'm-009', region: '대전', dept: '연구소', team: '제어팀', name: '신동하', role: 'Embedded', evalGrade: 'S', salary: 8800, joinDate: '2016-05-23' },
        { memberId: 'm-010', region: '대전', dept: '연구소', team: '제어팀', name: '윤가온', role: 'Embedded', evalGrade: 'A', salary: 7400, joinDate: '2019-10-07' },
        { memberId: 'm-011', region: '대전', dept: '연구소', team: '해석팀', name: '조민서', role: 'Research', evalGrade: 'B', salary: 6600, joinDate: '2021-02-15' },
        { memberId: 'm-012', region: '대전', dept: '품질본부', team: '검사팀', name: '류하람', role: 'QA', evalGrade: 'B', salary: 5200, joinDate: '2022-04-04' },
        { memberId: 'm-013', region: '대전', dept: '품질본부', team: '검사팀', name: '임채원', role: 'QA', evalGrade: 'C', salary: 4700, joinDate: '2023-07-18' },
        { memberId: 'm-014', region: '광주', dept: '생산본부', team: '1라인', name: '고은상', role: 'Operator', evalGrade: 'B', salary: 4600, joinDate: '2018-08-30' },
        { memberId: 'm-015', region: '광주', dept: '생산본부', team: '1라인', name: '남도윤', role: 'Operator', evalGrade: 'A', salary: 5000, joinDate: '2019-12-11' },
        { memberId: 'm-016', region: '광주', dept: '생산본부', team: '2라인', name: '서하율', role: 'Operator', evalGrade: 'C', salary: 4400, joinDate: '2023-03-27' }
      ],
      gridFields: [
        { fieldName: 'memberId', dataType: 'text' },
        { fieldName: 'region', dataType: 'text' },
        { fieldName: 'dept', dataType: 'text' },
        { fieldName: 'team', dataType: 'text' },
        { fieldName: 'name', dataType: 'text' },
        { fieldName: 'role', dataType: 'text' },
        { fieldName: 'evalGrade', dataType: 'text' },
        { fieldName: 'salary', dataType: 'number' },
        { fieldName: 'joinDate', dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd' }
      ],
      gridColumns: [
        {
          name: 'region',
          fieldName: 'region',
          width: '90',
          header: { text: '근무지역' },
          styles: { textAlignment: 'center' },
          // 이전 행과 값이 같으면 위 셀과 합친다
          mergeRule: "values['region']"
        },
        {
          name: 'dept',
          fieldName: 'dept',
          width: '120',
          header: { text: '본부' },
          styles: { textAlignment: 'center' },
          // 지역이 다르면 본부 이름이 같아도 따로 묶이도록 상위 값을 함께 사용
          mergeRule: "values['region'] + '|' + values['dept']"
        },
        {
          name: 'team',
          fieldName: 'team',
          width: '120',
          header: { text: '팀' },
          styles: { textAlignment: 'center' },
          mergeRule: "values['region'] + '|' + values['dept'] + '|' + values['team']",
          breakMergeOnEmpty: true
        },
        {
          name: 'name',
          fieldName: 'name',
          width: '100',
          header: { text: '성명' },
          styles: { textAlignment: 'center' }
        },
        {
          name: 'role',
          fieldName: 'role',
          width: '110',
          header: { text: '직무' },
          styles: { textAlignment: 'near' }
        },
        {
          name: 'evalGrade',
          fieldName: 'evalGrade',
          width: '80',
          header: { text: '평가등급' },
          styles: { textAlignment: 'center', fontWeight: 'bold' },
          editor: {
            type: 'dropdown',
            dropDownCount: 4,
            domainOnly: true,
            labels: ['S', 'A', 'B', 'C'],
            values: ['S', 'A', 'B', 'C']
          }
        },
        {
          name: 'salary',
          fieldName: 'salary',
          width: '110',
          header: { text: '급여 (만원)' },
          numberFormat: '#,##0',
          styles: { textAlignment: 'far' },
          footer: { expression: 'sum', numberFormat: '#,##0', styles: { textAlignment: 'far', fontWeight: 'bold' } }
        },
        {
          name: 'joinDate',
          fieldName: 'joinDate',
          width: '110',
          header: { text: '입사일자' },
          datetimeFormat: 'yyyy-MM-dd',
          styles: { textAlignment: 'center' },
          editor: { type: 'date', datetimeFormat: 'yyyy-MM-dd', commitBySelect: true }
        }
      ]
    }
  },
  computed: {
    /** 병합 셀을 편집해도 묶인 행 전체에 반영하려면 commitByCell 이 켜져 있어야 한다 */
    gridOptions() {
      return {
        displayOptions: { showInnerFocus: true, rowHoverType: 'row' },
        editOptions: { commitByCell: true }
      }
    },
    appliedRuleCode() {
      if (this.groupCompare) {
        return [
          '// 비교 모드 — 셀 병합이 아니라 그룹핑입니다',
          "gridView.setRowGroup({ mergeMode: true, summaryMode: 'aggregate', hideGroupedColumn: true })",
          "gridView.groupBy(['region', 'dept'])",
          '// 합쳐진 칸이 .rg-rowgroup-header 라서 테마 CSS 가 회색을 칠합니다'
        ].join('\n')
      }
      if (!this.mergeEnabled) {
        return MERGE_KEYS.map(k => `gridView.setColumnProperty('${k}', 'mergeRule', null)  // 병합 해제`).join('\n')
      }
      return MERGE_KEYS
        .map(k => `gridView.setColumnProperty('${k}', 'mergeRule', "${this.ruleOf(k)}")`)
        .concat([`gridView.setColumnProperty('team', 'breakMergeOnEmpty', ${this.breakOnEmpty})`])
        .join('\n')
    }
  },
  methods: {
    gridToast(message, opts = {}) {
      showToast(message, opts)
    },

    onGridInit({ gridView, dataProvider }) {
      this.gridView = gridView
      this.dataProvider = dataProvider

      // 병합은 연속된 행 기준이므로 기준 컬럼 순서대로 정렬해 둔다
      gridView.orderBy(MERGE_KEYS)
      this.applyMergeRules()
    },

    /** 계층 여부에 따른 컬럼별 병합 수식 */
    ruleOf(colName) {
      const idx = MERGE_KEYS.indexOf(colName)
      if (idx < 0) return ''
      if (!this.hierarchical) return `values['${colName}']`
      return MERGE_KEYS.slice(0, idx + 1).map(k => `values['${k}']`).join(" + '|' + ")
    },

    applyMergeRules() {
      if (!this.gridView || this.groupCompare) return
      MERGE_KEYS.forEach(k => {
        // falsy 값을 넣으면 RealGrid 가 기존 규칙을 버리고 병합을 해제한다
        this.gridView.setColumnProperty(k, 'mergeRule', this.mergeEnabled ? this.ruleOf(k) : null)
      })
      this.applyBreakOnEmpty()
      this.applyMergeEdit()
    },

    applyBreakOnEmpty() {
      if (!this.gridView) return
      MERGE_KEYS.forEach(k => {
        this.gridView.setColumnProperty(k, 'breakMergeOnEmpty', this.breakOnEmpty)
      })
    },

    applyShowInnerFocus() {
      if (!this.gridView) return
      this.gridView.setDisplayOptions({ showInnerFocus: this.showInnerFocus })
    },

    applyMergeEdit() {
      if (!this.gridView) return
      MERGE_KEYS.forEach(k => {
        this.gridView.setColumnProperty(k, 'mergeEdit', this.mergeEdit)
      })
    },

    /** 셀 병합(mergeRule) ↔ 그룹 병합(rowGroup.mergeMode) 전환 */
    applyGroupCompare() {
      if (!this.gridView) return

      if (this.groupCompare) {
        // 그룹핑이 켜지면 합쳐진 칸은 그룹 헤더 셀이 되어 회색으로 보인다
        MERGE_KEYS.forEach(k => this.gridView.setColumnProperty(k, 'mergeRule', null))
        this.gridView.setRowGroup({ summaryMode: 'aggregate', mergeMode: true, hideGroupedColumn: true })
        this.gridView.groupBy(['region', 'dept'])
        showToast('rowGroup mergeMode 입니다. 합쳐진 칸이 회색 그룹 셀로 바뀝니다.', { type: 'warning' })
      } else {
        this.gridView.groupBy([])
        this.gridView.orderBy(MERGE_KEYS)
        this.applyMergeRules()
        showToast('mergeRule 셀 병합으로 돌아왔습니다. 배경색이 데이터 셀 그대로입니다.', { type: 'info' })
      }
    },

    resortByMergeKeys() {
      if (!this.gridView) return
      this.gridView.orderBy(MERGE_KEYS)
      showToast('지역 → 본부 → 팀 순으로 정렬했습니다.', { type: 'info' })
    },

    resetDemo() {
      this.mergeEnabled = true
      this.hierarchical = true
      this.breakOnEmpty = true
      this.showInnerFocus = true
      this.mergeEdit = false
      if (this.groupCompare) {
        this.groupCompare = false
        this.applyGroupCompare()
      } else {
        this.resortByMergeKeys()
        this.applyMergeRules()
      }
      this.applyShowInnerFocus()
    },

    exportExcel() {
      if (!this.gridView) return
      this.gridView.exportGrid({
        type: 'excel',
        target: 'local',
        fileName: 'RealGrid_Merge_Sample.xlsx',
        showProgress: true
      })
    },

    onGridSearch({ query, direction }) {
      if (this.gridView) {
        this.searchResult = searchGrid(this.gridView, this.dataProvider, query, direction, showToast)
      }
    }
  }
}
</script>

<style scoped>
.rg-merge-title {
  font-weight: 600;
}
.rg-merge-hint {
  font-size: var(--b2b-font-size-sm, 13px);
  color: var(--b2b-color-text-muted, #64748b);
}
.rg-merge-switches {
  display: flex;
  flex-wrap: wrap;
  gap: var(--b2b-space-2) var(--b2b-space-5);
  margin-bottom: var(--b2b-space-3);
}
.rg-switch {
  display: flex;
  align-items: center;
  gap: var(--b2b-space-2);
  margin: 0;
  min-height: 26px;
}
.rg-switch .form-check-input {
  margin: 0;
  flex: none;
}
.rg-switch .form-check-label {
  cursor: pointer;
}
.rg-switch-compare {
  flex-basis: 100%;
}
.rg-merge-note {
  display: flex;
  flex-direction: column;
  gap: var(--b2b-space-2);
  padding: 10px var(--b2b-space-3);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 6px;
  background-color: var(--b2b-color-bg-subcard, #f8fafc);
}
.rg-merge-note-row {
  display: flex;
  align-items: flex-start;
  gap: var(--b2b-space-2);
}
.rg-merge-tag {
  flex: none;
  padding: 1px var(--b2b-space-2);
  border-radius: 10px;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.7;
  white-space: nowrap;
}
.rg-merge-tag-ok {
  background: #dcfce7;
  color: #166534;
}
.rg-merge-tag-warn {
  background: #fef3c7;
  color: #92400e;
}
.rg-merge-code {
  margin: var(--b2b-space-3) 0 0;
  padding: 10px var(--b2b-space-3);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 6px;
  background-color: var(--b2b-color-bg-subcard, #f8fafc);
  color: var(--b2b-color-text, #0f172a);
  font-family: Consolas, "D2Coding", monospace;
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
