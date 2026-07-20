package com.shopjoy.ecadminapi.base.ec.st.repository.qrydsl.impl;

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
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.QMbMember;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdClaim;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdClaimItem;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdOrder;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdOrderItem;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProd;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmCoupon;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmDiscnt;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmEvent;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmGift;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmVoucher;
import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleRawDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.QStSettleRaw;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleRaw;
import com.shopjoy.ecadminapi.base.ec.st.repository.qrydsl.QStSettleRawRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyBrand;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUser;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyVendor;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;

/** StSettleRaw QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QStSettleRawRepositoryImpl implements QStSettleRawRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.st.repository.qrydsl.impl.QStSettleRawRepositoryImpl";
    private static final QStSettleRaw stSettleRaw    = QStSettleRaw.stSettleRaw;
    private static final QSySite      sySite  = QSySite.sySite;
    private static final QOdOrder     odOrder  = QOdOrder.odOrder;
    private static final QOdOrderItem odOrderItem  = QOdOrderItem.odOrderItem;
    private static final QMbMember    mbMember  = QMbMember.mbMember;
    private static final QOdClaim     odClaim  = QOdClaim.odClaim;
    private static final QOdClaimItem odClaimItem = QOdClaimItem.odClaimItem;
    private static final QSyVendor    syVendor  = QSyVendor.syVendor;
    private static final QPdProd      pdProd  = QPdProd.pdProd;
    private static final QSyBrand     syBrand  = QSyBrand.syBrand;
    private static final QSyUser      syUser  = QSyUser.syUser;
    private static final QPmEvent     pmEvent  = QPmEvent.pmEvent;
    private static final QPmCoupon    pmCoupon  = QPmCoupon.pmCoupon;
    private static final QPmDiscnt    pmDiscnt  = QPmDiscnt.pmDiscnt;
    private static final QPmVoucher   pmVoucher  = QPmVoucher.pmVoucher;
    private static final QPmGift      pmGift  = QPmGift.pmGift;
    private static final QSyCode      cdRt  = new QSyCode("cd_rt");
    private static final QSyCode      cdRs  = new QSyCode("cd_rs");
    private static final QSyCode      cdOis = new QSyCode("cd_ois");
    private static final QSyCode      cdVt  = new QSyCode("cd_vt");
    private static final QSyCode      cdPmc = new QSyCode("cd_pmc");
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_FIELDS = Map.of(
        "order_date", stSettleRaw.orderDate,
        "reg_date", stSettleRaw.regDate,
        "upd_date", stSettleRaw.updDate
    );
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("brandId", stSettleRaw.brandId),
        Map.entry("brandNm", stSettleRaw.brandNm),
        Map.entry("buyConfirmYn", stSettleRaw.buyConfirmYn),
        Map.entry("categoryId1", stSettleRaw.categoryId1),
        Map.entry("categoryId2", stSettleRaw.categoryId2),
        Map.entry("categoryId3", stSettleRaw.categoryId3),
        Map.entry("categoryId4", stSettleRaw.categoryId4),
        Map.entry("categoryId5", stSettleRaw.categoryId5),
        Map.entry("claimId", stSettleRaw.claimId),
        Map.entry("claimItemId", stSettleRaw.claimItemId),
        Map.entry("closeYn", stSettleRaw.closeYn),
        Map.entry("couponId", stSettleRaw.couponId),
        Map.entry("couponIssueId", stSettleRaw.couponIssueId),
        Map.entry("discntId", stSettleRaw.discntId),
        Map.entry("erpSendYn", stSettleRaw.erpSendYn),
        Map.entry("erpVoucherId", stSettleRaw.erpVoucherId),
        Map.entry("giftId", stSettleRaw.giftId),
        Map.entry("mdUserId", stSettleRaw.mdUserId),
        Map.entry("memberId", stSettleRaw.memberId),
        Map.entry("prodOptId1", stSettleRaw.prodOptId1),
        Map.entry("prodOptId2", stSettleRaw.prodOptId2),
        Map.entry("orderId", stSettleRaw.orderId),
        Map.entry("orderItemId", stSettleRaw.orderItemId),
        Map.entry("orderItemStatusCd", stSettleRaw.orderItemStatusCd),
        Map.entry("orderNo", stSettleRaw.orderNo),
        Map.entry("payMethodCd", stSettleRaw.payMethodCd),
        Map.entry("prodId", stSettleRaw.prodId),
        Map.entry("prodNm", stSettleRaw.prodNm),
        Map.entry("promoId", stSettleRaw.promoId),
        Map.entry("rawStatusCd", stSettleRaw.rawStatusCd),
        Map.entry("rawStatusCdBefore", stSettleRaw.rawStatusCdBefore),
        Map.entry("rawTypeCd", stSettleRaw.rawTypeCd),
        Map.entry("settleCloseId", stSettleRaw.settleCloseId),
        Map.entry("settleId", stSettleRaw.settleId),
        Map.entry("settlePeriod", stSettleRaw.settlePeriod),
        Map.entry("settleRawId", stSettleRaw.settleRawId),
        Map.entry("siteId", stSettleRaw.siteId),
        Map.entry("prodSkuId", stSettleRaw.prodSkuId),
        Map.entry("vendorId", stSettleRaw.vendorId),
        Map.entry("vendorTypeCd", stSettleRaw.vendorTypeCd),
        Map.entry("voucherId", stSettleRaw.voucherId),
        Map.entry("voucherIssueId", stSettleRaw.voucherIssueId)
    );

    /*
     * baseListQuery — 코드성 필드 예시 코드값 (sy_code 실 데이터 기준)
     * RAW_TYPE            {ORDER: '주문', CLAIM: '클레임', ADJ: '조정'}
     * RAW_STATUS          {COLLECTED: '수집완료', EXCLUDED: '제외', SETTLED: '정산반영'}
     * ORDER_ITEM_STATUS   {ORDERED: '주문완료', PAID: '결제완료', PREPARING: '준비중', SHIPPING: '배송중', DELIVERED: '배송완료', CONFIRMED: '구매확정', CANCELLED: '취소'}
     * VENDOR_TYPE         {BRAND: '브랜드사', AGENT: '에이전트', DIRECT: '직매입', CONSIGN: '위탁판매'}
     * PAY_METHOD_CD       (sy_code 실 데이터 없음, 참고: PAY_METHOD 그룹 BANK_TRANSFER/VBANK/TOSS/KAKAO/NAVER/MOBILE/CACHE/SAVE)
     * BUY_CONFIRM_YN / CLOSE_YN / ERP_SEND_YN  {Y: '예', N: '아니오'}
     */
    private JPAQuery<StSettleRawDto.Item> baseListQuery() {
        return queryFactory
                .select(Projections.bean(StSettleRawDto.Item.class,
                        stSettleRaw.settleRawId,           // 수집원장ID (PK, YYMMDDhhmmss+rand4)
                        stSettleRaw.siteId,                 // 사이트ID
                        stSettleRaw.rawTypeCd,              // 수집유형 — RAW_TYPE {ORDER: '주문', CLAIM: '클레임', ADJ: '조정'}
                        stSettleRaw.rawStatusCd,            // 수집상태 — RAW_STATUS {COLLECTED: '수집완료', EXCLUDED: '제외', SETTLED: '정산반영'}
                        stSettleRaw.rawStatusCdBefore,      // 변경 전 수집상태
                        stSettleRaw.orderId,                // 주문ID (od_order.order_id)
                        stSettleRaw.orderNo,                // 주문번호 스냅샷
                        stSettleRaw.orderItemId,            // 주문상품ID (od_order_item.order_item_id)
                        stSettleRaw.orderDate,              // 주문일시 스냅샷
                        stSettleRaw.orderItemStatusCd,      // 수집 시점 주문상태 스냅샷 — ORDER_ITEM_STATUS {ORDERED: '주문완료', PAID: '결제완료', PREPARING: '준비중', SHIPPING: '배송중', DELIVERED: '배송완료', CONFIRMED: '구매확정', CANCELLED: '취소'}
                        stSettleRaw.memberId,               // 주문 회원ID 스냅샷 (mb_member.member_id)
                        stSettleRaw.claimId,                // 클레임ID (클레임 수집 시)
                        stSettleRaw.claimItemId,            // 클레임상품ID (클레임 수집 시)
                        stSettleRaw.vendorId,                // 업체ID
                        stSettleRaw.vendorTypeCd,            // 업체구분 — VENDOR_TYPE {BRAND: '브랜드사', AGENT: '에이전트', DIRECT: '직매입', CONSIGN: '위탁판매'}
                        stSettleRaw.prodId,                  // 상품ID
                        stSettleRaw.prodNm,                  // 상품명 스냅샷
                        stSettleRaw.brandId,                 // 브랜드ID 스냅샷 (sy_brand.brand_id)
                        stSettleRaw.brandNm,                 // 브랜드명 스냅샷
                        stSettleRaw.categoryId1,             // 카테고리 1단계(대분류) ID 스냅샷
                        stSettleRaw.categoryId2,             // 카테고리 2단계(중분류) ID 스냅샷
                        stSettleRaw.categoryId3,             // 카테고리 3단계(소분류) ID 스냅샷
                        stSettleRaw.categoryId4,             // 카테고리 4단계 ID 스냅샷
                        stSettleRaw.categoryId5,             // 카테고리 5단계 ID 스냅샷
                        stSettleRaw.prodSkuId,               // SKU ID 스냅샷 (pd_prod_sku.prod_sku_id)
                        stSettleRaw.prodOptId1,              // 옵션1 값ID 스냅샷 (pd_prod_opt.opt_id)
                        stSettleRaw.prodOptId2,              // 옵션2 값ID 스냅샷 (pd_prod_opt.opt_id)
                        stSettleRaw.mdUserId,                // 담당MD (sy_user.user_id)
                        stSettleRaw.normalPrice,             // 정상가 스냅샷 (할인 전 1ea 가격)
                        stSettleRaw.unitPrice,               // 단가 (옵션 추가금액 포함)
                        stSettleRaw.orderQty,                // 주문수량
                        stSettleRaw.itemPrice,               // 소계 (unit_price × order_qty)
                        stSettleRaw.discntAmt,               // 직접할인금액
                        stSettleRaw.couponDiscntAmt,         // 쿠폰할인금액
                        stSettleRaw.promoDiscntAmt,          // 프로모션할인금액
                        stSettleRaw.promoId,                 // 프로모션ID (pm_event.event_id)
                        stSettleRaw.couponId,                 // 쿠폰ID (pm_coupon.coupon_id)
                        stSettleRaw.couponIssueId,            // 쿠폰발급ID (pm_coupon_issue.coupon_issue_id)
                        stSettleRaw.discntId,                 // 할인ID (pm_discnt.discnt_id)
                        stSettleRaw.voucherId,                // 상품권ID (pm_voucher.voucher_id)
                        stSettleRaw.voucherIssueId,           // 상품권발급ID (pm_voucher_issue.voucher_issue_id)
                        stSettleRaw.voucherUseAmt,            // 상품권 사용금액
                        stSettleRaw.cacheUseAmt,              // 캐쉬(적립금) 사용금액
                        stSettleRaw.mileageUseAmt,            // 적립금 사용금액
                        stSettleRaw.saveSchdAmt,              // 적립 예정금액 (구매확정 전=예상, 확정 후=실적립)
                        stSettleRaw.giftId,                   // 사은품ID (pm_gift.gift_id)
                        stSettleRaw.giftAmt,                  // 사은품 원가금액 (정산 차감 대상)
                        stSettleRaw.payMethodCd,              // 결제수단 — PAY_METHOD_CD (sy_code 실 데이터 없음, 참고: PAY_METHOD 그룹)
                        stSettleRaw.buyConfirmYn,             // 구매확정여부 — BUY_CONFIRM_YN {Y: '예', N: '아니오'}
                        stSettleRaw.buyConfirmDate,           // 구매확정일시
                        stSettleRaw.bundlePriceRate,          // 묶음 안분율 (%) — 부분 정산 계산 기준
                        stSettleRaw.settleTargetAmt,          // 정산대상금액 (item_price - 모든 할인)
                        stSettleRaw.settleFeeRate,            // 수수료율 (%)
                        stSettleRaw.settleFeeAmt,             // 수수료금액
                        stSettleRaw.settleAmt,                // 정산금액 (settle_target_amt - settle_fee_amt)
                        stSettleRaw.settlePeriod,             // 정산기간 (YYYY-MM)
                        stSettleRaw.settleId,                 // 정산집계ID (st_settle.settle_id, 집계 후 연결)
                        stSettleRaw.closeYn,                  // 정산마감 완료 여부 — CLOSE_YN {Y: '예', N: '아니오'}
                        stSettleRaw.closeDate,                // 마감일시
                        stSettleRaw.settleCloseId,            // 정산마감ID (st_settle_close.settle_close_id)
                        stSettleRaw.erpVoucherId,             // ERP 전표ID (st_erp_voucher.erp_voucher_id)
                        stSettleRaw.erpVoucherLineNo,         // ERP 전표 라인번호 (st_erp_voucher_line.line_no)
                        stSettleRaw.erpSendYn,                // ERP 전송 여부 — ERP_SEND_YN {Y: '예', N: '아니오'}
                        stSettleRaw.erpSendDate,              // ERP 전송일시
                        stSettleRaw.regBy,                    // 등록자
                        stSettleRaw.regDate,                  // 등록일시
                        stSettleRaw.updBy,                    // 수정자
                        stSettleRaw.updDate,                  // 수정일시
                        sySite.siteNm.as("siteNm"),                             // 사이트명 (조인)
                        odOrder.memberNm.as("orderNm"),                         // 주문 회원명 (조인)
                        odOrderItem.prodNm.as("orderItemNm"),                   // 주문항목 상품명 (조인)
                        mbMember.memberNm.as("memberNm"),                       // 회원명 (조인)
                        odClaim.memberNm.as("claimNm"),                         // 클레임 회원명 (조인)
                        odClaimItem.prodNm.as("claimItemNm"),                   // 클레임항목 상품명 (조인)
                        syVendor.vendorNm.as("vendorNm"),                       // 업체명 (조인)
                        pdProd.prodNm.as("prodIdNm"),                           // 상품명 (조인, 현재 스냅샷)
                        syBrand.brandNm.as("brandIdNm"),                        // 브랜드명 (조인, 현재 스냅샷)
                        syUser.userNm.as("mdUserNm"),                           // 담당MD명 (조인)
                        pmEvent.eventNm.as("promoNm"),                          // 프로모션명 (조인)
                        pmCoupon.couponNm.as("couponNm"),                       // 쿠폰명 (조인)
                        pmDiscnt.discntNm.as("discntNm"),                       // 할인명 (조인)
                        pmVoucher.voucherNm.as("voucherNm"),                    // 상품권명 (조인)
                        pmGift.giftNm.as("giftNm"),                             // 사은품명 (조인)
                        cdRt.codeLabel.as("rawTypeCdNm"),                       // 수집유형명 (sy_code 조인)
                        cdRs.codeLabel.as("rawStatusCdNm"),                     // 수집상태명 (sy_code 조인)
                        cdOis.codeLabel.as("orderItemStatusCdNm"),              // 주문상태명 (sy_code 조인)
                        cdVt.codeLabel.as("vendorTypeCdNm"),                    // 업체구분명 (sy_code 조인)
                        cdPmc.codeLabel.as("payMethodCdNm")                     // 결제수단명 (sy_code 조인)
                ))
                .from(stSettleRaw)
                .leftJoin(sySite).on(sySite.siteId.eq(stSettleRaw.siteId))
                .leftJoin(odOrder).on(odOrder.orderId.eq(stSettleRaw.orderId))
                .leftJoin(odOrderItem).on(odOrderItem.orderItemId.eq(stSettleRaw.orderItemId))
                .leftJoin(mbMember).on(mbMember.memberId.eq(stSettleRaw.memberId))
                .leftJoin(odClaim).on(odClaim.claimId.eq(stSettleRaw.claimId))
                .leftJoin(odClaimItem).on(odClaimItem.claimItemId.eq(stSettleRaw.claimItemId))
                .leftJoin(syVendor).on(syVendor.vendorId.eq(stSettleRaw.vendorId))
                .leftJoin(pdProd).on(pdProd.prodId.eq(stSettleRaw.prodId))
                .leftJoin(syBrand).on(syBrand.brandId.eq(stSettleRaw.brandId))
                .leftJoin(syUser).on(syUser.userId.eq(stSettleRaw.mdUserId))
                .leftJoin(pmEvent).on(pmEvent.eventId.eq(stSettleRaw.promoId))
                .leftJoin(pmCoupon).on(pmCoupon.couponId.eq(stSettleRaw.couponId))
                .leftJoin(pmDiscnt).on(pmDiscnt.discntId.eq(stSettleRaw.discntId))
                .leftJoin(pmVoucher).on(pmVoucher.voucherId.eq(stSettleRaw.voucherId))
                .leftJoin(pmGift).on(pmGift.giftId.eq(stSettleRaw.giftId))
                .leftJoin(cdRt).on(cdRt.codeGrp.eq("RAW_TYPE").and(cdRt.codeValue.eq(stSettleRaw.rawTypeCd)))
                .leftJoin(cdRs).on(cdRs.codeGrp.eq("RAW_STATUS").and(cdRs.codeValue.eq(stSettleRaw.rawStatusCd)))
                .leftJoin(cdOis).on(cdOis.codeGrp.eq("ORDER_ITEM_STATUS").and(cdOis.codeValue.eq(stSettleRaw.orderItemStatusCd)))
                .leftJoin(cdVt).on(cdVt.codeGrp.eq("VENDOR_TYPE").and(cdVt.codeValue.eq(stSettleRaw.vendorTypeCd)))
                .leftJoin(cdPmc).on(cdPmc.codeGrp.eq("PAY_METHOD_CD").and(cdPmc.codeValue.eq(stSettleRaw.payMethodCd)));
    }

    /* 정산 원천 데이터 키조회 */
    @Override
    public Optional<StSettleRawDto.Item> selectById(String id) {
        StSettleRawDto.Item dto = baseListQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(stSettleRaw.settleRawId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 정산 원천 데이터 목록조회 */
    @Override
    public List<StSettleRawDto.Item> selectList(StSettleRawDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<StSettleRawDto.Item> query = baseListQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strEq(stSettleRaw.siteId, search.getSiteId()),
                    QdslUtil.strEq(stSettleRaw.settleRawId, search.getSettleRawId()),
                    QdslUtil.strEq(stSettleRaw.orderId, search.getOrderId()),
                    QdslUtil.strEq(stSettleRaw.orderItemId, search.getOrderItemId()),
                    QdslUtil.strEq(stSettleRaw.claimId, search.getClaimId()),
                    QdslUtil.strEq(stSettleRaw.claimItemId, search.getClaimItemId()),
                    QdslUtil.strEq(stSettleRaw.rawTypeCd, search.getRawTypeCd()),
                    QdslUtil.strEq(stSettleRaw.rawStatusCd, search.getRawStatusCd()),
                    QdslUtil.strEq(stSettleRaw.vendorTypeCd, search.getVendorTypeCd()),
                    QdslUtil.strEq(stSettleRaw.payMethodCd, search.getPayMethodCd()),
                    QdslUtil.strEq(stSettleRaw.buyConfirmYn, search.getBuyConfirmYn()),
                    QdslUtil.strEq(stSettleRaw.closeYn, search.getCloseYn()),
                    QdslUtil.strEq(stSettleRaw.erpSendYn, search.getErpSendYn()),
                    QdslUtil.strEq(stSettleRaw.settlePeriod, search.getSettlePeriod()),
                    QdslUtil.strEq(stSettleRaw.orderItemStatusCd, search.getOrderItemStatusCd()),
                    QdslUtil.numGoe(stSettleRaw.settleTargetAmt, search.getAmtFrom()),
                    QdslUtil.numLoe(stSettleRaw.settleTargetAmt, search.getAmtTo()),
                    QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                    andSearchValueLike(search)
                )
                .orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        return query.fetch();
    }

    /* 정산 원천 데이터 페이지조회 */
    @Override
    public StSettleRawDto.PageResponse selectPageData(StSettleRawDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(stSettleRaw.siteId, search.getSiteId()),
                QdslUtil.strEq(stSettleRaw.settleRawId, search.getSettleRawId()),
                QdslUtil.strEq(stSettleRaw.orderId, search.getOrderId()),
                QdslUtil.strEq(stSettleRaw.orderItemId, search.getOrderItemId()),
                QdslUtil.strEq(stSettleRaw.claimId, search.getClaimId()),
                QdslUtil.strEq(stSettleRaw.claimItemId, search.getClaimItemId()),
                QdslUtil.strEq(stSettleRaw.rawTypeCd, search.getRawTypeCd()),
                QdslUtil.strEq(stSettleRaw.rawStatusCd, search.getRawStatusCd()),
                QdslUtil.strEq(stSettleRaw.vendorTypeCd, search.getVendorTypeCd()),
                QdslUtil.strEq(stSettleRaw.payMethodCd, search.getPayMethodCd()),
                QdslUtil.strEq(stSettleRaw.buyConfirmYn, search.getBuyConfirmYn()),
                QdslUtil.strEq(stSettleRaw.closeYn, search.getCloseYn()),
                QdslUtil.strEq(stSettleRaw.erpSendYn, search.getErpSendYn()),
                QdslUtil.strEq(stSettleRaw.settlePeriod, search.getSettlePeriod()),
                QdslUtil.strEq(stSettleRaw.orderItemStatusCd, search.getOrderItemStatusCd()),
                QdslUtil.numGoe(stSettleRaw.settleTargetAmt, search.getAmtFrom()),
                QdslUtil.numLoe(stSettleRaw.settleTargetAmt, search.getAmtTo()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<StSettleRawDto.Item> query = baseListQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<StSettleRawDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(stSettleRaw.count())
                .where(wheres)
                .fetchOne();

        StSettleRawDto.PageResponse res = new StSettleRawDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* searchType 사용 예  searchType = "blogTitle,blogAuthor" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

private BooleanExpression andSearchValueLike(StSettleRawDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
    }


    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(StSettleRawDto.Request c) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = c == null ? null : c.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, stSettleRaw.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, stSettleRaw.settleRawId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("settleRawId".equals(field)) {
                    orders.add(new OrderSpecifier(order, stSettleRaw.settleRawId));
                } else if ("prodNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, stSettleRaw.prodNm));
                } else if ("orderDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, stSettleRaw.orderDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, stSettleRaw.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, stSettleRaw.settleRawId));
        }
        return orders;
    }

    /* 정산 원천 데이터 수정 */
    @Override
    public int updateSelective(StSettleRaw entity) {
        if (entity.getSettleRawId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(stSettleRaw);
        boolean hasAny = false;

        if (entity.getSiteId()              != null) { update.set(stSettleRaw.siteId,              entity.getSiteId());              hasAny = true; }
        if (entity.getRawTypeCd()           != null) { update.set(stSettleRaw.rawTypeCd,           entity.getRawTypeCd());           hasAny = true; }
        if (entity.getRawStatusCd()         != null) { update.set(stSettleRaw.rawStatusCd,         entity.getRawStatusCd());         hasAny = true; }
        if (entity.getRawStatusCdBefore()   != null) { update.set(stSettleRaw.rawStatusCdBefore,   entity.getRawStatusCdBefore());   hasAny = true; }
        if (entity.getOrderId()             != null) { update.set(stSettleRaw.orderId,             entity.getOrderId());             hasAny = true; }
        if (entity.getOrderNo()             != null) { update.set(stSettleRaw.orderNo,             entity.getOrderNo());             hasAny = true; }
        if (entity.getOrderItemId()         != null) { update.set(stSettleRaw.orderItemId,         entity.getOrderItemId());         hasAny = true; }
        if (entity.getOrderDate()           != null) { update.set(stSettleRaw.orderDate,           entity.getOrderDate());           hasAny = true; }
        if (entity.getOrderItemStatusCd()   != null) { update.set(stSettleRaw.orderItemStatusCd,   entity.getOrderItemStatusCd());   hasAny = true; }
        if (entity.getMemberId()            != null) { update.set(stSettleRaw.memberId,            entity.getMemberId());            hasAny = true; }
        if (entity.getClaimId()             != null) { update.set(stSettleRaw.claimId,             entity.getClaimId());             hasAny = true; }
        if (entity.getClaimItemId()         != null) { update.set(stSettleRaw.claimItemId,         entity.getClaimItemId());         hasAny = true; }
        if (entity.getVendorId()            != null) { update.set(stSettleRaw.vendorId,            entity.getVendorId());            hasAny = true; }
        if (entity.getVendorTypeCd()        != null) { update.set(stSettleRaw.vendorTypeCd,        entity.getVendorTypeCd());        hasAny = true; }
        if (entity.getProdId()              != null) { update.set(stSettleRaw.prodId,              entity.getProdId());              hasAny = true; }
        if (entity.getProdNm()              != null) { update.set(stSettleRaw.prodNm,              entity.getProdNm());              hasAny = true; }
        if (entity.getBrandId()             != null) { update.set(stSettleRaw.brandId,             entity.getBrandId());             hasAny = true; }
        if (entity.getBrandNm()             != null) { update.set(stSettleRaw.brandNm,             entity.getBrandNm());             hasAny = true; }
        if (entity.getCategoryId1()         != null) { update.set(stSettleRaw.categoryId1,         entity.getCategoryId1());         hasAny = true; }
        if (entity.getCategoryId2()         != null) { update.set(stSettleRaw.categoryId2,         entity.getCategoryId2());         hasAny = true; }
        if (entity.getCategoryId3()         != null) { update.set(stSettleRaw.categoryId3,         entity.getCategoryId3());         hasAny = true; }
        if (entity.getCategoryId4()         != null) { update.set(stSettleRaw.categoryId4,         entity.getCategoryId4());         hasAny = true; }
        if (entity.getCategoryId5()         != null) { update.set(stSettleRaw.categoryId5,         entity.getCategoryId5());         hasAny = true; }
        if (entity.getProdSkuId()            != null) { update.set(stSettleRaw.prodSkuId,            entity.getProdSkuId());            hasAny = true; }
        if (entity.getProdOptId1()              != null) { update.set(stSettleRaw.prodOptId1,              entity.getProdOptId1());              hasAny = true; }
        if (entity.getProdOptId2()              != null) { update.set(stSettleRaw.prodOptId2,              entity.getProdOptId2());              hasAny = true; }
        if (entity.getMdUserId()            != null) { update.set(stSettleRaw.mdUserId,            entity.getMdUserId());            hasAny = true; }
        if (entity.getNormalPrice()         != null) { update.set(stSettleRaw.normalPrice,         entity.getNormalPrice());         hasAny = true; }
        if (entity.getUnitPrice()           != null) { update.set(stSettleRaw.unitPrice,           entity.getUnitPrice());           hasAny = true; }
        if (entity.getOrderQty()            != null) { update.set(stSettleRaw.orderQty,            entity.getOrderQty());            hasAny = true; }
        if (entity.getItemPrice()           != null) { update.set(stSettleRaw.itemPrice,           entity.getItemPrice());           hasAny = true; }
        if (entity.getDiscntAmt()           != null) { update.set(stSettleRaw.discntAmt,           entity.getDiscntAmt());           hasAny = true; }
        if (entity.getCouponDiscntAmt()     != null) { update.set(stSettleRaw.couponDiscntAmt,     entity.getCouponDiscntAmt());     hasAny = true; }
        if (entity.getPromoDiscntAmt()      != null) { update.set(stSettleRaw.promoDiscntAmt,      entity.getPromoDiscntAmt());      hasAny = true; }
        if (entity.getPromoId()             != null) { update.set(stSettleRaw.promoId,             entity.getPromoId());             hasAny = true; }
        if (entity.getCouponId()            != null) { update.set(stSettleRaw.couponId,            entity.getCouponId());            hasAny = true; }
        if (entity.getCouponIssueId()       != null) { update.set(stSettleRaw.couponIssueId,       entity.getCouponIssueId());       hasAny = true; }
        if (entity.getDiscntId()            != null) { update.set(stSettleRaw.discntId,            entity.getDiscntId());            hasAny = true; }
        if (entity.getVoucherId()           != null) { update.set(stSettleRaw.voucherId,           entity.getVoucherId());           hasAny = true; }
        if (entity.getVoucherIssueId()      != null) { update.set(stSettleRaw.voucherIssueId,      entity.getVoucherIssueId());      hasAny = true; }
        if (entity.getVoucherUseAmt()       != null) { update.set(stSettleRaw.voucherUseAmt,       entity.getVoucherUseAmt());       hasAny = true; }
        if (entity.getCacheUseAmt()         != null) { update.set(stSettleRaw.cacheUseAmt,         entity.getCacheUseAmt());         hasAny = true; }
        if (entity.getMileageUseAmt()       != null) { update.set(stSettleRaw.mileageUseAmt,       entity.getMileageUseAmt());       hasAny = true; }
        if (entity.getSaveSchdAmt()         != null) { update.set(stSettleRaw.saveSchdAmt,         entity.getSaveSchdAmt());         hasAny = true; }
        if (entity.getGiftId()              != null) { update.set(stSettleRaw.giftId,              entity.getGiftId());              hasAny = true; }
        if (entity.getGiftAmt()             != null) { update.set(stSettleRaw.giftAmt,             entity.getGiftAmt());             hasAny = true; }
        if (entity.getPayMethodCd()         != null) { update.set(stSettleRaw.payMethodCd,         entity.getPayMethodCd());         hasAny = true; }
        if (entity.getBuyConfirmYn()        != null) { update.set(stSettleRaw.buyConfirmYn,        entity.getBuyConfirmYn());        hasAny = true; }
        if (entity.getBuyConfirmDate()      != null) { update.set(stSettleRaw.buyConfirmDate,      entity.getBuyConfirmDate());      hasAny = true; }
        if (entity.getBundlePriceRate()     != null) { update.set(stSettleRaw.bundlePriceRate,     entity.getBundlePriceRate());     hasAny = true; }
        if (entity.getSettleTargetAmt()     != null) { update.set(stSettleRaw.settleTargetAmt,     entity.getSettleTargetAmt());     hasAny = true; }
        if (entity.getSettleFeeRate()       != null) { update.set(stSettleRaw.settleFeeRate,       entity.getSettleFeeRate());       hasAny = true; }
        if (entity.getSettleFeeAmt()        != null) { update.set(stSettleRaw.settleFeeAmt,        entity.getSettleFeeAmt());        hasAny = true; }
        if (entity.getSettleAmt()           != null) { update.set(stSettleRaw.settleAmt,           entity.getSettleAmt());           hasAny = true; }
        if (entity.getSettlePeriod()        != null) { update.set(stSettleRaw.settlePeriod,        entity.getSettlePeriod());        hasAny = true; }
        if (entity.getSettleId()            != null) { update.set(stSettleRaw.settleId,            entity.getSettleId());            hasAny = true; }
        if (entity.getCloseYn()             != null) { update.set(stSettleRaw.closeYn,             entity.getCloseYn());             hasAny = true; }
        if (entity.getCloseDate()           != null) { update.set(stSettleRaw.closeDate,           entity.getCloseDate());           hasAny = true; }
        if (entity.getSettleCloseId()       != null) { update.set(stSettleRaw.settleCloseId,       entity.getSettleCloseId());       hasAny = true; }
        if (entity.getErpVoucherId()        != null) { update.set(stSettleRaw.erpVoucherId,        entity.getErpVoucherId());        hasAny = true; }
        if (entity.getErpVoucherLineNo()    != null) { update.set(stSettleRaw.erpVoucherLineNo,    entity.getErpVoucherLineNo());    hasAny = true; }
        if (entity.getErpSendYn()           != null) { update.set(stSettleRaw.erpSendYn,           entity.getErpSendYn());           hasAny = true; }
        if (entity.getErpSendDate()         != null) { update.set(stSettleRaw.erpSendDate,         entity.getErpSendDate());         hasAny = true; }
        if (entity.getUpdBy()               != null) { update.set(stSettleRaw.updBy,               entity.getUpdBy());               hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(stSettleRaw.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(stSettleRaw.settleRawId.eq(entity.getSettleRawId())).execute();
        return (int) affected;
    }
}
