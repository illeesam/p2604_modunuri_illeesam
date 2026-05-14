package com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.QMbMember;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdRestockNotiDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdRestockNoti;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProd;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdRestockNoti;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdRestockNotiRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** PdRestockNoti QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPdRestockNotiRepositoryImpl implements QPdRestockNotiRepository {

    private final JPAQueryFactory queryFactory;
    private static final QPdRestockNoti n   = QPdRestockNoti.pdRestockNoti;
    private static final QSySite        ste = QSySite.sySite;
    private static final QPdProd        prd = QPdProd.pdProd;
    private static final QMbMember      mem = QMbMember.mbMember;

    @Override
    public Optional<PdRestockNotiDto.Item> selectById(String restockNotiId) {
        PdRestockNotiDto.Item dto = baseQuery()
                .where(n.restockNotiId.eq(restockNotiId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    @Override
    public List<PdRestockNotiDto.Item> selectList(PdRestockNotiDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdRestockNotiDto.Item> query = baseQuery().where(where);
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
    public PdRestockNotiDto.PageResponse selectPageList(PdRestockNotiDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdRestockNotiDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PdRestockNotiDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(n.count()).from(n).where(where).fetchOne();

        PdRestockNotiDto.PageResponse res = new PdRestockNotiDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    private JPAQuery<PdRestockNotiDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(PdRestockNotiDto.Item.class,
                        n.restockNotiId, n.siteId, n.prodId, n.skuId, n.memberId,
                        n.notiYn, n.notiDate,
                        n.regBy, n.regDate, n.updBy, n.updDate
                ))
                .from(n)
                .leftJoin(ste).on(ste.siteId.eq(n.siteId))
                .leftJoin(prd).on(prd.prodId.eq(n.prodId))
                .leftJoin(mem).on(mem.memberId.eq(n.memberId));
    }

    private BooleanBuilder buildCondition(PdRestockNotiDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId()))        w.and(n.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getRestockNotiId())) w.and(n.restockNotiId.eq(s.getRestockNotiId()));

        if (StringUtils.hasText(s.getDateType())
                && StringUtils.hasText(s.getDateStart())
                && StringUtils.hasText(s.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDateTime start = LocalDate.parse(s.getDateStart(), fmt).atStartOfDay();
            LocalDateTime endExcl = LocalDate.parse(s.getDateEnd(), fmt).plusDays(1).atStartOfDay();
            switch (s.getDateType()) {
                case "reg_date":
                    w.and(n.regDate.goe(start)).and(n.regDate.lt(endExcl));
                    break;
                case "upd_date":
                    w.and(n.updDate.goe(start)).and(n.updDate.lt(endExcl));
                    break;
                default:
                    break;
            }
        }
        return w;
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(PdRestockNotiDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, n.regDate));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("restockNotiId".equals(field)) {
                    orders.add(new OrderSpecifier(order, n.restockNotiId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, n.regDate));
                }
            }
        }
        return orders;
    }

    @Override
    public int updateSelective(PdRestockNoti entity) {
        if (entity.getRestockNotiId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(n);
        boolean hasAny = false;

        if (entity.getSiteId()   != null) { update.set(n.siteId,   entity.getSiteId());   hasAny = true; }
        if (entity.getProdId()   != null) { update.set(n.prodId,   entity.getProdId());   hasAny = true; }
        if (entity.getSkuId()    != null) { update.set(n.skuId,    entity.getSkuId());    hasAny = true; }
        if (entity.getMemberId() != null) { update.set(n.memberId, entity.getMemberId()); hasAny = true; }
        if (entity.getNotiYn()   != null) { update.set(n.notiYn,   entity.getNotiYn());   hasAny = true; }
        if (entity.getNotiDate() != null) { update.set(n.notiDate, entity.getNotiDate()); hasAny = true; }
        if (entity.getUpdBy()    != null) { update.set(n.updBy,    entity.getUpdBy());    hasAny = true; }
        if (entity.getUpdDate()  != null) { update.set(n.updDate,  entity.getUpdDate());  hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(n.restockNotiId.eq(entity.getRestockNotiId())).execute();
        return (int) affected;
    }
}
