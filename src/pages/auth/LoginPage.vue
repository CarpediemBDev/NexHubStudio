<template>
  <div class="b2b-page-container flex-100vh login-layout">
    <div class="split-left visual-panel">
      <div class="branding">
        <h1 class="logo">NexHub Studio</h1>
        <p class="tagline">차세대 기업형 통합 백오피스 플랫폼</p>
      </div>
      <div class="visual-bg"></div>
    </div>
    <div class="split-right form-panel">
      <div class="form-wrapper">
        <div class="tabs">
          <div :class="['tab-item', currentTab === 'login' ? 'active' : '']" @click="currentTab = 'login'">로그인</div>
          <div :class="['tab-item', currentTab === 'register' ? 'active' : '']" @click="currentTab = 'register'">회원가입</div>
          <div :class="['tab-item', currentTab === 'terms' ? 'active' : '']" @click="currentTab = 'terms'">약관동의</div>
        </div>
        
        <div class="tab-content" v-if="currentTab === 'login'">
          <h2 class="form-title">로그인</h2>
          <div class="input-group">
            <input type="text" placeholder="아이디 (이메일)" class="b2b-input" />
          </div>
          <div class="input-group">
            <input type="password" placeholder="비밀번호" class="b2b-input" />
          </div>
          <button class="btn-b2b-primary block-btn">로그인</button>
        </div>

        <div class="tab-content" v-if="currentTab === 'register'">
          <h2 class="form-title">회원가입</h2>
          <div class="input-group">
            <input type="text" placeholder="회사명" class="b2b-input" />
          </div>
          <div class="input-group">
            <input type="text" placeholder="아이디 (이메일)" class="b2b-input" />
          </div>
          <div class="input-group">
            <input type="password" placeholder="비밀번호" class="b2b-input" />
          </div>
          <button class="btn-b2b-primary block-btn">가입하기</button>
        </div>

        <div class="tab-content" v-if="currentTab === 'terms'">
          <h2 class="form-title">약관동의</h2>
          <div class="terms-box">
            <p>제1조 (목적)</p>
            <p>본 약관은 넥스허브 스튜디오에서 제공하는 B2B 서비스의 이용과 관련하여...</p>
          </div>
          <div class="checkbox-group">
            <input type="checkbox" id="agree" />
            <label for="agree">위 약관에 동의합니다.</label>
          </div>
          <button class="btn-b2b-primary block-btn">확인</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const currentTab = ref('login');
</script>

<style scoped>
.flex-100vh { display: flex; height: 100vh; width: 100vw; margin: 0; padding: 0; box-sizing: border-box; overflow: hidden; }
.login-layout { background-color: #fff; }
.split-left { flex: 1; background: linear-gradient(135deg, #001529 0%, #0050b3 100%); color: white; display: flex; flex-direction: column; justify-content: center; padding: 60px; position: relative; }
.branding { position: relative; z-index: 2; }
.logo { font-size: var(--b2b-font-size-display); margin-bottom: var(--b2b-space-4); font-weight: 700; }
.tagline { font-size: 18px; opacity: 0.8; }
.visual-bg { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: url('data:image/svg+xml;utf8,<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse"><circle fill="rgba(255,255,255,0.1)" cx="10" cy="10" r="1.5"></circle></pattern></defs><rect x="0" y="0" width="100%" height="100%" fill="url(%23dots)"></rect></svg>'); z-index: 1; }

.split-right { width: 480px; display: flex; align-items: center; justify-content: center; background: #fff; box-shadow: -4px 0 16px rgba(0,0,0,0.05); }
.form-wrapper { width: 100%; max-width: 360px; padding: 32px; }
.tabs { display: flex; border-bottom: 2px solid #f0f0f0; margin-bottom: 32px; }
.tab-item { padding: 12px 16px; cursor: pointer; color: #8c8c8c; font-weight: 500; transition: all 0.3s; }
.tab-item.active { color: #1890ff; border-bottom: 2px solid #1890ff; margin-bottom: -2px; }
.form-title { font-size: var(--b2b-font-size-display); font-weight: 700; margin-bottom: var(--b2b-space-5); color: var(--b2b-color-text-main); }
.input-group { margin-bottom: 16px; }
.b2b-input { width: 100%; padding: 12px; border: 1px solid #d9d9d9; border-radius: 4px; outline: none; font-size: 14px; box-sizing: border-box; }
.b2b-input:focus { border-color: #40a9ff; box-shadow: 0 0 0 2px rgba(24,144,255,0.2); }
/* 색상/폰트는 buttons.css 의 .btn-b2b-primary 를 그대로 사용.
   로그인 CTA 만 전폭 + 큰 터치 타깃으로 확장한다. */
.block-btn {
  width: 100%;
  display: flex;
  height: 40px;
  margin-top: var(--b2b-space-5);
  border-radius: var(--b2b-radius-lg);
}
.terms-box { padding: 16px; border: 1px solid #d9d9d9; border-radius: 4px; height: 120px; overflow-y: auto; font-size: 13px; color: #555; margin-bottom: 16px; background: #fafafa; }
.checkbox-group { display: flex; align-items: center; gap: 8px; font-size: 14px; }
</style>
