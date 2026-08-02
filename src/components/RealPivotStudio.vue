<template>
  <div class="realpivot-container text-theme-primary transition-colors" :class="`theme-${selectedTheme}`">
    <!-- 통합 헤더 카드 -->
    <div class="b2b-card p-3 mb-3 shadow-sm border-0 d-flex align-items-center justify-content-between flex-wrap gap-2">
      <div>
        <div class="d-flex align-items-center gap-2 flex-wrap">
          <h4 class="b2b-text-h1 fw-bold m-0 d-inline-flex align-items-center gap-2">
            AI 스마트 피벗
            <span class="b2b-badge b2b-badge-success">자체개발 · No-License</span>
          </h4>
          <span class="theme-chip-badge">Theme: {{ currentThemeName }}</span>
        </div>
        <p class="text-theme-secondary b2b-text-sm mb-0 mt-1">
          우측 사이드 패널 (AI 피벗 분석 도우미 &amp; 엑셀 스타일 다차원 필드 설정 패널) · 서브메뉴 우클릭 컨텍스트 지원
        </p>
      </div>

      <!-- 상단 컨트롤 툴바 (⚙️ 뷰 옵션 드롭다운으로 통합) -->
      <div class="d-flex align-items-center gap-2 flex-wrap">
        <!-- ⚙️ 뷰 옵션 드롭다운 -->
        <div class="dropdown">
          <button
            class="btn btn-primary btn-sm dropdown-toggle fw-semibold d-inline-flex align-items-center gap-1.5 px-3 py-1.5 shadow-sm"
            type="button"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            <i class="bi bi-gear-fill"></i>
            <span>⚙️ 뷰 옵션</span>
          </button>
          <ul class="dropdown-menu dropdown-menu-end shadow-lg p-2 view-options-menu b2b-text-sm" style="min-width: 240px;">
            <li><h6 class="dropdown-header text-theme-secondary fw-bold px-2 py-1">🎨 서식 &amp; 패널 표시</h6></li>
            <li>
              <button class="dropdown-item d-flex align-items-center justify-content-between rounded py-1.5 px-2" @click="showAiSection = !showAiSection">
                <span><i class="bi bi-magic text-primary me-2"></i>AI 피벗 도우미</span>
                <i class="bi" :class="showAiSection ? 'bi-check-circle-fill text-success' : 'bi-circle text-muted'"></i>
              </button>
            </li>
            <li>
              <button class="dropdown-item d-flex align-items-center justify-content-between rounded py-1.5 px-2" @click="showHeatmap = !showHeatmap">
                <span><i class="bi bi-fire text-danger me-2"></i>매트릭스 히트맵</span>
                <i class="bi" :class="showHeatmap ? 'bi-check-circle-fill text-success' : 'bi-circle text-muted'"></i>
              </button>
            </li>
            <li>
              <button class="dropdown-item d-flex align-items-center justify-content-between rounded py-1.5 px-2" @click="showChart = !showChart">
                <span><i class="bi bi-bar-chart-fill text-info me-2"></i>미니 차트 시각화</span>
                <i class="bi" :class="showChart ? 'bi-check-circle-fill text-success' : 'bi-circle text-muted'"></i>
              </button>
            </li>
            <li>
              <button class="dropdown-item d-flex align-items-center justify-content-between rounded py-1.5 px-2" @click="showSubtotals = !showSubtotals">
                <span><i class="bi bi-calculator text-warning me-2"></i>행 소계 표시</span>
                <i class="bi" :class="showSubtotals ? 'bi-check-circle-fill text-success' : 'bi-circle text-muted'"></i>
              </button>
            </li>

            <li><hr class="dropdown-divider my-1.5"></li>
            <li><h6 class="dropdown-header text-theme-secondary fw-bold px-2 py-1">📐 레이아웃 모드</h6></li>
            <li class="d-flex gap-1 px-2 py-1">
              <button
                class="btn btn-xs flex-fill"
                :class="layoutMode === 'tabular' ? 'btn-primary' : 'btn-outline-secondary'"
                @click="layoutMode = 'tabular'"
              >
                테이블형
              </button>
              <button
                class="btn btn-xs flex-fill"
                :class="layoutMode === 'compact' ? 'btn-primary' : 'btn-outline-secondary'"
                @click="layoutMode = 'compact'"
              >
                압축형
              </button>
              <button
                class="btn btn-xs flex-fill"
                :class="layoutMode === 'tree' ? 'btn-primary' : 'btn-outline-secondary'"
                @click="layoutMode = 'tree'"
              >
                트리형
              </button>
            </li>

            <li><hr class="dropdown-divider my-1.5"></li>
            <li><h6 class="dropdown-header text-theme-secondary fw-bold px-2 py-1">🎨 테마 스타일</h6></li>
            <li class="d-flex gap-1 px-2 py-1">
              <button
                class="btn btn-xs flex-fill"
                :class="selectedTheme === 'emerald' ? 'btn-success' : 'btn-outline-secondary'"
                @click="selectedTheme = 'emerald'"
              >
                Emerald
              </button>
              <button
                class="btn btn-xs flex-fill"
                :class="selectedTheme === 'indigo' ? 'btn-indigo' : 'btn-outline-secondary'"
                @click="selectedTheme = 'indigo'"
              >
                Indigo
              </button>
              <button
                class="btn btn-xs flex-fill"
                :class="selectedTheme === 'dark' ? 'btn-dark' : 'btn-outline-secondary'"
                @click="selectedTheme = 'dark'"
              >
                Dark
              </button>
              <button
                class="btn btn-xs flex-fill"
                :class="selectedTheme === 'light' ? 'btn-light' : 'btn-outline-secondary'"
                @click="selectedTheme = 'light'"
              >
                Light
              </button>
            </li>
          </ul>
        </div>

        <button class="btn btn-outline-success btn-sm fw-semibold d-inline-flex align-items-center gap-1" @click="exportCsv">
          <i class="bi bi-download"></i>
          <span>📥 CSV</span>
        </button>

        <button class="btn btn-outline-secondary btn-sm fw-semibold d-inline-flex align-items-center gap-1" @click="resetLayout">
          <i class="bi bi-arrow-counterclockwise"></i>
          <span>🔄 초기화</span>
        </button>
      </div>
    </div>

    <!-- 메인 메트릭스 & 우측 태스크 패널 (Excel / RealPivot2 레이아웃) -->
    <div class="row g-3">
      <!-- 메인 피벗 메트릭스 (Left - 8 columns) -->
      <div class="col-xl-8 col-lg-7 d-flex flex-column gap-3">
        <!-- 미니 차트 카셀 (옵션) -->
        <transition name="fade">
          <div v-if="showChart && chartBars.length > 0" class="b2b-card p-3 shadow-sm border-0">
            <div class="d-flex align-items-center justify-content-between mb-2">
              <h6 class="fw-bold b2b-text-h2 text-theme-primary m-0 d-flex align-items-center gap-2">
                <i class="bi bi-bar-chart-line-fill text-primary"></i>피벗 매트릭스 시각화
              </h6>
              <span class="b2b-text-xs text-theme-secondary">주요 그룹별 연봉 수치 비교</span>
            </div>
            <div class="d-flex align-items-end gap-2 pt-2 overflow-auto custom-scrollbar" style="min-height: 120px;">
              <div
                v-for="(bar, bIdx) in chartBars"
                :key="`bar-${bIdx}`"
                class="d-flex flex-column align-items-center flex-fill text-center"
                style="min-width: 60px;"
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
        <div class="b2b-card d-flex flex-column shadow-sm border-0 flex-grow-1 position-relative">
          <div class="b2b-card-header bg-theme-card py-2 px-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
            <span class="b2b-text-h2 text-theme-primary d-flex align-items-center gap-2">
              <i class="bi bi-table text-warning"></i>피벗 결과 매트릭스
            </span>
            <div class="d-flex align-items-center gap-3">
              <span v-if="activeFilterCount > 0" class="badge bg-warning-subtle text-warning border border-warning-subtle">
                <i class="bi bi-funnel-fill me-1"></i>필터 적용 중 ({{ activeFilterCount }}개)
              </span>
              <span class="text-theme-secondary b2b-text-sm">
                {{ pivot.rowKeys.length }}행 × {{ pivot.leafCols.length }}열 · 집계 {{ filteredDataset.length }} / {{ dataset.length }}건
              </span>
            </div>
          </div>

          <div
            class="b2b-card-body p-0 flex-grow-1"
            @contextmenu.prevent="openContextMenu($event)"
            title="마우스 우클릭 시 뷰 옵션 서브메뉴가 열립니다."
          >
            <div v-if="valueFields.length === 0" class="pivot-empty">
              <i class="bi bi-arrow-right-circle me-2"></i>우측 <b>값(Values)</b> 영역에 필드를 배치하면 집계가 시작됩니다.
            </div>

            <div v-else class="pivot-table-scroll" :class="`layout-${layoutMode}`" :style="{ height: height }">
              <table class="pivot-table tabular-nums">
                <thead>
                  <!-- 상단: 열 필드 그룹 헤더 -->
                  <tr>
                    <th class="pivot-corner" :rowspan="pivot.headerDepth" :colspan="1">
                      {{ pivot.rowHeaderLabel }}
                    </th>
                    <template v-if="pivot.hasCols">
                      <th
                        v-for="grp in pivot.colGroups"
                        :key="grp.key"
                        :colspan="grp.span"
                        class="pivot-colhead-group"
                      >
                        {{ grp.label }}
                      </th>
                      <th class="pivot-colhead-total pivot-total-head" :rowspan="pivot.headerDepth">
                        총계
                      </th>
                    </template>
                    <template v-else>
                      <th v-for="m in pivot.leafCols" :key="m.key">
                        {{ m.label }}
                      </th>
                    </template>
                  </tr>

                  <!-- 하단: 세부 지표 헤더 (열 필드가 있을 때) -->
                  <tr v-if="pivot.hasCols && pivot.headerDepth > 1">
                    <th v-for="m in pivot.leafCols" :key="m.key">
                      {{ m.label }}
                    </th>
                  </tr>
                </thead>

                <tbody>
                  <template v-for="(r, rIdx) in pivot.bodyRows" :key="`r-${rIdx}`">
                    <tr
                      v-if="r.type === 'data'"
                      class="pivot-data-row"
                    >
                      <th class="pivot-rowhead" :style="{ paddingLeft: layoutMode === 'tree' ? `${(r.depth || 0) * 16 + 10}px` : '10px' }">
                        <i v-if="layoutMode === 'tree'" class="bi bi-folder2-open me-1 text-primary"></i>
                        <span v-html="escapeHtml(r.label)"></span>
                      </th>
                      <td
                        v-for="(val, cIdx) in r.cells"
                        :key="`c-${rIdx}-${cIdx}`"
                        :style="getHeatmapStyle(val, cIdx)"
                      >
                        {{ fmtCell(val, cIdx) }}
                      </td>
                    </tr>
                    <tr
                      v-else-if="r.type === 'subtotal' && showSubtotals"
                      class="pivot-subtotal-row"
                    >
                      <th class="pivot-rowhead">
                        <i class="bi bi-calculator me-1 text-warning"></i>{{ r.label }}
                      </th>
                      <td v-for="(val, cIdx) in r.cells" :key="`sub-${rIdx}-${cIdx}`">
                        {{ fmtCell(val, cIdx) }}
                      </td>
                    </tr>
                  </template>
                </tbody>

                <!-- 최하단 총계 (Grand Total) -->
                <tfoot>
                  <tr class="pivot-grand-row">
                    <th class="pivot-rowhead">총계 (Grand Total)</th>
                    <td
                      v-for="(val, cIdx) in pivot.footer"
                      :key="`ft-${cIdx}`"
                      class="pivot-total-cell"
                    >
                      {{ fmtCell(val, cIdx) }}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- 우측 Task Pane 패널 (Right Column - 4 columns) -->
      <div class="col-xl-4 col-lg-5 d-flex flex-column gap-3">
        <!-- AI 피벗 패널 (RealPivot2 7편: 구성/분석/예측) -->
        <div v-if="showAiSection" class="b2b-card p-3 shadow-sm border-0">
          <div class="d-flex align-items-center justify-content-between mb-2">
            <h6 class="fw-bold b2b-text-h2 text-theme-primary m-0 d-flex align-items-center gap-2">
              <i class="bi bi-magic text-primary"></i>RealPivot2 AI 패널
            </h6>
            <div class="d-flex align-items-center gap-1">
              <span class="ai-conn-badge" :class="aiConnected ? 'is-on' : 'is-off'">
                <i class="bi" :class="aiConnected ? 'bi-plug-fill' : 'bi-plug'"></i>
                {{ aiConnected ? `${providerLabel}` : '로컬' }}
              </span>
              <button class="btn btn-xs btn-outline-secondary rounded-pill d-inline-flex align-items-center gap-1"
                      :class="{ active: showAiSettings }" title="LLM 연결 설정" @click="showAiSettings = !showAiSettings">
                <i class="bi bi-gear" :class="aiConnected ? 'text-success' : ''"></i>LLM
              </button>
            </div>
          </div>

          <!-- LLM 연결 설정 -->
          <transition name="fade">
            <div v-if="showAiSettings" class="ai-settings-box p-2.5 rounded mb-2.5">
              <div class="b2b-text-xs fw-bold text-theme-primary mb-1.5 d-flex align-items-center gap-1">
                <i class="bi bi-hdd-network text-primary"></i>LLM 서비스 연결 (본인 API 키)
              </div>
              <div class="d-flex flex-column gap-1.5">
                <select v-model="aiSettings.provider" class="form-select form-select-sm b2b-text-xs" @change="onProviderChange">
                  <option value="openai">OpenAI 호환 (GPT / 사내 프록시)</option>
                  <option value="anthropic">Anthropic Claude</option>
                </select>
                <input v-model.trim="aiSettings.model" type="text" class="form-control form-control-sm b2b-text-xs" :placeholder="`모델 (기본: ${defaultModelHint})`" />
                <input v-model.trim="aiSettings.baseUrl" type="text" class="form-control form-control-sm b2b-text-xs" :placeholder="`Base URL (기본: ${defaultBaseUrlHint})`" />
                <div class="input-group input-group-sm">
                  <input v-model.trim="aiSettings.apiKey" :type="showApiKey ? 'text' : 'password'" class="form-control form-control-sm b2b-text-xs" placeholder="API Key (sk-...)" autocomplete="off" />
                  <button class="btn btn-outline-secondary" type="button" @click="showApiKey = !showApiKey">
                    <i class="bi" :class="showApiKey ? 'bi-eye-slash' : 'bi-eye'"></i>
                  </button>
                </div>
              </div>
              <div class="d-flex align-items-center justify-content-between mt-1.5">
                <span class="b2b-text-xs" :class="aiTestState.cls"><i class="bi" :class="aiTestState.icon"></i> {{ aiTestState.text }}</span>
              </div>
              <div class="d-flex gap-1 mt-1.5">
                <button class="btn btn-xs btn-outline-danger flex-fill" @click="clearAiSettings">키 삭제</button>
                <button class="btn btn-xs btn-outline-primary flex-fill" :disabled="!aiSettings.apiKey || aiTesting" @click="testLlmConnection">
                  <span v-if="aiTesting" class="spinner-border spinner-border-sm"></span><span v-else>연결 테스트</span>
                </button>
                <button class="btn btn-xs btn-primary flex-fill fw-bold" @click="saveAiSettings">저장</button>
              </div>
            </div>
          </transition>

          <!-- 모드 탭 -->
          <div class="ai-mode-tabs mb-2.5">
            <button v-for="m in aiModes" :key="m.id" class="ai-mode-tab" :class="{ active: aiMode === m.id }" @click="setAiMode(m.id)">
              <i class="bi" :class="m.icon"></i><span>{{ m.label }}</span>
            </button>
          </div>

          <!-- 입력창 -->
          <div class="input-group input-group-sm mb-2">
            <span class="input-group-text bg-theme-subcard border-theme text-theme-secondary">
              <i class="bi bi-chat-quote-fill"></i>
            </span>
            <input
              v-model="aiPromptInput"
              type="text"
              class="form-control bg-theme-subcard border-theme text-theme-primary b2b-text-sm"
              :placeholder="currentModePlaceholder"
              @keyup.enter="runAi"
            />
            <button class="btn btn-primary b2b-text-sm px-3 fw-bold d-inline-flex align-items-center gap-1" :disabled="aiAnalyzing" @click="runAi">
              <span v-if="aiAnalyzing" class="spinner-border spinner-border-sm"></span>
              <i v-else class="bi" :class="currentMode.icon"></i>
            </button>
          </div>

          <!-- 추천 프롬프트 (모드별) -->
          <div class="d-flex flex-wrap gap-1.5 mb-2">
            <button
              v-for="(preset, pIdx) in currentPresets"
              :key="`ai-preset-${pIdx}`"
              class="btn btn-xs btn-outline-secondary rounded-pill text-truncate"
              style="max-width: 100%;"
              @click="applyPreset(preset)"
            >{{ preset.title }}</button>
          </div>

          <!-- 오류/로컬 안내 -->
          <div v-if="aiError" class="ai-error-box b2b-text-xs mb-2"><i class="bi bi-exclamation-triangle-fill me-1"></i>{{ aiError }}</div>
          <div v-else-if="aiUsedLocal && aiLastRanMode" class="ai-local-note b2b-text-xs mb-2"><i class="bi bi-cpu me-1"></i>LLM 미연결 → 로컬 엔진으로 처리했습니다.</div>

          <!-- 결과 (모드별) -->
          <transition name="fade">
            <div v-if="aiMode === 'configure' && aiResult" class="ai-result-box p-2.5 rounded">
              <div class="d-flex align-items-center justify-content-between mb-1.5">
                <span class="b2b-text-xs fw-bold text-success d-flex align-items-center gap-1"><i class="bi bi-check-circle-fill"></i>구성 설계 완료</span>
              </div>
              <p class="b2b-text-xs text-theme-secondary mb-1.5">{{ aiResult.explanation }}</p>
              <div class="d-flex flex-wrap gap-1 mb-2">
                <span v-for="r in aiResult.rowLabels" :key="`ar-${r}`" class="badge bg-primary-subtle text-primary border">행: {{ r }}</span>
                <span v-for="c in aiResult.colLabels" :key="`ac-${c}`" class="badge bg-info-subtle text-info border">열: {{ c }}</span>
                <span v-for="v in aiResult.valLabels" :key="`av-${v}`" class="badge bg-success-subtle text-success border">값: {{ v }}</span>
                <span v-if="aiResult.filterSummary" class="badge bg-warning-subtle text-warning border">필터: {{ aiResult.filterSummary }}</span>
              </div>
              <button class="btn btn-success btn-xs w-100 fw-bold py-1" @click="applyAiResultToPivot">
                <i class="bi bi-lightning-fill me-1"></i>피벗에 적용
              </button>
            </div>

            <div v-else-if="aiMode === 'analyze' && aiInsight" class="ai-result-box p-2.5 rounded">
              <span class="b2b-text-xs fw-bold text-primary d-flex align-items-center gap-1 mb-1"><i class="bi bi-graph-up-arrow"></i>분석 인사이트</span>
              <p class="b2b-text-xs fw-bold text-theme-primary mb-1.5">{{ aiInsight.headline }}</p>
              <ul class="ai-insight-list mb-0">
                <li v-for="(f, i) in aiInsight.findings" :key="`if-${i}`" class="b2b-text-xs"><i class="bi bi-dot"></i>{{ f }}</li>
              </ul>
              <p v-if="aiInsight.recommendation" class="ai-reco b2b-text-xs mt-2 mb-0"><i class="bi bi-lightbulb-fill text-warning me-1"></i>{{ aiInsight.recommendation }}</p>
            </div>

            <div v-else-if="aiMode === 'predict' && aiForecast" class="ai-result-box p-2.5 rounded">
              <div class="d-flex align-items-center justify-content-between mb-1">
                <span class="b2b-text-xs fw-bold text-primary d-flex align-items-center gap-1"><i class="bi bi-activity"></i>추세 예측</span>
                <span class="badge bg-primary-subtle text-primary border">{{ aiForecast.trendLabel }}</span>
              </div>
              <p class="b2b-text-xs text-theme-secondary mb-1.5">{{ aiForecast.note }}</p>
              <table class="ai-forecast-table b2b-text-xs mb-0">
                <thead><tr><th>{{ aiForecast.periodLabel }}</th><th class="text-end">{{ aiForecast.measureLabel }}</th></tr></thead>
                <tbody>
                  <tr v-for="(p, i) in aiForecast.points" :key="`fp-${i}`" :class="{ 'is-future': p.future }">
                    <td>{{ p.period }}<span v-if="p.future" class="ai-future-dot">예측</span></td>
                    <td class="text-end">{{ p.formatted }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </transition>
        </div>

        <!-- 엑셀 스타일 피벗 필드 설정 패널 (2x2 Grid) -->
        <div class="b2b-card p-3 shadow-sm border-0 flex-grow-1 d-flex flex-column">
          <div class="d-flex align-items-center justify-content-between mb-2">
            <h6 class="fw-bold b2b-text-h2 text-theme-primary m-0 d-flex align-items-center gap-2">
              <i class="bi bi-sliders text-primary"></i>피벗 필드 목록 &amp; 배치
            </h6>
            <button class="btn btn-link btn-xs text-decoration-none text-theme-secondary p-0" @click="resetLayout">
              초기화
            </button>
          </div>

          <!-- 전체 필드 풀 검색 -->
          <div class="input-group input-group-sm mb-2">
            <span class="input-group-text bg-theme-subcard border-theme text-theme-secondary">
              <i class="bi bi-search"></i>
            </span>
            <input
              v-model="fieldSearchQuery"
              type="text"
              class="form-control bg-theme-subcard border-theme text-theme-primary b2b-text-sm"
              placeholder="필드 검색..."
            />
          </div>

          <!-- 전체 필드 목록 (대기 풀) -->
          <div
            class="pivot-field-pool p-2 mb-3 border rounded-3 bg-theme-subcard flex-grow-1 overflow-auto custom-scrollbar"
            style="min-height: 100px; max-height: 140px;"
            @dragover.prevent="dragOverZone = 'none'"
            @drop="onDropZone('none', $event)"
          >
            <div class="b2b-text-xs text-theme-secondary mb-1 fw-semibold">
              대기 필드 (원하는 영역으로 드래그)
            </div>
            <div class="d-flex flex-wrap gap-1">
              <div
                v-for="f in filteredPoolFields"
                :key="f.id"
                class="pivot-chip"
                draggable="true"
                @dragstart="onDragStart(f, $event)"
                @click="cycleZone(f)"
              >
                <i class="bi bi-grip-vertical me-1 text-muted"></i>
                <span>{{ f.label }}</span>
                <i class="bi bi-plus ms-1 text-primary"></i>
              </div>
            </div>
          </div>

          <!-- 2x2 피벗 필드 배치 영역 (Filters, Columns, Rows, Values) -->
          <div class="row g-2">
            <!-- 1. 필터 영역 (Filters) -->
            <div class="col-6">
              <div
                class="pivot-drop-zone p-2 rounded-3 border bg-theme-card"
                :class="{ 'is-over': dragOverZone === 'filter' }"
                @dragover.prevent="dragOverZone = 'filter'"
                @dragleave="dragOverZone = null"
                @drop="onDropZone('filter', $event)"
              >
                <div class="d-flex align-items-center justify-content-between mb-1">
                  <span class="b2b-text-xs fw-bold text-theme-secondary d-flex align-items-center gap-1">
                    <i class="bi bi-funnel-fill text-warning"></i>필터 (Filters)
                  </span>
                  <span class="b2b-text-xs text-muted">{{ filterFields.length }}</span>
                </div>
                <div class="d-flex flex-column gap-1 min-h-60">
                  <div
                    v-for="f in filterFields"
                    :key="f.id"
                    class="pivot-chip-active bg-warning-subtle border-warning-subtle text-warning-emphasis"
                    draggable="true"
                    @dragstart="onDragStart(f, $event)"
                  >
                    <span class="flex-grow-1 text-truncate">{{ f.label }}</span>
                    <!-- 필터 값 선택 셀렉트 -->
                    <select
                      :value="activeFilters[f.id] || ''"
                      class="form-select form-select-xs py-0 px-1 border-0 bg-white"
                      style="width: 70px; font-size: 10px;"
                      @change="setFilterValue(f.id, $event.target.value)"
                    >
                      <option value="">전체</option>
                      <option v-for="opt in getDistinctFieldValues(f.id)" :key="opt" :value="opt">{{ opt }}</option>
                    </select>
                    <button class="btn-close btn-xs ms-1" @click="removeField(f)"></button>
                  </div>
                </div>
              </div>
            </div>

            <!-- 2. 열 영역 (Columns) -->
            <div class="col-6">
              <div
                class="pivot-drop-zone p-2 rounded-3 border bg-theme-card"
                :class="{ 'is-over': dragOverZone === 'col' }"
                @dragover.prevent="dragOverZone = 'col'"
                @dragleave="dragOverZone = null"
                @drop="onDropZone('col', $event)"
              >
                <div class="d-flex align-items-center justify-content-between mb-1">
                  <span class="b2b-text-xs fw-bold text-theme-secondary d-flex align-items-center gap-1">
                    <i class="bi bi-columns text-info"></i>열 축 (Columns)
                  </span>
                  <span class="b2b-text-xs text-muted">{{ colFields.length }}</span>
                </div>
                <div class="d-flex flex-column gap-1 min-h-60">
                  <div
                    v-for="f in colFields"
                    :key="f.id"
                    class="pivot-chip-active bg-info-subtle border-info-subtle text-info-emphasis"
                    draggable="true"
                    @dragstart="onDragStart(f, $event)"
                    @dragover.prevent
                    @drop.stop="onDropBefore(f, $event)"
                  >
                    <span class="flex-grow-1 text-truncate">{{ f.label }}</span>
                    <button class="btn-close btn-xs ms-1" @click="removeField(f)"></button>
                  </div>
                </div>
              </div>
            </div>

            <!-- 3. 행 영역 (Rows) -->
            <div class="col-6">
              <div
                class="pivot-drop-zone p-2 rounded-3 border bg-theme-card"
                :class="{ 'is-over': dragOverZone === 'row' }"
                @dragover.prevent="dragOverZone = 'row'"
                @dragleave="dragOverZone = null"
                @drop="onDropZone('row', $event)"
              >
                <div class="d-flex align-items-center justify-content-between mb-1">
                  <span class="b2b-text-xs fw-bold text-theme-secondary d-flex align-items-center gap-1">
                    <i class="bi bi-list-task text-primary"></i>행 축 (Rows)
                  </span>
                  <span class="b2b-text-xs text-muted">{{ rowFields.length }}</span>
                </div>
                <div class="d-flex flex-column gap-1 min-h-60">
                  <div
                    v-for="f in rowFields"
                    :key="f.id"
                    class="pivot-chip-active bg-primary-subtle border-primary-subtle text-primary-emphasis"
                    draggable="true"
                    @dragstart="onDragStart(f, $event)"
                    @dragover.prevent
                    @drop.stop="onDropBefore(f, $event)"
                  >
                    <span class="flex-grow-1 text-truncate">{{ f.label }}</span>
                    <button class="btn-close btn-xs ms-1" @click="removeField(f)"></button>
                  </div>
                </div>
              </div>
            </div>

            <!-- 4. 값 영역 (Values) -->
            <div class="col-6">
              <div
                class="pivot-drop-zone p-2 rounded-3 border bg-theme-card"
                :class="{ 'is-over': dragOverZone === 'value' }"
                @dragover.prevent="dragOverZone = 'value'"
                @dragleave="dragOverZone = null"
                @drop="onDropZone('value', $event)"
              >
                <div class="d-flex align-items-center justify-content-between mb-1">
                  <span class="b2b-text-xs fw-bold text-theme-secondary d-flex align-items-center gap-1">
                    <i class="bi bi-calculator-fill text-success"></i>값 축 (Values)
                  </span>
                  <span class="b2b-text-xs text-muted">{{ valueFields.length }}</span>
                </div>
                <div class="d-flex flex-column gap-1 min-h-60">
                  <div
                    v-for="f in valueFields"
                    :key="f.id"
                    class="pivot-value-row"
                    draggable="true"
                    @dragstart="onDragStart(f, $event)"
                  >
                    <span class="pivot-value-row__name text-truncate">{{ f.label }}</span>
                    <select
                      :value="f.agg || 'count'"
                      class="form-select form-select-xs pivot-agg-select"
                      @change="setAgg(f, $event.target.value)"
                    >
                      <option v-for="opt in aggOptions(f)" :key="opt.value" :value="opt.value">
                        {{ opt.label }}
                      </option>
                    </select>
                    <button class="btn-close btn-xs ms-1" @click="removeField(f)"></button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 플로팅 우클릭 컨텍스트 메뉴 (Flyout Submenu 포함) -->
    <div
      v-if="showContextMenu"
      class="custom-context-menu shadow-lg position-fixed border p-1 border-theme"
      :style="{ left: `${contextMenuX}px`, top: `${contextMenuY}px`, zIndex: 9999 }"
      @mouseleave="hoverSubmenu = null"
    >
      <!-- 1차 서브메뉴 항목들 -->
      <div
        class="context-item-parent"
        @mouseenter="hoverSubmenu = 'viewOptions'"
      >
        <div class="context-item d-flex align-items-center justify-content-between">
          <span><i class="bi bi-gear-fill me-2 text-primary"></i>⚙️ 뷰 옵션 (View Options)</span>
          <i class="bi bi-chevron-right ms-2 b2b-text-xs text-muted"></i>
        </div>

        <!-- 2차 플라이아웃 서브메뉴 (Hover 시 표시) -->
        <div
          v-if="hoverSubmenu === 'viewOptions'"
          class="context-submenu shadow-lg position-absolute border p-1 border-theme"
          :class="contextMenuX > (windowWidth - 450) ? 'submenu-left' : 'submenu-right'"
        >
          <div class="context-item-header b2b-text-xs text-theme-secondary px-2 py-1">표시 및 시각화</div>
          <button class="context-item d-flex align-items-center justify-content-between" @click="toggleContextOpt('showAiSection')">
            <span><i class="bi bi-magic me-2 text-primary"></i>AI 피벗 도우미</span>
            <i class="bi" :class="showAiSection ? 'bi-check2 text-success' : ''"></i>
          </button>
          <button class="context-item d-flex align-items-center justify-content-between" @click="toggleContextOpt('showHeatmap')">
            <span><i class="bi bi-fire me-2 text-danger"></i>매트릭스 히트맵</span>
            <i class="bi" :class="showHeatmap ? 'bi-check2 text-success' : ''"></i>
          </button>
          <button class="context-item d-flex align-items-center justify-content-between" @click="toggleContextOpt('showChart')">
            <span><i class="bi bi-bar-chart-fill me-2 text-info"></i>미니 차트 시각화</span>
            <i class="bi" :class="showChart ? 'bi-check2 text-success' : ''"></i>
          </button>
          <button class="context-item d-flex align-items-center justify-content-between" @click="toggleContextOpt('showSubtotals')">
            <span><i class="bi bi-calculator me-2 text-warning"></i>행 소계 표시</span>
            <i class="bi" :class="showSubtotals ? 'bi-check2 text-success' : ''"></i>
          </button>

          <div class="border-top my-1"></div>
          <div class="context-item-header b2b-text-xs text-theme-secondary px-2 py-1">레이아웃 모드</div>
          <button class="context-item ps-3" :class="{ 'active': layoutMode === 'tabular' }" @click="setLayoutModeContext('tabular')">
            📊 테이블형 (Tabular)
          </button>
          <button class="context-item ps-3" :class="{ 'active': layoutMode === 'compact' }" @click="setLayoutModeContext('compact')">
            🗜️ 압축형 (Compact)
          </button>
          <button class="context-item ps-3" :class="{ 'active': layoutMode === 'tree' }" @click="setLayoutModeContext('tree')">
            🌳 트리형 (Tree)
          </button>

          <div class="border-top my-1"></div>
          <div class="context-item-header b2b-text-xs text-theme-secondary px-2 py-1">테마 스타일</div>
          <button class="context-item ps-3" :class="{ 'active': selectedTheme === 'emerald' }" @click="setThemeContext('emerald')">
            🟢 RealGrid Emerald
          </button>
          <button class="context-item ps-3" :class="{ 'active': selectedTheme === 'indigo' }" @click="setThemeContext('indigo')">
            🟣 Corporate Indigo
          </button>
          <button class="context-item ps-3" :class="{ 'active': selectedTheme === 'dark' }" @click="setThemeContext('dark')">
            🌙 Dark Slate
          </button>
          <button class="context-item ps-3" :class="{ 'active': selectedTheme === 'light' }" @click="setThemeContext('light')">
            ☀️ Clean Light
          </button>
        </div>
      </div>

      <div class="border-top my-1"></div>

      <button class="context-item text-success" @click="exportCsvContext">
        <i class="bi bi-filetype-csv me-2"></i>CSV 내보내기
      </button>
      <button class="context-item text-warning" @click="resetLayoutContext">
        <i class="bi bi-arrow-counterclockwise me-2"></i>초기화
      </button>
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

const AI_PRESETS = [
  {
    title: '⚡ 부서별 · 근무지별 연봉',
    prompt: '부서별 근무지별 연봉 합계를 계산해서 보여줘',
    rowIds: ['dept'],
    colIds: ['region'],
    valConfigs: [{ id: 'salary', agg: 'sum' }],
    filterConfigs: {},
    explanation: '행 축에 부서, 열 축에 근무지를 배치하고 연봉의 합계를 계산하도록 교차 표를 구성했습니다.'
  },
  {
    title: '⚡ 입사연도별 평균 연봉',
    prompt: '입사연도별 인원수와 평균 연봉을 계산해줘',
    rowIds: ['joinYear'],
    colIds: [],
    valConfigs: [{ id: 'headcount', agg: 'count' }, { id: 'salary', agg: 'avg' }],
    filterConfigs: {},
    explanation: '입사연도별로 사원 인원수와 평균 연봉을 추적할 수 있도록 집계했습니다.'
  },
  {
    title: '⚡ 서울 부서별 최고 연봉',
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
    placeholder: '예: 부서별 근무지별 연봉 합계를 보여줘' },
  { id: 'analyze', label: '데이터 분석', desc: '인사이트', icon: 'bi-graph-up-arrow', runLabel: '분석 실행',
    placeholder: '예: 이 표의 핵심 특징과 상위/하위를 정리해줘' },
  { id: 'predict', label: '예측', desc: 'Forecast', icon: 'bi-activity', runLabel: '예측 실행',
    placeholder: '예: 이 추세라면 향후 3년은 어떻게 될까?' },
]

const ANALYZE_PRESETS = [
  { title: '📊 핵심 요약', prompt: '현재 피벗 결과의 핵심 특징을 3가지로 요약해줘' },
  { title: '🏆 상위/하위', prompt: '값이 가장 큰 그룹과 가장 작은 그룹을 알려줘' },
  { title: '⚖️ 비중 분석', prompt: '각 그룹이 전체에서 차지하는 비중을 분석해줘' },
]

const PREDICT_PRESETS = [
  { title: '📈 향후 3기간', prompt: '현재 추세로 향후 3개 기간의 값을 예측해줘' },
  { title: '🔮 추세 방향', prompt: '값이 증가 추세인지 감소 추세인지 예측해줘' },
]

const PROVIDER_DEFAULTS = {
  openai: { model: 'gpt-4o-mini', baseUrl: 'https://api.openai.com/v1', label: 'OpenAI' },
  anthropic: { model: 'claude-sonnet-4-5', baseUrl: 'https://api.anthropic.com', label: 'Claude' },
}

const AI_SETTINGS_KEY = 'realpivot_ai_settings'

export default {
  name: 'RealPivotStudio',
  props: {
    height: {
      type: String,
      default: 'calc(100vh - 180px)'
    }
  },
  data() {
    return {
      dataset: [],
      loading: true,
      dragOverZone: null,
      showSubtotals: true,
      showHeatmap: false,
      showChart: false,
      showAiSection: true,
      selectedTheme: 'emerald',
      layoutMode: 'tabular',
      fieldSearchQuery: '',
      copied: false,

      showContextMenu: false,
      contextMenuX: 0,
      contextMenuY: 0,
      hoverSubmenu: null,
      windowWidth: typeof window !== 'undefined' ? window.innerWidth : 1200,

      aiPromptInput: '',
      aiAnalyzing: false,
      aiResult: null,          // 구성(configure) 결과
      aiInsight: null,         // 분석(analyze) 결과
      aiForecast: null,        // 예측(predict) 결과
      aiPresets: AI_PRESETS,
      aiModes: AI_MODES,
      aiMode: 'configure',     // configure | analyze | predict
      aiError: '',
      aiUsedLocal: false,
      aiLastRanMode: false,

      // LLM 연결 설정 (BYO Key)
      showAiSettings: false,
      showApiKey: false,
      aiTesting: false,
      aiTestResult: null,      // null | 'ok' | 'fail'
      aiSettings: { provider: 'openai', model: '', baseUrl: '', apiKey: '' },

      activeFilters: {},

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
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.onResize)
    }
  },
  beforeUnmount() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.onResize)
    }
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

    // ---- AI 패널 파생 상태 ----
    currentMode() { return this.aiModes.find(m => m.id === this.aiMode) || this.aiModes[0] },
    currentModePlaceholder() { return this.currentMode.placeholder },
    currentPresets() {
      if (this.aiMode === 'analyze') return ANALYZE_PRESETS
      if (this.aiMode === 'predict') return PREDICT_PRESETS
      return this.aiPresets
    },
    aiConnected() { return Boolean(this.aiSettings.apiKey) },
    providerLabel() { return (PROVIDER_DEFAULTS[this.aiSettings.provider] || {}).label || 'LLM' },
    defaultModelHint() { return (PROVIDER_DEFAULTS[this.aiSettings.provider] || {}).model || '' },
    defaultBaseUrlHint() { return (PROVIDER_DEFAULTS[this.aiSettings.provider] || {}).baseUrl || '' },
    aiTestState() {
      if (this.aiTesting) return { text: '연결 확인 중...', icon: 'bi-hourglass-split', cls: 'text-theme-secondary' }
      if (this.aiTestResult === 'ok') return { text: '연결 성공 · LLM 응답 확인됨', icon: 'bi-check-circle-fill', cls: 'text-success' }
      if (this.aiTestResult === 'fail') return { text: '연결 실패 · 키/모델/URL·CORS 확인', icon: 'bi-x-circle-fill', cls: 'text-danger' }
      if (this.aiConnected) return { text: '키 저장됨 · 연결 테스트 권장', icon: 'bi-plug-fill', cls: 'text-theme-secondary' }
      return { text: 'API 키 미입력 · 로컬 엔진으로 동작', icon: 'bi-info-circle', cls: 'text-theme-secondary' }
    },

    currentThemeName() {
      const names = { emerald: 'RealGrid Emerald', indigo: 'Corporate Indigo', dark: 'Dark Slate', light: 'Clean Light' }
      return names[this.selectedTheme] || 'Emerald'
    },

    layoutModeLabel() {
      const labels = { tabular: '테이블형', compact: '압축형', tree: '트리형' }
      return labels[this.layoutMode] || '테이블형'
    },

    filteredDataset() {
      const activeFilterEntries = Object.entries(this.activeFilters).filter(([_, val]) => Boolean(val))
      if (activeFilterEntries.length === 0) return this.dataset

      return this.dataset.filter(row => {
        return activeFilterEntries.every(([fieldId, filterVal]) => {
          return String(row[fieldId]) === String(filterVal)
        })
      })
    },

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
            seen.set(key, fieldsArr.map(f => r[f.id]))
          }
        })
        return Array.from(seen.values())
      }

      const rowTuples = distinct(rF)
      const colTuples = distinct(cF)

      const leafCols = []
      colTuples.forEach(cT => {
        vF.forEach(v => {
          const key = [...cT, v.id].join(SEP)
          const label = cF.length ? v.label : v.label
          leafCols.push({ key, tuple: cT, measure: v, label })
        })
      })

      const leafColsWithTotal = [...leafCols]
      vF.forEach(v => {
        leafColsWithTotal.push({
          key: `GT${SEP}${v.id}`,
          isTotal: true,
          measure: v,
          label: `합계·${v.label}`
        })
      })

      const colGroups = []
      if (hasCols) {
        colTuples.forEach(cT => {
          colGroups.push({
            key: cT.join(SEP),
            label: cT.join(' / '),
            span: vF.length,
          })
        })
      }

      const match = (r, tuple) => {
        return tuple.every((val, idx) => {
          const f = cF[idx]
          return String(r[f.id]) === String(val)
        })
      }

      const matchRow = (r, tuple) => {
        return tuple.every((val, idx) => {
          const f = rF[idx]
          return String(r[f.id]) === String(val)
        })
      }

      const aggregate = (rowsSubset, m) => {
        // count 는 데이터 컬럼이 없는 합성 필드(headcount)도 지원해야 하므로 숫자값 체크보다 먼저 처리
        if (m.agg === 'count') return rowsSubset.length ? rowsSubset.length : null
        if (!rowsSubset.length) return null
        const vals = rowsSubset.map(r => Number(r[m.id])).filter(v => !isNaN(v))
        if (!vals.length) return null
        switch (m.agg) {
          case 'sum': return vals.reduce((a, b) => a + b, 0)
          case 'avg': return vals.reduce((a, b) => a + b, 0) / vals.length
          case 'min': return Math.min(...vals)
          case 'max': return Math.max(...vals)
          default: return vals.reduce((a, b) => a + b, 0)
        }
      }

      const bodyRows = []
      let lastFirstGroup = null

      rowTuples.forEach((rT, rIdx) => {
        const firstVal = rT[0]
        if (this.showSubtotals && rF.length > 1 && lastFirstGroup !== null && lastFirstGroup !== firstVal) {
          bodyRows.push(this.buildSubtotal(lastFirstGroup, rF, leafColsWithTotal, data, aggregate, match))
        }

        const groupRows = data.filter(r => matchRow(r, rT))

        const cells = leafColsWithTotal.map(lc => {
          const subset = lc.isTotal ? groupRows : groupRows.filter(r => match(r, lc.tuple))
          return aggregate(subset, lc.measure)
        })

        const labelStr = rT.length ? rT.join(' <span class="pivot-lvl-sep">›</span> ') : '전체 요약'
        const depth = rT.length > 1 ? (rT.length - 1) : 0
        bodyRows.push({ type: 'data', tuple: rT, label: labelStr, depth, cells })

        lastFirstGroup = firstVal
      })

      if (this.showSubtotals && rF.length > 1 && lastFirstGroup !== null) {
        bodyRows.push(this.buildSubtotal(lastFirstGroup, rF, leafColsWithTotal, data, aggregate, match))
      }

      const footer = leafColsWithTotal.map(lc => {
        const subset = lc.isTotal ? data : data.filter(r => match(r, lc.tuple))
        return aggregate(subset, lc.measure)
      })

      const rowHeaderLabel = rF.map(f => f.label).join(' › ') || '전체'

      return {
        rowKeys: rowTuples,
        leafCols,
        leafColsWithTotal,
        colGroups,
        bodyRows,
        footer,
        hasCols,
        headerDepth: hasCols ? 2 : 1,
        rowHeaderLabel,
      }
    },

    cellValueBounds() {
      if (!this.pivot || !this.pivot.bodyRows) return { min: 0, max: 0 }
      let min = Infinity, max = -Infinity
      this.pivot.bodyRows.forEach(r => {
        if (r.type === 'data') {
          r.cells.forEach(v => {
            if (v !== null && v !== undefined && !isNaN(v)) {
              if (v < min) min = v
              if (v > max) max = v
            }
          })
        }
      })
      return { min: min === Infinity ? 0 : min, max: max === -Infinity ? 0 : max }
    },

    chartBars() {
      if (!this.pivot || !this.pivot.bodyRows || this.pivot.bodyRows.length === 0) return []
      const bars = []
      const firstValMeasure = this.valueFields[0]
      const agg = firstValMeasure?.agg || 'sum'

      this.pivot.bodyRows.forEach(r => {
        if (r.type === 'data' && r.cells.length > 0) {
          const rawVal = r.cells[0]
          if (rawVal !== null && rawVal !== undefined && !isNaN(rawVal)) {
            bars.push({
              label: r.label.replace(/<[^>]*>?/gm, ''),
              val: rawVal,
              formattedVal: Number(rawVal).toLocaleString('ko-KR', { maximumFractionDigits: agg === 'avg' ? 1 : 0 })
            })
          }
        }
      })

      if (bars.length === 0) return []
      const maxVal = Math.max(...bars.map(b => b.val)) || 1
      return bars.slice(0, 10).map(b => ({
        ...b,
        pct: Math.max(12, Math.round((b.val / maxVal) * 100))
      }))
    },
  },
  methods: {
    onResize() {
      if (typeof window !== 'undefined') {
        this.windowWidth = window.innerWidth
      }
    },
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

    openContextMenu(evt) {
      this.contextMenuX = Math.min(evt.clientX, window.innerWidth - 220)
      this.contextMenuY = Math.min(evt.clientY, window.innerHeight - 300)
      this.hoverSubmenu = null
      this.showContextMenu = true
    },
    closeContextMenu() {
      this.showContextMenu = false
      this.hoverSubmenu = null
    },

    toggleContextOpt(propKey) {
      this[propKey] = !this[propKey]
      this.closeContextMenu()
    },
    setLayoutModeContext(mode) {
      this.layoutMode = mode
      this.closeContextMenu()
    },
    setThemeContext(theme) {
      this.selectedTheme = theme
      this.closeContextMenu()
    },
    exportCsvContext() {
      this.exportCsv()
      this.closeContextMenu()
    },
    resetLayoutContext() {
      this.resetLayout()
      this.closeContextMenu()
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

    getHeatmapStyle(val, cIdx) {
      if (!this.showHeatmap || val === null || val === undefined || isNaN(val)) return {}
      const { min, max } = this.cellValueBounds
      if (max === min) return {}
      const ratio = (val - min) / (max - min)

      if (this.selectedTheme === 'indigo') {
        return {
          backgroundColor: `rgba(99, 102, 241, ${0.1 + ratio * 0.45})`,
          fontWeight: ratio > 0.6 ? '700' : 'normal'
        }
      } else if (this.selectedTheme === 'dark') {
        return {
          backgroundColor: `rgba(59, 130, 246, ${0.15 + ratio * 0.5})`,
          fontWeight: ratio > 0.6 ? '700' : 'normal'
        }
      }
      return {
        backgroundColor: `rgba(16, 185, 129, ${0.1 + ratio * 0.45})`,
        fontWeight: ratio > 0.6 ? '700' : 'normal'
      }
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
      if (lower.includes('직군') || lower.includes('직급') || lower.includes('역할')) detectedDims.push('role')
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
      const measureLabel = measureLc ? measureLc.label : '값'
      const rows = p.bodyRows
        .filter(r => r.type === 'data')
        .map(r => ({
          label: String(r.label || '').replace(/<[^>]+>/g, ' ').replace(/›/g, '›').replace(/\s+/g, ' ').trim(),
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
          const label = String(r.label || '').replace(/<[^>]+>/g, ' ').replace(/›/g, ' ').replace(/\s+/g, ' ').trim()
          const leaf = label.split(' ').pop()
          return { period: leaf, x: Number(leaf), y: Number(r.cells[primaryIdx]) || 0 }
        })
        .filter(pt => !Number.isNaN(pt.x))
        .sort((a, b) => a.x - b.x)
      if (points.length < 2) return null
      return {
        points,
        measureLabel: measureLc ? measureLc.label : '값',
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
    onProviderChange() { this.aiTestResult = null },
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

      this.fields.forEach(f => { f.zone = 'none' })
      this.activeFilters = {}

      this.aiResult.rowIds.forEach(id => {
        const f = this.fields.find(x => x.id === id)
        if (f) f.zone = 'row'
      })

      this.aiResult.colIds.forEach(id => {
        const f = this.fields.find(x => x.id === id)
        if (f) f.zone = 'col'
      })

      this.aiResult.valConfigs.forEach(vc => {
        const f = this.fields.find(x => x.id === vc.id)
        if (f) {
          f.zone = 'value'
          f.agg = vc.agg
        }
      })

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

      let csv = ''
      if (p.colGroups.length > 0) {
        const row1 = [esc(p.rowHeaderLabel)]
        p.colGroups.forEach(g => {
          for (let i = 0; i < g.span; i++) row1.push(esc(g.label))
        })
        row1.push('총계')
        csv += row1.join(',') + '\n'
      }

      const row2 = p.colGroups.length > 0 ? [''] : [esc(p.rowHeaderLabel)]
      p.leafColsWithTotal.forEach(c => row2.push(esc(c.label)))
      csv += row2.join(',') + '\n'

      p.bodyRows.forEach(r => {
        const row = [esc(r.label.replace(/<[^>]*>?/gm, ''))]
        r.cells.forEach(v => row.push(v === null || v === undefined ? '' : v))
        csv += row.join(',') + '\n'
      })

      const fRow = ['총계 (Grand Total)']
      p.footer.forEach(v => fRow.push(v === null || v === undefined ? '' : v))
      csv += fRow.join(',') + '\n'

      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `Pivot_Export_${new Date().toISOString().slice(0, 10)}.csv`
      link.click()
    }
  }
}
</script>

<style scoped>
/* 테마 시스템 */
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

.view-options-menu {
  border-radius: 12px;
  border: 1px solid var(--border-color);
  background: var(--bg-card);
}

.custom-context-menu {
  min-width: 210px;
  background: var(--bg-card);
  border-color: var(--border-color) !important;
  border-radius: 10px;
  animation: context-fadeIn 0.15s ease-out;
}
@keyframes context-fadeIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

.context-item-parent { position: relative; }

.context-submenu {
  top: 0;
  min-width: 220px;
  background: var(--bg-card);
  border-color: var(--border-color) !important;
  border-radius: 10px;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.18) !important;
  animation: submenu-fadeIn 0.15s ease-out;
}
.submenu-right { left: 100%; margin-left: 4px; }
.submenu-left { right: 100%; margin-right: 4px; }

@keyframes submenu-fadeIn {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}

.context-item {
  width: 100%;
  padding: 6px 12px;
  background: transparent;
  border: 0;
  text-align: left;
  font-size: 12.5px;
  color: var(--text-primary);
  border-radius: 6px;
  transition: all 0.12s ease;
}
.context-item:hover { background: var(--b2b-color-primary-subtle); color: var(--b2b-color-primary); }
.context-item.active { font-weight: 700; color: var(--b2b-color-primary); }
.context-item-header { font-weight: 700; }

.btn-indigo { background: #6366F1; color: #fff; border-color: #6366F1; }
.btn-indigo:hover { background: #4F46E5; color: #fff; }

.pivot-chip {
  display: inline-flex;
  align-items: center;
  padding: 3px 7px;
  border-radius: 6px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  font-size: 11.5px;
  font-weight: 600;
  cursor: grab;
  user-select: none;
  transition: all 0.15s ease;
}
.pivot-chip:hover { border-color: var(--b2b-color-primary); color: var(--b2b-color-primary); }

.pivot-chip-active {
  display: flex;
  align-items: center;
  padding: 3px 7px;
  border-radius: 6px;
  border: 1px solid transparent;
  font-size: 11.5px;
  font-weight: 600;
  cursor: grab;
  user-select: none;
}

.pivot-drop-zone {
  min-height: 90px;
  border: 1px dashed var(--border-color) !important;
  transition: all 0.15s ease;
}
.pivot-drop-zone.is-over {
  border-color: var(--b2b-color-primary) !important;
  background: var(--b2b-color-primary-subtle) !important;
}
.min-h-60 { min-height: 55px; }

.pivot-chart-bar-wrap { width: 100%; }
.pivot-chart-bar {
  background: linear-gradient(180deg, var(--b2b-color-primary) 0%, rgba(16, 185, 129, 0.4) 100%);
  transition: height 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.pivot-table-scroll {
  overflow: auto;
  max-height: calc(100vh - 180px);
  min-height: 180px;
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

.layout-compact .pivot-table th,
.layout-compact .pivot-table td { padding: 4px 8px; font-size: 12px; }

.cursor-pointer { cursor: pointer; }
.btn-xs { padding: 0 4px; font-size: 10px; }
.theme-chip-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--b2b-color-primary-subtle);
  color: var(--b2b-color-primary);
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* ===== RealPivot2 AI 패널 (구성/분석/예측) ===== */
.ai-conn-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 3px;
}
.ai-conn-badge.is-on { background: rgba(22, 163, 74, 0.15); color: #16a34a; border: 1px solid rgba(22, 163, 74, 0.35); }
.ai-conn-badge.is-off { background: var(--bg-subcard); color: var(--text-secondary); border: 1px solid var(--border-color); }

.ai-settings-box {
  background: var(--bg-subcard);
  border: 1px solid color-mix(in srgb, var(--border-color) 70%, #6366f1);
}

.ai-mode-tabs {
  display: flex;
  gap: 4px;
  background: var(--bg-subcard);
  padding: 3px;
  border-radius: 9px;
  border: 1px solid var(--border-color);
}
.ai-mode-tab {
  flex: 1 1 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 5px 6px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 11.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}
.ai-mode-tab:hover { color: var(--b2b-color-primary, #10b981); }
.ai-mode-tab.active {
  background: var(--bg-card);
  color: var(--b2b-color-primary, #10b981);
  box-shadow: 0 2px 6px rgba(0,0,0,0.08);
}

.ai-error-box {
  color: #b91c1c;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: 6px;
  padding: 6px 9px;
}
.ai-local-note {
  color: var(--text-secondary);
  background: var(--bg-subcard);
  border: 1px dashed var(--border-color);
  border-radius: 6px;
  padding: 6px 9px;
}

.ai-result-box {
  background: var(--bg-subcard);
  border: 1px solid var(--border-color);
}
.ai-insight-list { list-style: none; padding: 0; margin: 0; }
.ai-insight-list li { color: var(--text-primary); padding: 1px 0; line-height: 1.45; }
.ai-insight-list li .bi { color: var(--b2b-color-primary, #10b981); }
.ai-reco {
  background: rgba(250, 204, 21, 0.1);
  border-left: 3px solid #facc15;
  border-radius: 4px;
  padding: 6px 8px;
  color: var(--text-primary);
}

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
  color: var(--b2b-color-primary, #10b981);
  font-weight: 700;
  background: color-mix(in srgb, var(--b2b-color-primary, #10b981) 12%, transparent);
}
.ai-future-dot {
  font-size: 8px;
  font-weight: 700;
  margin-left: 5px;
  padding: 1px 5px;
  border-radius: 999px;
  background: var(--b2b-color-primary, #10b981);
  color: #fff;
}
.btn-xs {
  font-size: 11px;
  padding: 2px 8px;
  line-height: 1.4;
}
</style>
