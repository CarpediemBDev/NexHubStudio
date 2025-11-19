<template>
  <div class="file-upload-component">
    <label v-if="label" class="form-label fw-bold">
      {{ label }}
      <span v-if="required" class="text-danger">*</span>
    </label>

    <!-- 파일 선택 영역 -->
    <div
      class="upload-area"
      :class="{ 'drag-over': isDragging }"
      @dragover.prevent="handleDragOver"
      @dragleave.prevent="handleDragLeave"
      @drop.prevent="handleDrop"
    >
      <input
        ref="fileInput"
        type="file"
        :multiple="multiple"
        :accept="acceptString"
        @change="handleFileSelect"
        class="d-none"
      />

      <div class="text-center py-4">
        <i class="bi bi-cloud-upload fs-1 text-primary"></i>
        <p class="mb-2 mt-2">
          <button type="button" class="btn btn-outline-primary btn-sm" @click="triggerFileInput">
            <i class="bi bi-folder2-open me-1"></i>파일 선택
          </button>
          <span class="ms-2 text-muted">또는 드래그 앤 드롭</span>
        </p>
        <small class="text-muted"> {{ acceptDescription }} (최대 {{ maxSizeMB }}MB) </small>
      </div>
    </div>

    <!-- 업로드 진행 상태 -->
    <div v-if="uploading" class="mt-2">
      <div class="d-flex align-items-center">
        <div class="spinner-border spinner-border-sm text-primary me-2"></div>
        <small class="text-muted">업로드 중... ({{ uploadProgress }}%)</small>
      </div>
      <div class="progress mt-1" style="height: 4px">
        <div class="progress-bar" :style="{ width: uploadProgress + '%' }"></div>
      </div>
    </div>

    <!-- 업로드된 파일 목록 -->
    <ul v-if="uploadedFiles.length > 0" class="list-group mt-3">
      <li
        v-for="(file, index) in uploadedFiles"
        :key="file.id || index"
        class="list-group-item d-flex justify-content-between align-items-center"
      >
        <div class="d-flex align-items-center flex-grow-1">
          <i :class="getFileIcon(file.contentType || file.type)" class="me-2"></i>
          <div>
            <div>{{ file.originalName || file.name }}</div>
            <small class="text-muted">{{ formatFileSize(file.fileSize || file.size) }}</small>
          </div>
        </div>
        <button
          type="button"
          class="btn btn-sm btn-outline-danger"
          @click="removeFile(index)"
          :disabled="uploading"
        >
          <i class="bi bi-trash"></i>
        </button>
      </li>
    </ul>

    <!-- 에러 메시지 -->
    <div
      v-if="errorMessage"
      class="alert alert-danger alert-dismissible fade show mt-2"
      role="alert"
    >
      <i class="bi bi-exclamation-triangle me-2"></i>{{ errorMessage }}
      <button type="button" class="btn-close" @click="errorMessage = ''"></button>
    </div>
  </div>
</template>

<script>
import http from '@/utils/http'
import { showToast } from '@/utils/toastUtil'

export default {
  name: 'FileUpload',
  props: {
    // 라벨
    label: {
      type: String,
      default: '첨부파일',
    },
    // 필수 여부
    required: {
      type: Boolean,
      default: false,
    },
    // 다중 선택 허용
    multiple: {
      type: Boolean,
      default: true,
    },
    // 허용할 파일 타입 (예: ['image/*', '.pdf', '.docx'])
    allowedTypes: {
      type: Array,
      default: () => ['image/*', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.zip'],
    },
    // 최대 파일 크기 (MB)
    maxSizeMB: {
      type: Number,
      default: 10,
    },
    // 기존 업로드된 파일 목록
    modelValue: {
      type: Array,
      default: () => [],
    },
    // 현재 사용자 ID
    userId: {
      type: String,
      default: 'anonymous',
    },
  },
  emits: ['update:modelValue', 'uploaded', 'removed'],
  data() {
    return {
      uploadedFiles: [],
      uploading: false,
      uploadProgress: 0,
      isDragging: false,
      errorMessage: '',
    }
  },
  computed: {
    acceptString() {
      return this.allowedTypes.join(',')
    },
    acceptDescription() {
      const types = this.allowedTypes.map((t) => {
        if (t === 'image/*') return '이미지'
        if (t.startsWith('.')) return t.toUpperCase()
        return t
      })
      return types.join(', ')
    },
    maxSizeBytes() {
      return this.maxSizeMB * 1024 * 1024
    },
  },
  watch: {
    modelValue: {
      immediate: true,
      handler(newVal) {
        this.uploadedFiles = [...newVal]
      },
    },
  },
  methods: {
    triggerFileInput() {
      this.$refs.fileInput.click()
    },
    handleDragOver(e) {
      this.isDragging = true
    },
    handleDragLeave(e) {
      this.isDragging = false
    },
    handleDrop(e) {
      this.isDragging = false
      const files = Array.from(e.dataTransfer.files)
      this.processFiles(files)
    },
    handleFileSelect(e) {
      const files = Array.from(e.target.files || [])
      this.processFiles(files)
      // 입력 초기화 (같은 파일 재선택 가능)
      e.target.value = null
    },
    processFiles(files) {
      if (!files.length) return

      this.errorMessage = ''

      // 파일 개수 체크
      if (!this.multiple && files.length > 1) {
        this.errorMessage = '파일을 하나만 선택해주세요.'
        return
      }

      for (const file of files) {
        // 파일 크기 검증
        if (file.size > this.maxSizeBytes) {
          this.errorMessage = `${file.name}: 파일 크기가 ${this.maxSizeMB}MB를 초과합니다.`
          continue
        }

        // 파일 타입 검증
        if (!this.isAllowedType(file)) {
          this.errorMessage = `${file.name}: 허용되지 않은 파일 형식입니다. (${this.acceptDescription}만 가능)`
          continue
        }

        // 업로드
        this.uploadFile(file)
      }
    },
    isAllowedType(file) {
      const fileName = file.name.toLowerCase()
      const fileType = file.type

      return this.allowedTypes.some((allowed) => {
        // 와일드카드 (예: image/*)
        if (allowed.includes('*')) {
          const prefix = allowed.split('/')[0]
          return fileType.startsWith(prefix + '/')
        }
        // 확장자 (예: .pdf)
        if (allowed.startsWith('.')) {
          return fileName.endsWith(allowed.toLowerCase())
        }
        // MIME 타입
        return fileType === allowed
      })
    },
    uploadFile(file) {
      this.uploading = true
      this.uploadProgress = 0

      const formData = new FormData()
      formData.append('file', file)

      http
        .post('/files', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'X-User-Id': this.userId,
          },
          onUploadProgress: (progressEvent) => {
            this.uploadProgress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          },
        })
        .then((resp) => {
          const uploaded = resp.data.data
          this.uploadedFiles.push(uploaded)
          this.$emit('update:modelValue', this.uploadedFiles)
          this.$emit('uploaded', uploaded)
          showToast('파일 업로드 완료', { type: 'success' })
        })
        .catch((err) => {
          console.error('파일 업로드 실패', err)
          this.errorMessage = err.response?.data?.message || '파일 업로드에 실패했습니다.'
        })
        .finally(() => {
          this.uploading = false
          this.uploadProgress = 0
        })
    },
    removeFile(index) {
      const file = this.uploadedFiles[index]

      if (!confirm(`${file.originalName || file.name} 파일을 삭제하시겠습니까?`)) {
        return
      }

      // 서버에 업로드된 파일인 경우 삭제 API 호출
      if (file.id) {
        http
          .delete(`/files/${file.id}`, {
            headers: { 'X-User-Id': this.userId },
          })
          .then(() => {
            this.uploadedFiles.splice(index, 1)
            this.$emit('update:modelValue', this.uploadedFiles)
            this.$emit('removed', file)
            showToast('파일 삭제 완료', { type: 'success' })
          })
          .catch((err) => {
            console.error('파일 삭제 실패', err)
            this.errorMessage = '파일 삭제에 실패했습니다.'
          })
      } else {
        // 로컬에서만 제거
        this.uploadedFiles.splice(index, 1)
        this.$emit('update:modelValue', this.uploadedFiles)
        this.$emit('removed', file)
      }
    },
    formatFileSize(bytes) {
      if (!bytes) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
    },
    getFileIcon(contentType) {
      if (!contentType) return 'bi bi-file-earmark'
      if (contentType.startsWith('image/')) return 'bi bi-file-image text-success'
      if (contentType.includes('pdf')) return 'bi bi-file-pdf text-danger'
      if (contentType.includes('word') || contentType.includes('document'))
        return 'bi bi-file-word text-primary'
      if (contentType.includes('excel') || contentType.includes('spreadsheet'))
        return 'bi bi-file-excel text-success'
      if (contentType.includes('zip') || contentType.includes('compressed'))
        return 'bi bi-file-zip text-warning'
      if (contentType.includes('text')) return 'bi bi-file-text'
      return 'bi bi-file-earmark'
    },
  },
}
</script>

<style scoped>
.upload-area {
  border: 2px dashed #dee2e6;
  border-radius: 8px;
  transition: all 0.3s ease;
  cursor: pointer;
  background-color: #f8f9fa;
}

.upload-area:hover {
  border-color: #0d6efd;
  background-color: #e7f1ff;
}

.upload-area.drag-over {
  border-color: #0d6efd;
  background-color: #cfe2ff;
  border-style: solid;
}

.list-group-item {
  transition: background-color 0.2s ease;
}

.list-group-item:hover {
  background-color: #f8f9fa;
}
</style>
