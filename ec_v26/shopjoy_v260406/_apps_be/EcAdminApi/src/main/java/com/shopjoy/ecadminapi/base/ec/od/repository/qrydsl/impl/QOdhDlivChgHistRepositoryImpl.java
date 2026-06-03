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
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhDlivChgHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhDlivChgHist;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdhDlivChgHist;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdhDlivChgHistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
/** OdhDlivChgHist QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QOdhDlivChgHistRepositoryImpl implements QOdhDlivChgHistRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.od.repository.qrydsl.impl.QOdhDlivChgHistRepositoryImpl";
    private static final QOdhDlivChgHist odhDlivChgHist = QOdhDlivChgHist.odhDlivChgHist;

    /* 배송 변경 이력 baseSelColumnQuery */
    private JPAQuery<OdhDlivChgHistDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(OdhDlivChgHistDto.Item.class,
                        odhDlivChgHist.dlivChgHistId, odhDlivChgHist.siteId, odhDlivChgHist.dlivId,
                        odhDlivChgHist.chgTypeCd, odhDlivChgHist.chgField, odhDlivChgHist.beforeVal, odhDlivChgHist.afterVal,
                        odhDlivChgHist.chgReason, odhDlivChgHist.chgUserId, odhDlivChgHist.chgDate,
                        odhDlivChgHist.regBy, odhDlivChgHist.regDate, odhDlivChgHist.updBy, odhDlivChgHist.updDate))
                .from(odhDlivChgHist);
    }

    /* 배송 변경 이력 키조회 */
    @Override
    public Optional<OdhDlivChgHistDto.Item> selectById(String id) {
        OdhDlivChgHistDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(odhDlivChgHist.dlivChgHistId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 배송 변경 이력 목록조회 */
    @Override
    public List<OdhDlivChgHistDto.Item> selectList(OdhDlivChgHistDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdhDlivChgHistDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    baseAndSiteId(search),
                    baseAndDlivChgHistId(search),
                    baseAndSearchValue(search)
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

    /* 배송 변경 이력 페이지조회 */
    @Override
    public OdhDlivChgHistDto.PageResponse selectPageData(OdhDlivChgHistDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                baseAndSiteId(search),
                baseAndDlivChgHistId(search),
                baseAndSearchValue(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<OdhDlivChgHistDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<OdhDlivChgHistDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(odhDlivChgHist.count())
                .where(wheres)
                .fetchOne();

        OdhDlivChgHistDto.PageResponse res = new OdhDlivChgHistDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 배송 변경 이력 buildCondition */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(OdhDlivChgHistDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? odhDlivChgHist.siteId.eq(search.getSiteId()) : null;
    }

    /* dlivChgHistId 정확 일치 */
    private BooleanExpression baseAndDlivChgHistId(OdhDlivChgHistDto.Request search) {
        return search != null && StringUtils.hasText(search.getDlivChgHistId())
                ? odhDlivChgHist.dlivChgHistId.eq(search.getDlivChgHistId()) : null;
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(OdhDlivChgHistDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",afterVal,", odhDlivChgHist.afterVal, pattern);
        or = orLike(or, all, types, ",beforeVal,", odhDlivChgHist.beforeVal, pattern);
        or = orLike(or, all, types, ",chgField,", odhDlivChgHist.chgField, pattern);
        or = orLike(or, all, types, ",chgReason,", odhDlivChgHist.chgReason, pattern);
        or = orLike(or, all, types, ",chgTypeCd,", odhDlivChgHist.chgTypeCd, pattern);
        or = orLike(or, all, types, ",chgUserId,", odhDlivChgHist.chgUserId, pattern);
        or = orLike(or, all, types, ",dlivChgHistId,", odhDlivChgHist.dlivChgHistId, pattern);
        or = orLike(or, all, types, ",dlivId,", odhDlivChgHist.dlivId, pattern);
        or = orLike(or, all, types, ",siteId,", odhDlivChgHist.siteId, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(OdhDlivChgHistDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, odhDlivChgHist.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, odhDlivChgHist.dlivChgHistId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("dlivChgHistId".equals(field)) {
                    orders.add(new OrderSpecifier(order, odhDlivChgHist.dlivChgHistId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, odhDlivChgHist.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, odhDlivChgHist.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, odhDlivChgHist.dlivChgHistId));
        }
        return orders;
    }

    /* 배송 변경 이력 수정 */
    @Override
    public int updateSelective(OdhDlivChgHist entity) {
        if (entity.getDlivChgHistId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(odhDlivChgHist);
        boolean hasAny = false;

        if (entity.getSiteId()     != null) { update.set(odhDlivChgHist.siteId,     entity.getSiteId());     hasAny = true; }
        if (entity.getDlivId()     != null) { update.set(odhDlivChgHist.dlivId,     entity.getDlivId());     hasAny = true; }
        if (entity.getChgTypeCd()  != null) { update.set(odhDlivChgHist.chgTypeCd,  entity.getChgTypeCd());  hasAny = true; }
        if (entity.getChgField()   != null) { update.set(odhDlivChgHist.chgField,   entity.getChgField());   hasAny = true; }
        if (entity.getBeforeVal()  != null) { update.set(odhDlivChgHist.beforeVal,  entity.getBeforeVal());  hasAny = true; }
        if (entity.getAfterVal()   != null) { update.set(odhDlivChgHist.afterVal,   entity.getAfterVal());   hasAny = true; }
        if (entity.getChgReason()  != null) { update.set(odhDlivChgHist.chgReason,  entity.getChgReason());  hasAny = true; }
        if (entity.getChgUserId()  != null) { update.set(odhDlivChgHist.chgUserId,  entity.getChgUserId());  hasAny = true; }
        if (entity.getChgDate()    != null) { update.set(odhDlivChgHist.chgDate,    entity.getChgDate());    hasAny = true; }
        if (entity.getUpdBy()      != null) { update.set(odhDlivChgHist.updBy,      entity.getUpdBy());      hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(odhDlivChgHist.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(odhDlivChgHist.dlivChgHistId.eq(entity.getDlivChgHistId())).execute();
        return (int) affected;
    }
}
