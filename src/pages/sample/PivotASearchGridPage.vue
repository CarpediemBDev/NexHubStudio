<template>
  <div class="b2b-page-container py-3">
    <!-- 1. Top Search Filter Panel (SearchGrid) -->
    <div class="mb-3">
      <SearchGrid ref="searchGrid" @open-user-popup="openPopup" @search="loadFilteredPivotData" />
    </div>

    <!-- 2. Pivot Studio Card Container -->
    <div class="b2b-card shadow-sm mb-4 border">
      <!-- Unified Management Toolbar (Pivot A Presets & View Controls) -->
      <div class="b2b-card-header bg-theme-subcard py-2.5 px-3 d-flex flex-wrap align-items-center justify-content-between gap-2 border-bottom">
        <!-- Left: Quick Preset Buttons -->
        <div class="d-flex align-items-center gap-1.5 flex-wrap">
          <button
            class="btn-b2b-action"
            :class="{ 'btn-b2b-primary': activeGroup === 'none' }"
            @click="clearGroupBy"
          >
            <i class="bi bi-table me-0.5"></i>
            <span>원본 데이터 보기</span>
          </button>

          <!-- Quick Preset Dropdown -->
          <div class="dropdown">
            <button
              class="btn-b2b-action dropdown-toggle"
              :class="{ 'btn-b2b-primary': activeGroup !== 'none' && activeGroup.startsWith('preset_') }"
              type="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <i class="bi bi-lightning-charge-fill text-warning me-0.5"></i>
              <span>{{ activePresetName }}</span>
            </button>
            <ul class="dropdown-menu shadow-sm fs-7">
              <li><h6 class="b2b-text-xs dropdown-header py-1">⚡ 빠른 피셋 분석 선택</h6></li>
              <li v-for="preset in quickPresets" :key="preset.id">
                <button
                  class="dropdown-item d-flex align-items-center justify-content-between py-1.5"
                  :class="{ active: activeGroup === preset.id }"
                  @click="applyView(preset)"
                >
                  <span><i :class="['bi', preset.icon, 'me-1.5']"></i>{{ preset.name }}</span>
                  <i class="bi bi-check2 ms-2" v-if="activeGroup === preset.id"></i>
                </button>
              </li>
            </ul>
          </div>

          <span class="badge bg-primary-subtle text-primary border border-primary-subtle b2b-text-xs ms-2">
            검색 결과: {{ filteredRows.length }}건 집계 중
          </span>
        </div>

        <!-- Right: Action Buttons (Save View & Excel Export) -->
        <div class="d-flex align-items-center gap-2 ms-auto">
          <button class="btn-b2b-action" title="현재 피벗 뷰 저장" @click="saveCurrentView">
            <i class="bi bi-bookmark-plus text-warning me-0.5"></i>
            <span>뷰 저장</span>
          </button>
          <button class="btn-b2b-action" title="엑셀 파일 내보내기" @click="exportExcel">
            <i class="bi bi-file-earmark-excel text-success me-0.5"></i>
            <span>엑셀</span>
          </button>
        </div>
      </div>

      <!-- Pivot Grid Body Container -->
      <div class="b2b-card-body p-3">
        <JqxCustomGrid
          ref="grd"
          :localdata="filteredRows"
          :datafields="datafields"
          :columns="columns"
          :checkable="false"
          :show-row-number="true"
          :show-row-status="false"
          :show-toolbar="false"
          :autofill="true"
          height="520px"
        />
      </div>
    </div>
  </div>
</template>

<script>
import JqxCustomGrid from '@/components/JqxCustomGrid.vue'
import SearchGrid from '@/components/SearchGrid.vue'
import { openUserPopup } from '@/utils/showPop.js'
import { showToast } from '@/utils/toastUtil.js'

export default {
  name: 'PivotASearchGridPage',
  components: { JqxCustomGrid, SearchGrid },
  data() {
    return {
      allRows: [],
      filteredRows: [],
      activeGroup: 'preset_dept',
      activePresetName: '부서별 급여 분석',
      quickPresets: [
        { id: 'preset_dept', name: '부서별 급여 분석', icon: 'bi-building' },
        { id: 'preset_role', name: '직무별 급여 분석', icon: 'bi-briefcase' },
        { id: 'preset_region', name: '지역별 인원 분석', icon: 'bi-geo-alt' }
      ],
      datafields: [
        { name: 'userId', type: 'string' },
        { name: 'name', type: 'string' },
        { name: 'dept', type: 'string' },
        { name: 'role', type: 'string' },
        { name: 'workStatus', type: 'string' },
        { name: 'employmentType', type: 'string' },
        { name: 'evalGrade', type: 'string' },
        { name: 'skillScore', type: 'number' },
        { name: 'region', type: 'string' },
        { name: 'salary', type: 'number' },
        { name: 'joinDate', type: 'string' }
      ],
      columns: [
        { text: 'ID', datafield: 'userId', width: 110, editable: false },
        { text: '성명', datafield: 'name', width: 100, editable: false },
        { text: '부서', datafield: 'dept', width: 130, editable: false },
        { text: '직무/역할', datafield: 'role', width: 120, editable: false },
        { text: '근무상태', datafield: 'workStatus', width: 95, editable: false, cellsalign: 'center', align: 'center' },
        { text: '고용형태', datafield: 'employmentType', width: 100, editable: false, cellsalign: 'center', align: 'center' },
        { text: '평가등급', datafield: 'evalGrade', width: 80, editable: false, cellsalign: 'center', align: 'center' },
        { text: '역량점수', datafield: 'skillScore', width: 100, editable: false, cellsalign: 'right', align: 'right' },
        { text: '근무지역', datafield: 'region', width: 100, editable: false },
        {
          text: '급여 (만원)',
          datafield: 'salary',
          width: 120,
          editable: false,
          cellsalign: 'right',
          align: 'right',
          cellsformat: 'n'
        },
        {
          text: '입사일자',
          datafield: 'joinDate',
          width: 110,
          editable: false,
          cellsalign: 'center',
          align: 'center'
        }
      ]
    }
  },
  mounted() {
    this.initMasterData()
  },
  methods: {
    async initMasterData() {
      try {
        const url = (import.meta.env?.BASE_URL ?? '/') + 'db.json'
        const res = await fetch(url)
        if (!res.ok) throw new Error('db.json fetch failed')
        const data = await res.json()
        const list = Array.isArray(data) ? data : data.users || []
        this.allRows = list.length > 0 ? list : this.getDefaultUsers()
      } catch (err) {
        this.allRows = this.getDefaultUsers()
      }
      this.filteredRows = [...this.allRows]
    },

    getDefaultUsers() {
      return [
        { userId: 'minjun.park', name: '박민준', dept: '경영지원', role: 'Security', workStatus: '재직', employmentType: '정규직', evalGrade: 'A', skillScore: 88, region: '서울', salary: 5240, joinDate: '2019-04-12' },
        { userId: 'suhyeon.lee', name: '이수현', dept: '경영지원', role: 'PM', workStatus: '재직', employmentType: '정규직', evalGrade: 'S', skillScore: 95, region: '대전', salary: 9520, joinDate: '2024-01-15' },
        { userId: 'minjun.han', name: '한민준', dept: '디자인팀', role: 'DevOps', workStatus: '휴직', employmentType: '계약직', evalGrade: 'B', skillScore: 72, region: '광주', salary: 8900, joinDate: '2021-08-20' },
        { userId: 'yebin.lee', name: '이예빈', dept: '모바일팀', role: 'QA', workStatus: '재직', employmentType: '정규직', evalGrade: 'A', skillScore: 84, region: '서울', salary: 8860, joinDate: '2024-05-10' }
      ]
    },

    loadFilteredPivotData(searchParams) {
      if (!searchParams) {
        this.filteredRows = [...this.allRows]
        return
      }

      let res = [...this.allRows]

      // 1. 사용자명/ID 검색
      if (searchParams.userNames) {
        const kw = searchParams.userNames.toLowerCase()
        res = res.filter(r => (r.name && r.name.toLowerCase().includes(kw)) || (r.userId && r.userId.toLowerCase().includes(kw)))
      }

      // 2. 부서 검색
      if (searchParams.department) {
        const deptMap = { HQ: '경영지원', DEV: '모바일팀', PLAN: '기획팀', DESIGN: '디자인팀', OPS: '보안팀' }
        const targetDept = deptMap[searchParams.department] || searchParams.department
        res = res.filter(r => r.dept === targetDept || (r.dept && r.dept.includes(targetDept)))
      }

      // 3. 직무 검색
      if (searchParams.position) {
        res = res.filter(r => r.role && r.role.toLowerCase().includes(searchParams.position.toLowerCase()))
      }

      this.filteredRows = res
      showToast(`SearchGrid 검색 완료: 총 ${this.filteredRows.length}건이 피벗 데이터셋에 즉시 연동되었습니다.`, { type: 'info' })
    },

    clearGroupBy() {
      this.activeGroup = 'none'
      this.activePresetName = '원본 데이터 보기'
      this.filteredRows = [...this.allRows]
      showToast('원본 피벗 데이터셋으로 초기화되었습니다.', { type: 'info' })
    },

    applyView(preset) {
      this.activeGroup = preset.id
      this.activePresetName = preset.name
      showToast(`피셋 분석 뷰 [${preset.name}]가 적용되었습니다.`, { type: 'success' })
    },

    saveCurrentView() {
      showToast(`현재 피벗 뷰 [${this.activePresetName}] 상태가 저장되었습니다.`, { type: 'success' })
    },

    exportExcel() {
      this.$refs.grd?.exportExcel('Pivot_A_Search_Data')
    },

    async openPopup() {
      const selectedList = await openUserPopup()
      if (!Array.isArray(selectedList) || selectedList.length === 0) return
      const sg = this.$refs.searchGrid
      if (sg && typeof sg.setUsersFromPopup === 'function') {
        sg.setUsersFromPopup(selectedList)
      }
    }
  }
}
</script>

<style scoped>
</style>
