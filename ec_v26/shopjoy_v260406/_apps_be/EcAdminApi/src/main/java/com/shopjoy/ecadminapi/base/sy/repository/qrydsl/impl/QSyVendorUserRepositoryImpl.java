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

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** SyVendorUser QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyVendorUserRepositoryImpl implements QSyVendorUserRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSyVendorUserRepositoryImpl";
    private static final QSyVendorUser syVendorUser = QSyVendorUser.syVendorUser;
    private static final QSySite sySite = QSySite.sySite;
    private static final QSyVendor syVendor = QSyVendor.syVendor;
    private static final QSyUser syUser = QSyUser.syUser;
    private static final QSyCode cdP = new QSyCode("cd_p");
    private static final QSyCode cdVms = new QSyCode("cd_vms");
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_FIELDS = Map.of(
        "reg_date", syVendorUser.regDate,
        "upd_date", syVendorUser.updDate
    );
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("authYn", syVendorUser.authYn),
        Map.entry("isMain", syVendorUser.isMain),
        Map.entry("memberNm", syVendorUser.memberNm),
        Map.entry("positionCd", syVendorUser.positionCd),
        Map.entry("siteId", syVendorUser.siteId),
        Map.entry("userId", syVendorUser.userId),
        Map.entry("vendorId", syVendorUser.vendorId),
        Map.entry("vendorUserDeptNm", syVendorUser.vendorUserDeptNm),
        Map.entry("vendorUserEmail", syVendorUser.vendorUserEmail),
        Map.entry("vendorUserId", syVendorUser.vendorUserId),
        Map.entry("vendorUserMobile", syVendorUser.vendorUserMobile),
        Map.entry("vendorUserPhone", syVendorUser.vendorUserPhone),
        Map.entry("vendorUserRemark", syVendorUser.vendorUserRemark),
        Map.entry("vendorUserStatusCd", syVendorUser.vendorUserStatusCd)
    );

    /* 업체 사용자 baseSelColumnQuery */
    private JPAQuery<SyVendorUserDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(SyVendorUserDto.Item.class,
                        syVendorUser.vendorUserId, syVendorUser.siteId, syVendorUser.vendorId, syVendorUser.userId,
                        syVendorUser.memberNm, syVendorUser.positionCd, syVendorUser.vendorUserDeptNm,
                        syVendorUser.vendorUserPhone, syVendorUser.vendorUserMobile, syVendorUser.vendorUserEmail,
                        syVendorUser.birthDate, syVendorUser.isMain, syVendorUser.authYn, syVendorUser.joinDate, syVendorUser.leaveDate,
                        syVendorUser.vendorUserStatusCd, syVendorUser.vendorUserRemark,
                        syVendorUser.regBy, syVendorUser.regDate, syVendorUser.updBy, syVendorUser.updDate,
                        syVendor.vendorNm.as("vendorNm")
                ))
                .from(syVendorUser)
                .leftJoin(sySite).on(sySite.siteId.eq(syVendorUser.siteId))
                .leftJoin(syVendor).on(syVendor.vendorId.eq(syVendorUser.vendorId))
                .leftJoin(syUser).on(syUser.userId.eq(syVendorUser.userId))
                .leftJoin(cdP).on(cdP.codeGrp.eq("POSITION").and(cdP.codeValue.eq(syVendorUser.positionCd)))
                .leftJoin(cdVms).on(cdVms.codeGrp.eq("VENDOR_MEMBER_STATUS").and(cdVms.codeValue.eq(syVendorUser.vendorUserStatusCd)));
    }

    /* 업체 사용자 키조회 */
    @Override
    public Optional<SyVendorUserDto.Item> selectById(String vendorUserId) {
        SyVendorUserDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(syVendorUser.vendorUserId.eq(vendorUserId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 업체 사용자 목록조회 */
    @Override
    public List<SyVendorUserDto.Item> selectList(SyVendorUserDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<SyVendorUserDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(
                QdslUtil.strEq(syVendorUser.siteId, search.getSiteId()),
                QdslUtil.strEq(syVendorUser.vendorUserId, search.getVendorUserId()),
                QdslUtil.strEq(syVendorUser.userId, search.getUserId()),
                QdslUtil.strEq(syVendorUser.vendorId, search.getVendorId()),
                QdslUtil.strEq(syVendorUser.vendorUserStatusCd, search.getStatus()),
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

    /* 업체 사용자 페이지조회 */
    @Override
    public SyVendorUserDto.PageResponse selectPageData(SyVendorUserDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(syVendorUser.siteId, search.getSiteId()),
                QdslUtil.strEq(syVendorUser.vendorUserId, search.getVendorUserId()),
                QdslUtil.strEq(syVendorUser.userId, search.getUserId()),
                QdslUtil.strEq(syVendorUser.vendorId, search.getVendorId()),
                QdslUtil.strEq(syVendorUser.vendorUserStatusCd, search.getStatus()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<SyVendorUserDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<SyVendorUserDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(syVendorUser.count())
                .where(wheres)
                .fetchOne();

        SyVendorUserDto.PageResponse res = new SyVendorUserDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* searchType 사용 예  searchType = "fieldA,fieldB" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

private BooleanExpression andSearchValueLike(SyVendorUserDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
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
            orders.add(new OrderSpecifier(Order.DESC, syVendorUser.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, syVendorUser.vendorUserId));
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
                    orders.add(new OrderSpecifier(order, syVendorUser.vendorUserId));
                } else if ("memberNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, syVendorUser.memberNm));
                } else if ("joinDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, syVendorUser.joinDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, syVendorUser.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, syVendorUser.vendorUserId));
        }
        return orders;
    }

    /* 업체 사용자 수정 */
    @Override
    public int updateSelective(SyVendorUser entity) {
        if (entity.getVendorUserId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(syVendorUser);
        boolean hasAny = false;

        if (entity.getSiteId()             != null) { update.set(syVendorUser.siteId,             entity.getSiteId());             hasAny = true; }
        if (entity.getVendorId()           != null) { update.set(syVendorUser.vendorId,           entity.getVendorId());           hasAny = true; }
        if (entity.getUserId()             != null) { update.set(syVendorUser.userId,             entity.getUserId());             hasAny = true; }
        if (entity.getMemberNm()           != null) { update.set(syVendorUser.memberNm,           entity.getMemberNm());           hasAny = true; }
        if (entity.getPositionCd()         != null) { update.set(syVendorUser.positionCd,         entity.getPositionCd());         hasAny = true; }
        if (entity.getVendorUserDeptNm()   != null) { update.set(syVendorUser.vendorUserDeptNm,   entity.getVendorUserDeptNm());   hasAny = true; }
        if (entity.getVendorUserPhone()    != null) { update.set(syVendorUser.vendorUserPhone,    entity.getVendorUserPhone());    hasAny = true; }
        if (entity.getVendorUserMobile()   != null) { update.set(syVendorUser.vendorUserMobile,   entity.getVendorUserMobile());   hasAny = true; }
        if (entity.getVendorUserEmail()    != null) { update.set(syVendorUser.vendorUserEmail,    entity.getVendorUserEmail());    hasAny = true; }
        if (entity.getBirthDate()          != null) { update.set(syVendorUser.birthDate,          entity.getBirthDate());          hasAny = true; }
        if (entity.getIsMain()             != null) { update.set(syVendorUser.isMain,             entity.getIsMain());             hasAny = true; }
        if (entity.getAuthYn()             != null) { update.set(syVendorUser.authYn,             entity.getAuthYn());             hasAny = true; }
        if (entity.getJoinDate()           != null) { update.set(syVendorUser.joinDate,           entity.getJoinDate());           hasAny = true; }
        if (entity.getLeaveDate()          != null) { update.set(syVendorUser.leaveDate,          entity.getLeaveDate());          hasAny = true; }
        if (entity.getVendorUserStatusCd() != null) { update.set(syVendorUser.vendorUserStatusCd, entity.getVendorUserStatusCd()); hasAny = true; }
        if (entity.getVendorUserRemark()   != null) { update.set(syVendorUser.vendorUserRemark,   entity.getVendorUserRemark());   hasAny = true; }
        if (entity.getUpdBy()              != null) { update.set(syVendorUser.updBy,              entity.getUpdBy());              hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(syVendorUser.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(syVendorUser.vendorUserId.eq(entity.getVendorUserId())).execute();
        return (int) affected;
    }
}
