<template>
  <div class="container mt-4 mb-5">
    <div class="row justify-content-center">
      <div class="col-lg-10">
        <!-- 헤더 -->
        <div class="d-flex align-items-center mb-4">
          <div
            class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3"
            style="width: 50px; height: 50px"
          >
            <i class="bi bi-pencil-square fs-4"></i>
          </div>
          <div>
            <h2 class="mb-0">{{ isEdit ? '게시글 수정' : '게시글 작성' }}</h2>
            <small class="text-muted">{{
              isEdit ? '게시글을 수정합니다' : '새로운 게시글을 작성합니다'
            }}</small>
          </div>
        </div>

        <!-- 작성 폼 -->
        <div class="card shadow-sm border-0">
          <div class="card-body p-4">
            <form @submit.prevent="submitPost">
              <!-- 제목 -->
              <div
                class="mb-4"
                v-validation="{
                  required: true,
                  minLength: 2,
                  requiredMessage: '제목을 입력해주세요.',
                }"
              >
                <label for="title" class="form-label fw-bold">
                  제목 <span class="text-danger">*</span>
                </label>
                <input
                  v-model="form.title"
                  type="text"
                  class="form-control form-control-lg"
                  id="title"
                  placeholder="제목을 입력하세요"
                />
                <div class="form-text">
                  <i class="bi bi-info-circle me-1"></i>명확하고 간결한 제목을 작성하세요
                </div>
              </div>

              <!-- 내용 -->
              <div
                class="mb-4"
                v-validation="{
                  required: true,
                  minLength: 10,
                  requiredMessage: '내용을 입력해주세요.',
                  minLengthMessage: '최소 10자 이상 입력하세요.',
                }"
              >
                <label for="content" class="form-label fw-bold">
                  내용 <span class="text-danger">*</span>
                </label>
                <textarea
                  v-model="form.content"
                  class="form-control content-textarea"
                  id="content"
                  rows="18"
                  placeholder="게시글 내용을 입력하세요&#10;&#10;Markdown 문법을 지원합니다:&#10;# 제목&#10;**굵게**&#10;*기울임*&#10;- 목록"
                ></textarea>
                <div class="form-text d-flex justify-content-between">
                  <span><i class="bi bi-info-circle me-1"></i>Enter로 줄바꿈</span>
                  <span class="text-muted">{{ form.content.length }} 자</span>
                </div>
              </div>

              <!-- 버튼 그룹 -->
              <div class="d-flex justify-content-between align-items-center pt-3 border-top">
                <button type="button" class="btn btn-lg btn-outline-secondary" @click="goToList">
                  <i class="bi bi-list me-2"></i>목록으로
                </button>
                <div class="d-flex gap-2">
                  <button type="button" class="btn btn-lg btn-outline-primary" @click="saveDraft">
                    <i class="bi bi-file-earmark me-2"></i>임시저장
                  </button>
                  <button type="submit" class="btn btn-lg btn-primary px-4">
                    <i class="bi bi-check-circle me-2"></i>{{ isEdit ? '수정' : '작성' }}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        <!-- 안내 메시지 -->
        <div class="alert alert-info mt-3 border-0 shadow-sm">
          <i class="bi bi-lightbulb me-2"></i>
          <strong>작성 팁:</strong> 명확한 제목과 구조화된 내용으로 가독성을 높이세요.
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import http from '@/utils/http'
import { showToast } from '@/utils/toastUtil'

export default {
  name: 'PostWritePage',
  data() {
    return {
      form: {
        title: '',
        content: '',
        status: 'PUBLISHED',
      },
      isEdit: false,
      postId: null,
      currentUserId: 'Asparagus.cata', // 임시 사용자
    }
  },
  mounted() {
    this.postId = this.$route.params.id
    this.isEdit = !!this.postId

    if (this.isEdit) {
      this.fetchPost()
    }
  },
  methods: {
    fetchPost() {
      http
        .get(`/posts/${this.postId}`)
        .then((response) => {
          const post = response.data.data
          this.form.title = post.title
          this.form.content = post.content
          this.form.status = post.status
        })
        .catch((error) => {
          console.error(error)
          this.$router.push('/posts')
        })
    },
    savePost(status, successMessage, redirectPath) {
      this.form.status = status

      const url = this.isEdit ? `/posts/${this.postId}` : '/posts'
      const method = this.isEdit ? 'put' : 'post'

      http[method](url, this.form, { headers: { 'X-User-Id': this.currentUserId } })
        .then((response) => {
          showToast(successMessage, { type: 'success' })
          this.$router.push(redirectPath || `/posts/${response.data.data.id}`)
        })
        .catch((error) => {
          console.error(error)
        })
    },
    submitPost() {
      this.savePost('PUBLISHED', this.isEdit ? '게시글 수정 완료' : '게시글 작성 완료')
    },
    saveDraft() {
      this.savePost('DRAFT', '임시저장 완료', '/posts')
    },
    goToList() {
      if (this.form.title || this.form.content) {
        if (!confirm('작성 중인 내용이 있습니다. 목록으로 이동하시겠습니까?')) {
          return
        }
      }
      this.$router.push('/posts')
    },
  },
}
</script>

<style scoped>
.content-textarea {
  font-size: 1rem;
  line-height: 1.8;
  resize: vertical;
  min-height: 400px;
}

.content-textarea::placeholder {
  color: #adb5bd;
}

.btn-check:checked + .btn-outline-success {
  background-color: #198754;
  color: white;
}

.btn-check:checked + .btn-outline-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-group .btn {
  min-width: 120px;
}

.card {
  transition: box-shadow 0.3s ease;
}

.card:hover {
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.1) !important;
}
</style>
