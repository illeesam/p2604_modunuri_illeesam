package com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.impl;

import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.data.BasePage;
import com.querydsl.core.types.ExpressionUtils;
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
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdOrderItemDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdOrderItem;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.QMbMember;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdOrder;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdOrderItem;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdOrderItemRepository;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdCategory;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProd;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProdOpt;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProdSku;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyBrand;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyVendor;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUser;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.QStSettleItem;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmDiscntUsage;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmCouponUsage;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmSaveUsage;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmGift;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdClaim;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdClaimItem;

import com.shopjoy.ecadminapi.base.sy.data.entity.QVwSyCode;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;

/** OdOrderItem(주문상품) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QOdOrderItemRepositoryImpl implements QOdOrderItemRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.od.repository.qrydsl.impl.QOdOrderItemRepositoryImpl";
    private static final QSySite siteEx = new QSySite("site_ex");
    private static final QSyUser regUserEx = new QSyUser("reg_user_ex");
    private static final QSySite regSiteEx = new QSySite("reg_site_ex");
    private static final QOdOrderItem   odOrderItem   = QOdOrderItem.odOrderItem;
    private static final QPdProd        pdProd    = QPdProd.pdProd;
    private static final QPdProdSku     pdProdSku   = QPdProdSku.pdProdSku;
    private static final QPdProdOpt oi1  = new QPdProdOpt("oi1");
    private static final QPdProdOpt oi2  = new QPdProdOpt("oi2");
    private static final QVwSyCode        cdIs      = new QVwSyCode("cd_is");
    private static final QVwSyCode        cdDc      = new QVwSyCode("cd_dc");
    // 목록/엑셀 표시용 조인(1:1 — fan-out 없음). WHERE 절 EXISTS 서브쿼리용 "_ex" 별칭과는 별개 인스턴스.
    private static final QOdOrder         odOrderJoin  = new QOdOrder("od_order_join");
    private static final QSyVendor        syVendorJoin = new QSyVendor("sy_vendor_join");
    private static final QSyUser          syUserJoin   = new QSyUser("sy_user_join");
    private static final QPdCategory      pdCategoryJoin = new QPdCategory("pd_category_join");
    // EXISTS 서브쿼리용 별칭 (baseSelColumnQuery 의 pdProd 와 충돌 방지)
    private static final QPdProd          pNmEx      = new QPdProd("p_nm_ex");
    private static final QPdProd          pBrandEx   = new QPdProd("p_brand_ex");
    private static final QSyBrand         sBrandEx   = new QSyBrand("s_brand_ex");
    private static final QOdOrder         odOrderEx  = new QOdOrder("od_order_ex");
    private static final QMbMember        mbMemberEx = new QMbMember("mb_member_ex");
    private static final QPdProd          pVendorEx  = new QPdProd("p_vendor_ex");
    private static final QSyVendor        syVendorEx = new QSyVendor("sy_vendor_ex");
    private static final QPdProd          pMdEx      = new QPdProd("p_md_ex");
    private static final QSyUser          syUserEx   = new QSyUser("sy_user_ex");
    // 정산 금액 상관 서브쿼리용 별칭 (order_item_id 기준 SALE/CANCEL/RETURN 전 항목 합산)
    private static final QStSettleItem    stSettleItemEx = new QStSettleItem("st_settle_item_ex");
    // 프로모션 적용 내역 상관 서브쿼리용 별칭 (order_item_id 기준)
    private static final QPmDiscntUsage   pmDiscntUsageEx = new QPmDiscntUsage("pm_discnt_usage_ex");
    private static final QPmCouponUsage   pmCouponUsageEx = new QPmCouponUsage("pm_coupon_usage_ex");
    private static final QPmSaveUsage     pmSaveUsageEx   = new QPmSaveUsage("pm_save_usage_ex");
    private static final QPmGift          pmGiftEx        = new QPmGift("pm_gift_ex");
    // 클레임유형/상태 표시용 (최근 1건 대표 표시) + 검색필터용(EXISTS) 별칭 — 서로 다른 인스턴스로 충돌 방지
    private static final QOdClaimItem     claimItemDsp    = new QOdClaimItem("claim_item_dsp");
    private static final QOdClaim         claimDsp        = new QOdClaim("claim_dsp");
    private static final QOdClaimItem     claimItemFlt    = new QOdClaimItem("claim_item_flt");
    private static final QOdClaim         claimFlt        = new QOdClaim("claim_flt");    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * ORDER_ITEM_STATUS  {ORDERED:주문완료, PAID:결제완료, PREPARING:준비중, SHIPPING:배송중, DELIVERED:배송완료, CONFIRMED:구매확정, CANCELLED:취소}
     * COURIER  {CJ:CJ대한통운, LOGEN:로젠택배, POST:우체국택배, HANJIN:한진택배, LOTTE:롯데택배, KYOUNGDONG:경동택배, DIRECT:직배송}
     */
    private JPAQuery<OdOrderItemDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(OdOrderItemDto.Item.class,
                        odOrderItem.orderItemId,             // 주문상품ID (YYMMDDhhmmss+rand4)
                        odOrderItem.orderId,                 // 주문ID (od_order.)
                        odOrderItem.prodId,                  // 상품ID (pd_prod.)
                        odOrderItem.prodSkuId,               // SKU ID (pd_prod_sku.prod_sku_id, 무옵션 시 NULL)
                        odOrderItem.prodOpt1Id,              // 옵션1 값ID (pd_prod_opt.opt_id)
                        odOrderItem.prodOpt2Id,              // 옵션2 값ID (pd_prod_opt.opt_id)
                        odOrderItem.prodNm,                  // 상품명 (주문 시점 스냅샷)
                        odOrderItem.brandNm,                 // 브랜드명 (주문 시점 스냅샷)
                        odOrderItem.dlivTmpltId,             // 배송비 템플릿ID 스냅샷
                        odOrderItem.normalPrice,             // 정상가 (할인 전 1ea 가격)
                        odOrderItem.unitPrice,                // 판매가 (단가, 옵션 추가금액 포함)
                        odOrderItem.orderQty,                 // 주문수량
                        odOrderItem.itemOrderAmt,            // 주문금액 (unit_price × order_qty)
                        odOrderItem.cancelQty,               // 취소수량
                        odOrderItem.itemCancelAmt,           // 취소금액 (클레임 누적 취소액)
                        odOrderItem.completQty,              // 판매완료수량
                        odOrderItem.itemCompletedAmt,        // 완료금액 (item_order_amt - item_cancel_amt)
                        odOrderItem.orgUnitPrice,            // 원 단가 (주문 확정 시점 스냅샷)
                        odOrderItem.orgItemOrderAmt,         // 원 주문금액 (주문 확정 시점 스냅샷)
                        odOrderItem.orgDiscountAmt,          // 원 할인금액 (주문 확정 시점 스냅샷)
                        odOrderItem.orgShippingFee,          // 원 배송료 (주문 확정 시점 스냅샷)
                        odOrderItem.saveRate,                 // 주문 시점 적립율 (%)
                        odOrderItem.saveUseAmt,              // 사용 적립금 (주문상품별 안분금액)
                        odOrderItem.saveSchdAmt,             // 적립 예정금액 (구매확정 전=예상, 확정 후=실적립)
                        odOrderItem.orderItemStatusCd,       // 품목 주문 상태 — ORDER_ITEM_STATUS {ORDERED:주문완료, PAID:결제완료, PREPARING:준비중, SHIPPING:배송중, DELIVERED:배송완료, CONFIRMED:구매확정, CANCELLED:취소}
                        odOrderItem.orderItemStatusCdBefore, // 변경 전 품목상태 — ORDER_ITEM_STATUS (동일 코드그룹)
                        odOrderItem.claimYn,                  // 클레임 진행 중 여부 Y/N
                        odOrderItem.buyConfirmYn,            // 구매확정여부 Y/N
                        odOrderItem.buyConfirmSchdDate,      // 구매확정 예정일 (배송완료 + N일 자동 설정)
                        odOrderItem.buyConfirmDate,          // 구매확정일시
                        odOrderItem.settleYn,                 // 정산처리여부 Y/N
                        odOrderItem.settleDate,              // 정산처리일시
                        odOrderItem.reserveSaleYn,           // 예약판매여부 Y/N
                        odOrderItem.reserveDlivSchdDate,     // 예약판매 발송 예정일시
                        odOrderItem.bundleGroupId,           // 묶음 그룹키 (동일 묶음 구성품 식별, UUID, 일반상품=NULL)
                        odOrderItem.bundlePriceRate,         // 묶음 가격 안분율 (%) — 부분클레임 환불 계산 기준
                        odOrderItem.giftId,                   // 발급 사은품ID (pm_gift.gift_id)
                        odOrderItem.outboundShippingFee,     // 해당 항목의 배송료 (부분배송 시)
                        odOrderItem.dlivCourierCd,           // 해당 항목의 배송 택배사 — COURIER {CJ:CJ대한통운, LOGEN:로젠택배, POST:우체국택배, HANJIN:한진택배, LOTTE:롯데택배, KYOUNGDONG:경동택배, DIRECT:직배송}
                        odOrderItem.dlivMethodCd,            // 배송방법 override — DLIV_METHOD_CD, NULL=상품 기본값
                        odOrderItem.dlivTrackingNo,          // 해당 항목의 배송 송장번호
                        odOrderItem.dlivShipDate,            // 해당 항목의 출고일시
                        odOrderItem.regBy,      // 등록자
                        odOrderItem.regDate,    // 등록일시
                        odOrderItem.updBy,      // 수정자
                        odOrderItem.updDate,    // 수정일시
                        pdProd.thumbnailUrl.as("thumbnailUrl"),
                        pdProd.salePrice.as("salePriceCurrent"),
                        pdProd.prodNm.as("prodNmCurrent"),
                        pdProdSku.prodSkuCode.as("prodSkuCode"),
                        oi1.prodOptNm.as("prodOptNm1"),
                        oi2.prodOptNm.as("prodOptNm2"),
                        cdIs.codeLabel.as("orderItemStatusCdNm"),
                        cdDc.codeLabel.as("dlivCourierCdNm"),
                        odOrderJoin.memberNm.as("memberNm"),         // 주문자명 (od_order 스냅샷)
                        syVendorJoin.vendorNm.as("vendorNm"),        // 판매업체명 (pd_prod → sy_vendor)
                        syUserJoin.userNm.as("mdUserNm"),            // 담당MD명 (pd_prod → sy_user)
                        pdCategoryJoin.categoryNm.as("categoryNm"),  // 카테고리명 (pd_prod → pd_category)
                        // 정산 금액 (st_settle_item, order_item_id 기준 전 항목 합산 — SALE/CANCEL/RETURN 순 합계)
                        ExpressionUtils.as(JPAExpressions.select(stSettleItemEx.itemPrice.sum())
                                .from(stSettleItemEx)
                                .where(stSettleItemEx.orderItemId.eq(odOrderItem.orderItemId)), "settleSaleAmt"),
                        ExpressionUtils.as(JPAExpressions.select(stSettleItemEx.commissionAmt.sum())
                                .from(stSettleItemEx)
                                .where(stSettleItemEx.orderItemId.eq(odOrderItem.orderItemId)), "settleCommissionAmt"),
                        ExpressionUtils.as(JPAExpressions.select(stSettleItemEx.settleItemAmt.sum())
                                .from(stSettleItemEx)
                                .where(stSettleItemEx.orderItemId.eq(odOrderItem.orderItemId)), "settleVendorAmt"),
                        // 프로모션 적용 내역 (order_item_id 상관 서브쿼리 — 이름은 금액 큰 순 1건 대표 표시, 상세는 별도 API)
                        ExpressionUtils.as(JPAExpressions.select(pmDiscntUsageEx.count())
                                .from(pmDiscntUsageEx)
                                .where(pmDiscntUsageEx.orderItemId.eq(odOrderItem.orderItemId)), "discntUsageCount"),
                        ExpressionUtils.as(JPAExpressions.select(pmDiscntUsageEx.discntNm)
                                .from(pmDiscntUsageEx)
                                .where(pmDiscntUsageEx.orderItemId.eq(odOrderItem.orderItemId))
                                .orderBy(pmDiscntUsageEx.discntAmt.desc()).limit(1), "discntUsageNm"),
                        ExpressionUtils.as(JPAExpressions.select(pmDiscntUsageEx.discntId)
                                .from(pmDiscntUsageEx)
                                .where(pmDiscntUsageEx.orderItemId.eq(odOrderItem.orderItemId))
                                .orderBy(pmDiscntUsageEx.discntAmt.desc()).limit(1), "discntUsageTopId"),
                        ExpressionUtils.as(JPAExpressions.select(pmDiscntUsageEx.discntAmt.sum())
                                .from(pmDiscntUsageEx)
                                .where(pmDiscntUsageEx.orderItemId.eq(odOrderItem.orderItemId)), "discntUsageAmt"),
                        ExpressionUtils.as(JPAExpressions.select(pmCouponUsageEx.count())
                                .from(pmCouponUsageEx)
                                .where(pmCouponUsageEx.orderItemId.eq(odOrderItem.orderItemId)), "couponUsageCount"),
                        ExpressionUtils.as(JPAExpressions.select(pmCouponUsageEx.couponNm)
                                .from(pmCouponUsageEx)
                                .where(pmCouponUsageEx.orderItemId.eq(odOrderItem.orderItemId))
                                .orderBy(pmCouponUsageEx.discountAmt.desc()).limit(1), "couponUsageNm"),
                        ExpressionUtils.as(JPAExpressions.select(pmCouponUsageEx.couponId)
                                .from(pmCouponUsageEx)
                                .where(pmCouponUsageEx.orderItemId.eq(odOrderItem.orderItemId))
                                .orderBy(pmCouponUsageEx.discountAmt.desc()).limit(1), "couponUsageTopId"),
                        ExpressionUtils.as(JPAExpressions.select(pmCouponUsageEx.discountAmt.sum())
                                .from(pmCouponUsageEx)
                                .where(pmCouponUsageEx.orderItemId.eq(odOrderItem.orderItemId)), "couponUsageAmt"),
                        ExpressionUtils.as(JPAExpressions.select(pmSaveUsageEx.count())
                                .from(pmSaveUsageEx)
                                .where(pmSaveUsageEx.orderItemId.eq(odOrderItem.orderItemId)), "saveUsageCount"),
                        ExpressionUtils.as(JPAExpressions.select(pmSaveUsageEx.useAmt.sum())
                                .from(pmSaveUsageEx)
                                .where(pmSaveUsageEx.orderItemId.eq(odOrderItem.orderItemId)), "saveUsageAmt"),
                        pmGiftEx.giftNm.as("giftNm"),
                        // 클레임유형/상태 — 해당 항목의 최신 클레임 1건 대표 표시(od_claim_item→od_claim, regDate desc)
                        ExpressionUtils.as(JPAExpressions.select(claimDsp.claimTypeCd)
                                .from(claimItemDsp).join(claimDsp).on(claimDsp.claimId.eq(claimItemDsp.claimId))
                                .where(claimItemDsp.orderItemId.eq(odOrderItem.orderItemId))
                                .orderBy(claimItemDsp.regDate.desc()).limit(1), "claimTypeCd"),
                        ExpressionUtils.as(JPAExpressions.select(claimItemDsp.claimItemStatusCd)
                                .from(claimItemDsp)
                                .where(claimItemDsp.orderItemId.eq(odOrderItem.orderItemId))
                                .orderBy(claimItemDsp.regDate.desc()).limit(1), "claimStatusCd"),
                        odOrderItem.regSiteId,  // 등록사이트ID
                        regSiteEx.siteNm.as("regSiteNm"),  // 등록사이트명 (조인)
                        regUserEx.userNm.as("regUserNm"),   // 등록자명 (조인)
                        odOrderItem.siteId,  // 사이트ID
                        siteEx.siteNm.as("siteNm")   // 사이트명 (조인)
                ))
                .from(odOrderItem)
                .innerJoin(pdProd).on(pdProd.prodId.eq(odOrderItem.prodId)) // 상품
                .innerJoin(odOrderJoin).on(odOrderJoin.orderId.eq(odOrderItem.orderId)) // 주문
                .leftJoin(pdProdSku).on(pdProdSku.prodSkuId.eq(odOrderItem.prodSkuId)) // SKU
                .leftJoin(oi1).on(oi1.prodOptId.eq(odOrderItem.prodOpt1Id)) // 옵션1
                .leftJoin(oi2).on(oi2.prodOptId.eq(odOrderItem.prodOpt2Id)) // 옵션2
                .leftJoin(cdIs).on(cdIs.codeGrp.eq("ORDER_ITEM_STATUS_CD").and(cdIs.codeValue.eq(odOrderItem.orderItemStatusCd))) // 주문상품상태
                .leftJoin(cdDc).on(cdDc.codeGrp.eq("COURIER").and(cdDc.codeValue.eq(odOrderItem.dlivCourierCd))) // 택배사
                .leftJoin(pmGiftEx).on(pmGiftEx.giftId.eq(odOrderItem.giftId)) // 사은품
                .leftJoin(syVendorJoin).on(syVendorJoin.vendorId.eq(pdProd.vendorId)) // 업체
                .leftJoin(syUserJoin).on(syUserJoin.userId.eq(pdProd.mdUserId)) // 사용자
                .leftJoin(pdCategoryJoin).on(pdCategoryJoin.categoryId.eq(pdProd.categoryId)) // 카테고리
                .leftJoin(regSiteEx).on(regSiteEx.siteId.eq(odOrderItem.regSiteId)) // 등록사이트
                .leftJoin(regUserEx).on(regUserEx.userId.eq(odOrderItem.regBy)) // 등록자
                .leftJoin(siteEx).on(siteEx.siteId.eq(odOrderItem.siteId)) // 사이트

                ;
    }

    /* 주문 아이템(상품) 키조회 */
    @Override
    public Optional<OdOrderItemDto.Item> selectById(String orderItemId) {
        OdOrderItemDto.Item dtl = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(odOrderItem.orderItemId.eq(orderItemId))
                .fetchOne();
        return Optional.ofNullable(dtl);
    }

    /* 주문 아이템(상품) 목록조회 */
    @Override
    public List<OdOrderItemDto.Item> selectList(OdOrderItemDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strIn(odOrderItem.orderId, search.getOrderIds()));
        whereList.add(QdslUtil.strEq(odOrderItem.orderId, search.getOrderId()));
        whereList.add(QdslUtil.strEq(odOrderItem.orderItemId, search.getOrderItemId()));
        whereList.add(QdslUtil.strEq(odOrderItem.orderItemStatusCd, search.getOrderItemStatusCd()));
        whereList.add(QdslUtil.strIn(odOrderItem.orderItemStatusCd, search.getOrderItemStatusCds()));
        whereList.add(QdslUtil.strEq(odOrderItem.claimYn, search.getClaimYn()));
        whereList.add(claimFilter(search.getClaimCombos()));
        whereList.add(QdslUtil.strEq(odOrderItem.dlivCourierCd, search.getDlivCourierCd()));
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(odOrderItem.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(odOrderItem.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add((StringUtils.hasText(search.getMemberId()) || StringUtils.hasText(search.getMemberNm()))
                ? JPAExpressions.selectOne()
                      .from(odOrderEx).join(mbMemberEx).on(mbMemberEx.memberId.eq(odOrderEx.memberId))
                      .where(odOrderEx.orderId.eq(odOrderItem.orderId),
                             QdslUtil.strEq(mbMemberEx.memberId, search.getMemberId()),
                             StringUtils.hasText(search.getMemberId()) ? null : QdslUtil.strLike(mbMemberEx.memberNm, search.getMemberNm()))
                      .exists()
                : null);
        whereList.add((StringUtils.hasText(search.getVendorId()) || StringUtils.hasText(search.getVendorNm()))
                ? JPAExpressions.selectOne()
                      .from(pVendorEx).join(syVendorEx).on(syVendorEx.vendorId.eq(pVendorEx.vendorId))
                      .where(pVendorEx.prodId.eq(odOrderItem.prodId),
                             QdslUtil.strEq(syVendorEx.vendorId, search.getVendorId()),
                             StringUtils.hasText(search.getVendorId()) ? null : QdslUtil.strLike(syVendorEx.vendorNm, search.getVendorNm()))
                      .exists()
                : null);
        whereList.add((StringUtils.hasText(search.getMdUserId()) || StringUtils.hasText(search.getMdUserNm()))
                ? JPAExpressions.selectOne()
                      .from(pMdEx).join(syUserEx).on(syUserEx.userId.eq(pMdEx.mdUserId))
                      .where(pMdEx.prodId.eq(odOrderItem.prodId),
                             QdslUtil.strEq(syUserEx.userId, search.getMdUserId()),
                             StringUtils.hasText(search.getMdUserId()) ? null : QdslUtil.strLike(syUserEx.userNm, search.getMdUserNm()))
                      .exists()
                : null);
        whereList.add((StringUtils.hasText(search.getBrandId()) || StringUtils.hasText(search.getBrandNm()))
                ? JPAExpressions.selectOne()
                      .from(pBrandEx).join(sBrandEx).on(sBrandEx.brandId.eq(pBrandEx.brandId))
                      .where(pBrandEx.prodId.eq(odOrderItem.prodId),
                             QdslUtil.strEq(sBrandEx.brandId, search.getBrandId()),
                             StringUtils.hasText(search.getBrandId()) ? null : QdslUtil.strLike(sBrandEx.brandNm, search.getBrandNm()))
                      .exists()
                : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        whereList.add(QdslUtil.strEq(odOrderItem.siteId, search.getSiteId()));

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<OdOrderItemDto.Item> query = baseSelColumnQuery()
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
        List<OdOrderItemDto.Item> list = query.fetch();
        return list;
    }

    /* 주문 아이템(상품) 페이지조회 */
    @Override
    public BasePage<OdOrderItemDto.Item> selectPageData(OdOrderItemDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strIn(odOrderItem.orderId, search.getOrderIds()));
        whereList.add(QdslUtil.strEq(odOrderItem.orderId, search.getOrderId()));
        whereList.add(QdslUtil.strEq(odOrderItem.orderItemId, search.getOrderItemId()));
        whereList.add(QdslUtil.strEq(odOrderItem.orderItemStatusCd, search.getOrderItemStatusCd()));
        whereList.add(QdslUtil.strIn(odOrderItem.orderItemStatusCd, search.getOrderItemStatusCds()));
        whereList.add(QdslUtil.strEq(odOrderItem.claimYn, search.getClaimYn()));
        whereList.add(claimFilter(search.getClaimCombos()));
        whereList.add(QdslUtil.strEq(odOrderItem.dlivCourierCd, search.getDlivCourierCd()));
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(odOrderItem.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(odOrderItem.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add((StringUtils.hasText(search.getMemberId()) || StringUtils.hasText(search.getMemberNm()))
                ? JPAExpressions.selectOne()
                      .from(odOrderEx).join(mbMemberEx).on(mbMemberEx.memberId.eq(odOrderEx.memberId))
                      .where(odOrderEx.orderId.eq(odOrderItem.orderId),
                             QdslUtil.strEq(mbMemberEx.memberId, search.getMemberId()),
                             StringUtils.hasText(search.getMemberId()) ? null : QdslUtil.strLike(mbMemberEx.memberNm, search.getMemberNm()))
                      .exists()
                : null);
        whereList.add((StringUtils.hasText(search.getVendorId()) || StringUtils.hasText(search.getVendorNm()))
                ? JPAExpressions.selectOne()
                      .from(pVendorEx).join(syVendorEx).on(syVendorEx.vendorId.eq(pVendorEx.vendorId))
                      .where(pVendorEx.prodId.eq(odOrderItem.prodId),
                             QdslUtil.strEq(syVendorEx.vendorId, search.getVendorId()),
                             StringUtils.hasText(search.getVendorId()) ? null : QdslUtil.strLike(syVendorEx.vendorNm, search.getVendorNm()))
                      .exists()
                : null);
        whereList.add((StringUtils.hasText(search.getMdUserId()) || StringUtils.hasText(search.getMdUserNm()))
                ? JPAExpressions.selectOne()
                      .from(pMdEx).join(syUserEx).on(syUserEx.userId.eq(pMdEx.mdUserId))
                      .where(pMdEx.prodId.eq(odOrderItem.prodId),
                             QdslUtil.strEq(syUserEx.userId, search.getMdUserId()),
                             StringUtils.hasText(search.getMdUserId()) ? null : QdslUtil.strLike(syUserEx.userNm, search.getMdUserNm()))
                      .exists()
                : null);
        whereList.add((StringUtils.hasText(search.getBrandId()) || StringUtils.hasText(search.getBrandNm()))
                ? JPAExpressions.selectOne()
                      .from(pBrandEx).join(sBrandEx).on(sBrandEx.brandId.eq(pBrandEx.brandId))
                      .where(pBrandEx.prodId.eq(odOrderItem.prodId),
                             QdslUtil.strEq(sBrandEx.brandId, search.getBrandId()),
                             StringUtils.hasText(search.getBrandId()) ? null : QdslUtil.strLike(sBrandEx.brandNm, search.getBrandNm()))
                      .exists()
                : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        whereList.add(QdslUtil.strEq(odOrderItem.siteId, search.getSiteId()));
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        JPAQuery<OdOrderItemDto.Item> query = baseSelColumnQuery();

        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<OdOrderItemDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(odOrderItem.count())
                .where(wheres)
                .fetchOne();

        BasePage<OdOrderItemDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }
    /* searchType 사용 예  searchType = "<Entity 필드명 콤마구분>" */

    /** *Nm 필드는 원장 테이블 EXISTS, 나머지는 스냅샷 LIKE. 필드별 모드는 FieldDef 로 개별 지정. */
    /** 클레임상세 매트릭스 필터 — "CLAIM_ITEM_STATUS_CD:CLAIM_TYPE_CD" 조합 목록을 OR 로 묶어 EXISTS(od_claim_item → od_claim).
     *  프론트 BoComboMatrixSelect 가 보내는 토큰. "__NONE__" 1건뿐이면(전체선택 해제) 항상 거짓 조건으로 0건 강제. */
    private BooleanExpression claimFilter(List<String> claimCombos) {
        if (claimCombos == null || claimCombos.isEmpty()) return null;
        if (claimCombos.size() == 1 && "__NONE__".equals(claimCombos.get(0))) {
            return odOrderItem.orderItemId.eq("__NEVER_MATCH__");
        }
        BooleanExpression combined = null;
        for (String combo : claimCombos) {
            String[] parts = combo.split(":", 2);
            if (parts.length != 2 || parts[0].isBlank() || parts[1].isBlank()) continue;
            String statusCd = parts[0], typeCd = parts[1];
            BooleanExpression pairExists = JPAExpressions.selectOne()
                    .from(claimItemFlt)
                    .join(claimFlt).on(claimFlt.claimId.eq(claimItemFlt.claimId)) // 클레임
                    .where(claimItemFlt.orderItemId.eq(odOrderItem.orderItemId),
                           claimItemFlt.claimItemStatusCd.eq(statusCd),
                           claimFlt.claimTypeCd.eq(typeCd))
                    .exists();
            combined = combined == null ? pairExists : combined.or(pairExists);
        }
        return combined;
    }

    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("bundleGroupId",           odOrderItem.bundleGroupId),
            QdslUtil.FieldDef.like("buyConfirmYn",            odOrderItem.buyConfirmYn),
            QdslUtil.FieldDef.like("claimYn",                 odOrderItem.claimYn),
            QdslUtil.FieldDef.like("dlivCourierCd",           odOrderItem.dlivCourierCd),
            QdslUtil.FieldDef.like("dlivTmpltId",             odOrderItem.dlivTmpltId),
            QdslUtil.FieldDef.like("dlivTrackingNo",          odOrderItem.dlivTrackingNo),
            QdslUtil.FieldDef.like("giftId",                  odOrderItem.giftId),
            QdslUtil.FieldDef.like("prodOpt1Id",              odOrderItem.prodOpt1Id),
            QdslUtil.FieldDef.like("prodOpt2Id",              odOrderItem.prodOpt2Id),
            QdslUtil.FieldDef.like("orderId",                 odOrderItem.orderId),
            QdslUtil.FieldDef.like("orderItemId",             odOrderItem.orderItemId),
            QdslUtil.FieldDef.like("orderItemStatusCd",       odOrderItem.orderItemStatusCd),
            QdslUtil.FieldDef.like("orderItemStatusCdBefore", odOrderItem.orderItemStatusCdBefore),
            QdslUtil.FieldDef.like("prodId",                  odOrderItem.prodId),
            QdslUtil.FieldDef.like("reserveSaleYn",           odOrderItem.reserveSaleYn),
            QdslUtil.FieldDef.like("settleYn",                odOrderItem.settleYn),
            QdslUtil.FieldDef.like("prodSkuId",               odOrderItem.prodSkuId),
            // prodNm: pd_prod 실 상품명 EXISTS
            QdslUtil.FieldDef.exists("prodNm", sv -> JPAExpressions.selectOne()
                    .from(pNmEx)
                    .where(pNmEx.prodId.eq(odOrderItem.prodId),
                           QdslUtil.strLike(pNmEx.prodNm, sv))
                    .exists()),
            // brandNm: pd_prod → sy_brand 원장 브랜드명 EXISTS
            QdslUtil.FieldDef.exists("brandNm", sv -> JPAExpressions.selectOne()
                    .from(pBrandEx)
                    .join(sBrandEx).on(sBrandEx.brandId.eq(pBrandEx.brandId)) // 브랜드
                    .where(pBrandEx.prodId.eq(odOrderItem.prodId),
                           QdslUtil.strLike(sBrandEx.brandNm, sv))
                    .exists())
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("orderItemId", odOrderItem.orderItemId,
                   "prodNm", odOrderItem.prodNm,
                   "regDate", odOrderItem.regDate),
        new OrderSpecifier<>(Order.DESC, odOrderItem.regDate),
        new OrderSpecifier<>(Order.ASC, odOrderItem.orderItemId));
    }

    /* 주문 아이템(상품) 수정 */
    @Override
    public int updateSelective(OdOrderItem entity) {
        if (entity.getOrderItemId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(odOrderItem);
        boolean hasAny = false;

        if (entity.getOrderItemStatusCd()       != null) { update.set(odOrderItem.orderItemStatusCd,       entity.getOrderItemStatusCd());       hasAny = true; }
        if (entity.getOrderItemStatusCdBefore() != null) { update.set(odOrderItem.orderItemStatusCdBefore, entity.getOrderItemStatusCdBefore()); hasAny = true; }
        if (entity.getBuyConfirmYn()            != null) { update.set(odOrderItem.buyConfirmYn,            entity.getBuyConfirmYn());            hasAny = true; }
        if (entity.getBuyConfirmDate()          != null) { update.set(odOrderItem.buyConfirmDate,          entity.getBuyConfirmDate());          hasAny = true; }
        if (entity.getSettleYn()                != null) { update.set(odOrderItem.settleYn,                entity.getSettleYn());                hasAny = true; }
        if (entity.getSettleDate()              != null) { update.set(odOrderItem.settleDate,              entity.getSettleDate());              hasAny = true; }
        if (entity.getDlivMethodCd()             != null) { update.set(odOrderItem.dlivMethodCd,            entity.getDlivMethodCd());             hasAny = true; }
        if (entity.getUpdBy()                   != null) { update.set(odOrderItem.updBy,                   entity.getUpdBy());                   hasAny = true; }
        update.set(odOrderItem.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(odOrderItem.orderItemId.eq(entity.getOrderItemId())).execute();
        return (int) affected;
    }
}
