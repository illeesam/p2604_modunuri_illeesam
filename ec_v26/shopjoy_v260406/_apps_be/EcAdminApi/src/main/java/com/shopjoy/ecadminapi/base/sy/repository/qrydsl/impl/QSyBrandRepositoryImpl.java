package com.shopjoy.ecadminapi.base.sy.repository.qrydsl.impl;

import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.data.BasePage;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.DateTimePath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecadminapi.base.sy.repository.SyPathRepository;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyBrandDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyBrand;
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
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_RANGE_FIELDS = Map.of("reg_date", syBrand.regDate,
        "upd_date", syBrand.updDate
    );

    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * USE_YN {Y: '사용', N: '미사용'}
     */
    private JPAQuery<SyBrandDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(SyBrandDto.Item.class,
                        syBrand.brandId,      // 브랜드ID (YYMMDDhhmmss+rand4)
                        syBrand.brandCode,    // 브랜드코드
                        syBrand.brandNm,      // 브랜드명 (한글)
                        syBrand.brandEnNm,    // 브랜드영문명
                        syBrand.pathId,       // 점(.) 구분 표시경로 (트리 빌드용)
                        syBrand.logoUrl,      // 로고URL
                        syBrand.vendorId,     // 업체ID
                        syBrand.sortOrd,      // 정렬순서
                        syBrand.useYn,        // 사용여부 — USE_YN {Y: '사용', N: '미사용'}
                        syBrand.brandRemark,  // 비고
                        syBrand.regBy,        // 등록자
                        syBrand.regDate,      // 등록일시
                        syBrand.updBy,        // 수정자
                        syBrand.updDate      // 수정일시
                ))
                .from(syBrand);
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
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        JPAQuery<SyBrandDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(
                andPathIdIn(search),
                QdslUtil.strEq(syBrand.brandId, search.getBrandId()),
                QdslUtil.strEq(syBrand.vendorId, search.getVendorId()),
                QdslUtil.strEq(syBrand.useYn, search.getUseYn()),
                QdslUtil.dateBetween(search.getDateRangeType(), search.getDateRangeStart(), search.getDateRangeEnd(), DATE_RANGE_FIELDS),
                andSearchValue(search.getSearchValue(), search.getSearchType())
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
    public BasePage<SyBrandDto.Item> selectPageData(SyBrandDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        BooleanExpression[] wheres = {
                andPathIdIn(search),
                QdslUtil.strEq(syBrand.brandId, search.getBrandId()),
                QdslUtil.strEq(syBrand.vendorId, search.getVendorId()),
                QdslUtil.strEq(syBrand.useYn, search.getUseYn()),
                QdslUtil.dateBetween(search.getDateRangeType(), search.getDateRangeStart(), search.getDateRangeEnd(), DATE_RANGE_FIELDS),
                andSearchValue(search.getSearchValue(), search.getSearchType())
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

        BasePage<SyBrandDto.Item> res = new BasePage<>();
        return res.setPageInfo(content, CmUtil.nvlLong(total), pageNo, pageSize, search);
    }

    /* searchType 사용 예  searchType = "fieldA,fieldB" */

    /* 표시경로 트리 — 선택 노드 + 모든 자손 경로 포함 */
    private BooleanExpression andPathIdIn(SyBrandDto.Request search) {
        return search != null && StringUtils.hasText(search.getPathId())
                ? syBrand.pathId.in(syPathRepository.findTreePathIds(search.getPathId(), "sy_brand"))
                : null;
    }

    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("brandCode", syBrand.brandCode),
            QdslUtil.FieldDef.like("brandEnNm", syBrand.brandEnNm),
            QdslUtil.FieldDef.like("brandId", syBrand.brandId),
            QdslUtil.FieldDef.like("brandNm", syBrand.brandNm),
            QdslUtil.FieldDef.like("brandRemark", syBrand.brandRemark),
            QdslUtil.FieldDef.like("logoUrl", syBrand.logoUrl),
            QdslUtil.FieldDef.like("pathId", syBrand.pathId),
            QdslUtil.FieldDef.like("useYn", syBrand.useYn),
            QdslUtil.FieldDef.like("vendorId", syBrand.vendorId)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("brandId", syBrand.brandId,
                   "brandNm", syBrand.brandNm,
                   "regDate", syBrand.regDate,
                   "sortOrd", syBrand.sortOrd),
        new OrderSpecifier<>(Order.ASC, syBrand.sortOrd),
        new OrderSpecifier<>(Order.ASC, syBrand.regDate),
        new OrderSpecifier<>(Order.ASC, syBrand.brandId));
    }

    /* 브랜드 수정 */
    @Override
    public int updateSelective(SyBrand entity) {
        if (entity.getBrandId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(syBrand);
        boolean hasAny = false;

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
        if (StringUtils.hasText(s.getDateRangeStart())) {
            sql.append("      AND t.reg_date >= CAST(:dateRangeStart AS timestamp)\n");
            p.put("dateRangeStart", s.getDateRangeStart());
        }
        if (StringUtils.hasText(s.getDateRangeEnd())) {
            sql.append("      AND t.reg_date <= CAST(:dateRangeEnd   AS timestamp) + INTERVAL '23:59:59.999999'\n");
            p.put("dateRangeEnd", s.getDateRangeEnd());
        }
    }
}
