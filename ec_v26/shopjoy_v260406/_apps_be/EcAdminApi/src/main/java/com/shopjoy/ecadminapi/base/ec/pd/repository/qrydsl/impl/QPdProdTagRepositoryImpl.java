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
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdTagDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdTag;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProd;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProdTag;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdProdTagRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** PdProdTag QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPdProdTagRepositoryImpl implements QPdProdTagRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pd.repository.qrydsl.impl.QPdProdTagRepositoryImpl";
    private static final QPdProdTag pdProdTag   = QPdProdTag.pdProdTag;
    private static final QPdProd    pdProd = QPdProd.pdProd;
    private static final QSySite    sySite = QSySite.sySite;    /* 상품 태그 baseSelColumnQuery — 코드성 필드 없음 (단순 매핑 테이블) */
    private JPAQuery<PdProdTagDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PdProdTagDto.Item.class,
                        pdProdTag.prodTagId,   // 상품태그ID (PK)
                        pdProdTag.prodId,       // 상품ID (pd_prod.prod_id)
                        pdProdTag.tagId,        // 태그ID (pd_tag.tag_id)
                        pdProdTag.regBy, pdProdTag.regDate
                ))
                .from(pdProdTag)
                .leftJoin(pdProd).on(pdProd.prodId.eq(pdProdTag.prodId));
    }

    /* 상품 태그 키조회 */
    @Override
    public Optional<PdProdTagDto.Item> selectById(String prodTagId) {
        PdProdTagDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(pdProdTag.prodTagId.eq(prodTagId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 상품 태그 목록조회 */
    @Override
    public List<PdProdTagDto.Item> selectList(PdProdTagDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        /* 검색조건 — 배열 초기화 { } 대신 리스트에 하나씩 add 한다.
           .where(a, b, c) 인자 자리나 배열 초기화 { } 안에는 식(expression)만 올 수 있어
           if 를 쓸 수 없지만, 리스트에 담으면 분기 조건을 if 로 그대로 풀어 쓸 수 있다.
           null 을 add 해도 QueryDSL where 가 무시하므로 기존 "조건 없으면 null" 관례 그대로 유효. */
        List<BooleanExpression> wheres = new ArrayList<>();
        wheres.add(QdslUtil.strEq(pdProdTag.prodTagId, search.getProdTagId()));
        /* 기간검색 — dateRangeType 값에 따라 대상 컬럼을 직접 지정 */
        if ("upd_date".equals(search.getDateRangeType())) {
            wheres.add(QdslUtil.dateBetween(pdProdTag.updDate, search.getDateRangeStart(), search.getDateRangeEnd()));
        } else {
            wheres.add(QdslUtil.dateBetween(pdProdTag.regDate, search.getDateRangeStart(), search.getDateRangeEnd()));   // reg_date (기본)
        }
        wheres.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        JPAQuery<PdProdTagDto.Item> query = baseSelColumnQuery()
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

    /* 상품 태그 페이지조회 */
    @Override
    public BasePage<PdProdTagDto.Item> selectPageData(PdProdTagDto.Request search) {
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
        whereList.add(QdslUtil.strEq(pdProdTag.prodTagId, search.getProdTagId()));
        /* 기간검색 — dateRangeType 값에 따라 대상 컬럼을 직접 지정 */
        if ("upd_date".equals(search.getDateRangeType())) {
            whereList.add(QdslUtil.dateBetween(pdProdTag.updDate, search.getDateRangeStart(), search.getDateRangeEnd()));
        } else if ("reg_date".equals(search.getDateRangeType())) {
            whereList.add(QdslUtil.dateBetween(pdProdTag.regDate, search.getDateRangeStart(), search.getDateRangeEnd()));
        }
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<PdProdTagDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<PdProdTagDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pdProdTag.count())
                .where(wheres)
                .fetchOne();

        BasePage<PdProdTagDto.Item> res = new BasePage<>();
        return res.setPageInfo(content, CmUtil.nvlLong(total), pageNo, pageSize, search);
    }

    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("prodId", pdProdTag.prodId),
            QdslUtil.FieldDef.like("prodTagId", pdProdTag.prodTagId),
            QdslUtil.FieldDef.like("tagId", pdProdTag.tagId)
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
