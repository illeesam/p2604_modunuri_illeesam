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
import com.shopjoy.ecadminapi.base.sy.data.dto.SyVendorUserDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUser;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyVendor;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyVendorUser;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyVendorUser;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyVendorUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
/** SyVendorUser QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyVendorUserRepositoryImpl implements QSyVendorUserRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSyVendorUserRepositoryImpl";
    private static final QSyVendorUser u = QSyVendorUser.syVendorUser;
    private static final QSySite ste = QSySite.sySite;
    private static final QSyVendor vnd = QSyVendor.syVendor;
    private static final QSyUser usr = QSyUser.syUser;
    private static final QSyCode cdP = new QSyCode("cd_p");
    private static final QSyCode cdVms = new QSyCode("cd_vms");

    /* 업체 사용자 buildBaseQuery */
    private JPAQuery<SyVendorUserDto.Item> buildBaseQuery() {
        return queryFactory
                .select(Projections.bean(SyVendorUserDto.Item.class,
                        u.vendorUserId, u.siteId, u.vendorId, u.userId,
                        u.memberNm, u.positionCd, u.vendorUserDeptNm,
                        u.vendorUserPhone, u.vendorUserMobile, u.vendorUserEmail,
                        u.birthDate, u.isMain, u.authYn, u.joinDate, u.leaveDate,
                        u.vendorUserStatusCd, u.vendorUserRemark,
                        u.regBy, u.regDate, u.updBy, u.updDate,
                        vnd.vendorNm.as("vendorNm")
                ))
                .from(u)
                .leftJoin(ste).on(ste.siteId.eq(u.siteId))
                .leftJoin(vnd).on(vnd.vendorId.eq(u.vendorId))
                .leftJoin(usr).on(usr.userId.eq(u.userId))
                .leftJoin(cdP).on(cdP.codeGrp.eq("POSITION").and(cdP.codeValue.eq(u.positionCd)))
                .leftJoin(cdVms).on(cdVms.codeGrp.eq("VENDOR_MEMBER_STATUS").and(cdVms.codeValue.eq(u.vendorUserStatusCd)));
    }

    /* 업체 사용자 키조회 */
    @Override
    public Optional<SyVendorUserDto.Item> selectById(String vendorUserId) {
        SyVendorUserDto.Item dto = buildBaseQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(u.vendorUserId.eq(vendorUserId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 업체 사용자 목록조회 */
    @Override
    public List<SyVendorUserDto.Item> selectList(SyVendorUserDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<SyVendorUserDto.Item> query = buildBaseQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(
                baseAndSiteId(search),
                baseAndVendorUserId(search),
                baseAndUserId(search),
                baseAndVendorId(search),
                baseAndStatus(search),
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

    /* 업체 사용자 페이지조회 */
    @Override
    public SyVendorUserDto.PageResponse selectPageList(SyVendorUserDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SyVendorUserDto.Item> query = buildBaseQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageList() :: list").where(
                baseAndSiteId(search),
                baseAndVendorUserId(search),
                baseAndUserId(search),
                baseAndVendorId(search),
                baseAndStatus(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<SyVendorUserDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(u.count()).from(u).where(
                baseAndSiteId(search),
                baseAndVendorUserId(search),
                baseAndUserId(search),
                baseAndVendorId(search),
                baseAndStatus(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        ).fetchOne();

        SyVendorUserDto.PageResponse res = new SyVendorUserDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* searchType 사용 예  searchType = "fieldA,fieldB" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(SyVendorUserDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? u.siteId.eq(search.getSiteId()) : null;
    }

    /* vendorUserId 정확 일치 */
    private BooleanExpression baseAndVendorUserId(SyVendorUserDto.Request search) {
        return search != null && StringUtils.hasText(search.getVendorUserId())
                ? u.vendorUserId.eq(search.getVendorUserId()) : null;
    }

    /* userId 정확 일치 */
    private BooleanExpression baseAndUserId(SyVendorUserDto.Request search) {
        return search != null && StringUtils.hasText(search.getUserId())
                ? u.userId.eq(search.getUserId()) : null;
    }

    /* vendorId 정확 일치 */
    private BooleanExpression baseAndVendorId(SyVendorUserDto.Request search) {
        return search != null && StringUtils.hasText(search.getVendorId())
                ? u.vendorId.eq(search.getVendorId()) : null;
    }

    /* vendorUserStatusCd 정확 일치 */
    private BooleanExpression baseAndStatus(SyVendorUserDto.Request search) {
        return search != null && StringUtils.hasText(search.getStatus())
                ? u.vendorUserStatusCd.eq(search.getStatus()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression baseAndDateRange(SyVendorUserDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return u.regDate.goe(start).and(u.regDate.lt(endExcl));
            case "upd_date": return u.updDate.goe(start).and(u.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(SyVendorUserDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",authYn,", u.authYn, pattern);
        or = orLike(or, all, types, ",isMain,", u.isMain, pattern);
        or = orLike(or, all, types, ",memberNm,", u.memberNm, pattern);
        or = orLike(or, all, types, ",positionCd,", u.positionCd, pattern);
        or = orLike(or, all, types, ",siteId,", u.siteId, pattern);
        or = orLike(or, all, types, ",userId,", u.userId, pattern);
        or = orLike(or, all, types, ",vendorId,", u.vendorId, pattern);
        or = orLike(or, all, types, ",vendorUserDeptNm,", u.vendorUserDeptNm, pattern);
        or = orLike(or, all, types, ",vendorUserEmail,", u.vendorUserEmail, pattern);
        or = orLike(or, all, types, ",vendorUserId,", u.vendorUserId, pattern);
        or = orLike(or, all, types, ",vendorUserMobile,", u.vendorUserMobile, pattern);
        or = orLike(or, all, types, ",vendorUserPhone,", u.vendorUserPhone, pattern);
        or = orLike(or, all, types, ",vendorUserRemark,", u.vendorUserRemark, pattern);
        or = orLike(or, all, types, ",vendorUserStatusCd,", u.vendorUserStatusCd, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(SyVendorUserDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, u.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, u.vendorUserId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("vendorUserId".equals(field)) {
                    orders.add(new OrderSpecifier(order, u.vendorUserId));
                } else if ("memberNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, u.memberNm));
                } else if ("joinDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, u.joinDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, u.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, u.vendorUserId));
        }
        return orders;
    }

    /* 업체 사용자 수정 */
    @Override
    public int updateSelective(SyVendorUser entity) {
        if (entity.getVendorUserId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(u);
        boolean hasAny = false;

        if (entity.getSiteId()             != null) { update.set(u.siteId,             entity.getSiteId());             hasAny = true; }
        if (entity.getVendorId()           != null) { update.set(u.vendorId,           entity.getVendorId());           hasAny = true; }
        if (entity.getUserId()             != null) { update.set(u.userId,             entity.getUserId());             hasAny = true; }
        if (entity.getMemberNm()           != null) { update.set(u.memberNm,           entity.getMemberNm());           hasAny = true; }
        if (entity.getPositionCd()         != null) { update.set(u.positionCd,         entity.getPositionCd());         hasAny = true; }
        if (entity.getVendorUserDeptNm()   != null) { update.set(u.vendorUserDeptNm,   entity.getVendorUserDeptNm());   hasAny = true; }
        if (entity.getVendorUserPhone()    != null) { update.set(u.vendorUserPhone,    entity.getVendorUserPhone());    hasAny = true; }
        if (entity.getVendorUserMobile()   != null) { update.set(u.vendorUserMobile,   entity.getVendorUserMobile());   hasAny = true; }
        if (entity.getVendorUserEmail()    != null) { update.set(u.vendorUserEmail,    entity.getVendorUserEmail());    hasAny = true; }
        if (entity.getBirthDate()          != null) { update.set(u.birthDate,          entity.getBirthDate());          hasAny = true; }
        if (entity.getIsMain()             != null) { update.set(u.isMain,             entity.getIsMain());             hasAny = true; }
        if (entity.getAuthYn()             != null) { update.set(u.authYn,             entity.getAuthYn());             hasAny = true; }
        if (entity.getJoinDate()           != null) { update.set(u.joinDate,           entity.getJoinDate());           hasAny = true; }
        if (entity.getLeaveDate()          != null) { update.set(u.leaveDate,          entity.getLeaveDate());          hasAny = true; }
        if (entity.getVendorUserStatusCd() != null) { update.set(u.vendorUserStatusCd, entity.getVendorUserStatusCd()); hasAny = true; }
        if (entity.getVendorUserRemark()   != null) { update.set(u.vendorUserRemark,   entity.getVendorUserRemark());   hasAny = true; }
        if (entity.getUpdBy()              != null) { update.set(u.updBy,              entity.getUpdBy());              hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(u.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(u.vendorUserId.eq(entity.getVendorUserId())).execute();
        return (int) affected;
    }
}
