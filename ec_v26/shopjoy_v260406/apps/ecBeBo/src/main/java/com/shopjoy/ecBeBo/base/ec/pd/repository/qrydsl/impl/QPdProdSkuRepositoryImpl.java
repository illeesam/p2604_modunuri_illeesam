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
import com.shopjoy.ecBeBo.base.ec.pd.data.dto.PdProdSkuDto;
import com.shopjoy.ecBeBo.base.ec.pd.data.entity.PdProdSku;
import com.shopjoy.ecBeBo.base.ec.pd.data.entity.QPdProdSku;
import com.shopjoy.ecBeBo.base.ec.pd.repository.qrydsl.QPdProdSkuRepository;
import com.shopjoy.ecBeBo.base.sy.data.entity.QSyUser;
import com.shopjoy.ecBeBo.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecBeBo.common.util.QdslUtil;
/** PdProdSku(상품 옵션 SKU (조합별 재고/가격)) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPdProdSkuRepositoryImpl implements QPdProdSkuRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pd.repository.qrydsl.impl.QPdProdSkuRepositoryImpl";
    private static final QSySite siteEx = new QSySite("site_ex");
    private static final QSyUser regUserEx = new QSyUser("reg_user_ex");
    private static final QSySite regSiteEx = new QSySite("reg_site_ex");
    private static final QPdProdSku pdProdSku = QPdProdSku.pdProdSku;    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * USE_YN  {Y: '사용', N: '미사용'}
     */
    private JPAQuery<PdProdSkuDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PdProdSkuDto.Item.class,
                        pdProdSku.prodSkuId,     // SKU ID (PK)
                        pdProdSku.prodId,         // 상품ID
                        pdProdSku.prodOpt1Id,     // 옵션1 값ID (pd_prod_opt.prod_opt_id)
                        pdProdSku.prodOpt2Id,     // 옵션2 값ID (pd_prod_opt.prod_opt_id)
                        pdProdSku.prodSkuCode,    // 자체 SKU 코드
                        pdProdSku.addPrice,       // 옵션 추가금액 (기본가 대비)
                        pdProdSku.useYn,           // 사용여부 — {Y: '사용', N: '미사용'}
                        pdProdSku.regBy, // 등록자
                        pdProdSku.regDate, // 등록일
                        pdProdSku.updBy, // 수정자
                        pdProdSku.updDate, // 수정일
                        pdProdSku.regSiteId,  // 등록사이트ID
                        regSiteEx.siteNm.as("regSiteNm"),  // 등록사이트명 (조인)
                        regUserEx.userNm.as("regUserNm"),   // 등록자명 (조인)
                        pdProdSku.siteId,  // 사이트ID
                        siteEx.siteNm.as("siteNm")   // 사이트명 (조인)
                ))
                .from(pdProdSku)
                .leftJoin(regSiteEx).on(regSiteEx.siteId.eq(pdProdSku.regSiteId)) // 등록사이트
                .leftJoin(regUserEx).on(regUserEx.userId.eq(pdProdSku.regBy)) // 등록자
                .leftJoin(siteEx).on(siteEx.siteId.eq(pdProdSku.siteId)) // 사이트

                ;
    }

    /* 상품 SKU 키조회 */
    @Override
    public Optional<PdProdSkuDto.Item> selectById(String prodSkuId) {
        PdProdSkuDto.Item dtl = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(pdProdSku.prodSkuId.eq(prodSkuId))
                .fetchOne();
        return Optional.ofNullable(dtl);
    }

    /* 상품 SKU 목록조회 */
    @Override
    public List<PdProdSkuDto.Item> selectList(PdProdSkuDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strIn(pdProdSku.prodId, search.getProdIds())); // PK 다건 IN
        whereList.add(QdslUtil.strEq(pdProdSku.prodId, search.getProdId())); // 상품ID 필터
        whereList.add(QdslUtil.strEq(pdProdSku.prodSkuId, search.getProdSkuId())); // SKU ID (단건 조회 필터)
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pdProdSku.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pdProdSku.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        whereList.add(QdslUtil.strEq(pdProdSku.siteId, search.getSiteId())); // 사이트ID (검색 필터)

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<PdProdSkuDto.Item> query = baseSelColumnQuery()
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
        List<PdProdSkuDto.Item> list = query.fetch();
        return list;
    }

    /* 상품 SKU 페이지조회 */
    @Override
    public BasePage<PdProdSkuDto.Item> selectPageData(PdProdSkuDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strIn(pdProdSku.prodId, search.getProdIds())); // PK 다건 IN
        whereList.add(QdslUtil.strEq(pdProdSku.prodId, search.getProdId())); // 상품ID 필터
        whereList.add(QdslUtil.strEq(pdProdSku.prodSkuId, search.getProdSkuId())); // SKU ID (단건 조회 필터)
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pdProdSku.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pdProdSku.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        whereList.add(QdslUtil.strEq(pdProdSku.siteId, search.getSiteId())); // 사이트ID (검색 필터)
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        JPAQuery<PdProdSkuDto.Item> query = baseSelColumnQuery();

        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<PdProdSkuDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pdProdSku.count())
                .where(wheres)
                .fetchOne();

        BasePage<PdProdSkuDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }

    /* searchType 예: "prodOpt1Id,prodOpt2Id,prodId,prodSkuCode,prodSkuId" 등 (콤마 조합, 미지정 시 전체 OR) */
    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("prodOpt1Id", pdProdSku.prodOpt1Id), // 옵션1 값ID (pd_prod_opt.prod_opt_id)
            QdslUtil.FieldDef.like("prodOpt2Id", pdProdSku.prodOpt2Id), // 옵션2 값ID (pd_prod_opt.prod_opt_id)
            QdslUtil.FieldDef.like("prodId", pdProdSku.prodId), // 상품ID 필터
            QdslUtil.FieldDef.like("prodSkuCode", pdProdSku.prodSkuCode), // 자체 SKU 코드
            QdslUtil.FieldDef.like("prodSkuId", pdProdSku.prodSkuId), // SKU ID (단건 조회 필터)
            QdslUtil.FieldDef.like("useYn", pdProdSku.useYn) // 사용여부 필터 Y/N
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("prodSkuId", pdProdSku.prodSkuId,
                   "regDate", pdProdSku.regDate),
        new OrderSpecifier<>(Order.DESC, pdProdSku.regDate),
        new OrderSpecifier<>(Order.ASC, pdProdSku.prodSkuId));
    }

    /* 상품 SKU 수정 */
    @Override
    public int updateSelective(PdProdSku entity) {
        if (entity.getProdSkuId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pdProdSku);
        boolean hasAny = false;

        if (entity.getProdId()       != null) { update.set(pdProdSku.prodId,       entity.getProdId());       hasAny = true; }
        if (entity.getProdOpt1Id()   != null) { update.set(pdProdSku.prodOpt1Id,   entity.getProdOpt1Id());   hasAny = true; }
        if (entity.getProdOpt2Id()   != null) { update.set(pdProdSku.prodOpt2Id,   entity.getProdOpt2Id());   hasAny = true; }
        if (entity.getProdSkuCode()  != null) { update.set(pdProdSku.prodSkuCode,  entity.getProdSkuCode());  hasAny = true; }
        if (entity.getAddPrice()     != null) { update.set(pdProdSku.addPrice,     entity.getAddPrice());     hasAny = true; }
        if (entity.getUseYn()        != null) { update.set(pdProdSku.useYn,        entity.getUseYn());        hasAny = true; }
        if (entity.getUpdBy()        != null) { update.set(pdProdSku.updBy,        entity.getUpdBy());        hasAny = true; }
        update.set(pdProdSku.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(pdProdSku.prodSkuId.eq(entity.getProdSkuId())).execute();
        return (int) affected;
    }
}
