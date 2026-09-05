package com.shopjoy.ecBeBo.base.ec.pd.repository.qrydsl.impl;

import com.shopjoy.ecBeBo.common.util.CmUtil;
import com.shopjoy.ecBeBo.common.data.BasePage;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.DateTimePath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecBeBo.base.ec.pd.data.dto.PdProdImgDto;
import com.shopjoy.ecBeBo.base.ec.pd.data.entity.PdProdImg;
import com.shopjoy.ecBeBo.base.ec.pd.data.entity.QPdProdImg;
import com.shopjoy.ecBeBo.base.ec.pd.repository.qrydsl.QPdProdImgRepository;
import com.shopjoy.ecBeBo.base.sy.data.entity.QSyUser;
import com.shopjoy.ecBeBo.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecBeBo.common.util.QdslUtil;
/** PdProdImg(상품 이미지) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPdProdImgRepositoryImpl implements QPdProdImgRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pd.repository.qrydsl.impl.QPdProdImgRepositoryImpl";
    private static final QSySite siteEx = new QSySite("site_ex");
    private static final QSyUser regUserEx = new QSyUser("reg_user_ex");
    private static final QSySite regSiteEx = new QSySite("reg_site_ex");
    private static final QPdProdImg pdProdImg = QPdProdImg.pdProdImg;    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * IS_THUMB  {Y: '대표이미지', N: '일반이미지'}
     */
    private JPAQuery<PdProdImgDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PdProdImgDto.Item.class,
                        pdProdImg.prodImgId,     // 상품이미지ID (PK)
                        pdProdImg.prodId,         // 상품ID (pd_prod.prod_id)
                        pdProdImg.prodOpt1Id,     // 옵션1 값ID (색상 등, NULL이면 공통 이미지)
                        pdProdImg.prodOpt2Id,     // 옵션2 값ID (사이즈 등, NULL이면 색상 공통)
                        pdProdImg.attachId,        // 첨부파일ID (sy_attach.attach_id, 원본 파일 보관용)
                        pdProdImg.cdnHost,        // CDN 호스트명
                        pdProdImg.cdnImgUrl,      // CDN 원본 이미지 URL (상세 페이지용)
                        pdProdImg.cdnThumbUrl,     // CDN 썸네일 URL (목록/검색/카테고리용)
                        pdProdImg.imgAltText,      // 이미지 대체텍스트 (alt 속성, SEO/접근성)
                        pdProdImg.sortOrd,        // 정렬순서
                        pdProdImg.isThumb,          // 대표이미지여부 — {Y: '대표이미지', N: '일반이미지'}
                        pdProdImg.regBy, // 등록자
                        pdProdImg.regDate, // 등록일
                        pdProdImg.updBy, // 수정자
                        pdProdImg.updDate, // 수정일
                        pdProdImg.regSiteId,  // 등록사이트ID
                        regSiteEx.siteNm.as("regSiteNm"),  // 등록사이트명 (조인)
                        regUserEx.userNm.as("regUserNm"),   // 등록자명 (조인)
                        pdProdImg.siteId,  // 사이트ID
                        siteEx.siteNm.as("siteNm")   // 사이트명 (조인)
                ))
                .from(pdProdImg)
                .leftJoin(regSiteEx).on(regSiteEx.siteId.eq(pdProdImg.regSiteId)) // 등록사이트
                .leftJoin(regUserEx).on(regUserEx.userId.eq(pdProdImg.regBy)) // 등록자
                .leftJoin(siteEx).on(siteEx.siteId.eq(pdProdImg.siteId)) // 사이트

                ;
    }

    /* 상품 이미지 키조회 */
    @Override
    public Optional<PdProdImgDto.Item> selectById(String prodImgId) {
        PdProdImgDto.Item dtl = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(pdProdImg.prodImgId.eq(prodImgId))
                .fetchOne();
        return Optional.ofNullable(dtl);
    }

    /* 상품 이미지 목록조회 */
    @Override
    public List<PdProdImgDto.Item> selectList(PdProdImgDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strIn(pdProdImg.prodId, search.getProdIds())); // PK 다건 IN
        whereList.add(QdslUtil.strEq(pdProdImg.prodId, search.getProdId())); // 상품ID 필터
        whereList.add(QdslUtil.strEq(pdProdImg.prodImgId, search.getProdImgId())); // 상품이미지ID 필터
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pdProdImg.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pdProdImg.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        whereList.add(QdslUtil.strEq(pdProdImg.siteId, search.getSiteId())); // 사이트ID 필터

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<PdProdImgDto.Item> query = baseSelColumnQuery()
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
        List<PdProdImgDto.Item> list = query.fetch();
        return list;
    }

    /* 상품 이미지 페이지조회 */
    @Override
    public BasePage<PdProdImgDto.Item> selectPageData(PdProdImgDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strIn(pdProdImg.prodId, search.getProdIds())); // PK 다건 IN
        whereList.add(QdslUtil.strEq(pdProdImg.prodId, search.getProdId())); // 상품ID 필터
        whereList.add(QdslUtil.strEq(pdProdImg.prodImgId, search.getProdImgId())); // 상품이미지ID 필터
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pdProdImg.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pdProdImg.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        whereList.add(QdslUtil.strEq(pdProdImg.siteId, search.getSiteId())); // 사이트ID 필터
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        JPAQuery<PdProdImgDto.Item> query = baseSelColumnQuery();

        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<PdProdImgDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pdProdImg.count())
                .where(wheres)
                .fetchOne();

        BasePage<PdProdImgDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }

    /* searchType 예: "attachId,cdnHost,cdnImgUrl,cdnThumbUrl,imgAltText" 등 (콤마 조합, 미지정 시 전체 OR) */
    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("attachId", pdProdImg.attachId), // 첨부파일ID (sy_attach.attach_id, 원본 파일 보관용)
            QdslUtil.FieldDef.like("cdnHost", pdProdImg.cdnHost), // CDN 호스트명 (예: cdn.example.com, 원본 시점의 CDN)
            QdslUtil.FieldDef.like("cdnImgUrl", pdProdImg.cdnImgUrl), // CDN 원본 이미지 URL (상세 페이지용, sy_attach 기준)
            QdslUtil.FieldDef.like("cdnThumbUrl", pdProdImg.cdnThumbUrl), // CDN 썸네일 URL (목록/검색/카테고리용, sy_attach 기준)
            QdslUtil.FieldDef.like("imgAltText", pdProdImg.imgAltText), // 이미지 대체텍스트 (alt 속성, SEO/접근성)
            QdslUtil.FieldDef.like("isThumb", pdProdImg.isThumb), // 대표이미지여부 Y/N
            QdslUtil.FieldDef.like("prodOpt1Id", pdProdImg.prodOpt1Id), // 옵션1 값ID (pd_prod_opt.prod_opt_id, 색상 등, NULL이면 공통 이미지)
            QdslUtil.FieldDef.like("prodOpt2Id", pdProdImg.prodOpt2Id), // 옵션2 값ID (pd_prod_opt.prod_opt_id, 사이즈 등, NULL이면 색상 공통)
            QdslUtil.FieldDef.like("prodId", pdProdImg.prodId), // 상품ID 필터
            QdslUtil.FieldDef.like("prodImgId", pdProdImg.prodImgId) // 상품이미지ID 필터
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("prodImgId", pdProdImg.prodImgId,
                   "regDate", pdProdImg.regDate,
                   "sortOrd", pdProdImg.sortOrd),
        new OrderSpecifier<>(Order.ASC, pdProdImg.sortOrd),
        new OrderSpecifier<>(Order.ASC, pdProdImg.regDate),
        new OrderSpecifier<>(Order.ASC, pdProdImg.prodImgId));
    }

    /* 상품 이미지 수정 */
    @Override
    public int updateSelective(PdProdImg entity) {
        if (entity.getProdImgId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pdProdImg);
        boolean hasAny = false;

        if (entity.getProdId()      != null) { update.set(pdProdImg.prodId,      entity.getProdId());      hasAny = true; }
        if (entity.getProdOpt1Id()  != null) { update.set(pdProdImg.prodOpt1Id,  entity.getProdOpt1Id());  hasAny = true; }
        if (entity.getProdOpt2Id()  != null) { update.set(pdProdImg.prodOpt2Id,  entity.getProdOpt2Id());  hasAny = true; }
        if (entity.getAttachId()    != null) { update.set(pdProdImg.attachId,    entity.getAttachId());    hasAny = true; }
        if (entity.getCdnHost()     != null) { update.set(pdProdImg.cdnHost,     entity.getCdnHost());     hasAny = true; }
        if (entity.getCdnImgUrl()   != null) { update.set(pdProdImg.cdnImgUrl,   entity.getCdnImgUrl());   hasAny = true; }
        if (entity.getCdnThumbUrl() != null) { update.set(pdProdImg.cdnThumbUrl, entity.getCdnThumbUrl()); hasAny = true; }
        if (entity.getImgAltText()  != null) { update.set(pdProdImg.imgAltText,  entity.getImgAltText());  hasAny = true; }
        if (entity.getSortOrd()     != null) { update.set(pdProdImg.sortOrd,     entity.getSortOrd());     hasAny = true; }
        if (entity.getIsThumb()     != null) { update.set(pdProdImg.isThumb,     entity.getIsThumb());     hasAny = true; }
        if (entity.getUpdBy()       != null) { update.set(pdProdImg.updBy,       entity.getUpdBy());       hasAny = true; }
        update.set(pdProdImg.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(pdProdImg.prodImgId.eq(entity.getProdImgId())).execute();
        return (int) affected;
    }
}
