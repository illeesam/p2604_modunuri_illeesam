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
import com.shopjoy.ecBeBo.base.ec.pd.data.dto.PdProdTagDto;
import com.shopjoy.ecBeBo.base.ec.pd.data.entity.PdProdTag;
import com.shopjoy.ecBeBo.base.ec.pd.data.entity.QPdProd;
import com.shopjoy.ecBeBo.base.ec.pd.data.entity.QPdProdTag;
import com.shopjoy.ecBeBo.base.ec.pd.repository.qrydsl.QPdProdTagRepository;
import com.shopjoy.ecBeBo.base.sy.data.entity.QSyUser;
import com.shopjoy.ecBeBo.base.sy.data.entity.QSySite;
import com.shopjoy.ecBeBo.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecBeBo.common.util.QdslUtil;
/** PdProdTag(상품-태그 매핑) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPdProdTagRepositoryImpl implements QPdProdTagRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pd.repository.qrydsl.impl.QPdProdTagRepositoryImpl";
    private static final QSySite siteEx = new QSySite("site_ex");
    private static final QSyUser regUserEx = new QSyUser("reg_user_ex");
    private static final QSySite regSiteEx = new QSySite("reg_site_ex");
    private static final QPdProdTag pdProdTag   = QPdProdTag.pdProdTag;
    private static final QPdProd    pdProd = QPdProd.pdProd;
    private static final QSySite    sySite = QSySite.sySite;    /* 상품 태그 baseSelColumnQuery — 코드성 필드 없음 (단순 매핑 테이블) */
    private JPAQuery<PdProdTagDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PdProdTagDto.Item.class,
                        pdProdTag.prodTagId,   // 상품태그ID (PK)
                        pdProdTag.prodId,       // 상품ID (pd_prod.prod_id)
                        pdProdTag.tagId,        // 태그ID (pd_tag.tag_id)
                        pdProdTag.regBy,  // 등록자
                        pdProdTag.regDate,  // 등록일시
                        pdProdTag.regSiteId,  // 등록사이트ID
                        regSiteEx.siteNm.as("regSiteNm"),  // 등록사이트명 (조인)
                        regUserEx.userNm.as("regUserNm"),   // 등록자명 (조인)
                        pdProdTag.siteId,  // 사이트ID
                        siteEx.siteNm.as("siteNm")   // 사이트명 (조인)
                ))
                .from(pdProdTag)
                .innerJoin(pdProd).on(pdProd.prodId.eq(pdProdTag.prodId)) // 상품
                .leftJoin(regSiteEx).on(regSiteEx.siteId.eq(pdProdTag.regSiteId)) // 등록사이트
                .leftJoin(regUserEx).on(regUserEx.userId.eq(pdProdTag.regBy)) // 등록자
                .leftJoin(siteEx).on(siteEx.siteId.eq(pdProdTag.siteId)) // 사이트

                ;
    }

    /* 상품 태그 키조회 */
    @Override
    public Optional<PdProdTagDto.Item> selectById(String prodTagId) {
        PdProdTagDto.Item dtl = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(pdProdTag.prodTagId.eq(prodTagId))
                .fetchOne();
        return Optional.ofNullable(dtl);
    }

    /* 상품 태그 목록조회 */
    @Override
    public List<PdProdTagDto.Item> selectList(PdProdTagDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(pdProdTag.prodTagId, search.getProdTagId())); // 상품태그ID (단건 조회 필터)
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pdProdTag.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pdProdTag.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        whereList.add(QdslUtil.strEq(pdProdTag.siteId, search.getSiteId())); // 사이트ID (검색 필터)

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<PdProdTagDto.Item> query = baseSelColumnQuery()
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
        List<PdProdTagDto.Item> list = query.fetch();
        return list;
    }

    /* 상품 태그 페이지조회 */
    @Override
    public BasePage<PdProdTagDto.Item> selectPageData(PdProdTagDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(pdProdTag.prodTagId, search.getProdTagId())); // 상품태그ID (단건 조회 필터)
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pdProdTag.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pdProdTag.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        whereList.add(QdslUtil.strEq(pdProdTag.siteId, search.getSiteId())); // 사이트ID (검색 필터)
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        JPAQuery<PdProdTagDto.Item> query = baseSelColumnQuery();

        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<PdProdTagDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pdProdTag.count())
                .where(wheres)
                .fetchOne();

        BasePage<PdProdTagDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }

    /* searchType 예: "prodId,prodTagId,tagId" (콤마 조합, 미지정 시 전체 OR) */
    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("prodId", pdProdTag.prodId), // 상품ID (pd_prod.prod_id)
            QdslUtil.FieldDef.like("prodTagId", pdProdTag.prodTagId), // 상품태그ID (단건 조회 필터)
            QdslUtil.FieldDef.like("tagId", pdProdTag.tagId) // 태그ID (pd_tag.tag_id)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("prodTagId", pdProdTag.prodTagId,
                   "regDate", pdProdTag.regDate),
        new OrderSpecifier<>(Order.DESC, pdProdTag.regDate),
        new OrderSpecifier<>(Order.ASC, pdProdTag.prodTagId));
    }

    /* 상품 태그 수정 */
    @Override
    public int updateSelective(PdProdTag entity) {
        if (entity.getProdTagId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pdProdTag);
        boolean hasAny = false;

        if (entity.getProdId() != null) { update.set(pdProdTag.prodId, entity.getProdId()); hasAny = true; }
        if (entity.getTagId()  != null) { update.set(pdProdTag.tagId,  entity.getTagId());  hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(pdProdTag.prodTagId.eq(entity.getProdTagId())).execute();
        return (int) affected;
    }
}
