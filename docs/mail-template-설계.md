# 메일 템플릿 관리 설계서 (B2B)

> 목적: 여러 메일 템플릿을 **목록으로 관리**하고, 발송 전 **어떤 템플릿을 쓸지 고르고 테스트**하며,
> 현재 시스템 메일이 **어떤 템플릿으로 나가고 있는지 한눈에** 보는 관리 화면 + 백엔드 스키마 설계.
>
> 현재 단계: **DDL 파일 + 화면(목데이터)** 까지만 구현. DB/백엔드 연동은 다음 단계.

---

## 1. 왜 이런 화면이 필요한가

B2B 시스템의 메일은 대부분 "코드에 박힌 HTML 문자열"로 시작해서 아래 문제로 무너진다.

| 증상 | 원인 |
|---|---|
| 문구 한 줄 바꾸는데 재배포 | 템플릿이 소스에 하드코딩 |
| "그 메일 지금 어떤 문구로 나가요?" 아무도 모름 | 발송지점 ↔ 템플릿 매핑이 코드 안에만 존재 |
| 실제 발송하고 나서야 깨진 걸 발견 | 테스트 발송/미리보기 수단 없음 |
| 변경 후 문제 생겨도 되돌릴 수 없음 | 버전 이력 없음 |
| Outlook에서만 레이아웃 깨짐 | 미리보기 환경 없음 |

→ 이 설계는 위 5가지를 각각 **템플릿 마스터 / 이벤트 매핑 / 테스트 발송 / 버전 테이블 / 디바이스 미리보기** 로 해결한다.

---

## 2. 템플릿 포맷 결정: HTML vs .vm

### 2.1 비교

| 항목 | 순수 HTML + 문자열 치환 | `.vm` 파일 (classpath) | **DB 저장 + Velocity 문법 (채택)** |
|---|---|---|---|
| 변수 치환 `${userName}` | O | O | O |
| 반복 (주문 상품 N건) | **X** | O | O |
| 조건 (할인 있을 때만 노출) | **X** | O | O |
| 운영자가 화면에서 수정 | O | **X (재배포)** | O |
| 버전/롤백 | 직접 구현 | git only | O (VERSION 테이블) |
| 형상관리(코드리뷰) | X | O | O (seed .vm 파일 병행) |
| 미리보기 서버 렌더 | 쉬움 | 쉬움 | 쉬움 |

### 2.2 결론

**"문법은 `.vm`(Velocity), 저장소는 DB(CLOB)"**

- 템플릿 본문은 `MAIL_TEMPLATE_VERSION.BODY_HTML` 에 **Velocity 문법이 포함된 HTML** 로 저장한다.
- 런타임 머지는 파일이 아니라 문자열 로더를 쓴다.
  - Velocity: `StringResourceRepository` + `StringResourceLoader`
  - Thymeleaf: `StringTemplateResolver`
- **초기 기본 템플릿은 `backend/src/main/resources/templates/mail/*.vm` 파일로 형상관리**하고,
  애플리케이션 부팅 시 DB에 없으면 seed(insert), 있으면 skip 한다.
  → 개발자는 파일로 리뷰하고, 운영자는 화면에서 고치는 하이브리드.
- `ENGINE_TYPE` 컬럼(`VELOCITY` / `THYMELEAF` / `PLAIN`)으로 엔진을 템플릿 단위로 선택 가능하게 두어,
  레거시 `.vm` 자산을 그대로 이관하면서 신규는 Thymeleaf로 갈 수 있게 한다.

### 2.3 엔진 선택 가이드

| 상황 | 권장 |
|---|---|
| 기존 `.vm` 자산이 이미 많다 | **Velocity** — `velocity-engine-core` 직접 의존. Spring Boot 3는 Velocity 자동설정을 제공하지 않으므로 `VelocityEngine` 을 직접 `@Bean` 등록 |
| 신규 구축 / Spring Boot 3 | **Thymeleaf** — 공식 스타터, `StringTemplateResolver` 로 DB 문자열 렌더 |
| 단순 안내메일만 | `PLAIN` — `${var}` 단순 치환, 엔진 의존 없음 |

### 2.4 렌더링 파이프라인

```
[발송 요청]  eventCode = "ORDER.CONFIRM", model = { user, order }
     |
     v
1) MAIL_EVENT_TEMPLATE 조회  (eventCode + locale + brand + 유효기간 + ACTIVE_YN)
     |  -> templateId 결정  ※ 여기가 "어떤 메일이 어떤 템플릿으로 나가는가"의 단일 진실
     v
2) MAIL_TEMPLATE.CURRENT_VERSION_ID -> MAIL_TEMPLATE_VERSION (SUBJECT / BODY_HTML / BODY_TEXT)
     |
     v
3) 변수 검증  MAIL_TEMPLATE_VAR.REQUIRED_YN = 'Y' 인데 model 에 없으면 → 발송 중단 + 로그
     |
     v
4) LAYOUT 결합  HEADER_HTML + BODY_HTML + FOOTER_HTML  (+ BASE_CSS)
     |
     v
5) 엔진 머지 (Velocity StringResourceLoader)  →  최종 subject / html / text
     |
     v
6) CSS 인라이너 적용 (Outlook 대응)  →  MimeMessage 조립 (multipart/alternative + inline CID)
     |
     v
7) 발송 + MAIL_SEND_LOG 기록 (VERSION_ID 스냅샷 저장 → 나중에 "그때 뭐가 나갔나" 추적 가능)
```

**핵심 원칙**: 발송 로그에 `TEMPLATE_ID`가 아니라 **`VERSION_ID`를 남긴다.**
템플릿이 나중에 수정돼도 "3월 5일에 나간 그 메일"의 원문을 정확히 재현할 수 있다.

### 2.5 HTML 메일 작성 시 제약 (템플릿 작성 가이드)

- 레이아웃은 `<table>` 기반. flex/grid는 Outlook(Word 렌더링 엔진)에서 무시된다.
- CSS는 인라인 style 우선. `<style>` 블록은 일부 클라이언트가 제거한다.
- 이미지는 반드시 `alt` + 절대경로 URL 또는 인라인 CID. 이미지 차단 상태에서도 읽히게.
- 최대 폭 600px 고정 (모바일 좌우 스크롤 방지).
- 웹폰트 금지. system font stack 사용.
- 다크모드 대응: 배경/글자색을 **둘 다** 명시. 배경만 지정하면 클라이언트가 글자색을 반전시켜 안 보인다.

---

## 3. 화면 설계

메뉴 그룹: **메일 관리** (`/mail`)

| 경로 | 화면 | 해결하는 요구사항 |
|---|---|---|
| `/mail/templates` | 메일 템플릿 관리 | 목록 / 선택 / 편집 / 미리보기 / **테스트 발송** |
| `/mail/dispatch-map` | 발송 매핑 현황 | **"지금 어떤 메일이 어떤 템플릿으로 나가는지 한눈에"** |
| `/mail/send-log` | 메일 발송 이력 | 실제 발송 결과 추적 / 재발송 |

### 3.1 메일 템플릿 관리 (`/mail/templates`)

프로젝트 표준 화면 골격(`b2b-page-container` → `b2b-toolbar` → `content-split`)을 그대로 따른다.
제목/브레드크럼은 `MainLayout` 의 전역 `PageHeader` 가 렌더하므로 페이지에서 다시 그리지 않는다.

```
[전역 PageHeader: 메일 템플릿 관리 / 홈 > 메일 관리 > ...]
┌ b2b-toolbar ────────────────────────────────────────────────────────────┐
│ [검색] [카테고리 v] [상태 v]            [새 템플릿] [테스트 발송] [저장] │
└─────────────────────────────────────────────────────────────────────────┘
┌ 템플릿 (8) ─┬ 주문 확인 안내  ORDER_CONFIRM_KO [VELOCITY][v3] ORDER.CONFIRM ┐
│ ORDER_...   │                                   [미리보기][편집][버전]      │
│ 주문 확인.. │ [PC][모바일][텍스트]  [NexHub] 주문이 접수되었습니다 (...)    │
│ ─────────── │ ┌───────────────────────────────────────┐                    │
│ USER_...    │ │  iframe 렌더 (샘플값 주입)             │                    │
│ 가입 환영.. │ └───────────────────────────────────────┘                    │
└─────────────┴───────────────────────────────────────────────────────────────┘
```

- **좌측 목록**: 코드 · 이름 · 상태 뱃지만 노출. 검색/카테고리/상태 필터는 툴바로 올린다.
- **우측 패널 헤더**: 이름 · 코드 · 엔진 · 현재 버전 · 연결된 발송 이벤트를 한 줄로. 우측에 탭 버튼.
- **미리보기 탭**: `iframe srcdoc` + `sandbox` 로 격리 렌더 (페이지 CSS 가 메일 HTML 을 오염시키지 않게).
  PC(600px) / 모바일(375px) / 텍스트(BODY_TEXT) 전환. 필수 변수 누락 시 상단에 한 줄 경고.
- **편집 탭**: 좌측 제목/프리헤더/본문/텍스트본문 + 변경사유, 우측에 `MAIL_TEMPLATE_VAR` 표.
  변수명 클릭 → 본문 커서 위치에 `${var}` 삽입, 샘플값 수정 → 미리보기 즉시 반영.
- **버전 탭**: 버전 목록 + 보기 / 되돌리기(그 버전을 CURRENT로).
- **테스트 발송 모달**: 변수 정의로 폼 자동 생성(샘플값 프리필) → 우측 실시간 렌더 → 발송.
  결과는 `SEND_TYPE='TEST'` 로 동일 로그 테이블에 적재.

### 3.2 발송 매핑 현황 (`/mail/dispatch-map`) — 이 요구사항의 핵심 화면

시스템이 보내는 **모든 메일 발송 지점(MAIL_EVENT)** 을 나열하고, 각 지점이 지금 **어떤 템플릿의 몇 번 버전**으로
나가는지를 한 줄씩 보여준다.

툴바 우측에 요약을 한 줄로 둔다 — `이벤트 12 · 정상 8 · 미매핑 2 · 비활성 2 | 30일 발송 18 / 실패 3`.
본문은 모듈(USER / ORDER / APPROVAL / NOTICE / MARKETING)별 그룹 행을 낀 단일 테이블 하나다.

| 바인딩 상태 | 표시 | 의미 |
|---|---|---|
| `OK` | 초록 dot | 활성 템플릿이 정상 연결됨 |
| `UNMAPPED` | 빨강 dot | 템플릿 미연결 = **발송 시 터지는 지점** |
| `INACTIVE` | 주황 dot | DRAFT/ARCHIVED 템플릿에 연결됨 |

`문제 항목만` 체크박스로 UNMAPPED/INACTIVE 만 걸러 본다. 행 클릭 시 해당 템플릿 화면으로 이동.

### 3.3 발송 이력 (`/mail/send-log`)

기간/상태/템플릿/수신자 필터 + 목록 + 상세(치환 데이터 JSON, 오류 메시지, 본문 스냅샷).
`SEND_TYPE` 으로 실발송/테스트 구분 필터.

---

## 4. API 설계 (백엔드 연동 시)

```
GET    /api/mail/templates?category=&status=&keyword=      템플릿 목록
GET    /api/mail/templates/{id}                            상세 (현재버전 본문 + 변수 + 연결이벤트)
POST   /api/mail/templates                                 신규
PUT    /api/mail/templates/{id}                            메타 수정
POST   /api/mail/templates/{id}/versions                   새 버전 저장 (본문 수정 = 항상 새 버전)
GET    /api/mail/templates/{id}/versions                   버전 이력
POST   /api/mail/templates/{id}/versions/{vid}/activate    해당 버전 활성화(롤백)
POST   /api/mail/templates/{id}/preview                    { model } -> { subject, html, text }  ※저장 없이 렌더
POST   /api/mail/templates/{id}/test-send                  { toEmail, model } -> 테스트 발송
GET    /api/mail/templates/{id}/variables                  변수 정의
PUT    /api/mail/templates/{id}/variables                  변수 정의 일괄 저장

GET    /api/mail/events                                    발송 이벤트 목록
GET    /api/mail/dispatch-map                              이벤트 + 현재 템플릿 + 발송통계 (매핑현황 화면)
PUT    /api/mail/events/{eventId}/template                 이벤트에 템플릿 바인딩

GET    /api/mail/send-logs?from=&to=&status=&templateId=   발송 이력
GET    /api/mail/send-logs/{logId}                         상세 (본문 스냅샷 포함)
POST   /api/mail/send-logs/{logId}/resend                  재발송
```

응답 규격은 프로젝트 공통 `{ code, message, data }` (`src/utils/http.js` 인터셉터와 동일).

### 4.1 미리보기 렌더는 반드시 서버에서

프론트에서 Velocity를 흉내내면 "미리보기는 멀쩡한데 실제 발송은 깨지는" 사고가 난다.
`POST /preview` 로 **실제 발송과 같은 엔진**을 태워 결과 HTML을 받아 iframe에 넣는 것이 원칙이다.

> 현재 구현(DB 미연동 단계)에서는 `src/utils/mailTemplateRender.js` 의 **간이 Velocity 렌더러**로 대체한다.
> `${a.b}`, `$!{a}`, `#if/#elseif/#else/#end`, `#foreach`, `#set` 정도만 지원하는 데모용이며,
> 백엔드 연동 시 `POST /preview` 호출로 교체한다. (해당 파일 상단에 교체 지점 주석 표기)

### 4.2 보안

- 템플릿 본문은 HTML이므로 저장 시 `<script>`, `on*=`, `javascript:` 를 서버에서 제거(sanitize).
- 미리보기 iframe은 `sandbox` 속성으로 스크립트 차단.
- 테스트 발송 수신자는 **사내 도메인 화이트리스트**로 제한 (운영 데이터로 외부 대량발송 방지).
- 변수 치환 값은 HTML 이스케이프 (Velocity `$esc.html($userName)` 또는 서버측 escape).

---

## 5. 테이블 구조 요약

| 테이블 | 역할 |
|---|---|
| `MAIL_TEMPLATE_LAYOUT` | 공통 헤더/푸터/기본 CSS (CI 변경 시 한 번에 반영) |
| `MAIL_TEMPLATE` | 템플릿 마스터 (코드/명/카테고리/엔진/상태/현재버전) |
| `MAIL_TEMPLATE_VERSION` | 본문 버전 이력 (제목 + HTML + TEXT). **수정 = 새 행** |
| `MAIL_TEMPLATE_VAR` | 템플릿별 변수 정의 → 테스트 폼 자동생성 / 필수값 검증 |
| `MAIL_TEMPLATE_ATTACH` | 고정 첨부 및 인라인 이미지(CID) |
| `MAIL_EVENT` | 시스템 메일 발송 지점 정의 (`ORDER.CONFIRM` 등) |
| `MAIL_EVENT_TEMPLATE` | **이벤트 ↔ 템플릿 바인딩** (locale/brand/기간별). 매핑현황 화면의 근거 |
| `MAIL_SEND_LOG` | 발송 이력 (VERSION_ID 스냅샷, 상태, 오류, 오픈/클릭) |

DDL 파일:
- `docs/ddl/mail_template_mysql.sql` — MySQL 8 / MariaDB (H2 MySQL 모드 호환)
- `docs/ddl/mail_template_oracle.sql` — Oracle 11g+
- `docs/ddl/mail_template_seed.sql` — 샘플 데이터 (화면 목데이터와 동일 내용)

### 5.1 설계 판단 근거 (왜 이렇게 쪼갰나)

- **VERSION 분리**: 본문을 마스터에 두면 이력이 사라진다. "누가 언제 뭘 바꿨고 되돌릴 수 있나"가 B2B 감사요건.
- **EVENT ↔ TEMPLATE 분리**: 이벤트는 코드가 참조하는 불변 키, 템플릿은 갈아끼우는 대상.
  둘을 합치면 템플릿 교체 시 코드 수정이 필요해진다. 분리해야 **무중단 문구 교체**가 된다.
- **VAR 테이블**: 변수를 본문에서 정규식으로 긁으면 타입/필수/설명을 알 수 없다.
  명시 정의가 있어야 테스트 폼 자동생성과 발송 전 검증이 가능하다.
- **LOG에 VERSION_ID**: 위 2.4 참조. 사후 재현성.
- **LAYOUT 분리**: 템플릿 20개에 푸터 법적고지가 복붙돼 있으면 법무 문구 변경 시 20번 수정한다.

---

## 6. 구현 순서 (다음 단계 로드맵)

| 단계 | 내용 | 상태 |
|---|---|---|
| 1 | DDL 3종 작성 | 완료 |
| 2 | 관리 화면 3종 (목데이터) | 완료 |
| 3 | JPA 엔티티 + Repository + `{code,message,data}` 컨트롤러 | 다음 |
| 4 | `MailRenderService` (Velocity StringResourceLoader) + `/preview` API | 다음 |
| 5 | `MailSendService` (JavaMailSender, multipart/alternative, 로그 적재) | 다음 |
| 6 | `.vm` seed 로더 (부팅 시 파일 → DB) | 다음 |
| 7 | 발송 실패 재시도 배치 + 오픈/클릭 트래킹 픽셀 | 선택 |
