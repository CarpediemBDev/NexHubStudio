<template>
  <div class="container py-3" style="height: 600px">
    <!-- SearchGrid: 사용자 선택용 툴바 (목록 위에 위치) -->
    <div class="row mb-3">
      <div class="col-12">
        <SearchGrid
          ref="searchGrid"
          @open-user-popup="openPopup"
          @update:selected="onConfirm"
          @search="loadUsers"
        />
      </div>
    </div>
    <div class="mb-2 d-flex gap-2">
      <button class="btn btn-primary btn-sm" @click="add">추가</button>
      <button class="btn btn-outline-danger btn-sm" @click="deleteSelected">삭제</button>
      <button class="btn btn-outline-secondary btn-sm" @click="logCUD">변경확인</button>
      <button class="btn btn-success btn-sm" @click="saveData">저장</button>
    </div>

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
</template>

<script>
import JqxCustomeGrid from '@/components/JqxCustomeGrid.vue'
import SearchGrid from '@/components/SearchGrid.vue'
import { openUserPopup } from '@/utils/showPop.js'
import { showToast } from '@/utils/toastUtil.js'
import axios from '@/utils/http'

export default {
  name: 'JqxGridPage',
  components: { JqxCustomeGrid, SearchGrid },
  data() {
    return {
      rows: [],
      datafields: [
        { name: 'userId', type: 'string' },
        { name: 'name', type: 'string' },
        { name: 'dept', type: 'string' },
        { name: 'role', type: 'string' },
        // rowStatus는 공통컴포넌트가 자동 보강
      ],
      columns: [
        { text: 'ID', datafield: 'userId', width: 100 },
        { text: '이름', datafield: 'name', width: 160, editable: true },
        { text: '부서', datafield: 'dept', width: 160, editable: true },
        { text: '역할', datafield: 'role', editable: true },
      ],
    }
  },
  mounted() {
    this.loadUsers()
  },
  methods: {
    async loadUsers() {
      const { data } = await axios.get('/users')
      this.rows = Array.isArray(data) ? data : data.users || []
    },
    add() {
      this.$refs.grd?.add({ name: '', dept: '', role: '' })
    },
    deleteSelected() {
      this.$refs.grd?.deleteSelected()
    },
    logCUD() {
      console.log(this.$refs.grd?.getChanges())
    },
    async saveData() {
      const grid = this.$refs.grd
      if (!grid?.hasChanges()) {
        alert('변경된 내용이 없습니다.')
        return
      }
      const payload = grid.getSavePayload()
      const { data } = await axios.post('/users/bulk', payload)
      alert(`저장 완료!\n생성: ${data.created}\n수정: ${data.updated}\n삭제: ${data.deleted}`)
      await this.loadUsers()
    },
  },
}
</script>
