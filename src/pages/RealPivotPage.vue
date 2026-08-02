<template>
  <div class="realpivot-container text-theme-primary d-flex flex-column gap-3" :class="`theme-${selectedTheme}`">
    <!-- ============ 헤더 & AI 토글 툴바 ============ -->
    <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 b2b-card p-3 shadow-sm border-0">
      <div>
        <div class="d-flex align-items-center gap-2 flex-wrap">
          <h4 class="b2b-text-h1 fw-bold m-0 d-inline-flex align-items-center gap-2">
            RealPivot 2 Engine
            <span class="b2b-badge b2b-badge-success">AI Powered</span>
          </h4>
          <span class="theme-chip-badge">Theme: {{ currentThemeName }}</span>
        </div>
        <p class="text-theme-secondary b2b-text-sm mb-0 mt-1">
          자연어 AI 패널 및 드래그 &amp; 드롭 다차원 매트릭스 피벗 엔진 (RealPivot2 Spec 준수)
        </p>
      </div>

      <!-- 우측 액션 툴바 -->
      <div class="d-flex align-items-center gap-2 flex-wrap">
        <!-- AI 패널 열기/닫기 버튼 -->
        <button
          class="btn btn-ai-toggle d-inline-flex align-items-center gap-2"
          :class="{ 'active': showAiPanel }"
          @click="showAiPanel = !showAiPanel"
        >
          <i class="bi bi-robot fs-5"></i>
          <span>AI 피벗 분석</span>
          <span class="ai-sparkle-dot"></span>
        </button>

        <!-- 히트맵 서식 토글 -->
        <button
          class="btn-b2b-action"
          :class="{ 'active-mode': showHeatmap }"
          title="피벗 데이터 매트릭스 히트맵 시각화"
          @click="showHeatmap = !showHeatmap"
        >
          <i class="bi bi-fire" :class="showHeatmap ? 'text-danger' : 'text-secondary'"></i>
          <span>히트맵</span>
        </button>

        <!-- 피벗 차트 시각화 토글 -->
        <button
          class="btn-b2b-action"
          :class="{ 'active-mode': showChart }"
          title="피벗 결과 미니 차트 토글"
          @click="showChart = !showChart"
        >
          <i class="bi bi-bar-chart-line" :class="showChart ? 'text-primary' : 'text-secondary'"></i>
          <span>차트</span>
        </button>

        <!-- 소계 토글 -->
        <button
          class="btn-b2b-action"
          title="소계 표시/숨김"
          @click="showSubtotals = !showSubtotals"
        >
          <i class="bi" :class="showSubtotals ? 'bi-toggle-on text-primary' : 'bi-toggle-off text-secondary'"></i>
          <span>소계</span>
        </button>

        <!-- 레이아웃 모드 선택 -->
        <div class="dropdown d-inline-block">
          <button class="btn-b2b-action dropdown-toggle" type="button" data-bs-toggle="dropdown">
            <i class="bi bi-layout-split text-info"></i>
            <span>{{ layoutModeLabel }}</span>
          </button>
          <ul class="dropdown-menu dropdown-menu-end shadow-sm b2b-text-sm">
            <li><a class="dropdown-item cursor-pointer" @click="layoutMode = 'tabular'">테이블형 (Tabular)</a></li>
            <li><a class="dropdown-item cursor-pointer" @click="layoutMode = 'compact'">압축형 (Compact)</a></li>
            <li><a class="dropdown-item cursor-pointer" @click="layoutMode = 'tree'">트리형 (Tree/Outline)</a></li>
          </ul>
        </div>

        <!-- 테마 셀렉터 -->
        <div class="dropdown d-inline-block">
          <button class="btn-b2b-action dropdown-toggle" type="button" data-bs-toggle="dropdown">
            <i class="bi bi-palette text-warning"></i>
            <span>테마</span>
          </button>
          <ul class="dropdown-menu dropdown-menu-end shadow-sm b2b-text-sm">
            <li><a class="dropdown-item cursor-pointer" @click="selectedTheme = 'emerald'">🟢 RealGrid Emerald</a></li>
            <li><a class="dropdown-item cursor-pointer" @click="selectedTheme = 'indigo'">🟣 Corporate Indigo</a></li>
            <li><a class="dropdown-item cursor-pointer" @click="selectedTheme = 'dark'">🌙 Dark Slate</a></li>
            <li><a class="dropdown-item cursor-pointer" @click="selectedTheme = 'light'">☀️ Clean Light</a></li>
          </ul>
        </div>

        <!-- 내보내기 및 초기화 -->
        <button class="btn-b2b-action" title="CSV 파일로 내보내기" @click="exportCsv">
          <i class="bi bi-filetype-csv text-success"></i>
          <span>CSV</span>
        </button>
        <button class="btn-b2b-action" title="필드 배치 초기화" @click="resetLayout">
          <i class="bi bi-arrow-counterclockwise text-warning"></i>
          <span>초기화</span>
        </button>
      </div>
    </div>

    <!-- ============ AI 분석 드로어 / 패널 (RealPivot2 Feature) ============ -->
    <transition name="slide-down">
      <div v-if="showAiPanel" class="ai-panel-card b2b-card p-3 shadow-md border-0 position-relative overflow-hidden">
        <div class="ai-bg-glow"></div>
        <div class="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
          <div class="d-flex align-items-center gap-2">
            <div class="ai-icon-badge">
              <i class="bi bi-magic"></i>
            </div>
            <div>
              <h5 class="fw-bold m-0 text-theme-primary d-flex align-items-center gap-2 flex-wrap">
                RealPivot2 AI 패널
                <span class="badge bg-primary-subtle text-primary border border-primary-subtle">LLM Powered</span>
                <span class="ai-conn-badge" :class="aiConnected ? 'is-on' : 'is-off'">
                  <i class="bi" :class="aiConnected ? 'bi-plug-fill' : 'bi-plug'"></i>
                  {{ aiConnected ? `${providerLabel} 연결됨` : 'LLM 미연결 · 로컬 엔진' }}
                </span>
              </h5>
              <span class="b2b-text-xs text-theme-secondary">LLM으로 피벗 구성을 변경하고, 데이터를 분석하고, 추세를 예측합니다.</span>
            </div>
          </div>
          <div class="d-flex align-items-center gap-1">
            <button
              class="btn-b2b-action btn-sm"
              :class="{ 'active-mode': showAiSettings }"
              title="LLM 연결 설정"
              @click="showAiSettings = !showAiSettings"
            >
              <i class="bi bi-gear" :class="aiConnected ? 'text-success' : 'text-secondary'"></i>
              <span>LLM 설정</span>
            </button>
            <button class="btn-close text-reset" @click="showAiPanel = false"></button>
          </div>
        </div>

        <!-- ===== LLM 연결 설정 패널 ===== -->
        <transition name="fade">
          <div v-if="showAiSettings" class="ai-settings-box p-3 rounded-3 mb-3">
            <div class="d-flex align-items-center justify-content-between mb-2">
              <span class="b2b-text-xs fw-bold text-theme-primary d-flex align-items-center gap-1">
                <i class="bi bi-hdd-network text-primary"></i>LLM 서비스 연결 (Bring Your Own Key)
              </span>
              <span class="b2b-text-xs text-theme-secondary">키는 이 브라우저에만 저장됩니다 (localStorage)</span>
            </div>
            <div class="row g-2">
              <div class="col-md-4">
                <label class="ai-field-label">공급자</label>
                <select v-model="aiSettings.provider" class="form-select form-select-sm b2b-text-xs" @change="onProviderChange">
                  <option value="openai">OpenAI 호환 (GPT / 사내 프록시)</option>
                  <option value="anthropic">Anthropic Claude</option>
                </select>
              </div>
              <div class="col-md-4">
                <label class="ai-field-label">모델</label>
                <input v-model.trim="aiSettings.model" type="text" class="form-control form-control-sm b2b-text-xs" :placeholder="defaultModelHint" />
              </div>
              <div class="col-md-4">
                <label class="ai-field-label">API Base URL <span class="text-theme-secondary">(선택 · 프록시)</span></label>
                <input v-model.trim="aiSettings.baseUrl" type="text" class="form-control form-control-sm b2b-text-xs" :placeholder="defaultBaseUrlHint" />
              </div>
              <div class="col-12">
                <label class="ai-field-label">API Key</label>
                <div class="input-group input-group-sm">
                  <input
                    v-model.trim="aiSettings.apiKey"
                    :type="showApiKey ? 'text' : 'password'"
                    class="form-control form-control-sm b2b-text-xs"
                    placeholder="sk-... (본인 API 키를 입력하세요)"
                    autocomplete="off"
                  />
                  <button class="btn btn-outline-secondary" type="button" @click="showApiKey = !showApiKey">
                    <i class="bi" :class="showApiKey ? 'bi-eye-slash' : 'bi-eye'"></i>
                  </button>
                </div>
              </div>
            </div>
            <div class="d-flex align-items-center justify-content-between mt-2 pt-2 border-top">
              <span class="b2b-text-xs" :class="aiTestState.cls">
                <i class="bi" :class="aiTestState.icon"></i> {{ aiTestState.text }}
              </span>
              <div class="d-flex gap-2">
                <button class="btn btn-sm btn-outline-danger b2b-text-xs" @click="clearAiSettings">키 삭제</button>
                <button class="btn btn-sm btn-outline-primary b2b-text-xs" :disabled="!aiSettings.apiKey || aiTesting" @click="testLlmConnection">
                  <span v-if="aiTesting" class="spinner-border spinner-border-sm"></span>
                  <i v-else class="bi bi-plug"></i> 연결 테스트
                </button>
                <button class="btn btn-sm btn-primary b2b-text-xs fw-bold" @click="saveAiSettings">저장</button>
              </div>
            </div>
          </div>
        </transition>

        <!-- ===== AI 모드 탭: 구성 / 분석 / 예측 ===== -->
        <div class="ai-mode-tabs mb-3">
          <button
            v-for="m in aiModes"
            :key="m.id"
            class="ai-mode-tab"
            :class="{ active: aiMode === m.id }"
            @click="setAiMode(m.id)"
          >
            <i class="bi" :class="m.icon"></i>
            <span>{{ m.label }}</span>
            <small class="ai-mode-tab__desc">{{ m.desc }}</small>
          </button>
        </div>

        <!-- AI 질의 프롬프트 입력창 -->
        <div class="row g-3">
          <div class="col-lg-7">
            <div class="ai-input-group d-flex align-items-center mb-3">
              <i class="bi bi-chat-left-dots text-primary ms-3 me-2"></i>
              <input
                v-model="aiPromptInput"
                type="text"
                class="form-control form-control-lg border-0 shadow-none bg-transparent b2b-text-sm"
                :placeholder="currentModePlaceholder"
                @keyup.enter="runAi"
              />
              <button class="btn btn-primary btn-sm me-2 px-3 py-2 fw-semibold rounded-2 d-flex align-items-center gap-1" @click="runAi" :disabled="aiAnalyzing">
                <span v-if="aiAnalyzing" class="spinner-border spinner-border-sm"></span>
                <i v-else class="bi" :class="currentMode.icon"></i>
                <span>{{ currentMode.runLabel }}</span>
              </button>
            </div>

            <!-- AI 추천 Quick Preset 버튼 칩 목록 (모드별) -->
            <div class="d-flex flex-wrap align-items-center gap-2 mb-2">
              <span class="b2b-text-xs fw-bold text-theme-secondary d-flex align-items-center gap-1">
                <i class="bi bi-lightning-charge-fill text-warning"></i>추천:
              </span>
              <button
                v-for="(preset, idx) in currentPresets"
                :key="idx"
                class="ai-preset-chip"
                @click="applyPreset(preset)"
              >
                {{ preset.title }}
              </button>
            </div>

            <!-- 오류/안내 메시지 -->
            <div v-if="aiError" class="ai-error-box b2b-text-xs mt-2">
              <i class="bi bi-exclamation-triangle-fill me-1"></i>{{ aiError }}
            </div>
            <div v-else-if="aiUsedLocal && aiLastRanMode" class="ai-local-note b2b-text-xs mt-2">
              <i class="bi bi-cpu me-1"></i>LLM 미연결 상태라 <b>로컬 추론 엔진</b>으로 처리했습니다. (LLM 설정에서 API 키를 넣으면 실제 LLM이 처리합니다)
            </div>
          </div>

          <!-- AI 결과 브리핑 카드 (모드별) -->
          <div class="col-lg-5">
            <div class="ai-result-box p-3 rounded-3 h-100 d-flex flex-column justify-content-between">
              <!-- ===== 구성(Configure) 결과 ===== -->
              <template v-if="aiMode === 'configure'">
                <div>
                  <div class="d-flex align-items-center justify-content-between mb-2">
                    <span class="b2b-text-xs fw-bold text-primary d-flex align-items-center gap-1">
                      <i class="bi bi-diagram-3"></i>피벗 구성 설계
                    </span>
                    <span v-if="aiResult" class="b2b-badge b2b-badge-success">설계 완료</span>
                  </div>
                  <p v-if="aiResult" class="b2b-text-xs text-theme-primary mb-2 line-clamp-3">{{ aiResult.explanation }}</p>
                  <div v-if="aiResult" class="d-flex flex-wrap gap-1 mb-2">
                    <span class="ai-tag tag-row">행: {{ aiResult.rowLabels.join(', ') || '없음' }}</span>
                    <span class="ai-tag tag-col">열: {{ aiResult.colLabels.join(', ') || '없음' }}</span>
                    <span class="ai-tag tag-val">값: {{ aiResult.valLabels.join(', ') || '없음' }}</span>
                    <span v-if="aiResult.filterSummary" class="ai-tag tag-filter">필터: {{ aiResult.filterSummary }}</span>
                  </div>
                  <p v-else class="b2b-text-xs text-theme-secondary mb-0">
                    자연어 질문을 입력하면 LLM이 사용 가능한 필드 스키마를 읽고 행·열·값·필터 축을 자동 설계합니다.
                  </p>
                </div>
                <div v-if="aiResult" class="d-flex align-items-center justify-content-end gap-2 mt-2 pt-2 border-top">
                  <button class="btn btn-sm btn-outline-secondary b2b-text-xs" @click="aiResult = null">초기화</button>
                  <button class="btn btn-sm btn-primary b2b-text-xs fw-bold px-3 d-inline-flex align-items-center gap-1" @click="applyAiResultToPivot">
                    <i class="bi bi-check2-circle"></i>피벗에 적용
                  </button>
                </div>
              </template>

              <!-- ===== 분석(Analyze) 결과 ===== -->
              <template v-else-if="aiMode === 'analyze'">
                <div>
                  <div class="d-flex align-items-center justify-content-between mb-2">
                    <span class="b2b-text-xs fw-bold text-primary d-flex align-items-center gap-1">
                      <i class="bi bi-graph-up-arrow"></i>데이터 분석 인사이트
                    </span>
                    <span v-if="aiInsight" class="b2b-badge b2b-badge-success">분석 완료</span>
                  </div>
                  <p v-if="aiInsight" class="b2b-text-xs fw-bold text-theme-primary mb-2">{{ aiInsight.headline }}</p>
                  <ul v-if="aiInsight" class="ai-insight-list mb-0">
                    <li v-for="(f, i) in aiInsight.findings" :key="i" class="b2b-text-xs">
                      <i class="bi bi-dot"></i>{{ f }}
                    </li>
                  </ul>
                  <p v-if="aiInsight && aiInsight.recommendation" class="ai-reco b2b-text-xs mt-2 mb-0">
                    <i class="bi bi-lightbulb-fill text-warning me-1"></i>{{ aiInsight.recommendation }}
                  </p>
                  <p v-if="!aiInsight" class="b2b-text-xs text-theme-secondary mb-0">
                    현재 피벗 결과를 LLM이 읽고 핵심 패턴·상위/하위·비중·이상치를 요약합니다. 먼저 값 필드를 배치한 뒤 실행하세요.
                  </p>
                </div>
                <div v-if="aiInsight" class="d-flex justify-content-end mt-2 pt-2 border-top">
                  <button class="btn btn-sm btn-outline-secondary b2b-text-xs" @click="aiInsight = null">초기화</button>
                </div>
              </template>

              <!-- ===== 예측(Predict) 결과 ===== -->
              <template v-else>
                <div>
                  <div class="d-flex align-items-center justify-content-between mb-2">
                    <span class="b2b-text-xs fw-bold text-primary d-flex align-items-center gap-1">
                      <i class="bi bi-activity"></i>추세 예측 (Forecast)
                    </span>
                    <span v-if="aiForecast" class="b2b-badge b2b-badge-success">{{ aiForecast.trendLabel }}</span>
                  </div>
                  <p v-if="aiForecast" class="b2b-text-xs text-theme-primary mb-2">{{ aiForecast.note }}</p>
                  <table v-if="aiForecast" class="ai-forecast-table b2b-text-xs mb-0">
                    <thead>
                      <tr><th>{{ aiForecast.periodLabel }}</th><th class="text-end">예측 {{ aiForecast.measureLabel }}</th></tr>
                    </thead>
                    <tbody>
                      <tr v-for="(p, i) in aiForecast.points" :key="i" :class="{ 'is-future': p.future }">
                        <td>{{ p.period }}<span v-if="p.future" class="ai-future-dot">예측</span></td>
                        <td class="text-end">{{ p.formatted }}</td>
                      </tr>
                    </tbody>
                  </table>
                  <p v-if="!aiForecast" class="b2b-text-xs text-theme-secondary mb-0">
                    시간·연도처럼 순서가 있는 행 필드(예: 입사연도)와 값 필드를 배치하면 LLM이 추세를 학습해 향후 값을 예측합니다.
                  </p>
                </div>
                <div v-if="aiForecast" class="d-flex justify-content-end mt-2 pt-2 border-top">
                  <button class="btn btn-sm btn-outline-secondary b2b-text-xs" @click="aiForecast = null">초기화</button>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- ============ 메인 피벗 작업 영역 ============ -->
    <div class="row g-3 align-items-stretch flex-grow-1">
      <!-- ============ 좌측: RealPivot2 필드 설정 패널 ============ -->
      <div class="col-xl-3 col-lg-4">
        <div class="b2b-card h-100 d-flex flex-column shadow-sm border-0">
          <div class="b2b-card-header bg-theme-subcard py-2 px-3 d-flex align-items-center justify-content-between">
            <span class="b2b-text-h2 text-theme-primary d-flex align-items-center gap-2">
              <i class="bi bi-sliders text-primary"></i>피벗 필드 패널
            </span>
            <span class="b2b-badge b2b-badge-secondary">드래그 &amp; 드롭</span>
          </div>

          <div class="b2b-card-body p-3 d-flex flex-column gap-3 overflow-auto flex-grow-1">
            <!-- 필드 검색 박스 -->
            <div class="input-group input-group-sm">
              <span class="input-group-text bg-theme-subcard border-end-0 text-theme-secondary">
                <i class="bi bi-search"></i>
              </span>
              <input
                v-model="fieldSearchQuery"
                type="text"
                class="form-control border-start-0 bg-theme-subcard text-theme-primary"
                placeholder="필드명 검색..."
              />
              <button v-if="fieldSearchQuery" class="btn btn-outline-secondary border-start-0" @click="fieldSearchQuery = ''">
                <i class="bi bi-x"></i>
              </button>
            </div>

            <!-- ① 사용 가능한 필드 (Pool) -->
            <div
              class="pivot-zone pivot-zone--pool"
              :class="{ 'pivot-zone--over': dragOverZone === 'none' }"
              @dragover.prevent="dragOverZone = 'none'"
              @dragleave="dragOverZone = null"
              @drop="onDropZone('none', $event)"
            >
              <div class="pivot-zone__title">
                <i class="bi bi-inbox me-1"></i>사용 가능한 필드 ({{ filteredPoolFields.length }})
              </div>
              <div class="d-flex flex-wrap gap-1">
                <div
                  v-for="f in filteredPoolFields"
                  :key="f.id"
                  class="pivot-chip"
                  :class="`pivot-chip--${f.kind}`"
                  draggable="true"
                  @dragstart="onDragStart(f, $event)"
                  @dragend="dragOverZone = null"
                  @click="cycleZone(f)"
                  :title="'클릭: 다음 영역으로 이동 · 드래그해서 배치'"
                >
                  <i class="bi bi-grip-vertical opacity-50"></i>
                  <span>{{ f.label }}</span>
                  <span class="pivot-chip__type">{{ f.kind === 'measure' ? (f.numeric ? '💲값' : '🔢값') : '🏷️분류' }}</span>
                </div>
                <span v-if="filteredPoolFields.length === 0" class="text-theme-secondary b2b-text-xs py-1">
                  {{ fieldSearchQuery ? '검색된 필드가 없습니다.' : '모든 필드가 배치되었습니다.' }}
                </span>
              </div>
            </div>

            <!-- ② 필터(Filter) 존 (RealPivot2 Spec) -->
            <div
              class="pivot-zone pivot-zone--filter"
              :class="{ 'pivot-zone--over': dragOverZone === 'filter' }"
              @dragover.prevent="dragOverZone = 'filter'"
              @dragleave="dragOverZone = null"
              @drop="onDropZone('filter', $event)"
            >
              <div class="pivot-zone__title">
                <i class="bi bi-funnel me-1 text-warning"></i>필터 (Filters)
                <span class="text-theme-secondary">· 조건부 데이터 정률 선택</span>
              </div>
              <div class="d-flex flex-column gap-2">
                <div
                  v-for="f in filterFields"
                  :key="f.id"
                  class="pivot-filter-chip p-2 rounded-2 border bg-theme-card"
                  draggable="true"
                  @dragstart="onDragStart(f, $event)"
                >
                  <div class="d-flex align-items-center justify-content-between mb-1">
                    <span class="fw-bold b2b-text-xs d-flex align-items-center gap-1">
                      <i class="bi bi-grip-vertical opacity-50"></i>{{ f.label }}
                    </span>
                    <button class="pivot-chip__remove" title="제거" @click.stop="removeField(f)">
                      <i class="bi bi-x-lg"></i>
                    </button>
                  </div>
                  <!-- 필터 값 선택 드롭다운 -->
                  <select
                    class="form-select form-select-sm b2b-text-xs py-1"
                    :value="activeFilters[f.id] || ''"
                    @change="setFilterValue(f.id, $event.target.value)"
                  >
                    <option value="">전체 (All {{ f.label }})</option>
                    <option v-for="opt in getDistinctFieldValues(f.id)" :key="opt" :value="opt">
                      {{ opt }}
                    </option>
                  </select>
                </div>
                <span v-if="filterFields.length === 0" class="pivot-zone__hint">필터를 적용할 분류 필드를 놓으세요</span>
              </div>
            </div>

            <!-- ③ 행(Rows) 존 -->
            <div
              class="pivot-zone pivot-zone--row"
              :class="{ 'pivot-zone--over': dragOverZone === 'row' }"
              @dragover.prevent="dragOverZone = 'row'"
              @dragleave="dragOverZone = null"
              @drop="onDropZone('row', $event)"
            >
              <div class="pivot-zone__title">
                <i class="bi bi-list-nested me-1 text-primary"></i>행 (Rows)
                <span class="text-theme-secondary">· 위→아래 중첩</span>
              </div>
              <div class="d-flex flex-wrap gap-1">
                <div
                  v-for="f in rowFields"
                  :key="f.id"
                  class="pivot-chip pivot-chip--row"
                  draggable="true"
                  @dragstart="onDragStart(f, $event)"
                  @dragover.prevent.stop
                  @drop.stop="onDropBefore(f, $event)"
                >
                  <i class="bi bi-grip-vertical opacity-50"></i>
                  <span>{{ f.label }}</span>
                  <button class="pivot-chip__remove" title="제거" @click.stop="removeField(f)">
                    <i class="bi bi-x-lg"></i>
                  </button>
                </div>
              </div>
              <span v-if="rowFields.length === 0" class="pivot-zone__hint">분류 필드를 놓으세요</span>
            </div>

            <!-- ④ 열(Columns) 존 -->
            <div
              class="pivot-zone pivot-zone--col"
              :class="{ 'pivot-zone--over': dragOverZone === 'col' }"
              @dragover.prevent="dragOverZone = 'col'"
              @dragleave="dragOverZone = null"
              @drop="onDropZone('col', $event)"
            >
              <div class="pivot-zone__title">
                <i class="bi bi-layout-three-columns me-1 text-info"></i>열 (Columns)
                <span class="text-theme-secondary">· 좌→우 중첩</span>
              </div>
              <div class="d-flex flex-wrap gap-1">
                <div
                  v-for="f in colFields"
                  :key="f.id"
                  class="pivot-chip pivot-chip--col"
                  draggable="true"
                  @dragstart="onDragStart(f, $event)"
                  @dragover.prevent.stop
                  @drop.stop="onDropBefore(f, $event)"
                >
                  <i class="bi bi-grip-vertical opacity-50"></i>
                  <span>{{ f.label }}</span>
                  <button class="pivot-chip__remove" title="제거" @click.stop="removeField(f)">
                    <i class="bi bi-x-lg"></i>
                  </button>
                </div>
              </div>
              <span v-if="colFields.length === 0" class="pivot-zone__hint">분류 필드를 놓으세요</span>
            </div>

            <!-- ⑤ 값(Values) 존 -->
            <div
              class="pivot-zone pivot-zone--value"
              :class="{ 'pivot-zone--over': dragOverZone === 'value' }"
              @dragover.prevent="dragOverZone = 'value'"
              @dragleave="dragOverZone = null"
              @drop="onDropZone('value', $event)"
            >
              <div class="pivot-zone__title">
                <i class="bi bi-calculator me-1 text-success"></i>값 (Values)
                <span class="text-theme-secondary">· 집계 함수 지정</span>
              </div>
              <div class="d-flex flex-column gap-1">
                <div
                  v-for="f in valueFields"
                  :key="f.id"
                  class="pivot-value-row"
                  draggable="true"
                  @dragstart="onDragStart(f, $event)"
                >
                  <i class="bi bi-grip-vertical opacity-50"></i>
                  <select
                    class="form-select form-select-sm pivot-agg-select"
                    :value="f.agg"
                    @change="setAgg(f, $event.target.value)"
                    @click.stop
                  >
                    <option v-for="a in aggOptions(f)" :key="a.value" :value="a.value">{{ a.label }}</option>
                  </select>
                  <span class="pivot-value-row__name text-truncate">{{ f.label }}</span>
                  <button class="pivot-chip__remove" title="제거" @click.stop="removeField(f)">
                    <i class="bi bi-x-lg"></i>
                  </button>
                </div>
                <span v-if="valueFields.length === 0" class="pivot-zone__hint">집계할 값 필드를 놓으세요</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ============ 우측: 피벗 매트릭스 결과 + 차트 + 코드 ============ -->
      <div class="col-xl-9 col-lg-8 d-flex flex-column gap-3">
        <!-- 피벗 미니 차트 뷰 (옵션) -->
        <transition name="fade">
          <div v-if="showChart && pivot.rowKeys.length > 0" class="b2b-card p-3 shadow-sm border-0">
            <div class="d-flex align-items-center justify-content-between mb-2">
              <span class="b2b-text-h2 text-theme-primary d-flex align-items-center gap-2">
                <i class="bi bi-bar-chart-fill text-primary"></i>피벗 매트릭스 시각화 차트
              </span>
              <span class="b2b-text-xs text-theme-secondary">상위 8개 행 요약</span>
            </div>
            <div class="pivot-mini-chart d-flex align-items-end gap-2 pt-3 pb-1 px-2 border-bottom">
              <div
                v-for="(bar, idx) in chartBarData"
                :key="idx"
                class="pivot-chart-col flex-grow-1 text-center"
              >
                <div class="pivot-chart-bar-wrap d-flex flex-column justify-content-end align-items-center" style="height: 100px;">
                  <span class="b2b-text-xs fw-bold text-primary mb-1">{{ bar.formattedVal }}</span>
                  <div
                    class="pivot-chart-bar rounded-top w-100"
                    :style="{ height: `${bar.pct}%` }"
                    :title="`${bar.label}: ${bar.formattedVal}`"
                  ></div>
                </div>
                <span class="b2b-text-xs text-theme-secondary text-truncate d-block mt-2" style="max-width: 90px;">
                  {{ bar.label }}
                </span>
              </div>
            </div>
          </div>
        </transition>

        <!-- 피벗 결과 그리드 카드 -->
        <div class="b2b-card d-flex flex-column shadow-sm border-0 flex-grow-1">
          <div class="b2b-card-header bg-theme-card py-2 px-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
            <span class="b2b-text-h2 text-theme-primary d-flex align-items-center gap-2">
              <i class="bi bi-table text-warning"></i>피벗 결과 매트릭스
            </span>
            <div class="d-flex align-items-center gap-3">
              <span v-if="activeFilterCount > 0" class="badge bg-warning-subtle text-warning border border-warning-subtle">
                <i class="bi bi-funnel-fill me-1"></i>필터 적용 중 ({{ activeFilterCount }}개)
              </span>
              <span class="text-theme-secondary b2b-text-sm">
                {{ pivot.rowKeys.length }}행 × {{ pivot.leafCols.length }}열 · 필터링 집계 데이터 {{ filteredDataset.length }} / {{ dataset.length }}건
              </span>
            </div>
          </div>

          <div class="b2b-card-body p-0 flex-grow-1">
            <div v-if="valueFields.length === 0" class="pivot-empty">
              <i class="bi bi-arrow-left-circle me-2"></i>좌측 <b>값(Values)</b> 영역에 필드를 배치하면 집계가 시작됩니다.
            </div>

            <div v-else class="pivot-table-scroll" :class="`layout-${layoutMode}`">
              <table class="pivot-table tabular-nums">
                <thead>
                  <!-- 상단: 열 필드 그룹 헤더 -->
                  <tr>
                    <th class="pivot-corner" :rowspan="pivot.headerDepth" :colspan="1">
                      {{ pivot.rowHeaderLabel }}
                    </th>
                    <template v-if="pivot.hasCols">
                      <th
                        v-for="(g, i) in pivot.colGroups"
                        :key="'cg' + i"
                        class="pivot-colgroup"
                        :colspan="g.colspan"
                      >{{ g.label }}</th>
                      <th class="pivot-colgroup pivot-total-head" :colspan="valueFields.length">총계</th>
                    </template>
                    <template v-else>
                      <th
                        v-for="(lc, i) in pivot.leafCols"
                        :key="'m' + i"
                        class="pivot-measure-head"
                      >{{ lc.headerLabel }}</th>
                    </template>
                  </tr>
                  <!-- 하단: 측정값 라벨 (열 필드가 있을 때만) -->
                  <tr v-if="pivot.hasCols">
                    <th
                      v-for="(lc, i) in pivot.leafColsWithTotal"
                      :key="'ml' + i"
                      class="pivot-measure-head"
                      :class="{ 'pivot-total-head': lc.isTotal }"
                    >{{ lc.headerLabel }}</th>
                  </tr>
                </thead>

                <tbody>
                  <template v-for="(row, rIdx) in pivot.bodyRows" :key="'r' + rIdx">
                    <!-- 소계 행 -->
                    <tr v-if="row.type === 'subtotal'" class="pivot-subtotal-row">
                      <th class="pivot-rowhead">
                        <i class="bi bi-arrow-return-right me-1 text-primary opacity-75"></i>{{ row.label }}
                      </th>
                      <td
                        v-for="(v, cIdx) in row.cells"
                        :key="cIdx"
                        :class="{ 'pivot-total-cell': pivot.leafColsWithTotal[cIdx].isTotal }"
                        :style="getHeatmapStyle(v, cIdx)"
                      >{{ fmtCell(v, cIdx) }}</td>
                    </tr>
                    <!-- 데이터 행 -->
                    <tr v-else class="pivot-data-row">
                      <th class="pivot-rowhead" v-html="row.labelHtml"></th>
                      <td
                        v-for="(v, cIdx) in row.cells"
                        :key="cIdx"
                        :class="{ 'pivot-total-cell': pivot.leafColsWithTotal[cIdx].isTotal }"
                        :style="getHeatmapStyle(v, cIdx)"
                      >{{ fmtCell(v, cIdx) }}</td>
                    </tr>
                  </template>
                </tbody>

                <tfoot>
                  <tr class="pivot-grand-row">
                    <th class="pivot-rowhead">총계 (Grand Total)</th>
                    <td
                      v-for="(v, cIdx) in pivot.footer"
                      :key="cIdx"
                      :class="{ 'pivot-total-cell': pivot.leafColsWithTotal[cIdx].isTotal }"
                    >{{ fmtCell(v, cIdx) }}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        <!-- 하단 좌우: RealPivot2 SDK 연동 코드 + 스펙 비교 -->
        <div class="row g-3">
          <div class="col-lg-6">
            <div class="b2b-card h-100 d-flex flex-column shadow-sm border-0">
              <div class="b2b-card-header bg-theme-subcard py-2 px-3 d-flex align-items-center justify-content-between">
                <span class="b2b-text-h2 text-theme-primary d-flex align-items-center gap-2">
                  <i class="bi bi-code-slash text-primary"></i>RealPivot2 연동 API 스니펫
                </span>
                <button class="btn-b2b-action btn-sm" @click="copyCode">
                  <i class="bi bi-clipboard"></i><span>{{ copied ? '복사됨' : '복사' }}</span>
                </button>
              </div>
              <div class="b2b-card-body p-0 flex-grow-1">
                <pre class="pivot-code"><code>{{ sdkCode }}</code></pre>
              </div>
            </div>
          </div>

          <div class="col-lg-6">
            <div class="b2b-card h-100 d-flex flex-column shadow-sm border-0">
              <div class="b2b-card-header bg-theme-subcard py-2 px-3">
                <span class="b2b-text-h2 text-theme-primary d-flex align-items-center gap-2">
                  <i class="bi bi-check2-square text-success"></i>RealPivot2 제공 기능 가이드
                </span>
              </div>
              <div class="b2b-card-body p-0">
                <table class="table table-sm align-middle mb-0 b2b-text-sm text-center pivot-compare">
                  <thead>
                    <tr>
                      <th class="text-start">기능 항목</th>
                      <th>현재 피벗 엔진</th>
                      <th>RealPivot2 라이선스</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td class="text-start fw-semibold">AI 자연어 자동 분석 패널</td>
                      <td><span class="b2b-badge b2b-badge-success">내장 지원</span></td>
                      <td><span class="b2b-badge b2b-badge-primary">신규 연동 (7편)</span></td>
                    </tr>
                    <tr>
                      <td class="text-start fw-semibold">동적 행/열/값/필터 드래그</td>
                      <td>⭕</td><td>⭕</td>
                    </tr>
                    <tr>
                      <td class="text-start fw-semibold">조건부 매트릭스 히트맵</td>
                      <td>⭕</td><td>⭕</td>
                    </tr>
                    <tr>
                      <td class="text-start fw-semibold">대용량(수십만 행) 집계</td>
                      <td>△ 웹워커 권장</td>
                      <td>⭕ 가상화 내장</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
const AGG_LABELS = { sum: '합계', avg: '평균', min: '최소', max: '최대', count: '건수' }

const FALLBACK_ROWS = [
  { userId: 'u1', name: '김철수', dept: '플랫폼개발팀', role: 'Backend', region: '서울', salary: 6200, joinYear: 2019 },
  { userId: 'u2', name: '이영희', dept: '플랫폼개발팀', role: 'Frontend', region: '판교', salary: 5400, joinYear: 2021 },
  { userId: 'u3', name: '박민수', dept: '데이터팀', role: 'Data', region: '서울', salary: 7100, joinYear: 2018 },
  { userId: 'u4', name: '정수진', dept: '보안팀', role: 'Security', region: '부산', salary: 6800, joinYear: 2020 },
  { userId: 'u5', name: '홍길동', dept: '인프라팀', role: 'DevOps', region: '대전', salary: 5900, joinYear: 2022 },
  { userId: 'u6', name: '강지훈', dept: 'QA팀', role: 'QA', region: '판교', salary: 4800, joinYear: 2023 },
  { userId: 'u7', name: '윤아름', dept: '플랫폼개발팀', role: 'Frontend', region: '서울', salary: 6100, joinYear: 2020 },
  { userId: 'u8', name: '조현우', dept: '데이터팀', role: 'Data', region: '판교', salary: 7500, joinYear: 2017 },
  { userId: 'u9', name: '최동현', dept: '보안팀', role: 'Security', region: '서울', salary: 6400, joinYear: 2021 },
]

// AI Quick Presets (RealPivot2 Reference)
const AI_PRESETS = [
  {
    title: '⚡ 부서별 · 근무지별 연봉 합계',
    prompt: '부서별 근무지별 연봉 합계를 계산해서 보여줘',
    rowIds: ['dept'],
    colIds: ['region'],
    valConfigs: [{ id: 'salary', agg: 'sum' }],
    filterConfigs: {},
    explanation: '행 축에 부서, 열 축에 근무지를 배치하고 연봉의 합계를 계산하도록 교차 표를 구성했습니다.'
  },
  {
    title: '⚡ 입사연도별 인원수 및 평균 연봉',
    prompt: '입사연도별 인원수와 평균 연봉을 계산해줘',
    rowIds: ['joinYear'],
    colIds: [],
    valConfigs: [{ id: 'headcount', agg: 'count' }, { id: 'salary', agg: 'avg' }],
    filterConfigs: {},
    explanation: '입사연도별로 사원 인원수와 평균 연봉을 추적할 수 있도록 집계했습니다.'
  },
  {
    title: '⚡ 서울 지역 부서별 최고 연봉',
    prompt: '서울 지역 사원들의 부서별 직군별 최고 연봉을 보여줘',
    rowIds: ['dept', 'role'],
    colIds: [],
    valConfigs: [{ id: 'salary', agg: 'max' }],
    filterConfigs: { region: '서울' },
    explanation: '근무지가 서울인 데이터를 필터링하고 부서 및 직군 중첩 행 축에서 최고 연봉을 추출했습니다.'
  },
  {
    title: '⚡ 근무지별 평균 연봉',
    prompt: '근무지별 평균 연봉 합계와 인원수를 보여줘',
    rowIds: ['region'],
    colIds: [],
    valConfigs: [{ id: 'salary', agg: 'avg' }, { id: 'headcount', agg: 'count' }],
    filterConfigs: {},
    explanation: '근무지별 평균 연봉 수준과 해당 지역 인원수를 보여주는 매트릭스를 설정했습니다.'
  }
]

// ===== AI 모드 (RealPivot2 7편: 구성 변경 / 분석 / 예측) =====
const AI_MODES = [
  { id: 'configure', label: '구성 변경', desc: '자연어→피벗', icon: 'bi-diagram-3', runLabel: '구성 생성',
    placeholder: '예: 부서별 근무지별 연봉 합계를 보여줘 (또는 서울 지역 입사연도별 평균 연봉)' },
  { id: 'analyze', label: '데이터 분석', desc: '인사이트 요약', icon: 'bi-graph-up-arrow', runLabel: '분석 실행',
    placeholder: '예: 이 표에서 가장 눈에 띄는 특징과 상위/하위를 정리해줘' },
  { id: 'predict', label: '예측', desc: '추세 Forecast', icon: 'bi-activity', runLabel: '예측 실행',
    placeholder: '예: 이 추세라면 다음 3년간 연봉은 어떻게 될까?' },
]

// 분석 모드 추천 프롬프트
const ANALYZE_PRESETS = [
  { title: '📊 핵심 요약', prompt: '현재 피벗 결과의 핵심 특징을 3가지로 요약해줘' },
  { title: '🏆 상위/하위', prompt: '값이 가장 큰 그룹과 가장 작은 그룹을 알려줘' },
  { title: '⚖️ 비중 분석', prompt: '각 그룹이 전체에서 차지하는 비중을 분석해줘' },
]

// 예측 모드 추천 프롬프트
const PREDICT_PRESETS = [
  { title: '📈 향후 3기간', prompt: '현재 추세로 향후 3개 기간의 값을 예측해줘' },
  { title: '🔮 추세 방향', prompt: '값이 증가 추세인지 감소 추세인지 예측해줘' },
]

// 공급자별 기본값
const PROVIDER_DEFAULTS = {
  openai: { model: 'gpt-4o-mini', baseUrl: 'https://api.openai.com/v1', label: 'OpenAI' },
  anthropic: { model: 'claude-sonnet-4-5', baseUrl: 'https://api.anthropic.com', label: 'Claude' },
}

const AI_SETTINGS_KEY = 'realpivot_ai_settings'

export default {
  name: 'RealPivotPage',
  data() {
    return {
      dataset: [],
      loading: true,
      dragOverZone: null,
      showSubtotals: true,
      showHeatmap: false,
      showChart: false,
      showAiPanel: true,
      selectedTheme: 'emerald', // emerald | indigo | dark | light
      layoutMode: 'tabular', // tabular | compact | tree
      fieldSearchQuery: '',
      copied: false,

      // AI 관련 상태
      aiPromptInput: '',
      aiAnalyzing: false,
      aiResult: null,          // 구성(configure) 결과
      aiInsight: null,         // 분석(analyze) 결과
      aiForecast: null,        // 예측(predict) 결과
      aiPresets: AI_PRESETS,
      aiModes: AI_MODES,
      aiMode: 'configure',     // configure | analyze | predict
      aiError: '',
      aiUsedLocal: false,      // 마지막 실행이 로컬 폴백이었는지
      aiLastRanMode: false,    // 한 번이라도 실행했는지 (안내문 표시용)

      // LLM 연결 설정 (BYO Key)
      showAiSettings: false,
      showApiKey: false,
      aiTesting: false,
      aiTestResult: null,      // null | 'ok' | 'fail'
      aiSettings: { provider: 'openai', model: '', baseUrl: '', apiKey: '' },

      // Active filters map: { fieldId: filterValue }
      activeFilters: {},

      // zone: 'none' | 'filter' | 'row' | 'col' | 'value'
      fields: [
        { id: 'dept', label: '부서', kind: 'dim', numeric: false, zone: 'row' },
        { id: 'region', label: '근무지', kind: 'dim', numeric: false, zone: 'col' },
        { id: 'role', label: '직군', kind: 'dim', numeric: false, zone: 'none' },
        { id: 'joinYear', label: '입사연도', kind: 'dim', numeric: true, zone: 'none' },
        { id: 'name', label: '사원이름', kind: 'dim', numeric: false, zone: 'none' },
        { id: 'headcount', label: '인원수', kind: 'measure', numeric: false, zone: 'value', agg: 'count' },
        { id: 'salary', label: '연봉(만원)', kind: 'measure', numeric: true, zone: 'value', agg: 'sum' },
      ],
    }
  },
  mounted() {
    this.loadData()
    this.loadAiSettings()
  },
  computed: {
    poolFields() { return this.fields.filter(f => f.zone === 'none') },
    filteredPoolFields() {
      if (!this.fieldSearchQuery) return this.poolFields
      const q = this.fieldSearchQuery.toLowerCase()
      return this.poolFields.filter(f => f.label.toLowerCase().includes(q) || f.id.toLowerCase().includes(q))
    },
    filterFields() { return this.fields.filter(f => f.zone === 'filter') },
    rowFields() { return this.fields.filter(f => f.zone === 'row') },
    colFields() { return this.fields.filter(f => f.zone === 'col') },
    valueFields() { return this.fields.filter(f => f.zone === 'value') },

    activeFilterCount() {
      return Object.values(this.activeFilters).filter(v => Boolean(v)).length
    },

    currentThemeName() {
      const names = { emerald: 'RealGrid Emerald', indigo: 'Corporate Indigo', dark: 'Dark Slate', light: 'Clean Light' }
      return names[this.selectedTheme] || 'Emerald'
    },

    layoutModeLabel() {
      const labels = { tabular: '테이블형', compact: '압축형', tree: '트리형' }
      return labels[this.layoutMode] || '테이블형'
    },

    // ---- AI 패널 파생 상태 ----
    currentMode() {
      return this.aiModes.find(m => m.id === this.aiMode) || this.aiModes[0]
    },
    currentModePlaceholder() {
      return this.currentMode.placeholder
    },
    currentPresets() {
      if (this.aiMode === 'analyze') return ANALYZE_PRESETS
      if (this.aiMode === 'predict') return PREDICT_PRESETS
      return this.aiPresets
    },
    aiConnected() {
      return Boolean(this.aiSettings.apiKey)
    },
    providerLabel() {
      return (PROVIDER_DEFAULTS[this.aiSettings.provider] || {}).label || 'LLM'
    },
    defaultModelHint() {
      return (PROVIDER_DEFAULTS[this.aiSettings.provider] || {}).model || ''
    },
    defaultBaseUrlHint() {
      return (PROVIDER_DEFAULTS[this.aiSettings.provider] || {}).baseUrl || ''
    },
    aiTestState() {
      if (this.aiTesting) return { text: '연결 확인 중...', icon: 'bi-hourglass-split', cls: 'text-theme-secondary' }
      if (this.aiTestResult === 'ok') return { text: '연결 성공 · LLM 응답 확인됨', icon: 'bi-check-circle-fill', cls: 'text-success' }
      if (this.aiTestResult === 'fail') return { text: '연결 실패 · 키/모델/URL 또는 CORS를 확인하세요', icon: 'bi-x-circle-fill', cls: 'text-danger' }
      if (this.aiConnected) return { text: '키 저장됨 · 연결 테스트를 권장합니다', icon: 'bi-plug-fill', cls: 'text-theme-secondary' }
      return { text: 'API 키 미입력 · 로컬 엔진으로 동작합니다', icon: 'bi-info-circle', cls: 'text-theme-secondary' }
    },

    // 필터링 적용된 원본 데이터셋
    filteredDataset() {
      const activeFilterEntries = Object.entries(this.activeFilters).filter(([_, val]) => Boolean(val))
      if (activeFilterEntries.length === 0) return this.dataset

      return this.dataset.filter(row => {
        return activeFilterEntries.every(([fieldId, filterVal]) => {
          return String(row[fieldId]) === String(filterVal)
        })
      })
    },

    // ---- 핵심 피벗 계산 엔진 ----
    pivot() {
      const rF = this.rowFields
      const cF = this.colFields
      const vF = this.valueFields
      const data = this.filteredDataset
      const hasCols = cF.length > 0

      if (vF.length === 0) {
        return {
          rowKeys: [], leafCols: [], leafColsWithTotal: [], colGroups: [],
          bodyRows: [], footer: [], hasCols, headerDepth: 1,
          rowHeaderLabel: '전체',
        }
      }

      const SEP = '␟'
      const distinct = (fieldsArr) => {
        if (fieldsArr.length === 0) return [[]]
        const seen = new Map()
        data.forEach(r => {
          const key = fieldsArr.map(f => r[f.id]).join(SEP)
          if (!seen.has(key)) {
            seen.set(key, fieldsArr.map(f => ({ id: f.id, value: r[f.id] })))
          }
        })
        return [...seen.values()].sort((a, b) => {
          for (let i = 0; i < a.length; i++) {
            const c = String(a[i].value).localeCompare(String(b[i].value), 'ko')
            if (c !== 0) return c
          }
          return 0
        })
      }

      const rowKeys = distinct(rF)
      const colKeys = distinct(cF)

      const leafCols = []
      colKeys.forEach(ck => vF.forEach(m => {
        leafCols.push({
          colKey: ck, measure: m, isTotal: false,
          headerLabel: `${AGG_LABELS[m.agg]}·${m.label}`,
        })
      }))

      const totalLeafs = vF.map(m => ({
        colKey: null, measure: m, isTotal: true,
        headerLabel: `${AGG_LABELS[m.agg]}·${m.label}`,
      }))
      const leafColsWithTotal = hasCols ? [...leafCols, ...totalLeafs] : leafCols

      const colGroups = colKeys.map(ck => ({
        label: ck.map(x => x.value).join(' · '),
        colspan: vF.length,
      }))

      const aggregate = (rows, m) => {
        if (m.agg === 'count') return rows.length
        if (rows.length === 0) return null
        const nums = rows.map(r => Number(r[m.id]) || 0)
        switch (m.agg) {
          case 'avg': return nums.reduce((a, b) => a + b, 0) / nums.length
          case 'min': return Math.min(...nums)
          case 'max': return Math.max(...nums)
          case 'sum':
          default: return nums.reduce((a, b) => a + b, 0)
        }
      }

      const match = (r, keyArr) => keyArr.every(k => r[k.id] === k.value)

      const cellsFor = (rowKeyArr) => {
        const rowSubset = data.filter(r => match(r, rowKeyArr))
        return leafColsWithTotal.map(lc => {
          const subset = lc.isTotal
            ? rowSubset
            : rowSubset.filter(r => match(r, lc.colKey))
          return aggregate(subset, lc.measure)
        })
      }

      const bodyRows = []
      const doSub = this.showSubtotals && rF.length >= 2
      let prevFirst = null

      rowKeys.forEach(rk => {
        if (doSub && prevFirst !== null && rk[0].value !== prevFirst) {
          bodyRows.push(this.buildSubtotal(prevFirst, rF, leafColsWithTotal, data, aggregate, match))
        }

        let labelHtml = ''
        if (this.layoutMode === 'tree') {
          const indent = (rk.length - 1) * 16
          const leafVal = rk[rk.length - 1].value
          labelHtml = `<div style="padding-left: ${indent}px;"><i class="bi bi-folder2-open me-1 text-primary"></i><span class="pivot-lvl-leaf">${this.escapeHtml(leafVal)}</span></div>`
        } else {
          labelHtml = rk.map((x, i) => {
            const cls = i === rk.length - 1 ? 'pivot-lvl-leaf' : 'pivot-lvl-parent'
            return `<span class="${cls}">${this.escapeHtml(x.value)}</span>`
          }).join('<span class="pivot-lvl-sep">›</span>')
        }

        bodyRows.push({ type: 'data', labelHtml, cells: cellsFor(rk) })
        prevFirst = rF.length ? rk[0].value : null
      })

      if (doSub && prevFirst !== null) {
        bodyRows.push(this.buildSubtotal(prevFirst, rF, leafColsWithTotal, data, aggregate, match))
      }

      const footer = leafColsWithTotal.map(lc => {
        const subset = lc.isTotal ? data : data.filter(r => match(r, lc.colKey))
        return aggregate(subset, lc.measure)
      })

      return {
        rowKeys, colKeys, leafCols, leafColsWithTotal, colGroups, bodyRows, footer,
        hasCols,
        headerDepth: hasCols ? 2 : 1,
        rowHeaderLabel: rF.map(f => f.label).join(' / ') || '전체',
      }
    },

    // 히트맵용 셀 수치 범위 계산
    cellValueBounds() {
      let min = Infinity
      let max = -Infinity
      if (!this.pivot.bodyRows) return { min: 0, max: 1 }

      this.pivot.bodyRows.forEach(row => {
        row.cells.forEach(v => {
          if (v !== null && v !== undefined && !isNaN(v)) {
            if (v < min) min = v
            if (v > max) max = v
          }
        })
      })

      if (min === Infinity) { min = 0; max = 1 }
      return { min, max }
    },

    // 피벗 차트 시각화 데이터 (상위 8행)
    chartBarData() {
      if (!this.pivot.bodyRows || this.pivot.bodyRows.length === 0) return []
      const rows = this.pivot.bodyRows.filter(r => r.type === 'data').slice(0, 8)
      let maxVal = 0

      const dataList = rows.map(r => {
        const label = r.labelHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
        const val = r.cells[0] || 0
        if (val > maxVal) maxVal = val
        return { label, val }
      })

      return dataList.map(item => ({
        label: item.label,
        val: item.val,
        formattedVal: this.fmtCell(item.val, 0),
        pct: maxVal > 0 ? Math.max(8, Math.round((item.val / maxVal) * 100)) : 10
      }))
    },

    sdkCode() {
      const rf = this.rowFields.map(f => `"${f.id}"`).join(', ') || '/* 없음 */'
      const cf = this.colFields.map(f => `"${f.id}"`).join(', ') || '/* 없음 */'
      const filters = Object.entries(this.activeFilters)
        .filter(([_, v]) => Boolean(v))
        .map(([k, v]) => `  "${k}": "${v}"`)
        .join(',\n')
      const vf = this.valueFields
        .map(f => `  { field: "${f.id}", agg: "${f.agg}" }`)
        .join(',\n') || '  /* 값 필드를 추가하세요 */'

      return [
        '// RealPivot2 AI Spec Code Snippet',
        'const pivot = RealPivot.create("#pivot-container", {',
        `  theme: "${this.selectedTheme}",`,
        `  layoutMode: "${this.layoutMode}",`,
        `  heatmap: ${this.showHeatmap},`,
        '})',
        'pivot.setRows([' + rf + '])',
        'pivot.setCols([' + cf + '])',
        'pivot.setValues([\n' + vf + '\n])',
        filters ? 'pivot.setFilters({\n' + filters + '\n})' : '// 필터 조건 없음',
        'pivot.render()',
      ].join('\n')
    },
  },
  methods: {
    async loadData() {
      this.loading = true
      try {
        const url = (import.meta.env?.BASE_URL ?? '/') + 'db.json'
        const res = await fetch(url)
        if (!res.ok) throw new Error('db.json fetch 실패')
        const data = await res.json()
        const rows = Array.isArray(data) ? data : (data.users || [])
        this.dataset = rows.length ? rows : FALLBACK_ROWS
      } catch (e) {
        console.warn('[RealPivot] db.json 로드 실패 → 폴백 데이터 사용:', e)
        this.dataset = FALLBACK_ROWS
      } finally {
        this.loading = false
      }
    },

    getDistinctFieldValues(fieldId) {
      const set = new Set()
      this.dataset.forEach(row => {
        if (row[fieldId] !== undefined && row[fieldId] !== null) {
          set.add(String(row[fieldId]))
        }
      })
      return Array.from(set).sort()
    },

    setFilterValue(fieldId, val) {
      this.activeFilters = { ...this.activeFilters, [fieldId]: val }
    },

    aggOptions(f) {
      const canMath = f.kind === 'measure' && f.numeric !== false
      const keys = canMath ? ['sum', 'avg', 'min', 'max', 'count'] : ['count']
      return keys.map(k => ({ value: k, label: AGG_LABELS[k] }))
    },

    setAgg(f, agg) {
      const target = this.fields.find(x => x.id === f.id)
      if (target) target.agg = agg
    },

    // 히트맵 스타일 셀 배경색 계산
    getHeatmapStyle(val, cIdx) {
      if (!this.showHeatmap || val === null || val === undefined || isNaN(val)) return {}
      const { min, max } = this.cellValueBounds
      if (max === min) return {}

      const ratio = Math.min(1, Math.max(0, (val - min) / (max - min)))
      const colorMap = {
        emerald: `rgba(16, 185, 129, ${0.1 + ratio * 0.45})`,
        indigo: `rgba(99, 102, 241, ${0.1 + ratio * 0.45})`,
        dark: `rgba(59, 130, 246, ${0.15 + ratio * 0.5})`,
        light: `rgba(245, 158, 11, ${0.1 + ratio * 0.45})`
      }
      const bg = colorMap[this.selectedTheme] || colorMap.emerald
      return { backgroundColor: bg, transition: 'background-color 0.2s ease' }
    },

    // ================= AI 패널 공통 =================
    setAiMode(mode) {
      this.aiMode = mode
      this.aiError = ''
      this.aiPromptInput = ''
    },

    applyPreset(preset) {
      if (this.aiMode === 'configure' && preset.rowIds) {
        this.aiPromptInput = preset.prompt
        this.aiResult = this.buildConfigResult({
          prompt: preset.prompt,
          rowIds: preset.rowIds,
          colIds: preset.colIds,
          valConfigs: preset.valConfigs,
          filterConfigs: preset.filterConfigs,
          explanation: preset.explanation,
        })
        this.applyAiResultToPivot()
      } else {
        this.aiPromptInput = preset.prompt
        this.runAi()
      }
    },

    async runAi() {
      if (this.aiAnalyzing) return
      this.aiError = ''
      const text = this.aiPromptInput.trim()
      if (!text && this.aiMode === 'configure') return
      this.aiAnalyzing = true
      this.aiLastRanMode = true
      try {
        if (this.aiMode === 'configure') await this.runConfigure(text)
        else if (this.aiMode === 'analyze') await this.runAnalyze(text)
        else await this.runPredict(text)
      } catch (e) {
        this.aiError = (e && e.message) ? e.message : String(e)
      } finally {
        this.aiAnalyzing = false
      }
    },

    fieldSchemaForLlm() {
      return this.fields.map(f => ({
        id: f.id, label: f.label,
        type: f.kind === 'measure' ? 'measure' : 'dimension',
        numeric: f.numeric !== false,
      }))
    },

    // ================= 모드 1: 구성 변경 =================
    async runConfigure(text) {
      let cfg = null
      this.aiUsedLocal = false
      if (this.aiConnected) {
        try {
          cfg = await this.llmConfigure(text)
        } catch (e) {
          this.aiUsedLocal = true
          this.aiError = `LLM 호출 실패 → 로컬 엔진으로 대체 (${e.message})`
        }
      } else {
        this.aiUsedLocal = true
      }
      if (!cfg) cfg = this.localConfigure(text)
      this.aiResult = this.buildConfigResult(cfg)
      this.applyAiResultToPivot()
    },

    buildConfigResult(cfg) {
      const rowIds = (cfg.rowIds || []).filter(id => this.fields.some(f => f.id === id))
      const colIds = (cfg.colIds || []).filter(id => this.fields.some(f => f.id === id))
      const valConfigs = (cfg.valConfigs || []).filter(v => this.fields.some(f => f.id === v.id))
      const filterConfigs = cfg.filterConfigs || {}
      const rowLabels = rowIds.map(id => this.fieldLabel(id))
      const colLabels = colIds.map(id => this.fieldLabel(id))
      const valLabels = valConfigs.map(v => `${AGG_LABELS[v.agg] || v.agg}·${this.fieldLabel(v.id)}`)
      const filterSummary = Object.entries(filterConfigs)
        .filter(([, v]) => v)
        .map(([k, v]) => `${this.fieldLabel(k)}=${v}`).join(', ')
      return {
        prompt: cfg.prompt || this.aiPromptInput,
        rowIds, colIds, valConfigs, filterConfigs,
        rowLabels, colLabels, valLabels, filterSummary,
        explanation: cfg.explanation ||
          `[행: ${rowLabels.join(', ') || '없음'}] [열: ${colLabels.join(', ') || '없음'}] [값: ${valLabels.join(', ') || '없음'}] 로 피벗을 구성했습니다.`,
      }
    },

    async llmConfigure(text) {
      const schema = JSON.stringify(this.fieldSchemaForLlm())
      const sys = `너는 피벗 테이블 설계 도우미다. 사용 가능한 필드 스키마가 주어지면 사용자의 요청을 만족하는 피벗 구성을 JSON으로만 응답한다.
반드시 아래 형식의 JSON만 출력한다(설명 텍스트/코드블록 금지):
{"rowIds":["필드id"],"colIds":["필드id"],"valConfigs":[{"id":"필드id","agg":"sum|avg|min|max|count"}],"filterConfigs":{"필드id":"값"},"explanation":"한국어 한 문장 설명"}
- rowIds/colIds 는 type=dimension 필드만 사용.
- valConfigs 는 type=measure 필드만 사용. numeric=false 면 agg=count.
- 필터가 불필요하면 filterConfigs 는 {} 로.`
      const user = `필드 스키마: ${schema}\n\n사용자 요청: "${text}"`
      const raw = await this.callLlm(sys, user)
      return this.parseJson(raw)
    },

    localConfigure(text) {
      const lower = text.toLowerCase()
      const detectedDims = []
      const detectedValues = []
      if (lower.includes('부서')) detectedDims.push('dept')
      if (lower.includes('근무지') || lower.includes('지역')) detectedDims.push('region')
      if (lower.includes('직군') || lower.includes('역할')) detectedDims.push('role')
      if (lower.includes('입사') || lower.includes('연도') || lower.includes('년도')) detectedDims.push('joinYear')
      if (lower.includes('사원') || lower.includes('이름')) detectedDims.push('name')
      let agg = 'sum'
      if (lower.includes('평균')) agg = 'avg'
      else if (lower.includes('최대') || lower.includes('최고')) agg = 'max'
      else if (lower.includes('최소') || lower.includes('최저')) agg = 'min'
      else if (lower.includes('건수')) agg = 'count'
      if (lower.includes('연봉') || lower.includes('급여')) detectedValues.push({ id: 'salary', agg })
      if (lower.includes('인원') || lower.includes('명')) detectedValues.push({ id: 'headcount', agg: 'count' })
      if (detectedDims.length === 0) detectedDims.push('dept', 'region')
      if (detectedValues.length === 0) detectedValues.push({ id: 'salary', agg: 'sum' })
      const filterConfigs = {}
      if (lower.includes('서울')) filterConfigs.region = '서울'
      else if (lower.includes('판교')) filterConfigs.region = '판교'
      else if (lower.includes('부산')) filterConfigs.region = '부산'
      return {
        prompt: text,
        rowIds: [detectedDims[0]],
        colIds: detectedDims.length > 1 ? [detectedDims[1]] : [],
        valConfigs: detectedValues,
        filterConfigs,
        explanation: `'${text}' 를 로컬 규칙 엔진으로 해석해 피벗 축을 구성했습니다.`,
      }
    },

    // ================= 모드 2: 데이터 분석 =================
    pivotSummaryData() {
      const p = this.pivot
      if (!p.leafColsWithTotal.length || !p.bodyRows.length) return null
      const primaryIdx = p.hasCols ? p.leafCols.length : 0
      const measureLc = p.leafColsWithTotal[primaryIdx]
      const measureLabel = measureLc ? measureLc.headerLabel : '값'
      const rows = p.bodyRows
        .filter(r => r.type === 'data')
        .map(r => ({
          label: r.labelHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
          value: Number(r.cells[primaryIdx]) || 0,
        }))
      if (!rows.length) return null
      const grand = Number(p.footer[primaryIdx]) || rows.reduce((a, b) => a + b.value, 0)
      return { rows, grand, measureLabel, rowHeader: p.rowHeaderLabel }
    },

    async runAnalyze(text) {
      const data = this.pivotSummaryData()
      if (!data) throw new Error('분석할 피벗 데이터가 없습니다. 먼저 행·값 필드를 배치하세요.')
      this.aiUsedLocal = false
      if (this.aiConnected) {
        try {
          this.aiInsight = await this.llmAnalyze(text, data)
          return
        } catch (e) {
          this.aiUsedLocal = true
          this.aiError = `LLM 호출 실패 → 로컬 분석으로 대체 (${e.message})`
        }
      } else {
        this.aiUsedLocal = true
      }
      this.aiInsight = this.localAnalyze(data)
    },

    async llmAnalyze(text, data) {
      const table = data.rows.map(r => `${r.label}: ${r.value}`).join('\n')
      const sys = `너는 데이터 분석가다. 피벗 집계 결과를 보고 핵심 인사이트를 한국어 JSON으로만 응답한다(코드블록 금지).
형식: {"headline":"한 문장 핵심","findings":["발견1","발견2","발견3"],"recommendation":"실행 제안 한 문장"}`
      const user = `분석 지표: ${data.measureLabel} (행 기준: ${data.rowHeader})\n총계: ${data.grand}\n데이터:\n${table}\n\n분석 요청: "${text || '핵심 특징을 요약'}"`
      const raw = await this.callLlm(sys, user)
      const j = this.parseJson(raw)
      return {
        headline: j.headline || '분석 결과',
        findings: Array.isArray(j.findings) ? j.findings : [],
        recommendation: j.recommendation || '',
      }
    },

    localAnalyze(data) {
      const sorted = [...data.rows].sort((a, b) => b.value - a.value)
      const top = sorted[0]
      const bottom = sorted[sorted.length - 1]
      const avg = data.rows.length ? data.grand / data.rows.length : 0
      const topShare = data.grand ? (top.value / data.grand * 100) : 0
      const findings = []
      if (top) findings.push(`최고: '${top.label}' — ${this.fmtNum(top.value)} (전체의 ${topShare.toFixed(1)}%)`)
      if (bottom && bottom !== top) findings.push(`최저: '${bottom.label}' — ${this.fmtNum(bottom.value)}`)
      findings.push(`그룹 평균 ${this.fmtNum(avg)} · 그룹 ${data.rows.length}개 · 총계 ${this.fmtNum(data.grand)}`)
      const aboveAvg = data.rows.filter(r => r.value >= avg).length
      findings.push(`평균 이상 그룹: ${aboveAvg} / ${data.rows.length}개`)
      return {
        headline: top ? `'${top.label}'가 ${data.measureLabel} 기준 1위입니다` : '분석 결과',
        findings,
        recommendation: topShare > 40
          ? `'${top.label}' 편중도가 높습니다(${topShare.toFixed(0)}%). 집중 리스크를 점검하세요.`
          : '그룹 간 분포가 비교적 고른 편입니다.',
      }
    },

    // ================= 모드 3: 예측 =================
    forecastSeries() {
      const p = this.pivot
      if (!p.leafColsWithTotal.length || !p.bodyRows.length) return null
      const orderField = this.rowFields.find(f => f.numeric) || this.rowFields[0]
      if (!orderField) return null
      const primaryIdx = p.hasCols ? p.leafCols.length : 0
      const measureLc = p.leafColsWithTotal[primaryIdx]
      const points = p.bodyRows
        .filter(r => r.type === 'data')
        .map(r => {
          const label = r.labelHtml.replace(/<[^>]+>/g, ' ').replace(/›/g, ' ').replace(/\s+/g, ' ').trim()
          const leaf = label.split(' ').pop()
          return { period: leaf, x: Number(leaf), y: Number(r.cells[primaryIdx]) || 0 }
        })
        .filter(pt => !Number.isNaN(pt.x))
        .sort((a, b) => a.x - b.x)
      if (points.length < 2) return null
      return {
        points,
        measureLabel: measureLc ? measureLc.headerLabel : '값',
        periodLabel: orderField.label,
      }
    },

    async runPredict(text) {
      const series = this.forecastSeries()
      if (!series) throw new Error('예측하려면 순서가 있는 숫자 행 필드(예: 입사연도)와 값 필드가 필요합니다.')
      this.aiUsedLocal = false
      if (this.aiConnected) {
        try {
          this.aiForecast = await this.llmPredict(text, series)
          return
        } catch (e) {
          this.aiUsedLocal = true
          this.aiError = `LLM 호출 실패 → 로컬 회귀 예측으로 대체 (${e.message})`
        }
      } else {
        this.aiUsedLocal = true
      }
      this.aiForecast = this.localPredict(series)
    },

    linearFit(points) {
      const n = points.length
      const sx = points.reduce((a, p) => a + p.x, 0)
      const sy = points.reduce((a, p) => a + p.y, 0)
      const sxx = points.reduce((a, p) => a + p.x * p.x, 0)
      const sxy = points.reduce((a, p) => a + p.x * p.y, 0)
      const denom = (n * sxx - sx * sx) || 1
      const slope = (n * sxy - sx * sy) / denom
      const intercept = (sy - slope * sx) / n
      return { slope, intercept }
    },

    localPredict(series, horizon = 3) {
      const { slope, intercept } = this.linearFit(series.points)
      const lastX = series.points[series.points.length - 1].x
      const step = series.points.length > 1
        ? (series.points[series.points.length - 1].x - series.points[0].x) / (series.points.length - 1)
        : 1
      const stepInt = Math.max(1, Math.round(step))
      const points = series.points.map(p => ({
        period: String(p.period), value: p.y, formatted: this.fmtNum(p.y), future: false,
      }))
      for (let i = 1; i <= horizon; i++) {
        const x = lastX + stepInt * i
        const y = Math.max(0, slope * x + intercept)
        points.push({ period: String(x), value: y, formatted: this.fmtNum(Math.round(y)), future: true })
      }
      const trendUp = slope > 0
      return {
        points,
        measureLabel: series.measureLabel,
        periodLabel: series.periodLabel,
        trendLabel: trendUp ? '상승 추세' : (slope < 0 ? '하락 추세' : '보합'),
        note: `선형 회귀 기준 ${series.periodLabel} 1기간당 약 ${this.fmtNum(Math.round(slope))}${trendUp ? ' 증가' : ' 감소'} 추세이며, 향후 ${horizon}개 기간을 예측했습니다.`,
      }
    },

    async llmPredict(text, series) {
      const hist = series.points.map(p => `${p.period}: ${p.y}`).join('\n')
      const sys = `너는 시계열 예측 분석가다. 과거 데이터를 보고 향후 값을 예측해 한국어 JSON으로만 응답한다(코드블록 금지).
형식: {"forecast":[{"period":"기간","value":숫자}],"trend":"상승|하락|보합","note":"근거 한 문장"}
forecast 는 미래 3개 기간을 포함한다.`
      const user = `지표: ${series.measureLabel} / 기간축: ${series.periodLabel}\n과거값:\n${hist}\n\n요청: "${text || '향후 3기간 예측'}"`
      const raw = await this.callLlm(sys, user)
      const j = this.parseJson(raw)
      const points = series.points.map(p => ({
        period: String(p.period), value: p.y, formatted: this.fmtNum(p.y), future: false,
      }))
      ;(j.forecast || []).forEach(f => {
        const val = Number(f.value) || 0
        points.push({ period: String(f.period), value: val, formatted: this.fmtNum(Math.round(val)), future: true })
      })
      const map = { '상승': '상승 추세', '하락': '하락 추세', '보합': '보합' }
      return {
        points,
        measureLabel: series.measureLabel,
        periodLabel: series.periodLabel,
        trendLabel: map[j.trend] || '예측 완료',
        note: j.note || 'LLM 예측 결과입니다.',
      }
    },

    // ================= LLM 연결 (BYO Key) =================
    loadAiSettings() {
      try {
        const raw = localStorage.getItem(AI_SETTINGS_KEY)
        if (raw) {
          const s = JSON.parse(raw)
          this.aiSettings = {
            provider: s.provider || 'openai',
            model: s.model || '',
            baseUrl: s.baseUrl || '',
            apiKey: s.apiKey || '',
          }
        }
      } catch (e) { /* ignore */ }
    },
    saveAiSettings() {
      try {
        localStorage.setItem(AI_SETTINGS_KEY, JSON.stringify(this.aiSettings))
        this.aiTestResult = null
      } catch (e) { /* ignore */ }
    },
    clearAiSettings() {
      this.aiSettings.apiKey = ''
      this.aiTestResult = null
      try { localStorage.setItem(AI_SETTINGS_KEY, JSON.stringify(this.aiSettings)) } catch (e) { /* ignore */ }
    },
    onProviderChange() {
      this.aiTestResult = null
    },
    effectiveModel() {
      return this.aiSettings.model || (PROVIDER_DEFAULTS[this.aiSettings.provider] || {}).model
    },
    effectiveBaseUrl() {
      const base = this.aiSettings.baseUrl || (PROVIDER_DEFAULTS[this.aiSettings.provider] || {}).baseUrl || ''
      return base.replace(/\/+$/, '')
    },

    async callLlm(systemPrompt, userPrompt) {
      const s = this.aiSettings
      if (!s.apiKey) throw new Error('API 키가 없습니다')
      const model = this.effectiveModel()
      const base = this.effectiveBaseUrl()

      if (s.provider === 'anthropic') {
        const res = await fetch(`${base}/v1/messages`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-api-key': s.apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
          },
          body: JSON.stringify({
            model, max_tokens: 1024, system: systemPrompt,
            messages: [{ role: 'user', content: userPrompt }],
          }),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        return (data.content && data.content[0] && data.content[0].text) || ''
      }

      // OpenAI 호환 (/chat/completions)
      const res = await fetch(`${base}/chat/completions`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${s.apiKey}` },
        body: JSON.stringify({
          model, temperature: 0.2,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      return (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || ''
    },

    async testLlmConnection() {
      this.aiTesting = true
      this.aiTestResult = null
      try {
        this.saveAiSettings()
        const raw = await this.callLlm('You are a health check bot. Reply with exactly: OK', 'ping')
        this.aiTestResult = raw ? 'ok' : 'fail'
      } catch (e) {
        this.aiTestResult = 'fail'
        this.aiError = `연결 테스트 실패: ${e.message}`
      } finally {
        this.aiTesting = false
      }
    },

    parseJson(raw) {
      if (!raw) throw new Error('빈 응답')
      let t = String(raw).trim()
      t = t.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '')
      const start = t.indexOf('{')
      const end = t.lastIndexOf('}')
      if (start !== -1 && end !== -1) t = t.slice(start, end + 1)
      return JSON.parse(t)
    },

    fieldLabel(id) {
      const f = this.fields.find(x => x.id === id)
      return f ? f.label : id
    },
    fmtNum(v) {
      return Number(v || 0).toLocaleString('ko-KR', { maximumFractionDigits: 1 })
    },

    applyAiResultToPivot() {
      if (!this.aiResult) return

      // 초기화
      this.fields.forEach(f => { f.zone = 'none' })
      this.activeFilters = {}

      // 행 적용
      this.aiResult.rowIds.forEach(id => {
        const f = this.fields.find(x => x.id === id)
        if (f) f.zone = 'row'
      })

      // 열 적용
      this.aiResult.colIds.forEach(id => {
        const f = this.fields.find(x => x.id === id)
        if (f) f.zone = 'col'
      })

      // 값 적용
      this.aiResult.valConfigs.forEach(vc => {
        const f = this.fields.find(x => x.id === vc.id)
        if (f) {
          f.zone = 'value'
          f.agg = vc.agg
        }
      })

      // 필터 적용
      if (this.aiResult.filterConfigs) {
        Object.entries(this.aiResult.filterConfigs).forEach(([fId, val]) => {
          const f = this.fields.find(x => x.id === fId)
          if (f && f.zone === 'none') {
            f.zone = 'filter'
          }
          this.activeFilters[fId] = val
        })
      }
    },

    // ---- 드래그 앤 드롭 관리 ----
    onDragStart(field, evt) {
      evt.dataTransfer.effectAllowed = 'move'
      evt.dataTransfer.setData('text/plain', field.id)
    },
    onDropZone(zone, evt) {
      this.dragOverZone = null
      const id = evt.dataTransfer.getData('text/plain')
      this.assignZone(id, zone)
    },
    onDropBefore(targetField, evt) {
      const id = evt.dataTransfer.getData('text/plain')
      if (!id || id === targetField.id) return
      this.moveBefore(id, targetField)
    },
    assignZone(id, zone) {
      const idx = this.fields.findIndex(f => f.id === id)
      if (idx === -1) return
      const field = this.fields[idx]
      if (zone === 'value' && field.agg == null) field.agg = 'count'
      field.zone = zone
      this.fields.splice(idx, 1)
      this.fields.push(field)
    },
    moveBefore(id, targetField) {
      const from = this.fields.findIndex(f => f.id === id)
      if (from === -1) return
      const field = this.fields[from]
      field.zone = targetField.zone
      this.fields.splice(from, 1)
      const to = this.fields.findIndex(f => f.id === targetField.id)
      this.fields.splice(to, 0, field)
    },
    cycleZone(f) {
      const cycle = f.kind === 'measure'
        ? ['none', 'filter', 'row', 'col', 'value']
        : ['none', 'filter', 'row', 'col']
      const cur = cycle.indexOf(f.zone)
      this.assignZone(f.id, cycle[(cur + 1) % cycle.length])
    },
    removeField(f) {
      this.assignZone(f.id, 'none')
      if (this.activeFilters[f.id]) {
        delete this.activeFilters[f.id]
      }
    },
    resetLayout() {
      this.fields.forEach(f => { f.zone = 'none' })
      this.activeFilters = {}
      const def = { dept: 'row', region: 'col', headcount: 'value', salary: 'value' }
      Object.entries(def).forEach(([id, zone]) => {
        const f = this.fields.find(x => x.id === id)
        if (f) f.zone = zone
      })
      const hc = this.fields.find(f => f.id === 'headcount'); if (hc) hc.agg = 'count'
      const sal = this.fields.find(f => f.id === 'salary'); if (sal) sal.agg = 'sum'
      this.showSubtotals = true
      this.aiResult = null
      this.aiInsight = null
      this.aiForecast = null
      this.aiError = ''
    },

    buildSubtotal(firstValue, rF, leafColsWithTotal, data, aggregate, match) {
      const firstId = rF[0].id
      const groupRows = data.filter(r => r[firstId] === firstValue)
      const cells = leafColsWithTotal.map(lc => {
        const subset = lc.isTotal ? groupRows : groupRows.filter(r => match(r, lc.colKey))
        return aggregate(subset, lc.measure)
      })
      return { type: 'subtotal', label: `소계 · ${firstValue}`, cells }
    },

    fmtCell(v, cIdx) {
      if (v === null || v === undefined) return '–'
      const lc = this.pivot.leafColsWithTotal[cIdx]
      const agg = lc?.measure?.agg
      const digits = agg === 'avg' ? 1 : 0
      return Number(v).toLocaleString('ko-KR', {
        minimumFractionDigits: digits, maximumFractionDigits: digits,
      })
    },

    escapeHtml(s) {
      return String(s).replace(/[&<>"]/g, c => (
        { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]
      ))
    },

    exportCsv() {
      const p = this.pivot
      if (p.leafColsWithTotal.length === 0) return
      const esc = (s) => {
        const str = String(s ?? '')
        return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str
      }
      const header = [p.rowHeaderLabel, ...p.leafColsWithTotal.map(lc => {
        const grp = lc.isTotal ? '총계' : (lc.colKey || []).map(x => x.value).join(' · ')
        return grp ? `${grp} / ${lc.headerLabel}` : lc.headerLabel
      })]
      const lines = [header.map(esc).join(',')]
      p.bodyRows.forEach(row => {
        const label = row.type === 'subtotal'
          ? row.label
          : row.labelHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
        lines.push([label, ...row.cells.map((v, i) => this.fmtCell(v, i).replace(/,/g, ''))].map(esc).join(','))
      })
      lines.push(['총계', ...p.footer.map((v, i) => this.fmtCell(v, i).replace(/,/g, ''))].map(esc).join(','))
      const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'realpivot_result.csv'
      a.click()
      URL.revokeObjectURL(url)
    },

    async copyCode() {
      try {
        await navigator.clipboard.writeText(this.sdkCode)
        this.copied = true
        setTimeout(() => { this.copied = false }, 1500)
      } catch (e) { /* clipboard fallback */ }
    },
  },
}
</script>

<style scoped>
/* ===== RealPivot2 테마 시스템 ===== */
.theme-emerald {
  --b2b-color-primary: #10B981;
  --b2b-color-primary-subtle: rgba(16, 185, 129, 0.12);
}
.theme-indigo {
  --b2b-color-primary: #6366F1;
  --b2b-color-primary-subtle: rgba(99, 102, 241, 0.12);
}
.theme-dark {
  --b2b-color-primary: #3B82F6;
  --b2b-color-primary-subtle: rgba(59, 130, 246, 0.2);
}

/* AI 토글 버튼 */
.btn-ai-toggle {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%);
  color: #fff;
  font-weight: 700;
  border: none;
  border-radius: 8px;
  padding: 6px 14px;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
  transition: all 0.2s ease;
  position: relative;
}
.btn-ai-toggle:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(99, 102, 241, 0.35);
  color: #fff;
}
.ai-sparkle-dot {
  width: 8px;
  height: 8px;
  background: #facc15;
  border-radius: 50%;
  animation: pulse-glow 1.5s infinite;
}

@keyframes pulse-glow {
  0% { transform: scale(0.9); opacity: 0.8; }
  50% { transform: scale(1.3); opacity: 1; }
  100% { transform: scale(0.9); opacity: 0.8; }
}

/* AI 패널 카드 */
.ai-panel-card {
  background: linear-gradient(135deg, color-mix(in srgb, var(--bg-card) 95%, #6366f1) 0%, var(--bg-card) 100%);
  border: 1px solid color-mix(in srgb, var(--border-color) 70%, #6366f1) !important;
}
.ai-bg-glow {
  position: absolute;
  top: -50px;
  right: -50px;
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(99,102,241,0.15) 0%, rgba(236,72,153,0) 70%);
  pointer-events: none;
}
.ai-icon-badge {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}
.ai-input-group {
  background: var(--bg-card);
  border: 2px solid color-mix(in srgb, var(--border-color) 80%, #6366f1);
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.ai-preset-chip {
  background: var(--bg-subcard);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  padding: 3px 10px;
  font-size: 11.5px;
  font-weight: 600;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.15s ease;
}
.ai-preset-chip:hover {
  background: var(--b2b-color-primary-subtle);
  border-color: var(--b2b-color-primary);
  color: var(--b2b-color-primary);
  transform: translateY(-1px);
}
.ai-result-box {
  background: var(--bg-subcard);
  border: 1px solid var(--border-color);
}
.ai-tag {
  font-size: 10.5px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 4px;
}
.tag-row { background: rgba(37, 99, 235, 0.15); color: #2563eb; }
.tag-col { background: rgba(8, 145, 178, 0.15); color: #0891b2; }
.tag-val { background: rgba(22, 163, 74, 0.15); color: #16a34a; }
.tag-filter { background: rgba(217, 119, 6, 0.15); color: #d97706; }

/* LLM 연결 상태 배지 */
.ai-conn-badge {
  font-size: 10.5px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.ai-conn-badge.is-on { background: rgba(22, 163, 74, 0.15); color: #16a34a; border: 1px solid rgba(22, 163, 74, 0.35); }
.ai-conn-badge.is-off { background: var(--bg-subcard); color: var(--text-secondary); border: 1px solid var(--border-color); }

/* LLM 설정 박스 */
.ai-settings-box {
  background: var(--bg-subcard);
  border: 1px solid color-mix(in srgb, var(--border-color) 70%, #6366f1);
}
.ai-field-label {
  display: block;
  font-size: 10.5px;
  font-weight: 700;
  color: var(--text-secondary);
  margin-bottom: 2px;
}

/* AI 모드 탭 (구성/분석/예측) */
.ai-mode-tabs {
  display: flex;
  gap: 6px;
  background: var(--bg-subcard);
  padding: 4px;
  border-radius: 10px;
  border: 1px solid var(--border-color);
}
.ai-mode-tab {
  flex: 1 1 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  padding: 6px 8px;
  border: none;
  border-radius: 7px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}
.ai-mode-tab:hover { color: var(--b2b-color-primary); }
.ai-mode-tab.active {
  background: var(--bg-card);
  color: var(--b2b-color-primary);
  box-shadow: 0 2px 6px rgba(0,0,0,0.08);
}
.ai-mode-tab__desc { font-size: 9.5px; font-weight: 500; color: var(--text-muted); }
.ai-mode-tab.active .ai-mode-tab__desc { color: var(--b2b-color-primary); opacity: 0.8; }

/* 오류/안내 */
.ai-error-box {
  color: #b91c1c;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: 6px;
  padding: 6px 10px;
}
.ai-local-note {
  color: var(--text-secondary);
  background: var(--bg-subcard);
  border: 1px dashed var(--border-color);
  border-radius: 6px;
  padding: 6px 10px;
}

/* 분석 인사이트 목록 */
.ai-insight-list { list-style: none; padding: 0; margin: 0; }
.ai-insight-list li {
  color: var(--text-primary);
  padding: 2px 0;
  line-height: 1.45;
}
.ai-insight-list li .bi { color: var(--b2b-color-primary); }
.ai-reco {
  background: rgba(250, 204, 21, 0.1);
  border-left: 3px solid #facc15;
  border-radius: 4px;
  padding: 6px 8px;
  color: var(--text-primary);
}

/* 예측 테이블 */
.ai-forecast-table { width: 100%; border-collapse: collapse; }
.ai-forecast-table th {
  text-align: left;
  color: var(--text-secondary);
  font-weight: 700;
  border-bottom: 1px solid var(--border-color);
  padding: 3px 4px;
}
.ai-forecast-table td {
  padding: 3px 4px;
  border-bottom: 1px dashed var(--border-color);
  color: var(--text-primary);
}
.ai-forecast-table tr.is-future td {
  color: var(--b2b-color-primary);
  font-weight: 700;
  background: var(--b2b-color-primary-subtle);
}
.ai-future-dot {
  font-size: 8.5px;
  font-weight: 700;
  margin-left: 6px;
  padding: 1px 5px;
  border-radius: 999px;
  background: var(--b2b-color-primary);
  color: #fff;
}

/* 차트 바 */
.pivot-chart-bar {
  background: linear-gradient(180deg, var(--b2b-color-primary) 0%, color-mix(in srgb, var(--b2b-color-primary) 70%, #000) 100%);
  transition: height 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 필드 존 스타일 */
.pivot-zone {
  border: 1.5px dashed var(--border-color);
  border-radius: 8px;
  padding: 8px 10px 10px;
  background: var(--bg-subcard);
  transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
}
.pivot-zone--over {
  border-color: var(--b2b-color-primary);
  border-style: solid;
  background: var(--b2b-color-primary-subtle);
  box-shadow: 0 0 0 3px var(--b2b-color-primary-subtle);
}
.pivot-zone--pool { background: transparent; }
.pivot-zone--filter { border-color: color-mix(in srgb, var(--border-color) 70%, #d97706); }

.pivot-zone__title {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-secondary);
  margin-bottom: 6px;
}
.pivot-zone__hint {
  display: inline-block;
  font-size: 11px;
  color: var(--text-muted);
  padding: 4px 2px;
}

/* 필드 칩 */
.pivot-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px 4px 6px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: grab;
  user-select: none;
  border: 1px solid var(--border-color);
  background: var(--bg-card);
  color: var(--text-primary);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
}
.pivot-chip:active { cursor: grabbing; }
.pivot-chip--row { border-left: 3px solid #2563EB; }
.pivot-chip--col { border-left: 3px solid #0891B2; }
.pivot-chip__type {
  font-size: 9px;
  font-weight: 700;
  padding: 1px 4px;
  border-radius: 999px;
  background: var(--bg-subcard);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}
.pivot-chip__remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  padding: 0;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 10px;
}
.pivot-chip__remove:hover { background: var(--b2b-color-danger); color: #fff; }

/* 값 필드 행 */
.pivot-value-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 6px 3px 4px;
  border-radius: 6px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-left: 3px solid #16A34A;
  cursor: grab;
}
.pivot-value-row__name { font-size: 12px; font-weight: 600; flex: 1 1 auto; }
.pivot-agg-select {
  width: auto;
  min-width: 68px;
  height: 24px;
  padding: 0 18px 0 6px;
  font-size: 11px;
  font-weight: 600;
}

/* 피벗 테이블 */
.pivot-table-scroll {
  overflow: auto;
  max-height: 60vh;
}
.pivot-empty {
  padding: 45px 16px;
  text-align: center;
  color: var(--text-secondary);
  font-size: 13.5px;
}
.pivot-table {
  border-collapse: separate;
  border-spacing: 0;
  width: 100%;
  font-size: 12.5px;
  white-space: nowrap;
}
.pivot-table th,
.pivot-table td {
  border-right: 1px solid var(--border-color);
  border-bottom: 1px solid var(--border-color);
  padding: 6px 11px;
}
.pivot-table thead th {
  position: sticky;
  top: 0;
  z-index: 3;
  background: var(--bg-header);
  color: var(--text-primary);
  font-weight: 700;
  text-align: center;
  border-top: 1px solid var(--border-color);
}
.pivot-corner,
.pivot-rowhead {
  position: sticky;
  left: 0;
  z-index: 2;
  background: var(--bg-subcard);
  text-align: left;
  font-weight: 600;
}
.pivot-corner { z-index: 4; }
.pivot-table td { text-align: right; color: var(--text-primary); }
.pivot-data-row:nth-child(even) td { background: color-mix(in srgb, var(--bg-subcard) 45%, transparent); }
.pivot-data-row:hover td,
.pivot-data-row:hover .pivot-rowhead { background: var(--b2b-color-primary-subtle); }

.pivot-total-head { background: var(--bg-subcard) !important; color: var(--b2b-color-primary) !important; }
.pivot-total-cell { background: color-mix(in srgb, var(--b2b-color-primary-subtle) 60%, transparent); font-weight: 700; }

.pivot-subtotal-row td,
.pivot-subtotal-row .pivot-rowhead {
  background: color-mix(in srgb, var(--bg-header) 75%, transparent);
  font-weight: 700;
  color: var(--text-primary);
}
.pivot-grand-row td,
.pivot-grand-row .pivot-rowhead {
  position: sticky;
  bottom: 0;
  z-index: 2;
  background: var(--bg-header);
  font-weight: 800;
  color: var(--b2b-color-primary);
  border-top: 2px solid var(--b2b-color-primary);
}
.pivot-grand-row .pivot-rowhead { z-index: 3; }

:deep(.pivot-lvl-parent) { color: var(--text-secondary); font-weight: 500; }
:deep(.pivot-lvl-leaf) { color: var(--text-primary); font-weight: 700; }
:deep(.pivot-lvl-sep) { color: var(--text-muted); margin: 0 5px; }

/* 레이아웃 모드별 스타일 */
.layout-compact .pivot-table th,
.layout-compact .pivot-table td { padding: 4px 8px; font-size: 12px; }

/* 코드 스니펫 */
.pivot-code {
  margin: 0;
  height: 100%;
  min-height: 160px;
  padding: 12px 14px;
  background: #0f172a;
  color: #e2e8f0;
  font-family: var(--b2b-font-family-mono);
  font-size: 11.5px;
  line-height: 1.5;
  overflow: auto;
  border-radius: 0 0 var(--b2b-radius-md) var(--b2b-radius-md);
}

.pivot-compare th { color: var(--text-secondary); font-weight: 600; }
.pivot-compare td { color: var(--text-primary); }

.cursor-pointer { cursor: pointer; }
.theme-chip-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--b2b-color-primary-subtle);
  color: var(--b2b-color-primary);
}

/* 트랜지션 애니메이션 */
.slide-down-enter-active, .slide-down-leave-active {
  transition: all 0.3s ease-out;
}
.slide-down-enter-from, .slide-down-leave-to {
  max-height: 0;
  opacity: 0;
  transform: translateY(-10px);
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
