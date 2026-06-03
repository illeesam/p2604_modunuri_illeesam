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
import com.shopjoy.ecadminapi.base.sy.data.dto.SyPropDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyProp;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyProp;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyPropRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
/** SyProp QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyPropRepositoryImpl implements QSyPropRepository {

    private final JPAQueryFactory queryFactory;
    private final EntityManager em;
    private final SyPathRepository syPathRepository;
    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSyPropRepositoryImpl";
    private static final QSyProp syProp = QSyProp.syProp;
    private static final QSySite sySite = QSySite.sySite;
    private static final DateTimeFormatter DF = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    /* 시스템 속성 baseQuery */
    private JPAQuery<SyPropDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(SyPropDto.Item.class,
                        syProp.propId, syProp.siteId, syProp.pathId, syProp.propKey, syProp.propValue, syProp.propLabel,
                        syProp.propTypeCd, syProp.sortOrd, syProp.useYn, syProp.propRemark,
                        syProp.regBy, syProp.regDate, syProp.updBy, syProp.updDate,
                        sySite.siteNm.as("siteNm")
                ))
                .from(syProp)
                .leftJoin(sySite).on(sySite.siteId.eq(syProp.siteId));
    }

    /* 시스템 속성 키조회 */
    @Override
    public Optional<SyPropDto.Item> selectById(String propId) {
        SyPropDto.Item dto = baseQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(syProp.propId.eq(propId)).fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 시스템 속성 목록조회 */
    @Override
    public List<SyPropDto.Item> selectList(SyPropDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<SyPropDto.Item> query = baseQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    baseAndSiteId(search),
                    baseAndPathId(search),
                    baseAndPropTypeCd(search),
                    baseAndUseYn(search),
                    baseAndSearchValue(search)
                )
                .orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        return query.fetch();
    }

    /* 시스템 속성 페이지조회 */
    @Override
    public SyPropDto.PageResponse selectPageData(SyPropDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                baseAndSiteId(search),
                baseAndPathId(search),
                baseAndPropTypeCd(search),
                baseAndUseYn(search),
                baseAndSearchValue(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<SyPropDto.Item> query = baseQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<SyPropDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(syProp.count())
                .where(wheres)
                .fetchOne();

        SyPropDto.PageResponse res = new SyPropDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }



    /* 시스템 속성 buildCondition */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(SyPropDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? syProp.siteId.eq(search.getSiteId()) : null;
    }

    /* 표시경로 트리 — 선택 노드 + 모든 자손 경로 포함 */
    private BooleanExpression baseAndPathId(SyPropDto.Request search) {
        return search != null && StringUtils.hasText(search.getPathId())
                ? syProp.pathId.in(syPathRepository.findTreePathIds(search.getPathId(), "sy_prop"))
                : null;
    }

    /* propTypeCd 정확 일치 */
    private BooleanExpression baseAndPropTypeCd(SyPropDto.Request search) {
        return search != null && StringUtils.hasText(search.getPropTypeCd())
                ? syProp.propTypeCd.eq(search.getPropTypeCd()) : null;
    }

    /* useYn 정확 일치 */
    private BooleanExpression baseAndUseYn(SyPropDto.Request search) {
        return search != null && StringUtils.hasText(search.getUseYn())
                ? syProp.useYn.eq(search.getUseYn()) : null;
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(SyPropDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",pathId,", syProp.pathId, pattern);
        or = orLike(or, all, types, ",propId,", syProp.propId, pattern);
        or = orLike(or, all, types, ",propKey,", syProp.propKey, pattern);
        or = orLike(or, all, types, ",propLabel,", syProp.propLabel, pattern);
        or = orLike(or, all, types, ",propRemark,", syProp.propRemark, pattern);
        or = orLike(or, all, types, ",propTypeCd,", syProp.propTypeCd, pattern);
        or = orLike(or, all, types, ",propValue,", syProp.propValue, pattern);
        or = orLike(or, all, types, ",siteId,", syProp.siteId, pattern);
        or = orLike(or, all, types, ",useYn,", syProp.useYn, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(SyPropDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {

            /* sortOrd ASC + regDate ASC (전역 정책) */
            orders.add(new OrderSpecifier<>(Order.ASC, syProp.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, syProp.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, syProp.propId));

            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("propId".equals(field)) {
                    orders.add(new OrderSpecifier(order, syProp.propId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, syProp.regDate));
                }
                else if ("sortOrd".equals(field)) { orders.add(new OrderSpecifier(order, syProp.sortOrd)); }
            }
        }
        /* unknown sort → sortOrd ASC + regDate ASC fallback */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.ASC, syProp.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, syProp.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, syProp.propId));
        }
        return orders;
    }

    /* 시스템 속성 수정 */
    @Override
    public int updateSelective(SyProp entity) {
        if (entity.getPropId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(syProp);
        boolean hasAny = false;

        if (entity.getSiteId()     != null) { update.set(syProp.siteId,     entity.getSiteId());     hasAny = true; }
        if (entity.getPathId()     != null) { update.set(syProp.pathId,     entity.getPathId());     hasAny = true; }
        if (entity.getPropKey()    != null) { update.set(syProp.propKey,    entity.getPropKey());    hasAny = true; }
        if (entity.getPropValue()  != null) { update.set(syProp.propValue,  entity.getPropValue());  hasAny = true; }
        if (entity.getPropLabel()  != null) { update.set(syProp.propLabel,  entity.getPropLabel());  hasAny = true; }
        if (entity.getPropTypeCd() != null) { update.set(syProp.propTypeCd, entity.getPropTypeCd()); hasAny = true; }
        if (entity.getSortOrd()    != null) { update.set(syProp.sortOrd,    entity.getSortOrd());    hasAny = true; }
        if (entity.getUseYn()      != null) { update.set(syProp.useYn,      entity.getUseYn());      hasAny = true; }
        if (entity.getPropRemark() != null) { update.set(syProp.propRemark, entity.getPropRemark()); hasAny = true; }
        if (entity.getUpdBy()      != null) { update.set(syProp.updBy,      entity.getUpdBy());      hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(syProp.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(syProp.propId.eq(entity.getPropId())).execute();
        return (int) affected;
    }

    /* 표시경로 노드별 sy_prop 수 집계 (자손 누적 + 검색조건 필터, native CTE 동적 SQL)
     *   반환: [{pathId, cnt}, ...] — '__total__' / '__orphan__' 특수 path 행 포함. */
    @Override
    public List<Map<String, Object>> selectPathTreePropCnts(SyPropDto.Request search) {
        StringBuilder sql = new StringBuilder();
        Map<String, Object> params = new LinkedHashMap<>();

        sql.append("/* " + QRY_SRC + " :: selectPathTreePropCnts() */\n");
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
                    SELECT prop_id, path_id
                    FROM sy_prop t
                    WHERE 1=1
                """);
        params.put("bizCd", "sy_prop");

        /* 검색조건 — pathtreeAnd*() 헬퍼로 SQL 조각 + 파라미터 함께 추가 */
        pathtreeAndUseYn(search, sql, params);
        pathtreeAndPropType(search, sql, params);
        pathtreeAndSearchValue(search, sql, params);
        pathtreeAndDateRange(search, sql, params);

        sql.append("""
                )
                  /* (1) 일반 path_id 행 : 노드 + 자손 누적 카운트 */
                  SELECT d.root_id AS path_id, COUNT(t.prop_id) AS cnt
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
     * selectPathTreePropCnts 전용 SQL 조건 헬퍼
     * ============================================================ */

    private void pathtreeAndUseYn(SyPropDto.Request s, StringBuilder sql, Map<String, Object> syProp) {
        if (s == null || !StringUtils.hasText(s.getUseYn())) return;
        sql.append("      AND t.use_yn = :useYn\n");
        syProp.put("useYn", s.getUseYn());
    }

    private void pathtreeAndPropType(SyPropDto.Request s, StringBuilder sql, Map<String, Object> syProp) {
        if (s == null || !StringUtils.hasText(s.getPropTypeCd())) return;
        sql.append("      AND t.prop_type_cd = :propType\n");
        syProp.put("propType", s.getPropTypeCd());
    }

    private void pathtreeAndSearchValue(SyPropDto.Request s, StringBuilder sql, Map<String, Object> syProp) {
        if (s == null || !StringUtils.hasText(s.getSearchValue())) return;
        String raw = s.getSearchType();
        boolean noType = !StringUtils.hasText(raw);
        String st = noType ? "" : "," + raw.trim() + ",";
        sql.append("      AND (\n");
        sql.append("            1=0\n");
        if (noType || st.contains(",propKey,"))   sql.append("         OR t.prop_key   ILIKE '%' || :searchValue || '%'\n");
        if (noType || st.contains(",propValue,")) sql.append("         OR t.prop_value ILIKE '%' || :searchValue || '%'\n");
        if (noType || st.contains(",propLabel,")) sql.append("         OR t.prop_label ILIKE '%' || :searchValue || '%'\n");
        sql.append("      )\n");
        syProp.put("searchValue", s.getSearchValue());
    }

    private void pathtreeAndDateRange(SyPropDto.Request s, StringBuilder sql, Map<String, Object> syProp) {
        if (s == null) return;
        if (StringUtils.hasText(s.getDateStart())) {
            sql.append("      AND t.reg_date >= CAST(:dateStart AS timestamp)\n");
            syProp.put("dateStart", s.getDateStart());
        }
        if (StringUtils.hasText(s.getDateEnd())) {
            sql.append("      AND t.reg_date <= CAST(:dateEnd   AS timestamp) + INTERVAL '1 day'\n");
            syProp.put("dateEnd", s.getDateEnd());
        }
    }
}
