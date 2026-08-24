<template>
  <div class="b2b-page-container py-3 reg-page">
    <!-- Page Title -->
    <div class="mb-3 d-flex align-items-end gap-2 flex-wrap">
      <div>
        <h4 class="b2b-text-h1 fw-bold text-theme-primary m-0">규격/규제 정보 관리</h4>
        <p class="text-muted small mb-0 mt-1">
          제품을 판매하려면 지켜야 하는 규제·규격을 <strong>권역/국가 · 사업부/제품군/제품</strong> 단위로 등록하고,
          저장 직전에 기존 데이터와의 <strong>상·하위 충돌</strong>을 판정합니다.
        </p>
      </div>
      <div class="ms-auto d-flex align-items-center gap-2">
        <span class="b2b-badge b2b-badge-outline">정보 {{ records.length }}건</span>
        <span class="b2b-badge b2b-badge-warning">충돌이력 {{ conflicts.length }}건</span>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- 1. 검색 그리드 (조회 조건 폼)                                  -->
    <!-- ============================================================ -->
    <form class="search-box-container b2b-card px-4 py-3 mb-3 bg-theme-subcard border border-theme rounded-3" @submit.prevent="search">
      <div class="row gx-4 gy-3">
        <div class="col-12 col-md-3">
          <label class="b2b-form-label b2b-text-sm text-theme-primary mb-2 fw-semibold">규제/규격명</label>
          <div class="input-group input-group-sm">
            <input
              v-model="filters.keyword"
              class="form-control form-control-sm border-theme bg-theme-card text-theme-primary"
              placeholder="규제명 · 규격명 · 규제번호"
              @keydown.enter.prevent="search"
            />
            <button type="button" class="btn btn-sm btn-outline-secondary border-theme bg-theme-card text-theme-secondary px-2.5" @click="search">
              <i class="bi bi-search"></i>
            </button>
          </div>
        </div>

        <div class="col-6 col-md-2">
          <label class="b2b-form-label b2b-text-sm text-theme-primary mb-2 fw-semibold">분야</label>
          <select v-model="filters.fieldCd" class="form-select form-select-sm bg-theme-card text-theme-primary border-theme">
            <option value="">전체</option>
            <option v-for="f in fieldCodes" :key="f.code" :value="f.code">{{ f.name }}</option>
          </select>
        </div>

        <div class="col-6 col-md-2">
          <label class="b2b-form-label b2b-text-sm text-theme-primary mb-2 fw-semibold">권역</label>
          <select v-model="filters.regionCd" class="form-select form-select-sm bg-theme-card text-theme-primary border-theme">
            <option value="">전체</option>
            <option v-for="r in regionCodes" :key="r.code" :value="r.code">{{ r.name }}</option>
          </select>
        </div>

        <div class="col-6 col-md-2">
          <label class="b2b-form-label b2b-text-sm text-theme-primary mb-2 fw-semibold">국가</label>
          <select v-model="filters.countryCd" class="form-select form-select-sm bg-theme-card text-theme-primary border-theme">
            <option value="">전체</option>
            <option v-for="c in filteredCountryCodes" :key="c.code" :value="c.code">{{ c.name }}</option>
          </select>
        </div>

        <div class="col-6 col-md-3">
          <label class="b2b-form-label b2b-text-sm text-theme-primary mb-2 fw-semibold">규제</label>
          <select v-model="filters.regulationCd" class="form-select form-select-sm bg-theme-card text-theme-primary border-theme">
            <option value="">전체</option>
            <option v-for="rg in regulationCodes" :key="rg.code" :value="rg.code">{{ rg.name }}</option>
          </select>
        </div>

        <div class="col-6 col-md-2">
          <label class="b2b-form-label b2b-text-sm text-theme-primary mb-2 fw-semibold">사업부</label>
          <select v-model="filters.divisionCd" class="form-select form-select-sm bg-theme-card text-theme-primary border-theme">
            <option value="">전체</option>
            <option v-for="d in divisionCodes" :key="d.code" :value="d.code">{{ d.name }}</option>
          </select>
        </div>

        <div class="col-6 col-md-2">
          <label class="b2b-form-label b2b-text-sm text-theme-primary mb-2 fw-semibold">제품군</label>
          <select v-model="filters.productGroupCd" class="form-select form-select-sm bg-theme-card text-theme-primary border-theme">
            <option value="">전체</option>
            <option v-for="pg in filteredProductGroupCodes" :key="pg.code" :value="pg.code">{{ pg.name }}</option>
          </select>
        </div>

        <div class="col-6 col-md-2">
          <label class="b2b-form-label b2b-text-sm text-theme-primary mb-2 fw-semibold">제품</label>
          <select v-model="filters.productCd" class="form-select form-select-sm bg-theme-card text-theme-primary border-theme">
            <option value="">전체</option>
            <option v-for="p in filteredProductCodes" :key="p.code" :value="p.code">{{ p.name }}</option>
          </select>
        </div>

        <div class="col-6 col-md-2">
          <label class="b2b-form-label b2b-text-sm text-theme-primary mb-2 fw-semibold">상태</label>
          <select v-model="filters.statusCd" class="form-select form-select-sm bg-theme-card text-theme-primary border-theme">
            <option value="">전체</option>
            <option v-for="s in statusCodes" :key="s.code" :value="s.code">{{ s.name }}</option>
          </select>
        </div>

        <div class="col-12 col-md-4">
          <label class="b2b-form-label b2b-text-sm text-theme-primary mb-2 fw-semibold">시행일 (기간)</label>
          <div class="d-flex align-items-center gap-1.5">
            <B2bDatePicker v-model="filters.effectiveFrom" placeholder="시작일" :enable-time-picker="false" :show-presets="true" />
            <span class="text-theme-secondary b2b-text-sm fw-bold">~</span>
            <B2bDatePicker v-model="filters.effectiveTo" placeholder="종료일" :enable-time-picker="false" :show-presets="true" />
          </div>
        </div>
      </div>

      <div class="d-flex align-items-center gap-2 mt-3 pt-3 border-top border-theme">
        <div class="form-check form-check-inline mb-0">
          <input id="onlyConflict" v-model="filters.onlyConflict" class="form-check-input" type="checkbox" />
          <label class="form-check-label b2b-text-sm text-theme-primary" for="onlyConflict">충돌 이력이 있는 건만</label>
        </div>
        <div class="ms-auto d-flex gap-2">
          <button type="button" class="btn-b2b-action" @click="resetFilters">
            <i class="bi bi-arrow-counterclockwise me-1"></i>초기화
          </button>
          <button type="submit" class="btn-b2b-primary">
            <i class="bi bi-search me-1"></i>조회
          </button>
        </div>
      </div>
    </form>

    <!-- ============================================================ -->
    <!-- 2. 리얼그리드 (정보 레코드 목록)                                -->
    <!-- ============================================================ -->
    <div class="b2b-card shadow-sm border">
      <div class="b2b-card-header bg-theme-subcard py-2.5 px-3 d-flex flex-wrap align-items-center gap-2 border-bottom">
        <span class="fw-bold text-theme-primary">
          <i class="bi bi-shield-check text-primary me-1"></i>규제 정보 목록
        </span>
        <span class="b2b-badge b2b-badge-secondary">{{ gridRows.length }}건</span>
        <span v-if="selectedRecord" class="b2b-text-xs text-muted ms-1">
          선택: <strong>{{ selectedRecord.regNo }}</strong> · v{{ selectedRecord.versionNo }}
        </span>

        <div class="ms-auto d-flex align-items-center gap-2">
          <button class="btn-b2b-action" @click="openCreate">
            <i class="bi bi-plus-lg text-success me-1"></i>신규 등록
          </button>
          <button class="btn-b2b-action" :disabled="!selectedRecord" @click="openEdit">
            <i class="bi bi-pencil-square text-primary me-1"></i>수정
          </button>
          <button class="btn-b2b-action" :disabled="!selectedRecord" @click="openHistory">
            <i class="bi bi-clock-history text-warning me-1"></i>이력
          </button>
          <button class="btn-b2b-action" :disabled="!selectedRecord" @click="removeRecord">
            <i class="bi bi-trash text-danger me-1"></i>삭제
          </button>
          <button class="btn-b2b-action" @click="exportExcel">
            <i class="bi bi-file-earmark-excel text-success me-1"></i>엑셀
          </button>
        </div>
      </div>

      <div class="b2b-card-body p-2">
        <RealGridCommonJs
          ref="grid"
          grid-id="regInfoGrid"
          height="520px"
          :fields="gridFields"
          :columns="gridColumns"
          :rows="gridRows"
          :editable="false"
          :checkable="true"
          :sortable="true"
          :filterable="true"
          :group-panel-visible="true"
          fit-style="evenFill"
          :toast="gridToast"
          @init="onGridInit"
        />
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- 등록/수정 모달                                                 -->
    <!-- ============================================================ -->
    <div v-if="formOpen" class="modal-mask" @click.self="formOpen = false">
      <div class="modal-box modal-lg-box">
        <div class="modal-head">
          <i class="bi bi-shield-plus text-primary me-2"></i>
          <span class="fw-bold">{{ form.regInfoId ? '규제 정보 수정' : '규제 정보 신규 등록' }}</span>
          <span v-if="form.regInfoId" class="b2b-badge b2b-badge-secondary ms-2">v{{ form.versionNo }} → v{{ form.versionNo + 1 }}</span>
          <button class="btn-b2b-action btn-compact ms-auto" @click="fillEuScenario">
            <i class="bi bi-magic text-warning me-1"></i>충돌 시나리오 채우기
          </button>
          <button class="btn-close ms-2" @click="formOpen = false"></button>
        </div>

        <div class="modal-body-scroll">
          <div class="row gx-3 gy-3">
            <div class="col-12 col-md-8">
              <label class="form-label-sm">규제 제목 <span class="text-danger">*</span></label>
              <input v-model="form.title" class="form-control form-control-sm" placeholder="예: KC 안전확인 (전기용품 및 생활용품 안전관리법)" />
            </div>
            <div class="col-6 col-md-4">
              <label class="form-label-sm">분야 <span class="text-danger">*</span></label>
              <select v-model="form.fieldCd" class="form-select form-select-sm">
                <option v-for="f in fieldCodes" :key="f.code" :value="f.code">{{ f.name }}</option>
              </select>
            </div>

            <div class="col-12 col-md-6">
              <label class="form-label-sm">규제 <span class="text-muted">(멀티)</span></label>
              <MultiSelect v-model="form.regulationCds" :options="regulationCodes" label-key="name" value-key="code" placeholder="규제 선택" />
            </div>
            <div class="col-12 col-md-6">
              <label class="form-label-sm">규격 <span class="text-muted">(멀티 · 선택한 규제의 하위)</span></label>
              <MultiSelect v-model="form.standardCds" :options="formStandardOptions" label-key="name" value-key="code" placeholder="규격 선택" />
            </div>

            <div class="col-12 col-md-4">
              <label class="form-label-sm">사업부 <span class="text-muted">(멀티)</span></label>
              <MultiSelect v-model="form.divisionCds" :options="divisionCodes" label-key="name" value-key="code" placeholder="사업부 선택" />
            </div>
            <div class="col-12 col-md-4">
              <label class="form-label-sm">제품군 <span class="text-muted">(멀티)</span></label>
              <MultiSelect v-model="form.productGroupCds" :options="formProductGroupOptions" label-key="name" value-key="code" placeholder="제품군 선택" />
            </div>
            <div class="col-12 col-md-4">
              <label class="form-label-sm">제품 <span class="text-muted">(멀티 · 미선택 시 제품군 전체)</span></label>
              <MultiSelect v-model="form.productCds" :options="formProductOptions" label-key="name" value-key="code" placeholder="제품 선택" />
            </div>

            <div class="col-12 col-md-6">
              <label class="form-label-sm">권역 <span class="text-muted">(멀티)</span></label>
              <MultiSelect v-model="form.regionCds" :options="regionCodes" label-key="name" value-key="code" placeholder="권역 선택" />
            </div>
            <div class="col-12 col-md-6">
              <label class="form-label-sm">국가 <span class="text-muted">(멀티 · 미선택 시 권역 전체)</span></label>
              <MultiSelect v-model="form.countryCds" :options="formCountryOptions" label-key="name" value-key="code" placeholder="국가 선택" />
            </div>

            <div class="col-12 col-md-6">
              <label class="form-label-sm">인증마크 / 표시</label>
              <input v-model="form.markNm" class="form-control form-control-sm" placeholder="예: KC 마크 + 안전확인신고번호" />
            </div>
            <div class="col-12 col-md-6">
              <label class="form-label-sm">소관 기관</label>
              <input v-model="form.authority" class="form-control form-control-sm" placeholder="예: 국가기술표준원(KATS)" />
            </div>

            <div class="col-12">
              <label class="form-label-sm">근거 URL</label>
              <div class="input-group input-group-sm">
                <span class="input-group-text"><i class="bi bi-link-45deg"></i></span>
                <input v-model="form.url" class="form-control form-control-sm" placeholder="https://" />
                <button class="btn btn-outline-secondary" :disabled="!form.url" @click.prevent="openUrl(form.url)">열기</button>
              </div>
            </div>

            <div class="col-12 col-md-6">
              <label class="form-label-sm">시행일</label>
              <B2bDatePicker v-model="form.effectiveDt" placeholder="YYYY-MM-DD" :enable-time-picker="false" :show-presets="true" />
            </div>
            <div class="col-12 col-md-6">
              <label class="form-label-sm">상태</label>
              <select v-model="form.statusCd" class="form-select form-select-sm">
                <option v-for="s in statusCodes" :key="s.code" :value="s.code">{{ s.name }}</option>
              </select>
            </div>

            <div class="col-12">
              <label class="form-label-sm">요약 / 준수 요건</label>
              <textarea v-model="form.summary" rows="3" class="form-control form-control-sm" placeholder="시험 → 신고 → 표시 등 실무 절차 요약"></textarea>
            </div>

            <div class="col-12">
              <label class="form-label-sm">첨부 <span class="text-muted">(파일 관리 모듈의 파일그룹으로 연계)</span></label>
              <div class="attach-box">
                <div v-for="file in form.attachFiles" :key="file.fileId" class="attach-chip">
                  <i class="bi bi-paperclip me-1"></i>{{ file.fileNm }}
                  <span class="text-muted ms-1">{{ file.size }}</span>
                  <i class="bi bi-x ms-1 text-danger" @click="removeAttach(file.fileId)"></i>
                </div>
                <button class="btn-b2b-action btn-compact" @click.prevent="addAttach">
                  <i class="bi bi-upload me-1"></i>파일 추가
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-foot">
          <span class="b2b-text-xs text-muted">
            <i class="bi bi-info-circle me-1"></i>저장을 누르면 기존 레코드와의 상·하위 충돌을 먼저 검사합니다.
          </span>
          <div class="ms-auto d-flex gap-2">
            <button class="btn-b2b-action" @click="formOpen = false">취소</button>
            <button class="btn-b2b-primary" @click="checkAndSave">
              <i class="bi bi-shield-check me-1"></i>충돌 검사 후 저장
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- 충돌 확인 모달 (저장 직전)                                      -->
    <!-- ============================================================ -->
    <div v-if="conflictOpen" class="modal-mask" @click.self="conflictOpen = false">
      <div class="modal-box modal-lg-box">
        <div class="modal-head">
          <i class="bi bi-exclamation-triangle-fill text-warning me-2"></i>
          <span class="fw-bold">충돌 검사 결과</span>
          <span class="b2b-badge b2b-badge-danger ms-2">{{ pendingConflicts.length }}건 충돌</span>
          <button class="btn-close ms-auto" @click="conflictOpen = false"></button>
        </div>

        <div class="modal-body-scroll">
          <div class="conflict-summary mb-3">
            <div class="fw-semibold mb-1">
              <i class="bi bi-box-arrow-in-down me-1 text-primary"></i>저장하려는 레코드
            </div>
            <div class="b2b-text-sm text-theme-secondary">
              <span class="b2b-badge b2b-badge-outline me-1">{{ fieldName(form.fieldCd) }}</span>
              <strong>{{ form.title || '(제목 없음)' }}</strong>
              <div class="mt-1">
                지역: <strong>{{ scopeOf(formAsRecord, 'GEO') }}</strong> ·
                제품: <strong>{{ scopeOf(formAsRecord, 'ORG') }}</strong> ·
                규제/규격: <strong>{{ scopeOf(formAsRecord, 'RULE') }}</strong>
              </div>
            </div>
          </div>

          <table class="table table-sm align-middle conflict-table">
            <thead>
              <tr>
                <th style="width: 120px">충돌 유형</th>
                <th style="width: 130px">기존 규제번호</th>
                <th>기존 범위</th>
                <th>신규 범위</th>
                <th style="width: 200px">조치</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(c, idx) in pendingConflicts" :key="idx">
                <td>
                  <span class="b2b-badge" :class="conflictBadge(c.conflictType)">{{ conflictName(c.conflictType) }}</span>
                  <div class="b2b-text-xs text-muted mt-1">{{ c.mainAxis.axisName }} 축</div>
                </td>
                <td>
                  <div class="fw-semibold">{{ c.existRecord.regNo }}</div>
                  <div class="b2b-text-xs text-muted text-truncate" :title="c.existRecord.title">{{ c.existRecord.title }}</div>
                </td>
                <td class="b2b-text-xs">
                  <div v-for="d in c.axisDetails" :key="d.axisKey">
                    <span class="text-muted">{{ d.axisName }}:</span> {{ d.existScopeTxt }}
                  </div>
                </td>
                <td class="b2b-text-xs">
                  <div v-for="d in c.axisDetails" :key="d.axisKey">
                    <span class="text-muted">{{ d.axisName }}:</span>
                    <span :class="relationClass(d.relation)">{{ d.newScopeTxt }}</span>
                  </div>
                </td>
                <td>
                  <select v-model="c.decisionCd" class="form-select form-select-sm">
                    <option v-for="d in decisionCodes" :key="d.code" :value="d.code">{{ d.name }}</option>
                  </select>
                  <div class="b2b-text-xs text-muted mt-1">{{ c.recommend.text }}</div>
                </td>
              </tr>
            </tbody>
          </table>

          <div class="alert alert-light border b2b-text-xs mb-0">
            <strong>판정 규칙</strong> — 권역&gt;국가, 사업부&gt;제품군&gt;제품, 규제&gt;규격 계층을 최하위 단위로 전개해 비교합니다.
            신규가 기존을 포함하면 <span class="b2b-badge b2b-badge-warning">신규가 상위(PARENT)</span>,
            기존이 신규를 포함하면 <span class="b2b-badge b2b-badge-primary">신규가 하위(CHILD)</span>,
            완전히 같으면 <span class="b2b-badge b2b-badge-danger">동일범위(SAME)</span>,
            일부만 겹치면 <span class="b2b-badge b2b-badge-secondary">부분중복(OVERLAP)</span> 입니다.
          </div>
        </div>

        <div class="modal-foot">
          <span class="b2b-text-xs text-muted">
            선택한 조치는 <strong>충돌 이력 테이블</strong>에 그대로 적재됩니다.
          </span>
          <div class="ms-auto d-flex gap-2">
            <button class="btn-b2b-action" @click="conflictOpen = false">돌아가서 수정</button>
            <button class="btn-b2b-danger" @click="cancelSave">등록 취소</button>
            <button class="btn-b2b-primary" @click="commitSave">
              <i class="bi bi-check2 me-1"></i>조치 반영 후 저장
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- 이력 모달                                                      -->
    <!-- ============================================================ -->
    <div v-if="historyOpen" class="modal-mask" @click.self="historyOpen = false">
      <div class="modal-box">
        <div class="modal-head">
          <i class="bi bi-clock-history text-warning me-2"></i>
          <span class="fw-bold">{{ selectedRecord?.regNo }} 이력</span>
          <div class="btn-group btn-group-sm ms-3">
            <button class="btn btn-sm" :class="historyTab === 'change' ? 'btn-primary' : 'btn-outline-secondary'" @click="historyTab = 'change'">
              변경 이력
            </button>
            <button class="btn btn-sm" :class="historyTab === 'conflict' ? 'btn-primary' : 'btn-outline-secondary'" @click="historyTab = 'conflict'">
              충돌 이력
            </button>
          </div>
          <button class="btn-close ms-auto" @click="historyOpen = false"></button>
        </div>

        <div class="modal-body-scroll">
          <table v-if="historyTab === 'change'" class="table table-sm align-middle">
            <thead>
              <tr><th style="width:70px">버전</th><th style="width:130px">구분</th><th>변경 사유</th><th style="width:110px">변경자</th><th style="width:140px">변경일시</th></tr>
            </thead>
            <tbody>
              <tr v-for="h in recordHistories" :key="h.histId">
                <td><span class="b2b-badge b2b-badge-secondary">v{{ h.versionNo }}</span></td>
                <td><span class="b2b-badge" :class="changeBadge(h.changeType)">{{ changeTypeName(h.changeType) }}</span></td>
                <td>{{ h.changeNote }}</td>
                <td>{{ h.regId }}</td>
                <td class="b2b-text-xs text-muted">{{ h.regDt }}</td>
              </tr>
              <tr v-if="recordHistories.length === 0"><td colspan="5" class="text-center text-muted py-4">변경 이력이 없습니다.</td></tr>
            </tbody>
          </table>

          <table v-else class="table table-sm align-middle">
            <thead>
              <tr><th style="width:110px">유형</th><th style="width:130px">상대 레코드</th><th>범위 비교</th><th style="width:170px">조치</th><th style="width:140px">판정일시</th></tr>
            </thead>
            <tbody>
              <tr v-for="c in recordConflicts" :key="c.conflictId">
                <td><span class="b2b-badge" :class="conflictBadge(c.conflictType)">{{ conflictName(c.conflictType) }}</span></td>
                <td class="b2b-text-xs">
                  <div>신규 {{ c.newRegNo }}</div>
                  <div class="text-muted">기존 {{ c.existRegNo }}</div>
                </td>
                <td class="b2b-text-xs">
                  <div><span class="text-muted">신규:</span> {{ c.newScopeTxt }}</div>
                  <div><span class="text-muted">기존:</span> {{ c.existScopeTxt }}</div>
                </td>
                <td class="b2b-text-xs">
                  <div class="fw-semibold">{{ decisionName(c.decisionCd) }}</div>
                  <div class="text-muted">{{ c.decisionNote }}</div>
                </td>
                <td class="b2b-text-xs text-muted">{{ c.detectDt }}</td>
              </tr>
              <tr v-if="recordConflicts.length === 0"><td colspan="5" class="text-center text-muted py-4">충돌 이력이 없습니다.</td></tr>
            </tbody>
          </table>
        </div>

        <div class="modal-foot">
          <div class="ms-auto"><button class="btn-b2b-action" @click="historyOpen = false">닫기</button></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import RealGridCommonJs from '@/components/RealGridCommonJs.vue'
import MultiSelect from '@/components/MultiSelect.vue'
import B2bDatePicker from '@/components/common/B2bDatePicker.vue'
import { showToast } from '@/utils/toastUtil.js'
import {
  fieldCodes,
  divisionCodes,
  productGroupCodes,
  productCodes,
  regionCodes,
  countryCodes,
  regulationCodes,
  standardCodes,
  statusCodes,
  conflictTypes,
  decisionCodes,
  regInfoList,
  regHistList,
  regConflictList,
  attachMock
} from '@/data/regulationMock'
import { detectConflicts, AXES, scopeText, targetNames } from '@/utils/regulationConflict'

const STATUS_STYLE = {
  ACTIVE: ['#198754', '#fff'],
  REVIEW: ['#0d6efd', '#fff'],
  DRAFT: ['#6c757d', '#fff'],
  EXPIRED: ['#adb5bd', '#fff']
}

const emptyForm = () => ({
  regInfoId: null,
  regNo: '',
  title: '',
  fieldCd: 'SAFETY',
  markNm: '',
  authority: '',
  url: '',
  summary: '',
  statusCd: 'DRAFT',
  versionNo: 0,
  effectiveDt: '',
  regulationCds: [],
  standardCds: [],
  divisionCds: [],
  productGroupCds: [],
  productCds: [],
  regionCds: [],
  countryCds: [],
  attachFiles: []
})

export default {
  name: 'RegulationInfoPage',
  components: { RealGridCommonJs, MultiSelect, B2bDatePicker },
  data() {
    return {
      fieldCodes,
      divisionCodes,
      productGroupCodes,
      productCodes,
      regionCodes,
      countryCodes,
      regulationCodes,
      standardCodes,
      statusCodes,
      decisionCodes,

      records: regInfoList.map((r) => ({ ...r, targets: [...r.targets] })),
      histories: [...regHistList],
      conflicts: [...regConflictList],

      filters: {
        keyword: '',
        fieldCd: '',
        regionCd: '',
        countryCd: '',
        regulationCd: '',
        divisionCd: '',
        productGroupCd: '',
        productCd: '',
        statusCd: '',
        effectiveFrom: '',
        effectiveTo: '',
        onlyConflict: false
      },
      appliedFilters: null,

      gridView: null,
      dataProvider: null,
      selectedRegInfoId: null,

      formOpen: false,
      form: emptyForm(),
      pendingConflicts: [],
      conflictOpen: false,

      historyOpen: false,
      historyTab: 'change',

      gridFields: [
        { fieldName: 'regInfoId', dataType: 'number' },
        { fieldName: 'statusCd', dataType: 'text' },
        { fieldName: 'regNo', dataType: 'text' },
        { fieldName: 'title', dataType: 'text' },
        { fieldName: 'regulationTxt', dataType: 'text' },
        { fieldName: 'standardTxt', dataType: 'text' },
        { fieldName: 'fieldNm', dataType: 'text' },
        { fieldName: 'markNm', dataType: 'text' },
        { fieldName: 'divisionTxt', dataType: 'text' },
        { fieldName: 'productGroupTxt', dataType: 'text' },
        { fieldName: 'productTxt', dataType: 'text' },
        { fieldName: 'regionTxt', dataType: 'text' },
        { fieldName: 'countryTxt', dataType: 'text' },
        { fieldName: 'url', dataType: 'text' },
        { fieldName: 'attachCnt', dataType: 'number' },
        { fieldName: 'conflictCnt', dataType: 'number' },
        { fieldName: 'versionNo', dataType: 'number' },
        { fieldName: 'effectiveDt', dataType: 'text' },
        { fieldName: 'modDt', dataType: 'text' }
      ]
    }
  },
  computed: {
    gridColumns() {
      return [
        {
          name: 'statusCd',
          fieldName: 'statusCd',
          width: '80',
          header: { text: '상태' },
          styles: { textAlignment: 'center' },
          renderer: {
            type: 'html',
            callback: (grid, model) => {
              const code = model?.value || 'DRAFT'
              const [bg, fg] = STATUS_STYLE[code] || STATUS_STYLE.DRAFT
              const name = (statusCodes.find((s) => s.code === code) || {}).name || code
              return `<div style="display:flex;align-items:center;justify-content:center;height:100%;"><span style="background:${bg};color:${fg};font-size:11px;font-weight:700;padding:2px 9px;border-radius:10px;">${name}</span></div>`
            }
          }
        },
        { name: 'regNo', fieldName: 'regNo', width: '120', header: { text: '규제번호' }, styles: { textAlignment: 'center' } },
        { name: 'title', fieldName: 'title', width: '260', header: { text: '규제명' }, styles: { textAlignment: 'near' } },
        { name: 'standardTxt', fieldName: 'standardTxt', width: '210', header: { text: '규격' }, styles: { textAlignment: 'near' } },
        { name: 'fieldNm', fieldName: 'fieldNm', width: '100', header: { text: '분야' }, styles: { textAlignment: 'center' } },
        { name: 'markNm', fieldName: 'markNm', width: '170', header: { text: '인증마크/표시' }, styles: { textAlignment: 'near' } },
        {
          name: 'orgGroup',
          header: { text: '적용 제품' },
          direction: 'horizontal',
          columns: [
            { name: 'divisionTxt', fieldName: 'divisionTxt', width: '110', header: { text: '사업부' }, styles: { textAlignment: 'center' } },
            { name: 'productGroupTxt', fieldName: 'productGroupTxt', width: '100', header: { text: '제품군' }, styles: { textAlignment: 'center' } },
            { name: 'productTxt', fieldName: 'productTxt', width: '130', header: { text: '제품' }, styles: { textAlignment: 'center' } }
          ]
        },
        {
          name: 'geoGroup',
          header: { text: '적용 지역' },
          direction: 'horizontal',
          columns: [
            { name: 'regionTxt', fieldName: 'regionTxt', width: '100', header: { text: '권역' }, styles: { textAlignment: 'center' } },
            { name: 'countryTxt', fieldName: 'countryTxt', width: '120', header: { text: '국가' }, styles: { textAlignment: 'center' } }
          ]
        },
        {
          name: 'url',
          fieldName: 'url',
          width: '80',
          header: { text: 'URL' },
          styles: { textAlignment: 'center' },
          renderer: {
            type: 'html',
            callback: (grid, model) => {
              const url = model?.value
              if (!url) return ''
              return `<div style="display:flex;align-items:center;justify-content:center;height:100%;"><a href="${url}" target="_blank" rel="noopener" style="color:#0d6efd;text-decoration:none;">바로가기 <i class="bi bi-box-arrow-up-right"></i></a></div>`
            }
          }
        },
        {
          name: 'attachCnt',
          fieldName: 'attachCnt',
          width: '70',
          header: { text: '첨부' },
          styles: { textAlignment: 'center' },
          renderer: {
            type: 'html',
            callback: (grid, model) => {
              const n = Number(model?.value || 0)
              if (!n) return '<div style="text-align:center;color:#adb5bd;">-</div>'
              return `<div style="text-align:center;"><i class="bi bi-paperclip"></i> ${n}</div>`
            }
          }
        },
        {
          name: 'conflictCnt',
          fieldName: 'conflictCnt',
          width: '80',
          header: { text: '충돌' },
          styles: { textAlignment: 'center' },
          renderer: {
            type: 'html',
            callback: (grid, model) => {
              const n = Number(model?.value || 0)
              if (!n) return '<div style="text-align:center;color:#adb5bd;">-</div>'
              return `<div style="display:flex;align-items:center;justify-content:center;height:100%;"><span style="background:#fff3cd;color:#a1690a;border:1px solid #ffe69c;font-size:11px;font-weight:700;padding:2px 8px;border-radius:10px;">${n}건</span></div>`
            }
          }
        },
        { name: 'versionNo', fieldName: 'versionNo', width: '70', header: { text: '버전' }, styles: { textAlignment: 'center' } },
        { name: 'effectiveDt', fieldName: 'effectiveDt', width: '100', header: { text: '시행일' }, styles: { textAlignment: 'center' } },
        { name: 'modDt', fieldName: 'modDt', width: '110', header: { text: '최종수정일' }, styles: { textAlignment: 'center' } }
      ]
    },
    filteredRecords() {
      const f = this.appliedFilters
      if (!f) return this.records

      const kw = (f.keyword || '').trim().toLowerCase()
      return this.records.filter((r) => {
        if (kw) {
          const hay = [
            r.regNo,
            r.title,
            r.markNm,
            ...targetNames(r, 'REGULATION'),
            ...targetNames(r, 'STANDARD')
          ].join(' ').toLowerCase()
          if (!hay.includes(kw)) return false
        }
        if (f.fieldCd && r.fieldCd !== f.fieldCd) return false
        if (f.statusCd && r.statusCd !== f.statusCd) return false
        if (f.regionCd && !this.hasTarget(r, 'REGION', f.regionCd)) return false
        if (f.countryCd && !this.hasTarget(r, 'COUNTRY', f.countryCd)) return false
        if (f.regulationCd && !this.hasTarget(r, 'REGULATION', f.regulationCd)) return false
        if (f.divisionCd && !this.hasTarget(r, 'DIVISION', f.divisionCd)) return false
        if (f.productGroupCd && !this.hasTarget(r, 'PRODUCT_GROUP', f.productGroupCd)) return false
        if (f.productCd && !this.hasTarget(r, 'PRODUCT', f.productCd)) return false
        if (f.effectiveFrom && this.toDateStr(r.effectiveDt) < this.toDateStr(f.effectiveFrom)) return false
        if (f.effectiveTo && this.toDateStr(r.effectiveDt) > this.toDateStr(f.effectiveTo)) return false
        if (f.onlyConflict && this.conflictCountOf(r.regInfoId) === 0) return false
        return true
      })
    },
    gridRows() {
      return this.filteredRecords.map((r) => ({
        regInfoId: r.regInfoId,
        statusCd: r.statusCd,
        regNo: r.regNo,
        title: r.title,
        regulationTxt: this.summarize(targetNames(r, 'REGULATION')),
        standardTxt: this.summarize(targetNames(r, 'STANDARD')),
        fieldNm: this.fieldName(r.fieldCd),
        markNm: r.markNm,
        divisionTxt: this.summarize(targetNames(r, 'DIVISION')),
        productGroupTxt: this.summarize(targetNames(r, 'PRODUCT_GROUP')),
        productTxt: this.summarize(targetNames(r, 'PRODUCT')) || '전체',
        regionTxt: this.summarize(targetNames(r, 'REGION')),
        countryTxt: this.summarize(targetNames(r, 'COUNTRY')) || '전체',
        url: r.url,
        attachCnt: r.attachCnt,
        conflictCnt: this.conflictCountOf(r.regInfoId),
        versionNo: r.versionNo,
        effectiveDt: r.effectiveDt,
        modDt: r.modDt
      }))
    },
    selectedRecord() {
      return this.records.find((r) => r.regInfoId === this.selectedRegInfoId) || null
    },
    recordHistories() {
      if (!this.selectedRecord) return []
      return this.histories
        .filter((h) => h.regInfoId === this.selectedRecord.regInfoId)
        .sort((a, b) => b.versionNo - a.versionNo)
    },
    recordConflicts() {
      if (!this.selectedRecord) return []
      const id = this.selectedRecord.regInfoId
      return this.conflicts.filter((c) => c.newRegInfoId === id || c.existRegInfoId === id)
    },
    filteredCountryCodes() {
      if (!this.filters.regionCd) return countryCodes
      return countryCodes.filter((c) => c.parentCd === this.filters.regionCd)
    },
    filteredProductGroupCodes() {
      if (!this.filters.divisionCd) return productGroupCodes
      return productGroupCodes.filter((pg) => pg.parentCd === this.filters.divisionCd)
    },
    filteredProductCodes() {
      if (!this.filters.productGroupCd) return productCodes
      return productCodes.filter((p) => p.parentCd === this.filters.productGroupCd)
    },
    formStandardOptions() {
      if (!this.form.regulationCds.length) return standardCodes
      return standardCodes.filter((s) => this.form.regulationCds.includes(s.parentCd))
    },
    formProductGroupOptions() {
      if (!this.form.divisionCds.length) return productGroupCodes
      return productGroupCodes.filter((pg) => this.form.divisionCds.includes(pg.parentCd))
    },
    formProductOptions() {
      if (!this.form.productGroupCds.length) return productCodes
      return productCodes.filter((p) => this.form.productGroupCds.includes(p.parentCd))
    },
    formCountryOptions() {
      if (!this.form.regionCds.length) return countryCodes
      return countryCodes.filter((c) => this.form.regionCds.includes(c.parentCd))
    },
    /** 폼 입력값을 REG_INFO + REG_INFO_TARGET 형태로 변환 (충돌 검사 입력) */
    formAsRecord() {
      const targets = []
      const push = (targetType, codes) => codes.forEach((targetCd) => targets.push({ targetType, targetCd }))
      push('REGULATION', this.form.regulationCds)
      push('STANDARD', this.form.standardCds)
      push('DIVISION', this.form.divisionCds)
      push('PRODUCT_GROUP', this.form.productGroupCds)
      push('PRODUCT', this.form.productCds)
      push('REGION', this.form.regionCds)
      push('COUNTRY', this.form.countryCds)
      return { ...this.form, targets }
    }
  },
  methods: {
    /* ---------------- 그리드 ---------------- */
    gridToast(message, opts = {}) {
      showToast(message, opts)
    },
    onGridInit({ gridView, dataProvider }) {
      this.gridView = gridView
      this.dataProvider = dataProvider

      gridView.setDisplayOptions({ rowHeight: 30 })
      gridView.onCurrentRowChanged = (grid, oldRow, newRow) => {
        const row = dataProvider.getJsonRow(newRow)
        this.selectedRegInfoId = row ? row.regInfoId : null
      }
      gridView.onCellDblClicked = () => {
        if (this.selectedRegInfoId) this.openEdit()
      }
    },
    exportExcel() {
      if (!this.gridView) return
      this.gridView.exportGrid({ type: 'excel', target: 'local', fileName: '규제정보_목록.xlsx' })
    },

    /* ---------------- 검색 ---------------- */
    search() {
      this.appliedFilters = { ...this.filters }
      showToast(`조회 완료 (${this.gridRows.length}건)`, { type: 'success' })
    },
    resetFilters() {
      this.filters = {
        keyword: '', fieldCd: '', regionCd: '', countryCd: '', regulationCd: '',
        divisionCd: '', productGroupCd: '', productCd: '', statusCd: '',
        effectiveFrom: '', effectiveTo: '', onlyConflict: false
      }
      this.appliedFilters = null
    },
    hasTarget(record, targetType, code) {
      return (record.targets || []).some((tg) => tg.targetType === targetType && tg.targetCd === code)
    },
    conflictCountOf(regInfoId) {
      return this.conflicts.filter((c) => c.newRegInfoId === regInfoId || c.existRegInfoId === regInfoId).length
    },
    toDateStr(v) {
      if (!v) return ''
      if (typeof v === 'string') return v.slice(0, 10)
      const d = new Date(v)
      if (Number.isNaN(d.getTime())) return ''
      const pad = (n) => String(n).padStart(2, '0')
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    },
    summarize(names) {
      if (!names || names.length === 0) return ''
      if (names.length === 1) return names[0]
      return `${names[0]} 외 ${names.length - 1}`
    },

    /* ---------------- 코드명 ---------------- */
    fieldName(code) {
      return (fieldCodes.find((f) => f.code === code) || {}).name || code
    },
    conflictName(code) {
      return (conflictTypes.find((c) => c.code === code) || {}).name || code
    },
    decisionName(code) {
      return (decisionCodes.find((d) => d.code === code) || {}).name || code
    },
    changeTypeName(code) {
      return { INSERT: '신규 등록', UPDATE: '수정', DELETE: '삭제', CONFLICT_RESOLVE: '충돌 조치' }[code] || code
    },
    changeBadge(code) {
      return {
        INSERT: 'b2b-badge-success',
        UPDATE: 'b2b-badge-primary',
        DELETE: 'b2b-badge-danger',
        CONFLICT_RESOLVE: 'b2b-badge-warning'
      }[code] || 'b2b-badge-secondary'
    },
    conflictBadge(code) {
      return {
        SAME: 'b2b-badge-danger',
        PARENT: 'b2b-badge-warning',
        CHILD: 'b2b-badge-primary',
        OVERLAP: 'b2b-badge-secondary'
      }[code] || 'b2b-badge-secondary'
    },
    relationClass(rel) {
      if (rel === 'SUPERSET') return 'text-warning fw-semibold'
      if (rel === 'SUBSET') return 'text-primary fw-semibold'
      if (rel === 'OVERLAP') return 'text-danger fw-semibold'
      return ''
    },
    scopeOf(record, axisKey) {
      const axis = AXES.find((a) => a.key === axisKey)
      return scopeText(record, axis)
    },
    openUrl(url) {
      if (url) window.open(url, '_blank', 'noopener')
    },

    /* ---------------- 등록/수정 ---------------- */
    openCreate() {
      this.form = emptyForm()
      this.formOpen = true
    },
    openEdit() {
      const r = this.selectedRecord
      if (!r) return
      const codes = (type) => (r.targets || []).filter((tg) => tg.targetType === type).map((tg) => tg.targetCd)
      this.form = {
        ...emptyForm(),
        regInfoId: r.regInfoId,
        regNo: r.regNo,
        title: r.title,
        fieldCd: r.fieldCd,
        markNm: r.markNm,
        authority: r.authority,
        url: r.url,
        summary: r.summary,
        statusCd: r.statusCd,
        versionNo: r.versionNo,
        effectiveDt: r.effectiveDt,
        regulationCds: codes('REGULATION'),
        standardCds: codes('STANDARD'),
        divisionCds: codes('DIVISION'),
        productGroupCds: codes('PRODUCT_GROUP'),
        productCds: codes('PRODUCT'),
        regionCds: codes('REGION'),
        countryCds: codes('COUNTRY'),
        attachFiles: [...(attachMock[r.regInfoId] || [])]
      }
      this.formOpen = true
    },
    /** 데모용: "기존 프랑스 TV" vs "신규 유럽 TV" 충돌 시나리오 자동 입력 */
    fillEuScenario() {
      this.form = {
        ...emptyForm(),
        title: 'CE 저전압지침(LVD) - 유럽 공통',
        fieldCd: 'SAFETY',
        markNm: 'CE 마크',
        authority: 'EU Commission',
        url: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32014L0035',
        summary: '유럽 전 권역 공통 LVD 대응으로 통합 관리.',
        statusCd: 'REVIEW',
        effectiveDt: '2026-09-01',
        regulationCds: ['RG_EU_LVD'],
        standardCds: ['ST_EN62368'],
        divisionCds: ['VD'],
        productGroupCds: ['PG_TV'],
        regionCds: ['R_EU']
      }
      showToast('기존 "프랑스 특례"와 충돌하는 신규 유럽 레코드를 채웠습니다.', { type: 'info', duration: 2600 })
    },
    addAttach() {
      const seq = this.form.attachFiles.length + 1
      this.form.attachFiles.push({ fileId: `NEW-${Date.now()}`, fileNm: `첨부문서_${seq}.pdf`, size: '1.2MB' })
    },
    removeAttach(fileId) {
      this.form.attachFiles = this.form.attachFiles.filter((f) => f.fileId !== fileId)
    },

    /* ---------------- 저장 (충돌 검사 → 확정) ---------------- */
    checkAndSave() {
      if (!this.form.title.trim()) {
        showToast('규제 제목을 입력하세요.', { type: 'error' })
        return
      }
      if (!this.form.regulationCds.length) {
        showToast('규제를 1개 이상 선택하세요.', { type: 'error' })
        return
      }
      if (!this.form.regionCds.length && !this.form.countryCds.length) {
        showToast('권역 또는 국가를 선택하세요.', { type: 'error' })
        return
      }

      const found = detectConflicts(this.formAsRecord, this.records)
      if (found.length === 0) {
        this.persist([])
        return
      }
      this.pendingConflicts = found.map((c) => ({ ...c, decisionCd: c.recommend.decisionCd }))
      this.conflictOpen = true
    },
    cancelSave() {
      // 취소도 이력으로 남긴다 (누가 무엇 때문에 등록을 포기했는지 추적)
      this.recordConflictHistory(this.pendingConflicts, 'CANCEL', null)
      this.pendingConflicts = []
      this.conflictOpen = false
      this.formOpen = false
      showToast('등록을 취소했습니다. 충돌 이력은 남았습니다.', { type: 'info' })
    },
    commitSave() {
      const decisions = this.pendingConflicts
      this.conflictOpen = false
      this.persist(decisions)
    },
    persist(decisions) {
      const now = new Date()
      const pad = (n) => String(n).padStart(2, '0')
      const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`
      const isNew = !this.form.regInfoId
      const record = this.formAsRecord

      let saved
      if (isNew) {
        const newId = Math.max(...this.records.map((r) => r.regInfoId)) + 1
        saved = {
          regInfoId: newId,
          regNo: `REG-${now.getFullYear()}-${String(9000 + newId).slice(-4)}`,
          title: record.title,
          fieldCd: record.fieldCd,
          markNm: record.markNm,
          authority: record.authority,
          url: record.url,
          summary: record.summary,
          statusCd: record.statusCd,
          versionNo: 1,
          effectiveDt: this.toDateStr(record.effectiveDt),
          modDt: this.toDateStr(now),
          modId: 'me',
          attachCnt: this.form.attachFiles.length,
          targets: record.targets
        }
        this.records.push(saved)
      } else {
        const idx = this.records.findIndex((r) => r.regInfoId === this.form.regInfoId)
        saved = {
          ...this.records[idx],
          title: record.title,
          fieldCd: record.fieldCd,
          markNm: record.markNm,
          authority: record.authority,
          url: record.url,
          summary: record.summary,
          statusCd: record.statusCd,
          versionNo: this.records[idx].versionNo + 1,
          effectiveDt: this.toDateStr(record.effectiveDt),
          modDt: this.toDateStr(now),
          modId: 'me',
          attachCnt: this.form.attachFiles.length,
          targets: record.targets
        }
        this.records.splice(idx, 1, saved)
      }

      // 변경 이력: 수정 = 새 버전 INSERT
      this.histories.push({
        histId: Date.now(),
        regInfoId: saved.regInfoId,
        versionNo: saved.versionNo,
        changeType: isNew ? 'INSERT' : 'UPDATE',
        changeNote: decisions.length ? `충돌 ${decisions.length}건 조치 후 저장` : (isNew ? '최초 등록' : '내용 수정'),
        regId: 'me',
        regDt: stamp
      })

      this.recordConflictHistory(decisions, null, saved)
      this.applyDecisionSideEffects(decisions, saved, stamp)

      this.selectedRegInfoId = saved.regInfoId
      this.pendingConflicts = []
      this.formOpen = false
      showToast(`${saved.regNo} 저장 완료${decisions.length ? ` (충돌 ${decisions.length}건 조치)` : ''}`, { type: 'success' })
    },
    recordConflictHistory(list, forcedDecision, saved) {
      const now = new Date()
      const pad = (n) => String(n).padStart(2, '0')
      const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`
      list.forEach((c, i) => {
        this.conflicts.push({
          conflictId: Date.now() + i,
          newRegNo: saved ? saved.regNo : '(등록취소)',
          newRegInfoId: saved ? saved.regInfoId : null,
          existRegNo: c.existRecord.regNo,
          existRegInfoId: c.existRecord.regInfoId,
          conflictType: c.conflictType,
          conflictAxis: c.mainAxis.axisKey,
          newScopeTxt: c.mainAxis.newScopeTxt,
          existScopeTxt: c.mainAxis.existScopeTxt,
          decisionCd: forcedDecision || c.decisionCd,
          decisionNote: c.recommend.text,
          detectDt: stamp,
          decideId: 'me',
          decideDt: stamp,
          statusCd: forcedDecision === 'CANCEL' ? 'IGNORED' : 'RESOLVED'
        })
      })
    },
    /** 조치 코드에 따른 기존 레코드 처리 */
    applyDecisionSideEffects(decisions, saved, stamp) {
      decisions.forEach((c) => {
        if (c.decisionCd === 'MERGE') {
          const idx = this.records.findIndex((r) => r.regInfoId === c.existRecord.regInfoId)
          if (idx < 0) return
          const merged = { ...this.records[idx], statusCd: 'EXPIRED', versionNo: this.records[idx].versionNo + 1, modDt: this.toDateStr(new Date()) }
          this.records.splice(idx, 1, merged)
          this.histories.push({
            histId: Date.now() + Math.random(),
            regInfoId: merged.regInfoId,
            versionNo: merged.versionNo,
            changeType: 'CONFLICT_RESOLVE',
            changeNote: `${saved.regNo} 로 흡수되어 폐지 처리`,
            regId: 'me',
            regDt: stamp
          })
        } else if (c.decisionCd === 'KEEP_BOTH') {
          this.histories.push({
            histId: Date.now() + Math.random(),
            regInfoId: c.existRecord.regInfoId,
            versionNo: c.existRecord.versionNo,
            changeType: 'CONFLICT_RESOLVE',
            changeNote: `${saved.regNo} 등록에 따라 하위 예외(특례)로 유지`,
            regId: 'me',
            regDt: stamp
          })
        }
      })
    },
    removeRecord() {
      const r = this.selectedRecord
      if (!r) return
      if (!window.confirm(`${r.regNo} 를 폐지 처리하시겠습니까? (물리 삭제 없이 상태만 변경)`)) return
      const idx = this.records.findIndex((x) => x.regInfoId === r.regInfoId)
      this.records.splice(idx, 1, { ...r, statusCd: 'EXPIRED', versionNo: r.versionNo + 1 })
      this.histories.push({
        histId: Date.now(),
        regInfoId: r.regInfoId,
        versionNo: r.versionNo + 1,
        changeType: 'DELETE',
        changeNote: '사용자 요청으로 폐지',
        regId: 'me',
        regDt: this.toDateStr(new Date())
      })
      showToast(`${r.regNo} 폐지 처리`, { type: 'success' })
    },

    /* ---------------- 이력 ---------------- */
    openHistory() {
      this.historyTab = 'change'
      this.historyOpen = true
    }
  }
}
</script>

<style scoped>
.reg-page :deep(.multi-select) {
  width: 100%;
}

.form-label-sm {
  display: block;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 6px;
  color: var(--b2b-color-text-primary, #212529);
}

/* ---- 모달 ---- */
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1080;
}

.modal-box {
  width: min(920px, 94vw);
  max-height: 88vh;
  background: var(--b2b-color-bg-card, #fff);
  border-radius: 10px;
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-lg-box {
  width: min(1120px, 96vw);
}

.modal-head {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--b2b-color-border, #dee2e6);
  background: var(--b2b-color-bg-subcard, #f8f9fa);
}

.modal-body-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 16px;
}

.modal-foot {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-top: 1px solid var(--b2b-color-border, #dee2e6);
  background: var(--b2b-color-bg-subcard, #f8f9fa);
}

.btn-compact {
  padding: 2px var(--b2b-space-2);
  font-size: 12px;
}

/* ---- 충돌 검사 ---- */
.conflict-summary {
  border: 1px solid var(--b2b-color-border, #dee2e6);
  border-left: 4px solid var(--b2b-color-primary);
  border-radius: 6px;
  padding: 10px 12px;
  background: var(--b2b-color-bg-subcard, #f8f9fa);
}

.conflict-table th {
  font-size: 12px;
  background: var(--b2b-color-bg-subcard, #f8f9fa);
  white-space: nowrap;
}

.conflict-table td {
  vertical-align: top;
}

/* ---- 첨부 ---- */
.attach-box {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  border: 1px dashed var(--b2b-color-border, #dee2e6);
  border-radius: 6px;
  padding: 8px;
  min-height: 46px;
}

.attach-chip {
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  background: var(--b2b-color-bg-subcard, #f1f3f5);
  border: 1px solid var(--b2b-color-border, #dee2e6);
  border-radius: 14px;
  padding: 3px 10px;
}

.attach-chip .bi-x {
  cursor: pointer;
}
</style>
