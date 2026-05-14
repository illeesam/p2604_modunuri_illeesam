package com.shopjoy.ecadminapi.base.ec.dp.repository.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpWidgetLibDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpWidgetLib;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.QDpWidgetLib;
import com.shopjoy.ecadminapi.base.ec.dp.repository.QDpWidgetLibRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@RequiredArgsConstructor
public class QDpWidgetLibRepositoryImpl implements QDpWidgetLibRepository {

    private final JPAQueryFactory queryFactory;

    @PersistenceContext
    private EntityManager em;

    private static final QDpWidgetLib l = QDpWidgetLib.dpWidgetLib;

    @Override
    public Optional<DpWidgetLibDto.Item> selectById(String widgetLibId) {
        return Optional.ofNullable(baseQuery().where(l.widgetLibId.eq(widgetLibId)).fetchOne());
    }

    @Override
    public List<DpWidgetLibDto.Item> selectList(DpWidgetLibDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<DpWidgetLibDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo = search == null ? null : search.getPageNo();
        Integer pageSize = search == null ? null : search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0)
            query.offset((long)(pageNo - 1) * pageSize).limit(pageSize);
        return query.fetch();
    }

    @Override
    public DpWidgetLibDto.PageResponse selectPageList(DpWidgetLibDto.Request search) {
        int pageNo = search != null && search.getPageNo() != null && search.getPageNo() > 0 ? search.getPageNo() : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<DpWidgetLibDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        List<DpWidgetLibDto.Item> content = query.offset((long)(pageNo - 1) * pageSize).limit(pageSize).fetch();
        Long total = queryFactory.select(l.count()).from(l).where(where).fetchOne();
        DpWidgetLibDto.PageResponse res = new DpWidgetLibDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    private JPAQuery<DpWidgetLibDto.Item> baseQuery() {
        return queryFactory.select(Projections.bean(DpWidgetLibDto.Item.class,
                l.widgetLibId, l.siteId, l.widgetCode, l.widgetNm, l.widgetTypeCd,
                l.widgetLibDesc, l.pathId, l.thumbnailUrl, l.widgetContent,
                l.widgetConfigJson, l.isSystem, l.sortOrd, l.useYn,
                l.regBy, l.regDate, l.updBy, l.updDate
        )).from(l);
    }

    private BooleanBuilder buildCondition(DpWidgetLibDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;
        if (StringUtils.hasText(s.getSiteId()))       w.and(l.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getWidgetLibId()))  w.and(l.widgetLibId.eq(s.getWidgetLibId()));
        if (StringUtils.hasText(s.getWidgetTypeCd())) w.and(l.widgetTypeCd.eq(s.getWidgetTypeCd()));
        if (StringUtils.hasText(s.getUseYn()))        w.and(l.useYn.eq(s.getUseYn()));

        if (StringUtils.hasText(s.getPathId())) {
            @SuppressWarnings("unchecked")
            List<String> ids = em.createNativeQuery(
                    "WITH RECURSIVE sub AS ("
                  + "  SELECT path_id FROM shopjoy_2604.sy_path WHERE path_id = ?1 "
                  + "  UNION ALL "
                  + "  SELECT pp.path_id FROM shopjoy_2604.sy_path pp JOIN sub s ON pp.parent_path_id = s.path_id"
                  + ") SELECT path_id FROM sub")
                .setParameter(1, s.getPathId())
                .getResultList();
            if (ids == null || ids.isEmpty()) {
                w.and(l.pathId.eq(s.getPathId()));
            } else {
                w.and(l.pathId.in(ids));
            }
        }

        if (StringUtils.hasText(s.getSearchValue())) {
            String types = s.getSearchTypes();
            boolean all = !StringUtils.hasText(types);
            String pattern = "%" + s.getSearchValue() + "%";
            BooleanBuilder or = new BooleanBuilder();
            if (all || types.contains("def_widget_nm"))   or.or(l.widgetNm.likeIgnoreCase(pattern));
            if (all || types.contains("def_widget_code")) or.or(l.widgetCode.likeIgnoreCase(pattern));
            if (or.getValue() != null) w.and(or);
        }

        if (StringUtils.hasText(s.getDateType())
                && StringUtils.hasText(s.getDateStart())
                && StringUtils.hasText(s.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDateTime start = LocalDate.parse(s.getDateStart(), fmt).atStartOfDay();
            LocalDateTime endExcl = LocalDate.parse(s.getDateEnd(), fmt).plusDays(1).atStartOfDay();
            switch (s.getDateType()) {
                case "reg_date": w.and(l.regDate.goe(start)).and(l.regDate.lt(endExcl)); break;
                case "upd_date": w.and(l.updDate.goe(start)).and(l.updDate.lt(endExcl)); break;
                default: break;
            }
        }
        return w;
    }

    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(DpWidgetLibDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) { orders.add(new OrderSpecifier(Order.DESC, l.regDate)); return orders; }
        switch (sort) {
            case "id_asc":   orders.add(new OrderSpecifier(Order.ASC,  l.widgetLibId)); break;
            case "id_desc":  orders.add(new OrderSpecifier(Order.DESC, l.widgetLibId)); break;
            case "nm_asc":   orders.add(new OrderSpecifier(Order.ASC,  l.widgetNm));    break;
            case "nm_desc":  orders.add(new OrderSpecifier(Order.DESC, l.widgetNm));    break;
            case "reg_asc":  orders.add(new OrderSpecifier(Order.ASC,  l.regDate));     break;
            case "reg_desc": orders.add(new OrderSpecifier(Order.DESC, l.regDate));     break;
            default:         orders.add(new OrderSpecifier(Order.DESC, l.regDate));     break;
        }
        return orders;
    }

    @Override
    public int updateSelective(DpWidgetLib entity) {
        if (entity.getWidgetLibId() == null) return 0;
        JPAUpdateClause update = queryFactory.update(l);
        boolean hasAny = false;
        if (entity.getSiteId()           != null) { update.set(l.siteId,           entity.getSiteId());           hasAny = true; }
        if (entity.getWidgetCode()       != null) { update.set(l.widgetCode,       entity.getWidgetCode());       hasAny = true; }
        if (entity.getWidgetNm()         != null) { update.set(l.widgetNm,         entity.getWidgetNm());         hasAny = true; }
        if (entity.getWidgetTypeCd()     != null) { update.set(l.widgetTypeCd,     entity.getWidgetTypeCd());     hasAny = true; }
        if (entity.getWidgetLibDesc()    != null) { update.set(l.widgetLibDesc,    entity.getWidgetLibDesc());    hasAny = true; }
        if (entity.getPathId()           != null) { update.set(l.pathId,           entity.getPathId());           hasAny = true; }
        if (entity.getThumbnailUrl()     != null) { update.set(l.thumbnailUrl,     entity.getThumbnailUrl());     hasAny = true; }
        if (entity.getWidgetContent()    != null) { update.set(l.widgetContent,    entity.getWidgetContent());    hasAny = true; }
        if (entity.getWidgetConfigJson() != null) { update.set(l.widgetConfigJson, entity.getWidgetConfigJson()); hasAny = true; }
        if (entity.getIsSystem()         != null) { update.set(l.isSystem,         entity.getIsSystem());         hasAny = true; }
        if (entity.getSortOrd()          != null) { update.set(l.sortOrd,          entity.getSortOrd());          hasAny = true; }
        if (entity.getUseYn()            != null) { update.set(l.useYn,            entity.getUseYn());            hasAny = true; }
        if (entity.getUpdBy()            != null) { update.set(l.updBy,            entity.getUpdBy());            hasAny = true; }
        if (entity.getUpdDate()          != null) { update.set(l.updDate,          entity.getUpdDate());          hasAny = true; }
        if (!hasAny) return 0;
        return (int) update.where(l.widgetLibId.eq(entity.getWidgetLibId())).execute();
    }
}
