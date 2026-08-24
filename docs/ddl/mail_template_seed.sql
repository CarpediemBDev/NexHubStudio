-- =====================================================================
--  메일 템플릿 샘플 데이터 (Seed) — B2B 업무 메일 기준
--  기준: MySQL / MariaDB / H2(MODE=MySQL)
--
--  ※ 이 파일은 src/data/mailTemplateMock.js 에서 생성되었다.
--     화면 목데이터와 100% 동일하다.
--
--  Oracle 로 옮길 때
--    - NOW()  ->  SYSDATE
--    - 문자열 안의 '' 이스케이프 방식은 동일
--
--  B2B 업무 메일 원칙: 모든 액션 메일은 CTA 딥링크(${actionUrl}) 를 갖는다.
--    ${baseUrl}/{화면경로}?{식별자}&from=mail
-- =====================================================================

-- ---------------------------------------------------------------------
-- 공통 레이아웃
-- ---------------------------------------------------------------------
INSERT INTO MAIL_TEMPLATE_LAYOUT
    (LAYOUT_ID, LAYOUT_CODE, LAYOUT_NAME, HEADER_HTML, FOOTER_HTML, BASE_CSS, BODY_WIDTH, DESCRIPTION, USE_YN, REG_ID)
VALUES
    (1, 'DEFAULT_KO', '업무 메일 기본 레이아웃 (국문)',
     '<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:24px 0;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;font-family:''Malgun Gothic'',''Apple SD Gothic Neo'',sans-serif;"><tr><td style="background:#1e293b;padding:16px 24px;"><span style="color:#ffffff;font-size:17px;font-weight:700;letter-spacing:-0.3px;">NexHub</span><span style="color:#94a3b8;font-size:12px;margin-left:8px;">업무 알림</span></td></tr><tr><td style="padding:26px 24px;color:#212529;font-size:14px;line-height:1.7;">',
     '</td></tr><tr><td style="background:#f8f9fa;padding:16px 24px;color:#6c757d;font-size:12px;line-height:1.6;">본 메일은 발신전용입니다. 시스템 문의는 IT지원팀(내선 1234)으로 연락 주십시오.<br/>버튼이 동작하지 않으면 아래 주소를 브라우저에 붙여넣으세요.<br/><span style="color:#94a3b8;">${actionUrl}</span></td></tr></table></td></tr></table>',
     'body{margin:0;padding:0;} a{color:#2563eb;} table{border-collapse:collapse;} @media only screen and (max-width:480px){.cta-table{width:100% !important;}.cta-cell{display:block !important;width:100% !important;}.cta-gap{display:block !important;height:8px;width:100% !important;}.cta-btn{display:block !important;width:100% !important;min-width:0 !important;}}', 600, '전 템플릿 공통 헤더/푸터. CI 변경 시 이 행만 수정하면 전체에 반영된다.', 'Y', 'system');

-- ---------------------------------------------------------------------
-- 템플릿 마스터 (CURRENT_VERSION_ID 는 버전 INSERT 후 UPDATE)
-- ---------------------------------------------------------------------
INSERT INTO MAIL_TEMPLATE
    (TEMPLATE_ID, TEMPLATE_CODE, TEMPLATE_NAME, CATEGORY_CODE, ENGINE_TYPE, LOCALE_CODE, LAYOUT_ID,
     STATUS_CODE, OWNER_DEPT_CODE, OWNER_USER_ID, DESCRIPTION, TAGS, USE_YN, DEL_YN, REG_ID)
VALUES
    (1, 'APPROVAL_REQUEST_KO', '결재 요청 알림', 'APPROVAL', 'VELOCITY', 'ko_KR', 1, 'ACTIVE', 'D003', 'lee', '결재선에 문서가 도착했을 때 결재자에게 발송. 메일에서 바로 결재 화면으로 이동', '결재,승인,액션', 'Y', 'N', 'lee'),
    (2, 'APPROVAL_RESULT_KO', '결재 결과 통보', 'APPROVAL', 'THYMELEAF', 'ko_KR', 1, 'ACTIVE', 'D003', 'lee', '승인/반려 결과를 기안자에게 통보. 반려 시 재기안 화면으로 바로 이동', '결재,결과,Thymeleaf', 'Y', 'N', 'lee'),
    (3, 'WORK_REQUEST_RECEIVED_KO', '업무 의뢰 접수 알림', 'REQUEST', 'VELOCITY', 'ko_KR', 1, 'ACTIVE', 'D002', 'kim', '업무 의뢰가 등록되면 처리 부서 담당자에게 발송. 메일에서 바로 접수 처리', '의뢰,접수,액션', 'Y', 'N', 'kim'),
    (4, 'WORK_REQUEST_ASSIGNED_KO', '담당자 배정 알림', 'REQUEST', 'VELOCITY', 'ko_KR', 1, 'ACTIVE', 'D002', 'kim', '의뢰 담당자로 배정되면 발송. 작업 시작 / 배정 반려를 메일에서 선택', '의뢰,배정,액션', 'Y', 'N', 'kim'),
    (5, 'WORK_REQUEST_DELAY_KO', '처리 지연 알림 (SLA)', 'REQUEST', 'VELOCITY', 'ko_KR', 1, 'ACTIVE', 'D002', 'park', '기한을 넘긴 의뢰를 담당자와 팀장에게 배치 발송. 미처리 건 목록 포함', '의뢰,지연,SLA,배치', 'Y', 'N', 'park'),
    (7, 'EQUIP_FAILURE_ALERT_KO', '설비 이상 경고', 'EQUIPMENT', 'VELOCITY', 'ko_KR', 1, 'ACTIVE', 'D005', 'choi', '센서 임계치 초과 시 설비 담당자에게 즉시 발송. 모니터링 화면으로 직행', '설비,경고,실시간', 'Y', 'N', 'choi'),
    (9, 'ACCOUNT_APPROVAL_KO', '계정·권한 신청 승인 요청', 'ACCOUNT', 'VELOCITY', 'ko_KR', 1, 'ACTIVE', 'D001', 'hong', '권한 신청이 올라오면 승인권자에게 발송. 메일에서 바로 승인/반려', '계정,권한,승인,액션', 'Y', 'N', 'hong'),
    (10, 'USER_PWD_RESET_KO', '비밀번호 재설정 안내', 'ACCOUNT', 'VELOCITY', 'ko_KR', 1, 'ACTIVE', 'D001', 'hong', '비밀번호 재설정 링크 발송 (유효시간 30분)', '비밀번호,보안', 'Y', 'N', 'hong'),
    (11, 'NOTICE_POST_KO', '공지사항 등록 알림', 'NOTICE', 'VELOCITY', 'ko_KR', 1, 'ACTIVE', 'D001', 'park', '중요 공지 등록 시 대상자에게 발송. 게시글로 바로 이동', '공지,게시판', 'Y', 'N', 'park'),
    (12, 'NOTICE_MAINT_KO', '시스템 점검 공지', 'NOTICE', 'PLAIN', 'ko_KR', 1, 'DRAFT', 'D001', 'park', '정기 점검 사전 공지. 액션이 없는 확인용 메일 (PLAIN 예시)', '공지,점검', 'Y', 'N', 'park'),
    (13, 'WEEKLY_PENDING_KO', '주간 미처리 현황 리포트', 'REPORT', 'VELOCITY', 'ko_KR', 1, 'ARCHIVED', 'D002', 'park', '매주 월요일 팀장에게 미처리 현황 배치 발송. 신규 대시보드로 대체되어 보관', '리포트,배치,주간', 'Y', 'N', 'park'),
    (21, 'EQUIP_SUPPORT_REPORT_KO', '설비지원 결과 보고서', 'EQUIPMENT', 'VELOCITY', 'ko_KR', null, 'ACTIVE', 'D005', 'choi', '레거시 .vm 자산 이관. 요청 → 접수 → 지원결과 → 진행내역까지 전체를 표로 보고', '설비,지원,레거시vm,보고서', 'Y', 'N', 'choi'),
    (22, 'EQUIP_FAILURE_REPAIR_KO', '고장수리 결과 보고서', 'EQUIPMENT', 'VELOCITY', 'ko_KR', null, 'ACTIVE', 'D005', 'kang', '레거시 .vm 자산 이관. 원인분석 · 교체부품 · 작업자 공수까지 포함한 수리 보고', '설비,고장수리,레거시vm,보고서', 'Y', 'N', 'kang'),
    (23, 'EQUIP_MODIFICATION_KO', '설비 개조/개선 보고서', 'EQUIPMENT', 'VELOCITY', 'ko_KR', null, 'ACTIVE', 'D005', 'choi', '레거시 .vm 자산 이관. 개조 목적 · 내용 · 비용 · 개선 효과 보고', '설비,개조,개선,레거시vm', 'Y', 'N', 'choi'),
    (24, 'EQUIP_SETUP_RELEASE_KO', '설비 셋업/해제 보고서', 'EQUIPMENT', 'VELOCITY', 'ko_KR', null, 'ACTIVE', 'D005', 'kang', '레거시 .vm 자산 이관. 목적 · 일정 · 진행률 · 검수 결과 보고', '설비,셋업,해제,레거시vm', 'Y', 'N', 'kang');

-- ---------------------------------------------------------------------
-- 템플릿 본문 버전  (본문 수정 = UPDATE 가 아니라 새 행 INSERT)
-- ---------------------------------------------------------------------
INSERT INTO MAIL_TEMPLATE_VERSION
    (VERSION_ID, TEMPLATE_ID, VERSION_NO, SUBJECT, PREHEADER, BODY_HTML, BODY_TEXT,
     ENGINE_TYPE, LAYOUT_ID, STATUS_CODE, CHANGE_NOTE, APPROVED_BY, APPROVED_DT, REG_ID, REG_DT)
VALUES
    (101, 1, 1, '[결재요청] ${docTitle}', '결재 대기 문서가 있습니다',
     '<h2 style="margin:0 0 14px;font-size:19px;color:#212529;">결재 요청</h2><p>${drafterName} 님이 결재를 요청했습니다.</p>',
     '${drafterName} 님이 결재를 요청했습니다. ${actionUrl}',
     'VELOCITY', 1, 'ARCHIVED', '최초 등록', 'admin', NOW(), 'lee', '2026-03-11 11:00:00');

INSERT INTO MAIL_TEMPLATE_VERSION
    (VERSION_ID, TEMPLATE_ID, VERSION_NO, SUBJECT, PREHEADER, BODY_HTML, BODY_TEXT,
     ENGINE_TYPE, LAYOUT_ID, STATUS_CODE, CHANGE_NOTE, APPROVED_BY, APPROVED_DT, REG_ID, REG_DT)
VALUES
    (102, 1, 2, '[결재요청] ${docTitle}', '${drafterName}님이 결재를 요청했습니다 · ${dueDate}까지',
     '<h2 style="margin:0 0 14px;font-size:19px;color:#212529;">결재 요청</h2><p><strong>${drafterName}</strong> 님이 결재를 요청했습니다.</p><table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fa;font-size:13px;"><tr><td width="110" style="color:#6c757d;padding:7px 10px;border-bottom:1px solid #e9ecef;">문서번호</td><td style="padding:7px 10px;border-bottom:1px solid #e9ecef;">${docNo}</td></tr><tr><td width="110" style="color:#6c757d;padding:7px 10px;border-bottom:1px solid #e9ecef;">제목</td><td style="padding:7px 10px;border-bottom:1px solid #e9ecef;font-weight:700;">${docTitle}</td></tr><tr><td width="110" style="color:#6c757d;padding:7px 10px;border-bottom:1px solid #e9ecef;">기안부서</td><td style="padding:7px 10px;border-bottom:1px solid #e9ecef;">${draftDept}</td></tr><tr><td width="110" style="color:#6c757d;padding:7px 10px;border-bottom:1px solid #e9ecef;">기안일</td><td style="padding:7px 10px;border-bottom:1px solid #e9ecef;">${draftDate}</td></tr><tr><td width="110" style="color:#6c757d;padding:7px 10px;border-bottom:1px solid #e9ecef;">처리기한</td><td style="padding:7px 10px;border-bottom:1px solid #e9ecef;">${dueDate}</td></tr></table>#if($urgency == "긴급")<p style="margin-top:12px;color:#dc2626;font-weight:700;">⚠ 긴급 문서입니다. 당일 처리해 주세요.</p>#end<table class="cta-table" role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0;"><tr><td class="cta-cell" align="left"><!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${actionUrl}" style="height:46px;v-text-anchor:middle;width:176px;" arcsize="13%" strokecolor="#1d4ed8" fillcolor="#2563eb"><w:anchorlock/><center style="color:#ffffff;font-family:''Malgun Gothic'',sans-serif;font-size:14px;font-weight:bold;">결재하러 가기</center></v:roundrect><![endif]--><!--[if !mso]><!-- --><a class="cta-btn" href="${actionUrl}" style="display:inline-block;box-sizing:border-box;min-width:176px;padding:14px 26px;background:#2563eb;border:1px solid #1d4ed8;border-radius:8px;color:#ffffff;font-size:14px;font-weight:700;line-height:18px;mso-line-height-rule:exactly;text-align:center;text-decoration:none;letter-spacing:-0.2px;">결재하러 가기 &rarr;</a><!--<![endif]--></td><td class="cta-gap" width="10" style="width:10px;font-size:0;line-height:0;">&nbsp;</td><td class="cta-cell" align="left"><!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${docViewUrl}" style="height:46px;v-text-anchor:middle;width:176px;" arcsize="13%" strokecolor="#cbd5e1" fillcolor="#ffffff"><w:anchorlock/><center style="color:#334155;font-family:''Malgun Gothic'',sans-serif;font-size:14px;font-weight:bold;">문서 미리보기</center></v:roundrect><![endif]--><!--[if !mso]><!-- --><a class="cta-btn" href="${docViewUrl}" style="display:inline-block;box-sizing:border-box;min-width:176px;padding:14px 26px;background:#ffffff;border:1px solid #cbd5e1;border-radius:8px;color:#334155;font-size:14px;font-weight:700;line-height:18px;mso-line-height-rule:exactly;text-align:center;text-decoration:none;letter-spacing:-0.2px;">문서 미리보기</a><!--<![endif]--></td></tr></table><p style="font-size:12px;color:#94a3b8;margin:0;">전체 대기 문서는 <a href="${listUrl}" style="color:#94a3b8;">결재함</a>에서 확인하세요.</p>',
     '${drafterName} 님이 결재를 요청했습니다.
문서: ${docNo} ${docTitle}
처리기한: ${dueDate}
결재하기: ${actionUrl}',
     'VELOCITY', 1, 'ACTIVE', '긴급도 표시 + 반려 바로가기 링크 추가', 'admin', NOW(), 'lee', '2026-06-21 09:12:00');

INSERT INTO MAIL_TEMPLATE_VERSION
    (VERSION_ID, TEMPLATE_ID, VERSION_NO, SUBJECT, PREHEADER, BODY_HTML, BODY_TEXT,
     ENGINE_TYPE, LAYOUT_ID, STATUS_CODE, CHANGE_NOTE, APPROVED_BY, APPROVED_DT, REG_ID, REG_DT)
VALUES
    (201, 2, 1, '[결재${resultText}] ${docTitle}', '결재 결과를 확인하세요',
     '<h2 style="margin:0 0 14px;font-size:19px;">결재 <span th:text="${resultText}">승인</span></h2><p>기안하신 문서 <strong th:text="${docTitle}">문서제목</strong> 이(가) <span th:text="${resultText}">승인</span> 처리되었습니다.</p><p th:if="${comment}" style="background:#f8f9fa;padding:12px;border-left:3px solid #2563eb;">결재 의견: <span th:text="${comment}"></span></p><table class="cta-table" role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0;"><tr><td class="cta-cell" align="left"><!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${actionUrl}" style="height:46px;v-text-anchor:middle;width:176px;" arcsize="13%" strokecolor="#1d4ed8" fillcolor="#2563eb"><w:anchorlock/><center style="color:#ffffff;font-family:''Malgun Gothic'',sans-serif;font-size:14px;font-weight:bold;">문서 확인하기</center></v:roundrect><![endif]--><!--[if !mso]><!-- --><a class="cta-btn" href="${actionUrl}" style="display:inline-block;box-sizing:border-box;min-width:176px;padding:14px 26px;background:#2563eb;border:1px solid #1d4ed8;border-radius:8px;color:#ffffff;font-size:14px;font-weight:700;line-height:18px;mso-line-height-rule:exactly;text-align:center;text-decoration:none;letter-spacing:-0.2px;">문서 확인하기 &rarr;</a><!--<![endif]--></td></tr></table><p style="font-size:12px;color:#6c757d;">반려된 문서는 위 화면에서 바로 수정 후 재기안할 수 있습니다.</p>',
     '문서 ${docTitle} 이(가) ${resultText} 처리되었습니다. ${actionUrl}',
     'THYMELEAF', 1, 'ACTIVE', '최초 등록 (Thymeleaf 문법 예시)', 'admin', NOW(), 'lee', '2026-03-11 11:20:00');

INSERT INTO MAIL_TEMPLATE_VERSION
    (VERSION_ID, TEMPLATE_ID, VERSION_NO, SUBJECT, PREHEADER, BODY_HTML, BODY_TEXT,
     ENGINE_TYPE, LAYOUT_ID, STATUS_CODE, CHANGE_NOTE, APPROVED_BY, APPROVED_DT, REG_ID, REG_DT)
VALUES
    (301, 3, 2, '[의뢰접수] ${requestNo} ${requestTitle}', '${requesterName}님이 업무를 의뢰했습니다',
     '<h2 style="margin:0 0 14px;font-size:19px;color:#212529;">업무 의뢰가 접수되었습니다</h2><p><strong>${requesterName}</strong> 님이 업무를 의뢰했습니다. 내용 확인 후 접수 처리해 주세요.</p><table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fa;font-size:13px;"><tr><td width="110" style="color:#6c757d;padding:7px 10px;border-bottom:1px solid #e9ecef;">의뢰번호</td><td style="padding:7px 10px;border-bottom:1px solid #e9ecef;">${requestNo}</td></tr><tr><td width="110" style="color:#6c757d;padding:7px 10px;border-bottom:1px solid #e9ecef;">제목</td><td style="padding:7px 10px;border-bottom:1px solid #e9ecef;font-weight:700;">${requestTitle}</td></tr><tr><td width="110" style="color:#6c757d;padding:7px 10px;border-bottom:1px solid #e9ecef;">의뢰부서</td><td style="padding:7px 10px;border-bottom:1px solid #e9ecef;">${requesterDept}</td></tr><tr><td width="110" style="color:#6c757d;padding:7px 10px;border-bottom:1px solid #e9ecef;">요청유형</td><td style="padding:7px 10px;border-bottom:1px solid #e9ecef;">${requestType}</td></tr><tr><td width="110" style="color:#6c757d;padding:7px 10px;border-bottom:1px solid #e9ecef;">희망완료일</td><td style="padding:7px 10px;border-bottom:1px solid #e9ecef;">${dueDate}</td></tr></table><p style="margin-top:14px;white-space:pre-line;">${requestContent}</p>#if($attachments && $attachments.size() > 0)<p style="margin-top:12px;font-weight:700;font-size:13px;">첨부 파일</p><ul style="margin:4px 0 0;padding-left:18px;font-size:13px;">#foreach($file in $attachments)<li><a href="${file.url}">${file.name}</a></li>#end</ul>#end<table class="cta-table" role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0;"><tr><td class="cta-cell" align="left"><!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${actionUrl}" style="height:46px;v-text-anchor:middle;width:176px;" arcsize="13%" strokecolor="#1d4ed8" fillcolor="#2563eb"><w:anchorlock/><center style="color:#ffffff;font-family:''Malgun Gothic'',sans-serif;font-size:14px;font-weight:bold;">의뢰 접수 처리</center></v:roundrect><![endif]--><!--[if !mso]><!-- --><a class="cta-btn" href="${actionUrl}" style="display:inline-block;box-sizing:border-box;min-width:176px;padding:14px 26px;background:#2563eb;border:1px solid #1d4ed8;border-radius:8px;color:#ffffff;font-size:14px;font-weight:700;line-height:18px;mso-line-height-rule:exactly;text-align:center;text-decoration:none;letter-spacing:-0.2px;">의뢰 접수 처리 &rarr;</a><!--<![endif]--></td><td class="cta-gap" width="10" style="width:10px;font-size:0;line-height:0;">&nbsp;</td><td class="cta-cell" align="left"><!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${listUrl}" style="height:46px;v-text-anchor:middle;width:176px;" arcsize="13%" strokecolor="#cbd5e1" fillcolor="#ffffff"><w:anchorlock/><center style="color:#334155;font-family:''Malgun Gothic'',sans-serif;font-size:14px;font-weight:bold;">의뢰 목록</center></v:roundrect><![endif]--><!--[if !mso]><!-- --><a class="cta-btn" href="${listUrl}" style="display:inline-block;box-sizing:border-box;min-width:176px;padding:14px 26px;background:#ffffff;border:1px solid #cbd5e1;border-radius:8px;color:#334155;font-size:14px;font-weight:700;line-height:18px;mso-line-height-rule:exactly;text-align:center;text-decoration:none;letter-spacing:-0.2px;">의뢰 목록</a><!--<![endif]--></td></tr></table><p style="font-size:12px;color:#94a3b8;margin:0;">접수 후 담당자를 배정하면 의뢰자에게 자동으로 알림이 갑니다.</p>',
     '${requesterName} 님의 업무 의뢰가 접수되었습니다.
${requestNo} ${requestTitle}
희망완료일: ${dueDate}
접수 처리: ${actionUrl}',
     'VELOCITY', 1, 'ACTIVE', '첨부 파일 목록(#foreach) 및 접수 버튼 추가', 'admin', NOW(), 'kim', '2026-08-01 16:40:00');

INSERT INTO MAIL_TEMPLATE_VERSION
    (VERSION_ID, TEMPLATE_ID, VERSION_NO, SUBJECT, PREHEADER, BODY_HTML, BODY_TEXT,
     ENGINE_TYPE, LAYOUT_ID, STATUS_CODE, CHANGE_NOTE, APPROVED_BY, APPROVED_DT, REG_ID, REG_DT)
VALUES
    (401, 4, 1, '[담당배정] ${requestNo} ${requestTitle}', '${assigneeName}님이 담당자로 배정되었습니다',
     '<h2 style="margin:0 0 14px;font-size:19px;color:#212529;">담당자로 배정되었습니다</h2><p>${assigneeName} 님, 아래 업무의 담당자로 배정되었습니다.</p><table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fa;font-size:13px;"><tr><td width="110" style="color:#6c757d;padding:7px 10px;border-bottom:1px solid #e9ecef;">의뢰번호</td><td style="padding:7px 10px;border-bottom:1px solid #e9ecef;">${requestNo}</td></tr><tr><td width="110" style="color:#6c757d;padding:7px 10px;border-bottom:1px solid #e9ecef;">제목</td><td style="padding:7px 10px;border-bottom:1px solid #e9ecef;font-weight:700;">${requestTitle}</td></tr><tr><td width="110" style="color:#6c757d;padding:7px 10px;border-bottom:1px solid #e9ecef;">의뢰자</td><td style="padding:7px 10px;border-bottom:1px solid #e9ecef;">${requesterName}</td></tr><tr><td width="110" style="color:#6c757d;padding:7px 10px;border-bottom:1px solid #e9ecef;">배정자</td><td style="padding:7px 10px;border-bottom:1px solid #e9ecef;">${assignerName}</td></tr><tr><td width="110" style="color:#6c757d;padding:7px 10px;border-bottom:1px solid #e9ecef;">처리기한</td><td style="padding:7px 10px;border-bottom:1px solid #e9ecef;">${dueDate}</td></tr></table><table class="cta-table" role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0;"><tr><td class="cta-cell" align="left"><!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${actionUrl}" style="height:46px;v-text-anchor:middle;width:176px;" arcsize="13%" strokecolor="#1d4ed8" fillcolor="#2563eb"><w:anchorlock/><center style="color:#ffffff;font-family:''Malgun Gothic'',sans-serif;font-size:14px;font-weight:bold;">작업 시작하기</center></v:roundrect><![endif]--><!--[if !mso]><!-- --><a class="cta-btn" href="${actionUrl}" style="display:inline-block;box-sizing:border-box;min-width:176px;padding:14px 26px;background:#2563eb;border:1px solid #1d4ed8;border-radius:8px;color:#ffffff;font-size:14px;font-weight:700;line-height:18px;mso-line-height-rule:exactly;text-align:center;text-decoration:none;letter-spacing:-0.2px;">작업 시작하기 &rarr;</a><!--<![endif]--></td><td class="cta-gap" width="10" style="width:10px;font-size:0;line-height:0;">&nbsp;</td><td class="cta-cell" align="left"><!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${rejectUrl}" style="height:46px;v-text-anchor:middle;width:176px;" arcsize="13%" strokecolor="#cbd5e1" fillcolor="#ffffff"><w:anchorlock/><center style="color:#334155;font-family:''Malgun Gothic'',sans-serif;font-size:14px;font-weight:bold;">배정 반려</center></v:roundrect><![endif]--><!--[if !mso]><!-- --><a class="cta-btn" href="${rejectUrl}" style="display:inline-block;box-sizing:border-box;min-width:176px;padding:14px 26px;background:#ffffff;border:1px solid #cbd5e1;border-radius:8px;color:#334155;font-size:14px;font-weight:700;line-height:18px;mso-line-height-rule:exactly;text-align:center;text-decoration:none;letter-spacing:-0.2px;">배정 반려</a><!--<![endif]--></td></tr></table><p style="font-size:12px;color:#94a3b8;margin:0;">담당이 맞지 않으면 반려 사유와 함께 반송해 주세요.</p>',
     '${assigneeName} 님, ${requestNo} ${requestTitle} 담당자로 배정되었습니다.
처리기한: ${dueDate}
작업 시작: ${actionUrl}',
     'VELOCITY', 1, 'ACTIVE', '최초 등록', 'admin', NOW(), 'kim', '2026-02-10 09:00:00');

INSERT INTO MAIL_TEMPLATE_VERSION
    (VERSION_ID, TEMPLATE_ID, VERSION_NO, SUBJECT, PREHEADER, BODY_HTML, BODY_TEXT,
     ENGINE_TYPE, LAYOUT_ID, STATUS_CODE, CHANGE_NOTE, APPROVED_BY, APPROVED_DT, REG_ID, REG_DT)
VALUES
    (501, 5, 1, '[지연알림] 미처리 업무 ${delayCount}건이 기한을 초과했습니다', '즉시 처리가 필요합니다',
     '<h2 style="margin:0 0 14px;font-size:19px;color:#212529;">처리 기한이 지난 업무가 있습니다</h2><p>${assigneeName} 님이 담당 중인 업무 <strong style="color:#dc2626;">${delayCount}건</strong>이 기한을 넘겼습니다.</p><table width="100%" cellpadding="8" cellspacing="0" style="border-top:2px solid #212529;font-size:13px;"><tr style="background:#f8f9fa;"><th align="left">의뢰번호</th><th align="left">제목</th><th align="right">지연</th></tr>#foreach($item in $delayedItems)<tr style="border-bottom:1px solid #dee2e6;"><td><a href="${item.url}">${item.requestNo}</a></td><td>${item.title}</td><td align="right" style="color:#dc2626;font-weight:700;">${item.delayDays}일</td></tr>#end</table><table class="cta-table" role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0;"><tr><td class="cta-cell" align="left"><!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${actionUrl}" style="height:46px;v-text-anchor:middle;width:209px;" arcsize="13%" strokecolor="#b91c1c" fillcolor="#dc2626"><w:anchorlock/><center style="color:#ffffff;font-family:''Malgun Gothic'',sans-serif;font-size:14px;font-weight:bold;">미처리 업무 처리하기</center></v:roundrect><![endif]--><!--[if !mso]><!-- --><a class="cta-btn" href="${actionUrl}" style="display:inline-block;box-sizing:border-box;min-width:209px;padding:14px 26px;background:#dc2626;border:1px solid #b91c1c;border-radius:8px;color:#ffffff;font-size:14px;font-weight:700;line-height:18px;mso-line-height-rule:exactly;text-align:center;text-decoration:none;letter-spacing:-0.2px;">미처리 업무 처리하기 &rarr;</a><!--<![endif]--></td></tr></table><p style="font-size:12px;color:#6c757d;">기한 연장이 필요하면 각 의뢰 화면에서 사유와 함께 신청해 주세요.</p>',
     '미처리 업무 ${delayCount}건이 기한을 초과했습니다. ${actionUrl}',
     'VELOCITY', 1, 'ACTIVE', '최초 등록', 'admin', NOW(), 'park', '2026-04-02 08:00:00');

INSERT INTO MAIL_TEMPLATE_VERSION
    (VERSION_ID, TEMPLATE_ID, VERSION_NO, SUBJECT, PREHEADER, BODY_HTML, BODY_TEXT,
     ENGINE_TYPE, LAYOUT_ID, STATUS_CODE, CHANGE_NOTE, APPROVED_BY, APPROVED_DT, REG_ID, REG_DT)
VALUES
    (701, 7, 1, '[설비경고] ${equipName} ${alertType} 임계치 초과', '즉시 확인이 필요합니다',
     '<div style="background:#fef2f2;border-left:4px solid #dc2626;padding:12px 14px;margin-bottom:16px;"><strong style="color:#dc2626;font-size:15px;">설비 이상 감지</strong></div><table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fa;font-size:13px;"><tr><td width="110" style="color:#6c757d;padding:7px 10px;border-bottom:1px solid #e9ecef;">설비명</td><td style="padding:7px 10px;border-bottom:1px solid #e9ecef;font-weight:700;">${equipName}</td></tr><tr><td width="110" style="color:#6c757d;padding:7px 10px;border-bottom:1px solid #e9ecef;">위치</td><td style="padding:7px 10px;border-bottom:1px solid #e9ecef;">${location}</td></tr><tr><td width="110" style="color:#6c757d;padding:7px 10px;border-bottom:1px solid #e9ecef;">경고유형</td><td style="padding:7px 10px;border-bottom:1px solid #e9ecef;">${alertType}</td></tr><tr><td width="110" style="color:#6c757d;padding:7px 10px;border-bottom:1px solid #e9ecef;">측정값</td><td style="padding:7px 10px;border-bottom:1px solid #e9ecef;">${currentValue} (임계치 ${threshold})</td></tr><tr><td width="110" style="color:#6c757d;padding:7px 10px;border-bottom:1px solid #e9ecef;">감지시각</td><td style="padding:7px 10px;border-bottom:1px solid #e9ecef;">${detectedAt}</td></tr></table><table class="cta-table" role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0;"><tr><td class="cta-cell" align="left"><!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${actionUrl}" style="height:46px;v-text-anchor:middle;width:194px;" arcsize="13%" strokecolor="#b91c1c" fillcolor="#dc2626"><w:anchorlock/><center style="color:#ffffff;font-family:''Malgun Gothic'',sans-serif;font-size:14px;font-weight:bold;">모니터링 화면 확인</center></v:roundrect><![endif]--><!--[if !mso]><!-- --><a class="cta-btn" href="${actionUrl}" style="display:inline-block;box-sizing:border-box;min-width:194px;padding:14px 26px;background:#dc2626;border:1px solid #b91c1c;border-radius:8px;color:#ffffff;font-size:14px;font-weight:700;line-height:18px;mso-line-height-rule:exactly;text-align:center;text-decoration:none;letter-spacing:-0.2px;">모니터링 화면 확인 &rarr;</a><!--<![endif]--></td><td class="cta-gap" width="10" style="width:10px;font-size:0;line-height:0;">&nbsp;</td><td class="cta-cell" align="left"><!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${supportUrl}" style="height:46px;v-text-anchor:middle;width:176px;" arcsize="13%" strokecolor="#cbd5e1" fillcolor="#ffffff"><w:anchorlock/><center style="color:#334155;font-family:''Malgun Gothic'',sans-serif;font-size:14px;font-weight:bold;">지원 요청 등록</center></v:roundrect><![endif]--><!--[if !mso]><!-- --><a class="cta-btn" href="${supportUrl}" style="display:inline-block;box-sizing:border-box;min-width:176px;padding:14px 26px;background:#ffffff;border:1px solid #cbd5e1;border-radius:8px;color:#334155;font-size:14px;font-weight:700;line-height:18px;mso-line-height-rule:exactly;text-align:center;text-decoration:none;letter-spacing:-0.2px;">지원 요청 등록</a><!--<![endif]--></td></tr></table><p style="font-size:12px;color:#94a3b8;margin:0;">임계치 초과가 30분 이상 지속되면 자동으로 재알림이 발송됩니다.</p>',
     '[설비경고] ${equipName} ${alertType} 임계치 초과
측정값 ${currentValue} / 임계치 ${threshold}
확인: ${actionUrl}',
     'VELOCITY', 1, 'ACTIVE', '최초 등록', 'admin', NOW(), 'choi', '2026-03-02 15:10:00');

INSERT INTO MAIL_TEMPLATE_VERSION
    (VERSION_ID, TEMPLATE_ID, VERSION_NO, SUBJECT, PREHEADER, BODY_HTML, BODY_TEXT,
     ENGINE_TYPE, LAYOUT_ID, STATUS_CODE, CHANGE_NOTE, APPROVED_BY, APPROVED_DT, REG_ID, REG_DT)
VALUES
    (901, 9, 1, '[승인요청] ${applicantName}님의 ${permissionName} 권한 신청', '권한 신청 승인 대기 중입니다',
     '<h2 style="margin:0 0 14px;font-size:19px;color:#212529;">권한 신청 승인 요청</h2><p><strong>${applicantName}</strong> 님이 권한을 신청했습니다. 검토 후 처리해 주세요.</p><table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fa;font-size:13px;"><tr><td width="110" style="color:#6c757d;padding:7px 10px;border-bottom:1px solid #e9ecef;">신청자</td><td style="padding:7px 10px;border-bottom:1px solid #e9ecef;font-weight:700;">${applicantName}</td></tr><tr><td width="110" style="color:#6c757d;padding:7px 10px;border-bottom:1px solid #e9ecef;">소속</td><td style="padding:7px 10px;border-bottom:1px solid #e9ecef;">${applicantDept}</td></tr><tr><td width="110" style="color:#6c757d;padding:7px 10px;border-bottom:1px solid #e9ecef;">신청권한</td><td style="padding:7px 10px;border-bottom:1px solid #e9ecef;">${permissionName}</td></tr><tr><td width="110" style="color:#6c757d;padding:7px 10px;border-bottom:1px solid #e9ecef;">신청사유</td><td style="padding:7px 10px;border-bottom:1px solid #e9ecef;">${reason}</td></tr><tr><td width="110" style="color:#6c757d;padding:7px 10px;border-bottom:1px solid #e9ecef;">신청일</td><td style="padding:7px 10px;border-bottom:1px solid #e9ecef;">${appliedAt}</td></tr></table><table class="cta-table" role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0;"><tr><td class="cta-cell" align="left"><!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${actionUrl}" style="height:46px;v-text-anchor:middle;width:176px;" arcsize="13%" strokecolor="#1d4ed8" fillcolor="#2563eb"><w:anchorlock/><center style="color:#ffffff;font-family:''Malgun Gothic'',sans-serif;font-size:14px;font-weight:bold;">승인 처리하기</center></v:roundrect><![endif]--><!--[if !mso]><!-- --><a class="cta-btn" href="${actionUrl}" style="display:inline-block;box-sizing:border-box;min-width:176px;padding:14px 26px;background:#2563eb;border:1px solid #1d4ed8;border-radius:8px;color:#ffffff;font-size:14px;font-weight:700;line-height:18px;mso-line-height-rule:exactly;text-align:center;text-decoration:none;letter-spacing:-0.2px;">승인 처리하기 &rarr;</a><!--<![endif]--></td></tr></table><p style="font-size:12px;color:#6c757d;">권한 체계는 <a href="${listUrl}">메뉴 및 권한 관리</a>에서 확인할 수 있습니다.</p>',
     '${applicantName} 님이 ${permissionName} 권한을 신청했습니다. 승인: ${actionUrl}',
     'VELOCITY', 1, 'ACTIVE', '최초 등록', 'admin', NOW(), 'hong', '2026-01-12 09:20:00');

INSERT INTO MAIL_TEMPLATE_VERSION
    (VERSION_ID, TEMPLATE_ID, VERSION_NO, SUBJECT, PREHEADER, BODY_HTML, BODY_TEXT,
     ENGINE_TYPE, LAYOUT_ID, STATUS_CODE, CHANGE_NOTE, APPROVED_BY, APPROVED_DT, REG_ID, REG_DT)
VALUES
    (1001, 10, 1, '[NexHub] 비밀번호 재설정 안내', '30분 내 링크를 사용해 주세요',
     '<h2 style="margin:0 0 14px;font-size:19px;color:#212529;">비밀번호 재설정</h2><p>${userName} 님, 아래 버튼을 눌러 비밀번호를 재설정해 주세요.</p><table class="cta-table" role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0;"><tr><td class="cta-cell" align="left"><!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${actionUrl}" style="height:46px;v-text-anchor:middle;width:179px;" arcsize="13%" strokecolor="#b91c1c" fillcolor="#dc2626"><w:anchorlock/><center style="color:#ffffff;font-family:''Malgun Gothic'',sans-serif;font-size:14px;font-weight:bold;">비밀번호 재설정</center></v:roundrect><![endif]--><!--[if !mso]><!-- --><a class="cta-btn" href="${actionUrl}" style="display:inline-block;box-sizing:border-box;min-width:179px;padding:14px 26px;background:#dc2626;border:1px solid #b91c1c;border-radius:8px;color:#ffffff;font-size:14px;font-weight:700;line-height:18px;mso-line-height-rule:exactly;text-align:center;text-decoration:none;letter-spacing:-0.2px;">비밀번호 재설정 &rarr;</a><!--<![endif]--></td></tr></table><p style="color:#dc2626;font-size:13px;">이 링크는 ${expireMinutes}분 후 만료됩니다. 본인이 요청하지 않았다면 즉시 IT지원팀으로 연락해 주세요.</p>',
     '비밀번호 재설정: ${actionUrl} (${expireMinutes}분 후 만료)',
     'VELOCITY', 1, 'ACTIVE', '최초 등록', 'admin', NOW(), 'hong', '2026-01-12 09:35:00');

INSERT INTO MAIL_TEMPLATE_VERSION
    (VERSION_ID, TEMPLATE_ID, VERSION_NO, SUBJECT, PREHEADER, BODY_HTML, BODY_TEXT,
     ENGINE_TYPE, LAYOUT_ID, STATUS_CODE, CHANGE_NOTE, APPROVED_BY, APPROVED_DT, REG_ID, REG_DT)
VALUES
    (1101, 11, 1, '[공지] ${noticeTitle}', '${writerName} · ${postedAt}',
     '<h2 style="margin:0 0 14px;font-size:19px;color:#212529;">${noticeTitle}</h2><p style="color:#6c757d;font-size:12px;margin-top:-8px;">${writerName} · ${postedAt}</p><p style="margin-top:14px;white-space:pre-line;">${noticeSummary}</p><table class="cta-table" role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0;"><tr><td class="cta-cell" align="left"><!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${actionUrl}" style="height:46px;v-text-anchor:middle;width:176px;" arcsize="13%" strokecolor="#1d4ed8" fillcolor="#2563eb"><w:anchorlock/><center style="color:#ffffff;font-family:''Malgun Gothic'',sans-serif;font-size:14px;font-weight:bold;">공지 전문 보기</center></v:roundrect><![endif]--><!--[if !mso]><!-- --><a class="cta-btn" href="${actionUrl}" style="display:inline-block;box-sizing:border-box;min-width:176px;padding:14px 26px;background:#2563eb;border:1px solid #1d4ed8;border-radius:8px;color:#ffffff;font-size:14px;font-weight:700;line-height:18px;mso-line-height-rule:exactly;text-align:center;text-decoration:none;letter-spacing:-0.2px;">공지 전문 보기 &rarr;</a><!--<![endif]--></td></tr></table>#if($requireConfirm)<p style="background:#fef3c7;padding:10px 12px;font-size:13px;">이 공지는 <strong>확인 응답이 필요한 공지</strong>입니다. 위 화면에서 확인 버튼을 눌러주세요.</p>#end',
     '[공지] ${noticeTitle}
${noticeSummary}
전문 보기: ${actionUrl}',
     'VELOCITY', 1, 'ACTIVE', '최초 등록', 'admin', NOW(), 'park', '2026-02-18 10:00:00');

INSERT INTO MAIL_TEMPLATE_VERSION
    (VERSION_ID, TEMPLATE_ID, VERSION_NO, SUBJECT, PREHEADER, BODY_HTML, BODY_TEXT,
     ENGINE_TYPE, LAYOUT_ID, STATUS_CODE, CHANGE_NOTE, APPROVED_BY, APPROVED_DT, REG_ID, REG_DT)
VALUES
    (1201, 12, 1, '[점검안내] ${maintDate} 시스템 정기 점검', '서비스 일시 중단 안내',
     '<h2 style="margin:0 0 14px;font-size:19px;color:#212529;">시스템 정기 점검 안내</h2><p>보다 안정적인 서비스 제공을 위해 아래와 같이 시스템 점검을 실시합니다.</p><table width="100%" cellpadding="8" cellspacing="0" style="background:#fef3c7;font-size:13px;"><tr><td width="110" style="color:#6c757d;">점검일시</td><td>${maintDate} ${maintTime}</td></tr><tr><td style="color:#6c757d;">점검대상</td><td>${maintTarget}</td></tr></table><p style="color:#6c757d;font-size:13px;margin-top:14px;">점검 시간 동안 서비스 이용이 제한됩니다. 양해 부탁드립니다.</p>',
     '시스템 점검 안내: ${maintDate} ${maintTime} / 대상: ${maintTarget}',
     'PLAIN', 1, 'DRAFT', '초안 작성 (승인 대기)', NULL, NULL, 'park', '2026-08-14 17:30:00');

INSERT INTO MAIL_TEMPLATE_VERSION
    (VERSION_ID, TEMPLATE_ID, VERSION_NO, SUBJECT, PREHEADER, BODY_HTML, BODY_TEXT,
     ENGINE_TYPE, LAYOUT_ID, STATUS_CODE, CHANGE_NOTE, APPROVED_BY, APPROVED_DT, REG_ID, REG_DT)
VALUES
    (1301, 13, 4, '[주간리포트] ${weekLabel} 미처리 현황', '팀 미처리 업무 요약',
     '<h2 style="margin:0 0 14px;font-size:19px;color:#212529;">${weekLabel} 미처리 현황</h2><p>${teamName} 미처리 업무 <strong>${totalCount}건</strong> (지연 ${delayCount}건)</p><table width="100%" cellpadding="8" cellspacing="0" style="border-top:2px solid #212529;font-size:13px;"><tr style="background:#f8f9fa;"><th align="left">담당자</th><th align="right">미처리</th><th align="right">지연</th></tr>#foreach($member in $members)<tr style="border-bottom:1px solid #dee2e6;"><td>${member.name}</td><td align="right">${member.pending}</td><td align="right" style="color:#dc2626;">${member.delayed}</td></tr>#end</table><table class="cta-table" role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0;"><tr><td class="cta-cell" align="left"><!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${actionUrl}" style="height:46px;v-text-anchor:middle;width:194px;" arcsize="13%" strokecolor="#1d4ed8" fillcolor="#2563eb"><w:anchorlock/><center style="color:#ffffff;font-family:''Malgun Gothic'',sans-serif;font-size:14px;font-weight:bold;">대시보드에서 보기</center></v:roundrect><![endif]--><!--[if !mso]><!-- --><a class="cta-btn" href="${actionUrl}" style="display:inline-block;box-sizing:border-box;min-width:194px;padding:14px 26px;background:#2563eb;border:1px solid #1d4ed8;border-radius:8px;color:#ffffff;font-size:14px;font-weight:700;line-height:18px;mso-line-height-rule:exactly;text-align:center;text-decoration:none;letter-spacing:-0.2px;">대시보드에서 보기 &rarr;</a><!--<![endif]--></td></tr></table>',
     '${weekLabel} ${teamName} 미처리 ${totalCount}건 / 지연 ${delayCount}건. ${actionUrl}',
     'VELOCITY', 1, 'ARCHIVED', '대시보드 링크 방식으로 대체하여 보관 처리', 'admin', NOW(), 'park', '2026-01-05 10:00:00');

INSERT INTO MAIL_TEMPLATE_VERSION
    (VERSION_ID, TEMPLATE_ID, VERSION_NO, SUBJECT, PREHEADER, BODY_HTML, BODY_TEXT,
     ENGINE_TYPE, LAYOUT_ID, STATUS_CODE, CHANGE_NOTE, APPROVED_BY, APPROVED_DT, REG_ID, REG_DT)
VALUES
    (2101, 21, 1, '[설비지원] ${formData.requestNo} ${formData.title}', '설비지원 진행 결과를 확인해 주세요',
     '<style>body {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        h3 {
            color: #0d47a1;
            border-bottom: 2px solid #0d47a1;
            padding-bottom: 10px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            font-family: ''Malgun Gothic'', Dotum, Arial, sans-serif;
            font-size: 13px;
            border: 1px solid #b0c4de;
        }
        th, td {
            border: 1px solid #b0c4de;
            padding: 10px;
            vertical-align: middle;
        }
        th {
            background-color: #eaf4fa;
            color: #2c3e50;
            text-align: center;
            font-weight: bold;
        }
        .text-center { text-align: center; }
        .text-end { text-align: right; }
        .mb-3 { margin-bottom: 1rem; }
        .sub-header { background-color: #d6eaf8 !important; }</style>


    <h3>설비지원</h3>
    <table>
        <colgroup>
            <col style="width: 15%" />
            <col style="width: 35%" />
            <col style="width: 15%" />
            <col style="width: 35%" />
        </colgroup>
        <tbody>
            <tr>
                <th>제목</th>
                <td colspan="3">${formData.title}</td>
            </tr>
            <tr>
                <th>요청번호</th>
                <td>${formData.requestNo}</td>
                <th>과제</th>
                <td>${formData.project}</td>
            </tr>
            <tr>
                <th>요청자</th>
                <td>${formData.requester}</td>
                <th>완료요청일</th>
                <td>${formData.dueDate}</td>
            </tr>
             <tr>
                <th>디바이스명</th>
                <td>${formData.deviceName}</td>
                <th>위치</th>
                <td>${formData.location}</td>
            </tr>
            <tr>
                <th>내용</th>
                <td colspan="3">${formData.content}</td>
            </tr>
             <tr>
                <th>첨부파일</th>
                <td colspan="3">
                    #if($formData.files && $formData.files.size() > 0)
                        <ul>
                        #foreach($file in $formData.files)
                            <li>${file}</li>
                        #end
                        </ul>
                    #else
                        -
                    #end
                </td>
            </tr>


            <tr>
                <th>지원 유형</th>
                <td>${formData.supportType}</td>
                <th>승인 여부</th>
                <td>
                    #if($formData.approvalStatus == ''approved'') 승인
                    #elseif($formData.approvalStatus == ''rejected'') 반려
                    #else - #end
                </td>
            </tr>
            <tr>
                <th>완료 예정일</th>
                <td>${formData.expectedCompletionDate}</td>
                <th>처리 방식</th>
                <td>
                    ${formData.processingMethod}
                    #if($formData.outsourcingCompany) (${formData.outsourcingCompany}) #end
                </td>
            </tr>
             <tr>
                <th>접수 담당자</th>
                <td colspan="3">${formData.assignee}</td>
            </tr>
            <tr>
                <th>레시피</th>
                <td>${formData.recipe}</td>
                 <th>협의자</th>
                <td>${formData.consultants}</td>
            </tr>
             <tr>
                <th>접수 의견</th>
                <td colspan="3">${formData.receiveComment}</td>
            </tr>
             <tr>
                <th>첨부파일</th>
                <td colspan="3">
                     #if($formData.receiveFiles && $formData.receiveFiles.size() > 0)
                        <ul>
                        #foreach($file in $formData.receiveFiles)
                            <li>${file}</li>
                        #end
                        </ul>
                    #else
                        -
                    #end
                </td>
            </tr>

            <tr>
                <th>지원 내용</th>
                <td colspan="3">${formData.supportContent}</td>
            </tr>
            <tr>
                <th>소요 시간</th>
                <td colspan="3">${formData.supportTime}</td>
            </tr>
            <tr>
                <th>지원 인원</th>
                <td colspan="3">${formData.supportPersonnel} 명</td>
            </tr>
            <tr>
                <th>특이 사항</th>
                <td colspan="3">${formData.supportNotes}</td>
            </tr>
            <tr>
                <th>첨부파일</th>
                <td colspan="3">
                    #if($formData.supportFiles && $formData.supportFiles.size() > 0)
                        <ul>
                        #foreach($file in $formData.supportFiles)
                            <li>${file}</li>
                        #end
                        </ul>
                    #else
                        -
                    #end
                </td>
            </tr>
            <tr>
                <th>진행 내역</th>
                <td colspan="3">
                    #if($progressRows && $progressRows.size() > 0)
                    <table style="width: 100%; margin-top: 5px; border: 1px solid #b0c4de;">
                        <thead>
                            <tr>
                                <th class="sub-header">진행일자</th>
                                <th class="sub-header">진행내용</th>
                                <th class="sub-header">작업자</th>
                                <th class="sub-header">상태</th>
                                <th class="sub-header">비고</th>
                            </tr>
                        </thead>
                        <tbody>
                            #foreach($row in $progressRows)
                            <tr>
                                <td class="text-center">${row.progressDate}</td>
                                <td>${row.progressContent}</td>
                                <td class="text-center">${row.worker}</td>
                                <td class="text-center">${row.status}</td>
                                <td>${row.remark}</td>
                            </tr>
                            #end
                        </tbody>
                    </table>
                    #else
                        진행 내역 없음
                    #end
                </td>
            </tr>
            <tr>
                <th>첨부파일 1</th>
                <td colspan="3">
                    #if($resultFiles1 && $resultFiles1.size() > 0)
                        <ul>
                        #foreach($file in $resultFiles1)
                            <li>${file}</li>
                        #end
                        </ul>
                    #else
                        -
                    #end
                </td>
            </tr>
            <tr>
                <th>첨부파일 2</th>
                <td colspan="3">
                    #if($resultFiles2 && $resultFiles2.size() > 0)
                        <ul>
                        #foreach($file in $resultFiles2)
                            <li>${file}</li>
                        #end
                        </ul>
                    #else
                        -
                    #end
                </td>
            </tr>
        </tbody>
    </table>',
     '[설비지원 결과 보고서]
요청번호: ${formData.requestNo}
제목: ${formData.title}
요청자: ${formData.requester}
설비: ${formData.deviceName} (${formData.location})
담당자: ${formData.assignee}
HTML 을 지원하지 않는 환경입니다. 시스템에서 상세 내용을 확인해 주세요.',
     'VELOCITY', null, 'ACTIVE', '레거시 equipment-support-template.vm 원문 이관', 'admin', NOW(), 'choi', '2023-09-14 10:00:00');

INSERT INTO MAIL_TEMPLATE_VERSION
    (VERSION_ID, TEMPLATE_ID, VERSION_NO, SUBJECT, PREHEADER, BODY_HTML, BODY_TEXT,
     ENGINE_TYPE, LAYOUT_ID, STATUS_CODE, CHANGE_NOTE, APPROVED_BY, APPROVED_DT, REG_ID, REG_DT)
VALUES
    (2201, 22, 1, '[고장수리] ${formData.requestNo} ${formData.title}', '고장 원인과 조치 내역을 확인해 주세요',
     '<style>body {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        h3 {
            color: #0d47a1;
            border-bottom: 2px solid #0d47a1;
            padding-bottom: 10px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            font-family: ''Malgun Gothic'', Dotum, Arial, sans-serif;
            font-size: 13px;
            border: 1px solid #b0c4de;
        }
        th, td {
            border: 1px solid #b0c4de;
            padding: 10px;
            vertical-align: middle;
        }
        th {
            background-color: #eaf4fa;
            color: #2c3e50;
            text-align: center;
            font-weight: bold;
        }
        .text-center { text-align: center; }
        .text-end { text-align: right; }
        .mb-3 { margin-bottom: 1rem; }
        .sub-header { background-color: #d6eaf8 !important; }</style>


    <h3>고장수리</h3>
    <table>
        <colgroup>
            <col style="width: 15%" />
            <col style="width: 35%" />
            <col style="width: 15%" />
            <col style="width: 35%" />
        </colgroup>
        <tbody>
            <tr>
                <th>제목</th>
                <td colspan="3">${formData.title}</td>
            </tr>
            <tr>
                <th>요청번호</th>
                <td>${formData.requestNo}</td>
                <th>과제</th>
                <td>${formData.project}</td>
            </tr>
            <tr>
                <th>요청자</th>
                <td>${formData.requester}</td>
                <th>완료요청일</th>
                <td>${formData.dueDate}</td>
            </tr>
             <tr>
                <th>디바이스명</th>
                <td>${formData.deviceName}</td>
                <th>위치</th>
                <td>${formData.location}</td>
            </tr>
            <tr>
                <th>내용</th>
                <td colspan="3">${formData.content}</td>
            </tr>
             <tr>
                <th>첨부파일</th>
                <td colspan="3">
                    #if($formData.files && $formData.files.size() > 0)
                        <ul>
                        #foreach($file in $formData.files)
                            <li>${file}</li>
                        #end
                        </ul>
                    #else
                        -
                    #end
                </td>
            </tr>


            <tr>
                <th>지원 유형</th>
                <td>${formData.supportType}</td>
                <th>승인 여부</th>
                <td>
                    #if($formData.approvalStatus == ''approved'') 승인
                    #elseif($formData.approvalStatus == ''rejected'') 반려
                    #else - #end
                </td>
            </tr>
            <tr>
                <th>완료 예정일</th>
                <td>${formData.expectedCompletionDate}</td>
                <th>처리 방식</th>
                <td>
                    ${formData.processingMethod}
                    #if($formData.outsourcingCompany) (${formData.outsourcingCompany}) #end
                </td>
            </tr>
             <tr>
                <th>접수 담당자</th>
                <td colspan="3">${formData.assignee}</td>
            </tr>
            <tr>
                <th>레시피</th>
                <td>${formData.recipe}</td>
                 <th>협의자</th>
                <td>${formData.consultants}</td>
            </tr>
             <tr>
                <th>접수 의견</th>
                <td colspan="3">${formData.receiveComment}</td>
            </tr>
             <tr>
                <th>첨부파일</th>
                <td colspan="3">
                     #if($formData.receiveFiles && $formData.receiveFiles.size() > 0)
                        <ul>
                        #foreach($file in $formData.receiveFiles)
                            <li>${file}</li>
                        #end
                        </ul>
                    #else
                        -
                    #end
                </td>
            </tr>

            <tr>
                <th>업체담당자</th>
                <td>${formData.vendorManager}</td>
                <th>구매비용</th>
                <td>${formData.purchaseCost}</td>
            </tr>
            <tr>
                <th>과제</th>
                <td colspan="3">${formData.project}</td>
            </tr>
            <tr>
                <th>고장현황</th>
                <td colspan="3">${formData.failureStatus}</td>
            </tr>
            <tr>
                <th>주요원인</th>
                <td colspan="3">
                    <div style="margin-bottom: 5px;">
                        <strong>선택된 원인:</strong>
                        #if($formData.selectedCauses && $formData.selectedCauses.size() > 0)
                            #foreach($cause in $formData.selectedCauses)
                                <span style="display: inline-block; padding: 2px 5px; border: 1px solid #ccc; border-radius: 3px; margin-right: 5px;">${cause}</span>
                            #end
                        #else
                            -
                        #end
                    </div>
                    #if($formData.causeNote && $formData.causeNote.length() > 0)
                    <div><strong>비고:</strong> ${formData.causeNote}</div>
                    #end
                </td>
            </tr>
            <tr>
                <th>발생원인 상세</th>
                <td colspan="3">
                    #if($formData.causeRows && $formData.causeRows.size() > 0)
                    <ul>
                        #foreach($row in $formData.causeRows)
                            <li>${row.detail}</li>
                        #end
                    </ul>
                    #else
                        -
                    #end
                </td>
            </tr>
            <tr>
                <th>조치 수리역</th>
                <td colspan="3">${formData.repairAction}</td>
            </tr>
            <tr>
                <th>추가 대책</th>
                <td colspan="3">
                    #if($formData.selectedMeasures && $formData.selectedMeasures.size() > 0)
                    <table style="width: 100%; margin-top: 5px;">
                        <thead>
                            <tr>
                                <th class="sub-header">구분</th>
                                <th class="sub-header">상세내역</th>
                            </tr>
                        </thead>
                        <tbody>
                            #foreach($measure in $formData.selectedMeasures)
                            <tr>
                                <td class="text-center">${measure}</td>
                                <td>${formData.measureDetails.get($measure)}</td>
                            </tr>
                            #end
                        </tbody>
                    </table>
                    #else
                        -
                    #end
                </td>
            </tr>
            <tr>
                <th>사용부품</th>
                <td colspan="3">
                    #if($formData.partRows && $formData.partRows.size() > 0)
                    <table style="width: 100%; margin-top: 5px;">
                        <thead>
                            <tr>
                                <th class="sub-header">설비</th>
                                <th class="sub-header">부품명</th>
                                <th class="sub-header">Maker</th>
                                <th class="sub-header">규격</th>
                                <th class="sub-header">수량</th>
                                <th class="sub-header">출고일</th>
                            </tr>
                        </thead>
                        <tbody>
                            #foreach($row in $formData.partRows)
                            <tr>
                                <td>${row.equipment}</td>
                                <td>${row.name}</td>
                                <td>${row.maker}</td>
                                <td>${row.spec}</td>
                                <td class="text-center">${row.quantity}</td>
                                <td class="text-center">${row.releaseDate}</td>
                            </tr>
                            #end
                        </tbody>
                    </table>
                    #else
                        -
                    #end
                </td>
            </tr>
            <tr>
                <th>지연사유</th>
                <td colspan="3">${formData.delayReason}</td>
            </tr>
            <tr>
                <th>작업자/시간</th>
                <td colspan="3">
                    #if($formData.workerRows && $formData.workerRows.size() > 0)
                    <table style="width: 100%; margin-top: 5px;">
                        <thead>
                            <tr>
                                <th class="sub-header">작업자</th>
                                <th class="sub-header">소속부서</th>
                                <th class="sub-header">작업시간(분)</th>
                            </tr>
                        </thead>
                        <tbody>
                            #foreach($row in $formData.workerRows)
                            <tr>
                                <td class="text-center">${row.worker}</td>
                                <td class="text-center">${row.department}</td>
                                <td class="text-center">${row.workTime}</td>
                            </tr>
                            #end
                        </tbody>
                    </table>
                    #else
                        -
                    #end
                </td>
            </tr>
            <tr>
                <th>파일첨부</th>
                <td colspan="3">
                    #if($formData.repairFiles && $formData.repairFiles.size() > 0)
                        <ul>
                        #foreach($file in $formData.repairFiles)
                            <li>${file}</li>
                        #end
                        </ul>
                    #else
                        -
                    #end
                </td>
            </tr>
        </tbody>
    </table>',
     '[고장수리 결과 보고서]
요청번호: ${formData.requestNo}
제목: ${formData.title}
요청자: ${formData.requester}
설비: ${formData.deviceName} (${formData.location})
담당자: ${formData.assignee}
HTML 을 지원하지 않는 환경입니다. 시스템에서 상세 내용을 확인해 주세요.',
     'VELOCITY', null, 'ACTIVE', '레거시 failure-repair-template.vm 원문 이관', 'admin', NOW(), 'kang', '2023-09-14 10:00:00');

INSERT INTO MAIL_TEMPLATE_VERSION
    (VERSION_ID, TEMPLATE_ID, VERSION_NO, SUBJECT, PREHEADER, BODY_HTML, BODY_TEXT,
     ENGINE_TYPE, LAYOUT_ID, STATUS_CODE, CHANGE_NOTE, APPROVED_BY, APPROVED_DT, REG_ID, REG_DT)
VALUES
    (2301, 23, 1, '[개조/개선] ${formData.requestNo} ${formData.title}', '개조 목적과 개선 효과를 확인해 주세요',
     '<style>body {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        h3 {
            color: #0d47a1;
            border-bottom: 2px solid #0d47a1;
            padding-bottom: 10px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            font-family: ''Malgun Gothic'', Dotum, Arial, sans-serif;
            font-size: 13px;
            border: 1px solid #b0c4de;
        }
        th, td {
            border: 1px solid #b0c4de;
            padding: 10px;
            vertical-align: middle;
        }
        th {
            background-color: #eaf4fa;
            color: #2c3e50;
            text-align: center;
            font-weight: bold;
        }
        .text-center { text-align: center; }
        .text-end { text-align: right; }
        .mb-3 { margin-bottom: 1rem; }</style>


    <h3>설비 개조/개선</h3>
    <table>
        <colgroup>
            <col style="width: 15%" />
            <col style="width: 35%" />
            <col style="width: 15%" />
            <col style="width: 35%" />
        </colgroup>
        <tbody>
            <tr>
                <th>제목</th>
                <td colspan="3">${formData.title}</td>
            </tr>
            <tr>
                <th>요청번호</th>
                <td>${formData.requestNo}</td>
                <th>과제</th>
                <td>${formData.project}</td>
            </tr>
            <tr>
                <th>요청자</th>
                <td>${formData.requester}</td>
                <th>완료요청일</th>
                <td>${formData.dueDate}</td>
            </tr>
             <tr>
                <th>디바이스명</th>
                <td>${formData.deviceName}</td>
                <th>위치</th>
                <td>${formData.location}</td>
            </tr>
            <tr>
                <th>내용</th>
                <td colspan="3">${formData.content}</td>
            </tr>
             <tr>
                <th>첨부파일</th>
                <td colspan="3">
                    #if($formData.files && $formData.files.size() > 0)
                        <ul>
                        #foreach($file in $formData.files)
                            <li>${file}</li>
                        #end
                        </ul>
                    #else
                        -
                    #end
                </td>
            </tr>


            <tr>
                <th>지원 유형</th>
                <td>${formData.supportType}</td>
                <th>승인 여부</th>
                <td>
                    #if($formData.approvalStatus == ''approved'') 승인
                    #elseif($formData.approvalStatus == ''rejected'') 반려
                    #else - #end
                </td>
            </tr>
            <tr>
                <th>완료 예정일</th>
                <td>${formData.expectedCompletionDate}</td>
                <th>처리 방식</th>
                <td>
                    ${formData.processingMethod}
                    #if($formData.outsourcingCompany) (${formData.outsourcingCompany}) #end
                </td>
            </tr>
             <tr>
                <th>접수 담당자</th>
                <td colspan="3">${formData.assignee}</td>
            </tr>
            <tr>
                <th>레시피</th>
                <td>${formData.recipe}</td>
                 <th>협의자</th>
                <td>${formData.consultants}</td>
            </tr>
             <tr>
                <th>접수 의견</th>
                <td colspan="3">${formData.receiveComment}</td>
            </tr>
             <tr>
                <th>첨부파일</th>
                <td colspan="3">
                     #if($formData.receiveFiles && $formData.receiveFiles.size() > 0)
                        <ul>
                        #foreach($file in $formData.receiveFiles)
                            <li>${file}</li>
                        #end
                        </ul>
                    #else
                        -
                    #end
                </td>
            </tr>

            <tr>
                <th>개조/개선 내용</th>
                <td colspan="3">${formData.modificationContent}</td>
            </tr>
            <tr>
                <th>개선 목적</th>
                <td colspan="3">${formData.improvementPurpose}</td>
            </tr>
            <tr>
                <th>개선 효과</th>
                <td colspan="3">${formData.improvementEffect}</td>
            </tr>
            <tr>
                <th>투입 비용</th>
                <td colspan="3">${formData.modificationCost}</td>
            </tr>
            <tr>
                <th>작업 기간</th>
                <td colspan="3">
                    ${formData.workStartDate} ~ ${formData.workEndDate}
                </td>
            </tr>
            <tr>
                <th>참여 인원</th>
                <td colspan="3">${formData.participants}</td>
            </tr>
            <tr>
                <th>기술 문서</th>
                <td colspan="3">${formData.technicalDocs}</td>
            </tr>
            <tr>
                <th>첨부파일</th>
                <td colspan="3">
                    #if($formData.modificationFiles && $formData.modificationFiles.size() > 0)
                        <ul>
                        #foreach($file in $formData.modificationFiles)
                            <li>${file}</li>
                        #end
                        </ul>
                    #else
                        -
                    #end
                </td>
            </tr>
        </tbody>
    </table>',
     '[설비 개조/개선 보고서]
요청번호: ${formData.requestNo}
제목: ${formData.title}
요청자: ${formData.requester}
설비: ${formData.deviceName} (${formData.location})
담당자: ${formData.assignee}
HTML 을 지원하지 않는 환경입니다. 시스템에서 상세 내용을 확인해 주세요.',
     'VELOCITY', null, 'ACTIVE', '레거시 modification-improvement-template.vm 원문 이관', 'admin', NOW(), 'choi', '2023-09-14 10:00:00');

INSERT INTO MAIL_TEMPLATE_VERSION
    (VERSION_ID, TEMPLATE_ID, VERSION_NO, SUBJECT, PREHEADER, BODY_HTML, BODY_TEXT,
     ENGINE_TYPE, LAYOUT_ID, STATUS_CODE, CHANGE_NOTE, APPROVED_BY, APPROVED_DT, REG_ID, REG_DT)
VALUES
    (2401, 24, 1, '[셋업/해제] ${formData.requestNo} ${formData.title}', '셋업 진행 상황과 결과를 확인해 주세요',
     '<style>body {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        h3 {
            color: #0d47a1;
            border-bottom: 2px solid #0d47a1;
            padding-bottom: 10px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            font-family: ''Malgun Gothic'', Dotum, Arial, sans-serif;
            font-size: 13px;
            border: 1px solid #b0c4de;
        }
        th, td {
            border: 1px solid #b0c4de;
            padding: 10px;
            vertical-align: middle;
        }
        th {
            background-color: #eaf4fa;
            color: #2c3e50;
            text-align: center;
            font-weight: bold;
        }
        .text-center { text-align: center; }
        .text-end { text-align: right; }
        .mb-3 { margin-bottom: 1rem; }
        .sub-header { background-color: #d6eaf8 !important; }</style>


    <h3>설비 셋업/해제</h3>
    <table>
        <colgroup>
            <col style="width: 15%" />
            <col style="width: 35%" />
            <col style="width: 15%" />
            <col style="width: 35%" />
        </colgroup>
        <tbody>
            <tr>
                <th>제목</th>
                <td colspan="3">${formData.title}</td>
            </tr>
            <tr>
                <th>요청번호</th>
                <td>${formData.requestNo}</td>
                <th>과제</th>
                <td>${formData.project}</td>
            </tr>
            <tr>
                <th>요청자</th>
                <td>${formData.requester}</td>
                <th>완료요청일</th>
                <td>${formData.dueDate}</td>
            </tr>
             <tr>
                <th>디바이스명</th>
                <td>${formData.deviceName}</td>
                <th>위치</th>
                <td>${formData.location}</td>
            </tr>
            <tr>
                <th>내용</th>
                <td colspan="3">${formData.content}</td>
            </tr>
             <tr>
                <th>첨부파일</th>
                <td colspan="3">
                    #if($formData.files && $formData.files.size() > 0)
                        <ul>
                        #foreach($file in $formData.files)
                            <li>${file}</li>
                        #end
                        </ul>
                    #else
                        -
                    #end
                </td>
            </tr>


            <tr>
                <th>지원 유형</th>
                <td>${formData.supportType}</td>
                <th>승인 여부</th>
                <td>
                    #if($formData.approvalStatus == ''approved'') 승인
                    #elseif($formData.approvalStatus == ''rejected'') 반려
                    #else - #end
                </td>
            </tr>
            <tr>
                <th>완료 예정일</th>
                <td>${formData.expectedCompletionDate}</td>
                <th>처리 방식</th>
                <td>
                    ${formData.processingMethod}
                    #if($formData.outsourcingCompany) (${formData.outsourcingCompany}) #end
                </td>
            </tr>
             <tr>
                <th>접수 담당자</th>
                <td colspan="3">${formData.assignee}</td>
            </tr>
            <tr>
                <th>레시피</th>
                <td>${formData.recipe}</td>
                 <th>협의자</th>
                <td>${formData.consultants}</td>
            </tr>
             <tr>
                <th>접수 의견</th>
                <td colspan="3">${formData.receiveComment}</td>
            </tr>
             <tr>
                <th>첨부파일</th>
                <td colspan="3">
                     #if($formData.receiveFiles && $formData.receiveFiles.size() > 0)
                        <ul>
                        #foreach($file in $formData.receiveFiles)
                            <li>${file}</li>
                        #end
                        </ul>
                    #else
                        -
                    #end
                </td>
            </tr>

            <tr>
                <th>내용</th>
                <td colspan="3">${formData.content}</td>
            </tr>
            <tr>
                <th>개요(설비)</th>
                <td colspan="3">${formData.summary}</td>
            </tr>
            <tr>
                <th>목적(배경)</th>
                <td colspan="3">${formData.purpose}</td>
            </tr>
            <tr>
                <th>세부일정</th>
                <td colspan="3">${formData.schedule}</td>
            </tr>
            <tr>
                <th>진행내용</th>
                <td colspan="3">${formData.progress}</td>
            </tr>
            <tr>
                <th>결과(Inspection)</th>
                <td colspan="3">${formData.resultInspection}</td>
            </tr>
            <tr>
                <th>결과(Hardware)</th>
                <td colspan="3">${formData.resultHardware}</td>
            </tr>
            <tr>
                <th>결과(Process)</th>
                <td colspan="3">${formData.resultProcess}</td>
            </tr>
            <tr>
                <th>결론(완료)</th>
                <td colspan="3">${formData.conclusion}</td>
            </tr>
            <tr>
                <th>활용계획</th>
                <td colspan="3">${formData.plan}</td>
            </tr>
            <tr>
                <th>미진사항</th>
                <td colspan="3">${formData.issue}</td>
            </tr>
            <tr>
                <th>지연 사유</th>
                <td colspan="3">${formData.delayReason}</td>
            </tr>
            <tr>
                <th>작업자/시간</th>
                <td colspan="3">
                    #if($formData.workerRows && $formData.workerRows.size() > 0)
                    <table style="width: 100%; margin-top: 5px; border: 1px solid #b0c4de;">
                        <thead>
                            <tr>
                                <th class="sub-header">작업자</th>
                                <th class="sub-header">소속부서</th>
                                <th class="sub-header">작업시간(분)</th>
                            </tr>
                        </thead>
                        <tbody>
                            #foreach($row in $formData.workerRows)
                            <tr>
                                <td class="text-center">${row.worker}</td>
                                <td class="text-center">${row.department}</td>
                                <td class="text-center">${row.workTime}</td>
                            </tr>
                            #end
                        </tbody>
                    </table>
                    #else
                        -
                    #end
                </td>
            </tr>
            <tr>
                <th>파일첨부</th>
                <td colspan="3">
                    #if($formData.files && $formData.files.size() > 0)
                        <ul>
                        #foreach($file in $formData.files)
                            <li>${file}</li>
                        #end
                        </ul>
                    #else
                        -
                    #end
                </td>
            </tr>
        </tbody>
    </table>',
     '[설비 셋업/해제 보고서]
요청번호: ${formData.requestNo}
제목: ${formData.title}
요청자: ${formData.requester}
설비: ${formData.deviceName} (${formData.location})
담당자: ${formData.assignee}
HTML 을 지원하지 않는 환경입니다. 시스템에서 상세 내용을 확인해 주세요.',
     'VELOCITY', null, 'ACTIVE', '레거시 setup-release-template.vm 원문 이관', 'admin', NOW(), 'kang', '2023-09-14 10:00:00');

-- 마스터의 현재 활성 버전 지정
UPDATE MAIL_TEMPLATE SET CURRENT_VERSION_ID = 102 WHERE TEMPLATE_ID = 1;
UPDATE MAIL_TEMPLATE SET CURRENT_VERSION_ID = 201 WHERE TEMPLATE_ID = 2;
UPDATE MAIL_TEMPLATE SET CURRENT_VERSION_ID = 301 WHERE TEMPLATE_ID = 3;
UPDATE MAIL_TEMPLATE SET CURRENT_VERSION_ID = 401 WHERE TEMPLATE_ID = 4;
UPDATE MAIL_TEMPLATE SET CURRENT_VERSION_ID = 501 WHERE TEMPLATE_ID = 5;
UPDATE MAIL_TEMPLATE SET CURRENT_VERSION_ID = 701 WHERE TEMPLATE_ID = 7;
UPDATE MAIL_TEMPLATE SET CURRENT_VERSION_ID = 901 WHERE TEMPLATE_ID = 9;
UPDATE MAIL_TEMPLATE SET CURRENT_VERSION_ID = 1001 WHERE TEMPLATE_ID = 10;
UPDATE MAIL_TEMPLATE SET CURRENT_VERSION_ID = 1101 WHERE TEMPLATE_ID = 11;
UPDATE MAIL_TEMPLATE SET CURRENT_VERSION_ID = 1201 WHERE TEMPLATE_ID = 12;
UPDATE MAIL_TEMPLATE SET CURRENT_VERSION_ID = 1301 WHERE TEMPLATE_ID = 13;
UPDATE MAIL_TEMPLATE SET CURRENT_VERSION_ID = 2101 WHERE TEMPLATE_ID = 21;
UPDATE MAIL_TEMPLATE SET CURRENT_VERSION_ID = 2201 WHERE TEMPLATE_ID = 22;
UPDATE MAIL_TEMPLATE SET CURRENT_VERSION_ID = 2301 WHERE TEMPLATE_ID = 23;
UPDATE MAIL_TEMPLATE SET CURRENT_VERSION_ID = 2401 WHERE TEMPLATE_ID = 24;

-- ---------------------------------------------------------------------
-- 템플릿 변수 정의 (테스트 발송 폼이 이 정의로 자동 생성된다)
--   DATA_TYPE='URL' 이면서 이름이 actionUrl 인 것이 CTA 딥링크다.
-- ---------------------------------------------------------------------
INSERT INTO MAIL_TEMPLATE_VAR
    (TEMPLATE_ID, VAR_NAME, VAR_PATH, DATA_TYPE, REQUIRED_YN, SAMPLE_VALUE, DESCRIPTION, SORT_ORDER)
VALUES
    (1, 'drafterName', '${drafterName}', 'STRING', 'Y', '이영희', '기안자', 1),
    (1, 'docNo', '${docNo}', 'STRING', 'Y', 'DOC-2026-0912', '문서번호', 2),
    (1, 'docTitle', '${docTitle}', 'STRING', 'Y', '3분기 설비 구매 품의', '문서 제목', 3),
    (1, 'draftDept', '${draftDept}', 'STRING', 'N', 'R&D본부 플랫폼개발팀', '기안 부서', 4),
    (1, 'draftDate', '${draftDate}', 'DATE', 'Y', '2026-08-19', '기안일', 5),
    (1, 'dueDate', '${dueDate}', 'DATE', 'Y', '2026-08-21', '처리 기한', 6),
    (1, 'urgency', '${urgency}', 'STRING', 'N', '긴급', '긴급도 (#if 조건)', 7),
    (1, 'actionUrl', '${actionUrl}', 'URL', 'Y', 'https://nexhub.example.com/work-group/request-workflow?docNo=DOC-2026-0912&from=mail', 'CTA — 결재 처리 화면', 8),
    (1, 'docViewUrl', '${docViewUrl}', 'URL', 'N', 'https://nexhub.example.com/work-group/request-workflow?docNo=DOC-2026-0912&mode=view&from=mail', '문서 미리보기', 9),
    (1, 'listUrl', '${listUrl}', 'URL', 'N', 'https://nexhub.example.com/work-group/request-workflow?tab=inbox&from=mail', '결재함 목록', 10),
    (2, 'docTitle', '${docTitle}', 'STRING', 'Y', '3분기 설비 구매 품의', '문서 제목', 1),
    (2, 'resultText', '${resultText}', 'STRING', 'Y', '승인', '결재 결과 (승인/반려)', 2),
    (2, 'approverName', '${approverName}', 'STRING', 'N', '박부장', '결재자', 3),
    (2, 'comment', '${comment}', 'STRING', 'N', '예산 범위 내에서 진행 바랍니다.', '결재 의견', 4),
    (2, 'actionUrl', '${actionUrl}', 'URL', 'Y', 'https://nexhub.example.com/work-group/request-workflow?docNo=DOC-2026-0912&from=mail', 'CTA — 문서 화면', 5),
    (3, 'requesterName', '${requesterName}', 'STRING', 'Y', '정수진', '의뢰자', 1),
    (3, 'requesterDept', '${requesterDept}', 'STRING', 'N', '경영지원본부 총무팀', '의뢰 부서', 2),
    (3, 'requestNo', '${requestNo}', 'STRING', 'Y', 'REQ-2026-0451', '의뢰번호', 3),
    (3, 'requestTitle', '${requestTitle}', 'STRING', 'Y', '공정 모니터링 대시보드 지표 추가', '의뢰 제목', 4),
    (3, 'requestType', '${requestType}', 'STRING', 'N', '기능개선', '요청 유형', 5),
    (3, 'requestContent', '${requestContent}', 'STRING', 'Y', '설비별 가동률 지표를 대시보드 상단에 추가해 주세요. 기준은 일 단위입니다.', '의뢰 내용', 6),
    (3, 'dueDate', '${dueDate}', 'DATE', 'N', '2026-09-05', '희망 완료일', 7),
    (3, 'attachments', '${attachments[]}', 'LIST', 'N', '[{"name":"요구사항_정리.xlsx","url":"https://nexhub.example.com/work-group/files/8821"},{"name":"화면_예시.png","url":"https://nexhub.example.com/work-group/files/8822"}]', '첨부 파일 목록 (#foreach 대상)', 8),
    (3, 'actionUrl', '${actionUrl}', 'URL', 'Y', 'https://nexhub.example.com/work-group/request-workflow?requestNo=REQ-2026-0451&action=accept&from=mail', 'CTA — 접수 처리 화면', 9),
    (3, 'listUrl', '${listUrl}', 'URL', 'N', 'https://nexhub.example.com/work-group/request-workflow?tab=pending&from=mail', '의뢰 목록', 10),
    (4, 'assigneeName', '${assigneeName}', 'STRING', 'Y', '김개발', '배정된 담당자', 1),
    (4, 'requestNo', '${requestNo}', 'STRING', 'Y', 'REQ-2026-0451', '의뢰번호', 2),
    (4, 'requestTitle', '${requestTitle}', 'STRING', 'Y', '공정 모니터링 대시보드 지표 추가', '의뢰 제목', 3),
    (4, 'requesterName', '${requesterName}', 'STRING', 'N', '정수진', '의뢰자', 4),
    (4, 'assignerName', '${assignerName}', 'STRING', 'N', '박팀장', '배정자', 5),
    (4, 'dueDate', '${dueDate}', 'DATE', 'Y', '2026-09-05', '처리 기한', 6),
    (4, 'actionUrl', '${actionUrl}', 'URL', 'Y', 'https://nexhub.example.com/work-group/request-workflow?requestNo=REQ-2026-0451&action=start&from=mail', 'CTA — 작업 시작', 7),
    (4, 'rejectUrl', '${rejectUrl}', 'URL', 'N', 'https://nexhub.example.com/work-group/request-workflow?requestNo=REQ-2026-0451&action=reject&from=mail', '배정 반려', 8),
    (5, 'assigneeName', '${assigneeName}', 'STRING', 'Y', '김개발', '담당자', 1),
    (5, 'delayCount', '${delayCount}', 'NUMBER', 'Y', '3', '지연 건수', 2),
    (5, 'delayedItems', '${delayedItems[]}', 'LIST', 'Y', '[{"requestNo":"REQ-2026-0398","title":"바코드 프린터 연동 오류","delayDays":5,"url":"https://nexhub.example.com/work-group/request-workflow?requestNo=REQ-2026-0398&from=mail"},{"requestNo":"REQ-2026-0412","title":"권한 그룹 재정비","delayDays":2,"url":"https://nexhub.example.com/work-group/request-workflow?requestNo=REQ-2026-0412&from=mail"}]', '지연 항목 목록 (#foreach 대상)', 3),
    (5, 'actionUrl', '${actionUrl}', 'URL', 'Y', 'https://nexhub.example.com/work-group/request-workflow?tab=delayed&from=mail', 'CTA — 미처리 목록', 4),
    (7, 'equipName', '${equipName}', 'STRING', 'Y', 'CNC 밀링머신 #3', '설비명', 1),
    (7, 'location', '${location}', 'STRING', 'Y', '2공장 B라인', '위치', 2),
    (7, 'alertType', '${alertType}', 'STRING', 'Y', '주축 온도', '경고 유형', 3),
    (7, 'currentValue', '${currentValue}', 'STRING', 'Y', '87.4℃', '측정값', 4),
    (7, 'threshold', '${threshold}', 'STRING', 'Y', '80.0℃', '임계치', 5),
    (7, 'detectedAt', '${detectedAt}', 'DATE', 'Y', '2026-08-20 14:32', '감지 시각', 6),
    (7, 'actionUrl', '${actionUrl}', 'URL', 'Y', 'https://nexhub.example.com/work-group/equipment-monitor?equip=CNC-003&from=mail', 'CTA — 모니터링 화면', 7),
    (7, 'supportUrl', '${supportUrl}', 'URL', 'N', 'https://nexhub.example.com/work-group/equipment-support-request?equip=CNC-003&from=mail', '지원 요청 등록', 8),
    (9, 'applicantName', '${applicantName}', 'STRING', 'Y', '오세훈', '신청자', 1),
    (9, 'applicantDept', '${applicantDept}', 'STRING', 'N', 'R&D본부 AI연구팀', '소속', 2),
    (9, 'permissionName', '${permissionName}', 'STRING', 'Y', '설비 모니터링 조회', '신청 권한', 3),
    (9, 'reason', '${reason}', 'STRING', 'N', '공정 데이터 분석 업무 수행을 위해 필요합니다.', '신청 사유', 4),
    (9, 'appliedAt', '${appliedAt}', 'DATE', 'Y', '2026-08-20 11:05', '신청일', 5),
    (9, 'actionUrl', '${actionUrl}', 'URL', 'Y', 'https://nexhub.example.com/system/menus?tab=approval&applyNo=PRM-2026-0088&from=mail', 'CTA — 승인 처리 화면', 6),
    (9, 'listUrl', '${listUrl}', 'URL', 'N', 'https://nexhub.example.com/system/menus?from=mail', '권한 관리 화면', 7),
    (10, 'userName', '${userName}', 'STRING', 'Y', '홍길동', '수신자 이름', 1),
    (10, 'actionUrl', '${actionUrl}', 'URL', 'Y', 'https://nexhub.example.com/login?reset=abc123&from=mail', 'CTA — 재설정 링크', 2),
    (10, 'expireMinutes', '${expireMinutes}', 'NUMBER', 'Y', '30', '링크 만료(분)', 3),
    (11, 'noticeTitle', '${noticeTitle}', 'STRING', 'Y', '2026년 하반기 안전교육 이수 안내', '공지 제목', 1),
    (11, 'writerName', '${writerName}', 'STRING', 'Y', '안전보건팀', '작성자', 2),
    (11, 'postedAt', '${postedAt}', 'DATE', 'Y', '2026-08-20', '게시일', 3),
    (11, 'noticeSummary', '${noticeSummary}', 'STRING', 'Y', '전 직원 대상 하반기 안전교육을 9월 중 이수해야 합니다. 미이수 시 현장 출입이 제한됩니다.', '공지 요약', 4),
    (11, 'requireConfirm', '${requireConfirm}', 'BOOLEAN', 'N', 'true', '확인 응답 필요 여부 (#if 조건)', 5),
    (11, 'actionUrl', '${actionUrl}', 'URL', 'Y', 'https://nexhub.example.com/posts/1042?from=mail', 'CTA — 공지 상세', 6),
    (12, 'maintDate', '${maintDate}', 'DATE', 'Y', '2026-08-30', '점검일', 1),
    (12, 'maintTime', '${maintTime}', 'STRING', 'Y', '02:00 ~ 05:00', '점검 시간', 2),
    (12, 'maintTarget', '${maintTarget}', 'STRING', 'Y', '전체 서비스', '점검 대상', 3),
    (13, 'weekLabel', '${weekLabel}', 'STRING', 'Y', '2026년 34주차', '주차 표기', 1),
    (13, 'teamName', '${teamName}', 'STRING', 'Y', '플랫폼개발팀', '팀명', 2),
    (13, 'totalCount', '${totalCount}', 'NUMBER', 'Y', '17', '미처리 건수', 3),
    (13, 'delayCount', '${delayCount}', 'NUMBER', 'Y', '4', '지연 건수', 4),
    (13, 'members', '${members[]}', 'LIST', 'Y', '[{"name":"김개발","pending":7,"delayed":2},{"name":"오세훈","pending":6,"delayed":1},{"name":"강도현","pending":4,"delayed":1}]', '팀원별 현황 (#foreach 대상)', 5),
    (13, 'actionUrl', '${actionUrl}', 'URL', 'Y', 'https://nexhub.example.com/?tab=pending&from=mail', 'CTA — 대시보드', 6),
    (21, 'formData', '${formData.*}', 'OBJECT', 'Y', '{"requestNo":"REQ-2023-1001","title":"조립라인 A 모터 소음 이상 관련 지원 요청","project":"PJ-2023-001","requester":"홍길동","dueDate":"2023-10-05","deviceName":"EQ-202/Main Motor","location":"A동 2층 조립라인","recipe":"RECIPE-A-001","supportType":"설비지원","assignee":"김철수","consultants":"김철수, 이영희","processingMethod":"내부","outsourcingCompany":"","expectedCompletionDate":"2023-10-03 18:00","content":"조립 라인에서 가동 중 모터에서 평소와 다른 수준의 소음이 발생하고 있습니다. 진동도 약간 증가한 것 같아 점검 요청드립니다.","receiveComment":"현장 방문하여 소음 측정 후 베어링 교체 필요성 판단 예정입니다.","approvalStatus":"approved","files":["noise_recording.mp3","vibration_log.csv"],"receiveFiles":["motor_spec_v2.pdf"],"supportContent":"현장 방문 후 베어링 상태 점검 및 임시 조치 수행","supportTime":"3시간 30분","supportPersonnel":"2","supportNotes":"특이사항 없음. 정상 가동 확인 완료.","supportFiles":["site_photo_01.jpg"]}', '요청·접수·결과 폼 전체 (레거시 .vm 이 참조하는 단일 객체)', 1),
    (21, 'progressRows', '${progressRows[]}', 'LIST', 'N', '[{"date":"2023-10-01","content":"모터 탈거 및 육안 점검 수행","worker":"홍길동","status":"완료","remark":"-"},{"date":"2023-10-02","content":"베어링 임시 조치 및 시운전","worker":"김철수","status":"완료","remark":"소음 수치 확인"}]', '최상위 목록 변수 (#foreach 대상)', 2),
    (21, 'resultFiles1', '${resultFiles1[]}', 'LIST', 'N', '["result_report.docx"]', '최상위 목록 변수 (#foreach 대상)', 3),
    (21, 'resultFiles2', '${resultFiles2[]}', 'LIST', 'N', '[]', '최상위 목록 변수 (#foreach 대상)', 4),
    (22, 'formData', '${formData.*}', 'OBJECT', 'Y', '{"requestNo":"REQ-2023-1001","title":"조립라인 A 모터 소음 이상 관련 지원 요청","project":"PJ-2023-001","requester":"홍길동","dueDate":"2023-10-05","deviceName":"EQ-202/Main Motor","location":"A동 2층 조립라인","recipe":"RECIPE-A-001","supportType":"고장수리","assignee":"김철수","consultants":"김철수, 이영희","processingMethod":"내부","outsourcingCompany":"","expectedCompletionDate":"2023-10-03 18:00","content":"조립 라인에서 가동 중 모터에서 평소와 다른 수준의 소음이 발생하고 있습니다. 진동도 약간 증가한 것 같아 점검 요청드립니다.","receiveComment":"현장 방문하여 소음 측정 후 베어링 교체 필요성 판단 예정입니다.","approvalStatus":"approved","files":["noise_recording.mp3","vibration_log.csv"],"receiveFiles":["motor_spec_v2.pdf"],"failureStatus":"가동중지","repairAction":"주축 베어링 교체 및 윤활유 보충","causeNote":"장기간 윤활 부족으로 인한 베어링 마모로 확인됨","purchaseCost":"450,000","vendorManager":"대성기공 박과장","delayReason":"","selectedCauses":["윤활 불량","부품 노후"],"selectedMeasures":["부품 교체","점검주기 단축"],"causeRows":[{"category":"직접원인","detail":"주축 베어링 마모로 인한 이상 소음"}],"partRows":[{"device":"EQ-202","name":"주축 베어링 6205ZZ","maker":"NSK","spec":"25×52×15","qty":2},{"device":"EQ-202","name":"윤활유 ISO VG68","maker":"SHELL","spec":"4L","qty":1}],"workerRows":[{"department":"설비1팀","name":"강도현","workTime":180},{"department":"설비1팀","name":"오세훈","workTime":120}],"repairFiles":["repair_result.pdf"]}', '요청·접수·결과 폼 전체 (레거시 .vm 이 참조하는 단일 객체)', 1),
    (23, 'formData', '${formData.*}', 'OBJECT', 'Y', '{"requestNo":"REQ-2023-1001","title":"조립라인 A 모터 소음 이상 관련 지원 요청","project":"PJ-2023-001","requester":"홍길동","dueDate":"2023-10-05","deviceName":"EQ-202/Main Motor","location":"A동 2층 조립라인","recipe":"RECIPE-A-001","supportType":"개조/개선","assignee":"김철수","consultants":"김철수, 이영희","processingMethod":"내부","outsourcingCompany":"","expectedCompletionDate":"2023-10-03 18:00","content":"조립 라인에서 가동 중 모터에서 평소와 다른 수준의 소음이 발생하고 있습니다. 진동도 약간 증가한 것 같아 점검 요청드립니다.","receiveComment":"현장 방문하여 소음 측정 후 베어링 교체 필요성 판단 예정입니다.","approvalStatus":"approved","files":["noise_recording.mp3","vibration_log.csv"],"receiveFiles":["motor_spec_v2.pdf"],"improvementPurpose":"사이클 타임 단축 및 작업자 안전 확보","modificationContent":"이송 컨베이어 속도 제어부 교체, 안전 커버 추가 설치","modificationCost":"2,800,000","improvementEffect":"사이클 타임 12% 단축, 협착 위험 구간 제거","technicalDocs":"개조도면 REV.B, 안전성 검토서","participants":"김철수, 이영희, 대성기공 2명","workStartDate":"2023-10-10","workEndDate":"2023-10-12","modificationFiles":["modification_drawing_revB.pdf"]}', '요청·접수·결과 폼 전체 (레거시 .vm 이 참조하는 단일 객체)', 1),
    (24, 'formData', '${formData.*}', 'OBJECT', 'Y', '{"requestNo":"REQ-2023-1001","title":"조립라인 A 모터 소음 이상 관련 지원 요청","project":"PJ-2023-001","requester":"홍길동","dueDate":"2023-10-05","deviceName":"EQ-202/Main Motor","location":"A동 2층 조립라인","recipe":"RECIPE-A-001","supportType":"셋업/해제","assignee":"김철수","consultants":"김철수, 이영희","processingMethod":"내부","outsourcingCompany":"","expectedCompletionDate":"2023-10-03 18:00","content":"조립 라인에서 가동 중 모터에서 평소와 다른 수준의 소음이 발생하고 있습니다. 진동도 약간 증가한 것 같아 점검 요청드립니다.","receiveComment":"현장 방문하여 소음 측정 후 베어링 교체 필요성 판단 예정입니다.","approvalStatus":"approved","files":["noise_recording.mp3","vibration_log.csv"],"receiveFiles":["motor_spec_v2.pdf"],"purpose":"신규 라인 증설에 따른 설비 셋업","schedule":"2023-10-15 ~ 2023-10-20","progress":"100","plan":"10/15 반입 → 10/17 배치 → 10/19 시운전 → 10/20 검수","issue":"전원 용량 부족으로 배전반 증설 선행 필요","summary":"셋업 완료. 시운전 정상.","conclusion":"양산 투입 가능","resultHardware":"본체 및 부속 설비 설치 완료","resultProcess":"레시피 이관 및 파라미터 튜닝 완료","resultInspection":"검수 합격 (2023-10-20)","delayReason":"","workerRows":[{"department":"설비1팀","name":"강도현","workTime":480},{"department":"설비2팀","name":"문가영","workTime":300}]}', '요청·접수·결과 폼 전체 (레거시 .vm 이 참조하는 단일 객체)', 1);

-- ---------------------------------------------------------------------
-- 메일 발송 이벤트 (소스코드가 참조하는 불변 키)
-- ---------------------------------------------------------------------
INSERT INTO MAIL_EVENT
    (EVENT_ID, EVENT_CODE, EVENT_NAME, MODULE_CODE, TRIGGER_TYPE, SEND_CHANNEL, IMPORTANCE, DESCRIPTION, SOURCE_HINT, USE_YN)
VALUES
    (1, 'APPROVAL.REQUEST', '결재 요청', 'APPROVAL', 'EVENT', 'EMAIL', 'HIGH', '결재선에 문서 도착 시 결재자에게 발송', 'ApprovalService#request', 'Y'),
    (2, 'APPROVAL.APPROVED', '결재 승인 통보', 'APPROVAL', 'EVENT', 'EMAIL', 'NORMAL', '문서 승인 시 기안자에게 발송', 'ApprovalService#approve', 'Y'),
    (3, 'APPROVAL.REJECTED', '결재 반려 통보', 'APPROVAL', 'EVENT', 'EMAIL', 'HIGH', '문서 반려 시 기안자에게 발송', 'ApprovalService#reject', 'Y'),
    (4, 'REQUEST.RECEIVED', '업무 의뢰 접수', 'REQUEST', 'EVENT', 'EMAIL', 'HIGH', '의뢰 등록 시 처리 부서에 발송', 'WorkRequestService#create', 'Y'),
    (5, 'REQUEST.ASSIGNED', '담당자 배정', 'REQUEST', 'EVENT', 'EMAIL', 'HIGH', '담당자 배정 시 해당 담당자에게 발송', 'WorkRequestService#assign', 'Y'),
    (6, 'REQUEST.DELAYED', '처리 지연 알림', 'REQUEST', 'BATCH', 'EMAIL', 'HIGH', '매일 08시 배치. 기한 초과 건을 담당자·팀장에게 발송', 'SlaCheckBatch#run', 'Y'),
    (7, 'REQUEST.COMPLETED', '처리 완료 통보', 'REQUEST', 'EVENT', 'EMAIL', 'NORMAL', '의뢰 처리 완료 시 의뢰자에게 발송', 'WorkRequestService#complete', 'Y'),
    (8, 'EQUIP.SUPPORT.REQUESTED', '설비 지원 요청', 'EQUIPMENT', 'EVENT', 'EMAIL', 'HIGH', '현장 지원 요청 등록 시 설비팀에 발송', 'EquipSupportService#request', 'Y'),
    (9, 'EQUIP.FAILURE.DETECTED', '설비 이상 감지', 'EQUIPMENT', 'EVENT', 'EMAIL', 'HIGH', '센서 임계치 초과 시 담당자에게 즉시 발송', 'EquipMonitorService#onThreshold', 'Y'),
    (10, 'EQUIP.REPAIR.COMPLETED', '수리 완료 보고', 'EQUIPMENT', 'EVENT', 'EMAIL', 'NORMAL', '수리 완료 시 요청자에게 결과 보고', 'EquipRepairService#complete', 'Y'),
    (11, 'ACCOUNT.APPROVAL.REQUESTED', '권한 신청 승인 요청', 'ACCOUNT', 'EVENT', 'EMAIL', 'NORMAL', '권한 신청 시 승인권자에게 발송', 'PermissionService#apply', 'Y'),
    (12, 'ACCOUNT.PASSWORD.RESET', '비밀번호 재설정', 'ACCOUNT', 'EVENT', 'EMAIL', 'HIGH', '비밀번호 찾기 요청 시 발송', 'AuthService#requestReset', 'Y'),
    (13, 'ACCOUNT.LOCKED', '계정 잠금 알림', 'ACCOUNT', 'EVENT', 'EMAIL', 'HIGH', '로그인 5회 실패로 계정 잠금 시 발송', 'AuthService#lockAccount', 'Y'),
    (14, 'NOTICE.POSTED', '공지사항 등록', 'NOTICE', 'MANUAL', 'EMAIL', 'NORMAL', '중요 공지 등록 시 대상자에게 발송', 'NoticeController#publish', 'Y'),
    (15, 'NOTICE.MAINTENANCE', '시스템 점검 공지', 'NOTICE', 'MANUAL', 'EMAIL', 'NORMAL', '관리자가 수동 발송하는 점검 공지', 'AdminNoticeController#send', 'Y'),
    (17, 'EQUIP.MODIFICATION.REPORTED', '개조/개선 결과 보고', 'EQUIPMENT', 'EVENT', 'EMAIL', 'NORMAL', '개조/개선 작업 완료 시 요청자·승인자에게 결과 보고', 'EquipModificationService#report', 'Y'),
    (18, 'EQUIP.SETUP.REPORTED', '셋업/해제 결과 보고', 'EQUIPMENT', 'EVENT', 'EMAIL', 'NORMAL', '설비 셋업/해제 완료 시 결과 보고', 'EquipSetupService#report', 'Y'),
    (16, 'BATCH.WEEKLY.PENDING', '주간 미처리 리포트', 'BATCH', 'BATCH', 'EMAIL', 'LOW', '매주 월요일 08시 팀장에게 발송', 'WeeklyReportBatch#run', 'Y');

-- ---------------------------------------------------------------------
-- 이벤트 <-> 템플릿 바인딩   ★ "지금 어떤 메일이 어떤 템플릿으로 나가는가"
--   · 미매핑(발송 시 실패하는 지점): REQUEST.COMPLETED, ACCOUNT.LOCKED
--   · 비활성 템플릿에 연결된 이벤트도 매핑 현황 화면에서 경고로 노출된다
-- ---------------------------------------------------------------------
INSERT INTO MAIL_EVENT_TEMPLATE
    (MAP_ID, EVENT_ID, TEMPLATE_ID, LOCALE_CODE, BRAND_CODE, PRIORITY, VALID_FROM_DT, VALID_TO_DT,
     FROM_NAME, FROM_EMAIL, REPLY_TO, BCC_LIST, ACTIVE_YN, REG_ID)
VALUES
    (1, 1, 1, 'ko_KR', 'DEFAULT', 1, NULL, NULL, 'NexHub 결재', 'approval@nexhub.example.com', NULL, 'archive@nexhub.example.com', 'Y', 'system'),
    (2, 2, 2, 'ko_KR', 'DEFAULT', 1, NULL, NULL, 'NexHub 결재', 'approval@nexhub.example.com', NULL, NULL, 'Y', 'system'),
    (3, 3, 2, 'ko_KR', 'DEFAULT', 1, NULL, NULL, 'NexHub 결재', 'approval@nexhub.example.com', NULL, NULL, 'Y', 'system'),
    (4, 4, 3, 'ko_KR', 'DEFAULT', 1, NULL, NULL, 'NexHub 업무의뢰', 'workflow@nexhub.example.com', 'workflow@nexhub.example.com', NULL, 'Y', 'system'),
    (5, 5, 4, 'ko_KR', 'DEFAULT', 1, NULL, NULL, 'NexHub 업무의뢰', 'workflow@nexhub.example.com', NULL, NULL, 'Y', 'system'),
    (6, 6, 5, 'ko_KR', 'DEFAULT', 1, NULL, NULL, 'NexHub 업무의뢰', 'workflow@nexhub.example.com', NULL, NULL, 'Y', 'system'),
    (7, 8, 21, 'ko_KR', 'DEFAULT', 1, NULL, NULL, 'NexHub 설비관리', 'equipment@nexhub.example.com', 'equipment@nexhub.example.com', NULL, 'Y', 'system'),
    (8, 9, 7, 'ko_KR', 'DEFAULT', 1, NULL, NULL, 'NexHub 설비관리', 'equipment@nexhub.example.com', NULL, NULL, 'Y', 'system'),
    (9, 10, 22, 'ko_KR', 'DEFAULT', 1, NULL, NULL, 'NexHub 설비관리', 'equipment@nexhub.example.com', NULL, NULL, 'Y', 'system'),
    (15, 17, 23, 'ko_KR', 'DEFAULT', 1, NULL, NULL, 'NexHub 설비관리', 'equipment@nexhub.example.com', NULL, NULL, 'Y', 'system'),
    (16, 18, 24, 'ko_KR', 'DEFAULT', 1, NULL, NULL, 'NexHub 설비관리', 'equipment@nexhub.example.com', NULL, NULL, 'Y', 'system'),
    (10, 11, 9, 'ko_KR', 'DEFAULT', 1, NULL, NULL, 'NexHub 계정', 'no-reply@nexhub.example.com', NULL, NULL, 'Y', 'system'),
    (11, 12, 10, 'ko_KR', 'DEFAULT', 1, NULL, NULL, 'NexHub 계정', 'no-reply@nexhub.example.com', NULL, NULL, 'Y', 'system'),
    (12, 14, 11, 'ko_KR', 'DEFAULT', 1, NULL, NULL, 'NexHub 공지', 'notice@nexhub.example.com', NULL, NULL, 'Y', 'system'),
    (13, 15, 12, 'ko_KR', 'DEFAULT', 1, NULL, NULL, 'NexHub 공지', 'notice@nexhub.example.com', NULL, NULL, 'Y', 'system'),
    (14, 16, 13, 'ko_KR', 'DEFAULT', 1, NULL, NULL, 'NexHub 업무의뢰', 'workflow@nexhub.example.com', NULL, NULL, 'Y', 'system');

-- ---------------------------------------------------------------------
-- 수신자 결정 규칙   ★ "누구에게 보낼지"
--   이 규칙이 없으면 수신자 결정이 자바 코드에 박혀 재배포 없이는 못 바꾼다.
--   규칙 없는 이벤트: REQUEST.COMPLETED, ACCOUNT.LOCKED
-- ---------------------------------------------------------------------
INSERT INTO MAIL_EVENT_RECIPIENT
    (RECIPIENT_ID, EVENT_ID, RECIPIENT_TYPE, SEND_FIELD, TARGET_VALUE, CONDITION_EXPR, DESCRIPTION, SORT_ORDER, USE_YN, REG_ID)
VALUES
    (1, 1, 'APPROVER', 'TO', NULL, NULL, '결재선의 다음 차례 결재자', 1, 'Y', 'system'),
    (2, 1, 'DEPT_HEAD', 'CC', NULL, 'urgency == ''긴급''', '긴급 문서만 부서장 참조', 2, 'Y', 'system'),
    (3, 2, 'REQUESTER', 'TO', NULL, NULL, '기안자에게 결과 통보', 3, 'Y', 'system'),
    (4, 3, 'REQUESTER', 'TO', NULL, NULL, '기안자에게 반려 통보', 4, 'Y', 'system'),
    (5, 3, 'DEPT_HEAD', 'CC', NULL, NULL, '반려는 부서장도 인지', 5, 'Y', 'system'),
    (6, 4, 'ROLE', 'TO', 'WORKFLOW_MANAGER', NULL, '업무의뢰 접수 담당 역할', 6, 'Y', 'system'),
    (7, 4, 'REQUESTER', 'CC', NULL, NULL, '의뢰자 본인 확인용', 7, 'Y', 'system'),
    (8, 5, 'ASSIGNEE', 'TO', NULL, NULL, '배정된 담당자', 8, 'Y', 'system'),
    (9, 5, 'DEPT_HEAD', 'CC', NULL, NULL, '담당자 부서장', 9, 'Y', 'system'),
    (10, 6, 'ASSIGNEE', 'TO', NULL, NULL, '지연 건 담당자', 10, 'Y', 'system'),
    (11, 6, 'DEPT_HEAD', 'TO', NULL, NULL, '팀장도 함께 (에스컬레이션)', 11, 'Y', 'system'),
    (12, 8, 'ROLE', 'TO', 'EQUIP_MANAGER', NULL, '설비 지원 접수 역할', 12, 'Y', 'system'),
    (13, 8, 'TEAM', 'CC', 'D005', NULL, '설비팀 전체 참조', 13, 'Y', 'system'),
    (14, 9, 'ROLE', 'TO', 'EQUIP_MANAGER', NULL, '설비 담당자', 14, 'Y', 'system'),
    (15, 9, 'FIXED', 'CC', 'control-room@nexhub.example.com', NULL, '통합관제실 상시 참조', 15, 'Y', 'system'),
    (16, 10, 'REQUESTER', 'TO', NULL, NULL, '수리 요청자에게 결과 보고', 16, 'Y', 'system'),
    (17, 11, 'ROLE', 'TO', 'PERMISSION_APPROVER', NULL, '권한 승인권자', 17, 'Y', 'system'),
    (18, 12, 'EXPRESSION', 'TO', '${user.email}', NULL, '본인 계정 주소', 18, 'Y', 'system'),
    (19, 14, 'TEAM', 'TO', 'ALL', NULL, '전사 공지 대상', 19, 'Y', 'system'),
    (20, 15, 'TEAM', 'TO', 'ALL', NULL, '전사 점검 공지', 20, 'Y', 'system'),
    (21, 16, 'ROLE', 'TO', 'TEAM_LEAD', NULL, '팀장 대상 주간 리포트', 21, 'Y', 'system'),
    (22, 17, 'REQUESTER', 'TO', NULL, NULL, '개조 요청자에게 결과 보고', 22, 'Y', 'system'),
    (23, 17, 'ROLE', 'CC', 'EQUIP_MANAGER', NULL, '설비 담당 역할 참조', 23, 'Y', 'system'),
    (24, 18, 'REQUESTER', 'TO', NULL, NULL, '셋업 요청자에게 결과 보고', 24, 'Y', 'system'),
    (25, 18, 'TEAM', 'CC', 'D005', NULL, '설비팀 전체 참조', 25, 'Y', 'system');

-- ---------------------------------------------------------------------
-- 발송 이력 (VERSION_ID 를 남겨야 발송 당시 원문을 재현할 수 있다)
-- ---------------------------------------------------------------------
INSERT INTO MAIL_SEND_LOG
    (LOG_ID, SEND_TYPE, EVENT_ID, TEMPLATE_ID, VERSION_ID, SUBJECT_SNAP, MERGE_DATA_JSON,
     FROM_EMAIL, TO_EMAIL, TO_NAME, STATUS_CODE, ERROR_CODE, ERROR_MESSAGE, RETRY_CNT,
     SMTP_MESSAGE_ID, REQ_ID, REQ_DT, SENT_DT, OPEN_DT)
VALUES
    (1000, 'REAL', 1, 1, 102, '[결재요청] 3분기 설비 구매 품의',
     '{"drafterName":"이영희","docNo":"DOC-2026-0912","docTitle":"3분기 설비 구매 품의","draftDept":"R&D본부 플랫폼개발팀","draftDate":"2026-08-19","dueDate":"2026-08-21","urgency":"긴급","actionUrl":"https://nexhub.example.com/work-group/request-workflow?docNo=DOC-2026-0912&from=mail","docViewUrl":"https://nexhub.example.com/work-group/request-workflow?docNo=DOC-2026-0912&mode=view&from=mail","listUrl":"https://nexhub.example.com/work-group/request-workflow?tab=inbox&from=mail"}',
     'approval@nexhub.example.com', 'manager@nexhub.example.com', '박부장', 'SENT', NULL, NULL, 0, '<msg-1000@nexhub>', 'system', '2026-08-20 09:00:00', '2026-08-20 09:00:00', '2026-08-20 09:00:00'),
    (1001, 'REAL', 4, 3, 301, '[의뢰접수] REQ-2026-0451 공정 모니터링 대시보드 지표 추가',
     '{"requesterName":"정수진","requesterDept":"경영지원본부 총무팀","requestNo":"REQ-2026-0451","requestTitle":"공정 모니터링 대시보드 지표 추가","requestType":"기능개선","requestContent":"설비별 가동률 지표를 대시보드 상단에 추가해 주세요. 기준은 일 단위입니다.","dueDate":"2026-09-05","attachments":[{"name":"요구사항_정리.xlsx","url":"https://nexhub.example.com/work-group/files/8821"},{"name":"화면_예시.png","url":"https://nexhub.example.com/work-group/files/8822"}],"actionUrl":"https://nexhub.example.com/work-group/request-workflow?requestNo=REQ-2026-0451&action=accept&from=mail","listUrl":"https://nexhub.example.com/work-group/request-workflow?tab=pending&from=mail"}',
     'workflow@nexhub.example.com', 'dev.kim@nexhub.example.com', '김개발', 'SENT', NULL, NULL, 0, '<msg-1001@nexhub>', 'system', '2026-08-20 10:07:00', '2026-08-20 10:07:00', NULL),
    (1002, 'REAL', 9, 7, 701, '[설비경고] CNC 밀링머신 #3 주축 온도 임계치 초과',
     '{"equipName":"CNC 밀링머신 #3","location":"2공장 B라인","alertType":"주축 온도","currentValue":"87.4℃","threshold":"80.0℃","detectedAt":"2026-08-20 14:32","actionUrl":"https://nexhub.example.com/work-group/equipment-monitor?equip=CNC-003&from=mail","supportUrl":"https://nexhub.example.com/work-group/equipment-support-request?equip=CNC-003&from=mail"}',
     'equipment@nexhub.example.com', 'equip.choi@nexhub.example.com', '최지훈', 'SENT', NULL, NULL, 0, '<msg-1002@nexhub>', 'system', '2026-08-20 11:14:00', '2026-08-20 11:14:00', NULL),
    (1003, 'REAL', 5, 4, 401, '[담당배정] REQ-2026-0451 공정 모니터링 대시보드 지표 추가',
     '{"assigneeName":"김개발","requestNo":"REQ-2026-0451","requestTitle":"공정 모니터링 대시보드 지표 추가","requesterName":"정수진","assignerName":"박팀장","dueDate":"2026-09-05","actionUrl":"https://nexhub.example.com/work-group/request-workflow?requestNo=REQ-2026-0451&action=start&from=mail","rejectUrl":"https://nexhub.example.com/work-group/request-workflow?requestNo=REQ-2026-0451&action=reject&from=mail"}',
     'workflow@nexhub.example.com', 'dev.kim@nexhub.example.com', '김개발', 'SENT', NULL, NULL, 0, '<msg-1003@nexhub>', 'system', '2026-08-20 12:21:00', '2026-08-20 12:21:00', '2026-08-20 12:21:00'),
    (1004, 'REAL', 1, 1, 102, '[결재요청] 3분기 설비 구매 품의',
     '{"drafterName":"이영희","docNo":"DOC-2026-0912","docTitle":"3분기 설비 구매 품의","draftDept":"R&D본부 플랫폼개발팀","draftDate":"2026-08-19","dueDate":"2026-08-21","urgency":"긴급","actionUrl":"https://nexhub.example.com/work-group/request-workflow?docNo=DOC-2026-0912&from=mail","docViewUrl":"https://nexhub.example.com/work-group/request-workflow?docNo=DOC-2026-0912&mode=view&from=mail","listUrl":"https://nexhub.example.com/work-group/request-workflow?tab=inbox&from=mail"}',
     'approval@nexhub.example.com', 'director@nexhub.example.com', '조이사', 'SENT', NULL, NULL, 0, '<msg-1004@nexhub>', 'system', '2026-08-19 13:28:00', '2026-08-19 13:28:00', NULL),
    (1005, 'REAL', 2, 2, 201, '[결재승인] 3분기 설비 구매 품의',
     '{"docTitle":"3분기 설비 구매 품의","resultText":"승인","approverName":"박부장","comment":"예산 범위 내에서 진행 바랍니다.","actionUrl":"https://nexhub.example.com/work-group/request-workflow?docNo=DOC-2026-0912&from=mail"}',
     'approval@nexhub.example.com', 'lee@nexhub.example.com', '이영희', 'SENT', NULL, NULL, 0, '<msg-1005@nexhub>', 'system', '2026-08-19 14:35:00', '2026-08-19 14:35:00', NULL),
    (1006, 'REAL', 8, 21, 2101, '[설비지원] ${formData.requestNo} ${formData.title}',
     '{"formData":{"requestNo":"REQ-2023-1001","title":"조립라인 A 모터 소음 이상 관련 지원 요청","project":"PJ-2023-001","requester":"홍길동","dueDate":"2023-10-05","deviceName":"EQ-202/Main Motor","location":"A동 2층 조립라인","recipe":"RECIPE-A-001","supportType":"설비지원","assignee":"김철수","consultants":"김철수, 이영희","processingMethod":"내부","outsourcingCompany":"","expectedCompletionDate":"2023-10-03 18:00","content":"조립 라인에서 가동 중 모터에서 평소와 다른 수준의 소음이 발생하고 있습니다. 진동도 약간 증가한 것 같아 점검 요청드립니다.","receiveComment":"현장 방문하여 소음 측정 후 베어링 교체 필요성 판단 예정입니다.","approvalStatus":"approved","files":["noise_recording.mp3","vibration_log.csv"],"receiveFiles":["motor_spec_v2.pdf"],"supportContent":"현장 방문 후 베어링 상태 점검 및 임시 조치 수행","supportTime":"3시간 30분","supportPersonnel":"2","supportNotes":"특이사항 없음. 정상 가동 확인 완료.","supportFiles":["site_photo_01.jpg"]},"progressRows":[{"date":"2023-10-01","content":"모터 탈거 및 육안 점검 수행","worker":"홍길동","status":"완료","remark":"-"},{"date":"2023-10-02","content":"베어링 임시 조치 및 시운전","worker":"김철수","status":"완료","remark":"소음 수치 확인"}],"resultFiles1":["result_report.docx"],"resultFiles2":[]}',
     'equipment@nexhub.example.com', 'equip1@nexhub.example.com', '설비1팀', 'SENT', NULL, NULL, 0, '<msg-1006@nexhub>', 'system', '2026-08-19 15:42:00', '2026-08-19 15:42:00', '2026-08-19 15:42:00'),
    (1007, 'REAL', 6, 5, 501, '[지연알림] 미처리 업무 3건이 기한을 초과했습니다',
     '{"assigneeName":"김개발","delayCount":"3","delayedItems":[{"requestNo":"REQ-2026-0398","title":"바코드 프린터 연동 오류","delayDays":5,"url":"https://nexhub.example.com/work-group/request-workflow?requestNo=REQ-2026-0398&from=mail"},{"requestNo":"REQ-2026-0412","title":"권한 그룹 재정비","delayDays":2,"url":"https://nexhub.example.com/work-group/request-workflow?requestNo=REQ-2026-0412&from=mail"}],"actionUrl":"https://nexhub.example.com/work-group/request-workflow?tab=delayed&from=mail"}',
     'workflow@nexhub.example.com', 'dev.kim@nexhub.example.com', '김개발', 'SENT', NULL, NULL, 0, '<msg-1007@nexhub>', 'system', '2026-08-18 16:49:00', '2026-08-18 16:49:00', NULL),
    (1008, 'REAL', 6, 5, 501, '[지연알림] 미처리 업무 3건이 기한을 초과했습니다',
     '{"assigneeName":"김개발","delayCount":"3","delayedItems":[{"requestNo":"REQ-2026-0398","title":"바코드 프린터 연동 오류","delayDays":5,"url":"https://nexhub.example.com/work-group/request-workflow?requestNo=REQ-2026-0398&from=mail"},{"requestNo":"REQ-2026-0412","title":"권한 그룹 재정비","delayDays":2,"url":"https://nexhub.example.com/work-group/request-workflow?requestNo=REQ-2026-0412&from=mail"}],"actionUrl":"https://nexhub.example.com/work-group/request-workflow?tab=delayed&from=mail"}',
     'workflow@nexhub.example.com', 'teamlead@nexhub.example.com', '박팀장', 'SENT', NULL, NULL, 0, '<msg-1008@nexhub>', 'system', '2026-08-18 09:56:00', '2026-08-18 09:56:00', NULL),
    (1009, 'REAL', 11, 9, 901, '[승인요청] 오세훈님의 설비 모니터링 조회 권한 신청',
     '{"applicantName":"오세훈","applicantDept":"R&D본부 AI연구팀","permissionName":"설비 모니터링 조회","reason":"공정 데이터 분석 업무 수행을 위해 필요합니다.","appliedAt":"2026-08-20 11:05","actionUrl":"https://nexhub.example.com/system/menus?tab=approval&applyNo=PRM-2026-0088&from=mail","listUrl":"https://nexhub.example.com/system/menus?from=mail"}',
     'no-reply@nexhub.example.com', 'admin@nexhub.example.com', '시스템관리자', 'SENT', NULL, NULL, 0, '<msg-1009@nexhub>', 'system', '2026-08-18 10:03:00', '2026-08-18 10:03:00', '2026-08-18 10:03:00'),
    (1010, 'REAL', 9, 7, 701, '[설비경고] CNC 밀링머신 #3 주축 온도 임계치 초과',
     '{"equipName":"CNC 밀링머신 #3","location":"2공장 B라인","alertType":"주축 온도","currentValue":"87.4℃","threshold":"80.0℃","detectedAt":"2026-08-20 14:32","actionUrl":"https://nexhub.example.com/work-group/equipment-monitor?equip=CNC-003&from=mail","supportUrl":"https://nexhub.example.com/work-group/equipment-support-request?equip=CNC-003&from=mail"}',
     'equipment@nexhub.example.com', 'equip.old@nexhub.example.co', '설비2팀', 'FAILED', 'SMTP_550', '550 5.1.1 Recipient address rejected: User unknown', 3, NULL, 'system', '2026-08-17 11:10:00', NULL, NULL),
    (1011, 'REAL', 3, 2, 201, '[결재승인] 3분기 설비 구매 품의',
     '{"docTitle":"3분기 설비 구매 품의","resultText":"승인","approverName":"박부장","comment":"예산 범위 내에서 진행 바랍니다.","actionUrl":"https://nexhub.example.com/work-group/request-workflow?docNo=DOC-2026-0912&from=mail"}',
     'approval@nexhub.example.com', 'han@nexhub.example.com', '한지민', 'SENT', NULL, NULL, 0, '<msg-1011@nexhub>', 'system', '2026-08-17 12:17:00', '2026-08-17 12:17:00', NULL),
    (1012, 'REAL', 14, 11, 1101, '[공지] 2026년 하반기 안전교육 이수 안내',
     '{"noticeTitle":"2026년 하반기 안전교육 이수 안내","writerName":"안전보건팀","postedAt":"2026-08-20","noticeSummary":"전 직원 대상 하반기 안전교육을 9월 중 이수해야 합니다. 미이수 시 현장 출입이 제한됩니다.","requireConfirm":"true","actionUrl":"https://nexhub.example.com/posts/1042?from=mail"}',
     'notice@nexhub.example.com', 'all-staff@nexhub.example.com', '전사', 'SENT', NULL, NULL, 0, '<msg-1012@nexhub>', 'system', '2026-08-16 13:24:00', '2026-08-16 13:24:00', '2026-08-16 13:24:00'),
    (1013, 'REAL', 12, 10, 1001, '[NexHub] 비밀번호 재설정 안내',
     '{"userName":"홍길동","actionUrl":"https://nexhub.example.com/login?reset=abc123&from=mail","expireMinutes":"30"}',
     'no-reply@nexhub.example.com', 'jung@partner.example.com', '정수진', 'BOUNCED', 'BOUNCE_HARD', 'Mailbox does not exist', 1, NULL, 'system', '2026-08-16 14:31:00', NULL, NULL),
    (1014, 'REAL', 8, 21, 2101, '[설비지원] ${formData.requestNo} ${formData.title}',
     '{"formData":{"requestNo":"REQ-2023-1001","title":"조립라인 A 모터 소음 이상 관련 지원 요청","project":"PJ-2023-001","requester":"홍길동","dueDate":"2023-10-05","deviceName":"EQ-202/Main Motor","location":"A동 2층 조립라인","recipe":"RECIPE-A-001","supportType":"설비지원","assignee":"김철수","consultants":"김철수, 이영희","processingMethod":"내부","outsourcingCompany":"","expectedCompletionDate":"2023-10-03 18:00","content":"조립 라인에서 가동 중 모터에서 평소와 다른 수준의 소음이 발생하고 있습니다. 진동도 약간 증가한 것 같아 점검 요청드립니다.","receiveComment":"현장 방문하여 소음 측정 후 베어링 교체 필요성 판단 예정입니다.","approvalStatus":"approved","files":["noise_recording.mp3","vibration_log.csv"],"receiveFiles":["motor_spec_v2.pdf"],"supportContent":"현장 방문 후 베어링 상태 점검 및 임시 조치 수행","supportTime":"3시간 30분","supportPersonnel":"2","supportNotes":"특이사항 없음. 정상 가동 확인 완료.","supportFiles":["site_photo_01.jpg"]},"progressRows":[{"date":"2023-10-01","content":"모터 탈거 및 육안 점검 수행","worker":"홍길동","status":"완료","remark":"-"},{"date":"2023-10-02","content":"베어링 임시 조치 및 시운전","worker":"김철수","status":"완료","remark":"소음 수치 확인"}],"resultFiles1":["result_report.docx"],"resultFiles2":[]}',
     'equipment@nexhub.example.com', 'equip1@nexhub.example.com', '설비1팀', 'SENT', NULL, NULL, 0, '<msg-1014@nexhub>', 'system', '2026-08-15 15:38:00', '2026-08-15 15:38:00', NULL),
    (1015, 'REAL', 10, 22, 2201, '[고장수리] ${formData.requestNo} ${formData.title}',
     '{"formData":{"requestNo":"REQ-2023-1001","title":"조립라인 A 모터 소음 이상 관련 지원 요청","project":"PJ-2023-001","requester":"홍길동","dueDate":"2023-10-05","deviceName":"EQ-202/Main Motor","location":"A동 2층 조립라인","recipe":"RECIPE-A-001","supportType":"고장수리","assignee":"김철수","consultants":"김철수, 이영희","processingMethod":"내부","outsourcingCompany":"","expectedCompletionDate":"2023-10-03 18:00","content":"조립 라인에서 가동 중 모터에서 평소와 다른 수준의 소음이 발생하고 있습니다. 진동도 약간 증가한 것 같아 점검 요청드립니다.","receiveComment":"현장 방문하여 소음 측정 후 베어링 교체 필요성 판단 예정입니다.","approvalStatus":"approved","files":["noise_recording.mp3","vibration_log.csv"],"receiveFiles":["motor_spec_v2.pdf"],"failureStatus":"가동중지","repairAction":"주축 베어링 교체 및 윤활유 보충","causeNote":"장기간 윤활 부족으로 인한 베어링 마모로 확인됨","purchaseCost":"450,000","vendorManager":"대성기공 박과장","delayReason":"","selectedCauses":["윤활 불량","부품 노후"],"selectedMeasures":["부품 교체","점검주기 단축"],"causeRows":[{"category":"직접원인","detail":"주축 베어링 마모로 인한 이상 소음"}],"partRows":[{"device":"EQ-202","name":"주축 베어링 6205ZZ","maker":"NSK","spec":"25×52×15","qty":2},{"device":"EQ-202","name":"윤활유 ISO VG68","maker":"SHELL","spec":"4L","qty":1}],"workerRows":[{"department":"설비1팀","name":"강도현","workTime":180},{"department":"설비1팀","name":"오세훈","workTime":120}],"repairFiles":["repair_result.pdf"]}}',
     'equipment@nexhub.example.com', 'han@nexhub.example.com', '한지민', 'SENT', NULL, NULL, 0, '<msg-1015@nexhub>', 'system', '2026-08-14 16:45:00', '2026-08-14 16:45:00', '2026-08-14 16:45:00'),
    (1016, 'REAL', 17, 23, 2301, '[개조/개선] ${formData.requestNo} ${formData.title}',
     '{"formData":{"requestNo":"REQ-2023-1001","title":"조립라인 A 모터 소음 이상 관련 지원 요청","project":"PJ-2023-001","requester":"홍길동","dueDate":"2023-10-05","deviceName":"EQ-202/Main Motor","location":"A동 2층 조립라인","recipe":"RECIPE-A-001","supportType":"개조/개선","assignee":"김철수","consultants":"김철수, 이영희","processingMethod":"내부","outsourcingCompany":"","expectedCompletionDate":"2023-10-03 18:00","content":"조립 라인에서 가동 중 모터에서 평소와 다른 수준의 소음이 발생하고 있습니다. 진동도 약간 증가한 것 같아 점검 요청드립니다.","receiveComment":"현장 방문하여 소음 측정 후 베어링 교체 필요성 판단 예정입니다.","approvalStatus":"approved","files":["noise_recording.mp3","vibration_log.csv"],"receiveFiles":["motor_spec_v2.pdf"],"improvementPurpose":"사이클 타임 단축 및 작업자 안전 확보","modificationContent":"이송 컨베이어 속도 제어부 교체, 안전 커버 추가 설치","modificationCost":"2,800,000","improvementEffect":"사이클 타임 12% 단축, 협착 위험 구간 제거","technicalDocs":"개조도면 REV.B, 안전성 검토서","participants":"김철수, 이영희, 대성기공 2명","workStartDate":"2023-10-10","workEndDate":"2023-10-12","modificationFiles":["modification_drawing_revB.pdf"]}}',
     'equipment@nexhub.example.com', 'jung@nexhub.example.com', '정수진', 'SENT', NULL, NULL, 0, '<msg-1016@nexhub>', 'system', '2026-08-17 09:52:00', '2026-08-17 09:52:00', NULL),
    (1017, 'REAL', 16, 13, 1301, '[주간리포트] 2026년 34주차 미처리 현황',
     '{"weekLabel":"2026년 34주차","teamName":"플랫폼개발팀","totalCount":"17","delayCount":"4","members":[{"name":"김개발","pending":7,"delayed":2},{"name":"오세훈","pending":6,"delayed":1},{"name":"강도현","pending":4,"delayed":1}],"actionUrl":"https://nexhub.example.com/?tab=pending&from=mail"}',
     'workflow@nexhub.example.com', 'teamlead@nexhub.example.com', '박팀장', 'SENT', NULL, NULL, 0, '<msg-1017@nexhub>', 'system', '2026-08-13 10:59:00', '2026-08-13 10:59:00', NULL),
    (1018, 'REAL', 15, 12, 1201, '[점검안내] 2026-08-30 시스템 정기 점검',
     '{"maintDate":"2026-08-30","maintTime":"02:00 ~ 05:00","maintTarget":"전체 서비스"}',
     'notice@nexhub.example.com', 'all-staff@nexhub.example.com', '전사', 'QUEUED', NULL, NULL, 0, NULL, 'system', '2026-08-20 11:06:00', NULL, NULL),
    (2001, 'TEST', NULL, 1, 102, '[결재요청] 테스트 문서',
     '{"drafterName":"테스트","docNo":"DOC-TEST-0001","docTitle":"테스트 문서"}',
     'approval@nexhub.example.com', 'lee@nexhub.example.com', '이영희', 'SENT', NULL, NULL, 0, '<test-2001@nexhub>', 'lee', '2026-08-20 15:40:00', '2026-08-20 15:40:00', NULL);
