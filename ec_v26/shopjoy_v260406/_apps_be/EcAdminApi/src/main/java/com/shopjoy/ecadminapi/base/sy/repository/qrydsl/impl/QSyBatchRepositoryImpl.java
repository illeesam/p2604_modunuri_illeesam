package com.shopjoy.ecadminapi.base.sy.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecadminapi.base.sy.repository.SyPathRepository;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyBatchDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyBatch;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyBatch;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyBatch;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyBatchRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
/** SyBatch QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyBatchRepositoryImpl implements QSyBatchRepository {

    private final JPAQueryFactory queryFactory;
    private final EntityManager em;
    private final SyPathRepository syPathRepository;
    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSyBatchRepositoryImpl";
    private static final QSyBatch b = QSyBatch.syBatch;
    private static final QSySite ste = QSySite.sySite;
    private static final DateTimeFormatter DF = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    /* 배치 키조회 */
    @Override
    public Optional<SyBatchDto.Item> selectById(String batchId) {
        SyBatchDto.Item dto = baseQuery().where(b.batchId.eq(batchId)).fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 배치 목록조회 */
    @Override
    public List<SyBatchDto.Item> selectList(SyBatchDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<SyBatchDto.Item> query = baseQuery().where(
                andSiteId(search),
                andPathId(search),
                andBatchId(search),
                andStatus(search),
                andSearchValue(search)
        );
        if (!orderList.isEmpty()) query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            query.offset(offset).limit(pageSize);
        }
        return query.fetch();
    }

    /* 배치 페이지조회 */
    @Override
    public SyBatchDto.PageResponse selectPageList(SyBatchDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SyBatchDto.Item> query = baseQuery().where(
                andSiteId(search),
                andPathId(search),
                andBatchId(search),
                andStatus(search),
                andSearchValue(search)
        );
        if (!orderList.isEmpty()) query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        List<SyBatchDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(b.count()).from(b).where(
                andSiteId(search),
                andPathId(search),
                andBatchId(search),
                andStatus(search),
                andSearchValue(search)
        ).fetchOne();

        SyBatchDto.PageResponse res = new SyBatchDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 배치 baseQuery */
    private JPAQuery<SyBatchDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(SyBatchDto.Item.class,
                        b.batchId, b.siteId, b.batchCode, b.batchNm, b.batchDesc, b.cronExpr,
                        b.batchCycleCd, b.batchLastRun, b.batchNextRun, b.batchRunCount,
                        b.batchStatusCd, b.batchRunStatus, b.batchTimeoutSec, b.batchMemo,
                        b.regBy, b.regDate, b.updBy, b.updDate, b.pathId,
                        ste.siteNm.as("siteNm")
                ))
                .from(b)
                .leftJoin(ste).on(ste.siteId.eq(b.siteId));
    }

    /* searchType 사용 예  searchType = "fieldA,fieldB" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression andSiteId(SyBatchDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? b.siteId.eq(search.getSiteId()) : null;
    }

    /* 표시경로 트리 — 선택 노드 + 모든 자손 경로 포함 */
    private BooleanExpression andPathId(SyBatchDto.Request search) {
        return search != null && StringUtils.hasText(search.getPathId())
                ? b.pathId.in(syPathRepository.findTreePathIds(search.getPathId(), "sy_batch"))
                : null;
    }

    /* batchId 정확 일치 */
    private BooleanExpression andBatchId(SyBatchDto.Request search) {
        return search != null && StringUtils.hasText(search.getBatchId())
                ? b.batchId.eq(search.getBatchId()) : null;
    }

    /* batchStatusCd 정확 일치 */
    private BooleanExpression andStatus(SyBatchDto.Request search) {
        return search != null && StringUtils.hasText(search.getStatus())
                ? b.batchStatusCd.eq(search.getStatus()) : null;
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression andSearchValue(SyBatchDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",batchCode,", b.batchCode, pattern);
        or = orLike(or, all, types, ",batchCycleCd,", b.batchCycleCd, pattern);
        or = orLike(or, all, types, ",batchDesc,", b.batchDesc, pattern);
        or = orLike(or, all, types, ",batchId,", b.batchId, pattern);
        or = orLike(or, all, types, ",batchMemo,", b.batchMemo, pattern);
        or = orLike(or, all, types, ",batchNm,", b.batchNm, pattern);
        or = orLike(or, all, types, ",batchRunStatus,", b.batchRunStatus, pattern);
        or = orLike(or, all, types, ",batchStatusCd,", b.batchStatusCd, pattern);
        or = orLike(or, all, types, ",cronExpr,", b.cronExpr, pattern);
        or = orLike(or, all, types, ",pathId,", b.pathId, pattern);
        or = orLike(or, all, types, ",siteId,", b.siteId, pattern);
        return or;
    }

    /* 단일 필드 LIKE 조건을 누적 OR (해당 type 이 포함됐을 때만) */
    private BooleanExpression orLike(BooleanExpression acc, boolean all, String types,
                                     String token, StringPath path, String pattern) {
        if (!(all || types.contains(token))) return acc;
        BooleanExpression expr = path.likeIgnoreCase(pattern);
        return acc == null ? expr : acc.or(expr);
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(SyBatchDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, b.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, b.batchId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("batchId".equals(field)) {
                    orders.add(new OrderSpecifier(order, b.batchId));
                } else if ("batchNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, b.batchNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, b.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, b.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, b.batchId));
        }
        return orders;
    }

    /* 배치 수정 */
    @Override
    public int updateSelective(SyBatch entity) {
        if (entity.getBatchId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(b);
        boolean hasAny = false;

        if (entity.getSiteId()          != null) { update.set(b.siteId,          entity.getSiteId());          hasAny = true; }
        if (entity.getBatchCode()       != null) { update.set(b.batchCode,       entity.getBatchCode());       hasAny = true; }
        if (entity.getBatchNm()         != null) { update.set(b.batchNm,         entity.getBatchNm());         hasAny = true; }
        if (entity.getBatchDesc()       != null) { update.set(b.batchDesc,       entity.getBatchDesc());       hasAny = true; }
        if (entity.getCronExpr()        != null) { update.set(b.cronExpr,        entity.getCronExpr());        hasAny = true; }
        if (entity.getBatchCycleCd()    != null) { update.set(b.batchCycleCd,    entity.getBatchCycleCd());    hasAny = true; }
        if (entity.getBatchLastRun()    != null) { update.set(b.batchLastRun,    entity.getBatchLastRun());    hasAny = true; }
        if (entity.getBatchNextRun()    != null) { update.set(b.batchNextRun,    entity.getBatchNextRun());    hasAny = true; }
        if (entity.getBatchRunCount()   != null) { update.set(b.batchRunCount,   entity.getBatchRunCount());   hasAny = true; }
        if (entity.getBatchStatusCd()   != null) { update.set(b.batchStatusCd,   entity.getBatchStatusCd());   hasAny = true; }
        if (entity.getBatchRunStatus()  != null) { update.set(b.batchRunStatus,  entity.getBatchRunStatus());  hasAny = true; }
        if (entity.getBatchTimeoutSec() != null) { update.set(b.batchTimeoutSec, entity.getBatchTimeoutSec()); hasAny = true; }
        if (entity.getBatchMemo()       != null) { update.set(b.batchMemo,       entity.getBatchMemo());       hasAny = true; }
        if (entity.getUpdBy()           != null) { update.set(b.updBy,           entity.getUpdBy());           hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(b.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));
        if (entity.getPathId()          != null) { update.set(b.pathId,          entity.getPathId());          hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(b.batchId.eq(entity.getBatchId())).execute();
        return (int) affected;
    }

    /* 표시경로 노드별 sy_batch 수 집계 (자손 누적 + 검색조건 필터, native CTE 동적 SQL)
     *   반환: [{pathId, cnt}, ...] — '__total__' / '__orphan__' 특수 path 행 포함. */
    @Override
    public List<Map<String, Object>> findPathSyBatchTreeNodeCounts(SyBatchDto.Request search) {
        StringBuilder sql = new StringBuilder();
        Map<String, Object> params = new LinkedHashMap<>();

        sql.append("/* " + QRY_SRC + " :: findPathSyBatchTreeNodeCounts() */\n");
        sql.append("""
                WITH RECURSIVE descendants /* 각 path 의 자손 path_id (자신 포함, biz_cd 한정) */ AS (
                    SELECT path_id AS root_id, path_id AS leaf_id
                    FROM sy_path
                    WHERE biz_cd = :bizCd
                    UNION ALL
                    SELECT d.root_id, c.path_id
                    FROM descendants d
                    JOIN sy_path c ON c.parent_path_id = d.leaf_id
                    WHERE c.biz_cd = :bizCd
                ),
                filtered /* 검색조건이 적용된 행 */ AS (
                    SELECT batch_id, path_id
                    FROM sy_batch t
                    WHERE 1=1
                """);
        params.put("bizCd", "sy_batch");

        if (search != null && StringUtils.hasText(search.getStatus())) {
            sql.append("      AND t.batch_status_cd = :statusCd\n");
            params.put("statusCd", search.getStatus());
        }
        if (search != null && StringUtils.hasText(search.getSearchValue())) {
            String searchType = search.getSearchType();
            boolean noType = !StringUtils.hasText(searchType);
            sql.append("      AND (\n");
            sql.append("            1=0\n");
            if (noType || searchType.contains(",batchCode,")) sql.append("         OR t.batch_code ILIKE '%' || :searchValue || '%'\n");
            if (noType || searchType.contains(",batchNm,")) sql.append("         OR t.batch_nm ILIKE '%' || :searchValue || '%'\n");
            if (noType || searchType.contains(",batchDesc,")) sql.append("         OR t.batch_desc ILIKE '%' || :searchValue || '%'\n");
            sql.append("      )\n");
            params.put("searchValue", search.getSearchValue());
        }
        if (search != null && StringUtils.hasText(search.getDateStart())) {
            sql.append("      AND t.reg_date >= CAST(:dateStart AS timestamp)\n");
            params.put("dateStart", search.getDateStart());
        }
        if (search != null && StringUtils.hasText(search.getDateEnd())) {
            sql.append("      AND t.reg_date <= CAST(:dateEnd   AS timestamp) + INTERVAL '1 day'\n");
            params.put("dateEnd", search.getDateEnd());
        }

        sql.append("""
                )
                /* (1) 일반 path_id 행 : 노드 + 자손 누적 카운트 */
                SELECT d.root_id AS path_id, COUNT(t.batch_id) AS cnt
                FROM descendants d
                LEFT JOIN filtered t ON t.path_id = d.leaf_id
                GROUP BY d.root_id
                UNION ALL
                /* (2) '__total__' : 트리 루트 "전체" 노드용 — 검색조건에 부합하는 전체 카운트 */
                SELECT '__total__' AS path_id, COUNT(*) AS cnt
                FROM filtered
                UNION ALL
                /* (3) '__orphan__' : 경로 미지정(path_id IS NULL) 카운트 — 트리 외 표시 */
                SELECT '__orphan__' AS path_id, COUNT(*) AS cnt
                FROM filtered
                WHERE path_id IS NULL
                """);

        Query q = em.createNativeQuery(sql.toString());
        params.forEach(q::setParameter);

        @SuppressWarnings("unchecked")
        List<Object[]> rows = (List<Object[]>) q.getResultList();

        List<Map<String, Object>> result = new ArrayList<>(rows.size());
        for (Object[] row : rows) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("pathId", row[0] == null ? null : String.valueOf(row[0]));
            m.put("cnt",    row[1] == null ? 0L   : ((Number) row[1]).longValue());
            result.add(m);
        }
        return result;
    }
}
