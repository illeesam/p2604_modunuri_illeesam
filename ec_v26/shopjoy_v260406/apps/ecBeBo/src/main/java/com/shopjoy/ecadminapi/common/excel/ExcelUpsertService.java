package com.shopjoy.ecadminapi.common.excel;

import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.VoUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Table;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.interceptor.TransactionAspectSupport;

import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 엑셀 업로드 공통 처리 서비스.
 *
 * <p>모든 도메인의 upsert 로직이 거의 동일하므로 (Entity 클래스만 다름) 공통화.
 *
 * <p><b>처리 흐름</b>:
 * <ol>
 *   <li>업로드 행수 상한({@link ExcelExportUtil#UPLOAD_MAX_ROWS}) 검증</li>
 *   <li>각 행 Map → Entity 변환 ({@link VoUtil#mapCopyExclude})</li>
 *   <li>keyField 값 존재 + DB 존재 시 → UPDATE (기존 entity findById 후 voCopy)</li>
 *   <li>keyField 값 없거나 DB 미존재 → INSERT (save)</li>
 *   <li>행 단위 try/catch — 한 행 실패해도 다른 행 계속</li>
 *   <li>결과 리포트: {inserted, updated, errors: [{rowIndex, message}]}</li>
 * </ol>
 *
 * <p><b>사용 예</b>:
 * <pre>
 *   {@code @Transactional}
 *   public Map<String,Object> upsertList(List<Map<String,Object>> rows) {
 *       return excelUpsertService.upsertByKey(
 *           SyUser.class, SyUserRepository, rows, "userId"
 *       );
 *   }
 * </pre>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ExcelUpsertService {

    @PersistenceContext
    private EntityManager em;

    /**
     * 키 기반 upsert. keyField 값 존재 시 UPDATE, 없으면 INSERT.
     *
     * @param entityClass Entity 클래스 (new 생성용)
     * @param repository  JpaRepository (findById/save 호출용)
     * @param rows        업로드 행 (Map&lt;필드명, 값&gt; 리스트)
     * @param keyField    PK 필드명 (null 이면 Entity 의 @Id 필드 자동 탐색하지만 명시 권장)
     * @return { inserted, updated, errors }
     */
    @Transactional
    public <T> Map<String, Object> upsertByKey(
            Class<T> entityClass,
            JpaRepository<T, String> repository,
            List<Map<String, Object>> rows,
            String keyField
    ) {
        return upsertByKey(entityClass, repository, rows, keyField, false);
    }

    /**
     * 키 기반 upsert — testRun 플래그로 검증 전용 모드 지원.
     *
     * @param testRun true 면 모든 행을 처리한 뒤 트랜잭션을 롤백 → DB 미반영.
     *                JPA flush 가 발생하므로 PK 중복/NOT NULL 위반/타입 불일치 등 SQL 레벨 오류까지 모두 검출.
     *                false 면 정상 커밋.
     */
    @Transactional
    public <T> Map<String, Object> upsertByKey(
            Class<T> entityClass,
            JpaRepository<T, String> repository,
            List<Map<String, Object>> rows,
            String keyField,
            boolean testRun
    ) {
        if (rows == null) rows = List.of();
        if (rows.size() > ExcelExportUtil.UPLOAD_MAX_ROWS) {
            throw new IllegalStateException(
                "엑셀 업로드 행수가 상한(" + ExcelExportUtil.UPLOAD_MAX_ROWS + ")을 초과합니다. "
                + "현재 " + rows.size() + "건."
            );
        }
        if (keyField == null || keyField.isBlank()) {
            keyField = ExcelMetaBuilder.fromEntity(entityClass).keyField();
            if (keyField == null) {
                throw new IllegalArgumentException("Entity 에 @Id 필드가 없습니다: " + entityClass.getName());
            }
        }

        int inserted = 0, updated = 0;
        List<Map<String, Object>> errors = new ArrayList<>();
        Method getKey = findGetter(entityClass, keyField);

        for (int i = 0; i < rows.size(); i++) {
            Map<String, Object> r = rows.get(i);
            try {
                String keyVal = toStringOrNull(r.get(keyField));
                if (keyVal != null && !keyVal.isBlank() && repository.existsById(keyVal)) {
                    // UPDATE — 기존 entity 로딩 후 비-key/비-감사 필드 복사
                    T entity = repository.findById(keyVal).orElseThrow(
                        () -> new IllegalStateException("존재하지 않는 데이터: " + keyVal)
                    );
                    VoUtil.mapCopyExclude(r, entity, keyField + "^regBy^regDate");
                    repository.save(entity);
                    updated++;
                } else {
                    // INSERT — 새 entity 생성. ID 가 없으면 테이블명 prefix 로 자동 생성.
                    T entity = entityClass.getDeclaredConstructor().newInstance();
                    VoUtil.mapCopyExclude(r, entity, "regBy^regDate");
                    ensureGeneratedId(entity, entityClass, keyField);
                    repository.save(entity);
                    inserted++;
                }
                /* testRun: 행 단위로 flush 하여 SQL 레벨 오류(타입 불일치/NOT NULL/길이 초과 등)도 검출.
                 * 운영 호출에서는 flush 빈도 부담 때문에 트랜잭션 커밋 시점에만 flush. */
                if (testRun) {
                    em.flush();
                    em.clear();
                }
            } catch (Exception e) {
                String msg = e.getMessage();
                if (msg == null) msg = e.getClass().getSimpleName();
                errors.add(Map.of("rowIndex", i + 1, "message", msg));
                log.warn("[ExcelUpsertService] row {} 실패{}: {}", i + 1, testRun ? " (testRun)" : "", msg);
                /* testRun 에서 flush 실패 시 트랜잭션이 rollback-only 로 마킹될 수 있음 → 안전하게 clear */
                if (testRun) {
                    try { em.clear(); } catch (Exception ignore) { /* no-op */ }
                }
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("inserted", inserted);
        result.put("updated", updated);
        result.put("errors", errors);
        result.put("testRun", testRun);

        /* testRun: 모든 행 처리 후 트랜잭션 강제 롤백 — DB 미반영 */
        if (testRun) {
            try {
                TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            } catch (Exception e) {
                log.warn("[ExcelUpsertService] testRun rollback 마킹 실패: {}", e.getMessage());
            }
        }
        return result;
    }

    /**
     * keyField 미지정 단순 호출 — Entity 의 @Id 필드 자동 탐색.
     */
    @Transactional
    public <T> Map<String, Object> upsertByKey(
            Class<T> entityClass,
            JpaRepository<T, String> repository,
            List<Map<String, Object>> rows
    ) {
        return upsertByKey(entityClass, repository, rows, null, false);
    }

    /**
     * 키 일괄 존재체크. 미리보기에서 INSERT/UPDATE 표시 결정용.
     * @return existsMap: { key → true/false }
     */
    public Map<String, Boolean> existsCheck(
            JpaRepository<?, String> repository,
            List<String> keys
    ) {
        Map<String, Boolean> result = new HashMap<>();
        if (keys == null || keys.isEmpty()) return result;
        for (String k : keys) {
            if (k == null || k.isBlank()) continue;
            result.put(k, repository.existsById(k));
        }
        return result;
    }

    // ─── helpers ─────────────────────────────────────────────────────────────

    private static String toStringOrNull(Object v) {
        return v == null ? null : v.toString();
    }

    private static Method findGetter(Class<?> cls, String fieldName) {
        String getter = "get" + Character.toUpperCase(fieldName.charAt(0)) + fieldName.substring(1);
        Class<?> c = cls;
        while (c != null && c != Object.class) {
            try { return c.getDeclaredMethod(getter); }
            catch (NoSuchMethodException ignore) { c = c.getSuperclass(); }
        }
        return null;
    }

    /**
     * INSERT 직전에 PK 필드가 비어있으면 테이블명 prefix 로 자동 생성.
     * <p>{@code CmUtil.generateId(tablePrefix)} 패턴 — 기존 BoSyXxxService.create 가 하던 일.
     */
    private static void ensureGeneratedId(Object entity, Class<?> entityClass, String keyField) {
        if (keyField == null) return;
        Field f = findField(entityClass, keyField);
        if (f == null) return;
        f.setAccessible(true);
        try {
            Object curVal = f.get(entity);
            if (curVal != null && !curVal.toString().isBlank()) return;
            // 테이블명 추출 — @Table(name) 또는 클래스명
            String tableName = entityClass.getSimpleName();
            Table t = entityClass.getAnnotation(Table.class);
            if (t != null && t.name() != null && !t.name().isBlank()) {
                tableName = t.name();
            }
            String generated = CmUtil.generateId(tableName);
            f.set(entity, generated);
        } catch (IllegalAccessException e) {
            log.warn("[ExcelUpsertService] ID 자동생성 실패 — {}: {}", entityClass.getName(), e.getMessage());
        }
    }

    private static Field findField(Class<?> cls, String name) {
        Class<?> c = cls;
        while (c != null && c != Object.class) {
            try { return c.getDeclaredField(name); }
            catch (NoSuchFieldException ignore) { c = c.getSuperclass(); }
        }
        return null;
    }
}
