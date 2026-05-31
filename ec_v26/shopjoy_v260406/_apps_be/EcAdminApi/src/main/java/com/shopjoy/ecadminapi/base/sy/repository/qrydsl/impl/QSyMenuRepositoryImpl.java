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
import com.shopjoy.ecadminapi.base.sy.repository.SyMenuRepository;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyMenuDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyMenu;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyMenu;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyMenuRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Lazy;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
/** SyMenu QueryDSL Custom 구현체 */
public class QSyMenuRepositoryImpl implements QSyMenuRepository {

    private final JPAQueryFactory queryFactory;
    private final EntityManager em;
    private final SyMenuRepository syMenuRepository;
    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSyMenuRepositoryImpl";
    private static final QSyMenu m = QSyMenu.syMenu;

    public QSyMenuRepositoryImpl(JPAQueryFactory queryFactory, @Lazy SyMenuRepository syMenuRepository, EntityManager em) {
        this.queryFactory = queryFactory;
        this.syMenuRepository = syMenuRepository;
        this.em = em;
    }
    private static final QSySite ste = QSySite.sySite;
    private static final QSyCode cdMt = new QSyCode("cd_mt");

    /* 메뉴 buildBaseQuery */
    private JPAQuery<SyMenuDto.Item> buildBaseQuery() {
        return queryFactory
                .select(Projections.bean(SyMenuDto.Item.class,
                        m.menuId, m.siteId, m.menuCode, m.menuNm, m.parentMenuId,
                        m.menuUrl, m.menuTypeCd, m.iconClass, m.sortOrd, m.useYn,
                        m.menuRemark,
                        m.regBy, m.regDate, m.updBy, m.updDate,
                        ste.siteNm.as("siteNm")
                ))
                .from(m)
                .leftJoin(ste).on(ste.siteId.eq(m.siteId))
                .leftJoin(cdMt).on(cdMt.codeGrp.eq("MENU_TYPE").and(cdMt.codeValue.eq(m.menuTypeCd)));
    }

    /* 메뉴 키조회 */
    @Override
    public Optional<SyMenuDto.Item> selectById(String menuId) {
        SyMenuDto.Item dto = buildBaseQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(m.menuId.eq(menuId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 메뉴 목록조회 */
    @Override
    public List<SyMenuDto.Item> selectList(SyMenuDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<SyMenuDto.Item> query = buildBaseQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(
                baseAndSiteId(search),
                baseAndMenuId(search),
                baseAndMenuTypeCd(search),
                baseAndUseYn(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        Integer pageNo = search == null ? null : search.getPageNo();
        Integer pageSize = search == null ? null : search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            query.offset(offset).limit(pageSize);
        }
        return query.fetch();
    }

    /* 메뉴 페이지조회 */
    @Override
    public SyMenuDto.PageResponse selectPageList(SyMenuDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SyMenuDto.Item> query = buildBaseQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageList() :: list").where(
                baseAndSiteId(search),
                baseAndMenuId(search),
                baseAndMenuTypeCd(search),
                baseAndUseYn(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<SyMenuDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(m.count()).from(m).where(
                baseAndSiteId(search),
                baseAndMenuId(search),
                baseAndMenuTypeCd(search),
                baseAndUseYn(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        ).fetchOne();

        SyMenuDto.PageResponse res = new SyMenuDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* searchType 사용 예  searchType = "fieldA,fieldB" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(SyMenuDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? m.siteId.eq(search.getSiteId()) : null;
    }

    /* menuId 정확 일치 */
    private BooleanExpression baseAndMenuId(SyMenuDto.Request search) {
        return search != null && StringUtils.hasText(search.getMenuId())
                ? m.menuId.eq(search.getMenuId()) : null;
    }

    /* menuTypeCd 정확 일치 */
    private BooleanExpression baseAndMenuTypeCd(SyMenuDto.Request search) {
        return search != null && StringUtils.hasText(search.getMenuTypeCd())
                ? m.menuTypeCd.eq(search.getMenuTypeCd()) : null;
    }

    /* useYn 정확 일치 */
    private BooleanExpression baseAndUseYn(SyMenuDto.Request search) {
        return search != null && StringUtils.hasText(search.getUseYn())
                ? m.useYn.eq(search.getUseYn()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression baseAndDateRange(SyMenuDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return m.regDate.goe(start).and(m.regDate.lt(endExcl));
            case "upd_date": return m.updDate.goe(start).and(m.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(SyMenuDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",iconClass,", m.iconClass, pattern);
        or = orLike(or, all, types, ",menuCode,", m.menuCode, pattern);
        or = orLike(or, all, types, ",menuId,", m.menuId, pattern);
        or = orLike(or, all, types, ",menuNm,", m.menuNm, pattern);
        or = orLike(or, all, types, ",menuRemark,", m.menuRemark, pattern);
        or = orLike(or, all, types, ",menuTypeCd,", m.menuTypeCd, pattern);
        or = orLike(or, all, types, ",menuUrl,", m.menuUrl, pattern);
        or = orLike(or, all, types, ",parentMenuId,", m.parentMenuId, pattern);
        or = orLike(or, all, types, ",siteId,", m.siteId, pattern);
        or = orLike(or, all, types, ",useYn,", m.useYn, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(SyMenuDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {

            /* sortOrd ASC + regDate ASC (전역 정책) */
            orders.add(new OrderSpecifier<>(Order.ASC, m.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, m.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, m.menuId));

            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("menuId".equals(field)) {
                    orders.add(new OrderSpecifier(order, m.menuId));
                } else if ("menuNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, m.menuNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, m.regDate));
                }
                else if ("sortOrd".equals(field)) { orders.add(new OrderSpecifier(order, m.sortOrd)); }
            }
        }
        /* unknown sort → sortOrd ASC + regDate ASC fallback */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.ASC, m.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, m.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, m.menuId));
        }
        return orders;
    }

    /* 메뉴 수정 */
    @Override
    public int updateSelective(SyMenu entity) {
        if (entity.getMenuId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(m);
        boolean hasAny = false;

        if (entity.getSiteId()       != null) { update.set(m.siteId,       entity.getSiteId());       hasAny = true; }
        if (entity.getMenuCode()     != null) { update.set(m.menuCode,     entity.getMenuCode());     hasAny = true; }
        if (entity.getMenuNm()       != null) { update.set(m.menuNm,       entity.getMenuNm());       hasAny = true; }
        if (entity.getParentMenuId() != null) { update.set(m.parentMenuId, entity.getParentMenuId()); hasAny = true; }
        if (entity.getMenuUrl()      != null) { update.set(m.menuUrl,      entity.getMenuUrl());      hasAny = true; }
        if (entity.getMenuTypeCd()   != null) { update.set(m.menuTypeCd,   entity.getMenuTypeCd());   hasAny = true; }
        if (entity.getIconClass()    != null) { update.set(m.iconClass,    entity.getIconClass());    hasAny = true; }
        if (entity.getSortOrd()      != null) { update.set(m.sortOrd,      entity.getSortOrd());      hasAny = true; }
        if (entity.getUseYn()        != null) { update.set(m.useYn,        entity.getUseYn());        hasAny = true; }
        if (entity.getMenuRemark()   != null) { update.set(m.menuRemark,   entity.getMenuRemark());   hasAny = true; }
        if (entity.getUpdBy()        != null) { update.set(m.updBy,        entity.getUpdBy());        hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(m.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(m.menuId.eq(entity.getMenuId())).execute();
        return (int) affected;
    }

    /* 표시경로 노드별 sy_menu 수 집계 (자손 누적 + 검색조건 필터, native CTE 동적 SQL)
     *   반환: [{pathId, cnt}, ...] — '__total__' / '__orphan__' 특수 path 행 포함. */
    @Override
    public List<Map<String, Object>> findPathSyMenuTreeNodeCounts(SyMenuDto.Request search) {
        StringBuilder sql = new StringBuilder();
        Map<String, Object> params = new LinkedHashMap<>();

        sql.append("/* " + QRY_SRC + " :: findPathSyMenuTreeNodeCounts() */\n");
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
                    SELECT menu_id, menu_code
                    FROM sy_menu t
                    WHERE 1=1
                """);
        params.put("bizCd", "sy_menu");

        if (search != null && StringUtils.hasText(search.getUseYn())) {
            sql.append("      AND t.use_yn = :useYn\n");
            params.put("useYn", search.getUseYn());
        }
        if (search != null && StringUtils.hasText(search.getSearchValue())) {
            String raw = search.getSearchType();

            boolean noType = !StringUtils.hasText(raw);

            String searchType = noType ? "" : "," + raw.trim() + ",";
            sql.append("      AND (\n");
            sql.append("            1=0\n");
            if (noType || searchType.contains(",menuCode,")) sql.append("         OR t.menu_code ILIKE '%' || :searchValue || '%'\n");
            if (noType || searchType.contains(",menuNm,")) sql.append("         OR t.menu_nm ILIKE '%' || :searchValue || '%'\n");
            if (noType || searchType.contains(",menuRemark,")) sql.append("         OR t.menu_remark ILIKE '%' || :searchValue || '%'\n");
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
                  SELECT d.root_id AS path_id, COUNT(t.menu_id) AS cnt
                  FROM descendants d
                    LEFT JOIN filtered t ON t.menu_code = d.leaf_id
                  GROUP BY d.root_id
                UNION ALL
                  /* (2) '__total__' : 트리 루트 "전체" 노드용 — 검색조건에 부합하는 전체 카운트 */
                  SELECT '__total__' AS path_id, COUNT(*) AS cnt
                  FROM filtered
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
