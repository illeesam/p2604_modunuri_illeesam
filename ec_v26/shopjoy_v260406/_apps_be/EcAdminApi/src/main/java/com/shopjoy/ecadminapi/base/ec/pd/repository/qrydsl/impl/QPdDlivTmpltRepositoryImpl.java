package com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdDlivTmpltDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdDlivTmplt;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdDlivTmplt;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdDlivTmpltRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyVendor;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** PdDlivTmplt QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPdDlivTmpltRepositoryImpl implements QPdDlivTmpltRepository {

    private final JPAQueryFactory queryFactory;
    private static final QPdDlivTmplt t      = QPdDlivTmplt.pdDlivTmplt;
    private static final QSySite      ste    = QSySite.sySite;
    private static final QSyVendor    vnd    = QSyVendor.syVendor;
    private static final QSyCode      cdDm   = new QSyCode("cd_dm");
    private static final QSyCode      cdDpt  = new QSyCode("cd_dpt");

    @Override
    public Optional<PdDlivTmpltDto.Item> selectById(String dlivTmpltId) {
        PdDlivTmpltDto.Item dto = baseQuery()
                .where(t.dlivTmpltId.eq(dlivTmpltId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    @Override
    public List<PdDlivTmpltDto.Item> selectList(PdDlivTmpltDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdDlivTmpltDto.Item> query = baseQuery().where(where);
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
    public PdDlivTmpltDto.PageResponse selectPageList(PdDlivTmpltDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdDlivTmpltDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PdDlivTmpltDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(t.count()).from(t).where(where).fetchOne();

        PdDlivTmpltDto.PageResponse res = new PdDlivTmpltDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    private JPAQuery<PdDlivTmpltDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(PdDlivTmpltDto.Item.class,
                        t.dlivTmpltId, t.siteId, t.vendorId, t.dlivTmpltNm,
                        t.dlivMethodCd, t.dlivPayTypeCd, t.dlivCourierCd,
                        t.dlivCost, t.freeDlivMinAmt, t.islandExtraCost,
                        t.returnCost, t.exchangeCost, t.returnCourierCd,
                        t.returnAddrZip, t.returnAddr, t.returnAddrDetail, t.returnTelNo,
                        t.baseDlivYn, t.useYn,
                        t.regBy, t.regDate, t.updBy, t.updDate
                ))
                .from(t)
                .leftJoin(ste).on(ste.siteId.eq(t.siteId))
                .leftJoin(vnd).on(vnd.vendorId.eq(t.vendorId))
                .leftJoin(cdDm).on(cdDm.codeGrp.eq("DLIV_METHOD").and(cdDm.codeValue.eq(t.dlivMethodCd)))
                .leftJoin(cdDpt).on(cdDpt.codeGrp.eq("DLIV_PAY_TYPE").and(cdDpt.codeValue.eq(t.dlivPayTypeCd)));
    }

    private BooleanBuilder buildCondition(PdDlivTmpltDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId()))      w.and(t.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getDlivTmpltId())) w.and(t.dlivTmpltId.eq(s.getDlivTmpltId()));

        if (StringUtils.hasText(s.getSearchValue())) {
            String types = s.getSearchTypes();
            boolean all = !StringUtils.hasText(types);
            String pattern = "%" + s.getSearchValue() + "%";
            BooleanBuilder or = new BooleanBuilder();
            if (all || types.contains("def_dliv_tmplt_nm")) or.or(t.dlivTmpltNm.likeIgnoreCase(pattern));
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
                    w.and(t.regDate.goe(start)).and(t.regDate.lt(endExcl));
                    break;
                case "upd_date":
                    w.and(t.updDate.goe(start)).and(t.updDate.lt(endExcl));
                    break;
                default:
                    break;
            }
        }
        return w;
    }

    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(PdDlivTmpltDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, t.regDate));
            return orders;
        }
        switch (sort) {
            case "id_asc":   orders.add(new OrderSpecifier(Order.ASC,  t.dlivTmpltId)); break;
            case "id_desc":  orders.add(new OrderSpecifier(Order.DESC, t.dlivTmpltId)); break;
            case "nm_asc":   orders.add(new OrderSpecifier(Order.ASC,  t.dlivTmpltNm)); break;
            case "nm_desc":  orders.add(new OrderSpecifier(Order.DESC, t.dlivTmpltNm)); break;
            case "reg_asc":  orders.add(new OrderSpecifier(Order.ASC,  t.regDate));     break;
            case "reg_desc": orders.add(new OrderSpecifier(Order.DESC, t.regDate));     break;
            default:         orders.add(new OrderSpecifier(Order.DESC, t.regDate));     break;
        }
        return orders;
    }

    @Override
    public int updateSelective(PdDlivTmplt entity) {
        if (entity.getDlivTmpltId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(t);
        boolean hasAny = false;

        if (entity.getSiteId()           != null) { update.set(t.siteId,           entity.getSiteId());           hasAny = true; }
        if (entity.getVendorId()         != null) { update.set(t.vendorId,         entity.getVendorId());         hasAny = true; }
        if (entity.getDlivTmpltNm()      != null) { update.set(t.dlivTmpltNm,      entity.getDlivTmpltNm());      hasAny = true; }
        if (entity.getDlivMethodCd()     != null) { update.set(t.dlivMethodCd,     entity.getDlivMethodCd());     hasAny = true; }
        if (entity.getDlivPayTypeCd()    != null) { update.set(t.dlivPayTypeCd,    entity.getDlivPayTypeCd());    hasAny = true; }
        if (entity.getDlivCourierCd()    != null) { update.set(t.dlivCourierCd,    entity.getDlivCourierCd());    hasAny = true; }
        if (entity.getDlivCost()         != null) { update.set(t.dlivCost,         entity.getDlivCost());         hasAny = true; }
        if (entity.getFreeDlivMinAmt()   != null) { update.set(t.freeDlivMinAmt,   entity.getFreeDlivMinAmt());   hasAny = true; }
        if (entity.getIslandExtraCost()  != null) { update.set(t.islandExtraCost,  entity.getIslandExtraCost());  hasAny = true; }
        if (entity.getReturnCost()       != null) { update.set(t.returnCost,       entity.getReturnCost());       hasAny = true; }
        if (entity.getExchangeCost()     != null) { update.set(t.exchangeCost,     entity.getExchangeCost());     hasAny = true; }
        if (entity.getReturnCourierCd()  != null) { update.set(t.returnCourierCd,  entity.getReturnCourierCd());  hasAny = true; }
        if (entity.getReturnAddrZip()    != null) { update.set(t.returnAddrZip,    entity.getReturnAddrZip());    hasAny = true; }
        if (entity.getReturnAddr()       != null) { update.set(t.returnAddr,       entity.getReturnAddr());       hasAny = true; }
        if (entity.getReturnAddrDetail() != null) { update.set(t.returnAddrDetail, entity.getReturnAddrDetail()); hasAny = true; }
        if (entity.getReturnTelNo()      != null) { update.set(t.returnTelNo,      entity.getReturnTelNo());      hasAny = true; }
        if (entity.getBaseDlivYn()       != null) { update.set(t.baseDlivYn,       entity.getBaseDlivYn());       hasAny = true; }
        if (entity.getUseYn()            != null) { update.set(t.useYn,            entity.getUseYn());            hasAny = true; }
        if (entity.getUpdBy()            != null) { update.set(t.updBy,            entity.getUpdBy());            hasAny = true; }
        if (entity.getUpdDate()          != null) { update.set(t.updDate,          entity.getUpdDate());          hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(t.dlivTmpltId.eq(entity.getDlivTmpltId())).execute();
        return (int) affected;
    }
}
