<template>
  <div class="mail-clean-studio">
    <!-- 메인 2단 레이아웃 (좌: 260px 목록, 우: 널찍하고 시원한 메인 워크스페이스) -->
    <div class="studio-layout">
      <!-- ================= 1. 좌측 심플 템플릿 목록 (260px) ================= -->
      <aside class="sidebar-card">
        <div class="sidebar-top">
          <div class="d-flex align-items-center justify-content-between mb-3">
            <span class="sidebar-title d-flex align-items-center">
              <i class="bi bi-list-ul me-2 text-primary"></i>목록
            </span>
            <button class="btn btn-primary btn-sm px-2.5" @click="openNewTemplateModal">
              <i class="bi bi-plus-lg me-1"></i>신규
            </button>
          </div>

          <!-- 심플 검색창 (시원한 상단 여백) -->
          <div class="search-wrap mt-3">
            <i class="bi bi-search search-icon"></i>
            <input
              v-model="searchQuery"
              type="text"
              class="form-control form-control-sm search-input"
              placeholder="템플릿 검색..."
            />
          </div>
        </div>

        <!-- 템플릿 리스트 -->
        <div class="sidebar-scroll custom-scrollbar">
          <div
            v-for="item in filteredTemplates"
            :key="item.templateId"
            class="template-row"
            :class="{ active: item.templateId === selectedTemplateId }"
            @click="selectTemplate(item.templateId)"
          >
            <div class="d-flex align-items-center justify-content-between">
              <span class="template-name text-truncate">{{ item.templateName }}</span>
              <span class="status-dot" :class="item.statusCode.toLowerCase()"></span>
            </div>
          </div>

          <div v-if="filteredTemplates.length === 0" class="empty-state">
            검색 결과가 없습니다.
          </div>
        </div>
      </aside>

      <!-- ================= 2. 우측 시원하고 넓은 메인 워크스페이스 ================= -->
      <main v-if="selectedTemplate" class="main-card">
        <!-- 워크스페이스 상단 헤더 -->
        <header class="main-header">
          <div class="d-flex align-items-center justify-content-between">
            <div class="d-flex align-items-center gap-2.5">
              <h4 class="template-heading mb-0">{{ selectedTemplate.templateName }}</h4>
              <span class="badge" :class="getStatusBadgeClass(editForm.statusCode)">
                {{ getStatusLabel(editForm.statusCode) }}
              </span>
            </div>

            <!-- 우측 액션 버튼 -->
            <div class="d-flex align-items-center gap-2">
              <button class="btn btn-outline-secondary btn-sm" @click="showMetaEdit = !showMetaEdit">
                <i class="bi bi-pencil-square me-1"></i>편집
              </button>
              <button class="btn btn-primary btn-sm px-3" @click="openTestSendModal">
                <i class="bi bi-send me-1"></i>테스트 발송
              </button>
            </div>
          </div>

          <!-- 설정 드롭다운/서브패널 -->
          <div v-if="showMetaEdit" class="meta-edit-box mt-3 p-3 bg-light rounded border">
            <div class="row g-3 align-items-end">
              <div class="col-md-5">
                <label class="form-label small text-muted mb-1">템플릿 명칭</label>
                <input v-model="editForm.templateName" type="text" class="form-control form-control-sm" />
              </div>
              <div class="col-md-3">
                <label class="form-label small text-muted mb-1">엔진 타입</label>
                <select v-model="editForm.engineType" class="form-select form-select-sm">
                  <option value="VELOCITY">Velocity (.vm)</option>
                  <option value="THYMELEAF">Thymeleaf</option>
                  <option value="PLAIN">Plain HTML</option>
                </select>
              </div>
              <div class="col-md-2">
                <label class="form-label small text-muted mb-1">상태</label>
                <select v-model="editForm.statusCode" class="form-select form-select-sm">
                  <option value="ACTIVE">사용중</option>
                  <option value="DRAFT">작성중</option>
                  <option value="REVIEW">검토중</option>
                  <option value="ARCHIVED">보관</option>
                </select>
              </div>
              <div class="col-md-2">
                <button class="btn btn-dark btn-sm w-100" @click="showMetaEdit = false">적용 완료</button>
              </div>
            </div>
          </div>
        </header>

        <!-- 3대 탭 네비게이션 -->
        <div class="main-tabs">
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'preview' }"
            @click="activeTab = 'preview'"
          >
            <i class="bi bi-eye me-1.5"></i>실시간 미리보기 & 테스트
          </button>
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'editor' }"
            @click="activeTab = 'editor'"
          >
            <i class="bi bi-code-slash me-1.5"></i>템플릿 본문 편집
          </button>
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'dispatch' }"
            @click="activeTab = 'dispatch'"
          >
            <i class="bi bi-link-45deg me-1.5"></i>발송 연동 ({{ boundEvents.length }})
          </button>
        </div>

        <!-- 탭 내용 영역 -->
        <div class="main-content flex-grow-1 overflow-hidden">
          <!-- ================= TAB 1: 넓고 시원한 미리보기 ================= -->
          <div v-show="activeTab === 'preview'" class="preview-layout h-100">
            <!-- 미리보기 상단 컨트롤 바 -->
            <div class="preview-control-bar">
              <div class="btn-group btn-group-sm">
                <button
                  type="button"
                  class="btn btn-outline-secondary"
                  :class="{ active: deviceMode === 'desktop' }"
                  @click="deviceMode = 'desktop'"
                >
                  <i class="bi bi-laptop me-1"></i>데스크톱 (640px)
                </button>
                <button
                  type="button"
                  class="btn btn-outline-secondary"
                  :class="{ active: deviceMode === 'mobile' }"
                  @click="deviceMode = 'mobile'"
                >
                  <i class="bi bi-phone me-1"></i>모바일 (375px)
                </button>
                <button
                  type="button"
                  class="btn btn-outline-secondary"
                  :class="{ active: deviceMode === 'text' }"
                  @click="deviceMode = 'text'"
                >
                  Plain Text
                </button>
              </div>

              <!-- 변수 수정 토글 버튼 -->
              <button
                class="btn btn-outline-primary btn-sm px-3"
                :class="{ active: showVarInspector }"
                @click="showVarInspector = !showVarInspector"
              >
                <i class="bi bi-sliders me-1"></i>테스트 변수값 수정 ({{ selectedTemplate.variables?.length || 0 }})
              </button>
            </div>

            <!-- 변수값 입력 서브패널 (토글 시) -->
            <div v-if="showVarInspector" class="var-form-box p-3 bg-light border-bottom">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="small fw-bold text-secondary">
                  <i class="bi bi-braces me-1"></i>동적 치환 변수 샘플값 (값을 변경하면 즉시 미리보기에 반영됩니다)
                </span>
                <button class="btn btn-sm btn-link text-muted p-0" @click="showVarInspector = false">
                  <i class="bi bi-x-lg"></i>
                </button>
              </div>
              <div class="row g-2">
                <div
                  v-for="v in selectedTemplate.variables"
                  :key="v.varName"
                  class="col-md-3 col-sm-6"
                >
                  <div class="input-group input-group-sm">
                    <span class="input-group-text bg-white small font-monospace">${{ v.varName }}</span>
                    <input
                      v-model="mockValues[v.varName]"
                      type="text"
                      class="form-control font-monospace"
                      :placeholder="v.sampleValue || ''"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- 이메일 렌더링 뷰포트 (중앙에 넉넉한 여백과 함께 널찍하게 배치) -->
            <div class="preview-stage-wrap custom-scrollbar">
              <div v-if="deviceMode === 'text'" class="text-preview-box p-4 bg-white border rounded shadow-sm">
                <pre class="m-0 text-dark font-monospace">{{ renderedText || '(텍스트 본문이 없습니다)' }}</pre>
              </div>
              <div
                v-else
                class="email-frame-card shadow-sm border rounded bg-white"
                :style="{ width: deviceMode === 'mobile' ? '375px' : '640px', maxWidth: '100%' }"
              >
                <!-- 메일 클라이언트 윈도우 바 -->
                <div class="email-meta-bar p-3 border-bottom bg-light">
                  <div class="d-flex justify-content-between text-muted small mb-1">
                    <span><strong>To:</strong> {{ mockValues['userName'] || '고객' }} &lt;user@company.com&gt;</span>
                    <span>2026-08-20 14:00</span>
                  </div>
                  <div><strong>From:</strong> NexHub 알림센터 &lt;no-reply@nexhub.com&gt;</div>
                  <div class="fw-bold text-dark fs-6 mt-1 text-truncate">
                    <strong>Subject:</strong> {{ renderedSubject }}
                  </div>
                </div>

                <!-- 메일 본문 iframe -->
                <iframe
                  class="email-body-iframe"
                  :srcdoc="previewSrcDoc"
                  sandbox=""
                  title="메일 본문"
                ></iframe>
              </div>
            </div>
          </div>

          <!-- ================= TAB 2: 본문 편집 ================= -->
          <div v-show="activeTab === 'editor'" class="editor-layout h-100 p-2.5 custom-scrollbar d-flex flex-column">
            <!-- 제목 편집 -->
            <div class="mb-2">
              <label class="form-label small fw-bold text-secondary mb-1">
                메일 제목 <small class="text-muted fw-normal">(동적 변수 <code>${var}</code> 사용 가능)</small>
              </label>
              <input
                v-model="editForm.subject"
                type="text"
                class="form-control form-control-sm font-monospace"
                placeholder="메일 제목을 입력하세요..."
              />
            </div>

            <!-- 변수 칩 목록 (시원한 여백 & 정갈한 태그 뱃지) -->
            <div class="mb-2 p-2 bg-light border rounded">
              <div class="d-flex justify-content-between align-items-center mb-1.5">
                <span class="small fw-bold text-secondary d-flex align-items-center">
                  <i class="bi bi-tag-fill me-1.5 text-primary"></i>동적 변수 태그 <small class="text-muted ms-1.5">(클릭 시 본문 커서 위치에 자동 삽입)</small>
                </span>
                <button type="button" class="btn btn-outline-secondary btn-sm py-0.5 px-2.5 small" @click="addNewVariable">
                  <i class="bi bi-plus-lg me-1"></i>변수 추가
                </button>
              </div>
              <div class="d-flex flex-wrap gap-2">
                <button
                  v-for="v in selectedTemplate.variables"
                  :key="v.varName"
                  type="button"
                  class="btn btn-outline-primary btn-sm var-chip font-monospace"
                  :title="`${v.description || ''} (샘플: ${v.sampleValue || ''})`"
                  @click="insertVariable(v.varName)"
                >
                  <i class="bi bi-code me-1 opacity-75"></i>${{ v.varName }}
                </button>
              </div>
            </div>

            <!-- 본문 코드 에디터 -->
            <div class="editor-box-wrap flex-grow-1 d-flex flex-column">
              <div class="d-flex justify-content-between align-items-center mb-1">
                <label class="form-label small fw-bold text-secondary mb-0">
                  HTML 본문 소스 <small class="text-muted fw-normal">({{ editForm.engineType }} 문법 지원 · DB CLOB 저장)</small>
                </label>
                <span class="small text-muted">{{ editForm.bodyHtml.length.toLocaleString() }}자</span>
              </div>
              <textarea
                ref="htmlEditorRef"
                v-model="editForm.bodyHtml"
                class="form-control form-control-sm code-box flex-grow-1"
                style="min-height: 140px; resize: vertical;"
                spellcheck="false"
              ></textarea>
            </div>
          </div>

          <!-- ================= TAB 3: 발송 연동 매핑 ================= -->
          <div v-show="activeTab === 'dispatch'" class="dispatch-layout h-100 p-4 custom-scrollbar">
            <div class="alert alert-info py-2 px-3 small mb-3">
              <i class="bi bi-info-circle-fill me-1.5"></i>
              현재 템플릿(<strong>{{ selectedTemplate.templateName }}</strong>)으로 발송되도록 연결된 시스템 이벤트 목록입니다.
            </div>

            <div class="table-responsive border rounded bg-white">
              <table class="table table-hover align-middle mb-0 small">
                <thead class="table-light">
                  <tr>
                    <th style="width: 150px;">이벤트 코드</th>
                    <th>이벤트 명칭 & 설명</th>
                    <th style="width: 110px;">모듈</th>
                    <th style="width: 100px;">연동 상태</th>
                    <th style="width: 120px;" class="text-center">즉시 테스트</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="evt in boundEvents" :key="evt.eventId">
                    <td><code class="fw-bold">{{ evt.eventCode }}</code></td>
                    <td>
                      <div class="fw-bold">{{ evt.eventName }}</div>
                      <div class="text-muted small">{{ evt.description }}</div>
                    </td>
                    <td><span class="badge bg-light text-dark border">{{ getModuleName(evt.moduleCode) }}</span></td>
                    <td><span class="badge bg-success-subtle text-success">정상 연동</span></td>
                    <td class="text-center">
                      <button class="btn btn-outline-primary btn-sm py-0.5 px-2 small" @click="testEvent(evt)">
                        <i class="bi bi-play-fill me-1"></i>테스트
                      </button>
                    </td>
                  </tr>
                  <tr v-if="boundEvents.length === 0">
                    <td colspan="5" class="text-center py-5 text-muted">
                      연결된 이벤트가 없습니다.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- 본문 편집 탭일 때 항상 화면 하단에 고정되는 액션 푸터 (절대 잘리지 않음) -->
        <footer v-if="activeTab === 'editor'" class="main-card-footer p-2.5 px-3 bg-light border-top d-flex justify-content-between align-items-center">
          <span class="small text-muted">
            <i class="bi bi-shield-check me-1 text-success"></i>저장 시 새 버전으로 안전하게 보존됩니다.
          </span>
          <div class="d-flex gap-2">
            <button class="btn btn-outline-secondary btn-sm px-3" @click="resetEditor">되돌리기</button>
            <button class="btn btn-primary btn-sm px-4 shadow-sm" @click="saveTemplate">
              <i class="bi bi-floppy me-1"></i>저장하기
            </button>
          </div>
        </footer>
      </main>
    </div>

    <!-- ================= MODAL: 테스트 발송 팝업 ================= -->
    <div v-if="showTestModal" class="modal-backdrop fade show"></div>
    <div v-if="showTestModal" class="modal fade show d-block" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border shadow">
          <div class="modal-header py-2.5 px-3 bg-light border-bottom">
            <h6 class="modal-title fw-bold mb-0">테스트 메일 발송</h6>
            <button type="button" class="btn-close" @click="showTestModal = false"></button>
          </div>
          <div class="modal-body p-3">
            <div class="mb-3">
              <label class="form-label small text-muted mb-1">수신자 이메일</label>
              <input v-model="testEmail" type="email" class="form-control form-control-sm" placeholder="user@example.com" />
            </div>
            <div>
              <label class="form-label small text-muted mb-1">발송 제목</label>
              <div class="p-2 bg-light border rounded small fw-bold">{{ renderedSubject }}</div>
            </div>
          </div>
          <div class="modal-footer py-2 px-3 bg-light border-top">
            <button type="button" class="btn btn-outline-secondary btn-sm" @click="showTestModal = false">취소</button>
            <button type="button" class="btn btn-primary btn-sm px-3" @click="sendTestMail">발송</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, watch, nextTick } from 'vue'
import {
  mailCategories,
  mailTemplates,
  mailEvents,
  mailEventTemplates,
  mailModules,
  templateStatuses,
  mailLayouts
} from '../../data/mailTemplateMock'
import {
  renderTemplate,
  composeMailHtml,
  wrapPreviewDocument,
  castSampleValue
} from '../../utils/mailTemplateRender'

// 상태 관리
const searchQuery = ref('')
const selectedTemplateId = ref(1)
const activeTab = ref('preview')
const deviceMode = ref('desktop')
const showVarInspector = ref(false)
const showMetaEdit = ref(false)
const showTestModal = ref(false)
const testEmail = ref('admin@nexhub.co.kr')
const htmlEditorRef = ref(null)

// 데이터
const templates = ref([...mailTemplates])
const events = ref([...mailEvents])
const eventTemplates = ref([...mailEventTemplates])

// 현재 선택된 템플릿
const selectedTemplate = computed(() => {
  return templates.value.find(t => t.templateId === selectedTemplateId.value) || templates.value[0]
})

const currentVersion = computed(() => {
  if (!selectedTemplate.value) return null
  return selectedTemplate.value.versions?.find(v => v.versionId === selectedTemplate.value.currentVersionId) ||
         selectedTemplate.value.versions?.[0]
})

// 편집 폼
const editForm = reactive({
  templateName: '',
  engineType: 'VELOCITY',
  statusCode: 'ACTIVE',
  subject: '',
  bodyHtml: '',
  bodyText: '',
})

// 동적 Mock 변수값
const mockValues = reactive({})

// 템플릿 변경 감지
watch(selectedTemplate, (tpl) => {
  if (!tpl) return
  editForm.templateName = tpl.templateName
  editForm.engineType = tpl.engineType
  editForm.statusCode = tpl.statusCode

  const ver = currentVersion.value
  if (ver) {
    editForm.subject = ver.subject
    editForm.bodyHtml = ver.bodyHtml
    editForm.bodyText = ver.bodyText || ''
  }

  // 변수 샘플값 채우기
  Object.keys(mockValues).forEach(k => delete mockValues[k])
  if (tpl.variables) {
    tpl.variables.forEach(v => {
      mockValues[v.varName] = v.sampleValue || ''
    })
  }
}, { immediate: true })

// 실시간 활성 모델 파싱
const activeModel = computed(() => {
  const model = {}
  if (selectedTemplate.value?.variables) {
    selectedTemplate.value.variables.forEach(v => {
      const rawVal = mockValues[v.varName] !== undefined ? mockValues[v.varName] : v.sampleValue
      model[v.varName] = castSampleValue(rawVal, v.dataType)
    })
  }
  return model
})

const selectedLayout = computed(() => {
  if (!selectedTemplate.value?.layoutId) return mailLayouts[0]
  return mailLayouts.find(l => l.layoutId === selectedTemplate.value.layoutId) || mailLayouts[0]
})

// 실시간 렌더링 결과
const renderedSubject = computed(() => {
  if (!editForm.subject) return ''
  try {
    return renderTemplate(editForm.subject, activeModel.value, editForm.engineType)
  } catch (err) {
    return editForm.subject
  }
})

const renderedBodyHtml = computed(() => {
  if (!editForm.bodyHtml) return ''
  try {
    return renderTemplate(editForm.bodyHtml, activeModel.value, editForm.engineType)
  } catch (err) {
    return `<div style="color:red;padding:16px;">렌더링 에러: ${err.message}</div>`
  }
})

const renderedText = computed(() => {
  if (!editForm.bodyText) return ''
  try {
    return renderTemplate(editForm.bodyText, activeModel.value, editForm.engineType)
  } catch (err) {
    return editForm.bodyText
  }
})

const previewSrcDoc = computed(() => {
  const fullHtml = composeMailHtml(selectedLayout.value, renderedBodyHtml.value, activeModel.value, editForm.engineType)
  const width = deviceMode.value === 'mobile' ? 375 : 600
  return wrapPreviewDocument(fullHtml, width)
})

// 필터링된 템플릿
const filteredTemplates = computed(() => {
  return templates.value.filter(t => {
    const q = searchQuery.value.trim().toLowerCase()
    const matchQ = !q ||
      t.templateName.toLowerCase().includes(q) ||
      t.templateCode.toLowerCase().includes(q)
    return matchQ
  })
})

// 연동된 이벤트 목록
const boundEvents = computed(() => {
  if (!selectedTemplate.value) return []
  const links = eventTemplates.value.filter(et => et.templateId === selectedTemplate.value.templateId)
  return events.value.filter(e => links.some(l => l.eventId === e.eventId))
})

function selectTemplate(id) {
  selectedTemplateId.value = id
}

function getStatusLabel(code) {
  const s = templateStatuses.find(item => item.code === code)
  return s ? s.name : code
}

function getStatusBadgeClass(code) {
  if (code === 'ACTIVE') return 'bg-success-subtle text-success'
  if (code === 'REVIEW') return 'bg-warning-subtle text-warning'
  if (code === 'DRAFT') return 'bg-secondary-subtle text-secondary'
  return 'bg-light text-muted border'
}

function getModuleName(modCode) {
  const m = mailModules.find(item => item.code === modCode)
  return m ? m.name : modCode
}

// 템플릿 변수 삽입
function insertVariable(varName) {
  const token = `\${${varName}}`
  const textarea = htmlEditorRef.value
  if (!textarea) {
    editForm.bodyHtml += ` ${token} `
    return
  }

  const start = textarea.selectionStart || 0
  const end = textarea.selectionEnd || 0
  const text = editForm.bodyHtml
  editForm.bodyHtml = text.substring(0, start) + token + text.substring(end)
  nextTick(() => {
    textarea.focus()
    textarea.setSelectionRange(start + token.length, start + token.length)
  })
}

function addNewVariable() {
  const name = prompt('추가할 변수명을 입력하세요 (예: orderDate):')
  if (name && selectedTemplate.value) {
    if (!selectedTemplate.value.variables) selectedTemplate.value.variables = []
    selectedTemplate.value.variables.push({
      varName: name,
      dataType: 'STRING',
      requiredYn: 'N',
      sampleValue: '샘플값',
      description: '사용자 정의 변수'
    })
    mockValues[name] = '샘플값'
  }
}

function resetEditor() {
  const ver = currentVersion.value
  if (ver) {
    editForm.subject = ver.subject
    editForm.bodyHtml = ver.bodyHtml
    editForm.bodyText = ver.bodyText || ''
  }
}

function saveTemplate() {
  if (selectedTemplate.value) {
    selectedTemplate.value.templateName = editForm.templateName
    selectedTemplate.value.engineType = editForm.engineType
    selectedTemplate.value.statusCode = editForm.statusCode

    const ver = currentVersion.value
    if (ver) {
      ver.subject = editForm.subject
      ver.bodyHtml = editForm.bodyHtml
      ver.bodyText = editForm.bodyText
    }
    alert('템플릿이 성공적으로 저장되었습니다.')
  }
}

function openNewTemplateModal() {
  const name = prompt('템플릿 명칭을 입력하세요:', '신규 공지 메일')
  if (!name) return

  const newId = Date.now()
  const code = 'NOTICE_' + newId.toString().slice(-4)
  const newTpl = {
    templateId: newId,
    templateCode: code,
    templateName: name,
    categoryCode: 'NOTICE',
    engineType: 'VELOCITY',
    localeCode: 'ko_KR',
    statusCode: 'DRAFT',
    currentVersionId: newId * 10,
    versions: [
      {
        versionId: newId * 10,
        versionNo: '1.0',
        subject: `[NexHub] ${name}`,
        bodyHtml: '<h2 style="font-size:18px;">공지 안내</h2><p>안녕하세요, <strong>${userName}</strong>님.</p><p>내용을 입력하세요.</p>',
        bodyText: `안녕하세요 \${userName}님. ${name} 안내입니다.`,
      }
    ],
    variables: [
      { varName: 'userName', dataType: 'STRING', requiredYn: 'Y', sampleValue: '홍길동', description: '수신자명' }
    ]
  }
  templates.value.unshift(newTpl)
  selectedTemplateId.value = newId
}

function openTestSendModal() {
  showTestModal.value = true
}

function sendTestMail() {
  showTestModal.value = false
  alert(`[테스트 발송 완료]\n수신자: ${testEmail.value}\n제목: ${renderedSubject.value}`)
}

function testEvent(evt) {
  activeTab.value = 'preview'
  alert(`'${evt.eventName}' 이벤트 테스트 데이터로 전환되었습니다.`)
}
</script>

<style scoped>
.mail-clean-studio {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.studio-layout {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 16px;
  height: calc(100vh - 145px);
  min-height: 560px;
}

/* ================= 1. 좌측 사이드바 ================= */
.sidebar-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
}

.sidebar-top {
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
}

.sidebar-title {
  font-size: var(--b2b-font-size-h2);
  font-weight: 600;
  color: var(--text-primary);
}

.search-wrap {
  position: relative;
}

.search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  font-size: var(--b2b-font-size-sm);
}

.search-input {
  padding-left: 28px;
  background: var(--bg-main);
  border-color: var(--border-color);
  font-size: var(--b2b-font-size-sm);
}

.sidebar-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.template-row {
  padding: 11px 14px;
  border-radius: 6px;
  cursor: pointer;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  transition: all 0.15s ease-in-out;
}

.template-row:hover {
  background: var(--bg-subcard);
  border-color: var(--b2b-color-border);
}

.template-row.active {
  background: var(--b2b-color-primary-subtle);
  border-color: var(--b2b-color-primary) !important;
  box-shadow: 0 1px 3px rgba(37, 99, 235, 0.08);
}

.template-name {
  font-size: var(--b2b-font-size-body);
  font-weight: 600;
  color: var(--text-primary);
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #94a3b8;
  display: inline-block;
}

.status-dot.active { background: #16a34a; }
.status-dot.review { background: #d97706; }
.status-dot.draft { background: #64748b; }

.empty-state {
  text-align: center;
  padding: 30px 10px;
  color: var(--text-muted);
  font-size: var(--b2b-font-size-sm);
}

/* ================= 2. 우측 메인 영역 ================= */
.main-card {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 150px);
  max-height: calc(100vh - 150px);
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
}

.main-content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.main-card-footer {
  flex-shrink: 0;
}

.main-header {
  padding: 16px 24px;
  border-bottom: 1px solid var(--border-color);
}

.template-heading {
  font-size: var(--b2b-font-size-h2);
  font-weight: 600;
  color: var(--text-primary);
}

.main-tabs {
  display: flex;
  gap: 4px;
  padding: 0 24px;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-card);
}

.tab-btn {
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  padding: 12px 16px;
  font-size: var(--b2b-font-size-body);
  font-weight: 600;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
}

.tab-btn:hover {
  color: var(--text-primary);
}

.tab-btn.active {
  color: var(--b2b-color-primary);
  border-bottom-color: var(--b2b-color-primary);
}

/* ================= 3. 미리보기 화면 ================= */
.preview-layout {
  display: flex;
  flex-direction: column;
}

.preview-control-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-subcard);
}

.preview-stage-wrap {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  justify-content: center;
  background: var(--bg-main);
}

.email-frame-card {
  display: flex;
  flex-direction: column;
  height: 520px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
}

.email-meta-bar {
  font-family: var(--b2b-font-family);
}

.email-body-iframe {
  flex: 1;
  border: none;
  background: var(--b2b-color-bg-card);
}

.text-preview-box {
  width: 620px;
  height: 500px;
  overflow-y: auto;
}

/* ================= 4. 본문 편집기 ================= */
.editor-layout {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.var-chip {
  padding: 4px 10px;
  font-size: var(--b2b-font-size-sm);
  border-radius: 6px;
  background-color: var(--b2b-color-primary-subtle);
  border-color: #bfdbfe;
  color: var(--b2b-color-primary);
  font-weight: 500;
  transition: all 0.15s ease;
}

.var-chip:hover {
  background-color: var(--b2b-color-primary);
  border-color: var(--b2b-color-primary);
  color: #ffffff;
  transform: translateY(-1px);
}

.editor-box-wrap {
  min-height: 220px;
}

.code-box {
  font-family: var(--b2b-font-family-mono);
  font-size: var(--b2b-font-size-sm);
  line-height: 1.6;
  background: var(--bg-card);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  min-height: 200px;
}

.editor-bottom-bar {
  background: var(--bg-card);
}

.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 3px;
}
</style>
