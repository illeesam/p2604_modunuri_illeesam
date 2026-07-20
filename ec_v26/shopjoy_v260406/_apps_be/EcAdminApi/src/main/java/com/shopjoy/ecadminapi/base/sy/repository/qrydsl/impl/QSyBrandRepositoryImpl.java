package com.shopjoy.ecadminapi.base.sy.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.DateTimePath;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecadminapi.base.sy.repository.SyPathRepository;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyBrandDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyBrand;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyBrand;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyBrand;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyBrandRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** SyBrand QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyBrandRepositoryImpl implements QSyBrandRepository {

    private final JPAQueryFactory queryFactory;
    private final EntityManager em;
    private final SyPathRepository syPathRepository;
    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSyBrandRepositoryImpl";
    private static final QSyBrand syBrand = QSyBrand.syBrand;
    private static final QSySite sySite = QSySite.sySite;
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_FIELDS = Map.of(
        "reg_date", syBrand.regDate,
        "upd_date", syBrand.updDate
    );
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("brandCode", syBrand.brandCode),
        Map.entry("brandEnNm", syBrand.brandEnNm),
        Map.entry("brandId", syBrand.brandId),
        Map.entry("brandNm", syBrand.brandNm),
        Map.entry("brandRemark", syBrand.brandRemark),
        Map.entry("logoUrl", syBrand.logoUrl),
        Map.entry("pathId", syBrand.pathId),
        Map.entry("siteId", syBrand.siteId),
        Map.entry("useYn", syBrand.useYn),
        Map.entry("vendorId", syBrand.vendorId)
    );

    /* 브랜드 baseSelColumnQuery */
    private JPAQuery<SyBrandDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(SyBrandDto.Item.class,
                        syBrand.brandId, syBrand.siteId, syBrand.brandCode, syBrand.brandNm, syBrand.brandEnNm,
                        syBrand.pathId, syBrand.logoUrl, syBrand.vendorId, syBrand.sortOrd, syBrand.useYn,
                        syBrand.brandRemark,
                        syBrand.regBy, syBrand.regDate, syBrand.updBy, syBrand.updDate,
                        sySite.siteNm.as("siteNm")
                ))
                .from(syBrand)
                .leftJoin(sySite).on(sySite.siteId.eq(syBrand.siteId));
    }

    /* 브랜드 키조회 */
    @Override
    public Optional<SyBrandDto.Item> selectById(String brandId) {
        SyBrandDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(syBrand.brandId.eq(brandId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 브랜드 목록조회 */
    @Override
    public List<SyBrandDto.Item> selectList(SyBrandDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<SyBrandDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(
                QdslUtil.strEq(syBrand.siteId, search.getSiteId()),
                andPathIdIn(search),
                QdslUtil.strEq(syBrand.brandId, search.getBrandId()),
                QdslUtil.strEq(syBrand.vendorId, search.getVendorId()),
                QdslUtil.strEq(syBrand.useYn, search.getUseYn()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
        )
        .orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        return query.fetch();
    }

    /* 브랜드 페이지조회 */
    @Override
    public SyBrandDto.PageResponse selectPageData(SyBrandDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(syBrand.siteId, search.getSiteId()),
                andPathIdIn(search),
                QdslUtil.strEq(syBrand.brandId, search.getBrandId()),
                QdslUtil.strEq(syBrand.vendorId, search.getVendorId()),
                QdslUtil.strEq(syBrand.useYn, search.getUseYn()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<SyBrandDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<SyBrandDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(syBrand.count())
                .where(wheres)
                .fetchOne();

        SyBrandDto.PageResponse res = new SyBrandDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* searchType 사용 예  searchType = "fieldA,fieldB" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* 표시경로 트리 — 선택 노드 + 모든 자손 경로 포함 */
    private BooleanExpression andPathIdIn(SyBrandDto.Request search) {
        return search != null && StringUtils.hasText(search.getPathId())
                ? syBrand.pathId.in(syPathRepository.findTreePathIds(search.getPathId(), "sy_brand"))
                : null;
    }

private BooleanExpression andSearchValueLike(SyBrandDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
    }


    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(SyBrandDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {

            /* sortOrd ASC + regDate ASC (전역 정책) */
            orders.add(new OrderSpecifier<>(Order.ASC, syBrand.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, syBrand.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, syBrand.brandId));

            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("brandId".equals(field)) {
                    orders.add(new OrderSpecifier(order, syBrand.brandId));
                } else if ("brandNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, syBrand.brandNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, syBrand.regDate));
                }
                else if ("sortOrd".equals(field)) { orders.add(new OrderSpecifier(order, syBrand.sortOrd)); }
            }
        }
        /* unknown sort → sortOrd ASC + regDate ASC fallback */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.ASC, syBrand.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, syBrand.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, syBrand.brandId));
        }
        return orders;
    }

    /* 브랜드 수정 */
    @Override
    public int updateSelective(SyBrand entity) {
        if (entity.getBrandId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(syBrand);
        boolean hasAny = false;

        if (entity.getSiteId()      != null) { update.set(syBrand.siteId,      entity.getSiteId());      hasAny = true; }
        if (entity.getBrandCode()   != null) { update.set(syBrand.brandCode,   entity.getBrandCode());   hasAny = true; }
        if (entity.getBrandNm()     != null) { update.set(syBrand.brandNm,     entity.getBrandNm());     hasAny = true; }
        if (entity.getBrandEnNm()   != null) { update.set(syBrand.brandEnNm,   entity.getBrandEnNm());   hasAny = true; }
        if (entity.getPathId()      != null) { update.set(syBrand.pathId,      entity.getPathId());      hasAny = true; }
        if (entity.getLogoUrl()     != null) { update.set(syBrand.logoUrl,     entity.getLogoUrl());     hasAny = true; }
        if (entity.getVendorId()    != null) { update.set(syBrand.vendorId,    entity.getVendorId());    hasAny = true; }
        if (entity.getSortOrd()     != null) { update.set(syBrand.sortOrd,     entity.getSortOrd());     hasAny = true; }
        if (entity.getUseYn()       != null) { update.set(syBrand.useYn,       entity.getUseYn());       hasAny = true; }
        if (entity.getBrandRemark() != null) { update.set(syBrand.brandRemark, entity.getBrandRemark()); hasAny = true; }
        if (entity.getUpdBy()       != null) { update.set(syBrand.updBy,       entity.getUpdBy());       hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(syBrand.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(syBrand.brandId.eq(entity.getBrandId())).execute();
        return (int) affected;
    }

    /* 표시경로 노드별 sy_brand 수 집계 (자손 누적 + 검색조건 필터, native CTE 동적 SQL)
     *   반환: [{pathId, cnt}, ...] — '__total__' / '__orphan__' 특수 path 행 포함. */
    @Override
    public List<Map<String, Object>> selectPathTreeBrandCnts(SyBrandDto.Request search) {
        StringBuilder sql = new StringBuilder();
        Map<String, Object> params = new LinkedHashMap<>();

        sql.append("/* " + QRY_SRC + " :: selectPathTreeBrandCnts() */\n");
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
                    SELECT brand_id, path_id
                    FROM sy_brand t
                    WHERE 1=1
                """);
        params.put("bizCd", "sy_brand");

        /* 검색조건 — pathtreeAnd*() 헬퍼로 SQL 조각 + 파라미터 함께 추가 */
        pathtreeAndVendorId(search, sql, params);
        pathtreeAndSearchValue(search, sql, params);
        pathtreeAndDateRange(search, sql, params);

        sql.append("""
                )
                  /* (1) 일반 path_id 행 : 노드 + 자손 누적 카운트 */
                  SELECT d.root_id AS path_id, COUNT(t.brand_id) AS cnt
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
     * selectPathTreeBrandCnts 전용 SQL 조건 헬퍼
     * ============================================================ */

    private void pathtreeAndVendorId(SyBrandDto.Request s, StringBuilder sql, Map<String, Object> p) {
        if (s == null || !StringUtils.hasText(s.getVendorId())) return;
        sql.append("      AND t.vendor_id = :vendorId\n");
        p.put("vendorId", s.getVendorId());
    }

    private void pathtreeAndSearchValue(SyBrandDto.Request s, StringBuilder sql, Map<String, Object> p) {
        if (s == null || !StringUtils.hasText(s.getSearchValue())) return;
        String raw = s.getSearchType();
        boolean noType = !StringUtils.hasText(raw);
        String st = noType ? "" : "," + raw.trim() + ",";
        sql.append("      AND (\n");
        sql.append("            1=0\n");
        if (noType || st.contains(",brandCode,")) sql.append("         OR t.brand_code  ILIKE '%' || :searchValue || '%'\n");
        if (noType || st.contains(",brandNm,"))   sql.append("         OR t.brand_nm    ILIKE '%' || :searchValue || '%'\n");
        if (noType || st.contains(",brandEnNm,")) sql.append("         OR t.brand_en_nm ILIKE '%' || :searchValue || '%'\n");
        sql.append("      )\n");
        p.put("searchValue", s.getSearchValue());
    }

    private void pathtreeAndDateRange(SyBrandDto.Request s, StringBuilder sql, Map<String, Object> p) {
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
