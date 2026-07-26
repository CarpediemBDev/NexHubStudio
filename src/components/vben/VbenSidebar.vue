<template>
  <div :class="['vben-sidebar border-end', { 'collapsed': collapsed }]">
    <div class="sidebar-logo d-flex align-items-center justify-content-center border-bottom py-3">
      <i class="bi bi-box-seam fs-4 text-primary"></i>
      <span v-if="!collapsed" class="ms-2 fw-bold fs-5 logo-text">NexHub</span>
    </div>
    
    <div class="sidebar-menu overflow-auto p-2 custom-scrollbar">
      <ul class="nav flex-column">
        <li v-for="menu in menus" :key="menu.path" class="nav-item mb-1.5">
          <div 
            class="nav-link menu-item-main d-flex align-items-center justify-content-between rounded cursor-pointer py-2.5 px-3"
            :class="{ 'active-menu shadow-sm': isActive(menu.path) && !menu.children, 'expanded-group': isExpanded(menu.path) }"
            @click="handleMenuClick(menu)"
          >
            <div class="d-flex align-items-center text-truncate">
              <span v-if="!collapsed" class="small fw-semibold title-text">{{ menu.meta?.title || menu.name }}</span>
            </div>
            <i v-if="!collapsed && menu.children" :class="['bi', isExpanded(menu.path) ? 'bi-chevron-down' : 'bi-chevron-right', 'small ms-2 opacity-75']"></i>
          </div>

          <!-- 2nd Level Submenu -->
          <ul v-if="!collapsed && menu.children && isExpanded(menu.path)" class="nav flex-column ms-2 mt-1 border-start sub-border ps-2">
            <li v-for="child in menu.children" :key="child.path" class="nav-item mb-1">
              <div 
                class="nav-link menu-item-sub d-flex align-items-center rounded cursor-pointer py-2 px-2.5 ms-1"
                :class="{ 'sub-active': isActive(menu.path + '/' + child.path) }"
                @click="navigate(menu.path + '/' + child.path)"
              >
                <span class="small">{{ child.meta?.title || child.name }}</span>
              </div>
            </li>
          </ul>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useTabStore } from '../../stores/tabStore';

const props = defineProps({
  collapsed: {
    type: Boolean,
    default: false
  }
});

const router = useRouter();
const route = useRoute();
const tabStore = useTabStore();
const expandedGroups = ref(['system', 'grid-studio', 'user-group']);

const menus = computed(() => {
  const mainRoute = router.options.routes.find(r => r.path === '/');
  if (!mainRoute || !mainRoute.children) return [];
  return mainRoute.children.filter(c => !c.meta?.hidden && !c.path.includes(':'));
});

const isActive = (path) => {
  if (!path && route.path === '/') return true;
  if (!path) return false;
  return route.path === `/${path}` || route.path.endsWith(path);
};

const isExpanded = (path) => {
  return expandedGroups.value.includes(path);
};

const handleMenuClick = (menu) => {
  if (menu.children && menu.children.length > 0) {
    const idx = expandedGroups.value.indexOf(menu.path);
    if (idx >= 0) {
      expandedGroups.value.splice(idx, 1);
    } else {
      expandedGroups.value.push(menu.path);
    }
  } else {
    navigate(menu.path);
  }
};

const navigate = (path) => {
  const fullPath = path.startsWith('/') ? path : `/${path}`;
  router.push(fullPath);
};
</script>

<style scoped>
.vben-sidebar {
  width: 250px;
  height: 100%;
  flex-shrink: 0;
  transition: width 0.3s, background-color 0.3s, border-color 0.3s;
  display: flex;
  flex-direction: column;
  background-color: var(--b2b-sidebar-bg);
  border-color: var(--b2b-sidebar-border) !important;
}
.vben-sidebar.collapsed {
  width: 64px;
}
.sidebar-menu {
  flex: 1 1 auto;
}
.sidebar-logo {
  background-color: var(--b2b-sidebar-logo-bg);
  border-color: var(--b2b-sidebar-border) !important;
}
.logo-text { color: var(--b2b-color-text-main); }
.title-text { color: var(--b2b-sidebar-text); }
.cursor-pointer { cursor: pointer; }

/* Custom Thin Scrollbar */
.custom-scrollbar::-webkit-scrollbar { width: 5px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: var(--b2b-color-border);
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: var(--b2b-color-text-muted);
}

.menu-item-main, .menu-item-sub {
  min-height: 36px;
  line-height: 1.4;
  color: var(--b2b-sidebar-text);
  transition: all 0.18s ease-in-out;
}
.menu-item-main:hover, .menu-item-sub:hover {
  background-color: var(--b2b-sidebar-hover);
  color: var(--b2b-color-text-main) !important;
}

.active-menu {
  background-color: var(--b2b-color-primary) !important;
  color: #ffffff !important;
}
.active-menu .title-text, .active-menu i {
  color: #ffffff !important;
}
.expanded-group {
  background-color: var(--b2b-sidebar-hover);
  color: var(--b2b-color-text-main) !important;
  font-weight: 600;
}
.sub-border {
  border-color: var(--b2b-color-border) !important;
}
.sub-active {
  background-color: var(--b2b-sidebar-active-bg) !important;
  color: var(--b2b-sidebar-active-text) !important;
  border-left: 3px solid var(--b2b-color-primary) !important;
  font-weight: 700 !important;
}
.icon-active { color: var(--b2b-sidebar-active-text); }
.icon-subtle { color: var(--b2b-color-text-muted); }
</style>
