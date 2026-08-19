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
import com.shopjoy.ecadminapi.base.sy.data.dto.SyVendorUserRoleDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyRole;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUser;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyVendor;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyVendorUser;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyVendorUserRole;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyVendorUserRole;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyVendorUserRoleRepository;
import lombok.RequiredArgsConstructor;

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
    private static final QSyUser syUser = QSyUser.syUser;    /* 업체 사용자 역할 연결 baseSelColumnQuery — 코드성 필드 없음 (역할명은 조인으로 획득) */
    private JPAQuery<SyVendorUserRoleDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(SyVendorUserRoleDto.Item.class,
                        syVendorUserRole.vendorUserRoleId,          // 업체사용자역할ID (PK)
                        syVendorUserRole.vendorId,                  // 업체ID (sy_vendor.vendor_id)
                        syVendorUserRole.userId,                    // 업체사용자ID (sy_vendor_user.vendor_user_id)
                        syVendorUserRole.roleId,                    // 역할ID (sy_role.role_id)
                        syVendorUserRole.grantUserId,                // 역할 부여자 (sy_user.user_id)
                        syVendorUserRole.grantDate,                  // 역할 부여일시
                        syVendorUserRole.validFrom,                  // 유효 시작일
                        syVendorUserRole.validTo,                    // 유효 종료일
                        syVendorUserRole.vendorUserRoleRemark,       // 비고
                        syVendorUserRole.regBy,                      // 등록자
                        syVendorUserRole.regDate,                    // 등록일시
                        syVendorUserRole.updBy,                      // 수정자
                        syVendorUserRole.updDate,                    // 수정일시
                        syVendor.vendorNm.as("vendorNm"),            // 업체명 (조인: sy_vendor)
                        syVendorUser.memberNm.as("memberNm"),        // 업체사용자 이름 (조인: sy_vendor_user)
                        syRole.roleNm.as("roleNm"),                  // 역할명 (조인: sy_role)
                        syUser.userNm.as("grantUserNm")              // 부여자명 (조인: sy_user)
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
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        /* 검색조건 — 배열 초기화 { } 대신 리스트에 하나씩 add 한다.
           .where(a, b, c) 인자 자리나 배열 초기화 { } 안에는 식(expression)만 올 수 있어
           if 를 쓸 수 없지만, 리스트에 담으면 분기 조건을 if 로 그대로 풀어 쓸 수 있다.
           null 을 add 해도 QueryDSL where 가 무시하므로 기존 "조건 없으면 null" 관례 그대로 유효. */
        List<BooleanExpression> wheres = new ArrayList<>();
        wheres.add(QdslUtil.strEq(syVendorUserRole.vendorUserRoleId, search.getVendorUserRoleId()));
        wheres.add(QdslUtil.strEq(syVendorUserRole.vendorId, search.getVendorId()));
        wheres.add(QdslUtil.strEq(syVendorUserRole.userId, search.getUserId()));
        /* 기간검색 — dateRangeType 값에 따라 대상 컬럼을 직접 지정 */
        if ("upd_date".equals(search.getDateRangeType())) {
            wheres.add(QdslUtil.dateBetween(syVendorUserRole.updDate, search.getDateRangeStart(), search.getDateRangeEnd()));
        } else {
            wheres.add(QdslUtil.dateBetween(syVendorUserRole.regDate, search.getDateRangeStart(), search.getDateRangeEnd()));   // reg_date (기본)
        }
        wheres.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        JPAQuery<SyVendorUserRoleDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(wheres.toArray(BooleanExpression[]::new))
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
    public BasePage<SyVendorUserRoleDto.Item> selectPageData(SyVendorUserRoleDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        /* 검색조건 — 배열 초기화 { } 대신 리스트에 하나씩 add 한다.
           .where(a, b, c) 인자 자리나 배열 초기화 { } 안에는 식(expression)만 올 수 있어
           if 를 쓸 수 없지만, 리스트에 담으면 분기 조건을 if 로 그대로 풀어 쓸 수 있다.
           null 을 add 해도 QueryDSL where 가 무시하므로 기존 "조건 없으면 null" 관례 그대로 유효. */
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(syVendorUserRole.vendorUserRoleId, search.getVendorUserRoleId()));
        whereList.add(QdslUtil.strEq(syVendorUserRole.vendorId, search.getVendorId()));
        whereList.add(QdslUtil.strEq(syVendorUserRole.userId, search.getUserId()));
        /* 기간검색 — dateRangeType 값에 따라 대상 컬럼을 직접 지정 */
        if ("upd_date".equals(search.getDateRangeType())) {
            whereList.add(QdslUtil.dateBetween(syVendorUserRole.updDate, search.getDateRangeStart(), search.getDateRangeEnd()));
        } else if ("reg_date".equals(search.getDateRangeType())) {
            whereList.add(QdslUtil.dateBetween(syVendorUserRole.regDate, search.getDateRangeStart(), search.getDateRangeEnd()));
        }
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

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

        BasePage<SyVendorUserRoleDto.Item> res = new BasePage<>();
        return res.setPageInfo(content, CmUtil.nvlLong(total), pageNo, pageSize, search);
    }

    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("grantUserId", syVendorUserRole.grantUserId),
            QdslUtil.FieldDef.like("roleId", syVendorUserRole.roleId),
            QdslUtil.FieldDef.like("userId", syVendorUserRole.userId),
            QdslUtil.FieldDef.like("vendorId", syVendorUserRole.vendorId),
            QdslUtil.FieldDef.like("vendorUserRoleId", syVendorUserRole.vendorUserRoleId),
            QdslUtil.FieldDef.like("vendorUserRoleRemark", syVendorUserRole.vendorUserRoleRemark)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("vendorUserRoleId", syVendorUserRole.vendorUserRoleId,
                   "regDate", syVendorUserRole.regDate),
        new OrderSpecifier<>(Order.DESC, syVendorUserRole.regDate),
        new OrderSpecifier<>(Order.ASC, syVendorUserRole.vendorUserRoleId));
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
