package com.nexhubstudio.backend.mapper;

import com.nexhubstudio.backend.domain.RegAttachFile;
import com.nexhubstudio.backend.domain.RegConflictHist;
import com.nexhubstudio.backend.domain.RegExpandRow;
import com.nexhubstudio.backend.domain.RegInfo;
import com.nexhubstudio.backend.domain.RegInfoHist;
import com.nexhubstudio.backend.domain.RegInfoItem;
import com.nexhubstudio.backend.domain.RegInfoTarget;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface RegulationMapper {

    /* ---------------- 스냅샷 조회 ---------------- */
    List<RegInfo> findAllRecords();

    List<RegInfoTarget> findAllTargets();

    List<RegInfoItem> findAllItems();

    List<RegInfoHist> findAllHistories();

    List<RegConflictHist> findAllConflicts();

    List<RegAttachFile> findAllAttachments();

    /* ---------------- 전개(행→열) ---------------- */
    /**
     * 레코드 × 규제 × 규격 × 관리항목 × 제품 조합을 한 행씩.
     * regInfoIds 가 비어 있으면 전체.
     */
    List<RegExpandRow> findExpandedRows(@Param("regInfoIds") List<Long> regInfoIds);

    /* ---------------- 레코드 ---------------- */
    RegInfo findRecordById(Long regInfoId);

    int insertRecord(RegInfo record);

    /** 기본정보 갱신 + version_no 1 증가 */
    int updateRecordAsNewVersion(RegInfo record);

    /** 상태만 EXPIRED 로 + version_no 1 증가 */
    int expireRecord(@Param("regInfoId") Long regInfoId, @Param("userId") String userId);

    /** 상태만 ACTIVE 로 + version_no 1 증가 (확정) */
    int activateRecord(@Param("regInfoId") Long regInfoId, @Param("userId") String userId);

    /** 확정을 막는 미조치 동일범위(SAME) 충돌 건수 */
    int countUnresolvedSameConflicts(Long regInfoId);

    /* ---------------- 적용 대상 ---------------- */
    List<RegInfoTarget> findTargetsByRecord(Long regInfoId);

    int deleteTargetsByRecord(Long regInfoId);

    int insertTargets(@Param("targets") List<RegInfoTarget> targets);

    /* ---------------- 정보관리항목 ---------------- */
    List<RegInfoItem> findItemsByRecord(Long regInfoId);

    int insertItem(RegInfoItem item);

    int updateItem(RegInfoItem item);

    int deleteItem(Long itemId);

    /* ---------------- 이력 ---------------- */
    int insertHistory(RegInfoHist hist);

    /** 해당 버전의 첫 이력에 스냅샷이 비어 있으면 채운다 */
    int fillSnapshotIfEmpty(@Param("regInfoId") Long regInfoId,
                            @Param("versionNo") Integer versionNo,
                            @Param("snapshotJson") String snapshotJson);

    int insertConflict(RegConflictHist conflict);

    /* ---------------- 규제번호 채번 ---------------- */
    /** 연도 행을 잠그며 1 증가. 반환 0 이면 그 해 첫 번호 */
    int increaseRegNoSeq(int seqYear);

    int insertRegNoSeq(int seqYear);

    Integer findRegNoSeq(int seqYear);

    /* ---------------- 첨부 연계 (files) ---------------- */
    int countFilesInGroup(String fileGroupId);

    int attachFilesToGroup(@Param("fileGroupId") String fileGroupId, @Param("fileIds") List<Long> fileIds);

    /** 그룹에 남아 있지만 화면 목록에서 빠진 파일을 삭제 표시 */
    int detachFilesNotIn(@Param("fileGroupId") String fileGroupId, @Param("fileIds") List<Long> fileIds);
}
