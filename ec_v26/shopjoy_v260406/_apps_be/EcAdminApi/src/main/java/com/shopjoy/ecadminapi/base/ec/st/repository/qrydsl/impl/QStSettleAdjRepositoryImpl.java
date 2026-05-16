package com.shopjoy.ecadminapi.base.ec.st.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
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
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<StSettleAdjDto.Item> query = baseListQuery().where(where);
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

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<StSettleAdjDto.Item> query = baseListQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<StSettleAdjDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(a.count())
                .from(a)
                .where(where)
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
    private BooleanBuilder buildCondition(StSettleAdjDto.Request c) {
        BooleanBuilder w = new BooleanBuilder();
        if (c == null) return w;

        if (StringUtils.hasText(c.getSiteId()))      w.and(a.siteId.eq(c.getSiteId()));
        if (StringUtils.hasText(c.getSettleAdjId())) w.and(a.settleAdjId.eq(c.getSettleAdjId()));

        if (StringUtils.hasText(c.getDateType())
                && StringUtils.hasText(c.getDateStart())
                && StringUtils.hasText(c.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDateTime start   = LocalDate.parse(c.getDateStart(), fmt).atStartOfDay();
            LocalDateTime endExcl = LocalDate.parse(c.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
            switch (c.getDateType()) {
                case "reg_date":
                    w.and(a.regDate.goe(start)).and(a.regDate.lt(endExcl)); break;
                case "upd_date":
                    w.and(a.updDate.goe(start)).and(a.updDate.lt(endExcl)); break;
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
    private List<OrderSpecifier<?>> buildOrder(StSettleAdjDto.Request c) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = c == null ? null : c.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, a.regDate));
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
        if (entity.getUpdDate()       != null) { update.set(a.updDate,       entity.getUpdDate());       hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(a.settleAdjId.eq(entity.getSettleAdjId())).execute();
        return (int) affected;
    }
}
