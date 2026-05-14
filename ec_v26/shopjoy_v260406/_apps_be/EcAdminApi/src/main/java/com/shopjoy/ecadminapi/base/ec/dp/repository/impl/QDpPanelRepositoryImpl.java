package com.shopjoy.ecadminapi.base.ec.dp.repository.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpPanelDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpPanel;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.QDpPanel;
import com.shopjoy.ecadminapi.base.ec.dp.repository.QDpPanelRepository;
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
public class QDpPanelRepositoryImpl implements QDpPanelRepository {

    private final JPAQueryFactory queryFactory;

    @PersistenceContext
    private EntityManager em;

    private static final QDpPanel p = QDpPanel.dpPanel;

    @Override
    public Optional<DpPanelDto.Item> selectById(String panelId) {
        return Optional.ofNullable(baseQuery().where(p.panelId.eq(panelId)).fetchOne());
    }

    @Override
    public List<DpPanelDto.Item> selectList(DpPanelDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<DpPanelDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo = search == null ? null : search.getPageNo();
        Integer pageSize = search == null ? null : search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0)
            query.offset((long)(pageNo - 1) * pageSize).limit(pageSize);
        return query.fetch();
    }

    @Override
    public DpPanelDto.PageResponse selectPageList(DpPanelDto.Request search) {
        int pageNo = search != null && search.getPageNo() != null && search.getPageNo() > 0 ? search.getPageNo() : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<DpPanelDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        List<DpPanelDto.Item> content = query.offset((long)(pageNo - 1) * pageSize).limit(pageSize).fetch();
        Long total = queryFactory.select(p.count()).from(p).where(where).fetchOne();
        DpPanelDto.PageResponse res = new DpPanelDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    private JPAQuery<DpPanelDto.Item> baseQuery() {
        return queryFactory.select(Projections.bean(DpPanelDto.Item.class,
                p.panelId, p.siteId, p.panelNm, p.panelTypeCd, p.pathId,
                p.visibilityTargets, p.useYn, p.useStartDate, p.useEndDate,
                p.dispPanelStatusCd, p.dispPanelStatusCdBefore, p.contentJson,
                p.regBy, p.regDate, p.updBy, p.updDate
        )).from(p);
    }

    private BooleanBuilder buildCondition(DpPanelDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;
        if (StringUtils.hasText(s.getSiteId()))            w.and(p.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getPanelId()))           w.and(p.panelId.eq(s.getPanelId()));
        if (StringUtils.hasText(s.getDispPanelStatusCd())) w.and(p.dispPanelStatusCd.eq(s.getDispPanelStatusCd()));
        if (StringUtils.hasText(s.getPanelTypeCd()))       w.and(p.panelTypeCd.eq(s.getPanelTypeCd()));
        if (StringUtils.hasText(s.getUseYn()))             w.and(p.useYn.eq(s.getUseYn()));

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
                w.and(p.pathId.eq(s.getPathId()));
            } else {
                w.and(p.pathId.in(ids));
            }
        }

        if (StringUtils.hasText(s.getSearchValue())) {
            String types = s.getSearchTypes();
            boolean all = !StringUtils.hasText(types);
            String pattern = "%" + s.getSearchValue() + "%";
            BooleanBuilder or = new BooleanBuilder();
            if (all || types.contains("def_panel_nm")) or.or(p.panelNm.likeIgnoreCase(pattern));
            if (or.getValue() != null) w.and(or);
        }

        if (StringUtils.hasText(s.getDateType())
                && StringUtils.hasText(s.getDateStart())
                && StringUtils.hasText(s.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDateTime start = LocalDate.parse(s.getDateStart(), fmt).atStartOfDay();
            LocalDateTime endExcl = LocalDate.parse(s.getDateEnd(), fmt).plusDays(1).atStartOfDay();
            switch (s.getDateType()) {
                case "reg_date": w.and(p.regDate.goe(start)).and(p.regDate.lt(endExcl)); break;
                case "upd_date": w.and(p.updDate.goe(start)).and(p.updDate.lt(endExcl)); break;
                default: break;
            }
        }
        return w;
    }

    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(DpPanelDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) { orders.add(new OrderSpecifier(Order.DESC, p.regDate)); return orders; }
        switch (sort) {
            case "id_asc":   orders.add(new OrderSpecifier(Order.ASC,  p.panelId));  break;
            case "id_desc":  orders.add(new OrderSpecifier(Order.DESC, p.panelId));  break;
            case "nm_asc":   orders.add(new OrderSpecifier(Order.ASC,  p.panelNm));  break;
            case "nm_desc":  orders.add(new OrderSpecifier(Order.DESC, p.panelNm));  break;
            case "reg_asc":  orders.add(new OrderSpecifier(Order.ASC,  p.regDate));  break;
            case "reg_desc": orders.add(new OrderSpecifier(Order.DESC, p.regDate));  break;
            default:         orders.add(new OrderSpecifier(Order.DESC, p.regDate));  break;
        }
        return orders;
    }

    @Override
    public int updateSelective(DpPanel entity) {
        if (entity.getPanelId() == null) return 0;
        JPAUpdateClause update = queryFactory.update(p);
        boolean hasAny = false;
        if (entity.getSiteId()                  != null) { update.set(p.siteId,                  entity.getSiteId());                  hasAny = true; }
        if (entity.getPanelNm()                 != null) { update.set(p.panelNm,                 entity.getPanelNm());                 hasAny = true; }
        if (entity.getPanelTypeCd()             != null) { update.set(p.panelTypeCd,             entity.getPanelTypeCd());             hasAny = true; }
        if (entity.getPathId()                  != null) { update.set(p.pathId,                  entity.getPathId());                  hasAny = true; }
        if (entity.getVisibilityTargets()       != null) { update.set(p.visibilityTargets,       entity.getVisibilityTargets());       hasAny = true; }
        if (entity.getUseYn()                   != null) { update.set(p.useYn,                   entity.getUseYn());                   hasAny = true; }
        if (entity.getUseStartDate()            != null) { update.set(p.useStartDate,            entity.getUseStartDate());            hasAny = true; }
        if (entity.getUseEndDate()              != null) { update.set(p.useEndDate,              entity.getUseEndDate());              hasAny = true; }
        if (entity.getDispPanelStatusCd()       != null) { update.set(p.dispPanelStatusCd,       entity.getDispPanelStatusCd());       hasAny = true; }
        if (entity.getDispPanelStatusCdBefore() != null) { update.set(p.dispPanelStatusCdBefore, entity.getDispPanelStatusCdBefore()); hasAny = true; }
        if (entity.getContentJson()             != null) { update.set(p.contentJson,             entity.getContentJson());             hasAny = true; }
        if (entity.getUpdBy()                   != null) { update.set(p.updBy,                   entity.getUpdBy());                   hasAny = true; }
        if (entity.getUpdDate()                 != null) { update.set(p.updDate,                 entity.getUpdDate());                 hasAny = true; }
        if (!hasAny) return 0;
        return (int) update.where(p.panelId.eq(entity.getPanelId())).execute();
    }
}
