<template>
  <div class="demo-field">
    <!-- 라벨 + 코드 토글 -->
    <div class="demo-field-label">
      <span class="demo-field-title">{{ label }}</span>
      <button
        v-if="code"
        type="button"
        class="demo-code-toggle"
        :class="{ active: showCode }"
        @click="showCode = !showCode"
        :title="showCode ? '코드 닫기' : '사용 코드 보기'"
      >
        <i class="bi bi-code-slash"></i>
      </button>
    </div>

    <!-- 실제 컴포넌트(슬롯) -->
    <div class="demo-field-control">
      <slot />
    </div>

    <!-- 실시간 바인딩 값 -->
    <div class="demo-field-value">
      <span class="demo-value-badge">value</span>
      <code class="demo-value-text" :title="displayValue">{{ displayValue }}</code>
    </div>

    <!-- 복붙용 코드 스니펫 (토글) -->
    <div v-if="showCode && code" class="demo-field-snippet">
      <button type="button" class="demo-copy-btn" @click="copyCode">
        <i :class="copied ? 'bi bi-check2' : 'bi bi-clipboard'"></i>
        <span>{{ copied ? '복사됨' : '복사' }}</span>
      </button>
      <pre class="demo-snippet-pre"><code>{{ code }}</code></pre>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DemoField',
  props: {
    label: {
      type: String,
      default: '',
    },
    // 바인딩된 v-model 값 (문자열/배열/객체 모두 허용)
    value: {
      type: [String, Number, Array, Object, Date],
      default: '',
    },
    // 복붙용 사용 코드 스니펫
    code: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      showCode: false,
      copied: false,
    }
  },
  computed: {
    displayValue() {
      const v = this.value
      if (v == null || v === '') return '—'
      if (Array.isArray(v)) {
        if (!v.length || v.every((x) => x == null || x === '')) return '—'
        return JSON.stringify(v)
      }
      return String(v)
    },
  },
  methods: {
    async copyCode() {
      const text = this.code
      try {
        await navigator.clipboard.writeText(text)
      } catch (e) {
        // clipboard API 미지원 환경 폴백
        const ta = document.createElement('textarea')
        ta.value = text
        ta.style.position = 'fixed'
        ta.style.opacity = '0'
        document.body.appendChild(ta)
        ta.select()
        try {
          document.execCommand('copy')
        } catch (_) {
          /* noop */
        }
        document.body.removeChild(ta)
      }
      this.copied = true
      setTimeout(() => {
        this.copied = false
      }, 1500)
    },
  },
}
</script>

<style scoped>
.demo-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.demo-field-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--b2b-space-2);
}

.demo-field-title {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-primary, #1e293b);
}

.demo-code-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 5px;
  background: var(--bg-card, #ffffff);
  color: var(--text-secondary, #64748b);
  font-size: 0.72rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.demo-code-toggle:hover,
.demo-code-toggle.active {
  background: var(--b2b-color-primary, #2563eb);
  border-color: var(--b2b-color-primary, #2563eb);
  color: #ffffff;
}

.demo-field-value {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.demo-value-badge {
  flex-shrink: 0;
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.3px;
  text-transform: uppercase;
  color: var(--text-muted, #94a3b8);
  background: var(--bg-subcard, #f1f5f9);
  border-radius: 4px;
  padding: 1px 5px;
}

.demo-value-text {
  flex: 1 1 auto;
  min-width: 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.72rem;
  color: var(--b2b-color-primary, #2563eb);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.demo-field-snippet {
  position: relative;
  margin-top: 2px;
}

.demo-copy-btn {
  position: absolute;
  top: 6px;
  right: 6px;
  display: inline-flex;
  align-items: center;
  gap: var(--b2b-space-1);
  padding: 2px var(--b2b-space-2);
  border: 1px solid var(--border-color, #334155);
  border-radius: 5px;
  background: var(--bg-card, #ffffff);
  color: var(--text-secondary, #64748b);
  font-size: 0.68rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.demo-copy-btn:hover {
  background: var(--b2b-color-primary, #2563eb);
  border-color: var(--b2b-color-primary, #2563eb);
  color: #ffffff;
}

.demo-snippet-pre {
  margin: 0;
  padding: 10px var(--b2b-space-3);
  background: var(--bg-subcard, #0f172a);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 6px;
  overflow-x: auto;
}

.demo-snippet-pre code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.72rem;
  line-height: 1.5;
  color: var(--text-primary, #334155);
  white-space: pre;
}
</style>
