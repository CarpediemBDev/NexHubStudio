-- =====================================================================
--  규격/규제 정보 관리 DDL  /  Oracle 11g 이상
--
--  설계문서: docs/규격규제_정보관리_설계.md
--  테이블 5개
--    1. REG_INFO          정보 레코드 (마스터)
--    2. REG_INFO_ITEM     정보관리항목 (규제 > 규격 > 인증서 - 레코드마다 다른 계층)
--    3. REG_INFO_TARGET   적용 대상 (사업부/제품군/제품, 권역/국가 - 멀티셀렉트)
--    4. REG_INFO_HIST     변경 이력 (수정 = 새 VERSION INSERT + 스냅샷)
--    5. REG_CONFLICT_HIST 충돌 이력 (저장 직전 판정 결과와 담당자 조치)
--
--  첨부는 별도 테이블을 만들지 않고 기존 파일 관리 모듈의
--  파일그룹 ID(ATTACH_GROUP_ID)로 연계한다.
--
--  [규제·규격이 TARGET 이 아니라 ITEM 인 이유]
--    처음에는 규제/규격도 REG_INFO_TARGET 에 TARGET_TYPE 으로 같이 넣었다.
--    그런데 TARGET 은 "이 규제가 어디에 적용되나" 를 담는 평평한 멀티셀렉트이고,
--    계층은 PARENT_TARGET_CD 로 공통코드의 고정 계층(국가→권역)만 가리킨다.
--    규제 > 규격 > 인증서는 적용 범위가 아니라 관리 대상 그 자체이고,
--    그 트리 모양이 레코드마다 다르다(같은 규격이라도 요구 인증서가 다르다).
--    고정 계층으로는 담을 수 없어서 PARENT_ITEM_ID 를 가진 별도 테이블로 분리했다.
--    충돌 판정의 RULE 축이 TARGET 이 아니라 ITEM 을 읽는 것도 이 때문이다.
--    (src/utils/regulationConflict.js 의 AXES 정의 참고)
-- =====================================================================

-- ---------------------------------------------------------------------
-- DROP (개발 편의. 운영 반영 시 제거)
-- ---------------------------------------------------------------------
-- DROP TABLE REG_CONFLICT_HIST CASCADE CONSTRAINTS;
-- DROP TABLE REG_INFO_HIST     CASCADE CONSTRAINTS;
-- DROP TABLE REG_INFO_TARGET   CASCADE CONSTRAINTS;
-- DROP TABLE REG_INFO_ITEM     CASCADE CONSTRAINTS;
-- DROP TABLE REG_INFO          CASCADE CONSTRAINTS;
-- DROP SEQUENCE SEQ_REG_INFO;
-- DROP SEQUENCE SEQ_REG_INFO_ITEM;
-- DROP SEQUENCE SEQ_REG_INFO_TARGET;
-- DROP SEQUENCE SEQ_REG_INFO_HIST;
-- DROP SEQUENCE SEQ_REG_CONFLICT_HIST;


-- ---------------------------------------------------------------------
-- 1. REG_INFO : 정보 레코드 (규제 1건 = 1행)
--    멀티 선택 항목은 전부 REG_INFO_TARGET 으로 분리한다.
--    분야(FIELD_CD)만 단일 값이므로 마스터에 둔다.
-- ---------------------------------------------------------------------
CREATE TABLE REG_INFO (
    REG_INFO_ID     NUMBER(19)      NOT NULL,
    REG_NO          VARCHAR2(30)    NOT NULL,
    TITLE           VARCHAR2(300)   NOT NULL,
    FIELD_CD        VARCHAR2(30)    NOT NULL,
    MARK_NM         VARCHAR2(200),
    AUTHORITY       VARCHAR2(200),
    URL             VARCHAR2(1000),
    SUMMARY         CLOB,
    ATTACH_GROUP_ID VARCHAR2(50),
    STATUS_CD       VARCHAR2(20)    DEFAULT 'DRAFT' NOT NULL,
    VERSION_NO      NUMBER(5)       DEFAULT 1 NOT NULL,
    EFFECTIVE_DT    DATE,
    EXPIRE_DT       DATE,
    PARENT_INFO_ID  NUMBER(19),
    USE_YN          CHAR(1)         DEFAULT 'Y' NOT NULL,
    REG_ID          VARCHAR2(50),
    REG_DT          DATE            DEFAULT SYSDATE NOT NULL,
    UPD_ID          VARCHAR2(50),
    UPD_DT          DATE,
    CONSTRAINT PK_REG_INFO PRIMARY KEY (REG_INFO_ID),
    CONSTRAINT UK_REG_INFO_NO UNIQUE (REG_NO),
    CONSTRAINT CK_REG_INFO_STATUS CHECK (STATUS_CD IN ('DRAFT','REVIEW','ACTIVE','EXPIRED')),
    CONSTRAINT CK_REG_INFO_USE CHECK (USE_YN IN ('Y','N')),
    CONSTRAINT FK_REG_INFO_PARENT FOREIGN KEY (PARENT_INFO_ID) REFERENCES REG_INFO (REG_INFO_ID)
);
COMMENT ON TABLE  REG_INFO                 IS '규격/규제 정보 레코드';
COMMENT ON COLUMN REG_INFO.REG_NO          IS '업무 규제번호 (예: REG-2026-0001)';
COMMENT ON COLUMN REG_INFO.TITLE           IS '규제 제목';
COMMENT ON COLUMN REG_INFO.FIELD_CD        IS '분야 코드 (SAFETY/EMC/RF/ENERGY/ENV/RECYCLE/LABEL/BROADCAST/CHEM/ACCESS)';
COMMENT ON COLUMN REG_INFO.MARK_NM         IS '인증마크·표시 (예: KC 마크 + 안전확인신고번호)';
COMMENT ON COLUMN REG_INFO.AUTHORITY       IS '소관 기관';
COMMENT ON COLUMN REG_INFO.URL             IS '근거 법령·고시 URL';
COMMENT ON COLUMN REG_INFO.SUMMARY         IS '준수 요건 요약';
COMMENT ON COLUMN REG_INFO.ATTACH_GROUP_ID IS '첨부 파일그룹 ID (파일 관리 모듈 연계)';
COMMENT ON COLUMN REG_INFO.STATUS_CD       IS '상태 (DRAFT/REVIEW/ACTIVE/EXPIRED)';
COMMENT ON COLUMN REG_INFO.VERSION_NO      IS '현재 버전. 수정 시 +1 하고 REG_INFO_HIST 에 스냅샷 INSERT';
COMMENT ON COLUMN REG_INFO.PARENT_INFO_ID  IS '충돌 조치 결과 상위로 편입된 레코드 ID (하위 예외/특례일 때 세팅)';

CREATE INDEX IX_REG_INFO_01 ON REG_INFO (FIELD_CD, STATUS_CD);
CREATE INDEX IX_REG_INFO_02 ON REG_INFO (EFFECTIVE_DT);

CREATE SEQUENCE SEQ_REG_INFO START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE OR REPLACE TRIGGER TRG_REG_INFO_ID
BEFORE INSERT ON REG_INFO FOR EACH ROW
WHEN (NEW.REG_INFO_ID IS NULL)
BEGIN
    SELECT SEQ_REG_INFO.NEXTVAL INTO :NEW.REG_INFO_ID FROM DUAL;
END;
/


-- ---------------------------------------------------------------------
-- 2. REG_INFO_ITEM : 정보관리항목  (규제 > 규격 > 인증서)
--    레코드가 "무엇을 관리하는가". 적용 범위(TARGET)와는 다른 축이다.
--
--    계층이 레코드마다 다르므로 공통코드의 고정 계층으로는 담을 수 없다.
--    같은 규격이라도 요구되는 인증서가 레코드마다 다르기 때문에
--    PARENT_ITEM_ID 로 이 레코드만의 트리를 만든다.
--
--    ITEM_NM 을 두지 않는다. 이름은 공통코드가 단독으로 쥔다 —
--    여기에 비정규화해 두면 코드표를 고쳤을 때 과거 레코드만 옛 이름으로 남아
--    같은 코드가 화면마다 다른 이름으로 보인다.
--
--    삭제는 leaf 부터. 부모를 지울 때 자식을 DB CASCADE 로 조용히 지우지 않는다
--    (REG_INFO_HIST.CHANGED_ITEM_IDS 가 가리키던 항목이 흔적 없이 사라진다).
-- ---------------------------------------------------------------------
CREATE TABLE REG_INFO_ITEM (
    ITEM_ID         NUMBER(19)      NOT NULL,
    REG_INFO_ID     NUMBER(19)      NOT NULL,
    PARENT_ITEM_ID  NUMBER(19),
    ITEM_TYPE_CD    VARCHAR2(20)    NOT NULL,
    ITEM_CD         VARCHAR2(50),
    LEVEL_NO        NUMBER(2)       NOT NULL,
    MANDATORY_YN    CHAR(1)         DEFAULT 'Y' NOT NULL,
    REMARK          VARCHAR2(1000),
    SORT_ORDER      NUMBER(5)       DEFAULT 0 NOT NULL,
    CONSTRAINT PK_REG_INFO_ITEM PRIMARY KEY (ITEM_ID),
    CONSTRAINT CK_REG_ITEM_TYPE CHECK (ITEM_TYPE_CD IN ('REGULATION','STANDARD','CERT')),
    CONSTRAINT CK_REG_ITEM_MAND CHECK (MANDATORY_YN IN ('Y','N')),
    CONSTRAINT FK_REG_ITEM_INFO FOREIGN KEY (REG_INFO_ID)
        REFERENCES REG_INFO (REG_INFO_ID) ON DELETE CASCADE,
    CONSTRAINT FK_REG_ITEM_PARENT FOREIGN KEY (PARENT_ITEM_ID)
        REFERENCES REG_INFO_ITEM (ITEM_ID)
);
COMMENT ON TABLE  REG_INFO_ITEM                IS '규제 정보관리항목 (규제 > 규격 > 인증서 계층)';
COMMENT ON COLUMN REG_INFO_ITEM.PARENT_ITEM_ID IS '상위 항목. NULL 이면 최상위(규제)';
COMMENT ON COLUMN REG_INFO_ITEM.ITEM_TYPE_CD   IS '구분 REGULATION(1) / STANDARD(2) / CERT(3)';
COMMENT ON COLUMN REG_INFO_ITEM.ITEM_CD        IS '공통코드 값. 방금 추가하고 아직 고르지 않았으면 NULL';
COMMENT ON COLUMN REG_INFO_ITEM.LEVEL_NO       IS '계층 레벨. 충돌 판정 RULE 축의 상·하위 비교 기준';
COMMENT ON COLUMN REG_INFO_ITEM.MANDATORY_YN   IS 'Y = 필수 항목';

CREATE INDEX IX_REG_ITEM_01 ON REG_INFO_ITEM (REG_INFO_ID);
CREATE INDEX IX_REG_ITEM_02 ON REG_INFO_ITEM (PARENT_ITEM_ID);
CREATE INDEX IX_REG_ITEM_03 ON REG_INFO_ITEM (ITEM_TYPE_CD, ITEM_CD);

CREATE SEQUENCE SEQ_REG_INFO_ITEM START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE OR REPLACE TRIGGER TRG_REG_INFO_ITEM_ID
BEFORE INSERT ON REG_INFO_ITEM FOR EACH ROW
WHEN (NEW.ITEM_ID IS NULL)
BEGIN
    SELECT SEQ_REG_INFO_ITEM.NEXTVAL INTO :NEW.ITEM_ID FROM DUAL;
END;
/


-- ---------------------------------------------------------------------
-- 3. REG_INFO_TARGET : 적용 대상 (멀티 셀렉트)
--    "이 규제가 어디에 적용되는가". 5종을 TARGET_TYPE 으로 한 테이블에 수용한다.
--    LEVEL_NO 는 충돌 판정 시 상·하위 비교의 기준이 된다.
--       권역(1) > 국가(2)
--       사업부(1) > 제품군(2) > 제품(3)
--    규제·규격은 여기 없다 — REG_INFO_ITEM 으로 옮겼다(파일 상단 설명 참고).
-- ---------------------------------------------------------------------
CREATE TABLE REG_INFO_TARGET (
    TARGET_ID       NUMBER(19)      NOT NULL,
    REG_INFO_ID     NUMBER(19)      NOT NULL,
    TARGET_TYPE     VARCHAR2(20)    NOT NULL,
    TARGET_CD       VARCHAR2(50)    NOT NULL,
    TARGET_NM       VARCHAR2(200),
    PARENT_TARGET_CD VARCHAR2(50),
    LEVEL_NO        NUMBER(2)       DEFAULT 1 NOT NULL,
    EXCLUDE_YN      CHAR(1)         DEFAULT 'N' NOT NULL,
    SORT_ORDER      NUMBER(5)       DEFAULT 0 NOT NULL,
    REG_ID          VARCHAR2(50),
    REG_DT          DATE            DEFAULT SYSDATE NOT NULL,
    CONSTRAINT PK_REG_INFO_TARGET PRIMARY KEY (TARGET_ID),
    CONSTRAINT UK_REG_INFO_TARGET UNIQUE (REG_INFO_ID, TARGET_TYPE, TARGET_CD),
    CONSTRAINT CK_REG_TARGET_TYPE CHECK (TARGET_TYPE IN
        ('DIVISION','PRODUCT_GROUP','PRODUCT','REGION','COUNTRY')),
    CONSTRAINT CK_REG_TARGET_EXCL CHECK (EXCLUDE_YN IN ('Y','N')),
    CONSTRAINT FK_REG_TARGET_INFO FOREIGN KEY (REG_INFO_ID)
        REFERENCES REG_INFO (REG_INFO_ID) ON DELETE CASCADE
);
COMMENT ON TABLE  REG_INFO_TARGET                  IS '규제 정보 적용 대상 (멀티 셀렉트)';
COMMENT ON COLUMN REG_INFO_TARGET.TARGET_TYPE      IS '대상 구분 (DIVISION/PRODUCT_GROUP/PRODUCT/REGION/COUNTRY)';
COMMENT ON COLUMN REG_INFO_TARGET.TARGET_CD        IS '공통코드 값';
COMMENT ON COLUMN REG_INFO_TARGET.TARGET_NM        IS '조회 성능용 비정규화 명칭';
COMMENT ON COLUMN REG_INFO_TARGET.PARENT_TARGET_CD IS '상위 코드 (국가→권역, 제품→제품군)';
COMMENT ON COLUMN REG_INFO_TARGET.LEVEL_NO         IS '계층 레벨. 충돌 판정 시 상·하위 비교 기준';
COMMENT ON COLUMN REG_INFO_TARGET.EXCLUDE_YN       IS 'Y = 이 대상은 적용 범위에서 제외 (충돌 조치 EXCLUDE 결과)';

CREATE INDEX IX_REG_TARGET_01 ON REG_INFO_TARGET (TARGET_TYPE, TARGET_CD);
CREATE INDEX IX_REG_TARGET_02 ON REG_INFO_TARGET (REG_INFO_ID, TARGET_TYPE);

CREATE SEQUENCE SEQ_REG_INFO_TARGET START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE OR REPLACE TRIGGER TRG_REG_INFO_TARGET_ID
BEFORE INSERT ON REG_INFO_TARGET FOR EACH ROW
WHEN (NEW.TARGET_ID IS NULL)
BEGIN
    SELECT SEQ_REG_INFO_TARGET.NEXTVAL INTO :NEW.TARGET_ID FROM DUAL;
END;
/


-- ---------------------------------------------------------------------
-- 4. REG_INFO_HIST : 변경 이력
--    수정할 때마다 마스터 + 타겟 전체를 JSON 스냅샷으로 남긴다.
--    (타겟이 멀티행이라 컬럼 단위 diff 만으로는 복원이 안 됨)
-- ---------------------------------------------------------------------
CREATE TABLE REG_INFO_HIST (
    HIST_ID         NUMBER(19)      NOT NULL,
    REG_INFO_ID     NUMBER(19)      NOT NULL,
    VERSION_NO      NUMBER(5)       NOT NULL,
    CHANGE_TYPE     VARCHAR2(20)    NOT NULL,
    CHANGE_NOTE     VARCHAR2(1000),
    SNAPSHOT_JSON   CLOB,
    MASTER_CHANGED_YN CHAR(1),
    CHANGED_ITEM_IDS  VARCHAR2(4000),
    REG_ID          VARCHAR2(50),
    REG_DT          DATE            DEFAULT SYSDATE NOT NULL,
    CONSTRAINT PK_REG_INFO_HIST PRIMARY KEY (HIST_ID),
    -- (REG_INFO_ID, VERSION_NO) 에 유니크를 걸지 않는다.
    -- 충돌 조치 KEEP_BOTH 는 기존 레코드의 버전을 올리지 않고 CONFLICT_RESOLVE 이력만 남기므로
    -- 같은 버전에 두 줄이 생길 수 있다.
    CONSTRAINT CK_REG_HIST_TYPE CHECK (CHANGE_TYPE IN
        ('INSERT','UPDATE','DELETE','CONFLICT_RESOLVE')),
    CONSTRAINT CK_REG_HIST_MASTER CHECK (MASTER_CHANGED_YN IN ('Y','N')),
    CONSTRAINT FK_REG_HIST_INFO FOREIGN KEY (REG_INFO_ID)
        REFERENCES REG_INFO (REG_INFO_ID) ON DELETE CASCADE
);
COMMENT ON TABLE  REG_INFO_HIST               IS '규제 정보 변경 이력 (수정 = 새 버전 INSERT)';
COMMENT ON COLUMN REG_INFO_HIST.CHANGE_TYPE   IS 'INSERT/UPDATE/DELETE/CONFLICT_RESOLVE';
COMMENT ON COLUMN REG_INFO_HIST.SNAPSHOT_JSON IS '해당 버전의 마스터+타겟 전체 스냅샷 JSON';
COMMENT ON COLUMN REG_INFO_HIST.MASTER_CHANGED_YN IS '이 버전에서 기본정보가 바뀌었는지. NULL = 과거 이관분(알 수 없음)';
COMMENT ON COLUMN REG_INFO_HIST.CHANGED_ITEM_IDS  IS '이 버전에서 바뀐 REG_INFO_ITEM.ITEM_ID 목록 (JSON 배열 문자열). 변경이력의 "이 항목" 범위 표시용';

CREATE INDEX IX_REG_HIST_01 ON REG_INFO_HIST (REG_INFO_ID, VERSION_NO DESC);

CREATE SEQUENCE SEQ_REG_INFO_HIST START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE OR REPLACE TRIGGER TRG_REG_INFO_HIST_ID
BEFORE INSERT ON REG_INFO_HIST FOR EACH ROW
WHEN (NEW.HIST_ID IS NULL)
BEGIN
    SELECT SEQ_REG_INFO_HIST.NEXTVAL INTO :NEW.HIST_ID FROM DUAL;
END;
/


-- ---------------------------------------------------------------------
-- 5. REG_CONFLICT_HIST : 충돌 이력
--    저장 직전 판정 결과 + 담당자가 고른 조치를 그대로 적재한다.
--    판정 방향은 항상 "신규 레코드 기준".
--      PARENT  = 신규가 기존의 상위 (신규 유럽 ⊃ 기존 프랑스)
--      CHILD   = 신규가 기존의 하위 (신규 프랑스 ⊂ 기존 유럽)
--      SAME    = 범위 완전 동일
--      OVERLAP = 포함관계 없이 일부만 겹침
-- ---------------------------------------------------------------------
CREATE TABLE REG_CONFLICT_HIST (
    CONFLICT_ID     NUMBER(19)      NOT NULL,
    NEW_REG_INFO_ID NUMBER(19),
    NEW_REG_NO      VARCHAR2(30),
    EXIST_REG_INFO_ID NUMBER(19)    NOT NULL,
    EXIST_REG_NO    VARCHAR2(30),
    CONFLICT_TYPE   VARCHAR2(20)    NOT NULL,
    CONFLICT_AXIS   VARCHAR2(20)    NOT NULL,
    NEW_SCOPE_TXT   VARCHAR2(1000),
    EXIST_SCOPE_TXT VARCHAR2(1000),
    DETAIL_JSON     CLOB,
    DECISION_CD     VARCHAR2(20),
    DECISION_NOTE   VARCHAR2(1000),
    STATUS_CD       VARCHAR2(20)    DEFAULT 'DETECTED' NOT NULL,
    DETECT_DT       DATE            DEFAULT SYSDATE NOT NULL,
    DECIDE_ID       VARCHAR2(50),
    DECIDE_DT       DATE,
    CONSTRAINT PK_REG_CONFLICT_HIST PRIMARY KEY (CONFLICT_ID),
    CONSTRAINT CK_REG_CONF_TYPE CHECK (CONFLICT_TYPE IN ('SAME','PARENT','CHILD','OVERLAP')),
    CONSTRAINT CK_REG_CONF_AXIS CHECK (CONFLICT_AXIS IN ('GEO','ORG','RULE')),
    CONSTRAINT CK_REG_CONF_DECISION CHECK (DECISION_CD IN
        ('KEEP_BOTH','MERGE','EXCLUDE','REPLACE','CANCEL')),
    CONSTRAINT CK_REG_CONF_STATUS CHECK (STATUS_CD IN ('DETECTED','RESOLVED','IGNORED')),
    CONSTRAINT FK_REG_CONF_EXIST FOREIGN KEY (EXIST_REG_INFO_ID)
        REFERENCES REG_INFO (REG_INFO_ID)
);
COMMENT ON TABLE  REG_CONFLICT_HIST                 IS '규제 정보 충돌 판정/조치 이력';
COMMENT ON COLUMN REG_CONFLICT_HIST.NEW_REG_INFO_ID IS '신규(저장 시도) 레코드 ID. 등록 취소 시 NULL';
COMMENT ON COLUMN REG_CONFLICT_HIST.NEW_REG_NO      IS '등록 취소된 건도 추적하기 위한 규제번호 스냅샷';
COMMENT ON COLUMN REG_CONFLICT_HIST.CONFLICT_TYPE   IS 'SAME/PARENT/CHILD/OVERLAP (신규 레코드 기준)';
COMMENT ON COLUMN REG_CONFLICT_HIST.CONFLICT_AXIS   IS '충돌 축 GEO(권역/국가) / ORG(사업부·제품군·제품) / RULE(규제·규격)';
COMMENT ON COLUMN REG_CONFLICT_HIST.DETAIL_JSON     IS '축별 판정 상세 (EQUAL/SUPERSET/SUBSET/OVERLAP)';
COMMENT ON COLUMN REG_CONFLICT_HIST.DECISION_CD     IS 'KEEP_BOTH/MERGE/EXCLUDE/REPLACE/CANCEL';
COMMENT ON COLUMN REG_CONFLICT_HIST.STATUS_CD       IS 'DETECTED(판정만)/RESOLVED(조치완료)/IGNORED(등록취소)';

CREATE INDEX IX_REG_CONF_01 ON REG_CONFLICT_HIST (EXIST_REG_INFO_ID);
CREATE INDEX IX_REG_CONF_02 ON REG_CONFLICT_HIST (NEW_REG_INFO_ID);
CREATE INDEX IX_REG_CONF_03 ON REG_CONFLICT_HIST (STATUS_CD, DETECT_DT);

CREATE SEQUENCE SEQ_REG_CONFLICT_HIST START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE OR REPLACE TRIGGER TRG_REG_CONFLICT_HIST_ID
BEFORE INSERT ON REG_CONFLICT_HIST FOR EACH ROW
WHEN (NEW.CONFLICT_ID IS NULL)
BEGIN
    SELECT SEQ_REG_CONFLICT_HIST.NEXTVAL INTO :NEW.CONFLICT_ID FROM DUAL;
END;
/


-- ---------------------------------------------------------------------
-- 조회 편의 뷰 : 목록 그리드 1행 = 이 뷰 1행
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW V_REG_INFO_LIST AS
SELECT  I.REG_INFO_ID,
        I.REG_NO,
        I.TITLE,
        I.FIELD_CD,
        I.MARK_NM,
        I.URL,
        I.STATUS_CD,
        I.VERSION_NO,
        I.EFFECTIVE_DT,
        -- 규제·규격은 TARGET 이 아니라 ITEM 이다. 이름 컬럼이 없으므로 코드를 잇고
        -- 화면이 코드표로 이름을 붙인다(백엔드에는 코드→이름 출처가 없다)
        (SELECT LISTAGG(M.ITEM_CD, ', ') WITHIN GROUP (ORDER BY M.SORT_ORDER)
           FROM REG_INFO_ITEM M
          WHERE M.REG_INFO_ID = I.REG_INFO_ID AND M.ITEM_TYPE_CD = 'REGULATION')   AS REGULATION_CDS,
        (SELECT LISTAGG(M.ITEM_CD, ', ') WITHIN GROUP (ORDER BY M.SORT_ORDER)
           FROM REG_INFO_ITEM M
          WHERE M.REG_INFO_ID = I.REG_INFO_ID AND M.ITEM_TYPE_CD = 'STANDARD')     AS STANDARD_CDS,
        (SELECT COUNT(*)
           FROM REG_INFO_ITEM M
          WHERE M.REG_INFO_ID = I.REG_INFO_ID)                                     AS ITEM_CNT,
        (SELECT LISTAGG(T.TARGET_NM, ', ') WITHIN GROUP (ORDER BY T.SORT_ORDER)
           FROM REG_INFO_TARGET T
          WHERE T.REG_INFO_ID = I.REG_INFO_ID AND T.TARGET_TYPE = 'REGION')        AS REGION_TXT,
        (SELECT LISTAGG(T.TARGET_NM, ', ') WITHIN GROUP (ORDER BY T.SORT_ORDER)
           FROM REG_INFO_TARGET T
          WHERE T.REG_INFO_ID = I.REG_INFO_ID AND T.TARGET_TYPE = 'COUNTRY')       AS COUNTRY_TXT,
        (SELECT LISTAGG(T.TARGET_NM, ', ') WITHIN GROUP (ORDER BY T.SORT_ORDER)
           FROM REG_INFO_TARGET T
          WHERE T.REG_INFO_ID = I.REG_INFO_ID AND T.TARGET_TYPE = 'DIVISION')      AS DIVISION_TXT,
        (SELECT LISTAGG(T.TARGET_NM, ', ') WITHIN GROUP (ORDER BY T.SORT_ORDER)
           FROM REG_INFO_TARGET T
          WHERE T.REG_INFO_ID = I.REG_INFO_ID AND T.TARGET_TYPE = 'PRODUCT_GROUP') AS PRODUCT_GROUP_TXT,
        (SELECT LISTAGG(T.TARGET_NM, ', ') WITHIN GROUP (ORDER BY T.SORT_ORDER)
           FROM REG_INFO_TARGET T
          WHERE T.REG_INFO_ID = I.REG_INFO_ID AND T.TARGET_TYPE = 'PRODUCT')       AS PRODUCT_TXT,
        (SELECT COUNT(*) FROM REG_CONFLICT_HIST C
          WHERE C.NEW_REG_INFO_ID = I.REG_INFO_ID
             OR C.EXIST_REG_INFO_ID = I.REG_INFO_ID)                               AS CONFLICT_CNT
  FROM  REG_INFO I
 WHERE  I.USE_YN = 'Y';


-- ---------------------------------------------------------------------
-- 충돌 후보 1차 필터 (DB단)
--   같은 분야 + 같은 규제를 공유하는 레코드만 뽑아온 뒤,
--   계층 전개/포함관계 판정은 애플리케이션에서 수행한다.
--   (권역→국가 전개가 공통코드 계층 조회를 타므로 SQL 단독 판정은 비효율)
-- ---------------------------------------------------------------------
-- SELECT DISTINCT I.REG_INFO_ID, I.REG_NO, I.TITLE
--   FROM REG_INFO I
--   JOIN REG_INFO_ITEM M ON M.REG_INFO_ID = I.REG_INFO_ID
--  WHERE I.STATUS_CD <> 'EXPIRED'
--    AND I.FIELD_CD  = :fieldCd
--    AND M.ITEM_TYPE_CD = 'REGULATION'
--    AND M.ITEM_CD IN (:regulationCds)
--    AND I.REG_INFO_ID <> NVL(:regInfoId, -1);


-- ---------------------------------------------------------------------
-- 전개(행→열) : 목록 화면 "전개" 탭
--   평면 목록은 레코드 1건 = 1행이라 규제 > 규격 > 관리항목과 제품이
--   한 셀에 여러 줄로 쌓인다. 그 값으로는 정렬·필터·엑셀을 걸 수 없다.
--   여기서 조합 하나를 한 행으로 펼쳐 각 축이 자기 열을 갖게 한다.
--
--   LEFT JOIN 이라 하위 단계가 없으면 그 칸은 NULL 로 남고,
--   제품 미지정 레코드는 제품 칸이 NULL 인 한 행이 된다.
--
--   사업부·제품군·권역·국가는 여기 끼우지 않는다. 전개 축이 아니라 레코드 속성이라
--   JOIN 에 넣으면 행이 그 개수만큼 배로 불어난다(카티션 곱). 애플리케이션이 붙인다.
--
--   병합키(FIELD_KEY/REC_KEY/RULE_KEY/STD_KEY)를 SELECT 절에서 함께 만든다.
--   "어디까지 같아야 화면에서 한 칸으로 묶느냐" 는 아래 ORDER BY 와 한 몸이다.
--   화면이 키를 만들면 여기 정렬을 바꾸는 순간 병합이 조용히 깨진다.
--
--   구현: RegulationMapper.xml 의 findExpandedRows (fullstack 브랜치)
-- ---------------------------------------------------------------------
-- SELECT I.REG_INFO_ID, I.STATUS_CD, I.REG_NO, I.TITLE, I.FIELD_CD,
--        RG.ITEM_CD AS REGULATION_CD,
--        ST.ITEM_CD AS STANDARD_CD,
--        CT.ITEM_CD AS CERT_CD,
--        COALESCE(CT.MANDATORY_YN, ST.MANDATORY_YN, RG.MANDATORY_YN) AS MANDATORY_YN,
--        P.TARGET_CD AS PRODUCT_CD,
--        I.EFFECTIVE_DT, I.VERSION_NO,
--        I.FIELD_CD                                                        AS FIELD_KEY,
--        I.FIELD_CD || '|' || I.REG_INFO_ID                                AS REC_KEY,
--        I.FIELD_CD || '|' || I.REG_INFO_ID || '|' || NVL(RG.ITEM_CD, '')  AS RULE_KEY,
--        I.FIELD_CD || '|' || I.REG_INFO_ID || '|' || NVL(RG.ITEM_CD, '')
--                            || '|' || NVL(ST.ITEM_CD, '')                 AS STD_KEY
--   FROM REG_INFO I
--   LEFT JOIN REG_INFO_ITEM   RG ON RG.REG_INFO_ID    = I.REG_INFO_ID AND RG.ITEM_TYPE_CD = 'REGULATION'
--   LEFT JOIN REG_INFO_ITEM   ST ON ST.PARENT_ITEM_ID = RG.ITEM_ID    AND ST.ITEM_TYPE_CD = 'STANDARD'
--   LEFT JOIN REG_INFO_ITEM   CT ON CT.PARENT_ITEM_ID = ST.ITEM_ID    AND CT.ITEM_TYPE_CD = 'CERT'
--   LEFT JOIN REG_INFO_TARGET P  ON P.REG_INFO_ID     = I.REG_INFO_ID AND P.TARGET_TYPE   = 'PRODUCT'
--  WHERE I.USE_YN = 'Y'
--    AND I.REG_INFO_ID IN (:regInfoIds)
--  ORDER BY I.FIELD_CD, I.REG_NO, RG.SORT_ORDER, ST.SORT_ORDER, CT.SORT_ORDER, P.TARGET_CD;
