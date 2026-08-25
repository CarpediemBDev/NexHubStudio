import { defineStore } from 'pinia';

// ⚠️ router 를 모듈 최상위에서 정적 import 하면
//    tabStore → router → pages → components → tabStore 순환 참조가 생겨
//    HMR 시 TDZ 오류가 발생한다. router 는 런타임 액션에서만 필요하므로
//    아래 헬퍼로 지연 로딩하여 순환을 끊는다. (모듈은 앱 시작 시 이미 초기화됨)
let _router = null;
async function getRouter() {
  if (!_router) {
    _router = (await import('../router')).default;
  }
  return _router;
}

export const useTabStore = defineStore('tab', {
  state: () => {
    const initialTheme = localStorage.getItem('vben_sidebar_theme') || 'light';
    const initialTabStyle = localStorage.getItem('vben_tab_style') || 'linear';
    const initialToggleStyle = localStorage.getItem('vben_sidebar_toggle_style') || 'inline';
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', initialTheme);
    }
    return {
      visitedTabs: [], // { path, name, meta }
      activeTab: '',
      sidebarTheme: initialTheme, // 'light' | 'dark'
      tabStyle: initialTabStyle, // 'linear' | 'browser' | 'underline' | 'capsule'
      sidebarToggleStyle: initialToggleStyle, // 'inline' | 'footer' | 'floating' | 'header'
    };
  },
  actions: {
    setSidebarToggleStyle(style) {
      this.sidebarToggleStyle = style;
      localStorage.setItem('vben_sidebar_toggle_style', style);
    },
    setTabStyle(style) {
      this.tabStyle = style;
      localStorage.setItem('vben_tab_style', style);
    },
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
    async closeTab(path) {
      const index = this.visitedTabs.findIndex((tab) => tab.path === path);
      if (index > -1) {
        this.visitedTabs.splice(index, 1);
        if (this.activeTab === path) {
          const nextTab = this.visitedTabs[index] || this.visitedTabs[index - 1];
          const router = await getRouter();
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
    async closeOtherTabs(path) {
      this.visitedTabs = this.visitedTabs.filter((tab) => tab.path === path);
      if (this.activeTab !== path) {
        const router = await getRouter();
        router.push(path);
        this.activeTab = path;
      }
    },
    async closeAllTabs() {
      this.visitedTabs = [];
      const router = await getRouter();
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

