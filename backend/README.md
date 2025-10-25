# NexHubStudio 백엔드(Spring Boot) 빠른 시작 가이드

이 문서는 NexHubStudio 백엔드(Spring Boot, Liquibase, H2) 프로젝트를 처음 접하는 개발자도 쉽게 따라할 수 있도록 단계별로 안내합니다.

---

## 1. 프로젝트 준비 및 실행

1. **프로젝트 클론**

   ```bash
   git clone <레포지토리 주소>
   cd NexHubStudio/backend
   ```

2. **의존성 설치 및 빌드** (최초 1회)

   ```bash
   ./gradlew build
   ```

3. **서버 실행**

   ```bash
   ./gradlew bootRun
   ```

   또는 IDE에서 `NexHubStudioApplication.java`를 실행해도 됩니다.

4. **DB 및 테이블 자동 생성**
   - 서버가 실행되면 Liquibase가 자동으로 DB 테이블과 초기 데이터를 생성합니다.
   - 별도 SQL 실행 없이 바로 API/프론트엔드에서 데이터 사용이 가능합니다.

---

## 2. H2 콘솔에서 데이터 확인

1. 브라우저에서 [http://localhost:8080/h2-console](http://localhost:8080/h2-console) 접속
2. JDBC URL: `jdbc:h2:file:./data/userpop` (application.yml 참고)
3. 사용자명: `sa`, 비밀번호: (빈칸)
4. 쿼리 예시:
   - 테이블 목록: `SHOW TABLES;`
   - 데이터 조회: `SELECT * FROM users;`

---

## 3. 참고 및 구조 변경

- 테이블/초기 데이터는 `src/main/resources/db/changelog/changelog.xml`에서 관리합니다.
- DB 구조 변경/초기 데이터 추가는 changelog.xml에 반영하면 서버 재시작 시 자동 적용됩니다.

---

### 💡 추가 팁

- application.yml은 실무처럼 설정 파일이 분리되어 있으니, 환경별 설정은 각 config-\*.yml에서 관리하세요.
- 문제가 발생하면 콘솔 로그와 README를 참고하세요.
