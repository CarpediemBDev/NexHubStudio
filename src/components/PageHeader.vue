<template>
  <div class="page-header d-flex align-items-center justify-content-between flex-wrap">
    <!-- Left Side: Clean Title & Badges/Description -->
    <div class="d-inline-flex align-items-center flex-wrap gap-2.5">
      <h1 class="page-title mb-0 text-theme-primary fw-bold d-flex align-items-center">
        {{ computedTitle }}
      </h1>

      <!-- Product Badge (Optional) -->
      <span
        v-if="badgeText"
        class="b2b-badge b2b-badge-primary fw-medium"
        :class="badgeClass"
      >
        {{ badgeText }}
      </span>

      <!-- Description Text (Optional) -->
      <span v-if="description" class="text-theme-muted page-desc">
        {{ description }}
      </span>
    </div>

    <!-- Right Side: Breadcrumbs (Optional) & Right Action Buttons Slot -->
    <div class="d-flex align-items-center gap-3 ms-auto my-auto">
      <nav v-if="showBreadcrumb" aria-label="breadcrumb" class="d-flex align-items-center">
        <ol class="breadcrumb b2b-text-xs mb-0 align-items-center">
          <li class="breadcrumb-item d-inline-flex align-items-center">
            <router-link to="/" class="text-decoration-none text-theme-secondary opacity-75 hover-opacity-100">
              <i class="bi bi-house-door me-1"></i>홈
            </router-link>
          </li>
          <li
            v-for="(crumb, idx) in computedCrumbs"
            :key="idx"
            class="breadcrumb-item d-inline-flex align-items-center"
            :class="{ active: idx === computedCrumbs.length - 1 }"
          >
            <span
              v-if="idx === computedCrumbs.length - 1"
              class="text-theme-primary fw-semibold"
            >
              {{ crumb }}
            </span>
            <span v-else class="text-theme-secondary opacity-75">
              {{ crumb }}
            </span>
          </li>
        </ol>
      </nav>

      <!-- Action Buttons Slot (Right side) -->
      <div v-if="$slots.actions" class="page-header-actions d-flex align-items-center gap-2">
        <slot name="actions"></slot>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

export default {
  name: 'PageHeader',
  props: {
    // Explicit title override
    title: {
      type: String,
      default: '',
    },
    // Explicit category / group name (e.g. 'RealGrid & 피벗 스튜디오')
    category: {
      type: String,
      default: '',
    },
    // Explicit sub-category
    subCategory: {
      type: String,
      default: '',
    },
    // Explicit list of breadcrumb items
    items: {
      type: Array,
      default: () => [],
    },
    // Inline description
    description: {
      type: String,
      default: '',
    },
    // Product badge (e.g. '별도 라이선스 제품')
    badgeText: {
      type: String,
      default: '',
    },
    // Badge CSS classes
    badgeClass: {
      type: String,
      default: '',
    },
    // Show breadcrumbs
    showBreadcrumb: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    const route = useRoute()

    // Auto-resolve breadcrumb hierarchy from Vue Router route.matched
    const computedCrumbs = computed(() => {
      if (props.items && props.items.length > 0) {
        return props.items
      }

      const crumbs = []

      // If category prop provided
      if (props.category) {
        crumbs.push(props.category)
      } else if (route && route.matched) {
        // Find parent group route with meta.title
        route.matched.forEach((record) => {
          if (record.meta && record.meta.title && record.path !== '/' && record.path !== route.path) {
            crumbs.push(record.meta.title)
          }
        })
      }

      if (props.subCategory) {
        crumbs.push(props.subCategory)
      }

      // Add active page title
      const currentTitle = props.title || (route && route.meta && route.meta.title) || ''
      if (currentTitle && !crumbs.includes(currentTitle)) {
        crumbs.push(currentTitle)
      }

      return crumbs.length > 0 ? crumbs : ['대시보드']
    })

    const computedTitle = computed(() => {
      return props.title || (route && route.meta && route.meta.title) || '화면'
    })

    return {
      computedCrumbs,
      computedTitle,
    }
  },
}
</script>

<style scoped>
.page-header {
  margin-bottom: 18px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--b2b-color-border);
}

.page-title {
  font-size: 19px;
  letter-spacing: -0.4px;
  color: var(--b2b-color-text-main);
  line-height: 1.3;
}

.page-desc {
  font-size: 12px;
  line-height: 1.4;
}

.breadcrumb-item + .breadcrumb-item {
  padding-left: 0;
}
.breadcrumb-item + .breadcrumb-item::before {
  content: '/';
  color: var(--text-secondary);
  opacity: 0.5;
  padding: 0 0.6rem;
}
.hover-opacity-100:hover {
  opacity: 1 !important;
}
</style>
