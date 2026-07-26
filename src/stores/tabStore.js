import { defineStore } from 'pinia';
import router from '../router';

export const useTabStore = defineStore('tab', {
  state: () => {
    const initialTheme = localStorage.getItem('vben_sidebar_theme') || 'light';
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', initialTheme);
    }
    return {
      visitedTabs: [], // { path, name, meta }
      activeTab: '',
      sidebarTheme: initialTheme, // 'light' | 'dark'
    };
  },
  actions: {
    toggleSidebarTheme() {
      this.sidebarTheme = this.sidebarTheme === 'light' ? 'dark' : 'light';
      localStorage.setItem('vben_sidebar_theme', this.sidebarTheme);
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', this.sidebarTheme);
      }
    },
    addTab(route) {
      if (!route.path || route.name === 'Login') return;
      const exists = this.visitedTabs.some((tab) => tab.path === route.path);
      if (!exists) {
        this.visitedTabs.push({
          path: route.path,
          name: route.name,
          meta: { ...route.meta },
        });
      }
      this.activeTab = route.path;
    },
    closeTab(path) {
      const index = this.visitedTabs.findIndex((tab) => tab.path === path);
      if (index > -1) {
        this.visitedTabs.splice(index, 1);
        if (this.activeTab === path) {
          const nextTab = this.visitedTabs[index] || this.visitedTabs[index - 1];
          if (nextTab) {
            router.push(nextTab.path);
            this.activeTab = nextTab.path;
          } else {
            router.push('/');
            this.activeTab = '/';
          }
        }
      }
    },
    closeOtherTabs(path) {
      this.visitedTabs = this.visitedTabs.filter((tab) => tab.path === path);
      if (this.activeTab !== path) {
        router.push(path);
        this.activeTab = path;
      }
    },
    closeAllTabs() {
      this.visitedTabs = [];
      router.push('/');
      this.activeTab = '/';
    },
    restoreTabs() {
      const tabs = sessionStorage.getItem('visitedTabs');
      if (tabs) {
        this.visitedTabs = JSON.parse(tabs);
      }
    },
  },
});
