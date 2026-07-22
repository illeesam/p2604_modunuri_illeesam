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
import com.shopjoy.ecadminapi.base.sy.data.dto.SyUserRoleDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyRole;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUser;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUserRole;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyUserRole;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyUserRoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** SyUserRole QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyUserRoleRepositoryImpl implements QSyUserRoleRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSyUserRoleRepositoryImpl";
    private static final QSyUserRole syUserRole = QSyUserRole.syUserRole;
    private static final QSyUser usr  = new QSyUser("usr");
    private static final QSyRole syRole  = QSyRole.syRole;
    private static final QSyUser usr2 = new QSyUser("usr2");
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_FIELDS = Map.of(
        "reg_date", syUserRole.regDate,
        "upd_date", syUserRole.updDate
    );
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("grantUserId", syUserRole.grantUserId),
        Map.entry("roleId", syUserRole.roleId),
        Map.entry("siteId", syUserRole.siteId),
        Map.entry("userId", syUserRole.userId),
        Map.entry("userRoleId", syUserRole.userRoleId),
        Map.entry("userRoleRemark", syUserRole.userRoleRemark)
    );

    /* 사용자별 역할 baseSelColumnQuery — 코드성 필드 없음 (역할명/역할코드는 조인으로 획득) */
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
                .leftJoin(usr).on(usr.userId.eq(syUserRole.userId))
                .leftJoin(syRole).on(syRole.roleId.eq(syUserRole.roleId))
                .leftJoin(usr2).on(usr2.userId.eq(syUserRole.grantUserId));
    }

    /* 사용자별 역할 키조회 */
    @Override
    public Optional<SyUserRoleDto.Item> selectById(String userRoleId) {
        SyUserRoleDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(syUserRole.userRoleId.eq(userRoleId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 사용자별 역할 목록조회 */
    @Override
    public List<SyUserRoleDto.Item> selectList(SyUserRoleDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<SyUserRoleDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(
                QdslUtil.strEq(syUserRole.userRoleId, search.getUserRoleId()),
                QdslUtil.strEq(syUserRole.userId, search.getUserId()),
                QdslUtil.strEq(syUserRole.roleId, search.getRoleId()),
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

    /* 사용자별 역할 페이지조회 */
    @Override
    public SyUserRoleDto.PageResponse selectPageData(SyUserRoleDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(syUserRole.userRoleId, search.getUserRoleId()),
                QdslUtil.strEq(syUserRole.userId, search.getUserId()),
                QdslUtil.strEq(syUserRole.roleId, search.getRoleId()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<SyUserRoleDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<SyUserRoleDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(syUserRole.count())
                .where(wheres)
                .fetchOne();

        SyUserRoleDto.PageResponse res = new SyUserRoleDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    private BooleanExpression andSearchValueLike(SyUserRoleDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
    }


    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(SyUserRoleDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, syUserRole.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, syUserRole.userRoleId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("userRoleId".equals(field)) {
                    orders.add(new OrderSpecifier(order, syUserRole.userRoleId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, syUserRole.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, syUserRole.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, syUserRole.userRoleId));
        }
        return orders;
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
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(syUserRole.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(syUserRole.userRoleId.eq(entity.getUserRoleId())).execute();
        return (int) affected;
    }
}
