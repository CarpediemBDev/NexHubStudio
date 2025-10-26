<template>
  <div class="container py-3" style="height: 600px">
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
import axios from '@/utils/http'

export default {
  name: 'JqxGridPage',
  components: { JqxCustomeGrid },
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
        alert('변경사항이 없습니다.')
        return
      }

      const payload = grid.getSavePayload()
      console.log('서버로 보낼 데이터:', payload)

      try {
        // 실제 서버 저장 로직 (예시)
        // const response = await fetch('/api/users/bulk', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(payload)
        // })
        //
        // if (response.ok) {
        //   alert('저장되었습니다.')
        //   grid.clearStatuses() // 상태 초기화
        // }

        // 개발용 임시 처리
        alert(
          `저장 완료!\n생성: ${payload.created.length}건\n수정: ${payload.updated.length}건\n삭제: ${payload.deleted.length}건`
        )

        // 서버 저장 완료 후 최신 데이터 재조회 (실제로는 서버에서)
        await this.loadUsers() // 서버에서 최신 데이터 가져오기
      } catch (error) {
        console.error('저장 실패:', error)
        alert('저장에 실패했습니다.')
      }
    },
  },
}
</script>








