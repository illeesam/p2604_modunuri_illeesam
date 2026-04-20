package com.shopjoy.ecadminapi.autorest.service;

import com.shopjoy.ecadminapi.autorest.comn.TableConfig;
import com.shopjoy.ecadminapi.autorest.comn.TableRegistry;
import com.shopjoy.ecadminapi.autorest.data.dto.QueryParam;
import com.shopjoy.ecadminapi.autorest.data.dto.RowMap;
import com.shopjoy.ecadminapi.autorest.data.vo.SearchReq;
import com.shopjoy.ecadminapi.autorest.mapper.AutoRestMapper;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AutoRestService {

    private final TableRegistry registry;
    private final AutoRestMapper mapper;

    @PersistenceContext
    private EntityManager em;

    private static final String SCHEMA = "shopjoy_2604";
    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");

    /* ── 목록 (전체, 최대 1000건) ── */
    @Transactional(readOnly = true)
    public List<RowMap> getList(String table, SearchReq search) {
        QueryParam p = buildParams(table, search, 1000, 0);
        return mapper.selectList(p);
    }

    /* ── 페이지 ── */
    @Transactional(readOnly = true)
    public PageResult<RowMap> getPageData(String table, SearchReq search) {
        int size = Math.min(search.getPageSize(), 500);
        int offset = (search.getPageNo() - 1) * search.getPageSize();
        QueryParam p = buildParams(table, search, size, offset);
        long total = mapper.selectCount(p);
        List<RowMap> rows = mapper.selectPage(p);
        return PageResult.of(rows, total, search.getPageNo(), search.getPageSize(), search);
    }

    /* ── 건수 ── */
    @Transactional(readOnly = true)
    public long count(String table, SearchReq search) {
        QueryParam p = buildParams(table, search, 0, 0);
        return mapper.selectCount(p);
    }

    /* ── 단건 ── */
    @Transactional(readOnly = true)
    public RowMap getById(String table, String id) {
        TableConfig cfg = registry.getConfig(table);
        QueryParam p = QueryParam.builder()
                .schema(SCHEMA)
                .table(table)
                .pk(cfg.getPkColumn())
                .id(id)
                .build();
        RowMap row = mapper.selectById(p);
        if (row == null) return null;

        // 자식 테이블 포함
        for (String child : cfg.getChildTables()) {
            if (!TableRegistry.isSafeIdentifier(child)) continue;
            TableConfig childCfg = registry.getConfig(child);
            String childFk = table.replaceAll("^\\w+_", "") + "_id";
            String fkCol = childCfg.getFkFields().entrySet().stream()
                    .filter(e -> e.getValue().equals(table))
                    .map(Map.Entry::getKey)
                    .findFirst()
                    .orElse(childFk);
            QueryParam cp = QueryParam.builder()
                    .schema(SCHEMA)
                    .table(child)
                    .pk(childCfg.getPkColumn())
                    .fkCol(fkCol)
                    .fkVal(id)
                    .build();
            row.put("_" + child, mapper.selectChildren(cp));
        }
        return row;
    }

    /* ── 등록 ── */
    @Transactional
    public RowMap create(String table, RowMap body) {
        TableConfig cfg = registry.getConfig(table);
        validateRequired(cfg, body);

        String newId = generateId(table);
        body.put(cfg.getPkColumn(), newId);
        body.put("reg_by", SecurityUtil.currentUserId());
        body.put("reg_date", LocalDateTime.now());
        body.remove("upd_by");
        body.remove("upd_date");

        insertByJdbc(table, cfg.getPkColumn(), body);
        em.flush();
        return getById(table, newId);
    }

    /* ── 전체 수정 ── */
    @Transactional
    public RowMap update(String table, String id, RowMap body) {
        TableConfig cfg = registry.getConfig(table);
        validateRequired(cfg, body);

        body.remove(cfg.getPkColumn());
        body.put("upd_by", SecurityUtil.currentUserId());
        body.put("upd_date", LocalDateTime.now());

        updateByJdbc(table, cfg.getPkColumn(), id, body, false);
        em.flush();
        return getById(table, id);
    }

    /* ── 부분 수정 ── */
    @Transactional
    public RowMap patch(String table, String id, RowMap body) {
        TableConfig cfg = registry.getConfig(table);

        body.remove(cfg.getPkColumn());
        body.put("upd_by", SecurityUtil.currentUserId());
        body.put("upd_date", LocalDateTime.now());

        updateByJdbc(table, cfg.getPkColumn(), id, body, true);
        em.flush();
        return getById(table, id);
    }

    /* ── 단건 삭제 ── */
    @Transactional
    public void delete(String table, String id) {
        TableConfig cfg = registry.getConfig(table);
        String sql = String.format("DELETE FROM %s.%s WHERE %s = ?", SCHEMA, table, cfg.getPkColumn());
        em.createNativeQuery(sql).setParameter(1, id).executeUpdate();
        em.flush();
    }

    /* ── 일괄 삭제 ── */
    @Transactional
    public int bulkDelete(String table, List<String> ids) {
        if (ids == null || ids.isEmpty()) return 0;
        for (String id : ids) {
            if (!id.matches("[a-zA-Z0-9_\\-]{1,50}")) {
                throw new CmBizException("유효하지 않은 ID: " + id);
            }
        }
        TableConfig cfg = registry.getConfig(table);
        String placeholders = String.join(",", Collections.nCopies(ids.size(), "?"));
        String sql = String.format("DELETE FROM %s.%s WHERE %s IN (%s)",
                SCHEMA, table, cfg.getPkColumn(), placeholders);
        jakarta.persistence.Query q = em.createNativeQuery(sql);
        for (int i = 0; i < ids.size(); i++) {
            q.setParameter(i + 1, ids.get(i));
        }
        int cnt = q.executeUpdate();
        em.flush();
        return cnt;
    }

    /* ── _row_status 단건 저장 ── */
    @Transactional
    public RowMap saveByRowStatus(String table, RowMap body) {
        return doSaveByRowStatus(table, body);
    }

    // D → U → I 순서로 처리: 삭제 후 수정, 마지막에 신규 등록하여 유니크 제약 충돌 방지
    @Transactional
    public List<RowMap> saveListByRowStatus(String table, List<RowMap> list) {
        List<RowMap> result = new ArrayList<>();
        for (RowMap body : list.stream().filter(b -> "D".equals(b.get("_row_status"))).toList()) result.add(doSaveByRowStatus(table, body));
        for (RowMap body : list.stream().filter(b -> "U".equals(b.get("_row_status"))).toList()) result.add(doSaveByRowStatus(table, body));
        for (RowMap body : list.stream().filter(b -> "I".equals(b.get("_row_status"))).toList()) result.add(doSaveByRowStatus(table, body));
        return result;
    }

    private RowMap doSaveByRowStatus(String table, RowMap body) {
        String rowStatus = (String) body.remove("_row_status");
        if (rowStatus == null) throw new CmBizException("_row_status 값이 없습니다.");

        TableConfig cfg = registry.getConfig(table);
        String pkCol = cfg.getPkColumn();

        return switch (rowStatus) {
            case "I" -> create(table, body);
            case "U" -> {
                String id = (String) body.get(pkCol);
                if (id == null || id.isBlank()) throw new CmBizException(pkCol + " 값이 없습니다.");
                yield update(table, id, body);
            }
            case "D" -> {
                String id = (String) body.get(pkCol);
                if (id == null || id.isBlank()) throw new CmBizException(pkCol + " 값이 없습니다.");
                delete(table, id);
                yield null;
            }
            default -> throw new CmBizException("올바르지 않은 _row_status: " + rowStatus);
        };
    }

    /* ── Private helpers ── */

    private QueryParam buildParams(String table, SearchReq search, int limit, int offset) {
        TableConfig cfg = registry.getConfig(table);
        return QueryParam.builder()
                .schema(SCHEMA)
                .table(table)
                .pk(cfg.getPkColumn())
                .searchFields(cfg.getSearchFields())
                .cdFields(cfg.getCdFields())
                .fkFields(cfg.getFkFields())
                .dateField(cfg.getDateField() != null ? cfg.getDateField() : "reg_date")
                .kw(search.getKw())
                .dateStart(search.getDateStart())
                .dateEnd(search.getDateEnd())
                .siteId(search.getSiteId())
                .status(search.getStatus())
                .filters(search.getFilters())
                .orderBy(sanitizeOrderBy(search.getOrderBy()))
                .limit(limit)
                .offset(offset)
                .build();
    }

    private void insertByJdbc(String table, String pk, RowMap body) {
        List<String> cols = new ArrayList<>(body.keySet());
        String colsSql = String.join(", ", cols);
        String vals = String.join(", ", Collections.nCopies(cols.size(), "?"));
        String sql = String.format("INSERT INTO %s.%s (%s) VALUES (%s)", SCHEMA, table, colsSql, vals);
        jakarta.persistence.Query q = em.createNativeQuery(sql);
        for (int i = 0; i < cols.size(); i++) {
            q.setParameter(i + 1, body.get(cols.get(i)));
        }
        q.executeUpdate();
    }

    private void updateByJdbc(String table, String pk, String id, RowMap body, boolean skipNull) {
        RowMap effective = new RowMap();
        if (skipNull) {
            body.forEach((k, v) -> { if (v != null) effective.put(k, v); });
        } else {
            effective.putAll(body);
        }
        if (effective.isEmpty()) return;

        List<String> sets = new ArrayList<>();
        List<Object> vals = new ArrayList<>();
        effective.forEach((col, val) -> {
            if (TableRegistry.isSafeIdentifier(col)) {
                sets.add(col + " = ?");
                vals.add(val);
            }
        });
        vals.add(id);

        String sql = String.format("UPDATE %s.%s SET %s WHERE %s = ?",
                SCHEMA, table, String.join(", ", sets), pk);
        jakarta.persistence.Query q = em.createNativeQuery(sql);
        for (int i = 0; i < vals.size(); i++) q.setParameter(i + 1, vals.get(i));
        q.executeUpdate();
    }

    private String generateId(String table) {
        String prefix = tablePrefix(table);
        String ts = LocalDateTime.now().format(ID_FMT);
        String rand = String.format("%04d", (int) (Math.random() * 10000));
        return prefix + ts + rand;
    }

    /**
     * 테이블명 → 이니셜 (2~4자리)
     * 규칙: 첫 번째 세그먼트(도메인 2자) 유지 + 세 번째 이후 세그먼트 첫 글자 추가
     * 예: od_order → od, od_order_item → odi, pd_prod_sku → pds
     */
    private String tablePrefix(String table) {
        // syh_*, odh_* 등 히스토리 테이블은 두 번째 글자를 제거해서 도메인만 추출
        String[] parts = table.split("_");
        if (parts.length == 0) return "xx";
        String domain = parts[0].replaceAll("h$", ""); // syh→sy, odh→od
        if (domain.length() > 2) domain = domain.substring(0, 2);
        StringBuilder sb = new StringBuilder(domain);
        // 세 번째 세그먼트부터 첫 글자 추가 (두 번째는 entity명, 세 번째부터 qualifier)
        for (int i = 2; i < parts.length && sb.length() < 4; i++) {
            if (!parts[i].isEmpty()) sb.append(parts[i].charAt(0));
        }
        return sb.toString();
    }

    private void validateRequired(TableConfig cfg, RowMap body) {
        for (String f : cfg.getRequiredFields()) {
            Object v = body.get(f);
            if (v == null || v.toString().isBlank()) {
                throw new CmBizException("필수 항목 누락: " + f);
            }
        }
    }

    private String sanitizeOrderBy(String orderBy) {
        if (orderBy == null || orderBy.isBlank()) return null;
        if (orderBy.matches("[a-zA-Z0-9_,\\s]+(ASC|DESC|asc|desc)?[,\\s]*[a-zA-Z0-9_,\\s]*")) {
            return orderBy;
        }
        return null;
    }
}
