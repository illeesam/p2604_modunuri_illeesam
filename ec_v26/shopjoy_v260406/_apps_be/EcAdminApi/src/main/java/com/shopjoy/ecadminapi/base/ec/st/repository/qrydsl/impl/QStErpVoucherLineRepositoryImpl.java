package com.shopjoy.ecadminapi.base.ec.st.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.st.data.dto.StErpVoucherLineDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.QStErpVoucherLine;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StErpVoucherLine;
import com.shopjoy.ecadminapi.base.ec.st.repository.qrydsl.QStErpVoucherLineRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** StErpVoucherLine QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QStErpVoucherLineRepositoryImpl implements QStErpVoucherLineRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.st.repository.qrydsl.impl.QStErpVoucherLineRepositoryImpl";
    private static final QStErpVoucherLine l = QStErpVoucherLine.stErpVoucherLine;

    /* ERP 전표 상세 키조회 */
    @Override
    public Optional<StErpVoucherLineDto.Item> selectById(String id) {
        StErpVoucherLineDto.Item dto = baseListQuery()
                .where(l.erpVoucherLineId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* ERP 전표 상세 목록조회 */
    @Override
    public List<StErpVoucherLineDto.Item> selectList(StErpVoucherLineDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<StErpVoucherLineDto.Item> query = baseListQuery().where(
                andErpVoucherLineId(search),
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

    /* ERP 전표 상세 페이지조회 */
    @Override
    public StErpVoucherLineDto.PageResponse selectPageList(StErpVoucherLineDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<StErpVoucherLineDto.Item> query = baseListQuery().where(
                andErpVoucherLineId(search),
                andDateRange(search),
                andSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<StErpVoucherLineDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(l.count())
                .from(l)
                .where(
                andErpVoucherLineId(search),
                andDateRange(search),
                andSearchValue(search)
        )
                .fetchOne();

        StErpVoucherLineDto.PageResponse res = new StErpVoucherLineDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* ERP 전표 상세 baseListQuery */
    private JPAQuery<StErpVoucherLineDto.Item> baseListQuery() {
        return queryFactory
                .select(Projections.bean(StErpVoucherLineDto.Item.class,
                        l.erpVoucherLineId, l.erpVoucherId, l.lineNo,
                        l.accountCd, l.accountNm, l.costCenterCd, l.profitCenterCd,
                        l.debitAmt, l.creditAmt,
                        l.refTypeCd, l.refId, l.lineMemo,
                        l.regBy, l.regDate
                ))
                .from(l);
    }

    /* searchType 사용 예  searchType = "blogTitle,blogAuthor" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* erpVoucherLineId 정확 일치 */
    private BooleanExpression andErpVoucherLineId(StErpVoucherLineDto.Request search) {
        return search != null && StringUtils.hasText(search.getErpVoucherLineId())
                ? l.erpVoucherLineId.eq(search.getErpVoucherLineId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression andDateRange(StErpVoucherLineDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return l.regDate.goe(start).and(l.regDate.lt(endExcl));
            case "upd_date": return l.updDate.goe(start).and(l.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression andSearchValue(StErpVoucherLineDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",accountCd,", l.accountCd, pattern);
        or = orLike(or, all, types, ",accountNm,", l.accountNm, pattern);
        or = orLike(or, all, types, ",costCenterCd,", l.costCenterCd, pattern);
        or = orLike(or, all, types, ",erpVoucherId,", l.erpVoucherId, pattern);
        or = orLike(or, all, types, ",erpVoucherLineId,", l.erpVoucherLineId, pattern);
        or = orLike(or, all, types, ",lineMemo,", l.lineMemo, pattern);
        or = orLike(or, all, types, ",profitCenterCd,", l.profitCenterCd, pattern);
        or = orLike(or, all, types, ",refId,", l.refId, pattern);
        or = orLike(or, all, types, ",refTypeCd,", l.refTypeCd, pattern);
        or = orLike(or, all, types, ",siteId,", l.siteId, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(StErpVoucherLineDto.Request c) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = c == null ? null : c.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, l.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, l.erpVoucherLineId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("erpVoucherLineId".equals(field)) {
                    orders.add(new OrderSpecifier(order, l.erpVoucherLineId));
                } else if ("accountNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, l.accountNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, l.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, l.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, l.erpVoucherLineId));
        }
        return orders;
    }

    /* ERP 전표 상세 수정 */
    @Override
    public int updateSelective(StErpVoucherLine entity) {
        if (entity.getErpVoucherLineId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(l);
        boolean hasAny = false;

        if (entity.getErpVoucherId()  != null) { update.set(l.erpVoucherId,  entity.getErpVoucherId());  hasAny = true; }
        if (entity.getLineNo()        != null) { update.set(l.lineNo,        entity.getLineNo());        hasAny = true; }
        if (entity.getAccountCd()     != null) { update.set(l.accountCd,     entity.getAccountCd());     hasAny = true; }
        if (entity.getAccountNm()     != null) { update.set(l.accountNm,     entity.getAccountNm());     hasAny = true; }
        if (entity.getCostCenterCd()  != null) { update.set(l.costCenterCd,  entity.getCostCenterCd());  hasAny = true; }
        if (entity.getProfitCenterCd()!= null) { update.set(l.profitCenterCd,entity.getProfitCenterCd());hasAny = true; }
        if (entity.getDebitAmt()      != null) { update.set(l.debitAmt,      entity.getDebitAmt());      hasAny = true; }
        if (entity.getCreditAmt()     != null) { update.set(l.creditAmt,     entity.getCreditAmt());     hasAny = true; }
        if (entity.getRefTypeCd()     != null) { update.set(l.refTypeCd,     entity.getRefTypeCd());     hasAny = true; }
        if (entity.getRefId()         != null) { update.set(l.refId,         entity.getRefId());         hasAny = true; }
        if (entity.getLineMemo()      != null) { update.set(l.lineMemo,      entity.getLineMemo());      hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(l.erpVoucherLineId.eq(entity.getErpVoucherLineId())).execute();
        return (int) affected;
    }
}
