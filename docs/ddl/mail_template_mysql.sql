-- =====================================================================
--  메일 템플릿 관리 DDL  /  MySQL 8.x · MariaDB 10.x
--  (H2 는 MODE=MySQL 로 기동 시 그대로 사용 가능)
--
--  설계문서: docs/mail-template-설계.md
--
--  구성
--    1. MAIL_TEMPLATE_LAYOUT   공통 레이아웃(헤더/푸터/기본CSS)
--    2. MAIL_TEMPLATE          템플릿 마스터
--    3. MAIL_TEMPLATE_VERSION  본문 버전 이력  (수정 = 새 행)
--    4. MAIL_TEMPLATE_VAR      템플릿 변수 정의
--    5. MAIL_TEMPLATE_ATTACH   고정첨부 / 인라인 이미지(CID)
--    6. MAIL_EVENT             메일 발송 지점(이벤트) 정의
--    7. MAIL_EVENT_TEMPLATE    이벤트 <-> 템플릿 바인딩   ★ 무엇을 보낼지
--    7-1. MAIL_EVENT_RECIPIENT 수신자 결정 규칙          ★ 누구에게 보낼지
--    8. MAIL_SEND_LOG          발송 이력 (실발송 + 테스트)
--    9. V_MAIL_DISPATCH_MAP    발송 매핑 현황 조회 뷰
--
--  주의: 본문(BODY_HTML)에는 Velocity/Thymeleaf 문법이 포함된 HTML 이 그대로 저장된다.
--        파일(.vm)이 아니라 DB 문자열을 StringResourceLoader 로 머지하는 구조.
-- =====================================================================

SET NAMES utf8mb4;

-- 개발 편의를 위한 재생성 (운영 반영 시 이 블록은 제거할 것)
DROP TABLE IF EXISTS MAIL_SEND_LOG;
DROP TABLE IF EXISTS MAIL_EVENT_RECIPIENT;
DROP TABLE IF EXISTS MAIL_EVENT_TEMPLATE;
DROP TABLE IF EXISTS MAIL_EVENT;
DROP TABLE IF EXISTS MAIL_TEMPLATE_ATTACH;
DROP TABLE IF EXISTS MAIL_TEMPLATE_VAR;
DROP TABLE IF EXISTS MAIL_TEMPLATE_VERSION;
DROP TABLE IF EXISTS MAIL_TEMPLATE;
DROP TABLE IF EXISTS MAIL_TEMPLATE_LAYOUT;


-- ---------------------------------------------------------------------
-- 1. MAIL_TEMPLATE_LAYOUT : 공통 레이아웃
--    CI/법적고지/푸터를 템플릿마다 복붙하지 않기 위해 분리.
--    최종 본문 = HEADER_HTML + (템플릿 BODY_HTML) + FOOTER_HTML
-- ---------------------------------------------------------------------
CREATE TABLE MAIL_TEMPLATE_LAYOUT (
    LAYOUT_ID       BIGINT        NOT NULL AUTO_INCREMENT COMMENT '레이아웃 ID',
    LAYOUT_CODE     VARCHAR(60)   NOT NULL                COMMENT '레이아웃 코드 (예: DEFAULT_KO)',
    LAYOUT_NAME     VARCHAR(150)  NOT NULL                COMMENT '레이아웃 명',
    HEADER_HTML     LONGTEXT      NULL                    COMMENT '상단 공통 HTML (로고/CI)',
    FOOTER_HTML     LONGTEXT      NULL                    COMMENT '하단 공통 HTML (법적고지/수신거부)',
    BASE_CSS        LONGTEXT      NULL                    COMMENT '기본 CSS (인라이너 입력용)',
    BODY_WIDTH      INT           NOT NULL DEFAULT 600    COMMENT '본문 최대 폭(px)',
    DESCRIPTION     VARCHAR(500)  NULL                    COMMENT '설명',
    USE_YN          CHAR(1)       NOT NULL DEFAULT 'Y'    COMMENT '사용여부 Y/N',
    REG_ID          VARCHAR(50)   NULL                    COMMENT '등록자',
    REG_DT          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '등록일시',
    UPD_ID          VARCHAR(50)   NULL                    COMMENT '수정자',
    UPD_DT          DATETIME      NULL ON UPDATE CURRENT_TIMESTAMP   COMMENT '수정일시',
    PRIMARY KEY (LAYOUT_ID),
    UNIQUE KEY UK_MAIL_LAYOUT_CODE (LAYOUT_CODE)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='메일 공통 레이아웃';


-- ---------------------------------------------------------------------
-- 2. MAIL_TEMPLATE : 템플릿 마스터
--    본문은 여기 두지 않는다. 본문은 항상 VERSION 테이블에 있고
--    마스터는 "현재 어떤 버전이 활성인가(CURRENT_VERSION_ID)"만 가리킨다.
-- ---------------------------------------------------------------------
CREATE TABLE MAIL_TEMPLATE (
    TEMPLATE_ID         BIGINT        NOT NULL AUTO_INCREMENT COMMENT '템플릿 ID',
    TEMPLATE_CODE       VARCHAR(60)   NOT NULL                COMMENT '템플릿 코드 (업무키, 예: APPROVAL_REQUEST_KO)',
    TEMPLATE_NAME       VARCHAR(150)  NOT NULL                COMMENT '템플릿 명',
    CATEGORY_CODE       VARCHAR(30)   NOT NULL                COMMENT '카테고리 APPROVAL/REQUEST/EQUIPMENT/NOTICE/ACCOUNT/REPORT',
    ENGINE_TYPE         VARCHAR(20)   NOT NULL DEFAULT 'VELOCITY' COMMENT '렌더 엔진 VELOCITY/THYMELEAF/PLAIN',
    LOCALE_CODE         VARCHAR(10)   NOT NULL DEFAULT 'ko_KR'    COMMENT '언어 (ko_KR/en_US/ja_JP)',
    LAYOUT_ID           BIGINT        NULL                    COMMENT '적용 레이아웃',
    STATUS_CODE         VARCHAR(20)   NOT NULL DEFAULT 'DRAFT' COMMENT '상태 DRAFT/REVIEW/ACTIVE/ARCHIVED',
    CURRENT_VERSION_ID  BIGINT        NULL                    COMMENT '현재 활성 버전 ID (MAIL_TEMPLATE_VERSION)',
    OWNER_DEPT_CODE     VARCHAR(30)   NULL                    COMMENT '담당 부서 코드',
    OWNER_USER_ID       VARCHAR(50)   NULL                    COMMENT '담당자 ID',
    DESCRIPTION         VARCHAR(500)  NULL                    COMMENT '템플릿 설명',
    THUMB_URL           VARCHAR(300)  NULL                    COMMENT '목록용 썸네일 경로',
    TAGS                VARCHAR(300)  NULL                    COMMENT '검색 태그 (콤마 구분)',
    USE_YN              CHAR(1)       NOT NULL DEFAULT 'Y'    COMMENT '사용여부',
    DEL_YN              CHAR(1)       NOT NULL DEFAULT 'N'    COMMENT '삭제여부 (논리삭제)',
    REG_ID              VARCHAR(50)   NULL                    COMMENT '등록자',
    REG_DT              DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '등록일시',
    UPD_ID              VARCHAR(50)   NULL                    COMMENT '수정자',
    UPD_DT              DATETIME      NULL ON UPDATE CURRENT_TIMESTAMP   COMMENT '수정일시',
    PRIMARY KEY (TEMPLATE_ID),
    UNIQUE KEY UK_MAIL_TPL_CODE (TEMPLATE_CODE),
    KEY IX_MAIL_TPL_CATEGORY (CATEGORY_CODE, STATUS_CODE),
    KEY IX_MAIL_TPL_LAYOUT (LAYOUT_ID),
    CONSTRAINT FK_MAIL_TPL_LAYOUT FOREIGN KEY (LAYOUT_ID)
        REFERENCES MAIL_TEMPLATE_LAYOUT (LAYOUT_ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='메일 템플릿 마스터';


-- ---------------------------------------------------------------------
-- 3. MAIL_TEMPLATE_VERSION : 본문 버전 이력
--    본문 수정은 UPDATE 가 아니라 항상 INSERT (새 버전) 로 처리한다.
--    → 감사추적 / 롤백 / 발송로그의 사후 재현이 가능해진다.
-- ---------------------------------------------------------------------
CREATE TABLE MAIL_TEMPLATE_VERSION (
    VERSION_ID      BIGINT        NOT NULL AUTO_INCREMENT COMMENT '버전 ID',
    TEMPLATE_ID     BIGINT        NOT NULL                COMMENT '템플릿 ID',
    VERSION_NO      INT           NOT NULL                COMMENT '버전 번호 (1부터 증가)',
    SUBJECT         VARCHAR(300)  NOT NULL                COMMENT '메일 제목 (치환식 사용 가능)',
    PREHEADER       VARCHAR(200)  NULL                    COMMENT '프리헤더 (받은편지함 미리보기 문구)',
    BODY_HTML       LONGTEXT      NOT NULL                COMMENT 'HTML 본문 (Velocity/Thymeleaf 문법 포함)',
    BODY_TEXT       LONGTEXT      NULL                    COMMENT 'text/plain 대체 본문 (multipart/alternative)',
    ENGINE_TYPE     VARCHAR(20)   NOT NULL DEFAULT 'VELOCITY' COMMENT '이 버전의 렌더 엔진',
    LAYOUT_ID       BIGINT        NULL                    COMMENT '이 버전이 사용한 레이아웃 (미지정 시 마스터 값)',
    STATUS_CODE     VARCHAR(20)   NOT NULL DEFAULT 'DRAFT' COMMENT '상태 DRAFT/ACTIVE/ARCHIVED',
    CHANGE_NOTE     VARCHAR(500)  NULL                    COMMENT '변경 사유 (필수 입력 권장)',
    BODY_CHECKSUM   VARCHAR(64)   NULL                    COMMENT '본문 SHA-256 (동일 내용 중복 버전 방지)',
    APPROVED_BY     VARCHAR(50)   NULL                    COMMENT '승인자',
    APPROVED_DT     DATETIME      NULL                    COMMENT '승인일시',
    REG_ID          VARCHAR(50)   NULL                    COMMENT '등록자',
    REG_DT          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '등록일시',
    PRIMARY KEY (VERSION_ID),
    UNIQUE KEY UK_MAIL_VER_NO (TEMPLATE_ID, VERSION_NO),
    KEY IX_MAIL_VER_TPL (TEMPLATE_ID, STATUS_CODE),
    CONSTRAINT FK_MAIL_VER_TPL FOREIGN KEY (TEMPLATE_ID)
        REFERENCES MAIL_TEMPLATE (TEMPLATE_ID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='메일 템플릿 본문 버전';

-- 마스터 -> 현재버전 FK (순환 참조이므로 테이블 생성 후 별도 추가)
ALTER TABLE MAIL_TEMPLATE
    ADD CONSTRAINT FK_MAIL_TPL_CURVER FOREIGN KEY (CURRENT_VERSION_ID)
        REFERENCES MAIL_TEMPLATE_VERSION (VERSION_ID);


-- ---------------------------------------------------------------------
-- 4. MAIL_TEMPLATE_VAR : 템플릿 변수 정의
--    본문에서 정규식으로 변수를 긁으면 타입/필수/설명을 알 수 없다.
--    명시 정의가 있어야 (1) 테스트발송 폼 자동생성 (2) 발송 전 필수값 검증이 가능.
-- ---------------------------------------------------------------------
CREATE TABLE MAIL_TEMPLATE_VAR (
    VAR_ID          BIGINT        NOT NULL AUTO_INCREMENT COMMENT '변수 ID',
    TEMPLATE_ID     BIGINT        NOT NULL                COMMENT '템플릿 ID',
    VAR_NAME        VARCHAR(60)   NOT NULL                COMMENT '변수명 (예: userName -> ${userName})',
    VAR_PATH        VARCHAR(200)  NULL                    COMMENT '실제 표현식 (예: ${order.items[].name})',
    DATA_TYPE       VARCHAR(20)   NOT NULL DEFAULT 'STRING' COMMENT 'STRING/NUMBER/DATE/BOOLEAN/LIST/OBJECT/URL',
    REQUIRED_YN     CHAR(1)       NOT NULL DEFAULT 'N'    COMMENT '필수여부 - Y 인데 값 없으면 발송 중단',
    SAMPLE_VALUE    VARCHAR(1000) NULL                    COMMENT '미리보기/테스트 기본값',
    DESCRIPTION     VARCHAR(300)  NULL                    COMMENT '변수 설명 (운영자용)',
    SORT_ORDER      INT           NOT NULL DEFAULT 0      COMMENT '정렬 순서',
    PRIMARY KEY (VAR_ID),
    UNIQUE KEY UK_MAIL_VAR (TEMPLATE_ID, VAR_NAME),
    CONSTRAINT FK_MAIL_VAR_TPL FOREIGN KEY (TEMPLATE_ID)
        REFERENCES MAIL_TEMPLATE (TEMPLATE_ID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='메일 템플릿 변수 정의';


-- ---------------------------------------------------------------------
-- 5. MAIL_TEMPLATE_ATTACH : 고정 첨부 / 인라인 이미지
--    ATTACH_TYPE='INLINE' 인 경우 본문에서 <img src="cid:${CID}"> 로 참조.
-- ---------------------------------------------------------------------
CREATE TABLE MAIL_TEMPLATE_ATTACH (
    ATTACH_ID       BIGINT        NOT NULL AUTO_INCREMENT COMMENT '첨부 ID',
    TEMPLATE_ID     BIGINT        NOT NULL                COMMENT '템플릿 ID',
    ATTACH_TYPE     VARCHAR(20)   NOT NULL DEFAULT 'FILE' COMMENT 'FILE(첨부) / INLINE(본문 이미지)',
    CID             VARCHAR(60)   NULL                    COMMENT 'Content-ID (INLINE 인 경우)',
    FILE_NAME       VARCHAR(255)  NOT NULL                COMMENT '표시 파일명',
    FILE_PATH       VARCHAR(500)  NOT NULL                COMMENT '저장 경로 / 스토리지 키',
    CONTENT_TYPE    VARCHAR(100)  NULL                    COMMENT 'MIME 타입',
    FILE_SIZE       BIGINT        NULL                    COMMENT '바이트 크기',
    SORT_ORDER      INT           NOT NULL DEFAULT 0      COMMENT '정렬 순서',
    USE_YN          CHAR(1)       NOT NULL DEFAULT 'Y'    COMMENT '사용여부',
    PRIMARY KEY (ATTACH_ID),
    KEY IX_MAIL_ATTACH_TPL (TEMPLATE_ID),
    CONSTRAINT FK_MAIL_ATTACH_TPL FOREIGN KEY (TEMPLATE_ID)
        REFERENCES MAIL_TEMPLATE (TEMPLATE_ID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='메일 템플릿 첨부/인라인 이미지';


-- ---------------------------------------------------------------------
-- 6. MAIL_EVENT : 메일 발송 지점(이벤트)
--    소스코드가 참조하는 불변 키. 예) mailService.send("ORDER.CONFIRM", model)
--    템플릿을 갈아끼워도 이 코드는 바뀌지 않는다 = 무중단 문구 교체의 근거.
-- ---------------------------------------------------------------------
CREATE TABLE MAIL_EVENT (
    EVENT_ID        BIGINT        NOT NULL AUTO_INCREMENT COMMENT '이벤트 ID',
    EVENT_CODE      VARCHAR(60)   NOT NULL                COMMENT '이벤트 코드 (예: APPROVAL.REQUEST)',
    EVENT_NAME      VARCHAR(150)  NOT NULL                COMMENT '이벤트 명',
    MODULE_CODE     VARCHAR(30)   NOT NULL                COMMENT '업무 모듈 APPROVAL/REQUEST/EQUIPMENT/NOTICE/ACCOUNT/BATCH',
    TRIGGER_TYPE    VARCHAR(20)   NOT NULL DEFAULT 'EVENT' COMMENT '발송 트리거 EVENT(즉시)/BATCH(배치)/MANUAL(수동)',
    SEND_CHANNEL    VARCHAR(20)   NOT NULL DEFAULT 'EMAIL' COMMENT '채널 EMAIL/SMS/PUSH (확장 대비)',
    IMPORTANCE      VARCHAR(20)   NOT NULL DEFAULT 'NORMAL' COMMENT '중요도 HIGH/NORMAL/LOW',
    DESCRIPTION     VARCHAR(500)  NULL                    COMMENT '어떤 상황에 발송되는지 설명',
    SOURCE_HINT     VARCHAR(300)  NULL                    COMMENT '호출 위치 힌트 (예: ApprovalService#request)',
    USE_YN          CHAR(1)       NOT NULL DEFAULT 'Y'    COMMENT '사용여부',
    REG_DT          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '등록일시',
    PRIMARY KEY (EVENT_ID),
    UNIQUE KEY UK_MAIL_EVENT_CODE (EVENT_CODE),
    KEY IX_MAIL_EVENT_MODULE (MODULE_CODE, USE_YN)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='메일 발송 이벤트(발송 지점) 정의';


-- ---------------------------------------------------------------------
-- 7. MAIL_EVENT_TEMPLATE : 이벤트 <-> 템플릿 바인딩   ★ 핵심
--    "지금 이 메일이 어떤 템플릿으로 나가는가"의 단일 진실.
--    같은 이벤트라도 언어/브랜드/기간에 따라 다른 템플릿을 쓸 수 있다.
--    (예: 11월 한 달만 프로모션 버전 발송 → VALID_FROM_DT/VALID_TO_DT 로 자동 전환)
-- ---------------------------------------------------------------------
CREATE TABLE MAIL_EVENT_TEMPLATE (
    MAP_ID          BIGINT        NOT NULL AUTO_INCREMENT COMMENT '매핑 ID',
    EVENT_ID        BIGINT        NOT NULL                COMMENT '이벤트 ID',
    TEMPLATE_ID     BIGINT        NOT NULL                COMMENT '템플릿 ID',
    LOCALE_CODE     VARCHAR(10)   NOT NULL DEFAULT 'ko_KR' COMMENT '언어',
    BRAND_CODE      VARCHAR(30)   NOT NULL DEFAULT 'DEFAULT' COMMENT '브랜드/테넌트 구분',
    PRIORITY        INT           NOT NULL DEFAULT 1      COMMENT '우선순위 (A/B 테스트 가중치로도 활용)',
    VALID_FROM_DT   DATETIME      NULL                    COMMENT '적용 시작일시 (NULL = 즉시)',
    VALID_TO_DT     DATETIME      NULL                    COMMENT '적용 종료일시 (NULL = 무기한)',
    FROM_NAME       VARCHAR(100)  NULL                    COMMENT '발신자 표시명',
    FROM_EMAIL      VARCHAR(200)  NULL                    COMMENT '발신 주소',
    REPLY_TO        VARCHAR(200)  NULL                    COMMENT '회신 주소',
    BCC_LIST        VARCHAR(1000) NULL                    COMMENT '상시 BCC (감사용 아카이브 주소 등)',
    ACTIVE_YN       CHAR(1)       NOT NULL DEFAULT 'Y'    COMMENT '활성여부',
    REG_ID          VARCHAR(50)   NULL                    COMMENT '등록자',
    REG_DT          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '등록일시',
    UPD_ID          VARCHAR(50)   NULL                    COMMENT '수정자',
    UPD_DT          DATETIME      NULL ON UPDATE CURRENT_TIMESTAMP   COMMENT '수정일시',
    PRIMARY KEY (MAP_ID),
    UNIQUE KEY UK_MAIL_EVT_TPL (EVENT_ID, LOCALE_CODE, BRAND_CODE, PRIORITY),
    KEY IX_MAIL_EVT_TPL_TEMPLATE (TEMPLATE_ID),
    KEY IX_MAIL_EVT_TPL_ACTIVE (ACTIVE_YN, VALID_FROM_DT, VALID_TO_DT),
    CONSTRAINT FK_MAIL_EVT_TPL_EVT FOREIGN KEY (EVENT_ID)
        REFERENCES MAIL_EVENT (EVENT_ID) ON DELETE CASCADE,
    CONSTRAINT FK_MAIL_EVT_TPL_TPL FOREIGN KEY (TEMPLATE_ID)
        REFERENCES MAIL_TEMPLATE (TEMPLATE_ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='메일 이벤트-템플릿 바인딩';


-- ---------------------------------------------------------------------
-- 7-1. MAIL_EVENT_RECIPIENT : 수신자 결정 규칙   ★ 핵심
--    "무엇을(템플릿) 언제(이벤트)" 만으로는 부족하다. "누구에게" 가 남는다.
--    이 규칙이 없으면 수신자 결정 로직이 자바 코드에 박히고,
--    "이제 팀장도 CC 넣어줘" 한마디에 재배포가 필요해진다.
--    → 템플릿만 DB 로 뺀 무중단 교체가 반쪽이 된다.
--
--    RECIPIENT_TYPE 별 TARGET_VALUE 의미
--      REQUESTER  : 의뢰자/기안자        (TARGET_VALUE 불필요)
--      ASSIGNEE   : 담당자               (불필요)
--      APPROVER   : 다음 차례 결재자     (불필요)
--      DEPT_HEAD  : 부서장               (부서 기준 필드명, 비우면 요청자 부서)
--      TEAM       : 팀/부서 전체         (부서코드)
--      ROLE       : 역할(권한그룹) 보유자 (역할코드, 예: EQUIP_MANAGER)
--      FIXED      : 고정 주소            (이메일, 콤마 구분 가능)
--      EXPRESSION : 모델 표현식          (예: ${order.manager.email})
-- ---------------------------------------------------------------------
CREATE TABLE MAIL_EVENT_RECIPIENT (
    RECIPIENT_ID    BIGINT        NOT NULL AUTO_INCREMENT COMMENT '수신자 규칙 ID',
    EVENT_ID        BIGINT        NOT NULL                COMMENT '이벤트 ID',
    RECIPIENT_TYPE  VARCHAR(30)   NOT NULL                COMMENT 'REQUESTER/ASSIGNEE/APPROVER/DEPT_HEAD/TEAM/ROLE/FIXED/EXPRESSION',
    SEND_FIELD      VARCHAR(10)   NOT NULL DEFAULT 'TO'   COMMENT '수신 구분 TO/CC/BCC',
    TARGET_VALUE    VARCHAR(300)  NULL                    COMMENT '유형별 대상값 (역할코드/부서코드/고정주소/표현식)',
    CONDITION_EXPR  VARCHAR(300)  NULL                    COMMENT '조건식 - 참일 때만 수신 (예: urgency == ''긴급'')',
    DESCRIPTION     VARCHAR(300)  NULL                    COMMENT '규칙 설명 (운영자용)',
    SORT_ORDER      INT           NOT NULL DEFAULT 0      COMMENT '정렬 순서',
    USE_YN          CHAR(1)       NOT NULL DEFAULT 'Y'    COMMENT '사용여부',
    REG_ID          VARCHAR(50)   NULL                    COMMENT '등록자',
    REG_DT          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '등록일시',
    UPD_ID          VARCHAR(50)   NULL                    COMMENT '수정자',
    UPD_DT          DATETIME      NULL ON UPDATE CURRENT_TIMESTAMP   COMMENT '수정일시',
    PRIMARY KEY (RECIPIENT_ID),
    KEY IX_MAIL_RCPT_EVT (EVENT_ID, USE_YN, SORT_ORDER),
    CONSTRAINT FK_MAIL_RCPT_EVT FOREIGN KEY (EVENT_ID)
        REFERENCES MAIL_EVENT (EVENT_ID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='메일 이벤트별 수신자 결정 규칙';


-- ---------------------------------------------------------------------
-- 8. MAIL_SEND_LOG : 발송 이력
--    TEMPLATE_ID 가 아니라 VERSION_ID 를 남기는 것이 핵심.
--    템플릿이 나중에 수정돼도 "그때 나간 원문"을 정확히 재현할 수 있다.
--    테스트 발송도 SEND_TYPE='TEST' 로 같은 테이블에 적재한다.
-- ---------------------------------------------------------------------
CREATE TABLE MAIL_SEND_LOG (
    LOG_ID          BIGINT        NOT NULL AUTO_INCREMENT COMMENT '발송 로그 ID',
    SEND_TYPE       VARCHAR(10)   NOT NULL DEFAULT 'REAL' COMMENT 'REAL(실발송) / TEST(테스트발송)',
    EVENT_ID        BIGINT        NULL                    COMMENT '발송 이벤트 (테스트는 NULL 가능)',
    TEMPLATE_ID     BIGINT        NULL                    COMMENT '사용 템플릿',
    VERSION_ID      BIGINT        NULL                    COMMENT '사용 버전 (원문 재현용 스냅샷 키)',
    SUBJECT_SNAP    VARCHAR(300)  NULL                    COMMENT '치환 완료된 제목 스냅샷',
    BODY_SNAP       LONGTEXT      NULL                    COMMENT '치환 완료된 본문 스냅샷 (보존정책에 따라 선택 저장)',
    MERGE_DATA_JSON LONGTEXT      NULL                    COMMENT '치환에 사용된 모델 데이터 (JSON)',
    FROM_EMAIL      VARCHAR(200)  NULL                    COMMENT '발신 주소',
    TO_EMAIL        VARCHAR(200)  NOT NULL                COMMENT '수신 주소',
    TO_NAME         VARCHAR(100)  NULL                    COMMENT '수신자 명',
    CC_LIST         VARCHAR(1000) NULL                    COMMENT '참조',
    BCC_LIST        VARCHAR(1000) NULL                    COMMENT '숨은참조',
    STATUS_CODE     VARCHAR(20)   NOT NULL DEFAULT 'QUEUED' COMMENT 'QUEUED/SENDING/SENT/FAILED/BOUNCED/CANCELED',
    ERROR_CODE      VARCHAR(50)   NULL                    COMMENT '오류 코드',
    ERROR_MESSAGE   VARCHAR(1000) NULL                    COMMENT '오류 메시지',
    RETRY_CNT       INT           NOT NULL DEFAULT 0      COMMENT '재시도 횟수',
    SMTP_MESSAGE_ID VARCHAR(200)  NULL                    COMMENT 'SMTP Message-ID (추적용)',
    REQ_ID          VARCHAR(50)   NULL                    COMMENT '요청자 ID',
    REQ_DT          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '요청일시',
    SENT_DT         DATETIME      NULL                    COMMENT '발송완료일시',
    OPEN_DT         DATETIME      NULL                    COMMENT '최초 열람일시 (트래킹 픽셀)',
    CLICK_DT        DATETIME      NULL                    COMMENT '최초 클릭일시',
    PRIMARY KEY (LOG_ID),
    KEY IX_MAIL_LOG_TPL_DT (TEMPLATE_ID, REQ_DT),
    KEY IX_MAIL_LOG_EVT_DT (EVENT_ID, REQ_DT),
    KEY IX_MAIL_LOG_STATUS (STATUS_CODE, REQ_DT),
    KEY IX_MAIL_LOG_TO (TO_EMAIL),
    CONSTRAINT FK_MAIL_LOG_EVT FOREIGN KEY (EVENT_ID)
        REFERENCES MAIL_EVENT (EVENT_ID),
    CONSTRAINT FK_MAIL_LOG_TPL FOREIGN KEY (TEMPLATE_ID)
        REFERENCES MAIL_TEMPLATE (TEMPLATE_ID),
    CONSTRAINT FK_MAIL_LOG_VER FOREIGN KEY (VERSION_ID)
        REFERENCES MAIL_TEMPLATE_VERSION (VERSION_ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='메일 발송 이력';

-- 대용량 운영 시: REQ_DT 기준 RANGE 파티셔닝 + 90일 경과 BODY_SNAP NULL 처리 배치 권장
-- ALTER TABLE MAIL_SEND_LOG PARTITION BY RANGE (TO_DAYS(REQ_DT)) ( ... );


-- ---------------------------------------------------------------------
-- 9. V_MAIL_DISPATCH_MAP : 발송 매핑 현황 뷰
--    "지금 어떤 메일이 어떤 템플릿으로 나가는지" 화면(/mail/dispatch-map)의 조회원.
--    템플릿이 붙지 않은 이벤트(=발송 시 실패하는 지점)도 LEFT JOIN 으로 함께 노출한다.
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW V_MAIL_DISPATCH_MAP AS
SELECT
    e.EVENT_ID,
    e.EVENT_CODE,
    e.EVENT_NAME,
    e.MODULE_CODE,
    e.TRIGGER_TYPE,
    e.IMPORTANCE,
    e.USE_YN                AS EVENT_USE_YN,
    m.MAP_ID,
    m.LOCALE_CODE,
    m.BRAND_CODE,
    m.VALID_FROM_DT,
    m.VALID_TO_DT,
    m.FROM_EMAIL,
    t.TEMPLATE_ID,
    t.TEMPLATE_CODE,
    t.TEMPLATE_NAME,
    t.CATEGORY_CODE,
    t.ENGINE_TYPE,
    t.STATUS_CODE           AS TEMPLATE_STATUS,
    v.VERSION_NO            AS CURRENT_VERSION_NO,
    v.SUBJECT               AS CURRENT_SUBJECT,
    v.REG_DT                AS VERSION_REG_DT,
    CASE WHEN t.TEMPLATE_ID IS NULL THEN 'UNMAPPED'
         WHEN t.STATUS_CODE <> 'ACTIVE' THEN 'INACTIVE_TEMPLATE'
         WHEN NOT EXISTS (SELECT 1 FROM MAIL_EVENT_RECIPIENT r
                           WHERE r.EVENT_ID = e.EVENT_ID AND r.USE_YN = 'Y')
              THEN 'NO_RECIPIENT'
         ELSE 'OK' END      AS BIND_STATUS,
    (SELECT COUNT(*) FROM MAIL_SEND_LOG l
      WHERE l.EVENT_ID = e.EVENT_ID AND l.SEND_TYPE = 'REAL'
        AND l.REQ_DT >= DATE_SUB(NOW(), INTERVAL 30 DAY))                       AS SEND_CNT_30D,
    (SELECT COUNT(*) FROM MAIL_SEND_LOG l
      WHERE l.EVENT_ID = e.EVENT_ID AND l.SEND_TYPE = 'REAL'
        AND l.STATUS_CODE IN ('FAILED','BOUNCED')
        AND l.REQ_DT >= DATE_SUB(NOW(), INTERVAL 30 DAY))                       AS FAIL_CNT_30D,
    (SELECT MAX(l.SENT_DT) FROM MAIL_SEND_LOG l
      WHERE l.EVENT_ID = e.EVENT_ID AND l.SEND_TYPE = 'REAL')                   AS LAST_SENT_DT,
    (SELECT COUNT(*) FROM MAIL_EVENT_RECIPIENT r
      WHERE r.EVENT_ID = e.EVENT_ID AND r.USE_YN = 'Y')                         AS RECIPIENT_RULE_CNT
FROM MAIL_EVENT e
LEFT JOIN MAIL_EVENT_TEMPLATE m
       ON m.EVENT_ID = e.EVENT_ID
      AND m.ACTIVE_YN = 'Y'
      AND (m.VALID_FROM_DT IS NULL OR m.VALID_FROM_DT <= NOW())
      AND (m.VALID_TO_DT   IS NULL OR m.VALID_TO_DT   >= NOW())
LEFT JOIN MAIL_TEMPLATE t
       ON t.TEMPLATE_ID = m.TEMPLATE_ID
      AND t.DEL_YN = 'N'
LEFT JOIN MAIL_TEMPLATE_VERSION v
       ON v.VERSION_ID = t.CURRENT_VERSION_ID;
