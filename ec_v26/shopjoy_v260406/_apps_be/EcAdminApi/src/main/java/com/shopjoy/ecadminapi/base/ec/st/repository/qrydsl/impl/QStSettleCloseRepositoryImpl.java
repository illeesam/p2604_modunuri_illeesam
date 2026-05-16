package com.shopjoy.ecadminapi.base.ec.st.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleCloseDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.QStSettleClose;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleClose;
import com.shopjoy.ecadminapi.base.ec.st.repository.qrydsl.QStSettleCloseRepository;
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

/** StSettleClose QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QStSettleCloseRepositoryImpl implements QStSettleCloseRepository {

    private final JPAQueryFactory queryFactory;
    private static final QStSettleClose c   = QStSettleClose.stSettleClose;
    private static final QSySite        ste = QSySite.sySite;
    private static final QSyCode        cdScs = new QSyCode("cd_scs");

    /* 정산 마감 키조회 */
    @Override
    public Optional<StSettleCloseDto.Item> selectById(String id) {
        StSettleCloseDto.Item dto = baseListQuery()
                .where(c.settleCloseId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 정산 마감 목록조회 */
    @Override
    public List<StSettleCloseDto.Item> selectList(StSettleCloseDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<StSettleCloseDto.Item> query = baseListQuery().where(where);
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

    /* 정산 마감 페이지조회 */
    @Override
    public StSettleCloseDto.PageResponse selectPageList(StSettleCloseDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<StSettleCloseDto.Item> query = baseListQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<StSettleCloseDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(c.count())
                .from(c)
                .where(where)
                .fetchOne();

        StSettleCloseDto.PageResponse res = new StSettleCloseDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 정산 마감 baseListQuery */
    private JPAQuery<StSettleCloseDto.Item> baseListQuery() {
        return queryFactory
                .select(Projections.bean(StSettleCloseDto.Item.class,
                        c.settleCloseId, c.settleId, c.siteId, c.closeStatusCd,
                        c.closeReason, c.finalSettleAmt, c.closeBy, c.closeDate,
                        c.regBy, c.regDate,
                        ste.siteNm.as("siteNm"),
                        cdScs.codeLabel.as("closeStatusCdNm")
                ))
                .from(c)
                .leftJoin(ste).on(ste.siteId.eq(c.siteId))
                .leftJoin(cdScs).on(cdScs.codeGrp.eq("SETTLE_CLOSE_STATUS").and(cdScs.codeValue.eq(c.closeStatusCd)));
    }

    /* 정산 마감 buildCondition */
    private BooleanBuilder buildCondition(StSettleCloseDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId()))        w.and(c.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getSettleCloseId())) w.and(c.settleCloseId.eq(s.getSettleCloseId()));

        if (StringUtils.hasText(s.getDateType())
                && StringUtils.hasText(s.getDateStart())
                && StringUtils.hasText(s.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDateTime start   = LocalDate.parse(s.getDateStart(), fmt).atStartOfDay();
            LocalDateTime endExcl = LocalDate.parse(s.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
            switch (s.getDateType()) {
                case "reg_date":
                    w.and(c.regDate.goe(start)).and(c.regDate.lt(endExcl)); break;
                case "upd_date":
                    w.and(c.updDate.goe(start)).and(c.updDate.lt(endExcl)); break;
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
    private List<OrderSpecifier<?>> buildOrder(StSettleCloseDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, c.regDate));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("settleCloseId".equals(field)) {
                    orders.add(new OrderSpecifier(order, c.settleCloseId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, c.regDate));
                }
            }
        }
        return orders;
    }

    /* 정산 마감 수정 */
    @Override
    public int updateSelective(StSettleClose entity) {
        if (entity.getSettleCloseId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(c);
        boolean hasAny = false;

        if (entity.getSettleId()      != null) { update.set(c.settleId,      entity.getSettleId());      hasAny = true; }
        if (entity.getSiteId()        != null) { update.set(c.siteId,        entity.getSiteId());        hasAny = true; }
        if (entity.getCloseStatusCd() != null) { update.set(c.closeStatusCd, entity.getCloseStatusCd()); hasAny = true; }
        if (entity.getCloseReason()   != null) { update.set(c.closeReason,   entity.getCloseReason());   hasAny = true; }
        if (entity.getFinalSettleAmt()!= null) { update.set(c.finalSettleAmt,entity.getFinalSettleAmt());hasAny = true; }
        if (entity.getCloseBy()       != null) { update.set(c.closeBy,       entity.getCloseBy());       hasAny = true; }
        if (entity.getCloseDate()     != null) { update.set(c.closeDate,     entity.getCloseDate());     hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(c.settleCloseId.eq(entity.getSettleCloseId())).execute();
        return (int) affected;
    }
}
