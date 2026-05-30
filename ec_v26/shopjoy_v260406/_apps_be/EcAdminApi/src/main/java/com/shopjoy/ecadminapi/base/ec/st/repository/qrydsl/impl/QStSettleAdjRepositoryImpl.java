package com.shopjoy.ecadminapi.base.ec.st.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleAdjDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.QStSettleAdj;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleAdj;
import com.shopjoy.ecadminapi.base.ec.st.repository.qrydsl.QStSettleAdjRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
/** StSettleAdj QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QStSettleAdjRepositoryImpl implements QStSettleAdjRepository {

    private final JPAQueryFactory queryFactory;
    private static final QStSettleAdj a    = QStSettleAdj.stSettleAdj;
    private static final QSySite     ste  = QSySite.sySite;
    private static final QSyCode     cdSat = new QSyCode("cd_sat");

    /* 정산 조정 키조회 */
    @Override
    public Optional<StSettleAdjDto.Item> selectById(String id) {
        StSettleAdjDto.Item dto = baseListQuery()
                .where(a.settleAdjId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 정산 조정 목록조회 */
    @Override
    public List<StSettleAdjDto.Item> selectList(StSettleAdjDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<StSettleAdjDto.Item> query = baseListQuery().where(
                andSiteId(search),
                andSettleAdjId(search),
                andDateRange(search),
                andSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            query.offset(offset).limit(pageSize);
        }
        return query.fetch();
    }

    /* 정산 조정 페이지조회 */
    @Override
    public StSettleAdjDto.PageResponse selectPageList(StSettleAdjDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<StSettleAdjDto.Item> query = baseListQuery().where(
                andSiteId(search),
                andSettleAdjId(search),
                andDateRange(search),
                andSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<StSettleAdjDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(a.count())
                .from(a)
                .where(
                andSiteId(search),
                andSettleAdjId(search),
                andDateRange(search),
                andSearchValue(search)
        )
                .fetchOne();

        StSettleAdjDto.PageResponse res = new StSettleAdjDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 정산 조정 baseListQuery */
    private JPAQuery<StSettleAdjDto.Item> baseListQuery() {
        return queryFactory
                .select(Projections.bean(StSettleAdjDto.Item.class,
                        a.settleAdjId, a.settleId, a.siteId,
                        a.adjTypeCd, a.adjAmt, a.adjReason,
                        a.settleAdjMemo, a.aprvStatusCd,
                        a.regBy, a.regDate, a.updBy, a.updDate,
                        ste.siteNm.as("siteNm"),
                        cdSat.codeLabel.as("adjTypeCdNm")
                ))
                .from(a)
                .leftJoin(ste).on(ste.siteId.eq(a.siteId))
                .leftJoin(cdSat).on(cdSat.codeGrp.eq("SETTLE_ADJ_TYPE").and(cdSat.codeValue.eq(a.adjTypeCd)));
    }

    /* 정산 조정 buildCondition */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression andSiteId(StSettleAdjDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? a.siteId.eq(search.getSiteId()) : null;
    }

    /* settleAdjId 정확 일치 */
    private BooleanExpression andSettleAdjId(StSettleAdjDto.Request search) {
        return search != null && StringUtils.hasText(search.getSettleAdjId())
                ? a.settleAdjId.eq(search.getSettleAdjId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression andDateRange(StSettleAdjDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return a.regDate.goe(start).and(a.regDate.lt(endExcl));
            case "upd_date": return a.updDate.goe(start).and(a.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression andSearchValue(StSettleAdjDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",adjReason,", a.adjReason, pattern);
        or = orLike(or, all, types, ",adjTypeCd,", a.adjTypeCd, pattern);
        or = orLike(or, all, types, ",aprvStatusCd,", a.aprvStatusCd, pattern);
        or = orLike(or, all, types, ",settleAdjId,", a.settleAdjId, pattern);
        or = orLike(or, all, types, ",settleAdjMemo,", a.settleAdjMemo, pattern);
        or = orLike(or, all, types, ",settleId,", a.settleId, pattern);
        or = orLike(or, all, types, ",siteId,", a.siteId, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(StSettleAdjDto.Request c) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = c == null ? null : c.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, a.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, a.settleAdjId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("settleAdjId".equals(field)) {
                    orders.add(new OrderSpecifier(order, a.settleAdjId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, a.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, a.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, a.settleAdjId));
        }
        return orders;
    }

    /* 정산 조정 수정 */
    @Override
    public int updateSelective(StSettleAdj entity) {
        if (entity.getSettleAdjId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(a);
        boolean hasAny = false;

        if (entity.getSettleId()      != null) { update.set(a.settleId,      entity.getSettleId());      hasAny = true; }
        if (entity.getSiteId()        != null) { update.set(a.siteId,        entity.getSiteId());        hasAny = true; }
        if (entity.getAdjTypeCd()     != null) { update.set(a.adjTypeCd,     entity.getAdjTypeCd());     hasAny = true; }
        if (entity.getAdjAmt()        != null) { update.set(a.adjAmt,        entity.getAdjAmt());        hasAny = true; }
        if (entity.getAdjReason()     != null) { update.set(a.adjReason,     entity.getAdjReason());     hasAny = true; }
        if (entity.getSettleAdjMemo() != null) { update.set(a.settleAdjMemo, entity.getSettleAdjMemo()); hasAny = true; }
        if (entity.getUpdBy()         != null) { update.set(a.updBy,         entity.getUpdBy());         hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(a.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(a.settleAdjId.eq(entity.getSettleAdjId())).execute();
        return (int) affected;
    }
}
