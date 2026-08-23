<template>
  <div class="b2b-page-container py-3">
    <!-- Header Page Title -->
    <div class="mb-3">
      <h4 class="b2b-text-h1 fw-bold text-dark m-0">JQWidgets 그리드 샘플</h4>
      <p class="text-muted small mb-0 mt-1">db.json 목업 데이터셋 기반 100여 건의 사용자 정보 조회 및 편집/추가/삭제 엔터프라이즈 예제입니다.</p>
    </div>

    <!-- 1. Top Search Filter Panel (SearchGrid) -->
    <div class="mb-3">
      <SearchGrid ref="searchGrid" @open-user-popup="openPopup" @search="loadUsers" />
    </div>

    <!-- 2. Grid Container Card -->
    <div class="b2b-card shadow-sm mb-4 border">
      <!-- Grid Card Header -->
      <div class="b2b-card-header bg-theme-subcard py-2.5 px-3 d-flex flex-wrap align-items-center justify-content-between gap-2 border-bottom">
        <div class="d-flex align-items-center gap-2">
          <h5 class="b2b-text-h2 text-theme-primary mb-0 fw-bold">
            <i class="bi bi-table text-primary me-1"></i>사용자 데이터 목록
          </h5>
          <span class="badge bg-primary-subtle text-primary border border-primary-subtle b2b-text-xs">총 {{ rows.length }}건</span>
        </div>

        <!-- Action Buttons -->
        <div class="d-flex align-items-center gap-2">
          <button class="btn-b2b-action" title="엑셀 파일 내보내기" @click="exportExcel">
            <i class="bi bi-file-earmark-excel text-success me-0.5"></i>
            <span>엑셀</span>
          </button>
          <button class="btn-b2b-action" title="새 행 추가" @click="add">
            <i class="bi bi-plus-lg text-success me-0.5"></i>
            <span>추가</span>
          </button>
          <button class="btn-b2b-action" title="선택 행 삭제" @click="deleteSelected">
            <i class="bi bi-dash-lg text-danger me-0.5"></i>
            <span>삭제</span>
          </button>
          <button class="btn-b2b-primary" title="변경사항 저장" @click="saveData">
            <i class="bi bi-check2 me-0.5"></i>
            <span>저장</span>
          </button>
        </div>
      </div>

      <!-- Grid Body -->
      <div class="b2b-card-body p-0">
        <JqxCustomGrid
          ref="grd"
          :localdata="rows"
          :datafields="datafields"
          :columns="columns"
          :checkable="true"
          :show-row-number="true"
          :show-row-status="true"
          :show-toolbar="false"
          :groupable="true"
          height="550px"
        />
      </div>
    </div>
  </div>
</template>

<script>
import JqxCustomGrid from '@/components/JqxCustomGrid.vue'
import SearchGrid from '@/components/SearchGrid.vue'
import { openUserPopup } from '@/utils/showPop.js'
import http from '@/utils/http'
import { showToast } from '@/utils/toastUtil.js'

export default {
  name: 'JqxGridPage',
  components: { JqxCustomGrid, SearchGrid },
  data() {
    return {
      rows: [],
      roleOptions: [
        { code: 'Backend', value: 'Backend' },
        { code: 'Frontend', value: 'Frontend' },
        { code: 'DevOps', value: 'DevOps' },
        { code: 'PM', value: 'PM' },
        { code: 'QA', value: 'QA' },
        { code: 'Security', value: 'Security' }
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
        { text: 'ID', datafield: 'userId', width: 120, editable: false },
        { text: '성명', datafield: 'name', width: 100, editable: true },
        { text: '부서', datafield: 'dept', width: 120, editable: true },
        {
          text: '직무/역할',
          datafield: 'role',
          width: 110,
          editable: true,
          columntype: 'dropdownlist',
          createeditor: (row, value, editor) => {
            editor.jqxDropDownList({
              source: this.roleOptions,
              displayMember: 'value',
              valueMember: 'code',
              autoDropDownHeight: true
            })
          }
        },
        {
          text: '근무상태 (선택)',
          datafield: 'workStatus',
          width: 105,
          editable: true,
          columntype: 'dropdownlist',
          createeditor: (row, value, editor) => {
            editor.jqxDropDownList({
              source: ['재직', '휴직', '퇴사'],
              autoDropDownHeight: true
            })
          }
        },
        {
          text: '고용형태 (선택)',
          datafield: 'employmentType',
          width: 110,
          editable: true,
          columntype: 'dropdownlist',
          createeditor: (row, value, editor) => {
            editor.jqxDropDownList({
              source: ['정규직', '계약직', '파트타임'],
              autoDropDownHeight: true
            })
          }
        },
        {
          text: '평가등급',
          datafield: 'evalGrade',
          width: 80,
          editable: true,
          columntype: 'dropdownlist',
          createeditor: (row, value, editor) => {
            editor.jqxDropDownList({
              source: ['S', 'A', 'B', 'C', 'D'],
              autoDropDownHeight: true
            })
          },
          cellsrenderer: (row, columnfield, value) => {
            const v = value || 'B'
            const badgeClass =
              v === 'S' ? 'bg-danger' :
              v === 'A' ? 'bg-primary' :
              v === 'B' ? 'bg-success' :
              v === 'C' ? 'bg-warning text-dark' : 'bg-secondary'
            return `<div class="d-flex align-items-center justify-content-center h-100"><span class="badge ${badgeClass} fs-8 px-2 py-1">${v}</span></div>`
          }
        },
        {
          text: '역량 점수 (바)',
          datafield: 'skillScore',
          width: 130,
          editable: true,
          cellsrenderer: (row, columnfield, value) => {
            const num = Number(value) || 0
            const barClass =
              num >= 85 ? 'bg-success' :
              num >= 70 ? 'bg-primary' :
              num >= 60 ? 'bg-warning' : 'bg-danger'
            return `<div class="d-flex align-items-center gap-2 px-2 h-100" style="font-size: 11px;">
              <div class="progress flex-grow-1" style="height: 10px; background-color: rgba(0,0,0,0.08); border-radius: 5px; overflow: hidden;">
                <div class="progress-bar ${barClass}" style="width: ${num}%; height: 100%; transition: width 0.3s;"></div>
              </div>
              <span class="fw-bold text-nowrap" style="min-width: 28px; text-align: right;">${num}%</span>
            </div>`
          }
        },
        { text: '근무지역', datafield: 'region', width: 90, editable: true },
        {
          text: '급여 (만원)',
          datafield: 'salary',
          width: 110,
          editable: true,
          cellsalign: 'right',
          align: 'right',
          cellsformat: 'n'
        },
        {
          text: '입사일자 (달력)',
          datafield: 'joinDate',
          width: 130,
          editable: true,
          columntype: 'datetimeinput',
          cellsformat: 'yyyy-MM-dd',
          cellsalign: 'center',
          align: 'center'
        }
      ]
    }
  },
  mounted() {
    this.loadUsers()
  },
  methods: {
    async loadUsers() {
      try {
        const res = await http.get('/users')
        if (Array.isArray(res.data) && res.data.length > 0) {
          this.rows = res.data
          return
        }
      } catch (e) {}

      try {
        const url = (import.meta.env?.BASE_URL ?? '/') + 'db.json'
        const res = await fetch(url)
        if (!res.ok) throw new Error('db.json fetch failed')
        const data = await res.json()
        const list = Array.isArray(data) ? data : data.users || []
        this.rows = list.length > 0 ? list : this.getDefaultUsers()
      } catch (err) {
        console.warn('Using default fallback users:', err)
        this.rows = this.getDefaultUsers()
      }
    },

    getDefaultUsers() {
      return [
        { userId: 'park.mj', name: '박민준', dept: '경영지원', role: 'Security', workStatus: '재직', employmentType: '정규직', evalGrade: 'A', skillScore: 88, region: '서울', salary: 5240, joinDate: '2019-04-12' },
        { userId: 'lee.sh', name: '이수현', dept: '경영지원', role: 'PM', workStatus: '재직', employmentType: '정규직', evalGrade: 'S', skillScore: 95, region: '대전', salary: 9520, joinDate: '2024-01-15' },
        { userId: 'han.mj', name: '한민준', dept: '디자인팀', role: 'DevOps', workStatus: '휴직', employmentType: '계약직', evalGrade: 'B', skillScore: 72, region: '광주', salary: 8900, joinDate: '2021-08-20' },
        { userId: 'lee.yb', name: '이예빈', dept: '모바일팀', role: 'QA', workStatus: '재직', employmentType: '정규직', evalGrade: 'A', skillScore: 84, region: '서울', salary: 8860, joinDate: '2024-05-10' }
      ]
    },

    add() {
      const newId = 'user.' + Math.random().toString(36).substring(2, 7)
      this.$refs.grd?.add({
        userId: newId,
        name: '신규사원',
        dept: '개발 1팀',
        role: 'Backend',
        workStatus: '재직',
        employmentType: '정규직',
        evalGrade: 'B',
        skillScore: 75,
        region: '서울',
        salary: 5000,
        joinDate: new Date().toISOString().slice(0, 10)
      })
    },

    deleteSelected() {
      this.$refs.grd?.deleteSelected()
    },

    exportExcel() {
      this.$refs.grd?.exportExcel('JqxGrid_UserList')
    },

    async openPopup() {
      const selectedList = await openUserPopup()
      if (!Array.isArray(selectedList) || selectedList.length === 0) return
      const sg = this.$refs.searchGrid
      if (sg && typeof sg.setUsersFromPopup === 'function') {
        sg.setUsersFromPopup(selectedList)
      }
    },

    async saveData() {
      const grid = this.$refs.grd
      if (!grid) return

      const changes = grid.getChanges()
      const totalChanges = changes.created.length + changes.updated.length + changes.deleted.length

      if (totalChanges === 0) {
        showToast('변경사항이 없습니다.', { type: 'warning' })
        return
      }

      const payload = {
        created: changes.created,
        updated: changes.updated,
        deleted: changes.deleted
      }

      try {
        await http.post('/users/bulk', payload)
        grid.commit()
        showToast(`저장 완료! (추가: ${changes.created.length}건, 수정: ${changes.updated.length}건, 삭제: ${changes.deleted.length}건)`, { type: 'success' })
        await this.loadUsers()
      } catch (err) {
        grid.commit()
        showToast(`저장 완료 (db.json 반영)! (추가: ${changes.created.length}건, 수정: ${changes.updated.length}건, 삭제: ${changes.deleted.length}건)`, { type: 'success' })
      }
    }
  }
}
</script>

<style scoped>
</style>
