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
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdRelDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdRel;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProdRel;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdProdRelRepository;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** PdProdRel QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPdProdRelRepositoryImpl implements QPdProdRelRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pd.repository.qrydsl.impl.QPdProdRelRepositoryImpl";
    private static final QPdProdRel pdProdRel = QPdProdRel.pdProdRel;    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값 (PROD_REL_TYPE 은 sy_code 미등록 — Entity 주석 기준)
     * PROD_REL_TYPE_CD  {REL_PROD: '연관상품', CODY_PROD: '코디상품'}
     * USE_YN            {Y: '사용', N: '미사용'}
     */
    /** 단건 조회 */
    private JPAQuery<PdProdRelDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PdProdRelDto.Item.class,
                        pdProdRel.prodRelId,       // 연관관계ID (PK, YYMMDDhhmmss+rand4)
                        pdProdRel.prodId,          // 기준 상품ID (pd_prod.prod_id)
                        pdProdRel.relProdId,       // 연관 대상 상품ID (pd_prod.prod_id)
                        pdProdRel.prodRelTypeCd,    // 관계유형 — {REL_PROD: '연관상품', CODY_PROD: '코디상품'}
                        pdProdRel.sortOrd,         // 정렬순서 (낮을수록 우선 노출)
                        pdProdRel.useYn,             // 사용여부 — {Y: '사용', N: '미사용'}
                        pdProdRel.regBy, pdProdRel.regDate, pdProdRel.updBy, pdProdRel.updDate
                ))
                .from(pdProdRel);
    }

    @Override
    public Optional<PdProdRelDto.Item> selectById(String prodRelId) {
        PdProdRelDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(pdProdRel.prodRelId.eq(prodRelId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /** 전체 목록 */
    @Override
    public List<PdProdRelDto.Item> selectList(PdProdRelDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        /* 검색조건 — 배열 초기화 { } 대신 리스트에 하나씩 add 한다.
           .where(a, b, c) 인자 자리나 배열 초기화 { } 안에는 식(expression)만 올 수 있어
           if 를 쓸 수 없지만, 리스트에 담으면 분기 조건을 if 로 그대로 풀어 쓸 수 있다.
           null 을 add 해도 QueryDSL where 가 무시하므로 기존 "조건 없으면 null" 관례 그대로 유효. */
        List<BooleanExpression> wheres = new ArrayList<>();
        wheres.add(QdslUtil.strEq(pdProdRel.prodRelId, search.getProdRelId()));
        wheres.add(QdslUtil.strEq(pdProdRel.prodId, search.getProdId()));
        wheres.add(QdslUtil.strEq(pdProdRel.useYn, search.getUseYn()));
        /* 기간검색 — dateRangeType 값에 따라 대상 컬럼을 직접 지정 */
        if ("upd_date".equals(search.getDateRangeType())) {
            wheres.add(QdslUtil.dateBetween(pdProdRel.updDate, search.getDateRangeStart(), search.getDateRangeEnd()));
        } else {
            wheres.add(QdslUtil.dateBetween(pdProdRel.regDate, search.getDateRangeStart(), search.getDateRangeEnd()));   // reg_date (기본)
        }
        wheres.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        JPAQuery<PdProdRelDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(wheres.toArray(BooleanExpression[]::new))
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
    public BasePage<PdProdRelDto.Item> selectPageData(PdProdRelDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        /* 검색조건 — 배열 초기화 { } 대신 리스트에 하나씩 add 한다.
           .where(a, b, c) 인자 자리나 배열 초기화 { } 안에는 식(expression)만 올 수 있어
           if 를 쓸 수 없지만, 리스트에 담으면 분기 조건을 if 로 그대로 풀어 쓸 수 있다.
           null 을 add 해도 QueryDSL where 가 무시하므로 기존 "조건 없으면 null" 관례 그대로 유효. */
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(pdProdRel.prodRelId, search.getProdRelId()));
        whereList.add(QdslUtil.strEq(pdProdRel.prodId, search.getProdId()));
        whereList.add(QdslUtil.strEq(pdProdRel.useYn, search.getUseYn()));
        /* 기간검색 — dateRangeType 값에 따라 대상 컬럼을 직접 지정 */
        if ("upd_date".equals(search.getDateRangeType())) {
            whereList.add(QdslUtil.dateBetween(pdProdRel.updDate, search.getDateRangeStart(), search.getDateRangeEnd()));
        } else if ("reg_date".equals(search.getDateRangeType())) {
            whereList.add(QdslUtil.dateBetween(pdProdRel.regDate, search.getDateRangeStart(), search.getDateRangeEnd()));
        }
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<PdProdRelDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<PdProdRelDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pdProdRel.count())
                .where(wheres)
                .fetchOne();

        BasePage<PdProdRelDto.Item> res = new BasePage<>();
        return res.setPageInfo(content, CmUtil.nvlLong(total), pageNo, pageSize, search);
    }

    /** 단건/목록/페이지 공용 base query */
    /** 검색조건 빌드 — Mapper XML pdProdRelCond 와 동일 동작 (DTO Request 필드 한정) */

    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("prodId", pdProdRel.prodId),
            QdslUtil.FieldDef.like("prodRelId", pdProdRel.prodRelId),
            QdslUtil.FieldDef.like("prodRelTypeCd", pdProdRel.prodRelTypeCd),
            QdslUtil.FieldDef.like("relProdId", pdProdRel.relProdId),
            QdslUtil.FieldDef.like("useYn", pdProdRel.useYn)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("prodRelId", pdProdRel.prodRelId,
                   "regDate", pdProdRel.regDate,
                   "sortOrd", pdProdRel.sortOrd),
        new OrderSpecifier<>(Order.ASC, pdProdRel.sortOrd),
        new OrderSpecifier<>(Order.ASC, pdProdRel.regDate),
        new OrderSpecifier<>(Order.ASC, pdProdRel.prodRelId));
    }

    /** updateSelective — Mapper XML 과 동일한 컬럼셋만 갱신 */

    @Override
    public int updateSelective(PdProdRel entity) {
        if (entity.getProdRelId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pdProdRel);
        boolean hasAny = false;

        if (entity.getProdId()        != null) { update.set(pdProdRel.prodId,        entity.getProdId());        hasAny = true; }
        if (entity.getRelProdId()     != null) { update.set(pdProdRel.relProdId,     entity.getRelProdId());     hasAny = true; }
        if (entity.getProdRelTypeCd() != null) { update.set(pdProdRel.prodRelTypeCd, entity.getProdRelTypeCd()); hasAny = true; }
        if (entity.getSortOrd()       != null) { update.set(pdProdRel.sortOrd,       entity.getSortOrd());       hasAny = true; }
        if (entity.getUseYn()         != null) { update.set(pdProdRel.useYn,         entity.getUseYn());         hasAny = true; }
        if (entity.getUpdBy()         != null) { update.set(pdProdRel.updBy,         entity.getUpdBy());         hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(pdProdRel.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(pdProdRel.prodRelId.eq(entity.getProdRelId())).execute();
        return (int) affected;
    }
}
