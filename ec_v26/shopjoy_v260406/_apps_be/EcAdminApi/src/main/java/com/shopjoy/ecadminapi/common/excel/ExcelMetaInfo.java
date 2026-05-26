package com.shopjoy.ecadminapi.common.excel;

import java.util.List;

/**
 * 엑셀 export/upload 의 테이블 메타정보.
 *
 * <p>3행 헤더 구조:
 * <ul>
 *   <li>Row 1: {@link #tableLabel} | {@link #tableComment} (병합 셀)</li>
 *   <li>Row 2: 각 컬럼의 {@code labelWithKey()} — 사람용 한글</li>
 *   <li>Row 3: 각 컬럼의 {@code fieldNameWithKey()} — 시스템 매핑용</li>
 *   <li>Row 4~: 실제 데이터</li>
 * </ul>
 *
 * @param tableLabel    화면명/영역명 (예: "역할목록")
 * @param tableComment  설명 (예: "사용자 역할(권한) 마스터")
 * @param keyField      key 컬럼의 fieldName (upsert 시 사용)
 * @param columns       컬럼 메타 리스트 (export 순서대로)
 */
public record ExcelMetaInfo(
    String tableLabel,
    String tableComment,
    String keyField,
    List<ColumnMeta> columns
) {

    /** key 컬럼 메타 반환 (없으면 null) */
    public ColumnMeta keyColumn() {
        return columns.stream().filter(ColumnMeta::isKey).findFirst().orElse(null);
    }

    /** 업로드 대상 컬럼만 (readOnly 제외) */
    public List<ColumnMeta> uploadableColumns() {
        return columns.stream().filter(c -> !c.readOnly()).toList();
    }
}
