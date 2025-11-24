<template>
  <div class="modal-backdrop" @click.self="close">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">
            <i class="bi bi-folder-plus me-2"></i>
            {{ isEdit ? '코드 그룹 수정' : '코드 그룹 등록' }}
          </h5>
          <button type="button" class="btn-close" @click="close"></button>
        </div>

        <div class="modal-body">
          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label fw-bold">
                그룹코드 <span class="text-danger">*</span>
              </label>
              <input
                type="text"
                class="form-control"
                v-model="form.groupCode"
                :disabled="isEdit"
                placeholder="예: ROLE_GROUP"
                maxlength="50"
              />
            </div>

            <div class="col-md-6">
              <label class="form-label fw-bold"> 그룹명 <span class="text-danger">*</span> </label>
              <input
                type="text"
                class="form-control"
                v-model="form.groupName"
                placeholder="예: 역할 그룹"
                maxlength="100"
              />
            </div>

            <div class="col-md-12">
              <label class="form-label fw-bold">설명</label>
              <textarea
                class="form-control"
                v-model="form.description"
                rows="2"
                placeholder="코드 그룹에 대한 설명을 입력하세요"
                maxlength="200"
              ></textarea>
            </div>

            <div class="col-md-4">
              <label class="form-label fw-bold">카테고리</label>
              <select class="form-select" v-model="form.category">
                <option value="">선택</option>
                <option value="시스템">시스템</option>
                <option value="조직">조직</option>
                <option value="업무">업무</option>
                <option value="설정">설정</option>
                <option value="기타">기타</option>
              </select>
            </div>

            <div class="col-md-4">
              <label class="form-label fw-bold">아이콘</label>
              <div class="input-group">
                <span class="input-group-text">
                  <i :class="form.icon || 'bi bi-folder'" style="font-size: 1.2rem"></i>
                </span>
                <input
                  type="text"
                  class="form-control"
                  v-model="form.icon"
                  placeholder="bi-folder"
                  maxlength="50"
                />
              </div>
              <small class="text-muted">Bootstrap Icons 클래스명</small>
            </div>

            <div class="col-md-4">
              <label class="form-label fw-bold">색상</label>
              <div class="input-group">
                <input
                  type="color"
                  class="form-control form-control-color"
                  v-model="form.colorCode"
                  style="width: 50px"
                />
                <input
                  type="text"
                  class="form-control"
                  v-model="form.colorCode"
                  placeholder="#0d6efd"
                  maxlength="20"
                />
              </div>
            </div>

            <div class="col-md-6">
              <label class="form-label fw-bold">정렬순서</label>
              <input
                type="number"
                class="form-control"
                v-model.number="form.sortOrder"
                min="0"
                placeholder="0"
              />
            </div>

            <div class="col-md-6">
              <label class="form-label fw-bold">사용여부</label>
              <div class="form-check form-switch mt-2">
                <input
                  class="form-check-input"
                  type="checkbox"
                  v-model="useYnChecked"
                  id="useYnSwitch"
                />
                <label class="form-check-label" for="useYnSwitch">
                  {{ useYnChecked ? '사용' : '미사용' }}
                </label>
              </div>
            </div>
          </div>

          <!-- 미리보기 -->
          <div class="preview-box mt-4 p-3 bg-light rounded">
            <div class="fw-bold mb-2">미리보기</div>
            <div class="d-flex align-items-center gap-2">
              <i
                :class="form.icon || 'bi bi-folder'"
                :style="{ fontSize: '1.5rem', color: form.colorCode || '#6c757d' }"
              ></i>
              <div>
                <div class="fw-bold">{{ form.groupName || '그룹명' }}</div>
                <small class="text-muted">{{ form.description || '설명' }}</small>
              </div>
              <span
                class="badge ms-auto"
                :style="{
                  background: form.colorCode || '#6c757d',
                  color: 'white',
                }"
              >
                {{ form.category || '카테고리' }}
              </span>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="close">취소</button>
          <button type="button" class="btn btn-primary" @click="save">
            <i class="bi bi-save"></i> 저장
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import http from '@/utils/http'
import { showToast } from '@/utils/toastUtil.js'

export default {
  name: 'CommonCodeGroupPopup',
  props: {
    group: {
      type: Object,
      default: null,
    },
  },
  data() {
    return {
      form: {
        groupCode: '',
        groupName: '',
        description: '',
        sortOrder: 0,
        useYn: 'Y',
        icon: 'bi-folder',
        colorCode: '#0d6efd',
        category: '시스템',
      },
      useYnChecked: true,
    }
  },
  computed: {
    isEdit() {
      return this.group != null
    },
  },
  watch: {
    useYnChecked(val) {
      this.form.useYn = val ? 'Y' : 'N'
    },
  },
  mounted() {
    if (this.group) {
      this.form = { ...this.group }
      this.useYnChecked = this.group.useYn === 'Y'
    }
  },
  methods: {
    close() {
      this.$emit('close')
    },
    async save() {
      // 필수값 검증
      if (!this.form.groupCode || !this.form.groupCode.trim()) {
        alert('그룹코드를 입력하세요.')
        return
      }
      if (!this.form.groupName || !this.form.groupName.trim()) {
        alert('그룹명을 입력하세요.')
        return
      }

      try {
        let response
        if (this.isEdit) {
          response = await http.put(`/common-code-groups/${this.group.id}`, this.form)
          showToast('그룹 수정 완료', { type: 'success' })
        } else {
          response = await http.post('/common-code-groups', this.form)
          showToast('그룹 등록 완료', { type: 'success' })
        }
        console.log('Save response:', response)
        this.$emit('save')
        this.close()
      } catch (error) {
        console.error('Save error:', error)
        const msg = error?.response?.data?.message || error.message || '저장 실패'
        showToast(msg, { type: 'error' })
      }
    },
  },
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
  overflow-y: auto;
  padding: 1rem;
}

.modal-dialog {
  background: white;
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  max-width: 700px;
  width: 90%;
  margin: auto;
  max-height: calc(100vh - 2rem);
  display: flex;
  flex-direction: column;
}

.modal-content {
  border: none;
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 2rem);
}

.modal-header {
  border-bottom: 2px solid #dee2e6;
  padding: 1rem 1.5rem;
  flex-shrink: 0;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  border-top: 2px solid #dee2e6;
  padding: 1rem 1.5rem;
  flex-shrink: 0;
}

.preview-box {
  border: 1px solid #dee2e6;
}
</style>
