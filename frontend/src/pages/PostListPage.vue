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
  methods: {
    formatDate,
    truncate,
    async fetchPosts() {
      this.loading = true
      try {
        const response = await http.get('/posts')
        this.posts = response.data.data
      } catch (error) {
        // 에러는 http 인터셉터에서 자동 처리
        console.error(error)
      } finally {
        this.loading = false
      }
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
