package com.shopjoy.ecadminapi.base.ec.dp.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpUiDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpUi;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.QDpUi;
import com.shopjoy.ecadminapi.base.ec.dp.repository.qrydsl.QDpUiRepository;
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

/** DpUi QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QDpUiRepositoryImpl implements QDpUiRepository {

    private final JPAQueryFactory queryFactory;

    @PersistenceContext
    private EntityManager em;

    private static final QDpUi u = QDpUi.dpUi;

    @Override
    public Optional<DpUiDto.Item> selectById(String uiId) {
        DpUiDto.Item dto = baseQuery()
                .where(u.uiId.eq(uiId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    @Override
    public List<DpUiDto.Item> selectList(DpUiDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<DpUiDto.Item> query = baseQuery().where(where);
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
    public DpUiDto.PageResponse selectPageList(DpUiDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<DpUiDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<DpUiDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(u.count()).from(u).where(where).fetchOne();

        DpUiDto.PageResponse res = new DpUiDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    private JPAQuery<DpUiDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(DpUiDto.Item.class,
                        u.uiId, u.siteId, u.uiCd, u.uiNm, u.uiDesc,
                        u.deviceTypeCd, u.pathId, u.sortOrd, u.useYn,
                        u.useStartDate, u.useEndDate,
                        u.regBy, u.regDate, u.updBy, u.updDate
                ))
                .from(u);
    }

    private BooleanBuilder buildCondition(DpUiDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId()))       w.and(u.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getUiId()))         w.and(u.uiId.eq(s.getUiId()));
        if (StringUtils.hasText(s.getDeviceTypeCd())) w.and(u.deviceTypeCd.eq(s.getDeviceTypeCd()));

        if (StringUtils.hasText(s.getPathId())) {
            // 재귀: 선택 path 와 그 하위 path 모두 포함 — 네이티브 CTE 로 descendant 조회
            @SuppressWarnings("unchecked")
            List<String> ids = em.createNativeQuery(
                    "WITH RECURSIVE sub AS ("
                  + "  SELECT path_id FROM shopjoy_2604.sy_path WHERE path_id = ?1 "
                  + "  UNION ALL "
                  + "  SELECT p.path_id FROM shopjoy_2604.sy_path p JOIN sub s ON p.parent_path_id = s.path_id"
                  + ") SELECT path_id FROM sub")
                .setParameter(1, s.getPathId())
                .getResultList();
            if (ids == null || ids.isEmpty()) {
                w.and(u.pathId.eq(s.getPathId()));
            } else {
                w.and(u.pathId.in(ids));
            }
        }

        if (StringUtils.hasText(s.getSearchValue())) {
            String types = s.getSearchTypes();
            boolean all = !StringUtils.hasText(types);
            String pattern = "%" + s.getSearchValue() + "%";
            BooleanBuilder or = new BooleanBuilder();
            if (all || types.contains("def_ui_nm")) or.or(u.uiNm.likeIgnoreCase(pattern));
            if (all || types.contains("def_ui_cd")) or.or(u.uiCd.likeIgnoreCase(pattern));
            if (or.getValue() != null) w.and(or);
        }

        if (StringUtils.hasText(s.getDateType())
                && StringUtils.hasText(s.getDateStart())
                && StringUtils.hasText(s.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDateTime start   = LocalDate.parse(s.getDateStart(), fmt).atStartOfDay();
            LocalDateTime endExcl = LocalDate.parse(s.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
            switch (s.getDateType()) {
                case "reg_date":
                    w.and(u.regDate.goe(start)).and(u.regDate.lt(endExcl));
                    break;
                case "upd_date":
                    w.and(u.updDate.goe(start)).and(u.updDate.lt(endExcl));
                    break;
                default:
                    break;
            }
        }
        return w;
    }

    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(DpUiDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, u.regDate));
            return orders;
        }
        switch (sort) {
            case "id_asc":   orders.add(new OrderSpecifier(Order.ASC,  u.uiId));    break;
            case "id_desc":  orders.add(new OrderSpecifier(Order.DESC, u.uiId));    break;
            case "nm_asc":   orders.add(new OrderSpecifier(Order.ASC,  u.uiNm));    break;
            case "nm_desc":  orders.add(new OrderSpecifier(Order.DESC, u.uiNm));    break;
            case "reg_asc":  orders.add(new OrderSpecifier(Order.ASC,  u.regDate)); break;
            case "reg_desc": orders.add(new OrderSpecifier(Order.DESC, u.regDate)); break;
            default:         orders.add(new OrderSpecifier(Order.DESC, u.regDate)); break;
        }
        return orders;
    }

    @Override
    public int updateSelective(DpUi entity) {
        if (entity.getUiId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(u);
        boolean hasAny = false;

        if (entity.getSiteId()        != null) { update.set(u.siteId,        entity.getSiteId());        hasAny = true; }
        if (entity.getUiCd()          != null) { update.set(u.uiCd,          entity.getUiCd());          hasAny = true; }
        if (entity.getUiNm()          != null) { update.set(u.uiNm,          entity.getUiNm());          hasAny = true; }
        if (entity.getUiDesc()        != null) { update.set(u.uiDesc,        entity.getUiDesc());        hasAny = true; }
        if (entity.getDeviceTypeCd()  != null) { update.set(u.deviceTypeCd,  entity.getDeviceTypeCd());  hasAny = true; }
        if (entity.getPathId()        != null) { update.set(u.pathId,        entity.getPathId());        hasAny = true; }
        if (entity.getSortOrd()       != null) { update.set(u.sortOrd,       entity.getSortOrd());       hasAny = true; }
        if (entity.getUseYn()         != null) { update.set(u.useYn,         entity.getUseYn());         hasAny = true; }
        if (entity.getUseStartDate()  != null) { update.set(u.useStartDate,  entity.getUseStartDate());  hasAny = true; }
        if (entity.getUseEndDate()    != null) { update.set(u.useEndDate,    entity.getUseEndDate());    hasAny = true; }
        if (entity.getUpdBy()         != null) { update.set(u.updBy,         entity.getUpdBy());         hasAny = true; }
        if (entity.getUpdDate()       != null) { update.set(u.updDate,       entity.getUpdDate());       hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(u.uiId.eq(entity.getUiId())).execute();
        return (int) affected;
    }
}
