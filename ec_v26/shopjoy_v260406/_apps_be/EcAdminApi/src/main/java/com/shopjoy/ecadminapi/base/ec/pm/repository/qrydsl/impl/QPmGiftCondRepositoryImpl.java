package com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmGiftCondDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmGiftCond;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmGift;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmGiftCond;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmGiftCondRepository;
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

/** PmGiftCond QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPmGiftCondRepositoryImpl implements QPmGiftCondRepository {

    private final JPAQueryFactory queryFactory;
    private static final QPmGiftCond c    = QPmGiftCond.pmGiftCond;
    private static final QPmGift     gif  = QPmGift.pmGift;
    private static final QSySite     ste  = QSySite.sySite;
    private static final QSyCode     cdGct = new QSyCode("cd_gct");

    private JPAQuery<PmGiftCondDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(PmGiftCondDto.Item.class,
                        c.giftCondId, c.giftId, c.siteId, c.condTypeCd,
                        c.minOrderAmt, c.targetTypeCd, c.targetId,
                        c.regBy, c.regDate
                ))
                .from(c)
                .leftJoin(gif).on(gif.giftId.eq(c.giftId))
                .leftJoin(ste).on(ste.siteId.eq(c.siteId))
                .leftJoin(cdGct).on(cdGct.codeGrp.eq("GIFT_COND_TYPE").and(cdGct.codeValue.eq(c.condTypeCd)));
    }

    @Override
    public Optional<PmGiftCondDto.Item> selectById(String giftCondId) {
        PmGiftCondDto.Item dto = baseQuery()
                .where(c.giftCondId.eq(giftCondId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    @Override
    public List<PmGiftCondDto.Item> selectList(PmGiftCondDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmGiftCondDto.Item> query = baseQuery().where(where);
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

    @Override
    public PmGiftCondDto.PageResponse selectPageList(PmGiftCondDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmGiftCondDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PmGiftCondDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(c.count())
                .from(c)
                .where(where)
                .fetchOne();

        PmGiftCondDto.PageResponse res = new PmGiftCondDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    private BooleanBuilder buildCondition(PmGiftCondDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId()))     w.and(c.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getGiftCondId())) w.and(c.giftCondId.eq(s.getGiftCondId()));

        if (StringUtils.hasText(s.getDateType())
                && StringUtils.hasText(s.getDateStart())
                && StringUtils.hasText(s.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDateTime start   = LocalDate.parse(s.getDateStart(), fmt).atStartOfDay();
            LocalDateTime endExcl = LocalDate.parse(s.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
            switch (s.getDateType()) {
                case "reg_date":
                    w.and(c.regDate.goe(start)).and(c.regDate.lt(endExcl));
                    break;
                case "upd_date":
                    w.and(c.updDate.goe(start)).and(c.updDate.lt(endExcl));
                    break;
                default:
                    break;
            }
        }
        return w;
    }

    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(PmGiftCondDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, c.regDate));
            return orders;
        }
        switch (sort) {
            case "id_asc":   orders.add(new OrderSpecifier(Order.ASC,  c.giftCondId)); break;
            case "id_desc":  orders.add(new OrderSpecifier(Order.DESC, c.giftCondId)); break;
            case "reg_asc":  orders.add(new OrderSpecifier(Order.ASC,  c.regDate));    break;
            case "reg_desc": orders.add(new OrderSpecifier(Order.DESC, c.regDate));    break;
            default:         orders.add(new OrderSpecifier(Order.DESC, c.regDate));    break;
        }
        return orders;
    }

    @Override
    public int updateSelective(PmGiftCond entity) {
        if (entity.getGiftCondId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(c);
        boolean hasAny = false;

        if (entity.getGiftId()       != null) { update.set(c.giftId,       entity.getGiftId());       hasAny = true; }
        if (entity.getSiteId()       != null) { update.set(c.siteId,       entity.getSiteId());       hasAny = true; }
        if (entity.getCondTypeCd()   != null) { update.set(c.condTypeCd,   entity.getCondTypeCd());   hasAny = true; }
        if (entity.getMinOrderAmt()  != null) { update.set(c.minOrderAmt,  entity.getMinOrderAmt());  hasAny = true; }
        if (entity.getTargetTypeCd() != null) { update.set(c.targetTypeCd, entity.getTargetTypeCd()); hasAny = true; }
        if (entity.getTargetId()     != null) { update.set(c.targetId,     entity.getTargetId());     hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(c.giftCondId.eq(entity.getGiftCondId())).execute();
        return (int) affected;
    }
}
