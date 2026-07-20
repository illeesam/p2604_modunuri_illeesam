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
import com.shopjoy.ecadminapi.base.sy.data.dto.SyVendorUserRoleDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyRole;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUser;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyVendor;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyVendorUser;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyVendorUserRole;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyVendorUserRole;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyVendorUserRoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** SyVendorUserRole QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyVendorUserRoleRepositoryImpl implements QSyVendorUserRoleRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSyVendorUserRoleRepositoryImpl";
    private static final QSyVendorUserRole syVendorUserRole = QSyVendorUserRole.syVendorUserRole;
    private static final QSyVendor syVendor = QSyVendor.syVendor;
    private static final QSyVendorUser syVendorUser = QSyVendorUser.syVendorUser;
    private static final QSyRole syRole = QSyRole.syRole;
    private static final QSyUser syUser = QSyUser.syUser;
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_FIELDS = Map.of(
        "reg_date", syVendorUserRole.regDate,
        "upd_date", syVendorUserRole.updDate
    );
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("grantUserId", syVendorUserRole.grantUserId),
        Map.entry("roleId", syVendorUserRole.roleId),
        Map.entry("siteId", syVendorUserRole.siteId),
        Map.entry("userId", syVendorUserRole.userId),
        Map.entry("vendorId", syVendorUserRole.vendorId),
        Map.entry("vendorUserRoleId", syVendorUserRole.vendorUserRoleId),
        Map.entry("vendorUserRoleRemark", syVendorUserRole.vendorUserRoleRemark)
    );

    /* 업체 사용자 역할 연결 baseSelColumnQuery */
    private JPAQuery<SyVendorUserRoleDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(SyVendorUserRoleDto.Item.class,
                        syVendorUserRole.vendorUserRoleId, syVendorUserRole.vendorId, syVendorUserRole.userId, syVendorUserRole.roleId,
                        syVendorUserRole.grantUserId, syVendorUserRole.grantDate, syVendorUserRole.validFrom, syVendorUserRole.validTo,
                        syVendorUserRole.vendorUserRoleRemark,
                        syVendorUserRole.regBy, syVendorUserRole.regDate, syVendorUserRole.updBy, syVendorUserRole.updDate,
                        syVendor.vendorNm.as("vendorNm"),
                        syVendorUser.memberNm.as("memberNm"),
                        syRole.roleNm.as("roleNm"),
                        syUser.userNm.as("grantUserNm")
                ))
                .from(syVendorUserRole)
                .leftJoin(syVendor).on(syVendor.vendorId.eq(syVendorUserRole.vendorId))
                .leftJoin(syVendorUser).on(syVendorUser.vendorUserId.eq(syVendorUserRole.userId))
                .leftJoin(syRole).on(syRole.roleId.eq(syVendorUserRole.roleId))
                .leftJoin(syUser).on(syUser.userId.eq(syVendorUserRole.grantUserId));
    }

    /* 업체 사용자 역할 연결 키조회 */
    @Override
    public Optional<SyVendorUserRoleDto.Item> selectById(String vendorUserRoleId) {
        SyVendorUserRoleDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(syVendorUserRole.vendorUserRoleId.eq(vendorUserRoleId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 업체 사용자 역할 연결 목록조회 */
    @Override
    public List<SyVendorUserRoleDto.Item> selectList(SyVendorUserRoleDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<SyVendorUserRoleDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(
                QdslUtil.strEq(syVendorUserRole.vendorUserRoleId, search.getVendorUserRoleId()),
                QdslUtil.strEq(syVendorUserRole.vendorId, search.getVendorId()),
                QdslUtil.strEq(syVendorUserRole.userId, search.getUserId()),
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

    /* 업체 사용자 역할 연결 페이지조회 */
    @Override
    public SyVendorUserRoleDto.PageResponse selectPageData(SyVendorUserRoleDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(syVendorUserRole.vendorUserRoleId, search.getVendorUserRoleId()),
                QdslUtil.strEq(syVendorUserRole.vendorId, search.getVendorId()),
                QdslUtil.strEq(syVendorUserRole.userId, search.getUserId()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<SyVendorUserRoleDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<SyVendorUserRoleDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(syVendorUserRole.count())
                .where(wheres)
                .fetchOne();

        SyVendorUserRoleDto.PageResponse res = new SyVendorUserRoleDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

private BooleanExpression andSearchValueLike(SyVendorUserRoleDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
    }


    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(SyVendorUserRoleDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, syVendorUserRole.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, syVendorUserRole.vendorUserRoleId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("vendorUserRoleId".equals(field)) {
                    orders.add(new OrderSpecifier(order, syVendorUserRole.vendorUserRoleId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, syVendorUserRole.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, syVendorUserRole.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, syVendorUserRole.vendorUserRoleId));
        }
        return orders;
    }

    /* 업체 사용자 역할 연결 수정 */
    @Override
    public int updateSelective(SyVendorUserRole entity) {
        if (entity.getVendorUserRoleId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(syVendorUserRole);
        boolean hasAny = false;

        if (entity.getVendorId()             != null) { update.set(syVendorUserRole.vendorId,             entity.getVendorId());             hasAny = true; }
        if (entity.getUserId()               != null) { update.set(syVendorUserRole.userId,               entity.getUserId());               hasAny = true; }
        if (entity.getRoleId()               != null) { update.set(syVendorUserRole.roleId,               entity.getRoleId());               hasAny = true; }
        if (entity.getGrantUserId()          != null) { update.set(syVendorUserRole.grantUserId,          entity.getGrantUserId());          hasAny = true; }
        if (entity.getGrantDate()            != null) { update.set(syVendorUserRole.grantDate,            entity.getGrantDate());            hasAny = true; }
        if (entity.getValidFrom()            != null) { update.set(syVendorUserRole.validFrom,            entity.getValidFrom());            hasAny = true; }
        if (entity.getValidTo()              != null) { update.set(syVendorUserRole.validTo,              entity.getValidTo());              hasAny = true; }
        if (entity.getVendorUserRoleRemark() != null) { update.set(syVendorUserRole.vendorUserRoleRemark, entity.getVendorUserRoleRemark()); hasAny = true; }
        if (entity.getUpdBy()                != null) { update.set(syVendorUserRole.updBy,                entity.getUpdBy());                hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(syVendorUserRole.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(syVendorUserRole.vendorUserRoleId.eq(entity.getVendorUserRoleId())).execute();
        return (int) affected;
    }
}
