# 🚀 NexHubStudio - Full Stack Application

Vue 3 + Express.js 기반의 사용자 관리 및 **엔터프라이즈 그리드 (RealGrid 2 / JqWidgets) & 피벗(Pivot) 솔루션 비교 풀스택 시스템**입니다.

---

## 🏗️ 프로젝트 구조

```
NexHubStudio/
├── frontend/          # 🎨 Vue 3 프론트엔드 (RealGrid 2 + RealPivot + JqWidgets)
│   ├── src/          # 소스 코드
│   ├── public/       # 정적 파일 및 목업 DB
│   └── README.md     # Frontend 개발 가이드
├── backend/           # 🚀 Express.js 백엔드
│   ├── src/          # API 서버 코드
│   └── README.md     # Backend API 문서
└── README.md         # 프로젝트 개요 (현재 파일)
```

---

## 📌 주요 기능 및 피벗 예제 3종

본 프로젝트는 RealGrid 2 구축 환경에서 엑셀 피벗(Pivot Table) 요구사항을 해결하기 위한 **3가지 구현 방식**을 실시간 비교 및 검증할 수 있는 샘플 화면을 포함하고 있습니다.

1. **RealPivot 체험 및 가이드 (`/real-pivot`)**: 엑셀 피벗과 동일한 행/열/값 드롭존 필드 드래그 앤 드롭 시뮬레이션 UI.
2. **피벗 대안 A: RealGrid 2 행 그룹핑 & 소계 (`/pivot-alt-a`)**: 추가 라이선스 없는 **RealGrid 2 기본 기능**을 활용한 1~3단계 동적 행 그룹핑 및 소계/합계.
3. **피벗 대안 B: 동적 교차표 Matrix (`/pivot-alt-b`)**: raw 데이터를 가로/세로 매트릭스로 동적 변환하는 피벗 엔진 유틸리티 연동.

---

## 🚀 빠른 시작 (Quick Start)

### 1. Frontend 실행
```bash
cd frontend
npm install
npm run dev           # http://localhost:5173
```

### 2. Backend 실행
```bash
cd backend
npm install
cp .env.example .env  # 환경 변수 설정
npm run dev          # http://localhost:3001
```

---

## 🛠️ 기술 스택

| 구분 | 주요 기술 |
| :--- | :--- |
| **Frontend** | Vue 3, RealGrid 2, `realgrid-vue`, JqWidgets (`jqwidgets-scripts`), Vue Router 4, Bootstrap 5, Vite |
| **Backend** | Express.js, JWT 인증, bcrypt, helmet, cors |
| **Runtime / Tools** | Node.js v22.19.0 (Volta) |

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
- Vue 3, Express.js, Bootstrap 5, Vite, Vue Router 등은 **MIT License**를 준수합니다.
