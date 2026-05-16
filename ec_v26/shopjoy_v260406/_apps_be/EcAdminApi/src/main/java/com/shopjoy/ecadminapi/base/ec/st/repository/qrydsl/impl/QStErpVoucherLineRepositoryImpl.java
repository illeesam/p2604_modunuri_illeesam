package com.shopjoy.ecadminapi.base.ec.st.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
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
    private static final QStErpVoucherLine l = QStErpVoucherLine.stErpVoucherLine;

    @Override
    public Optional<StErpVoucherLineDto.Item> selectById(String id) {
        StErpVoucherLineDto.Item dto = baseListQuery()
                .where(l.erpVoucherLineId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    @Override
    public List<StErpVoucherLineDto.Item> selectList(StErpVoucherLineDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<StErpVoucherLineDto.Item> query = baseListQuery().where(where);
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

    @Override
    public StErpVoucherLineDto.PageResponse selectPageList(StErpVoucherLineDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<StErpVoucherLineDto.Item> query = baseListQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<StErpVoucherLineDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(l.count())
                .from(l)
                .where(where)
                .fetchOne();

        StErpVoucherLineDto.PageResponse res = new StErpVoucherLineDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

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

    // searchTypes 사용 예 (콤마 경계 매칭):
    //   - 단일 조건  : searchTypes = "def_blog_title"
    //   - 복합 조건  : searchTypes = "def_blog_title,def_blog_author"   (UI 에서 aaa,bbb 형태로 전달)
    //   - 미지정     : searchTypes = null/"" 이면 all=true 로 전체 컬럼 OR 검색
    //
    //   buildCondition 내부에서는
    //     String types = "," + searchTypes + ",";   // 예: ",def_blog_title,def_blog_author,"
    //     types.contains(",def_blog_title,")         // 토큰 경계 정확 매칭 (부분문자열 오매칭 방지)
    //   형태로 비교한다.
    private BooleanBuilder buildCondition(StErpVoucherLineDto.Request c) {
        BooleanBuilder w = new BooleanBuilder();
        if (c == null) return w;

        if (StringUtils.hasText(c.getErpVoucherLineId())) w.and(l.erpVoucherLineId.eq(c.getErpVoucherLineId()));

        // searchValue / searchTypes — def_account_nm
        if (StringUtils.hasText(c.getSearchValue())) {
            String types = "," + (c.getSearchTypes() == null ? "" : c.getSearchTypes().trim()) + ",";
            BooleanBuilder or = new BooleanBuilder();
            if (!StringUtils.hasText(types) || types.contains(",def_account_nm,")) {
                or.or(l.accountNm.containsIgnoreCase(c.getSearchValue()));
            }
            if (or.getValue() != null) w.and(or);
        }

        if (StringUtils.hasText(c.getDateType())
                && StringUtils.hasText(c.getDateStart())
                && StringUtils.hasText(c.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDateTime start   = LocalDate.parse(c.getDateStart(), fmt).atStartOfDay();
            LocalDateTime endExcl = LocalDate.parse(c.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
            switch (c.getDateType()) {
                case "reg_date":
                    w.and(l.regDate.goe(start)).and(l.regDate.lt(endExcl)); break;
                case "upd_date":
                    w.and(l.updDate.goe(start)).and(l.updDate.lt(endExcl)); break;
                default: break;
            }
        }
        return w;
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
        return orders;
    }

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
