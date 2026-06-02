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
    private static final QStErpVoucherLine stErpVoucherLine = QStErpVoucherLine.stErpVoucherLine;

    /* ERP 전표 상세 키조회 */
    @Override
    public Optional<StErpVoucherLineDto.Item> selectById(String id) {
        StErpVoucherLineDto.Item dto = baseListQuery()
                .where(stErpVoucherLine.erpVoucherLineId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* ERP 전표 상세 목록조회 */
    @Override
    public List<StErpVoucherLineDto.Item> selectList(StErpVoucherLineDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<StErpVoucherLineDto.Item> query = baseListQuery().where(
                baseAndErpVoucherLineId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
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
    public StErpVoucherLineDto.PageResponse selectPageData(StErpVoucherLineDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<StErpVoucherLineDto.Item> query = baseListQuery().where(
                baseAndErpVoucherLineId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<StErpVoucherLineDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(stErpVoucherLine.count())
                .from(stErpVoucherLine)
                .where(
                baseAndErpVoucherLineId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        )
                .fetchOne();

        StErpVoucherLineDto.PageResponse res = new StErpVoucherLineDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* ERP 전표 상세 baseListQuery */
    private JPAQuery<StErpVoucherLineDto.Item> baseListQuery() {
        return queryFactory
                .select(Projections.bean(StErpVoucherLineDto.Item.class,
                        stErpVoucherLine.erpVoucherLineId, stErpVoucherLine.erpVoucherId, stErpVoucherLine.lineNo,
                        stErpVoucherLine.accountCd, stErpVoucherLine.accountNm, stErpVoucherLine.costCenterCd, stErpVoucherLine.profitCenterCd,
                        stErpVoucherLine.debitAmt, stErpVoucherLine.creditAmt,
                        stErpVoucherLine.refTypeCd, stErpVoucherLine.refId, stErpVoucherLine.lineMemo,
                        stErpVoucherLine.regBy, stErpVoucherLine.regDate
                ))
                .from(stErpVoucherLine);
    }

    /* searchType 사용 예  searchType = "blogTitle,blogAuthor" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* erpVoucherLineId 정확 일치 */
    private BooleanExpression baseAndErpVoucherLineId(StErpVoucherLineDto.Request search) {
        return search != null && StringUtils.hasText(search.getErpVoucherLineId())
                ? stErpVoucherLine.erpVoucherLineId.eq(search.getErpVoucherLineId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression baseAndDateRange(StErpVoucherLineDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return stErpVoucherLine.regDate.goe(start).and(stErpVoucherLine.regDate.lt(endExcl));
            case "upd_date": return stErpVoucherLine.updDate.goe(start).and(stErpVoucherLine.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(StErpVoucherLineDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",accountCd,", stErpVoucherLine.accountCd, pattern);
        or = orLike(or, all, types, ",accountNm,", stErpVoucherLine.accountNm, pattern);
        or = orLike(or, all, types, ",costCenterCd,", stErpVoucherLine.costCenterCd, pattern);
        or = orLike(or, all, types, ",erpVoucherId,", stErpVoucherLine.erpVoucherId, pattern);
        or = orLike(or, all, types, ",erpVoucherLineId,", stErpVoucherLine.erpVoucherLineId, pattern);
        or = orLike(or, all, types, ",lineMemo,", stErpVoucherLine.lineMemo, pattern);
        or = orLike(or, all, types, ",profitCenterCd,", stErpVoucherLine.profitCenterCd, pattern);
        or = orLike(or, all, types, ",refId,", stErpVoucherLine.refId, pattern);
        or = orLike(or, all, types, ",refTypeCd,", stErpVoucherLine.refTypeCd, pattern);
        or = orLike(or, all, types, ",siteId,", stErpVoucherLine.siteId, pattern);
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
            orders.add(new OrderSpecifier(Order.DESC, stErpVoucherLine.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, stErpVoucherLine.erpVoucherLineId));
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
                    orders.add(new OrderSpecifier(order, stErpVoucherLine.erpVoucherLineId));
                } else if ("accountNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, stErpVoucherLine.accountNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, stErpVoucherLine.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, stErpVoucherLine.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, stErpVoucherLine.erpVoucherLineId));
        }
        return orders;
    }

    /* ERP 전표 상세 수정 */
    @Override
    public int updateSelective(StErpVoucherLine entity) {
        if (entity.getErpVoucherLineId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(stErpVoucherLine);
        boolean hasAny = false;

        if (entity.getErpVoucherId()  != null) { update.set(stErpVoucherLine.erpVoucherId,  entity.getErpVoucherId());  hasAny = true; }
        if (entity.getLineNo()        != null) { update.set(stErpVoucherLine.lineNo,        entity.getLineNo());        hasAny = true; }
        if (entity.getAccountCd()     != null) { update.set(stErpVoucherLine.accountCd,     entity.getAccountCd());     hasAny = true; }
        if (entity.getAccountNm()     != null) { update.set(stErpVoucherLine.accountNm,     entity.getAccountNm());     hasAny = true; }
        if (entity.getCostCenterCd()  != null) { update.set(stErpVoucherLine.costCenterCd,  entity.getCostCenterCd());  hasAny = true; }
        if (entity.getProfitCenterCd()!= null) { update.set(stErpVoucherLine.profitCenterCd,entity.getProfitCenterCd());hasAny = true; }
        if (entity.getDebitAmt()      != null) { update.set(stErpVoucherLine.debitAmt,      entity.getDebitAmt());      hasAny = true; }
        if (entity.getCreditAmt()     != null) { update.set(stErpVoucherLine.creditAmt,     entity.getCreditAmt());     hasAny = true; }
        if (entity.getRefTypeCd()     != null) { update.set(stErpVoucherLine.refTypeCd,     entity.getRefTypeCd());     hasAny = true; }
        if (entity.getRefId()         != null) { update.set(stErpVoucherLine.refId,         entity.getRefId());         hasAny = true; }
        if (entity.getLineMemo()      != null) { update.set(stErpVoucherLine.lineMemo,      entity.getLineMemo());      hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(stErpVoucherLine.erpVoucherLineId.eq(entity.getErpVoucherLineId())).execute();
        return (int) affected;
    }
}
