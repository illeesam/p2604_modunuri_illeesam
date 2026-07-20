package com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.DateTimePath;
import com.querydsl.core.types.dsl.StringPath;
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

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;

/** PdProd QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPdProdRepositoryImpl implements QPdProdRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pd.repository.qrydsl.impl.QPdProdRepositoryImpl";
    private static final QPdProd     pdProd   = QPdProd.pdProd;
    private static final QPdCategory pdCategory = QPdCategory.pdCategory;
    private static final QSyBrand    syBrand   = QSyBrand.syBrand;
    private static final QSyVendor   syVendor   = QSyVendor.syVendor;
    private static final QSyUser     syUser   = QSyUser.syUser;
    private static final QSyCode     cdPs = new QSyCode("cd_ps");
    private static final QSyCode     cdPt = new QSyCode("cd_pt");
    private static final QSyCode     cdSz = new QSyCode("cd_sz");
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_FIELDS = Map.of(
        "reg_date", pdProd.regDate,
        "upd_date", pdProd.updDate
    );
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("adltYn", pdProd.adltYn),
        Map.entry("advrtStmt", pdProd.advrtStmt),
        Map.entry("brandId", pdProd.brandId),
        Map.entry("categoryId", pdProd.categoryId),
        Map.entry("contentHtml", pdProd.contentHtml),
        Map.entry("couponUseYn", pdProd.couponUseYn),
        Map.entry("discntUseYn", pdProd.discntUseYn),
        Map.entry("dlivTmpltId", pdProd.dlivTmpltId),
        Map.entry("isBest", pdProd.isBest),
        Map.entry("isNew", pdProd.isNew),
        Map.entry("mdUserId", pdProd.mdUserId),
        Map.entry("prodCode", pdProd.prodCode),
        Map.entry("prodId", pdProd.prodId),
        Map.entry("prodNm", pdProd.prodNm),
        Map.entry("prodStatusCd", pdProd.prodStatusCd),
        Map.entry("prodStatusCdBefore", pdProd.prodStatusCdBefore),
        Map.entry("prodTypeCd", pdProd.prodTypeCd),
        Map.entry("sameDayDlivYn", pdProd.sameDayDlivYn),
        Map.entry("saveUseYn", pdProd.saveUseYn),
        Map.entry("siteId", pdProd.siteId),
        Map.entry("sizeInfoCd", pdProd.sizeInfoCd),
        Map.entry("soldOutYn", pdProd.soldOutYn),
        Map.entry("thumbnailUrl", pdProd.thumbnailUrl),
        Map.entry("vendorId", pdProd.vendorId)
    );

    private static final QPdProdImg piThumb    = new QPdProdImg("pi_thumb");     // 썸네일 (is_thumb=Y, outer)
    private static final QPdProdImg piThumbMin = new QPdProdImg("pi_thumb_min"); // 썸네일 MIN(sort_ord) 내부
    private static final QPdProdImg piFirst    = new QPdProdImg("pi_first");     // 첫번째 이미지 (outer)
    private static final QPdProdImg piFirstMin = new QPdProdImg("pi_first_min"); // 첫번째 이미지 MIN(sort_ord) 내부

    /** 목록/페이지 공용 base query — selectList/selectPageData 의 컬럼 셋 (thumbnail LEFT JOIN으로 1행 보장) */
    private JPAQuery<PdProdDto.Item> baseListQuery() {
        return queryFactory
                .select(Projections.bean(PdProdDto.Item.class,
                        pdProd.prodId, pdProd.siteId, pdProd.categoryId, pdProd.brandId, pdProd.vendorId, pdProd.mdUserId,
                        pdProd.prodNm, pdProd.prodTypeCd, pdProd.prodCode,
                        pdProd.listPrice, pdProd.salePrice, pdProd.purchasePrice, pdProd.marginRate,
                        pdProd.platformFeeRate, pdProd.platformFeeAmount,
                        pdProd.prodStatusCd, pdProd.prodStatusCdBefore,
                        pdProd.contentHtml, pdProd.weight, pdProd.sizeInfoCd,
                        pdProd.isNew, pdProd.isBest, pdProd.viewCount,
                        pdProd.saleStartDate, pdProd.saleEndDate,
                        pdProd.minBuyQty, pdProd.maxBuyQty, pdProd.dayMaxBuyQty, pdProd.idMaxBuyQty,
                        pdProd.adltYn, pdProd.sameDayDlivYn, pdProd.soldOutYn, pdProd.dlivTmpltId,
                        pdProd.couponUseYn, pdProd.saveUseYn, pdProd.discntUseYn,
                        pdProd.advrtStmt, pdProd.advrtStartDate, pdProd.advrtEndDate,
                        pdProd.simulYn, pdProd.prodOptStdCd,
                        pdProd.prodOptType1Cd, pdProd.prodOptType2Cd,
                        pdProd.regBy, pdProd.regDate, pdProd.updBy, pdProd.updDate,
                        pdCategory.categoryNm.as("cateNm"),
                        syBrand.brandNm.as("brandNm"),
                        syVendor.vendorNm.as("vendorNm"),
                        syUser.userNm.as("mdUserNm"),
                        cdPs.codeLabel.as("prodStatusCdNm"),
                        cdPt.codeLabel.as("prodTypeCdNm"),
                        // thumbnail_url: prod 직접 값 → is_thumb='Y' 중 MIN(prod_img_id) 행 → 전체 중 MIN(prod_img_id) 행
                        // Hibernate 6.x 는 스칼라 서브쿼리 .limit() 을 무시하므로
                        // MIN(PK) 이중 서브쿼리로 단일 행을 보장함 (PK는 항상 유일)
                        Expressions.stringTemplate("COALESCE({0}, {1}, {2})",
                            pdProd.thumbnailUrl,
                            JPAExpressions.select(piThumb.cdnImgUrl)
                                .from(piThumb)
                                .where(piThumb.prodId.eq(pdProd.prodId)
                                    .and(piThumb.isThumb.eq("Y"))
                                    .and(piThumb.prodImgId.eq(
                                        JPAExpressions.select(piThumbMin.prodImgId.min())
                                            .from(piThumbMin)
                                            .where(piThumbMin.prodId.eq(pdProd.prodId)
                                                .and(piThumbMin.isThumb.eq("Y")))))),
                            JPAExpressions.select(piFirst.cdnImgUrl)
                                .from(piFirst)
                                .where(piFirst.prodId.eq(pdProd.prodId)
                                    .and(piFirst.prodImgId.eq(
                                        JPAExpressions.select(piFirstMin.prodImgId.min())
                                            .from(piFirstMin)
                                            .where(piFirstMin.prodId.eq(pdProd.prodId)))))
                        ).as("thumbnailUrl")
                ))
                .from(pdProd)
                .leftJoin(pdCategory).on(pdCategory.categoryId.eq(pdProd.categoryId))
                .leftJoin(syBrand).on(syBrand.brandId.eq(pdProd.brandId))
                .leftJoin(syVendor).on(syVendor.vendorId.eq(pdProd.vendorId))
                .leftJoin(syUser).on(syUser.userId.eq(pdProd.mdUserId))
                .leftJoin(cdPs).on(cdPs.codeGrp.eq("PRODUCT_STATUS").and(cdPs.codeValue.eq(pdProd.prodStatusCd)))
                .leftJoin(cdPt).on(cdPt.codeGrp.eq("PRODUCT_TYPE").and(cdPt.codeValue.eq(pdProd.prodTypeCd)));
    }

    /** 단건 조회 — selectById 와 동일 컬럼 셋 (size_info_cd_nm 포함) */
    @Override
    public Optional<PdProdDto.Item> selectById(String prodId) {
        PdProdDto.Item dto = queryFactory
                .select(Projections.bean(PdProdDto.Item.class,
                        // a.* equivalent
                        pdProd.prodId, pdProd.siteId, pdProd.categoryId, pdProd.brandId, pdProd.vendorId, pdProd.mdUserId,
                        pdProd.prodNm, pdProd.prodTypeCd, pdProd.prodCode,
                        pdProd.listPrice, pdProd.salePrice, pdProd.purchasePrice, pdProd.marginRate,
                        pdProd.platformFeeRate, pdProd.platformFeeAmount,
                        pdProd.prodStatusCd, pdProd.prodStatusCdBefore,
                        pdProd.thumbnailUrl, pdProd.contentHtml, pdProd.weight, pdProd.sizeInfoCd,
                        pdProd.isNew, pdProd.isBest, pdProd.viewCount,
                        pdProd.saleStartDate, pdProd.saleEndDate,
                        pdProd.minBuyQty, pdProd.maxBuyQty, pdProd.dayMaxBuyQty, pdProd.idMaxBuyQty,
                        pdProd.adltYn, pdProd.sameDayDlivYn, pdProd.soldOutYn, pdProd.dlivTmpltId,
                        pdProd.couponUseYn, pdProd.saveUseYn, pdProd.discntUseYn,
                        pdProd.advrtStmt, pdProd.advrtStartDate, pdProd.advrtEndDate,
                        pdProd.simulYn, pdProd.prodOptStdCd,
                        pdProd.prodOptType1Cd, pdProd.prodOptType2Cd,
                        pdProd.regBy, pdProd.regDate, pdProd.updBy, pdProd.updDate,
                        // joined
                        pdCategory.categoryNm.as("cateNm"),
                        pdCategory.parentCategoryId.as("parentCategoryId"),
                        syBrand.brandNm.as("brandNm"),
                        syVendor.vendorNm.as("vendorNm"),
                        syVendor.vendorPhone.as("vendorTel"),
                        syUser.userNm.as("mdUserNm"),
                        cdPs.codeLabel.as("prodStatusCdNm"),
                        cdPt.codeLabel.as("prodTypeCdNm"),
                        cdSz.codeLabel.as("sizeInfoCdNm")
                ))
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").from(pdProd)
                .leftJoin(pdCategory).on(pdCategory.categoryId.eq(pdProd.categoryId))
                .leftJoin(syBrand).on(syBrand.brandId.eq(pdProd.brandId))
                .leftJoin(syVendor).on(syVendor.vendorId.eq(pdProd.vendorId))
                .leftJoin(syUser).on(syUser.userId.eq(pdProd.mdUserId))
                .leftJoin(cdPs).on(cdPs.codeGrp.eq("PRODUCT_STATUS").and(cdPs.codeValue.eq(pdProd.prodStatusCd)))
                .leftJoin(cdPt).on(cdPt.codeGrp.eq("PRODUCT_TYPE").and(cdPt.codeValue.eq(pdProd.prodTypeCd)))
                .leftJoin(cdSz).on(cdSz.codeGrp.eq("PRODUCT_SIZE").and(cdSz.codeValue.eq(pdProd.sizeInfoCd)))
                .where(pdProd.prodId.eq(prodId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /** 전체 목록 (page/size 가 양수면 페이징 적용) */
    @Override
    public List<PdProdDto.Item> selectList(PdProdDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdProdDto.Item> query = baseListQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strIn(pdProd.prodId, search.getProdIds()),
                    QdslUtil.strEq(pdProd.siteId, search.getSiteId()),
                    QdslUtil.strEq(pdProd.prodId, search.getProdId()),
                    QdslUtil.strEq(pdProd.brandId, search.getBrandId()),
                    QdslUtil.strEq(pdProd.mdUserId, search.getMdUserId()),
                    QdslUtil.strEq(pdProd.prodStatusCd, search.getProdStatusCd()),
                    QdslUtil.strEq(pdProd.prodTypeCd, search.getProdTypeCd()),
                    QdslUtil.strEq(pdProd.vendorId, search.getVendorId()),
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

    /** 페이지 목록 */
    @Override
    public PdProdDto.PageResponse selectPageData(PdProdDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strIn(pdProd.prodId, search.getProdIds()),
                QdslUtil.strEq(pdProd.siteId, search.getSiteId()),
                QdslUtil.strEq(pdProd.prodId, search.getProdId()),
                QdslUtil.strEq(pdProd.brandId, search.getBrandId()),
                QdslUtil.strEq(pdProd.mdUserId, search.getMdUserId()),
                QdslUtil.strEq(pdProd.prodStatusCd, search.getProdStatusCd()),
                QdslUtil.strEq(pdProd.prodTypeCd, search.getProdTypeCd()),
                QdslUtil.strEq(pdProd.vendorId, search.getVendorId()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<PdProdDto.Item> query = baseListQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<PdProdDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pdProd.count())
                .where(wheres)
                .fetchOne();

        PdProdDto.PageResponse res = new PdProdDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /** 검색조건 빌드 — Mapper XML pdProdCond 와 동일 동작 */
    /* searchType 사용 예  searchType = "<Entity 필드명 콤마구분>" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

private BooleanExpression andSearchValueLike(PdProdDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
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
            orders.add(new OrderSpecifier(Order.DESC, pdProd.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pdProd.prodId));
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
                    orders.add(new OrderSpecifier(order, pdProd.prodId));
                } else if ("prodNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, pdProd.prodNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, pdProd.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, pdProd.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pdProd.prodId));
        }
        return orders;
    }

    /** updateSelective — Mapper XML 과 동일한 컬럼셋만 갱신 */
    @Override
    public int updateSelective(PdProd entity) {
        if (entity.getProdId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pdProd);
        boolean hasAny = false;

        if (entity.getProdStatusCd()       != null) { update.set(pdProd.prodStatusCd,       entity.getProdStatusCd());       hasAny = true; }
        if (entity.getProdStatusCdBefore() != null) { update.set(pdProd.prodStatusCdBefore, entity.getProdStatusCdBefore()); hasAny = true; }
        if (entity.getProdNm()             != null) { update.set(pdProd.prodNm,             entity.getProdNm());             hasAny = true; }
        if (entity.getSalePrice()          != null) { update.set(pdProd.salePrice,          entity.getSalePrice());          hasAny = true; }
        if (entity.getThumbnailUrl()       != null) { update.set(pdProd.thumbnailUrl,       entity.getThumbnailUrl());       hasAny = true; }
        if (entity.getIsBest()             != null) { update.set(pdProd.isBest,             entity.getIsBest());             hasAny = true; }
        if (entity.getIsNew()              != null) { update.set(pdProd.isNew,              entity.getIsNew());              hasAny = true; }
        if (entity.getSoldOutYn()          != null) { update.set(pdProd.soldOutYn,          entity.getSoldOutYn());          hasAny = true; }
        if (entity.getProdOptStdCd()       != null) { update.set(pdProd.prodOptStdCd,       entity.getProdOptStdCd());       hasAny = true; }
        if (entity.getProdOptType1Cd()     != null) { update.set(pdProd.prodOptType1Cd,     entity.getProdOptType1Cd());     hasAny = true; }
        if (entity.getProdOptType2Cd()     != null) { update.set(pdProd.prodOptType2Cd,     entity.getProdOptType2Cd());     hasAny = true; }
        if (entity.getUpdBy()              != null) { update.set(pdProd.updBy,              entity.getUpdBy());              hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(pdProd.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(pdProd.prodId.eq(entity.getProdId())).execute();
        return (int) affected;
    }
}
