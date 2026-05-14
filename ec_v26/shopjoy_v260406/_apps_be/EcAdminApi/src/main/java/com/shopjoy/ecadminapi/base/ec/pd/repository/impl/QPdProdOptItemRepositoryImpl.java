package com.shopjoy.ecadminapi.base.ec.pd.repository.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.JPAExpressions;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdOptItemDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdOptItem;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProdOpt;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProdOptItem;
import com.shopjoy.ecadminapi.base.ec.pd.repository.QPdProdOptItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** PdProdOptItem QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPdProdOptItemRepositoryImpl implements QPdProdOptItemRepository {

    private final JPAQueryFactory queryFactory;
    private static final QPdProdOptItem i = QPdProdOptItem.pdProdOptItem;
    private static final QPdProdOpt     opt = QPdProdOpt.pdProdOpt;

    @Override
    public Optional<PdProdOptItemDto.Item> selectById(String optItemId) {
        PdProdOptItemDto.Item dto = baseQuery()
                .where(i.optItemId.eq(optItemId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    @Override
    public List<PdProdOptItemDto.Item> selectList(PdProdOptItemDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdProdOptItemDto.Item> query = baseQuery().where(where);
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
    public PdProdOptItemDto.PageResponse selectPageList(PdProdOptItemDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdProdOptItemDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PdProdOptItemDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(i.count()).from(i).where(where).fetchOne();

        PdProdOptItemDto.PageResponse res = new PdProdOptItemDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /** 단건/목록/페이지 공용 base query — DTO 필드만 프로젝션 */
    private JPAQuery<PdProdOptItemDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(PdProdOptItemDto.Item.class,
                        i.optItemId,
                        i.siteId,
                        i.optId,
                        i.optTypeCd,
                        i.optNm,
                        i.optVal,
                        i.optValCodeId,
                        i.parentOptItemId,
                        i.optStyle,
                        i.sortOrd,
                        i.useYn,
                        i.regBy,
                        i.regDate,
                        i.updBy,
                        i.updDate
                ))
                .from(i);
    }

    private BooleanBuilder buildCondition(PdProdOptItemDto.Request req) {
        BooleanBuilder w = new BooleanBuilder();
        if (req == null) return w;

        if (StringUtils.hasText(req.getProdId())) {
            w.and(i.optId.in(JPAExpressions.select(opt.optId).from(opt).where(opt.prodId.eq(req.getProdId()))));
        }
        if (StringUtils.hasText(req.getOptId()))     w.and(i.optId.eq(req.getOptId()));
        if (StringUtils.hasText(req.getSiteId()))    w.and(i.siteId.eq(req.getSiteId()));
        if (StringUtils.hasText(req.getOptItemId())) w.and(i.optItemId.eq(req.getOptItemId()));

        if (StringUtils.hasText(req.getSearchValue())) {
            String types = req.getSearchTypes();
            boolean all = !StringUtils.hasText(types);
            String pattern = "%" + req.getSearchValue() + "%";
            BooleanBuilder or = new BooleanBuilder();
            if (all || types.contains("def_opt_nm")) or.or(i.optNm.likeIgnoreCase(pattern));
            if (or.getValue() != null) w.and(or);
        }

        if (StringUtils.hasText(req.getDateType())
                && StringUtils.hasText(req.getDateStart())
                && StringUtils.hasText(req.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDateTime start = LocalDate.parse(req.getDateStart(), fmt).atStartOfDay();
            LocalDateTime endExcl = LocalDate.parse(req.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
            switch (req.getDateType()) {
                case "reg_date":
                    w.and(i.regDate.goe(start)).and(i.regDate.lt(endExcl));
                    break;
                case "upd_date":
                    w.and(i.updDate.goe(start)).and(i.updDate.lt(endExcl));
                    break;
                default:
                    break;
            }
        }
        return w;
    }

    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(PdProdOptItemDto.Request req) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = req == null ? null : req.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, i.regDate));
            return orders;
        }
        switch (sort) {
            case "id_asc":   orders.add(new OrderSpecifier(Order.ASC,  i.optItemId)); break;
            case "id_desc":  orders.add(new OrderSpecifier(Order.DESC, i.optItemId)); break;
            case "nm_asc":   orders.add(new OrderSpecifier(Order.ASC,  i.optNm));     break;
            case "nm_desc":  orders.add(new OrderSpecifier(Order.DESC, i.optNm));     break;
            case "reg_asc":  orders.add(new OrderSpecifier(Order.ASC,  i.regDate));   break;
            case "reg_desc": orders.add(new OrderSpecifier(Order.DESC, i.regDate));   break;
            default:         orders.add(new OrderSpecifier(Order.DESC, i.regDate));   break;
        }
        return orders;
    }

    @Override
    public int updateSelective(PdProdOptItem entity) {
        if (entity.getOptItemId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(i);
        boolean hasAny = false;

        if (entity.getSiteId()          != null) { update.set(i.siteId,          entity.getSiteId());          hasAny = true; }
        if (entity.getOptId()           != null) { update.set(i.optId,           entity.getOptId());           hasAny = true; }
        if (entity.getOptTypeCd()       != null) { update.set(i.optTypeCd,       entity.getOptTypeCd());       hasAny = true; }
        if (entity.getOptNm()           != null) { update.set(i.optNm,           entity.getOptNm());           hasAny = true; }
        if (entity.getOptVal()          != null) { update.set(i.optVal,          entity.getOptVal());          hasAny = true; }
        if (entity.getOptValCodeId()    != null) { update.set(i.optValCodeId,    entity.getOptValCodeId());    hasAny = true; }
        if (entity.getParentOptItemId() != null) { update.set(i.parentOptItemId, entity.getParentOptItemId()); hasAny = true; }
        if (entity.getSortOrd()         != null) { update.set(i.sortOrd,         entity.getSortOrd());         hasAny = true; }
        if (entity.getUseYn()           != null) { update.set(i.useYn,           entity.getUseYn());           hasAny = true; }
        if (entity.getUpdBy()           != null) { update.set(i.updBy,           entity.getUpdBy());           hasAny = true; }
        if (entity.getUpdDate()         != null) { update.set(i.updDate,         entity.getUpdDate());         hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(i.optItemId.eq(entity.getOptItemId())).execute();
        return (int) affected;
    }
}
