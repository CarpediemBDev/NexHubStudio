<template>
  <div class="github-page">
    <div class="page-header">
      <h2 class="page-title">JQWidgets 그리드 예제</h2>
      <p class="page-subtitle">사용자 목록을 관리하는 그리드 페이지입니다</p>
    </div>

    <!-- SearchGrid -->
    <div class="filter-bar">
      <SearchGrid ref="searchGrid" @open-user-popup="openPopup" @search="loadUsers" />
    </div>

    <!-- 액션 버튼 -->
    <div class="action-bar">
      <button class="github-btn github-btn-primary" @click="add">
        <i class="bi bi-plus-circle"></i> 추가
      </button>
      <button class="github-btn github-btn-danger" @click="deleteSelected">
        <i class="bi bi-trash"></i> 삭제
      </button>
      <button class="github-btn github-btn-success" @click="saveData">
        <i class="bi bi-save"></i> 저장
      </button>
    </div>

    <!-- 그리드 -->
    <div class="content-card">
      <JqxCustomeGrid
        ref="grd"
        :localdata="rows"
        :datafields="datafields"
        :columns="columns"
        selectionmode="checkbox"
        :height="560"
        theme="bootstrap"
      />
    </div>
  </div>
</template>

<script>
import JqxCustomeGrid from '@/components/JqxCustomeGrid.vue'
import SearchGrid from '@/components/SearchGrid.vue'
import { openUserPopup } from '@/utils/showPop.js'
import http from '@/utils/http'
import { showToast } from '@/utils/toastUtil.js'

export default {
  name: 'JqxGridPage',
  components: { JqxCustomeGrid, SearchGrid },
  data() {
    return {
      rows: [],
      roleOptions: [
        { code: 'ADMIN', value: '관리자' },
        { code: 'USER', value: '사용자' },
        { code: 'MANAGER', value: '매니저' },
        { code: 'GUEST', value: '게스트' },
      ],
      datafields: [
        { name: 'userId', type: 'string' },
        { name: 'name', type: 'string' },
        { name: 'dept', type: 'string' },
        { name: 'role', type: 'string' },
        { name: 'email', type: 'string' },
        { name: 'password', type: 'string' },
        { name: 'phone', type: 'string' },
        { name: 'status', type: 'string' },
        { name: 'lastLoginAt', type: 'date' },
        { name: 'refreshToken', type: 'string' },
        { name: 'tokenExpiredAt', type: 'date' },
        { name: 'createdBy', type: 'string' },
        { name: 'createdAt', type: 'date' },
        { name: 'updatedBy', type: 'string' },
        { name: 'updatedAt', type: 'date' },
        { name: 'test', type: 'date' },
        // rowStatus는 공통컴포넌트가 자동 보강
      ],
      columns: [
        { text: 'ID', datafield: 'userId', width: 100 },
        { text: '이름', datafield: 'name', width: 120, editable: true },
        { text: '부서', datafield: 'dept', width: 120, editable: true },
        {
          text: '역할',
          datafield: 'role',
          width: 120,
          editable: true,
          columntype: 'dropdownlist',
          createeditor: (row, value, editor) => {
            editor.jqxDropDownList({
              source: this.roleOptions,
              displayMember: 'value',
              valueMember: 'code',
              autoDropDownHeight: true,
              placeHolder: `<div style="padding: 4px 8px;">${value || '선택'}</div>`,
            })
          },
          cellsrenderer: (row, columnfield, value) => {
            return `<div style="padding: 4px 8px;">${value || '선택'}</div>`
          },
        },
        { text: '이메일', datafield: 'email', width: 180, editable: true },
        { text: '비밀번호', datafield: 'password', width: 140, editable: true },
        { text: '전화번호', datafield: 'phone', width: 120, editable: true },
        { text: '상태', datafield: 'status', width: 80, editable: true },
        { text: '마지막 로그인', datafield: 'lastLoginAt', width: 160 },
        { text: 'RefreshToken', datafield: 'refreshToken', width: 180 },
        { text: 'Token만료', datafield: 'tokenExpiredAt', width: 160 },
        { text: '생성자', datafield: 'createdBy', width: 100 },
        { text: '생성일', datafield: 'createdAt', width: 160 },
        { text: '수정자', datafield: 'updatedBy', width: 100 },
        { text: '수정일', datafield: 'updatedAt', width: 160 },
        { text: '수정일', datafield: 'test', width: 160 },
      ],
    }
  },
  mounted() {
    this.loadUsers()
  },
  methods: {
    loadUsers() {
      http
        .get('/users')
        .then((res) => {
          this.rows = res.data ?? []
        })
        .catch((error) => {
          const msg = error?.response?.data?.message || error.message || '사용자 목록 조회 실패'
          showToast(msg, { type: 'error' })
        })
    },
    add() {
      this.$refs.grd?.add({ name: '', dept: '', role: '' })
    },
    deleteSelected() {
      this.$refs.grd?.deleteSelected()
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
      if (!grid?.hasChanges()) {
        alert('변경된 내용이 없습니다.')
        return
      }
      const payload = grid.getSavePayload()
      const { data: result } = await http.post('/users/bulk', payload)
      alert(`저장 완료!\n생성: ${result.created}\n수정: ${result.updated}\n삭제: ${result.deleted}`)
      await this.loadUsers()
    },
  },
}
</script>

<style scoped>
@import '@/assets/styles/github-theme.css';

.action-bar {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  justify-content: flex-end;
}
</style>
