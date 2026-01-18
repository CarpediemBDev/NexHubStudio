<template>
  <div class="container-fluid py-3">
    <h2 class="mb-4">공통 컴포넌트 사용 가이드</h2>

    <!-- JqxCustomGrid 가이드 -->
    <div class="card mb-4 border-primary">
      <div class="card-header bg-primary text-white border-primary">
        <h4 class="mb-0">JqxCustomGrid - 그리드 컴포넌트</h4>
      </div>
      <div class="card-body">
        <div class="row">
          <div class="col-md-6">
            <h5 class="text-primary">예시</h5>
            <JqxCustomGrid
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

    <!-- MultiSelect 가이드 -->
    <div class="card mb-4 border-primary">
      <div class="card-header bg-primary text-white border-primary">
        <h4 class="mb-0">MultiSelect - 멀티 셀렉터</h4>
      </div>
      <div class="card-body">
        <div class="row">
          <div class="col-md-6">
            <h5 class="text-primary">예시</h5>
            <div class="mb-3">
              <label class="form-label">기본 사용</label>
              <MultiSelect
                v-model="selectedFruits"
                :options="fruits"
                placeholder="과일을 선택하세요"
              />
              <small class="text-muted d-block mt-1"
                >선택된 항목: {{ selectedFruits.join(', ') || '없음' }}</small
              >
            </div>
            <div class="mb-3">
              <label class="form-label">객체 배열 사용</label>
              <MultiSelect
                v-model="selectedUsers"
                :options="userOptions"
                label-key="name"
                value-key="id"
                placeholder="사용자를 선택하세요"
              />
            </div>
            <div class="mb-3">
              <label class="form-label">최대 선택 제한 (최대 3개)</label>
              <MultiSelect
                v-model="selectedColors"
                :options="colors"
                :max-selections="3"
                placeholder="색상을 선택하세요 (최대 3개)"
                @max-reached="handleMaxReached"
              />
            </div>
          </div>
          <div class="col-md-6">
            <h5 class="text-primary">코드</h5>
            <pre class="bg-light p-3 rounded border"><code>{{ multiSelectCode }}</code></pre>
          </div>
        </div>
      </div>
    </div>

    <!-- 사용자 배정 가이드 -->
    <div class="card mb-4 border-primary">
      <div class="card-header bg-primary text-white border-primary">
        <h4 class="mb-0">사용자 배정 - 그룹별 사용자 할당</h4>
      </div>
      <div class="card-body">
        <p class="mb-3">
          사용자를 다양한 그룹(연구원, 오퍼레이션, 실무자)에 배정하는 인터랙티브 UI를 제공합니다. 두
          가지 레이아웃 옵션이 있습니다.
        </p>

        <!-- 탭 네비게이션 -->
        <ul class="nav nav-tabs mb-3" role="tablist">
          <li class="nav-item" role="presentation">
            <button
              class="nav-link active"
              id="vertical-tab"
              data-bs-toggle="tab"
              data-bs-target="#vertical-demo"
              type="button"
              role="tab"
            >
              세로 레이아웃 예시
            </button>
          </li>
          <li class="nav-item" role="presentation">
            <button
              class="nav-link"
              id="shared-tab"
              data-bs-toggle="tab"
              data-bs-target="#shared-demo"
              type="button"
              role="tab"
            >
              공통 목록 예시
            </button>
          </li>
          <li class="nav-item" role="presentation">
            <button
              class="nav-link"
              id="code-tab"
              data-bs-toggle="tab"
              data-bs-target="#code-demo"
              type="button"
              role="tab"
            >
              코드
            </button>
          </li>
        </ul>

        <!-- 탭 내용 -->
        <div class="tab-content">
          <!-- 세로 레이아웃 예시 -->
          <div class="tab-pane fade show active" id="vertical-demo" role="tabpanel">
            <div class="card border-primary">
              <div class="card-header bg-primary bg-opacity-10 border-primary">
                <h5 class="mb-0 text-primary">세로 레이아웃 - 연구원 배정 예시</h5>
              </div>
              <div class="card-body">
                <div class="row">
                  <!-- 전체 사용자 목록 -->
                  <div class="col-md-5">
                    <div class="mb-2">
                      <div class="form-check">
                        <input
                          class="form-check-input"
                          type="checkbox"
                          id="demoSelectAll"
                          :checked="isDemoAllSelected"
                          @change="demoToggleSelectAll"
                        />
                        <label class="form-check-label" for="demoSelectAll">
                          전체 선택
                          <span class="text-muted">({{ demoAvailableUsers.length }})</span>
                        </label>
                      </div>
                    </div>
                    <div
                      class="transfer-box border rounded"
                      style="height: 200px; overflow-y: auto"
                    >
                      <div
                        v-for="user in demoAvailableUsers"
                        :key="user.id"
                        class="transfer-item"
                        :class="{
                          selected: demoSelectedAvailable.includes(user.id),
                          assigned: getDemoUserAssignedGroup(user.id),
                        }"
                        @click="demoToggleAvailable(user.id)"
                      >
                        <div class="d-flex align-items-center">
                          <input
                            type="checkbox"
                            class="form-check-input me-2"
                            :checked="demoSelectedAvailable.includes(user.id)"
                            @click.stop="demoToggleAvailable(user.id)"
                          />
                          <span>{{ user.name }}</span>
                          <small class="ms-auto text-muted">{{ user.department }}</small>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- 화살표 버튼 -->
                  <div
                    class="col-md-2 d-flex flex-column justify-content-center align-items-center gap-2"
                  >
                    <button
                      class="btn btn-sm btn-outline-primary transfer-btn"
                      @click="demoMoveToResearcher"
                      :disabled="demoSelectedAvailable.length === 0"
                      title="연구원으로 추가"
                    >
                      <i class="bi bi-chevron-right"></i>
                    </button>
                    <button
                      class="btn btn-sm btn-outline-secondary transfer-btn"
                      @click="demoRemoveFromResearcher"
                      :disabled="demoSelectedAssigned.length === 0"
                      title="연구원에서 제거"
                    >
                      <i class="bi bi-chevron-left"></i>
                    </button>
                  </div>

                  <!-- 선택된 연구원 -->
                  <div class="col-md-5">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                      <h6 class="mb-0">선택된 연구원</h6>
                      <span class="badge bg-primary">{{ demoResearchers.length }}</span>
                    </div>
                    <div
                      class="transfer-box transfer-box-assigned border rounded"
                      style="height: 200px; overflow-y: auto"
                    >
                      <div
                        v-for="user in demoResearchers"
                        :key="user.id"
                        class="transfer-item assigned"
                        :class="{ selected: demoSelectedAssigned.includes(user.id) }"
                        @click="demoToggleAssigned(user.id)"
                      >
                        <div class="d-flex align-items-center">
                          <input
                            type="checkbox"
                            class="form-check-input me-2"
                            :checked="demoSelectedAssigned.includes(user.id)"
                            @click.stop="demoToggleAssigned(user.id)"
                          />
                          <span>{{ user.name }}</span>
                          <small class="ms-auto text-muted">{{ user.department }}</small>
                        </div>
                      </div>
                      <div v-if="demoResearchers.length === 0" class="text-center text-muted py-5">
                        <i class="bi bi-inbox fs-3 d-block mb-2"></i>
                        <small>배정된 사용자가 없습니다</small>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="alert alert-light border mt-3 mb-0">
                  <small
                    ><i class="bi bi-info-circle me-1"></i><strong>사용법:</strong> 좌측에서
                    사용자를 선택하고 오른쪽 화살표를 클릭하면 우측으로 이동합니다.</small
                  >
                </div>
              </div>
            </div>
          </div>

          <!-- 공통 목록 예시 -->
          <div class="tab-pane fade" id="shared-demo" role="tabpanel">
            <div class="card border-success">
              <div class="card-header bg-success text-white">
                <h5 class="mb-0">공통 목록 레이아웃 예시</h5>
              </div>
              <div class="card-body">
                <div class="row">
                  <!-- 좌측: 전체 사용자 목록 -->
                  <div class="col-md-4">
                    <div class="card border-secondary">
                      <div class="card-header bg-light border-secondary">
                        <div class="form-check mb-0">
                          <input
                            class="form-check-input"
                            type="checkbox"
                            id="demoSharedSelectAll"
                            :checked="isDemoSharedAllSelected"
                            @change="demoToggleSharedSelectAll"
                          />
                          <label class="form-check-label" for="demoSharedSelectAll">
                            전체 선택
                            <span class="text-muted">({{ demoFilteredUsers.length }})</span>
                          </label>
                        </div>
                      </div>
                      <div class="card-body">
                        <input
                          v-model="demoSearchQuery"
                          type="text"
                          class="form-control mb-3"
                          placeholder="🔍 이름 또는 부서 검색..."
                        />
                        <div
                          class="shared-user-box border rounded"
                          style="height: 400px; overflow-y: auto"
                        >
                          <div
                            v-for="user in demoFilteredUsers"
                            :key="user.id"
                            class="shared-user-item"
                            :class="{
                              selected: demoSharedSelected.includes(user.id),
                              assigned: getDemoUserAssignedGroups(user.id).length > 0,
                            }"
                            @click="demoToggleSharedSelect(user.id)"
                          >
                            <div class="d-flex align-items-center">
                              <input
                                type="checkbox"
                                class="form-check-input me-2"
                                :checked="demoSharedSelected.includes(user.id)"
                                @click.stop="demoToggleSharedSelect(user.id)"
                              />
                              <span>{{ user.name }}</span>
                              <small class="ms-auto text-muted">{{ user.department }}</small>
                              <!-- 배정된 그룹 표시 (모든 그룹) -->
                              <span
                                v-if="getDemoUserAssignedGroups(user.id).length > 0"
                                class="ms-2 d-flex gap-1"
                              >
                                <span
                                  v-if="getDemoUserAssignedGroups(user.id).includes('researcher')"
                                  class="badge bg-primary"
                                  style="font-size: 0.65rem"
                                  >연구원</span
                                >
                                <span
                                  v-if="getDemoUserAssignedGroups(user.id).includes('operation')"
                                  class="badge bg-success"
                                  style="font-size: 0.65rem"
                                  >오퍼</span
                                >
                                <span
                                  v-if="getDemoUserAssignedGroups(user.id).includes('worker')"
                                  class="badge bg-warning text-dark"
                                  style="font-size: 0.65rem"
                                  >실무자</span
                                >
                              </span>
                            </div>
                          </div>
                          <div
                            v-if="demoFilteredUsers.length === 0"
                            class="text-center text-muted py-5"
                          >
                            <i class="bi bi-search fs-3 d-block mb-2"></i>
                            <small>검색 결과가 없습니다</small>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- 중앙: 화살표 버튼 -->
                  <div
                    class="col-md-1 d-flex flex-column justify-content-center align-items-center gap-3"
                  >
                    <button
                      class="btn btn-outline-primary shared-arrow-btn"
                      @click="demoMoveToGroup('researcher')"
                      :disabled="demoSharedSelected.length === 0"
                      title="연구원으로 배정"
                    >
                      <i class="bi bi-arrow-right fs-5"></i>
                      <small class="d-block">연구원</small>
                    </button>
                    <button
                      class="btn btn-outline-success shared-arrow-btn"
                      @click="demoMoveToGroup('operation')"
                      :disabled="demoSharedSelected.length === 0"
                      title="오퍼레이션으로 배정"
                    >
                      <i class="bi bi-arrow-right fs-5"></i>
                      <small class="d-block">오퍼</small>
                    </button>
                    <button
                      class="btn btn-outline-warning shared-arrow-btn"
                      @click="demoMoveToGroup('worker')"
                      :disabled="demoSharedSelected.length === 0"
                      title="실무자로 배정"
                    >
                      <i class="bi bi-arrow-right fs-5"></i>
                      <small class="d-block">실무자</small>
                    </button>
                  </div>

                  <!-- 우측: 배정된 그룹 -->
                  <div class="col-md-7">
                    <div class="card mb-3 border-0">
                      <div class="card-header bg-primary bg-opacity-10 text-primary border-0">
                        <h6 class="mb-0">
                          <i class="bi bi-people-fill me-2"></i>연구원
                          <span class="badge bg-primary ms-2">{{
                            demoSharedResearchers.length
                          }}</span>
                        </h6>
                      </div>
                      <div class="card-body p-2" style="min-height: 80px">
                        <div class="assigned-box">
                          <span
                            v-for="user in demoSharedResearchers"
                            :key="user.id"
                            class="assigned-badge badge-primary cursor-pointer"
                            @click="demoRemoveFromGroup('researcher', user.id)"
                            title="클릭하여 제거"
                          >
                            {{ user.name }}
                            <i class="bi bi-x-circle"></i>
                          </span>
                        </div>
                        <div
                          v-if="demoSharedResearchers.length === 0"
                          class="text-center text-muted py-3"
                        >
                          <small>배정된 연구원이 없습니다</small>
                        </div>
                      </div>
                    </div>
                    <div class="card mb-3 border-0">
                      <div class="card-header bg-success bg-opacity-10 text-success border-0">
                        <h6 class="mb-0">
                          <i class="bi bi-gear-fill me-2"></i>오퍼레이션
                          <span class="badge bg-success ms-2">{{
                            demoSharedOperations.length
                          }}</span>
                        </h6>
                      </div>
                      <div class="card-body p-2" style="min-height: 80px">
                        <div class="assigned-box">
                          <span
                            v-for="user in demoSharedOperations"
                            :key="user.id"
                            class="assigned-badge badge-success cursor-pointer"
                            @click="demoRemoveFromGroup('operation', user.id)"
                            title="클릭하여 제거"
                          >
                            {{ user.name }}
                            <i class="bi bi-x-circle"></i>
                          </span>
                        </div>
                        <div
                          v-if="demoSharedOperations.length === 0"
                          class="text-center text-muted py-3"
                        >
                          <small>배정된 오퍼레이션이 없습니다</small>
                        </div>
                      </div>
                    </div>
                    <div class="card mb-3 border-0">
                      <div class="card-header bg-warning bg-opacity-10 text-warning border-0">
                        <h6 class="mb-0">
                          <i class="bi bi-person-badge-fill me-2"></i>실무자
                          <span class="badge bg-warning ms-2">{{ demoSharedWorkers.length }}</span>
                        </h6>
                      </div>
                      <div class="card-body p-2" style="min-height: 80px">
                        <div class="assigned-box">
                          <span
                            v-for="user in demoSharedWorkers"
                            :key="user.id"
                            class="assigned-badge badge-warning cursor-pointer"
                            @click="demoRemoveFromGroup('worker', user.id)"
                            title="클릭하여 제거"
                          >
                            {{ user.name }}
                            <i class="bi bi-x-circle"></i>
                          </span>
                        </div>
                        <div
                          v-if="demoSharedWorkers.length === 0"
                          class="text-center text-muted py-3"
                        >
                          <small>배정된 실무자가 없습니다</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="alert alert-success mt-3 mb-0">
                  <small
                    ><strong>사용법:</strong> 좌측에서 사용자를 선택하고 중앙의 그룹 버튼을 클릭하여
                    배정합니다. 배지를 클릭하면 제거됩니다.</small
                  >
                </div>
              </div>
            </div>
          </div>

          <!-- 코드 탭 -->
          <div class="tab-pane fade" id="code-demo" role="tabpanel">
            <div class="row">
              <div class="col-md-6">
                <h5 class="text-primary">세로 레이아웃 코드</h5>
                <pre
                  class="bg-light p-3 rounded border"
                ><code>{{ userAssignmentVerticalCode }}</code></pre>
              </div>
              <div class="col-md-6">
                <h5 class="text-primary">공통 목록 코드</h5>
                <pre
                  class="bg-light p-3 rounded border"
                ><code>{{ userAssignmentSharedCode }}</code></pre>
              </div>
            </div>
            <div class="row mt-3">
              <div class="col-12">
                <h5 class="text-primary">주요 기능</h5>
                <ul>
                  <li><strong>중복 방지:</strong> 이미 배정된 사용자는 다시 선택할 수 없습니다</li>
                  <li><strong>다중 선택:</strong> Ctrl 키로 여러 사용자를 동시에 선택 가능</li>
                  <li>
                    <strong>시각적 피드백:</strong> 선택된 항목은 그라데이션 배경으로 강조 표시
                  </li>
                  <li><strong>Toast 알림:</strong> 모든 작업에 대한 실시간 피드백 제공</li>
                  <li><strong>반응형 디자인:</strong> Bootstrap 5 기반의 반응형 레이아웃</li>
                </ul>
                <div class="alert alert-info">
                  <strong>전체 페이지 보기:</strong>
                  <router-link to="/user-assignment-vertical" class="alert-link"
                    >세로 레이아웃</router-link
                  >
                  |
                  <router-link to="/user-assignment-shared" class="alert-link"
                    >공통 목록 레이아웃</router-link
                  >
                </div>
              </div>
            </div>
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
import JqxCustomGrid from '@/components/JqxCustomGrid.vue'
import SearchGrid from '@/components/SearchGrid.vue'
import PagedList from '@/components/PagedList.vue'
import MultiSelect from '@/components/MultiSelect.vue'
import { showToast } from '@/utils/toastUtil.js'

export default {
  name: 'ComponentGuidePage',
  components: {
    JqxCustomGrid,
    SearchGrid,
    PagedList,
    MultiSelect,
  },
  data() {
    return {
      // MultiSelect 예시 데이터
      selectedFruits: [],
      fruits: ['사과', '바나나', '오렌지', '포도', '딸기', '수박', '메론'],
      selectedUsers: [],
      userOptions: [
        { id: 1, name: '홍길동' },
        { id: 2, name: '김철수' },
        { id: 3, name: '이영희' },
        { id: 4, name: '박민수' },
        { id: 5, name: '정수진' },
      ],
      selectedColors: [],
      colors: ['빨강', '파랑', '노랑', '초록', '보라', '주황', '분홍'],

      // JqxCustomGrid 예시 데이터
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

      // 사용자 배정 데모 데이터 - 세로 레이아웃
      demoAvailableUsers: [
        { id: 1, name: '홍길동', department: '개발팀' },
        { id: 2, name: '김철수', department: '기획팀' },
        { id: 3, name: '이영희', department: '디자인팀' },
        { id: 4, name: '박민수', department: '개발팀' },
        { id: 5, name: '정수진', department: '마케팅팀' },
      ],
      demoResearchers: [],
      demoSelectedAvailable: [], // 다중 선택
      demoSelectedAssigned: [], // 다중 선택

      // 사용자 배정 데모 데이터 - 공통 목록
      demoAllUsers: [
        { id: 11, name: '강민호', department: '개발팀' },
        { id: 12, name: '윤서연', department: '기획팀' },
        { id: 13, name: '임지훈', department: '디자인팀' },
        { id: 14, name: '한소희', department: '개발팀' },
        { id: 15, name: '조현우', department: '마케팅팀' },
        { id: 16, name: '배수지', department: '영업팀' },
        { id: 17, name: '최유진', department: '개발팀' },
        { id: 18, name: '신동혁', department: '기획팀' },
      ],
      demoSharedResearchers: [],
      demoSharedOperations: [],
      demoSharedWorkers: [],
      demoSharedSelected: [],
      demoSearchQuery: '',

      // 그룹 정보 맵
      groupMap: {
        researcher: { name: '연구원', key: 'demoSharedResearchers' },
        operation: { name: '오퍼레이션', key: 'demoSharedOperations' },
        worker: { name: '실무자', key: 'demoSharedWorkers' },
      },

      // 코드 예시
      multiSelectCode: `<template>
  <!-- 기본 사용 (문자열 배열) -->
  <MultiSelect
    v-model="selectedItems"
    :options="['항목1', '항목2', '항목3']"
    placeholder="항목을 선택하세요"
  />

  <!-- 객체 배열 사용 -->
  <MultiSelect
    v-model="selectedUsers"
    :options="users"
    label-key="name"
    value-key="id"
    placeholder="사용자를 선택하세요"
    @change="handleChange"
  />

  <!-- 최대 선택 제한 -->
  <MultiSelect
    v-model="selected"
    :options="options"
    :max-selections="3"
    @max-reached="handleMaxReached"
  />

  <!-- 검색 비활성화 -->
  <MultiSelect
    v-model="selected"
    :options="options"
    :searchable="false"
  />
</template>

<script>
import MultiSelect from '@/components/MultiSelect.vue'

export default {
  components: { MultiSelect },
  data() {
    return {
      selectedItems: [],
      selectedUsers: [],
      users: [
        { id: 1, name: '홍길동' },
        { id: 2, name: '김철수' }
      ]
    }
  },
  methods: {
    handleChange(newValue) {
      console.log('선택된 항목:', newValue)
    },
    handleMaxReached(max) {
      alert(\`최대 \${max}개까지 선택 가능합니다\`)
    }
  }
}
<\\/script>

<!-- Props -->
- modelValue: 선택된 값들 (Array)
- options: 옵션 목록 (Array, required)
- labelKey: 객체의 라벨 속성명 (String, default: 'label')
- valueKey: 객체의 값 속성명 (String, default: 'value')
- placeholder: placeholder 텍스트 (String)
- searchable: 검색 기능 활성화 (Boolean, default: true)
- showSelectAll: 전체 선택 버튼 표시 (Boolean, default: true)
- disabled: 비활성화 (Boolean, default: false)
- maxSelections: 최대 선택 개수 (Number)

<!-- Events -->
- update:modelValue: 선택 변경 시
- change: 선택 변경 시 (선택된 값들 전달)
- max-reached: 최대 선택 개수 도달 시`,

      gridCode: `<template>
  <JqxCustomGrid
    ref="grid"
    :localdata="rows"
    :datafields="datafields"
    :columns="columns"
    :height="400"
    selectionmode="checkbox"
  />
</template>

<script>
import JqxCustomGrid from '@/components/JqxCustomGrid.vue'

export default {
  components: { JqxCustomGrid },
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

      // 사용자 배정 코드 예시
      userAssignmentVerticalCode: `<template>
  <div class="container-fluid py-4">
    <div class="card mb-4">
      <div class="card-header bg-primary text-white">
        <h5>연구원 배정</h5>
      </div>
      <div class="card-body">
        <div class="row">
          <!-- 전체 목록 -->
          <div class="col-md-5">
            <div class="mb-2">
              <div class="form-check">
                <input type="checkbox"
                       class="form-check-input"
                       id="selectAllResearcher"
                       :checked="isAllResearcherSelected"
                       @change="toggleSelectAllResearcher" />
                <label class="form-check-label" 
                       for="selectAllResearcher">
                  전체 선택 
                  <span class="text-muted">
                    ({{ availableUsers.length }})
                  </span>
                </label>
              </div>
            </div>
            <div class="transfer-box border rounded" 
                 style="height: 300px; overflow-y: auto">
              <div v-for="user in availableUsers"
                   :key="user.id"
                   @click="toggleAvailableSelect('researcher', user.id)"
                   class="transfer-item"
                   :class="{ 
                     selected: selectedAvailable.researcher.includes(user.id),
                     assigned: getUserAssignedGroup(user.id)
                   }">
                <input type="checkbox"
                       class="form-check-input me-2"
                       :checked="selectedAvailable.researcher.includes(user.id)"
                       @click.stop="toggleAvailableSelect('researcher', user.id)" />
                {{ user.name }}
              </div>
            </div>
          </div>
          
          <!-- 화살표 버튼 -->
          <div class="col-md-2 text-center d-flex flex-column 
                      justify-content-center align-items-center gap-2">
            <button @click="moveToResearcher" 
                    :disabled="selectedAvailable.researcher.length === 0"
                    class="btn btn-sm btn-outline-primary transfer-btn">
              <i class="bi bi-chevron-right"></i>
            </button>
            <button @click="removeFromResearcher"
                    :disabled="selectedAssigned.researcher.length === 0" 
                    class="btn btn-sm btn-outline-secondary transfer-btn">
              <i class="bi bi-chevron-left"></i>
            </button>
          </div>
          
          <!-- 선택된 목록 -->
          <div class="col-md-5">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <h6 class="mb-0">선택된 연구원</h6>
              <span class="badge bg-primary">{{ researchers.length }}</span>
            </div>
            <div class="transfer-box transfer-box-assigned border rounded" 
                 style="height: 300px; overflow-y: auto">
              <div v-for="user in researchers"
                   :key="user.id"
                   @click="toggleAssignedSelect('researcher', user.id)"
                   class="transfer-item assigned"
                   :class="{ selected: 
                             selectedAssigned.researcher.includes(user.id) }">
                <input type="checkbox"
                       class="form-check-input me-2"
                       :checked="selectedAssigned.researcher.includes(user.id)"
                       @click.stop="toggleAssignedSelect('researcher', user.id)" />
                {{ user.name }}
              </div>
              <div v-if="researchers.length === 0" 
                   class="text-center text-muted py-5">
                <i class="bi bi-inbox fs-3 d-block mb-2"></i>
                <small>배정된 사용자가 없습니다</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { showToast } from '@/utils/toastUtil.js'

export default {
  data() {
    return {
      availableUsers: [
        { id: 1, name: '홍길동', department: '개발팀' },
        { id: 2, name: '김철수', department: '기획팀' }
      ],
      researchers: [],
      // 다중 선택 (배열)
      selectedAvailable: { researcher: [] },
      selectedAssigned: { researcher: [] }
    }
  },
  computed: {
    isAllResearcherSelected() {
      return this.availableUsers.length > 0 &&
             this.availableUsers.every(user => 
               this.selectedAvailable.researcher.includes(user.id))
    }
  },
  methods: {
    // 사용자가 배정된 모든 그룹 확인 (배열 반환) - 세로 레이아웃용
    getUserAssignedGroup(userId) {
      if (this.researchers.find(u => u.id === userId)) return 'researcher'
      if (this.operations.find(u => u.id === userId)) return 'operation'
      if (this.workers.find(u => u.id === userId)) return 'worker'
      return null
    },
    
    toggleSelectAllResearcher() {
      if (this.isAllResearcherSelected) {
        this.selectedAvailable.researcher = []
      } else {
        this.selectedAvailable.researcher = 
          this.availableUsers.map(u => u.id)
      }
    },
    toggleAvailableSelect(group, userId) {
      const idx = this.selectedAvailable[group].indexOf(userId)
      if (idx > -1) {
        this.selectedAvailable[group].splice(idx, 1)
      } else {
        this.selectedAvailable[group].push(userId)
      }
    },
    toggleAssignedSelect(group, userId) {
      const idx = this.selectedAssigned[group].indexOf(userId)
      if (idx > -1) {
        this.selectedAssigned[group].splice(idx, 1)
      } else {
        this.selectedAssigned[group].push(userId)
      }
    },
    moveToResearcher() {
      this.selectedAvailable.researcher.forEach(userId => {
        const user = this.availableUsers.find(u => u.id === userId)
        if (user && !this.researchers.find(r => r.id === user.id)) {
          this.researchers.push(user)
        }
      })
      const count = this.selectedAvailable.researcher.length
      this.selectedAvailable.researcher = []
      showToast(\`\${count}명을 연구원으로 추가했습니다.\`, 
                { type: 'success' })
    },
    removeFromResearcher() {
      this.selectedAssigned.researcher.forEach(userId => {
        const idx = this.researchers.findIndex(u => u.id === userId)
        if (idx !== -1) this.researchers.splice(idx, 1)
      })
      const count = this.selectedAssigned.researcher.length
      this.selectedAssigned.researcher = []
      showToast(\`\${count}명을 연구원에서 제거했습니다.\`, 
                { type: 'info' })
    }
  }
}
<\\/script>

<style scoped>
.transfer-box {
  background-color: #fafafa;
  padding: 8px;
}

.transfer-box-assigned {
  background-color: #f0f7ff;
}

.transfer-item {
  padding: 8px 12px;
  margin-bottom: 4px;
  background-color: white;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.transfer-item:hover {
  border-color: #0d6efd;
  background-color: #f8f9fa;
}

.transfer-item.selected {
  border-color: #0d6efd;
  background-color: #e7f1ff;
}

.transfer-item.assigned {
  background-color: #f8f9fa;
  opacity: 0.7;
  border-left: 3px solid #198754;
}

.transfer-item.assigned:hover {
  opacity: 0.85;
}

.transfer-btn {
  width: 36px;
  height: 36px;
  padding: 0;
  border-radius: 4px;
}
</style>`,

      userAssignmentSharedCode: `<template>
  <div class="container-fluid py-4">
    <div class="row">
      <!-- 좌측: 전체 사용자 목록 -->
      <div class="col-md-4">
        <div class="card">
          <div class="card-header">
            <div class="form-check mb-0">
              <input type="checkbox"
                     class="form-check-input"
                     id="selectAll"
                     :checked="isAllSelected"
                     @change="toggleSelectAll" />
              <label class="form-check-label" 
                     for="selectAll">
                전체 선택 
                <span class="text-muted">
                  ({{ filteredUsers.length }})
                </span>
              </label>
            </div>
          </div>
          <div class="card-body">
            <input v-model="searchQuery" 
                   placeholder="🔍 검색..." 
                   class="form-control mb-3" />
            <div class="list-group">
              <div v-for="user in filteredUsers"
                   :key="user.id"
                   @click="toggleUserSelect(user.id)"
                   class="list-group-item"
                   :class="{ 
                     selected: selectedUsers.includes(user.id),
                     assigned: getUserAssignedGroups(user.id).length > 0
                   }">
                <input type="checkbox"
                       class="form-check-input me-2"
                       :checked="selectedUsers.includes(user.id)"
                       @click.stop="toggleUserSelect(user.id)" />
                {{ user.name }}
                <!-- 배정된 그룹 표시 (모든 그룹) -->
                <span v-if="getUserAssignedGroups(user.id).length > 0" 
                      class="ms-auto d-flex gap-1">
                  <span v-if="getUserAssignedGroups(user.id).includes('researcher')" 
                        class="badge bg-primary" 
                        style="font-size: 0.65rem">연구원</span>
                  <span v-if="getUserAssignedGroups(user.id).includes('operation')" 
                        class="badge bg-success" 
                        style="font-size: 0.65rem">오퍼</span>
                  <span v-if="getUserAssignedGroups(user.id).includes('worker')" 
                        class="badge bg-warning text-dark" 
                        style="font-size: 0.65rem">실무자</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 중앙: 화살표 버튼 -->
      <div class="col-md-2 text-center">
        <button @click="moveToResearcher" 
                :disabled="selectedUsers.length === 0"
                class="btn btn-arrow-group mb-3">
          <i class="bi bi-arrow-right"></i>
          <div>연구원</div>
        </button>
        <button @click="moveToOperation" 
                :disabled="selectedUsers.length === 0"
                class="btn btn-arrow-group mb-3">
          <i class="bi bi-arrow-right"></i>
          <div>오퍼레이션</div>
        </button>
        <button @click="moveToWorker" 
                :disabled="selectedUsers.length === 0"
                class="btn btn-arrow-group">
          <i class="bi bi-arrow-right"></i>
          <div>실무자</div>
        </button>
      </div>
      
      <!-- 우측: 배정된 그룹 -->
      <div class="col-md-6">
        <div class="card mb-3">
          <div class="card-header bg-primary text-white">
            <h6 class="mb-0">
              연구원 
              <span class="badge bg-light text-dark">
                {{ researchers.length }}
              </span>
            </h6>
          </div>
          <div class="card-body p-2">
            <div class="assigned-box">
              <span v-for="user in researchers" 
                    :key="user.id"
                    class="assigned-badge badge-primary"
                    @click="removeFromResearcher(user.id)">
                {{ user.name }}
                <i class="bi bi-x-circle"></i>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { showToast } from '@/utils/toastUtil.js'

export default {
  data() {
    return {
      allUsers: [
        { id: 1, name: '홍길동', department: '개발팀' },
        { id: 2, name: '김철수', department: '기획팀' }
      ],
      researchers: [],
      operations: [],
      workers: [],
      selectedUsers: [],  // 다중 선택
      searchQuery: ''
    }
  },
  computed: {
    filteredUsers() {
      // 검색어 필터링만 적용 (배정된 사용자도 표시)
      let users = this.allUsers
      
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase()
        users = users.filter(user =>
          user.name.toLowerCase().includes(query) ||
          user.department.toLowerCase().includes(query)
        )
      }
      
      return users
    },
    isAllSelected() {
      return this.filteredUsers.length > 0 &&
             this.filteredUsers.every(user => 
               this.selectedUsers.includes(user.id))
    }
  },
  methods: {
    // MultiSelect 이벤트 핸들러
    handleMaxReached(max) {
      showToast(\`최대 \${max}개까지 선택 가능합니다\`, { type: 'warning' })
    },

    // 사용자가 배정된 모든 그룹 확인 (배열 반환)
    getUserAssignedGroups(userId) {
      const groups = []
      if (this.researchers.find(u => u.id === userId)) groups.push('researcher')
      if (this.operations.find(u => u.id === userId)) groups.push('operation')
      if (this.workers.find(u => u.id === userId)) groups.push('worker')
      return groups
    },
    
    toggleSelectAll() {
      if (this.isAllSelected) {
        // 선택 해제
        this.filteredUsers.forEach(user => {
          const idx = this.selectedUsers.indexOf(user.id)
          if (idx > -1) this.selectedUsers.splice(idx, 1)
        })
      } else {
        // 전체 선택
        this.filteredUsers.forEach(user => {
          if (!this.selectedUsers.includes(user.id)) {
            this.selectedUsers.push(user.id)
          }
        })
      }
    },
    toggleUserSelect(userId) {
      const idx = this.selectedUsers.indexOf(userId)
      if (idx > -1) {
        this.selectedUsers.splice(idx, 1)
      } else {
        this.selectedUsers.push(userId)
      }
    },
    moveToResearcher() {
      let count = 0
      this.selectedUsers.forEach(userId => {
        const user = this.allUsers.find(u => u.id === userId)
        if (user && !this.researchers.find(r => r.id === user.id)) {
          this.researchers.push(user)
          count++
        }
      })
      this.selectedUsers = []
      if (count > 0) {
        showToast(\`\${count}명을 연구원으로 배정했습니다.\`, 
                  { type: 'success' })
      }
    }
  }
}
<\\/script>

<style scoped>
.list-group-item.selected {
  border-color: #0d6efd;
  background-color: #e7f1ff;
}

.list-group-item.assigned {
  background-color: #f8f9fa;
  opacity: 0.7;
}

.list-group-item.assigned:hover {
  opacity: 0.85;
}

.btn-arrow-group {
  width: 75px;
  height: 75px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.assigned-box {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: flex-start;
  padding: 8px;
}

.assigned-badge {
  padding: 6px 10px;
  font-size: 0.8rem;
  font-weight: 500;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.assigned-badge:hover {
  transform: translateY(-1px);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
}

.assigned-badge i {
  font-size: 0.75rem;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.assigned-badge:hover i {
  opacity: 1;
}

.badge-primary {
  background-color: #e7f1ff;
  color: #0d6efd;
  border-color: #0d6efd;
}

.badge-primary:hover {
  background-color: #cfe2ff;
}

.badge-success {
  background-color: #d1f4e0;
  color: #198754;
  border-color: #198754;
}

.badge-success:hover {
  background-color: #b8eed3;
}

.badge-warning {
  background-color: #fff3cd;
  color: #cc9a06;
  border-color: #ffc107;
}

.badge-warning:hover {
  background-color: #ffe69c;
}
<\\/style>`,

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
  computed: {
    // 공통 목록에서 검색 필터링 (배정된 사용자도 표시)
    demoFilteredUsers() {
      let users = this.demoAllUsers

      // 검색어가 있으면 필터링
      if (this.demoSearchQuery) {
        users = users.filter(
          (user) =>
            user.name.includes(this.demoSearchQuery) ||
            user.department.includes(this.demoSearchQuery)
        )
      }

      return users
    },
    isDemoAllSelected() {
      return (
        this.demoAvailableUsers.length > 0 &&
        this.demoAvailableUsers.every((user) => this.demoSelectedAvailable.includes(user.id))
      )
    },
    isDemoSharedAllSelected() {
      return (
        this.demoFilteredUsers.length > 0 &&
        this.demoFilteredUsers.every((user) => this.demoSharedSelected.includes(user.id))
      )
    },
  },
  methods: {
    // 사용자가 배정된 모든 그룹 확인 (배열 반환)
    getDemoUserAssignedGroups(userId) {
      const groups = []
      if (this.demoSharedResearchers.find((u) => u.id === userId)) groups.push('researcher')
      if (this.demoSharedOperations.find((u) => u.id === userId)) groups.push('operation')
      if (this.demoSharedWorkers.find((u) => u.id === userId)) groups.push('worker')
      return groups
    },

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

    // 세로 레이아웃 데모 메서드
    getDemoUserAssignedGroup(userId) {
      if (this.demoResearchers.find((u) => u.id === userId)) return 'researcher'
      // 오퍼레이션과 실무자 그룹이 있다면 추가
      return null
    },

    demoToggleSelectAll() {
      if (this.isDemoAllSelected) {
        this.demoSelectedAvailable = []
      } else {
        this.demoSelectedAvailable = this.demoAvailableUsers.map((u) => u.id)
      }
    },
    demoToggleAvailable(userId) {
      const index = this.demoSelectedAvailable.indexOf(userId)
      if (index > -1) {
        this.demoSelectedAvailable.splice(index, 1)
      } else {
        this.demoSelectedAvailable.push(userId)
      }
    },
    demoToggleAssigned(userId) {
      const index = this.demoSelectedAssigned.indexOf(userId)
      if (index > -1) {
        this.demoSelectedAssigned.splice(index, 1)
      } else {
        this.demoSelectedAssigned.push(userId)
      }
    },
    demoMoveToResearcher() {
      let count = 0
      this.demoSelectedAvailable.forEach((userId) => {
        const user = this.demoAvailableUsers.find((u) => u.id === userId)
        if (user && !this.demoResearchers.find((r) => r.id === user.id)) {
          this.demoResearchers.push(user)
          count++
        }
      })
      this.demoSelectedAvailable = []
      if (count > 0) {
        showToast(`${count}명을 연구원으로 배정했습니다.`, { type: 'success' })
      }
    },
    demoRemoveFromResearcher() {
      this.demoSelectedAssigned.forEach((userId) => {
        const index = this.demoResearchers.findIndex((u) => u.id === userId)
        if (index !== -1) {
          this.demoResearchers.splice(index, 1)
        }
      })
      const count = this.demoSelectedAssigned.length
      this.demoSelectedAssigned = []
      if (count > 0) {
        showToast(`${count}명을 연구원에서 제거했습니다.`, { type: 'info' })
      }
    },

    // 공통 목록 데모 메서드
    demoToggleSharedSelectAll() {
      if (this.isDemoSharedAllSelected) {
        // 현재 필터된 사용자들을 선택 해제
        this.demoFilteredUsers.forEach((user) => {
          const index = this.demoSharedSelected.indexOf(user.id)
          if (index > -1) {
            this.demoSharedSelected.splice(index, 1)
          }
        })
      } else {
        // 현재 필터된 사용자들을 선택
        this.demoFilteredUsers.forEach((user) => {
          if (!this.demoSharedSelected.includes(user.id)) {
            this.demoSharedSelected.push(user.id)
          }
        })
      }
    },
    demoToggleSharedSelect(userId) {
      const index = this.demoSharedSelected.indexOf(userId)
      index === -1 ? this.demoSharedSelected.push(userId) : this.demoSharedSelected.splice(index, 1)
    },

    demoMoveToGroup(groupType) {
      if (this.demoSharedSelected.length === 0) return

      const selectedUsers = this.demoAllUsers.filter((u) => this.demoSharedSelected.includes(u.id))
      const groupArray = this[this.groupMap[groupType].key]

      // 중복되지 않은 사용자만 추가
      selectedUsers.forEach((user) => {
        if (!groupArray.find((u) => u.id === user.id)) {
          groupArray.push(user)
        }
      })

      showToast(`${selectedUsers.length}명을 ${this.groupMap[groupType].name}으로 배정했습니다.`, {
        type: 'success',
      })
      this.demoSharedSelected = []
    },

    demoRemoveFromGroup(groupType, userId) {
      const groupArray = this[this.groupMap[groupType].key]
      const index = groupArray.findIndex((u) => u.id === userId)

      if (index !== -1) {
        const user = groupArray[index]
        groupArray.splice(index, 1)
        showToast(`${user.name}님을 ${this.groupMap[groupType].name}에서 제거했습니다.`, {
          type: 'info',
        })
      }
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

.cursor-pointer {
  cursor: pointer;
}

/* 세로 레이아웃 - Transfer 스타일 */
.transfer-box {
  background-color: #fafafa;
  padding: 8px;
}

.transfer-box-assigned {
  background-color: #f0f7ff;
}

.transfer-item {
  padding: 8px 12px;
  margin-bottom: 4px;
  background-color: white;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.transfer-item:hover {
  border-color: #0d6efd;
  background-color: #f8f9fa;
}

.transfer-item.selected {
  border-color: #0d6efd;
  background-color: #e7f1ff;
}

.transfer-item.assigned {
  background-color: #f8f9fa;
  opacity: 0.7;
  border-left: 3px solid #198754;
}

.transfer-item.assigned:hover {
  opacity: 0.85;
}

.transfer-btn {
  width: 36px;
  height: 36px;
  padding: 0;
  border-radius: 4px;
}

/* 체크박스 스타일 */
.form-check-input {
  width: 16px;
  height: 16px;
  cursor: pointer;
  flex-shrink: 0;
}

.form-check-label {
  cursor: pointer;
  user-select: none;
}

/* 공통 목록 스타일 */
.shared-user-box {
  background-color: #f8f9fa;
  padding: 12px;
}

.shared-user-item {
  padding: 12px 16px;
  margin-bottom: 6px;
  background-color: white;
  border: 1px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.shared-user-item:hover {
  border-color: #dee2e6;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}

.shared-user-item.selected {
  background-color: #e7f1ff;
  border-color: #0d6efd;
  box-shadow: 0 2px 6px rgba(13, 110, 253, 0.2);
}

.shared-user-item.assigned {
  background-color: #f8f9fa;
  opacity: 0.7;
}

.shared-user-item.assigned:hover {
  opacity: 0.85;
}

/* 중앙 화살표 버튼 */
.shared-arrow-btn {
  width: 75px;
  height: 75px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  border-width: 2px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.shared-arrow-btn:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.shared-arrow-btn small {
  margin-top: 2px;
  font-size: 0.7rem;
  font-weight: 600;
}

/* 배정된 배지 */
.assigned-box {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: flex-start;
  padding: 8px;
}

.assigned-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border-radius: 6px;
  font-weight: 500;
  font-size: 0.8rem;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
}

.assigned-badge:hover {
  transform: translateY(-1px);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
}

.assigned-badge i {
  font-size: 0.75rem;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.assigned-badge:hover i {
  opacity: 1;
}

.badge-primary {
  background-color: #e7f1ff;
  color: #0d6efd;
  border-color: #0d6efd;
}

.badge-primary:hover {
  background-color: #cfe2ff;
}

.badge-success {
  background-color: #d1f4e0;
  color: #198754;
  border-color: #198754;
}

.badge-success:hover {
  background-color: #b8eed3;
}

.badge-warning {
  background-color: #fff3cd;
  color: #cc9a06;
  border-color: #ffc107;
}

.badge-warning:hover {
  background-color: #ffe69c;
}
</style>
