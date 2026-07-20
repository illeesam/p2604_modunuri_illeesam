package com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhOrderItemChgHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhOrderItemChgHist;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdhOrderItemChgHist;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdhOrderItemChgHistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** OdhOrderItemChgHist QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QOdhOrderItemChgHistRepositoryImpl implements QOdhOrderItemChgHistRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.od.repository.qrydsl.impl.QOdhOrderItemChgHistRepositoryImpl";
    private static final QOdhOrderItemChgHist odhOrderItemChgHist = QOdhOrderItemChgHist.odhOrderItemChgHist;
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("afterVal", odhOrderItemChgHist.afterVal),
        Map.entry("beforeVal", odhOrderItemChgHist.beforeVal),
        Map.entry("chgField", odhOrderItemChgHist.chgField),
        Map.entry("chgReason", odhOrderItemChgHist.chgReason),
        Map.entry("chgTypeCd", odhOrderItemChgHist.chgTypeCd),
        Map.entry("chgUserId", odhOrderItemChgHist.chgUserId),
        Map.entry("orderId", odhOrderItemChgHist.orderId),
        Map.entry("orderItemChgHistId", odhOrderItemChgHist.orderItemChgHistId),
        Map.entry("orderItemId", odhOrderItemChgHist.orderItemId),
        Map.entry("siteId", odhOrderItemChgHist.siteId)
    );

    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * CHG_TYPE (od_order_item 변경유형, sy_code 미등록 — Entity 주석 기준 예시)
     *   QTY:수량변경, PRICE:가격변경, OPT:옵션변경, STATUS:상태변경, AMOUNT:금액변경, COUPON:쿠폰변경
     */
    private JPAQuery<OdhOrderItemChgHistDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(OdhOrderItemChgHistDto.Item.class,
                        odhOrderItemChgHist.orderItemChgHistId, // 이력ID (YYMMDDhhmmss+rand4)
                        odhOrderItemChgHist.siteId,             // 사이트ID
                        odhOrderItemChgHist.orderId,            // 주문ID (od_order.)
                        odhOrderItemChgHist.orderItemId,        // 주문품목ID (od_order_item.)
                        odhOrderItemChgHist.chgTypeCd,          // 변경유형코드 — CHG_TYPE {QTY:수량변경, PRICE:가격변경, OPT:옵션변경, STATUS:상태변경, AMOUNT:금액변경, COUPON:쿠폰변경}
                        odhOrderItemChgHist.chgField,           // 변경 필드명
                        odhOrderItemChgHist.beforeVal,          // 변경전값
                        odhOrderItemChgHist.afterVal,           // 변경후값
                        odhOrderItemChgHist.chgReason,          // 변경사유
                        odhOrderItemChgHist.chgUserId,          // 처리자 (sy_user.user_id)
                        odhOrderItemChgHist.chgDate,            // 처리일시
                        odhOrderItemChgHist.regBy, odhOrderItemChgHist.regDate, odhOrderItemChgHist.updBy, odhOrderItemChgHist.updDate))
                .from(odhOrderItemChgHist);
    }

    /* 주문 아이템 변경 이력 키조회 */
    @Override
    public Optional<OdhOrderItemChgHistDto.Item> selectById(String id) {
        OdhOrderItemChgHistDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(odhOrderItemChgHist.orderItemChgHistId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 주문 아이템 변경 이력 목록조회 */
    @Override
    public List<OdhOrderItemChgHistDto.Item> selectList(OdhOrderItemChgHistDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdhOrderItemChgHistDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strEq(odhOrderItemChgHist.siteId, search.getSiteId()),
                    QdslUtil.strEq(odhOrderItemChgHist.orderItemChgHistId, search.getOrderItemChgHistId()),
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

    /* 주문 아이템 변경 이력 페이지조회 */
    @Override
    public OdhOrderItemChgHistDto.PageResponse selectPageData(OdhOrderItemChgHistDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(odhOrderItemChgHist.siteId, search.getSiteId()),
                QdslUtil.strEq(odhOrderItemChgHist.orderItemChgHistId, search.getOrderItemChgHistId()),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<OdhOrderItemChgHistDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<OdhOrderItemChgHistDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(odhOrderItemChgHist.count())
                .where(wheres)
                .fetchOne();

        OdhOrderItemChgHistDto.PageResponse res = new OdhOrderItemChgHistDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

private BooleanExpression andSearchValueLike(OdhOrderItemChgHistDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
    }


    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(OdhOrderItemChgHistDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, odhOrderItemChgHist.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, odhOrderItemChgHist.orderItemChgHistId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("orderItemChgHistId".equals(field)) {
                    orders.add(new OrderSpecifier(order, odhOrderItemChgHist.orderItemChgHistId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, odhOrderItemChgHist.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, odhOrderItemChgHist.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, odhOrderItemChgHist.orderItemChgHistId));
        }
        return orders;
    }

    /* 주문 아이템 변경 이력 수정 */
    @Override
    public int updateSelective(OdhOrderItemChgHist entity) {
        if (entity.getOrderItemChgHistId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(odhOrderItemChgHist);
        boolean hasAny = false;

        if (entity.getSiteId()      != null) { update.set(odhOrderItemChgHist.siteId,      entity.getSiteId());      hasAny = true; }
        if (entity.getOrderId()     != null) { update.set(odhOrderItemChgHist.orderId,     entity.getOrderId());     hasAny = true; }
        if (entity.getOrderItemId() != null) { update.set(odhOrderItemChgHist.orderItemId, entity.getOrderItemId()); hasAny = true; }
        if (entity.getChgTypeCd()   != null) { update.set(odhOrderItemChgHist.chgTypeCd,   entity.getChgTypeCd());   hasAny = true; }
        if (entity.getChgField()    != null) { update.set(odhOrderItemChgHist.chgField,    entity.getChgField());    hasAny = true; }
        if (entity.getBeforeVal()   != null) { update.set(odhOrderItemChgHist.beforeVal,   entity.getBeforeVal());   hasAny = true; }
        if (entity.getAfterVal()    != null) { update.set(odhOrderItemChgHist.afterVal,    entity.getAfterVal());    hasAny = true; }
        if (entity.getChgReason()   != null) { update.set(odhOrderItemChgHist.chgReason,   entity.getChgReason());   hasAny = true; }
        if (entity.getChgUserId()   != null) { update.set(odhOrderItemChgHist.chgUserId,   entity.getChgUserId());   hasAny = true; }
        if (entity.getChgDate()     != null) { update.set(odhOrderItemChgHist.chgDate,     entity.getChgDate());     hasAny = true; }
        if (entity.getUpdBy()       != null) { update.set(odhOrderItemChgHist.updBy,       entity.getUpdBy());       hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(odhOrderItemChgHist.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(odhOrderItemChgHist.orderItemChgHistId.eq(entity.getOrderItemChgHistId())).execute();
        return (int) affected;
    }
}
