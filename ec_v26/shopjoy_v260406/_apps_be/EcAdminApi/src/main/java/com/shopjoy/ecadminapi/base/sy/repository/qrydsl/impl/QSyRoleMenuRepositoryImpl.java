package com.shopjoy.ecadminapi.base.sy.repository.qrydsl.impl;

import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.data.BasePage;
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
import com.shopjoy.ecadminapi.base.sy.data.dto.SyRoleMenuDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyRoleMenu;
import com.shopjoy.ecadminapi.base.sy.data.entity.QVwSyRoleMenu;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyRoleMenu;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyRoleMenuRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

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
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_RANGE_FIELDS = Map.of(
        "reg_date", vwRoleMenu.regDate,
        "upd_date", vwRoleMenu.updDate
    );
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("menuId", vwRoleMenu.menuId),
        Map.entry("roleId", vwRoleMenu.roleId),
        Map.entry("roleMenuId", vwRoleMenu.roleMenuId),
    );

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
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<SyRoleMenuDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(
                QdslUtil.strEq(vwRoleMenu.roleMenuId, search.getRoleMenuId()),
                QdslUtil.strEq(vwRoleMenu.roleId, search.getRoleId()),
                QdslUtil.strEq(vwRoleMenu.menuId, search.getMenuId()),
                QdslUtil.dateBetween(search.getDateRangeType(), search.getDateRangeStart(), search.getDateRangeEnd(), DATE_RANGE_FIELDS),
                QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS)
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

    /* 역할별 메뉴 권한 페이지조회 */
    @Override
    public BasePage<SyRoleMenuDto.Item> selectPageData(SyRoleMenuDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(vwRoleMenu.roleMenuId, search.getRoleMenuId()),
                QdslUtil.strEq(vwRoleMenu.roleId, search.getRoleId()),
                QdslUtil.strEq(vwRoleMenu.menuId, search.getMenuId()),
                QdslUtil.dateBetween(search.getDateRangeType(), search.getDateRangeStart(), search.getDateRangeEnd(), DATE_RANGE_FIELDS),
                QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS)
        };

        // 공용 base: 뷰 기반 (list/count 가 동일한 from 공유)
        JPAQuery<SyRoleMenuDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<SyRoleMenuDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(vwRoleMenu.count())
                .where(wheres)
                .fetchOne();

        BasePage<SyRoleMenuDto.Item> res = new BasePage<>();
        return res.setPageInfo(content, CmUtil.nvlLong(total), pageNo, pageSize, search);
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(SyRoleMenuDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = QdslUtil.sortOf(s);
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, vwRoleMenu.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, vwRoleMenu.roleMenuId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("roleMenuId".equals(field)) {
                    orders.add(new OrderSpecifier(order, vwRoleMenu.roleMenuId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, vwRoleMenu.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, vwRoleMenu.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, vwRoleMenu.roleMenuId));
        }
        return orders;
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
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(syRoleMenu.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(syRoleMenu.roleMenuId.eq(entity.getRoleMenuId())).execute();
        return (int) affected;
    }
}
