package com.shopjoy.ecadminapi.base.sy.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyMenuDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyMenu;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyMenu;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyMenuRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** SyMenu QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyMenuRepositoryImpl implements QSyMenuRepository {

    private final JPAQueryFactory queryFactory;
    private static final QSyMenu m = QSyMenu.syMenu;
    private static final QSySite ste = QSySite.sySite;
    private static final QSyCode cdMt = new QSyCode("cd_mt");

    /* 메뉴 buildBaseQuery */
    private JPAQuery<SyMenuDto.Item> buildBaseQuery() {
        return queryFactory
                .select(Projections.bean(SyMenuDto.Item.class,
                        m.menuId, m.siteId, m.menuCode, m.menuNm, m.parentMenuId,
                        m.menuUrl, m.menuTypeCd, m.iconClass, m.sortOrd, m.useYn,
                        m.menuRemark,
                        m.regBy, m.regDate, m.updBy, m.updDate,
                        ste.siteNm.as("siteNm")
                ))
                .from(m)
                .leftJoin(ste).on(ste.siteId.eq(m.siteId))
                .leftJoin(cdMt).on(cdMt.codeGrp.eq("MENU_TYPE").and(cdMt.codeValue.eq(m.menuTypeCd)));
    }

    /* 메뉴 키조회 */
    @Override
    public Optional<SyMenuDto.Item> selectById(String menuId) {
        SyMenuDto.Item dto = buildBaseQuery()
                .where(m.menuId.eq(menuId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 메뉴 목록조회 */
    @Override
    public List<SyMenuDto.Item> selectList(SyMenuDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<SyMenuDto.Item> query = buildBaseQuery().where(where);
        if (!orderList.isEmpty()) {
            query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        Integer pageNo = search == null ? null : search.getPageNo();
        Integer pageSize = search == null ? null : search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            query.offset(offset).limit(pageSize);
        }
        return query.fetch();
    }

    /* 메뉴 페이지조회 */
    @Override
    public SyMenuDto.PageResponse selectPageList(SyMenuDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SyMenuDto.Item> query = buildBaseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<SyMenuDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(m.count()).from(m).where(where).fetchOne();

        SyMenuDto.PageResponse res = new SyMenuDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* searchType 사용 예  searchType = "def_blog_title,def_blog_author" */
    private BooleanBuilder buildCondition(SyMenuDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId()))       w.and(m.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getMenuId()))       w.and(m.menuId.eq(s.getMenuId()));
        if (StringUtils.hasText(s.getMenuTypeCd()))   w.and(m.menuTypeCd.eq(s.getMenuTypeCd()));
        if (StringUtils.hasText(s.getParentMenuId())) w.and(m.parentMenuId.eq(s.getParentMenuId()));
        if (StringUtils.hasText(s.getUseYn()))        w.and(m.useYn.eq(s.getUseYn()));

        if (StringUtils.hasText(s.getSearchValue())) {
            String types = "," + (s.getSearchType() == null ? "" : s.getSearchType().trim()) + ",";
            boolean all = !StringUtils.hasText(s.getSearchType());
            String pattern = "%" + s.getSearchValue() + "%";
            BooleanBuilder or = new BooleanBuilder();
            if (all || types.contains(",def_nm,"))   or.or(m.menuNm.likeIgnoreCase(pattern));
            if (all || types.contains(",def_code,")) or.or(m.menuCode.likeIgnoreCase(pattern));
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
                    w.and(m.regDate.goe(start)).and(m.regDate.lt(endExcl));
                    break;
                case "upd_date":
                    w.and(m.updDate.goe(start)).and(m.updDate.lt(endExcl));
                    break;
                default:
                    break;
            }
        }
        return w;
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(SyMenuDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, m.regDate));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("menuId".equals(field)) {
                    orders.add(new OrderSpecifier(order, m.menuId));
                } else if ("menuNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, m.menuNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, m.regDate));
                }
            }
        }
        return orders;
    }

    /* 메뉴 수정 */
    @Override
    public int updateSelective(SyMenu entity) {
        if (entity.getMenuId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(m);
        boolean hasAny = false;

        if (entity.getSiteId()       != null) { update.set(m.siteId,       entity.getSiteId());       hasAny = true; }
        if (entity.getMenuCode()     != null) { update.set(m.menuCode,     entity.getMenuCode());     hasAny = true; }
        if (entity.getMenuNm()       != null) { update.set(m.menuNm,       entity.getMenuNm());       hasAny = true; }
        if (entity.getParentMenuId() != null) { update.set(m.parentMenuId, entity.getParentMenuId()); hasAny = true; }
        if (entity.getMenuUrl()      != null) { update.set(m.menuUrl,      entity.getMenuUrl());      hasAny = true; }
        if (entity.getMenuTypeCd()   != null) { update.set(m.menuTypeCd,   entity.getMenuTypeCd());   hasAny = true; }
        if (entity.getIconClass()    != null) { update.set(m.iconClass,    entity.getIconClass());    hasAny = true; }
        if (entity.getSortOrd()      != null) { update.set(m.sortOrd,      entity.getSortOrd());      hasAny = true; }
        if (entity.getUseYn()        != null) { update.set(m.useYn,        entity.getUseYn());        hasAny = true; }
        if (entity.getMenuRemark()   != null) { update.set(m.menuRemark,   entity.getMenuRemark());   hasAny = true; }
        if (entity.getUpdBy()        != null) { update.set(m.updBy,        entity.getUpdBy());        hasAny = true; }
        if (entity.getUpdDate()      != null) { update.set(m.updDate,      entity.getUpdDate());      hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(m.menuId.eq(entity.getMenuId())).execute();
        return (int) affected;
    }
}
