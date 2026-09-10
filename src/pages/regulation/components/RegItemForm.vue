<template>
  <div class="reg-item-form">
    <!-- 일괄 편집 안내 -->
    <div v-if="bulk" class="bulk-bar">
      <i class="bi bi-collection me-1"></i>
      <strong>{{ items.length }}개 항목</strong> 일괄 편집 —
      값이 서로 다른 필드는 <em>(여러 값)</em> 으로 표시되며, 입력하면 선택한 항목 전체에 적용됩니다.
      <button type="button" class="btn-b2b-action btn-compact ms-auto" @click="$emit('clear-selection')">선택 해제</button>
    </div>

    <!-- 계층 경로 : 이 항목이 어디에 딸린 것인지 -->
    <div v-if="!bulk && parentPath" class="path-bar">
      <i class="bi bi-diagram-3 me-1"></i>{{ parentPath }}
      <span class="mx-1">›</span>
      <strong>{{ items[0] ? itemLabel(items[0]) : '' }}</strong>
    </div>

    <div class="row gx-3 gy-3">
      <!-- 구분 : 단일 select. 이걸 바꾸면 아래 값 옵션이 통째로 교체된다 -->
      <div class="col-6 col-md-4">
        <label class="form-label-sm">항목 구분 <span class="text-danger">*</span></label>
        <select
          class="form-select form-select-sm"
          :value="selectValueOf('itemTypeCd')"
          :disabled="readonly || bulk"
          @change="changeType($event.target.value)"
        >
          <option v-if="isMixed('itemTypeCd')" value="__MIXED__">(여러 값)</option>
          <option v-for="t in typeOptions" :key="t.code" :value="t.code">{{ t.name }}</option>
        </select>
        <div v-if="!bulk" class="hint">
          <i class="bi bi-info-circle me-1"></i>{{ typeHint }}
        </div>
      </div>

      <!-- 값 : 구분에 따라 옵션 소스가 바뀐다 -->
      <div class="col-12 col-md-8">
        <label class="form-label-sm">
          {{ bulk ? '항목' : itemTypeName(items[0] && items[0].itemTypeCd) }}
          <span class="text-danger">*</span>
        </label>
        <select
          class="form-select form-select-sm"
          :class="{ 'is-invalid': !bulk && !items[0].itemCd }"
          :value="selectValueOf('itemCd')"
          :disabled="readonly || bulk"
          @change="patch('itemCd', $event.target.value)"
        >
          <option v-if="isMixed('itemCd')" value="__MIXED__">(여러 값)</option>
          <option value="">선택하세요</option>
          <option v-for="o in valueOptions" :key="o.code" :value="o.code">{{ o.name }}</option>
        </select>
        <div v-if="!bulk && !valueOptions.length" class="hint text-danger">
          상위 항목에 딸린 선택지가 없습니다. 상위를 먼저 지정하세요.
        </div>
      </div>

      <div class="col-6 col-md-4">
        <label class="form-label-sm">필수 여부</label>
        <select
          class="form-select form-select-sm"
          :value="selectValueOf('mandatoryYn')"
          :disabled="readonly"
          @change="patch('mandatoryYn', $event.target.value)"
        >
          <option v-if="isMixed('mandatoryYn')" value="__MIXED__">(여러 값)</option>
          <option value="Y">필수</option>
          <option value="N">선택</option>
        </select>
      </div>

      <div class="col-6 col-md-4">
        <label class="form-label-sm">정렬 순서</label>
        <input
          type="number"
          class="form-control form-control-sm"
          :value="valueOf('sortOrder')"
          :placeholder="placeholderOf('sortOrder', '1')"
          :readonly="readonly"
          @input="patch('sortOrder', Number($event.target.value) || 0)"
        />
      </div>

      <div class="col-12">
        <label class="form-label-sm">비고</label>
        <textarea
          rows="3"
          class="form-control form-control-sm"
          :value="valueOf('remark')"
          :placeholder="placeholderOf('remark', '담당 부서, 유효기간, 갱신 주기 등')"
          :readonly="readonly"
          @input="patch('remark', $event.target.value)"
        ></textarea>
      </div>
    </div>

    <div v-if="!readonly" class="d-flex gap-2 mt-3 pt-3 border-top">
      <button
        v-if="!bulk && childType"
        type="button"
        class="btn-b2b-action"
        @click="$emit('add-child', items[0])"
      >
        <i class="bi bi-plus-lg text-success me-1"></i>{{ itemTypeName(childType) }} 추가
      </button>
      <button type="button" class="btn-b2b-action text-danger ms-auto" @click="$emit('remove', items.map((i) => i.itemId))">
        <i class="bi bi-trash me-1"></i>{{ bulk ? `선택 ${items.length}개 삭제` : '이 항목 삭제 (하위 포함)' }}
      </button>
    </div>
  </div>
</template>

<script>
import {
  itemTypeCodes,
  regulationCodes,
  standardCodes,
  certCodes
} from '@/data/regulationMock'
import { itemTypeName, childTypeOf, levelOfType, itemName } from '@/utils/regulationTree'

const MIXED = '__MIXED__'

/** 구분 → 값 후보 마스터 */
const OPTION_SOURCE = {
  REGULATION: regulationCodes,
  STANDARD: standardCodes,
  CERT: certCodes
}

const TYPE_HINT = {
  REGULATION: '근거 법령·지침 단위',
  STANDARD: '규제에 딸린 시험·기술 기준',
  CERT: '규격 충족을 증명하는 발급 문서'
}

export default {
  name: 'RegItemForm',
  props: {
    /** 편집 대상 항목 draft 배열. 1개면 단일 편집, 2개 이상이면 일괄 편집 */
    items: { type: Array, required: true },
    /** 이 항목의 부모 항목 (없으면 null). 값 후보를 부모로 좁히는 데 쓴다 */
    parent: { type: Object, default: null },
    /** 부모까지의 경로 문자열 */
    parentPath: { type: String, default: '' },
    readonly: { type: Boolean, default: false }
  },
  emits: ['patch', 'remove', 'clear-selection', 'add-child'],
  computed: {
    bulk() {
      return this.items.length > 1
    },
    currentType() {
      return this.items[0] ? this.items[0].itemTypeCd : 'REGULATION'
    },
    childType() {
      return childTypeOf(this.currentType)
    },
    typeHint() {
      return TYPE_HINT[this.currentType] || ''
    },
    /**
     * 고를 수 있는 구분.
     * 계층이 규제>규격>인증서로 고정이므로 부모가 정해지면 구분도 정해진다.
     * (최상위 항목만 규제로 강제)
     */
    typeOptions() {
      if (!this.parent) return itemTypeCodes.filter((t) => t.code === 'REGULATION')
      const child = childTypeOf(this.parent.itemTypeCd)
      return itemTypeCodes.filter((t) => t.code === child)
    },
    /** 구분에 따라 옵션 소스가 통째로 바뀐다. 부모가 있으면 그 하위로 좁힌다 */
    valueOptions() {
      const list = OPTION_SOURCE[this.currentType] || []
      if (!this.parent) return list
      return list.filter((o) => o.parentCd === this.parent.itemCd)
    }
  },
  methods: {
    itemTypeName,
    itemLabel: itemName,
    isMixed(key) {
      return new Set(this.items.map((i) => i[key])).size > 1
    },
    /** input/textarea 용. 값이 섞여 있으면 비워두고 placeholder 로 알린다 */
    valueOf(key) {
      if (this.isMixed(key)) return ''
      return this.items[0] ? this.items[0][key] : ''
    },
    /** select 용. 값이 섞여 있으면 '(여러 값)' 옵션이 선택되도록 센티널을 돌려준다 */
    selectValueOf(key) {
      if (this.isMixed(key)) return MIXED
      return this.items[0] ? this.items[0][key] : ''
    },
    placeholderOf(key, fallback) {
      return this.isMixed(key) ? '(여러 값)' : fallback
    },
    /** 구분이 바뀌면 값·레벨을 함께 초기화한다 (다른 마스터를 보게 되므로) */
    changeType(value) {
      if (value === MIXED) return
      const ids = this.items.map((i) => i.itemId)
      this.$emit('patch', { key: 'itemTypeCd', value, itemIds: ids })
      this.$emit('patch', { key: 'levelNo', value: levelOfType(value), itemIds: ids })
      this.$emit('patch', { key: 'itemCd', value: '', itemIds: ids })
    },
    patch(key, value) {
      if (value === MIXED) return
      this.$emit('patch', { key, value, itemIds: this.items.map((i) => i.itemId) })
    }
  }
}
</script>

<style scoped>
.form-label-sm {
  display: block;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: var(--b2b-space-2);
  color: var(--b2b-color-text-primary, #212529);
}

.bulk-bar {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  border: 1px solid #badbcc;
  background: #f3faf6;
  color: #0f5132;
  border-radius: 6px;
  padding: 6px 10px;
  margin-bottom: 12px;
}

.bulk-bar em {
  font-style: normal;
  font-weight: 700;
}

.path-bar {
  font-size: 12px;
  color: var(--b2b-color-text-secondary, #6c757d);
  background: var(--b2b-color-bg-subcard, #f8f9fa);
  border: 1px solid var(--b2b-color-border, #dee2e6);
  border-radius: 6px;
  padding: 5px 10px;
  margin-bottom: 12px;
}

.hint {
  margin-top: 4px;
  font-size: 11px;
  color: var(--b2b-color-text-secondary, #6c757d);
}

.btn-compact {
  padding: 2px var(--b2b-space-2);
  font-size: 11px;
}
</style>
