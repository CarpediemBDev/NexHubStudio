<template>
  <div class="multi-select" ref="multiSelect">
    <!-- 선택된 항목 표시 영역 -->
    <div class="multi-select-input" @click="toggleDropdown" :class="{ open: isOpen, disabled }">
      <div class="selected-items" v-if="selectedItems.length > 0">
        <span
          v-for="item in selectedItems"
          :key="getItemValue(item)"
          class="selected-badge"
          @click.stop="removeItem(item)"
        >
          {{ getItemLabel(item) }}
          <i class="bi bi-x"></i>
        </span>
      </div>
      <span v-else class="selected-text">{{ placeholder }}</span>
      <i class="bi bi-chevron-down dropdown-icon"></i>
    </div>

    <!-- 드롭다운 목록 -->
    <div class="multi-select-dropdown" v-show="isOpen">
      <!-- 검색 입력 -->
      <div class="search-box" v-if="searchable">
        <input
          type="text"
          v-model="searchQuery"
          class="form-control form-control-sm"
          placeholder="검색..."
          @click.stop
        />
      </div>

      <!-- 전체 선택/해제 -->
      <div class="select-all" v-if="showSelectAll && filteredOptions.length > 0">
        <label class="form-check-label">
          <input
            type="checkbox"
            class="form-check-input"
            :checked="isAllSelected"
            @change="toggleSelectAll"
            @click.stop
          />
          전체 선택
        </label>
      </div>

      <!-- 옵션 목록 -->
      <div class="options-list">
        <label
          v-for="option in filteredOptions"
          :key="getItemValue(option)"
          class="option-item"
          @click.stop
        >
          <input
            type="checkbox"
            class="form-check-input"
            :checked="isSelected(option)"
            @change="toggleOption(option)"
          />
          <span>{{ getItemLabel(option) }}</span>
        </label>
        <div v-if="filteredOptions.length === 0" class="no-options">검색 결과가 없습니다</div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MultiSelect',
  props: {
    // 선택된 값들 (v-model)
    modelValue: {
      type: Array,
      default: () => [],
    },
    // 옵션 목록
    options: {
      type: Array,
      required: true,
    },
    // 옵션이 객체일 때 라벨로 사용할 속성명
    labelKey: {
      type: String,
      default: 'label',
    },
    // 옵션이 객체일 때 값으로 사용할 속성명
    valueKey: {
      type: String,
      default: 'value',
    },
    // placeholder 텍스트
    placeholder: {
      type: String,
      default: '항목을 선택하세요',
    },
    // 검색 기능 활성화
    searchable: {
      type: Boolean,
      default: true,
    },
    // 전체 선택 버튼 표시
    showSelectAll: {
      type: Boolean,
      default: true,
    },
    // 비활성화
    disabled: {
      type: Boolean,
      default: false,
    },
    // 최대 선택 개수
    maxSelections: {
      type: Number,
      default: null,
    },
  },
  data() {
    return {
      isOpen: false,
      searchQuery: '',
    }
  },
  computed: {
    selectedItems() {
      return this.options.filter((option) => {
        const value = this.getItemValue(option)
        return this.modelValue.includes(value)
      })
    },
    filteredOptions() {
      if (!this.searchQuery) {
        return this.options
      }
      const query = this.searchQuery.toLowerCase()
      return this.options.filter((option) => {
        const label = this.getItemLabel(option).toLowerCase()
        return label.includes(query)
      })
    },
    isAllSelected() {
      return (
        this.filteredOptions.length > 0 &&
        this.filteredOptions.every((option) => this.isSelected(option))
      )
    },
  },
  methods: {
    getItemLabel(item) {
      return typeof item === 'object' ? item[this.labelKey] : item
    },
    getItemValue(item) {
      return typeof item === 'object' ? item[this.valueKey] : item
    },
    isSelected(option) {
      const value = this.getItemValue(option)
      return this.modelValue.includes(value)
    },
    toggleDropdown() {
      if (!this.disabled) {
        this.isOpen = !this.isOpen
      }
    },
    toggleOption(option) {
      const value = this.getItemValue(option)
      const newValue = [...this.modelValue]

      if (this.isSelected(option)) {
        // 선택 해제
        const index = newValue.indexOf(value)
        newValue.splice(index, 1)
      } else {
        // 선택 추가
        if (this.maxSelections && newValue.length >= this.maxSelections) {
          this.$emit('max-reached', this.maxSelections)
          return
        }
        newValue.push(value)
      }

      this.$emit('update:modelValue', newValue)
      this.$emit('change', newValue)
    },
    removeItem(item) {
      const value = this.getItemValue(item)
      const newValue = this.modelValue.filter((v) => v !== value)
      this.$emit('update:modelValue', newValue)
      this.$emit('change', newValue)
    },
    toggleSelectAll() {
      if (this.isAllSelected) {
        // 전체 해제
        const filteredValues = this.filteredOptions.map((o) => this.getItemValue(o))
        const newValue = this.modelValue.filter((v) => !filteredValues.includes(v))
        this.$emit('update:modelValue', newValue)
        this.$emit('change', newValue)
      } else {
        // 전체 선택
        const filteredValues = this.filteredOptions.map((o) => this.getItemValue(o))
        const newValue = [...new Set([...this.modelValue, ...filteredValues])]

        if (this.maxSelections && newValue.length > this.maxSelections) {
          this.$emit('max-reached', this.maxSelections)
          return
        }

        this.$emit('update:modelValue', newValue)
        this.$emit('change', newValue)
      }
    },
    handleClickOutside(event) {
      if (this.$refs.multiSelect && !this.$refs.multiSelect.contains(event.target)) {
        this.isOpen = false
      }
    },
  },
  mounted() {
    document.addEventListener('click', this.handleClickOutside)
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleClickOutside)
  },
}
</script>

<style scoped>
.multi-select {
  position: relative;
  width: 100%;
}

.multi-select-input {
  min-height: 38px;
  padding: 4px 32px 4px 8px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  background-color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  transition: all 0.2s ease;
  position: relative;
}

.multi-select-input:hover {
  border-color: #86b7fe;
}

.multi-select-input.open {
  border-color: #86b7fe;
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
}

.multi-select-input.disabled {
  background-color: #e9ecef;
  cursor: not-allowed;
  opacity: 0.6;
}

.selected-items {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  flex: 1;
}

.selected-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  background-color: #0d6efd;
  color: white;
  border-radius: 12px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.selected-badge:hover {
  background-color: #0b5ed7;
}

.selected-badge i {
  font-size: 0.75rem;
}

.selected-text {
  color: #212529;
  font-size: 1rem;
  user-select: none;
}

.dropdown-icon {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  transition: transform 0.2s ease;
  pointer-events: none;
}

.multi-select-input.open .dropdown-icon {
  transform: translateY(-50%) rotate(180deg);
}

.multi-select-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  background-color: white;
  border: 1px solid #ced4da;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  max-height: 300px;
  display: flex;
  flex-direction: column;
}

.search-box {
  padding: 8px;
  border-bottom: 1px solid #e9ecef;
}

.select-all {
  padding: 8px 12px;
  border-bottom: 1px solid #e9ecef;
  background-color: #f8f9fa;
}

.select-all label {
  margin: 0;
  cursor: pointer;
  user-select: none;
  display: flex;
  align-items: center;
  gap: 8px;
}

.options-list {
  overflow-y: auto;
  max-height: 200px;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  user-select: none;
  margin: 0;
  transition: background-color 0.2s ease;
}

.option-item:hover {
  background-color: #f8f9fa;
}

.option-item input[type='checkbox'] {
  cursor: pointer;
  flex-shrink: 0;
}

.no-options {
  padding: 12px;
  text-align: center;
  color: #6c757d;
  font-size: 0.9rem;
}

.form-check-input {
  width: 16px;
  height: 16px;
  margin: 0;
}
</style>
