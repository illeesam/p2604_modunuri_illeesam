package com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.jpa.JPAExpressions;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
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
    private static final QPdProd     p   = QPdProd.pdProd;
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
                        // p.* equivalent
                        p.prodId, p.siteId, p.categoryId, p.brandId, p.vendorId, p.mdUserId,
                        p.prodNm, p.prodTypeCd, p.prodCode,
                        p.listPrice, p.salePrice, p.purchasePrice, p.marginRate,
                        p.platformFeeRate, p.platformFeeAmount,
                        p.prodStock, p.prodStatusCd, p.prodStatusCdBefore,
                        p.thumbnailUrl, p.contentHtml, p.weight, p.sizeInfoCd,
                        p.isNew, p.isBest, p.viewCount, p.saleCount,
                        p.saleStartDate, p.saleEndDate,
                        p.minBuyQty, p.maxBuyQty, p.dayMaxBuyQty, p.idMaxBuyQty,
                        p.adltYn, p.sameDayDlivYn, p.soldOutYn, p.dlivTmpltId,
                        p.couponUseYn, p.saveUseYn, p.discntUseYn,
                        p.advrtStmt, p.advrtStartDate, p.advrtEndDate,
                        p.regBy, p.regDate, p.updBy, p.updDate,
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
                .from(p)
                .leftJoin(cat).on(cat.categoryId.eq(p.categoryId))
                .leftJoin(b).on(b.brandId.eq(p.brandId))
                .leftJoin(v).on(v.vendorId.eq(p.vendorId))
                .leftJoin(u).on(u.userId.eq(p.mdUserId))
                .leftJoin(cdPs).on(cdPs.codeGrp.eq("PRODUCT_STATUS").and(cdPs.codeValue.eq(p.prodStatusCd)))
                .leftJoin(cdPt).on(cdPt.codeGrp.eq("PRODUCT_TYPE").and(cdPt.codeValue.eq(p.prodTypeCd)))
                .leftJoin(cdSz).on(cdSz.codeGrp.eq("PRODUCT_SIZE").and(cdSz.codeValue.eq(p.sizeInfoCd)))
                .where(p.prodId.eq(prodId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /** 전체 목록 (page/size 가 양수면 페이징 적용) */
    @Override
    public List<PdProdDto.Item> selectList(PdProdDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdProdDto.Item> query = baseListQuery().where(where);
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
    public PdProdDto.PageResponse selectPageList(PdProdDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdProdDto.Item> query = baseListQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PdProdDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(p.count())
                .from(p)
                .leftJoin(b).on(b.brandId.eq(p.brandId))
                .where(where)
                .fetchOne();

        PdProdDto.PageResponse res = new PdProdDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /** 목록/페이지 공용 base query — selectList/selectPageList 의 컬럼 셋 (thumbnail COALESCE 포함) */
    private JPAQuery<PdProdDto.Item> baseListQuery() {
        QPdProdImg pi  = new QPdProdImg("pi");
        QPdProdImg pi2 = new QPdProdImg("pi2");

        return queryFactory
                .select(Projections.bean(PdProdDto.Item.class,
                        p.prodId, p.siteId, p.categoryId, p.brandId, p.vendorId, p.mdUserId,
                        p.prodNm, p.prodTypeCd, p.prodCode,
                        p.listPrice, p.salePrice, p.purchasePrice, p.marginRate,
                        p.platformFeeRate, p.platformFeeAmount,
                        p.prodStock, p.prodStatusCd, p.prodStatusCdBefore,
                        p.contentHtml, p.weight, p.sizeInfoCd,
                        p.isNew, p.isBest, p.viewCount, p.saleCount,
                        p.saleStartDate, p.saleEndDate,
                        p.minBuyQty, p.maxBuyQty, p.dayMaxBuyQty, p.idMaxBuyQty,
                        p.adltYn, p.sameDayDlivYn, p.soldOutYn, p.dlivTmpltId,
                        p.couponUseYn, p.saveUseYn, p.discntUseYn,
                        p.advrtStmt, p.advrtStartDate, p.advrtEndDate,
                        p.regBy, p.regDate, p.updBy, p.updDate,
                        cat.categoryNm.as("cateNm"),
                        b.brandNm.as("brandNm"),
                        v.vendorNm.as("vendorNm"),
                        u.userNm.as("mdUserNm"),
                        cdPs.codeLabel.as("prodStatusCdNm"),
                        cdPt.codeLabel.as("prodTypeCdNm"),
                        // COALESCE(p.thumbnail_url, thumb 1순위, 정렬 1순위)
                        Expressions.stringTemplate(
                            "COALESCE({0}, ({1}), ({2}))",
                            p.thumbnailUrl,
                            JPAExpressions.select(pi.cdnImgUrl)
                                .from(pi)
                                .where(pi.prodId.eq(p.prodId).and(pi.isThumb.eq("Y")))
                                .orderBy(pi.sortOrd.asc())
                                .limit(1L),
                            JPAExpressions.select(pi2.cdnImgUrl)
                                .from(pi2)
                                .where(pi2.prodId.eq(p.prodId))
                                .orderBy(pi2.sortOrd.asc())
                                .limit(1L)
                        ).as("thumbnailUrl")
                ))
                .from(p)
                .leftJoin(cat).on(cat.categoryId.eq(p.categoryId))
                .leftJoin(b).on(b.brandId.eq(p.brandId))
                .leftJoin(v).on(v.vendorId.eq(p.vendorId))
                .leftJoin(u).on(u.userId.eq(p.mdUserId))
                .leftJoin(cdPs).on(cdPs.codeGrp.eq("PRODUCT_STATUS").and(cdPs.codeValue.eq(p.prodStatusCd)))
                .leftJoin(cdPt).on(cdPt.codeGrp.eq("PRODUCT_TYPE").and(cdPt.codeValue.eq(p.prodTypeCd)));
    }

    /** 검색조건 빌드 — Mapper XML pdProdCond 와 동일 동작 */
    // searchTypes 사용 예 (콤마 경계 매칭):
    //   - 단일 조건  : searchTypes = "def_blog_title"
    //   - 복합 조건  : searchTypes = "def_blog_title,def_blog_author"   (UI 에서 aaa,bbb 형태로 전달)
    //   - 미지정     : searchTypes = null/"" 이면 all=true 로 전체 컬럼 OR 검색
    //
    //   buildCondition 내부에서는
    //     String types = "," + searchTypes + ",";   // 예: ",def_blog_title,def_blog_author,"
    //     types.contains(",def_blog_title,")         // 토큰 경계 정확 매칭 (부분문자열 오매칭 방지)
    //   형태로 비교한다.
    private BooleanBuilder buildCondition(PdProdDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId()))     w.and(p.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getProdId()))     w.and(p.prodId.eq(s.getProdId()));
        if (StringUtils.hasText(s.getBrandId()))    w.and(p.brandId.eq(s.getBrandId()));
        if (StringUtils.hasText(s.getMdUserId()))   w.and(p.mdUserId.eq(s.getMdUserId()));
        if (StringUtils.hasText(s.getProdStatusCd())) w.and(p.prodStatusCd.eq(s.getProdStatusCd()));
        if (StringUtils.hasText(s.getCategoryId())) w.and(p.categoryId.eq(s.getCategoryId()));
        if (StringUtils.hasText(s.getVendorId()))   w.and(p.vendorId.eq(s.getVendorId()));

        // searchValue + searchTypes (def_prod_id | def_prod_nm | def_prod_code | def_brand_nm)
        if (StringUtils.hasText(s.getSearchValue())) {
            String types = "," + (s.getSearchTypes() == null ? "" : s.getSearchTypes().trim()) + ",";
            boolean all = !StringUtils.hasText(s.getSearchTypes());
            String pattern = "%" + s.getSearchValue() + "%";

            BooleanBuilder or = new BooleanBuilder();
            if (all || types.contains(",def_prod_id,"))   or.or(p.prodId.likeIgnoreCase(pattern));
            if (all || types.contains(",def_prod_nm,"))   or.or(p.prodNm.likeIgnoreCase(pattern));
            if (all || types.contains(",def_prod_code,")) or.or(p.prodCode.likeIgnoreCase(pattern));
            if (all || types.contains(",def_brand_nm,"))  or.or(b.brandNm.likeIgnoreCase(pattern));
            if (or.getValue() != null) w.and(or);
        }

        // dateType + dateStart + dateEnd
        if (StringUtils.hasText(s.getDateType())
                && StringUtils.hasText(s.getDateStart())
                && StringUtils.hasText(s.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDateTime start = LocalDate.parse(s.getDateStart(), fmt).atStartOfDay();
            LocalDateTime endExcl = LocalDate.parse(s.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
            switch (s.getDateType()) {
                case "reg_date":
                    w.and(p.regDate.goe(start)).and(p.regDate.lt(endExcl));
                    break;
                case "upd_date":
                    w.and(p.updDate.goe(start)).and(p.updDate.lt(endExcl));
                    break;
                default:
                    break;
            }
        }
        return w;
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
            orders.add(new OrderSpecifier(Order.DESC, p.regDate));
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
                    orders.add(new OrderSpecifier(order, p.prodId));
                } else if ("prodNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, p.prodNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, p.regDate));
                }
            }
        }
        return orders;
    }

    /** updateSelective — Mapper XML 과 동일한 컬럼셋만 갱신 */
    @Override
    public int updateSelective(PdProd entity) {
        if (entity.getProdId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(p);
        boolean hasAny = false;

        if (entity.getProdStatusCd()       != null) { update.set(p.prodStatusCd,       entity.getProdStatusCd());       hasAny = true; }
        if (entity.getProdStatusCdBefore() != null) { update.set(p.prodStatusCdBefore, entity.getProdStatusCdBefore()); hasAny = true; }
        if (entity.getProdNm()             != null) { update.set(p.prodNm,             entity.getProdNm());             hasAny = true; }
        if (entity.getSalePrice()          != null) { update.set(p.salePrice,          entity.getSalePrice());          hasAny = true; }
        if (entity.getProdStock()          != null) { update.set(p.prodStock,          entity.getProdStock());          hasAny = true; }
        if (entity.getThumbnailUrl()       != null) { update.set(p.thumbnailUrl,       entity.getThumbnailUrl());       hasAny = true; }
        if (entity.getIsBest()             != null) { update.set(p.isBest,             entity.getIsBest());             hasAny = true; }
        if (entity.getIsNew()              != null) { update.set(p.isNew,              entity.getIsNew());              hasAny = true; }
        if (entity.getSoldOutYn()          != null) { update.set(p.soldOutYn,          entity.getSoldOutYn());          hasAny = true; }
        if (entity.getUpdBy()              != null) { update.set(p.updBy,              entity.getUpdBy());              hasAny = true; }
        if (entity.getUpdDate()            != null) { update.set(p.updDate,            entity.getUpdDate());            hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(p.prodId.eq(entity.getProdId())).execute();
        return (int) affected;
    }
}
