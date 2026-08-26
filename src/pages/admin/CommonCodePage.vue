<template>
  <div class="b2b-page-container flex-100vh p-1">
    <div class="content-split">
      <div class="left-panel grid-40">
        <div class="panel-header">마스터 그룹코드</div>
        <table class="b2b-table">
          <thead>
            <tr>
              <th>그룹코드</th>
              <th>코드명</th>
              <th>사용여부</th>
            </tr>
          </thead>
          <tbody>
            <tr class="selected-row">
              <td class="font-monospace">SYS001</td>
              <td class="fw-bold">회원상태</td>
              <td><span class="badge bg-success-subtle text-success">Y</span></td>
            </tr>
            <tr>
              <td class="font-monospace">SYS002</td>
              <td>권한레벨</td>
              <td><span class="badge bg-success-subtle text-success">Y</span></td>
            </tr>
            <tr>
              <td class="font-monospace">DOC001</td>
              <td>문서유형</td>
              <td><span class="badge bg-danger-subtle text-danger">N</span></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="right-panel grid-60">
        <div class="panel-header flex-between">
          <span class="fw-bold">상세 코드 <small class="text-muted font-monospace ms-1">[SYS001: 회원상태]</small></span>
          <button class="btn-b2b-primary py-1 px-2.5"><i class="bi bi-plus-lg me-1"></i>상세 추가</button>
        </div>
        <table class="b2b-table">
          <thead>
            <tr>
              <th>상세코드</th>
              <th>상세코드명</th>
              <th>정렬순서</th>
              <th>사용여부</th>
              <th>비고</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="font-monospace">ST01</td>
              <td>정상</td>
              <td>1</td>
              <td><span class="badge bg-success-subtle text-success">Y</span></td>
              <td>-</td>
            </tr>
            <tr>
              <td class="font-monospace">ST02</td>
              <td>정지</td>
              <td>2</td>
              <td><span class="badge bg-success-subtle text-success">Y</span></td>
              <td>-</td>
            </tr>
            <tr>
              <td class="font-monospace">ST03</td>
              <td>탈퇴</td>
              <td>3</td>
              <td><span class="badge bg-success-subtle text-success">Y</span></td>
              <td>-</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import PageHeader from '@/components/PageHeader.vue'
</script>

<style scoped>
.flex-100vh { display: flex; flex-direction: column; height: 100vh; box-sizing: border-box; }
.content-split { display: flex; flex: 1; gap: 16px; overflow: hidden; }
.left-panel, .right-panel {
  background: var(--b2b-color-bg-card);
  border: 1px solid var(--b2b-color-border);
  border-radius: var(--b2b-radius-md);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}
.grid-40 { width: 40%; flex: none; }
.grid-60 { width: 60%; flex: 1; }
.panel-header {
  padding: 10px 16px;
  border-bottom: 1px solid var(--b2b-color-border);
  background-color: var(--b2b-color-bg-body);
  color: var(--b2b-color-text-main);
}
.flex-between { display: flex; justify-content: space-between; align-items: center; }
.b2b-table { width: 100%; border-collapse: collapse; }
.b2b-table th, .b2b-table td {
  border-bottom: 1px solid var(--b2b-color-border);
  padding: 8px 12px;
  text-align: left;
  font-size: var(--b2b-font-size-body);
  color: var(--b2b-color-text-main);
}
.b2b-table th {
  background: var(--b2b-color-bg-body);
  font-weight: 600;
}
.selected-row {
  background-color: var(--b2b-color-primary-subtle) !important;
}
</style>
