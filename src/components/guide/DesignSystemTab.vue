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
                <div><span class="b2b-text-2xs text-theme-muted">Micro 10px</span> <code class="b2b-text-xs">.b2b-text-2xs</code></div>
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

      <!-- 역할 → 단계 매핑 규정 -->
      <div class="card-body border-top pt-3">
        <h6 class="b2b-text-h2 text-theme-primary mb-1">
          <i class="bi bi-rulers me-1"></i>폰트 적용 규정 (역할 &rarr; 단계)
        </h6>
        <p class="b2b-text-xs text-theme-secondary mb-3">
          "이 요소는 몇 px 인가"는 눈대중이 아니라 아래 표로 결정한다.
          표에 없는 크기(14px, 17px 등)와 Bootstrap 의 <code>.small</code> 중첩은 금지.
        </p>
        <div class="table-responsive">
          <table class="table table-sm align-middle b2b-text-sm mb-0">
            <thead class="bg-theme-header">
              <tr>
                <th style="width: 30%">UI 역할</th>
                <th style="width: 16%">규정</th>
                <th style="width: 26%">클래스 / 토큰</th>
                <th>비고</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in typeRules" :key="r.role">
                <td class="text-theme-primary fw-semibold">{{ r.role }}</td>
                <td class="tabular-nums">{{ r.spec }}</td>
                <td><code class="b2b-text-xs">{{ r.cls }}</code></td>
                <td class="text-theme-secondary">{{ r.note }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="mt-3 p-2 border border-theme rounded-2 bg-theme-subcard">
          <div class="b2b-text-xs text-theme-primary fw-semibold mb-1">
            <i class="bi bi-exclamation-triangle me-1 text-warning"></i>금지 사항
          </div>
          <ul class="b2b-text-xs text-theme-secondary mb-0 ps-3">
            <li>scoped CSS 에 <code>font-size: 14px</code> 같은 px 하드코딩 &rarr; <code>var(--b2b-font-size-*)</code> 사용</li>
            <li><code>.small</code> 안에 <code>.small</code> 중첩 (em 복리로 9.95px, 8.71px 같은 소수점 폰트 발생)</li>
            <li>제목에 <code>&lt;h2&gt;~&lt;h4&gt;</code> 만 쓰고 클래스 미지정 &rarr; Bootstrap 기본 32px/28px 로 튄다</li>
          </ul>
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

// 폰트 적용 규정: UI 역할 -> 타입 스케일 단계
const typeRules = [
  { role: '페이지 제목',            spec: '19px / 600', cls: '.b2b-text-h1',   note: 'PageHeader 컴포넌트가 자동 적용' },
  { role: '패널·섹션 제목',         spec: '15px / 600', cls: '.b2b-text-h2',   note: '분할 레이아웃 좌우 패널 헤더 포함' },
  { role: '리스트 아이템 제목',      spec: '13px / 600', cls: '.b2b-text-body', note: 'weight 만 600 으로' },
  { role: '본문·입력값·버튼',        spec: '13px / 400', cls: '(기본값)',        note: 'body 기본이 13px — 클래스 불필요' },
  { role: '폼 라벨·보조 설명',       spec: '12px / 400', cls: '.b2b-text-sm',   note: '.small 도 12px 로 고정됨' },
  { role: '배지·캡션·타임스탬프',    spec: '11px / 400', cls: '.b2b-text-xs',   note: '.badge 도 11px 로 고정됨' },
  { role: '표 내부 보조 메타',       spec: '10px / 400', cls: '.b2b-text-2xs',  note: '최소 단위 — 이보다 작게 금지' },
  { role: '대시보드 KPI 수치',       spec: '24px / 700', cls: '.b2b-text-display', note: '수치 강조 전용, 제목에 사용 금지' },
];

const tokenCode = `<span class="b2b-text-h1 text-theme-primary">Heading 1</span>
<button class="btn-b2b-primary">Primary Button</button>
<span class="b2b-badge b2b-badge-success">Success Badge</span>
<input type="text" class="form-control form-control-sm b2b-text-body" />

/* scoped CSS 에서는 px 대신 토큰 참조 */
.my-panel-title { font-size: var(--b2b-font-size-h2); font-weight: 600; }`;

const copyCode = (text) => {
  navigator.clipboard.writeText(text);
  alert('코드가 클립보드에 복사되었습니다.');
};
</script>
