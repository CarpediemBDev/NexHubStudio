/**
 * 메일 템플릿 관리 목데이터 (B2B 업무 메일 기준)
 *
 * docs/ddl/mail_template_seed.sql 과 동일한 내용이다.
 * 백엔드 연동 시 이 파일 대신 /api/mail/* 응답을 사용하면 화면 코드는 그대로 동작한다.
 *
 * ─────────────────────────────────────────────────────────────────────────
 *  B2B 메일의 핵심은 "확인"이 아니라 "확인 + 즉시 처리"다.
 *  B2C 메일(주문확인·배송안내)은 읽고 끝나지만, B2B 메일은 받는 사람이
 *  결재를 올리고, 의뢰를 접수하고, 설비 이상을 조치해야 한다.
 *
 *  따라서 모든 업무 메일은 아래 3단 구성을 따른다:
 *    1) 무슨 일인지 한 줄        — 제목 + 첫 문단
 *    2) 판단에 필요한 요약 정보  — 표 (문서번호/설비/기한/요청자)
 *    3) 바로 처리하는 CTA 버튼   — 시스템 해당 화면으로 딥링크
 *
 *  딥링크 규칙: ${baseUrl}/{화면경로}/{식별자}?from=mail
 *    · 실제 라우터 경로를 그대로 쓴다 (/work-group/request-workflow 등)
 *    · from=mail 로 유입 경로를 남겨 메일 효과를 추적한다
 *    · 로그인 안 된 상태면 로그인 후 원래 URL 로 복귀시킨다(redirect 파라미터)
 * ─────────────────────────────────────────────────────────────────────────
 */

import { mailEquipmentTemplates } from './mailEquipmentTemplates.js'

const BASE_URL = 'https://nexhub.example.com'

/**
 * CTA 버튼 톤
 *   Outlook(Word 엔진)은 border-radius / box-shadow 를 무시하므로
 *   둥근 모서리는 VML(v:roundrect) 폴백으로만 재현된다.
 */
const CTA_TONES = {
  primary: { bg: '#2563eb', border: '#1d4ed8', text: '#ffffff' },
  danger: { bg: '#dc2626', border: '#b91c1c', text: '#ffffff' },
  success: { bg: '#16a34a', border: '#15803d', text: '#ffffff' },
  ghost: { bg: '#ffffff', border: '#cbd5e1', text: '#334155' },
}

/** VML 은 폭을 px 로 고정해야 한다. 한글 라벨 기준 대략치 */
function ctaWidth(label) {
  return Math.max(176, label.replace(/\s/g, '').length * 15 + 74)
}

/** 버튼 1개의 마크업 (VML 폴백 + 일반 클라이언트용 a 태그) */
function ctaButton(urlExpr, label, tone = 'primary') {
  const color = CTA_TONES[tone] || CTA_TONES.primary
  const width = ctaWidth(label)
  const arrow = tone === 'ghost' ? '' : ' &rarr;'
  return (
    `<!--[if mso]>` +
    `<v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" ` +
    `href="${urlExpr}" style="height:46px;v-text-anchor:middle;width:${width}px;" arcsize="13%" ` +
    `strokecolor="${color.border}" fillcolor="${color.bg}"><w:anchorlock/>` +
    `<center style="color:${color.text};font-family:'Malgun Gothic',sans-serif;font-size:14px;font-weight:bold;">` +
    `${label}</center></v:roundrect>` +
    `<![endif]-->` +
    `<!--[if !mso]><!-- -->` +
    `<a class="cta-btn" href="${urlExpr}" style="display:inline-block;box-sizing:border-box;` +
    `min-width:${width}px;padding:14px 26px;background:${color.bg};border:1px solid ${color.border};` +
    `border-radius:8px;color:${color.text};font-size:14px;font-weight:700;line-height:18px;` +
    `mso-line-height-rule:exactly;text-align:center;text-decoration:none;letter-spacing:-0.2px;">` +
    `${label}${arrow}</a>` +
    `<!--<![endif]-->`
  )
}

/**
 * CTA 영역. 보조 액션이 있으면 고스트 버튼으로 나란히 배치한다.
 *   주 액션 1개  → cta(url, label, tone)
 *   주 + 보조    → cta(url, label, tone, { url, label })
 */
function cta(urlExpr, label, tone = 'primary', secondary = null) {
  const primaryCell = `<td class="cta-cell" align="left">${ctaButton(urlExpr, label, tone)}</td>`
  if (!secondary) {
    return `<table class="cta-table" role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0;"><tr>${primaryCell}</tr></table>`
  }
  return (
    '<table class="cta-table" role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0;"><tr>' +
    primaryCell +
    '<td class="cta-gap" width="10" style="width:10px;font-size:0;line-height:0;">&nbsp;</td>' +
    `<td class="cta-cell" align="left">${ctaButton(secondary.url, secondary.label, 'ghost')}</td>` +
    '</tr></table>'
  )
}

/** 요약 정보 표 한 행 */
function row(label, valueExpr, strong = false) {
  return (
    `<tr><td width="110" style="color:#6c757d;padding:7px 10px;border-bottom:1px solid #e9ecef;">${label}</td>` +
    `<td style="padding:7px 10px;border-bottom:1px solid #e9ecef;${strong ? 'font-weight:700;' : ''}">${valueExpr}</td></tr>`
  )
}

function infoTable(rows) {
  return (
    '<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fa;font-size:13px;">' +
    rows.join('') +
    '</table>'
  )
}

function heading(text) {
  return `<h2 style="margin:0 0 14px;font-size:19px;color:#212529;">${text}</h2>`
}

/* ------------------------------------------------------------------ */
/* 코드성 데이터                                                        */
/* ------------------------------------------------------------------ */

export const mailCategories = [
  { code: 'APPROVAL', name: '결재', icon: 'bi-file-earmark-check' },
  { code: 'REQUEST', name: '업무의뢰', icon: 'bi-clipboard-check' },
  { code: 'EQUIPMENT', name: '설비', icon: 'bi-cpu' },
  { code: 'NOTICE', name: '공지', icon: 'bi-megaphone' },
  { code: 'ACCOUNT', name: '계정', icon: 'bi-person-badge' },
  { code: 'REPORT', name: '리포트', icon: 'bi-graph-up' },
]

export const templateStatuses = [
  { code: 'DRAFT', name: '작성중', badge: 'b2b-badge-secondary' },
  { code: 'REVIEW', name: '검토중', badge: 'b2b-badge-warning' },
  { code: 'ACTIVE', name: '사용중', badge: 'b2b-badge-success' },
  { code: 'ARCHIVED', name: '보관', badge: 'b2b-badge-outline' },
]

export const engineTypes = [
  { code: 'VELOCITY', name: 'Velocity (.vm)', hint: '반복/조건 지원. 레거시 .vm 자산 이관에 적합' },
  { code: 'THYMELEAF', name: 'Thymeleaf', hint: 'Spring Boot 3 공식 지원. 신규 구축 권장' },
  { code: 'PLAIN', name: 'Plain HTML', hint: '${var} 단순 치환만. 엔진 의존 없음' },
]

export const sendStatuses = [
  { code: 'QUEUED', name: '대기', badge: 'b2b-badge-secondary' },
  { code: 'SENDING', name: '발송중', badge: 'b2b-badge-primary' },
  { code: 'SENT', name: '발송완료', badge: 'b2b-badge-success' },
  { code: 'FAILED', name: '실패', badge: 'b2b-badge-danger' },
  { code: 'BOUNCED', name: '반송', badge: 'b2b-badge-danger' },
  { code: 'CANCELED', name: '취소', badge: 'b2b-badge-outline' },
]

export const mailModules = [
  { code: 'APPROVAL', name: '전자결재', icon: 'bi-file-earmark-check' },
  { code: 'REQUEST', name: '업무의뢰', icon: 'bi-clipboard-check' },
  { code: 'EQUIPMENT', name: '설비관리', icon: 'bi-cpu' },
  { code: 'NOTICE', name: '공지/알림', icon: 'bi-megaphone' },
  { code: 'ACCOUNT', name: '계정/권한', icon: 'bi-person-badge' },
  { code: 'BATCH', name: '배치/리포트', icon: 'bi-graph-up' },
]

/* ------------------------------------------------------------------ */
/* 공통 레이아웃 (MAIL_TEMPLATE_LAYOUT)                                 */
/* ------------------------------------------------------------------ */

export const mailLayouts = [
  {
    layoutId: 1,
    layoutCode: 'DEFAULT_KO',
    layoutName: '업무 메일 기본 레이아웃 (국문)',
    bodyWidth: 600,
    description: '전 템플릿 공통 헤더/푸터. CI 변경 시 이 행만 수정하면 전체에 반영된다.',
    baseCss:
      'body{margin:0;padding:0;} a{color:#2563eb;} table{border-collapse:collapse;} ' +
      // !important 는 여기서만 쓴다 — 미디어쿼리가 인라인 style 을 이기는 유일한 수단이라서.
      // 버튼 색상은 인라인에 있으므로 별도 !important 가 필요 없다.
      '@media only screen and (max-width:480px){' +
      '.cta-table{width:100% !important;}' +
      '.cta-cell{display:block !important;width:100% !important;}' +
      '.cta-gap{display:block !important;height:8px;width:100% !important;}' +
      '.cta-btn{display:block !important;width:100% !important;min-width:0 !important;}}',
    headerHtml:
      '<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:24px 0;">' +
      '<tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" ' +
      'style="background:#ffffff;border-radius:8px;overflow:hidden;font-family:\'Malgun Gothic\',\'Apple SD Gothic Neo\',sans-serif;">' +
      '<tr><td style="background:#1e293b;padding:16px 24px;">' +
      '<span style="color:#ffffff;font-size:17px;font-weight:700;letter-spacing:-0.3px;">NexHub</span>' +
      '<span style="color:#94a3b8;font-size:12px;margin-left:8px;">업무 알림</span></td></tr>' +
      '<tr><td style="padding:26px 24px;color:#212529;font-size:14px;line-height:1.7;">',
    footerHtml:
      '</td></tr><tr><td style="background:#f8f9fa;padding:16px 24px;color:#6c757d;font-size:12px;line-height:1.6;">' +
      '본 메일은 발신전용입니다. 시스템 문의는 IT지원팀(내선 1234)으로 연락 주십시오.<br/>' +
      '버튼이 동작하지 않으면 아래 주소를 브라우저에 붙여넣으세요.<br/>' +
      '<span style="color:#94a3b8;">${actionUrl}</span>' +
      '</td></tr></table></td></tr></table>',
  },
]

/* ------------------------------------------------------------------ */
/* 템플릿 (MAIL_TEMPLATE + VERSION + VAR)                               */
/* ------------------------------------------------------------------ */

export const mailTemplates = [
  /* ---------------- 결재 ---------------- */
  {
    templateId: 1,
    templateCode: 'APPROVAL_REQUEST_KO',
    templateName: '결재 요청 알림',
    categoryCode: 'APPROVAL',
    engineType: 'VELOCITY',
    localeCode: 'ko_KR',
    layoutId: 1,
    statusCode: 'ACTIVE',
    currentVersionId: 102,
    ownerDeptCode: 'D003',
    ownerUserId: 'lee',
    ownerUserName: '이영희',
    description: '결재선에 문서가 도착했을 때 결재자에게 발송. 메일에서 바로 결재 화면으로 이동',
    tags: '결재,승인,액션',
    regDt: '2026-03-11 11:00',
    updDt: '2026-06-21 09:12',
    versions: [
      {
        versionId: 101,
        versionNo: 1,
        statusCode: 'ARCHIVED',
        subject: '[결재요청] ${docTitle}',
        preheader: '결재 대기 문서가 있습니다',
        engineType: 'VELOCITY',
        changeNote: '최초 등록',
        regId: 'lee',
        regDt: '2026-03-11 11:00',
        approvedBy: 'admin',
        bodyHtml: heading('결재 요청') + '<p>${drafterName} 님이 결재를 요청했습니다.</p>',
        bodyText: '${drafterName} 님이 결재를 요청했습니다. ${actionUrl}',
      },
      {
        versionId: 102,
        versionNo: 2,
        statusCode: 'ACTIVE',
        subject: '[결재요청] ${docTitle}',
        preheader: '${drafterName}님이 결재를 요청했습니다 · ${dueDate}까지',
        engineType: 'VELOCITY',
        changeNote: '긴급도 표시 + 반려 바로가기 링크 추가',
        regId: 'lee',
        regDt: '2026-06-21 09:12',
        approvedBy: 'admin',
        bodyHtml:
          heading('결재 요청') +
          '<p><strong>${drafterName}</strong> 님이 결재를 요청했습니다.</p>' +
          infoTable([
            row('문서번호', '${docNo}'),
            row('제목', '${docTitle}', true),
            row('기안부서', '${draftDept}'),
            row('기안일', '${draftDate}'),
            row('처리기한', '${dueDate}'),
          ]) +
          '#if($urgency == "긴급")' +
          '<p style="margin-top:12px;color:#dc2626;font-weight:700;">⚠ 긴급 문서입니다. 당일 처리해 주세요.</p>' +
          '#end' +
          cta('${actionUrl}', '결재하러 가기', 'primary', { url: '${docViewUrl}', label: '문서 미리보기' }) +
          '<p style="font-size:12px;color:#94a3b8;margin:0;">' +
          '전체 대기 문서는 <a href="${listUrl}" style="color:#94a3b8;">결재함</a>에서 확인하세요.</p>',
        bodyText:
          '${drafterName} 님이 결재를 요청했습니다.\n' +
          '문서: ${docNo} ${docTitle}\n처리기한: ${dueDate}\n결재하기: ${actionUrl}',
      },
    ],
    variables: [
      { varName: 'drafterName', varPath: '${drafterName}', dataType: 'STRING', requiredYn: 'Y', sampleValue: '이영희', description: '기안자', sortOrder: 1 },
      { varName: 'docNo', varPath: '${docNo}', dataType: 'STRING', requiredYn: 'Y', sampleValue: 'DOC-2026-0912', description: '문서번호', sortOrder: 2 },
      { varName: 'docTitle', varPath: '${docTitle}', dataType: 'STRING', requiredYn: 'Y', sampleValue: '3분기 설비 구매 품의', description: '문서 제목', sortOrder: 3 },
      { varName: 'draftDept', varPath: '${draftDept}', dataType: 'STRING', requiredYn: 'N', sampleValue: 'R&D본부 플랫폼개발팀', description: '기안 부서', sortOrder: 4 },
      { varName: 'draftDate', varPath: '${draftDate}', dataType: 'DATE', requiredYn: 'Y', sampleValue: '2026-08-19', description: '기안일', sortOrder: 5 },
      { varName: 'dueDate', varPath: '${dueDate}', dataType: 'DATE', requiredYn: 'Y', sampleValue: '2026-08-21', description: '처리 기한', sortOrder: 6 },
      { varName: 'urgency', varPath: '${urgency}', dataType: 'STRING', requiredYn: 'N', sampleValue: '긴급', description: '긴급도 (#if 조건)', sortOrder: 7 },
      { varName: 'actionUrl', varPath: '${actionUrl}', dataType: 'URL', requiredYn: 'Y', sampleValue: `${BASE_URL}/work-group/request-workflow?docNo=DOC-2026-0912&from=mail`, description: 'CTA — 결재 처리 화면', sortOrder: 8 },
      { varName: 'docViewUrl', varPath: '${docViewUrl}', dataType: 'URL', requiredYn: 'N', sampleValue: `${BASE_URL}/work-group/request-workflow?docNo=DOC-2026-0912&mode=view&from=mail`, description: '문서 미리보기', sortOrder: 9 },
      { varName: 'listUrl', varPath: '${listUrl}', dataType: 'URL', requiredYn: 'N', sampleValue: `${BASE_URL}/work-group/request-workflow?tab=inbox&from=mail`, description: '결재함 목록', sortOrder: 10 },
    ],
  },

  {
    templateId: 2,
    templateCode: 'APPROVAL_RESULT_KO',
    templateName: '결재 결과 통보',
    categoryCode: 'APPROVAL',
    engineType: 'THYMELEAF',
    localeCode: 'ko_KR',
    layoutId: 1,
    statusCode: 'ACTIVE',
    currentVersionId: 201,
    ownerDeptCode: 'D003',
    ownerUserId: 'lee',
    ownerUserName: '이영희',
    description: '승인/반려 결과를 기안자에게 통보. 반려 시 재기안 화면으로 바로 이동',
    tags: '결재,결과,Thymeleaf',
    regDt: '2026-03-11 11:20',
    updDt: '2026-03-11 11:20',
    versions: [
      {
        versionId: 201,
        versionNo: 1,
        statusCode: 'ACTIVE',
        subject: '[결재${resultText}] ${docTitle}',
        preheader: '결재 결과를 확인하세요',
        engineType: 'THYMELEAF',
        changeNote: '최초 등록 (Thymeleaf 문법 예시)',
        regId: 'lee',
        regDt: '2026-03-11 11:20',
        approvedBy: 'admin',
        bodyHtml:
          '<h2 style="margin:0 0 14px;font-size:19px;">결재 <span th:text="${resultText}">승인</span></h2>' +
          '<p>기안하신 문서 <strong th:text="${docTitle}">문서제목</strong> 이(가) ' +
          '<span th:text="${resultText}">승인</span> 처리되었습니다.</p>' +
          '<p th:if="${comment}" style="background:#f8f9fa;padding:12px;border-left:3px solid #2563eb;">' +
          '결재 의견: <span th:text="${comment}"></span></p>' +
          cta('${actionUrl}', '문서 확인하기') +
          '<p style="font-size:12px;color:#6c757d;">반려된 문서는 위 화면에서 바로 수정 후 재기안할 수 있습니다.</p>',
        bodyText: '문서 ${docTitle} 이(가) ${resultText} 처리되었습니다. ${actionUrl}',
      },
    ],
    variables: [
      { varName: 'docTitle', varPath: '${docTitle}', dataType: 'STRING', requiredYn: 'Y', sampleValue: '3분기 설비 구매 품의', description: '문서 제목', sortOrder: 1 },
      { varName: 'resultText', varPath: '${resultText}', dataType: 'STRING', requiredYn: 'Y', sampleValue: '승인', description: '결재 결과 (승인/반려)', sortOrder: 2 },
      { varName: 'approverName', varPath: '${approverName}', dataType: 'STRING', requiredYn: 'N', sampleValue: '박부장', description: '결재자', sortOrder: 3 },
      { varName: 'comment', varPath: '${comment}', dataType: 'STRING', requiredYn: 'N', sampleValue: '예산 범위 내에서 진행 바랍니다.', description: '결재 의견', sortOrder: 4 },
      { varName: 'actionUrl', varPath: '${actionUrl}', dataType: 'URL', requiredYn: 'Y', sampleValue: `${BASE_URL}/work-group/request-workflow?docNo=DOC-2026-0912&from=mail`, description: 'CTA — 문서 화면', sortOrder: 5 },
    ],
  },

  /* ---------------- 업무 의뢰 ---------------- */
  {
    templateId: 3,
    templateCode: 'WORK_REQUEST_RECEIVED_KO',
    templateName: '업무 의뢰 접수 알림',
    categoryCode: 'REQUEST',
    engineType: 'VELOCITY',
    localeCode: 'ko_KR',
    layoutId: 1,
    statusCode: 'ACTIVE',
    currentVersionId: 301,
    ownerDeptCode: 'D002',
    ownerUserId: 'kim',
    ownerUserName: '김철수',
    description: '업무 의뢰가 등록되면 처리 부서 담당자에게 발송. 메일에서 바로 접수 처리',
    tags: '의뢰,접수,액션',
    regDt: '2026-02-02 10:05',
    updDt: '2026-08-01 16:40',
    versions: [
      {
        versionId: 301,
        versionNo: 2,
        statusCode: 'ACTIVE',
        subject: '[의뢰접수] ${requestNo} ${requestTitle}',
        preheader: '${requesterName}님이 업무를 의뢰했습니다',
        engineType: 'VELOCITY',
        changeNote: '첨부 파일 목록(#foreach) 및 접수 버튼 추가',
        regId: 'kim',
        regDt: '2026-08-01 16:40',
        approvedBy: 'admin',
        bodyHtml:
          heading('업무 의뢰가 접수되었습니다') +
          '<p><strong>${requesterName}</strong> 님이 업무를 의뢰했습니다. 내용 확인 후 접수 처리해 주세요.</p>' +
          infoTable([
            row('의뢰번호', '${requestNo}'),
            row('제목', '${requestTitle}', true),
            row('의뢰부서', '${requesterDept}'),
            row('요청유형', '${requestType}'),
            row('희망완료일', '${dueDate}'),
          ]) +
          '<p style="margin-top:14px;white-space:pre-line;">${requestContent}</p>' +
          '#if($attachments && $attachments.size() > 0)' +
          '<p style="margin-top:12px;font-weight:700;font-size:13px;">첨부 파일</p>' +
          '<ul style="margin:4px 0 0;padding-left:18px;font-size:13px;">' +
          '#foreach($file in $attachments)<li><a href="${file.url}">${file.name}</a></li>#end' +
          '</ul>' +
          '#end' +
          cta('${actionUrl}', '의뢰 접수 처리', 'primary', { url: '${listUrl}', label: '의뢰 목록' }) +
          '<p style="font-size:12px;color:#94a3b8;margin:0;">접수 후 담당자를 배정하면 의뢰자에게 자동으로 알림이 갑니다.</p>',
        bodyText:
          '${requesterName} 님의 업무 의뢰가 접수되었습니다.\n' +
          '${requestNo} ${requestTitle}\n희망완료일: ${dueDate}\n접수 처리: ${actionUrl}',
      },
    ],
    variables: [
      { varName: 'requesterName', varPath: '${requesterName}', dataType: 'STRING', requiredYn: 'Y', sampleValue: '정수진', description: '의뢰자', sortOrder: 1 },
      { varName: 'requesterDept', varPath: '${requesterDept}', dataType: 'STRING', requiredYn: 'N', sampleValue: '경영지원본부 총무팀', description: '의뢰 부서', sortOrder: 2 },
      { varName: 'requestNo', varPath: '${requestNo}', dataType: 'STRING', requiredYn: 'Y', sampleValue: 'REQ-2026-0451', description: '의뢰번호', sortOrder: 3 },
      { varName: 'requestTitle', varPath: '${requestTitle}', dataType: 'STRING', requiredYn: 'Y', sampleValue: '공정 모니터링 대시보드 지표 추가', description: '의뢰 제목', sortOrder: 4 },
      { varName: 'requestType', varPath: '${requestType}', dataType: 'STRING', requiredYn: 'N', sampleValue: '기능개선', description: '요청 유형', sortOrder: 5 },
      { varName: 'requestContent', varPath: '${requestContent}', dataType: 'STRING', requiredYn: 'Y', sampleValue: '설비별 가동률 지표를 대시보드 상단에 추가해 주세요. 기준은 일 단위입니다.', description: '의뢰 내용', sortOrder: 6 },
      { varName: 'dueDate', varPath: '${dueDate}', dataType: 'DATE', requiredYn: 'N', sampleValue: '2026-09-05', description: '희망 완료일', sortOrder: 7 },
      {
        varName: 'attachments',
        varPath: '${attachments[]}',
        dataType: 'LIST',
        requiredYn: 'N',
        sampleValue: `[{"name":"요구사항_정리.xlsx","url":"${BASE_URL}/work-group/files/8821"},{"name":"화면_예시.png","url":"${BASE_URL}/work-group/files/8822"}]`,
        description: '첨부 파일 목록 (#foreach 대상)',
        sortOrder: 8,
      },
      { varName: 'actionUrl', varPath: '${actionUrl}', dataType: 'URL', requiredYn: 'Y', sampleValue: `${BASE_URL}/work-group/request-workflow?requestNo=REQ-2026-0451&action=accept&from=mail`, description: 'CTA — 접수 처리 화면', sortOrder: 9 },
      { varName: 'listUrl', varPath: '${listUrl}', dataType: 'URL', requiredYn: 'N', sampleValue: `${BASE_URL}/work-group/request-workflow?tab=pending&from=mail`, description: '의뢰 목록', sortOrder: 10 },
    ],
  },

  {
    templateId: 4,
    templateCode: 'WORK_REQUEST_ASSIGNED_KO',
    templateName: '담당자 배정 알림',
    categoryCode: 'REQUEST',
    engineType: 'VELOCITY',
    localeCode: 'ko_KR',
    layoutId: 1,
    statusCode: 'ACTIVE',
    currentVersionId: 401,
    ownerDeptCode: 'D002',
    ownerUserId: 'kim',
    ownerUserName: '김철수',
    description: '의뢰 담당자로 배정되면 발송. 작업 시작 / 배정 반려를 메일에서 선택',
    tags: '의뢰,배정,액션',
    regDt: '2026-02-10 09:00',
    updDt: '2026-02-10 09:00',
    versions: [
      {
        versionId: 401,
        versionNo: 1,
        statusCode: 'ACTIVE',
        subject: '[담당배정] ${requestNo} ${requestTitle}',
        preheader: '${assigneeName}님이 담당자로 배정되었습니다',
        engineType: 'VELOCITY',
        changeNote: '최초 등록',
        regId: 'kim',
        regDt: '2026-02-10 09:00',
        approvedBy: 'admin',
        bodyHtml:
          heading('담당자로 배정되었습니다') +
          '<p>${assigneeName} 님, 아래 업무의 담당자로 배정되었습니다.</p>' +
          infoTable([
            row('의뢰번호', '${requestNo}'),
            row('제목', '${requestTitle}', true),
            row('의뢰자', '${requesterName}'),
            row('배정자', '${assignerName}'),
            row('처리기한', '${dueDate}'),
          ]) +
          cta('${actionUrl}', '작업 시작하기', 'primary', { url: '${rejectUrl}', label: '배정 반려' }) +
          '<p style="font-size:12px;color:#94a3b8;margin:0;">담당이 맞지 않으면 반려 사유와 함께 반송해 주세요.</p>',
        bodyText:
          '${assigneeName} 님, ${requestNo} ${requestTitle} 담당자로 배정되었습니다.\n' +
          '처리기한: ${dueDate}\n작업 시작: ${actionUrl}',
      },
    ],
    variables: [
      { varName: 'assigneeName', varPath: '${assigneeName}', dataType: 'STRING', requiredYn: 'Y', sampleValue: '김개발', description: '배정된 담당자', sortOrder: 1 },
      { varName: 'requestNo', varPath: '${requestNo}', dataType: 'STRING', requiredYn: 'Y', sampleValue: 'REQ-2026-0451', description: '의뢰번호', sortOrder: 2 },
      { varName: 'requestTitle', varPath: '${requestTitle}', dataType: 'STRING', requiredYn: 'Y', sampleValue: '공정 모니터링 대시보드 지표 추가', description: '의뢰 제목', sortOrder: 3 },
      { varName: 'requesterName', varPath: '${requesterName}', dataType: 'STRING', requiredYn: 'N', sampleValue: '정수진', description: '의뢰자', sortOrder: 4 },
      { varName: 'assignerName', varPath: '${assignerName}', dataType: 'STRING', requiredYn: 'N', sampleValue: '박팀장', description: '배정자', sortOrder: 5 },
      { varName: 'dueDate', varPath: '${dueDate}', dataType: 'DATE', requiredYn: 'Y', sampleValue: '2026-09-05', description: '처리 기한', sortOrder: 6 },
      { varName: 'actionUrl', varPath: '${actionUrl}', dataType: 'URL', requiredYn: 'Y', sampleValue: `${BASE_URL}/work-group/request-workflow?requestNo=REQ-2026-0451&action=start&from=mail`, description: 'CTA — 작업 시작', sortOrder: 7 },
      { varName: 'rejectUrl', varPath: '${rejectUrl}', dataType: 'URL', requiredYn: 'N', sampleValue: `${BASE_URL}/work-group/request-workflow?requestNo=REQ-2026-0451&action=reject&from=mail`, description: '배정 반려', sortOrder: 8 },
    ],
  },

  {
    templateId: 5,
    templateCode: 'WORK_REQUEST_DELAY_KO',
    templateName: '처리 지연 알림 (SLA)',
    categoryCode: 'REQUEST',
    engineType: 'VELOCITY',
    localeCode: 'ko_KR',
    layoutId: 1,
    statusCode: 'ACTIVE',
    currentVersionId: 501,
    ownerDeptCode: 'D002',
    ownerUserId: 'park',
    ownerUserName: '박민수',
    description: '기한을 넘긴 의뢰를 담당자와 팀장에게 배치 발송. 미처리 건 목록 포함',
    tags: '의뢰,지연,SLA,배치',
    regDt: '2026-04-02 08:00',
    updDt: '2026-04-02 08:00',
    versions: [
      {
        versionId: 501,
        versionNo: 1,
        statusCode: 'ACTIVE',
        subject: '[지연알림] 미처리 업무 ${delayCount}건이 기한을 초과했습니다',
        preheader: '즉시 처리가 필요합니다',
        engineType: 'VELOCITY',
        changeNote: '최초 등록',
        regId: 'park',
        regDt: '2026-04-02 08:00',
        approvedBy: 'admin',
        bodyHtml:
          heading('처리 기한이 지난 업무가 있습니다') +
          '<p>${assigneeName} 님이 담당 중인 업무 <strong style="color:#dc2626;">${delayCount}건</strong>이 기한을 넘겼습니다.</p>' +
          '<table width="100%" cellpadding="8" cellspacing="0" style="border-top:2px solid #212529;font-size:13px;">' +
          '<tr style="background:#f8f9fa;"><th align="left">의뢰번호</th><th align="left">제목</th><th align="right">지연</th></tr>' +
          '#foreach($item in $delayedItems)' +
          '<tr style="border-bottom:1px solid #dee2e6;">' +
          '<td><a href="${item.url}">${item.requestNo}</a></td>' +
          '<td>${item.title}</td>' +
          '<td align="right" style="color:#dc2626;font-weight:700;">${item.delayDays}일</td></tr>' +
          '#end' +
          '</table>' +
          cta('${actionUrl}', '미처리 업무 처리하기', 'danger') +
          '<p style="font-size:12px;color:#6c757d;">기한 연장이 필요하면 각 의뢰 화면에서 사유와 함께 신청해 주세요.</p>',
        bodyText: '미처리 업무 ${delayCount}건이 기한을 초과했습니다. ${actionUrl}',
      },
    ],
    variables: [
      { varName: 'assigneeName', varPath: '${assigneeName}', dataType: 'STRING', requiredYn: 'Y', sampleValue: '김개발', description: '담당자', sortOrder: 1 },
      { varName: 'delayCount', varPath: '${delayCount}', dataType: 'NUMBER', requiredYn: 'Y', sampleValue: '3', description: '지연 건수', sortOrder: 2 },
      {
        varName: 'delayedItems',
        varPath: '${delayedItems[]}',
        dataType: 'LIST',
        requiredYn: 'Y',
        sampleValue: `[{"requestNo":"REQ-2026-0398","title":"바코드 프린터 연동 오류","delayDays":5,"url":"${BASE_URL}/work-group/request-workflow?requestNo=REQ-2026-0398&from=mail"},{"requestNo":"REQ-2026-0412","title":"권한 그룹 재정비","delayDays":2,"url":"${BASE_URL}/work-group/request-workflow?requestNo=REQ-2026-0412&from=mail"}]`,
        description: '지연 항목 목록 (#foreach 대상)',
        sortOrder: 3,
      },
      { varName: 'actionUrl', varPath: '${actionUrl}', dataType: 'URL', requiredYn: 'Y', sampleValue: `${BASE_URL}/work-group/request-workflow?tab=delayed&from=mail`, description: 'CTA — 미처리 목록', sortOrder: 4 },
    ],
  },

  /* ---------------- 설비 ---------------- */

  {
    templateId: 7,
    templateCode: 'EQUIP_FAILURE_ALERT_KO',
    templateName: '설비 이상 경고',
    categoryCode: 'EQUIPMENT',
    engineType: 'VELOCITY',
    localeCode: 'ko_KR',
    layoutId: 1,
    statusCode: 'ACTIVE',
    currentVersionId: 701,
    ownerDeptCode: 'D005',
    ownerUserId: 'choi',
    ownerUserName: '최지훈',
    description: '센서 임계치 초과 시 설비 담당자에게 즉시 발송. 모니터링 화면으로 직행',
    tags: '설비,경고,실시간',
    regDt: '2026-03-02 15:10',
    updDt: '2026-03-02 15:10',
    versions: [
      {
        versionId: 701,
        versionNo: 1,
        statusCode: 'ACTIVE',
        subject: '[설비경고] ${equipName} ${alertType} 임계치 초과',
        preheader: '즉시 확인이 필요합니다',
        engineType: 'VELOCITY',
        changeNote: '최초 등록',
        regId: 'choi',
        regDt: '2026-03-02 15:10',
        approvedBy: 'admin',
        bodyHtml:
          '<div style="background:#fef2f2;border-left:4px solid #dc2626;padding:12px 14px;margin-bottom:16px;">' +
          '<strong style="color:#dc2626;font-size:15px;">설비 이상 감지</strong></div>' +
          infoTable([
            row('설비명', '${equipName}', true),
            row('위치', '${location}'),
            row('경고유형', '${alertType}'),
            row('측정값', '${currentValue} (임계치 ${threshold})'),
            row('감지시각', '${detectedAt}'),
          ]) +
          cta('${actionUrl}', '모니터링 화면 확인', 'danger', { url: '${supportUrl}', label: '지원 요청 등록' }) +
          '<p style="font-size:12px;color:#94a3b8;margin:0;">임계치 초과가 30분 이상 지속되면 자동으로 재알림이 발송됩니다.</p>',
        bodyText:
          '[설비경고] ${equipName} ${alertType} 임계치 초과\n' +
          '측정값 ${currentValue} / 임계치 ${threshold}\n확인: ${actionUrl}',
      },
    ],
    variables: [
      { varName: 'equipName', varPath: '${equipName}', dataType: 'STRING', requiredYn: 'Y', sampleValue: 'CNC 밀링머신 #3', description: '설비명', sortOrder: 1 },
      { varName: 'location', varPath: '${location}', dataType: 'STRING', requiredYn: 'Y', sampleValue: '2공장 B라인', description: '위치', sortOrder: 2 },
      { varName: 'alertType', varPath: '${alertType}', dataType: 'STRING', requiredYn: 'Y', sampleValue: '주축 온도', description: '경고 유형', sortOrder: 3 },
      { varName: 'currentValue', varPath: '${currentValue}', dataType: 'STRING', requiredYn: 'Y', sampleValue: '87.4℃', description: '측정값', sortOrder: 4 },
      { varName: 'threshold', varPath: '${threshold}', dataType: 'STRING', requiredYn: 'Y', sampleValue: '80.0℃', description: '임계치', sortOrder: 5 },
      { varName: 'detectedAt', varPath: '${detectedAt}', dataType: 'DATE', requiredYn: 'Y', sampleValue: '2026-08-20 14:32', description: '감지 시각', sortOrder: 6 },
      { varName: 'actionUrl', varPath: '${actionUrl}', dataType: 'URL', requiredYn: 'Y', sampleValue: `${BASE_URL}/work-group/equipment-monitor?equip=CNC-003&from=mail`, description: 'CTA — 모니터링 화면', sortOrder: 7 },
      { varName: 'supportUrl', varPath: '${supportUrl}', dataType: 'URL', requiredYn: 'N', sampleValue: `${BASE_URL}/work-group/equipment-support-request?equip=CNC-003&from=mail`, description: '지원 요청 등록', sortOrder: 8 },
    ],
  },


  /* ---------------- 계정 / 권한 ---------------- */
  {
    templateId: 9,
    templateCode: 'ACCOUNT_APPROVAL_KO',
    templateName: '계정·권한 신청 승인 요청',
    categoryCode: 'ACCOUNT',
    engineType: 'VELOCITY',
    localeCode: 'ko_KR',
    layoutId: 1,
    statusCode: 'ACTIVE',
    currentVersionId: 901,
    ownerDeptCode: 'D001',
    ownerUserId: 'hong',
    ownerUserName: '홍길동',
    description: '권한 신청이 올라오면 승인권자에게 발송. 메일에서 바로 승인/반려',
    tags: '계정,권한,승인,액션',
    regDt: '2026-01-12 09:20',
    updDt: '2026-01-12 09:20',
    versions: [
      {
        versionId: 901,
        versionNo: 1,
        statusCode: 'ACTIVE',
        subject: '[승인요청] ${applicantName}님의 ${permissionName} 권한 신청',
        preheader: '권한 신청 승인 대기 중입니다',
        engineType: 'VELOCITY',
        changeNote: '최초 등록',
        regId: 'hong',
        regDt: '2026-01-12 09:20',
        approvedBy: 'admin',
        bodyHtml:
          heading('권한 신청 승인 요청') +
          '<p><strong>${applicantName}</strong> 님이 권한을 신청했습니다. 검토 후 처리해 주세요.</p>' +
          infoTable([
            row('신청자', '${applicantName}', true),
            row('소속', '${applicantDept}'),
            row('신청권한', '${permissionName}'),
            row('신청사유', '${reason}'),
            row('신청일', '${appliedAt}'),
          ]) +
          cta('${actionUrl}', '승인 처리하기') +
          '<p style="font-size:12px;color:#6c757d;">' +
          '권한 체계는 <a href="${listUrl}">메뉴 및 권한 관리</a>에서 확인할 수 있습니다.</p>',
        bodyText: '${applicantName} 님이 ${permissionName} 권한을 신청했습니다. 승인: ${actionUrl}',
      },
    ],
    variables: [
      { varName: 'applicantName', varPath: '${applicantName}', dataType: 'STRING', requiredYn: 'Y', sampleValue: '오세훈', description: '신청자', sortOrder: 1 },
      { varName: 'applicantDept', varPath: '${applicantDept}', dataType: 'STRING', requiredYn: 'N', sampleValue: 'R&D본부 AI연구팀', description: '소속', sortOrder: 2 },
      { varName: 'permissionName', varPath: '${permissionName}', dataType: 'STRING', requiredYn: 'Y', sampleValue: '설비 모니터링 조회', description: '신청 권한', sortOrder: 3 },
      { varName: 'reason', varPath: '${reason}', dataType: 'STRING', requiredYn: 'N', sampleValue: '공정 데이터 분석 업무 수행을 위해 필요합니다.', description: '신청 사유', sortOrder: 4 },
      { varName: 'appliedAt', varPath: '${appliedAt}', dataType: 'DATE', requiredYn: 'Y', sampleValue: '2026-08-20 11:05', description: '신청일', sortOrder: 5 },
      { varName: 'actionUrl', varPath: '${actionUrl}', dataType: 'URL', requiredYn: 'Y', sampleValue: `${BASE_URL}/system/menus?tab=approval&applyNo=PRM-2026-0088&from=mail`, description: 'CTA — 승인 처리 화면', sortOrder: 6 },
      { varName: 'listUrl', varPath: '${listUrl}', dataType: 'URL', requiredYn: 'N', sampleValue: `${BASE_URL}/system/menus?from=mail`, description: '권한 관리 화면', sortOrder: 7 },
    ],
  },

  {
    templateId: 10,
    templateCode: 'USER_PWD_RESET_KO',
    templateName: '비밀번호 재설정 안내',
    categoryCode: 'ACCOUNT',
    engineType: 'VELOCITY',
    localeCode: 'ko_KR',
    layoutId: 1,
    statusCode: 'ACTIVE',
    currentVersionId: 1001,
    ownerDeptCode: 'D001',
    ownerUserId: 'hong',
    ownerUserName: '홍길동',
    description: '비밀번호 재설정 링크 발송 (유효시간 30분)',
    tags: '비밀번호,보안',
    regDt: '2026-01-12 09:35',
    updDt: '2026-01-12 09:35',
    versions: [
      {
        versionId: 1001,
        versionNo: 1,
        statusCode: 'ACTIVE',
        subject: '[NexHub] 비밀번호 재설정 안내',
        preheader: '30분 내 링크를 사용해 주세요',
        engineType: 'VELOCITY',
        changeNote: '최초 등록',
        regId: 'hong',
        regDt: '2026-01-12 09:35',
        approvedBy: 'admin',
        bodyHtml:
          heading('비밀번호 재설정') +
          '<p>${userName} 님, 아래 버튼을 눌러 비밀번호를 재설정해 주세요.</p>' +
          cta('${actionUrl}', '비밀번호 재설정', 'danger') +
          '<p style="color:#dc2626;font-size:13px;">이 링크는 ${expireMinutes}분 후 만료됩니다. ' +
          '본인이 요청하지 않았다면 즉시 IT지원팀으로 연락해 주세요.</p>',
        bodyText: '비밀번호 재설정: ${actionUrl} (${expireMinutes}분 후 만료)',
      },
    ],
    variables: [
      { varName: 'userName', varPath: '${userName}', dataType: 'STRING', requiredYn: 'Y', sampleValue: '홍길동', description: '수신자 이름', sortOrder: 1 },
      { varName: 'actionUrl', varPath: '${actionUrl}', dataType: 'URL', requiredYn: 'Y', sampleValue: `${BASE_URL}/login?reset=abc123&from=mail`, description: 'CTA — 재설정 링크', sortOrder: 2 },
      { varName: 'expireMinutes', varPath: '${expireMinutes}', dataType: 'NUMBER', requiredYn: 'Y', sampleValue: '30', description: '링크 만료(분)', sortOrder: 3 },
    ],
  },

  /* ---------------- 공지 ---------------- */
  {
    templateId: 11,
    templateCode: 'NOTICE_POST_KO',
    templateName: '공지사항 등록 알림',
    categoryCode: 'NOTICE',
    engineType: 'VELOCITY',
    localeCode: 'ko_KR',
    layoutId: 1,
    statusCode: 'ACTIVE',
    currentVersionId: 1101,
    ownerDeptCode: 'D001',
    ownerUserId: 'park',
    ownerUserName: '박민수',
    description: '중요 공지 등록 시 대상자에게 발송. 게시글로 바로 이동',
    tags: '공지,게시판',
    regDt: '2026-02-18 10:00',
    updDt: '2026-02-18 10:00',
    versions: [
      {
        versionId: 1101,
        versionNo: 1,
        statusCode: 'ACTIVE',
        subject: '[공지] ${noticeTitle}',
        preheader: '${writerName} · ${postedAt}',
        engineType: 'VELOCITY',
        changeNote: '최초 등록',
        regId: 'park',
        regDt: '2026-02-18 10:00',
        approvedBy: 'admin',
        bodyHtml:
          heading('${noticeTitle}') +
          '<p style="color:#6c757d;font-size:12px;margin-top:-8px;">${writerName} · ${postedAt}</p>' +
          '<p style="margin-top:14px;white-space:pre-line;">${noticeSummary}</p>' +
          cta('${actionUrl}', '공지 전문 보기') +
          '#if($requireConfirm)' +
          '<p style="background:#fef3c7;padding:10px 12px;font-size:13px;">' +
          '이 공지는 <strong>확인 응답이 필요한 공지</strong>입니다. 위 화면에서 확인 버튼을 눌러주세요.</p>' +
          '#end',
        bodyText: '[공지] ${noticeTitle}\n${noticeSummary}\n전문 보기: ${actionUrl}',
      },
    ],
    variables: [
      { varName: 'noticeTitle', varPath: '${noticeTitle}', dataType: 'STRING', requiredYn: 'Y', sampleValue: '2026년 하반기 안전교육 이수 안내', description: '공지 제목', sortOrder: 1 },
      { varName: 'writerName', varPath: '${writerName}', dataType: 'STRING', requiredYn: 'Y', sampleValue: '안전보건팀', description: '작성자', sortOrder: 2 },
      { varName: 'postedAt', varPath: '${postedAt}', dataType: 'DATE', requiredYn: 'Y', sampleValue: '2026-08-20', description: '게시일', sortOrder: 3 },
      { varName: 'noticeSummary', varPath: '${noticeSummary}', dataType: 'STRING', requiredYn: 'Y', sampleValue: '전 직원 대상 하반기 안전교육을 9월 중 이수해야 합니다. 미이수 시 현장 출입이 제한됩니다.', description: '공지 요약', sortOrder: 4 },
      { varName: 'requireConfirm', varPath: '${requireConfirm}', dataType: 'BOOLEAN', requiredYn: 'N', sampleValue: 'true', description: '확인 응답 필요 여부 (#if 조건)', sortOrder: 5 },
      { varName: 'actionUrl', varPath: '${actionUrl}', dataType: 'URL', requiredYn: 'Y', sampleValue: `${BASE_URL}/posts/1042?from=mail`, description: 'CTA — 공지 상세', sortOrder: 6 },
    ],
  },

  {
    templateId: 12,
    templateCode: 'NOTICE_MAINT_KO',
    templateName: '시스템 점검 공지',
    categoryCode: 'NOTICE',
    engineType: 'PLAIN',
    localeCode: 'ko_KR',
    layoutId: 1,
    statusCode: 'DRAFT',
    currentVersionId: 1201,
    ownerDeptCode: 'D001',
    ownerUserId: 'park',
    ownerUserName: '박민수',
    description: '정기 점검 사전 공지. 액션이 없는 확인용 메일 (PLAIN 예시)',
    tags: '공지,점검',
    regDt: '2026-08-14 17:30',
    updDt: '2026-08-14 17:30',
    versions: [
      {
        versionId: 1201,
        versionNo: 1,
        statusCode: 'DRAFT',
        subject: '[점검안내] ${maintDate} 시스템 정기 점검',
        preheader: '서비스 일시 중단 안내',
        engineType: 'PLAIN',
        changeNote: '초안 작성 (승인 대기)',
        regId: 'park',
        regDt: '2026-08-14 17:30',
        approvedBy: null,
        bodyHtml:
          heading('시스템 정기 점검 안내') +
          '<p>보다 안정적인 서비스 제공을 위해 아래와 같이 시스템 점검을 실시합니다.</p>' +
          '<table width="100%" cellpadding="8" cellspacing="0" style="background:#fef3c7;font-size:13px;">' +
          '<tr><td width="110" style="color:#6c757d;">점검일시</td><td>${maintDate} ${maintTime}</td></tr>' +
          '<tr><td style="color:#6c757d;">점검대상</td><td>${maintTarget}</td></tr></table>' +
          '<p style="color:#6c757d;font-size:13px;margin-top:14px;">점검 시간 동안 서비스 이용이 제한됩니다. 양해 부탁드립니다.</p>',
        bodyText: '시스템 점검 안내: ${maintDate} ${maintTime} / 대상: ${maintTarget}',
      },
    ],
    variables: [
      { varName: 'maintDate', varPath: '${maintDate}', dataType: 'DATE', requiredYn: 'Y', sampleValue: '2026-08-30', description: '점검일', sortOrder: 1 },
      { varName: 'maintTime', varPath: '${maintTime}', dataType: 'STRING', requiredYn: 'Y', sampleValue: '02:00 ~ 05:00', description: '점검 시간', sortOrder: 2 },
      { varName: 'maintTarget', varPath: '${maintTarget}', dataType: 'STRING', requiredYn: 'Y', sampleValue: '전체 서비스', description: '점검 대상', sortOrder: 3 },
    ],
  },

  /* ---------------- 리포트 ---------------- */
  {
    templateId: 13,
    templateCode: 'WEEKLY_PENDING_KO',
    templateName: '주간 미처리 현황 리포트',
    categoryCode: 'REPORT',
    engineType: 'VELOCITY',
    localeCode: 'ko_KR',
    layoutId: 1,
    statusCode: 'ARCHIVED',
    currentVersionId: 1301,
    ownerDeptCode: 'D002',
    ownerUserId: 'park',
    ownerUserName: '박민수',
    description: '매주 월요일 팀장에게 미처리 현황 배치 발송. 신규 대시보드로 대체되어 보관',
    tags: '리포트,배치,주간',
    regDt: '2025-11-03 08:00',
    updDt: '2026-01-05 10:00',
    versions: [
      {
        versionId: 1301,
        versionNo: 4,
        statusCode: 'ARCHIVED',
        subject: '[주간리포트] ${weekLabel} 미처리 현황',
        preheader: '팀 미처리 업무 요약',
        engineType: 'VELOCITY',
        changeNote: '대시보드 링크 방식으로 대체하여 보관 처리',
        regId: 'park',
        regDt: '2026-01-05 10:00',
        approvedBy: 'admin',
        bodyHtml:
          heading('${weekLabel} 미처리 현황') +
          '<p>${teamName} 미처리 업무 <strong>${totalCount}건</strong> (지연 ${delayCount}건)</p>' +
          '<table width="100%" cellpadding="8" cellspacing="0" style="border-top:2px solid #212529;font-size:13px;">' +
          '<tr style="background:#f8f9fa;"><th align="left">담당자</th><th align="right">미처리</th><th align="right">지연</th></tr>' +
          '#foreach($member in $members)' +
          '<tr style="border-bottom:1px solid #dee2e6;"><td>${member.name}</td>' +
          '<td align="right">${member.pending}</td>' +
          '<td align="right" style="color:#dc2626;">${member.delayed}</td></tr>' +
          '#end</table>' +
          cta('${actionUrl}', '대시보드에서 보기'),
        bodyText: '${weekLabel} ${teamName} 미처리 ${totalCount}건 / 지연 ${delayCount}건. ${actionUrl}',
      },
    ],
    variables: [
      { varName: 'weekLabel', varPath: '${weekLabel}', dataType: 'STRING', requiredYn: 'Y', sampleValue: '2026년 34주차', description: '주차 표기', sortOrder: 1 },
      { varName: 'teamName', varPath: '${teamName}', dataType: 'STRING', requiredYn: 'Y', sampleValue: '플랫폼개발팀', description: '팀명', sortOrder: 2 },
      { varName: 'totalCount', varPath: '${totalCount}', dataType: 'NUMBER', requiredYn: 'Y', sampleValue: '17', description: '미처리 건수', sortOrder: 3 },
      { varName: 'delayCount', varPath: '${delayCount}', dataType: 'NUMBER', requiredYn: 'Y', sampleValue: '4', description: '지연 건수', sortOrder: 4 },
      {
        varName: 'members',
        varPath: '${members[]}',
        dataType: 'LIST',
        requiredYn: 'Y',
        sampleValue: '[{"name":"김개발","pending":7,"delayed":2},{"name":"오세훈","pending":6,"delayed":1},{"name":"강도현","pending":4,"delayed":1}]',
        description: '팀원별 현황 (#foreach 대상)',
        sortOrder: 5,
      },
      { varName: 'actionUrl', varPath: '${actionUrl}', dataType: 'URL', requiredYn: 'Y', sampleValue: `${BASE_URL}/?tab=pending&from=mail`, description: 'CTA — 대시보드', sortOrder: 6 },
    ],
  },
].concat(mailEquipmentTemplates)

/* ------------------------------------------------------------------ */
/* 발송 이벤트 (MAIL_EVENT)                                             */
/* ------------------------------------------------------------------ */

export const mailEvents = [
  { eventId: 1, eventCode: 'APPROVAL.REQUEST', eventName: '결재 요청', moduleCode: 'APPROVAL', triggerType: 'EVENT', importance: 'HIGH', description: '결재선에 문서 도착 시 결재자에게 발송', sourceHint: 'ApprovalService#request', useYn: 'Y' },
  { eventId: 2, eventCode: 'APPROVAL.APPROVED', eventName: '결재 승인 통보', moduleCode: 'APPROVAL', triggerType: 'EVENT', importance: 'NORMAL', description: '문서 승인 시 기안자에게 발송', sourceHint: 'ApprovalService#approve', useYn: 'Y' },
  { eventId: 3, eventCode: 'APPROVAL.REJECTED', eventName: '결재 반려 통보', moduleCode: 'APPROVAL', triggerType: 'EVENT', importance: 'HIGH', description: '문서 반려 시 기안자에게 발송', sourceHint: 'ApprovalService#reject', useYn: 'Y' },
  { eventId: 4, eventCode: 'REQUEST.RECEIVED', eventName: '업무 의뢰 접수', moduleCode: 'REQUEST', triggerType: 'EVENT', importance: 'HIGH', description: '의뢰 등록 시 처리 부서에 발송', sourceHint: 'WorkRequestService#create', useYn: 'Y' },
  { eventId: 5, eventCode: 'REQUEST.ASSIGNED', eventName: '담당자 배정', moduleCode: 'REQUEST', triggerType: 'EVENT', importance: 'HIGH', description: '담당자 배정 시 해당 담당자에게 발송', sourceHint: 'WorkRequestService#assign', useYn: 'Y' },
  { eventId: 6, eventCode: 'REQUEST.DELAYED', eventName: '처리 지연 알림', moduleCode: 'REQUEST', triggerType: 'BATCH', importance: 'HIGH', description: '매일 08시 배치. 기한 초과 건을 담당자·팀장에게 발송', sourceHint: 'SlaCheckBatch#run', useYn: 'Y' },
  { eventId: 7, eventCode: 'REQUEST.COMPLETED', eventName: '처리 완료 통보', moduleCode: 'REQUEST', triggerType: 'EVENT', importance: 'NORMAL', description: '의뢰 처리 완료 시 의뢰자에게 발송', sourceHint: 'WorkRequestService#complete', useYn: 'Y' },
  { eventId: 8, eventCode: 'EQUIP.SUPPORT.REQUESTED', eventName: '설비 지원 요청', moduleCode: 'EQUIPMENT', triggerType: 'EVENT', importance: 'HIGH', description: '현장 지원 요청 등록 시 설비팀에 발송', sourceHint: 'EquipSupportService#request', useYn: 'Y' },
  { eventId: 9, eventCode: 'EQUIP.FAILURE.DETECTED', eventName: '설비 이상 감지', moduleCode: 'EQUIPMENT', triggerType: 'EVENT', importance: 'HIGH', description: '센서 임계치 초과 시 담당자에게 즉시 발송', sourceHint: 'EquipMonitorService#onThreshold', useYn: 'Y' },
  { eventId: 10, eventCode: 'EQUIP.REPAIR.COMPLETED', eventName: '수리 완료 보고', moduleCode: 'EQUIPMENT', triggerType: 'EVENT', importance: 'NORMAL', description: '수리 완료 시 요청자에게 결과 보고', sourceHint: 'EquipRepairService#complete', useYn: 'Y' },
  { eventId: 11, eventCode: 'ACCOUNT.APPROVAL.REQUESTED', eventName: '권한 신청 승인 요청', moduleCode: 'ACCOUNT', triggerType: 'EVENT', importance: 'NORMAL', description: '권한 신청 시 승인권자에게 발송', sourceHint: 'PermissionService#apply', useYn: 'Y' },
  { eventId: 12, eventCode: 'ACCOUNT.PASSWORD.RESET', eventName: '비밀번호 재설정', moduleCode: 'ACCOUNT', triggerType: 'EVENT', importance: 'HIGH', description: '비밀번호 찾기 요청 시 발송', sourceHint: 'AuthService#requestReset', useYn: 'Y' },
  { eventId: 13, eventCode: 'ACCOUNT.LOCKED', eventName: '계정 잠금 알림', moduleCode: 'ACCOUNT', triggerType: 'EVENT', importance: 'HIGH', description: '로그인 5회 실패로 계정 잠금 시 발송', sourceHint: 'AuthService#lockAccount', useYn: 'Y' },
  { eventId: 14, eventCode: 'NOTICE.POSTED', eventName: '공지사항 등록', moduleCode: 'NOTICE', triggerType: 'MANUAL', importance: 'NORMAL', description: '중요 공지 등록 시 대상자에게 발송', sourceHint: 'NoticeController#publish', useYn: 'Y' },
  { eventId: 15, eventCode: 'NOTICE.MAINTENANCE', eventName: '시스템 점검 공지', moduleCode: 'NOTICE', triggerType: 'MANUAL', importance: 'NORMAL', description: '관리자가 수동 발송하는 점검 공지', sourceHint: 'AdminNoticeController#send', useYn: 'Y' },
  { eventId: 17, eventCode: 'EQUIP.MODIFICATION.REPORTED', eventName: '개조/개선 결과 보고', moduleCode: 'EQUIPMENT', triggerType: 'EVENT', importance: 'NORMAL', description: '개조/개선 작업 완료 시 요청자·승인자에게 결과 보고', sourceHint: 'EquipModificationService#report', useYn: 'Y' },
  { eventId: 18, eventCode: 'EQUIP.SETUP.REPORTED', eventName: '셋업/해제 결과 보고', moduleCode: 'EQUIPMENT', triggerType: 'EVENT', importance: 'NORMAL', description: '설비 셋업/해제 완료 시 결과 보고', sourceHint: 'EquipSetupService#report', useYn: 'Y' },
  { eventId: 16, eventCode: 'BATCH.WEEKLY.PENDING', eventName: '주간 미처리 리포트', moduleCode: 'BATCH', triggerType: 'BATCH', importance: 'LOW', description: '매주 월요일 08시 팀장에게 발송', sourceHint: 'WeeklyReportBatch#run', useYn: 'Y' },
]

/* ------------------------------------------------------------------ */
/* 이벤트 ↔ 템플릿 바인딩 (MAIL_EVENT_TEMPLATE)                          */
/*   · eventId 7(처리완료), 13(계정잠금) 은 의도적으로 미매핑            */
/*   · eventId 10 은 REVIEW, 15 는 DRAFT, 16 은 ARCHIVED 템플릿 연결     */
/* ------------------------------------------------------------------ */

const FROM = {
  approval: { fromName: 'NexHub 결재', fromEmail: 'approval@nexhub.example.com' },
  request: { fromName: 'NexHub 업무의뢰', fromEmail: 'workflow@nexhub.example.com' },
  equip: { fromName: 'NexHub 설비관리', fromEmail: 'equipment@nexhub.example.com' },
  account: { fromName: 'NexHub 계정', fromEmail: 'no-reply@nexhub.example.com' },
  notice: { fromName: 'NexHub 공지', fromEmail: 'notice@nexhub.example.com' },
}

export const mailEventTemplates = [
  { mapId: 1, eventId: 1, templateId: 1, ...FROM.approval, replyTo: null, bccList: 'archive@nexhub.example.com' },
  { mapId: 2, eventId: 2, templateId: 2, ...FROM.approval, replyTo: null, bccList: null },
  { mapId: 3, eventId: 3, templateId: 2, ...FROM.approval, replyTo: null, bccList: null },
  { mapId: 4, eventId: 4, templateId: 3, ...FROM.request, replyTo: 'workflow@nexhub.example.com', bccList: null },
  { mapId: 5, eventId: 5, templateId: 4, ...FROM.request, replyTo: null, bccList: null },
  { mapId: 6, eventId: 6, templateId: 5, ...FROM.request, replyTo: null, bccList: null },
  { mapId: 7, eventId: 8, templateId: 21, ...FROM.equip, replyTo: 'equipment@nexhub.example.com', bccList: null },
  { mapId: 8, eventId: 9, templateId: 7, ...FROM.equip, replyTo: null, bccList: null },
  { mapId: 9, eventId: 10, templateId: 22, ...FROM.equip, replyTo: null, bccList: null },
  { mapId: 15, eventId: 17, templateId: 23, ...FROM.equip, replyTo: null, bccList: null },
  { mapId: 16, eventId: 18, templateId: 24, ...FROM.equip, replyTo: null, bccList: null },
  { mapId: 10, eventId: 11, templateId: 9, ...FROM.account, replyTo: null, bccList: null },
  { mapId: 11, eventId: 12, templateId: 10, ...FROM.account, replyTo: null, bccList: null },
  { mapId: 12, eventId: 14, templateId: 11, ...FROM.notice, replyTo: null, bccList: null },
  { mapId: 13, eventId: 15, templateId: 12, ...FROM.notice, replyTo: null, bccList: null },
  { mapId: 14, eventId: 16, templateId: 13, ...FROM.request, replyTo: null, bccList: null },
].map((mapping) => ({
  localeCode: 'ko_KR',
  brandCode: 'DEFAULT',
  priority: 1,
  validFromDt: null,
  validToDt: null,
  activeYn: 'Y',
  ...mapping,
}))

/* ------------------------------------------------------------------ */
/* 수신자 결정 규칙 (MAIL_EVENT_RECIPIENT)   ★ "누구에게 보낼지"          */
/*                                                                      */
/*  이 규칙이 없으면 수신자 결정이 자바 코드에 박힌다.                   */
/*  "이제 팀장도 CC 넣어줘" 한마디에 재배포가 필요해지고,                */
/*  템플릿만 DB 로 뺀 무중단 교체가 반쪽이 된다.                         */
/* ------------------------------------------------------------------ */

export const recipientTypes = [
  { code: 'REQUESTER', name: '의뢰자/기안자', needTarget: false, hint: '이벤트를 발생시킨 사람' },
  { code: 'ASSIGNEE', name: '담당자', needTarget: false, hint: '해당 업무의 배정 담당자' },
  { code: 'APPROVER', name: '결재자', needTarget: false, hint: '결재선의 다음 차례' },
  { code: 'DEPT_HEAD', name: '부서장', needTarget: false, hint: '대상자 소속 부서의 장' },
  { code: 'TEAM', name: '팀/부서 전체', needTarget: true, hint: '부서코드 입력' },
  { code: 'ROLE', name: '역할 보유자', needTarget: true, hint: '역할(권한그룹) 코드 입력' },
  { code: 'FIXED', name: '고정 주소', needTarget: true, hint: '이메일 직접 입력 (콤마 구분)' },
  { code: 'EXPRESSION', name: '모델 표현식', needTarget: true, hint: '예: ${order.manager.email}' },
]

export const sendFields = [
  { code: 'TO', name: '받는사람' },
  { code: 'CC', name: '참조' },
  { code: 'BCC', name: '숨은참조' },
]

const RECIPIENT_SEEDS = [
  // [eventId, type, field, targetValue, conditionExpr, description]
  [1, 'APPROVER', 'TO', null, null, '결재선의 다음 차례 결재자'],
  [1, 'DEPT_HEAD', 'CC', null, "urgency == '긴급'", '긴급 문서만 부서장 참조'],
  [2, 'REQUESTER', 'TO', null, null, '기안자에게 결과 통보'],
  [3, 'REQUESTER', 'TO', null, null, '기안자에게 반려 통보'],
  [3, 'DEPT_HEAD', 'CC', null, null, '반려는 부서장도 인지'],
  [4, 'ROLE', 'TO', 'WORKFLOW_MANAGER', null, '업무의뢰 접수 담당 역할'],
  [4, 'REQUESTER', 'CC', null, null, '의뢰자 본인 확인용'],
  [5, 'ASSIGNEE', 'TO', null, null, '배정된 담당자'],
  [5, 'DEPT_HEAD', 'CC', null, null, '담당자 부서장'],
  [6, 'ASSIGNEE', 'TO', null, null, '지연 건 담당자'],
  [6, 'DEPT_HEAD', 'TO', null, null, '팀장도 함께 (에스컬레이션)'],
  [8, 'ROLE', 'TO', 'EQUIP_MANAGER', null, '설비 지원 접수 역할'],
  [8, 'TEAM', 'CC', 'D005', null, '설비팀 전체 참조'],
  [9, 'ROLE', 'TO', 'EQUIP_MANAGER', null, '설비 담당자'],
  [9, 'FIXED', 'CC', 'control-room@nexhub.example.com', null, '통합관제실 상시 참조'],
  [10, 'REQUESTER', 'TO', null, null, '수리 요청자에게 결과 보고'],
  [11, 'ROLE', 'TO', 'PERMISSION_APPROVER', null, '권한 승인권자'],
  [12, 'EXPRESSION', 'TO', '${user.email}', null, '본인 계정 주소'],
  [14, 'TEAM', 'TO', 'ALL', null, '전사 공지 대상'],
  [15, 'TEAM', 'TO', 'ALL', null, '전사 점검 공지'],
  [16, 'ROLE', 'TO', 'TEAM_LEAD', null, '팀장 대상 주간 리포트'],
  [17, 'REQUESTER', 'TO', null, null, '개조 요청자에게 결과 보고'],
  [17, 'ROLE', 'CC', 'EQUIP_MANAGER', null, '설비 담당 역할 참조'],
  [18, 'REQUESTER', 'TO', null, null, '셋업 요청자에게 결과 보고'],
  [18, 'TEAM', 'CC', 'D005', null, '설비팀 전체 참조'],
]

export const mailEventRecipients = RECIPIENT_SEEDS.map((seed, index) => {
  const [eventId, recipientType, sendField, targetValue, conditionExpr, description] = seed
  return {
    recipientId: 1 + index,
    eventId,
    recipientType,
    sendField,
    targetValue,
    conditionExpr,
    description,
    sortOrder: index + 1,
    useYn: 'Y',
  }
})

/* ------------------------------------------------------------------ */
/* 발송 이력 (MAIL_SEND_LOG)                                            */
/* ------------------------------------------------------------------ */

const LOG_SEEDS = [
  // [eventId, templateId, versionId, 수신자, 이름, 상태, 경과일, 오류코드, 오류메시지]
  [1, 1, 102, 'manager@nexhub.example.com', '박부장', 'SENT', 0, null, null],
  [4, 3, 301, 'dev.kim@nexhub.example.com', '김개발', 'SENT', 0, null, null],
  [9, 7, 701, 'equip.choi@nexhub.example.com', '최지훈', 'SENT', 0, null, null],
  [5, 4, 401, 'dev.kim@nexhub.example.com', '김개발', 'SENT', 0, null, null],
  [1, 1, 102, 'director@nexhub.example.com', '조이사', 'SENT', 1, null, null],
  [2, 2, 201, 'lee@nexhub.example.com', '이영희', 'SENT', 1, null, null],
  [8, 21, 2101, 'equip1@nexhub.example.com', '설비1팀', 'SENT', 1, null, null],
  [6, 5, 501, 'dev.kim@nexhub.example.com', '김개발', 'SENT', 2, null, null],
  [6, 5, 501, 'teamlead@nexhub.example.com', '박팀장', 'SENT', 2, null, null],
  [11, 9, 901, 'admin@nexhub.example.com', '시스템관리자', 'SENT', 2, null, null],
  [9, 7, 701, 'equip.old@nexhub.example.co', '설비2팀', 'FAILED', 3, 'SMTP_550', '550 5.1.1 Recipient address rejected: User unknown'],
  [3, 2, 201, 'han@nexhub.example.com', '한지민', 'SENT', 3, null, null],
  [14, 11, 1101, 'all-staff@nexhub.example.com', '전사', 'SENT', 4, null, null],
  [12, 10, 1001, 'jung@partner.example.com', '정수진', 'BOUNCED', 4, 'BOUNCE_HARD', 'Mailbox does not exist'],
  [8, 21, 2101, 'equip1@nexhub.example.com', '설비1팀', 'SENT', 5, null, null],
  [10, 22, 2201, 'han@nexhub.example.com', '한지민', 'SENT', 6, null, null],
  [17, 23, 2301, 'jung@nexhub.example.com', '정수진', 'SENT', 3, null, null],
  [16, 13, 1301, 'teamlead@nexhub.example.com', '박팀장', 'SENT', 7, null, null],
  [15, 12, 1201, 'all-staff@nexhub.example.com', '전사', 'QUEUED', 0, null, null],
]

function isoDaysAgo(days, hour = 10, minute = 24) {
  const base = new Date(2026, 7, 20, hour, minute, 0) // 2026-08-20 기준
  base.setDate(base.getDate() - days)
  const pad = (n) => String(n).padStart(2, '0')
  return `${base.getFullYear()}-${pad(base.getMonth() + 1)}-${pad(base.getDate())} ${pad(base.getHours())}:${pad(base.getMinutes())}`
}

export const mailSendLogs = LOG_SEEDS.map((seed, index) => {
  const [eventId, templateId, versionId, toEmail, toName, statusCode, daysAgo, errorCode, errorMessage] = seed
  const template = mailTemplates.find((item) => item.templateId === templateId)
  const version = template?.versions.find((item) => item.versionId === versionId)
  const mapping = mailEventTemplates.find((item) => item.eventId === eventId)
  const model = buildSampleModel(template)
  const reqDt = isoDaysAgo(daysAgo, 9 + (index % 8), (index * 7) % 60)

  return {
    logId: 1000 + index,
    sendType: 'REAL',
    eventId,
    eventCode: mailEvents.find((item) => item.eventId === eventId)?.eventCode || '',
    templateId,
    templateCode: template?.templateCode || '',
    templateName: template?.templateName || '',
    versionId,
    versionNo: version?.versionNo || 0,
    subjectSnap: renderSubjectPlain(version?.subject || '', model),
    mergeDataJson: JSON.stringify(model),
    fromEmail: mapping?.fromEmail || 'no-reply@nexhub.example.com',
    toEmail,
    toName,
    statusCode,
    errorCode,
    errorMessage,
    retryCnt: statusCode === 'FAILED' ? 3 : statusCode === 'BOUNCED' ? 1 : 0,
    smtpMessageId: statusCode === 'SENT' ? `<msg-${1000 + index}@nexhub>` : null,
    reqId: 'system',
    reqDt,
    sentDt: statusCode === 'SENT' ? reqDt : null,
    openDt: statusCode === 'SENT' && index % 3 === 0 ? reqDt : null,
  }
}).concat([
  {
    logId: 2001,
    sendType: 'TEST',
    eventId: null,
    eventCode: '',
    templateId: 1,
    templateCode: 'APPROVAL_REQUEST_KO',
    templateName: '결재 요청 알림',
    versionId: 102,
    versionNo: 2,
    subjectSnap: '[결재요청] 테스트 문서',
    mergeDataJson: '{"drafterName":"테스트","docNo":"DOC-TEST-0001","docTitle":"테스트 문서"}',
    fromEmail: 'approval@nexhub.example.com',
    toEmail: 'lee@nexhub.example.com',
    toName: '이영희',
    statusCode: 'SENT',
    errorCode: null,
    errorMessage: null,
    retryCnt: 0,
    smtpMessageId: '<test-2001@nexhub>',
    reqId: 'lee',
    reqDt: isoDaysAgo(0, 15, 40),
    sentDt: isoDaysAgo(0, 15, 40),
    openDt: null,
  },
])

/** 목데이터용 - 변수 샘플값으로 치환 모델을 만든다 */
function buildSampleModel(template) {
  const model = {}
  ;(template?.variables || []).forEach((variable) => {
    if (variable.dataType === 'LIST' || variable.dataType === 'OBJECT') {
      try {
        model[variable.varName] = JSON.parse(variable.sampleValue)
      } catch {
        model[variable.varName] = []
      }
    } else {
      model[variable.varName] = variable.sampleValue
    }
  })
  return model
}

/** 로그 제목 스냅샷용 단순 치환 (본문 렌더러와 별개) */
function renderSubjectPlain(subject, model) {
  return String(subject).replace(/\$\{([\w.]+)\}/g, (matched, key) => {
    const value = model[key]
    return value === undefined || value === null ? matched : String(value)
  })
}

export default {
  mailCategories,
  recipientTypes,
  sendFields,
  mailEventRecipients,
  templateStatuses,
  engineTypes,
  sendStatuses,
  mailModules,
  mailLayouts,
  mailTemplates,
  mailEvents,
  mailEventTemplates,
  mailSendLogs,
}
