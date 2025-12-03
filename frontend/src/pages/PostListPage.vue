<template>
  <div class="container mt-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2><i class="bi bi-file-text me-2"></i>게시판</h2>
      <button class="btn btn-primary" @click="goToWrite">
        <i class="bi bi-pencil-square me-1"></i>글쓰기
      </button>
    </div>

    <!-- 게시글 목록 -->
    <div class="card">
      <div class="card-body">
        <div v-if="loading" class="text-center py-5">
          <div class="spinner-border" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>

        <div v-else-if="posts.length === 0" class="text-center py-5 text-muted">
          <i class="bi bi-inbox fs-1"></i>
          <p class="mt-2">게시글이 없습니다.</p>
        </div>

        <div v-else class="list-group list-group-flush">
          <div
            v-for="post in posts"
            :key="post.id"
            class="list-group-item list-group-item-action"
            @click="goToDetail(post.id)"
            style="cursor: pointer"
          >
            <div class="d-flex justify-content-between align-items-start">
              <div class="flex-grow-1">
                <h5 class="mb-1">{{ post.title }}</h5>
                <p class="mb-1 text-muted small">{{ truncate(post.content, 100) }}</p>
                <small class="text-muted">
                  <i class="bi bi-person me-1"></i>{{ post.authorId }}
                  <i class="bi bi-calendar3 ms-3 me-1"></i>{{ formatDate(post.createdAt) }}
                  <i class="bi bi-eye ms-3 me-1"></i>{{ post.viewCount }}
                </small>
              </div>
              <span v-if="post.status === 'DRAFT'" class="badge bg-secondary">임시저장</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import http from '@/utils/http'
import { showToast } from '@/utils/toastUtil'
import { formatDate } from '@/utils/dateUtil'
import { truncate } from '@/utils/stringUtil'

export default {
  name: 'PostListPage',
  data() {
    return {
      posts: [],
      loading: false,
    }
  },
  mounted() {
    this.fetchPosts()
  },
  activated() {
    // keep-alive 사용 시 페이지 재진입할 때마다 목록 새로고침
    this.fetchPosts()
  },
  watch: {
    // 라우트 변경 감지하여 목록 새로고침
    $route(to, from) {
      if (to.path === '/posts' && from.path.startsWith('/posts/')) {
        this.fetchPosts()
      }
    },
  },
  methods: {
    formatDate,
    truncate,
    fetchPosts() {
      this.loading = true
      http
        .get('/posts')
        .then((response) => {
          this.posts = response.data || []
        })
        .catch((error) => {
          console.error('[PostListPage] 에러:', error)
          this.posts = []
          showToast('게시글 목록 조회 실패', { type: 'error' })
        })
        .finally(() => {
          this.loading = false
        })
    },
    goToWrite() {
      this.$router.push('/posts/write')
    },
    goToDetail(id) {
      this.$router.push(`/posts/${id}`)
    },
  },
}
</script>

<style scoped>
.list-group-item:hover {
  background-color: #f8f9fa;
}
</style>
