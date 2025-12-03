<template>
  <div class="form-check form-check-inline">
    <input
      class="form-check-input"
      type="radio"
      :id="`${name}-${value}`"
      :name="name"
      :value="value"
      :checked="modelValue === value"
      @change="$emit('update:modelValue', value)"
      :disabled="disabled"
    />
    <label class="form-check-label" :for="`${name}-${value}`">
      {{ label }}
    </label>
  </div>
</template>

<script>
export default {
  name: 'Radio',
  props: {
    modelValue: null,
    value: {
      required: true,
    },
    label: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    disabled: Boolean,
  },
  emits: ['update:modelValue'],
}
</script>

<style scoped>
/* 추가 스타일이 필요하면 여기에 */
</style>
