package com.nexhubstudio.backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nexhubstudio.backend.domain.RegAttachFile;
import com.nexhubstudio.backend.domain.RegConflictHist;
import com.nexhubstudio.backend.domain.RegInfo;
import com.nexhubstudio.backend.domain.RegInfoHist;
import com.nexhubstudio.backend.domain.RegInfoItem;
import com.nexhubstudio.backend.domain.RegInfoTarget;
import com.nexhubstudio.backend.dto.RegulationRequest;
import com.nexhubstudio.backend.dto.RegulationResponse;
import com.nexhubstudio.backend.exception.BusinessException;
import com.nexhubstudio.backend.exception.ErrorCode;
import com.nexhubstudio.backend.mapper.RegulationMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 규격/규제 정보 서비스
 *
 * 프론트 목업 핸들러(src/mocks/handlers/regulation.js)와 같은 규칙으로 동작해야 한다.
 * 목업 모드와 실제 모드에서 화면이 똑같이 움직이는 근거가 그것이다.
 * 규칙을 바꾸면 핸들러도 같이 바꿀 것.
 */
@Service
@RequiredArgsConstructor
public class RegulationService {

    private static final Map<String, Integer> TARGET_LEVEL = Map.of(
            "DIVISION", 1, "PRODUCT_GROUP", 2, "PRODUCT", 3,
            "REGION", 1, "COUNTRY", 2);

    private final RegulationMapper regulationMapper;
    private final FileGroupService fileGroupService;
    private final ObjectMapper objectMapper;

    /* ============================================================ *
     * 조회
     * ============================================================ */

    /**
     * 화면 진입 시 스냅샷.
     * 충돌 판정이 기존 레코드 전량(+항목)을 필요로 해서 한 번에 내려준다.
     * 건수가 커지면 목록 페이징 + 충돌 후보 1차 필터 API 로 나눌 것(설계문서 5장).
     */
    @Transactional(readOnly = true)
    public RegulationResponse.Snapshot getSnapshot() {
        Map<Long, List<RegulationResponse.Target>> targetsByRecord = regulationMapper.findAllTargets().stream()
                .collect(Collectors.groupingBy(RegInfoTarget::getRegInfoId, LinkedHashMap::new,
                        Collectors.mapping(this::toTarget, Collectors.toList())));

        Map<Long, List<RegulationResponse.Attach>> attachments = regulationMapper.findAllAttachments().stream()
                .collect(Collectors.groupingBy(RegAttachFile::getRegInfoId, LinkedHashMap::new,
                        Collectors.mapping(this::toAttach, Collectors.toList())));

        List<RegulationResponse.Record> records = regulationMapper.findAllRecords().stream()
                .map(r -> toRecord(r,
                        targetsByRecord.getOrDefault(r.getRegInfoId(), List.of()),
                        attachments.getOrDefault(r.getRegInfoId(), List.of()).size()))
                .toList();

        return RegulationResponse.Snapshot.builder()
                .records(records)
                .items(regulationMapper.findAllItems())
                .histories(regulationMapper.findAllHistories().stream().map(this::toHistory).toList())
                .conflicts(regulationMapper.findAllConflicts().stream().map(this::toConflict).toList())
                .attachments(attachments)
                .build();
    }

    /* ============================================================ *
     * 저장 — 신규 INSERT / 기존은 새 버전으로 UPDATE
     * reg_info, target, item, 첨부, hist, conflict_hist, MERGE 로 폐지되는 다른 레코드까지 한 트랜잭션
     * ============================================================ */

    @Transactional
    public RegulationResponse.Record save(RegulationRequest.Save req, String userId) {
        RegulationRequest.Master m = req.getMaster();
        if (m == null || isBlank(m.getTitle())) {
            throw new BusinessException(ErrorCode.REGULATION_TITLE_REQUIRED);
        }
        if (isBlank(m.getFieldCd())) {
            throw new BusinessException(ErrorCode.REGULATION_FIELD_REQUIRED);
        }

        List<RegulationRequest.Target> targets = nullSafe(req.getTargets());
        List<RegulationRequest.Item> items = nullSafe(req.getItems());
        List<RegulationRequest.ConflictDecision> decisions = nullSafe(req.getDecisions());
        boolean isNew = m.getRegInfoId() == null;

        RegInfo record;
        if (isNew) {
            record = RegInfo.builder()
                    .regNo(nextRegNo())
                    .versionNo(1)
                    .attachGroupId(fileGroupService.generateGroupId("REG"))
                    .createdBy(userId)
                    .updatedBy(userId)
                    .build();
            applyMaster(record, m);
            regulationMapper.insertRecord(record);
        } else {
            RegInfo before = requireRecord(m.getRegInfoId());
            // 덮어쓰기 전에 직전 버전 값을 그 버전 이력에 남긴다 (스냅샷 없이 이관된 이력 대비)
            fillSnapshot(before);
            record = before;
            applyMaster(record, m);
            if (record.getAttachGroupId() == null) {
                record.setAttachGroupId(fileGroupService.generateGroupId("REG"));
            }
            record.setUpdatedBy(userId);
            regulationMapper.updateRecordAsNewVersion(record);
            record = requireRecord(record.getRegInfoId());
        }

        Long regInfoId = record.getRegInfoId();
        replaceTargets(regInfoId, targets);
        Map<Long, Long> idMap = upsertItems(regInfoId, items);
        syncAttachments(record.getAttachGroupId(), nullSafe(req.getAttachFiles()));

        RegulationRequest.Changes changes = req.getChanges();
        List<Long> changedItemIds = isNew
                ? new ArrayList<>(idMap.values())
                : nullSafe(changes == null ? null : changes.getChangedItemIds()).stream()
                        .map(idMap::get).filter(Objects::nonNull).toList();

        regulationMapper.insertHistory(RegInfoHist.builder()
                .regInfoId(regInfoId)
                .versionNo(record.getVersionNo())
                .changeType(isNew ? "INSERT" : "UPDATE")
                .changeNote(!decisions.isEmpty()
                        ? "충돌 " + decisions.size() + "건 조치 후 저장"
                        : isNew ? "최초 등록" : "내용 수정")
                // 이 버전의 기본정보 값. 변경이력 카드를 누르면 폼에 겹쳐 비교한다
                .snapshotJson(snapshotOf(record))
                // '이 항목' 이력 필터용. 신규 항목은 저장하면서 id 가 바뀌므로 채번 결과로 옮겨 적는다
                .masterChangedYn(isNew || (changes != null && Boolean.TRUE.equals(changes.getMasterChanged())) ? "Y" : "N")
                .changedItemIds(toJson(changedItemIds))
                .regId(userId)
                .build());

        insertConflictHistories(decisions, null, record, userId);
        applyDecisionSideEffects(decisions, record, userId);

        return toRecord(record, targetsOf(regInfoId), countAttachments(record.getAttachGroupId()));
    }

    /* ============================================================ *
     * 폐지 — 물리 삭제 없이 EXPIRED + 새 버전
     * ============================================================ */

    @Transactional
    public RegulationResponse.Record expire(Long regInfoId, String userId) {
        RegInfo before = requireRecord(regInfoId);
        if ("EXPIRED".equals(before.getStatusCd())) {
            throw new BusinessException(ErrorCode.REGULATION_ALREADY_EXPIRED);
        }
        fillSnapshot(before);
        regulationMapper.expireRecord(regInfoId, userId);
        RegInfo after = requireRecord(regInfoId);

        regulationMapper.insertHistory(RegInfoHist.builder()
                .regInfoId(regInfoId)
                .versionNo(after.getVersionNo())
                .changeType("DELETE")
                .changeNote("사용자 요청으로 폐지")
                .snapshotJson(snapshotOf(after))
                .masterChangedYn("Y")
                .changedItemIds("[]")
                .regId(userId)
                .build());

        return toRecord(after, targetsOf(regInfoId), countAttachments(after.getAttachGroupId()));
    }

    /* ============================================================ *
     * 등록 취소 시 충돌 이력만 남김
     * ============================================================ */

    @Transactional
    public int saveConflictHistories(RegulationRequest.ConflictHistories req, String userId) {
        List<RegulationRequest.ConflictDecision> conflicts = nullSafe(req.getConflicts());
        String decisionCd = isBlank(req.getDecisionCd()) ? "CANCEL" : req.getDecisionCd();
        insertConflictHistories(conflicts, decisionCd, null, userId);
        return conflicts.size();
    }

    /* ============================================================ *
     * 내부 — 저장 단계
     * ============================================================ */

    private void applyMaster(RegInfo record, RegulationRequest.Master m) {
        record.setTitle(m.getTitle());
        record.setFieldCd(m.getFieldCd());
        record.setMarkNm(m.getMarkNm());
        record.setAuthority(m.getAuthority());
        record.setUrl(m.getUrl());
        record.setSummary(m.getSummary());
        record.setStatusCd(isBlank(m.getStatusCd()) ? "DRAFT" : m.getStatusCd());
        record.setEffectiveDt(parseDate(m.getEffectiveDt()));
    }

    /** 규제번호 REG-{연도}-{4자리}. 연도 행을 UPDATE 로 잠그고 올린다 */
    private String nextRegNo() {
        int year = LocalDate.now().getYear();
        if (regulationMapper.increaseRegNoSeq(year) == 0) {
            regulationMapper.insertRegNoSeq(year);
        }
        return String.format("REG-%d-%04d", year, regulationMapper.findRegNoSeq(year));
    }

    /** 적용 대상은 레코드 저장 단위라 전량 교체 */
    private void replaceTargets(Long regInfoId, List<RegulationRequest.Target> targets) {
        regulationMapper.deleteTargetsByRecord(regInfoId);
        List<RegInfoTarget> rows = targets.stream()
                .filter(t -> !isBlank(t.getTargetType()) && !isBlank(t.getTargetCd()))
                // 같은 대상이 두 번 오면 PK 위반이므로 걸러낸다
                .collect(Collectors.toMap(t -> t.getTargetType() + "|" + t.getTargetCd(), t -> t, (a, b) -> a, LinkedHashMap::new))
                .values().stream()
                .map(t -> RegInfoTarget.builder()
                        .regInfoId(regInfoId)
                        .targetType(t.getTargetType())
                        .targetCd(t.getTargetCd())
                        .levelNo(TARGET_LEVEL.getOrDefault(t.getTargetType(), 1))
                        .excludeYn("N")
                        .build())
                .toList();
        if (!rows.isEmpty()) {
            regulationMapper.insertTargets(rows);
        }
    }

    /**
     * 항목 upsert.
     * 목업은 전량 교체하지만 DB 에서 DELETE → INSERT 하면 id 가 새로 생겨
     * reg_info_hist.changed_item_ids 가 가리키던 항목이 사라진다. 그래서
     *   - 이 레코드의 기존 id  → UPDATE
     *   - 음수(화면 신규) id   → INSERT 후 생성키로 매핑
     *   - 목록에서 빠진 기존 id → DELETE (자식부터)
     * 신규 규격 밑의 신규 인증서처럼 부모도 신규일 수 있으므로 level 순으로 넣으며 parent 를 다시 매핑한다.
     *
     * @return 화면 id → 저장된 id
     */
    private Map<Long, Long> upsertItems(Long regInfoId, List<RegulationRequest.Item> items) {
        List<RegInfoItem> existing = regulationMapper.findItemsByRecord(regInfoId);
        Set<Long> existingIds = existing.stream().map(RegInfoItem::getItemId).collect(Collectors.toSet());
        Map<Long, Long> idMap = new LinkedHashMap<>();

        List<RegulationRequest.Item> ordered = items.stream()
                .sorted(Comparator.comparing((RegulationRequest.Item it) -> it.getLevelNo() == null ? 0 : it.getLevelNo()))
                .toList();

        for (RegulationRequest.Item it : ordered) {
            Long parentId = it.getParentItemId() == null ? null : idMap.get(it.getParentItemId());
            RegInfoItem row = RegInfoItem.builder()
                    .regInfoId(regInfoId)
                    .parentItemId(parentId)
                    .itemTypeCd(it.getItemTypeCd())
                    .itemCd(it.getItemCd())
                    .levelNo(it.getLevelNo())
                    .mandatoryYn(isBlank(it.getMandatoryYn()) ? "Y" : it.getMandatoryYn())
                    .remark(it.getRemark())
                    .sortOrder(it.getSortOrder() == null ? 0 : it.getSortOrder())
                    .build();

            boolean keep = it.getItemId() != null && it.getItemId() > 0 && existingIds.contains(it.getItemId());
            if (keep) {
                row.setItemId(it.getItemId());
                regulationMapper.updateItem(row);
            } else {
                regulationMapper.insertItem(row);
            }
            idMap.put(it.getItemId(), row.getItemId());
        }

        Set<Long> kept = new HashSet<>(idMap.values());
        existing.stream()
                .filter(e -> !kept.contains(e.getItemId()))
                .sorted(Comparator.comparing((RegInfoItem e) -> e.getLevelNo() == null ? 0 : e.getLevelNo()).reversed())
                .forEach(e -> regulationMapper.deleteItem(e.getItemId()));

        return idMap;
    }

    /**
     * 첨부: 화면 목록에 있는 실제 파일(files.id)만 그룹에 연결하고, 빠진 파일은 삭제 표시.
     * 화면 데모 버튼으로 추가한 'NEW-...' 항목은 업로드된 파일이 아니므로 무시한다.
     */
    private void syncAttachments(String fileGroupId, List<RegulationRequest.AttachFile> files) {
        List<Long> fileIds = files.stream()
                .map(RegulationRequest.AttachFile::getFileId)
                .filter(id -> id != null && id.matches("\\d+"))
                .map(Long::valueOf)
                .toList();
        if (!fileIds.isEmpty()) {
            regulationMapper.attachFilesToGroup(fileGroupId, fileIds);
        }
        regulationMapper.detachFilesNotIn(fileGroupId, fileIds);
    }

    private void insertConflictHistories(List<RegulationRequest.ConflictDecision> list, String forcedDecision,
                                         RegInfo saved, String userId) {
        LocalDateTime now = LocalDateTime.now();
        for (RegulationRequest.ConflictDecision c : list) {
            RegulationRequest.ExistRecord exist = c.getExistRecord();
            RegulationRequest.MainAxis axis = c.getMainAxis();
            if (exist == null || exist.getRegInfoId() == null) {
                continue;
            }
            String note = !isBlank(c.getDecisionNote()) ? c.getDecisionNote()
                    : c.getRecommend() != null ? c.getRecommend().getText() : null;

            regulationMapper.insertConflict(RegConflictHist.builder()
                    .newRegInfoId(saved == null ? null : saved.getRegInfoId())
                    .newRegNo(saved == null ? "(등록취소)" : saved.getRegNo())
                    .existRegInfoId(exist.getRegInfoId())
                    .existRegNo(exist.getRegNo())
                    .conflictType(c.getConflictType())
                    .conflictAxis(axis == null ? null : axis.getAxisKey())
                    .newScopeTxt(axis == null ? null : axis.getNewScopeTxt())
                    .existScopeTxt(axis == null ? null : axis.getExistScopeTxt())
                    .decisionCd(forcedDecision != null ? forcedDecision : c.getDecisionCd())
                    .decisionNote(note)
                    .detectDt(now)
                    .decideId(userId)
                    .decideDt(now)
                    .statusCd("CANCEL".equals(forcedDecision) ? "IGNORED" : "RESOLVED")
                    .build());
        }
    }

    /** 조치 코드에 따른 기존 레코드 후속 처리 */
    private void applyDecisionSideEffects(List<RegulationRequest.ConflictDecision> decisions, RegInfo saved, String userId) {
        for (RegulationRequest.ConflictDecision c : decisions) {
            if (c.getExistRecord() == null || c.getExistRecord().getRegInfoId() == null) {
                continue;
            }
            Long existId = c.getExistRecord().getRegInfoId();

            if ("MERGE".equals(c.getDecisionCd())) {
                RegInfo exist = regulationMapper.findRecordById(existId);
                if (exist == null) {
                    continue;
                }
                fillSnapshot(exist);
                regulationMapper.expireRecord(existId, userId);
                RegInfo merged = requireRecord(existId);
                regulationMapper.insertHistory(RegInfoHist.builder()
                        .regInfoId(existId)
                        .versionNo(merged.getVersionNo())
                        .changeType("CONFLICT_RESOLVE")
                        .changeNote(saved.getRegNo() + " 로 흡수되어 폐지 처리")
                        .snapshotJson(snapshotOf(merged))
                        .masterChangedYn("Y")
                        .changedItemIds("[]")
                        .regId(userId)
                        .build());
            } else if ("KEEP_BOTH".equals(c.getDecisionCd())) {
                RegInfo exist = regulationMapper.findRecordById(existId);
                if (exist == null) {
                    continue;
                }
                // 버전을 올리지 않는다 → 같은 버전 이력이 한 줄 더 생긴다
                regulationMapper.insertHistory(RegInfoHist.builder()
                        .regInfoId(existId)
                        .versionNo(exist.getVersionNo())
                        .changeType("CONFLICT_RESOLVE")
                        .changeNote(saved.getRegNo() + " 등록에 따라 하위 예외(특례)로 유지")
                        .regId(userId)
                        .build());
            }
        }
    }

    /* ============================================================ *
     * 내부 — 스냅샷 / 변환
     * ============================================================ */

    private void fillSnapshot(RegInfo record) {
        regulationMapper.fillSnapshotIfEmpty(record.getRegInfoId(), record.getVersionNo(), snapshotOf(record));
    }

    /**
     * 변경이력 비교용 스냅샷 = 그 버전의 기본정보 값.
     * 편집 폼(master)과 같은 모양으로 남겨야 폼 옆에 그대로 겹쳐 비교할 수 있다.
     */
    private String snapshotOf(RegInfo record) {
        List<RegInfoTarget> targets = regulationMapper.findTargetsByRecord(record.getRegInfoId());
        Map<String, Object> snap = new LinkedHashMap<>();
        snap.put("title", record.getTitle());
        snap.put("fieldCd", record.getFieldCd());
        snap.put("markNm", nvl(record.getMarkNm()));
        snap.put("authority", nvl(record.getAuthority()));
        snap.put("url", nvl(record.getUrl()));
        snap.put("summary", nvl(record.getSummary()));
        snap.put("statusCd", record.getStatusCd());
        snap.put("effectiveDt", record.getEffectiveDt() == null ? "" : record.getEffectiveDt().toString());
        snap.put("divisionCds", codesOf(targets, "DIVISION"));
        snap.put("productGroupCds", codesOf(targets, "PRODUCT_GROUP"));
        snap.put("productCds", codesOf(targets, "PRODUCT"));
        snap.put("regionCds", codesOf(targets, "REGION"));
        snap.put("countryCds", codesOf(targets, "COUNTRY"));
        return toJson(snap);
    }

    private List<String> codesOf(List<RegInfoTarget> targets, String type) {
        return targets.stream().filter(t -> type.equals(t.getTargetType())).map(RegInfoTarget::getTargetCd).toList();
    }

    private List<RegulationResponse.Target> targetsOf(Long regInfoId) {
        return regulationMapper.findTargetsByRecord(regInfoId).stream().map(this::toTarget).toList();
    }

    private int countAttachments(String fileGroupId) {
        return fileGroupId == null ? 0 : regulationMapper.countFilesInGroup(fileGroupId);
    }

    private RegInfo requireRecord(Long regInfoId) {
        RegInfo record = regulationMapper.findRecordById(regInfoId);
        if (record == null) {
            throw new BusinessException(ErrorCode.REGULATION_NOT_FOUND);
        }
        return record;
    }

    private RegulationResponse.Record toRecord(RegInfo r, List<RegulationResponse.Target> targets, int attachCnt) {
        return RegulationResponse.Record.builder()
                .regInfoId(r.getRegInfoId())
                .regNo(r.getRegNo())
                .title(r.getTitle())
                .fieldCd(r.getFieldCd())
                .markNm(r.getMarkNm())
                .authority(r.getAuthority())
                .url(r.getUrl())
                .summary(r.getSummary())
                .statusCd(r.getStatusCd())
                .versionNo(r.getVersionNo())
                .effectiveDt(r.getEffectiveDt())
                .modDt(r.getUpdatedAt() != null ? r.getUpdatedAt() : r.getCreatedAt())
                .modId(r.getUpdatedBy() != null ? r.getUpdatedBy() : r.getCreatedBy())
                .attachCnt(attachCnt)
                .targets(targets)
                .build();
    }

    private RegulationResponse.Target toTarget(RegInfoTarget t) {
        return new RegulationResponse.Target(t.getTargetType(), t.getTargetCd());
    }

    private RegulationResponse.Attach toAttach(RegAttachFile f) {
        return new RegulationResponse.Attach(String.valueOf(f.getFileId()), f.getOriginalName(), formatSize(f.getFileSize()));
    }

    private RegulationResponse.History toHistory(RegInfoHist h) {
        return RegulationResponse.History.builder()
                .histId(h.getHistId())
                .regInfoId(h.getRegInfoId())
                .versionNo(h.getVersionNo())
                .changeType(h.getChangeType())
                .changeNote(h.getChangeNote())
                .regId(h.getRegId())
                .regDt(h.getRegDt())
                .snapshotJson(h.getSnapshotJson())
                .masterChanged(h.getMasterChangedYn() == null ? null : "Y".equals(h.getMasterChangedYn()))
                .changedItemIds(h.getChangedItemIds() == null ? null : fromJsonIds(h.getChangedItemIds()))
                .build();
    }

    private RegulationResponse.Conflict toConflict(RegConflictHist c) {
        return RegulationResponse.Conflict.builder()
                .conflictId(c.getConflictId())
                .newRegNo(c.getNewRegNo())
                .newRegInfoId(c.getNewRegInfoId())
                .existRegNo(c.getExistRegNo())
                .existRegInfoId(c.getExistRegInfoId())
                .conflictType(c.getConflictType())
                .conflictAxis(c.getConflictAxis())
                .newScopeTxt(c.getNewScopeTxt())
                .existScopeTxt(c.getExistScopeTxt())
                .decisionCd(c.getDecisionCd())
                .decisionNote(c.getDecisionNote())
                .detectDt(c.getDetectDt())
                .decideId(c.getDecideId())
                .decideDt(c.getDecideDt())
                .statusCd(c.getStatusCd())
                .build();
    }

    /* ============================================================ *
     * 내부 — 유틸
     * ============================================================ */

    /** 화면이 보내는 'yyyy-MM-dd' 또는 ISO 일시에서 앞 10자리만 쓴다(목업 dateOnly 와 동일) */
    private LocalDate parseDate(String v) {
        if (isBlank(v) || v.length() < 10) {
            return null;
        }
        return LocalDate.parse(v.substring(0, 10));
    }

    private String formatSize(Long bytes) {
        if (bytes == null) {
            return "";
        }
        if (bytes >= 1024L * 1024L) {
            return String.format("%.1fMB", bytes / (1024.0 * 1024.0));
        }
        return Math.round(bytes / 1024.0) + "KB";
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("JSON 직렬화 실패", e);
        }
    }

    private List<Long> fromJsonIds(String json) {
        try {
            return objectMapper.readValue(json, new TypeReference<List<Long>>() { });
        } catch (JsonProcessingException e) {
            return List.of();
        }
    }

    private static <T> List<T> nullSafe(List<T> list) {
        return list == null ? List.of() : list;
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }

    private static String nvl(String s) {
        return s == null ? "" : s;
    }
}
