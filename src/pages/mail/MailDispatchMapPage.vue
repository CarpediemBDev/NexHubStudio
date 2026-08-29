<template>
  <div class="b2b-page-container mail-page">

    <!-- Toolbar -->
    <div class="b2b-toolbar mb-3">
      <div class="d-flex align-items-center gap-2">
        <select v-model="moduleFilter" class="form-select form-select-sm filter-select">
          <option value="ALL">전체 모듈</option>
          <option v-for="module in mailModules" :key="module.code" :value="module.code">{{ module.name }}</option>
        </select>
        <input v-model="keyword" type="text" class="form-control form-control-sm search-input" placeholder="이벤트 · 템플릿 검색" />
        <div class="form-check form-check-inline m-0 ms-1">
          <input id="onlyProblem" v-model="onlyProblem" class="form-check-input" type="checkbox" />
          <label class="form-check-label small" for="onlyProblem">문제 항목만</label>
        </div>
      </div>
      <div class="d-flex align-items-center gap-3 ms-auto stat-row">
        <span>이벤트 <strong>{{ rows.length }}</strong></span>
        <span>정상 <strong class="text-success">{{ counts.ok }}</strong></span>
        <span>미매핑 <strong :class="counts.unmapped ? 'text-danger' : ''">{{ counts.unmapped }}</strong></span>
        <span>수신자없음 <strong :class="counts.noRecipient ? 'text-danger' : ''">{{ counts.noRecipient }}</strong></span>
        <span>비활성 <strong :class="counts.inactive ? 'text-warning' : ''">{{ counts.inactive }}</strong></span>
        <router-link to="/mail/send-log" class="btn-b2b-action">
          <i class="bi bi-clock-history me-1"></i>발송 이력
        </router-link>
      </div>
    </div>

    <div class="content-split">
      <!-- 목록 -->
      <div class="left-panel">
        <div class="table-scroll">
          <table class="b2b-table compact-table">
            <thead>
              <tr>
                <th style="width: 34px"></th>
                <th style="width: 200px">발송 이벤트</th>
                <th style="width: 74px">트리거</th>
                <th style="width: 210px">연결 템플릿</th>
                <th style="width: 150px">수신자</th>
                <th>현재 발송 제목</th>
                <th style="width: 66px" class="text-end">30일</th>
                <th style="width: 56px" class="text-end">실패</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="group in groupedRows" :key="group.moduleCode">
                <tr class="group-row">
                  <td colspan="8">
                    <i :class="group.icon" class="me-1 text-primary"></i>
                    <span class="fw-bold">{{ group.moduleName }}</span>
                    <span class="text-muted ms-2">{{ group.rows.length }}건</span>
                  </td>
                </tr>
                <tr
                  v-for="row in group.rows"
                  :key="row.eventId"
                  class="data-row"
                  :class="[row.bindStatus.toLowerCase(), { selected: selectedEventId === row.eventId }]"
                  @click="selectEvent(row.eventId)"
                >
                  <td class="text-center">
                    <span class="status-dot" :class="dotClass(row.bindStatus)" :title="bindStatusName(row.bindStatus)"></span>
                  </td>
                  <td>
                    <div class="font-monospace text-truncate">{{ row.eventCode }}</div>
                    <div class="text-muted text-truncate">{{ row.eventName }}</div>
                  </td>
                  <td>{{ row.triggerType }}</td>
                  <td>
                    <template v-if="row.template">
                      <div class="text-truncate" :title="row.template.templateCode">
                        <span>{{ row.template.templateName }}</span>
                        <span class="b2b-badge b2b-badge-secondary ms-1">v{{ row.versionNo }}</span>
                      </div>
                      <div class="text-muted text-truncate">{{ categoryName(row.template.categoryCode) }}</div>
                    </template>
                    <span v-else class="text-danger">연결된 템플릿 없음</span>
                  </td>
                  <td>
                    <span v-if="row.recipientSummary" class="text-truncate d-block" :title="row.recipientTooltip">
                      {{ row.recipientSummary }}
                    </span>
                    <span v-else class="text-danger">수신자 규칙 없음</span>
                  </td>
                  <td class="text-muted text-truncate">{{ row.subject || '—' }}</td>
                  <td class="text-end tabular-nums">{{ row.sendCount }}</td>
                  <td class="text-end tabular-nums">
                    <span :class="{ 'text-danger fw-bold': row.failCount > 0 }">{{ row.failCount }}</span>
                  </td>
                </tr>
              </template>
              <tr v-if="groupedRows.length === 0">
                <td colspan="8" class="text-center text-muted py-4">조건에 맞는 발송 지점이 없습니다.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 매핑 설정 -->
      <div v-if="selectedRow" class="right-panel">
        <div class="panel-header d-flex align-items-center">
          <span class="fw-bold">발송 설정</span>
          <span class="font-monospace text-muted small ms-2 text-truncate">{{ selectedRow.eventCode }}</span>
          <button class="btn-b2b-icon btn-b2b-action ms-auto" @click="selectedEventId = null">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>

        <div class="setting-scroll">
          <p class="event-desc">{{ selectedRow.eventName }} — {{ selectedRow.description }}</p>
          <p class="source-hint"><i class="bi bi-code-slash me-1"></i>{{ selectedRow.sourceHint }}</p>

          <!-- 1. 무엇을 보낼지 -->
          <div class="section-title">1. 무엇을 보낼지 <small>MAIL_EVENT_TEMPLATE</small></div>
          <div class="form-group mb-2">
            <label class="b2b-form-label">연결 템플릿</label>
            <select v-model="form.templateId" class="b2b-input form-select form-select-sm">
              <option :value="null">— 연결 안 함 —</option>
              <optgroup v-for="category in mailCategories" :key="category.code" :label="category.name">
                <option
                  v-for="template in templatesByCategory(category.code)"
                  :key="template.templateId"
                  :value="template.templateId"
                >
                  {{ template.templateName }}{{ template.statusCode !== 'ACTIVE' ? ` (${statusName(template.statusCode)})` : '' }}
                </option>
              </optgroup>
            </select>
          </div>
          <div v-if="pickedTemplate" class="picked-tpl">
            <span class="b2b-badge b2b-badge-outline">{{ pickedTemplate.engineType }}</span>
            <span class="b2b-badge b2b-badge-secondary">v{{ pickedVersion?.versionNo }}</span>
            <span v-if="pickedTemplate.statusCode !== 'ACTIVE'" class="text-warning small">
              <i class="bi bi-exclamation-triangle me-1"></i>{{ statusName(pickedTemplate.statusCode) }} 상태 템플릿
            </span>
            <router-link :to="`/mail/templates?templateId=${pickedTemplate.templateId}`" class="ms-auto small">
              템플릿 열기 <i class="bi bi-box-arrow-up-right"></i>
            </router-link>
          </div>
          <div v-if="pickedVersion" class="subject-preview">{{ pickedVersion.subject }}</div>

          <div class="row g-2 mt-1">
            <div class="col-5">
              <label class="b2b-form-label">발신자명</label>
              <input v-model="form.fromName" type="text" class="b2b-input form-control form-control-sm" />
            </div>
            <div class="col-7">
              <label class="b2b-form-label">발신 주소</label>
              <input v-model="form.fromEmail" type="text" class="b2b-input form-control form-control-sm" />
            </div>
            <div class="col-6">
              <label class="b2b-form-label">회신 주소</label>
              <input v-model="form.replyTo" type="text" class="b2b-input form-control form-control-sm" />
            </div>
            <div class="col-6">
              <label class="b2b-form-label">적용 시작 <small>비우면 즉시</small></label>
              <input v-model="form.validFromDt" type="date" class="b2b-input form-control form-control-sm" />
            </div>
          </div>

          <!-- 2. 누구에게 보낼지 -->
          <div class="section-title mt-3">
            2. 누구에게 보낼지 <small>MAIL_EVENT_RECIPIENT</small>
            <button class="btn-b2b-action btn-compact ms-auto" @click="addRecipient">
              <i class="bi bi-plus-lg text-success"></i> 규칙 추가
            </button>
          </div>

          <table v-if="form.recipients.length" class="b2b-table rcpt-table">
            <thead>
              <tr>
                <th style="width: 62px">구분</th>
                <th style="width: 118px">수신자 유형</th>
                <th>대상값 / 조건</th>
                <th style="width: 28px"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(rule, index) in form.recipients" :key="index">
                <td>
                  <select v-model="rule.sendField" class="b2b-input form-select form-select-sm">
                    <option v-for="field in sendFields" :key="field.code" :value="field.code">{{ field.name }}</option>
                  </select>
                </td>
                <td>
                  <select v-model="rule.recipientType" class="b2b-input form-select form-select-sm">
                    <option v-for="type in recipientTypes" :key="type.code" :value="type.code">{{ type.name }}</option>
                  </select>
                </td>
                <td>
                  <input
                    v-if="needTarget(rule.recipientType)"
                    v-model="rule.targetValue"
                    type="text"
                    class="b2b-input form-control form-control-sm mb-1"
                    :placeholder="targetHint(rule.recipientType)"
                  />
                  <div v-else class="text-muted target-none">{{ targetHint(rule.recipientType) }}</div>
                  <input
                    v-model="rule.conditionExpr"
                    type="text"
                    class="b2b-input form-control form-control-sm cond-input"
                    placeholder="조건식 (선택) — 예: urgency == '긴급'"
                  />
                </td>
                <td class="text-center">
                  <button class="btn-b2b-icon btn-b2b-action" title="규칙 삭제" @click="form.recipients.splice(index, 1)">
                    <i class="bi bi-x-lg"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-else class="empty-rcpt">
            <i class="bi bi-exclamation-triangle text-danger me-1"></i>
            수신자 규칙이 없습니다. 이 이벤트는 발송 대상을 찾지 못해 실패합니다.
          </div>

          <!-- 결과 요약 -->
          <div class="section-title mt-3">발송 요약</div>
          <div class="resolve-box">
            <div v-if="!form.templateId" class="text-danger">
              <i class="bi bi-x-circle me-1"></i>템플릿이 연결되지 않아 발송되지 않습니다.
            </div>
            <template v-else>
              <div><span class="k">제목</span>{{ pickedVersion?.subject || '—' }}</div>
              <div><span class="k">발신</span>{{ form.fromName }} &lt;{{ form.fromEmail }}&gt;</div>
              <div v-for="field in sendFields" :key="field.code">
                <span class="k">{{ field.name }}</span>
                <span :class="{ 'text-danger': field.code === 'TO' && !rulesOf(field.code).length }">
                  {{ rulesOf(field.code).map((rule) => recipientLabel(rule)).join(', ') || (field.code === 'TO' ? '없음 (발송 실패)' : '—') }}
                </span>
              </div>
            </template>
          </div>
        </div>

        <div class="panel-header border-top d-flex align-items-center gap-2">
          <button class="btn-b2b-action" :disabled="!isDirty" @click="resetForm">되돌리기</button>
          <button class="btn-b2b-primary ms-auto" :disabled="!isDirty" @click="saveMapping">
            <i class="bi bi-check2 me-1"></i>저장
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { showToast } from '@/utils/toastUtil'
import {
  mailCategories,
  mailEventRecipients,
  mailEventTemplates,
  mailEvents,
  mailModules,
  mailSendLogs,
  mailTemplates,
  recipientTypes,
  sendFields,
  templateStatuses,
} from '@/data/mailTemplateMock'

const moduleFilter = ref('ALL')
const keyword = ref('')
const onlyProblem = ref(false)
const selectedEventId = ref(null)

const recipients = ref(mailEventRecipients)
const mappings = ref(mailEventTemplates)

/** 편집 중인 발송 설정 (저장 전까지 원본을 건드리지 않는다) */
const form = reactive({
  templateId: null,
  fromName: '',
  fromEmail: '',
  replyTo: '',
  validFromDt: '',
  recipients: [],
})

/* ---------------- 파생 ---------------- */

/** V_MAIL_DISPATCH_MAP 뷰와 동일한 형태로 조립 */
const rows = computed(() =>
  mailEvents.map((event) => {
    const mapping = mappings.value.find((item) => item.eventId === event.eventId && item.activeYn === 'Y')
    const template = mapping ? mailTemplates.find((item) => item.templateId === mapping.templateId) : null
    const version = template
      ? template.versions.find((item) => item.versionId === template.currentVersionId)
      : null

    const logs = mailSendLogs.filter((log) => log.eventId === event.eventId && log.sendType === 'REAL')
    const failed = logs.filter((log) => log.statusCode === 'FAILED' || log.statusCode === 'BOUNCED')
    const rules = recipients.value.filter((rule) => rule.eventId === event.eventId && rule.useYn === 'Y')

    let bindStatus = 'OK'
    if (!template) bindStatus = 'UNMAPPED'
    else if (!rules.some((rule) => rule.sendField === 'TO')) bindStatus = 'NO_RECIPIENT'
    else if (template.statusCode !== 'ACTIVE') bindStatus = 'INACTIVE'

    return {
      eventId: event.eventId,
      eventCode: event.eventCode,
      eventName: event.eventName,
      description: event.description,
      sourceHint: event.sourceHint,
      moduleCode: event.moduleCode,
      triggerType: event.triggerType,
      mapping,
      template,
      versionNo: version?.versionNo ?? '-',
      subject: version?.subject ?? '',
      bindStatus,
      sendCount: logs.length,
      failCount: failed.length,
      recipientSummary: rules
        .filter((rule) => rule.sendField === 'TO')
        .map((rule) => recipientLabel(rule))
        .join(', '),
      recipientTooltip: rules.map((rule) => `${rule.sendField}: ${recipientLabel(rule)}`).join('\n'),
    }
  })
)

const selectedRow = computed(() => rows.value.find((row) => row.eventId === selectedEventId.value) || null)

const counts = computed(() => ({
  ok: rows.value.filter((row) => row.bindStatus === 'OK').length,
  unmapped: rows.value.filter((row) => row.bindStatus === 'UNMAPPED').length,
  noRecipient: rows.value.filter((row) => row.bindStatus === 'NO_RECIPIENT').length,
  inactive: rows.value.filter((row) => row.bindStatus === 'INACTIVE').length,
}))

const filteredRows = computed(() => {
  const text = keyword.value.trim().toLowerCase()
  return rows.value.filter((row) => {
    if (moduleFilter.value !== 'ALL' && row.moduleCode !== moduleFilter.value) return false
    if (onlyProblem.value && row.bindStatus === 'OK') return false
    if (!text) return true
    return [row.eventCode, row.eventName, row.template?.templateName]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(text)
  })
})

const groupedRows = computed(() =>
  mailModules
    .map((module) => ({
      moduleCode: module.code,
      moduleName: module.name,
      icon: module.icon,
      rows: filteredRows.value.filter((row) => row.moduleCode === module.code),
    }))
    .filter((group) => group.rows.length > 0)
)

const pickedTemplate = computed(
  () => mailTemplates.find((item) => item.templateId === form.templateId) || null
)

const pickedVersion = computed(
  () => pickedTemplate.value?.versions.find((item) => item.versionId === pickedTemplate.value.currentVersionId) || null
)

const isDirty = computed(() => {
  const row = selectedRow.value
  if (!row) return false
  const original = snapshotOf(row)
  return JSON.stringify(original) !== JSON.stringify(snapshotOfForm())
})

/* ---------------- 헬퍼 ---------------- */
function categoryName(code) {
  return mailCategories.find((category) => category.code === code)?.name || code
}

function statusName(code) {
  return templateStatuses.find((status) => status.code === code)?.name || code
}

function bindStatusName(code) {
  return { OK: '정상', UNMAPPED: '템플릿 미연결', NO_RECIPIENT: '수신자 규칙 없음', INACTIVE: '비활성 템플릿' }[code] || code
}

function dotClass(bindStatus) {
  if (bindStatus === 'OK') return 'status-dot-success'
  if (bindStatus === 'INACTIVE') return 'status-dot-warning'
  return 'status-dot-danger'
}

function templatesByCategory(categoryCode) {
  return mailTemplates.filter((template) => template.categoryCode === categoryCode)
}

function needTarget(recipientType) {
  return recipientTypes.find((type) => type.code === recipientType)?.needTarget ?? false
}

function targetHint(recipientType) {
  return recipientTypes.find((type) => type.code === recipientType)?.hint || ''
}

/** 규칙 한 줄을 사람이 읽는 문구로 */
function recipientLabel(rule) {
  const typeName = recipientTypes.find((type) => type.code === rule.recipientType)?.name || rule.recipientType
  const target = rule.targetValue ? `(${rule.targetValue})` : ''
  const condition = rule.conditionExpr ? ` [조건]` : ''
  return `${typeName}${target}${condition}`
}

function rulesOf(sendField) {
  return form.recipients.filter((rule) => rule.sendField === sendField)
}

function snapshotOf(row) {
  return {
    templateId: row.mapping?.templateId ?? null,
    fromName: row.mapping?.fromName ?? '',
    fromEmail: row.mapping?.fromEmail ?? '',
    replyTo: row.mapping?.replyTo ?? '',
    validFromDt: row.mapping?.validFromDt ?? '',
    recipients: recipients.value
      .filter((rule) => rule.eventId === row.eventId)
      .map((rule) => ({
        recipientType: rule.recipientType,
        sendField: rule.sendField,
        targetValue: rule.targetValue ?? '',
        conditionExpr: rule.conditionExpr ?? '',
      })),
  }
}

function snapshotOfForm() {
  return {
    templateId: form.templateId,
    fromName: form.fromName,
    fromEmail: form.fromEmail,
    replyTo: form.replyTo,
    validFromDt: form.validFromDt,
    recipients: form.recipients.map((rule) => ({
      recipientType: rule.recipientType,
      sendField: rule.sendField,
      targetValue: rule.targetValue ?? '',
      conditionExpr: rule.conditionExpr ?? '',
    })),
  }
}

/* ---------------- 액션 ---------------- */
function selectEvent(eventId) {
  selectedEventId.value = eventId
}

function loadForm() {
  const row = selectedRow.value
  if (!row) return
  const snapshot = snapshotOf(row)
  form.templateId = snapshot.templateId
  form.fromName = snapshot.fromName
  form.fromEmail = snapshot.fromEmail
  form.replyTo = snapshot.replyTo
  form.validFromDt = snapshot.validFromDt
  form.recipients = snapshot.recipients
}

function resetForm() {
  loadForm()
  showToast('저장된 설정으로 되돌렸습니다.', { type: 'info' })
}

function addRecipient() {
  form.recipients.push({ recipientType: 'ASSIGNEE', sendField: 'TO', targetValue: '', conditionExpr: '' })
}

/**
 * 저장 — 코드 수정 없이 "무엇을 / 누구에게" 를 교체하는 지점.
 *   템플릿 교체 : PUT /api/mail/events/{eventId}/template
 *   수신자 규칙 : PUT /api/mail/events/{eventId}/recipients
 */
function saveMapping() {
  const row = selectedRow.value
  if (!row || !isDirty.value) return

  // 대상값이 필요한 유형인데 비어 있으면 중단
  const invalid = form.recipients.find((rule) => needTarget(rule.recipientType) && !String(rule.targetValue || '').trim())
  if (invalid) {
    showToast(`${recipientTypes.find((t) => t.code === invalid.recipientType)?.name} 규칙의 대상값을 입력하세요.`, { type: 'error' })
    return
  }
  if (form.templateId && !form.fromEmail.trim()) {
    showToast('발신 주소를 입력하세요.', { type: 'error' })
    return
  }

  // 1) 이벤트 ↔ 템플릿 바인딩
  const existing = mappings.value.find((item) => item.eventId === row.eventId)
  if (form.templateId === null) {
    if (existing) mappings.value.splice(mappings.value.indexOf(existing), 1)
  } else if (existing) {
    Object.assign(existing, {
      templateId: form.templateId,
      fromName: form.fromName,
      fromEmail: form.fromEmail,
      replyTo: form.replyTo || null,
      validFromDt: form.validFromDt || null,
    })
  } else {
    mappings.value.push({
      mapId: Date.now(),
      eventId: row.eventId,
      templateId: form.templateId,
      localeCode: 'ko_KR',
      brandCode: 'DEFAULT',
      priority: 1,
      validFromDt: form.validFromDt || null,
      validToDt: null,
      fromName: form.fromName,
      fromEmail: form.fromEmail,
      replyTo: form.replyTo || null,
      bccList: null,
      activeYn: 'Y',
    })
  }

  // 2) 수신자 규칙 — 이벤트 단위로 통째 교체
  const kept = recipients.value.filter((rule) => rule.eventId !== row.eventId)
  const rebuilt = form.recipients.map((rule, index) => ({
    recipientId: Date.now() + index,
    eventId: row.eventId,
    recipientType: rule.recipientType,
    sendField: rule.sendField,
    targetValue: rule.targetValue || null,
    conditionExpr: rule.conditionExpr || null,
    description: '',
    sortOrder: index + 1,
    useYn: 'Y',
  }))
  recipients.value = [...kept, ...rebuilt]

  showToast(`${row.eventCode} 발송 설정을 저장했습니다.`, { type: 'success' })
}

watch(selectedEventId, loadForm)
</script>

<style scoped>
/* 헤더(48) + 탭바(38) + 전역 PageHeader(50) + 워크스페이스 패딩(32) 제외 */
.mail-page { height: calc(100vh - 168px); min-height: 520px; }
.content-split { display: flex; flex: 1; gap: var(--b2b-space-4); overflow: hidden; }

.left-panel {
  flex: 1;
  min-width: 0;
  background: var(--b2b-color-bg-card);
  border: 1px solid var(--b2b-color-border);
  border-radius: var(--b2b-radius-md);
  overflow: hidden;
}
.right-panel {
  width: 430px;
  flex: 0 0 430px;
  display: flex;
  flex-direction: column;
  background: var(--b2b-color-bg-card);
  border: 1px solid var(--b2b-color-border);
  border-radius: var(--b2b-radius-md);
  overflow: hidden;
}
.panel-header {
  padding: var(--b2b-space-2) var(--b2b-space-3);
  border-bottom: 1px solid var(--b2b-color-border);
  background-color: var(--b2b-color-bg-body);
  color: var(--b2b-color-text-main);
  font-size: var(--b2b-font-size-body);
}
.panel-header.border-top {
  border-bottom: 0;
  border-top: 1px solid var(--b2b-color-border);
}

.search-input { width: 190px; }
.filter-select { width: 130px; }
.stat-row { font-size: 12px; color: var(--b2b-color-text-muted); white-space: nowrap; }
.stat-row strong { color: var(--b2b-color-text-main); }

.table-scroll { height: 100%; overflow: auto; }
.setting-scroll { flex: 1; min-height: 0; overflow-y: auto; padding: var(--b2b-space-3); }

.b2b-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
.b2b-table th,
.b2b-table td {
  border-bottom: 1px solid var(--b2b-color-border);
  padding: 6px 10px;
  text-align: left;
  font-size: 12px;
  color: var(--b2b-color-text-main);
  vertical-align: middle;
}
.b2b-table thead th {
  background: var(--b2b-color-bg-body);
  font-weight: 600;
  white-space: nowrap;
  position: sticky;
  top: 0;
  z-index: 2;
}
.text-truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.group-row td { background: var(--b2b-color-bg-body); padding: 5px 10px; }
.data-row { cursor: pointer; }
.data-row:hover td { background: var(--b2b-color-hover-bg); }
.data-row.selected td { background: var(--b2b-color-primary-subtle); }

.status-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--b2b-color-text-muted);
}
.status-dot-success { background: var(--b2b-color-success); }
.status-dot-danger { background: var(--b2b-color-danger); }
.status-dot-warning { background: #f59e0b; }

/* ---------- 설정 패널 ---------- */
.event-desc { font-size: 12px; color: var(--b2b-color-text-main); margin: 0 0 var(--b2b-space-1); }
.source-hint {
  font-family: var(--b2b-font-family-mono);
  font-size: 11px;
  color: var(--b2b-color-text-muted);
  margin: 0 0 var(--b2b-space-3);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  color: var(--b2b-color-text-main);
  padding-bottom: 5px;
  margin-bottom: var(--b2b-space-2);
  border-bottom: 1px solid var(--b2b-color-border);
}
.section-title small {
  font-family: var(--b2b-font-family-mono);
  font-weight: 400;
  font-size: 10px;
  color: var(--b2b-color-text-muted);
}

.b2b-input {
  background-color: var(--b2b-color-bg-body);
  color: var(--b2b-color-text-main);
  border-color: var(--b2b-color-border);
}
.b2b-form-label small { font-weight: 400; color: var(--b2b-color-text-muted); }

.picked-tpl {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  margin-bottom: 6px;
}
.subject-preview {
  font-size: 11px;
  padding: 6px var(--b2b-space-2);
  color: var(--b2b-color-text-muted);
  background: var(--b2b-color-bg-body);
  border-radius: var(--b2b-radius-sm);
  word-break: break-all;
}

.rcpt-table { border: 1px solid var(--b2b-color-border); border-radius: var(--b2b-radius-sm); }
.rcpt-table td { padding: 5px 6px; }
.rcpt-table .form-select,
.rcpt-table .form-control { font-size: 11px; }
.target-none { font-size: 11px; padding: 3px 0; }
.cond-input { font-family: var(--b2b-font-family-mono); }

.empty-rcpt {
  padding: 10px var(--b2b-space-3);
  font-size: 12px;
  background: var(--b2b-color-bg-body);
  border: 1px solid var(--b2b-color-danger);
  border-radius: var(--b2b-radius-sm);
}

.resolve-box {
  padding: 9px 11px;
  font-size: 12px;
  line-height: 1.9;
  background: var(--b2b-color-bg-body);
  border-radius: var(--b2b-radius-sm);
}
.resolve-box .k {
  display: inline-block;
  width: 66px;
  color: var(--b2b-color-text-muted);
}
</style>
