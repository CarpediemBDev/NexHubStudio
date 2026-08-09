<template>
  <div class="design-system-tab">
    <!-- 1. B2B 프론트엔드 디자인 토큰 카드 -->
    <div class="card mb-4 border-0 shadow-sm">
      <div class="card-header bg-theme-subcard d-flex justify-content-between align-items-center py-3">
        <div>
          <h5 class="b2b-text-h2 text-theme-primary mb-1">✨ B2B 프론트엔드 표준 디자인 규격 (Design Tokens)</h5>
          <p class="b2b-text-xs text-theme-secondary mb-0">엔터프라이즈 시스템 통합 스타일가이드 및 공통 CSS 유틸리티</p>
        </div>
        <button class="btn btn-sm btn-outline-secondary" @click="showCodeToken = !showCodeToken">
          <i class="bi bi-code-slash me-1"></i> {{ showCodeToken ? '코드 닫기' : '코드 보기' }}
        </button>
      </div>

      <div class="card-body">
        <div class="row g-4">
          <!-- 1. Typography -->
          <div class="col-md-6 col-lg-3">
            <div class="p-3 border border-theme rounded-2 bg-theme-subcard h-100">
              <h6 class="b2b-text-h2 text-theme-primary mb-3">1. 타이포그래피 (Typography)</h6>
              <div class="d-flex flex-column gap-2">
                <div><span class="b2b-text-display text-theme-primary">Display 24px</span> <code class="b2b-text-xs">.b2b-text-display</code></div>
                <div><span class="b2b-text-h1 text-theme-primary">Heading 1 (19px)</span> <code class="b2b-text-xs">.b2b-text-h1</code></div>
                <div><span class="b2b-text-h2 text-theme-primary">Heading 2 (15px)</span> <code class="b2b-text-xs">.b2b-text-h2</code></div>
                <div><span class="b2b-text-body text-theme-primary">Body 13px (표준)</span> <code class="b2b-text-xs">.b2b-text-body</code></div>
                <div><span class="b2b-text-sm text-theme-secondary">Small 12px</span> <code class="b2b-text-xs">.b2b-text-sm</code></div>
                <div><span class="b2b-text-xs text-theme-muted">Extra Small 11px</span> <code class="b2b-text-xs">.b2b-text-xs</code></div>
              </div>
            </div>
          </div>

          <!-- 2. Buttons -->
          <div class="col-md-6 col-lg-3">
            <div class="p-3 border border-theme rounded-2 bg-theme-subcard h-100">
              <h6 class="b2b-text-h2 text-theme-primary mb-3">2. 버튼 시스템 (Buttons)</h6>
              <div class="d-flex flex-wrap gap-2 mb-3">
                <button class="btn-b2b-primary">Primary (30px)</button>
                <button class="btn-b2b-action">Action/Secondary</button>
                <button class="btn-b2b-success">Success</button>
                <button class="btn-b2b-danger">Danger</button>
                <button class="btn-b2b-warning">Warning</button>
                <button class="btn-b2b-icon btn-b2b-action" title="아이콘 전용"><i class="bi bi-gear"></i></button>
              </div>
              <p class="b2b-text-xs text-theme-secondary mb-0"><code>.btn-b2b-*</code> 높이 30px, 폰트 13px 규격</p>
            </div>
          </div>

          <!-- 3. Badges & Status Chips -->
          <div class="col-md-6 col-lg-3">
            <div class="p-3 border border-theme rounded-2 bg-theme-subcard h-100">
              <h6 class="b2b-text-h2 text-theme-primary mb-3">3. 배지 & 태그 (Badges)</h6>
              <div class="d-flex flex-wrap gap-2 mb-3">
                <span class="b2b-badge b2b-badge-primary">Primary</span>
                <span class="b2b-badge b2b-badge-success">Success</span>
                <span class="b2b-badge b2b-badge-warning">Warning</span>
                <span class="b2b-badge b2b-badge-danger">Danger</span>
                <span class="b2b-badge b2b-badge-secondary">Secondary</span>
                <span class="b2b-badge b2b-badge-outline">Outline</span>
              </div>
              <div class="d-flex align-items-center gap-3 b2b-text-sm">
                <span><span class="status-dot status-dot-success me-1"></span>온라인</span>
                <span><span class="status-dot status-dot-danger me-1"></span>점검중</span>
              </div>
            </div>
          </div>

          <!-- 4. Form Label & Inputs -->
          <div class="col-md-6 col-lg-3">
            <div class="p-3 border border-theme rounded-2 bg-theme-subcard h-100">
              <h6 class="b2b-text-h2 text-theme-primary mb-3">4. 폼 라벨 & 인풋 (Form Controls)</h6>
              <div class="mb-2">
                <label class="b2b-form-label">기본 검색어</label>
                <input type="text" class="form-control form-control-sm b2b-text-body" placeholder="13px 표준 규격 인풋" />
              </div>
              <p class="b2b-text-xs text-theme-secondary mb-0"><code>.b2b-form-label</code> + <code>form-control-sm</code></p>
            </div>
          </div>
        </div>
      </div>

      <!-- Expandable Code Block -->
      <div v-if="showCodeToken" class="card-footer bg-dark text-white p-3">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <small class="text-info fw-bold"><i class="bi bi-code"></i> HTML / CSS 사용 가이드</small>
          <button class="btn btn-xs btn-outline-light" @click="copyCode(tokenCode)">
            <i class="bi bi-clipboard me-1"></i> 복사
          </button>
        </div>
        <pre class="m-0 text-light b2b-text-xs"><code>{{ tokenCode }}</code></pre>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const showCodeToken = ref(false);

const tokenCode = `<span class="b2b-text-h1 text-theme-primary">Heading 1</span>
<button class="btn-b2b-primary">Primary Button</button>
<span class="b2b-badge b2b-badge-success">Success Badge</span>
<input type="text" class="form-control form-control-sm b2b-text-body" />`;

const copyCode = (text) => {
  navigator.clipboard.writeText(text);
  alert('코드가 클립보드에 복사되었습니다.');
};
</script>
