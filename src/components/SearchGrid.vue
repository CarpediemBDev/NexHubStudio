<template>
  <form class="search-box-container b2b-card px-4 py-3 mb-3 bg-theme-subcard border border-theme rounded-3" @submit.prevent="emitOpen">
    <!-- 1. 검색 조건 영역 (4단 Grid, 2줄 레이아웃) -->
    <div class="row gx-4 gy-3">
      <!-- [1Row] -->
      <!-- 1. 사용자 (이름/ID) (일체형 인풋 그룹 + 돋보기 팝업 아이콘) -->
      <div class="col-12 col-md-3">
        <label class="b2b-form-label b2b-text-sm text-theme-primary mb-2 fw-semibold">사용자 (이름/ID)</label>
        <div class="input-group input-group-sm rounded-2 search-input-group">
          <input
            v-model="form.userNames"
            class="form-control form-control-sm border-theme border-end-0 b2b-text-body bg-theme-card text-theme-primary one-line"
            placeholder="입력 후 돋보기 클릭"
            @keydown.enter.prevent.stop="emitOpen"
          />
          <button 
            type="button" 
            class="btn btn-sm btn-outline-secondary border-theme border-start-0 bg-theme-card text-theme-secondary px-2.5" 
            @click="emitOpen"
            title="사용자 검색 팝업 열기"
          >
            <i class="bi bi-search"></i>
          </button>
        </div>
      </div>

      <!-- 2. 소속 부서 -->
      <div class="col-12 col-md-3">
        <label class="b2b-form-label b2b-text-sm text-theme-primary mb-2 fw-semibold">소속 부서</label>
        <select 
          v-model="form.department" 
          class="form-select form-select-sm b2b-text-body bg-theme-card text-theme-primary border-theme"
        >
          <option value="">전체</option>
          <option value="HQ">본사</option>
          <option value="DEV">개발본부</option>
          <option value="PLAN">기획팀</option>
          <option value="DESIGN">디자인팀</option>
          <option value="OPS">운영팀</option>
        </select>
      </div>

      <!-- 3. 직무/직책 -->
      <div class="col-12 col-md-3">
        <label class="b2b-form-label b2b-text-sm text-theme-primary mb-2 fw-semibold">직무/직책</label>
        <select 
          v-model="form.position" 
          class="form-select form-select-sm b2b-text-body bg-theme-card text-theme-primary border-theme"
        >
          <option value="">전체</option>
          <option value="LEADER">팀장</option>
          <option value="PART_LEADER">파트장</option>
          <option value="MEMBER">팀원</option>
        </select>
      </div>

      <!-- 4. 재직 상태 -->
      <div class="col-12 col-md-3">
        <label class="b2b-form-label b2b-text-sm text-theme-primary mb-2 fw-semibold">재직 상태</label>
        <select 
          v-model="form.employmentStatus" 
          class="form-select form-select-sm b2b-text-body bg-theme-card text-theme-primary border-theme"
        >
          <option value="">전체</option>
          <option value="ACTIVE">재직</option>
          <option value="LEAVE">휴직</option>
          <option value="RETIRED">퇴사</option>
        </select>
      </div>

      <!-- [2Row] -->
      <!-- 5. 시스템 권한 -->
      <div class="col-12 col-md-3">
        <label class="b2b-form-label b2b-text-sm text-theme-primary mb-2 fw-semibold">시스템 권한</label>
        <select 
          v-model="form.roleGroup" 
          class="form-select form-select-sm b2b-text-body bg-theme-card text-theme-primary border-theme"
        >
          <option value="">전체</option>
          <option value="ADMIN">시스템 관리자</option>
          <option value="USER">일반 사용자</option>
          <option value="READONLY">읽기 전용</option>
        </select>
      </div>

      <!-- 6. 계정 상태 (라디오 버튼) -->
      <div class="col-12 col-md-3">
        <label class="b2b-form-label b2b-text-sm text-theme-primary mb-2 fw-semibold">계정 상태</label>
        <div class="d-flex align-items-center gap-3 py-1 text-theme-primary b2b-text-sm">
          <div class="form-check form-check-inline mb-0 me-2">
            <input 
              class="form-check-input" 
              type="radio" 
              name="accountStatus" 
              id="accAll" 
              value="" 
              v-model="form.accountStatus"
            />
            <label class="form-check-label" for="accAll">전체</label>
          </div>
          <div class="form-check form-check-inline mb-0 me-2">
            <input 
              class="form-check-input" 
              type="radio" 
              name="accountStatus" 
              id="accNormal" 
              value="NORMAL" 
              v-model="form.accountStatus"
            />
            <label class="form-check-label text-success" for="accNormal">정상</label>
          </div>
          <div class="form-check form-check-inline mb-0 me-0">
            <input 
              class="form-check-input" 
              type="radio" 
              name="accountStatus" 
              id="accLocked" 
              value="LOCKED" 
              v-model="form.accountStatus"
            />
            <label class="form-check-label text-danger" for="accLocked">잠김</label>
          </div>
        </div>
      </div>

      <!-- 7. 가입일 (단일 선택) -->
      <div class="col-12 col-md-3">
        <label class="b2b-form-label b2b-text-sm text-theme-primary mb-2 fw-semibold">가입일 (단일)</label>
        <B2bDatePicker
          v-model="form.joinSingleDate"
          placeholder="YYYY-MM-DD"
          :enable-time-picker="false"
          :show-presets="true"
        />
      </div>

      <!-- 8. 가입일 (기간 설정: 시작일 ~ 종료일 각각 선택) -->
      <div class="col-12 col-md-6">
        <label class="b2b-form-label b2b-text-sm text-theme-primary mb-2 fw-semibold">가입일 (기간 설정)</label>
        <div class="d-flex align-items-center gap-1.5 date-range-pair">
          <B2bDatePicker
            v-model="form.joinStartDate"
            placeholder="시작일"
            :enable-time-picker="false"
            :show-presets="true"
          />
          <span class="text-theme-secondary b2b-text-sm fw-bold">~</span>
          <B2bDatePicker
            v-model="form.joinEndDate"
            placeholder="종료일"
            :enable-time-picker="false"
            :show-presets="true"
          />
        </div>
      </div>

      <!-- 9. 가입 기간 (Range - 멀티 캘린더) -->
      <div class="col-12 col-md-3">
        <label class="b2b-form-label b2b-text-sm text-theme-primary mb-2 fw-semibold">가입 기간 (Range)</label>
        <B2bDatePicker
          v-model="form.joinRangeDate"
          placeholder="시작일 ~ 종료일 선택"
          :range="true"
          :multi-calendars="true"
          :show-presets="true"
        />
      </div>

      <!-- 10. 가입 일시 (날짜 + 시간) -->
      <div class="col-12 col-md-3">
        <label class="b2b-form-label b2b-text-sm text-theme-primary mb-2 fw-semibold">가입 일시 (날짜+시간)</label>
        <B2bDatePicker
          v-model="form.joinDateTime"
          placeholder="YYYY-MM-DD HH:mm"
          :enable-time-picker="true"
          :time-picker-inline="true"
          :show-presets="true"
        />
      </div>

      <!-- 11. 가입 기간 일시 (시작일시 ~ 종료일시 각각 선택) -->
      <div class="col-12 col-md-6">
        <label class="b2b-form-label b2b-text-sm text-theme-primary mb-2 fw-semibold">가입 기간 일시 (시작~종료)</label>
        <div class="d-flex align-items-center gap-1.5 date-range-pair">
          <B2bDatePicker
            v-model="form.joinStartDateTime"
            placeholder="시작일시"
            :enable-time-picker="true"
            :show-presets="true"
          />
          <span class="text-theme-secondary b2b-text-sm fw-bold">~</span>
          <B2bDatePicker
            v-model="form.joinEndDateTime"
            placeholder="종료일시"
            :enable-time-picker="true"
            :show-presets="true"
          />
        </div>
      </div>

      <!-- 12. 가입 기간 일시 (Range Timer - 한 입력창) -->
      <div class="col-12 col-md-3">
        <label class="b2b-form-label b2b-text-sm text-theme-primary mb-2 fw-semibold">가입 기간 일시 (Range Timer)</label>
        <B2bDatePicker
          v-model="form.joinRangeDateTime"
          placeholder="시작일시 ~ 종료일시"
          :range="true"
          :multi-calendars="true"
          :enable-time-picker="true"
          :show-presets="true"
        />
      </div>
    </div>

    <!-- 2. 하단 액션 버튼 영역 (Flex justify-content-end + border-top 연한 구분선) -->
    <div class="d-flex justify-content-end align-items-center mt-3 pt-3 border-top border-theme gap-2">
      <button 
        type="button" 
        class="btn-b2b-action btn-sm px-3 d-flex align-items-center gap-1.5" 
        @click="onReset" 
        title="조건 초기화"
      >
        <i class="bi bi-arrow-counterclockwise"></i>
        <span>초기화</span>
      </button>

      <button 
        type="button" 
        class="btn-b2b-primary btn-sm px-4 shadow-sm d-flex align-items-center gap-1.5" 
        @click="onSearch"
      >
        <i class="bi bi-search"></i>
        <span>조회</span>
      </button>
    </div>
  </form>
</template>

<script>
import B2bDatePicker from './common/B2bDatePicker.vue'

export default {
  name: 'SearchGrid',
  components: {
    B2bDatePicker,
  },
  emits: ['open-user-popup', 'search'],
  data() {
    return {
      form: {
        userNames: '',
        userIds: [],
        department: '',
        position: '',
        employmentStatus: 'ACTIVE',
        roleGroup: '',
        accountStatus: '',
        joinSingleDate: '',
        joinStartDate: '',
        joinEndDate: '',
        joinRangeDate: null,
        joinDateTime: '',
        joinStartDateTime: '',
        joinEndDateTime: '',
        joinRangeDateTime: null,
      },
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
      this.form = {
        userNames: '',
        userIds: [],
        department: '',
        position: '',
        employmentStatus: 'ACTIVE',
        roleGroup: '',
        accountStatus: '',
        joinSingleDate: '',
        joinStartDate: '',
        joinEndDate: '',
      }
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

.search-input-group .btn-outline-secondary:hover {
  background-color: var(--b2b-color-hover-bg) !important;
  color: var(--b2b-color-primary) !important;
  border-color: var(--b2b-color-primary) !important;
}

/* native date input에 최소 너비 및 폰트 통일 */
input[type='date'].form-control {
  min-width: 110px;
}

/* 기간(시작 ~ 종료) 페어: 두 개의 데이트픽커를 균등 분할하여 값이 잘리지 않도록 */
.date-range-pair :deep(.b2b-datepicker-wrapper) {
  flex: 1 1 0;
  min-width: 0;
}
</style>
