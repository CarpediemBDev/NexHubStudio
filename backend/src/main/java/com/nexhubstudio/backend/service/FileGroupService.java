package com.nexhubstudio.backend.service;

import de.huxhorn.sulky.ulid.ULID;
import org.springframework.stereotype.Service;

/**
 * 파일 그룹 ID 생성 서비스
 * ULID 기반으로 고유한 파일 그룹 식별자를 생성합니다.
 */
@Service
public class FileGroupService {

    private final ULID ulid = new ULID();

    /**
     * 파일 그룹 ID 생성
     * 
     * @param ownerType 소유자 타입 (POST, COMMENT, USER 등)
     * @return "FG_{ownerType}_{ULID}" 형식의 고유 ID
     * 
     *         예시:
     *         - FG_POST_01ARZ3NDEKTSV4RRFFQ69G5FAV
     *         - FG_COMMENT_01ARZ3NDEKTSV4RRFFQ69G5FAV
     */
    public String generateGroupId(String ownerType) {
        return String.format("FG_%s_%s", ownerType, ulid.nextULID());
    }
}
