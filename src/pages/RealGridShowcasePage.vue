<template>
  <div class="b2b-page-container">
    <!-- Header -->
    <div class="mb-3">
      <h4 class="fw-bold text-dark m-0">RealGrid 공통 컴포넌트 쇼케이스</h4>
      <p class="text-muted small mb-0">
        <code>RealGridCommonJs</code> / <code>RealGridTreeJs</code> 를 가져다 쓰는 개발자를 위한 옵션 전시장.
        각 예시의 <b>실물 + 복붙 코드</b>를 그대로 사용하세요.
        아래 <b>모든 그리드·트리</b>는 셀에서 <b>우클릭</b>하면 행/열 고정 메뉴가 뜹니다
        (<code>useFixContextMenu</code> 기본 ON, <code>:useFixContextMenu="false"</code>로 끄기).
      </p>
    </div>

    <!-- 옵션 레퍼런스 표 -->
    <div class="b2b-grid-card mb-4">
      <div class="px-3 py-2 border-bottom fw-bold bg-light">
        <i class="bi bi-sliders me-1 text-primary"></i>사용 가능한 Props (옵션)
      </div>
      <div class="p-3 table-responsive">
        <table class="table table-sm table-bordered align-middle mb-0" style="font-size: 13px;">
          <thead class="table-light">
            <tr>
              <th style="width: 180px;">Prop</th>
              <th style="width: 90px;">타입</th>
              <th style="width: 110px;">기본값</th>
              <th style="width: 90px;">범위</th>
              <th>설명</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in optionProps" :key="p.name">
              <td><code>{{ p.name }}</code></td>
              <td>{{ p.type }}</td>
              <td><span class="badge bg-secondary-subtle text-secondary">{{ p.def }}</span></td>
              <td>
                <span
                  class="badge"
                  :class="{
                    'bg-primary-subtle text-primary': p.scope === '공통',
                    'bg-info-subtle text-info': p.scope === '그리드',
                    'bg-success-subtle text-success': p.scope === '트리'
                  }"
                >{{ p.scope }}</span>
              </td>
              <td>{{ p.desc }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 예시 카드들 -->
    <div class="row g-4">
      <div v-for="ex in examples" :key="ex.id" class="col-12 col-xl-6">
        <div class="b2b-grid-card h-100 d-flex flex-column">
          <!-- 카드 헤더 -->
          <div class="px-3 py-2 border-bottom d-flex align-items-center justify-content-between bg-light">
            <div>
              <span class="badge me-1" :class="ex.kind === 'tree' ? 'bg-success-subtle text-success' : 'bg-info-subtle text-info'">
                {{ ex.kind === 'tree' ? 'Tree' : 'Grid' }}
              </span>
              <span class="fw-bold">{{ ex.title }}</span>
            </div>
            <button class="btn btn-sm btn-outline-primary py-0 px-2" @click="copyCode(ex.code)">
              <i class="bi bi-clipboard me-1"></i>코드 복사
            </button>
          </div>

          <p class="text-muted small px-3 pt-2 mb-2">{{ ex.desc }}</p>

          <!-- 실물 -->
          <div class="px-3">
            <!-- Grid 예시 -->
            <RealGridCommonJs
              v-if="ex.kind === 'grid'"
              :fields="gridFields"
              :columns="gridColumns"
              :rows="gridRows"
              height="230px"
              :toast="showToastFn"
              :useCheckBar="ex.props.useCheckBar"
              :useStateBar="ex.props.useStateBar"
              :useIndicator="ex.props.useIndicator"
              :checkBarExclusive="ex.props.checkBarExclusive"
              :editable="ex.props.editable"
              :useFooter="ex.props.useFooter"
            />
            <!-- Tree 예시 -->
            <RealGridTreeJs
              v-else
              :fields="treeFields"
              :columns="treeColumns"
              :rows="deptData"
              childrenField="children"
              height="260px"
              :toast="showToastFn"
              :useCheckBar="ex.props.useCheckBar"
              :useStateBar="ex.props.useStateBar"
              :useIndicator="ex.props.useIndicator"
              :editable="ex.props.editable"
            />
          </div>

          <!-- 복붙 코드 -->
          <div class="px-3 pb-3 pt-2 mt-auto">
            <pre class="code-block mb-0"><code>{{ ex.code }}</code></pre>
          </div>
        </div>
      </div>
    </div>

    <!-- ================= 기능(메서드) 예시 ================= -->
    <div class="mt-5 mb-2">
      <h5 class="fw-bold m-0"><i class="bi bi-lightning-charge-fill me-1 text-warning"></i>기능(메서드) 예시 — ref 로 호출</h5>
      <p class="text-muted small mb-0">
        부모에서 <code>this.$refs.그리드.메서드()</code> 로 호출합니다. 아래 데모 버튼을 직접 눌러보세요.
      </p>
    </div>

    <!-- 메서드 레퍼런스 표 -->
    <div class="b2b-grid-card mb-3">
      <div class="px-3 py-2 border-bottom fw-bold bg-light">
        <i class="bi bi-code-slash me-1 text-primary"></i>공통 메서드 (mixin) &amp; 전용 메서드
      </div>
      <div class="p-3 table-responsive">
        <table class="table table-sm table-bordered align-middle mb-0" style="font-size: 13px;">
          <thead class="table-light">
            <tr>
              <th style="width: 320px;">메서드</th>
              <th style="width: 90px;">범위</th>
              <th>설명</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in methodList" :key="m.name">
              <td><code>{{ m.name }}</code></td>
              <td>
                <span
                  class="badge"
                  :class="{
                    'bg-primary-subtle text-primary': m.scope === '공통',
                    'bg-info-subtle text-info': m.scope === '그리드',
                    'bg-success-subtle text-success': m.scope === '트리'
                  }"
                >{{ m.scope }}</span>
              </td>
              <td>{{ m.desc }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 인터랙티브 데모 -->
    <div class="b2b-grid-card mb-4">
      <div class="px-3 py-2 border-bottom d-flex flex-wrap align-items-center justify-content-between gap-2 bg-light">
        <div class="d-flex align-items-center gap-2">
          <span class="badge bg-info-subtle text-info">Live Demo</span>
          <QuickSearchBar :searchResult="demoSearchResult" @search="onDemoSearch" @clear="demoSearchResult = { count: 0, current: 0 }" />
        </div>
        <div class="d-flex align-items-center gap-1.5">
          <button class="btn-b2b-action" title="컬럼 숨김/표시" @click="openDemoPicker">
            <i class="bi bi-eye text-primary me-0.5"></i><span>컬럼</span>
          </button>
          <button class="btn-b2b-action" title="엑셀 내보내기" @click="demoExcel">
            <i class="bi bi-file-earmark-excel text-success me-0.5"></i><span>엑셀</span>
          </button>
          <button class="btn-b2b-action" title="행 추가" @click="demoAddRow">
            <i class="bi bi-plus-lg text-success me-0.5"></i><span>추가</span>
          </button>
          <button class="btn-b2b-action" title="체크 행 삭제" @click="demoDeleteChecked">
            <i class="bi bi-dash-lg text-danger me-0.5"></i><span>삭제</span>
          </button>
          <button class="btn-b2b-primary ms-1" title="변경사항 확인(저장)" @click="demoSave">
            <i class="bi bi-check2 me-0.5"></i><span>저장</span>
          </button>
        </div>
      </div>

      <div class="px-3 pt-2">
        <span class="text-muted small"><i class="bi bi-info-circle me-1"></i>셀 더블클릭 편집 · <b>우클릭</b>으로 행/열 고정 · 검색/엑셀/컬럼/추가/삭제는 위 버튼</span>
      </div>

      <div class="p-3">
        <RealGridCommonJs
          ref="demoGrid"
          :fields="gridFields"
          :columns="gridColumns"
          :rows="gridRows"
          height="260px"
          :useFooter="true"
          :toast="showToastFn"
          @init="onDemoInit"
        />
      </div>

      <div class="px-3 pb-3">
        <pre class="code-block mb-0"><code>{{ demoCode }}</code></pre>
      </div>
    </div>

    <!-- 데모 컬럼 피커 -->
    <ColumnPickerModal
      :isOpen="isDemoPickerOpen"
      :columns="demoPickerCols"
      @close="isDemoPickerOpen = false"
      @toggle-column="onDemoToggleColumn"
    />
  </div>
</template>

<script>
import RealGridCommonJs from '@/components/RealGridCommonJs.vue'
import RealGridTreeJs from '@/components/RealGridTreeJs.vue'
import QuickSearchBar from '@/components/QuickSearchBar.vue'
import ColumnPickerModal from '@/components/ColumnPickerModal.vue'
import { showToast } from '@/utils/toastUtil.js'
import { departmentTree } from '@/data/treeData.js'

export default {
  name: 'RealGridShowcasePage',
  components: { RealGridCommonJs, RealGridTreeJs, QuickSearchBar, ColumnPickerModal },
  data() {
    return {
      deptData: departmentTree,

      // 기능 데모 상태
      demoSearchResult: { count: 0, current: 0 },
      isDemoPickerOpen: false,
      demoPickerCols: [],

      // 메서드 레퍼런스
      methodList: [
        { name: 'exportToExcel(fileName?)', scope: '공통', desc: '현재 그리드를 엑셀 파일로 내보내기' },
        { name: 'searchGrid(query, direction)', scope: '공통', desc: '값 검색 후 매칭 셀로 포커스 이동 (next/prev)' },
        { name: 'getColumnsInfo()', scope: '공통', desc: '컬럼 목록 조회 (컬럼 피커용)' },
        { name: 'setColumnVisible(name, visible)', scope: '공통', desc: '특정 컬럼 표시/숨김' },
        { name: 'setFixedOptions({colCount,rowCount})', scope: '공통', desc: '행/열 고정 설정' },
        { name: 'handleDynamicFixing(item, clickData)', scope: '공통', desc: '우클릭 컨텍스트 메뉴 행/열 고정 헬퍼' },
        { name: 'expandAll() / collapseAll()', scope: '공통', desc: '전체 펼치기 / 접기 (트리·그룹)' },
        { name: 'deleteChecked()', scope: '공통', desc: '체크박스로 선택된 행 삭제 (트리는 하위 포함)' },
        { name: 'commit()', scope: '공통', desc: '편집 중인 셀 값 확정' },
        { name: 'getChanges()', scope: '공통', desc: '변경분 반환 { created, updated, deleted }' },
        { name: 'clearRowStates()', scope: '공통', desc: '변경 상태(C/U/D) 초기화' },
        { name: 'groupBy(fields)', scope: '그리드', desc: '지정 필드로 행 그룹화' },
        { name: 'insertRow(index, data) / addRow(data)', scope: '그리드', desc: '행 삽입 / 추가' },
        { name: 'addChildToCurrent(values) / addRootRow(values)', scope: '트리', desc: '선택 노드의 자식 / 루트 노드 추가' },
        { name: 'addSiblingToCurrent(values)', scope: '트리', desc: '선택 노드와 동일 계층(형제) 노드 추가' },
        { name: 'duplicateCurrentNode()', scope: '트리', desc: '현재 선택 노드 데이터 복제' },
        { name: 'removeCurrent(recursive)', scope: '트리', desc: '현재 선택 노드 삭제 (하위 포함)' },
        { name: 'moveCurrentUp() / moveCurrentDown()', scope: '트리', desc: '선택 노드 위로 / 아래로 이동 (형제 간 위치 변경)' },
        { name: 'changeNodeParent(row, parent, index)', scope: '트리', desc: '노드의 상위 계층(부모) 변경' },
        { name: 'expandLevel(level)', scope: '트리', desc: '지정한 계층 깊이까지만 전체 펼치기 (1단계/2단계)' }
      ],

      demoCode:
`<!-- 템플릿 -->
<RealGridCommonJs ref="demoGrid" :fields="..." :columns="..." :rows="..." @init="onInit" />
<QuickSearchBar :searchResult="r" @search="onSearch" />

// 스크립트 — ref 로 메서드 호출
this.$refs.demoGrid.exportToExcel('data.xlsx')
this.$refs.demoGrid.searchGrid('김철수', 'next')
this.$refs.demoGrid.insertRow(0, { id: 'new', name: '신규' })
const cnt = this.$refs.demoGrid.deleteChecked()
this.$refs.demoGrid.commit()
const changes = this.$refs.demoGrid.getChanges() // {created,updated,deleted}

// 우클릭 행/열 고정 (onInit 에서 컨텍스트 메뉴 배선)
onInit({ gridView }) {
  gridView.setContextMenu([{ label: '열 고정', tag: 'fixColumn' }, ...])
  gridView.onContextMenuItemClicked = (g, item, data) =>
    this.$refs.demoGrid.handleDynamicFixing(item, data)
}`,

      // 옵션 레퍼런스 표
      optionProps: [
        { name: 'fields', type: 'Array', def: '[]', scope: '공통', desc: '필드 정의 (dataType 등)' },
        { name: 'columns', type: 'Array', def: '[]', scope: '공통', desc: '컬럼 정의 (header/width 등)' },
        { name: 'rows', type: 'Array', def: '[]', scope: '공통', desc: '데이터 행 (트리는 children 중첩)' },
        { name: 'height', type: 'String', def: "'580px'", scope: '공통', desc: '그리드 높이' },
        { name: 'editable', type: 'Boolean', def: 'true', scope: '공통', desc: '셀 편집/행 추가 가능' },
        { name: 'softDeleting', type: 'Boolean', def: 'true', scope: '공통', desc: '소프트 삭제(삭제표시)' },
        { name: 'hideDeletedRows', type: 'Boolean', def: 'true', scope: '공통', desc: '삭제표시 행 숨김 (false=취소선 표시)' },
        { name: 'useStateBar', type: 'Boolean', def: 'true', scope: '공통', desc: '행 상태 컬러 바(추가/수정/삭제)' },
        { name: 'useCheckBar', type: 'Boolean', def: 'true', scope: '공통', desc: '좌측 체크박스 열(다중선택)' },
        { name: 'useIndicator', type: 'Boolean', def: 'true', scope: '공통', desc: '행번호 인디케이터 열' },
        { name: 'checkBarExclusive', type: 'Boolean', def: 'false', scope: '공통', desc: '체크박스 단일선택 모드' },
        { name: 'cascadeChildCheck', type: 'Boolean', def: 'true', scope: '트리', desc: '상위 노드 체크 시 하위 자식 노드 동시 자동 선택/해제' },
        { name: 'checkBarWidth', type: 'Number', def: '36', scope: '공통', desc: '체크박스 열 너비' },
        { name: 'stateBarWidth', type: 'Number', def: '6', scope: '공통', desc: '상태 바 너비' },
        { name: 'useFixContextMenu', type: 'Boolean', def: 'true', scope: '공통', desc: '우클릭 컨텍스트 메뉴(행/열 고정) — 기본 제공, 끄려면 false' },
        { name: 'useFooter', type: 'Boolean', def: 'false', scope: '그리드', desc: '푸터(합계 등) 표시' },
        { name: 'useGroupPanel', type: 'Boolean', def: 'false', scope: '그리드', desc: '그룹 드래그 패널' },
        { name: 'childrenField', type: 'String', def: "'children'", scope: '트리', desc: '자식 배열이 담긴 속성명' },
        { name: 'iconField', type: 'String', def: "''", scope: '트리', desc: '노드 아이콘 경로 필드명' },
        { name: 'treeLineVisible', type: 'Boolean', def: 'true', scope: '트리', desc: '계층 라인 표시' },
        { name: 'expandAllOnLoad', type: 'Boolean', def: 'true', scope: '트리', desc: '로드 시 전체 펼침' },
        { name: 'enableDragAndDrop', type: 'Boolean', def: 'true', scope: '트리', desc: '마우스 드래그 앤 드롭 노드 이동 및 부모 변경' }
      ],

      // Grid 샘플 데이터
      gridFields: [
        { fieldName: 'id', dataType: 'text' },
        { fieldName: 'name', dataType: 'text' },
        { fieldName: 'dept', dataType: 'text' },
        { fieldName: 'salary', dataType: 'number' }
      ],
      gridColumns: [
        { name: 'id', fieldName: 'id', width: 70, header: { text: 'ID' }, editable: false, styles: { textAlignment: 'center' } },
        { name: 'name', fieldName: 'name', width: 90, header: { text: '이름' }, styles: { textAlignment: 'center' } },
        { name: 'dept', fieldName: 'dept', width: 120, header: { text: '부서' } },
        { name: 'salary', fieldName: 'salary', width: 110, header: { text: '급여' }, numberFormat: '#,##0', styles: { textAlignment: 'far' }, footer: { expression: 'sum', numberFormat: '#,##0', styles: { textAlignment: 'far', fontWeight: 'bold' } } }
      ],
      gridRows: [
        { id: 'u01', name: '김철수', dept: '개발팀', salary: 5200 },
        { id: 'u02', name: '이영희', dept: '개발팀', salary: 4800 },
        { id: 'u03', name: '박민수', dept: '영업팀', salary: 4600 },
        { id: 'u04', name: '정수진', dept: '영업팀', salary: 5100 },
        { id: 'u05', name: '홍길동', dept: '기획팀', salary: 4400 }
      ],

      // Tree 샘플 컬럼
      treeFields: [
        { fieldName: 'deptCode', dataType: 'text' },
        { fieldName: 'deptName', dataType: 'text' },
        { fieldName: 'manager', dataType: 'text' },
        { fieldName: 'headcount', dataType: 'number' }
      ],
      treeColumns: [
        { name: 'deptName', fieldName: 'deptName', width: 200, header: { text: '조직명' } },
        { name: 'deptCode', fieldName: 'deptCode', width: 90, header: { text: '코드' }, editable: false, styles: { textAlignment: 'center' } },
        { name: 'manager', fieldName: 'manager', width: 80, header: { text: '책임자' }, styles: { textAlignment: 'center' } },
        { name: 'headcount', fieldName: 'headcount', width: 70, header: { text: '인원' }, numberFormat: '#,##0', styles: { textAlignment: 'far' } }
      ],

      // 전시 예시 (실물 props + 복붙 코드)
      examples: [
        {
          id: 'grid-default',
          kind: 'grid',
          title: '기본 그리드 (모든 옵션 ON)',
          desc: '아무 옵션도 안 넘기면 체크박스·상태바·인디케이터가 모두 켜진 표준 그리드입니다.',
          props: { useCheckBar: true, useStateBar: true, useIndicator: true, checkBarExclusive: false, editable: true, useFooter: true },
          code:
`<RealGridCommonJs
  :fields="gridFields"
  :columns="gridColumns"
  :rows="gridRows"
  :useFooter="true"
/>`
        },
        {
          id: 'grid-readonly',
          kind: 'grid',
          title: '조회 전용 그리드 (제어열 최소화)',
          desc: '편집·체크박스·상태바·인디케이터를 모두 끈 깔끔한 조회용 그리드.',
          props: { useCheckBar: false, useStateBar: false, useIndicator: false, checkBarExclusive: false, editable: false, useFooter: false },
          code:
`<RealGridCommonJs
  :fields="gridFields"
  :columns="gridColumns"
  :rows="gridRows"
  :editable="false"
  :useCheckBar="false"
  :useStateBar="false"
  :useIndicator="false"
/>`
        },
        {
          id: 'grid-exclusive',
          kind: 'grid',
          title: '단일선택 체크박스 + 푸터',
          desc: '체크박스를 라디오(단일선택)로 바꾸고 합계 푸터를 켠 예시.',
          props: { useCheckBar: true, useStateBar: true, useIndicator: true, checkBarExclusive: true, editable: true, useFooter: true },
          code:
`<RealGridCommonJs
  :fields="gridFields"
  :columns="gridColumns"
  :rows="gridRows"
  :checkBarExclusive="true"
  :useFooter="true"
/>`
        },
        {
          id: 'tree-default',
          kind: 'tree',
          title: '기본 트리 (계층 + 체크박스)',
          desc: 'children 중첩 데이터를 넘기면 계층 트리로 렌더링. 제어열 기본 ON.',
          props: { useCheckBar: true, useStateBar: true, useIndicator: true, editable: true },
          code:
`<RealGridTreeJs
  :fields="treeFields"
  :columns="treeColumns"
  :rows="deptData"
  childrenField="children"
/>`
        },
        {
          id: 'tree-readonly',
          kind: 'tree',
          title: '조회 전용 트리 (체크박스·상태바 OFF)',
          desc: '단순 계층 조회용. 체크박스·상태바 없이 트리 구조만 보여줍니다.',
          props: { useCheckBar: false, useStateBar: false, useIndicator: true, editable: false },
          code:
`<RealGridTreeJs
  :fields="treeFields"
  :columns="treeColumns"
  :rows="deptData"
  childrenField="children"
  :editable="false"
  :useCheckBar="false"
  :useStateBar="false"
/>`
        }
      ]
    }
  },
  methods: {
    // 자기완결 트리 컴포넌트의 알림을 이 프로젝트 토스트로 연결
    showToastFn(message, opts = {}) {
      showToast(message, opts)
    },

    copyCode(code) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code)
          .then(() => showToast('코드가 클립보드에 복사되었습니다.', { type: 'success' }))
          .catch(() => showToast('복사에 실패했습니다. 직접 선택해 복사하세요.', { type: 'warning' }))
      } else {
        showToast('이 브라우저에서는 자동 복사가 지원되지 않습니다.', { type: 'warning' })
      }
    },

    // ===== 기능 데모 (ref 로 mixin 메서드 호출) =====
    onDemoInit({ gridView }) {
      // 우클릭 컨텍스트 메뉴 → 행/열 고정 (handleDynamicFixing 공통 헬퍼)
      gridView.setContextMenu([
        { label: '📌 선택한 열까지 고정', tag: 'fixColumn' },
        { label: '📌 선택한 행까지 고정', tag: 'fixRow' },
        { label: '📌 선택한 행/열 모두 고정', tag: 'fixBoth' },
        { label: '❌ 고정 해제 (초기화)', tag: 'clearFixing' }
      ])
      gridView.onContextMenuItemClicked = (grid, item, clickData) => {
        this.$refs.demoGrid?.handleDynamicFixing(item, clickData)
      }
    },

    onDemoSearch({ query, direction }) {
      if (this.$refs.demoGrid) {
        this.demoSearchResult = this.$refs.demoGrid.searchGrid(query, direction)
      }
    },

    openDemoPicker() {
      if (this.$refs.demoGrid) {
        this.demoPickerCols = this.$refs.demoGrid.getColumnsInfo()
        this.isDemoPickerOpen = true
      }
    },

    onDemoToggleColumn({ name, visible }) {
      this.$refs.demoGrid?.setColumnVisible(name, visible)
    },

    demoExcel() {
      this.$refs.demoGrid?.exportToExcel('Showcase_Demo.xlsx')
    },

    demoAddRow() {
      const tempId = 'new_' + Math.random().toString(36).substring(2, 6)
      this.$refs.demoGrid?.insertRow(0, { id: tempId, name: '신규 사용자', dept: '신규팀', salary: 4000 })
      showToast('상단에 새 행이 추가되었습니다 (State: Created).', { type: 'info' })
    },

    demoDeleteChecked() {
      const count = this.$refs.demoGrid ? this.$refs.demoGrid.deleteChecked() : 0
      if (count === 0) {
        showToast('삭제할 행을 왼쪽 체크박스로 선택해 주세요.', { type: 'warning' })
        return
      }
      showToast(`${count}건이 삭제 표시되었습니다 (State: Deleted).`, { type: 'warning' })
    },

    demoSave() {
      this.$refs.demoGrid?.commit()
      const changes = this.$refs.demoGrid?.getChanges()
      const total = (changes?.created.length || 0) + (changes?.updated.length || 0) + (changes?.deleted.length || 0)
      if (total === 0) {
        showToast('변경사항이 없습니다.', { type: 'warning' })
        return
      }
      console.log('[Showcase] 변경분:', changes)
      showToast(`변경분 확인 — C:${changes.created.length} / U:${changes.updated.length} / D:${changes.deleted.length}`, { type: 'success' })
      this.$refs.demoGrid?.clearRowStates()
    }
  }
}
</script>

<style scoped>
.code-block {
  background: #0f172a;
  color: #e2e8f0;
  border-radius: 8px;
  padding: 12px 14px;
  font-size: 12.5px;
  line-height: 1.55;
  overflow-x: auto;
  white-space: pre;
  font-family: 'D2Coding', 'Consolas', 'Courier New', monospace;
}
</style>
