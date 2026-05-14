package com.shopjoy.ecadminapi.base.ec.pm.repository.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmCouponDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmCoupon;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmCoupon;
import com.shopjoy.ecadminapi.base.ec.pm.repository.QPmCouponRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** PmCoupon QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPmCouponRepositoryImpl implements QPmCouponRepository {

    private final JPAQueryFactory queryFactory;
    private static final QPmCoupon c   = QPmCoupon.pmCoupon;
    private static final QSyCode  cdCt = new QSyCode("cd_ct");
    private static final QSyCode  cdCs = new QSyCode("cd_cs");
    private static final QSyCode  cdTt = new QSyCode("cd_tt");
    private static final QSyCode  cdMg = new QSyCode("cd_mg");

    @Override
    public Optional<PmCouponDto.Item> selectById(String couponId) {
        PmCouponDto.Item dto = baseQuery()
                .where(c.couponId.eq(couponId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    @Override
    public List<PmCouponDto.Item> selectList(PmCouponDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmCouponDto.Item> query = baseQuery().where(where);
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
    public PmCouponDto.PageResponse selectPageList(PmCouponDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmCouponDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PmCouponDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(c.count())
                .from(c)
                .where(where)
                .fetchOne();

        PmCouponDto.PageResponse res = new PmCouponDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    private JPAQuery<PmCouponDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(PmCouponDto.Item.class,
                        c.couponId, c.siteId, c.couponCd, c.couponNm,
                        c.couponTypeCd, c.discountRate, c.discountAmt,
                        c.minOrderAmt, c.minOrderQty, c.maxDiscountAmt,
                        c.issueLimit, c.issueCnt, c.maxIssuePerMem,
                        c.couponDesc, c.validFrom, c.validTo,
                        c.couponStatusCd, c.couponStatusCdBefore,
                        c.useYn, c.targetTypeCd, c.targetValue, c.memGradeCd,
                        c.selfCdivRate, c.sellerCdivRate, c.sellerCdivRemark,
                        c.dvcPcYn, c.dvcMwebYn, c.dvcMappYn, c.memo,
                        c.regBy, c.regDate, c.updBy, c.updDate,
                        cdCt.codeLabel.as("couponTypeCdNm"),
                        cdCs.codeLabel.as("couponStatusCdNm"),
                        cdTt.codeLabel.as("targetTypeCdNm"),
                        cdMg.codeLabel.as("memGradeCdNm")
                ))
                .from(c)
                .leftJoin(cdCt).on(cdCt.codeGrp.eq("COUPON_TYPE").and(cdCt.codeValue.eq(c.couponTypeCd)))
                .leftJoin(cdCs).on(cdCs.codeGrp.eq("COUPON_STATUS").and(cdCs.codeValue.eq(c.couponStatusCd)))
                .leftJoin(cdTt).on(cdTt.codeGrp.eq("COUPON_TARGET").and(cdTt.codeValue.eq(c.targetTypeCd)))
                .leftJoin(cdMg).on(cdMg.codeGrp.eq("MEMBER_GRADE").and(cdMg.codeValue.eq(c.memGradeCd)));
    }

    private BooleanBuilder buildCondition(PmCouponDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId()))   w.and(c.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getCouponId())) w.and(c.couponId.eq(s.getCouponId()));
        if (StringUtils.hasText(s.getUseYn()))    w.and(c.useYn.eq(s.getUseYn()));

        if (StringUtils.hasText(s.getSearchValue())) {
            String types = s.getSearchTypes();
            boolean all = !StringUtils.hasText(types);
            String pattern = "%" + s.getSearchValue() + "%";

            BooleanBuilder or = new BooleanBuilder();
            if (all || types.contains("def_coupon_id")) or.or(c.couponId.likeIgnoreCase(pattern));
            if (all || types.contains("def_coupon_nm")) or.or(c.couponNm.likeIgnoreCase(pattern));
            if (all || types.contains("def_coupon_cd")) or.or(c.couponCd.likeIgnoreCase(pattern));
            if (or.getValue() != null) w.and(or);
        }

        if (StringUtils.hasText(s.getDateType())
                && StringUtils.hasText(s.getDateStart())
                && StringUtils.hasText(s.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDate startDate = LocalDate.parse(s.getDateStart(), fmt);
            LocalDate endDate   = LocalDate.parse(s.getDateEnd(),   fmt);
            LocalDateTime start   = startDate.atStartOfDay();
            LocalDateTime endExcl = endDate.plusDays(1).atStartOfDay();
            switch (s.getDateType()) {
                case "valid_period":
                    w.and(c.validFrom.goe(startDate)).and(c.validTo.loe(endDate)); break;
                case "reg_date":
                    w.and(c.regDate.goe(start)).and(c.regDate.lt(endExcl)); break;
                case "upd_date":
                    w.and(c.updDate.goe(start)).and(c.updDate.lt(endExcl)); break;
                default: break;
            }
        }
        return w;
    }

    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(PmCouponDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, c.regDate));
            return orders;
        }
        switch (sort) {
            case "id_asc":   orders.add(new OrderSpecifier(Order.ASC,  c.couponId)); break;
            case "id_desc":  orders.add(new OrderSpecifier(Order.DESC, c.couponId)); break;
            case "nm_asc":   orders.add(new OrderSpecifier(Order.ASC,  c.couponNm)); break;
            case "nm_desc":  orders.add(new OrderSpecifier(Order.DESC, c.couponNm)); break;
            case "reg_asc":  orders.add(new OrderSpecifier(Order.ASC,  c.regDate));  break;
            case "reg_desc": orders.add(new OrderSpecifier(Order.DESC, c.regDate));  break;
            default:         orders.add(new OrderSpecifier(Order.DESC, c.regDate));  break;
        }
        return orders;
    }

    @Override
    public int updateSelective(PmCoupon entity) {
        if (entity.getCouponId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(c);
        boolean hasAny = false;

        if (entity.getCouponStatusCd()       != null) { update.set(c.couponStatusCd,       entity.getCouponStatusCd());       hasAny = true; }
        if (entity.getCouponStatusCdBefore() != null) { update.set(c.couponStatusCdBefore, entity.getCouponStatusCdBefore()); hasAny = true; }
        if (entity.getCouponNm()             != null) { update.set(c.couponNm,             entity.getCouponNm());             hasAny = true; }
        if (entity.getUseYn()                != null) { update.set(c.useYn,                entity.getUseYn());                hasAny = true; }
        if (entity.getValidFrom()            != null) { update.set(c.validFrom,            entity.getValidFrom());            hasAny = true; }
        if (entity.getValidTo()              != null) { update.set(c.validTo,              entity.getValidTo());              hasAny = true; }
        if (entity.getIssueCnt()             != null) { update.set(c.issueCnt,             entity.getIssueCnt());             hasAny = true; }
        if (entity.getMemo()                 != null) { update.set(c.memo,                 entity.getMemo());                 hasAny = true; }
        if (entity.getUpdBy()                != null) { update.set(c.updBy,                entity.getUpdBy());                hasAny = true; }
        if (entity.getUpdDate()              != null) { update.set(c.updDate,              entity.getUpdDate());              hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(c.couponId.eq(entity.getCouponId())).execute();
        return (int) affected;
    }
}
