<template>
  <div class="container mt-4">
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border" role="status"></div>
    </div>

    <div v-else-if="post" class="card">
      <!-- 게시글 헤더 -->
      <div class="card-header bg-light">
        <div class="d-flex justify-content-between align-items-center">
          <h3 class="mb-0">{{ post.title }}</h3>
          <div v-if="isAuthor" class="btn-group">
            <button class="btn btn-sm btn-outline-primary" @click="goToEdit">
              <i class="bi bi-pencil"></i> 수정
            </button>
            <button class="btn btn-sm btn-outline-danger" @click="deletePost">
              <i class="bi bi-trash"></i> 삭제
            </button>
          </div>
        </div>
        <div class="text-muted small mt-2">
          <i class="bi bi-person me-1"></i>{{ post.authorId }}
          <i class="bi bi-calendar3 ms-3 me-1"></i>{{ formatDate(post.createdAt) }}
          <i class="bi bi-eye ms-3 me-1"></i>{{ post.viewCount }}
        </div>
      </div>

      <!-- 게시글 내용 -->
      <div class="card-body">
        <div class="post-content" v-html="formatContent(post.content)"></div>
      </div>

      <!-- 댓글 섹션 -->
      <div class="card-footer">
        <h5><i class="bi bi-chat-dots me-2"></i>댓글 {{ comments.length }}</h5>

        <!-- 댓글 작성 -->
        <div class="mb-3">
          <textarea
            v-model="newComment"
            class="form-control"
            rows="3"
            placeholder="댓글을 입력하세요..."
          ></textarea>
          <button class="btn btn-primary btn-sm mt-2" @click="createComment">
            <i class="bi bi-send me-1"></i>댓글 작성
          </button>
        </div>

        <!-- 댓글 목록 -->
        <div v-for="comment in comments" :key="comment.id" class="border-top pt-3 mb-3">
          <div class="d-flex justify-content-between">
            <div>
              <strong>{{ comment.authorId }}</strong>
              <small class="text-muted ms-2">{{ formatDate(comment.createdAt) }}</small>
            </div>
            <div v-if="comment.authorId === currentUserId">
              <button class="btn btn-sm btn-link text-danger" @click="deleteComment(comment.id)">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </div>
          <p class="mb-1 mt-2">{{ comment.content }}</p>

          <!-- 대댓글 -->
          <div v-if="comment.replies && comment.replies.length > 0" class="ms-4 mt-2">
            <div
              v-for="reply in comment.replies"
              :key="reply.id"
              class="border-start border-3 ps-3 mb-2"
            >
              <div class="d-flex justify-content-between">
                <div>
                  <strong>{{ reply.authorId }}</strong>
                  <small class="text-muted ms-2">{{ formatDate(reply.createdAt) }}</small>
                </div>
                <button
                  v-if="reply.authorId === currentUserId"
                  class="btn btn-sm btn-link text-danger"
                  @click="deleteComment(reply.id)"
                >
                  <i class="bi bi-trash"></i>
                </button>
              </div>
              <p class="mb-0 mt-1">{{ reply.content }}</p>
            </div>
          </div>

          <!-- 대댓글 작성 -->
          <button class="btn btn-sm btn-link" @click="showReplyForm(comment.id)">
            <i class="bi bi-reply me-1"></i>답글
          </button>
          <div v-if="replyFormId === comment.id" class="mt-2">
            <textarea
              v-model="replyContent"
              class="form-control"
              rows="2"
              placeholder="답글을 입력하세요..."
            ></textarea>
            <button class="btn btn-primary btn-sm mt-1" @click="createReply(comment.id)">
              답글 작성
            </button>
            <button class="btn btn-secondary btn-sm mt-1 ms-1" @click="cancelReply">취소</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 목록으로 버튼 -->
    <div class="text-center mt-3">
      <button class="btn btn-secondary" @click="goToList">
        <i class="bi bi-list me-1"></i>목록으로
      </button>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import { showToast } from '@/utils/toastUtil'

export default {
  name: 'PostDetailPage',
  data() {
    return {
      post: null,
      comments: [],
      newComment: '',
      replyContent: '',
      replyFormId: null,
      loading: false,
      currentUserId: 'Asparagus.cata', // 임시 사용자 (나중에 로그인 기능 추가 시 변경)
    }
  },
  computed: {
    isAuthor() {
      return this.post && this.post.authorId === this.currentUserId
    },
  },
  mounted() {
    this.fetchPost()
    this.fetchComments()
  },
  methods: {
    async fetchPost() {
      this.loading = true
      try {
        const response = await axios.get(`http://localhost:8080/posts/${this.$route.params.id}`)
        this.post = response.data.data
      } catch (error) {
        showToast('error', '게시글 조회 실패')
        console.error(error)
      } finally {
        this.loading = false
      }
    },
    async fetchComments() {
      try {
        const response = await axios.get(
          `http://localhost:8080/comments/post/${this.$route.params.id}`
        )
        const allComments = response.data.data

        // 댓글과 대댓글 구조화
        this.comments = allComments
          .filter((c) => !c.parentId)
          .map((parent) => ({
            ...parent,
            replies: allComments.filter((c) => c.parentId === parent.id),
          }))
      } catch (error) {
        console.error('댓글 조회 실패:', error)
      }
    },
    async createComment() {
      if (!this.newComment.trim()) {
        showToast('warning', '댓글 내용을 입력하세요')
        return
      }

      try {
        await axios.post(
          'http://localhost:8080/comments',
          {
            postId: this.$route.params.id,
            content: this.newComment,
          },
          {
            headers: { 'X-User-Id': this.currentUserId },
          }
        )
        this.newComment = ''
        showToast('success', '댓글 작성 완료')
        this.fetchComments()
      } catch (error) {
        showToast('error', '댓글 작성 실패')
        console.error(error)
      }
    },
    async createReply(parentId) {
      if (!this.replyContent.trim()) {
        showToast('warning', '답글 내용을 입력하세요')
        return
      }

      try {
        await axios.post(
          'http://localhost:8080/comments',
          {
            postId: this.$route.params.id,
            parentId: parentId,
            content: this.replyContent,
          },
          {
            headers: { 'X-User-Id': this.currentUserId },
          }
        )
        this.replyContent = ''
        this.replyFormId = null
        showToast('success', '답글 작성 완료')
        this.fetchComments()
      } catch (error) {
        showToast('error', '답글 작성 실패')
        console.error(error)
      }
    },
    async deleteComment(commentId) {
      if (!confirm('댓글을 삭제하시겠습니까?')) return

      try {
        await axios.delete(`http://localhost:8080/comments/${commentId}`, {
          headers: { 'X-User-Id': this.currentUserId },
        })
        showToast('success', '댓글 삭제 완료')
        this.fetchComments()
      } catch (error) {
        showToast('error', '댓글 삭제 실패')
        console.error(error)
      }
    },
    async deletePost() {
      if (!confirm('게시글을 삭제하시겠습니까?')) return

      try {
        await axios.delete(`http://localhost:8080/posts/${this.$route.params.id}`, {
          headers: { 'X-User-Id': this.currentUserId },
        })
        showToast('success', '게시글 삭제 완료')
        this.$router.push('/posts')
      } catch (error) {
        showToast('error', '게시글 삭제 실패')
        console.error(error)
      }
    },
    showReplyForm(commentId) {
      this.replyFormId = commentId
      this.replyContent = ''
    },
    cancelReply() {
      this.replyFormId = null
      this.replyContent = ''
    },
    goToEdit() {
      this.$router.push(`/posts/${this.$route.params.id}/edit`)
    },
    goToList() {
      this.$router.push('/posts')
    },
    formatContent(content) {
      return content.replace(/\n/g, '<br>')
    },
    formatDate(dateString) {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleString('ko-KR')
    },
  },
}
</script>

<style scoped>
.post-content {
  min-height: 200px;
  line-height: 1.8;
}
</style>
