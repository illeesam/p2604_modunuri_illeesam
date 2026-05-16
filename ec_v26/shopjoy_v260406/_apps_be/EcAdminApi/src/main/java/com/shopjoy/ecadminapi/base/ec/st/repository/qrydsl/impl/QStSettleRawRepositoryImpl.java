package com.shopjoy.ecadminapi.base.ec.st.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
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
    private static final QStSettleRaw r    = QStSettleRaw.stSettleRaw;
    private static final QSySite      ste  = QSySite.sySite;
    private static final QOdOrder     ord  = QOdOrder.odOrder;
    private static final QOdOrderItem ite  = QOdOrderItem.odOrderItem;
    private static final QMbMember    mem  = QMbMember.mbMember;
    private static final QOdClaim     cla  = QOdClaim.odClaim;
    private static final QOdClaimItem ite2 = QOdClaimItem.odClaimItem;
    private static final QSyVendor    vnd  = QSyVendor.syVendor;
    private static final QPdProd      prd  = QPdProd.pdProd;
    private static final QSyBrand     brd  = QSyBrand.syBrand;
    private static final QSyUser      usr  = QSyUser.syUser;
    private static final QPmEvent     evt  = QPmEvent.pmEvent;
    private static final QPmCoupon    cpn  = QPmCoupon.pmCoupon;
    private static final QPmDiscnt    dis  = QPmDiscnt.pmDiscnt;
    private static final QPmVoucher   vou  = QPmVoucher.pmVoucher;
    private static final QPmGift      gif  = QPmGift.pmGift;
    private static final QSyCode      cdRt  = new QSyCode("cd_rt");
    private static final QSyCode      cdRs  = new QSyCode("cd_rs");
    private static final QSyCode      cdOis = new QSyCode("cd_ois");
    private static final QSyCode      cdVt  = new QSyCode("cd_vt");
    private static final QSyCode      cdPmc = new QSyCode("cd_pmc");

    /* 정산 원천 데이터 키조회 */
    @Override
    public Optional<StSettleRawDto.Item> selectById(String id) {
        StSettleRawDto.Item dto = baseListQuery()
                .where(r.settleRawId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 정산 원천 데이터 목록조회 */
    @Override
    public List<StSettleRawDto.Item> selectList(StSettleRawDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<StSettleRawDto.Item> query = baseListQuery().where(where);
        if (!orderList.isEmpty()) {
            query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            query.offset(offset).limit(pageSize);
        }
        return query.fetch();
    }

    /* 정산 원천 데이터 페이지조회 */
    @Override
    public StSettleRawDto.PageResponse selectPageList(StSettleRawDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<StSettleRawDto.Item> query = baseListQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<StSettleRawDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(r.count())
                .from(r)
                .where(where)
                .fetchOne();

        StSettleRawDto.PageResponse res = new StSettleRawDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 정산 원천 데이터 baseListQuery */
    private JPAQuery<StSettleRawDto.Item> baseListQuery() {
        return queryFactory
                .select(Projections.bean(StSettleRawDto.Item.class,
                        r.settleRawId, r.siteId, r.rawTypeCd, r.rawStatusCd, r.rawStatusCdBefore,
                        r.orderId, r.orderNo, r.orderItemId, r.orderDate, r.orderItemStatusCd,
                        r.memberId, r.claimId, r.claimItemId, r.vendorId, r.vendorTypeCd,
                        r.prodId, r.prodNm, r.brandId, r.brandNm,
                        r.categoryId1, r.categoryId2, r.categoryId3, r.categoryId4, r.categoryId5,
                        r.skuId, r.optItemId1, r.optItemId2, r.mdUserId,
                        r.normalPrice, r.unitPrice, r.orderQty, r.itemPrice, r.discntAmt,
                        r.couponDiscntAmt, r.promoDiscntAmt, r.promoId, r.couponId, r.couponIssueId,
                        r.discntId, r.voucherId, r.voucherIssueId, r.voucherUseAmt,
                        r.cacheUseAmt, r.mileageUseAmt, r.saveSchdAmt, r.giftId, r.giftAmt,
                        r.payMethodCd, r.buyConfirmYn, r.buyConfirmDate, r.bundlePriceRate,
                        r.settleTargetAmt, r.settleFeeRate, r.settleFeeAmt, r.settleAmt,
                        r.settlePeriod, r.settleId, r.closeYn, r.closeDate, r.settleCloseId,
                        r.erpVoucherId, r.erpVoucherLineNo, r.erpSendYn, r.erpSendDate,
                        r.regBy, r.regDate, r.updBy, r.updDate,
                        ste.siteNm.as("siteNm"),
                        ord.memberNm.as("orderNm"),
                        ite.prodNm.as("orderItemNm"),
                        mem.memberNm.as("memberNm"),
                        cla.memberNm.as("claimNm"),
                        ite2.prodNm.as("claimItemNm"),
                        vnd.vendorNm.as("vendorNm"),
                        prd.prodNm.as("prodIdNm"),
                        brd.brandNm.as("brandIdNm"),
                        usr.userNm.as("mdUserNm"),
                        evt.eventNm.as("promoNm"),
                        cpn.couponNm.as("couponNm"),
                        dis.discntNm.as("discntNm"),
                        vou.voucherNm.as("voucherNm"),
                        gif.giftNm.as("giftNm"),
                        cdRt.codeLabel.as("rawTypeCdNm"),
                        cdRs.codeLabel.as("rawStatusCdNm"),
                        cdOis.codeLabel.as("orderItemStatusCdNm"),
                        cdVt.codeLabel.as("vendorTypeCdNm"),
                        cdPmc.codeLabel.as("payMethodCdNm")
                ))
                .from(r)
                .leftJoin(ste).on(ste.siteId.eq(r.siteId))
                .leftJoin(ord).on(ord.orderId.eq(r.orderId))
                .leftJoin(ite).on(ite.orderItemId.eq(r.orderItemId))
                .leftJoin(mem).on(mem.memberId.eq(r.memberId))
                .leftJoin(cla).on(cla.claimId.eq(r.claimId))
                .leftJoin(ite2).on(ite2.claimItemId.eq(r.claimItemId))
                .leftJoin(vnd).on(vnd.vendorId.eq(r.vendorId))
                .leftJoin(prd).on(prd.prodId.eq(r.prodId))
                .leftJoin(brd).on(brd.brandId.eq(r.brandId))
                .leftJoin(usr).on(usr.userId.eq(r.mdUserId))
                .leftJoin(evt).on(evt.eventId.eq(r.promoId))
                .leftJoin(cpn).on(cpn.couponId.eq(r.couponId))
                .leftJoin(dis).on(dis.discntId.eq(r.discntId))
                .leftJoin(vou).on(vou.voucherId.eq(r.voucherId))
                .leftJoin(gif).on(gif.giftId.eq(r.giftId))
                .leftJoin(cdRt).on(cdRt.codeGrp.eq("RAW_TYPE").and(cdRt.codeValue.eq(r.rawTypeCd)))
                .leftJoin(cdRs).on(cdRs.codeGrp.eq("RAW_STATUS").and(cdRs.codeValue.eq(r.rawStatusCd)))
                .leftJoin(cdOis).on(cdOis.codeGrp.eq("ORDER_ITEM_STATUS").and(cdOis.codeValue.eq(r.orderItemStatusCd)))
                .leftJoin(cdVt).on(cdVt.codeGrp.eq("VENDOR_TYPE").and(cdVt.codeValue.eq(r.vendorTypeCd)))
                .leftJoin(cdPmc).on(cdPmc.codeGrp.eq("PAY_METHOD_CD").and(cdPmc.codeValue.eq(r.payMethodCd)));
    }

    /* searchType 사용 예  searchType = "blogTitle,blogAuthor" */
    private BooleanBuilder buildCondition(StSettleRawDto.Request c) {
        BooleanBuilder w = new BooleanBuilder();
        if (c == null) return w;

        if (StringUtils.hasText(c.getSiteId()))      w.and(r.siteId.eq(c.getSiteId()));
        if (StringUtils.hasText(c.getSettleRawId())) w.and(r.settleRawId.eq(c.getSettleRawId()));

        // searchValue / searchType — prodNm, brandNm
        if (StringUtils.hasText(c.getSearchValue())) {
            String types = "," + (c.getSearchType() == null ? "" : c.getSearchType().trim()) + ",";
            BooleanBuilder or = new BooleanBuilder();
            if (!StringUtils.hasText(types) || types.contains(",prodNm,")) {
                or.or(r.prodNm.containsIgnoreCase(c.getSearchValue()));
            }
            if (!StringUtils.hasText(types) || types.contains(",brandNm,")) {
                or.or(r.brandNm.containsIgnoreCase(c.getSearchValue()));
            }
            if (or.getValue() != null) w.and(or);
        }

        if (StringUtils.hasText(c.getDateType())
                && StringUtils.hasText(c.getDateStart())
                && StringUtils.hasText(c.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDateTime start   = LocalDate.parse(c.getDateStart(), fmt).atStartOfDay();
            LocalDateTime endExcl = LocalDate.parse(c.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
            switch (c.getDateType()) {
                case "order_date":
                    w.and(r.orderDate.goe(start)).and(r.orderDate.lt(endExcl)); break;
                case "reg_date":
                    w.and(r.regDate.goe(start)).and(r.regDate.lt(endExcl)); break;
                case "upd_date":
                    w.and(r.updDate.goe(start)).and(r.updDate.lt(endExcl)); break;
                default: break;
            }
        }
        return w;
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
            orders.add(new OrderSpecifier(Order.DESC, r.regDate));
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
                    orders.add(new OrderSpecifier(order, r.settleRawId));
                } else if ("prodNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, r.prodNm));
                } else if ("orderDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, r.orderDate));
                }
            }
        }
        return orders;
    }

    /* 정산 원천 데이터 수정 */
    @Override
    public int updateSelective(StSettleRaw entity) {
        if (entity.getSettleRawId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(r);
        boolean hasAny = false;

        if (entity.getSiteId()              != null) { update.set(r.siteId,              entity.getSiteId());              hasAny = true; }
        if (entity.getRawTypeCd()           != null) { update.set(r.rawTypeCd,           entity.getRawTypeCd());           hasAny = true; }
        if (entity.getRawStatusCd()         != null) { update.set(r.rawStatusCd,         entity.getRawStatusCd());         hasAny = true; }
        if (entity.getRawStatusCdBefore()   != null) { update.set(r.rawStatusCdBefore,   entity.getRawStatusCdBefore());   hasAny = true; }
        if (entity.getOrderId()             != null) { update.set(r.orderId,             entity.getOrderId());             hasAny = true; }
        if (entity.getOrderNo()             != null) { update.set(r.orderNo,             entity.getOrderNo());             hasAny = true; }
        if (entity.getOrderItemId()         != null) { update.set(r.orderItemId,         entity.getOrderItemId());         hasAny = true; }
        if (entity.getOrderDate()           != null) { update.set(r.orderDate,           entity.getOrderDate());           hasAny = true; }
        if (entity.getOrderItemStatusCd()   != null) { update.set(r.orderItemStatusCd,   entity.getOrderItemStatusCd());   hasAny = true; }
        if (entity.getMemberId()            != null) { update.set(r.memberId,            entity.getMemberId());            hasAny = true; }
        if (entity.getClaimId()             != null) { update.set(r.claimId,             entity.getClaimId());             hasAny = true; }
        if (entity.getClaimItemId()         != null) { update.set(r.claimItemId,         entity.getClaimItemId());         hasAny = true; }
        if (entity.getVendorId()            != null) { update.set(r.vendorId,            entity.getVendorId());            hasAny = true; }
        if (entity.getVendorTypeCd()        != null) { update.set(r.vendorTypeCd,        entity.getVendorTypeCd());        hasAny = true; }
        if (entity.getProdId()              != null) { update.set(r.prodId,              entity.getProdId());              hasAny = true; }
        if (entity.getProdNm()              != null) { update.set(r.prodNm,              entity.getProdNm());              hasAny = true; }
        if (entity.getBrandId()             != null) { update.set(r.brandId,             entity.getBrandId());             hasAny = true; }
        if (entity.getBrandNm()             != null) { update.set(r.brandNm,             entity.getBrandNm());             hasAny = true; }
        if (entity.getCategoryId1()         != null) { update.set(r.categoryId1,         entity.getCategoryId1());         hasAny = true; }
        if (entity.getCategoryId2()         != null) { update.set(r.categoryId2,         entity.getCategoryId2());         hasAny = true; }
        if (entity.getCategoryId3()         != null) { update.set(r.categoryId3,         entity.getCategoryId3());         hasAny = true; }
        if (entity.getCategoryId4()         != null) { update.set(r.categoryId4,         entity.getCategoryId4());         hasAny = true; }
        if (entity.getCategoryId5()         != null) { update.set(r.categoryId5,         entity.getCategoryId5());         hasAny = true; }
        if (entity.getSkuId()               != null) { update.set(r.skuId,               entity.getSkuId());               hasAny = true; }
        if (entity.getOptItemId1()          != null) { update.set(r.optItemId1,          entity.getOptItemId1());          hasAny = true; }
        if (entity.getOptItemId2()          != null) { update.set(r.optItemId2,          entity.getOptItemId2());          hasAny = true; }
        if (entity.getMdUserId()            != null) { update.set(r.mdUserId,            entity.getMdUserId());            hasAny = true; }
        if (entity.getNormalPrice()         != null) { update.set(r.normalPrice,         entity.getNormalPrice());         hasAny = true; }
        if (entity.getUnitPrice()           != null) { update.set(r.unitPrice,           entity.getUnitPrice());           hasAny = true; }
        if (entity.getOrderQty()            != null) { update.set(r.orderQty,            entity.getOrderQty());            hasAny = true; }
        if (entity.getItemPrice()           != null) { update.set(r.itemPrice,           entity.getItemPrice());           hasAny = true; }
        if (entity.getDiscntAmt()           != null) { update.set(r.discntAmt,           entity.getDiscntAmt());           hasAny = true; }
        if (entity.getCouponDiscntAmt()     != null) { update.set(r.couponDiscntAmt,     entity.getCouponDiscntAmt());     hasAny = true; }
        if (entity.getPromoDiscntAmt()      != null) { update.set(r.promoDiscntAmt,      entity.getPromoDiscntAmt());      hasAny = true; }
        if (entity.getPromoId()             != null) { update.set(r.promoId,             entity.getPromoId());             hasAny = true; }
        if (entity.getCouponId()            != null) { update.set(r.couponId,            entity.getCouponId());            hasAny = true; }
        if (entity.getCouponIssueId()       != null) { update.set(r.couponIssueId,       entity.getCouponIssueId());       hasAny = true; }
        if (entity.getDiscntId()            != null) { update.set(r.discntId,            entity.getDiscntId());            hasAny = true; }
        if (entity.getVoucherId()           != null) { update.set(r.voucherId,           entity.getVoucherId());           hasAny = true; }
        if (entity.getVoucherIssueId()      != null) { update.set(r.voucherIssueId,      entity.getVoucherIssueId());      hasAny = true; }
        if (entity.getVoucherUseAmt()       != null) { update.set(r.voucherUseAmt,       entity.getVoucherUseAmt());       hasAny = true; }
        if (entity.getCacheUseAmt()         != null) { update.set(r.cacheUseAmt,         entity.getCacheUseAmt());         hasAny = true; }
        if (entity.getMileageUseAmt()       != null) { update.set(r.mileageUseAmt,       entity.getMileageUseAmt());       hasAny = true; }
        if (entity.getSaveSchdAmt()         != null) { update.set(r.saveSchdAmt,         entity.getSaveSchdAmt());         hasAny = true; }
        if (entity.getGiftId()              != null) { update.set(r.giftId,              entity.getGiftId());              hasAny = true; }
        if (entity.getGiftAmt()             != null) { update.set(r.giftAmt,             entity.getGiftAmt());             hasAny = true; }
        if (entity.getPayMethodCd()         != null) { update.set(r.payMethodCd,         entity.getPayMethodCd());         hasAny = true; }
        if (entity.getBuyConfirmYn()        != null) { update.set(r.buyConfirmYn,        entity.getBuyConfirmYn());        hasAny = true; }
        if (entity.getBuyConfirmDate()      != null) { update.set(r.buyConfirmDate,      entity.getBuyConfirmDate());      hasAny = true; }
        if (entity.getBundlePriceRate()     != null) { update.set(r.bundlePriceRate,     entity.getBundlePriceRate());     hasAny = true; }
        if (entity.getSettleTargetAmt()     != null) { update.set(r.settleTargetAmt,     entity.getSettleTargetAmt());     hasAny = true; }
        if (entity.getSettleFeeRate()       != null) { update.set(r.settleFeeRate,       entity.getSettleFeeRate());       hasAny = true; }
        if (entity.getSettleFeeAmt()        != null) { update.set(r.settleFeeAmt,        entity.getSettleFeeAmt());        hasAny = true; }
        if (entity.getSettleAmt()           != null) { update.set(r.settleAmt,           entity.getSettleAmt());           hasAny = true; }
        if (entity.getSettlePeriod()        != null) { update.set(r.settlePeriod,        entity.getSettlePeriod());        hasAny = true; }
        if (entity.getSettleId()            != null) { update.set(r.settleId,            entity.getSettleId());            hasAny = true; }
        if (entity.getCloseYn()             != null) { update.set(r.closeYn,             entity.getCloseYn());             hasAny = true; }
        if (entity.getCloseDate()           != null) { update.set(r.closeDate,           entity.getCloseDate());           hasAny = true; }
        if (entity.getSettleCloseId()       != null) { update.set(r.settleCloseId,       entity.getSettleCloseId());       hasAny = true; }
        if (entity.getErpVoucherId()        != null) { update.set(r.erpVoucherId,        entity.getErpVoucherId());        hasAny = true; }
        if (entity.getErpVoucherLineNo()    != null) { update.set(r.erpVoucherLineNo,    entity.getErpVoucherLineNo());    hasAny = true; }
        if (entity.getErpSendYn()           != null) { update.set(r.erpSendYn,           entity.getErpSendYn());           hasAny = true; }
        if (entity.getErpSendDate()         != null) { update.set(r.erpSendDate,         entity.getErpSendDate());         hasAny = true; }
        if (entity.getUpdBy()               != null) { update.set(r.updBy,               entity.getUpdBy());               hasAny = true; }
        if (entity.getUpdDate()             != null) { update.set(r.updDate,             entity.getUpdDate());             hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(r.settleRawId.eq(entity.getSettleRawId())).execute();
        return (int) affected;
    }
}
