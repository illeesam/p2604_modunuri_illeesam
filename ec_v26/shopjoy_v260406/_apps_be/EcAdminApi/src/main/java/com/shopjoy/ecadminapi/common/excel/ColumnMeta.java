package com.shopjoy.ecadminapi.common.excel;

/**
 * 엑셀 export/upload 의 한 컬럼 메타정보.
 *
 * <p>3행 헤더 구조에서:
 * <ul>
 *   <li>Row 2 (사람용 라벨): {@link #label()} — key 면 "이름(key)" 형식</li>
 *   <li>Row 3 (시스템 매핑용): {@link #fieldName()} — key 면 "fieldName(key)" 형식</li>
 * </ul>
 *
 * @param fieldName     Entity/Dto 의 필드명 (camelCase). 업로드 시 Map 키로 사용.
 * @param dbColumnName  DB 컬럼명 (snake_case). 디버깅/스키마 추적용. 없으면 빈 문자열.
 * @param label         한글 라벨 (Entity {@code @Comment} 에서 마커 제거된 깨끗한 텍스트).
 * @param comment       상세 설명 (없으면 label 과 동일).
 * @param codeGrp       공통코드 그룹코드 (예: "USER_STATUS"). {@code @Comment("...(gcd: USER_STATUS)")} 마커에서 추출. 없으면 빈 문자열.
 * @param isKey         PK/upsert 키 컬럼 여부. true 면 헤더에 (key) 마커 표시.
 * @param readOnly      업로드 시 무시할 컬럼 (예: regDate, updDate 등 시스템 컬럼).
 */
public record ColumnMeta(
    String fieldName,
    String dbColumnName,
    String label,
    String comment,
    String codeGrp,
    boolean isKey,
    boolean readOnly
) {

    /** 일반 컬럼 (DB 컬럼명/코드그룹 미지정) */
    public static ColumnMeta of(String fieldName, String label) {
        return new ColumnMeta(fieldName, "", label, label, "", false, false);
    }

    /** key 컬럼 (DB 컬럼명/코드그룹 미지정) */
    public static ColumnMeta key(String fieldName, String label) {
        return new ColumnMeta(fieldName, "", label, label, "", true, false);
    }

    /** readOnly 컬럼 — export 만, upload 무시 */
    public static ColumnMeta readOnly(String fieldName, String label) {
        return new ColumnMeta(fieldName, "", label, label, "", false, true);
    }

    /** Row 2 표시 — "역할명" 또는 "사용자ID(key)" — 사람용 라벨이므로 codeGrp 마커는 노출하지 않음 */
    public String labelWithKey() {
        return isKey ? label + "(key)" : label;
    }

    /**
     * Row 3 표시 — 시스템 매핑용. key/codeGrp 마커 모두 포함.
     * 예: "userId(key)", "userStatusCd(gcd:USER_STATUS)", "roleId(key)(gcd:ROLE_TYPE)"
     */
    public String fieldNameWithKey() {
        StringBuilder sb = new StringBuilder(fieldName);
        if (isKey) sb.append("(key)");
        if (hasCodeGrp()) sb.append("(gcd:").append(codeGrp).append(")");
        return sb.toString();
    }

    /** 코드그룹 여부 */
    public boolean hasCodeGrp() {
        return codeGrp != null && !codeGrp.isBlank();
    }
}
