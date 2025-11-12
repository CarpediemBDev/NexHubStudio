<template>
  <div class="container mt-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2><i class="bi bi-folder me-2"></i>파일 관리</h2>
      <button class="btn btn-primary" @click="showUploadModal">
        <i class="bi bi-upload me-1"></i>파일 업로드
      </button>
    </div>

    <!-- 파일 목록 -->
    <div class="card">
      <div class="card-body">
        <div v-if="loading" class="text-center py-5">
          <div class="spinner-border" role="status"></div>
        </div>

        <div v-else-if="files.length === 0" class="text-center py-5 text-muted">
          <i class="bi bi-inbox fs-1"></i>
          <p class="mt-2">업로드된 파일이 없습니다.</p>
        </div>

        <div v-else class="table-responsive">
          <table class="table table-hover">
            <thead>
              <tr>
                <th>파일명</th>
                <th>크기</th>
                <th>업로더</th>
                <th>업로드 날짜</th>
                <th>액션</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="file in files" :key="file.id">
                <td>
                  <i :class="getFileIcon(file.contentType)" class="me-2"></i>
                  {{ file.originalName }}
                </td>
                <td>{{ formatFileSize(file.fileSize) }}</td>
                <td>{{ file.uploaderId }}</td>
                <td>{{ formatDate(file.uploadedAt) }}</td>
                <td>
                  <button
                    class="btn btn-sm btn-outline-primary me-1"
                    @click="downloadFile(file.id)"
                  >
                    <i class="bi bi-download"></i>
                  </button>
                  <button
                    v-if="file.uploaderId === currentUserId"
                    class="btn btn-sm btn-outline-danger"
                    @click="deleteFile(file.id)"
                  >
                    <i class="bi bi-trash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 업로드 모달 -->
    <div class="modal fade" id="uploadModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">파일 업로드</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label for="fileInput" class="form-label">파일 선택</label>
              <input type="file" class="form-control" id="fileInput" @change="handleFileChange" />
              <div class="form-text">허용: JPG, PNG, GIF, PDF (최대 10MB)</div>
            </div>
            <div v-if="selectedFile" class="alert alert-info">
              <strong>선택된 파일:</strong> {{ selectedFile.name }} ({{
                formatFileSize(selectedFile.size)
              }})
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">취소</button>
            <button
              type="button"
              class="btn btn-primary"
              @click="uploadFile"
              :disabled="!selectedFile || uploading"
            >
              <span v-if="uploading">
                <span class="spinner-border spinner-border-sm me-1"></span>업로드 중...
              </span>
              <span v-else> <i class="bi bi-upload me-1"></i>업로드 </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import { showToast } from '@/utils/toastUtil'
import { Modal } from 'bootstrap'

export default {
  name: 'FileListPage',
  data() {
    return {
      files: [],
      loading: false,
      uploading: false,
      selectedFile: null,
      uploadModal: null,
      currentUserId: 'Asparagus.cata', // 임시 사용자
    }
  },
  mounted() {
    this.fetchFiles()
    this.uploadModal = new Modal(document.getElementById('uploadModal'))
  },
  methods: {
    async fetchFiles() {
      this.loading = true
      try {
        const response = await axios.get('http://localhost:8080/api/files')
        this.files = response.data.data
      } catch (error) {
        showToast('error', '파일 목록 조회 실패')
        console.error(error)
      } finally {
        this.loading = false
      }
    },
    showUploadModal() {
      this.selectedFile = null
      this.uploadModal.show()
    },
    handleFileChange(event) {
      this.selectedFile = event.target.files[0]
    },
    async uploadFile() {
      if (!this.selectedFile) {
        showToast('warning', '파일을 선택하세요')
        return
      }

      this.uploading = true
      const formData = new FormData()
      formData.append('file', this.selectedFile)

      try {
        await axios.post('http://localhost:8080/api/files', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'X-User-Id': this.currentUserId,
          },
        })
        showToast('success', '파일 업로드 완료')
        this.uploadModal.hide()
        this.fetchFiles()
      } catch (error) {
        const message = error.response?.data?.message || '파일 업로드 실패'
        showToast('error', message)
        console.error(error)
      } finally {
        this.uploading = false
      }
    },
    async deleteFile(id) {
      if (!confirm('파일을 삭제하시겠습니까?')) return

      try {
        await axios.delete(`http://localhost:8080/api/files/${id}`, {
          headers: { 'X-User-Id': this.currentUserId },
        })
        showToast('success', '파일 삭제 완료')
        this.fetchFiles()
      } catch (error) {
        showToast('error', '파일 삭제 실패')
        console.error(error)
      }
    },
    downloadFile(id) {
      window.open(`http://localhost:8080/api/files/${id}/download`, '_blank')
    },
    getFileIcon(contentType) {
      if (!contentType) return 'bi bi-file'
      if (contentType.startsWith('image/')) return 'bi bi-file-image'
      if (contentType === 'application/pdf') return 'bi bi-file-pdf'
      return 'bi bi-file-earmark'
    },
    formatFileSize(bytes) {
      if (bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
    },
    formatDate(dateString) {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleString('ko-KR')
    },
  },
}
</script>
