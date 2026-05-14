package com.shopjoy.ecadminapi.base.sy.repository.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyI18nDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyI18n;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyI18n;
import com.shopjoy.ecadminapi.base.sy.repository.QSyI18nRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** SyI18n QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyI18nRepositoryImpl implements QSyI18nRepository {

    private final JPAQueryFactory queryFactory;
    private static final QSyI18n i = QSyI18n.syI18n;
    private static final QSySite ste = QSySite.sySite;
    private static final DateTimeFormatter DF = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    @Override
    public Optional<SyI18nDto.Item> selectById(String i18nId) {
        SyI18nDto.Item dto = baseQuery().where(i.i18nId.eq(i18nId)).fetchOne();
        return Optional.ofNullable(dto);
    }

    @Override
    public List<SyI18nDto.Item> selectList(SyI18nDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<SyI18nDto.Item> query = baseQuery().where(where);
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
    public SyI18nDto.PageResponse selectPageList(SyI18nDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SyI18nDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        List<SyI18nDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(i.count()).from(i).where(where).fetchOne();

        SyI18nDto.PageResponse res = new SyI18nDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    private JPAQuery<SyI18nDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(SyI18nDto.Item.class,
                        i.i18nId, i.siteId, i.i18nKey, i.i18nDesc, i.i18nScopeCd,
                        i.i18nCategory, i.sortOrd, i.useYn,
                        i.regBy, i.regDate, i.updBy, i.updDate,
                        ste.siteNm.as("siteNm")
                ))
                .from(i)
                .leftJoin(ste).on(ste.siteId.eq(i.siteId));
    }

    private BooleanBuilder buildCondition(SyI18nDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId())) w.and(i.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getI18nId())) w.and(i.i18nId.eq(s.getI18nId()));

        if (StringUtils.hasText(s.getDateStart()) && StringUtils.hasText(s.getDateEnd()) && StringUtils.hasText(s.getDateType())) {
            LocalDate ds = LocalDate.parse(s.getDateStart(), DF);
            LocalDate de = LocalDate.parse(s.getDateEnd(), DF);
            switch (s.getDateType()) {
                case "reg_date":
                    w.and(i.regDate.goe(ds.atStartOfDay())).and(i.regDate.lt(de.plusDays(1).atStartOfDay()));
                    break;
                case "upd_date":
                    w.and(i.updDate.goe(ds.atStartOfDay())).and(i.updDate.lt(de.plusDays(1).atStartOfDay()));
                    break;
                default: break;
            }
        }
        return w;
    }

    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(SyI18nDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, i.regDate));
            return orders;
        }
        switch (sort) {
            case "id_asc":   orders.add(new OrderSpecifier(Order.ASC,  i.i18nId));  break;
            case "id_desc":  orders.add(new OrderSpecifier(Order.DESC, i.i18nId));  break;
            case "reg_asc":  orders.add(new OrderSpecifier(Order.ASC,  i.regDate)); break;
            case "reg_desc": orders.add(new OrderSpecifier(Order.DESC, i.regDate)); break;
            default:         orders.add(new OrderSpecifier(Order.DESC, i.regDate)); break;
        }
        return orders;
    }

    @Override
    public int updateSelective(SyI18n entity) {
        if (entity.getI18nId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(i);
        boolean hasAny = false;

        if (entity.getSiteId()       != null) { update.set(i.siteId,       entity.getSiteId());       hasAny = true; }
        if (entity.getI18nKey()      != null) { update.set(i.i18nKey,      entity.getI18nKey());      hasAny = true; }
        if (entity.getI18nDesc()     != null) { update.set(i.i18nDesc,     entity.getI18nDesc());     hasAny = true; }
        if (entity.getI18nScopeCd()  != null) { update.set(i.i18nScopeCd,  entity.getI18nScopeCd());  hasAny = true; }
        if (entity.getI18nCategory() != null) { update.set(i.i18nCategory, entity.getI18nCategory()); hasAny = true; }
        if (entity.getSortOrd()      != null) { update.set(i.sortOrd,      entity.getSortOrd());      hasAny = true; }
        if (entity.getUseYn()        != null) { update.set(i.useYn,        entity.getUseYn());        hasAny = true; }
        if (entity.getUpdBy()        != null) { update.set(i.updBy,        entity.getUpdBy());        hasAny = true; }
        if (entity.getUpdDate()      != null) { update.set(i.updDate,      entity.getUpdDate());      hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(i.i18nId.eq(entity.getI18nId())).execute();
        return (int) affected;
    }
}
