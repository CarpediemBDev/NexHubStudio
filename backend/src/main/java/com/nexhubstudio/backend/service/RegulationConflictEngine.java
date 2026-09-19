package com.nexhubstudio.backend.service;

import com.nexhubstudio.backend.domain.RegCode;
import com.nexhubstudio.backend.domain.RegInfo;
import com.nexhubstudio.backend.domain.RegInfoItem;
import com.nexhubstudio.backend.domain.RegInfoTarget;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * 규격/규제 정보 - 충돌(포함관계) 판정 엔진
 *
 * 프론트 src/utils/regulationConflict.js 를 그대로 옮긴 것이다.
 * 화면은 입력하는 동안 미리 보여주려고 같은 판정을 하지만, 저장되는 값의 권위는 여기에 있다 —
 * 화면이 준 conflictType 을 그대로 믿으면 API 를 직접 부르거나 다른 화면이 생겼을 때
 * 충돌을 없는 셈 칠 수 있다.
 *
 * 핵심 아이디어 (원본 주석 그대로)
 *  - 타겟은 계층을 가진다.  권역 &gt; 국가,  사업부 &gt; 제품군 &gt; 제품,  규제 &gt; 규격 &gt; 인증서
 *  - 계층이 다른 값을 그대로 비교할 수 없으므로 "최하위 단위(leaf)의 집합"으로 전개해서 비교한다.
 *      유럽            -&gt; {FR, DE, IT, ES, PL}
 *      유럽 &gt; 프랑스   -&gt; {FR}
 *    =&gt; 신규(유럽) ⊃ 기존(프랑스)  =&gt; 신규가 상위 =&gt; PARENT
 *  - 축(axis)은 3개(GEO / ORG / RULE). 축별 판정을 합쳐 최종 유형을 만든다.
 *  - 판정 방향은 항상 "신규 레코드 기준"이다. PARENT = 신규가 기존의 상위.
 *
 * 계층 데이터는 common_code 에서 온다(RegulationService.getCodes).
 * 프론트가 코드표를 들고 있던 시절에는 이 판정을 서버에서 할 수 없었다.
 */
public final class RegulationConflictEngine {

    /**
     * 축 정의: 상위 타입 → 하위 타입 순서. 마지막 타입이 leaf.
     * GEO / ORG 는 적용대상(reg_info_target), RULE 은 정보관리항목(reg_info_item)에서 읽는다.
     */
    public enum Axis {
        GEO("지역", Source.TARGET, List.of("REGION", "COUNTRY")),
        ORG("제품", Source.TARGET, List.of("DIVISION", "PRODUCT_GROUP", "PRODUCT")),
        RULE("규제/규격/인증서", Source.ITEM, List.of("REGULATION", "STANDARD", "CERT"));

        public enum Source { TARGET, ITEM }

        private final String axisName;
        private final Source source;
        private final List<String> types;

        Axis(String axisName, Source source, List<String> types) {
            this.axisName = axisName;
            this.source = source;
            this.types = types;
        }

        public String axisName() {
            return axisName;
        }

        public List<String> types() {
            return types;
        }

        String leafType() {
            return types.get(types.size() - 1);
        }
    }

    /** 두 집합의 관계 */
    public enum Relation {
        EQUAL, SUPERSET, SUBSET, OVERLAP, DISJOINT
    }

    /** 충돌 유형. 심각도 순서이기도 하다(동일범위가 가장 심각) */
    public enum ConflictType {
        SAME, CHILD, PARENT, OVERLAP
    }

    /** 한 축의 판정 결과 */
    public record AxisDetail(String axisKey, String axisName, Relation relation,
                             String newScopeTxt, String existScopeTxt) {
    }

    /** 기존 레코드 1건과의 충돌 */
    public record Conflict(RegInfo existRecord, ConflictType conflictType,
                           List<AxisDetail> axisDetails, AxisDetail mainAxis,
                           String recommendDecisionCd, String recommendText) {
    }

    /** 판정에 필요한 만큼의 레코드. 적용대상과 항목을 함께 들고 있어야 축을 읽을 수 있다 */
    public record Scoped(RegInfo record, List<RegInfoTarget> targets, List<RegInfoItem> items) {
    }

    private static final Map<ConflictType, String[]> RECOMMEND = Map.of(
            ConflictType.SAME, new String[]{"REPLACE",
                    "동일 범위 중복입니다. 신규 등록 대신 기존 레코드를 개정(새 버전)하세요."},
            ConflictType.PARENT, new String[]{"KEEP_BOTH",
                    "신규가 기존을 포함합니다. 기존 레코드를 하위 예외(특례)로 유지하거나, 신규 범위에서 제외하세요."},
            ConflictType.CHILD, new String[]{"KEEP_BOTH",
                    "기존이 신규를 포함합니다. 신규를 기존의 하위 예외(특례)로 등록하세요."},
            ConflictType.OVERLAP, new String[]{"EXCLUDE",
                    "범위가 부분적으로 겹칩니다. 겹치는 대상을 어느 한쪽에서 제외해 경계를 명확히 하세요."});

    /** groupCode -> 그 축의 코드들. 계층을 내려갈 때(전개) 쓴다 */
    private final Map<String, List<RegCode>> codesByGroup;
    /** groupCode -> code -> 이름. 판정 한 번에 이름을 수십 번 찾으므로 미리 접어 둔다 */
    private final Map<String, Map<String, String>> nameIndex;

    public RegulationConflictEngine(Map<String, List<RegCode>> codesByGroup) {
        this.codesByGroup = codesByGroup;
        Map<String, Map<String, String>> idx = new LinkedHashMap<>();
        codesByGroup.forEach((group, list) -> {
            Map<String, String> m = new LinkedHashMap<>();
            list.forEach(rc -> m.put(rc.getCode(), rc.getName()));
            idx.put(group, m);
        });
        this.nameIndex = idx;
    }

    /**
     * 신규 레코드 1건 vs 기존 목록 → 충돌 목록.
     * @param newOne   저장하려는 레코드 (적용대상·항목 포함)
     * @param existing 이미 등록된 레코드들
     */
    public List<Conflict> detect(Scoped newOne, List<Scoped> existing) {
        List<Conflict> result = new ArrayList<>();

        for (Scoped exist : existing) {
            if (exist.record().getRegInfoId() != null
                    && exist.record().getRegInfoId().equals(newOne.record().getRegInfoId())) {
                continue; // 자기 자신
            }
            if ("EXPIRED".equals(exist.record().getStatusCd())) {
                continue; // 폐지 레코드는 비교 제외
            }
            if (!java.util.Objects.equals(exist.record().getFieldCd(), newOne.record().getFieldCd())) {
                continue; // 분야가 다르면 충돌 아님
            }

            List<AxisDetail> axisDetails = new ArrayList<>();
            List<Relation> relations = new ArrayList<>();
            boolean disjoint = false;

            for (Axis axis : Axis.values()) {
                Relation rel = relate(leafScope(newOne, axis), leafScope(exist, axis));
                if (rel == Relation.DISJOINT) {
                    disjoint = true;
                }
                relations.add(rel);
                axisDetails.add(new AxisDetail(axis.name(), axis.axisName(), rel,
                        scopeText(newOne, axis), scopeText(exist, axis)));
            }

            if (disjoint) {
                continue; // 한 축이라도 완전히 다르면 충돌 아님
            }

            ConflictType type;
            if (relations.stream().allMatch(r -> r == Relation.EQUAL)) {
                type = ConflictType.SAME;
            } else if (relations.stream().allMatch(r -> r == Relation.EQUAL || r == Relation.SUPERSET)) {
                type = ConflictType.PARENT;
            } else if (relations.stream().allMatch(r -> r == Relation.EQUAL || r == Relation.SUBSET)) {
                type = ConflictType.CHILD;
            } else {
                type = ConflictType.OVERLAP;
            }

            // 충돌을 만든 대표 축(EQUAL 이 아닌 첫 축)
            AxisDetail main = axisDetails.stream()
                    .filter(d -> d.relation() != Relation.EQUAL)
                    .findFirst()
                    .orElse(axisDetails.get(0));

            String[] rec = RECOMMEND.get(type);
            result.add(new Conflict(exist.record(), type, axisDetails, main, rec[0], rec[1]));
        }

        // 심각도 순: 동일범위 > 신규가 하위 > 신규가 상위 > 부분중복
        result.sort(Comparator.comparingInt(c -> c.conflictType().ordinal()));
        return result;
    }

    /* ---------------- 축 읽기 ---------------- */

    /** 축의 source 에 따라 적용대상 / 항목 중 맞는 쪽에서 코드를 읽는다 */
    private List<String> axisCodes(Scoped s, Axis axis, String type) {
        if (axis.source == Axis.Source.ITEM) {
            return s.items().stream()
                    .filter(it -> type.equals(it.getItemTypeCd()) && it.getItemCd() != null)
                    .map(RegInfoItem::getItemCd)
                    .toList();
        }
        return s.targets().stream()
                .filter(t -> type.equals(t.getTargetType()))
                .map(RegInfoTarget::getTargetCd)
                .toList();
    }

    /**
     * 레코드의 축별 leaf 집합.
     * 하위 타입이 선택돼 있으면 그것이 우선(더 좁은 범위),
     * 없으면 상위 타입을 전개, 둘 다 없으면 null(= 전체/무제한)을 뜻한다.
     */
    private Set<String> leafScope(Scoped s, Axis axis) {
        List<String> leafSelected = axisCodes(s, axis, axis.leafType());
        if (!leafSelected.isEmpty()) {
            return new LinkedHashSet<>(leafSelected);
        }
        for (int i = axis.types.size() - 2; i >= 0; i--) {
            String type = axis.types.get(i);
            List<String> codes = axisCodes(s, axis, type);
            if (!codes.isEmpty()) {
                Set<String> set = new LinkedHashSet<>();
                for (String code : codes) {
                    set.addAll(expandToLeaf(axis, type, code));
                }
                return set;
            }
        }
        return null; // 선택 없음 = 전체
    }

    /** 상위 코드 하나를 leaf 코드 집합으로 전개 */
    private List<String> expandToLeaf(Axis axis, String targetType, String code) {
        if (targetType.equals(axis.leafType())) {
            return List.of(code);
        }
        int idx = axis.types.indexOf(targetType);
        List<String> current = List.of(code);
        for (int i = idx + 1; i < axis.types.size(); i++) {
            String childType = axis.types.get(i);
            List<String> parents = current;
            current = codesByGroup.getOrDefault(childType, List.of()).stream()
                    .filter(rc -> rc.getParentCode() != null && parents.contains(rc.getParentCode()))
                    .map(RegCode::getCode)
                    .toList();
            if (current.isEmpty()) {
                return List.of();
            }
        }
        return current;
    }

    /** 두 집합의 관계. null = 전체 범위 */
    private Relation relate(Set<String> a, Set<String> b) {
        if (a == null && b == null) return Relation.EQUAL;
        if (a == null) return Relation.SUPERSET; // 신규가 전체
        if (b == null) return Relation.SUBSET;   // 기존이 전체

        long inter = a.stream().filter(b::contains).count();
        if (inter == 0) return Relation.DISJOINT;
        boolean aSubB = a.size() == inter;
        boolean bSubA = b.size() == inter;
        if (aSubB && bSubA) return Relation.EQUAL;
        if (bSubA) return Relation.SUPERSET; // 신규 ⊃ 기존
        if (aSubB) return Relation.SUBSET;   // 신규 ⊂ 기존
        return Relation.OVERLAP;
    }

    /** 레코드의 축 범위를 사람이 읽는 문자열로 */
    private String scopeText(Scoped s, Axis axis) {
        List<String> parts = new ArrayList<>();
        for (String type : axis.types) {
            List<String> names = axisCodes(s, axis, type).stream()
                    .map(cd -> codeName(type, cd))
                    .toList();
            if (!names.isEmpty()) {
                parts.add(String.join(", ", names));
            }
        }
        return parts.isEmpty() ? "전체" : String.join(" > ", parts);
    }

    /** 코드 → 이름. 코드표에 없으면 코드를 그대로 보여준다(원본과 같은 폴백) */
    private String codeName(String groupCode, String code) {
        return nameIndex.getOrDefault(groupCode, Map.of()).getOrDefault(code, code);
    }
}
