# 데이터베이스 설정 가이드

## H2 Database 설정

### 저장 모드 선택

H2 데이터베이스는 두 가지 모드로 실행 가능합니다.

#### 1. 파일 모드 (현재 설정)

```yaml
# config-db.yml
url: jdbc:h2:file:./data/userpop
```

- **특징**: 파일에 물리적으로 저장 (`data/userpop.mv.db`)
- **장점**: 재시작해도 데이터 유지
- **단점**: 파일 I/O로 인한 약간의 성능 저하
- **용도**: 운영 환경, 데이터 영구 보관 필요 시

#### 2. 메모리 모드

```yaml
# config-db.yml
url: jdbc:h2:mem:userpop
```

- **특징**: 메모리에만 저장
- **장점**: 빠른 속도, 재시작 시 깨끗한 초기 상태
- **단점**: 재시작하면 모든 데이터 사라짐
- **용도**: 개발 환경, 테스트 환경

### H2 Console 접속

- **URL**: http://localhost:8080/h2-console
- **JDBC URL**: `jdbc:h2:file:./data/userpop` (또는 현재 설정값)
- **Username**: `sa`
- **Password**: (비어있음)

---

## Liquibase 설정

### 데이터 초기화 옵션

Liquibase는 데이터베이스 스키마 버전 관리 도구입니다.

#### 1. 데이터 유지 모드 (현재 설정)

```yaml
# config-liquibase.yml
spring:
  liquibase:
    enabled: true
    change-log: classpath:db/changelog/changelog.xml
    drop-first: false
```

- **특징**: 기존 데이터 유지
- **동작**:
  - `DATABASECHANGELOG` 테이블에서 실행 이력 확인
  - 아직 실행 안된 changeSet만 실행
  - 기존 테이블/데이터는 그대로 유지
- **용도**: 운영 환경, 점진적 스키마 업데이트

#### 2. 초기화 모드

```yaml
# config-liquibase.yml
spring:
  liquibase:
    enabled: true
    change-log: classpath:db/changelog/changelog.xml
    drop-first: true
```

- **특징**: 재시작 시 모든 테이블 삭제 후 재생성
- **동작**:
  - 모든 테이블 DROP
  - changelog.xml의 모든 changeSet 처음부터 실행
  - 초기 데이터도 다시 삽입
- **용도**: 개발 환경, 깨끗한 상태로 시작 필요 시

---

## 조합별 동작 방식

### 조합 1: 파일 모드 + drop-first: false (현재 설정 ✅)

```yaml
# config-db.yml
url: jdbc:h2:file:./data/userpop

# config-liquibase.yml
drop-first: false
```

- **결과**: 데이터 영구 유지
- **재시작 시**: 기존 데이터 그대로, 새 changeSet만 실행
- **용도**: 운영 환경, 개발 중 데이터 보관

### 조합 2: 메모리 모드 + drop-first: false

```yaml
# config-db.yml
url: jdbc:h2:mem:userpop

# config-liquibase.yml
drop-first: false
```

- **결과**: 재시작하면 데이터 사라짐 (메모리 특성)
- **재시작 시**: Liquibase는 유지 모드지만 메모리 초기화됨
- **용도**: 제한적 사용 (비추천)

### 조합 3: 파일 모드 + drop-first: true

```yaml
# config-db.yml
url: jdbc:h2:file:./data/userpop

# config-liquibase.yml
drop-first: true
```

- **결과**: 파일 있어도 매번 초기화
- **재시작 시**: 모든 테이블 DROP 후 재생성
- **용도**: 개발 환경, 매번 깨끗한 상태로 테스트

### 조합 4: 메모리 모드 + drop-first: true

```yaml
# config-db.yml
url: jdbc:h2:mem:userpop

# config-liquibase.yml
drop-first: true
```

- **결과**: 재시작 시 완전 초기화
- **재시작 시**: 메모리 초기화 + Liquibase 전체 재실행
- **용도**: 단위 테스트, 통합 테스트

---

## Changelog 관리

### 파일 위치

```
backend/src/main/resources/db/changelog/changelog.xml
```

### ChangeSet 추가 예시

```xml
<changeSet id="14-create-common-code-table" author="dev">
    <createTable tableName="common_code">
        <column name="id" type="bigint" autoIncrement="true">
            <constraints primaryKey="true" nullable="false"/>
        </column>
        <!-- ... -->
    </createTable>
</changeSet>
```

### 주의사항

- **id는 고유해야 함**: 중복 시 오류
- **실행된 changeSet은 수정 금지**: 이미 실행된 것은 변경 불가
- **새로운 변경은 새 changeSet으로**: 항상 끝에 추가
- **rollback 전략 고려**: 필요시 rollback 태그 추가

---

## 개발 환경별 권장 설정

### 로컬 개발 (데이터 보관)

```yaml
url: jdbc:h2:file:./data/userpop
drop-first: false
```

### 로컬 개발 (매번 초기화)

```yaml
url: jdbc:h2:file:./data/userpop
drop-first: true
```

### 테스트 환경

```yaml
url: jdbc:h2:mem:test
drop-first: true
```

### 운영 환경

```yaml
url: jdbc:postgresql://... (실제 DB)
drop-first: false
```

---

## 트러블슈팅

### 문제: 테이블이 생성되지 않음

- Liquibase enabled 확인: `spring.liquibase.enabled: true`
- changelog 경로 확인: `classpath:db/changelog/changelog.xml`
- 로그 확인: `Liquibase` 키워드 검색

### 문제: 데이터가 사라짐

- H2 모드 확인: `jdbc:h2:file` vs `jdbc:h2:mem`
- drop-first 확인: `false`로 설정되어 있는지

### 문제: changeSet 중복 오류

- `DATABASECHANGELOG` 테이블 확인
- id 중복 확인
- 필요시 테이블 삭제 후 재실행

### 데이터베이스 완전 초기화 방법

1. 백엔드 종료
2. `data/userpop.mv.db` 파일 삭제
3. 백엔드 재시작
4. Liquibase가 처음부터 실행됨
