<template>
  <div class="autocomplete-wrapper" ref="wrapperRef">
    <div class="input-group" :class="[sizeClass]">
      <span v-if="$slots.prepend || icon" class="input-group-text bg-theme-subcard text-theme-secondary">
        <slot name="prepend">
          <i :class="['bi', icon || 'bi-search']"></i>
        </slot>
      </span>

      <input
        ref="inputRef"
        type="text"
        class="form-control b2b-autocomplete-input"
        :class="[
          sizeInputClass,
          { 'is-open': isOpen && filteredItems.length > 0 }
        ]"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        @input="onInput"
        @focus="onFocus"
        @keydown="onKeyDown"
        autocomplete="off"
      />

      <button
        v-if="clearable && modelValue"
        type="button"
        class="btn btn-outline-secondary btn-clear border-0"
        title="검색어 지우기"
        @click="clearInput"
      >
        <i class="bi bi-x-circle-fill"></i>
      </button>

      <slot name="append"></slot>
    </div>

    <!-- Autocomplete Suggestions Dropdown -->
    <transition name="dropdown-fade">
      <ul
        v-if="isOpen && filteredItems.length > 0"
        class="dropdown-menu show autocomplete-dropdown shadow-lg"
        ref="dropdownRef"
      >
        <li
          v-for="(item, index) in filteredItems"
          :key="getItemKey(item, index)"
          class="dropdown-item autocomplete-item d-flex align-items-center justify-content-between"
          :class="{
            'active': selectedIndex === index,
            'disabled': item.disabled
          }"
          @click="selectItem(item)"
          @mouseenter="selectedIndex = index"
        >
          <div class="d-flex align-items-center gap-2 overflow-hidden me-2">
            <i v-if="getItemIcon(item)" :class="['bi', getItemIcon(item), 'text-theme-primary']"></i>
            <span class="text-truncate" v-html="highlightText(getItemLabel(item))"></span>
          </div>

          <div class="d-flex align-items-center gap-1 flex-shrink-0">
            <span v-if="getItemBadge(item)" class="badge bg-primary-subtle text-primary rounded-pill b2b-text-xs">
              {{ getItemBadge(item) }}
            </span>
            <small v-if="getItemDesc(item)" class="text-muted b2b-text-xs">
              {{ getItemDesc(item) }}
            </small>
          </div>
        </li>
      </ul>

      <div
        v-else-if="isOpen && showEmpty && modelValue"
        class="dropdown-menu show autocomplete-dropdown p-3 text-center text-muted b2b-text-sm shadow"
      >
        <i class="bi bi-exclamation-circle me-1"></i> {{ emptyText }}
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: ''
  },
  items: {
    type: Array,
    default: () => []
  },
  placeholder: {
    type: String,
    default: '검색어를 입력하세요 (예: a)'
  },
  labelKey: {
    type: String,
    default: 'label'
  },
  valueKey: {
    type: String,
    default: 'value'
  },
  maxSuggestions: {
    type: Number,
    default: 10
  },
  disabled: {
    type: Boolean,
    default: false
  },
  clearable: {
    type: Boolean,
    default: true
  },
  icon: {
    type: String,
    default: ''
  },
  size: {
    type: String,
    default: 'md'
  },
  showEmpty: {
    type: Boolean,
    default: true
  },
  emptyText: {
    type: String,
    default: '일치하는 항목이 없습니다.'
  },
  minChars: {
    type: Number,
    default: 1
  }
});

const emit = defineEmits(['update:modelValue', 'select', 'clear', 'search']);

const wrapperRef = ref(null);
const inputRef = ref(null);
const dropdownRef = ref(null);

const isOpen = ref(false);
const selectedIndex = ref(-1);

const sizeClass = computed(() => {
  if (props.size === 'sm') return 'input-group-sm';
  if (props.size === 'lg') return 'input-group-lg';
  return '';
});

const sizeInputClass = computed(() => {
  if (props.size === 'sm') return 'form-control-sm';
  if (props.size === 'lg') return 'form-control-lg';
  return '';
});

// Item Helper functions
const getItemLabel = (item) => {
  if (typeof item === 'object' && item !== null) {
    return item[props.labelKey] ?? item.name ?? item.title ?? String(item.value ?? '');
  }
  return String(item);
};

const getItemValue = (item) => {
  if (typeof item === 'object' && item !== null) {
    return item[props.valueKey] ?? item[props.labelKey] ?? item.id ?? item;
  }
  return item;
};

const getItemKey = (item, index) => {
  if (typeof item === 'object' && item !== null) {
    return item.id ?? item[props.valueKey] ?? index;
  }
  return `${item}_${index}`;
};

const getItemIcon = (item) => {
  if (typeof item === 'object' && item !== null) {
    return item.icon || null;
  }
  return null;
};

const getItemBadge = (item) => {
  if (typeof item === 'object' && item !== null) {
    return item.badge || item.category || null;
  }
  return null;
};

const getItemDesc = (item) => {
  if (typeof item === 'object' && item !== null) {
    return item.description || item.subtext || null;
  }
  return null;
};

// Filtering logic
const filteredItems = computed(() => {
  const query = String(props.modelValue || '').trim().toLowerCase();
  if (!query || query.length < props.minChars) {
    return [];
  }

  const matches = props.items.filter((item) => {
    if (item.disabled) return false;
    const label = getItemLabel(item).toLowerCase();
    const desc = getItemDesc(item) ? getItemDesc(item).toLowerCase() : '';
    return label.includes(query) || desc.includes(query);
  });

  return matches.slice(0, props.maxSuggestions);
});

// Text Highlight Helper
const highlightText = (text) => {
  const query = String(props.modelValue || '').trim();
  if (!query) return text;
  
  const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
  return text.replace(regex, '<mark class="bg-warning-subtle text-dark p-0 rounded-1 fw-bold">$1</mark>');
};

// Event Handlers
const onInput = (e) => {
  const val = e.target.value;
  emit('update:modelValue', val);
  emit('search', val);
  isOpen.value = true;
  selectedIndex.value = 0;
};

const onFocus = () => {
  if (String(props.modelValue || '').trim().length >= props.minChars) {
    isOpen.value = true;
  }
};

const selectItem = (item) => {
  if (item.disabled) return;
  const label = getItemLabel(item);
  const val = getItemValue(item);
  
  emit('update:modelValue', label);
  emit('select', { label, value: val, item });
  
  isOpen.value = false;
  selectedIndex.value = -1;
};

const clearInput = () => {
  emit('update:modelValue', '');
  emit('clear');
  isOpen.value = false;
  selectedIndex.value = -1;
  nextTick(() => {
    inputRef.value?.focus();
  });
};

const onKeyDown = (e) => {
  if (!isOpen.value || filteredItems.value.length === 0) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      isOpen.value = true;
    }
    return;
  }

  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault();
      selectedIndex.value = (selectedIndex.value + 1) % filteredItems.value.length;
      scrollToSelected();
      break;
    case 'ArrowUp':
      e.preventDefault();
      selectedIndex.value =
        (selectedIndex.value - 1 + filteredItems.value.length) % filteredItems.value.length;
      scrollToSelected();
      break;
    case 'Enter':
      e.preventDefault();
      if (selectedIndex.value >= 0 && selectedIndex.value < filteredItems.value.length) {
        selectItem(filteredItems.value[selectedIndex.value]);
      }
      break;
    case 'Escape':
      isOpen.value = false;
      selectedIndex.value = -1;
      break;
    case 'Tab':
      isOpen.value = false;
      break;
  }
};

const scrollToSelected = () => {
  nextTick(() => {
    if (!dropdownRef.value) return;
    const activeEl = dropdownRef.value.querySelector('.autocomplete-item.active');
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  });
};

// Handle Click Outside
const handleClickOutside = (e) => {
  if (wrapperRef.value && !wrapperRef.value.contains(e.target)) {
    isOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});

watch(
  () => props.modelValue,
  (newVal) => {
    if (String(newVal || '').trim().length >= props.minChars && document.activeElement === inputRef.value) {
      isOpen.value = true;
    }
  }
);
</script>

<style scoped>
.autocomplete-wrapper {
  position: relative;
  width: 100%;
}

.b2b-autocomplete-input {
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.b2b-autocomplete-input:focus,
.b2b-autocomplete-input.is-open {
  border-color: var(--b2b-color-primary);
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.15);
}

.btn-clear {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 5;
  color: var(--b2b-color-text-faint);
  background: transparent;
  padding: 2px 6px;
  line-height: 1;
}

.btn-clear:hover {
  color: var(--b2b-color-text-muted);
  background: transparent;
}

.autocomplete-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  width: 100%;
  max-height: 280px;
  overflow-y: auto;
  z-index: 1055;
  margin-top: 4px;
  border-radius: 0.5rem;
  border: 1px solid var(--b2b-color-border);
  background-color: var(--b2b-color-bg-card);
  padding: 4px 0;
}

.autocomplete-item {
  padding: 8px 14px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: background-color 0.15s ease-in-out;
}

.autocomplete-item:hover,
.autocomplete-item.active {
  background-color: var(--b2b-color-hover-bg);
  color: var(--b2b-color-primary);
}

.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
