package com.shopjoy.ecadminapi.common.excel;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;

import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * 화면 그리드의 헤더 정의로 엑셀 메타를 만든다.
 *
 * <p>{@link ExcelMetaBuilder#fromEntity} 는 Entity 필드를 전부 훑기 때문에 화면에서 보던 것과
 * 컬럼 구성·순서·라벨이 어긋난다(사용자 입장에선 "그리드와 다른 파일"이 나온다).
 * 그래서 프론트가 그리드 컬럼을 {@code excelColumns} 파라미터로 함께 보내고,
 * 여기서 그 순서·라벨 그대로 메타를 만든다.</p>
 *
 * <p>전달 형식 (JSON 배열 문자열):
 * <pre>
 * [{"key":"logId","label":"로그ID"},{"key":"loginDate","label":"로그인일시"}, ...]
 * </pre>
 *
 * <p><b>매핑 규칙</b>
 * <ul>
 *   <li>{@code key} 가 Dto.Item 의 실제 필드일 때만 채택한다 — 화면 전용 컬럼
 *       (행번호 {@code _no}, 액션 {@code _act}, 조합 컬럼 등)은 서버에 대응 값이 없어 제외한다.</li>
 *   <li>전달된 컬럼 중 쓸 수 있는 게 하나도 없으면 {@code null} 을 돌려주고,
 *       호출 측이 기존 Entity 기반 메타로 자연스럽게 되돌아가게 한다(다운로드 자체는 성공시킨다).</li>
 * </ul>
 */
@Slf4j
public final class GridColumnMetaBuilder {

    private GridColumnMetaBuilder() { }

    /** 요청 파라미터 키 — 프론트(BoExcelDownModal)가 이 이름으로 그리드 헤더를 보낸다 */
    public static final String PARAM = "excelColumns";

    /**
     * 그리드 컬럼 JSON → ExcelMetaInfo.
     *
     * @param json       {@code [{"key":..,"label":..}, ...]} 형태의 JSON 배열 문자열
     * @param itemClass  Dto.Item 클래스 (필드 존재 여부 검증용)
     * @param tableLabel 시트 제목에 쓸 화면/영역명
     * @param om         Jackson
     * @return 메타. 사용 가능한 컬럼이 없으면 null
     */
    public static ExcelMetaInfo fromGridJson(String json, Class<?> itemClass, String tableLabel, ObjectMapper om) {
        if (json == null || json.isBlank()) return null;

        List<Map<String, Object>> defs;
        try {
            defs = om.readValue(json, new com.fasterxml.jackson.core.type.TypeReference<List<Map<String, Object>>>() {});
        } catch (Exception e) {
            log.warn("[GridColumnMeta] excelColumns 파싱 실패 — Entity 기반 메타로 대체. msg={}", e.getMessage());
            return null;
        }
        if (defs == null || defs.isEmpty()) return null;

        Set<String> itemFields = fieldNames(itemClass);
        List<ColumnMeta> cols = new ArrayList<>();
        List<String> skipped = new ArrayList<>();

        for (Map<String, Object> d : defs) {
            String key   = str(d.get("key"));
            String label = str(d.get("label"));
            if (key == null || key.isBlank()) continue;
            if (!itemFields.contains(key)) { skipped.add(key); continue; }   // 화면 전용 컬럼
            cols.add(ColumnMeta.of(key, (label == null || label.isBlank()) ? key : label));
        }

        if (cols.isEmpty()) {
            log.warn("[GridColumnMeta] 사용 가능한 컬럼 없음 — Entity 기반 메타로 대체. skipped={}", skipped);
            return null;
        }
        if (!skipped.isEmpty()) {
            log.debug("[GridColumnMeta] 서버 필드에 없는 화면 컬럼 제외 — {}", skipped);
        }
        return new ExcelMetaInfo(tableLabel, tableLabel, cols.get(0).fieldName(), cols);
    }

    /** Dto.Item 의 필드명 집합 (상속 포함) */
    private static Set<String> fieldNames(Class<?> cls) {
        Set<String> names = new LinkedHashSet<>();
        for (Class<?> c = cls; c != null && c != Object.class; c = c.getSuperclass()) {
            for (Field f : c.getDeclaredFields()) names.add(f.getName());
        }
        return names;
    }

    private static String str(Object o) {
        return o == null ? null : String.valueOf(o);
    }
}
