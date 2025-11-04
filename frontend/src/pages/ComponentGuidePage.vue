<template>
  <div class="container-fluid py-3">
    <h2 class="mb-4">공통 컴포넌트 사용 가이드</h2>

    <!-- JqxCustomeGrid 가이드 -->
    <div class="card mb-4 border-primary">
      <div class="card-header bg-primary text-white border-primary">
        <h4 class="mb-0">JqxCustomeGrid - 그리드 컴포넌트</h4>
      </div>
      <div class="card-body">
        <div class="row">
          <div class="col-md-6">
            <h5 class="text-primary">예시</h5>
            <JqxCustomeGrid
              ref="exampleGrid"
              :localdata="exampleData"
              :datafields="exampleDatafields"
              :columns="exampleColumns"
              :height="300"
              selectionmode="singlerow"
              :pageable="true"
              :pagesize="5"
            />
            <div class="mt-2">
              <button class="btn btn-sm btn-primary" @click="addRow">행 추가</button>
              <button class="btn btn-sm btn-danger" @click="deleteRow">선택 행 삭제</button>
            </div>
          </div>
          <div class="col-md-6">
            <h5 class="text-primary">코드</h5>
            <pre class="bg-light p-3 rounded border"><code>{{ gridCode }}</code></pre>
          </div>
        </div>
      </div>
    </div>

    <!-- SearchGrid 가이드 -->
    <div class="card mb-4 border-primary">
      <div class="card-header bg-primary text-white border-primary">
        <h4 class="mb-0">SearchGrid - 검색 그리드</h4>
      </div>
      <div class="card-body">
        <div class="row">
          <div class="col-md-6">
            <h5 class="text-primary">예시</h5>
            <SearchGrid ref="searchGrid" @search="handleSearch" @open-user-popup="handlePopup" />
          </div>
          <div class="col-md-6">
            <h5 class="text-primary">코드</h5>
            <pre class="bg-light p-3 rounded border"><code>{{ searchGridCode }}</code></pre>
          </div>
        </div>
      </div>
    </div>

    <!-- PagedList 가이드 -->
    <div class="card mb-4 border-primary">
      <div class="card-header bg-primary text-white border-primary">
        <h4 class="mb-0">PagedList - 페이징 리스트</h4>
      </div>
      <div class="card-body">
        <div class="row">
          <div class="col-md-6">
            <h5 class="text-primary">예시</h5>
            <PagedList
              :items="pagedItems"
              :page-size="3"
              :current-page="currentPage"
              @page-change="currentPage = $event"
            >
              <template #item="{ item }">
                <div class="card mb-2">
                  <div class="card-body">
                    <h6>{{ item.name }}</h6>
                    <p class="mb-0 text-muted">{{ item.description }}</p>
                  </div>
                </div>
              </template>
            </PagedList>
          </div>
          <div class="col-md-6">
            <h5 class="text-primary">코드</h5>
            <pre class="bg-light p-3 rounded border"><code>{{ pagedListCode }}</code></pre>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast 유틸 가이드 -->
    <div class="card mb-4 border-primary">
      <div class="card-header bg-primary text-white border-primary">
        <h4 class="mb-0">Toast - 알림 메시지</h4>
      </div>
      <div class="card-body">
        <div class="row">
          <div class="col-md-6">
            <h5 class="text-primary">예시</h5>
            <div class="d-flex gap-2">
              <button class="btn btn-success" @click="showSuccessToast">Success</button>
              <button class="btn btn-danger" @click="showErrorToast">Error</button>
              <button class="btn btn-warning" @click="showWarningToast">Warning</button>
              <button class="btn btn-info" @click="showInfoToast">Info</button>
            </div>
          </div>
          <div class="col-md-6">
            <h5 class="text-primary">코드</h5>
            <pre class="bg-light p-3 rounded border"><code>{{ toastCode }}</code></pre>
          </div>
        </div>
      </div>
    </div>

    <!-- 구분선 -->
    <hr class="my-5" />

    <!-- 개발자를 위한 가이드 -->
    <div class="card border-success">
      <div class="card-header bg-success text-white border-success">
        <h4 class="mb-0">🛠️ 개발자 가이드: 이 페이지에 새 컴포넌트 가이드 추가하는 방법</h4>
      </div>
      <div class="card-body">
        <p class="lead">공통 컴포넌트를 추가할 때 이 페이지를 업데이트하는 3단계 방법입니다.</p>

        <div class="row mt-4">
          <div class="col-md-4">
            <div class="card h-100 border-success">
              <div class="card-body">
                <h5 class="card-title text-success">
                  <span class="badge bg-success me-2">1</span>Import 추가
                </h5>
                <p class="card-text">컴포넌트를 import합니다.</p>
                <pre
                  class="bg-light p-2 rounded border"
                ><code class="text-dark">{{ devGuideStep1 }}</code></pre>
              </div>
            </div>
          </div>

          <div class="col-md-4">
            <div class="card h-100 border-success">
              <div class="card-body">
                <h5 class="card-title text-success">
                  <span class="badge bg-success me-2">2</span>Template 추가
                </h5>
                <p class="card-text">기존 카드를 복사해서 수정합니다.</p>
                <pre
                  class="bg-light p-2 rounded border"
                  style="max-height: 300px; overflow-y: auto"
                ><code class="text-dark">{{ devGuideStep2 }}</code></pre>
              </div>
            </div>
          </div>

          <div class="col-md-4">
            <div class="card h-100 border-success">
              <div class="card-body">
                <h5 class="card-title text-success">
                  <span class="badge bg-success me-2">3</span>Script 추가
                </h5>
                <p class="card-text">컴포넌트 등록과 코드 예제를 추가합니다.</p>
                <pre
                  class="bg-light p-2 rounded border"
                  style="max-height: 300px; overflow-y: auto"
                ><code class="text-dark">{{ devGuideStep3 }}</code></pre>
              </div>
            </div>
          </div>
        </div>

        <div class="alert alert-success mt-4 mb-0">
          <h6 class="alert-heading">✅ 체크리스트</h6>
          <ul class="mb-0">
            <li>컴포넌트가 실제로 동작하는 예시를 보여주나요?</li>
            <li>코드 예제가 복사-붙여넣기 가능한가요?</li>
            <li>주요 Props와 Events가 설명되어 있나요?</li>
            <li>일관된 스타일(border-primary, bg-primary)을 사용했나요?</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import JqxCustomeGrid from '@/components/JqxCustomeGrid.vue'
import SearchGrid from '@/components/SearchGrid.vue'
import PagedList from '@/components/PagedList.vue'
import { showToast } from '@/utils/toastUtil.js'

export default {
  name: 'ComponentGuidePage',
  components: {
    JqxCustomeGrid,
    SearchGrid,
    PagedList,
  },
  data() {
    return {
      // JqxCustomeGrid 예시 데이터
      exampleData: [
        { id: 1, name: '홍길동', email: 'hong@example.com', role: 'Admin' },
        { id: 2, name: '김철수', email: 'kim@example.com', role: 'User' },
        { id: 3, name: '이영희', email: 'lee@example.com', role: 'User' },
      ],
      exampleDatafields: [
        { name: 'id', type: 'number' },
        { name: 'name', type: 'string' },
        { name: 'email', type: 'string' },
        { name: 'role', type: 'string' },
      ],
      exampleColumns: [
        { text: 'ID', datafield: 'id', width: 80 },
        { text: '이름', datafield: 'name', width: 120, editable: true },
        { text: '이메일', datafield: 'email', width: 200, editable: true },
        { text: '역할', datafield: 'role', width: 100, editable: true },
      ],

      // PagedList 예시 데이터
      pagedItems: [
        { id: 1, name: '항목 1', description: '첫 번째 항목입니다.' },
        { id: 2, name: '항목 2', description: '두 번째 항목입니다.' },
        { id: 3, name: '항목 3', description: '세 번째 항목입니다.' },
        { id: 4, name: '항목 4', description: '네 번째 항목입니다.' },
        { id: 5, name: '항목 5', description: '다섯 번째 항목입니다.' },
      ],
      currentPage: 1,

      // 코드 예시
      gridCode: `<template>
  <JqxCustomeGrid
    ref="grid"
    :localdata="rows"
    :datafields="datafields"
    :columns="columns"
    :height="400"
    selectionmode="checkbox"
  />
</template>

<script>
import JqxCustomeGrid from '@/components/JqxCustomeGrid.vue'

export default {
  components: { JqxCustomeGrid },
  data() {
    return {
      rows: [
        { id: 1, name: '홍길동', email: 'hong@example.com' }
      ],
      datafields: [
        { name: 'id', type: 'number' },
        { name: 'name', type: 'string' },
        { name: 'email', type: 'string' }
      ],
      columns: [
        { text: 'ID', datafield: 'id', width: 80 },
        { text: '이름', datafield: 'name', width: 120 },
        { text: '이메일', datafield: 'email', width: 200 }
      ]
    }
  }
}
<\/script>`,

      searchGridCode: `<template>
  <SearchGrid 
    @search="handleSearch"
    @open-user-popup="handlePopup"
  />
</template>

<script>
import SearchGrid from '@/components/SearchGrid.vue'

export default {
  components: { SearchGrid },
  methods: {
    handleSearch(criteria) {
      console.log('검색:', criteria)
      // 검색 로직
    },
    handlePopup() {
      // 팝업 열기
    }
  }
}
<\/script>`,

      pagedListCode: `<template>
  <PagedList
    :items="items"
    :page-size="10"
    :current-page="currentPage"
    @page-change="currentPage = $event"
  >
    <template #item="{ item }">
      <div class="card">
        <div class="card-body">
          <h5>{{ item.name }}</h5>
          <p>{{ item.description }}</p>
        </div>
      </div>
    </template>
  </PagedList>
</template>

<script>
import PagedList from '@/components/PagedList.vue'

export default {
  components: { PagedList },
  data() {
    return {
      items: [...],
      currentPage: 1
    }
  }
}
<\/script>`,

      toastCode: `import { showToast } from '@/utils/toastUtil.js'

// Success
showToast('성공했습니다!', { type: 'success' })

// Error
showToast('오류가 발생했습니다.', { type: 'error' })

// Warning
showToast('주의하세요!', { type: 'warning' })

// Info
showToast('정보를 확인하세요.', { type: 'info' })`,

      // 개발자 가이드 코드
      devGuideStep1: `import YourComponent from '@/components/YourComponent.vue'`,

      devGuideStep2: `<!-- YourComponent 가이드 -->
<div class="card mb-4 border-primary">
  <div class="card-header bg-primary text-white border-primary">
    <h4 class="mb-0">YourComponent - 설명</h4>
  </div>
  <div class="card-body">
    <div class="row">
      <div class="col-md-6">
        <h5 class="text-primary">예시</h5>
        <YourComponent 
          :prop1="value1"
          @event="handleEvent"
        />
      </div>
      <div class="col-md-6">
        <h5 class="text-primary">코드</h5>
        <pre class="bg-light p-3 rounded border">
          <code>{{ yourComponentCode }}</code>
        </pre>
      </div>
    </div>
  </div>
</div>`,

      devGuideStep3: `export default {
  components: {
    YourComponent  // 컴포넌트 등록
  },
  data() {
    return {
      yourComponentCode: \`<template>
  <YourComponent
    :prop1="value1"
    @event="handleEvent"
  />
</template>

<script>
import YourComponent from '@/components/YourComponent.vue'

export default {
  components: { YourComponent },
  methods: {
    handleEvent() {
      // 이벤트 처리 로직
    }
  }
}
<\\/script>\`
    }
  }
}`,
    }
  },
  methods: {
    addRow() {
      this.$refs.exampleGrid?.add({ name: '새 사용자', email: 'new@example.com', role: 'User' })
    },
    deleteRow() {
      this.$refs.exampleGrid?.deleteSelected()
    },
    handleSearch(criteria) {
      console.log('검색:', criteria)
      showToast('검색 기능은 예시입니다.', { type: 'info' })
    },
    handlePopup() {
      showToast('팝업 기능은 예시입니다.', { type: 'info' })
    },
    showSuccessToast() {
      showToast('성공했습니다!', { type: 'success' })
    },
    showErrorToast() {
      showToast('오류가 발생했습니다.', { type: 'error' })
    },
    showWarningToast() {
      showToast('주의하세요!', { type: 'warning' })
    },
    showInfoToast() {
      showToast('정보를 확인하세요.', { type: 'info' })
    },
  },
}
</script>

<style scoped>
pre {
  max-height: 400px;
  overflow-y: auto;
  font-size: 0.85rem;
}

code {
  white-space: pre;
  word-wrap: normal;
}
</style>
