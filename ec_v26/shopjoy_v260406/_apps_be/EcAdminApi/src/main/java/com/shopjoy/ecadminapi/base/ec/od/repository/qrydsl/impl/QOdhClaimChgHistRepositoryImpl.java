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
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhClaimChgHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhClaimChgHist;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdhClaimChgHist;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdhClaimChgHistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** OdhClaimChgHist QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QOdhClaimChgHistRepositoryImpl implements QOdhClaimChgHistRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.od.repository.qrydsl.impl.QOdhClaimChgHistRepositoryImpl";
    private static final QOdhClaimChgHist odhClaimChgHist = QOdhClaimChgHist.odhClaimChgHist;
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("afterVal", odhClaimChgHist.afterVal),
        Map.entry("beforeVal", odhClaimChgHist.beforeVal),
        Map.entry("chgField", odhClaimChgHist.chgField),
        Map.entry("chgReason", odhClaimChgHist.chgReason),
        Map.entry("chgTypeCd", odhClaimChgHist.chgTypeCd),
        Map.entry("chgUserId", odhClaimChgHist.chgUserId),
        Map.entry("claimChgHistId", odhClaimChgHist.claimChgHistId),
        Map.entry("claimId", odhClaimChgHist.claimId),
        Map.entry("siteId", odhClaimChgHist.siteId)
    );

    /* 클레임 변경 이력 baseSelColumnQuery */
    private JPAQuery<OdhClaimChgHistDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(OdhClaimChgHistDto.Item.class,
                        odhClaimChgHist.claimChgHistId, odhClaimChgHist.siteId, odhClaimChgHist.claimId,
                        odhClaimChgHist.chgTypeCd, odhClaimChgHist.chgField, odhClaimChgHist.beforeVal, odhClaimChgHist.afterVal,
                        odhClaimChgHist.chgReason, odhClaimChgHist.chgUserId, odhClaimChgHist.chgDate,
                        odhClaimChgHist.regBy, odhClaimChgHist.regDate, odhClaimChgHist.updBy, odhClaimChgHist.updDate))
                .from(odhClaimChgHist);
    }

    /* 클레임 변경 이력 키조회 */
    @Override
    public Optional<OdhClaimChgHistDto.Item> selectById(String id) {
        OdhClaimChgHistDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(odhClaimChgHist.claimChgHistId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 클레임 변경 이력 목록조회 */
    @Override
    public List<OdhClaimChgHistDto.Item> selectList(OdhClaimChgHistDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdhClaimChgHistDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strEq(odhClaimChgHist.siteId, search.getSiteId()),
                    QdslUtil.strEq(odhClaimChgHist.claimChgHistId, search.getClaimChgHistId()),
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

    /* 클레임 변경 이력 페이지조회 */
    @Override
    public OdhClaimChgHistDto.PageResponse selectPageData(OdhClaimChgHistDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(odhClaimChgHist.siteId, search.getSiteId()),
                QdslUtil.strEq(odhClaimChgHist.claimChgHistId, search.getClaimChgHistId()),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<OdhClaimChgHistDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<OdhClaimChgHistDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(odhClaimChgHist.count())
                .where(wheres)
                .fetchOne();

        OdhClaimChgHistDto.PageResponse res = new OdhClaimChgHistDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

private BooleanExpression andSearchValueLike(OdhClaimChgHistDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
    }


    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(OdhClaimChgHistDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, odhClaimChgHist.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, odhClaimChgHist.claimChgHistId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("claimChgHistId".equals(field)) {
                    orders.add(new OrderSpecifier(order, odhClaimChgHist.claimChgHistId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, odhClaimChgHist.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, odhClaimChgHist.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, odhClaimChgHist.claimChgHistId));
        }
        return orders;
    }

    /* 클레임 변경 이력 수정 */
    @Override
    public int updateSelective(OdhClaimChgHist entity) {
        if (entity.getClaimChgHistId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(odhClaimChgHist);
        boolean hasAny = false;

        if (entity.getSiteId()     != null) { update.set(odhClaimChgHist.siteId,     entity.getSiteId());     hasAny = true; }
        if (entity.getClaimId()    != null) { update.set(odhClaimChgHist.claimId,    entity.getClaimId());    hasAny = true; }
        if (entity.getChgTypeCd()  != null) { update.set(odhClaimChgHist.chgTypeCd,  entity.getChgTypeCd());  hasAny = true; }
        if (entity.getChgField()   != null) { update.set(odhClaimChgHist.chgField,   entity.getChgField());   hasAny = true; }
        if (entity.getBeforeVal()  != null) { update.set(odhClaimChgHist.beforeVal,  entity.getBeforeVal());  hasAny = true; }
        if (entity.getAfterVal()   != null) { update.set(odhClaimChgHist.afterVal,   entity.getAfterVal());   hasAny = true; }
        if (entity.getChgReason()  != null) { update.set(odhClaimChgHist.chgReason,  entity.getChgReason());  hasAny = true; }
        if (entity.getChgUserId()  != null) { update.set(odhClaimChgHist.chgUserId,  entity.getChgUserId());  hasAny = true; }
        if (entity.getChgDate()    != null) { update.set(odhClaimChgHist.chgDate,    entity.getChgDate());    hasAny = true; }
        if (entity.getUpdBy()      != null) { update.set(odhClaimChgHist.updBy,      entity.getUpdBy());      hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(odhClaimChgHist.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(odhClaimChgHist.claimChgHistId.eq(entity.getClaimChgHistId())).execute();
        return (int) affected;
    }
}
