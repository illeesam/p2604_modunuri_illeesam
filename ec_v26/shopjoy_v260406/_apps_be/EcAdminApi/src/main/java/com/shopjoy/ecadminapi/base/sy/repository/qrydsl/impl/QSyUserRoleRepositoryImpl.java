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
import com.shopjoy.ecadminapi.base.sy.data.dto.SyUserRoleDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyRole;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUser;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUserRole;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyUserRole;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyUserRoleRepository;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** SyUserRole(관리자 사용자-역할 매핑 (N:M)) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyUserRoleRepositoryImpl implements QSyUserRoleRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSyUserRoleRepositoryImpl";
    private static final QSyUserRole syUserRole = QSyUserRole.syUserRole;
    private static final QSyUser usr  = new QSyUser("usr");
    private static final QSyRole syRole  = QSyRole.syRole;
    private static final QSyUser usr2 = new QSyUser("usr2");    /* 사용자별 역할 baseSelColumnQuery — 코드성 필드 없음 (역할명/역할코드는 조인으로 획득) */
    private JPAQuery<SyUserRoleDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(SyUserRoleDto.Item.class,
                        syUserRole.userRoleId,                    // 사용자역할ID (PK, YYMMDDhhmmss+rand4)
                        syUserRole.userId,                        // 사용자ID (sy_user.user_id, UNIQUE with role_id)
                        syUserRole.roleId,                        // 역할ID (sy_role.role_id, UNIQUE with user_id)
                        syUserRole.grantUserId,                   // 부여자 (sy_user.user_id)
                        syUserRole.grantDate,                     // 부여일시
                        syUserRole.validFrom,                     // 적용 시작일
                        syUserRole.validTo,                       // 적용 종료일
                        syUserRole.userRoleRemark,                // 비고
                        syUserRole.regBy,                         // 등록자
                        syUserRole.regDate,                       // 등록일시
                        syUserRole.updBy,                         // 수정자
                        syUserRole.updDate,                       // 수정일시
                        syRole.roleNm.as("roleNm"),               // 역할명 (조인: sy_role)
                        syRole.roleCode.as("roleCode"),           // 역할코드 (조인: sy_role)
                        usr2.userNm.as("grantUserNm")             // 부여자명 (조인: sy_user, alias usr2)
                ))
                .from(syUserRole)
                .innerJoin(usr).on(usr.userId.eq(syUserRole.userId)) // 사용자
                .innerJoin(syRole).on(syRole.roleId.eq(syUserRole.roleId)) // 역할
                .leftJoin(usr2).on(usr2.userId.eq(syUserRole.grantUserId)) // 사용자
                ;
    }

    /* 사용자별 역할 키조회 */
    @Override
    public Optional<SyUserRoleDto.Item> selectById(String userRoleId) {
        SyUserRoleDto.Item dtl = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(syUserRole.userRoleId.eq(userRoleId))
                .fetchOne();
        return Optional.ofNullable(dtl);
    }

    /* 사용자별 역할 목록조회 */
    @Override
    public List<SyUserRoleDto.Item> selectList(SyUserRoleDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(syUserRole.userRoleId, search.getUserRoleId()));
        whereList.add(QdslUtil.strEq(syUserRole.userId, search.getUserId()));
        whereList.add(QdslUtil.strEq(syUserRole.roleId, search.getRoleId()));
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(syUserRole.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(syUserRole.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<SyUserRoleDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(wheres)
        .orderBy(orders);
        Integer pageNo = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        List<SyUserRoleDto.Item> list = query.fetch();
        return list;
    }

    /* 사용자별 역할 페이지조회 */
    @Override
    public BasePage<SyUserRoleDto.Item> selectPageData(SyUserRoleDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(syUserRole.userRoleId, search.getUserRoleId()));
        whereList.add(QdslUtil.strEq(syUserRole.userId, search.getUserId()));
        whereList.add(QdslUtil.strEq(syUserRole.roleId, search.getRoleId()));
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(syUserRole.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(syUserRole.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        JPAQuery<SyUserRoleDto.Item> query = baseSelColumnQuery();

        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<SyUserRoleDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(syUserRole.count())
                .where(wheres)
                .fetchOne();

        BasePage<SyUserRoleDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }

    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("grantUserId", syUserRole.grantUserId),
            QdslUtil.FieldDef.like("roleId", syUserRole.roleId),
            QdslUtil.FieldDef.like("userId", syUserRole.userId),
            QdslUtil.FieldDef.like("userRoleId", syUserRole.userRoleId),
            QdslUtil.FieldDef.like("userRoleRemark", syUserRole.userRoleRemark)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("userRoleId", syUserRole.userRoleId,
                   "regDate", syUserRole.regDate),
        new OrderSpecifier<>(Order.DESC, syUserRole.regDate),
        new OrderSpecifier<>(Order.ASC, syUserRole.userRoleId));
    }

    /* 사용자별 역할 수정 */
    @Override
    public int updateSelective(SyUserRole entity) {
        if (entity.getUserRoleId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(syUserRole);
        boolean hasAny = false;

        if (entity.getUserId()         != null) { update.set(syUserRole.userId,         entity.getUserId());         hasAny = true; }
        if (entity.getRoleId()         != null) { update.set(syUserRole.roleId,         entity.getRoleId());         hasAny = true; }
        if (entity.getGrantUserId()    != null) { update.set(syUserRole.grantUserId,    entity.getGrantUserId());    hasAny = true; }
        if (entity.getGrantDate()      != null) { update.set(syUserRole.grantDate,      entity.getGrantDate());      hasAny = true; }
        if (entity.getValidFrom()      != null) { update.set(syUserRole.validFrom,      entity.getValidFrom());      hasAny = true; }
        if (entity.getValidTo()        != null) { update.set(syUserRole.validTo,        entity.getValidTo());        hasAny = true; }
        if (entity.getUserRoleRemark() != null) { update.set(syUserRole.userRoleRemark, entity.getUserRoleRemark()); hasAny = true; }
        if (entity.getUpdBy()          != null) { update.set(syUserRole.updBy,          entity.getUpdBy());          hasAny = true; }
        update.set(syUserRole.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(syUserRole.userRoleId.eq(entity.getUserRoleId())).execute();
        return (int) affected;
    }
}
