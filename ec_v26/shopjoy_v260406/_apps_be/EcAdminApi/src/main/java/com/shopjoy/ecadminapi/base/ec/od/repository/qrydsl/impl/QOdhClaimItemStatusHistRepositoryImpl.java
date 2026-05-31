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
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhClaimItemStatusHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhClaimItemStatusHist;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdhClaimItemStatusHist;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdhClaimItemStatusHistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
/** OdhClaimItemStatusHist QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QOdhClaimItemStatusHistRepositoryImpl implements QOdhClaimItemStatusHistRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.od.repository.qrydsl.impl.QOdhClaimItemStatusHistRepositoryImpl";
    private static final QOdhClaimItemStatusHist a = QOdhClaimItemStatusHist.odhClaimItemStatusHist;

    /* 클레임 아이템 상태 이력 baseSelColumnQuery */
    private JPAQuery<OdhClaimItemStatusHistDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(OdhClaimItemStatusHistDto.Item.class,
                        a.claimItemStatusHistId, a.siteId, a.claimItemId, a.claimId, a.orderItemId,
                        a.claimItemStatusCdBefore, a.claimItemStatusCd, a.statusReason,
                        a.chgUserId, a.chgDate, a.memo,
                        a.regBy, a.regDate, a.updBy, a.updDate))
                .from(a);
    }

    /* 클레임 아이템 상태 이력 키조회 */
    @Override
    public Optional<OdhClaimItemStatusHistDto.Item> selectById(String id) {
        OdhClaimItemStatusHistDto.Item dto = baseSelColumnQuery()
                .where(a.claimItemStatusHistId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 클레임 아이템 상태 이력 목록조회 */
    @Override
    public List<OdhClaimItemStatusHistDto.Item> selectList(OdhClaimItemStatusHistDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdhClaimItemStatusHistDto.Item> query = baseSelColumnQuery().where(
                baseAndSiteId(search),
                baseAndClaimItemStatusHistId(search),
                baseAndSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        Integer pageNo   = search == null ? null : search.getPageNo();
        Integer pageSize = search == null ? null : search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            query.offset(offset).limit(pageSize);
        }
        return query.fetch();
    }

    /* 클레임 아이템 상태 이력 페이지조회 */
    @Override
    public OdhClaimItemStatusHistDto.PageResponse selectPageData(OdhClaimItemStatusHistDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdhClaimItemStatusHistDto.Item> query = baseSelColumnQuery().where(
                baseAndSiteId(search),
                baseAndClaimItemStatusHistId(search),
                baseAndSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<OdhClaimItemStatusHistDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(a.count()).from(a).where(
                baseAndSiteId(search),
                baseAndClaimItemStatusHistId(search),
                baseAndSearchValue(search)
        ).fetchOne();

        OdhClaimItemStatusHistDto.PageResponse res = new OdhClaimItemStatusHistDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 클레임 아이템 상태 이력 buildCondition */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(OdhClaimItemStatusHistDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? a.siteId.eq(search.getSiteId()) : null;
    }

    /* claimItemStatusHistId 정확 일치 */
    private BooleanExpression baseAndClaimItemStatusHistId(OdhClaimItemStatusHistDto.Request search) {
        return search != null && StringUtils.hasText(search.getClaimItemStatusHistId())
                ? a.claimItemStatusHistId.eq(search.getClaimItemStatusHistId()) : null;
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(OdhClaimItemStatusHistDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",chgUserId,", a.chgUserId, pattern);
        or = orLike(or, all, types, ",claimId,", a.claimId, pattern);
        or = orLike(or, all, types, ",claimItemId,", a.claimItemId, pattern);
        or = orLike(or, all, types, ",claimItemStatusCd,", a.claimItemStatusCd, pattern);
        or = orLike(or, all, types, ",claimItemStatusCdBefore,", a.claimItemStatusCdBefore, pattern);
        or = orLike(or, all, types, ",claimItemStatusHistId,", a.claimItemStatusHistId, pattern);
        or = orLike(or, all, types, ",memo,", a.memo, pattern);
        or = orLike(or, all, types, ",orderItemId,", a.orderItemId, pattern);
        or = orLike(or, all, types, ",siteId,", a.siteId, pattern);
        or = orLike(or, all, types, ",statusReason,", a.statusReason, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(OdhClaimItemStatusHistDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, a.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, a.claimItemStatusHistId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("claimItemStatusHistId".equals(field)) {
                    orders.add(new OrderSpecifier(order, a.claimItemStatusHistId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, a.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, a.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, a.claimItemStatusHistId));
        }
        return orders;
    }

    /* 클레임 아이템 상태 이력 수정 */
    @Override
    public int updateSelective(OdhClaimItemStatusHist entity) {
        if (entity.getClaimItemStatusHistId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(a);
        boolean hasAny = false;

        if (entity.getSiteId()                  != null) { update.set(a.siteId,                  entity.getSiteId());                  hasAny = true; }
        if (entity.getClaimItemId()             != null) { update.set(a.claimItemId,             entity.getClaimItemId());             hasAny = true; }
        if (entity.getClaimId()                 != null) { update.set(a.claimId,                 entity.getClaimId());                 hasAny = true; }
        if (entity.getOrderItemId()             != null) { update.set(a.orderItemId,             entity.getOrderItemId());             hasAny = true; }
        if (entity.getClaimItemStatusCdBefore() != null) { update.set(a.claimItemStatusCdBefore, entity.getClaimItemStatusCdBefore()); hasAny = true; }
        if (entity.getClaimItemStatusCd()       != null) { update.set(a.claimItemStatusCd,       entity.getClaimItemStatusCd());       hasAny = true; }
        if (entity.getStatusReason()            != null) { update.set(a.statusReason,            entity.getStatusReason());            hasAny = true; }
        if (entity.getChgUserId()               != null) { update.set(a.chgUserId,               entity.getChgUserId());               hasAny = true; }
        if (entity.getChgDate()                 != null) { update.set(a.chgDate,                 entity.getChgDate());                 hasAny = true; }
        if (entity.getMemo()                    != null) { update.set(a.memo,                    entity.getMemo());                    hasAny = true; }
        if (entity.getUpdBy()                   != null) { update.set(a.updBy,                   entity.getUpdBy());                   hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(a.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(a.claimItemStatusHistId.eq(entity.getClaimItemStatusHistId())).execute();
        return (int) affected;
    }
}
