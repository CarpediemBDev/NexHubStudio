<template>
  <div class="b2b-page-container flex-100vh">
    <div class="b2b-toolbar mb-3">
      <h4 class="m-0 fw-bold">부서 및 조직도 관리</h4>
      <div class="actions">
        <button class="btn-b2b-primary"><i class="bi bi-floppy me-1"></i>조직 개편 저장</button>
      </div>
    </div>
    <div class="content-split">
      <div class="left-panel tree-view">
        <div class="panel-header fw-bold"><i class="bi bi-diagram-3 me-1 text-primary"></i>조직도</div>
        <ul class="tree p-3">
          <li class="tree-item mb-1">
            <div class="tree-node fw-bold"><i class="bi bi-building me-1.5 text-primary"></i>(주) 넥스허브</div>
            <ul class="sub-tree ps-3 mt-1">
              <li class="tree-item mb-1"><div class="tree-node"><i class="bi bi-folder2 me-1.5 text-secondary"></i>경영지원본부</div></li>
              <li class="tree-item active mb-1">
                <div class="tree-node fw-bold"><i class="bi bi-folder2-open me-1.5 text-primary"></i>R&amp;D 본부</div>
                <ul class="sub-tree ps-3 mt-1">
                  <li class="tree-item selected mb-1">
                    <div class="tree-node selected-highlight fw-bold"><i class="bi bi-people me-1.5 text-primary"></i>플랫폼개발팀</div>
                  </li>
                  <li class="tree-item mb-1"><div class="tree-node"><i class="bi bi-people me-1.5 text-secondary"></i>AI연구팀</div></li>
                </ul>
              </li>
            </ul>
          </li>
        </ul>
      </div>
      <div class="right-panel flex-1">
        <div class="panel-header fw-bold"><i class="bi bi-sliders me-1 text-primary"></i>부서 상세 정보</div>
        <div class="form-container p-3">
          <div class="form-group mb-2">
            <label class="form-label mb-0 fw-semibold text-secondary">부서명</label>
            <input type="text" class="b2b-input form-control form-control-sm" value="플랫폼개발팀" />
          </div>
          <div class="form-group mb-2">
            <label class="form-label mb-0 fw-semibold text-secondary">부서장</label>
            <input type="text" class="b2b-input form-control form-control-sm" value="김개발 팀장" />
          </div>
          <div class="form-group mb-2">
            <label class="form-label mb-0 fw-semibold text-secondary">비고</label>
            <textarea class="b2b-input form-control form-control-sm" rows="2"></textarea>
          </div>
        </div>

        <div class="panel-header border-top fw-bold">소속 직원 목록</div>
        <table class="b2b-table compact-table">
          <thead>
            <tr>
              <th>사번</th>
              <th>이름</th>
              <th>직급</th>
              <th>상태</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="font-monospace">EMP-2023001</td>
              <td class="fw-bold">홍길동</td>
              <td>수석</td>
              <td><span class="badge bg-success-subtle text-success">재직</span></td>
            </tr>
            <tr>
              <td class="font-monospace">EMP-2023002</td>
              <td class="fw-bold">이순신</td>
              <td>책임</td>
              <td><span class="badge bg-success-subtle text-success">재직</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Vue component logic
</script>

<style scoped>
.flex-100vh { display: flex; flex-direction: column; height: 100vh; box-sizing: border-box; }
.content-split { display: flex; flex: 1; gap: 16px; overflow: hidden; }
.left-panel {
  width: 320px;
  background: var(--b2b-color-bg-card);
  border: 1px solid var(--b2b-color-border);
  border-radius: var(--b2b-radius-md);
  display: flex;
  flex-direction: column;
}
.right-panel {
  flex: 1;
  background: var(--b2b-color-bg-card);
  border: 1px solid var(--b2b-color-border);
  border-radius: var(--b2b-radius-md);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}
.panel-header {
  padding: 10px 16px;
  border-bottom: 1px solid var(--b2b-color-border);
  background-color: var(--b2b-color-bg-body);
  color: var(--b2b-color-text-main);
}
.tree-node {
  padding: 4px 8px;
  border-radius: var(--b2b-radius-sm);
  color: var(--b2b-color-text-main);
}
.selected-highlight {
  background-color: var(--b2b-color-primary-subtle) !important;
  color: var(--b2b-color-primary) !important;
  border-left: 3px solid var(--b2b-color-primary) !important;
}
.form-group label { width: 100px; }
.b2b-input {
  background-color: var(--b2b-color-bg-body);
  color: var(--b2b-color-text-main);
  border-color: var(--b2b-color-border);
}
.b2b-table { width: 100%; border-collapse: collapse; }
.b2b-table th, .b2b-table td {
  border-bottom: 1px solid var(--b2b-color-border);
  padding: 8px 12px;
  text-align: left;
  font-size: 13px;
  color: var(--b2b-color-text-main);
}
.b2b-table th {
  background: var(--b2b-color-bg-body);
  font-weight: 600;
}
</style>
