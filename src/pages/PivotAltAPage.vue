<template>
  <div class="container py-3">
    <!-- Header Page Title & Context Guide -->
    <div class="d-flex justify-content-between align-items-center mb-3">
      <div>
        <div class="d-flex align-items-center gap-2">
          <h4 class="fw-bold text-dark m-0">피벗 대안 A: RealGrid 2 행 그룹핑 & 소계</h4>
          <span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">라이선스 미필요</span>
        </div>
        <p class="text-muted small mb-0 mt-1">
          상단 그룹핑 패널로 컬럼 헤더를 **드래그 앤 드롭**하거나Preset 버튼을 클릭하여 다단계 소계/합계를 즉시 확인하세요.
        </p>
      </div>

      <div class="d-flex gap-2">
        <button class="btn btn-outline-secondary btn-sm" @click="expandAll">
          <i class="bi bi-arrows-expand me-1"></i>모두 펼치기
        </button>
        <button class="btn btn-outline-secondary btn-sm" @click="collapseAll">
          <i class="bi bi-arrows-collapse me-1"></i>모두 접기
        </button>
      </div>
    </div>

    <!-- Quick Preset Bar & Description Card -->
    <div class="card bg-light border-0 mb-3 shadow-sm">
      <div class="card-body p-3 d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div class="d-flex align-items-center gap-2">
          <span class="fw-semibold text-secondary small"><i class="bi bi-sliders me-1"></i>빠른 그룹핑:</span>
          <button
            class="btn btn-sm"
            :class="activeGroup === 'dept' ? 'btn-primary' : 'btn-white border'"
            @click="setPresetGroup(['dept'], 'dept')"
          >
            부서별 그룹핑
          </button>
          <button
            class="btn btn-sm"
            :class="activeGroup === 'dept-role' ? 'btn-primary' : 'btn-white border'"
            @click="setPresetGroup(['dept', 'role'], 'dept-role')"
          >
            부서 > 직급별 (2단계)
          </button>
          <button
            class="btn btn-sm"
            :class="activeGroup === 'region-dept' ? 'btn-primary' : 'btn-white border'"
            @click="setPresetGroup(['region', 'dept'], 'region-dept')"
          >
            지역 > 부서별
          </button>
          <button
            class="btn btn-sm"
            :class="activeGroup === 'none' ? 'btn-secondary' : 'btn-white border text-muted'"
            @click="clearGroupBy"
          >
            그룹 해제
          </button>
        </div>

        <div class="text-muted small">
          <i class="bi bi-info-circle me-1 text-primary"></i>
          <strong>팁:</strong> 상단의 <u>'이곳으로 컬럼 헤더를 끌어놓으세요'</u> 영역으로 직접 컬럼을 끌어다 놓아보세요!
        </div>
      </div>
    </div>

    <!-- Grid Container -->
    <div class="card shadow-sm border-light mb-4">
      <div class="card-body p-0">
        <div ref="gridElement" style="width: 100%; height: 580px;"></div>
      </div>
    </div>
  </div>
</template>

<script>
import RealGrid from 'realgrid'
import 'realgrid/dist/realgrid-style.css'
import { showToast } from '@/utils/toastUtil.js'

export default {
  name: 'PivotAltAPage',
  data() {
    return {
      container: null,
      dataProvider: null,
      gridView: null,
      activeGroup: 'dept-role',
      mockData: [
        { userId: 'u001', name: '김철수', dept: '개발 1팀', role: '수석연구원', region: '서울', salary: 7200, sales: 12000, bonus: 500 },
        { userId: 'u002', name: '이영희', dept: '개발 1팀', role: '책임연구원', region: '서울', salary: 6100, sales: 9800, bonus: 400 },
        { userId: 'u003', name: '박민수', dept: '개발 1팀', role: '선임연구원', region: '서울', salary: 4800, sales: 7500, bonus: 300 },
        { userId: 'u004', name: '정수진', dept: '개발 2팀', role: '수석연구원', region: '판교', salary: 7500, sales: 14500, bonus: 600 },
        { userId: 'u005', name: '홍길동', dept: '개발 2팀', role: '책임연구원', region: '판교', salary: 6300, sales: 11000, bonus: 450 },
        { userId: 'u006', name: '강지훈', dept: '개발 2팀', role: '선임연구원', region: '판교', salary: 4600, sales: 8200, bonus: 320 },
        { userId: 'u007', name: '조유진', dept: '영업 1팀', role: '부장', region: '서울', salary: 8000, sales: 32000, bonus: 1200 },
        { userId: 'u008', name: '윤상호', dept: '영업 1팀', role: '차장', region: '서울', salary: 6800, sales: 24000, bonus: 900 },
        { userId: 'u009', name: '한지민', dept: '영업 1팀', role: '과장', region: '서울', salary: 5500, sales: 18000, bonus: 700 },
        { userId: 'u100', name: '임재현', dept: '영업 2팀', role: '부장', region: '부산', salary: 8200, sales: 35000, bonus: 1500 },
        { userId: 'u101', name: '서동현', dept: '영업 2팀', role: '차장', region: '부산', salary: 6900, sales: 26000, bonus: 950 },
        { userId: 'u102', name: '송혜교', dept: '경영지원', role: '부장', region: '서울', salary: 7800, sales: 0, bonus: 800 },
        { userId: 'u103', name: '현빈', dept: '경영지원', role: '과장', region: '서울', salary: 5600, sales: 0, bonus: 500 }
      ]
    }
  },
  mounted() {
    this.initGrid()
  },
  beforeUnmount() {
    if (this.gridView) {
      this.gridView.destroy()
      this.dataProvider.destroy()
    }
  },
  methods: {
    initGrid() {
      this.container = this.$refs.gridElement
      this.dataProvider = new RealGrid.LocalDataProvider(true)
      this.gridView = new RealGrid.GridView(this.container)
      this.gridView.setDataSource(this.dataProvider)

      // 필드 스펙
      const fields = [
        { fieldName: 'userId', dataType: 'text' },
        { fieldName: 'name', dataType: 'text' },
        { fieldName: 'dept', dataType: 'text' },
        { fieldName: 'role', dataType: 'text' },
        { fieldName: 'region', dataType: 'text' },
        { fieldName: 'salary', dataType: 'number' },
        { fieldName: 'sales', dataType: 'number' },
        { fieldName: 'bonus', dataType: 'number' }
      ]
      this.dataProvider.setFields(fields)

      // 컬럼 레이아웃
      const columns = [
        { name: 'region', fieldName: 'region', width: '100', header: { text: '지역' }, styles: { textAlignment: 'center' } },
        { name: 'dept', fieldName: 'dept', width: '130', header: { text: '부서명' }, styles: { textAlignment: 'near' } },
        { name: 'role', fieldName: 'role', width: '130', header: { text: '직급' }, styles: { textAlignment: 'near' } },
        { name: 'name', fieldName: 'name', width: '120', header: { text: '이름' }, styles: { textAlignment: 'center' } },
        {
          name: 'salary',
          fieldName: 'salary',
          width: '130',
          header: { text: '기본급 (만원)' },
          numberFormat: '#,##0',
          styles: { textAlignment: 'far' },
          footer: { expression: 'sum', numberFormat: '#,##0', styles: { textAlignment: 'far', fontWeight: 'bold' } },
          groupFooter: { expression: 'sum', numberFormat: '#,##0', styles: { textAlignment: 'far', fontWeight: 'bold' } }
        },
        {
          name: 'sales',
          fieldName: 'sales',
          width: '140',
          header: { text: '영업실적 (만원)' },
          numberFormat: '#,##0',
          styles: { textAlignment: 'far' },
          footer: { expression: 'sum', numberFormat: '#,##0', styles: { textAlignment: 'far', fontWeight: 'bold' } },
          groupFooter: { expression: 'sum', numberFormat: '#,##0', styles: { textAlignment: 'far', fontWeight: 'bold' } }
        },
        {
          name: 'bonus',
          fieldName: 'bonus',
          width: '120',
          header: { text: '성과급 (만원)' },
          numberFormat: '#,##0',
          styles: { textAlignment: 'far' },
          footer: { expression: 'avg', numberFormat: '#,##0', styles: { textAlignment: 'far' } },
          groupFooter: { expression: 'avg', numberFormat: '#,##0', styles: { textAlignment: 'far' } }
        }
      ]
      this.gridView.setColumns(columns)

      // 1. 그룹핑 패널 상단 표시 (드래그 앤 드롭 유도)
      this.gridView.setGroupingOptions({
        enabled: true,
        prompt: '이곳으로 컬럼 헤더를 끌어놓으면 해당 기준으로 소계/그룹핑이 실행됩니다.'
      })

      // 2. 그룹 푸터(소계) 설정
      this.gridView.setRowGroupOptions({
        summaryMode: 'aggregate',
        mergeMode: true,
        expandedAdornments: 'both' // 상단 및 하단 모두 합계 표출
      })

      // 데이터 삽입
      this.dataProvider.setRows(this.mockData)

      // 초기 2단계 그룹핑 설정 (부서 > 직급)
      this.setPresetGroup(['dept', 'role'], 'dept-role')
    },

    setPresetGroup(groupFields, groupName) {
      if (!this.gridView) return
      this.activeGroup = groupName
      this.gridView.setGroupBy(groupFields)
      showToast(`${groupFields.join(', ')} 기준 그룹핑이 적용되었습니다.`, { type: 'info' })
    },

    clearGroupBy() {
      if (!this.gridView) return
      this.activeGroup = 'none'
      this.gridView.setGroupBy([])
      showToast('그룹핑이 해제되었습니다.', { type: 'warning' })
    },

    expandAll() {
      if (this.gridView) {
        this.gridView.expandGroup(null, true, true)
      }
    },

    collapseAll() {
      if (this.gridView) {
        this.gridView.collapseGroup(null, true)
      }
    }
  }
}
</script>

<style scoped>
.btn-white {
  background-color: #ffffff;
  color: #4b5563;
}
.btn-white:hover {
  background-color: #f3f4f6;
}
</style>
