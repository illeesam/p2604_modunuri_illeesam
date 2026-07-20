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
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhDlivItemChgHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhDlivItemChgHist;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdhDlivItemChgHist;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdhDlivItemChgHistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** OdhDlivItemChgHist QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QOdhDlivItemChgHistRepositoryImpl implements QOdhDlivItemChgHistRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.od.repository.qrydsl.impl.QOdhDlivItemChgHistRepositoryImpl";
    private static final QOdhDlivItemChgHist odhDlivItemChgHist = QOdhDlivItemChgHist.odhDlivItemChgHist;
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("afterVal", odhDlivItemChgHist.afterVal),
        Map.entry("beforeVal", odhDlivItemChgHist.beforeVal),
        Map.entry("chgField", odhDlivItemChgHist.chgField),
        Map.entry("chgReason", odhDlivItemChgHist.chgReason),
        Map.entry("chgTypeCd", odhDlivItemChgHist.chgTypeCd),
        Map.entry("chgUserId", odhDlivItemChgHist.chgUserId),
        Map.entry("dlivId", odhDlivItemChgHist.dlivId),
        Map.entry("dlivItemChgHistId", odhDlivItemChgHist.dlivItemChgHistId),
        Map.entry("dlivItemId", odhDlivItemChgHist.dlivItemId),
        Map.entry("siteId", odhDlivItemChgHist.siteId)
    );

    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * CHG_TYPE (od_dliv_item 변경유형, sy_code 미등록 — Entity 주석 기준 예시)
     *   QTY:수량변경, STATUS:상태변경, CARRIER:택배사변경, TRACK_NO:송장번호변경, RECV_INFO:수령정보변경
     */
    private JPAQuery<OdhDlivItemChgHistDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(OdhDlivItemChgHistDto.Item.class,
                        odhDlivItemChgHist.dlivItemChgHistId, // 이력ID (YYMMDDhhmmss+rand4)
                        odhDlivItemChgHist.siteId,            // 사이트ID
                        odhDlivItemChgHist.dlivId,            // 배송ID (od_dliv.)
                        odhDlivItemChgHist.dlivItemId,        // 배송품목ID (od_dliv_item.)
                        odhDlivItemChgHist.chgTypeCd,         // 변경유형코드 — CHG_TYPE {QTY:수량변경, STATUS:상태변경, CARRIER:택배사변경, TRACK_NO:송장번호변경, RECV_INFO:수령정보변경}
                        odhDlivItemChgHist.chgField,          // 변경 필드명
                        odhDlivItemChgHist.beforeVal,         // 변경전값
                        odhDlivItemChgHist.afterVal,          // 변경후값
                        odhDlivItemChgHist.chgReason,         // 변경사유
                        odhDlivItemChgHist.chgUserId,         // 처리자 (sy_user.user_id)
                        odhDlivItemChgHist.chgDate,           // 처리일시
                        odhDlivItemChgHist.regBy, odhDlivItemChgHist.regDate, odhDlivItemChgHist.updBy, odhDlivItemChgHist.updDate))
                .from(odhDlivItemChgHist);
    }

    /* 배송 아이템 변경 이력 키조회 */
    @Override
    public Optional<OdhDlivItemChgHistDto.Item> selectById(String id) {
        OdhDlivItemChgHistDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(odhDlivItemChgHist.dlivItemChgHistId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 배송 아이템 변경 이력 목록조회 */
    @Override
    public List<OdhDlivItemChgHistDto.Item> selectList(OdhDlivItemChgHistDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdhDlivItemChgHistDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strEq(odhDlivItemChgHist.siteId, search.getSiteId()),
                    QdslUtil.strEq(odhDlivItemChgHist.dlivItemChgHistId, search.getDlivItemChgHistId()),
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

    /* 배송 아이템 변경 이력 페이지조회 */
    @Override
    public OdhDlivItemChgHistDto.PageResponse selectPageData(OdhDlivItemChgHistDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(odhDlivItemChgHist.siteId, search.getSiteId()),
                QdslUtil.strEq(odhDlivItemChgHist.dlivItemChgHistId, search.getDlivItemChgHistId()),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<OdhDlivItemChgHistDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<OdhDlivItemChgHistDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(odhDlivItemChgHist.count())
                .where(wheres)
                .fetchOne();

        OdhDlivItemChgHistDto.PageResponse res = new OdhDlivItemChgHistDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

private BooleanExpression andSearchValueLike(OdhDlivItemChgHistDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
    }


    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(OdhDlivItemChgHistDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, odhDlivItemChgHist.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, odhDlivItemChgHist.dlivItemChgHistId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("dlivItemChgHistId".equals(field)) {
                    orders.add(new OrderSpecifier(order, odhDlivItemChgHist.dlivItemChgHistId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, odhDlivItemChgHist.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, odhDlivItemChgHist.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, odhDlivItemChgHist.dlivItemChgHistId));
        }
        return orders;
    }

    /* 배송 아이템 변경 이력 수정 */
    @Override
    public int updateSelective(OdhDlivItemChgHist entity) {
        if (entity.getDlivItemChgHistId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(odhDlivItemChgHist);
        boolean hasAny = false;

        if (entity.getSiteId()     != null) { update.set(odhDlivItemChgHist.siteId,     entity.getSiteId());     hasAny = true; }
        if (entity.getDlivId()     != null) { update.set(odhDlivItemChgHist.dlivId,     entity.getDlivId());     hasAny = true; }
        if (entity.getDlivItemId() != null) { update.set(odhDlivItemChgHist.dlivItemId, entity.getDlivItemId()); hasAny = true; }
        if (entity.getChgTypeCd()  != null) { update.set(odhDlivItemChgHist.chgTypeCd,  entity.getChgTypeCd());  hasAny = true; }
        if (entity.getChgField()   != null) { update.set(odhDlivItemChgHist.chgField,   entity.getChgField());   hasAny = true; }
        if (entity.getBeforeVal()  != null) { update.set(odhDlivItemChgHist.beforeVal,  entity.getBeforeVal());  hasAny = true; }
        if (entity.getAfterVal()   != null) { update.set(odhDlivItemChgHist.afterVal,   entity.getAfterVal());   hasAny = true; }
        if (entity.getChgReason()  != null) { update.set(odhDlivItemChgHist.chgReason,  entity.getChgReason());  hasAny = true; }
        if (entity.getChgUserId()  != null) { update.set(odhDlivItemChgHist.chgUserId,  entity.getChgUserId());  hasAny = true; }
        if (entity.getChgDate()    != null) { update.set(odhDlivItemChgHist.chgDate,    entity.getChgDate());    hasAny = true; }
        if (entity.getUpdBy()      != null) { update.set(odhDlivItemChgHist.updBy,      entity.getUpdBy());      hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(odhDlivItemChgHist.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(odhDlivItemChgHist.dlivItemChgHistId.eq(entity.getDlivItemChgHistId())).execute();
        return (int) affected;
    }
}
