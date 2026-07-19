package com.shopjoy.ecadminapi.base.ec.st.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
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

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

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

    /* 정산 원천 데이터 baseListQuery */
    private JPAQuery<StSettleRawDto.Item> baseListQuery() {
        return queryFactory
                .select(Projections.bean(StSettleRawDto.Item.class,
                        stSettleRaw.settleRawId, stSettleRaw.siteId, stSettleRaw.rawTypeCd, stSettleRaw.rawStatusCd, stSettleRaw.rawStatusCdBefore,
                        stSettleRaw.orderId, stSettleRaw.orderNo, stSettleRaw.orderItemId, stSettleRaw.orderDate, stSettleRaw.orderItemStatusCd,
                        stSettleRaw.memberId, stSettleRaw.claimId, stSettleRaw.claimItemId, stSettleRaw.vendorId, stSettleRaw.vendorTypeCd,
                        stSettleRaw.prodId, stSettleRaw.prodNm, stSettleRaw.brandId, stSettleRaw.brandNm,
                        stSettleRaw.categoryId1, stSettleRaw.categoryId2, stSettleRaw.categoryId3, stSettleRaw.categoryId4, stSettleRaw.categoryId5,
                        stSettleRaw.prodSkuId, stSettleRaw.prodOptId1, stSettleRaw.prodOptId2, stSettleRaw.mdUserId,
                        stSettleRaw.normalPrice, stSettleRaw.unitPrice, stSettleRaw.orderQty, stSettleRaw.itemPrice, stSettleRaw.discntAmt,
                        stSettleRaw.couponDiscntAmt, stSettleRaw.promoDiscntAmt, stSettleRaw.promoId, stSettleRaw.couponId, stSettleRaw.couponIssueId,
                        stSettleRaw.discntId, stSettleRaw.voucherId, stSettleRaw.voucherIssueId, stSettleRaw.voucherUseAmt,
                        stSettleRaw.cacheUseAmt, stSettleRaw.mileageUseAmt, stSettleRaw.saveSchdAmt, stSettleRaw.giftId, stSettleRaw.giftAmt,
                        stSettleRaw.payMethodCd, stSettleRaw.buyConfirmYn, stSettleRaw.buyConfirmDate, stSettleRaw.bundlePriceRate,
                        stSettleRaw.settleTargetAmt, stSettleRaw.settleFeeRate, stSettleRaw.settleFeeAmt, stSettleRaw.settleAmt,
                        stSettleRaw.settlePeriod, stSettleRaw.settleId, stSettleRaw.closeYn, stSettleRaw.closeDate, stSettleRaw.settleCloseId,
                        stSettleRaw.erpVoucherId, stSettleRaw.erpVoucherLineNo, stSettleRaw.erpSendYn, stSettleRaw.erpSendDate,
                        stSettleRaw.regBy, stSettleRaw.regDate, stSettleRaw.updBy, stSettleRaw.updDate,
                        sySite.siteNm.as("siteNm"),
                        odOrder.memberNm.as("orderNm"),
                        odOrderItem.prodNm.as("orderItemNm"),
                        mbMember.memberNm.as("memberNm"),
                        odClaim.memberNm.as("claimNm"),
                        odClaimItem.prodNm.as("claimItemNm"),
                        syVendor.vendorNm.as("vendorNm"),
                        pdProd.prodNm.as("prodIdNm"),
                        syBrand.brandNm.as("brandIdNm"),
                        syUser.userNm.as("mdUserNm"),
                        pmEvent.eventNm.as("promoNm"),
                        pmCoupon.couponNm.as("couponNm"),
                        pmDiscnt.discntNm.as("discntNm"),
                        pmVoucher.voucherNm.as("voucherNm"),
                        pmGift.giftNm.as("giftNm"),
                        cdRt.codeLabel.as("rawTypeCdNm"),
                        cdRs.codeLabel.as("rawStatusCdNm"),
                        cdOis.codeLabel.as("orderItemStatusCdNm"),
                        cdVt.codeLabel.as("vendorTypeCdNm"),
                        cdPmc.codeLabel.as("payMethodCdNm")
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
                    andSiteIdEq(search),
                    andSettleRawIdEq(search),
                    andOrderIdEq(search),
                    andOrderItemIdEq(search),
                    andClaimIdEq(search),
                    andClaimItemIdEq(search),
                    andRawTypeCdEq(search),
                    andRawStatusCdEq(search),
                    andVendorTypeCdEq(search),
                    andPayMethodCdEq(search),
                    andBuyConfirmYnEq(search),
                    andCloseYnEq(search),
                    andErpSendYnEq(search),
                    andSettlePeriodEq(search),
                    andOrderItemStatusCdEq(search),
                    andAmtFromGoe(search),
                    andAmtToLoe(search),
                    andDateRangeBetween(search),
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
                andSiteIdEq(search),
                andSettleRawIdEq(search),
                andOrderIdEq(search),
                andOrderItemIdEq(search),
                andClaimIdEq(search),
                andClaimItemIdEq(search),
                andRawTypeCdEq(search),
                andRawStatusCdEq(search),
                andVendorTypeCdEq(search),
                andPayMethodCdEq(search),
                andBuyConfirmYnEq(search),
                andCloseYnEq(search),
                andErpSendYnEq(search),
                andSettlePeriodEq(search),
                andOrderItemStatusCdEq(search),
                andAmtFromGoe(search),
                andAmtToLoe(search),
                andDateRangeBetween(search),
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
     * .where(andSiteIdEq(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression andSiteIdEq(StSettleRawDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? stSettleRaw.siteId.eq(search.getSiteId()) : null;
    }

    /* settleRawId 정확 일치 */
    private BooleanExpression andSettleRawIdEq(StSettleRawDto.Request search) {
        return search != null && StringUtils.hasText(search.getSettleRawId())
                ? stSettleRaw.settleRawId.eq(search.getSettleRawId()) : null;
    }

    /* orderId 정확 일치 — 주문 기준 정산원장 조회 */
    private BooleanExpression andOrderIdEq(StSettleRawDto.Request search) {
        return search != null && StringUtils.hasText(search.getOrderId())
                ? stSettleRaw.orderId.eq(search.getOrderId()) : null;
    }

    /* orderItemId 정확 일치 */
    private BooleanExpression andOrderItemIdEq(StSettleRawDto.Request search) {
        return search != null && StringUtils.hasText(search.getOrderItemId())
                ? stSettleRaw.orderItemId.eq(search.getOrderItemId()) : null;
    }

    /* claimId 정확 일치 — 클레임 기준 정산원장 조회 */
    private BooleanExpression andClaimIdEq(StSettleRawDto.Request search) {
        return search != null && StringUtils.hasText(search.getClaimId())
                ? stSettleRaw.claimId.eq(search.getClaimId()) : null;
    }

    /* claimItemId 정확 일치 */
    private BooleanExpression andClaimItemIdEq(StSettleRawDto.Request search) {
        return search != null && StringUtils.hasText(search.getClaimItemId())
                ? stSettleRaw.claimItemId.eq(search.getClaimItemId()) : null;
    }

    /* rawTypeCd 정확 일치 (검색 필터) */
    private BooleanExpression andRawTypeCdEq(StSettleRawDto.Request search) {
        return search != null && StringUtils.hasText(search.getRawTypeCd())
                ? stSettleRaw.rawTypeCd.eq(search.getRawTypeCd()) : null;
    }

    /* rawStatusCd 정확 일치 (검색 필터) */
    private BooleanExpression andRawStatusCdEq(StSettleRawDto.Request search) {
        return search != null && StringUtils.hasText(search.getRawStatusCd())
                ? stSettleRaw.rawStatusCd.eq(search.getRawStatusCd()) : null;
    }

    /* vendorTypeCd 정확 일치 (검색 필터) */
    private BooleanExpression andVendorTypeCdEq(StSettleRawDto.Request search) {
        return search != null && StringUtils.hasText(search.getVendorTypeCd())
                ? stSettleRaw.vendorTypeCd.eq(search.getVendorTypeCd()) : null;
    }

    /* payMethodCd 정확 일치 (검색 필터) */
    private BooleanExpression andPayMethodCdEq(StSettleRawDto.Request search) {
        return search != null && StringUtils.hasText(search.getPayMethodCd())
                ? stSettleRaw.payMethodCd.eq(search.getPayMethodCd()) : null;
    }

    /* buyConfirmYn 정확 일치 (검색 필터) */
    private BooleanExpression andBuyConfirmYnEq(StSettleRawDto.Request search) {
        return search != null && StringUtils.hasText(search.getBuyConfirmYn())
                ? stSettleRaw.buyConfirmYn.eq(search.getBuyConfirmYn()) : null;
    }

    /* closeYn 정확 일치 (검색 필터) */
    private BooleanExpression andCloseYnEq(StSettleRawDto.Request search) {
        return search != null && StringUtils.hasText(search.getCloseYn())
                ? stSettleRaw.closeYn.eq(search.getCloseYn()) : null;
    }

    /* erpSendYn 정확 일치 (검색 필터) */
    private BooleanExpression andErpSendYnEq(StSettleRawDto.Request search) {
        return search != null && StringUtils.hasText(search.getErpSendYn())
                ? stSettleRaw.erpSendYn.eq(search.getErpSendYn()) : null;
    }

    /* settlePeriod 정확 일치 (검색 필터, YYYY-MM) */
    private BooleanExpression andSettlePeriodEq(StSettleRawDto.Request search) {
        return search != null && StringUtils.hasText(search.getSettlePeriod())
                ? stSettleRaw.settlePeriod.eq(search.getSettlePeriod()) : null;
    }

    /* orderItemStatusCd 정확 일치 (검색 필터) */
    private BooleanExpression andOrderItemStatusCdEq(StSettleRawDto.Request search) {
        return search != null && StringUtils.hasText(search.getOrderItemStatusCd())
                ? stSettleRaw.orderItemStatusCd.eq(search.getOrderItemStatusCd()) : null;
    }

    /* settleTargetAmt 최솟값 (검색 필터, 이상) */
    private BooleanExpression andAmtFromGoe(StSettleRawDto.Request search) {
        return search != null && search.getAmtFrom() != null
                ? stSettleRaw.settleTargetAmt.goe(search.getAmtFrom()) : null;
    }

    /* settleTargetAmt 최댓값 (검색 필터, 이하) */
    private BooleanExpression andAmtToLoe(StSettleRawDto.Request search) {
        return search != null && search.getAmtTo() != null
                ? stSettleRaw.settleTargetAmt.loe(search.getAmtTo()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression andDateRangeBetween(StSettleRawDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "order_date": return stSettleRaw.orderDate.goe(start).and(stSettleRaw.orderDate.lt(endExcl));
            case "reg_date": return stSettleRaw.regDate.goe(start).and(stSettleRaw.regDate.lt(endExcl));
            case "upd_date": return stSettleRaw.updDate.goe(start).and(stSettleRaw.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression andSearchValueLike(StSettleRawDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",brandId,", stSettleRaw.brandId, pattern);
        or = orLike(or, all, types, ",brandNm,", stSettleRaw.brandNm, pattern);
        or = orLike(or, all, types, ",buyConfirmYn,", stSettleRaw.buyConfirmYn, pattern);
        or = orLike(or, all, types, ",categoryId1,", stSettleRaw.categoryId1, pattern);
        or = orLike(or, all, types, ",categoryId2,", stSettleRaw.categoryId2, pattern);
        or = orLike(or, all, types, ",categoryId3,", stSettleRaw.categoryId3, pattern);
        or = orLike(or, all, types, ",categoryId4,", stSettleRaw.categoryId4, pattern);
        or = orLike(or, all, types, ",categoryId5,", stSettleRaw.categoryId5, pattern);
        or = orLike(or, all, types, ",claimId,", stSettleRaw.claimId, pattern);
        or = orLike(or, all, types, ",claimItemId,", stSettleRaw.claimItemId, pattern);
        or = orLike(or, all, types, ",closeYn,", stSettleRaw.closeYn, pattern);
        or = orLike(or, all, types, ",couponId,", stSettleRaw.couponId, pattern);
        or = orLike(or, all, types, ",couponIssueId,", stSettleRaw.couponIssueId, pattern);
        or = orLike(or, all, types, ",discntId,", stSettleRaw.discntId, pattern);
        or = orLike(or, all, types, ",erpSendYn,", stSettleRaw.erpSendYn, pattern);
        or = orLike(or, all, types, ",erpVoucherId,", stSettleRaw.erpVoucherId, pattern);
        or = orLike(or, all, types, ",giftId,", stSettleRaw.giftId, pattern);
        or = orLike(or, all, types, ",mdUserId,", stSettleRaw.mdUserId, pattern);
        or = orLike(or, all, types, ",memberId,", stSettleRaw.memberId, pattern);
        or = orLike(or, all, types, ",prodOptId1,", stSettleRaw.prodOptId1, pattern);
        or = orLike(or, all, types, ",prodOptId2,", stSettleRaw.prodOptId2, pattern);
        or = orLike(or, all, types, ",orderId,", stSettleRaw.orderId, pattern);
        or = orLike(or, all, types, ",orderItemId,", stSettleRaw.orderItemId, pattern);
        or = orLike(or, all, types, ",orderItemStatusCd,", stSettleRaw.orderItemStatusCd, pattern);
        or = orLike(or, all, types, ",orderNo,", stSettleRaw.orderNo, pattern);
        or = orLike(or, all, types, ",payMethodCd,", stSettleRaw.payMethodCd, pattern);
        or = orLike(or, all, types, ",prodId,", stSettleRaw.prodId, pattern);
        or = orLike(or, all, types, ",prodNm,", stSettleRaw.prodNm, pattern);
        or = orLike(or, all, types, ",promoId,", stSettleRaw.promoId, pattern);
        or = orLike(or, all, types, ",rawStatusCd,", stSettleRaw.rawStatusCd, pattern);
        or = orLike(or, all, types, ",rawStatusCdBefore,", stSettleRaw.rawStatusCdBefore, pattern);
        or = orLike(or, all, types, ",rawTypeCd,", stSettleRaw.rawTypeCd, pattern);
        or = orLike(or, all, types, ",settleCloseId,", stSettleRaw.settleCloseId, pattern);
        or = orLike(or, all, types, ",settleId,", stSettleRaw.settleId, pattern);
        or = orLike(or, all, types, ",settlePeriod,", stSettleRaw.settlePeriod, pattern);
        or = orLike(or, all, types, ",settleRawId,", stSettleRaw.settleRawId, pattern);
        or = orLike(or, all, types, ",siteId,", stSettleRaw.siteId, pattern);
        or = orLike(or, all, types, ",prodSkuId,", stSettleRaw.prodSkuId, pattern);
        or = orLike(or, all, types, ",vendorId,", stSettleRaw.vendorId, pattern);
        or = orLike(or, all, types, ",vendorTypeCd,", stSettleRaw.vendorTypeCd, pattern);
        or = orLike(or, all, types, ",voucherId,", stSettleRaw.voucherId, pattern);
        or = orLike(or, all, types, ",voucherIssueId,", stSettleRaw.voucherIssueId, pattern);
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
