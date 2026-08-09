<template>
  <div class="feedback-tab">
    <!-- 1. Toast 유틸리티 가이드 -->
    <div class="card mb-4 border-0 shadow-sm">
      <div class="card-header bg-theme-subcard d-flex justify-content-between align-items-center py-3">
        <div>
          <h5 class="b2b-text-h2 text-theme-primary mb-1"><i class="bi bi-bell me-2"></i>Toast - 실시간 시스템 알림 유틸리티</h5>
          <small class="b2b-text-xs text-theme-secondary">사용자 조치 결과 및 상태 알림 메시지 팝업</small>
        </div>
        <button class="btn btn-sm btn-outline-secondary" @click="showCodeToast = !showCodeToast">
          <i class="bi bi-code-slash me-1"></i> {{ showCodeToast ? '코드 닫기' : '코드 보기' }}
        </button>
      </div>

      <div class="card-body p-4">
        <p class="b2b-text-body text-theme-secondary mb-3">
          아래 버튼을 눌러 상태별 알림 메시지(Toast)가 우측 하단에 노출되는 모습을 테스트해보세요.
        </p>

        <div class="d-flex flex-wrap gap-2">
          <button class="btn btn-success" @click="showSuccessToast">
            <i class="bi bi-check-circle me-1"></i> Success Toast
          </button>
          <button class="btn btn-danger" @click="showErrorToast">
            <i class="bi bi-x-octagon me-1"></i> Danger / Error Toast
          </button>
          <button class="btn btn-warning text-dark" @click="showWarningToast">
            <i class="bi bi-exclamation-triangle me-1"></i> Warning Toast
          </button>
          <button class="btn btn-info text-white" @click="showInfoToast">
            <i class="bi bi-info-circle me-1"></i> Info Toast
          </button>
        </div>
      </div>

      <div v-if="showCodeToast" class="card-footer bg-dark text-white p-3">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <small class="text-info fw-bold"><i class="bi bi-code"></i> Toast 소스코드 사용법</small>
          <button class="btn btn-xs btn-outline-light" @click="copyCode(toastCode)">
            <i class="bi bi-clipboard me-1"></i> 복사
          </button>
        </div>
        <pre class="m-0 text-light b2b-text-xs"><code>{{ toastCode }}</code></pre>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { showToast } from '../../utils/toastUtil.js';

const showCodeToast = ref(false);

const showSuccessToast = () => {
  showToast('작업이 성공적으로 완료되었습니다.', { type: 'success' });
};

const showErrorToast = () => {
  showToast('서버 통신 중 오류가 발생했습니다.', { type: 'danger' });
};

const showWarningToast = () => {
  showToast('필수 입력 항목이 누락되었습니다.', { type: 'warning' });
};

const showInfoToast = () => {
  showToast('새로운 업데이트 소식이 있습니다.', { type: 'info' });
};

const toastCode = `import { showToast } from '@/utils/toastUtil.js';

showToast('성공 메시지', { type: 'success' });
showToast('오류 발생 메시지', { type: 'danger' });
showToast('경고 메시지', { type: 'warning' });
showToast('정보 안내 메시지', { type: 'info' });`;

const copyCode = (text) => {
  navigator.clipboard.writeText(text);
  alert('코드가 클립보드에 복사되었습니다.');
};
</script>
