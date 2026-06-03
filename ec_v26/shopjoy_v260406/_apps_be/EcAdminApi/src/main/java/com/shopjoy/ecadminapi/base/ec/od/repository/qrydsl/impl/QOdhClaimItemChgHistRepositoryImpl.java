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
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhClaimItemChgHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhClaimItemChgHist;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdhClaimItemChgHist;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdhClaimItemChgHistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
/** OdhClaimItemChgHist QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QOdhClaimItemChgHistRepositoryImpl implements QOdhClaimItemChgHistRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.od.repository.qrydsl.impl.QOdhClaimItemChgHistRepositoryImpl";
    private static final QOdhClaimItemChgHist odhClaimItemChgHist = QOdhClaimItemChgHist.odhClaimItemChgHist;

    /* 클레임 아이템 변경 이력 baseSelColumnQuery */
    private JPAQuery<OdhClaimItemChgHistDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(OdhClaimItemChgHistDto.Item.class,
                        odhClaimItemChgHist.claimItemChgHistId, odhClaimItemChgHist.siteId, odhClaimItemChgHist.claimId, odhClaimItemChgHist.claimItemId,
                        odhClaimItemChgHist.chgTypeCd, odhClaimItemChgHist.chgField, odhClaimItemChgHist.beforeVal, odhClaimItemChgHist.afterVal,
                        odhClaimItemChgHist.chgReason, odhClaimItemChgHist.chgUserId, odhClaimItemChgHist.chgDate,
                        odhClaimItemChgHist.regBy, odhClaimItemChgHist.regDate, odhClaimItemChgHist.updBy, odhClaimItemChgHist.updDate))
                .from(odhClaimItemChgHist);
    }

    /* 클레임 아이템 변경 이력 키조회 */
    @Override
    public Optional<OdhClaimItemChgHistDto.Item> selectById(String id) {
        OdhClaimItemChgHistDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(odhClaimItemChgHist.claimItemChgHistId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 클레임 아이템 변경 이력 목록조회 */
    @Override
    public List<OdhClaimItemChgHistDto.Item> selectList(OdhClaimItemChgHistDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdhClaimItemChgHistDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    baseAndSiteId(search),
                    baseAndClaimItemChgHistId(search),
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

    /* 클레임 아이템 변경 이력 페이지조회 */
    @Override
    public OdhClaimItemChgHistDto.PageResponse selectPageData(OdhClaimItemChgHistDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                baseAndSiteId(search),
                baseAndClaimItemChgHistId(search),
                baseAndSearchValue(search)
        };

        JPAQuery<OdhClaimItemChgHistDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<OdhClaimItemChgHistDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(odhClaimItemChgHist.count())
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .from(odhClaimItemChgHist)
                .where(wheres)
                .fetchOne();

        OdhClaimItemChgHistDto.PageResponse res = new OdhClaimItemChgHistDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 클레임 아이템 변경 이력 buildCondition */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(OdhClaimItemChgHistDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? odhClaimItemChgHist.siteId.eq(search.getSiteId()) : null;
    }

    /* claimItemChgHistId 정확 일치 */
    private BooleanExpression baseAndClaimItemChgHistId(OdhClaimItemChgHistDto.Request search) {
        return search != null && StringUtils.hasText(search.getClaimItemChgHistId())
                ? odhClaimItemChgHist.claimItemChgHistId.eq(search.getClaimItemChgHistId()) : null;
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(OdhClaimItemChgHistDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",afterVal,", odhClaimItemChgHist.afterVal, pattern);
        or = orLike(or, all, types, ",beforeVal,", odhClaimItemChgHist.beforeVal, pattern);
        or = orLike(or, all, types, ",chgField,", odhClaimItemChgHist.chgField, pattern);
        or = orLike(or, all, types, ",chgReason,", odhClaimItemChgHist.chgReason, pattern);
        or = orLike(or, all, types, ",chgTypeCd,", odhClaimItemChgHist.chgTypeCd, pattern);
        or = orLike(or, all, types, ",chgUserId,", odhClaimItemChgHist.chgUserId, pattern);
        or = orLike(or, all, types, ",claimId,", odhClaimItemChgHist.claimId, pattern);
        or = orLike(or, all, types, ",claimItemChgHistId,", odhClaimItemChgHist.claimItemChgHistId, pattern);
        or = orLike(or, all, types, ",claimItemId,", odhClaimItemChgHist.claimItemId, pattern);
        or = orLike(or, all, types, ",siteId,", odhClaimItemChgHist.siteId, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(OdhClaimItemChgHistDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, odhClaimItemChgHist.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, odhClaimItemChgHist.claimItemChgHistId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("claimItemChgHistId".equals(field)) {
                    orders.add(new OrderSpecifier(order, odhClaimItemChgHist.claimItemChgHistId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, odhClaimItemChgHist.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, odhClaimItemChgHist.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, odhClaimItemChgHist.claimItemChgHistId));
        }
        return orders;
    }

    /* 클레임 아이템 변경 이력 수정 */
    @Override
    public int updateSelective(OdhClaimItemChgHist entity) {
        if (entity.getClaimItemChgHistId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(odhClaimItemChgHist);
        boolean hasAny = false;

        if (entity.getSiteId()      != null) { update.set(odhClaimItemChgHist.siteId,      entity.getSiteId());      hasAny = true; }
        if (entity.getClaimId()     != null) { update.set(odhClaimItemChgHist.claimId,     entity.getClaimId());     hasAny = true; }
        if (entity.getClaimItemId() != null) { update.set(odhClaimItemChgHist.claimItemId, entity.getClaimItemId()); hasAny = true; }
        if (entity.getChgTypeCd()   != null) { update.set(odhClaimItemChgHist.chgTypeCd,   entity.getChgTypeCd());   hasAny = true; }
        if (entity.getChgField()    != null) { update.set(odhClaimItemChgHist.chgField,    entity.getChgField());    hasAny = true; }
        if (entity.getBeforeVal()   != null) { update.set(odhClaimItemChgHist.beforeVal,   entity.getBeforeVal());   hasAny = true; }
        if (entity.getAfterVal()    != null) { update.set(odhClaimItemChgHist.afterVal,    entity.getAfterVal());    hasAny = true; }
        if (entity.getChgReason()   != null) { update.set(odhClaimItemChgHist.chgReason,   entity.getChgReason());   hasAny = true; }
        if (entity.getChgUserId()   != null) { update.set(odhClaimItemChgHist.chgUserId,   entity.getChgUserId());   hasAny = true; }
        if (entity.getChgDate()     != null) { update.set(odhClaimItemChgHist.chgDate,     entity.getChgDate());     hasAny = true; }
        if (entity.getUpdBy()       != null) { update.set(odhClaimItemChgHist.updBy,       entity.getUpdBy());       hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(odhClaimItemChgHist.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(odhClaimItemChgHist.claimItemChgHistId.eq(entity.getClaimItemChgHistId())).execute();
        return (int) affected;
    }
}
