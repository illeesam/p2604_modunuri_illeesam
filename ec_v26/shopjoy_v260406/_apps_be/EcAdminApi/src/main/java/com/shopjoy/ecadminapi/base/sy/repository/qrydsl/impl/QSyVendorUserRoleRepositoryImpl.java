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
import com.shopjoy.ecadminapi.base.sy.repository.SyRoleRepository;
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

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
/** SyVendorUserRole QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyVendorUserRoleRepositoryImpl implements QSyVendorUserRoleRepository {

    private final JPAQueryFactory queryFactory;
    private final SyRoleRepository syRoleRepository;
    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSyVendorUserRoleRepositoryImpl";
    private static final QSyVendorUserRole syVendorUserRole = QSyVendorUserRole.syVendorUserRole;
    private static final QSyVendor syVendor = QSyVendor.syVendor;
    private static final QSyVendorUser syVendorUser = QSyVendorUser.syVendorUser;
    private static final QSyRole syRole = QSyRole.syRole;
    private static final QSyUser syUser = QSyUser.syUser;

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
                baseAndVendorUserRoleId(search),
                baseAndVendorId(search),
                baseAndUserId(search),
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

    /* 업체 사용자 역할 연결 페이지조회 */
    @Override
    public SyVendorUserRoleDto.PageResponse selectPageData(SyVendorUserRoleDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                baseAndVendorUserRoleId(search),
                baseAndVendorId(search),
                baseAndUserId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        };

        JPAQuery<SyVendorUserRoleDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list").where(wheres);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<SyVendorUserRoleDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(syVendorUserRole.count()).from(syVendorUserRole).where(wheres).fetchOne();

        SyVendorUserRoleDto.PageResponse res = new SyVendorUserRoleDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 업체 사용자 역할 연결 buildCondition */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* vendorUserRoleId 정확 일치 */
    private BooleanExpression baseAndVendorUserRoleId(SyVendorUserRoleDto.Request search) {
        return search != null && StringUtils.hasText(search.getVendorUserRoleId())
                ? syVendorUserRole.vendorUserRoleId.eq(search.getVendorUserRoleId()) : null;
    }

    /* vendorId 정확 일치 */
    private BooleanExpression baseAndVendorId(SyVendorUserRoleDto.Request search) {
        return search != null && StringUtils.hasText(search.getVendorId())
                ? syVendorUserRole.vendorId.eq(search.getVendorId()) : null;
    }

    /* userId 정확 일치 */
    private BooleanExpression baseAndUserId(SyVendorUserRoleDto.Request search) {
        return search != null && StringUtils.hasText(search.getUserId())
                ? syVendorUserRole.userId.eq(search.getUserId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression baseAndDateRange(SyVendorUserRoleDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return syVendorUserRole.regDate.goe(start).and(syVendorUserRole.regDate.lt(endExcl));
            case "upd_date": return syVendorUserRole.updDate.goe(start).and(syVendorUserRole.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(SyVendorUserRoleDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",grantUserId,", syVendorUserRole.grantUserId, pattern);
        or = orLike(or, all, types, ",roleId,", syVendorUserRole.roleId, pattern);
        or = orLike(or, all, types, ",siteId,", syVendorUserRole.siteId, pattern);
        or = orLike(or, all, types, ",userId,", syVendorUserRole.userId, pattern);
        or = orLike(or, all, types, ",vendorId,", syVendorUserRole.vendorId, pattern);
        or = orLike(or, all, types, ",vendorUserRoleId,", syVendorUserRole.vendorUserRoleId, pattern);
        or = orLike(or, all, types, ",vendorUserRoleRemark,", syVendorUserRole.vendorUserRoleRemark, pattern);
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
