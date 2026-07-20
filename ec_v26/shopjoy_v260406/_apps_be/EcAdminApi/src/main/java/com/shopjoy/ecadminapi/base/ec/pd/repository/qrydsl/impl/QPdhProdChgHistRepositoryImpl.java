package com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.DateTimePath;
import com.querydsl.core.types.dsl.StringPath;
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
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** PdhProdChgHist QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPdhProdChgHistRepositoryImpl implements QPdhProdChgHistRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pd.repository.qrydsl.impl.QPdhProdChgHistRepositoryImpl";
    private static final QPdhProdChgHist pdhProdChgHist   = QPdhProdChgHist.pdhProdChgHist;
    private static final QSySite        sySite = QSySite.sySite;
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_FIELDS = Map.of(
        "reg_date", pdhProdChgHist.regDate,
        "upd_date", pdhProdChgHist.updDate
    );
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("afterVal", pdhProdChgHist.afterVal),
        Map.entry("beforeVal", pdhProdChgHist.beforeVal),
        Map.entry("chgReason", pdhProdChgHist.chgReason),
        Map.entry("chgTypeCd", pdhProdChgHist.chgTypeCd),
        Map.entry("chgUserId", pdhProdChgHist.chgUserId),
        Map.entry("prodChgHistId", pdhProdChgHist.prodChgHistId),
        Map.entry("prodId", pdhProdChgHist.prodId),
        Map.entry("siteId", pdhProdChgHist.siteId)
    );

    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값 (Entity 주석 기준 — sy_code 미등록)
     * CHG_TYPE_CD  {PRICE: '가격변경', STOCK: '재고변경', STATUS: '상태변경'}
     */
    /** 기본 쿼리 빌드 */
    private JPAQuery<PdhProdChgHistDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PdhProdChgHistDto.Item.class,
                        pdhProdChgHist.prodChgHistId,   // 이력ID (PK)
                        pdhProdChgHist.siteId,            // 사이트ID (sy_site.site_id)
                        pdhProdChgHist.prodId,            // 상품ID
                        pdhProdChgHist.chgTypeCd,           // 변경유형코드 — {PRICE: '가격변경', STOCK: '재고변경', STATUS: '상태변경'}
                        pdhProdChgHist.beforeVal,         // 변경전값
                        pdhProdChgHist.afterVal,          // 변경후값
                        pdhProdChgHist.chgReason,         // 변경사유
                        pdhProdChgHist.chgUserId,          // 처리자 (sy_user.user_id)
                        pdhProdChgHist.chgDate,           // 처리일시
                        pdhProdChgHist.regBy, pdhProdChgHist.regDate, pdhProdChgHist.updBy, pdhProdChgHist.updDate
                ))
                .from(pdhProdChgHist)
                .leftJoin(sySite).on(sySite.siteId.eq(pdhProdChgHist.siteId));
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
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdhProdChgHistDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(
                QdslUtil.strEq(pdhProdChgHist.siteId, search.getSiteId()),
                QdslUtil.strEq(pdhProdChgHist.prodChgHistId, search.getProdChgHistId()),
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

    /* 상품 변경 이력 페이지조회 */
    @Override
    public PdhProdChgHistDto.PageResponse selectPageData(PdhProdChgHistDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(pdhProdChgHist.siteId, search.getSiteId()),
                QdslUtil.strEq(pdhProdChgHist.prodChgHistId, search.getProdChgHistId()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
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

        PdhProdChgHistDto.PageResponse res = new PdhProdChgHistDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /** 검색조건 빌드 — Mapper XML pdhProdChgHistCond 와 동일 동작 */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

private BooleanExpression andSearchValueLike(PdhProdChgHistDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
    }


    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(PdhProdChgHistDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, pdhProdChgHist.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pdhProdChgHist.prodChgHistId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("prodChgHistId".equals(field)) {
                    orders.add(new OrderSpecifier(order, pdhProdChgHist.prodChgHistId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, pdhProdChgHist.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, pdhProdChgHist.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pdhProdChgHist.prodChgHistId));
        }
        return orders;
    }

    /** updateSelective — null 이 아닌 필드만 UPDATE */
    @Override
    public int updateSelective(PdhProdChgHist entity) {
        if (entity.getProdChgHistId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pdhProdChgHist);
        boolean hasAny = false;

        if (entity.getSiteId()      != null) { update.set(pdhProdChgHist.siteId,      entity.getSiteId());      hasAny = true; }
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
