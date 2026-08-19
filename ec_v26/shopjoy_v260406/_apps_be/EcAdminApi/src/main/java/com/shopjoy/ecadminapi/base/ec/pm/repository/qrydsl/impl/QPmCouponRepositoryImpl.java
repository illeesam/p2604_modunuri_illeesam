package com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.impl;

import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.data.BasePage;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.DateTimePath;
import com.querydsl.jpa.JPAExpressions;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmCouponDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmCoupon;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmCoupon;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmCouponProd;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmCouponRepository;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProd;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyVendor;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUser;

import com.shopjoy.ecadminapi.base.sy.data.entity.QVwSyCode;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** PmCoupon(쿠폰) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPmCouponRepositoryImpl implements QPmCouponRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pm.repository.qrydsl.impl.QPmCouponRepositoryImpl";
    private static final QPmCoupon pmCoupon   = QPmCoupon.pmCoupon;
    private static final QVwSyCode  cdCt = new QVwSyCode("cd_ct");
    private static final QVwSyCode  cdCs = new QVwSyCode("cd_cs");
    private static final QVwSyCode  cdTt = new QVwSyCode("cd_tt");
    private static final QVwSyCode  cdMg = new QVwSyCode("cd_mg");
    // EXISTS 서브쿼리용 별칭 (대상상품/업체/담당MD 필터 — pm_coupon_prod → pd_prod → sy_vendor/sy_user)
    private static final QPmCouponProd couponProdEx = new QPmCouponProd("coupon_prod_ex");
    private static final QPdProd       pProdEx      = new QPdProd("p_prod_ex");
    private static final QSyVendor     syVendorEx   = new QSyVendor("sy_vendor_ex");
    private static final QSyUser       syUserEx     = new QSyUser("sy_user_ex");    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * COUPON_TYPE    {PROD_DISCNT: '상품할인', ORDER_DISCNT: '주문할인', SHIP_DISCNT: '배송비할인', SHIP_FREE: '무료배송', JOIN_GIFT: '가입축하', VIP: 'VIP전용', CLAIM_COMP: '클레임보상'}
     * COUPON_STATUS  {ACTIVE: '활성', INACTIVE: '비활성', EXPIRED: '만료'}
     * COUPON_TARGET  {ALL: '전체', MEMBER: '회원', GRADE: '등급'}
     * MEMBER_GRADE   회원 등급 코드 (sy_code MEMBER_GRADE 그룹, 사이트별 등급 구성에 따라 값 상이)
     */
    private JPAQuery<PmCouponDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PmCouponDto.Item.class,
                        pmCoupon.couponId,              // 쿠폰ID (PK, YYMMDDhhmmss+rand4)
                        pmCoupon.couponCd,               // 쿠폰코드 (UNIQUE)
                        pmCoupon.couponNm,               // 쿠폰명
                        pmCoupon.couponTypeCd,           // 쿠폰유형 — COUPON_TYPE {PROD_DISCNT, ORDER_DISCNT, SHIP_DISCNT, SHIP_FREE, JOIN_GIFT, VIP, CLAIM_COMP}
                        pmCoupon.discountRate,           // 할인률 (%)
                        pmCoupon.discountAmt,            // 할인금액
                        pmCoupon.minOrderAmt,            // 최소주문금액
                        pmCoupon.minOrderQty,            // 최소주문수량 (NULL=제한없음)
                        pmCoupon.maxDiscountAmt,         // 최대할인한도 (NULL=무제한)
                        pmCoupon.issueLimit,             // 총발급한도 (NULL=무제한)
                        pmCoupon.issueCnt,               // 발급된 개수
                        pmCoupon.maxIssuePerMem,         // 회원당 최대발급수 (NULL=무제한)
                        pmCoupon.couponDesc,             // 쿠폰설명
                        pmCoupon.validFrom,              // 유효기간 시작
                        pmCoupon.validTo,                // 유효기간 종료
                        pmCoupon.couponStatusCd,         // 상태 — COUPON_STATUS {ACTIVE: '활성', INACTIVE: '비활성', EXPIRED: '만료'}
                        pmCoupon.couponStatusCdBefore,   // 변경 전 쿠폰상태 — COUPON_STATUS
                        pmCoupon.useYn,                  // 사용여부 Y/N
                        pmCoupon.targetTypeCd,           // 적용대상 — COUPON_TARGET {ALL: '전체', MEMBER: '회원', GRADE: '등급'}
                        pmCoupon.targetValue,            // 적용대상값 (회원ID/등급코드)
                        pmCoupon.memGradeCd,             // 적용 회원등급 코드 (NULL=전체, 코드: MEMBER_GRADE)
                        pmCoupon.selfCdivRate,           // 자사(사이트) 분담율 (%) — 기본 100%
                        pmCoupon.sellerCdivRate,         // 판매자(업체) 분담율 (%) — 기본 0%
                        pmCoupon.sellerCdivRemark,       // 판매자 분담 비고
                        pmCoupon.dvcPcYn,                // PC 채널 적용여부 Y/N
                        pmCoupon.dvcMwebYn,              // 모바일WEB 적용여부 Y/N
                        pmCoupon.dvcMappYn,              // 모바일APP 적용여부 Y/N
                        pmCoupon.memo,                   // 메모
                        pmCoupon.vendorId,               // 판매업체
                        pmCoupon.chargeStaff,             // 판매담당자명
                        pmCoupon.visibilityTargets,       // 공개대상
                        pmCoupon.mdUserId,                // 담당MD
                        pmCoupon.regBy, pmCoupon.regDate, pmCoupon.updBy, pmCoupon.updDate,
                        cdCt.codeLabel.as("couponTypeCdNm"),     // 쿠폰유형 코드라벨 (조인)
                        cdCs.codeLabel.as("couponStatusCdNm"),   // 쿠폰상태 코드라벨 (조인)
                        cdTt.codeLabel.as("targetTypeCdNm"),     // 적용대상 코드라벨 (조인)
                        cdMg.codeLabel.as("memGradeCdNm")        // 적용등급 코드라벨 (조인)
                ))
                .from(pmCoupon)
                .innerJoin(cdCt).on(cdCt.codeGrp.eq("COUPON_TYPE_CD").and(cdCt.codeValue.eq(pmCoupon.couponTypeCd))) // 쿠폰유형
                .leftJoin(cdCs).on(cdCs.codeGrp.eq("COUPON_STATUS_CD").and(cdCs.codeValue.eq(pmCoupon.couponStatusCd))) // 쿠폰상태
                .leftJoin(cdTt).on(cdTt.codeGrp.eq("COUPON_TARGET").and(cdTt.codeValue.eq(pmCoupon.targetTypeCd))) // 쿠폰대상
                .leftJoin(cdMg).on(cdMg.codeGrp.eq("MEMBER_GRADE").and(cdMg.codeValue.eq(pmCoupon.memGradeCd))) // 회원등급
                ;
    }

    /* 쿠폰 키조회 */
    @Override
    public Optional<PmCouponDto.Item> selectById(String couponId) {
        PmCouponDto.Item dtl = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(pmCoupon.couponId.eq(couponId))
                .fetchOne();
        return Optional.ofNullable(dtl);
    }

    /* 쿠폰 목록조회 */
    @Override
    public List<PmCouponDto.Item> selectList(PmCouponDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strIn(pmCoupon.couponId, search.getCouponIds()));
        whereList.add(QdslUtil.strEq(pmCoupon.couponId, search.getCouponId()));
        whereList.add(QdslUtil.strEq(pmCoupon.useYn, search.getUseYn()));
        whereList.add(QdslUtil.strEq(pmCoupon.couponStatusCd, search.getCouponStatusCd()));
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pmCoupon.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pmCoupon.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andProdVendorMd(search));
        whereList.add(andCurrentYnCoupon(search.getCurrentYn()));
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<PmCouponDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(wheres)
                .orderBy(orders);
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        List<PmCouponDto.Item> list = query.fetch();
        return list;
    }

    /* 쿠폰 페이지조회 */
    @Override
    public BasePage<PmCouponDto.Item> selectPageData(PmCouponDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strIn(pmCoupon.couponId, search.getCouponIds()));
        whereList.add(QdslUtil.strEq(pmCoupon.couponId, search.getCouponId()));
        whereList.add(QdslUtil.strEq(pmCoupon.useYn, search.getUseYn()));
        whereList.add(QdslUtil.strEq(pmCoupon.couponStatusCd, search.getCouponStatusCd()));
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pmCoupon.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pmCoupon.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andProdVendorMd(search));
        whereList.add(andCurrentYnCoupon(search.getCurrentYn()));
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        JPAQuery<PmCouponDto.Item> query = baseSelColumnQuery();

        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<PmCouponDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pmCoupon.count())
                .where(wheres)
                .fetchOne();

        BasePage<PmCouponDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }
    /** andProdVendorMd — 대상상품/업체/담당MD 필터. pm_coupon_prod(coupon_id↔prod_id) 를 거쳐
     *  pd_prod 의 vendor_id/md_user_id 까지 조인해야 하는 2단 EXISTS. */
    private BooleanExpression andProdVendorMd(PmCouponDto.Request search) {
        boolean needProd   = StringUtils.hasText(search.getProdId()) || StringUtils.hasText(search.getProdNm());
        boolean needVendor = StringUtils.hasText(search.getVendorId()) || StringUtils.hasText(search.getVendorNm());
        boolean needMd     = StringUtils.hasText(search.getMdUserId()) || StringUtils.hasText(search.getMdUserNm());
        if (!needProd && !needVendor && !needMd) return null;

        com.querydsl.jpa.JPQLQuery<Integer> sub = JPAExpressions.selectOne().from(couponProdEx)
            .where(couponProdEx.couponId.eq(pmCoupon.couponId));

        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(couponProdEx.prodId, search.getProdId()));
        whereList.add(StringUtils.hasText(search.getProdId()) ? null
                : JPAExpressions.selectOne().from(pProdEx)
                      .where(pProdEx.prodId.eq(couponProdEx.prodId), QdslUtil.strLike(pProdEx.prodNm, search.getProdNm())).exists());

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        if (needProd) {
            sub = sub.where(wheres);
        }
        if (needVendor) {
            sub = sub.where(JPAExpressions.selectOne().from(pProdEx).join(syVendorEx).on(syVendorEx.vendorId.eq(pProdEx.vendorId))
                .where(pProdEx.prodId.eq(couponProdEx.prodId),
                       QdslUtil.strEq(syVendorEx.vendorId, search.getVendorId()),
                       StringUtils.hasText(search.getVendorId()) ? null : QdslUtil.strLike(syVendorEx.vendorNm, search.getVendorNm()))
                .exists());
        }
        if (needMd) {
            sub = sub.where(JPAExpressions.selectOne().from(pProdEx).join(syUserEx).on(syUserEx.userId.eq(pProdEx.mdUserId))
                .where(pProdEx.prodId.eq(couponProdEx.prodId),
                       QdslUtil.strEq(syUserEx.userId, search.getMdUserId()),
                       StringUtils.hasText(search.getMdUserId()) ? null : QdslUtil.strLike(syUserEx.userNm, search.getMdUserNm()))
                .exists());
        }
        return sub.exists();
    }

    /* searchType 사용 예  searchType = "blogTitle,blogAuthor" */

    /**
     * currentYn='Y' 일 때만 "지금 사용가능" 조건 — 상태 ACTIVE + use_yn='Y' + 유효기간(valid_from~valid_to) 이내.
     *
     * <p>FO 는 서비스가 요청마다 currentYn='Y' 를 강제 세팅하므로 항상 적용된다(끔 수 없음).
     * BO 는 기본 미적용(전체 조회)이며, "지금 노출중인 것만" 미리보기 시에만 'Y' 를 보낸다.
     * 기준일은 메서드 진입 시 1회 계산해 두 비교(시작/종료)가 동일 시점을 공유하게 한다.
     */
    private BooleanExpression andCurrentYnCoupon(String currentYn) {
        if (!"Y".equals(currentYn)) return null;
        LocalDate today = LocalDate.now();
        return pmCoupon.couponStatusCd.eq("ACTIVE")
                .and(pmCoupon.useYn.eq("Y"))
                .and(QdslUtil.dateBetween(today, pmCoupon.validFrom, pmCoupon.validTo));
    }

    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("couponCd", pmCoupon.couponCd),
            QdslUtil.FieldDef.like("couponDesc", pmCoupon.couponDesc),
            QdslUtil.FieldDef.like("couponId", pmCoupon.couponId),
            QdslUtil.FieldDef.like("couponNm", pmCoupon.couponNm),
            QdslUtil.FieldDef.like("couponStatusCd", pmCoupon.couponStatusCd),
            QdslUtil.FieldDef.like("couponStatusCdBefore", pmCoupon.couponStatusCdBefore),
            QdslUtil.FieldDef.like("couponTypeCd", pmCoupon.couponTypeCd),
            QdslUtil.FieldDef.like("dvcMappYn", pmCoupon.dvcMappYn),
            QdslUtil.FieldDef.like("dvcMwebYn", pmCoupon.dvcMwebYn),
            QdslUtil.FieldDef.like("dvcPcYn", pmCoupon.dvcPcYn),
            QdslUtil.FieldDef.like("memGradeCd", pmCoupon.memGradeCd),
            QdslUtil.FieldDef.like("memo", pmCoupon.memo),
            QdslUtil.FieldDef.like("sellerCdivRemark", pmCoupon.sellerCdivRemark),
            QdslUtil.FieldDef.like("targetTypeCd", pmCoupon.targetTypeCd),
            QdslUtil.FieldDef.like("targetValue", pmCoupon.targetValue),
            QdslUtil.FieldDef.like("useYn", pmCoupon.useYn)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("couponId", pmCoupon.couponId,
                   "couponNm", pmCoupon.couponNm,
                   "regDate", pmCoupon.regDate),
        new OrderSpecifier<>(Order.DESC, pmCoupon.regDate),
        new OrderSpecifier<>(Order.ASC, pmCoupon.couponId));
    }

    /* 쿠폰 수정 */
    @Override
    public int updateSelective(PmCoupon entity) {
        if (entity.getCouponId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pmCoupon);
        boolean hasAny = false;

        if (entity.getCouponStatusCd()       != null) { update.set(pmCoupon.couponStatusCd,       entity.getCouponStatusCd());       hasAny = true; }
        if (entity.getCouponStatusCdBefore() != null) { update.set(pmCoupon.couponStatusCdBefore, entity.getCouponStatusCdBefore()); hasAny = true; }
        if (entity.getCouponNm()             != null) { update.set(pmCoupon.couponNm,             entity.getCouponNm());             hasAny = true; }
        if (entity.getUseYn()                != null) { update.set(pmCoupon.useYn,                entity.getUseYn());                hasAny = true; }
        if (entity.getValidFrom()            != null) { update.set(pmCoupon.validFrom,            entity.getValidFrom());            hasAny = true; }
        if (entity.getValidTo()              != null) { update.set(pmCoupon.validTo,              entity.getValidTo());              hasAny = true; }
        if (entity.getIssueCnt()             != null) { update.set(pmCoupon.issueCnt,             entity.getIssueCnt());             hasAny = true; }
        if (entity.getMemo()                 != null) { update.set(pmCoupon.memo,                 entity.getMemo());                 hasAny = true; }
        if (entity.getVendorId()             != null) { update.set(pmCoupon.vendorId,             entity.getVendorId());             hasAny = true; }
        if (entity.getChargeStaff()          != null) { update.set(pmCoupon.chargeStaff,          entity.getChargeStaff());          hasAny = true; }
        if (entity.getVisibilityTargets()    != null) { update.set(pmCoupon.visibilityTargets,    entity.getVisibilityTargets());    hasAny = true; }
        if (entity.getMdUserId()             != null) { update.set(pmCoupon.mdUserId,             entity.getMdUserId());             hasAny = true; }
        if (entity.getUpdBy()                != null) { update.set(pmCoupon.updBy,                entity.getUpdBy());                hasAny = true; }
        update.set(pmCoupon.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(pmCoupon.couponId.eq(entity.getCouponId())).execute();
        return (int) affected;
    }
}
