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
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdContentDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdContent;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProdContent;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdProdContentRepository;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** PdProdContent QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPdProdContentRepositoryImpl implements QPdProdContentRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pd.repository.qrydsl.impl.QPdProdContentRepositoryImpl";
    private static final QPdProdContent pdProdContent = QPdProdContent.pdProdContent;    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값 (sy_code 등록 기준)
     * CONTENT_TYPE_CD (PROD_CONTENT_TYPE)  {DETAIL: '상세설명', NOTICE: '상품공지', GUIDE: '이용안내', SIZE_GUIDE: '사이즈안내'}
     * USE_YN                                {Y: '사용', N: '미사용'}
     */
    private JPAQuery<PdProdContentDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PdProdContentDto.Item.class,
                        pdProdContent.prodContentId,   // 상품컨텐츠ID (PK)
                        pdProdContent.prodId,           // 상품ID (pd_prod.prod_id)
                        pdProdContent.contentTypeCd,     // 컨텐츠유형 — {DETAIL: '상세설명', NOTICE: '상품공지', GUIDE: '이용안내', SIZE_GUIDE: '사이즈안내'}
                        pdProdContent.contentHtml,      // HTML 에디터 컨텐츠
                        pdProdContent.sortOrd,          // 정렬순서
                        pdProdContent.useYn,             // 사용여부 — {Y: '사용', N: '미사용'}
                        pdProdContent.regBy,
                        pdProdContent.regDate,
                        pdProdContent.updBy,
                        pdProdContent.updDate
                ))
                .from(pdProdContent);
    }

    /* 상품 상세 콘텐츠 키조회 */
    @Override
    public Optional<PdProdContentDto.Item> selectById(String prodContentId) {
        PdProdContentDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(pdProdContent.prodContentId.eq(prodContentId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 상품 상세 콘텐츠 목록조회 */
    @Override
    public List<PdProdContentDto.Item> selectList(PdProdContentDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        /* 검색조건 — 배열 초기화 { } 대신 리스트에 하나씩 add 한다.
           .where(a, b, c) 인자 자리나 배열 초기화 { } 안에는 식(expression)만 올 수 있어
           if 를 쓸 수 없지만, 리스트에 담으면 분기 조건을 if 로 그대로 풀어 쓸 수 있다.
           null 을 add 해도 QueryDSL where 가 무시하므로 기존 "조건 없으면 null" 관례 그대로 유효. */
        List<BooleanExpression> wheres = new ArrayList<>();
        wheres.add(QdslUtil.strEq(pdProdContent.prodId, search.getProdId()));
        wheres.add(QdslUtil.strEq(pdProdContent.prodContentId, search.getProdContentId()));
        /* 기간검색 — dateRangeType 값에 따라 대상 컬럼을 직접 지정 */
        if ("upd_date".equals(search.getDateRangeType())) {
            wheres.add(QdslUtil.dateBetween(pdProdContent.updDate, search.getDateRangeStart(), search.getDateRangeEnd()));
        } else {
            wheres.add(QdslUtil.dateBetween(pdProdContent.regDate, search.getDateRangeStart(), search.getDateRangeEnd()));   // reg_date (기본)
        }
        wheres.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        JPAQuery<PdProdContentDto.Item> query = baseSelColumnQuery()
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

    /* 상품 상세 콘텐츠 페이지조회 */
    @Override
    public BasePage<PdProdContentDto.Item> selectPageData(PdProdContentDto.Request search) {
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
        whereList.add(QdslUtil.strEq(pdProdContent.prodId, search.getProdId()));
        whereList.add(QdslUtil.strEq(pdProdContent.prodContentId, search.getProdContentId()));
        /* 기간검색 — dateRangeType 값에 따라 대상 컬럼을 직접 지정 */
        if ("upd_date".equals(search.getDateRangeType())) {
            whereList.add(QdslUtil.dateBetween(pdProdContent.updDate, search.getDateRangeStart(), search.getDateRangeEnd()));
        } else if ("reg_date".equals(search.getDateRangeType())) {
            whereList.add(QdslUtil.dateBetween(pdProdContent.regDate, search.getDateRangeStart(), search.getDateRangeEnd()));
        }
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<PdProdContentDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<PdProdContentDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pdProdContent.count())
                .where(wheres)
                .fetchOne();

        BasePage<PdProdContentDto.Item> res = new BasePage<>();
        return res.setPageInfo(content, CmUtil.nvlLong(total), pageNo, pageSize, search);
    }

    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("contentHtml", pdProdContent.contentHtml),
            QdslUtil.FieldDef.like("contentTypeCd", pdProdContent.contentTypeCd),
            QdslUtil.FieldDef.like("prodContentId", pdProdContent.prodContentId),
            QdslUtil.FieldDef.like("prodId", pdProdContent.prodId),
            QdslUtil.FieldDef.like("useYn", pdProdContent.useYn)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("prodContentId", pdProdContent.prodContentId,
                   "regDate", pdProdContent.regDate,
                   "sortOrd", pdProdContent.sortOrd),
        new OrderSpecifier<>(Order.ASC, pdProdContent.sortOrd),
        new OrderSpecifier<>(Order.ASC, pdProdContent.regDate),
        new OrderSpecifier<>(Order.ASC, pdProdContent.prodContentId));
    }

    /* 상품 상세 콘텐츠 수정 */

    @Override
    public int updateSelective(PdProdContent entity) {
        if (entity.getProdContentId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pdProdContent);
        boolean hasAny = false;

        if (entity.getProdId()        != null) { update.set(pdProdContent.prodId,        entity.getProdId());        hasAny = true; }
        if (entity.getContentTypeCd() != null) { update.set(pdProdContent.contentTypeCd, entity.getContentTypeCd()); hasAny = true; }
        if (entity.getContentHtml()   != null) { update.set(pdProdContent.contentHtml,   entity.getContentHtml());   hasAny = true; }
        if (entity.getSortOrd()       != null) { update.set(pdProdContent.sortOrd,       entity.getSortOrd());       hasAny = true; }
        if (entity.getUseYn()         != null) { update.set(pdProdContent.useYn,         entity.getUseYn());         hasAny = true; }
        if (entity.getUpdBy()         != null) { update.set(pdProdContent.updBy,         entity.getUpdBy());         hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(pdProdContent.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(pdProdContent.prodContentId.eq(entity.getProdContentId())).execute();
        return (int) affected;
    }
}
