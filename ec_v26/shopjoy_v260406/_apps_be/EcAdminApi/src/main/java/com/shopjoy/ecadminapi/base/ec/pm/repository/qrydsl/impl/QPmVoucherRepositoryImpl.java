package com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmVoucherDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmVoucher;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmVoucher;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmVoucherRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** PmVoucher QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPmVoucherRepositoryImpl implements QPmVoucherRepository {

    private final JPAQueryFactory queryFactory;
    private static final QPmVoucher v    = QPmVoucher.pmVoucher;
    private static final QSySite    ste  = QSySite.sySite;
    private static final QSyCode    cdVt = new QSyCode("cd_vt");
    private static final QSyCode    cdVs = new QSyCode("cd_vs");

    private JPAQuery<PmVoucherDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(PmVoucherDto.Item.class,
                        v.voucherId, v.siteId, v.voucherNm, v.voucherTypeCd, v.voucherValue,
                        v.minOrderAmt, v.maxDiscntAmt, v.expireMonth,
                        v.voucherStatusCd, v.voucherStatusCdBefore, v.voucherDesc, v.useYn,
                        v.regBy, v.regDate, v.updBy, v.updDate
                ))
                .from(v)
                .leftJoin(ste).on(ste.siteId.eq(v.siteId))
                .leftJoin(cdVt).on(cdVt.codeGrp.eq("VOUCHER_TYPE").and(cdVt.codeValue.eq(v.voucherTypeCd)))
                .leftJoin(cdVs).on(cdVs.codeGrp.eq("VOUCHER_STATUS").and(cdVs.codeValue.eq(v.voucherStatusCd)));
    }

    @Override
    public Optional<PmVoucherDto.Item> selectById(String voucherId) {
        PmVoucherDto.Item dto = baseQuery()
                .where(v.voucherId.eq(voucherId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    @Override
    public List<PmVoucherDto.Item> selectList(PmVoucherDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmVoucherDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) {
            query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        Integer pageNo   = search == null ? null : search.getPageNo();
        Integer pageSize = search == null ? null : search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            query.offset(offset).limit(pageSize);
        }
        return query.fetch();
    }

    @Override
    public PmVoucherDto.PageResponse selectPageList(PmVoucherDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmVoucherDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PmVoucherDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(v.count())
                .from(v)
                .where(where)
                .fetchOne();

        PmVoucherDto.PageResponse res = new PmVoucherDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    private BooleanBuilder buildCondition(PmVoucherDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId()))    w.and(v.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getVoucherId())) w.and(v.voucherId.eq(s.getVoucherId()));
        if (StringUtils.hasText(s.getUseYn()))     w.and(v.useYn.eq(s.getUseYn()));

        if (StringUtils.hasText(s.getSearchValue())) {
            String types = s.getSearchTypes();
            boolean all = !StringUtils.hasText(types);
            String pattern = "%" + s.getSearchValue() + "%";

            BooleanBuilder or = new BooleanBuilder();
            if (all || types.contains("def_voucher_nm")) or.or(v.voucherNm.likeIgnoreCase(pattern));
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
                    w.and(v.regDate.goe(start)).and(v.regDate.lt(endExcl));
                    break;
                case "upd_date":
                    w.and(v.updDate.goe(start)).and(v.updDate.lt(endExcl));
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
    private List<OrderSpecifier<?>> buildOrder(PmVoucherDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, v.regDate));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("voucherId".equals(field)) {
                    orders.add(new OrderSpecifier(order, v.voucherId));
                } else if ("voucherNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, v.voucherNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, v.regDate));
                }
            }
        }
        return orders;
    }

    @Override
    public int updateSelective(PmVoucher entity) {
        if (entity.getVoucherId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(v);
        boolean hasAny = false;

        if (entity.getSiteId()                != null) { update.set(v.siteId,                entity.getSiteId());                hasAny = true; }
        if (entity.getVoucherNm()             != null) { update.set(v.voucherNm,             entity.getVoucherNm());             hasAny = true; }
        if (entity.getVoucherTypeCd()         != null) { update.set(v.voucherTypeCd,         entity.getVoucherTypeCd());         hasAny = true; }
        if (entity.getVoucherValue()          != null) { update.set(v.voucherValue,          entity.getVoucherValue());          hasAny = true; }
        if (entity.getMinOrderAmt()           != null) { update.set(v.minOrderAmt,           entity.getMinOrderAmt());           hasAny = true; }
        if (entity.getMaxDiscntAmt()          != null) { update.set(v.maxDiscntAmt,          entity.getMaxDiscntAmt());          hasAny = true; }
        if (entity.getExpireMonth()           != null) { update.set(v.expireMonth,           entity.getExpireMonth());           hasAny = true; }
        if (entity.getVoucherStatusCd()       != null) { update.set(v.voucherStatusCd,       entity.getVoucherStatusCd());       hasAny = true; }
        if (entity.getVoucherStatusCdBefore() != null) { update.set(v.voucherStatusCdBefore, entity.getVoucherStatusCdBefore()); hasAny = true; }
        if (entity.getVoucherDesc()           != null) { update.set(v.voucherDesc,           entity.getVoucherDesc());           hasAny = true; }
        if (entity.getUseYn()                 != null) { update.set(v.useYn,                 entity.getUseYn());                 hasAny = true; }
        if (entity.getUpdBy()                 != null) { update.set(v.updBy,                 entity.getUpdBy());                 hasAny = true; }
        if (entity.getUpdDate()               != null) { update.set(v.updDate,               entity.getUpdDate());               hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(v.voucherId.eq(entity.getVoucherId())).execute();
        return (int) affected;
    }
}
