# NexHubStudio 코딩 규칙

## 📌 핵심 원칙

**"try-catch는 GlobalExceptionHandler만 사용한다"**  
**"@Valid로 형식 검증, Service에서 비즈니스 검증"**

---

## 1️⃣ Controller

```java
@RestController
@RequestMapping("/api/resources")
@RequiredArgsConstructor
public class ResourceController {
    private final ResourceService service;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Resource>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(service.getById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Resource>> create(@Valid @RequestBody ResourceRequest request) {
        return ResponseEntity.ok(ApiResponse.success(service.create(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Resource>> update(
            @PathVariable Long id,
            @Valid @RequestBody ResourceRequest request) {
        return ResponseEntity.ok(ApiResponse.success(service.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success("삭제 완료", null));
    }
}
```

**응답:**

```json
// 성공
{ "code": "SUCCESS", "message": "성공", "data": {...} }

// 실패 (GlobalExceptionHandler가 자동 처리)
{ "code": "R001", "message": "리소스를 찾을 수 없습니다.", "data": null }
```

---

## 2️⃣ Service

```java
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ResourceService {
    private final ResourceMapper mapper;

    public Resource getById(Long id) {
        Resource resource = mapper.findById(id);
        if (resource == null) {
            throw new BusinessException(ErrorCode.RESOURCE_NOT_FOUND);
        }
        return resource;
    }

    @Transactional
    public Resource create(ResourceRequest request) {
        // @Valid로 필수값 체크 완료 → Service는 비즈니스 로직만
        if (mapper.existsByCode(request.getCode())) {
            throw new BusinessException(ErrorCode.RESOURCE_ALREADY_EXISTS);
        }
        Resource resource = new Resource();
        // ... 설정
        mapper.insert(resource);
        return resource;
    }
}
```

---

## 3️⃣ Request DTO + Validation

```java
import jakarta.validation.constraints.*;

public class ResourceRequest {
    @NotBlank(message = "리소스 코드는 필수입니다.")
    @Size(max = 20, message = "리소스 코드는 20자 이하여야 합니다.")
    private String code;

    @NotBlank(message = "리소스 이름은 필수입니다.")
    @Size(max = 100, message = "리소스 이름은 100자 이하여야 합니다.")
    private String name;

    @Pattern(regexp = "^[YN]$", message = "사용여부는 Y 또는 N이어야 합니다.")
    private String useYn;

    @Min(value = 0, message = "정렬순서는 0 이상이어야 합니다.")
    private Integer sortOrder;

    // Getters and Setters
}
```

**주요 어노테이션:**

- `@NotNull`, `@NotBlank`: 필수값
- `@Size(max=100)`: 길이 제한
- `@Pattern(regexp="...")`: 정규식
- `@Min`, `@Max`: 숫자 범위
- `@Email`: 이메일 형식

---

## 4️⃣ ErrorCode 정의

```java
public enum ErrorCode {
    // 리소스 관련 (R001~R099)
    RESOURCE_NOT_FOUND(HttpStatus.NOT_FOUND, "R001", "리소스를 찾을 수 없습니다."),
    RESOURCE_ALREADY_EXISTS(HttpStatus.CONFLICT, "R002", "이미 존재하는 리소스입니다."),

    // 형식: ErrorCode명(HTTP상태코드, "에러코드", "메시지")
}
```

**HTTP 상태코드:**

- `NOT_FOUND` → 404
- `CONFLICT` → 409
- `BAD_REQUEST` → 400
- `UNAUTHORIZED` → 401
- `FORBIDDEN` → 403
- `INTERNAL_SERVER_ERROR` → 500

**에러 코드 네이밍:**

- G001~G099: 코드 그룹
- U001~U099: 사용자
- P001~P099: 게시글
- M001~M099: 댓글
- F001~F099: 파일
- E001~E099: 설비
- R001~R099: 리소스

---

## ❌ 금지 사항

```java
// ❌ Controller에서 try-catch
try { ... } catch (Exception e) { ... }

// ❌ Service에서 null 반환 금지
public Resource getById(Long id) {
    return mapper.findById(id);  // null이면 Controller에서 처리? NO!
}

// ✅ null 체크 후 Exception
public Resource getById(Long id) {
    Resource resource = mapper.findById(id);
    if (resource == null) {
        throw new BusinessException(ErrorCode.RESOURCE_NOT_FOUND);
    }
    return resource;
}

// ❌ IllegalArgumentException 사용
throw new IllegalArgumentException("에러");

// ❌ ErrorCode 커스텀 메시지
throw new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "특정 상황");

// ✅ ErrorCode 메시지 그대로 사용
throw new BusinessException(ErrorCode.RESOURCE_NOT_FOUND);
// 추가 정보 필요 시 별도 ErrorCode 정의
```
