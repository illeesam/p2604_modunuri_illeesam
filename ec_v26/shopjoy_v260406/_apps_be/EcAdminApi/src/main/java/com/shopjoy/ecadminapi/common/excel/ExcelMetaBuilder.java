package com.shopjoy.ecadminapi.common.excel;

import jakarta.persistence.Column;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import org.hibernate.annotations.Comment;

import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Entity 의 JPA + Hibernate 어노테이션을 읽어 {@link ExcelMetaInfo} 를 빌드한다.
 *
 * <p><b>자동 추출 규칙</b>:
 * <ul>
 *   <li>{@code @Table(name="sy_user")} → tableLabel = "sy_user" (호출자가 override 가능)</li>
 *   <li>클래스 레벨 {@code @Comment("관리자 사용자")} → tableComment</li>
 *   <li>필드 {@code @Comment("사용자ID ...")} → ColumnMeta.label (우선)</li>
 *   <li>필드 {@code @Column(name="user_id")} → ColumnMeta.dbColumnName</li>
 *   <li>{@code @Id} → isKey=true</li>
 *   <li>{@code @Transient} 또는 시스템 필드(regBy/regDate/updBy/updDate) → 제외 또는 readOnly</li>
 * </ul>
 *
 * <p><b>사용 예</b>:
 * <pre>
 *   // 1. 가장 단순 — 모든 정보 Entity 에서 자동 추출
 *   ExcelMetaInfo meta = ExcelMetaBuilder.fromEntity(SyUser.class, SyUserDto.Item.class);
 *
 *   // 2. tableLabel 만 override (한글로 표시하고 싶을 때)
 *   ExcelMetaInfo meta = ExcelMetaBuilder.fromEntity(SyUser.class, SyUserDto.Item.class,
 *       "사용자목록", null);  // null 이면 클래스 @Comment 사용
 *
 *   // 3. 완전 수동 (legacy)
 *   ExcelMetaInfo meta = ExcelMetaBuilder.fromEntity("역할목록", "설명", SyRole.class);
 * </pre>
 */
public final class ExcelMetaBuilder {

    private ExcelMetaBuilder() {}

    /** 업로드/저장 시 시스템이 자동 설정하는 필드 — 사용자 입력 무시 */
    private static final Set<String> SYSTEM_FIELDS = new HashSet<>(Arrays.asList(
        "regBy", "regDate", "updBy", "updDate"
    ));

    /**
     * {@code @Comment("...(코드: USER_STATUS)")} 안의 공통코드 그룹 마커 패턴.
     * <p>기존 Entity 컨벤션({@code (코드: XXX)})을 그대로 인식.
     *   - 한글 "코드" 또는 영문 "code" / "gcd" 모두 허용
     *   - 대소문자/공백 변형 허용
     *   - 그룹명은 영문 대문자/숫자/언더스코어만
     * <p>예: "(코드: USER_STATUS)", "(코드:ROLE_TYPE)", "(code: USE_YN)", "(gcd: AUTH_METHOD)"
     * <p>설명이 뒤따라오는 경우도 매칭: "(코드: ROLE_TYPE — SYSTEM/CUSTOM)" → "ROLE_TYPE" 추출
     */
    private static final Pattern CODE_GRP_MARKER = Pattern.compile(
        "\\(\\s*(?:코드|code|gcd)\\s*[:：]\\s*([A-Za-z][A-Za-z0-9_]*)\\b[^)]*\\)",
        Pattern.CASE_INSENSITIVE
    );

    /** 마커 추출 결과 — 라벨에서 마커 제거된 깨끗한 텍스트 + 추출된 codeGrp */
    private record LabelParse(String cleanLabel, String codeGrp) {}

    /** "역할유형 (gcd: ROLE_TYPE)" → LabelParse("역할유형", "ROLE_TYPE") */
    private static LabelParse parseLabel(String raw) {
        if (raw == null || raw.isBlank()) return new LabelParse(raw, "");
        Matcher m = CODE_GRP_MARKER.matcher(raw);
        if (!m.find()) return new LabelParse(raw.trim(), "");
        String grp = m.group(1).toUpperCase();
        // 마커 제거 + 양쪽 공백 정리
        String clean = m.replaceAll("").replaceAll("\\s+", " ").trim();
        return new LabelParse(clean, grp);
    }

    // ════════════════════════════════════════════════════════════════════════════════════════
    //  Entity 단독 — tableLabel/comment 까지 자동 추출 (가장 단순한 사용법)
    // ════════════════════════════════════════════════════════════════════════════════════════

    /**
     * Entity 만 받아 모든 메타 정보 자동 추출.
     * <ul>
     *   <li>tableLabel = {@code @Table(name)} 또는 클래스명</li>
     *   <li>tableComment = 클래스 레벨 {@code @Comment("...")}</li>
     * </ul>
     */
    public static ExcelMetaInfo fromEntity(Class<?> entityClass, String... extraExcludes) {
        return fromEntity(null, null, entityClass, extraExcludes);
    }

    /**
     * Entity + DTO 교집합. tableLabel/comment 는 Entity 에서 자동 추출.
     * <p>JOIN 으로 만들어진 Dto-only 필드 + Entity 의 보안 필드 모두 자동 제외.
     */
    public static ExcelMetaInfo fromEntity(Class<?> entityClass, Class<?> dtoClass, String... extraExcludes) {
        return fromEntityIntersectDto(null, null, entityClass, dtoClass, extraExcludes);
    }

    // ════════════════════════════════════════════════════════════════════════════════════════
    //  Entity + 명시적 라벨 (table 명/설명을 한글로 override 하고 싶을 때)
    // ════════════════════════════════════════════════════════════════════════════════════════

    /**
     * Entity 클래스로부터 메타 정보 빌드. 라벨/설명은 인자로 override 가능 (null 이면 자동 추출).
     *
     * @param tableLabel    화면 표시명. null/blank 이면 {@code @Table(name)} 또는 클래스명 사용
     * @param tableComment  화면 설명. null/blank 이면 클래스 레벨 {@code @Comment} 사용
     * @param entityClass   JPA Entity 클래스
     * @param extraExcludes 추가로 제외할 필드명 (loginPwdHash 등 보안 필드)
     */
    public static ExcelMetaInfo fromEntity(
            String tableLabel,
            String tableComment,
            Class<?> entityClass,
            String... extraExcludes
    ) {
        Set<String> excludes = new HashSet<>(Arrays.asList(extraExcludes));
        List<ColumnMeta> columns = new ArrayList<>();
        String keyField = null;

        // 상속 체인 따라 필드 수집
        List<Field> allFields = new ArrayList<>();
        Class<?> c = entityClass;
        while (c != null && c != Object.class) {
            for (Field f : c.getDeclaredFields()) allFields.add(f);
            c = c.getSuperclass();
        }

        for (Field f : allFields) {
            if (java.lang.reflect.Modifier.isStatic(f.getModifiers())) continue;
            if (f.isAnnotationPresent(Transient.class)) continue;
            if (excludes.contains(f.getName())) continue;

            String fieldName = f.getName();
            boolean isKey = f.isAnnotationPresent(Id.class);
            boolean readOnly = SYSTEM_FIELDS.contains(fieldName);

            // DB 컬럼명 추출
            String dbColumnName = "";
            Column col = f.getAnnotation(Column.class);
            if (col != null && col.name() != null && !col.name().isBlank()) {
                dbColumnName = col.name();
            }

            // 라벨 추출: Hibernate @Comment 사용 (JPA 표준 @Column 에는 comment() 메서드가 없음).
            // 본 프로젝트는 모든 컬럼에 @Comment 를 적용하는 컨벤션이라 fallback 불필요.
            String rawLabel = fieldName;
            Comment hcomment = f.getAnnotation(Comment.class);
            if (hcomment != null && hcomment.value() != null && !hcomment.value().isBlank()) {
                rawLabel = hcomment.value();
            }

            // "(gcd: XXX)" 마커가 있으면 코드그룹 추출 + 라벨에서 제거
            LabelParse parsed = parseLabel(rawLabel);

            ColumnMeta meta = new ColumnMeta(fieldName, dbColumnName,
                parsed.cleanLabel(), rawLabel, parsed.codeGrp(), isKey, readOnly);
            columns.add(meta);
            if (isKey) keyField = fieldName;
        }

        // tableLabel / tableComment 자동 추출 (인자가 null/blank 인 경우)
        String resolvedLabel = (tableLabel != null && !tableLabel.isBlank())
            ? tableLabel : resolveTableLabel(entityClass);
        String resolvedComment = (tableComment != null && !tableComment.isBlank())
            ? tableComment : resolveTableComment(entityClass);

        return new ExcelMetaInfo(resolvedLabel, resolvedComment, keyField, columns);
    }

    /**
     * Entity + Dto.Item 의 필드 교집합으로 메타 정보 빌드. tableLabel/comment override 가능.
     */
    public static ExcelMetaInfo fromEntityIntersectDto(
            String tableLabel,
            String tableComment,
            Class<?> entityClass,
            Class<?> dtoClass,
            String... extraExcludes
    ) {
        Set<String> dtoFields = new HashSet<>();
        for (Field f : dtoClass.getDeclaredFields()) {
            if (java.lang.reflect.Modifier.isStatic(f.getModifiers())) continue;
            dtoFields.add(f.getName());
        }

        ExcelMetaInfo base = fromEntity(tableLabel, tableComment, entityClass, extraExcludes);
        List<ColumnMeta> filtered = base.columns().stream()
            .filter(c -> dtoFields.contains(c.fieldName()))
            .toList();
        return new ExcelMetaInfo(base.tableLabel(), base.tableComment(), base.keyField(), filtered);
    }

    // ════════════════════════════════════════════════════════════════════════════════════════
    //  내부 헬퍼 — 테이블 메타 추출
    // ════════════════════════════════════════════════════════════════════════════════════════

    /** Entity 클래스에서 테이블 라벨 추출: @Table(name) > 클래스명 */
    private static String resolveTableLabel(Class<?> entityClass) {
        Table table = entityClass.getAnnotation(Table.class);
        if (table != null && table.name() != null && !table.name().isBlank()) {
            return table.name();
        }
        return entityClass.getSimpleName();
    }

    /** Entity 클래스에서 테이블 코멘트 추출: 클래스 레벨 @Comment > 빈 문자열 */
    private static String resolveTableComment(Class<?> entityClass) {
        Comment c = entityClass.getAnnotation(Comment.class);
        if (c != null && c.value() != null && !c.value().isBlank()) {
            return c.value();
        }
        return "";
    }
}
