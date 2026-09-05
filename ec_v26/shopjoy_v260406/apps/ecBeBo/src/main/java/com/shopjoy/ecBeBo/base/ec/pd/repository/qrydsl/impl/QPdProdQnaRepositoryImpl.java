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
import com.shopjoy.ecBeBo.base.ec.pd.data.dto.PdProdQnaDto;
import com.shopjoy.ecBeBo.base.ec.pd.data.entity.PdProdQna;
import com.shopjoy.ecBeBo.base.ec.pd.data.entity.QPdProdQna;
import com.shopjoy.ecBeBo.base.ec.pd.repository.qrydsl.QPdProdQnaRepository;
import com.shopjoy.ecBeBo.base.sy.data.entity.QSyUser;
import com.shopjoy.ecBeBo.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecBeBo.common.util.QdslUtil;

/** PdProdQna(상품문의) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPdProdQnaRepositoryImpl implements QPdProdQnaRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pd.repository.qrydsl.impl.QPdProdQnaRepositoryImpl";
    private static final QSySite siteEx = new QSySite("site_ex");
    private static final QSyUser regUserEx = new QSyUser("reg_user_ex");
    private static final QSySite regSiteEx = new QSySite("reg_site_ex");
    private static final QPdProdQna pdProdQna = QPdProdQna.pdProdQna;    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값 (prodQnaTypeCd 는 sy_code 미등록 — Entity 주석 기준 예시)
     * SCRT_YN / ANSW_YN / DISP_YN / USE_YN  {Y: '예', N: '아니오'}
     */
    /** 단건 조회 */
    private JPAQuery<PdProdQnaDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PdProdQnaDto.Item.class,
                        pdProdQna.prodQnaId,      // 문의ID (PK, YYMMDDhhmmss+rand4)
                        pdProdQna.prodId,          // 상품ID (pd_prod.prod_id)
                        pdProdQna.prodSkuId,       // SKUID (pd_prod_sku.prod_sku_id)
                        pdProdQna.memberId,        // 회원ID (mb_member.member_id)
                        pdProdQna.orderId,         // 주문ID (od_order.order_id)
                        pdProdQna.prodQnaTypeCd,    // 문의유형코드
                        pdProdQna.prodQnaTitle,    // 문의제목
                        pdProdQna.prodQnaContent,  // 문의내용
                        pdProdQna.scrtYn,            // 비밀글여부 — {Y: '예', N: '아니오'}
                        pdProdQna.answYn,             // 답변여부 — {Y: '예', N: '아니오'}
                        pdProdQna.answContent,     // 답변내용
                        pdProdQna.answDate,        // 답변일시
                        pdProdQna.answUserId,      // 답변자ID (sy_user.user_id)
                        pdProdQna.dispYn,             // 노출여부 — {Y: '예', N: '아니오'}
                        pdProdQna.useYn,              // 사용여부 — {Y: '예', N: '아니오'}
                        pdProdQna.regBy,      // 등록자
                        pdProdQna.regDate,    // 등록일시
                        pdProdQna.updBy,      // 수정자
                        pdProdQna.updDate,    // 수정일시
                        pdProdQna.regSiteId,  // 등록사이트ID
                        regSiteEx.siteNm.as("regSiteNm"),  // 등록사이트명 (조인)
                        regUserEx.userNm.as("regUserNm"),   // 등록자명 (조인)
                        pdProdQna.siteId,  // 사이트ID
                        siteEx.siteNm.as("siteNm")   // 사이트명 (조인)
                ))
                .from(pdProdQna)
                .leftJoin(regSiteEx).on(regSiteEx.siteId.eq(pdProdQna.regSiteId)) // 등록사이트
                .leftJoin(regUserEx).on(regUserEx.userId.eq(pdProdQna.regBy)) // 등록자
                .leftJoin(siteEx).on(siteEx.siteId.eq(pdProdQna.siteId)) // 사이트

                ;
    }

    @Override
    public Optional<PdProdQnaDto.Item> selectById(String prodQnaId) {
        PdProdQnaDto.Item dtl = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(pdProdQna.prodQnaId.eq(prodQnaId))
                .fetchOne();
        return Optional.ofNullable(dtl);
    }

    /** 전체 목록 */
    @Override
    public List<PdProdQnaDto.Item> selectList(PdProdQnaDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(pdProdQna.prodQnaId, search.getProdQnaId())); // 문의ID 필터
        whereList.add(QdslUtil.strEq(pdProdQna.prodId, search.getProdId())); // 상품ID 필터
        whereList.add(QdslUtil.strEq(pdProdQna.answYn, search.getAnswYn())); // 답변여부 필터 Y/N
        whereList.add(QdslUtil.strEq(pdProdQna.useYn, search.getUseYn())); // 사용여부 필터 Y/N
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pdProdQna.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pdProdQna.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        whereList.add(QdslUtil.strEq(pdProdQna.siteId, search.getSiteId())); // 사이트ID 필터

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<PdProdQnaDto.Item> query = baseSelColumnQuery()
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
        List<PdProdQnaDto.Item> list = query.fetch();
        return list;
    }

    /** 페이지 목록 */
    @Override
    public BasePage<PdProdQnaDto.Item> selectPageData(PdProdQnaDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(pdProdQna.prodQnaId, search.getProdQnaId())); // 문의ID 필터
        whereList.add(QdslUtil.strEq(pdProdQna.prodId, search.getProdId())); // 상품ID 필터
        whereList.add(QdslUtil.strEq(pdProdQna.answYn, search.getAnswYn())); // 답변여부 필터 Y/N
        whereList.add(QdslUtil.strEq(pdProdQna.useYn, search.getUseYn())); // 사용여부 필터 Y/N
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pdProdQna.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pdProdQna.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        whereList.add(QdslUtil.strEq(pdProdQna.siteId, search.getSiteId())); // 사이트ID 필터
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        JPAQuery<PdProdQnaDto.Item> query = baseSelColumnQuery();

        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<PdProdQnaDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pdProdQna.count())
                .where(wheres)
                .fetchOne();

        BasePage<PdProdQnaDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }

    /* searchType 예: "answContent,answUserId,answYn,dispYn,memberId" 등 (콤마 조합, 미지정 시 전체 OR) */
    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("answContent", pdProdQna.answContent), // 답변내용
            QdslUtil.FieldDef.like("answUserId", pdProdQna.answUserId), // 답변자ID (sy_user.user_id)
            QdslUtil.FieldDef.like("answYn", pdProdQna.answYn), // 답변여부 필터 Y/N
            QdslUtil.FieldDef.like("dispYn", pdProdQna.dispYn), // 노출여부 Y/N
            QdslUtil.FieldDef.like("memberId", pdProdQna.memberId), // 회원ID (mb_member.member_id)
            QdslUtil.FieldDef.like("orderId", pdProdQna.orderId), // 주문ID (od_order.order_id)
            QdslUtil.FieldDef.like("prodId", pdProdQna.prodId), // 상품ID 필터
            QdslUtil.FieldDef.like("prodQnaContent", pdProdQna.prodQnaContent), // 문의내용
            QdslUtil.FieldDef.like("prodQnaId", pdProdQna.prodQnaId), // 문의ID 필터
            QdslUtil.FieldDef.like("prodQnaTitle", pdProdQna.prodQnaTitle), // 문의제목
            QdslUtil.FieldDef.like("prodQnaTypeCd", pdProdQna.prodQnaTypeCd), // 문의유형코드 — PROD_QNA_TYPE_CD {PROD:상품문의}
            QdslUtil.FieldDef.like("scrtYn", pdProdQna.scrtYn), // 비밀글여부 Y/N
            QdslUtil.FieldDef.like("prodSkuId", pdProdQna.prodSkuId), // SKUID (pd_prod_sku.prod_sku_id)
            QdslUtil.FieldDef.like("useYn", pdProdQna.useYn) // 사용여부 필터 Y/N
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("prodQnaId", pdProdQna.prodQnaId,
                   "prodQnaTitle", pdProdQna.prodQnaTitle,
                   "regDate", pdProdQna.regDate),
        new OrderSpecifier<>(Order.DESC, pdProdQna.regDate),
        new OrderSpecifier<>(Order.ASC, pdProdQna.prodQnaId));
    }

    /** updateSelective — Mapper XML 과 동일한 컬럼셋만 갱신 */
    @Override
    public int updateSelective(PdProdQna entity) {
        if (entity.getProdQnaId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pdProdQna);
        boolean hasAny = false;

        if (entity.getProdId()        != null) { update.set(pdProdQna.prodId,        entity.getProdId());        hasAny = true; }
        if (entity.getProdSkuId()     != null) { update.set(pdProdQna.prodSkuId,     entity.getProdSkuId());     hasAny = true; }
        if (entity.getMemberId()      != null) { update.set(pdProdQna.memberId,      entity.getMemberId());      hasAny = true; }
        if (entity.getOrderId()       != null) { update.set(pdProdQna.orderId,       entity.getOrderId());       hasAny = true; }
        if (entity.getProdQnaTypeCd() != null) { update.set(pdProdQna.prodQnaTypeCd, entity.getProdQnaTypeCd()); hasAny = true; }
        if (entity.getProdQnaTitle()  != null) { update.set(pdProdQna.prodQnaTitle,  entity.getProdQnaTitle());  hasAny = true; }
        if (entity.getProdQnaContent()!= null) { update.set(pdProdQna.prodQnaContent,entity.getProdQnaContent());hasAny = true; }
        if (entity.getScrtYn()        != null) { update.set(pdProdQna.scrtYn,        entity.getScrtYn());        hasAny = true; }
        if (entity.getAnswYn()        != null) { update.set(pdProdQna.answYn,        entity.getAnswYn());        hasAny = true; }
        if (entity.getAnswContent()   != null) { update.set(pdProdQna.answContent,   entity.getAnswContent());   hasAny = true; }
        if (entity.getAnswDate()      != null) { update.set(pdProdQna.answDate,      entity.getAnswDate());      hasAny = true; }
        if (entity.getAnswUserId()    != null) { update.set(pdProdQna.answUserId,    entity.getAnswUserId());    hasAny = true; }
        if (entity.getDispYn()        != null) { update.set(pdProdQna.dispYn,        entity.getDispYn());        hasAny = true; }
        if (entity.getUseYn()         != null) { update.set(pdProdQna.useYn,         entity.getUseYn());         hasAny = true; }
        if (entity.getUpdBy()         != null) { update.set(pdProdQna.updBy,         entity.getUpdBy());         hasAny = true; }
        update.set(pdProdQna.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(pdProdQna.prodQnaId.eq(entity.getProdQnaId())).execute();
        return (int) affected;
    }
}
