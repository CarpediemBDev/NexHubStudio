# 🚀 NexHub Grid & RealGrid Pivot Studio

Vue 3 + RealGrid 2 + JqWidgets + Bootstrap 5 기반의 **엔터프라이즈 그리드 및 피벗(Pivot) 솔루션 비교·구축 예제 시스템**입니다.

---

## 📌 주요 특징 및 피벗 예제 3종

본 프로젝트는 RealGrid 2 구축 환경에서 엑셀 피벗(Pivot Table) 요구사항을 해결하기 위한 **3가지 구현 방식**을 실시간 비교 및 검증할 수 있는 샘플 화면을 제공합니다.

### 1. 피벗 비교 예제 3종 (`/pivot-alt-a`, `/pivot-alt-b`, `/real-pivot`)
1. **RealPivot 체험 및 가이드 (`/real-pivot`)**:
   - 엑셀 피벗과 동일하게 행/열/값 드롭존 필드 드래그 앤 드롭 시뮬레이션 UI.
   - RealPivot 전용 SDK 연동 가이드 및 3종 구현 비교표 제공.
2. **피벗 대안 A: RealGrid 2 행 그룹핑 & 소계 (`/pivot-alt-a`)**:
   - 추가 라이선스 없는 **RealGrid 2 기본 기능** 활용.
   - 상단 `groupingPanel`을 통한 1~3단계 동적 행 그룹핑, 부서/직급별 소계/합계(`groupFooter`), 전체 총계(`columnFooter`) 및 접기/펴기.
3. **피벗 대안 B: 동적 교차표 Matrix (`/pivot-alt-b`)**:
   - 행 축 / 열 축 / 집계 대상을 선택하면 원본 Flat JSON을 가로/세로 매트릭스로 변환하는 **`pivotUtil.js`** 피벗 엔진 연동.
   - RealGrid 동적 컬럼(Dynamic Columns) 및 다차원 헤더 바인딩.

### 2. 그리드 기초 및 공통 컴포넌트 샘플
- **RealGridCommonJs**: Vue 3에서 RealGrid 2 인스턴스를 탈출구(Escape Hatch)로 직접 제어할 수 있는 고성능 공통 래퍼 컴포넌트 (`src/components/RealGridCommonJs.vue`).
- **JqxGrid 샘플**: JqWidgets Grid 래퍼 컴포넌트 (`src/components/JqxCustomeGrid.vue`) 및 사용자 검색 그리드 예제.

---

## ⚡ 빠른 시작 (Quick Start)

이 프로젝트는 **Volta**로 Node와 npm 버전을 고정하여 개발 환경의 일관성을 보장합니다.

```bash
# 1. 의존성 패키지 설치
npm install

# 2. 목업 데이터 생성 (public/db.json)
npm run make:db

# 3. 개발 서버 실행
npm run dev
```

---

## 📁 프로젝트 구조

```
src/
├── pages/                       # 📄 페이지 컴포넌트
│   ├── RealGridPage.vue        # RealGrid 2 기본 샘플
│   ├── RealGridVuePage.vue     # RealGrid-Vue 래퍼 샘플
│   ├── PivotAltAPage.vue       # 피벗 대안 A (행 그룹핑&소계)
│   ├── PivotAltBPage.vue       # 피벗 대안 B (동적 교차표 Matrix)
│   ├── RealPivotPage.vue       # RealPivot 체험 및 가이드
│   ├── UserPage.vue            # 사용자 관리 페이지
│   ├── UserSearGridPage.vue    # 사용자 검색 그리드 페이지
│   └── JqxGridPage.vue         # JqxGrid 샘플 페이지
│
├── components/                  # 🧩 공통 컴포넌트
│   ├── RealGridCommonJs.vue    # RealGrid 2 공통 래퍼 컴포넌트
│   ├── JqxCustomeGrid.vue      # JqWidgets Grid 공통 래퍼 컴포넌트
│   ├── UserPopup.vue           # 드래그 가능한 사용자 선택 팝업
│   └── NavBar.vue              # 피벗 및 그리드 메뉴가 통합된 네비게이션
│
├── utils/                       # 🛠️ 유틸리티
│   ├── pivotUtil.js            # Raw Data -> Matrix Pivot 변환 엔진
│   ├── showPop.js              # 드래그 가능 모달 시스템
│   └── toastUtil.js            # 토스트 알림 유틸
│
└── router/                      # 🛣️ 라우팅
    └── index.js                # Vue Router (피벗 및 그리드 라우트 등록)
```

---

## 🔧 기술 스택

- **Frontend Framework**: Vue 3 (Options API)
- **Grid Solutions**: 
  - RealGrid 2 (`realgrid` ^2.9.7), `realgrid-vue` (^0.9.8), RealPivot (Simulated)
  - JqWidgets (`jqwidgets-scripts` ^19.2.0)
- **UI Framework**: Bootstrap 5 + Bootstrap Icons
- **Build Tool**: Vite
- **Runtime**: Node.js v22.19.0 (Volta)

---

## 📄 상용 라이브러리 저작권 및 라이선스 고지 (License & Copyright Notice)

본 프로젝트는 **기능 비교, 기술 검토(PoC) 및 학습/테스트 목적**으로 제작되었습니다. 프로젝트에 사용된 상용 웹 그리드 솔루션의 소유권 및 라이선스 정책은 다음과 같습니다.

### 1. RealGrid 2 & RealPivot
- **저작권자**: (주)우리테크 (WooriTech Co., Ltd.)
- **사용 정책**: 본 프로젝트의 RealGrid 및 RealPivot 관련 기능은 개발자 평가/학습용 라이선스 환경(`localhost`)에서 구동됩니다.
- **주의 사항**: 본 프로젝트를 상업적 목적의 실제 서비스로 배포하거나 운영할 경우, 반드시 [(주)우리테크 공식 웹사이트](https://www.realgrid.com/)를 통해 정식 상용 라이선스를 구득해야 합니다.

### 2. JqWidgets (jqxGrid)
- **저작권자**: JQWidgets Ltd.
- **사용 정책**: JqWidgets는 비상업적(Non-Commercial), 개인 학습 및 사전 평가 목적으로 무료 사용이 가능합니다.
- **주의 사항**: 상업적 애플리케이션에 탑재하여 배포할 경우 [JQWidgets Ltd. 라이선스 정책](https://www.jqwidgets.com/license/)에 따라 상용 라이선스를 구매해야 합니다.

### 3. Open Source Stack
- Vue 3, Bootstrap 5, Vite, Vue Router 등은 **MIT License**를 준수합니다.
