package com.shopjoy.ecadminapi.base.sy.repository.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyVendorBrandDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyBrand;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyVendor;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyVendorBrand;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyVendorBrand;
import com.shopjoy.ecadminapi.base.sy.repository.QSyVendorBrandRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** SyVendorBrand QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyVendorBrandRepositoryImpl implements QSyVendorBrandRepository {

    private final JPAQueryFactory queryFactory;
    private static final QSyVendorBrand b = QSyVendorBrand.syVendorBrand;
    private static final QSySite ste = QSySite.sySite;
    private static final QSyVendor vnd = QSyVendor.syVendor;
    private static final QSyBrand brd = QSyBrand.syBrand;
    private static final QSyCode cdVbc = new QSyCode("cd_vbc");

    private JPAQuery<SyVendorBrandDto.Item> buildBaseQuery() {
        return queryFactory
                .select(Projections.bean(SyVendorBrandDto.Item.class,
                        b.vendorBrandId, b.siteId, b.vendorId, b.brandId, b.isMain,
                        b.contractCd, b.startDate, b.endDate, b.commissionRate,
                        b.sortOrd, b.useYn, b.vendorBrandRemark,
                        b.regBy, b.regDate, b.updBy, b.updDate,
                        vnd.vendorNm.as("vendorNm"),
                        brd.brandNm.as("brandNm")
                ))
                .from(b)
                .leftJoin(ste).on(ste.siteId.eq(b.siteId))
                .leftJoin(vnd).on(vnd.vendorId.eq(b.vendorId))
                .leftJoin(brd).on(brd.brandId.eq(b.brandId))
                .leftJoin(cdVbc).on(cdVbc.codeGrp.eq("VENDOR_BRAND_CONTRACT").and(cdVbc.codeValue.eq(b.contractCd)));
    }

    @Override
    public Optional<SyVendorBrandDto.Item> selectById(String vendorBrandId) {
        SyVendorBrandDto.Item dto = buildBaseQuery()
                .where(b.vendorBrandId.eq(vendorBrandId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    @Override
    public List<SyVendorBrandDto.Item> selectList(SyVendorBrandDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<SyVendorBrandDto.Item> query = buildBaseQuery().where(where);
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
    public SyVendorBrandDto.PageResponse selectPageList(SyVendorBrandDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SyVendorBrandDto.Item> query = buildBaseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<SyVendorBrandDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(b.count()).from(b).where(where).fetchOne();

        SyVendorBrandDto.PageResponse res = new SyVendorBrandDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    private BooleanBuilder buildCondition(SyVendorBrandDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId()))        w.and(b.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getVendorBrandId())) w.and(b.vendorBrandId.eq(s.getVendorBrandId()));
        if (StringUtils.hasText(s.getBrandId()))       w.and(b.brandId.eq(s.getBrandId()));
        if (StringUtils.hasText(s.getVendorId()))      w.and(b.vendorId.eq(s.getVendorId()));

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
    private List<OrderSpecifier<?>> buildOrder(SyVendorBrandDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, b.regDate));
            return orders;
        }
        switch (sort) {
            case "id_asc":   orders.add(new OrderSpecifier(Order.ASC,  b.vendorBrandId)); break;
            case "id_desc":  orders.add(new OrderSpecifier(Order.DESC, b.vendorBrandId)); break;
            case "reg_asc":  orders.add(new OrderSpecifier(Order.ASC,  b.regDate));       break;
            case "reg_desc": orders.add(new OrderSpecifier(Order.DESC, b.regDate));       break;
            default:         orders.add(new OrderSpecifier(Order.DESC, b.regDate));       break;
        }
        return orders;
    }

    @Override
    public int updateSelective(SyVendorBrand entity) {
        if (entity.getVendorBrandId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(b);
        boolean hasAny = false;

        if (entity.getSiteId()            != null) { update.set(b.siteId,            entity.getSiteId());            hasAny = true; }
        if (entity.getVendorId()          != null) { update.set(b.vendorId,          entity.getVendorId());          hasAny = true; }
        if (entity.getBrandId()           != null) { update.set(b.brandId,           entity.getBrandId());           hasAny = true; }
        if (entity.getIsMain()            != null) { update.set(b.isMain,            entity.getIsMain());            hasAny = true; }
        if (entity.getContractCd()        != null) { update.set(b.contractCd,        entity.getContractCd());        hasAny = true; }
        if (entity.getStartDate()         != null) { update.set(b.startDate,         entity.getStartDate());         hasAny = true; }
        if (entity.getEndDate()           != null) { update.set(b.endDate,           entity.getEndDate());           hasAny = true; }
        if (entity.getCommissionRate()    != null) { update.set(b.commissionRate,    entity.getCommissionRate());    hasAny = true; }
        if (entity.getSortOrd()           != null) { update.set(b.sortOrd,           entity.getSortOrd());           hasAny = true; }
        if (entity.getUseYn()             != null) { update.set(b.useYn,             entity.getUseYn());             hasAny = true; }
        if (entity.getVendorBrandRemark() != null) { update.set(b.vendorBrandRemark, entity.getVendorBrandRemark()); hasAny = true; }
        if (entity.getUpdBy()             != null) { update.set(b.updBy,             entity.getUpdBy());             hasAny = true; }
        if (entity.getUpdDate()           != null) { update.set(b.updDate,           entity.getUpdDate());           hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(b.vendorBrandId.eq(entity.getVendorBrandId())).execute();
        return (int) affected;
    }
}
