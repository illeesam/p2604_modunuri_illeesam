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
import com.shopjoy.ecadminapi.base.sy.repository.SyMenuRepository;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyMenuDto;

import com.shopjoy.ecadminapi.base.sy.data.entity.QVwSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyMenu;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyMenu;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyMenuRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import org.springframework.context.annotation.Lazy;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** SyMenu QueryDSL Custom 구현체 */
public class QSyMenuRepositoryImpl implements QSyMenuRepository {

    private final JPAQueryFactory queryFactory;
    private final EntityManager em;
    private final SyMenuRepository syMenuRepository;
    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSyMenuRepositoryImpl";
    private static final QSyMenu syMenu = QSyMenu.syMenu;

    public QSyMenuRepositoryImpl(JPAQueryFactory queryFactory, @Lazy SyMenuRepository syMenuRepository, EntityManager em) {
        this.queryFactory = queryFactory;
        this.syMenuRepository = syMenuRepository;
        this.em = em;
    }
    private static final QVwSyCode cdMt = new QVwSyCode("cd_mt");    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * MENU_TYPE {PAGE: '페이지', FOLDER: '폴더', LINK: '링크'}
     * USE_YN    {Y: '사용', N: '미사용'}
     */
    private JPAQuery<SyMenuDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(SyMenuDto.Item.class,
                        syMenu.menuId,         // 메뉴ID (YYMMDDhhmmss+rand4)
                        syMenu.menuCode,       // 메뉴코드
                        syMenu.menuNm,         // 메뉴명
                        syMenu.parentMenuId,   // 상위메뉴ID
                        syMenu.menuUrl,        // 메뉴URL
                        syMenu.menuTypeCd,     // 메뉴유형 — MENU_TYPE {PAGE: '페이지', FOLDER: '폴더', LINK: '링크'}
                        syMenu.iconClass,      // 아이콘 CSS 클래스
                        syMenu.sortOrd,        // 정렬순서
                        syMenu.useYn,          // 사용여부 — USE_YN {Y: '사용', N: '미사용'}
                        syMenu.menuRemark,     // 비고
                        syMenu.regBy,          // 등록자
                        syMenu.regDate,        // 등록일시
                        syMenu.updBy,          // 수정자
                        syMenu.updDate        // 수정일시
                ))
                .from(syMenu)
                .leftJoin(cdMt).on(cdMt.codeGrp.eq("MENU_TYPE_CD").and(cdMt.codeValue.eq(syMenu.menuTypeCd)));
    }

    /* 메뉴 키조회 */
    @Override
    public Optional<SyMenuDto.Item> selectById(String menuId) {
        SyMenuDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(syMenu.menuId.eq(menuId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 메뉴 목록조회 */
    @Override
    public List<SyMenuDto.Item> selectList(SyMenuDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(andMenuIdIn(search));
        whereList.add(QdslUtil.strEq(syMenu.menuTypeCd, search.getMenuTypeCd()));
        whereList.add(QdslUtil.strEq(syMenu.useYn, search.getUseYn()));
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(syMenu.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(syMenu.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<SyMenuDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(wheres)
        .orderBy(orders);
        Integer pageNo = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        return query.fetch();
    }

    /* 메뉴 페이지조회 */
    @Override
    public BasePage<SyMenuDto.Item> selectPageData(SyMenuDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(andMenuIdIn(search));
        whereList.add(QdslUtil.strEq(syMenu.menuTypeCd, search.getMenuTypeCd()));
        whereList.add(QdslUtil.strEq(syMenu.useYn, search.getUseYn()));
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(syMenu.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(syMenu.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        JPAQuery<SyMenuDto.Item> query = baseSelColumnQuery();

        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<SyMenuDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(syMenu.count())
                .where(wheres)
                .fetchOne();

        BasePage<SyMenuDto.Item> res = new BasePage<>();
        return res.setPageInfo(content, CmUtil.nvlLong(total), pageNo, pageSize, search);
    }

    /* searchType 사용 예  searchType = "fieldA,fieldB" */

    /* menuId 트리 — 선택 노드 + 모든 자손 메뉴 포함 (sy_menu 자기참조 재귀 CTE 인라인) */
    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("iconClass", syMenu.iconClass),
            QdslUtil.FieldDef.like("menuCode", syMenu.menuCode),
            QdslUtil.FieldDef.like("menuId", syMenu.menuId),
            QdslUtil.FieldDef.like("menuNm", syMenu.menuNm),
            QdslUtil.FieldDef.like("menuRemark", syMenu.menuRemark),
            QdslUtil.FieldDef.like("menuTypeCd", syMenu.menuTypeCd),
            QdslUtil.FieldDef.like("menuUrl", syMenu.menuUrl),
            QdslUtil.FieldDef.like("parentMenuId", syMenu.parentMenuId),
            QdslUtil.FieldDef.like("useYn", syMenu.useYn)
        ));
    }

    @SuppressWarnings("unchecked")
    private BooleanExpression andMenuIdIn(SyMenuDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getMenuId())) return null;
        String sql = "WITH RECURSIVE t AS ( "
                  + "  SELECT menu_id FROM sy_menu WHERE menu_id = :rootMenuId "
                  + "  UNION ALL "
                  + "  SELECT c.menu_id FROM sy_menu c JOIN t ON c.parent_menu_id = t.menu_id "
                  + ") SELECT menu_id FROM t";
        Query q = em.createNativeQuery(sql);
        q.setParameter("rootMenuId", search.getMenuId());
        List<String> menuIds = (List<String>) q.getResultList();
        return syMenu.menuId.in(menuIds);
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("menuId", syMenu.menuId,
                   "menuNm", syMenu.menuNm,
                   "regDate", syMenu.regDate,
                   "sortOrd", syMenu.sortOrd),
        new OrderSpecifier<>(Order.ASC, syMenu.sortOrd),
        new OrderSpecifier<>(Order.ASC, syMenu.regDate),
        new OrderSpecifier<>(Order.ASC, syMenu.menuId));
    }

    /* 메뉴 수정 */
    @Override
    public int updateSelective(SyMenu entity) {
        if (entity.getMenuId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(syMenu);
        boolean hasAny = false;

        if (entity.getMenuCode()     != null) { update.set(syMenu.menuCode,     entity.getMenuCode());     hasAny = true; }
        if (entity.getMenuNm()       != null) { update.set(syMenu.menuNm,       entity.getMenuNm());       hasAny = true; }
        if (entity.getParentMenuId() != null) { update.set(syMenu.parentMenuId, entity.getParentMenuId()); hasAny = true; }
        if (entity.getMenuUrl()      != null) { update.set(syMenu.menuUrl,      entity.getMenuUrl());      hasAny = true; }
        if (entity.getMenuTypeCd()   != null) { update.set(syMenu.menuTypeCd,   entity.getMenuTypeCd());   hasAny = true; }
        if (entity.getIconClass()    != null) { update.set(syMenu.iconClass,    entity.getIconClass());    hasAny = true; }
        if (entity.getSortOrd()      != null) { update.set(syMenu.sortOrd,      entity.getSortOrd());      hasAny = true; }
        if (entity.getUseYn()        != null) { update.set(syMenu.useYn,        entity.getUseYn());        hasAny = true; }
        if (entity.getMenuRemark()   != null) { update.set(syMenu.menuRemark,   entity.getMenuRemark());   hasAny = true; }
        if (entity.getUpdBy()        != null) { update.set(syMenu.updBy,        entity.getUpdBy());        hasAny = true; }
        update.set(syMenu.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(syMenu.menuId.eq(entity.getMenuId())).execute();
        return (int) affected;
    }

    /* 메뉴 트리 노드별 sy_menu 수 집계 (자기참조 자손 누적 + 검색조건 필터, native CTE 동적 SQL)
     *   sy_menu 는 sy_menu.parent_menu_id 자기참조 트리 — sy_path 와 무관.
     *   반환: [{pathId, cnt}, ...] — pathId 는 menu_id 값. '__total__' 특수 행 포함. */
    @Override
    public List<Map<String, Object>> selectMenuTreeCnts(SyMenuDto.Request search) {
        StringBuilder sql = new StringBuilder();
        Map<String, Object> params = new LinkedHashMap<>();

        sql.append("/* " + QRY_SRC + " :: selectMenuTreeCnts() */\n");
        sql.append("""
                WITH RECURSIVE descendants /* 각 menu 의 자손 menu_id (자신 포함) */ AS (
                    SELECT menu_id AS root_id, menu_id AS leaf_id
                    FROM sy_menu
                    UNION ALL
                    SELECT d.root_id, c.menu_id
                    FROM descendants d
                    JOIN sy_menu c ON c.parent_menu_id = d.leaf_id
                ),
                filtered /* 검색조건이 적용된 행 */ AS (
                    SELECT menu_id
                    FROM sy_menu t
                    WHERE 1=1
                """);

        /* 검색조건 — menutreeAnd*() 헬퍼로 SQL 조각 + 파라미터 함께 추가 */
        menutreeAndUseYn(search, sql, params);
        menutreeAndSearchValue(search, sql, params);
        menutreeAndDateRange(search, sql, params);

        sql.append("""
                )
                  /* (1) 일반 menu_id 행 : 노드 + 자손 누적 카운트 */
                  SELECT d.root_id AS menu_id, COUNT(t.menu_id) AS cnt
                  FROM descendants d
                    LEFT JOIN filtered t ON t.menu_id = d.leaf_id
                  GROUP BY d.root_id
                UNION ALL
                  /* (2) '__total__' : 트리 루트 "전체" 노드용 — 검색조건에 부합하는 전체 카운트 */
                  SELECT '__total__' AS menu_id, COUNT(*) AS cnt
                  FROM filtered
                """);

        Query q = em.createNativeQuery(sql.toString());
        params.forEach(q::setParameter);

        @SuppressWarnings("unchecked")
        List<Object[]> rows = (List<Object[]>) q.getResultList();

        List<Map<String, Object>> result = new ArrayList<>(rows.size());
        for (Object[] row : rows) {
            Map<String, Object> syMenu = new LinkedHashMap<>();
            syMenu.put("menuId", row[0] == null ? null : String.valueOf(row[0]));
            syMenu.put("cnt",    row[1] == null ? 0L   : ((Number) row[1]).longValue());
            result.add(syMenu);
        }
        return result;
    }

    /* ============================================================
     * selectMenuTreeCnts 전용 SQL 조건 헬퍼 (menutree prefix)
     * ============================================================ */

    private void menutreeAndUseYn(SyMenuDto.Request s, StringBuilder sql, Map<String, Object> p) {
        if (s == null || !StringUtils.hasText(s.getUseYn())) return;
        sql.append("      AND t.use_yn = :useYn\n");
        p.put("useYn", s.getUseYn());
    }

    private void menutreeAndSearchValue(SyMenuDto.Request s, StringBuilder sql, Map<String, Object> p) {
        if (s == null || !StringUtils.hasText(s.getSearchValue())) return;
        String raw = s.getSearchType();
        boolean noType = !StringUtils.hasText(raw);
        String st = noType ? "" : "," + raw.trim() + ",";
        sql.append("      AND (\n");
        sql.append("            1=0\n");
        if (noType || st.contains(",menuCode,"))   sql.append("         OR t.menu_code   ILIKE '%' || :searchValue || '%'\n");
        if (noType || st.contains(",menuNm,"))     sql.append("         OR t.menu_nm     ILIKE '%' || :searchValue || '%'\n");
        if (noType || st.contains(",menuRemark,")) sql.append("         OR t.menu_remark ILIKE '%' || :searchValue || '%'\n");
        sql.append("      )\n");
        p.put("searchValue", s.getSearchValue());
    }

    private void menutreeAndDateRange(SyMenuDto.Request s, StringBuilder sql, Map<String, Object> p) {
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
