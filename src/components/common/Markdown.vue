<template>
  <!-- 보기(읽기 전용): 가벼운 MdPreview -->
  <template v-if="readonly">
    <!-- showCatalog: 본문(9) + 우측 목차(3) 2열 레이아웃 -->
    <div v-if="showCatalog" class="row g-4 align-items-start">
      <div class="col-lg-9 col-md-8">
        <MdPreview v-bind="previewProps" />
      </div>
      <div class="col-lg-3 col-md-4">
        <div class="card shadow-sm border-0 sticky-toc">
          <div class="card-header bg-light border-0 fw-bold d-flex align-items-center gap-2 py-2">
            <i class="bi bi-list-nested text-primary fs-5"></i>
            <span>목차 (TOC)</span>
          </div>
          <div class="card-body p-3 catalog-wrapper">
            <MdCatalog :editor-id="uid" :theme="mdTheme" />
          </div>
        </div>
      </div>
    </div>
    <!-- 목차 없음: 단일 미리보기 -->
    <MdPreview v-else v-bind="previewProps" />
  </template>

  <!-- 편집: MdEditor (지연 로딩) -->
  <MdEditor
    v-else
    :editor-id="uid"
    v-model="content"
    :language="language"
    :theme="mdTheme"
    :toolbars="resolvedToolbars"
    :footers="[]"
    :preview="showPreview"
    :on-upload-img="onUploadImg"
    :placeholder="placeholder"
    :style="{ height: editorHeight }"
  />
</template>

<script>
import { defineAsyncComponent } from 'vue'
import { MdPreview, MdCatalog } from 'md-editor-v3'
import 'md-editor-v3/lib/preview.css'
import { useTabStore } from '@/stores/tabStore'

// 기본 툴바 프리셋 (한국 게시판/문서 작성 기준)
const DEFAULT_TOOLBARS = [
  'bold',
  'underline',
  'italic',
  'strikeThrough',
  '-',
  'title',
  'quote',
  'unorderedList',
  'orderedList',
  'task',
  '-',
  'codeRow',
  'code',
  'link',
  'image',
  'table',
  '-',
  'revoke',
  'next',
  '=',
  'preview',
  'catalog',
]

/**
 * 공통 마크다운 컴포넌트 (md-editor-v3 래퍼)
 *  - readonly: true                → 렌더 전용(MdPreview)
 *  - readonly + showCatalog: true  → 본문 + 우측 목차(MdCatalog) 2열 레이아웃
 *  - readonly: false               → 편집기(MdEditor, 지연 로딩)
 *  한국어 로케일 / 앱 테마(tabStore) 자동 연동 / 기본 툴바 / CSS 내장.
 *
 * 사용 예시:
 *   <Markdown v-model="form.content" />                         편집기
 *   <Markdown v-model="post.content" readonly />                본문 보기
 *   <Markdown v-model="post.content" readonly show-catalog />   본문 + 목차(TOC) 보기
 */
export default {
  name: 'Markdown',
  components: {
    MdPreview,
    MdCatalog,
    // 편집기는 실제로 편집할 때만 번들을 불러오도록 지연 로딩한다.
    MdEditor: defineAsyncComponent(async () => {
      await import('md-editor-v3/lib/style.css')
      const mod = await import('md-editor-v3')
      return mod.MdEditor
    }),
  },
  props: {
    modelValue: { type: String, default: '' },
    // 목차(TOC / Catalog) 표시 여부 (readonly 모드에서 사용)
    showCatalog: { type: Boolean, default: false },
    // 보기 전용 여부
    readonly: { type: Boolean, default: false },
    // 로케일 (기본: 영어 'en-US'). 한국어는 language="ko-KR" (사전은 mdEditorLocale.js에서 전역 등록).
    language: { type: String, default: 'en-US' },
    // 편집기 높이 (숫자면 px)
    height: { type: [Number, String], default: 480 },
    placeholder: { type: String, default: 'Markdown으로 작성하세요' },
    // 툴바 오버라이드 (미지정 시 기본 프리셋)
    toolbars: { type: Array, default: null },
    // 좌우 라이브 미리보기 표시 여부
    showPreview: { type: Boolean, default: true },
    // 이미지 업로드 훅 (미지정 시 md-editor 기본 동작)
    onUploadImg: { type: Function, default: undefined },
    // 미리보기 컨테이너에 추가할 클래스
    previewClass: { type: [String, Array, Object], default: '' },
  },
  emits: ['update:modelValue'],
  data() {
    return {
      // MdPreview ↔ MdCatalog 연동용 인스턴스 고유 ID (동일 화면 다중 사용 시 충돌 방지)
      uid: `md-${Math.random().toString(36).slice(2, 10)}`,
    }
  },
  computed: {
    content: {
      get() {
        return this.modelValue
      },
      set(val) {
        this.$emit('update:modelValue', val)
      },
    },
    // 앱 전역 테마(tabStore)와 라이트/다크 자동 연동
    mdTheme() {
      return useTabStore().sidebarTheme === 'dark' ? 'dark' : 'light'
    },
    // 목차 유무와 상관없이 동일한 MdPreview 바인딩 (템플릿 중복 제거)
    previewProps() {
      return {
        editorId: this.uid,
        modelValue: this.modelValue,
        language: this.language,
        theme: this.mdTheme,
        class: this.previewClass,
      }
    },
    resolvedToolbars() {
      return this.toolbars || DEFAULT_TOOLBARS
    },
    editorHeight() {
      return typeof this.height === 'number' ? `${this.height}px` : this.height
    },
  },
}
</script>

<style scoped>
.sticky-toc {
  position: sticky;
  top: 80px;
  max-height: calc(100vh - 100px);
}

.catalog-wrapper {
  overflow-y: auto;
  max-height: calc(100vh - 160px);
}
</style>
