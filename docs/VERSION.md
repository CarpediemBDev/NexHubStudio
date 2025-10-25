# NexHubStudio Version History

## v0.1.0 (2025-10-26)

### Backend

- 백엔드 기본 구조 설계
- User 도메인/DTO/컨트롤러/서비스/매퍼 기본 뼈대 생성
- 사용자 전체 조회, 단일 조회 API 구현 (GET /users, GET /users/{userId})
- 예외 처리 구조 정리(ResourceNotFoundException 등)
- MyBatis 매퍼/설정 추가

### Frontend

- Vue 3 + Vite 기반 프로젝트 구조 설계
- Bootstrap 5, JqWidgets, Vue Router 등 주요 라이브러리 적용
- 사용자 관리 페이지(UserPage), 사용자 검색 그리드(UserSearGridPage), JqxGrid 샘플 페이지 구현
- 네비게이션 바, 사용자 선택 모달, 페이지네이션 등 공통 컴포넌트 구현
- 목업 데이터 생성 스크립트 및 샘플 데이터 연동
- 페이지 전환 애니메이션 및 반응형 UI 적용
