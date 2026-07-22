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
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhPayChgHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhPayChgHist;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdhPayChgHist;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdhPayChgHistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** OdhPayChgHist QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QOdhPayChgHistRepositoryImpl implements QOdhPayChgHistRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.od.repository.qrydsl.impl.QOdhPayChgHistRepositoryImpl";
    private static final QOdhPayChgHist odhPayChgHist = QOdhPayChgHist.odhPayChgHist;
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("chgReason", odhPayChgHist.chgReason),
        Map.entry("chgTypeCd", odhPayChgHist.chgTypeCd),
        Map.entry("chgUserId", odhPayChgHist.chgUserId),
        Map.entry("memo", odhPayChgHist.memo),
        Map.entry("orderId", odhPayChgHist.orderId),
        Map.entry("payChgHistId", odhPayChgHist.payChgHistId),
        Map.entry("payId", odhPayChgHist.payId),
        Map.entry("payStatusCdAfter", odhPayChgHist.payStatusCdAfter),
        Map.entry("payStatusCdBefore", odhPayChgHist.payStatusCdBefore),
        Map.entry("pgResponse", odhPayChgHist.pgResponse),
        Map.entry("refundPgTid", odhPayChgHist.refundPgTid),
        Map.entry("siteId", odhPayChgHist.siteId)
    );

    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * PAY_STATUS  {PENDING:대기, COMPLT:완료, FAILED:실패, CANCELLED:취소, PARTIAL_REFUND:부분환불, REFUNDED:전액환불}
     * PAY_CHG_TYPE  {STATUS:상태변경, METHOD:수단변경, AMOUNT:금액변경}
     */
    private JPAQuery<OdhPayChgHistDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(OdhPayChgHistDto.Item.class,
                        odhPayChgHist.payChgHistId,        // 결제변경이력ID (YYMMDDhhmmss+rand4)
                        odhPayChgHist.siteId,               // 사이트ID
                        odhPayChgHist.payId,                 // 결제ID (od_pay.)
                        odhPayChgHist.orderId,               // 주문ID (od_order.)
                        odhPayChgHist.payStatusCdBefore,     // 변경 전 결제상태 — PAY_STATUS {PENDING:대기, COMPLT:완료, FAILED:실패, CANCELLED:취소, PARTIAL_REFUND:부분환불, REFUNDED:전액환불}
                        odhPayChgHist.payStatusCdAfter,      // 변경 후 결제상태 — PAY_STATUS (동일 코드그룹)
                        odhPayChgHist.chgTypeCd,             // 변경유형 — PAY_CHG_TYPE {STATUS:상태변경, METHOD:수단변경, AMOUNT:금액변경}
                        odhPayChgHist.chgReason,             // 변경 사유 (예: PG 승인 완료, 수동 환불 등)
                        odhPayChgHist.pgResponse,            // PG 응답 데이터 (JSON)
                        odhPayChgHist.refundAmt,             // 환불 금액 (환불 시만)
                        odhPayChgHist.refundPgTid,           // 환불 거래ID (환불 시 PG로부터 받은 ID)
                        odhPayChgHist.chgUserId,             // 변경 담당자 (sy_user.user_id, mb_member.member_id)
                        odhPayChgHist.chgDate,               // 변경 일시
                        odhPayChgHist.memo,                  // 메모
                        odhPayChgHist.regBy, odhPayChgHist.regDate, odhPayChgHist.updBy, odhPayChgHist.updDate))
                .from(odhPayChgHist);
    }

    /* 결제 변경 이력 키조회 */
    @Override
    public Optional<OdhPayChgHistDto.Item> selectById(String id) {
        OdhPayChgHistDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(odhPayChgHist.payChgHistId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 결제 변경 이력 목록조회 */
    @Override
    public List<OdhPayChgHistDto.Item> selectList(OdhPayChgHistDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdhPayChgHistDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strEq(odhPayChgHist.siteId, search.getSiteId()),
                    QdslUtil.strEq(odhPayChgHist.payChgHistId, search.getPayChgHistId()),
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

    /* 결제 변경 이력 페이지조회 */
    @Override
    public OdhPayChgHistDto.PageResponse selectPageData(OdhPayChgHistDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(odhPayChgHist.siteId, search.getSiteId()),
                QdslUtil.strEq(odhPayChgHist.payChgHistId, search.getPayChgHistId()),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<OdhPayChgHistDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<OdhPayChgHistDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(odhPayChgHist.count())
                .where(wheres)
                .fetchOne();

        OdhPayChgHistDto.PageResponse res = new OdhPayChgHistDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    private BooleanExpression andSearchValueLike(OdhPayChgHistDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
    }


    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(OdhPayChgHistDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, odhPayChgHist.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, odhPayChgHist.payChgHistId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("payChgHistId".equals(field)) {
                    orders.add(new OrderSpecifier(order, odhPayChgHist.payChgHistId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, odhPayChgHist.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, odhPayChgHist.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, odhPayChgHist.payChgHistId));
        }
        return orders;
    }

    /* 결제 변경 이력 수정 */
    @Override
    public int updateSelective(OdhPayChgHist entity) {
        if (entity.getPayChgHistId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(odhPayChgHist);
        boolean hasAny = false;

        if (entity.getSiteId()            != null) { update.set(odhPayChgHist.siteId,            entity.getSiteId());            hasAny = true; }
        if (entity.getPayId()             != null) { update.set(odhPayChgHist.payId,             entity.getPayId());             hasAny = true; }
        if (entity.getOrderId()           != null) { update.set(odhPayChgHist.orderId,           entity.getOrderId());           hasAny = true; }
        if (entity.getPayStatusCdBefore() != null) { update.set(odhPayChgHist.payStatusCdBefore, entity.getPayStatusCdBefore()); hasAny = true; }
        if (entity.getPayStatusCdAfter()  != null) { update.set(odhPayChgHist.payStatusCdAfter,  entity.getPayStatusCdAfter());  hasAny = true; }
        if (entity.getChgTypeCd()         != null) { update.set(odhPayChgHist.chgTypeCd,         entity.getChgTypeCd());         hasAny = true; }
        if (entity.getChgReason()         != null) { update.set(odhPayChgHist.chgReason,         entity.getChgReason());         hasAny = true; }
        if (entity.getPgResponse()        != null) { update.set(odhPayChgHist.pgResponse,        entity.getPgResponse());        hasAny = true; }
        if (entity.getRefundAmt()         != null) { update.set(odhPayChgHist.refundAmt,         entity.getRefundAmt());         hasAny = true; }
        if (entity.getRefundPgTid()       != null) { update.set(odhPayChgHist.refundPgTid,       entity.getRefundPgTid());       hasAny = true; }
        if (entity.getChgUserId()         != null) { update.set(odhPayChgHist.chgUserId,         entity.getChgUserId());         hasAny = true; }
        if (entity.getChgDate()           != null) { update.set(odhPayChgHist.chgDate,           entity.getChgDate());           hasAny = true; }
        if (entity.getMemo()              != null) { update.set(odhPayChgHist.memo,              entity.getMemo());              hasAny = true; }
        if (entity.getUpdBy()             != null) { update.set(odhPayChgHist.updBy,             entity.getUpdBy());             hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(odhPayChgHist.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(odhPayChgHist.payChgHistId.eq(entity.getPayChgHistId())).execute();
        return (int) affected;
    }
}
