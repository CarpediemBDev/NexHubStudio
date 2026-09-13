# 느린 ORDER BY 진단서 (PostgreSQL)

> 대상: 약 200만 건 테이블, `ORDER BY modified_date` 정렬 지연.
> `modified_date`는 복합 인덱스에 포함되어 있음.

**전제 한 줄:** 인덱스에 컬럼이 들어있는 것과, 그 인덱스로 정렬이 되는 것은 다르다.
복합 인덱스가 정렬을 대신하려면 `modified_date`보다 앞에 있는 모든 컬럼이 WHERE에서 `=`로 고정돼야 한다.
아래 순서는 그것부터 확인한다.

---

## 1단계 · 수집

판단에 필요한 정보. 이게 없으면 진단이 아니라 추측이 된다.

### 1-1. 버전과 설정

```sql
SELECT version();
SHOW work_mem;
SHOW effective_cache_size;
SHOW random_page_cost;
SHOW enable_incremental_sort;   -- PG 13+
```

PG 13 미만이면 Incremental Sort가 없고, PG 12 미만이면 CTE가 항상 실체화된다. 버전이 처방을 가른다.

### 1-2. 테이블과 인덱스 정의

```sql
\d+ orders

SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'orders';
```

**여기서 확인할 것:** `modified_date`가 각 인덱스에서 **몇 번째 컬럼**인가. 정렬 방향(`DESC`)과 `NULLS FIRST/LAST`가 명시돼 있는가. 컬럼 타입이 `timestamptz`인가 `text`인가.

### 1-3. 통계와 vacuum 상태

```sql
SELECT relname, n_live_tup, n_dead_tup,
       last_vacuum, last_autovacuum, last_analyze, last_autoanalyze
FROM pg_stat_user_tables
WHERE relname = 'orders';
```

`n_dead_tup`이 `n_live_tup`의 10%를 넘거나 `last_autovacuum`이 오래됐으면 Index Only Scan이 막히고 플래너 추정도 틀어진다.

### 1-4. 인덱스가 실제로 쓰이는지

```sql
SELECT indexrelname, idx_scan,
       pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes
WHERE relname = 'orders'
ORDER BY idx_scan;
```

`idx_scan = 0`인 인덱스는 쓰이지 않으면서 쓰기 비용만 먹고 있다. 새 인덱스를 만들기 전에 여기부터 본다.

### 1-5. 실행 계획

```sql
EXPLAIN (ANALYZE, BUFFERS, SETTINGS, VERBOSE) <느린 쿼리>;
```

- `ANALYZE` 없는 `EXPLAIN`은 추정치일 뿐이다. 반드시 붙인다.
- `ANALYZE`는 쿼리를 **실제로 실행한다.** INSERT/UPDATE/DELETE라면 `BEGIN; ... ROLLBACK;`으로 감싼다.
- 캐시 효과를 걷어내려면 **연속 2회 실행**하고 두 번째 결과를 기준으로 본다.

---

## 2단계 · 판독

실행 계획에서 볼 것은 이 7가지다.

| 지표 | 어디에 | 무슨 뜻 | 위험 신호 |
|---|---|---|---|
| `Sort` 노드 | 계획 트리 | 인덱스로 정렬을 못 해 별도 정렬 수행 | **존재 자체가 신호** |
| `Sort Method` | `Sort` 노드 하위 | 정렬 수행 방식 | `external merge  Disk:` → work_mem 초과 |
| `Rows Removed by Filter` | 스캔 노드 | 읽고 버린 행 수 | 최종 반환 행의 100배 이상 |
| 추정 `rows=` vs `actual rows=` | 모든 노드 | 통계 정확도 | 10배 이상 벌어짐 |
| `Heap Fetches` | `Index Only Scan` | 힙 재방문 횟수 | 0에서 크게 벗어남 → vacuum 필요 |
| `Buffers: read=` | `BUFFERS` 옵션 | 캐시에 없어 디스크에서 읽은 블록 | 수만 이상 → I/O 병목 |
| `Limit` 하위 노드의 `actual rows` | `Limit` 바로 아래 | 실제로 만들어낸 행 수 | Limit 20인데 하위가 수십만 → 깊은 OFFSET |

읽는 순서: **안쪽(들여쓰기 깊은 곳)부터 바깥으로.** `actual time`은 누적값이므로, 한 노드의 순수 소요는 `자기 actual time − 자식 actual time`이다.

---

## 3단계 · 판정

### 케이스 A — 인덱스가 정렬에 쓰이지 않음 (`Sort` 노드 등장)

가장 흔하다. 200만 건에서 "느리다"의 대부분이 여기다.

```
Limit  (cost=181240.55..181240.60 rows=20 width=248) (actual time=2841.113..2841.121 rows=20 loops=1)
  Buffers: shared hit=1024 read=64891, temp read=33064 written=33102
  ->  Sort  (cost=181240.55..186236.60 rows=1998420 width=248) (actual time=2841.111..2841.116 rows=20 loops=1)
        Sort Key: modified_date DESC NULLS LAST                          <- (2)
        Sort Method: external merge  Disk: 264512kB                      <- (3)
        Buffers: shared hit=1024 read=64891, temp read=33064 written=33102
        ->  Seq Scan on orders  (cost=0.00..96891.00 rows=1998420 width=248) (actual time=0.011..412.883 rows=1998420 loops=1)
              Filter: (status = 'Y'::text)
              Rows Removed by Filter: 1580
              Buffers: shared hit=1024 read=64891
Planning Time: 0.142 ms
Execution Time: 2903.447 ms
```

**판정 근거**

1. `Sort` 노드가 존재한다 → 인덱스가 정렬 순서를 제공하지 못했다.
2. `Sort Key`에 `NULLS LAST`가 명시돼 있다. PG 기본값은 `ASC → NULLS LAST`, `DESC → NULLS FIRST`다. 일반 오름차순 인덱스를 역방향 스캔하면 `DESC NULLS FIRST`가 나오므로, 쿼리가 `DESC NULLS LAST`를 요구하면 **인덱스가 있어도 못 쓴다.**
3. 20건만 필요한데 199만 건을 전부 정렬하고 264MB를 디스크에 썼다.

**원인 후보 (이 순서로 확인)**

1. 복합 인덱스에서 `modified_date` 앞 컬럼이 WHERE에 `=`로 고정되지 않음. 범위 조건(`>`, `BETWEEN`, `LIKE 'x%'`, `IN`)도 그 뒤 컬럼의 순서를 깬다.
2. `NULLS FIRST/LAST` 불일치 (위 예시)
3. 정렬 방향 혼합: `ORDER BY a ASC, modified_date DESC`는 `(a ASC, modified_date DESC)` 인덱스가 있어야 한다. 방향이 전부 같거나 전부 반대일 때만 기존 인덱스를 정/역방향 스캔으로 커버할 수 있다.
4. `ORDER BY`에 함수·형변환: `ORDER BY modified_date::date`, `ORDER BY to_char(modified_date,'YYYYMMDD')` → 동일한 표현식 인덱스가 없으면 무조건 Sort
5. 조인 상대 테이블의 컬럼으로 정렬 (→ 케이스 F)

**처방** → 4-1

**고친 뒤 이 형태가 나와야 한다**

```
Limit  (cost=0.43..2.14 rows=20 width=248) (actual time=0.038..0.061 rows=20 loops=1)
  Buffers: shared hit=24
  ->  Index Scan using idx_orders_status_mod on orders  (cost=0.43..170338.21 rows=1998420 width=248) (actual time=0.036..0.056 rows=20 loops=1)
        Index Cond: (status = 'Y'::text)
        Buffers: shared hit=24
Planning Time: 0.211 ms
Execution Time: 0.092 ms
```

`Sort`가 사라지고 `Buffers`가 64,891 → 24로 떨어졌다.

---

### 케이스 B — 정렬은 하는데 디스크로 흘러넘침

`Sort Method: external merge  Disk: 264512kB` — work_mem 초과다.

세션 한정으로 올려서 확인:

```sql
BEGIN;
SET LOCAL work_mem = '256MB';
EXPLAIN (ANALYZE, BUFFERS) <쿼리>;
ROLLBACK;
```

`quicksort` 또는 `top-N heapsort`로 바뀌면 확인된 것.

주의할 점 둘:

- work_mem은 쿼리 하나가 아니라 **정렬/해시 노드 하나당** 할당된다. 동시 접속 수 × 노드 수만큼 곱해져 메모리를 먹으므로 전역 상향은 위험하다.
- 이건 완화책이다. 근본은 케이스 A/C를 없애서 애초에 200만 건을 정렬하지 않게 만드는 것이다.

`ORDER BY ... LIMIT n`에서 `Sort Method: top-N heapsort`가 뜨는 건 정상이다. 전체 정렬이 아니라 상위 n개만 유지한다.

---

### 케이스 C — 깊은 OFFSET

```
Limit  (cost=42618.90..42620.60 rows=20 width=248) (actual time=1284.402..1284.418 rows=20 loops=1)
  Buffers: shared hit=12043 read=488210
  ->  Index Scan using idx_orders_status_mod on orders  (cost=0.43..170338.21 rows=1998420 width=248) (actual time=0.041..1247.336 rows=500020 loops=1)   <- (1)
        Index Cond: (status = 'Y'::text)
        Buffers: shared hit=12043 read=488210
```

**판정 근거**

1. `Sort`도 없고 인덱스도 제대로 탔는데 1.2초다. `Limit`은 20을 반환했지만 **하위 노드의 `actual rows`가 500,020이다.** 앞 50만 행을 만들어서 버렸다는 뜻.

페이지 번호가 커질수록 선형으로 느려진다. 첫 페이지 테스트로는 절대 안 잡힌다.

**처방** → 4-2 (키셋 페이징), 번호 페이징을 유지해야 한다면 4-4

---

### 케이스 D — abort-early 플랜 (가끔만 극단적으로 느림)

```
Limit  (cost=0.43..118.42 rows=20 width=248) (actual time=4127.885..4127.902 rows=20 loops=1)
  Buffers: shared hit=8912 read=61044
  ->  Index Scan Backward using idx_orders_modified on orders  (cost=0.43..11803.55 rows=2000 width=248) (actual time=4127.883..4127.897 rows=20 loops=1)
        Filter: (status = 'PENDING'::text)
        Rows Removed by Filter: 1994310                                  <- (1)
        Buffers: shared hit=8912 read=61044
Planning Time: 0.176 ms
Execution Time: 4127.940 ms
```

**판정 근거**

1. `Rows Removed by Filter`가 199만. 20건 뽑으려고 199만 건을 읽고 버렸다.
2. 추정 cost는 118인데 실제는 4.1초. 플래너는 "최신순으로 훑다 보면 금방 20건 찾겠지"라고 판단했지만, `PENDING` 행이 전부 오래된 데이터라 인덱스 끝까지 갔다.

이 플랜의 특징은 **조건 값에 따라 성능이 극과 극**이라는 것이다. 흔한 status는 빠르고 드문 status는 수 초. "평소엔 괜찮은데 가끔 느려요"의 정체가 대개 이것이다.

**처방** → 4-1 (필터 컬럼 + 정렬 컬럼을 한 인덱스에), 4-3 (부분 인덱스), 4-5 (확장 통계)

---

### 케이스 E — Index Only Scan인데 Heap Fetches가 큼

```
  ->  Index Only Scan using idx_orders_cov on orders  (actual time=0.044..982.113 rows=500020 loops=1)
        Index Cond: (status = 'Y'::text)
        Heap Fetches: 499980                                             <- (1)
        Buffers: shared hit=8210 read=241033
```

**판정 근거**

1. 커버링 인덱스를 만들었는데도 힙을 거의 매번 다시 읽고 있다. PG의 Index Only Scan은 **visibility map이 최신일 때만** 힙 접근을 생략한다. autovacuum이 밀리면 이 최적화가 통째로 무효가 된다.

**처방** → 4-5

---

### 케이스 F — 조인 상대 테이블 컬럼으로 정렬

```
Limit  (actual time=3312.221..3312.240 rows=20 loops=1)
  ->  Sort  (actual time=3312.204..3312.219 rows=20 loops=1)
        Sort Key: o.modified_date DESC
        Sort Method: external merge  Disk: 198432kB
        ->  Hash Join  (actual time=214.882..2410.553 rows=1998420 loops=1)
              Hash Cond: (o.customer_id = c.id)
              ->  Seq Scan on orders o  (actual time=0.008..389.114 rows=1998420 loops=1)
              ->  Hash  (actual time=213.902..213.903 rows=48210 loops=1)
                    ->  Seq Scan on customers c  ...
```

**판정 근거**

조인 결과 전체(199만 행)를 만든 뒤에 정렬한다. 조인 결과에는 인덱스 순서가 남아있지 않다.

**처방** → 4-4. 정렬·페이징을 **한 테이블 안에서 먼저 끝내고** 그 결과 20건에만 조인을 붙인다.

---

## 4단계 · 처방

### 4-1. 정렬 전용 복합 인덱스

원칙: **`(등치 조건 컬럼들, 정렬 컬럼, 타이브레이커 PK)`** 순서.

```sql
CREATE INDEX CONCURRENTLY idx_orders_status_mod
  ON orders (status, modified_date DESC, id DESC);

ANALYZE orders;
```

- 운영 중이면 `CONCURRENTLY` 필수. 없으면 생성 동안 테이블에 쓰기 락이 걸린다. (트랜잭션 블록 안에서는 사용 불가)
- 쿼리가 `NULLS LAST`를 쓴다면 인덱스에도 명시한다: `modified_date DESC NULLS LAST`
- `modified_date`는 중복이 생기므로 **PK를 타이브레이커로 반드시 붙인다.** 없으면 정렬 결과가 실행마다 달라지고, 페이징에서 행이 누락·중복된다.
- 새로 만들기 전에 **기존 인덱스를 확장·재정의할 수 있는지** 먼저 본다.

### 4-2. 키셋(커서) 페이징 — OFFSET 제거

```sql
-- 1페이지
SELECT id, status, modified_date, ...
FROM orders
WHERE status = 'Y'
ORDER BY modified_date DESC, id DESC
LIMIT 20;

-- 다음 페이지: 직전 페이지 마지막 행의 (modified_date, id)를 커서로 전달
SELECT id, status, modified_date, ...
FROM orders
WHERE status = 'Y'
  AND (modified_date, id) < (:last_modified_date, :last_id)
ORDER BY modified_date DESC, id DESC
LIMIT 20;
```

PG의 행 비교(row-wise comparison)는 `(status, modified_date DESC, id DESC)` 인덱스를 그대로 탄다. `Index Cond`에 튜플 조건이 올라가는지 EXPLAIN으로 확인할 것.

**주의:** `(a, b) < (x, y)`를 `a < x OR (a = x AND b < y)`로 풀어 쓰면 인덱스 활용이 나빠질 수 있다. 튜플 형태를 유지한다.

### 4-3. 부분 인덱스

조회가 특정 조건에 집중돼 있다면 인덱스 크기를 크게 줄일 수 있다.

```sql
CREATE INDEX CONCURRENTLY idx_orders_pending_mod
  ON orders (modified_date DESC, id DESC)
  WHERE status = 'PENDING';
```

케이스 D(abort-early)에 특히 효과적이다. 단, 쿼리의 WHERE 절이 인덱스의 `WHERE` 조건을 **포함**해야 플래너가 쓴다.

### 4-4. 번호 페이징을 유지해야 할 때 / 조인이 있을 때 — deferred join

```sql
SELECT o.*, c.name
FROM (
  SELECT id, modified_date
  FROM orders
  WHERE status = 'Y'
  ORDER BY modified_date DESC, id DESC
  LIMIT 20 OFFSET 500000
) k
JOIN orders    o ON o.id = k.id
JOIN customers c ON c.id = o.customer_id
ORDER BY k.modified_date DESC, k.id DESC;
```

서브쿼리는 커버링 인덱스만으로 처리되므로 버려질 50만 행에 대해 힙을 읽지 않는다. 조인도 최종 20건에만 걸린다. OFFSET 자체의 비용은 남지만 행당 비용이 크게 줄어든다.

### 4-5. vacuum / 통계

```sql
VACUUM (ANALYZE) orders;

-- 200만 건 테이블에 기본 scale_factor 0.2는 너무 느슨하다.
-- 40만 건이 변경돼야 autovacuum이 돈다는 뜻.
ALTER TABLE orders SET (
  autovacuum_vacuum_scale_factor  = 0.02,
  autovacuum_analyze_scale_factor = 0.01
);
```

컬럼 간 상관관계로 추정이 틀어진다면 (케이스 D의 근본 원인일 수 있음):

```sql
CREATE STATISTICS st_orders_status_mod (dependencies, mcv)
  ON status, modified_date FROM orders;
ANALYZE orders;
```

정렬 컬럼의 통계 해상도를 높이는 것도 도움이 된다:

```sql
ALTER TABLE orders ALTER COLUMN modified_date SET STATISTICS 500;
ANALYZE orders;
```

### 4-6. work_mem (완화책)

```sql
-- 애플리케이션에서 해당 쿼리 직전에만
SET LOCAL work_mem = '128MB';

-- 또는 배치 전용 롤에만
ALTER ROLE batch_user SET work_mem = '256MB';
```

### 4-7. 총건수 COUNT 분리

페이징 화면이 느린 원인이 `ORDER BY` 쿼리가 아니라 같은 화면에서 도는 `SELECT COUNT(*)`인 경우가 흔하다. **두 쿼리의 소요 시간을 따로 재고 시작한다.**

대안: `LIMIT 21`로 조회해 "다음 페이지 있음"만 판단하거나, 근사치를 쓴다.

```sql
SELECT reltuples::bigint AS approx_rows
FROM pg_class WHERE relname = 'orders';
```

---

## 5단계 · 검증

1. `Sort` 노드가 사라졌는가 (또는 `top-N heapsort`로 축소됐는가)
2. `Buffers: read=`가 줄었는가 — **실행 시간보다 이 수치가 신뢰할 만하다.** 캐시 상태에 덜 흔들린다.
3. `Rows Removed by Filter`가 반환 행 수 수준으로 내려왔는가
4. 페이징이라면 **마지막 페이지**로 테스트했는가 (첫 페이지는 어떤 방식이든 빠르다)
5. 새 인덱스가 실제로 쓰이는지 며칠 뒤 `pg_stat_user_indexes.idx_scan`으로 확인
6. 인덱스 추가 후 INSERT/UPDATE 지연이 늘지 않았는지 확인

---

## 하지 말 것

- **`ANALYZE` 없는 `EXPLAIN`으로 결론 내기.** 추정치일 뿐이고, 이 문제의 핵심은 추정과 실제의 괴리다.
- **실행 시간 1회 측정으로 판단하기.** 캐시 상태에 따라 10배씩 흔들린다. 2회 실행 후 `Buffers`를 함께 본다.
- **운영 DB에 `CONCURRENTLY` 없이 인덱스 생성.**
- **`work_mem` 전역 상향.** 접속 수 × 정렬 노드 수만큼 곱해진다.
- **인덱스 무한 추가.** 200만 건 테이블은 인덱스 하나당 쓰기 비용과 수십~수백 MB가 붙는다.
- **OFFSET을 그대로 두고 인덱스만 추가.** 깊은 페이지는 여전히 느리다.
- **`ORDER BY`에 함수·형변환 남기기.** `modified_date` 컬럼 타입이 `text`라면 그것부터 고친다.
- **`SELECT *` 유지.** 정렬 대상 행 폭(`width=`)과 정렬 후 힙 랜덤 액세스를 동시에 키운다.

---

## 부록 · AI에게 그대로 넘길 지시문

```
아래 조건에서 PostgreSQL의 느린 ORDER BY 쿼리를 진단해줘.

[환경]
- PostgreSQL <버전>
- 테이블: <테이블명>, 약 200만 건
- 정렬 기준: <수정일 컬럼> DESC
- 기존 인덱스 정의:
<\d+ 또는 pg_indexes 출력 붙여넣기>

[쿼리]
<SQL 붙여넣기>

[실행계획]
<EXPLAIN (ANALYZE, BUFFERS, SETTINGS) 결과 붙여넣기>

[요청]
1. 계획 트리에서 병목 노드를 지목하고, 그렇게 판단한 근거를 계획의 실제 수치로
   제시할 것. (Sort Method / Rows Removed by Filter / Heap Fetches / Buffers /
   추정 rows 대비 actual rows)
2. 아래 중 어느 케이스인지 판정할 것:
   A) 인덱스가 정렬에 사용되지 않음 (Sort 노드 존재)
   B) 정렬이 work_mem을 초과해 디스크로 흐름
   C) 깊은 OFFSET
   D) abort-early 플랜 (LIMIT + 선택도 낮은 필터)
   E) Index Only Scan인데 Heap Fetches가 큼
   F) 조인 상대 테이블 컬럼으로 정렬
3. 처방을 제시할 것. 인덱스라면 CREATE INDEX 문 전체를 쓰고 컬럼 순서를 그렇게
   정한 이유를 밝힐 것. 정렬 컬럼 뒤에 PK 타이브레이커를 반드시 포함할 것.
   운영 DB 전제이므로 CONCURRENTLY를 붙일 것.
4. 쿼리 수정이 필요하면 수정 전/후 SQL을 모두 제시할 것.
5. 적용 후 실행계획이 어떻게 바뀌어야 성공인지 명시할 것.
   (사라져야 할 노드, 줄어야 할 수치)
6. 추측하지 말 것. 판단에 필요한 정보가 부족하면 무엇이 더 필요한지 먼저 물을 것.
```
