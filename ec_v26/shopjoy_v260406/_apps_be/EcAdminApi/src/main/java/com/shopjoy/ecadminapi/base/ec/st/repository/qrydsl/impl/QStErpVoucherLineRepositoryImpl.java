package com.shopjoy.ecadminapi.base.ec.st.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.DateTimePath;
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

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;

/** StErpVoucherLine QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QStErpVoucherLineRepositoryImpl implements QStErpVoucherLineRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.st.repository.qrydsl.impl.QStErpVoucherLineRepositoryImpl";
    private static final QStErpVoucherLine stErpVoucherLine = QStErpVoucherLine.stErpVoucherLine;
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_FIELDS = Map.of(
        "reg_date", stErpVoucherLine.regDate,
        "upd_date", stErpVoucherLine.updDate
    );
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("accountCd", stErpVoucherLine.accountCd),
        Map.entry("accountNm", stErpVoucherLine.accountNm),
        Map.entry("costCenterCd", stErpVoucherLine.costCenterCd),
        Map.entry("erpVoucherId", stErpVoucherLine.erpVoucherId),
        Map.entry("erpVoucherLineId", stErpVoucherLine.erpVoucherLineId),
        Map.entry("lineMemo", stErpVoucherLine.lineMemo),
        Map.entry("profitCenterCd", stErpVoucherLine.profitCenterCd),
        Map.entry("refId", stErpVoucherLine.refId),
        Map.entry("refTypeCd", stErpVoucherLine.refTypeCd),
        Map.entry("siteId", stErpVoucherLine.siteId)
    );

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

    /* ERP 전표 상세 키조회 */
    @Override
    public Optional<StErpVoucherLineDto.Item> selectById(String id) {
        StErpVoucherLineDto.Item dto = baseListQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(stErpVoucherLine.erpVoucherLineId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* ERP 전표 상세 목록조회 */
    @Override
    public List<StErpVoucherLineDto.Item> selectList(StErpVoucherLineDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<StErpVoucherLineDto.Item> query = baseListQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strEq(stErpVoucherLine.erpVoucherLineId, search.getErpVoucherLineId()),
                    QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
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

    /* ERP 전표 상세 페이지조회 */
    @Override
    public StErpVoucherLineDto.PageResponse selectPageData(StErpVoucherLineDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(stErpVoucherLine.erpVoucherLineId, search.getErpVoucherLineId()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<StErpVoucherLineDto.Item> query = baseListQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<StErpVoucherLineDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(stErpVoucherLine.count())
                .where(wheres)
                .fetchOne();

        StErpVoucherLineDto.PageResponse res = new StErpVoucherLineDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* searchType 사용 예  searchType = "blogTitle,blogAuthor" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

private BooleanExpression andSearchValueLike(StErpVoucherLineDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
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
