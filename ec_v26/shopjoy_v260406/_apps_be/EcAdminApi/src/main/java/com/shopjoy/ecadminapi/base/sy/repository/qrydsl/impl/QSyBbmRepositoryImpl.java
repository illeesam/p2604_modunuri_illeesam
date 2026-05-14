package com.shopjoy.ecadminapi.base.sy.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyBbmDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyBbm;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyBbm;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyBbmRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** SyBbm QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyBbmRepositoryImpl implements QSyBbmRepository {

    private final JPAQueryFactory queryFactory;
    private static final QSyBbm b = QSyBbm.syBbm;
    private static final QSySite ste = QSySite.sySite;
    private static final DateTimeFormatter DF = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    @Override
    public Optional<SyBbmDto.Item> selectById(String bbmId) {
        SyBbmDto.Item dto = baseQuery().where(b.bbmId.eq(bbmId)).fetchOne();
        return Optional.ofNullable(dto);
    }

    @Override
    public List<SyBbmDto.Item> selectList(SyBbmDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<SyBbmDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            query.offset(offset).limit(pageSize);
        }
        return query.fetch();
    }

    @Override
    public SyBbmDto.PageResponse selectPageList(SyBbmDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SyBbmDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        List<SyBbmDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(b.count()).from(b).where(where).fetchOne();

        SyBbmDto.PageResponse res = new SyBbmDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    private JPAQuery<SyBbmDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(SyBbmDto.Item.class,
                        b.bbmId, b.siteId, b.bbmCode, b.bbmNm, b.pathId, b.bbmTypeCd,
                        b.allowComment, b.allowAttach, b.allowLike, b.contentTypeCd,
                        b.scopeTypeCd, b.sortOrd, b.useYn, b.bbmRemark,
                        b.regBy, b.regDate, b.updBy, b.updDate,
                        ste.siteNm.as("siteNm")
                ))
                .from(b)
                .leftJoin(ste).on(ste.siteId.eq(b.siteId));
    }

    private BooleanBuilder buildCondition(SyBbmDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId())) w.and(b.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getBbmId()))  w.and(b.bbmId.eq(s.getBbmId()));
        if (StringUtils.hasText(s.getPathId())) w.and(b.pathId.eq(s.getPathId()));
        if (StringUtils.hasText(s.getTypeCd())) w.and(b.bbmTypeCd.eq(s.getTypeCd()));

        if (StringUtils.hasText(s.getSearchValue())) {
            String types = s.getSearchTypes();
            boolean all = !StringUtils.hasText(types);
            String pattern = "%" + s.getSearchValue() + "%";
            BooleanBuilder or = new BooleanBuilder();
            if (all || types.contains("def_name")) or.or(b.bbmNm.likeIgnoreCase(pattern));
            if (all || types.contains("def_code")) or.or(b.bbmCode.likeIgnoreCase(pattern));
            if (or.getValue() != null) w.and(or);
        }

        if (StringUtils.hasText(s.getDateStart()) && StringUtils.hasText(s.getDateEnd()) && StringUtils.hasText(s.getDateType())) {
            LocalDate ds = LocalDate.parse(s.getDateStart(), DF);
            LocalDate de = LocalDate.parse(s.getDateEnd(), DF);
            switch (s.getDateType()) {
                case "reg_date":
                    w.and(b.regDate.goe(ds.atStartOfDay())).and(b.regDate.lt(de.plusDays(1).atStartOfDay()));
                    break;
                case "upd_date":
                    w.and(b.updDate.goe(ds.atStartOfDay())).and(b.updDate.lt(de.plusDays(1).atStartOfDay()));
                    break;
                default: break;
            }
        }
        return w;
    }

    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(SyBbmDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, b.regDate));
            return orders;
        }
        switch (sort) {
            case "id_asc":   orders.add(new OrderSpecifier(Order.ASC,  b.bbmId));   break;
            case "id_desc":  orders.add(new OrderSpecifier(Order.DESC, b.bbmId));   break;
            case "nm_asc":   orders.add(new OrderSpecifier(Order.ASC,  b.bbmNm));   break;
            case "nm_desc":  orders.add(new OrderSpecifier(Order.DESC, b.bbmNm));   break;
            case "reg_asc":  orders.add(new OrderSpecifier(Order.ASC,  b.regDate)); break;
            case "reg_desc": orders.add(new OrderSpecifier(Order.DESC, b.regDate)); break;
            default:         orders.add(new OrderSpecifier(Order.DESC, b.regDate)); break;
        }
        return orders;
    }

    @Override
    public int updateSelective(SyBbm entity) {
        if (entity.getBbmId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(b);
        boolean hasAny = false;

        if (entity.getSiteId()        != null) { update.set(b.siteId,        entity.getSiteId());        hasAny = true; }
        if (entity.getBbmCode()       != null) { update.set(b.bbmCode,       entity.getBbmCode());       hasAny = true; }
        if (entity.getBbmNm()         != null) { update.set(b.bbmNm,         entity.getBbmNm());         hasAny = true; }
        if (entity.getPathId()        != null) { update.set(b.pathId,        entity.getPathId());        hasAny = true; }
        if (entity.getBbmTypeCd()     != null) { update.set(b.bbmTypeCd,     entity.getBbmTypeCd());     hasAny = true; }
        if (entity.getAllowComment()  != null) { update.set(b.allowComment,  entity.getAllowComment());  hasAny = true; }
        if (entity.getAllowAttach()   != null) { update.set(b.allowAttach,   entity.getAllowAttach());   hasAny = true; }
        if (entity.getAllowLike()     != null) { update.set(b.allowLike,     entity.getAllowLike());     hasAny = true; }
        if (entity.getContentTypeCd() != null) { update.set(b.contentTypeCd, entity.getContentTypeCd()); hasAny = true; }
        if (entity.getScopeTypeCd()   != null) { update.set(b.scopeTypeCd,   entity.getScopeTypeCd());   hasAny = true; }
        if (entity.getSortOrd()       != null) { update.set(b.sortOrd,       entity.getSortOrd());       hasAny = true; }
        if (entity.getUseYn()         != null) { update.set(b.useYn,         entity.getUseYn());         hasAny = true; }
        if (entity.getBbmRemark()     != null) { update.set(b.bbmRemark,     entity.getBbmRemark());     hasAny = true; }
        if (entity.getUpdBy()         != null) { update.set(b.updBy,         entity.getUpdBy());         hasAny = true; }
        if (entity.getUpdDate()       != null) { update.set(b.updDate,       entity.getUpdDate());       hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(b.bbmId.eq(entity.getBbmId())).execute();
        return (int) affected;
    }
}
