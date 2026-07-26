<template>
  <div class="b2b-page-container flex-100vh">
    <!-- Top Page Header -->
    <div class="b2b-toolbar mb-3">
      <div class="d-flex align-items-center gap-2">
        <h4 class="m-0 fw-bold">메뉴 및 권한 관리</h4>
        <span class="badge b2b-badge-live ms-2">RBAC System</span>
      </div>
    </div>

    <!-- Content Split Panel -->
    <div class="content-split">
      <!-- LEFT: Menu Structure Tree Card -->
      <div class="left-panel tree-view">
        <div class="panel-header d-flex justify-content-between align-items-center">
          <span class="fw-bold"><i class="bi bi-diagram-2 me-1"></i> 메뉴 구조</span>
          <button class="btn-b2b-action btn-sm py-1 px-2" title="좌측 메뉴 순서 저장">
            <i class="bi bi-arrows-move me-1"></i>순서 저장
          </button>
        </div>
        <ul class="tree">
          <li class="tree-item active mb-1">
            <div class="tree-node parent-node fw-bold mb-1">
              <i class="bi bi-folder2-open me-1 text-primary"></i> 시스템 관리
            </div>
            <ul class="sub-tree ps-3">
              <li class="tree-item selected mb-1">
                <div class="tree-node child-node selected-highlight d-flex align-items-center">
                  <i class="bi bi-file-earmark-code me-1.5 text-primary"></i>
                  <span>메뉴 권한 관리</span>
                </div>
              </li>
              <li class="tree-item mb-1">
                <div class="tree-node child-node d-flex align-items-center">
                  <i class="bi bi-file-earmark-text me-1.5 text-muted"></i>
                  <span>공통 코드 관리</span>
                </div>
              </li>
              <li class="tree-item mb-1">
                <div class="tree-node child-node d-flex align-items-center">
                  <i class="bi bi-file-earmark-text me-1.5 text-muted"></i>
                  <span>부서 관리</span>
                </div>
              </li>
            </ul>
          </li>
        </ul>
      </div>

      <!-- RIGHT: API Permission Mapping Matrix Card -->
      <div class="right-panel matrix-view flex-1">
        <div class="panel-header d-flex justify-content-between align-items-center">
          <span class="fw-bold text-truncate">
            <i class="bi bi-key me-1 text-primary"></i> API 권한 매핑 <small class="text-muted fw-normal ms-1">(선택 노드: 메뉴 권한 관리)</small>
          </span>
          <!-- Clear Scope: API Permission Save Button moved to Right Card Header -->
          <button class="btn-b2b-primary py-1.5 px-3">
            <i class="bi bi-floppy me-1"></i> API 권한 저장
          </button>
        </div>
        <div class="table-responsive p-0">
          <table class="b2b-table compact-table align-middle">
            <thead>
              <tr>
                <th class="text-start">기능명</th>
                <th class="text-start">API Endpoint</th>
                <th style="width: 80px">조회 (R)</th>
                <th style="width: 80px">등록 (C)</th>
                <th style="width: 80px">수정 (U)</th>
                <th style="width: 80px">삭제 (D)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="fw-semibold text-start">메뉴 목록 조회</td>
                <td class="text-start"><code class="endpoint-code font-monospace">GET /api/v1/menus</code></td>
                <td><input type="checkbox" class="form-check-input" checked /></td>
                <td><input type="checkbox" class="form-check-input" disabled /></td>
                <td><input type="checkbox" class="form-check-input" disabled /></td>
                <td><input type="checkbox" class="form-check-input" disabled /></td>
              </tr>
              <tr>
                <td class="fw-semibold text-start">메뉴 상세 등록</td>
                <td class="text-start"><code class="endpoint-code font-monospace">POST /api/v1/menus</code></td>
                <td><input type="checkbox" class="form-check-input" disabled /></td>
                <td><input type="checkbox" class="form-check-input" checked /></td>
                <td><input type="checkbox" class="form-check-input" disabled /></td>
                <td><input type="checkbox" class="form-check-input" disabled /></td>
              </tr>
              <tr>
                <td class="fw-semibold text-start">메뉴 정보 수정</td>
                <td class="text-start"><code class="endpoint-code font-monospace">PUT /api/v1/menus/:id</code></td>
                <td><input type="checkbox" class="form-check-input" disabled /></td>
                <td><input type="checkbox" class="form-check-input" disabled /></td>
                <td><input type="checkbox" class="form-check-input" checked /></td>
                <td><input type="checkbox" class="form-check-input" disabled /></td>
              </tr>
              <tr>
                <td class="fw-semibold text-start">메뉴 삭제</td>
                <td class="text-start"><code class="endpoint-code font-monospace">DELETE /api/v1/menus/:id</code></td>
                <td><input type="checkbox" class="form-check-input" disabled /></td>
                <td><input type="checkbox" class="form-check-input" disabled /></td>
                <td><input type="checkbox" class="form-check-input" disabled /></td>
                <td><input type="checkbox" class="form-check-input" checked /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Vue component logic
</script>

<style scoped>
.flex-100vh {
  display: flex;
  flex-direction: column;
  height: 100vh;
  box-sizing: border-box;
}
.content-split {
  display: flex;
  flex: 1;
  gap: 16px;
  overflow: hidden;
}
.left-panel, .right-panel {
  background: var(--b2b-color-bg-card);
  border: 1px solid var(--b2b-color-border);
  border-radius: var(--b2b-radius-md);
  display: flex;
  flex-direction: column;
}
.left-panel { width: 320px; }
.right-panel { flex: 1; overflow-y: auto; }
.panel-header {
  padding: 10px 16px;
  border-bottom: 1px solid var(--b2b-color-border);
  background-color: var(--b2b-color-bg-body);
}

.tree { list-style: none; padding: 12px; margin: 0; }
.sub-tree { list-style: none; padding-left: 12px; margin-top: 4px; }
.tree-node {
  padding: 6px 10px;
  border-radius: var(--b2b-radius-sm);
  cursor: pointer;
  transition: all 0.15s ease;
}
.tree-node:hover {
  background-color: var(--b2b-color-tab-bg);
}

/* 2. Left Tree Active Selected Node Highlight Tint */
.selected-highlight {
  background-color: #eff6ff !important;
  color: var(--b2b-color-primary) !important;
  border-left: 3px solid var(--b2b-color-primary) !important;
  font-weight: 700 !important;
}
[data-theme="dark"] .selected-highlight {
  background-color: rgba(59, 130, 246, 0.15) !important;
  color: #60a5fa !important;
}

/* 3. Compact Table & Monospace Code Font */
.compact-table th, .compact-table td {
  padding: 6px 12px !important;
  font-size: 13px;
  border-bottom: 1px solid var(--b2b-color-border);
}
.compact-table th {
  background-color: var(--b2b-color-bg-body);
}
.endpoint-code {
  background-color: var(--b2b-color-tab-bg);
  color: var(--b2b-color-primary);
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 12px;
}
</style>
