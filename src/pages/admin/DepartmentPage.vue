<template>
  <div class="b2b-page-container flex-100vh">
    <div class="b2b-toolbar mb-3 d-flex justify-content-end">
      <div class="actions">
        <button class="btn-b2b-primary"><i class="bi bi-floppy me-1"></i>조직 개편 저장</button>
      </div>
    </div>
    <div class="content-split">
      <div class="left-panel tree-view">
        <div class="panel-header fw-bold"><i class="bi bi-diagram-3 me-1 text-primary"></i>조직도</div>
        <ul class="tree">
          <li class="tree-item tree-level-1 mb-1">
            <span class="tree-label fw-bold">(주) 넥스허브</span>
            <ul class="sub-tree mt-1">
              <li class="tree-item tree-level-2 mb-1"><span class="tree-label">경영지원본부</span></li>
              <li class="tree-item tree-level-2 active mb-1">
                <span class="tree-label fw-bold">R&amp;D 본부</span>
                <ul class="sub-tree mt-1">
                  <li class="tree-item tree-level-3 selected mb-1">
                    <span class="tree-label selected-highlight fw-bold">플랫폼개발팀</span>
                  </li>
                  <li class="tree-item tree-level-3 mb-1"><span class="tree-label">AI연구팀</span></li>
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
.content-split { display: flex; flex: 1; gap: var(--b2b-space-4); overflow: hidden; }
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
  padding: 10px var(--b2b-space-4);
  border-bottom: 1px solid var(--b2b-color-border);
  background-color: var(--b2b-color-bg-body);
  color: var(--b2b-color-text-main);
}

/* Tree View - Option A (Clean Bullets with Generous Left Spacing) */
.tree {
  list-style-type: disc !important;
  padding: var(--b2b-space-4) 20px var(--b2b-space-4) var(--b2b-space-6) !important;
  margin: 0;
  color: var(--b2b-color-text-main);
}
.sub-tree {
  list-style-type: circle !important;
  padding-left: 20px !important;
  margin: 0;
}
.sub-tree .sub-tree {
  list-style-type: square !important;
  padding-left: 20px !important;
}
.tree-item {
  margin-bottom: 6px;
  line-height: 1.5;
}
.tree-label {
  padding: var(--b2b-space-1) var(--b2b-space-2);
  border-radius: var(--b2b-radius-sm, 4px);
  color: var(--b2b-color-text-main);
  cursor: pointer;
  display: inline-block;
  transition: all 0.15s ease;
  font-size: var(--b2b-font-size-body);
}
.tree-label:hover {
  background-color: var(--b2b-color-hover-bg);
}
.selected-highlight {
  background-color: var(--b2b-color-primary-subtle) !important;
  color: var(--b2b-color-primary) !important;
  border-left: 3px solid var(--b2b-color-primary) !important;
  font-weight: 600;
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
  padding: var(--b2b-space-2) var(--b2b-space-3);
  text-align: left;
  font-size: var(--b2b-font-size-body);
  color: var(--b2b-color-text-main);
}
.b2b-table th {
  background: var(--b2b-color-bg-body);
  font-weight: 600;
}
</style>
