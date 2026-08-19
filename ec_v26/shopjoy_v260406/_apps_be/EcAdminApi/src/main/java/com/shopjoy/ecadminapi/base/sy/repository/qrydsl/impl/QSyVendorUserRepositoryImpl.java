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
import com.shopjoy.ecadminapi.base.sy.data.dto.SyVendorUserDto;

import com.shopjoy.ecadminapi.base.sy.data.entity.QVwSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUser;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyVendor;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyVendorUser;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyVendorUser;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyVendorUserRepository;
import lombok.RequiredArgsConstructor;

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
    private static final QSyVendor syVendor = QSyVendor.syVendor;
    private static final QSyUser syUser = QSyUser.syUser;
    private static final QVwSyCode cdP = new QVwSyCode("cd_p");
    private static final QVwSyCode cdVms = new QVwSyCode("cd_vms");    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * POSITION               {CEO: '대표', DIRECTOR: '이사', MANAGER: '팀장', EMPLOYEE: '담당자'}
     * VENDOR_MEMBER_STATUS   (sy_code 미등록 — 실제 코드값 미확인, 업체 담당자 재직상태 구분 코드로만 사용)
     */
    /* 업체 사용자 baseSelColumnQuery */
    private JPAQuery<SyVendorUserDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(SyVendorUserDto.Item.class,
                        syVendorUser.vendorUserId,                 // 판매/배송업체사용자ID (PK)
                        syVendorUser.vendorId,                     // 판매/배송업체ID (sy_vendor.vendor_id)
                        syVendorUser.userId,                       // 사용자ID (sy_user.user_id, NULL=비로그인)
                        syVendorUser.memberNm,                     // 이름
                        syVendorUser.positionCd,                   // 직위/직책 — POSITION {CEO: '대표', DIRECTOR: '이사', MANAGER: '팀장', EMPLOYEE: '담당자'}
                        syVendorUser.vendorUserDeptNm,             // 부서/팀명
                        syVendorUser.vendorUserPhone,              // 사무실 전화
                        syVendorUser.vendorUserMobile,             // 휴대전화
                        syVendorUser.vendorUserEmail,              // 이메일
                        syVendorUser.birthDate,                    // 생년월일
                        syVendorUser.isMain,                       // 대표 담당자 여부 (업체당 1명 권장)
                        syVendorUser.authYn,                       // 업체 관리권한 여부 (Y=업체 정보 수정 가능)
                        syVendorUser.joinDate,                     // 등록(합류) 일자
                        syVendorUser.leaveDate,                    // 퇴직/탈퇴 일자
                        syVendorUser.vendorUserStatusCd,           // 상태 — VENDOR_MEMBER_STATUS (sy_code 미등록)
                        syVendorUser.vendorUserRemark,             // 비고
                        syVendorUser.regBy,                        // 등록자
                        syVendorUser.regDate,                      // 등록일시
                        syVendorUser.updBy,                        // 수정자
                        syVendorUser.updDate,                      // 수정일시
                        syVendor.vendorNm.as("vendorNm")           // 업체명 (조인: sy_vendor)
                ))
                .from(syVendorUser)
                .innerJoin(syVendor).on(syVendor.vendorId.eq(syVendorUser.vendorId)) // 업체
                .leftJoin(syUser).on(syUser.userId.eq(syVendorUser.userId)) // 사용자
                .leftJoin(cdP).on(cdP.codeGrp.eq("POSITION_CD").and(cdP.codeValue.eq(syVendorUser.positionCd))) // 직급
                .leftJoin(cdVms).on(cdVms.codeGrp.eq("VENDOR_USER_STATUS_CD").and(cdVms.codeValue.eq(syVendorUser.vendorUserStatusCd))) // 업체담당자상태
                ;
    }

    /* 업체 사용자 키조회 */
    @Override
    public Optional<SyVendorUserDto.Item> selectById(String vendorUserId) {
        SyVendorUserDto.Item dtl = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(syVendorUser.vendorUserId.eq(vendorUserId))
                .fetchOne();
        return Optional.ofNullable(dtl);
    }

    /* 업체 사용자 목록조회 */
    @Override
    public List<SyVendorUserDto.Item> selectList(SyVendorUserDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(syVendorUser.vendorUserId, search.getVendorUserId()));
        whereList.add(QdslUtil.strEq(syVendorUser.userId, search.getUserId()));
        whereList.add(QdslUtil.strEq(syVendorUser.vendorId, search.getVendorId()));
        whereList.add(QdslUtil.strEq(syVendorUser.vendorUserStatusCd, search.getStatus()));
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(syVendorUser.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(syVendorUser.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<SyVendorUserDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(wheres)
        .orderBy(orders);
        Integer pageNo = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        List<SyVendorUserDto.Item> list = query.fetch();
        return list;
    }

    /* 업체 사용자 페이지조회 */
    @Override
    public BasePage<SyVendorUserDto.Item> selectPageData(SyVendorUserDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(syVendorUser.vendorUserId, search.getVendorUserId()));
        whereList.add(QdslUtil.strEq(syVendorUser.userId, search.getUserId()));
        whereList.add(QdslUtil.strEq(syVendorUser.vendorId, search.getVendorId()));
        whereList.add(QdslUtil.strEq(syVendorUser.vendorUserStatusCd, search.getStatus()));
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(syVendorUser.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(syVendorUser.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        JPAQuery<SyVendorUserDto.Item> query = baseSelColumnQuery();

        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<SyVendorUserDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(syVendorUser.count())
                .where(wheres)
                .fetchOne();

        BasePage<SyVendorUserDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }

    /* searchType 사용 예  searchType = "fieldA,fieldB" */
    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("authYn", syVendorUser.authYn),
            QdslUtil.FieldDef.like("isMain", syVendorUser.isMain),
            QdslUtil.FieldDef.like("memberNm", syVendorUser.memberNm),
            QdslUtil.FieldDef.like("positionCd", syVendorUser.positionCd),
            QdslUtil.FieldDef.like("userId", syVendorUser.userId),
            QdslUtil.FieldDef.like("vendorId", syVendorUser.vendorId),
            QdslUtil.FieldDef.like("vendorUserDeptNm", syVendorUser.vendorUserDeptNm),
            QdslUtil.FieldDef.like("vendorUserEmail", syVendorUser.vendorUserEmail),
            QdslUtil.FieldDef.like("vendorUserId", syVendorUser.vendorUserId),
            QdslUtil.FieldDef.like("vendorUserMobile", syVendorUser.vendorUserMobile),
            QdslUtil.FieldDef.like("vendorUserPhone", syVendorUser.vendorUserPhone),
            QdslUtil.FieldDef.like("vendorUserRemark", syVendorUser.vendorUserRemark),
            QdslUtil.FieldDef.like("vendorUserStatusCd", syVendorUser.vendorUserStatusCd)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("vendorUserId", syVendorUser.vendorUserId,
                   "memberNm", syVendorUser.memberNm,
                   "joinDate", syVendorUser.joinDate),
        new OrderSpecifier<>(Order.DESC, syVendorUser.regDate),
        new OrderSpecifier<>(Order.ASC, syVendorUser.vendorUserId));
    }

    /* 업체 사용자 수정 */
    @Override
    public int updateSelective(SyVendorUser entity) {
        if (entity.getVendorUserId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(syVendorUser);
        boolean hasAny = false;

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
        update.set(syVendorUser.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(syVendorUser.vendorUserId.eq(entity.getVendorUserId())).execute();
        return (int) affected;
    }
}
