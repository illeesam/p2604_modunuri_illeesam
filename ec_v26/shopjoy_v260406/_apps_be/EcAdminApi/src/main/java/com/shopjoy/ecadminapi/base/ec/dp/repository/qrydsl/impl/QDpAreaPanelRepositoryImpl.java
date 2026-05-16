package com.shopjoy.ecadminapi.base.ec.dp.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpAreaPanelDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpAreaPanel;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.QDpAreaPanel;
import com.shopjoy.ecadminapi.base.ec.dp.repository.qrydsl.QDpAreaPanelRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;
import org.springframework.util.CollectionUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@RequiredArgsConstructor
public class QDpAreaPanelRepositoryImpl implements QDpAreaPanelRepository {

    private final JPAQueryFactory queryFactory;
    private static final QDpAreaPanel p = QDpAreaPanel.dpAreaPanel;

    /* 전시 영역-패널 매핑 키조회 */
    @Override
    public Optional<DpAreaPanelDto.Item> selectById(String areaPanelId) {
        return Optional.ofNullable(baseQuery().where(p.areaPanelId.eq(areaPanelId)).fetchOne());
    }

    /* 전시 영역-패널 매핑 목록조회 */
    @Override
    public List<DpAreaPanelDto.Item> selectList(DpAreaPanelDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<DpAreaPanelDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo = search == null ? null : search.getPageNo();
        Integer pageSize = search == null ? null : search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0)
            query.offset((long)(pageNo - 1) * pageSize).limit(pageSize);
        return query.fetch();
    }

    /* 전시 영역-패널 매핑 페이지조회 */
    @Override
    public DpAreaPanelDto.PageResponse selectPageList(DpAreaPanelDto.Request search) {
        int pageNo = search != null && search.getPageNo() != null && search.getPageNo() > 0 ? search.getPageNo() : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<DpAreaPanelDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        List<DpAreaPanelDto.Item> content = query.offset((long)(pageNo - 1) * pageSize).limit(pageSize).fetch();
        Long total = queryFactory.select(p.count()).from(p).where(where).fetchOne();
        DpAreaPanelDto.PageResponse res = new DpAreaPanelDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 전시 영역-패널 매핑 baseQuery */
    private JPAQuery<DpAreaPanelDto.Item> baseQuery() {
        return queryFactory.select(Projections.bean(DpAreaPanelDto.Item.class,
                p.areaPanelId, p.areaId, p.panelId, p.panelSortOrd,
                p.visibilityTargets, p.dispYn, p.dispStartDt, p.dispEndDt,
                p.dispEnv, p.useYn,
                p.regBy, p.regDate, p.updBy, p.updDate
        )).from(p);
    }

    /* 전시 영역-패널 매핑 buildCondition */
    private BooleanBuilder buildCondition(DpAreaPanelDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;
        if (!CollectionUtils.isEmpty(s.getAreaIds())) w.and(p.areaId.in(s.getAreaIds()));
        if (StringUtils.hasText(s.getAreaId()))      w.and(p.areaId.eq(s.getAreaId()));
        if (StringUtils.hasText(s.getAreaPanelId())) w.and(p.areaPanelId.eq(s.getAreaPanelId()));
        if (StringUtils.hasText(s.getUseYn()))       w.and(p.useYn.eq(s.getUseYn()));

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

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(DpAreaPanelDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, p.regDate));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("areaPanelId".equals(field)) {
                    orders.add(new OrderSpecifier(order, p.areaPanelId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, p.regDate));
                }
            }
        }
        return orders;
    }

    /* 전시 영역-패널 매핑 수정 */
    @Override
    public int updateSelective(DpAreaPanel entity) {
        if (entity.getAreaPanelId() == null) return 0;
        JPAUpdateClause update = queryFactory.update(p);
        boolean hasAny = false;
        if (entity.getAreaId()            != null) { update.set(p.areaId,            entity.getAreaId());            hasAny = true; }
        if (entity.getPanelId()           != null) { update.set(p.panelId,           entity.getPanelId());           hasAny = true; }
        if (entity.getPanelSortOrd()      != null) { update.set(p.panelSortOrd,      entity.getPanelSortOrd());      hasAny = true; }
        if (entity.getVisibilityTargets() != null) { update.set(p.visibilityTargets, entity.getVisibilityTargets()); hasAny = true; }
        if (entity.getDispYn()            != null) { update.set(p.dispYn,            entity.getDispYn());            hasAny = true; }
        if (entity.getDispStartDt()       != null) { update.set(p.dispStartDt,       entity.getDispStartDt());       hasAny = true; }
        if (entity.getDispEndDt()         != null) { update.set(p.dispEndDt,         entity.getDispEndDt());         hasAny = true; }
        if (entity.getDispEnv()           != null) { update.set(p.dispEnv,           entity.getDispEnv());           hasAny = true; }
        if (entity.getUseYn()             != null) { update.set(p.useYn,             entity.getUseYn());             hasAny = true; }
        if (entity.getUpdBy()             != null) { update.set(p.updBy,             entity.getUpdBy());             hasAny = true; }
        if (entity.getUpdDate()           != null) { update.set(p.updDate,           entity.getUpdDate());           hasAny = true; }
        if (!hasAny) return 0;
        return (int) update.where(p.areaPanelId.eq(entity.getAreaPanelId())).execute();
    }
}
