package com.shopjoy.ecadminapi.base.sy.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyBrandDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyBrand;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyBrand;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyBrandRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** SyBrand QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyBrandRepositoryImpl implements QSyBrandRepository {

    private final JPAQueryFactory queryFactory;
    private static final QSyBrand b = QSyBrand.syBrand;
    private static final QSySite ste = QSySite.sySite;

    private JPAQuery<SyBrandDto.Item> buildBaseQuery() {
        return queryFactory
                .select(Projections.bean(SyBrandDto.Item.class,
                        b.brandId, b.siteId, b.brandCode, b.brandNm, b.brandEnNm,
                        b.pathId, b.logoUrl, b.vendorId, b.sortOrd, b.useYn,
                        b.brandRemark,
                        b.regBy, b.regDate, b.updBy, b.updDate,
                        ste.siteNm.as("siteNm")
                ))
                .from(b)
                .leftJoin(ste).on(ste.siteId.eq(b.siteId));
    }

    @Override
    public Optional<SyBrandDto.Item> selectById(String brandId) {
        SyBrandDto.Item dto = buildBaseQuery()
                .where(b.brandId.eq(brandId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    @Override
    public List<SyBrandDto.Item> selectList(SyBrandDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<SyBrandDto.Item> query = buildBaseQuery().where(where);
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

    @Override
    public SyBrandDto.PageResponse selectPageList(SyBrandDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SyBrandDto.Item> query = buildBaseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<SyBrandDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(b.count()).from(b).where(where).fetchOne();

        SyBrandDto.PageResponse res = new SyBrandDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    private BooleanBuilder buildCondition(SyBrandDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId()))   w.and(b.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getBrandId()))  w.and(b.brandId.eq(s.getBrandId()));
        // pathId 는 sy_path 재귀 조회가 필요한 조건이므로 단순 비교만 적용
        if (StringUtils.hasText(s.getPathId()))   w.and(b.pathId.eq(s.getPathId()));
        if (StringUtils.hasText(s.getVendorId())) w.and(b.vendorId.eq(s.getVendorId()));

        if (StringUtils.hasText(s.getSearchValue())) {
            String types = s.getSearchTypes();
            boolean all = !StringUtils.hasText(types);
            String pattern = "%" + s.getSearchValue() + "%";
            BooleanBuilder or = new BooleanBuilder();
            if (all || types.contains("def_name"))   or.or(b.brandNm.likeIgnoreCase(pattern));
            if (all || types.contains("def_enName")) or.or(b.brandEnNm.likeIgnoreCase(pattern));
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
                    w.and(b.regDate.goe(start)).and(b.regDate.lt(endExcl));
                    break;
                case "upd_date":
                    w.and(b.updDate.goe(start)).and(b.updDate.lt(endExcl));
                    break;
                default:
                    break;
            }
        }
        return w;
    }

    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(SyBrandDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, b.regDate));
            return orders;
        }
        switch (sort) {
            case "id_asc":   orders.add(new OrderSpecifier(Order.ASC,  b.brandId)); break;
            case "id_desc":  orders.add(new OrderSpecifier(Order.DESC, b.brandId)); break;
            case "nm_asc":   orders.add(new OrderSpecifier(Order.ASC,  b.brandNm)); break;
            case "nm_desc":  orders.add(new OrderSpecifier(Order.DESC, b.brandNm)); break;
            case "reg_asc":  orders.add(new OrderSpecifier(Order.ASC,  b.regDate)); break;
            case "reg_desc": orders.add(new OrderSpecifier(Order.DESC, b.regDate)); break;
            default:         orders.add(new OrderSpecifier(Order.DESC, b.regDate)); break;
        }
        return orders;
    }

    @Override
    public int updateSelective(SyBrand entity) {
        if (entity.getBrandId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(b);
        boolean hasAny = false;

        if (entity.getSiteId()      != null) { update.set(b.siteId,      entity.getSiteId());      hasAny = true; }
        if (entity.getBrandCode()   != null) { update.set(b.brandCode,   entity.getBrandCode());   hasAny = true; }
        if (entity.getBrandNm()     != null) { update.set(b.brandNm,     entity.getBrandNm());     hasAny = true; }
        if (entity.getBrandEnNm()   != null) { update.set(b.brandEnNm,   entity.getBrandEnNm());   hasAny = true; }
        if (entity.getPathId()      != null) { update.set(b.pathId,      entity.getPathId());      hasAny = true; }
        if (entity.getLogoUrl()     != null) { update.set(b.logoUrl,     entity.getLogoUrl());     hasAny = true; }
        if (entity.getVendorId()    != null) { update.set(b.vendorId,    entity.getVendorId());    hasAny = true; }
        if (entity.getSortOrd()     != null) { update.set(b.sortOrd,     entity.getSortOrd());     hasAny = true; }
        if (entity.getUseYn()       != null) { update.set(b.useYn,       entity.getUseYn());       hasAny = true; }
        if (entity.getBrandRemark() != null) { update.set(b.brandRemark, entity.getBrandRemark()); hasAny = true; }
        if (entity.getUpdBy()       != null) { update.set(b.updBy,       entity.getUpdBy());       hasAny = true; }
        if (entity.getUpdDate()     != null) { update.set(b.updDate,     entity.getUpdDate());     hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(b.brandId.eq(entity.getBrandId())).execute();
        return (int) affected;
    }
}
