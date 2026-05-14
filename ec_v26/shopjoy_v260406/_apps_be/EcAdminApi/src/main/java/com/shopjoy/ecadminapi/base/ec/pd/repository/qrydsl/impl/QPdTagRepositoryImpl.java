package com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdTagDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdTag;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdTag;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdTagRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** PdTag QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPdTagRepositoryImpl implements QPdTagRepository {

    private final JPAQueryFactory queryFactory;
    private static final QPdTag  t   = QPdTag.pdTag;
    private static final QSySite ste = QSySite.sySite;

    @Override
    public Optional<PdTagDto.Item> selectById(String tagId) {
        PdTagDto.Item dto = baseQuery()
                .where(t.tagId.eq(tagId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    @Override
    public List<PdTagDto.Item> selectList(PdTagDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdTagDto.Item> query = baseQuery().where(where);
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
    public PdTagDto.PageResponse selectPageList(PdTagDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdTagDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PdTagDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(t.count()).from(t).where(where).fetchOne();

        PdTagDto.PageResponse res = new PdTagDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    private JPAQuery<PdTagDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(PdTagDto.Item.class,
                        t.tagId, t.siteId, t.tagNm, t.tagDesc,
                        t.useCount, t.sortOrd, t.useYn,
                        t.regBy, t.regDate, t.updBy, t.updDate
                ))
                .from(t)
                .leftJoin(ste).on(ste.siteId.eq(t.siteId));
    }

    private BooleanBuilder buildCondition(PdTagDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId())) w.and(t.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getTagId()))  w.and(t.tagId.eq(s.getTagId()));

        if (StringUtils.hasText(s.getSearchValue())) {
            String types = s.getSearchTypes();
            boolean all = !StringUtils.hasText(types);
            String pattern = "%" + s.getSearchValue() + "%";
            BooleanBuilder or = new BooleanBuilder();
            if (all || types.contains("def_tag_nm")) or.or(t.tagNm.likeIgnoreCase(pattern));
            if (or.getValue() != null) w.and(or);
        }

        if (StringUtils.hasText(s.getDateType())
                && StringUtils.hasText(s.getDateStart())
                && StringUtils.hasText(s.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDateTime start = LocalDate.parse(s.getDateStart(), fmt).atStartOfDay();
            LocalDateTime endExcl = LocalDate.parse(s.getDateEnd(), fmt).plusDays(1).atStartOfDay();
            switch (s.getDateType()) {
                case "reg_date":
                    w.and(t.regDate.goe(start)).and(t.regDate.lt(endExcl));
                    break;
                case "upd_date":
                    w.and(t.updDate.goe(start)).and(t.updDate.lt(endExcl));
                    break;
                default:
                    break;
            }
        }
        return w;
    }

    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(PdTagDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, t.regDate));
            return orders;
        }
        switch (sort) {
            case "id_asc":   orders.add(new OrderSpecifier(Order.ASC,  t.tagId));   break;
            case "id_desc":  orders.add(new OrderSpecifier(Order.DESC, t.tagId));   break;
            case "nm_asc":   orders.add(new OrderSpecifier(Order.ASC,  t.tagNm));   break;
            case "nm_desc":  orders.add(new OrderSpecifier(Order.DESC, t.tagNm));   break;
            case "reg_asc":  orders.add(new OrderSpecifier(Order.ASC,  t.regDate)); break;
            case "reg_desc": orders.add(new OrderSpecifier(Order.DESC, t.regDate)); break;
            default:         orders.add(new OrderSpecifier(Order.DESC, t.regDate)); break;
        }
        return orders;
    }

    @Override
    public int updateSelective(PdTag entity) {
        if (entity.getTagId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(t);
        boolean hasAny = false;

        if (entity.getSiteId()   != null) { update.set(t.siteId,   entity.getSiteId());   hasAny = true; }
        if (entity.getTagNm()    != null) { update.set(t.tagNm,    entity.getTagNm());    hasAny = true; }
        if (entity.getTagDesc()  != null) { update.set(t.tagDesc,  entity.getTagDesc());  hasAny = true; }
        if (entity.getUseCount() != null) { update.set(t.useCount, entity.getUseCount()); hasAny = true; }
        if (entity.getSortOrd()  != null) { update.set(t.sortOrd,  entity.getSortOrd());  hasAny = true; }
        if (entity.getUseYn()    != null) { update.set(t.useYn,    entity.getUseYn());    hasAny = true; }
        if (entity.getUpdBy()    != null) { update.set(t.updBy,    entity.getUpdBy());    hasAny = true; }
        if (entity.getUpdDate()  != null) { update.set(t.updDate,  entity.getUpdDate());  hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(t.tagId.eq(entity.getTagId())).execute();
        return (int) affected;
    }
}
