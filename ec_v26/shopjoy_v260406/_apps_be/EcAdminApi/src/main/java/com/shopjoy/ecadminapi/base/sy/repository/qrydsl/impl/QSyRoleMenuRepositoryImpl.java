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
import com.shopjoy.ecadminapi.base.sy.data.dto.SyRoleMenuDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyRoleMenu;
import com.shopjoy.ecadminapi.base.sy.data.entity.QVwSyRoleMenu;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyRoleMenu;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyRoleMenuRepository;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** SyRoleMenu QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyRoleMenuRepositoryImpl implements QSyRoleMenuRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSyRoleMenuRepositoryImpl";
    private static final QVwSyRoleMenu vwRoleMenu = QVwSyRoleMenu.vwSyRoleMenu; // SELECT 전용 — sy_role JOIN 내장
    private static final QSyRoleMenu syRoleMenu = QSyRoleMenu.syRoleMenu;       // UPDATE 전용 (updateSelective)
    /*
     * baseSelColumnQuery — vw_sy_role_menu 뷰 사용 (sy_role_menu INNER JOIN sy_role)
     * roleNm / roleCode 등 sy_role 컬럼을 추가 JOIN 없이 직접 조회
     * PERM_LEVEL (sy_code 미등록, 숫자 코드 — DDL 주석 기준) {1: '조회', 2: '수정', 3: '삭제'}
     */
    private JPAQuery<SyRoleMenuDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(SyRoleMenuDto.Item.class,
                        vwRoleMenu.roleMenuId,   // 역할메뉴ID
                        vwRoleMenu.roleId,       // 역할ID
                        vwRoleMenu.menuId,       // 메뉴ID
                        vwRoleMenu.permLevel,    // 권한레벨 — PERM_LEVEL {1: '조회', 2: '수정', 3: '삭제'}
                        vwRoleMenu.regBy,        // 등록자
                        vwRoleMenu.regDate,      // 등록일시
                        vwRoleMenu.updBy,        // 수정자
                        vwRoleMenu.updDate,      // 수정일시
                        vwRoleMenu.roleNm        // 역할명 (vw_sy_role_menu에 sy_role JOIN 내장)
                ))
                .from(vwRoleMenu);
        // JOIN 불필요 — vw_sy_role_menu 뷰에 sy_role 정보가 내장됨
    }

    /* 역할별 메뉴 권한 키조회 */
    @Override
    public Optional<SyRoleMenuDto.Item> selectById(String roleMenuId) {
        SyRoleMenuDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(vwRoleMenu.roleMenuId.eq(roleMenuId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 역할별 메뉴 권한 목록조회 */
    @Override
    public List<SyRoleMenuDto.Item> selectList(SyRoleMenuDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(vwRoleMenu.roleMenuId, search.getRoleMenuId()));
        whereList.add(QdslUtil.strEq(vwRoleMenu.roleId, search.getRoleId()));
        whereList.add(QdslUtil.strEq(vwRoleMenu.menuId, search.getMenuId()));
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(vwRoleMenu.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(vwRoleMenu.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<SyRoleMenuDto.Item> query = baseSelColumnQuery()
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

    /* 역할별 메뉴 권한 페이지조회 */
    @Override
    public BasePage<SyRoleMenuDto.Item> selectPageData(SyRoleMenuDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(vwRoleMenu.roleMenuId, search.getRoleMenuId()));
        whereList.add(QdslUtil.strEq(vwRoleMenu.roleId, search.getRoleId()));
        whereList.add(QdslUtil.strEq(vwRoleMenu.menuId, search.getMenuId()));
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(vwRoleMenu.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(vwRoleMenu.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        // 공용 base: 뷰 기반 (list/count 가 동일한 from 공유)
        JPAQuery<SyRoleMenuDto.Item> query = baseSelColumnQuery();

        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<SyRoleMenuDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(vwRoleMenu.count())
                .where(wheres)
                .fetchOne();

        BasePage<SyRoleMenuDto.Item> res = new BasePage<>();
        return res.setPageInfo(content, CmUtil.nvlLong(total), pageNo, pageSize, search);
    }

    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("menuId", vwRoleMenu.menuId),
            QdslUtil.FieldDef.like("roleId", vwRoleMenu.roleId),
            QdslUtil.FieldDef.like("roleMenuId", vwRoleMenu.roleMenuId)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("roleMenuId", vwRoleMenu.roleMenuId,
                   "regDate", vwRoleMenu.regDate),
        new OrderSpecifier<>(Order.DESC, vwRoleMenu.regDate),
        new OrderSpecifier<>(Order.ASC, vwRoleMenu.roleMenuId));
    }

    /* 역할별 메뉴 권한 수정 — 원본 QSyRoleMenu 엔티티 사용 (뷰는 READ-ONLY) */
    @Override
    public int updateSelective(SyRoleMenu entity) {
        if (entity.getRoleMenuId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(syRoleMenu);
        boolean hasAny = false;

        if (entity.getRoleId()    != null) { update.set(syRoleMenu.roleId,    entity.getRoleId());    hasAny = true; }
        if (entity.getMenuId()    != null) { update.set(syRoleMenu.menuId,    entity.getMenuId());    hasAny = true; }
        if (entity.getPermLevel() != null) { update.set(syRoleMenu.permLevel, entity.getPermLevel()); hasAny = true; }
        if (entity.getUpdBy()     != null) { update.set(syRoleMenu.updBy,     entity.getUpdBy());     hasAny = true; }
        update.set(syRoleMenu.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(syRoleMenu.roleMenuId.eq(entity.getRoleMenuId())).execute();
        return (int) affected;
    }
}
