package com.nexhubstudio.backend.exception;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * 비즈니스 예외 코드 정의
 * 프론트엔드와 협업을 위한 에러 코드 체계
 */
@Getter
@AllArgsConstructor
public enum ErrorCode {

    // 공통 에러 (C001~C099)
    INVALID_INPUT(HttpStatus.BAD_REQUEST, "C001", "잘못된 입력값입니다."),
    INVALID_REQUEST(HttpStatus.BAD_REQUEST, "C002", "잘못된 요청입니다."),
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "C003", "인증이 필요합니다."),
    FORBIDDEN(HttpStatus.FORBIDDEN, "C004", "권한이 없습니다."),
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "C005", "서버 오류가 발생했습니다."),

    // 사용자 관련 에러 (U001~U099)
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "U001", "사용자를 찾을 수 없습니다."),
    USER_ALREADY_EXISTS(HttpStatus.CONFLICT, "U002", "이미 존재하는 사용자입니다."),
    USER_ID_REQUIRED(HttpStatus.BAD_REQUEST, "U003", "사용자 ID는 필수입니다."),
    USER_NAME_REQUIRED(HttpStatus.BAD_REQUEST, "U004", "사용자 이름은 필수입니다."),
    INVALID_PASSWORD(HttpStatus.BAD_REQUEST, "U005", "비밀번호가 일치하지 않습니다."),
    USER_DELETE_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "U006", "사용자 삭제에 실패했습니다."),
    USER_UPDATE_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "U007", "사용자 수정에 실패했습니다."),

    // 인증 관련 에러 (A001~A099)
    INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED, "A001", "아이디 또는 비밀번호가 올바르지 않습니다."),
    TOKEN_EXPIRED(HttpStatus.UNAUTHORIZED, "A002", "토큰이 만료되었습니다."),
    INVALID_TOKEN(HttpStatus.UNAUTHORIZED, "A003", "유효하지 않은 토큰입니다."),

    // 게시글 관련 에러 (P001~P099)
    POST_NOT_FOUND(HttpStatus.NOT_FOUND, "P001", "게시글을 찾을 수 없습니다."),
    POST_TITLE_REQUIRED(HttpStatus.BAD_REQUEST, "P002", "게시글 제목은 필수입니다."),
    POST_CONTENT_REQUIRED(HttpStatus.BAD_REQUEST, "P003", "게시글 내용은 필수입니다."),
    POST_ALREADY_DELETED(HttpStatus.BAD_REQUEST, "P004", "이미 삭제된 게시글입니다."),
    POST_UPDATE_FORBIDDEN(HttpStatus.FORBIDDEN, "P005", "게시글 수정 권한이 없습니다."),
    POST_DELETE_FORBIDDEN(HttpStatus.FORBIDDEN, "P006", "게시글 삭제 권한이 없습니다."),

    // 댓글 관련 에러 (M001~M099) - Comment
    COMMENT_NOT_FOUND(HttpStatus.NOT_FOUND, "M001", "댓글을 찾을 수 없습니다."),
    COMMENT_CONTENT_REQUIRED(HttpStatus.BAD_REQUEST, "M002", "댓글 내용은 필수입니다."),
    COMMENT_UPDATE_FORBIDDEN(HttpStatus.FORBIDDEN, "M003", "댓글 수정 권한이 없습니다."),
    COMMENT_DELETE_FORBIDDEN(HttpStatus.FORBIDDEN, "M004", "댓글 삭제 권한이 없습니다."),
    PARENT_COMMENT_NOT_FOUND(HttpStatus.NOT_FOUND, "M005", "부모 댓글을 찾을 수 없습니다."),

    // 파일 관련 에러 (F001~F099)
    FILE_NOT_FOUND(HttpStatus.NOT_FOUND, "F001", "파일을 찾을 수 없습니다."),
    FILE_UPLOAD_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "F002", "파일 업로드에 실패했습니다."),
    FILE_TOO_LARGE(HttpStatus.BAD_REQUEST, "F003", "파일 크기가 너무 큽니다."),
    INVALID_FILE_TYPE(HttpStatus.BAD_REQUEST, "F004", "허용되지 않은 파일 형식입니다."),
    FILE_DELETE_FORBIDDEN(HttpStatus.FORBIDDEN, "F005", "파일 삭제 권한이 없습니다."),

    // 설비 관련 에러 (E001~E099) - Equipment
    EQUIPMENT_NOT_FOUND(HttpStatus.NOT_FOUND, "E001", "설비를 찾을 수 없습니다."),
    EQUIPMENT_CODE_REQUIRED(HttpStatus.BAD_REQUEST, "E002", "설비 코드는 필수입니다."),
    EQUIPMENT_NAME_REQUIRED(HttpStatus.BAD_REQUEST, "E003", "설비 이름은 필수입니다."),
    EQUIPMENT_ALREADY_EXISTS(HttpStatus.CONFLICT, "E004", "이미 존재하는 설비입니다."),
    EQUIPMENT_UPDATE_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "E005", "설비 정보 업데이트에 실패했습니다.");

    private final HttpStatus status;
    private final String code;
    private final String message;
}
