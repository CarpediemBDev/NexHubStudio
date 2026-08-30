<template>
  <div class="b2b-page-container mail-page">

    <!-- Toolbar -->
    <div class="b2b-toolbar mb-3">
      <div class="d-flex align-items-center gap-2">
        <input v-model="keyword" type="text" class="form-control form-control-sm search-input" placeholder="템플릿명 · 코드 검색" />
        <select v-model="categoryFilter" class="form-select form-select-sm filter-select">
          <option value="ALL">전체 카테고리</option>
          <option v-for="category in mailCategories" :key="category.code" :value="category.code">
            {{ category.name }}
          </option>
        </select>
        <select v-model="statusFilter" class="form-select form-select-sm filter-select">
          <option value="ALL">전체 상태</option>
          <option v-for="status in templateStatuses" :key="status.code" :value="status.code">
            {{ status.name }}
          </option>
        </select>
      </div>
      <div class="d-flex align-items-center gap-2 ms-auto">
        <button class="btn-b2b-action" @click="createTemplate">
          <i class="bi bi-plus-lg text-success me-1"></i>새 템플릿
        </button>
        <button class="btn-b2b-action" :disabled="!selected" @click="openTestModal">
          <i class="bi bi-send me-1"></i>테스트 발송
        </button>
        <button class="btn-b2b-primary" :disabled="!isDirty" @click="save">
          <i class="bi bi-check2 me-1"></i>저장
        </button>
      </div>
    </div>

    <div class="content-split">
      <!-- 좌측: 템플릿 목록 -->
      <div class="left-panel">
        <div class="panel-header fw-bold">
          <i class="bi bi-list-ul me-1 text-primary"></i>목록
          <span class="text-muted fw-normal ms-1">{{ filteredTemplates.length }}</span>
        </div>
        <ul class="tpl-list">
          <li
            v-for="template in filteredTemplates"
            :key="template.templateId"
            class="tpl-item"
            :class="{ selected: template.templateId === selectedId }"
            @click="selectTemplate(template.templateId)"
          >
            <div class="d-flex align-items-center justify-content-between gap-2">
              <span class="fw-semibold text-truncate" :title="template.templateCode">
                {{ template.templateName }}
              </span>
              <span class="b2b-badge" :class="statusBadge(template.statusCode)">
                {{ statusName(template.statusCode) }}
              </span>
            </div>
            <div class="text-muted text-truncate mt-1">
              {{ categoryName(template.categoryCode) }} · v{{ currentVersionOf(template)?.versionNo ?? '-' }}
            </div>
          </li>
        </ul>
        <div v-if="filteredTemplates.length === 0" class="text-center text-muted py-4 small">
          조건에 맞는 템플릿이 없습니다.
        </div>
      </div>

      <!-- 우측: 상세 -->
      <div v-if="selected" class="right-panel">
        <div class="panel-header d-flex align-items-center gap-2">
          <span class="fw-bold" :title="selected.templateCode">{{ selected.templateName }}</span>
          <span class="b2b-badge b2b-badge-outline">{{ selected.engineType }}</span>
          <span class="b2b-badge b2b-badge-secondary">v{{ currentVersion?.versionNo }}</span>
          <span v-if="boundEvents.length" class="text-muted small">
            <i class="bi bi-diagram-2 me-1"></i>{{ boundEvents.map((event) => event.eventCode).join(', ') }}
          </span>
          <span v-else class="text-danger small"><i class="bi bi-exclamation-triangle me-1"></i>연결된 발송 이벤트 없음</span>

          <div class="btn-group btn-group-sm ms-auto">
            <button
              v-for="tab in tabs"
              :key="tab.key"
              class="btn btn-sm"
              :class="activeTab === tab.key ? 'btn-primary' : 'btn-outline-secondary'"
              @click="activeTab = tab.key"
            >
              {{ tab.label }}
            </button>
          </div>
        </div>

        <!-- 미리보기 -->
        <div v-if="activeTab === 'preview'" class="tab-content-area preview-area">
          <div class="preview-bar">
            <div class="btn-group btn-group-sm">
              <button
                v-for="device in devices"
                :key="device.key"
                class="btn btn-sm"
                :class="deviceMode === device.key ? 'btn-primary' : 'btn-outline-secondary'"
                @click="deviceMode = device.key"
              >
                <i :class="device.icon"></i>
              </button>
            </div>
            <span class="subject-text">{{ renderedSubject }}</span>
            <span v-if="missingRequired.length && !isViewingOld" class="text-danger small ms-auto">
              <i class="bi bi-exclamation-triangle me-1"></i>필수 변수 누락: {{ missingRequired.join(', ') }}
            </span>
          </div>

          <div v-if="isViewingOld" class="view-banner">
            <i class="bi bi-clock-history me-1"></i>
            <strong>v{{ viewingVersion.versionNo }}</strong> 열람 중 (읽기 전용)
            <span class="text-muted ms-2">{{ viewingVersion.changeNote }} · {{ viewingVersion.regDt }}</span>
            <button class="btn-b2b-action btn-compact ms-auto" @click="backToCurrent">
              <i class="bi bi-arrow-return-left me-1"></i>현재 버전으로
            </button>
          </div>
          <div class="preview-stage">
            <pre v-if="deviceMode === 'text'" class="text-preview">{{ renderedText || '(텍스트 본문 없음)' }}</pre>
            <iframe
              v-else
              class="preview-frame"
              :style="{ width: deviceMode === 'mobile' ? '375px' : '620px' }"
              sandbox=""
              :srcdoc="previewDocument"
              title="메일 미리보기"
            ></iframe>
          </div>
        </div>

        <!-- 편집 -->
        <div v-else-if="activeTab === 'edit'" class="tab-content-area edit-area">
          <div class="edit-main">
            <div class="meta-grid mb-2">
              <div>
                <label class="b2b-form-label">템플릿명 <span class="text-danger">*</span></label>
                <input ref="nameInput" v-model="meta.templateName" type="text" class="b2b-input form-control form-control-sm" />
              </div>
              <div>
                <label class="b2b-form-label">
                  템플릿 코드 <span class="text-danger">*</span>
                  <small class="text-muted ms-1">
                    {{ isCodeEditable ? '시스템 식별자 (중복 불가)' : '작성중 상태에서만 변경 가능' }}
                  </small>
                </label>
                <input
                  v-model="meta.templateCode"
                  type="text"
                  class="b2b-input form-control form-control-sm font-monospace"
                  :disabled="!isCodeEditable"
                />
              </div>
              <div>
                <label class="b2b-form-label">카테고리</label>
                <select v-model="meta.categoryCode" class="b2b-input form-select form-select-sm">
                  <option v-for="category in mailCategories" :key="category.code" :value="category.code">
                    {{ category.name }}
                  </option>
                </select>
              </div>
              <div>
                <label class="b2b-form-label">엔진</label>
                <select v-model="meta.engineType" class="b2b-input form-select form-select-sm">
                  <option v-for="engine in engineTypes" :key="engine.code" :value="engine.code">
                    {{ engine.name }}
                  </option>
                </select>
              </div>
              <div>
                <label class="b2b-form-label">상태</label>
                <select v-model="meta.statusCode" class="b2b-input form-select form-select-sm">
                  <option v-for="status in templateStatuses" :key="status.code" :value="status.code">
                    {{ status.name }}
                  </option>
                </select>
              </div>
              <div>
                <label class="b2b-form-label">설명</label>
                <input v-model="meta.description" type="text" class="b2b-input form-control form-control-sm" />
              </div>
            </div>

            <div class="form-group mb-2">
              <label class="b2b-form-label">제목</label>
              <input v-model="draft.subject" type="text" class="b2b-input form-control form-control-sm font-monospace" />
            </div>
            <div class="form-group mb-2">
              <label class="b2b-form-label">프리헤더</label>
              <input v-model="draft.preheader" type="text" class="b2b-input form-control form-control-sm" />
            </div>
            <div class="form-group mb-2 flex-grow-1 d-flex flex-column">
              <label class="b2b-form-label">HTML 본문</label>
              <textarea
                ref="bodyEditor"
                v-model="draft.bodyHtml"
                class="b2b-input form-control form-control-sm font-monospace code-area"
                spellcheck="false"
              ></textarea>
            </div>
            <div class="form-group mb-2">
              <label class="b2b-form-label">텍스트 본문</label>
              <textarea
                v-model="draft.bodyText"
                class="b2b-input form-control form-control-sm font-monospace text-area"
                spellcheck="false"
              ></textarea>
            </div>
            <div class="d-flex gap-2">
              <input
                v-model="draft.changeNote"
                type="text"
                class="b2b-input form-control form-control-sm"
                :placeholder="isBodyDirty ? '변경 사유 (버전 이력에 기록) — 필수' : '변경 사유 (본문 수정 시 필수)'"
                :disabled="!isBodyDirty"
              />
              <button class="btn-b2b-action" @click="resetDraft">되돌리기</button>
            </div>
          </div>

          <div class="edit-side">
            <div class="panel-header fw-bold">
              변수
              <span class="text-muted fw-normal small ms-1">클릭 시 본문에 삽입</span>
            </div>
            <table class="b2b-table compact-table">
              <thead>
                <tr>
                  <th>변수명</th>
                  <th style="width: 46px">필수</th>
                  <th>샘플값</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="variable in selected.variables" :key="variable.varName">
                  <td>
                    <button class="var-btn font-monospace" :title="variable.description" @click="insertToken('${' + variable.varName + '}')">
                      {{ variable.varName }}
                    </button>
                  </td>
                  <td class="text-center">
                    <span v-if="variable.requiredYn === 'Y'" class="text-danger">●</span>
                    <span v-else class="text-muted">-</span>
                  </td>
                  <td>
                    <input
                      v-model="variable.sampleValue"
                      type="text"
                      class="b2b-input form-control form-control-sm sample-input"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 버전 -->
        <div v-else class="tab-content-area p-0">
          <table class="b2b-table compact-table">
            <thead>
              <tr>
                <th style="width: 60px">버전</th>
                <th style="width: 80px">상태</th>
                <th>제목</th>
                <th style="width: 240px">변경 사유</th>
                <th style="width: 90px">작성자</th>
                <th style="width: 130px">작성일시</th>
                <th style="width: 150px"></th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="version in sortedVersions"
                :key="version.versionId"
                :class="{
                  'row-current': version.versionId === selected.currentVersionId,
                  'row-viewing': version.versionId === viewingVersionId,
                }"
              >
                <td class="fw-bold">v{{ version.versionNo }}</td>
                <td>
                  <span
                    class="b2b-badge"
                    :class="version.versionId === selected.currentVersionId ? 'b2b-badge-success' : 'b2b-badge-outline'"
                  >
                    {{ version.versionId === selected.currentVersionId ? '활성' : '이전' }}
                  </span>
                </td>
                <td class="font-monospace text-truncate">{{ version.subject }}</td>
                <td class="text-muted">{{ version.changeNote }}</td>
                <td>{{ version.regId }}</td>
                <td class="text-muted">{{ version.regDt }}</td>
                <td class="text-end">
                  <button
                    class="btn-b2b-action btn-compact"
                    :class="{ 'btn-compact-active': version.versionId === viewingVersionId }"
                    @click="viewVersion(version)"
                  >
                    보기
                  </button>
                  <button
                    v-if="version.versionId !== selected.currentVersionId"
                    class="btn-b2b-action btn-compact ms-1"
                    @click="rollbackTo(version)"
                  >
                    되돌리기
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-else class="right-panel d-flex align-items-center justify-content-center text-muted">
        좌측에서 템플릿을 선택하세요.
      </div>
    </div>

    <!-- 테스트 발송 모달 -->
    <div v-if="testModalOpen" class="modal-mask" @click.self="testModalOpen = false">
      <div class="modal-box">
        <div class="panel-header d-flex align-items-center">
          <span class="fw-bold"><i class="bi bi-send me-1 text-primary"></i>테스트 발송</span>
          <span class="text-muted small ms-2">{{ selected.templateName }}</span>
          <button class="btn-b2b-icon btn-b2b-action ms-auto" @click="testModalOpen = false">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>

        <div class="modal-split">
          <div class="modal-form">
            <div class="form-group mb-2">
              <label class="b2b-form-label">수신자</label>
              <input v-model="testForm.toEmail" type="email" class="b2b-input form-control form-control-sm" />
            </div>
            <div v-for="variable in selected.variables" :key="variable.varName" class="form-group mb-2">
              <label class="b2b-form-label">
                {{ variable.varName }}
                <span v-if="variable.requiredYn === 'Y'" class="text-danger">*</span>
              </label>
              <input v-model="testForm.model[variable.varName]" type="text" class="b2b-input form-control form-control-sm" />
            </div>
          </div>
          <div class="modal-preview">
            <div class="subject-text mb-2">{{ testRenderedSubject }}</div>
            <iframe class="preview-frame w-100 flex-grow-1" sandbox="" :srcdoc="testPreviewDocument" title="테스트 미리보기"></iframe>
          </div>
        </div>

        <div class="panel-header border-top d-flex justify-content-end gap-2">
          <button class="btn-b2b-action" @click="testModalOpen = false">닫기</button>
          <button class="btn-b2b-primary" @click="sendTest"><i class="bi bi-send me-1"></i>발송</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { showToast } from '@/utils/toastUtil'
import {
  engineTypes,
  mailCategories,
  mailEventTemplates,
  mailEvents,
  mailLayouts,
  mailTemplates,
  templateStatuses,
} from '@/data/mailTemplateMock'
import {
  buildModelFromVariables,
  castSampleValue,
  composeMailHtml,
  renderTemplate,
  wrapPreviewDocument,
} from '@/utils/mailTemplateRender'

const tabs = [
  { key: 'preview', label: '미리보기' },
  { key: 'edit', label: '편집' },
  { key: 'versions', label: '버전' },
]

const devices = [
  { key: 'pc', icon: 'bi bi-display' },
  { key: 'mobile', icon: 'bi bi-phone' },
  { key: 'text', icon: 'bi bi-file-text' },
]

const route = useRoute()
const templates = ref(mailTemplates)
const keyword = ref('')
const categoryFilter = ref('ALL')
const statusFilter = ref('ALL')

const requestedId = Number(route.query.templateId)
const selectedId = ref(
  templates.value.some((template) => template.templateId === requestedId)
    ? requestedId
    : templates.value[0]?.templateId ?? null
)

watch(
  () => route.query.templateId,
  (newVal) => {
    const parsed = Number(newVal)
    if (parsed && templates.value.some((t) => t.templateId === parsed)) {
      selectedId.value = parsed
    }
  }
)

const activeTab = ref('preview')
const deviceMode = ref('pc')
const bodyEditor = ref(null)
const nameInput = ref(null)
const viewingVersionId = ref(null)   // 과거 버전 열람 중일 때만 값이 들어간다

// 본문(= 새 버전 INSERT 대상) 과 메타(= 마스터 UPDATE 대상) 는 저장 경로가 달라 분리한다
const draft = reactive({ subject: '', preheader: '', bodyHtml: '', bodyText: '', changeNote: '' })
const meta = reactive({
  templateName: '',
  templateCode: '',
  categoryCode: '',
  engineType: '',
  statusCode: '',
  description: '',
})

const testModalOpen = ref(false)
const testForm = reactive({ toEmail: '', model: {} })

/* ---------------- 파생 ---------------- */
const selected = computed(() => templates.value.find((item) => item.templateId === selectedId.value) || null)
const layout = computed(() => mailLayouts.find((item) => item.layoutId === selected.value?.layoutId) || null)
const currentVersion = computed(() => currentVersionOf(selected.value))

/** 편집 중인 엔진 (저장 전에도 미리보기에 즉시 반영) */
const activeEngine = computed(() => meta.engineType || selected.value?.engineType || 'VELOCITY')

const sortedVersions = computed(() =>
  [...(selected.value?.versions || [])].sort((a, b) => b.versionNo - a.versionNo)
)

const filteredTemplates = computed(() => {
  const text = keyword.value.trim().toLowerCase()
  return templates.value.filter((template) => {
    if (categoryFilter.value !== 'ALL' && template.categoryCode !== categoryFilter.value) return false
    if (statusFilter.value !== 'ALL' && template.statusCode !== statusFilter.value) return false
    if (!text) return true
    return `${template.templateCode} ${template.templateName} ${template.tags}`.toLowerCase().includes(text)
  })
})

const previewModel = computed(() => buildModelFromVariables(selected.value?.variables || []))

/** 버전 [보기] 로 열람 중인 과거 버전. null 이면 편집 중인 내용을 미리본다 */
const viewingVersion = computed(
  () => selected.value?.versions.find((version) => version.versionId === viewingVersionId.value) || null
)

const isViewingOld = computed(
  () => !!viewingVersion.value && viewingVersion.value.versionId !== selected.value?.currentVersionId
)

/**
 * 미리보기 원본.
 * 과거 버전 열람 중이면 그 버전을 읽기 전용으로 렌더하고, 편집 draft 는 건드리지 않는다.
 */
const previewSource = computed(() => {
  const version = viewingVersion.value
  if (version) {
    return {
      subject: version.subject,
      preheader: version.preheader || '',
      bodyHtml: version.bodyHtml,
      bodyText: version.bodyText || '',
      engineType: version.engineType,
    }
  }
  return {
    subject: draft.subject,
    preheader: draft.preheader,
    bodyHtml: draft.bodyHtml,
    bodyText: draft.bodyText,
    engineType: activeEngine.value,
  }
})

const renderedSubject = computed(() =>
  renderTemplate(previewSource.value.subject, previewModel.value, previewSource.value.engineType, { keepMissing: true })
)

const renderedText = computed(() =>
  renderTemplate(previewSource.value.bodyText, previewModel.value, previewSource.value.engineType, { keepMissing: true })
)

const previewDocument = computed(() => {
  const source = previewSource.value
  const body = renderTemplate(source.bodyHtml, previewModel.value, source.engineType, { keepMissing: true })
  return wrapPreviewDocument(
    composeMailHtml(layout.value, body, previewModel.value, source.engineType),
    deviceMode.value === 'mobile' ? 375 : layout.value?.bodyWidth || 600
  )
})

const missingRequired = computed(() =>
  (selected.value?.variables || [])
    .filter((variable) => variable.requiredYn === 'Y' && !String(variable.sampleValue || '').trim())
    .map((variable) => variable.varName)
)

/** 템플릿 코드는 업무 키이자 매핑 참조 대상 — DRAFT 상태에서만 수정 허용 */
const isCodeEditable = computed(() => meta.statusCode === 'DRAFT')

/** 본문 변경 → 새 버전 INSERT 대상 */
const isBodyDirty = computed(() => {
  const version = currentVersion.value
  if (!version) return false
  return (
    draft.subject !== version.subject ||
    draft.preheader !== (version.preheader || '') ||
    draft.bodyHtml !== version.bodyHtml ||
    draft.bodyText !== (version.bodyText || '')
  )
})

/** 메타 변경 → 마스터 UPDATE 대상 (버전을 만들지 않는다) */
const isMetaDirty = computed(() => {
  const template = selected.value
  if (!template) return false
  return (
    meta.templateName !== template.templateName ||
    meta.templateCode !== template.templateCode ||
    meta.categoryCode !== template.categoryCode ||
    meta.engineType !== template.engineType ||
    meta.statusCode !== template.statusCode ||
    meta.description !== (template.description || '')
  )
})

const isDirty = computed(() => isBodyDirty.value || isMetaDirty.value)

const boundEvents = computed(() =>
  mailEventTemplates
    .filter((mapping) => mapping.templateId === selected.value?.templateId)
    .map((mapping) => mailEvents.find((event) => event.eventId === mapping.eventId))
    .filter(Boolean)
)

const testModel = computed(() => {
  const model = {}
  ;(selected.value?.variables || []).forEach((variable) => {
    model[variable.varName] = castSampleValue(testForm.model[variable.varName], variable.dataType)
  })
  return model
})

const testRenderedSubject = computed(() =>
  renderTemplate(draft.subject, testModel.value, activeEngine.value, { keepMissing: true })
)

const testPreviewDocument = computed(() => {
  const body = renderTemplate(draft.bodyHtml, testModel.value, activeEngine.value, { keepMissing: true })
  return wrapPreviewDocument(
    composeMailHtml(layout.value, body, testModel.value, activeEngine.value),
    layout.value?.bodyWidth || 600
  )
})

/* ---------------- 헬퍼 ---------------- */
function currentVersionOf(template) {
  if (!template) return null
  return template.versions.find((version) => version.versionId === template.currentVersionId) || null
}

function categoryName(code) {
  return mailCategories.find((category) => category.code === code)?.name || code
}

function statusName(code) {
  return templateStatuses.find((status) => status.code === code)?.name || code
}

function statusBadge(code) {
  return templateStatuses.find((status) => status.code === code)?.badge || 'b2b-badge-outline'
}

/* ---------------- 액션 ---------------- */
function selectTemplate(templateId) {
  selectedId.value = templateId
}

function loadDraft() {
  const template = selected.value
  const version = currentVersion.value

  draft.subject = version?.subject || ''
  draft.preheader = version?.preheader || ''
  draft.bodyHtml = version?.bodyHtml || ''
  draft.bodyText = version?.bodyText || ''
  draft.changeNote = ''

  meta.templateName = template?.templateName || ''
  meta.templateCode = template?.templateCode || ''
  meta.categoryCode = template?.categoryCode || ''
  meta.engineType = template?.engineType || 'VELOCITY'
  meta.statusCode = template?.statusCode || 'DRAFT'
  meta.description = template?.description || ''
}

function resetDraft() {
  loadDraft()
  showToast('저장된 내용으로 되돌렸습니다.', { type: 'info' })
}

function insertToken(token) {
  const textarea = bodyEditor.value
  if (!textarea) {
    draft.bodyHtml += token
    return
  }
  const start = textarea.selectionStart ?? draft.bodyHtml.length
  const end = textarea.selectionEnd ?? start
  draft.bodyHtml = draft.bodyHtml.slice(0, start) + token + draft.bodyHtml.slice(end)
  requestAnimationFrame(() => {
    textarea.focus()
    textarea.setSelectionRange(start + token.length, start + token.length)
  })
}

/**
 * 저장은 두 갈래다.
 *   메타 변경 → 마스터 UPDATE  (PUT /api/mail/templates/{id})        · 버전을 만들지 않는다
 *   본문 변경 → 새 버전 INSERT (POST /api/mail/templates/{id}/versions)
 * 둘 다 바뀌었으면 둘 다 수행한다.
 */
function save() {
  if (!selected.value || !isDirty.value) return
  const template = selected.value

  if (isMetaDirty.value && !validateMeta()) return
  if (isBodyDirty.value && !draft.changeNote.trim()) {
    showToast('본문이 바뀌었습니다. 변경 사유를 입력하세요.', { type: 'warning' })
    activeTab.value = 'edit'
    return
  }

  const messages = []

  if (isMetaDirty.value) {
    template.templateName = meta.templateName.trim()
    template.templateCode = meta.templateCode.trim().toUpperCase()
    template.categoryCode = meta.categoryCode
    template.engineType = meta.engineType
    template.statusCode = meta.statusCode
    template.description = meta.description.trim()
    template.updDt = nowText()
    meta.templateCode = template.templateCode
    messages.push('템플릿 정보')
  }

  if (isBodyDirty.value) {
    messages.push(`v${appendVersion(template)}`)
  }

  showToast(`${messages.join(' · ')} 저장했습니다.`, { type: 'success' })
}

/** 템플릿명·코드 유효성 검사 (코드는 업무 키이므로 중복 불가) */
function validateMeta() {
  const name = meta.templateName.trim()
  const code = meta.templateCode.trim().toUpperCase()

  if (!name) {
    showToast('템플릿명을 입력하세요.', { type: 'error' })
    activeTab.value = 'edit'
    return false
  }
  if (!code) {
    showToast('템플릿 코드를 입력하세요.', { type: 'error' })
    activeTab.value = 'edit'
    return false
  }
  if (!/^[A-Z][A-Z0-9_]{2,59}$/.test(code)) {
    showToast('템플릿 코드는 영문 대문자·숫자·언더스코어 3~60자여야 합니다.', { type: 'error' })
    activeTab.value = 'edit'
    return false
  }
  const duplicated = templates.value.some(
    (item) => item.templateId !== selected.value.templateId && item.templateCode === code
  )
  if (duplicated) {
    showToast(`이미 사용 중인 템플릿 코드입니다: ${code}`, { type: 'error' })
    activeTab.value = 'edit'
    return false
  }
  return true
}

/** 현재 편집 내용을 새 버전으로 추가하고 활성화한다. 반환값은 새 버전 번호 */
function appendVersion(template) {
  const nextNo = Math.max(...template.versions.map((version) => version.versionNo)) + 1
  const newVersion = {
    versionId: Date.now(),
    versionNo: nextNo,
    statusCode: 'ACTIVE',
    subject: draft.subject,
    preheader: draft.preheader,
    engineType: meta.engineType || template.engineType,
    changeNote: draft.changeNote.trim(),
    regId: 'me',
    regDt: nowText(),
    approvedBy: null,
    bodyHtml: draft.bodyHtml,
    bodyText: draft.bodyText,
  }
  const previous = currentVersionOf(template)
  if (previous) previous.statusCode = 'ARCHIVED'
  template.versions.push(newVersion)
  template.currentVersionId = newVersion.versionId
  template.updDt = newVersion.regDt
  draft.changeNote = ''
  return nextNo
}

function rollbackTo(version) {
  const template = selected.value
  const previous = currentVersionOf(template)
  if (previous) previous.statusCode = 'ARCHIVED'
  version.statusCode = 'ACTIVE'
  template.currentVersionId = version.versionId
  loadDraft()
  showToast(`v${version.versionNo} 을(를) 활성 버전으로 되돌렸습니다.`, { type: 'success' })
}

/** 버전 [보기] — draft 를 덮어쓰지 않고 해당 버전만 읽기 전용으로 렌더한다 */
function viewVersion(version) {
  viewingVersionId.value =
    version.versionId === selected.value.currentVersionId ? null : version.versionId
  activeTab.value = 'preview'
}

/** 과거 버전 열람 종료 → 편집 중인 현재 내용으로 복귀 */
function backToCurrent() {
  viewingVersionId.value = null
}

function createTemplate() {
  const nextId = Math.max(...templates.value.map((template) => template.templateId)) + 1
  const versionId = Date.now()
  templates.value.push({
    templateId: nextId,
    templateCode: `NEW_TEMPLATE_${nextId}`,
    templateName: '새 템플릿',
    categoryCode: categoryFilter.value === 'ALL' ? 'NOTICE' : categoryFilter.value,
    engineType: 'VELOCITY',
    localeCode: 'ko_KR',
    layoutId: 1,
    statusCode: 'DRAFT',
    currentVersionId: versionId,
    ownerDeptCode: 'D001',
    ownerUserId: 'me',
    ownerUserName: '나',
    description: '',
    tags: '',
    regDt: nowText(),
    updDt: nowText(),
    versions: [
      {
        versionId,
        versionNo: 1,
        statusCode: 'DRAFT',
        subject: '[NexHub] 제목을 입력하세요',
        preheader: '',
        engineType: 'VELOCITY',
        changeNote: '최초 등록',
        regId: 'me',
        regDt: nowText(),
        approvedBy: null,
        bodyHtml: '<h2 style="margin:0 0 16px;font-size:20px;">제목</h2>\n<p>${userName} 님, 본문을 작성하세요.</p>',
        bodyText: '${userName} 님, 본문을 작성하세요.',
      },
    ],
    variables: [
      { varName: 'userName', varPath: '${userName}', dataType: 'STRING', requiredYn: 'Y', sampleValue: '홍길동', description: '수신자 이름', sortOrder: 1 },
    ],
  })
  selectedId.value = nextId
  activeTab.value = 'edit'
  // 이름부터 바꾸는 흐름이므로 템플릿명 입력란으로 포커스를 보낸다
  nextTick(() => {
    nameInput.value?.focus()
    nameInput.value?.select()
  })
}

function openTestModal() {
  testForm.toEmail = 'tester@nexhub.example.com'
  testForm.model = {}
  selected.value.variables.forEach((variable) => {
    testForm.model[variable.varName] = variable.sampleValue
  })
  testModalOpen.value = true
}

function sendTest() {
  const email = testForm.toEmail.trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showToast('수신자 이메일 형식이 올바르지 않습니다.', { type: 'error' })
    return
  }
  if (!email.endsWith('@nexhub.example.com')) {
    showToast('테스트 발송은 사내 도메인만 허용됩니다.', { type: 'error' })
    return
  }
  const missing = selected.value.variables
    .filter((variable) => variable.requiredYn === 'Y' && !String(testForm.model[variable.varName] || '').trim())
    .map((variable) => variable.varName)
  if (missing.length) {
    showToast(`필수 변수 누락: ${missing.join(', ')}`, { type: 'error' })
    return
  }
  showToast(`${email} 로 테스트 발송했습니다.`, { type: 'success' })
  testModalOpen.value = false
}

function nowText() {
  const now = new Date()
  const pad = (value) => String(value).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`
}

watch(selectedId, () => {
  viewingVersionId.value = null
  loadDraft()
}, { immediate: true })

// 편집은 항상 현재 버전 기준이므로 편집 탭으로 가면 열람 모드를 끈다
watch(activeTab, (tab) => {
  if (tab === 'edit') viewingVersionId.value = null
})
</script>

<style scoped>
/* 헤더(48) + 탭바(38) + 전역 PageHeader(50) + 워크스페이스 패딩(32) 제외 */
.mail-page { height: calc(100vh - 168px); min-height: 520px; }
.content-split { display: flex; flex: 1; gap: var(--b2b-space-4); overflow: hidden; }

.left-panel {
  width: 260px;
  background: var(--b2b-color-bg-card);
  border: 1px solid var(--b2b-color-border);
  border-radius: var(--b2b-radius-md);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.right-panel {
  flex: 1;
  min-width: 0;
  background: var(--b2b-color-bg-card);
  border: 1px solid var(--b2b-color-border);
  border-radius: var(--b2b-radius-md);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.panel-header {
  padding: var(--b2b-space-2) var(--b2b-space-3);
  border-bottom: 1px solid var(--b2b-color-border);
  background-color: var(--b2b-color-bg-body);
  color: var(--b2b-color-text-main);
  font-size: var(--b2b-font-size-body);
}

.search-input { width: 180px; }
.filter-select { width: 130px; }

.tpl-list { list-style: none; margin: 0; padding: 0; overflow-y: auto; flex: 1; }
.tpl-item {
  padding: var(--b2b-space-2) var(--b2b-space-3);
  border-bottom: 1px solid var(--b2b-color-border);
  border-left: 3px solid transparent;
  font-size: 12px;
  color: var(--b2b-color-text-main);
  cursor: pointer;
}
.tpl-item:hover { background: var(--b2b-color-hover-bg); }
.tpl-item.selected {
  background: var(--b2b-color-primary-subtle);
  border-left-color: var(--b2b-color-primary);
}

.tab-content-area { flex: 1; min-height: 0; overflow: auto; padding: var(--b2b-space-3); }

/* 미리보기 */
.preview-area { display: flex; flex-direction: column; padding: 0; }
.preview-bar {
  display: flex;
  align-items: center;
  gap: var(--b2b-space-3);
  padding: var(--b2b-space-2) var(--b2b-space-3);
  border-bottom: 1px solid var(--b2b-color-border);
}
.subject-text {
  font-size: 12px;
  font-weight: 600;
  color: var(--b2b-color-text-main);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.preview-stage {
  flex: 1;
  display: flex;
  justify-content: center;
  padding: var(--b2b-space-4);
  overflow: auto;
  background: var(--b2b-color-bg-body);
}
.preview-frame {
  height: 100%;
  min-height: 320px;
  border: 1px solid var(--b2b-color-border);
  border-radius: var(--b2b-radius-sm);
  background: var(--b2b-color-bg-card);
}
.text-preview {
  width: 620px;
  margin: 0;
  padding: 14px;
  font-size: 12px;
  white-space: pre-wrap;
  background: var(--b2b-color-bg-card);
  border: 1px solid var(--b2b-color-border);
  border-radius: var(--b2b-radius-sm);
  color: var(--b2b-color-text-main);
}

/* 편집 */
.edit-area { display: flex; gap: var(--b2b-space-3); padding: var(--b2b-space-3); }
.edit-main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.meta-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--b2b-space-2) var(--b2b-space-3);
  padding: 10px;
  border: 1px solid var(--b2b-color-border);
  border-radius: var(--b2b-radius-md);
  background: var(--b2b-color-bg-body);
}
.meta-grid .b2b-form-label { white-space: nowrap; }
.edit-side {
  width: 320px;
  flex: 0 0 320px;
  border: 1px solid var(--b2b-color-border);
  border-radius: var(--b2b-radius-md);
  overflow: auto;
}
.code-area { flex: 1; min-height: 240px; white-space: pre; overflow-x: auto; }
.text-area { height: 70px; }
.b2b-input {
  background-color: var(--b2b-color-bg-body);
  color: var(--b2b-color-text-main);
  border-color: var(--b2b-color-border);
}
.var-btn {
  padding: 0;
  border: 0;
  background: none;
  color: var(--b2b-color-primary);
  font-size: 12px;
  cursor: pointer;
}
.var-btn:hover { text-decoration: underline; }
.sample-input { font-size: 12px; }

/* 테이블 */
.b2b-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
.b2b-table th,
.b2b-table td {
  border-bottom: 1px solid var(--b2b-color-border);
  padding: 6px 10px;
  text-align: left;
  font-size: 12px;
  color: var(--b2b-color-text-main);
  overflow: hidden;
  text-overflow: ellipsis;
}
.b2b-table th { background: var(--b2b-color-bg-body); font-weight: 600; }
.b2b-table .row-current td { background: var(--b2b-color-primary-subtle); }
.b2b-table .row-viewing td {
  background: var(--b2b-color-hover-bg);
  box-shadow: inset 3px 0 0 var(--b2b-color-primary);
}

.view-banner {
  display: flex;
  align-items: center;
  gap: var(--b2b-space-1);
  padding: 6px var(--b2b-space-3);
  font-size: 12px;
  color: var(--b2b-color-text-main);
  background: var(--b2b-color-primary-subtle);
  border-bottom: 1px solid var(--b2b-color-border);
}

/* 모달 */
.modal-mask {
  position: fixed;
  inset: 0;
  z-index: 1060;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.5);
}
.modal-box {
  width: min(1000px, 94vw);
  height: min(700px, 90vh);
  display: flex;
  flex-direction: column;
  background: var(--b2b-color-bg-card);
  border: 1px solid var(--b2b-color-border);
  border-radius: var(--b2b-radius-md);
  overflow: hidden;
}
.modal-split { flex: 1; min-height: 0; display: flex; }
.modal-form {
  width: 320px;
  flex: 0 0 320px;
  padding: var(--b2b-space-3);
  overflow-y: auto;
  border-right: 1px solid var(--b2b-color-border);
}
.modal-preview {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  padding: var(--b2b-space-3);
  background: var(--b2b-color-bg-body);
}
</style>
