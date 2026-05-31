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
    private static final QStSettleRaw a    = QStSettleRaw.stSettleRaw;
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
                .where(a.settleRawId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 정산 원천 데이터 목록조회 */
    @Override
    public List<StSettleRawDto.Item> selectList(StSettleRawDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<StSettleRawDto.Item> query = baseListQuery().where(
                baseAndSiteId(search),
                baseAndSettleRawId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        );
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

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<StSettleRawDto.Item> query = baseListQuery().where(
                baseAndSiteId(search),
                baseAndSettleRawId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<StSettleRawDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(a.count())
                .from(a)
                .where(
                baseAndSiteId(search),
                baseAndSettleRawId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        )
                .fetchOne();

        StSettleRawDto.PageResponse res = new StSettleRawDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 정산 원천 데이터 baseListQuery */
    private JPAQuery<StSettleRawDto.Item> baseListQuery() {
        return queryFactory
                .select(Projections.bean(StSettleRawDto.Item.class,
                        a.settleRawId, a.siteId, a.rawTypeCd, a.rawStatusCd, a.rawStatusCdBefore,
                        a.orderId, a.orderNo, a.orderItemId, a.orderDate, a.orderItemStatusCd,
                        a.memberId, a.claimId, a.claimItemId, a.vendorId, a.vendorTypeCd,
                        a.prodId, a.prodNm, a.brandId, a.brandNm,
                        a.categoryId1, a.categoryId2, a.categoryId3, a.categoryId4, a.categoryId5,
                        a.skuId, a.optItemId1, a.optItemId2, a.mdUserId,
                        a.normalPrice, a.unitPrice, a.orderQty, a.itemPrice, a.discntAmt,
                        a.couponDiscntAmt, a.promoDiscntAmt, a.promoId, a.couponId, a.couponIssueId,
                        a.discntId, a.voucherId, a.voucherIssueId, a.voucherUseAmt,
                        a.cacheUseAmt, a.mileageUseAmt, a.saveSchdAmt, a.giftId, a.giftAmt,
                        a.payMethodCd, a.buyConfirmYn, a.buyConfirmDate, a.bundlePriceRate,
                        a.settleTargetAmt, a.settleFeeRate, a.settleFeeAmt, a.settleAmt,
                        a.settlePeriod, a.settleId, a.closeYn, a.closeDate, a.settleCloseId,
                        a.erpVoucherId, a.erpVoucherLineNo, a.erpSendYn, a.erpSendDate,
                        a.regBy, a.regDate, a.updBy, a.updDate,
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
                .from(a)
                .leftJoin(ste).on(ste.siteId.eq(a.siteId))
                .leftJoin(ord).on(ord.orderId.eq(a.orderId))
                .leftJoin(ite).on(ite.orderItemId.eq(a.orderItemId))
                .leftJoin(mem).on(mem.memberId.eq(a.memberId))
                .leftJoin(cla).on(cla.claimId.eq(a.claimId))
                .leftJoin(ite2).on(ite2.claimItemId.eq(a.claimItemId))
                .leftJoin(vnd).on(vnd.vendorId.eq(a.vendorId))
                .leftJoin(prd).on(prd.prodId.eq(a.prodId))
                .leftJoin(brd).on(brd.brandId.eq(a.brandId))
                .leftJoin(usr).on(usr.userId.eq(a.mdUserId))
                .leftJoin(evt).on(evt.eventId.eq(a.promoId))
                .leftJoin(cpn).on(cpn.couponId.eq(a.couponId))
                .leftJoin(dis).on(dis.discntId.eq(a.discntId))
                .leftJoin(vou).on(vou.voucherId.eq(a.voucherId))
                .leftJoin(gif).on(gif.giftId.eq(a.giftId))
                .leftJoin(cdRt).on(cdRt.codeGrp.eq("RAW_TYPE").and(cdRt.codeValue.eq(a.rawTypeCd)))
                .leftJoin(cdRs).on(cdRs.codeGrp.eq("RAW_STATUS").and(cdRs.codeValue.eq(a.rawStatusCd)))
                .leftJoin(cdOis).on(cdOis.codeGrp.eq("ORDER_ITEM_STATUS").and(cdOis.codeValue.eq(a.orderItemStatusCd)))
                .leftJoin(cdVt).on(cdVt.codeGrp.eq("VENDOR_TYPE").and(cdVt.codeValue.eq(a.vendorTypeCd)))
                .leftJoin(cdPmc).on(cdPmc.codeGrp.eq("PAY_METHOD_CD").and(cdPmc.codeValue.eq(a.payMethodCd)));
    }

    /* searchType 사용 예  searchType = "blogTitle,blogAuthor" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(StSettleRawDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? a.siteId.eq(search.getSiteId()) : null;
    }

    /* settleRawId 정확 일치 */
    private BooleanExpression baseAndSettleRawId(StSettleRawDto.Request search) {
        return search != null && StringUtils.hasText(search.getSettleRawId())
                ? a.settleRawId.eq(search.getSettleRawId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression baseAndDateRange(StSettleRawDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "order_date": return a.orderDate.goe(start).and(a.orderDate.lt(endExcl));
            case "reg_date": return a.regDate.goe(start).and(a.regDate.lt(endExcl));
            case "upd_date": return a.updDate.goe(start).and(a.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(StSettleRawDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",brandId,", a.brandId, pattern);
        or = orLike(or, all, types, ",brandNm,", a.brandNm, pattern);
        or = orLike(or, all, types, ",buyConfirmYn,", a.buyConfirmYn, pattern);
        or = orLike(or, all, types, ",categoryId1,", a.categoryId1, pattern);
        or = orLike(or, all, types, ",categoryId2,", a.categoryId2, pattern);
        or = orLike(or, all, types, ",categoryId3,", a.categoryId3, pattern);
        or = orLike(or, all, types, ",categoryId4,", a.categoryId4, pattern);
        or = orLike(or, all, types, ",categoryId5,", a.categoryId5, pattern);
        or = orLike(or, all, types, ",claimId,", a.claimId, pattern);
        or = orLike(or, all, types, ",claimItemId,", a.claimItemId, pattern);
        or = orLike(or, all, types, ",closeYn,", a.closeYn, pattern);
        or = orLike(or, all, types, ",couponId,", a.couponId, pattern);
        or = orLike(or, all, types, ",couponIssueId,", a.couponIssueId, pattern);
        or = orLike(or, all, types, ",discntId,", a.discntId, pattern);
        or = orLike(or, all, types, ",erpSendYn,", a.erpSendYn, pattern);
        or = orLike(or, all, types, ",erpVoucherId,", a.erpVoucherId, pattern);
        or = orLike(or, all, types, ",giftId,", a.giftId, pattern);
        or = orLike(or, all, types, ",mdUserId,", a.mdUserId, pattern);
        or = orLike(or, all, types, ",memberId,", a.memberId, pattern);
        or = orLike(or, all, types, ",optItemId1,", a.optItemId1, pattern);
        or = orLike(or, all, types, ",optItemId2,", a.optItemId2, pattern);
        or = orLike(or, all, types, ",orderId,", a.orderId, pattern);
        or = orLike(or, all, types, ",orderItemId,", a.orderItemId, pattern);
        or = orLike(or, all, types, ",orderItemStatusCd,", a.orderItemStatusCd, pattern);
        or = orLike(or, all, types, ",orderNo,", a.orderNo, pattern);
        or = orLike(or, all, types, ",payMethodCd,", a.payMethodCd, pattern);
        or = orLike(or, all, types, ",prodId,", a.prodId, pattern);
        or = orLike(or, all, types, ",prodNm,", a.prodNm, pattern);
        or = orLike(or, all, types, ",promoId,", a.promoId, pattern);
        or = orLike(or, all, types, ",rawStatusCd,", a.rawStatusCd, pattern);
        or = orLike(or, all, types, ",rawStatusCdBefore,", a.rawStatusCdBefore, pattern);
        or = orLike(or, all, types, ",rawTypeCd,", a.rawTypeCd, pattern);
        or = orLike(or, all, types, ",settleCloseId,", a.settleCloseId, pattern);
        or = orLike(or, all, types, ",settleId,", a.settleId, pattern);
        or = orLike(or, all, types, ",settlePeriod,", a.settlePeriod, pattern);
        or = orLike(or, all, types, ",settleRawId,", a.settleRawId, pattern);
        or = orLike(or, all, types, ",siteId,", a.siteId, pattern);
        or = orLike(or, all, types, ",skuId,", a.skuId, pattern);
        or = orLike(or, all, types, ",vendorId,", a.vendorId, pattern);
        or = orLike(or, all, types, ",vendorTypeCd,", a.vendorTypeCd, pattern);
        or = orLike(or, all, types, ",voucherId,", a.voucherId, pattern);
        or = orLike(or, all, types, ",voucherIssueId,", a.voucherIssueId, pattern);
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
            orders.add(new OrderSpecifier(Order.DESC, a.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, a.settleRawId));
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
                    orders.add(new OrderSpecifier(order, a.settleRawId));
                } else if ("prodNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, a.prodNm));
                } else if ("orderDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, a.orderDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, a.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, a.settleRawId));
        }
        return orders;
    }

    /* 정산 원천 데이터 수정 */
    @Override
    public int updateSelective(StSettleRaw entity) {
        if (entity.getSettleRawId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(a);
        boolean hasAny = false;

        if (entity.getSiteId()              != null) { update.set(a.siteId,              entity.getSiteId());              hasAny = true; }
        if (entity.getRawTypeCd()           != null) { update.set(a.rawTypeCd,           entity.getRawTypeCd());           hasAny = true; }
        if (entity.getRawStatusCd()         != null) { update.set(a.rawStatusCd,         entity.getRawStatusCd());         hasAny = true; }
        if (entity.getRawStatusCdBefore()   != null) { update.set(a.rawStatusCdBefore,   entity.getRawStatusCdBefore());   hasAny = true; }
        if (entity.getOrderId()             != null) { update.set(a.orderId,             entity.getOrderId());             hasAny = true; }
        if (entity.getOrderNo()             != null) { update.set(a.orderNo,             entity.getOrderNo());             hasAny = true; }
        if (entity.getOrderItemId()         != null) { update.set(a.orderItemId,         entity.getOrderItemId());         hasAny = true; }
        if (entity.getOrderDate()           != null) { update.set(a.orderDate,           entity.getOrderDate());           hasAny = true; }
        if (entity.getOrderItemStatusCd()   != null) { update.set(a.orderItemStatusCd,   entity.getOrderItemStatusCd());   hasAny = true; }
        if (entity.getMemberId()            != null) { update.set(a.memberId,            entity.getMemberId());            hasAny = true; }
        if (entity.getClaimId()             != null) { update.set(a.claimId,             entity.getClaimId());             hasAny = true; }
        if (entity.getClaimItemId()         != null) { update.set(a.claimItemId,         entity.getClaimItemId());         hasAny = true; }
        if (entity.getVendorId()            != null) { update.set(a.vendorId,            entity.getVendorId());            hasAny = true; }
        if (entity.getVendorTypeCd()        != null) { update.set(a.vendorTypeCd,        entity.getVendorTypeCd());        hasAny = true; }
        if (entity.getProdId()              != null) { update.set(a.prodId,              entity.getProdId());              hasAny = true; }
        if (entity.getProdNm()              != null) { update.set(a.prodNm,              entity.getProdNm());              hasAny = true; }
        if (entity.getBrandId()             != null) { update.set(a.brandId,             entity.getBrandId());             hasAny = true; }
        if (entity.getBrandNm()             != null) { update.set(a.brandNm,             entity.getBrandNm());             hasAny = true; }
        if (entity.getCategoryId1()         != null) { update.set(a.categoryId1,         entity.getCategoryId1());         hasAny = true; }
        if (entity.getCategoryId2()         != null) { update.set(a.categoryId2,         entity.getCategoryId2());         hasAny = true; }
        if (entity.getCategoryId3()         != null) { update.set(a.categoryId3,         entity.getCategoryId3());         hasAny = true; }
        if (entity.getCategoryId4()         != null) { update.set(a.categoryId4,         entity.getCategoryId4());         hasAny = true; }
        if (entity.getCategoryId5()         != null) { update.set(a.categoryId5,         entity.getCategoryId5());         hasAny = true; }
        if (entity.getSkuId()               != null) { update.set(a.skuId,               entity.getSkuId());               hasAny = true; }
        if (entity.getOptItemId1()          != null) { update.set(a.optItemId1,          entity.getOptItemId1());          hasAny = true; }
        if (entity.getOptItemId2()          != null) { update.set(a.optItemId2,          entity.getOptItemId2());          hasAny = true; }
        if (entity.getMdUserId()            != null) { update.set(a.mdUserId,            entity.getMdUserId());            hasAny = true; }
        if (entity.getNormalPrice()         != null) { update.set(a.normalPrice,         entity.getNormalPrice());         hasAny = true; }
        if (entity.getUnitPrice()           != null) { update.set(a.unitPrice,           entity.getUnitPrice());           hasAny = true; }
        if (entity.getOrderQty()            != null) { update.set(a.orderQty,            entity.getOrderQty());            hasAny = true; }
        if (entity.getItemPrice()           != null) { update.set(a.itemPrice,           entity.getItemPrice());           hasAny = true; }
        if (entity.getDiscntAmt()           != null) { update.set(a.discntAmt,           entity.getDiscntAmt());           hasAny = true; }
        if (entity.getCouponDiscntAmt()     != null) { update.set(a.couponDiscntAmt,     entity.getCouponDiscntAmt());     hasAny = true; }
        if (entity.getPromoDiscntAmt()      != null) { update.set(a.promoDiscntAmt,      entity.getPromoDiscntAmt());      hasAny = true; }
        if (entity.getPromoId()             != null) { update.set(a.promoId,             entity.getPromoId());             hasAny = true; }
        if (entity.getCouponId()            != null) { update.set(a.couponId,            entity.getCouponId());            hasAny = true; }
        if (entity.getCouponIssueId()       != null) { update.set(a.couponIssueId,       entity.getCouponIssueId());       hasAny = true; }
        if (entity.getDiscntId()            != null) { update.set(a.discntId,            entity.getDiscntId());            hasAny = true; }
        if (entity.getVoucherId()           != null) { update.set(a.voucherId,           entity.getVoucherId());           hasAny = true; }
        if (entity.getVoucherIssueId()      != null) { update.set(a.voucherIssueId,      entity.getVoucherIssueId());      hasAny = true; }
        if (entity.getVoucherUseAmt()       != null) { update.set(a.voucherUseAmt,       entity.getVoucherUseAmt());       hasAny = true; }
        if (entity.getCacheUseAmt()         != null) { update.set(a.cacheUseAmt,         entity.getCacheUseAmt());         hasAny = true; }
        if (entity.getMileageUseAmt()       != null) { update.set(a.mileageUseAmt,       entity.getMileageUseAmt());       hasAny = true; }
        if (entity.getSaveSchdAmt()         != null) { update.set(a.saveSchdAmt,         entity.getSaveSchdAmt());         hasAny = true; }
        if (entity.getGiftId()              != null) { update.set(a.giftId,              entity.getGiftId());              hasAny = true; }
        if (entity.getGiftAmt()             != null) { update.set(a.giftAmt,             entity.getGiftAmt());             hasAny = true; }
        if (entity.getPayMethodCd()         != null) { update.set(a.payMethodCd,         entity.getPayMethodCd());         hasAny = true; }
        if (entity.getBuyConfirmYn()        != null) { update.set(a.buyConfirmYn,        entity.getBuyConfirmYn());        hasAny = true; }
        if (entity.getBuyConfirmDate()      != null) { update.set(a.buyConfirmDate,      entity.getBuyConfirmDate());      hasAny = true; }
        if (entity.getBundlePriceRate()     != null) { update.set(a.bundlePriceRate,     entity.getBundlePriceRate());     hasAny = true; }
        if (entity.getSettleTargetAmt()     != null) { update.set(a.settleTargetAmt,     entity.getSettleTargetAmt());     hasAny = true; }
        if (entity.getSettleFeeRate()       != null) { update.set(a.settleFeeRate,       entity.getSettleFeeRate());       hasAny = true; }
        if (entity.getSettleFeeAmt()        != null) { update.set(a.settleFeeAmt,        entity.getSettleFeeAmt());        hasAny = true; }
        if (entity.getSettleAmt()           != null) { update.set(a.settleAmt,           entity.getSettleAmt());           hasAny = true; }
        if (entity.getSettlePeriod()        != null) { update.set(a.settlePeriod,        entity.getSettlePeriod());        hasAny = true; }
        if (entity.getSettleId()            != null) { update.set(a.settleId,            entity.getSettleId());            hasAny = true; }
        if (entity.getCloseYn()             != null) { update.set(a.closeYn,             entity.getCloseYn());             hasAny = true; }
        if (entity.getCloseDate()           != null) { update.set(a.closeDate,           entity.getCloseDate());           hasAny = true; }
        if (entity.getSettleCloseId()       != null) { update.set(a.settleCloseId,       entity.getSettleCloseId());       hasAny = true; }
        if (entity.getErpVoucherId()        != null) { update.set(a.erpVoucherId,        entity.getErpVoucherId());        hasAny = true; }
        if (entity.getErpVoucherLineNo()    != null) { update.set(a.erpVoucherLineNo,    entity.getErpVoucherLineNo());    hasAny = true; }
        if (entity.getErpSendYn()           != null) { update.set(a.erpSendYn,           entity.getErpSendYn());           hasAny = true; }
        if (entity.getErpSendDate()         != null) { update.set(a.erpSendDate,         entity.getErpSendDate());         hasAny = true; }
        if (entity.getUpdBy()               != null) { update.set(a.updBy,               entity.getUpdBy());               hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(a.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(a.settleRawId.eq(entity.getSettleRawId())).execute();
        return (int) affected;
    }
}
