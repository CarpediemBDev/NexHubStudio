<template>
  <div class="container py-3">
    <!-- Header Page Title -->
    <div class="mb-3">
      <h4 class="fw-bold text-dark m-0">RealGrid-Vue 샘플 (공통 슬롯 컴포넌트형)</h4>
      <p class="text-muted small mb-0">공식 <span class="badge bg-primary-soft text-primary font-monospace">realgrid-vue</span> 래퍼를 캡슐화한 RealGridCommonVue를 적용한 그리드 샘플입니다.</p>
    </div>

    <!-- Toolbar Buttons -->
    <div class="mb-3 d-flex justify-content-end gap-2">
      <button class="btn btn-action-sleek btn-sm px-3 d-flex align-items-center gap-1" @click="addRow">
        <i class="bi bi-plus-lg text-secondary"></i>
        <span class="fw-medium">행추가</span>
      </button>
      <button class="btn btn-action-sleek btn-action-delete btn-sm px-3 d-flex align-items-center gap-1" @click="deleteChecked">
        <i class="bi bi-dash-lg text-secondary"></i>
        <span class="fw-medium">행삭제</span>
      </button>
      <button class="btn btn-action-save btn-sm px-3 d-flex align-items-center gap-1" @click="saveData">
        <i class="bi bi-check2"></i>
        <span class="fw-semibold">저장</span>
      </button>
    </div>

    <!-- Grid Container Card with Common Vue Slot Component -->
    <div class="card shadow-sm border-light mb-4">
      <div class="card-body p-0">
        <!-- Using the encapsulated slot-based Common grid component -->
        <RealGridCommonVue
          ref="realgridComp"
          :rows="rows"
          height="560px"
          @init="onGridInit"
        >
            <!-- Defining Data Fields dynamically inside slot -->
            <RGDataField fieldName="userId" dataType="text" />
            <RGDataField fieldName="name" dataType="text" />
            <RGDataField fieldName="dept" dataType="text" />
            <RGDataField fieldName="role" dataType="text" />

            <!-- Defining Visual Columns dynamically inside slot -->
            <RGDataColumn
              name="userId"
              fieldName="userId"
              width="120"
              :header="{ text: 'ID' }"
              :editable="false"
              :styles="{ textAlignment: 'center' }"
            />
            <RGDataColumn
              name="name"
              fieldName="name"
              width="160"
              :header="{ text: '이름' }"
              :styles="{ textAlignment: 'near' }"
            />
            <RGDataColumn
              name="dept"
              fieldName="dept"
              width="160"
              :header="{ text: '부서' }"
              :styles="{ textAlignment: 'near' }"
              :mergeRule="{ criteria: 'value' }"
            />
            <RGDataColumn
              name="role"
              fieldName="role"
              width="200"
              :header="{ text: '역할' }"
              :styles="{ textAlignment: 'near' }"
            />
          </RealGridCommonVue>
      </div>
    </div>
  </div>
</template>

<script>
// Import our newly created Common Vue wrapper component
import RealGridCommonVue from '@/components/RealGridCommonVue.vue'
// Import visual grid items for slot rendering
import { RGDataField, RGDataColumn } from 'realgrid-vue'
import { showToast } from '@/utils/toastUtil.js'

export default {
  name: 'RealGridVuePage',
  components: {
    RealGridCommonVue,
    RGDataField,
    RGDataColumn
  },
  data() {
    return {
      rows: [] // Bound to RealGridCommonVue rows prop
    }
  },
  mounted() {
    this.loadUsers()
  },
  methods: {
    // 공통 컴포넌트 탈출구(Escape Hatch): gridView 원본 직접 제어
    onGridInit({ gridView }) {
      console.log('RealGridCommonVue 인스턴스 직접 제어 시작')
      
      // [예제 - 틀고정] ID 컬럼(첫 번째 컬럼)을 좌측에 고정
      gridView.setFixedOptions({
        colCount: 1,
        resizable: true
      })
    },

    async loadUsers() {
      try {
        const url = (import.meta.env?.BASE_URL ?? '/') + 'db.json'
        const res = await fetch(url)
        const data = await res.json()
        this.rows = Array.isArray(data) ? data : data.users || []
        
        showToast('데이터가 성공적으로 로드되었습니다. (realgrid-vue 공통형)', { type: 'success' })
      } catch (error) {
        console.error('Error loading users:', error)
        showToast('데이터를 로드하는 데 실패했습니다.', { type: 'danger' })
      }
    },

    addRow() {
      const tempId = 'vue_user_' + Math.random().toString(36).substring(2, 8)
      this.$refs.realgridComp.addRow({
        userId: tempId,
        name: '새 사용자 (Vue)',
        dept: '마케팅지원팀',
        role: '연구원'
      })
      showToast('새 행이 추가되었습니다. (realgrid-vue 공통형)', { type: 'info' })
    },

    deleteChecked() {
      const count = this.$refs.realgridComp.deleteChecked()
      if (count === 0) {
        showToast('선택된 사용자가 없습니다.', { type: 'warning' })
        return
      }
      showToast(`${count}건이 삭제 표시되었습니다. (realgrid-vue 공통형)`, { type: 'warning' })
    },

    async saveData() {
      const changes = this.$refs.realgridComp.getChanges()
      const totalChanges = changes.created.length + changes.updated.length + changes.deleted.length

      if (totalChanges === 0) {
        showToast('변경사항이 없습니다.', { type: 'warning' })
        return
      }

      console.log('서버로 저장할 RealGrid-Vue 데이터:', changes)

      showToast('저장 성공! (realgrid-vue 공통형)', { type: 'success' })
      alert(
        `[realgrid-vue 래퍼 저장 완료]\n` +
        `- 추가: ${changes.created.length}건\n` +
        `- 수정: ${changes.updated.length}건\n` +
        `- 삭제: ${changes.deleted.length}건`
      )

      await this.loadUsers()
    }
  }
}
</script>

<style scoped>
.container {
  max-width: 1200px;
}

.bg-primary-soft {
  background-color: rgba(59, 130, 246, 0.1);
}

/* ==========================================================================
   Enterprise Sleek Toolbar Button Custom Styling 
   ========================================================================== */
.btn-action-sleek {
  background-color: #ffffff;
  border: 1px solid #d1d5db; /* gray-300 */
  color: #4b5563; /* gray-600 */
  font-size: 13px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.btn-action-sleek:hover {
  background-color: #f9fafb; /* gray-50 */
  border-color: #9ca3af; /* gray-400 */
  color: #1f2937; /* gray-800 */
}

/* Subtle soft danger effect on hover for row deletion */
.btn-action-delete:hover {
  background-color: #fef2f2; /* red-50 */
  border-color: #fca5a5; /* red-300 */
  color: #dc2626; /* red-600 */
}
.btn-action-delete:hover i {
  color: #dc2626 !important;
}

/* Elegant Slate/Navy Save Button for high-end feel */
.btn-action-save {
  background-color: #3b82f6; /* premium blue */
  border: 1px solid #3b82f6;
  color: #ffffff;
  font-size: 13px;
  border-radius: 6px;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px 0 rgba(59, 130, 246, 0.05);
}

.btn-action-save:hover {
  background-color: #2563eb; /* darker blue */
  border-color: #2563eb;
  color: #ffffff;
}
</style>
