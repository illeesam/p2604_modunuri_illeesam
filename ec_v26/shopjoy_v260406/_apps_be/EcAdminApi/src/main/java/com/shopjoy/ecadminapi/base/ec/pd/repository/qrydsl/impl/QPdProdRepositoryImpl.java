package com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.jpa.JPAExpressions;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdCategoryRepository;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProd;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdCategory;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProd;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProdImg;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdProdRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyBrand;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUser;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyVendor;
import lombok.RequiredArgsConstructor;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** PdProd QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPdProdRepositoryImpl implements QPdProdRepository {

    private final JPAQueryFactory queryFactory;
    private final PdCategoryRepository pdCategoryRepository;
    private static final String QRY_SRC = "base.ec.pd.repository.qrydsl.impl.QPdProdRepositoryImpl";
    private static final QPdProd     a   = QPdProd.pdProd;
    private static final QPdCategory cat = QPdCategory.pdCategory;
    private static final QSyBrand    b   = QSyBrand.syBrand;
    private static final QSyVendor   v   = QSyVendor.syVendor;
    private static final QSyUser     u   = QSyUser.syUser;
    private static final QSyCode     cdPs = new QSyCode("cd_ps");
    private static final QSyCode     cdPt = new QSyCode("cd_pt");
    private static final QSyCode     cdSz = new QSyCode("cd_sz");

    /** 단건 조회 — selectById 와 동일 컬럼 셋 (size_info_cd_nm 포함) */
    @Override
    public Optional<PdProdDto.Item> selectById(String prodId) {
        PdProdDto.Item dto = queryFactory
                .select(Projections.bean(PdProdDto.Item.class,
                        // a.* equivalent
                        a.prodId, a.siteId, a.categoryId, a.brandId, a.vendorId, a.mdUserId,
                        a.prodNm, a.prodTypeCd, a.prodCode,
                        a.listPrice, a.salePrice, a.purchasePrice, a.marginRate,
                        a.platformFeeRate, a.platformFeeAmount,
                        a.prodStock, a.prodStatusCd, a.prodStatusCdBefore,
                        a.thumbnailUrl, a.contentHtml, a.weight, a.sizeInfoCd,
                        a.isNew, a.isBest, a.viewCount, a.saleCount,
                        a.saleStartDate, a.saleEndDate,
                        a.minBuyQty, a.maxBuyQty, a.dayMaxBuyQty, a.idMaxBuyQty,
                        a.adltYn, a.sameDayDlivYn, a.soldOutYn, a.dlivTmpltId,
                        a.couponUseYn, a.saveUseYn, a.discntUseYn,
                        a.advrtStmt, a.advrtStartDate, a.advrtEndDate,
                        a.regBy, a.regDate, a.updBy, a.updDate,
                        // joined
                        cat.categoryNm.as("cateNm"),
                        cat.parentCategoryId.as("parentCategoryId"),
                        b.brandNm.as("brandNm"),
                        v.vendorNm.as("vendorNm"),
                        v.vendorPhone.as("vendorTel"),
                        u.userNm.as("mdUserNm"),
                        cdPs.codeLabel.as("prodStatusCdNm"),
                        cdPt.codeLabel.as("prodTypeCdNm"),
                        cdSz.codeLabel.as("sizeInfoCdNm")
                ))
                .from(a)
                .leftJoin(cat).on(cat.categoryId.eq(a.categoryId))
                .leftJoin(b).on(b.brandId.eq(a.brandId))
                .leftJoin(v).on(v.vendorId.eq(a.vendorId))
                .leftJoin(u).on(u.userId.eq(a.mdUserId))
                .leftJoin(cdPs).on(cdPs.codeGrp.eq("PRODUCT_STATUS").and(cdPs.codeValue.eq(a.prodStatusCd)))
                .leftJoin(cdPt).on(cdPt.codeGrp.eq("PRODUCT_TYPE").and(cdPt.codeValue.eq(a.prodTypeCd)))
                .leftJoin(cdSz).on(cdSz.codeGrp.eq("PRODUCT_SIZE").and(cdSz.codeValue.eq(a.sizeInfoCd)))
                .where(a.prodId.eq(prodId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /** 전체 목록 (page/size 가 양수면 페이징 적용) */
    @Override
    public List<PdProdDto.Item> selectList(PdProdDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdProdDto.Item> query = baseListQuery().where(
                baseAndProdIds(search),
                baseAndSiteId(search),
                baseAndProdId(search),
                baseAndBrandId(search),
                baseAndMdUserId(search),
                baseAndProdStatusCd(search),
                baseAndVendorId(search),
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

    /** 페이지 목록 */
    @Override
    public PdProdDto.PageResponse selectPageData(PdProdDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdProdDto.Item> query = baseListQuery().where(
                baseAndProdIds(search),
                baseAndSiteId(search),
                baseAndProdId(search),
                baseAndBrandId(search),
                baseAndMdUserId(search),
                baseAndProdStatusCd(search),
                baseAndVendorId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PdProdDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(a.count())
                .from(a)
                .leftJoin(b).on(b.brandId.eq(a.brandId))
                .where(
                baseAndProdIds(search),
                baseAndSiteId(search),
                baseAndProdId(search),
                baseAndBrandId(search),
                baseAndMdUserId(search),
                baseAndProdStatusCd(search),
                baseAndVendorId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        )
                .fetchOne();

        PdProdDto.PageResponse res = new PdProdDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /** 목록/페이지 공용 base query — selectList/selectPageData 의 컬럼 셋 (thumbnail COALESCE 포함) */
    private JPAQuery<PdProdDto.Item> baseListQuery() {
        QPdProdImg pi  = new QPdProdImg("pi");
        QPdProdImg pi2 = new QPdProdImg("pi2");

        return queryFactory
                .select(Projections.bean(PdProdDto.Item.class,
                        a.prodId, a.siteId, a.categoryId, a.brandId, a.vendorId, a.mdUserId,
                        a.prodNm, a.prodTypeCd, a.prodCode,
                        a.listPrice, a.salePrice, a.purchasePrice, a.marginRate,
                        a.platformFeeRate, a.platformFeeAmount,
                        a.prodStock, a.prodStatusCd, a.prodStatusCdBefore,
                        a.contentHtml, a.weight, a.sizeInfoCd,
                        a.isNew, a.isBest, a.viewCount, a.saleCount,
                        a.saleStartDate, a.saleEndDate,
                        a.minBuyQty, a.maxBuyQty, a.dayMaxBuyQty, a.idMaxBuyQty,
                        a.adltYn, a.sameDayDlivYn, a.soldOutYn, a.dlivTmpltId,
                        a.couponUseYn, a.saveUseYn, a.discntUseYn,
                        a.advrtStmt, a.advrtStartDate, a.advrtEndDate,
                        a.regBy, a.regDate, a.updBy, a.updDate,
                        cat.categoryNm.as("cateNm"),
                        b.brandNm.as("brandNm"),
                        v.vendorNm.as("vendorNm"),
                        u.userNm.as("mdUserNm"),
                        cdPs.codeLabel.as("prodStatusCdNm"),
                        cdPt.codeLabel.as("prodTypeCdNm"),
                        // COALESCE(a.thumbnail_url, thumb 1순위, 정렬 1순위)
                        Expressions.stringTemplate(
                            "COALESCE({0}, ({1}), ({2}))",
                            a.thumbnailUrl,
                            JPAExpressions.select(pi.cdnImgUrl)
                                .from(pi)
                                .where(pi.prodId.eq(a.prodId).and(pi.isThumb.eq("Y")))
                                .orderBy(pi.sortOrd.asc())
                                .limit(1L),
                            JPAExpressions.select(pi2.cdnImgUrl)
                                .from(pi2)
                                .where(pi2.prodId.eq(a.prodId))
                                .orderBy(pi2.sortOrd.asc())
                                .limit(1L)
                        ).as("thumbnailUrl")
                ))
                .from(a)
                .leftJoin(cat).on(cat.categoryId.eq(a.categoryId))
                .leftJoin(b).on(b.brandId.eq(a.brandId))
                .leftJoin(v).on(v.vendorId.eq(a.vendorId))
                .leftJoin(u).on(u.userId.eq(a.mdUserId))
                .leftJoin(cdPs).on(cdPs.codeGrp.eq("PRODUCT_STATUS").and(cdPs.codeValue.eq(a.prodStatusCd)))
                .leftJoin(cdPt).on(cdPt.codeGrp.eq("PRODUCT_TYPE").and(cdPt.codeValue.eq(a.prodTypeCd)));
    }

    /** 검색조건 빌드 — Mapper XML pdProdCond 와 동일 동작 */
    /* searchType 사용 예  searchType = "<Entity 필드명 콤마구분>" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* prodId IN */
    private BooleanExpression baseAndProdIds(PdProdDto.Request search) {
        return search != null && !CollectionUtils.isEmpty(search.getProdIds())
                ? a.prodId.in(search.getProdIds()) : null;
    }

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(PdProdDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? a.siteId.eq(search.getSiteId()) : null;
    }

    /* prodId 정확 일치 */
    private BooleanExpression baseAndProdId(PdProdDto.Request search) {
        return search != null && StringUtils.hasText(search.getProdId())
                ? a.prodId.eq(search.getProdId()) : null;
    }

    /* brandId 정확 일치 */
    private BooleanExpression baseAndBrandId(PdProdDto.Request search) {
        return search != null && StringUtils.hasText(search.getBrandId())
                ? a.brandId.eq(search.getBrandId()) : null;
    }

    /* mdUserId 정확 일치 */
    private BooleanExpression baseAndMdUserId(PdProdDto.Request search) {
        return search != null && StringUtils.hasText(search.getMdUserId())
                ? a.mdUserId.eq(search.getMdUserId()) : null;
    }

    /* prodStatusCd 정확 일치 */
    private BooleanExpression baseAndProdStatusCd(PdProdDto.Request search) {
        return search != null && StringUtils.hasText(search.getProdStatusCd())
                ? a.prodStatusCd.eq(search.getProdStatusCd()) : null;
    }

    /* vendorId 정확 일치 */
    private BooleanExpression baseAndVendorId(PdProdDto.Request search) {
        return search != null && StringUtils.hasText(search.getVendorId())
                ? a.vendorId.eq(search.getVendorId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression baseAndDateRange(PdProdDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return a.regDate.goe(start).and(a.regDate.lt(endExcl));
            case "upd_date": return a.updDate.goe(start).and(a.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(PdProdDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",adltYn,", a.adltYn, pattern);
        or = orLike(or, all, types, ",advrtStmt,", a.advrtStmt, pattern);
        or = orLike(or, all, types, ",brandId,", a.brandId, pattern);
        or = orLike(or, all, types, ",categoryId,", a.categoryId, pattern);
        or = orLike(or, all, types, ",contentHtml,", a.contentHtml, pattern);
        or = orLike(or, all, types, ",couponUseYn,", a.couponUseYn, pattern);
        or = orLike(or, all, types, ",discntUseYn,", a.discntUseYn, pattern);
        or = orLike(or, all, types, ",dlivTmpltId,", a.dlivTmpltId, pattern);
        or = orLike(or, all, types, ",isBest,", a.isBest, pattern);
        or = orLike(or, all, types, ",isNew,", a.isNew, pattern);
        or = orLike(or, all, types, ",mdUserId,", a.mdUserId, pattern);
        or = orLike(or, all, types, ",prodCode,", a.prodCode, pattern);
        or = orLike(or, all, types, ",prodId,", a.prodId, pattern);
        or = orLike(or, all, types, ",prodNm,", a.prodNm, pattern);
        or = orLike(or, all, types, ",prodStatusCd,", a.prodStatusCd, pattern);
        or = orLike(or, all, types, ",prodStatusCdBefore,", a.prodStatusCdBefore, pattern);
        or = orLike(or, all, types, ",prodTypeCd,", a.prodTypeCd, pattern);
        or = orLike(or, all, types, ",sameDayDlivYn,", a.sameDayDlivYn, pattern);
        or = orLike(or, all, types, ",saveUseYn,", a.saveUseYn, pattern);
        or = orLike(or, all, types, ",siteId,", a.siteId, pattern);
        or = orLike(or, all, types, ",sizeInfoCd,", a.sizeInfoCd, pattern);
        or = orLike(or, all, types, ",soldOutYn,", a.soldOutYn, pattern);
        or = orLike(or, all, types, ",thumbnailUrl,", a.thumbnailUrl, pattern);
        or = orLike(or, all, types, ",vendorId,", a.vendorId, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(PdProdDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, a.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, a.prodId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("prodId".equals(field)) {
                    orders.add(new OrderSpecifier(order, a.prodId));
                } else if ("prodNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, a.prodNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, a.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, a.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, a.prodId));
        }
        return orders;
    }

    /** updateSelective — Mapper XML 과 동일한 컬럼셋만 갱신 */
    @Override
    public int updateSelective(PdProd entity) {
        if (entity.getProdId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(a);
        boolean hasAny = false;

        if (entity.getProdStatusCd()       != null) { update.set(a.prodStatusCd,       entity.getProdStatusCd());       hasAny = true; }
        if (entity.getProdStatusCdBefore() != null) { update.set(a.prodStatusCdBefore, entity.getProdStatusCdBefore()); hasAny = true; }
        if (entity.getProdNm()             != null) { update.set(a.prodNm,             entity.getProdNm());             hasAny = true; }
        if (entity.getSalePrice()          != null) { update.set(a.salePrice,          entity.getSalePrice());          hasAny = true; }
        if (entity.getProdStock()          != null) { update.set(a.prodStock,          entity.getProdStock());          hasAny = true; }
        if (entity.getThumbnailUrl()       != null) { update.set(a.thumbnailUrl,       entity.getThumbnailUrl());       hasAny = true; }
        if (entity.getIsBest()             != null) { update.set(a.isBest,             entity.getIsBest());             hasAny = true; }
        if (entity.getIsNew()              != null) { update.set(a.isNew,              entity.getIsNew());              hasAny = true; }
        if (entity.getSoldOutYn()          != null) { update.set(a.soldOutYn,          entity.getSoldOutYn());          hasAny = true; }
        if (entity.getUpdBy()              != null) { update.set(a.updBy,              entity.getUpdBy());              hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(a.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(a.prodId.eq(entity.getProdId())).execute();
        return (int) affected;
    }
}
