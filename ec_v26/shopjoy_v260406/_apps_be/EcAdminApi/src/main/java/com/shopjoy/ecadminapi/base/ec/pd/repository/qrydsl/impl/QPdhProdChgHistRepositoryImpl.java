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
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdhProdChgHistDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdhProdChgHist;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdhProdChgHist;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdhProdChgHistRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** PdhProdChgHist QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPdhProdChgHistRepositoryImpl implements QPdhProdChgHistRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pd.repository.qrydsl.impl.QPdhProdChgHistRepositoryImpl";
    private static final QPdhProdChgHist pdhProdChgHist   = QPdhProdChgHist.pdhProdChgHist;
    private static final QSySite        sySite = QSySite.sySite;    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값 (Entity 주석 기준 — sy_code 미등록)
     * CHG_TYPE_CD  {PRICE: '가격변경', STOCK: '재고변경', STATUS: '상태변경'}
     */
    /** 기본 쿼리 빌드 */
    private JPAQuery<PdhProdChgHistDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PdhProdChgHistDto.Item.class,
                        pdhProdChgHist.prodChgHistId,   // 이력ID (PK)
                        pdhProdChgHist.prodId,            // 상품ID
                        pdhProdChgHist.chgTypeCd,           // 변경유형코드 — {PRICE: '가격변경', STOCK: '재고변경', STATUS: '상태변경'}
                        pdhProdChgHist.beforeVal,         // 변경전값
                        pdhProdChgHist.afterVal,          // 변경후값
                        pdhProdChgHist.chgReason,         // 변경사유
                        pdhProdChgHist.chgUserId,          // 처리자 (sy_user.user_id)
                        pdhProdChgHist.chgDate,           // 처리일시
                        pdhProdChgHist.regBy, pdhProdChgHist.regDate, pdhProdChgHist.updBy, pdhProdChgHist.updDate
                ))
                .from(pdhProdChgHist);
    }

    /* 상품 변경 이력 키조회 */
    @Override
    public Optional<PdhProdChgHistDto.Item> selectById(String id) {
        PdhProdChgHistDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(pdhProdChgHist.prodChgHistId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 상품 변경 이력 목록조회 */
    @Override
    public List<PdhProdChgHistDto.Item> selectList(PdhProdChgHistDto.Request search) {
        DateTimePath<LocalDateTime> dateRangeField = pdhProdChgHist.regDate;
        if ("upd_date".equals(search.getDateRangeType())) {
            dateRangeField = pdhProdChgHist.updDate;
        }
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        JPAQuery<PdhProdChgHistDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(
                QdslUtil.strEq(pdhProdChgHist.prodChgHistId, search.getProdChgHistId()),
                QdslUtil.dateBetween(dateRangeField, search.getDateRangeStart(), search.getDateRangeEnd()),
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

    /* 상품 변경 이력 페이지조회 */
    @Override
    public BasePage<PdhProdChgHistDto.Item> selectPageData(PdhProdChgHistDto.Request search) {
        DateTimePath<LocalDateTime> dateRangeField = pdhProdChgHist.regDate;
        if ("upd_date".equals(search.getDateRangeType())) {
            dateRangeField = pdhProdChgHist.updDate;
        }
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        BooleanExpression[] wheres = {
                QdslUtil.strEq(pdhProdChgHist.prodChgHistId, search.getProdChgHistId()),
                QdslUtil.dateBetween(dateRangeField, search.getDateRangeStart(), search.getDateRangeEnd()),
                andSearchValue(search.getSearchValue(), search.getSearchType())
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<PdhProdChgHistDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<PdhProdChgHistDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pdhProdChgHist.count())
                .where(wheres)
                .fetchOne();

        BasePage<PdhProdChgHistDto.Item> res = new BasePage<>();
        return res.setPageInfo(content, CmUtil.nvlLong(total), pageNo, pageSize, search);
    }

    /** 검색조건 빌드 — Mapper XML pdhProdChgHistCond 와 동일 동작 */

    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("afterVal", pdhProdChgHist.afterVal),
            QdslUtil.FieldDef.like("beforeVal", pdhProdChgHist.beforeVal),
            QdslUtil.FieldDef.like("chgReason", pdhProdChgHist.chgReason),
            QdslUtil.FieldDef.like("chgTypeCd", pdhProdChgHist.chgTypeCd),
            QdslUtil.FieldDef.like("chgUserId", pdhProdChgHist.chgUserId),
            QdslUtil.FieldDef.like("prodChgHistId", pdhProdChgHist.prodChgHistId),
            QdslUtil.FieldDef.like("prodId", pdhProdChgHist.prodId)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("prodChgHistId", pdhProdChgHist.prodChgHistId,
                   "regDate", pdhProdChgHist.regDate),
        new OrderSpecifier<>(Order.DESC, pdhProdChgHist.regDate),
        new OrderSpecifier<>(Order.ASC, pdhProdChgHist.prodChgHistId));
    }

    /** updateSelective — null 이 아닌 필드만 UPDATE */
    @Override
    public int updateSelective(PdhProdChgHist entity) {
        if (entity.getProdChgHistId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pdhProdChgHist);
        boolean hasAny = false;

        if (entity.getProdId()      != null) { update.set(pdhProdChgHist.prodId,      entity.getProdId());      hasAny = true; }
        if (entity.getChgTypeCd()   != null) { update.set(pdhProdChgHist.chgTypeCd,   entity.getChgTypeCd());   hasAny = true; }
        if (entity.getBeforeVal()   != null) { update.set(pdhProdChgHist.beforeVal,   entity.getBeforeVal());   hasAny = true; }
        if (entity.getAfterVal()    != null) { update.set(pdhProdChgHist.afterVal,    entity.getAfterVal());    hasAny = true; }
        if (entity.getChgReason()   != null) { update.set(pdhProdChgHist.chgReason,   entity.getChgReason());   hasAny = true; }
        if (entity.getChgUserId()   != null) { update.set(pdhProdChgHist.chgUserId,   entity.getChgUserId());   hasAny = true; }
        if (entity.getChgDate()     != null) { update.set(pdhProdChgHist.chgDate,     entity.getChgDate());     hasAny = true; }
        if (entity.getUpdBy()       != null) { update.set(pdhProdChgHist.updBy,       entity.getUpdBy());       hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(pdhProdChgHist.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(pdhProdChgHist.prodChgHistId.eq(entity.getProdChgHistId())).execute();
        return (int) affected;
    }
}
