package com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.impl;

import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.data.BasePage;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.DateTimePath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdImgDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdImg;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProdImg;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdProdImgRepository;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** PdProdImg QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPdProdImgRepositoryImpl implements QPdProdImgRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pd.repository.qrydsl.impl.QPdProdImgRepositoryImpl";
    private static final QPdProdImg pdProdImg = QPdProdImg.pdProdImg;
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_RANGE_FIELDS = Map.of("reg_date", pdProdImg.regDate,
        "upd_date", pdProdImg.updDate
    );

    /*
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
                        pdProdImg.regBy,
                        pdProdImg.regDate,
                        pdProdImg.updBy,
                        pdProdImg.updDate
                ))
                .from(pdProdImg);
    }

    /* 상품 이미지 키조회 */
    @Override
    public Optional<PdProdImgDto.Item> selectById(String prodImgId) {
        PdProdImgDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(pdProdImg.prodImgId.eq(prodImgId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 상품 이미지 목록조회 */
    @Override
    public List<PdProdImgDto.Item> selectList(PdProdImgDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        JPAQuery<PdProdImgDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strIn(pdProdImg.prodId, search.getProdIds()),
                    QdslUtil.strEq(pdProdImg.prodId, search.getProdId()),
                    QdslUtil.strEq(pdProdImg.prodImgId, search.getProdImgId()),
                    QdslUtil.dateBetween(search.getDateRangeType(), search.getDateRangeStart(), search.getDateRangeEnd(), DATE_RANGE_FIELDS),
                    andSearchValue(search.getSearchValue(), search.getSearchType())
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

    /* 상품 이미지 페이지조회 */
    @Override
    public BasePage<PdProdImgDto.Item> selectPageData(PdProdImgDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        BooleanExpression[] wheres = {
                QdslUtil.strIn(pdProdImg.prodId, search.getProdIds()),
                QdslUtil.strEq(pdProdImg.prodId, search.getProdId()),
                QdslUtil.strEq(pdProdImg.prodImgId, search.getProdImgId()),
                QdslUtil.dateBetween(search.getDateRangeType(), search.getDateRangeStart(), search.getDateRangeEnd(), DATE_RANGE_FIELDS),
                andSearchValue(search.getSearchValue(), search.getSearchType())
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<PdProdImgDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<PdProdImgDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pdProdImg.count())
                .where(wheres)
                .fetchOne();

        BasePage<PdProdImgDto.Item> res = new BasePage<>();
        return res.setPageInfo(content, CmUtil.nvlLong(total), pageNo, pageSize, search);
    }

    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("attachId", pdProdImg.attachId),
            QdslUtil.FieldDef.like("cdnHost", pdProdImg.cdnHost),
            QdslUtil.FieldDef.like("cdnImgUrl", pdProdImg.cdnImgUrl),
            QdslUtil.FieldDef.like("cdnThumbUrl", pdProdImg.cdnThumbUrl),
            QdslUtil.FieldDef.like("imgAltText", pdProdImg.imgAltText),
            QdslUtil.FieldDef.like("isThumb", pdProdImg.isThumb),
            QdslUtil.FieldDef.like("prodOpt1Id", pdProdImg.prodOpt1Id),
            QdslUtil.FieldDef.like("prodOpt2Id", pdProdImg.prodOpt2Id),
            QdslUtil.FieldDef.like("prodId", pdProdImg.prodId),
            QdslUtil.FieldDef.like("prodImgId", pdProdImg.prodImgId)
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
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(pdProdImg.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(pdProdImg.prodImgId.eq(entity.getProdImgId())).execute();
        return (int) affected;
    }
}
