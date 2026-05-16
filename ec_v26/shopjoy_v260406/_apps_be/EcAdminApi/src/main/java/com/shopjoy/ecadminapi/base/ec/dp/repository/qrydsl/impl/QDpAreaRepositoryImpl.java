package com.shopjoy.ecadminapi.base.ec.dp.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpAreaDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpArea;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.QDpArea;
import com.shopjoy.ecadminapi.base.ec.dp.repository.qrydsl.QDpAreaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@RequiredArgsConstructor
public class QDpAreaRepositoryImpl implements QDpAreaRepository {

    private final JPAQueryFactory queryFactory;
    private static final QDpArea a = QDpArea.dpArea;

    /* 전시 영역 키조회 */
    @Override
    public Optional<DpAreaDto.Item> selectById(String areaId) {
        return Optional.ofNullable(baseQuery().where(a.areaId.eq(areaId)).fetchOne());
    }

    /* 전시 영역 목록조회 */
    @Override
    public List<DpAreaDto.Item> selectList(DpAreaDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<DpAreaDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo = search.getPageNo(), pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0)
            query.offset((long)(pageNo - 1) * pageSize).limit(pageSize);
        return query.fetch();
    }

    /* 전시 영역 페이지조회 */
    @Override
    public DpAreaDto.PageResponse selectPageList(DpAreaDto.Request search) {
        int pageNo = search.getPageNo() != null && search.getPageNo() > 0 ? search.getPageNo() : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<DpAreaDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        List<DpAreaDto.Item> content = query.offset((long)(pageNo - 1) * pageSize).limit(pageSize).fetch();
        Long total = queryFactory.select(a.count()).from(a).where(where).fetchOne();
        DpAreaDto.PageResponse res = new DpAreaDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 전시 영역 baseQuery */
    private JPAQuery<DpAreaDto.Item> baseQuery() {
        return queryFactory.select(Projections.bean(DpAreaDto.Item.class,
                a.areaId, a.uiId, a.siteId, a.areaCd, a.areaNm, a.areaTypeCd, a.areaDesc,
                a.pathId, a.useYn, a.useStartDate, a.useEndDate,
                a.regBy, a.regDate, a.updBy, a.updDate
        )).from(a);
    }

    /* searchType 사용 예  searchType = "blogTitle,blogAuthor" */
    private BooleanBuilder buildCondition(DpAreaDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;
        if (StringUtils.hasText(s.getSiteId()))     w.and(a.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getPathId()))     w.and(a.pathId.eq(s.getPathId()));
        if (StringUtils.hasText(s.getUseYn()))      w.and(a.useYn.eq(s.getUseYn()));
        if (StringUtils.hasText(s.getAreaId()))     w.and(a.areaId.eq(s.getAreaId()));
        if (StringUtils.hasText(s.getUiId()))       w.and(a.uiId.eq(s.getUiId()));
        if (StringUtils.hasText(s.getAreaTypeCd())) w.and(a.areaTypeCd.eq(s.getAreaTypeCd()));

        if (StringUtils.hasText(s.getSearchValue())) {
            String types = "," + (s.getSearchType() == null ? "" : s.getSearchType().trim()) + ",";
            boolean all = !StringUtils.hasText(s.getSearchType());
            String pattern = "%" + s.getSearchValue() + "%";
            BooleanBuilder or = new BooleanBuilder();
            if (all || types.contains(",areaNm,")) or.or(a.areaNm.likeIgnoreCase(pattern));
            if (all || types.contains(",areaCd,")) or.or(a.areaCd.likeIgnoreCase(pattern));
            if (or.getValue() != null) w.and(or);
        }

        if (StringUtils.hasText(s.getDateType()) && StringUtils.hasText(s.getDateStart()) && StringUtils.hasText(s.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDateTime start = LocalDate.parse(s.getDateStart(), fmt).atStartOfDay();
            LocalDateTime endExcl = LocalDate.parse(s.getDateEnd(), fmt).plusDays(1).atStartOfDay();
            switch (s.getDateType()) {
                case "reg_date": w.and(a.regDate.goe(start)).and(a.regDate.lt(endExcl)); break;
                case "upd_date": w.and(a.updDate.goe(start)).and(a.updDate.lt(endExcl)); break;
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
    private List<OrderSpecifier<?>> buildOrder(DpAreaDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, a.regDate));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("areaId".equals(field)) {
                    orders.add(new OrderSpecifier(order, a.areaId));
                } else if ("areaNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, a.areaNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, a.regDate));
                }
            }
        }
        return orders;
    }

    /* 전시 영역 수정 */
    @Override
    public int updateSelective(DpArea entity) {
        if (entity.getAreaId() == null) return 0;
        JPAUpdateClause update = queryFactory.update(a);
        boolean hasAny = false;
        if (entity.getUiId()         != null) { update.set(a.uiId,         entity.getUiId());         hasAny = true; }
        if (entity.getSiteId()       != null) { update.set(a.siteId,       entity.getSiteId());       hasAny = true; }
        if (entity.getAreaCd()       != null) { update.set(a.areaCd,       entity.getAreaCd());       hasAny = true; }
        if (entity.getAreaNm()       != null) { update.set(a.areaNm,       entity.getAreaNm());       hasAny = true; }
        if (entity.getAreaTypeCd()   != null) { update.set(a.areaTypeCd,   entity.getAreaTypeCd());   hasAny = true; }
        if (entity.getAreaDesc()     != null) { update.set(a.areaDesc,     entity.getAreaDesc());     hasAny = true; }
        if (entity.getPathId()       != null) { update.set(a.pathId,       entity.getPathId());       hasAny = true; }
        if (entity.getUseYn()        != null) { update.set(a.useYn,        entity.getUseYn());        hasAny = true; }
        if (entity.getUseStartDate() != null) { update.set(a.useStartDate, entity.getUseStartDate()); hasAny = true; }
        if (entity.getUseEndDate()   != null) { update.set(a.useEndDate,   entity.getUseEndDate());   hasAny = true; }
        if (entity.getUpdBy()        != null) { update.set(a.updBy,        entity.getUpdBy());        hasAny = true; }
        if (entity.getUpdDate()      != null) { update.set(a.updDate,      entity.getUpdDate());      hasAny = true; }
        if (!hasAny) return 0;
        return (int) update.where(a.areaId.eq(entity.getAreaId())).execute();
    }
}
