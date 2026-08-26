<template>
  <div class="b2b-page-container mail-page">

    <!-- Toolbar -->
    <div class="b2b-toolbar mb-3">
      <div class="d-flex align-items-center gap-2">
        <select v-model="sendTypeFilter" class="form-select form-select-sm filter-select sm">
          <option value="ALL">전체 유형</option>
          <option value="REAL">실발송</option>
          <option value="TEST">테스트</option>
        </select>
        <select v-model="statusFilter" class="form-select form-select-sm filter-select sm">
          <option value="ALL">전체 상태</option>
          <option v-for="status in sendStatuses" :key="status.code" :value="status.code">{{ status.name }}</option>
        </select>
        <select v-model="templateFilter" class="form-select form-select-sm filter-select">
          <option value="ALL">전체 템플릿</option>
          <option v-for="template in mailTemplates" :key="template.templateId" :value="template.templateId">
            {{ template.templateName }}
          </option>
        </select>
        <input v-model="keyword" type="text" class="form-control form-control-sm search-input" placeholder="수신자 · 제목 검색" />
      </div>
      <div class="d-flex align-items-center gap-3 ms-auto stat-row">
        <span>전체 <strong>{{ summary.total }}</strong></span>
        <span>완료 <strong class="text-success">{{ summary.sent }}</strong></span>
        <span>실패 <strong :class="summary.failed ? 'text-danger' : ''">{{ summary.failed }}</strong></span>
        <span>대기 <strong>{{ summary.queued }}</strong></span>
        <span class="border-start ps-3">열람률 <strong>{{ summary.openRate }}%</strong></span>
      </div>
    </div>

    <div class="content-split">
      <!-- 목록 -->
      <div class="left-panel">
        <div class="table-scroll">
          <table class="b2b-table compact-table">
            <thead>
              <tr>
                <th style="width: 62px">유형</th>
                <th style="width: 86px">상태</th>
                <th style="width: 190px">수신자</th>
                <th>제목</th>
                <th style="width: 170px">템플릿</th>
                <th style="width: 130px">요청일시</th>
                <th style="width: 48px" class="text-center">열람</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="log in filteredLogs"
                :key="log.logId"
                class="data-row"
                :class="{ selected: selectedLog?.logId === log.logId }"
                @click="selectedLog = log"
              >
                <td>{{ log.sendType === 'TEST' ? '테스트' : '실발송' }}</td>
                <td>
                  <span class="b2b-badge" :class="statusBadge(log.statusCode)">{{ statusName(log.statusCode) }}</span>
                </td>
                <td>
                  <div class="fw-semibold text-truncate">{{ log.toName }}</div>
                  <div class="text-muted text-truncate">{{ log.toEmail }}</div>
                </td>
                <td class="text-truncate">{{ log.subjectSnap }}</td>
                <td class="text-truncate" :title="log.templateCode">{{ log.templateName }} v{{ log.versionNo }}</td>
                <td class="text-muted">{{ log.reqDt }}</td>
                <td class="text-center">
                  <i v-if="log.openDt" class="bi bi-envelope-open text-success" :title="log.openDt"></i>
                  <span v-else class="text-muted">-</span>
                </td>
              </tr>
              <tr v-if="filteredLogs.length === 0">
                <td colspan="7" class="text-center text-muted py-4">조건에 맞는 이력이 없습니다.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 상세 -->
      <div v-if="selectedLog" class="right-panel">
        <div class="panel-header d-flex align-items-center">
          <span class="fw-bold">발송 상세</span>
          <span class="b2b-badge ms-2" :class="statusBadge(selectedLog.statusCode)">
            {{ statusName(selectedLog.statusCode) }}
          </span>
          <button class="btn-b2b-icon btn-b2b-action ms-auto" @click="selectedLog = null">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>

        <div class="detail-scroll">
          <div class="fw-bold mb-2">{{ selectedLog.subjectSnap }}</div>

          <table class="b2b-table detail-table mb-3">
            <tbody>
              <tr>
                <th>수신자</th>
                <td>{{ selectedLog.toName }} ({{ selectedLog.toEmail }})</td>
              </tr>
              <tr>
                <th>발신자</th>
                <td>{{ selectedLog.fromEmail }}</td>
              </tr>
              <tr>
                <th>발송 이벤트</th>
                <td class="font-monospace">{{ selectedLog.eventCode || '테스트 발송' }}</td>
              </tr>
              <tr>
                <th>템플릿</th>
                <td :title="selectedLog.templateCode">{{ selectedLog.templateName }} v{{ selectedLog.versionNo }}</td>
              </tr>
              <tr>
                <th>요청 / 발송</th>
                <td>{{ selectedLog.reqDt }} → {{ selectedLog.sentDt || '미발송' }}</td>
              </tr>
              <tr>
                <th>열람 / 재시도</th>
                <td>{{ selectedLog.openDt || '-' }} / {{ selectedLog.retryCnt }}회</td>
              </tr>
            </tbody>
          </table>

          <div v-if="selectedLog.errorMessage" class="error-box mb-3">
            <div class="fw-bold text-danger mb-1">{{ selectedLog.errorCode }}</div>
            <div class="small">{{ selectedLog.errorMessage }}</div>
          </div>

          <div class="panel-header fw-bold px-0 mb-2">치환 데이터</div>
          <pre class="json-box">{{ prettyJson(selectedLog.mergeDataJson) }}</pre>

          <div class="panel-header fw-bold px-0 mb-2 mt-3">발송 본문</div>
          <iframe class="repro-frame" sandbox="" :srcdoc="reproducedDocument" title="발송 본문"></iframe>

          <div class="text-end mt-2">
            <button class="btn-b2b-action" :disabled="!isResendable" @click="resend">
              <i class="bi bi-arrow-repeat me-1"></i>재발송
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { showToast } from '@/utils/toastUtil'
import { mailLayouts, mailSendLogs, mailTemplates, sendStatuses } from '@/data/mailTemplateMock'
import { composeMailHtml, renderTemplate, wrapPreviewDocument } from '@/utils/mailTemplateRender'

const sendTypeFilter = ref('ALL')
const statusFilter = ref('ALL')
const templateFilter = ref('ALL')
const keyword = ref('')
const selectedLog = ref(null)

const filteredLogs = computed(() => {
  const text = keyword.value.trim().toLowerCase()
  return mailSendLogs.filter((log) => {
    if (sendTypeFilter.value !== 'ALL' && log.sendType !== sendTypeFilter.value) return false
    if (statusFilter.value !== 'ALL' && log.statusCode !== statusFilter.value) return false
    if (templateFilter.value !== 'ALL' && log.templateId !== Number(templateFilter.value)) return false
    if (!text) return true
    return [log.toEmail, log.toName, log.subjectSnap, log.templateCode]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(text)
  })
})

const summary = computed(() => {
  const list = filteredLogs.value
  const sent = list.filter((log) => log.statusCode === 'SENT').length
  const opened = list.filter((log) => log.openDt).length
  return {
    total: list.length,
    sent,
    failed: list.filter((log) => log.statusCode === 'FAILED' || log.statusCode === 'BOUNCED').length,
    queued: list.filter((log) => log.statusCode === 'QUEUED' || log.statusCode === 'SENDING').length,
    openRate: sent ? ((opened / sent) * 100).toFixed(1) : '0.0',
  }
})

const isResendable = computed(
  () => selectedLog.value?.statusCode === 'FAILED' || selectedLog.value?.statusCode === 'BOUNCED'
)

/** 로그의 VERSION_ID + MERGE_DATA_JSON 으로 발송 당시 본문을 재현 */
const reproducedDocument = computed(() => {
  const log = selectedLog.value
  if (!log) return ''
  const template = mailTemplates.find((item) => item.templateId === log.templateId)
  const version = template?.versions.find((item) => item.versionId === log.versionId)
  if (!version) return wrapPreviewDocument('<p style="padding:16px;">원문을 찾을 수 없습니다.</p>')

  const layout = mailLayouts.find((item) => item.layoutId === template.layoutId) || null
  const model = safeParse(log.mergeDataJson)
  const body = renderTemplate(version.bodyHtml, model, version.engineType, { keepMissing: true })
  return wrapPreviewDocument(composeMailHtml(layout, body, model, version.engineType), layout?.bodyWidth || 600)
})

function statusName(code) {
  return sendStatuses.find((status) => status.code === code)?.name || code
}

function statusBadge(code) {
  return sendStatuses.find((status) => status.code === code)?.badge || 'b2b-badge-outline'
}

function safeParse(json) {
  try {
    return JSON.parse(json)
  } catch {
    return {}
  }
}

function prettyJson(json) {
  try {
    return JSON.stringify(JSON.parse(json), null, 2)
  } catch {
    return json
  }
}

function resend() {
  showToast(`${selectedLog.value.toEmail} 로 재발송 요청했습니다.`, { type: 'success' })
}
</script>

<style scoped>
/* 헤더(48) + 탭바(38) + 전역 PageHeader(50) + 워크스페이스 패딩(32) 제외 */
.mail-page { height: calc(100vh - 168px); min-height: 520px; }
.content-split { display: flex; flex: 1; gap: 16px; overflow: hidden; }

.left-panel {
  flex: 1;
  min-width: 0;
  background: var(--b2b-color-bg-card);
  border: 1px solid var(--b2b-color-border);
  border-radius: var(--b2b-radius-md);
  overflow: hidden;
}
.right-panel {
  width: 400px;
  flex: 0 0 400px;
  display: flex;
  flex-direction: column;
  background: var(--b2b-color-bg-card);
  border: 1px solid var(--b2b-color-border);
  border-radius: var(--b2b-radius-md);
  overflow: hidden;
}
.panel-header {
  padding: 8px 12px;
  border-bottom: 1px solid var(--b2b-color-border);
  background-color: var(--b2b-color-bg-body);
  color: var(--b2b-color-text-main);
  font-size: var(--b2b-font-size-body);
}
.panel-header.px-0 {
  background: none;
  border-bottom: 1px solid var(--b2b-color-border);
  padding: 0 0 4px;
}

.search-input { width: 190px; }
.filter-select { width: 160px; }
.filter-select.sm { width: 110px; }
.stat-row { font-size: 12px; color: var(--b2b-color-text-muted); white-space: nowrap; }
.stat-row strong { color: var(--b2b-color-text-main); }

.table-scroll { height: 100%; overflow: auto; }
.detail-scroll { flex: 1; min-height: 0; overflow-y: auto; padding: 12px; }

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

.data-row { cursor: pointer; }
.data-row:hover td { background: var(--b2b-color-hover-bg); }
.data-row.selected td { background: var(--b2b-color-primary-subtle); }

.detail-table th {
  width: 92px;
  background: var(--b2b-color-bg-body);
  font-weight: 600;
  white-space: nowrap;
}
.detail-table td { word-break: break-all; }

.error-box {
  padding: 8px 10px;
  background: var(--b2b-color-bg-body);
  border: 1px solid var(--b2b-color-danger);
  border-radius: var(--b2b-radius-sm);
}

.json-box {
  margin: 0;
  padding: 8px 10px;
  max-height: 170px;
  overflow: auto;
  font-size: 11px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
  color: var(--b2b-color-text-main);
  background: var(--b2b-color-bg-body);
  border: 1px solid var(--b2b-color-border);
  border-radius: var(--b2b-radius-sm);
}

.repro-frame {
  width: 100%;
  height: 320px;
  border: 1px solid var(--b2b-color-border);
  border-radius: var(--b2b-radius-sm);
  background: var(--b2b-color-bg-card);
}
</style>
