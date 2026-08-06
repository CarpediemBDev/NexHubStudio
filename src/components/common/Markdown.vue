<template>
  <!-- 보기(읽기 전용): 가벼운 MdPreview -->
  <MdPreview
    v-if="readonly"
    :model-value="modelValue"
    :language="language"
    :theme="mdTheme"
    :class="previewClass"
  />
  <!-- 편집: MdEditor (지연 로딩) -->
  <MdEditor
    v-else
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
import { MdPreview } from 'md-editor-v3'
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
 *  - readonly: true  → 렌더 전용(MdPreview, 가벼움)
 *  - readonly: false → 편집기(MdEditor, 지연 로딩)
 *  - 한국어 로케일 / 앱 테마(tabStore) 자동 연동 / 기본 툴바 / CSS 내장
 *
 * 사용:
 *   <Markdown v-model="form.content" />            편집
 *   <Markdown v-model="post.content" readonly />   보기
 *   <Markdown v-model="memo" :height="300" placeholder="메모..." />
 */
export default {
  name: 'Markdown',
  components: {
    MdPreview,
    // 편집기는 실제로 편집할 때만 번들을 불러오도록 지연 로딩한다.
    // (보기 전용 페이지는 무거운 편집기/스타일을 로드하지 않음)
    MdEditor: defineAsyncComponent(async () => {
      await import('md-editor-v3/lib/style.css')
      const mod = await import('md-editor-v3')
      return mod.MdEditor
    }),
  },
  props: {
    modelValue: { type: String, default: '' },
    // 보기 전용 여부
    readonly: { type: Boolean, default: false },
    // 로케일 (기본: 영어 'en-US', md-editor 내장).
    // 한국어가 필요하면 language="ko-KR" 지정 (사전은 mdEditorLocale.js에서 전역 등록됨).
    // 그 외 언어는 해당 로케일이 config()로 등록되어 있어야 함.
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
    resolvedToolbars() {
      return this.toolbars || DEFAULT_TOOLBARS
    },
    editorHeight() {
      return typeof this.height === 'number' ? `${this.height}px` : this.height
    },
  },
}
</script>
