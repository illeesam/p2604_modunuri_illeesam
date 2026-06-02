package com.shopjoy.ecadminapi.base.ec.dp.repository.qrydsl.impl;

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
import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpAreaDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpArea;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpArea;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.QDpArea;
import com.shopjoy.ecadminapi.base.ec.dp.repository.qrydsl.QDpAreaRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;
import org.springframework.util.CollectionUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
@RequiredArgsConstructor
public class QDpAreaRepositoryImpl implements QDpAreaRepository {

    private final JPAQueryFactory queryFactory;
    private final EntityManager em;
    private final SyPathRepository syPathRepository;
    private static final String QRY_SRC = "base.ec.dp.repository.qrydsl.impl.QDpAreaRepositoryImpl";
    private static final QDpArea dpArea = QDpArea.dpArea;

    /* 전시 영역 키조회 */
    @Override
    public Optional<DpAreaDto.Item> selectById(String areaId) {
        return Optional.ofNullable(baseQuery().where(dpArea.areaId.eq(areaId)).fetchOne());
    }

    /* 전시 영역 목록조회 */
    @Override
    public List<DpAreaDto.Item> selectList(DpAreaDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<DpAreaDto.Item> query = baseQuery().where(
                baseAndUiIds(search),
                baseAndSiteId(search),
                baseAndPathId(search),
                baseAndUseYn(search),
                baseAndAreaId(search),
                baseAndUiId(search),
                baseAndAreaTypeCd(search),
                baseAndSearchValue(search)
        );
        if (!orderList.isEmpty()) query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo = search.getPageNo(), pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0)
            query.offset((long)(pageNo - 1) * pageSize).limit(pageSize);
        return query.fetch();
    }

    /* 전시 영역 페이지조회 */
    @Override
    public DpAreaDto.PageResponse selectPageData(DpAreaDto.Request search) {
        int pageNo = search.getPageNo() != null && search.getPageNo() > 0 ? search.getPageNo() : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                baseAndUiIds(search),
                baseAndSiteId(search),
                baseAndPathId(search),
                baseAndUseYn(search),
                baseAndAreaId(search),
                baseAndUiId(search),
                baseAndAreaTypeCd(search),
                baseAndSearchValue(search)
        };
        JPAQuery<DpAreaDto.Item> query = baseQuery().where(wheres);
        if (!orderList.isEmpty()) query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        List<DpAreaDto.Item> content = query.offset((long)(pageNo - 1) * pageSize).limit(pageSize).fetch();
        Long total = queryFactory.select(dpArea.count()).from(dpArea).where(wheres).fetchOne();
        DpAreaDto.PageResponse res = new DpAreaDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 전시 영역 baseQuery */
    private JPAQuery<DpAreaDto.Item> baseQuery() {
        return queryFactory.select(Projections.bean(DpAreaDto.Item.class,
                dpArea.areaId, dpArea.uiId, dpArea.siteId, dpArea.areaCd, dpArea.areaNm, dpArea.areaTypeCd, dpArea.areaDesc,
                dpArea.pathId, dpArea.useYn, dpArea.useStartDate, dpArea.useEndDate,
                dpArea.regBy, dpArea.regDate, dpArea.updBy, dpArea.updDate
        )).from(dpArea);
    }

    /* searchType 사용 예  searchType = "blogTitle,blogAuthor" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* uiId IN */
    private BooleanExpression baseAndUiIds(DpAreaDto.Request search) {
        return search != null && !CollectionUtils.isEmpty(search.getUiIds())
                ? dpArea.uiId.in(search.getUiIds()) : null;
    }

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(DpAreaDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? dpArea.siteId.eq(search.getSiteId()) : null;
    }

    /* 표시경로 트리 — 선택 노드 + 모든 자손 경로 포함 */
    private BooleanExpression baseAndPathId(DpAreaDto.Request search) {
        return search != null && StringUtils.hasText(search.getPathId())
                ? dpArea.pathId.in(syPathRepository.findTreePathIds(search.getPathId(), "dp_area"))
                : null;
    }

    /* useYn 정확 일치 */
    private BooleanExpression baseAndUseYn(DpAreaDto.Request search) {
        return search != null && StringUtils.hasText(search.getUseYn())
                ? dpArea.useYn.eq(search.getUseYn()) : null;
    }

    /* areaId 정확 일치 */
    private BooleanExpression baseAndAreaId(DpAreaDto.Request search) {
        return search != null && StringUtils.hasText(search.getAreaId())
                ? dpArea.areaId.eq(search.getAreaId()) : null;
    }

    /* uiId 정확 일치 */
    private BooleanExpression baseAndUiId(DpAreaDto.Request search) {
        return search != null && StringUtils.hasText(search.getUiId())
                ? dpArea.uiId.eq(search.getUiId()) : null;
    }

    /* areaTypeCd 정확 일치 */
    private BooleanExpression baseAndAreaTypeCd(DpAreaDto.Request search) {
        return search != null && StringUtils.hasText(search.getAreaTypeCd())
                ? dpArea.areaTypeCd.eq(search.getAreaTypeCd()) : null;
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(DpAreaDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",areaCd,", dpArea.areaCd, pattern);
        or = orLike(or, all, types, ",areaDesc,", dpArea.areaDesc, pattern);
        or = orLike(or, all, types, ",areaId,", dpArea.areaId, pattern);
        or = orLike(or, all, types, ",areaNm,", dpArea.areaNm, pattern);
        or = orLike(or, all, types, ",areaTypeCd,", dpArea.areaTypeCd, pattern);
        or = orLike(or, all, types, ",pathId,", dpArea.pathId, pattern);
        or = orLike(or, all, types, ",siteId,", dpArea.siteId, pattern);
        or = orLike(or, all, types, ",uiId,", dpArea.uiId, pattern);
        or = orLike(or, all, types, ",useYn,", dpArea.useYn, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(DpAreaDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, dpArea.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, dpArea.areaId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("areaId".equals(field)) {
                    orders.add(new OrderSpecifier(order, dpArea.areaId));
                } else if ("areaNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, dpArea.areaNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, dpArea.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, dpArea.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, dpArea.areaId));
        }
        return orders;
    }

    /* 전시 영역 수정 */
    @Override
    public int updateSelective(DpArea entity) {
        if (entity.getAreaId() == null) return 0;
        JPAUpdateClause update = queryFactory.update(dpArea);
        boolean hasAny = false;
        if (entity.getUiId()         != null) { update.set(dpArea.uiId,         entity.getUiId());         hasAny = true; }
        if (entity.getSiteId()       != null) { update.set(dpArea.siteId,       entity.getSiteId());       hasAny = true; }
        if (entity.getAreaCd()       != null) { update.set(dpArea.areaCd,       entity.getAreaCd());       hasAny = true; }
        if (entity.getAreaNm()       != null) { update.set(dpArea.areaNm,       entity.getAreaNm());       hasAny = true; }
        if (entity.getAreaTypeCd()   != null) { update.set(dpArea.areaTypeCd,   entity.getAreaTypeCd());   hasAny = true; }
        if (entity.getAreaDesc()     != null) { update.set(dpArea.areaDesc,     entity.getAreaDesc());     hasAny = true; }
        if (entity.getPathId()       != null) { update.set(dpArea.pathId,       entity.getPathId());       hasAny = true; }
        if (entity.getUseYn()        != null) { update.set(dpArea.useYn,        entity.getUseYn());        hasAny = true; }
        if (entity.getUseStartDate() != null) { update.set(dpArea.useStartDate, entity.getUseStartDate()); hasAny = true; }
        if (entity.getUseEndDate()   != null) { update.set(dpArea.useEndDate,   entity.getUseEndDate());   hasAny = true; }
        if (entity.getUpdBy()        != null) { update.set(dpArea.updBy,        entity.getUpdBy());        hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(dpArea.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));
        if (!hasAny) return 0;
        return (int) update.where(dpArea.areaId.eq(entity.getAreaId())).execute();
    }

    /* 표시경로 노드별 dp_area 수 집계 (자손 누적 + 검색조건 필터, native CTE 동적 SQL)
     *   반환: [{pathId, cnt}, ...] — '__total__' / '__orphan__' 특수 path 행 포함. */
    @Override
    public List<Map<String, Object>> selectPathTreeAreaCnts(DpAreaDto.Request search) {
        StringBuilder sql = new StringBuilder();
        Map<String, Object> params = new LinkedHashMap<>();

        sql.append("/* " + QRY_SRC + " :: selectPathTreeAreaCnts() */\n");
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
                    SELECT area_id, path_id
                    FROM dp_area t
                    WHERE 1=1
                """);
        params.put("bizCd", "dp_area");

        /* 검색조건 — pathtreeAnd*() 헬퍼로 SQL 조각 + 파라미터 함께 추가 */
        pathtreeAndUseYn(search, sql, params);
        pathtreeAndSearchValue(search, sql, params);
        pathtreeAndDateRange(search, sql, params);

        sql.append("""
                )
                  /* (1) 일반 path_id 행 : 노드 + 자손 누적 카운트 */
                  SELECT d.root_id AS path_id, COUNT(t.area_id) AS cnt
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

    /* ============================================================
     * selectPathTreeAreaCnts 전용 SQL 조건 헬퍼
     * ============================================================ */

    private void pathtreeAndUseYn(DpAreaDto.Request s, StringBuilder sql, Map<String, Object> p) {
        if (s == null || !StringUtils.hasText(s.getUseYn())) return;
        sql.append("      AND t.use_yn = :useYn\n");
        p.put("useYn", s.getUseYn());
    }

    private void pathtreeAndSearchValue(DpAreaDto.Request s, StringBuilder sql, Map<String, Object> p) {
        if (s == null || !StringUtils.hasText(s.getSearchValue())) return;
        String raw = s.getSearchType();
        boolean noType = !StringUtils.hasText(raw);
        String st = noType ? "" : "," + raw.trim() + ",";
        sql.append("      AND (\n");
        sql.append("            1=0\n");
        if (noType || st.contains(",areaNm,"))   sql.append("         OR t.area_nm   ILIKE '%' || :searchValue || '%'\n");
        if (noType || st.contains(",areaDesc,")) sql.append("         OR t.area_desc ILIKE '%' || :searchValue || '%'\n");
        sql.append("      )\n");
        p.put("searchValue", s.getSearchValue());
    }

    private void pathtreeAndDateRange(DpAreaDto.Request s, StringBuilder sql, Map<String, Object> p) {
        if (s == null) return;
        if (StringUtils.hasText(s.getDateStart())) {
            sql.append("      AND t.reg_date >= CAST(:dateStart AS timestamp)\n");
            p.put("dateStart", s.getDateStart());
        }
        if (StringUtils.hasText(s.getDateEnd())) {
            sql.append("      AND t.reg_date <= CAST(:dateEnd   AS timestamp) + INTERVAL '1 day'\n");
            p.put("dateEnd", s.getDateEnd());
        }
    }
}
