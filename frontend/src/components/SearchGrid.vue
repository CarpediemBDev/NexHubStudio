<template>
  <form class="search-bar py-2 px-3 bg-light rounded shadow-sm mb-3" @submit.prevent="emitOpen">
    <div class="row g-2 align-items-end">
      <div class="col-12 col-md-6">
        <label class="form-label">사용자(이름/ID)</label>
        <div class="input-group">
          <input
            v-model="form.userNames"
            class="form-control one-line"
            placeholder="이름 또는 ID 입력 후 Enter"
            @keydown.enter.prevent.stop="emitOpen"
          />
          <button type="button" class="btn btn-outline-primary" @click="emitOpen">검색</button>
        </div>
      </div>

      <!-- 날짜 검색 조건: 네이티브 date input -->
      <div class="col-12 col-md-4">
        <label class="form-label">가입일 (네이티브)</label>
        <input type="date" v-model="form.joinDate" class="form-control" placeholder="날짜 선택" />
      </div>

      <!-- 날짜 검색 조건: vue-datepicker-next -->
      <div class="col-12 col-md-4">
        <label class="form-label">가입일 (달력)</label>
        <date-picker
          v-model="form.joinDateCalendar"
          :lang="lang"
          format="YYYY-MM-DD"
          input-class="form-control"
          placeholder="날짜 선택"
          clearable
        />
      </div>

      <div
        class="col-12 col-md-auto ms-md-auto d-flex justify-content-end align-items-center pe-md-3"
      >
        <button type="button" class="btn btn-primary" @click="onSearch">조회</button>
        <button type="button" class="btn btn-secondary ms-2" @click="onReset">초기화</button>
      </div>
    </div>
  </form>
</template>

<script>
import 'vue-datepicker-next/index.css'
import DatePicker from 'vue-datepicker-next'
import ko from 'vue-datepicker-next/locale/ko'

export default {
  name: 'SearchGrid',
  components: { DatePicker },
  emits: ['open-user-popup', 'search'],
  data() {
    return {
      form: {
        userNames: '',
        userIds: [],
        joinDate: null,
        joinDateCalendar: null,
      },
      lang: ko,
    }
  },
  methods: {
    emitOpen() {
      this.$emit('open-user-popup', this.form.userNames)
    },
    setUsersFromPopup(selectedList) {
      const users = Array.isArray(selectedList) ? selectedList : []
      this.form.userNames = users
        .map((u) => u?.name ?? '')
        .filter(Boolean)
        .join(', ')
      this.form.userIds = users.map((u) => u?.userId).filter(Boolean)
    },
    onReset() {
      this.form = { userNames: '', userIds: [], joinDate: null, joinDateCalendar: null }
    },
    onSearch() {
      this.$emit('search', { ...this.form })
    },
  },
}
</script>
<style scoped>
/* 한 줄 고정 + 넘치면 말줄임 처리 */
.one-line {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
/* datepicker input에 Bootstrap 스타일 적용 */
input[type='date'].form-control {
  min-width: 140px;
}
.dp__input_wrap input.form-control {
  min-width: 140px;
}
</style>
