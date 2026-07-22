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
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhOrderStatusHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhOrderStatusHist;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdhOrderStatusHist;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdhOrderStatusHistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** OdhOrderStatusHist QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QOdhOrderStatusHistRepositoryImpl implements QOdhOrderStatusHistRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.od.repository.qrydsl.impl.QOdhOrderStatusHistRepositoryImpl";
    private static final QOdhOrderStatusHist odhOrderStatusHist = QOdhOrderStatusHist.odhOrderStatusHist;
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("chgUserId", odhOrderStatusHist.chgUserId),
        Map.entry("memo", odhOrderStatusHist.memo),
        Map.entry("orderId", odhOrderStatusHist.orderId),
        Map.entry("orderStatusCd", odhOrderStatusHist.orderStatusCd),
        Map.entry("orderStatusCdBefore", odhOrderStatusHist.orderStatusCdBefore),
        Map.entry("orderStatusHistId", odhOrderStatusHist.orderStatusHistId),
        Map.entry("siteId", odhOrderStatusHist.siteId),
        Map.entry("statusReason", odhOrderStatusHist.statusReason)
    );

    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * ORDER_STATUS  {PENDING:입금대기, PAID:결제완료, PREPARING:상품준비중, SHIPPED:배송중, DELIVERED:배송완료, COMPLT:구매확정, CANCELLED:취소}
     */
    private JPAQuery<OdhOrderStatusHistDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(OdhOrderStatusHistDto.Item.class,
                        odhOrderStatusHist.orderStatusHistId,       // 주문상태이력ID (YYMMDDhhmmss+rand4)
                        odhOrderStatusHist.siteId,                  // 사이트ID
                        odhOrderStatusHist.orderId,                 // 주문ID (od_order.order_id)
                        odhOrderStatusHist.orderStatusCdBefore,     // 변경 전 주문상태 — ORDER_STATUS {PENDING:입금대기, PAID:결제완료, PREPARING:상품준비중, SHIPPED:배송중, DELIVERED:배송완료, COMPLT:구매확정, CANCELLED:취소}
                        odhOrderStatusHist.orderStatusCd,           // 변경 후 주문상태 — ORDER_STATUS (동일 코드그룹)
                        odhOrderStatusHist.statusReason,            // 상태 변경 사유
                        odhOrderStatusHist.chgUserId,                // 변경 담당자 (sy_user.user_id, mb_member.member_id)
                        odhOrderStatusHist.chgDate,                  // 변경 일시
                        odhOrderStatusHist.memo,                     // 메모
                        odhOrderStatusHist.regBy, odhOrderStatusHist.regDate, odhOrderStatusHist.updBy, odhOrderStatusHist.updDate))
                .from(odhOrderStatusHist);
    }

    /* 주문 상태 이력 키조회 */
    @Override
    public Optional<OdhOrderStatusHistDto.Item> selectById(String id) {
        OdhOrderStatusHistDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(odhOrderStatusHist.orderStatusHistId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 주문 상태 이력 목록조회 */
    @Override
    public List<OdhOrderStatusHistDto.Item> selectList(OdhOrderStatusHistDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdhOrderStatusHistDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strEq(odhOrderStatusHist.siteId, search.getSiteId()),
                    QdslUtil.strEq(odhOrderStatusHist.orderStatusHistId, search.getOrderStatusHistId()),
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

    /* 주문 상태 이력 페이지조회 */
    @Override
    public OdhOrderStatusHistDto.PageResponse selectPageData(OdhOrderStatusHistDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(odhOrderStatusHist.siteId, search.getSiteId()),
                QdslUtil.strEq(odhOrderStatusHist.orderStatusHistId, search.getOrderStatusHistId()),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<OdhOrderStatusHistDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<OdhOrderStatusHistDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(odhOrderStatusHist.count())
                .where(wheres)
                .fetchOne();

        OdhOrderStatusHistDto.PageResponse res = new OdhOrderStatusHistDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    private BooleanExpression andSearchValueLike(OdhOrderStatusHistDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
    }


    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(OdhOrderStatusHistDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, odhOrderStatusHist.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, odhOrderStatusHist.orderStatusHistId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("orderStatusHistId".equals(field)) {
                    orders.add(new OrderSpecifier(order, odhOrderStatusHist.orderStatusHistId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, odhOrderStatusHist.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, odhOrderStatusHist.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, odhOrderStatusHist.orderStatusHistId));
        }
        return orders;
    }

    /* 주문 상태 이력 수정 */
    @Override
    public int updateSelective(OdhOrderStatusHist entity) {
        if (entity.getOrderStatusHistId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(odhOrderStatusHist);
        boolean hasAny = false;

        if (entity.getSiteId()              != null) { update.set(odhOrderStatusHist.siteId,              entity.getSiteId());              hasAny = true; }
        if (entity.getOrderId()             != null) { update.set(odhOrderStatusHist.orderId,             entity.getOrderId());             hasAny = true; }
        if (entity.getOrderStatusCdBefore() != null) { update.set(odhOrderStatusHist.orderStatusCdBefore, entity.getOrderStatusCdBefore()); hasAny = true; }
        if (entity.getOrderStatusCd()       != null) { update.set(odhOrderStatusHist.orderStatusCd,       entity.getOrderStatusCd());       hasAny = true; }
        if (entity.getStatusReason()        != null) { update.set(odhOrderStatusHist.statusReason,        entity.getStatusReason());        hasAny = true; }
        if (entity.getChgUserId()           != null) { update.set(odhOrderStatusHist.chgUserId,           entity.getChgUserId());           hasAny = true; }
        if (entity.getChgDate()             != null) { update.set(odhOrderStatusHist.chgDate,             entity.getChgDate());             hasAny = true; }
        if (entity.getMemo()                != null) { update.set(odhOrderStatusHist.memo,                entity.getMemo());                hasAny = true; }
        if (entity.getUpdBy()               != null) { update.set(odhOrderStatusHist.updBy,               entity.getUpdBy());               hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(odhOrderStatusHist.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(odhOrderStatusHist.orderStatusHistId.eq(entity.getOrderStatusHistId())).execute();
        return (int) affected;
    }
}
