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
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhClaimStatusHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhClaimStatusHist;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdhClaimStatusHist;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdhClaimStatusHistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
/** OdhClaimStatusHist QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QOdhClaimStatusHistRepositoryImpl implements QOdhClaimStatusHistRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.od.repository.qrydsl.impl.QOdhClaimStatusHistRepositoryImpl";
    private static final QOdhClaimStatusHist odhClaimStatusHist = QOdhClaimStatusHist.odhClaimStatusHist;

    /* 클레임 상태 이력 baseSelColumnQuery */
    private JPAQuery<OdhClaimStatusHistDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(OdhClaimStatusHistDto.Item.class,
                        odhClaimStatusHist.claimStatusHistId, odhClaimStatusHist.siteId, odhClaimStatusHist.claimId, odhClaimStatusHist.orderId,
                        odhClaimStatusHist.claimStatusCdBefore, odhClaimStatusHist.claimStatusCd, odhClaimStatusHist.statusReason,
                        odhClaimStatusHist.chgUserId, odhClaimStatusHist.chgDate, odhClaimStatusHist.memo,
                        odhClaimStatusHist.regBy, odhClaimStatusHist.regDate, odhClaimStatusHist.updBy, odhClaimStatusHist.updDate))
                .from(odhClaimStatusHist);
    }

    /* 클레임 상태 이력 키조회 */
    @Override
    public Optional<OdhClaimStatusHistDto.Item> selectById(String id) {
        OdhClaimStatusHistDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(odhClaimStatusHist.claimStatusHistId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 클레임 상태 이력 목록조회 */
    @Override
    public List<OdhClaimStatusHistDto.Item> selectList(OdhClaimStatusHistDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdhClaimStatusHistDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    andSiteIdEq(search),
                    andClaimStatusHistIdEq(search),
                    andClaimIdEq(search),
                    andSearchValueLike(search)
                )
                .orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo   = search == null ? null : search.getPageNo();
        Integer pageSize = search == null ? null : search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        return query.fetch();
    }

    /* 클레임 상태 이력 페이지조회 */
    @Override
    public OdhClaimStatusHistDto.PageResponse selectPageData(OdhClaimStatusHistDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                andSiteIdEq(search),
                andClaimStatusHistIdEq(search),
                andClaimIdEq(search),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<OdhClaimStatusHistDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<OdhClaimStatusHistDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(odhClaimStatusHist.count())
                .where(wheres)
                .fetchOne();

        OdhClaimStatusHistDto.PageResponse res = new OdhClaimStatusHistDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 클레임 상태 이력 buildCondition */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteIdEq(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression andSiteIdEq(OdhClaimStatusHistDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? odhClaimStatusHist.siteId.eq(search.getSiteId()) : null;
    }

    /* claimStatusHistId 정확 일치 */
    private BooleanExpression andClaimStatusHistIdEq(OdhClaimStatusHistDto.Request search) {
        return search != null && StringUtils.hasText(search.getClaimStatusHistId())
                ? odhClaimStatusHist.claimStatusHistId.eq(search.getClaimStatusHistId()) : null;
    }

    /* claimId 정확 일치 */
    private BooleanExpression andClaimIdEq(OdhClaimStatusHistDto.Request search) {
        return search != null && StringUtils.hasText(search.getClaimId())
                ? odhClaimStatusHist.claimId.eq(search.getClaimId()) : null;
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression andSearchValueLike(OdhClaimStatusHistDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",chgUserId,", odhClaimStatusHist.chgUserId, pattern);
        or = orLike(or, all, types, ",claimId,", odhClaimStatusHist.claimId, pattern);
        or = orLike(or, all, types, ",claimStatusCd,", odhClaimStatusHist.claimStatusCd, pattern);
        or = orLike(or, all, types, ",claimStatusCdBefore,", odhClaimStatusHist.claimStatusCdBefore, pattern);
        or = orLike(or, all, types, ",claimStatusHistId,", odhClaimStatusHist.claimStatusHistId, pattern);
        or = orLike(or, all, types, ",memo,", odhClaimStatusHist.memo, pattern);
        or = orLike(or, all, types, ",orderId,", odhClaimStatusHist.orderId, pattern);
        or = orLike(or, all, types, ",siteId,", odhClaimStatusHist.siteId, pattern);
        or = orLike(or, all, types, ",statusReason,", odhClaimStatusHist.statusReason, pattern);
        return or;
    }

    /* 단일 필드 LIKE 조건을 누적 OR (해당 type 이 포함됐을 때만) */
    private BooleanExpression orLike(BooleanExpression acc, boolean all, String types,
                                     String token, StringPath path, String pattern) {
        if (!(all || types.contains(token))) return acc;
        BooleanExpression expr = path.likeIgnoreCase(pattern);
        return acc == null ? expr : acc.or(expr);
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(OdhClaimStatusHistDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, odhClaimStatusHist.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, odhClaimStatusHist.claimStatusHistId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("claimStatusHistId".equals(field)) {
                    orders.add(new OrderSpecifier(order, odhClaimStatusHist.claimStatusHistId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, odhClaimStatusHist.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, odhClaimStatusHist.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, odhClaimStatusHist.claimStatusHistId));
        }
        return orders;
    }

    /* 클레임 상태 이력 수정 */
    @Override
    public int updateSelective(OdhClaimStatusHist entity) {
        if (entity.getClaimStatusHistId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(odhClaimStatusHist);
        boolean hasAny = false;

        if (entity.getSiteId()              != null) { update.set(odhClaimStatusHist.siteId,              entity.getSiteId());              hasAny = true; }
        if (entity.getClaimId()             != null) { update.set(odhClaimStatusHist.claimId,             entity.getClaimId());             hasAny = true; }
        if (entity.getOrderId()             != null) { update.set(odhClaimStatusHist.orderId,             entity.getOrderId());             hasAny = true; }
        if (entity.getClaimStatusCdBefore() != null) { update.set(odhClaimStatusHist.claimStatusCdBefore, entity.getClaimStatusCdBefore()); hasAny = true; }
        if (entity.getClaimStatusCd()       != null) { update.set(odhClaimStatusHist.claimStatusCd,       entity.getClaimStatusCd());       hasAny = true; }
        if (entity.getStatusReason()        != null) { update.set(odhClaimStatusHist.statusReason,        entity.getStatusReason());        hasAny = true; }
        if (entity.getChgUserId()           != null) { update.set(odhClaimStatusHist.chgUserId,           entity.getChgUserId());           hasAny = true; }
        if (entity.getChgDate()             != null) { update.set(odhClaimStatusHist.chgDate,             entity.getChgDate());             hasAny = true; }
        if (entity.getMemo()                != null) { update.set(odhClaimStatusHist.memo,                entity.getMemo());                hasAny = true; }
        if (entity.getUpdBy()               != null) { update.set(odhClaimStatusHist.updBy,               entity.getUpdBy());               hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(odhClaimStatusHist.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(odhClaimStatusHist.claimStatusHistId.eq(entity.getClaimStatusHistId())).execute();
        return (int) affected;
    }
}
