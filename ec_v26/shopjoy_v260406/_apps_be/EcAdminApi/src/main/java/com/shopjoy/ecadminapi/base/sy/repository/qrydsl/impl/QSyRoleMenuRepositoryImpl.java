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
import com.shopjoy.ecadminapi.base.sy.data.dto.SyRoleMenuDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyRoleMenu;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
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
    private static final QSyRoleMenu syRoleMenu = QSyRoleMenu.syRoleMenu;
    private static final QSySite sySite = QSySite.sySite;
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_FIELDS = Map.of(
        "reg_date", syRoleMenu.regDate,
        "upd_date", syRoleMenu.updDate
    );
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("menuId", syRoleMenu.menuId),
        Map.entry("roleId", syRoleMenu.roleId),
        Map.entry("roleMenuId", syRoleMenu.roleMenuId),
        Map.entry("siteId", syRoleMenu.siteId)
    );

    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * PERM_LEVEL (sy_code 미등록, 숫자 코드 — DDL 주석 기준) {1: '조회', 2: '수정', 3: '삭제'}
     */
    private JPAQuery<SyRoleMenuDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(SyRoleMenuDto.Item.class,
                        syRoleMenu.roleMenuId,   // 역할메뉴ID
                        syRoleMenu.siteId,       // 사이트ID (sy_site.site_id)
                        syRoleMenu.roleId,       // 역할ID
                        syRoleMenu.menuId,       // 메뉴ID
                        syRoleMenu.permLevel,    // 권한레벨 — PERM_LEVEL {1: '조회', 2: '수정', 3: '삭제'}
                        syRoleMenu.regBy,        // 등록자
                        syRoleMenu.regDate,      // 등록일시
                        syRoleMenu.updBy,        // 수정자
                        syRoleMenu.updDate       // 수정일시
                ))
                .from(syRoleMenu)
                .leftJoin(sySite).on(sySite.siteId.eq(syRoleMenu.siteId));
    }

    /* 역할별 메뉴 권한 키조회 */
    @Override
    public Optional<SyRoleMenuDto.Item> selectById(String roleMenuId) {
        SyRoleMenuDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(syRoleMenu.roleMenuId.eq(roleMenuId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 역할별 메뉴 권한 목록조회 */
    @Override
    public List<SyRoleMenuDto.Item> selectList(SyRoleMenuDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<SyRoleMenuDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(
                QdslUtil.strEq(syRoleMenu.siteId, search.getSiteId()),
                QdslUtil.strEq(syRoleMenu.roleMenuId, search.getRoleMenuId()),
                QdslUtil.strEq(syRoleMenu.roleId, search.getRoleId()),
                QdslUtil.strEq(syRoleMenu.menuId, search.getMenuId()),
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

    /* 역할별 메뉴 권한 페이지조회 */
    @Override
    public SyRoleMenuDto.PageResponse selectPageData(SyRoleMenuDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(syRoleMenu.siteId, search.getSiteId()),
                QdslUtil.strEq(syRoleMenu.roleMenuId, search.getRoleMenuId()),
                QdslUtil.strEq(syRoleMenu.roleId, search.getRoleId()),
                QdslUtil.strEq(syRoleMenu.menuId, search.getMenuId()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
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
                .select(syRoleMenu.count())
                .where(wheres)
                .fetchOne();

        SyRoleMenuDto.PageResponse res = new SyRoleMenuDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

private BooleanExpression andSearchValueLike(SyRoleMenuDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
    }


    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(SyRoleMenuDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, syRoleMenu.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, syRoleMenu.roleMenuId));
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
                    orders.add(new OrderSpecifier(order, syRoleMenu.roleMenuId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, syRoleMenu.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, syRoleMenu.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, syRoleMenu.roleMenuId));
        }
        return orders;
    }

    /* 역할별 메뉴 권한 수정 */
    @Override
    public int updateSelective(SyRoleMenu entity) {
        if (entity.getRoleMenuId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(syRoleMenu);
        boolean hasAny = false;

        if (entity.getSiteId()    != null) { update.set(syRoleMenu.siteId,    entity.getSiteId());    hasAny = true; }
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
