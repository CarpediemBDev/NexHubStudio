<template>
  <div class="container-fluid py-4">
    <!-- Header Title -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h2 class="b2b-text-h1 mb-1 text-theme-primary fw-bold">
          <i class="bi bi-book me-2 text-primary"></i>공통 컴포넌트 & 디자인 시스템 가이드
        </h2>
        <p class="text-theme-secondary b2b-text-xs mb-0">
          NexHub Studio 시스템 공통 UI 컴포넌트 사양, 자동완성 기능 및 코드 사용가이드입니다.
        </p>
      </div>

      <!-- Quick Link to Autocomplete Demo -->
      <router-link to="/sample/autocomplete" class="btn btn-primary btn-sm">
        <i class="bi bi-search me-1"></i> 자동완성 단독 미리보기
      </router-link>
    </div>

    <!-- Category Tab Pills Navigation -->
    <div class="card mb-4 border-0 shadow-sm">
      <div class="card-body p-2 bg-theme-subcard rounded-2">
        <ul class="nav nav-pills d-flex flex-wrap gap-2" role="tablist">
          <li v-for="tab in tabs" :key="tab.id" class="nav-item" role="presentation">
            <button
              class="nav-link b2b-tab-pill py-2 px-3 fw-bold d-flex align-items-center justify-content-center gap-2"
              :class="{ 'active bg-primary text-white shadow-sm': activeTab === tab.id }"
              @click="activeTab = tab.id"
            >
              <i :class="['bi', tab.icon]"></i>
              <span>{{ tab.label }}</span>
              <span v-if="tab.badge" class="badge bg-warning text-dark b2b-text-xs rounded-pill ms-1">
                {{ tab.badge }}
              </span>
            </button>
          </li>
        </ul>
      </div>
    </div>

    <!-- Dynamic Tab Component Renderer -->
    <transition name="fade-tab" mode="out-in">
      <keep-alive>
        <component :is="activeComponent" :key="activeTab" />
      </keep-alive>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import DesignSystemTab from '../components/guide/DesignSystemTab.vue';
import FormAutocompleteTab from '../components/guide/FormAutocompleteTab.vue';
import GridListTab from '../components/guide/GridListTab.vue';
import UserAssignmentTab from '../components/guide/UserAssignmentTab.vue';
import FeedbackTab from '../components/guide/FeedbackTab.vue';

const activeTab = ref('form'); // Default to Form & Autocomplete tab so user sees it right away!

const tabs = [
  { id: 'design', label: '디자인 시스템', icon: 'bi-palette', badge: '' },
  { id: 'form', label: '입력 & 자동완성', icon: 'bi-search', badge: 'NEW' },
  { id: 'grid', label: '검색 & 카드 리스트', icon: 'bi-list-ul', badge: '' },
  { id: 'user', label: '사용자 배정 & 팝업', icon: 'bi-person-gear', badge: '' },
  { id: 'feedback', label: '알림 & 피드백', icon: 'bi-bell', badge: '' }
];

const activeComponent = computed(() => {
  switch (activeTab.value) {
    case 'design':
      return DesignSystemTab;
    case 'form':
      return FormAutocompleteTab;
    case 'grid':
      return GridListTab;
    case 'user':
      return UserAssignmentTab;
    case 'feedback':
      return FeedbackTab;
    default:
      return FormAutocompleteTab;
  }
});
</script>

<style scoped>
.b2b-tab-pill {
  border-radius: 0.375rem;
  color: var(--bs-body-color, #495057);
  transition: all 0.2s ease-in-out;
  cursor: pointer;
}

.b2b-tab-pill:hover:not(.active) {
  background-color: rgba(13, 110, 253, 0.08);
  color: var(--b2b-color-primary);
}

.fade-tab-enter-active,
.fade-tab-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-tab-enter-from,
.fade-tab-leave-to {
  opacity: 0;
  transform: translateY(4px);
}
</style>
